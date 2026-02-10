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
  version: "7.2.2-HOSTINGER-PATCH",
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

// --- ENTERPRISE MASTER SCHEMA DEFINITIONS ---
const SCHEMA_DEFINITIONS = [
  {
    table: 'users',
    query: `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      role ENUM('admin', 'staff', 'auditor') DEFAULT 'staff',
      password_hash VARCHAR(255) NOT NULL,
      avatar_url TEXT,
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    table: 'customers',
    query: `CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      email VARCHAR(255),
      address TEXT,
      tax_number VARCHAR(50),
      group_id VARCHAR(100) DEFAULT 'Retail Client',
      unique_payment_code VARCHAR(20) UNIQUE NOT NULL,
      current_balance DECIMAL(15, 2) DEFAULT 0.00,
      current_gold_balance DECIMAL(15, 3) DEFAULT 0.000,
      credit_limit DECIMAL(15, 2) DEFAULT 0.00,
      is_active BOOLEAN DEFAULT TRUE,
      status VARCHAR(50) DEFAULT 'active',
      grade VARCHAR(5) DEFAULT 'A',
      last_call_date DATETIME,
      last_whatsapp_date DATETIME,
      last_sms_date DATETIME,
      deepvue_data JSON,
      fingerprints JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_upc (unique_payment_code),
      INDEX idx_phone (phone),
      INDEX idx_name (name)
    )`
  },
  {
    table: 'transactions',
    query: `CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(50) PRIMARY KEY,
      customer_id VARCHAR(50) NOT NULL,
      type ENUM('credit', 'debit') NOT NULL,
      unit ENUM('money', 'gold') NOT NULL DEFAULT 'money',
      amount DECIMAL(15, 3) NOT NULL,
      method VARCHAR(50) NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      staff_id VARCHAR(50),
      balance_after DECIMAL(15, 3),
      particular VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      INDEX idx_cust_date (customer_id, date),
      INDEX idx_global_date (date),
      INDEX idx_type_unit (type, unit)
    )`
  },
  {
    table: 'communication_logs',
    query: `CREATE TABLE IF NOT EXISTS communication_logs (
      id VARCHAR(50) PRIMARY KEY,
      customer_id VARCHAR(50) NOT NULL,
      type ENUM('sms', 'whatsapp', 'call', 'visit') NOT NULL,
      content TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(50),
      duration INT DEFAULT 0,
      outcome VARCHAR(100),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      INDEX idx_cust_ts (customer_id, timestamp)
    )`
  },
  {
    table: 'grade_rules',
    query: `CREATE TABLE IF NOT EXISTS grade_rules (
      id VARCHAR(5) PRIMARY KEY,
      label VARCHAR(100) NOT NULL,
      color VARCHAR(20) DEFAULT 'slate',
      priority INT NOT NULL,
      min_balance DECIMAL(15, 2) DEFAULT 0.00,
      days_since_payment INT DEFAULT 0,
      days_since_contact INT DEFAULT 0,
      anti_spam_threshold INT DEFAULT 24,
      anti_spam_unit ENUM('hours', 'days') DEFAULT 'hours',
      whatsapp BOOLEAN DEFAULT FALSE,
      sms BOOLEAN DEFAULT FALSE,
      whatsapp_template_id VARCHAR(50),
      sms_template_id VARCHAR(50),
      frequency_days INT DEFAULT 30
    )`
  },
  {
    table: 'templates',
    query: `CREATE TABLE IF NOT EXISTS templates (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      label VARCHAR(255),
      channel ENUM('whatsapp', 'sms') NOT NULL,
      category VARCHAR(50) DEFAULT 'UTILITY',
      status VARCHAR(50) DEFAULT 'draft',
      content TEXT NOT NULL,
      language VARCHAR(10) DEFAULT 'en_US',
      wa_header JSON,
      wa_footer VARCHAR(255),
      wa_buttons JSON,
      dlt_template_id VARCHAR(100),
      sender_id VARCHAR(20),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  },
  {
    table: 'integrations',
    query: `CREATE TABLE IF NOT EXISTS integrations (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      category VARCHAR(100),
      status ENUM('online', 'offline', 'idle', 'maintenance') DEFAULT 'idle',
      latency VARCHAR(20) DEFAULT '0ms',
      config JSON,
      last_health_check TIMESTAMP
    )`
  }
];

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

// Update: Default to localhost for Hostinger VPS/Shared Hosting internal networking
const getDbConfig = () => ({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 10000 // Increased timeout for Hostinger shared environments
});

const performNetworkScan = (host: string, port: number): Promise<string> => {
  return new Promise((resolve) => {
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

const initializeSchema = async () => {
  logDebug("[SCHEMA] Starting Enterprise Auto-Migration...");
  SYSTEM_IDENTITY.network_trace.schema_status = 'MIGRATING';
  
  try {
    for (const def of SCHEMA_DEFINITIONS) {
      logDebug(`[SCHEMA] Verifying table: ${def.table}`);
      await pool.execute(def.query);
    }
    logDebug("[SCHEMA] Migration Complete. All systems operational.");
    SYSTEM_IDENTITY.network_trace.schema_status = 'SYNCED';
  } catch (err: any) {
    logDebug(`[SCHEMA] Migration Failed: ${err.message}`);
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

  // Default to localhost for Hostinger internal routing
  const targetHost = process.env.DB_HOST || 'localhost';
  SYSTEM_IDENTITY.network_trace.target_host = targetHost;
  
  const tcpStatus = await performNetworkScan(targetHost, Number(process.env.DB_PORT) || 3306);
  SYSTEM_IDENTITY.network_trace.tcp_port_3306 = tcpStatus;

  try {
    logDebug(`[DB] Attempting MySQL Protocol Handshake with ${targetHost}...`);
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
        host: targetHost
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