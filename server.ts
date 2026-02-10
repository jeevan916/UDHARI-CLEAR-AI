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

// --- SECURE CONFIG LOADING & DIAGNOSTICS ---
const SYSTEM_IDENTITY = {
  node_id: process.env.NODE_ID || os.hostname(),
  environment: process.env.NODE_ENV || "production",
  version: "7.4.0-HOSTINGER-STABLE",
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

// --- MOCK DATA FOR SIMULATION MODE ---
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

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// CRITICAL: Hostinger Configuration Strategy with Socket Support
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
    connectTimeout: 20000, // Extended for shared hosting latency
    charset: 'utf8mb4', // Essential for WhatsApp Emojis/Indian Languages
    timezone: '+05:30', // IST - Critical for financial ledger dates
    decimalNumbers: true, // Return DECIMAL types as JS numbers (not strings)
    multipleStatements: true // Required to execute the Master Schema file
  };

  // If a socket path is provided (common in enterprise cloud/Hostinger), prioritize it over TCP
  if (process.env.DB_SOCKET_PATH) {
    config.socketPath = process.env.DB_SOCKET_PATH;
    logDebug(`[DB] Using Unix Socket: ${config.socketPath}`);
  } else {
    // Default to IPv4 loopback to avoid Node 17+ localhost::1 issues
    config.host = process.env.DB_HOST || '127.0.0.1'; 
    config.port = Number(process.env.DB_PORT) || 3306;
    logDebug(`[DB] Using TCP: ${config.host}:${config.port}`);
  }

  return config;
};

// Diagnostic only - does not block application boot
const performNetworkScan = (host: string, port: number): Promise<string> => {
  return new Promise((resolve) => {
    // Skip TCP scan if using socket
    if (process.env.DB_SOCKET_PATH) {
       resolve('SOCKET_MODE');
       return;
    }

    logDebug(`[NET] Initiating raw TCP socket to ${host}:${port}...`);
    const socket = new net.Socket();
    socket.setTimeout(3000); // 3s timeout for raw TCP
    
    socket.on('connect', () => {
      logDebug(`[NET] TCP Handshake SUCCESS. Port ${port} is OPEN.`);
      socket.destroy();
      resolve('OPEN');
    });

    socket.on('timeout', () => {
      logDebug(`[NET] TCP Timeout. Firewall likely blocking ${host}:${port}.`);
      socket.destroy();
      resolve('TIMEOUT');
    });

    socket.on('error', (err) => {
      logDebug(`[NET] TCP Error: ${err.message}`);
      socket.destroy();
      resolve('CLOSED');
    });

    socket.connect(port, host);
  });
};

let pool: mysql.Pool;

/**
 * MASTER FILE SYNC ENGINE
 * Reads 'database.sql' but cleans it to prevent Hostinger permission errors.
 */
