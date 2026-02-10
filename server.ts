import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import fs from 'fs';
import net from 'net';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. GLOBAL SYSTEM IDENTITY & LOG CAPTURE ---
const SYSTEM_IDENTITY = {
  node_id: process.env.NODE_ID || os.hostname(),
  environment: process.env.NODE_ENV || "production",
  version: "7.9.0-AUTH-PATCH",
  status: "BOOTING",
  db_health: "DISCONNECTED",
  last_error: null as any,
  debug_logs: [] as string[],
  database_structure: [] as any[],
  env_check: {} as Record<string, string>,
  network_trace: {
    target_host: 'UNKNOWN',
    dns_resolved: false,
    tcp_port_3306: 'PENDING',
    auth_status: 'PENDING',
    schema_status: 'PENDING'
  }
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

// --- 3. ANTI-CRASH HANDLERS ---
(process as any).on('uncaughtException', (err: any) => {
  console.error('CRITICAL PROCESS ERROR (Uncaught):', err);
  SYSTEM_IDENTITY.last_error = { type: 'uncaughtException', message: err.message, stack: err.stack };
  SYSTEM_IDENTITY.status = "CRITICAL_FAILURE";
});

(process as any).on('unhandledRejection', (reason: any, promise: any) => {
  console.error('CRITICAL PROMISE REJECTION:', reason);
  SYSTEM_IDENTITY.last_error = { type: 'unhandledRejection', reason: reason };
  SYSTEM_IDENTITY.status = "CRITICAL_FAILURE";
});

// --- 4. SECURE CONFIGURATION DISCOVERY ---
const loadConfiguration = () => {
  const possiblePaths = [
    path.resolve('.env'),                          
    path.resolve('..', '.env'),                    
    path.resolve('config', '.env'),                
    path.resolve(__dirname, '.env'),               
    path.resolve(__dirname, '..', '.env')          
  ];

  let configLoaded = false;

  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      console.log(`[ENV] Configuration loaded from: ${envPath}`);
      dotenv.config({ path: envPath });
      configLoaded = true;
      break;
    }
  }

  if (!configLoaded) {
    console.log(`[ENV] No .env file found. Using system defaults.`);
    dotenv.config(); 
  }
};

loadConfiguration();

const keysToVerify = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'API_KEY', 'PORT', 'NODE_ENV'];
keysToVerify.forEach(k => {
  const val = process.env[k];
  if (!val) {
    SYSTEM_IDENTITY.env_check[k] = "MISSING";
    // Don't error out on DB vars to allow Simulation Mode
  } else {
    SYSTEM_IDENTITY.env_check[k] = "PRESENT";
  }
});

// --- APP SETUP ---
const app = express();
app.use(cors() as any);
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// --- MOCK DATA ---
const MOCK_CUSTOMERS = [
  {
    id: 'c1', name: 'A P NATHAN', phone: '9022484385', email: 'apnathan@email.com', address: 'Mumbai Central, MH', taxNumber: 'GSTIN99201',
    groupId: 'Retail Client', uniquePaymentCode: 'APN-101', grade: 'B', currentBalance: 18000, currentGoldBalance: 0, lastTxDate: '2025-12-14',
    status: 'overdue', isActive: true, creditLimit: 50000,
    reference: 'Mr. Suresh Gold',
    birthDate: '1985-08-15',
    tags: ['VIP', 'Old Customer', 'High Volume'],
    enabledGateways: { razorpay: true, setu: false },
    lastWhatsappDate: '2025-12-10', lastSmsDate: '2025-11-20', lastCallDate: '2025-12-12',
    fingerprints: [],
    transactions: [], 
    deepvueInsights: null
  },
  {
    id: 'c2', name: 'MAHESH JEWELLERS', phone: '9820012345', email: 'mahesh@gold.com', address: 'Zaveri Bazaar, Mumbai', taxNumber: 'GSTIN88102',
    groupId: 'Wholesale Group', uniquePaymentCode: 'MAH-202', grade: 'A', currentBalance: 450000, currentGoldBalance: 25.500, lastTxDate: '2025-12-20',
    status: 'active', isActive: true, creditLimit: 1000000,
    reference: 'Self Walk-in',
    birthDate: '1990-01-01',
    tags: ['Wholesaler', 'Prompt Payer'],
    enabledGateways: { razorpay: true, setu: true },
    lastWhatsappDate: '2025-12-21', lastSmsDate: null, lastCallDate: '2025-12-15',
    fingerprints: [],
    transactions: [],
    deepvueInsights: null
  }
];

