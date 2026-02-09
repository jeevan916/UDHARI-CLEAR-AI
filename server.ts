import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- RAW LOGGING CORE ---
const SYSTEM_IDENTITY = {
  node_id: process.env.NODE_ID || "72.61.175.20",
  environment: process.env.NODE_ENV || "production",
  version: "6.6.0-VAULT-CORE",
  status: "BOOTING",
  db_health: "DISCONNECTED",
  last_error: null as any,
  debug_logs: [] as string[],
  database_structure: [] as any[],
  env_check: {} as Record<string, string>
};

const logDebug = (msg: string) => {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  const formatted = `[${timestamp}] ${msg}`;
  console.log(formatted);
  SYSTEM_IDENTITY.debug_logs.push(formatted);
  if (SYSTEM_IDENTITY.debug_logs.length > 200) SYSTEM_IDENTITY.debug_logs.shift();
};

// --- SECURE CONFIG LOADING ---
const envPath = path.resolve('.env');
if (fs.existsSync(envPath)) {
  logDebug(`Found .env at: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  logDebug(`WARNING: No .env file found at ${envPath}. Checking system process.`);
  dotenv.config(); 
}

// Verify ENV presence (Masked)
const keysToVerify = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'API_KEY'];
keysToVerify.forEach(k => {
  SYSTEM_IDENTITY.env_check[k] = process.env[k] ? 'PRESENT (****)' : 'MISSING';
});

const app = express();
app.use(cors());
app.use(express.json());

// Initialize AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const getDbConfig = (host: string) => ({
  host: host,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 15000
});

let pool: mysql.Pool;

const bootSystem = async () => {
  logDebug("Initializing Recovery Engine...");
  logDebug(`Target Node: ${SYSTEM_IDENTITY.node_id}`);
  
  if (!process.env.DB_USER) {
    logDebug("CRITICAL ERROR: DB_USER is undefined. Environment variables failed to load.");
    SYSTEM_IDENTITY.status = "CRITICAL_FAILURE";
    return;
  }

  const hosts = [process.env.DB_HOST || '127.0.0.1', 'localhost'];
  let connected = false;

  for (const host of hosts) {
    if (connected) break;
    try {
      logDebug(`Attempting Handshake with ${host}...`);
      const tempPool = mysql.createPool(getDbConfig(host));
      
      const conn = await tempPool.getConnection();
      logDebug(`SUCCESS: Connection established on ${host}`);
      
      pool = tempPool;
      SYSTEM_IDENTITY.db_health = "CONNECTED";
      SYSTEM_IDENTITY.status = "OPERATIONAL";
      conn.release();
      connected = true;

      await introspectDatabase();
    } catch (err: any) {
      const errorDetail = {
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        message: err.message
      };
      const logMsg = `HANDSHAKE_FAILED [${host}]: ${err.code} - ${err.message}`;
      logDebug(logMsg);
      SYSTEM_IDENTITY.last_error = errorDetail;
    }
  }

  if (!connected) {
    SYSTEM_IDENTITY.status = "DEGRADED";
    SYSTEM_IDENTITY.db_health = "FAILED";
    logDebug("FATAL: All database connection routes exhausted. Verify Hostinger Firewall and DB Privileges.");
  }
};

const introspectDatabase = async () => {
  try {
    logDebug("Starting Memory Vault introspection...");
    const [tables]: any = await pool.execute('SHOW TABLES');
    const tableList = tables.map((t: any) => Object.values(t)[0]);
    logDebug(`Detected Cluster Assets: ${tableList.join(', ')}`);
    
    if (tableList.includes('customers')) {
      const [columns]: any = await pool.execute('DESCRIBE customers');
      SYSTEM_IDENTITY.database_structure = columns;
      logDebug("Memory Vault: 'customers' schema mapped successfully.");
    } else {
      logDebug("Vault Empty: Attempting auto-provisioning of Entity tables...");
      await pool.execute(`CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) NOT NULL UNIQUE,
        unique_payment_code VARCHAR(20) UNIQUE NOT NULL, current_balance DECIMAL(15, 2) DEFAULT 0.00,
        current_gold_balance DECIMAL(15, 3) DEFAULT 0.000, is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
      logDebug("Asset provisioning complete.");
    }
  } catch (err: any) {
    logDebug(`INTROSPECTION_ERROR: ${err.message}`);
  }
};

bootSystem();

// --- API ENDPOINTS ---

app.get('/api/system/health', (req, res) => {
  // Always return 200 for health check so we can see the logs even if DB is down
  res.json(SYSTEM_IDENTITY);
});

app.get('/api/customers', async (req: Request, res: Response) => {
  if (SYSTEM_IDENTITY.db_health !== "CONNECTED") {
    return res.status(503).json({ 
      error: "DATABASE_OFFLINE", 
      details: SYSTEM_IDENTITY.last_error,
      logs: SYSTEM_IDENTITY.debug_logs 
    });
  }
  try {
    const [rows]: any = await pool.execute('SELECT * FROM customers ORDER BY name ASC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: "QUERY_FAILED", details: err.message });
  }
});

app.get('/api/ledger/global', async (req: Request, res: Response) => {
  if (SYSTEM_IDENTITY.db_health !== "CONNECTED") return res.status(503).json({ error: "DB_OFFLINE" });
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const [rows]: any = await pool.execute(
      `SELECT t.*, c.name as customerName FROM transactions t 
       JOIN customers c ON t.customer_id = c.id 
       ORDER BY t.date DESC LIMIT ? OFFSET ?`, 
      [limit, offset]
    );
    const [count]: any = await pool.execute('SELECT COUNT(*) as total FROM transactions');
    res.json({
      data: rows,
      meta: { total: count[0].total, page, limit, totalPages: Math.ceil(count[0].total / limit) }
    });
  } catch (err: any) {
    res.status(500).json({ error: "PAGINATION_ERROR", details: err.message });
  }
});

app.post('/api/kernel/reason', async (req: Request, res: Response) => {
  const { customerData } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `AUDIT ENTITY: ${JSON.stringify(customerData)}. Output JSON risk profile with risk_score, risk_level, analysis, action_plan.`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            risk_score: { type: Type.NUMBER },
            risk_level: { type: Type.STRING },
            analysis: { type: Type.STRING },
            action_plan: { type: Type.STRING }
          },
          required: ["risk_score", "risk_level", "analysis", "action_plan"]
        }
      }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (err) {
    res.status(500).json({ error: "AI_OFFLINE" });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req: Request, res: Response) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[CORE] Vault Engine Active on Port ${PORT}`));