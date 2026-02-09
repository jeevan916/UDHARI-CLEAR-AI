
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

// --- SECURE CONFIG LOADING ---
// User specified path: public_html/.builds/config/.env
// We try the specific path, falling back to standard locations
const envPaths = [
  // Fixed: Replaced process.cwd() with path.resolve('.') to resolve the error "Property 'cwd' does not exist on type 'Process'"
  path.resolve('.', '.builds/config/.env'),
  // Fixed: Replaced process.cwd() with path.resolve('.') to resolve the error "Property 'cwd' does not exist on type 'Process'"
  path.resolve('.', '.env'),
  path.resolve(__dirname, '../.builds/config/.env')
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`[SYSTEM] Found configuration at: ${envPath}`);
    dotenv.config({ path: envPath });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('[SYSTEM] No .env file found in expected paths. Falling back to process environment.');
  dotenv.config(); 
}

const app = express();
app.use(cors());
app.use(express.json());

// Initialize AI with the key from our newly loaded environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Attempt 'localhost' (socket) then '127.0.0.1' (TCP) for maximum VPS compatibility
const getDbConfig = (host: string) => ({
  host: host,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

let pool: mysql.Pool;

const SYSTEM_IDENTITY = {
  node_ip: "139.59.10.70",
  environment: "PRODUCTION_CORE",
  version: "6.3.0-RESILIENT",
  status: "INITIALIZING",
  db_health: "DISCONNECTED",
  last_error: null as string | null,
  config_path_attempted: envPaths[0]
};

// --- BOOT SEQUENCE ---
const bootSystem = async () => {
  if (!process.env.DB_USER) {
    console.error("[FATAL] DB_USER not found in environment. Logic aborted.");
    SYSTEM_IDENTITY.last_error = "Missing DB_USER in environment";
    SYSTEM_IDENTITY.status = "CRITICAL_FAILURE";
    return;
  }

  const hosts = [process.env.DB_HOST || '127.0.0.1', 'localhost', '127.0.0.1'];
  let connected = false;

  for (const host of hosts) {
    if (connected) break;
    try {
      console.log(`[SYSTEM] Handshaking with DB node at ${host}...`);
      const tempPool = mysql.createPool(getDbConfig(host));
      const conn = await tempPool.getConnection();
      
      pool = tempPool;
      console.log(`[SYSTEM] DATABASE_LINK: Authorized and Established on ${host}.`);
      
      // Verification of primary entity schema
      await conn.execute(`CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) NOT NULL UNIQUE,
        unique_payment_code VARCHAR(20) UNIQUE NOT NULL, current_balance DECIMAL(15, 2) DEFAULT 0.00,
        current_gold_balance DECIMAL(15, 3) DEFAULT 0.000, is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);

      SYSTEM_IDENTITY.status = "OPERATIONAL";
      SYSTEM_IDENTITY.db_health = "CONNECTED";
      SYSTEM_IDENTITY.last_error = null;
      conn.release();
      connected = true;
    } catch (err: any) {
      console.error(`[DB_ERROR] Failed on ${host}: ${err.code || err.message}`);
      SYSTEM_IDENTITY.last_error = `${host}: ${err.code || err.message}`;
    }
  }

  if (!connected) {
    SYSTEM_IDENTITY.status = "DEGRADED";
    SYSTEM_IDENTITY.db_health = "FAILED";
    console.error("[FATAL] All DB handshake attempts failed. Verify credentials in public_html/.builds/config/.env");
  }
};

bootSystem();

// --- API ROUTES ---

app.get('/api/system/health', (req, res) => res.json(SYSTEM_IDENTITY));

app.get('/api/customers', async (req: Request, res: Response) => {
  if (SYSTEM_IDENTITY.db_health !== "CONNECTED") {
    return res.status(503).json({ error: "DB_OFFLINE", details: SYSTEM_IDENTITY.last_error });
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
      contents: `AUDIT ENTITY: ${JSON.stringify(customerData)}. Output JSON risk profile with risk_score, risk_level, analysis, and action_plan.`,
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
app.listen(PORT, () => console.log(`[CORE] Scaled Platform Active on 139.59.10.70:${PORT}`));
