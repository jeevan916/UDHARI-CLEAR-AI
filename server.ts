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

// --- SECURE CONFIG LOADING (REFINED) ---
// Fix: Use path.resolve('.env') to avoid 'cwd' property access on process which was causing type errors.
const envPath = path.resolve('.env');
if (fs.existsSync(envPath)) {
  console.log(`[INIT] Loading environment from: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn(`[INIT] .env not found at ${envPath}. Using existing environment variables.`);
  dotenv.config(); // Fallback to default search
}

const app = express();
app.use(cors());
app.use(express.json());

// Initialize AI with strict requirement for process.env.API_KEY
// Fix: Always use named parameter for apiKey and strictly from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Database Configuration Factory
const getDbConfig = (host: string) => ({
  host: host,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10, // Optimized for Professional Hosting
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 20000 // 20 seconds timeout for slow handshakes
});

let pool: mysql.Pool;

const SYSTEM_IDENTITY = {
  node_id: process.env.NODE_ID || "72.61.175.20",
  environment: process.env.NODE_ENV || "production",
  version: "6.4.0-HOSTINGER-SYNC",
  status: "BOOTING",
  db_health: "DISCONNECTED",
  last_error: null as string | null,
  active_user: process.env.DB_USER ? `${process.env.DB_USER.substring(0, 5)}***` : "MISSING"
};

const bootSystem = async () => {
  console.log(`[BOOT] System Identity: ${SYSTEM_IDENTITY.node_id} | Env: ${SYSTEM_IDENTITY.environment}`);
  
  if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
    console.error("[BOOT] CRITICAL: Database credentials missing from environment.");
    SYSTEM_IDENTITY.status = "CRITICAL_FAILURE";
    SYSTEM_IDENTITY.last_error = "Missing DB_USER or DB_PASSWORD in .env";
    return;
  }

  // Attempt connection to the hosts defined in your .env
  const hosts = [process.env.DB_HOST || '127.0.0.1', 'localhost'];
  let connected = false;

  for (const host of hosts) {
    if (connected) break;
    try {
      console.log(`[BOOT] Attempting DB link: ${process.env.DB_USER}@${host}:${process.env.DB_PORT || 3306}...`);
      
      const tempPool = mysql.createPool(getDbConfig(host));
      
      // Test the connection immediately
      const [rows]: any = await tempPool.execute('SELECT 1 as connection_test');
      
      if (rows && rows[0].connection_test === 1) {
        pool = tempPool;
        connected = true;
        SYSTEM_IDENTITY.status = "OPERATIONAL";
        SYSTEM_IDENTITY.db_health = "CONNECTED";
        SYSTEM_IDENTITY.last_error = null;
        console.log(`[BOOT] DATABASE_LINK established successfully on ${host}.`);
        
        // Ensure tables exist
        await setupSchema();
      }
    } catch (err: any) {
      console.error(`[BOOT] Handshake failed on ${host}:`, err.message);
      SYSTEM_IDENTITY.last_error = `Host ${host}: ${err.message}`;
    }
  }

  if (!connected) {
    SYSTEM_IDENTITY.status = "DEGRADED";
    SYSTEM_IDENTITY.db_health = "FAILED";
    console.error("[BOOT] FATAL: All database connection attempts failed. Check credentials and Firewall.");
  }
};

const setupSchema = async () => {
  try {
    console.log("[SCHEMA] Validating table structures...");
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY, 
        name VARCHAR(255) NOT NULL, 
        phone VARCHAR(20) NOT NULL UNIQUE,
        unique_payment_code VARCHAR(20) UNIQUE NOT NULL, 
        current_balance DECIMAL(15, 2) DEFAULT 0.00,
        current_gold_balance DECIMAL(15, 3) DEFAULT 0.000, 
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        customer_id VARCHAR(50) NOT NULL,
        type ENUM('credit', 'debit') NOT NULL,
        unit ENUM('money', 'gold') NOT NULL DEFAULT 'money',
        amount DECIMAL(15, 3) NOT NULL,
        method VARCHAR(50) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        balance_after DECIMAL(15, 3),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_cust (customer_id)
      )
    `);
    console.log("[SCHEMA] Entity and Ledger tables verified.");
  } catch (err: any) {
    console.error("[SCHEMA] Setup failed:", err.message);
    SYSTEM_IDENTITY.last_error = `Schema Error: ${err.message}`;
  }
};

// Start the boot sequence
bootSystem();

// --- API ENDPOINTS ---

app.get('/api/system/health', (req, res) => res.json(SYSTEM_IDENTITY));

app.get('/api/customers', async (req: Request, res: Response) => {
  if (SYSTEM_IDENTITY.db_health !== "CONNECTED") {
    return res.status(503).json({ error: "DATABASE_OFFLINE", details: SYSTEM_IDENTITY.last_error });
  }
  try {
    const [rows]: any = await pool.execute('SELECT * FROM customers ORDER BY name ASC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: "QUERY_EXECUTION_FAILED", details: err.message });
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
    res.status(500).json({ error: "LEDGER_PAGINATION_ERROR", details: err.message });
  }
});

app.post('/api/kernel/reason', async (req: Request, res: Response) => {
  const { customerData } = req.body;
  try {
    // Fix: Use generateContent with gemini-3-pro-preview for complex reasoning task.
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `AUDIT ENTITY: ${JSON.stringify(customerData)}. Output JSON risk profile with risk_score (0-100), risk_level (LOW, MEDIUM, HIGH), analysis, and action_plan.`,
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
    // Fix: Access response text via .text property as per guidelines.
    res.json(JSON.parse(response.text || '{}'));
  } catch (err) {
    res.status(500).json({ error: "AI_NODE_OFFLINE" });
  }
});

// Static Hosting for Built Frontend
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req: Request, res: Response) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[CORE] Scaled Recovery Engine Active on Port ${PORT}`));