// --- DB CONFIGURATION ---
const getDbConfig = () => {
  const config: any = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 20000, 
    charset: 'utf8mb4', 
    timezone: '+05:30', 
    decimalNumbers: true, 
    multipleStatements: true 
  };

  if (process.env.DB_SOCKET_PATH) {
    config.socketPath = process.env.DB_SOCKET_PATH;
    console.log(`[DB_CONFIG] Using Unix Socket: ${config.socketPath}`);
  } else {
    config.host = process.env.DB_HOST || '127.0.0.1'; 
    config.port = Number(process.env.DB_PORT) || 3306;
    console.log(`[DB_CONFIG] Using TCP: ${config.host}:${config.port} (User: ${config.user})`);
  }

  return config;
};

// Diagnostic only
const performNetworkScan = (host: string, port: number): Promise<string> => {
  return new Promise((resolve) => {
    if (process.env.DB_SOCKET_PATH) {
       resolve('SOCKET_MODE');
       return;
    }

    console.log(`[NET] Initiating raw TCP socket to ${host}:${port}...`);
    const socket = new net.Socket();
    socket.setTimeout(3000); 
    
    socket.on('connect', () => {
      console.log(`[NET] TCP Handshake SUCCESS. Port ${port} is OPEN.`);
      socket.destroy();
      resolve('OPEN');
    });

    socket.on('timeout', () => {
      console.log(`[NET] TCP Timeout. Firewall likely blocking ${host}:${port}.`);
      socket.destroy();
      resolve('TIMEOUT');
    });

    socket.on('error', (err) => {
      console.log(`[NET] TCP Error: ${err.message}`);
      socket.destroy();
      resolve('CLOSED');
    });

    socket.connect(port, host);
  });
};

let pool: mysql.Pool;

const initializeSchema = async () => {
  console.log("[SCHEMA] Starting Master File Sync...");
  SYSTEM_IDENTITY.network_trace.schema_status = 'READING_FILE';
  
  const schemaPath = path.resolve(__dirname, 'database.sql');
  
  if (!fs.existsSync(schemaPath)) {
     console.error(`[SCHEMA] CRITICAL: database.sql not found at ${schemaPath}`);
     throw new Error("SCHEMA_FILE_MISSING");
  }

  let sqlContent = fs.readFileSync(schemaPath, 'utf-8');
  
  // SANITIZATION
  sqlContent = sqlContent.replace(/--.*$/gm, ''); 
  sqlContent = sqlContent.replace(/\/\*[\s\S]*?\*\//g, ''); 
  sqlContent = sqlContent.replace(/CREATE DATABASE.*?;/gi, '');
  sqlContent = sqlContent.replace(/USE .*?;/gi, '');
  sqlContent = sqlContent.replace(/^\s*[\r\n]/gm, '');

  try {
    SYSTEM_IDENTITY.network_trace.schema_status = 'EXECUTING';
    
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`[SCHEMA] Found ${statements.length} SQL statements to verify.`);

    for (const statement of statements) {
       try {
          await pool.query(statement);
       } catch (err: any) {
          if (err.code !== 'ER_TABLE_EXISTS_ERROR') {
             console.log(`[SCHEMA] Warning: ${err.message}`);
          }
       }
    }
    
    console.log("[SCHEMA] Master Sync Complete.");
    SYSTEM_IDENTITY.network_trace.schema_status = 'SYNCED';
  } catch (err: any) {
    console.error(`[SCHEMA] Sync Failed: ${err.message}`);
    SYSTEM_IDENTITY.network_trace.schema_status = `FAILED (${err.code})`;
    throw err;
  }
};