const initializeSchema = async () => {
  logDebug("[SCHEMA] Starting Master File Sync...");
  SYSTEM_IDENTITY.network_trace.schema_status = 'READING_FILE';
  
  const schemaPath = path.resolve(__dirname, 'database.sql');
  
  if (!fs.existsSync(schemaPath)) {
     logDebug(`[SCHEMA] CRITICAL: database.sql not found at ${schemaPath}`);
     throw new Error("SCHEMA_FILE_MISSING");
  }

  let sqlContent = fs.readFileSync(schemaPath, 'utf-8');
  
  // --- ROBUST SQL SANITIZATION ---
  // 1. Remove comments (both -- and /* */)
  sqlContent = sqlContent.replace(/--.*$/gm, ''); // remove single line comments
  sqlContent = sqlContent.replace(/\/\*[\s\S]*?\*\//g, ''); // remove block comments
  
  // 2. Remove 'CREATE DATABASE' and 'USE' statements
  // Hostinger assigns a specific DB name. Creating/Switching DBs in code often causes 
  // "Access Denied" errors because the user script doesn't have permissions or the DB name mismatches.
  sqlContent = sqlContent.replace(/CREATE DATABASE.*?;/gi, '');
  sqlContent = sqlContent.replace(/USE .*?;/gi, '');
  
  // 3. Remove empty lines
  sqlContent = sqlContent.replace(/^\s*[\r\n]/gm, '');

  try {
    SYSTEM_IDENTITY.network_trace.schema_status = 'EXECUTING';
    
    // Split by semi-colon to get individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    logDebug(`[SCHEMA] Found ${statements.length} SQL statements to verify.`);

    for (const statement of statements) {
       try {
          await pool.query(statement);
       } catch (err: any) {
          // Ignore "Table already exists" errors silently
          if (err.code !== 'ER_TABLE_EXISTS_ERROR') {
             logDebug(`[SCHEMA] Warning on statement: ${statement.substring(0, 30)}... -> ${err.message}`);
          }
       }
    }
    
    logDebug("[SCHEMA] Master Sync Complete. Memory Structure Active.");
    SYSTEM_IDENTITY.network_trace.schema_status = 'SYNCED';
  } catch (err: any) {
    logDebug(`[SCHEMA] Sync Failed: ${err.message}`);
    SYSTEM_IDENTITY.network_trace.schema_status = `FAILED (${err.code})`;
    throw err;
  }
};

const bootSystem = async () => {
  logDebug("Initializing Recovery Engine...");
  
  // HOSTINGER CONFIGURATION CHECK
  if (!process.env.DB_USER) {
    logDebug("[WARN] Database user incomplete. Booting directly to SIMULATION MODE.");
    activateSimulationMode({ code: 'MISSING_CREDENTIALS', message: 'Env vars not set' });
    return;
  }

  const targetHost = process.env.DB_HOST || '127.0.0.1';
  SYSTEM_IDENTITY.network_trace.target_host = targetHost;
  
  // Perform TCP check only if we are using TCP
  if (!process.env.DB_SOCKET_PATH) {
     const tcpStatus = await performNetworkScan(targetHost, Number(process.env.DB_PORT) || 3306);
     SYSTEM_IDENTITY.network_trace.tcp_port_3306 = tcpStatus;
  }

  try {
    logDebug(`[DB] Attempting MySQL Protocol Handshake...`);
    const tempPool = mysql.createPool(getDbConfig());
    
    const conn = await tempPool.getConnection();
    logDebug(`[DB] Handshake SUCCESS: Valid Credentials Verified.`);
    
    SYSTEM_IDENTITY.network_trace.auth_status = 'SUCCESS';
    pool = tempPool;
    conn.release();

    await initializeSchema();

    SYSTEM_IDENTITY.db_health = "CONNECTED";
    SYSTEM_IDENTITY.status = "OPERATIONAL";

    await introspectVault();
  } catch (err: any) {
    logDebug(`[DB] Handshake/Schema FAILED: ${err.code} - ${err.message}`);
    SYSTEM_IDENTITY.network_trace.auth_status = `FAILED (${err.code})`;
    SYSTEM_IDENTITY.last_error = {
        code: err.code || 'NO_CODE',
        message: err.message,
        host: targetHost,
        hint: "Check DB_USER permissions, DB_NAME existence, and if 127.0.0.1 vs localhost is correct."
    };
    activateSimulationMode(SYSTEM_IDENTITY.last_error);
  }
};

const activateSimulationMode = (error: any) => {
    SYSTEM_IDENTITY.status = "SIMULATION_ACTIVE";
    SYSTEM_IDENTITY.db_health = "MOCK_CORE";
    SYSTEM_IDENTITY.last_error = error;
    logDebug("CRITICAL: Database unreachable. Activating Fault-Tolerant Simulation Core.");
    
    SYSTEM_IDENTITY.database_structure = [
        { Field: 'id', Type: 'varchar(50)', Null: 'NO', Key: 'PRI', Default: null },
        { Field: 'name', Type: 'varchar(255)', Null: 'NO', Key: 'MUL', Default: null },
        { Field: 'simulation_mode', Type: 'boolean', Null: 'NO', Key: '', Default: 'TRUE' }
    ];
};

const introspectVault = async () => {
  try {
    logDebug("Querying Memory Vault (SQL Schema)...");
    const [tables]: any = await pool.execute('SHOW TABLES');
    const tableList = tables.map((t: any) => Object.values(t)[0]);
    
    if (tableList.includes('customers')) {
      const [columns]: any = await pool.execute('DESCRIBE customers');
      SYSTEM_IDENTITY.database_structure = columns;
      logDebug("Table 'customers' successfully mapped to Memory Vault.");
    } else {
      logDebug("WARNING: Table 'customers' not found after migration.");
    }
  } catch (err: any) {
    logDebug(`VAULT_ERROR: ${err.message}`);
  }
};

bootSystem();

app.get('/api/system/health', (req, res) => res.json(SYSTEM_IDENTITY));

app.get('/api/customers', async (req: Request, res: Response) => {
  if (SYSTEM_IDENTITY.db_health === "MOCK_CORE") {
     return res.json(MOCK_CUSTOMERS);
  }
  if (SYSTEM_IDENTITY.db_health !== "CONNECTED") {
    return res.status(503).json({ error: "DATABASE_OFFLINE", details: SYSTEM_IDENTITY.last_error });
  }
  try {
    const [rows]: any = await pool.execute('SELECT * FROM customers ORDER BY name ASC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: "QUERY_FAILED", details: err.message });
  }
});

app.get('/api/ledger/global', async (req: Request, res: Response) => {
  if (SYSTEM_IDENTITY.db_health === "MOCK_CORE") {
     return res.json({
        data: [
           { id: 'sim_t1', type: 'debit', unit: 'money', amount: 41200, method: 'rtgs', description: 'Simulated Entry', date: '2025-12-14', customerName: 'A P NATHAN', upc: 'APN-101' }
        ],
        meta: { total: 1, page: 1, limit: 50, totalPages: 1 }
     });
  }
  if (SYSTEM_IDENTITY.db_health !== "CONNECTED") return res.status(503).json({ error: "DB_OFFLINE" });
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