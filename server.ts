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

// --- 1. GLOBAL SYSTEM IDENTITY & LOG CAPTURE ---
const SYSTEM_IDENTITY = {
  node_id: "HOSTINGER_CORE_V8.9", 
  host_ip: "INTERNAL_NODE", 
  working_dir: (process as any).cwd(),
  script_dir: __dirname,
  env_path_found: "NOT_LOADED",
  env_search_trace: [] as string[],
  node_version: (process as any).version,
  environment: process.env.NODE_ENV || "production",
  version: "8.9.0-HOSTINGER-DEPLOY-PRO",
  status: "BOOTING",
  db_health: "DISCONNECTED",
  active_db_host: "INIT...",
  last_error: null as any,
  debug_logs: [] as string[],
  database_structure: [] as any[],
  env_check: {} as Record<string, string>
};

// --- 2. INTERCEPT STDOUT/STDERR ---
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

const pushLog = (type: 'INFO' | 'ERR', ...args: any[]) => {
  try {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    const formatted = `[${timestamp}] [${type}] ${msg}`;
    SYSTEM_IDENTITY.debug_logs.unshift(formatted); 
    if (SYSTEM_IDENTITY.debug_logs.length > 500) SYSTEM_IDENTITY.debug_logs.pop(); 
  } catch (e) { }
};

console.log = (...args) => {
  pushLog('INFO', ...args);
  originalConsoleLog(...args);
};

console.error = (...args) => {
  pushLog('ERR', ...args);
  originalConsoleError(...args);
};

// --- 3. AGGRESSIVE CONFIGURATION LOADER ---
const loadConfiguration = () => {
  const cwd = (process as any).cwd();
  
  // We check multiple locations across 3 parent levels
  const potentialPaths = [
    path.resolve(cwd, '.env'),
    path.resolve(cwd, '..', '.env'),
    path.resolve(cwd, '..', '..', '.env'),
    path.resolve(__dirname, '.env'),
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '..', '..', '.env'),
  ];

  let loaded = false;
  for (const p of potentialPaths) {
    if (fs.existsSync(p)) {
      console.log(`[SYSTEM] FOUND CONFIG: ${p}`);
      dotenv.config({ path: p });
      SYSTEM_IDENTITY.env_path_found = p;
      SYSTEM_IDENTITY.env_search_trace.push(`MATCH: ${p}`);
      loaded = true;
      break;
    } else {
      SYSTEM_IDENTITY.env_search_trace.push(`MISS: ${p}`);
    }
  }

  if (!loaded) {
    console.error(`[CRITICAL] No .env file found. Handshake aborted.`);
  }

  SYSTEM_IDENTITY.env_check = {
    DB_HOST: process.env.DB_HOST ? 'PRESENT' : 'MISSING',
    DB_USER: process.env.DB_USER ? 'PRESENT' : 'MISSING',
    DB_NAME: process.env.DB_NAME ? 'PRESENT' : 'MISSING',
    API_KEY: process.env.API_KEY ? 'PRESENT' : 'MISSING'
  };
};
loadConfiguration();

const app = express();
app.use(cors() as any);
app.use(express.json() as any);

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

let pool: mysql.Pool;

// --- 4. SECURE DATABASE HANDSHAKE WITH TCP FALLBACK ---
const connectDatabase = async () => {
  if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
    SYSTEM_IDENTITY.db_health = "CONFIG_ERROR";
    SYSTEM_IDENTITY.last_error = { message: "Environment credentials missing from .env." };
    return;
  }

  const primaryHost = process.env.DB_HOST || 'localhost';
  const hostsToTry = [primaryHost];
  
  // If user specified 'localhost', also try '127.0.0.1' as Node often fails socket resolution on Hostinger
  if (primaryHost === 'localhost') {
    hostsToTry.push('127.0.0.1');
  }

  for (const targetHost of hostsToTry) {
    const dbConfig = {
      host: targetHost,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 8000 
    };

    console.log(`[DB] Attempting handshake: ${targetHost}...`);

    try {
      const tempPool = mysql.createPool(dbConfig);
      const conn = await tempPool.getConnection();
      console.log(`[DB] SUCCESS: Connected to ${targetHost}`);
      conn.release();

      pool = tempPool;
      SYSTEM_IDENTITY.db_health = "CONNECTED";
      SYSTEM_IDENTITY.active_db_host = targetHost;
      return; // Exit loop on success
    } catch (err: any) {
      console.error(`[DB] Handshake failed for ${targetHost}: ${err.message}`);
      SYSTEM_IDENTITY.last_error = { 
        code: err.code, 
        host_attempted: targetHost,
        message: err.message 
      };
    }
  }

  SYSTEM_IDENTITY.db_health = "OFFLINE";
};

const bootSystem = async () => {
  console.log(`Sanghavi Enterprise v8.9 initializing [Platform: ${(process as any).platform}]`);
  await connectDatabase();
  
  if (SYSTEM_IDENTITY.db_health === "CONNECTED") {
    try {
      const [columns]: any = await pool.execute('DESCRIBE customers');
      SYSTEM_IDENTITY.database_structure = columns;
      console.log("[VAULT] Schema validated.");
    } catch (e) { }
  }
};

bootSystem();

// --- ROUTES ---

app.get('/api/system/health', (req, res) => res.json(SYSTEM_IDENTITY));

app.post('/api/auth/login', async (req: any, res: any) => {
  const { email, password } = req.body;
  
  // Root bypass for recovery
  if ((email === 'matrixjeevan@gmail.com' && password === 'admin123') || (email === 'admin' && password === 'admin')) {
     return res.json({ id: 'usr_root', name: 'System Root', email, role: 'admin' });
  }

  if (SYSTEM_IDENTITY.db_health === "CONNECTED") {
     try {
        const [rows]: any = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0 && rows[0].password_hash === password) {
           return res.json(rows[0]);
        }
     } catch (e) {}
  }
  res.status(401).json({ error: "Unauthorized" });
});

app.get('/api/customers', async (req: any, res: any) => {
  if (SYSTEM_IDENTITY.db_health !== "CONNECTED") return res.json([]);
  try {
    const [rows]: any = await pool.execute('SELECT * FROM customers ORDER BY name ASC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: "QUERY_FAIL" });
  }
});

app.get('/api/ledger/global', async (req: any, res: any) => {
  if (SYSTEM_IDENTITY.db_health !== "CONNECTED") return res.json({ data: [], meta: {} });
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const [rows]: any = await pool.execute(
      `SELECT t.*, c.name as customerName, c.unique_payment_code as upc FROM transactions t 
       JOIN customers c ON t.customer_id = c.id 
       ORDER BY t.date DESC LIMIT ? OFFSET ?`, [limit, offset]
    );
    const [count]: any = await pool.execute('SELECT COUNT(*) as total FROM transactions');
    res.json({
      data: rows,
      meta: { total: count[0].total, page, limit, totalPages: Math.ceil(count[0].total / limit) }
    });
  } catch (err: any) {
    res.status(500).json({ error: "LEDGER_FAIL" });
  }
});

app.post('/api/kernel/reason', async (req: any, res: any) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Audit Entity Risk Profile: ${JSON.stringify(req.body.customerData)}. Output JSON.`,
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
    res.status(500).json({ error: "CORTEX_OFFLINE" });
  }
});

app.use(express.static(path.join(__dirname, 'dist')) as any);
app.get('*', (req: any, res: any) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[CORE] Trace initialized on port ${PORT}`));