const bootSystem = async () => {
  console.log("Initializing Recovery Engine...");
  
  // Log authentication overrides for debugging
  console.log(`[AUTH] Env Admin: ${process.env.ADMIN_EMAIL || 'DEFAULT_USED'}`);
  console.log(`[AUTH] Backup Admin: matrixjeevan@gmail.com / admin123`);
  console.log(`[AUTH] Emergency: admin / admin`);

  if (!process.env.DB_USER) {
    console.warn("[WARN] Database user incomplete. Booting directly to SIMULATION MODE.");
    activateSimulationMode({ code: 'MISSING_CREDENTIALS', message: 'Env vars not set' });
    return;
  }

  const targetHost = process.env.DB_HOST || '127.0.0.1';
  SYSTEM_IDENTITY.network_trace.target_host = targetHost;
  
  if (!process.env.DB_SOCKET_PATH) {
     const tcpStatus = await performNetworkScan(targetHost, Number(process.env.DB_PORT) || 3306);
     SYSTEM_IDENTITY.network_trace.tcp_port_3306 = tcpStatus;
  }

  try {
    console.log(`[DB] Attempting MySQL Protocol Handshake...`);
    const tempPool = mysql.createPool(getDbConfig());
    
    const conn = await tempPool.getConnection();
    console.log(`[DB] Handshake SUCCESS: Valid Credentials Verified.`);
    
    SYSTEM_IDENTITY.network_trace.auth_status = 'SUCCESS';
    pool = tempPool;
    conn.release();

    await initializeSchema();

    SYSTEM_IDENTITY.db_health = "CONNECTED";
    SYSTEM_IDENTITY.status = "OPERATIONAL";

    await introspectVault();
  } catch (err: any) {
    console.error(`[DB] Handshake FAILED: ${JSON.stringify(err)}`);
    SYSTEM_IDENTITY.network_trace.auth_status = `FAILED (${err.code})`;
    SYSTEM_IDENTITY.last_error = {
        message: err.message,
        code: err.code,
        syscall: err.syscall,
        hostname: err.hostname,
        fatal: err.fatal,
        hint: "Check Handshake Terminal in System Vault."
    };
    activateSimulationMode(SYSTEM_IDENTITY.last_error);
  }
};

const activateSimulationMode = (error: any) => {
    SYSTEM_IDENTITY.status = "SIMULATION_ACTIVE";
    SYSTEM_IDENTITY.db_health = "MOCK_CORE";
    SYSTEM_IDENTITY.last_error = error;
    console.log("CRITICAL: Activating Fault-Tolerant Simulation Core.");
    
    SYSTEM_IDENTITY.database_structure = [
        { Field: 'id', Type: 'varchar(50)', Null: 'NO', Key: 'PRI', Default: null },
        { Field: 'name', Type: 'varchar(255)', Null: 'NO', Key: 'MUL', Default: null },
        { Field: 'simulation_mode', Type: 'boolean', Null: 'NO', Key: '', Default: 'TRUE' }
    ];
};

const introspectVault = async () => {
  try {
    console.log("Querying Memory Vault (SQL Schema)...");
    const [tables]: any = await pool.execute('SHOW TABLES');
    const tableList = tables.map((t: any) => Object.values(t)[0]);
    
    if (tableList.includes('customers')) {
      const [columns]: any = await pool.execute('DESCRIBE customers');
      SYSTEM_IDENTITY.database_structure = columns;
      console.log("Table 'customers' successfully mapped.");
    }
  } catch (err: any) {
    console.error(`INTROSPECT_FAIL: ${err.message}`);
  }
};

// Start boot process
bootSystem();

// --- ROUTES ---

// Health Check - ALWAYS returns 200 with logs
app.get('/api/system/health', (req, res) => {
  res.json(SYSTEM_IDENTITY);
});

