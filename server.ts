import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. GLOBAL SYSTEM IDENTITY ---
const SYSTEM_IDENTITY = {
  node_id: "SANGHAVI_CORE_V9.0", 
  host_ip: "139.59.10.70", 
  working_dir: (process as any).cwd(),
  script_dir: __dirname,
  env_path_found: "NOT_LOADED",
  env_file_exists: false,
  example_file_exists: false,
  env_search_trace: [] as string[],
  node_version: (process as any).version,
  environment: process.env.NODE_ENV || "production",
  db_health: "DISCONNECTED",
  active_db_host: "INIT...",
  last_error: null as any,
  debug_logs: [] as string[],
  database_structure: [] as any[]
};

// --- 2. LOGGING KERNEL ---
const pushLog = (type: 'INFO' | 'ERR', ...args: any[]) => {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
  SYSTEM_IDENTITY.debug_logs.unshift(`[${timestamp}] [${type}] ${msg}`);
  if (SYSTEM_IDENTITY.debug_logs.length > 200) SYSTEM_IDENTITY.debug_logs.pop();
};

// Fix: Property 'stdout' and 'stderr' do not exist on type 'Process' - casting to any
console.log = (...args) => { pushLog('INFO', ...args); (process as any).stdout.write(args.join(' ') + '\n'); };
console.error = (...args) => { pushLog('ERR', ...args); (process as any).stderr.write(args.join(' ') + '\n'); };

// --- 3. AGGRESSIVE .ENV DISCOVERY ---
const loadConfiguration = () => {
  const cwd = (process as any).cwd();
  const searchPaths = [
    path.resolve(cwd, '.env'),
    path.resolve(cwd, '..', '.env'),
    path.resolve(__dirname, '.env'),
    path.resolve(__dirname, '..', '.env')
  ];

  SYSTEM_IDENTITY.example_file_exists = fs.existsSync(path.resolve(cwd, '.env.example'));

  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      SYSTEM_IDENTITY.env_path_found = p;
      SYSTEM_IDENTITY.env_file_exists = true;
      SYSTEM_IDENTITY.env_search_trace.push(`MATCH: ${p}`);
      break;
    } else {
      SYSTEM_IDENTITY.env_search_trace.push(`MISS: ${p}`);
    }
  }

  if (!SYSTEM_IDENTITY.env_file_exists) {
    console.error("[CRITICAL] .env not found. Please rename .env.example to .env");
  }
};
loadConfiguration();

const app = express();
app.use(cors() as any);
app.use(express.json() as any);

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

let pool: mysql.Pool;

// --- 4. WATERFALL DATABASE HANDSHAKE ---
const connectDatabase = async () => {
  if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
    SYSTEM_IDENTITY.db_health = "CONFIG_ERROR";
    return;
  }

  const primaryHost = process.env.DB_HOST || 'localhost';
  // Attempt Waterfall: Specific Host -> 127.0.0.1 -> localhost
  const hostsToTry = Array.from(new Set([primaryHost, '127.0.0.1', 'localhost']));

  for (const host of hostsToTry) {
    console.log(`[DB] Handshake attempt: ${host}`);
    try {
      const dbConfig = {
        host: host,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306,
        connectTimeout: 5000,
        enableKeepAlive: true,
        // Hostinger/MySQL 8 compatibility fix
        authSwitchHandler: (data: any, cb: any) => {
           if (data.pluginName === 'caching_sha2_password') {
             // Fix: Cannot find name 'Buffer' - using global.Buffer reference via casting to any
             cb(null, (global as any).Buffer.from(process.env.DB_PASSWORD!));
           } else {
             cb(new Error(`Unknown Auth Plugin: ${data.pluginName}`));
           }
        }
      };

      const tempPool = mysql.createPool(dbConfig);
      const conn = await tempPool.getConnection();
      console.log(`[DB] SUCCESS: Link established with ${host}`);
      conn.release();
      
      pool = tempPool;
      SYSTEM_IDENTITY.db_health = "CONNECTED";
      SYSTEM_IDENTITY.active_db_host = host;
      SYSTEM_IDENTITY.last_error = null;
      return;
    } catch (err: any) {
      console.error(`[DB] Fail at ${host}: ${err.message}`);
      SYSTEM_IDENTITY.last_error = { code: err.code, host_tried: host, msg: err.message };
    }
  }
  SYSTEM_IDENTITY.db_health = "OFFLINE";
};

bootSystem();

async function bootSystem() {
  console.log(`Sanghavi Enterprise initializing... [Node: ${SYSTEM_IDENTITY.node_id}]`);
  await connectDatabase();
  
  if (SYSTEM_IDENTITY.db_health === "CONNECTED") {
    try {
      const [cols]: any = await pool.execute('DESCRIBE customers');
      SYSTEM_IDENTITY.database_structure = cols;
    } catch (e) {}
  }
}

// --- API ROUTES ---

app.get('/api/system/health', (req, res) => res.json(SYSTEM_IDENTITY));

app.post('/api/auth/login', async (req: any, res: any) => {
  const { email, password } = req.body;
  if ((email === 'admin' && password === 'admin') || (email === 'matrixjeevan@gmail.com' && password === 'admin123')) {
    return res.json({ id: 'usr_root', name: 'Root Admin', email, role: 'admin' });
  }
  res.status(401).json({ error: "Access Restricted" });
});

app.get('/api/customers', async (req, res) => {
  if (SYSTEM_IDENTITY.db_health !== "CONNECTED") return res.json([]);
  try {
    const [rows] = await pool.execute('SELECT * FROM customers ORDER BY name ASC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: "DB_ERROR" }); }
});

app.post('/api/kernel/reason', async (req: any, res: any) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Analyze Credit Risk for Jeweller Customer: ${JSON.stringify(req.body.customerData)}. Output JSON.`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            risk_score: { type: Type.NUMBER },
            risk_level: { type: Type.STRING },
            analysis: { type: Type.STRING },
            next_step: { type: Type.STRING }
          },
          required: ["risk_score", "risk_level", "analysis", "next_step"]
        }
      }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (err) { res.status(500).json({ error: "AI_OFFLINE" }); }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[CORE] Enterprise server active on port ${PORT}`));
