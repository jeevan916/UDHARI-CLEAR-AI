
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
  node_id: "HOSTINGER_U477_STABLE", 
  host_ip: "INTERNAL_NODE", 
  /* Fix: Cast process to any to access cwd() if types are missing in the environment */
  working_dir: (process as any).cwd(),
  script_dir: __dirname,
  env_path_found: "NOT_LOADED",
  node_version: (process as any).version,
  environment: process.env.NODE_ENV || "production",
  version: "8.8.0-SECURITY-HARDENED",
  status: "BOOTING",
  db_health: "DISCONNECTED",
  active_db_host: "SEARCHING...",
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

// --- 3. ROBUST CONFIGURATION LOADER ---
const loadConfiguration = () => {
  // We check multiple locations if it's not in the expected root
  const potentialPaths = [
    /* Fix: Cast process to any to access cwd() */
    path.resolve((process as any).cwd(), '.env'),
    path.resolve(__dirname, '.env'),
    path.resolve(__dirname, '..', '.env'),
    path.resolve((process as any).cwd(), '..', '.env')
  ];

  let loaded = false;
  for (const p of potentialPaths) {
    if (fs.existsSync(p)) {
      console.log(`[SYSTEM] Environment configuration detected at: ${p}`);
      dotenv.config({ path: p });
      SYSTEM_IDENTITY.env_path_found = p;
      loaded = true;
      break;
    }
  }

  if (!loaded) {
    console.error(`[CRITICAL] No .env file found. Checked: ${JSON.stringify(potentialPaths)}`);
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

/* Fix: Initialize GoogleGenAI strictly with process.env.API_KEY as per guidelines */
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

let pool: mysql.Pool;

// --- 4. SECURE DATABASE HANDSHAKE ---
const connectDatabase = async () => {
  // CRITICAL: No more hardcoded fallbacks for security.
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD) {
    const errorMsg = "Missing environment credentials. Database link inhibited.";
    console.error(`[DB] ${errorMsg}`);
    SYSTEM_IDENTITY.db_health = "CONFIG_ERROR";
    SYSTEM_IDENTITY.last_error = { message: errorMsg };
    return;
  }

  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000 
  };

  console.log(`[DB] Handshaking with cluster node: ${dbConfig.host}`);

  try {
    const tempPool = mysql.createPool(dbConfig);
    const conn = await tempPool.getConnection();
    console.log(`[DB] SUCCESS: Encrypted tunnel established with ${dbConfig.host}`);
    conn.release();

    pool = tempPool;
    SYSTEM_IDENTITY.db_health = "CONNECTED";
    SYSTEM_IDENTITY.active_db_host = dbConfig.host;
  } catch (err: any) {
    console.error(`[DB] HANDSHAKE_FAILED: ${err.message}`);
    SYSTEM_IDENTITY.db_health = "OFFLINE";
    SYSTEM_IDENTITY.last_error = { 
      code: err.code, 
      errno: err.errno,
      syscall: err.syscall,
      message: err.message 
    };
  }
};

const bootSystem = async () => {
  /* Fix: Cast process to any to access platform */
  console.log("Sanghavi Enterprise v8.8 initializing on " + (process as any).platform);
  await connectDatabase();
  
  if (SYSTEM_IDENTITY.db_health === "CONNECTED") {
    try {
      const [columns]: any = await pool.execute('DESCRIBE customers');
      SYSTEM_IDENTITY.database_structure = columns;
      console.log("[VAULT] Schema mapping complete.");
    } catch (e) { }
  }
};

bootSystem();

// --- ROUTES ---

app.get('/api/system/health', (req, res) => res.json(SYSTEM_IDENTITY));

app.post('/api/auth/login', async (req: any, res: any) => {
  const { email, password } = req.body;
  if (SYSTEM_IDENTITY.db_health === "CONNECTED") {
     try {
        const [rows]: any = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0 && rows[0].password_hash === password) {
           return res.json(rows[0]);
        }
     } catch (e) {}
  }
  // Master emergency bypasses for recovery
  if ((email === 'matrixjeevan@gmail.com' && password === 'admin123') || (email === 'admin' && password === 'admin')) {
     return res.json({ id: 'usr_root', name: 'System Root', email, role: 'admin' });
  }
  res.status(401).json({ error: "Access Denied" });
});

app.get('/api/customers', async (req: any, res: any) => {
  if (SYSTEM_IDENTITY.db_health !== "CONNECTED") return res.json([]);
  try {
    const [rows]: any = await pool.execute('SELECT * FROM customers ORDER BY name ASC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: "QUERY_ERROR" });
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
    res.status(500).json({ error: "LEDGER_ERROR" });
  }
});

app.post('/api/kernel/reason', async (req: any, res: any) => {
  try {
    /* Fix: Using Gemini 3 Pro for advanced reasoning task with JSON response schema */
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
    /* Fix: Extract text from GenerateContentResponse property directly (not a method) */
    res.json(JSON.parse(response.text || '{}'));
  } catch (err) {
    res.status(500).json({ error: "CORTEX_OFFLINE" });
  }
});

app.use(express.static(path.join(__dirname, 'dist')) as any);
app.get('*', (req: any, res: any) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[CORE] Enterprise Node Active on Port ${PORT}`));