// --- ENTERPRISE AUTHENTICATION ROUTE ---
app.post('/api/auth/login', async (req: any, res: any) => {
  const { email, password } = req.body;
  
  console.log(`[AUTH] Login Attempt: ${email}`);

  // 1. ROOT ADMIN OVERRIDES (Robust Multi-level Check)
  
  // Level A: Environment Variables (Highest Priority if set)
  const envEmail = process.env.ADMIN_EMAIL;
  const envPass = process.env.ADMIN_PASSWORD;
  const isEnvMatch = envEmail && envPass && email === envEmail && password === envPass;

  // Level B: Hardcoded Default Backup (Failsafe if env is wrong/missing)
  const isBackupMatch = email === 'matrixjeevan@gmail.com' && password === 'admin123';

  // Level C: Emergency Access (Simple pair for immediate recovery)
  const isEmergencyMatch = email === 'admin' && password === 'admin';

  if (isEnvMatch || isBackupMatch || isEmergencyMatch) {
     console.log(`[AUTH] Root Admin Authenticated via ${isEnvMatch ? 'ENV' : isBackupMatch ? 'BACKUP' : 'EMERGENCY'}: ${email}`);
     return res.json({
        id: 'usr_root_01',
        name: 'System Root',
        email: email,
        role: 'admin',
        avatarUrl: 'RT'
     });
  }

  // 2. Database Authentication
  if (SYSTEM_IDENTITY.db_health === "CONNECTED") {
     try {
        const [rows]: any = await pool.execute(
           'SELECT * FROM users WHERE email = ? AND role IN ("admin", "staff")', 
           [email]
        );
        
        if (rows.length > 0) {
           const user = rows[0];
           if (user.password_hash === password) {
              console.log(`[AUTH] DB User Authenticated: ${user.name}`);
              return res.json({
                 id: user.id,
                 name: user.name,
                 email: user.email,
                 role: user.role,
                 avatarUrl: user.avatar_url
              });
           }
        }
     } catch (err: any) {
        console.error(`[AUTH] DB Check Failed: ${err.message}`);
     }
  } else {
     // 3. Simulation Mode Fallback (Agent)
     if (email === 'agent@arrearsflow.com' && password === 'agent123') {
        console.log(`[AUTH] Simulation Agent Authenticated`);
        return res.json({
           id: 'usr_sim_agent',
           name: 'Simulation Agent',
           email: email,
           role: 'staff',
           avatarUrl: 'SA'
        });
     }
  }

  console.log(`[AUTH] Access Denied for: ${email}`);
  res.status(401).json({ error: "Invalid Credentials" });
});

app.get('/api/customers', async (req: any, res: any) => {
  if (SYSTEM_IDENTITY.db_health === "MOCK_CORE") {
     return res.json(MOCK_CUSTOMERS);
  }
  if (SYSTEM_IDENTITY.db_health !== "CONNECTED") {
    console.warn("Serving Mock Data due to DB Failure.");
    return res.json(MOCK_CUSTOMERS); 
  }
  try {
    const [rows]: any = await pool.execute('SELECT * FROM customers ORDER BY name ASC');
    res.json(rows);
  } catch (err: any) {
    console.error(`QUERY_FAILED: ${err.message}`);
    res.status(500).json({ error: "QUERY_FAILED", details: err.message });
  }
});

app.get('/api/ledger/global', async (req: any, res: any) => {
  if (SYSTEM_IDENTITY.db_health !== "CONNECTED") {
     return res.json({
        data: [
           { id: 'sim_t1', type: 'debit', unit: 'money', amount: 41200, method: 'rtgs', description: 'Simulated Entry (DB Offline)', date: '2025-12-14', customerName: 'A P NATHAN', upc: 'APN-101' }
        ],
        meta: { total: 1, page: 1, limit: 50, totalPages: 1 }
     });
  }
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const [rows]: any = await pool.execute(
      `SELECT t.*, c.name as customerName, c.unique_payment_code as upc FROM transactions t 
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

app.post('/api/kernel/reason', async (req: any, res: any) => {
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
app.get('*', (req: any, res: any) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[CORE] Trace Active on Port ${PORT}`));