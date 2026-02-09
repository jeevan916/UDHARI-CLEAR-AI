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

// --- SECURE CONFIG LOADING & DIAGNOSTICS ---
const SYSTEM_IDENTITY = {
  node_id: process.env.NODE_ID || "72.61.175.20",
  environment: process.env.NODE_ENV || "production",
  version: "6.7.0-TRACE-ACTIVE",
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

const envPath = path.resolve('.env');
if (fs.existsSync(envPath)) {
  logDebug(`[ENV] Loading local file: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  logDebug(`[ENV] No .env file at ${envPath}. Using system-level process variables.`);
  dotenv.config(); 
}

// Masked check of environment variables
const keysToVerify = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'API_KEY', 'PORT', 'NODE_ENV'];
keysToVerify.forEach(k => {
  const val = process.env[k];
  if (!val) {
    SYSTEM_IDENTITY.env_check[k] = "MISSING";
    logDebug(`[WARN] Config Key ${k} is NOT SET.`);
  } else {
    SYSTEM_IDENTITY.env_check[k] = `PRESENT (${val.substring(0, 2)}***${val.substring(val.length - 1)})`;
  }
});

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const getDbConfig = (host: string) => ({
  host: host,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 20000
});

let pool: mysql.Pool;

const bootSystem = async () => {
  logDebug("Initializing Recovery Engine...");
  
  if (!process.env.DB_USER || !process.env.DB_HOST) {
    logDebug("CRITICAL: Database configuration is incomplete. Check .env variables.");
    SYSTEM_IDENTITY.status = "HALTED";
    return;
  }

  const hosts = [process.env.DB_HOST, '127.0.0.1', 'localhost'];
  let connected = false;

  for (const host of hosts) {
    if (connected) break;
    try {
      logDebug(`Testing Route: ${host}...`);
      const tempPool = mysql.createPool(getDbConfig(host));
      
      // Force a connection attempt to trigger errors immediately
      const conn = await tempPool.getConnection();
      logDebug(`HANDSHAKE SUCCESS: Node linked on host ${host}`);
      
      pool = tempPool;
      SYSTEM_IDENTITY.db_health = "CONNECTED";
      SYSTEM_IDENTITY.status = "OPERATIONAL";
      conn.release();
      connected = true;

      await introspectVault();
    } catch (err: any) {
      const errorDetail = {
        code: err.code || 'NO_CODE',
        errno: err.errno,
        sqlState: err.sqlState,
        message: err.message,
        host: host
      };
      logDebug(`HANDSHAKE FAILED [${host}]: ${err.code} - ${err.message}`);
      SYSTEM_IDENTITY.last_error = errorDetail;
    }
  }

  if (!connected) {
    SYSTEM_IDENTITY.status = "DEGRADED";
    SYSTEM_IDENTITY.db_health = "FAILED";
    logDebug("FATAL: All database connection routes exhausted.");
  }
};

const introspectVault = async () => {
  try {
    logDebug("Querying Memory Vault (SQL Schema)...");
    const [tables]: any = await pool.execute('SHOW TABLES');
    const tableList = tables.map((t: any) => Object.values(t)[0]);
    logDebug(`Available Tables: ${tableList.join(', ')}`);
    
    if (tableList.includes('customers')) {
      const [columns]: any = await pool.execute('DESCRIBE customers');
      SYSTEM_IDENTITY.database_structure = columns;
      logDebug("Table 'customers' successfully mapped to Memory Vault.");
    } else {
      logDebug("WARNING: Table 'customers' not found. System is in EMPTY_VAULT state.");
    }
  } catch (err: any) {
    logDebug(`VAULT_ERROR: ${err.message}`);
    SYSTEM_IDENTITY.database_structure = [{ error: err.message }];
  }
};

bootSystem();

app.get('/api/system/health', (req, res) => res.json(SYSTEM_IDENTITY));

app.get('/api/customers', async (req: Request, res: Response) => {
  if (SYSTEM_IDENTITY.db_health !== "CONNECTED") {
    return res.status(503).json({ 
      error: "DATABASE_OFFLINE", 
      details: SYSTEM_IDENTITY.last_error,
      handshake_logs: SYSTEM_IDENTITY.debug_logs 
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
      contents: `Audit this entity data: ${JSON.stringify(customerData)}. Output JSON risk profile.`,
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
app.listen(PORT, () => console.log(`[CORE] Trace Active on Port ${PORT}`));