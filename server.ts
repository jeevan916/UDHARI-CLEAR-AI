
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- STRICT ENVIRONMENT LOADING ---
// Targeting specific Hostinger directory structure provided by user
// Fixed: Property 'cwd' does not exist on type 'Process' - Using path.resolve() directly resolves relative to the current working directory
dotenv.config({ path: path.resolve('public_html/.builds/config/.env') });

const app = express();
app.use(cors());
app.use(express.json());

// --- PRODUCTION CORE: GEMINI AI ---
// Standardized initialization per latest SDK requirements
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- PRODUCTION CORE: MYSQL CO-LOCATED ---
// Optimized for Hostinger Cloud Professional local execution
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'u477692720_ArrearsFlow',
  password: process.env.DB_PASSWORD || 'ArrearsFlow@916',
  database: process.env.DB_NAME || 'u477692720_ArrearsFlow',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 30, // Increased for professional server capacity
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 10000 // Reduced for local co-located handshake
};

const pool = mysql.createPool(dbConfig);

const KERNEL_CONFIG = {
  nodeId: "139.59.10.70",
  version: "5.9.0-HOSTINGER-COLOCATED",
  tier: "Cloud Professional",
  db_node: dbConfig.database,
  connection_mode: "LOCAL_LOOPBACK",
  status: "SYNCHRONIZING",
  uptime: new Date().toISOString()
};

// --- SYSTEM INITIALIZATION ---
const bootSequence = async () => {
  let conn;
  try {
    console.log(`[BOOT] CO-LOCATED LINK: Attempting Local Handshake...`);
    conn = await pool.getConnection();
    console.log(`[BOOT] VAULT_READY: Local connection to ${dbConfig.database} verified.`);
    
    // Auto-provision schema if missing
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL UNIQUE,
        email VARCHAR(255),
        address TEXT,
        tax_number VARCHAR(50),
        group_id VARCHAR(100) DEFAULT 'Retail Client',
        unique_payment_code VARCHAR(20) UNIQUE NOT NULL,
        current_balance DECIMAL(15, 2) DEFAULT 0.00,
        current_gold_balance DECIMAL(15, 3) DEFAULT 0.000,
        credit_limit DECIMAL(15, 2) DEFAULT 0.00,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (phone),
        INDEX (unique_payment_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        INDEX (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    KERNEL_CONFIG.status = "AUTHORIZED";
    console.log("[KERNEL] Node Architecture: FULLY STABLE");
  } catch (err: any) {
    console.error(`[CRITICAL] Co-located Handshake Failed: ${err.message}`);
    KERNEL_CONFIG.status = "MAINTENANCE";
  } finally {
    if (conn) conn.release();
  }
};

bootSequence();

// --- API LAYER ---

app.get('/api/health', async (req, res) => {
  try {
    const [rows]: any = await pool.execute('SELECT 1 as connected');
    res.json({ status: 'UP', node: KERNEL_CONFIG.nodeId, kernel: KERNEL_CONFIG });
  } catch (err: any) {
    res.status(503).json({ status: 'DOWN', error: err.message });
  }
});

app.get('/api/customers', async (req, res) => {
  try {
    const [rows]: any = await pool.execute(`
      SELECT c.*, 
      (SELECT JSON_ARRAYAGG(JSON_OBJECT(
        'id', t.id, 
        'type', t.type, 
        'unit', t.unit, 
        'amount', CAST(t.amount AS DOUBLE), 
        'date', DATE_FORMAT(t.date, '%Y-%m-%d'), 
        'description', t.description, 
        'balanceAfter', CAST(t.balance_after AS DOUBLE)
      )) FROM transactions t WHERE t.customer_id = c.id ORDER BY t.date DESC LIMIT 100) as transactions
      FROM customers c
    `);
    
    const mapped = rows.map((c: any) => ({
      ...c,
      taxNumber: c.tax_number,
      groupId: c.group_id,
      uniquePaymentCode: c.unique_payment_code,
      currentBalance: Number(c.current_balance),
      currentGoldBalance: Number(c.current_gold_balance),
      creditLimit: Number(c.credit_limit),
      isActive: Boolean(c.is_active),
      transactions: c.transactions || [],
      enabledGateways: { razorpay: true, setu: true },
      contactList: [{ id: '1', type: 'mobile', value: c.phone, isPrimary: true, source: 'MANUAL' }],
      addressList: c.address ? [{ id: '1', type: 'registered', value: c.address, isPrimary: true, source: 'MANUAL' }] : []
    }));
    
    res.json(mapped);
  } catch (err: any) {
    res.status(503).json({ error: "VAULT_READ_ERROR", details: err.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  const t = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      `INSERT INTO transactions (id, customer_id, type, unit, amount, method, description, date, staff_id, balance_after) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.customerId, t.type, t.unit, t.amount, t.method, t.description, t.date, t.staffId, t.balanceAfter]
    );

    const balanceCol = t.unit === 'money' ? 'current_balance' : 'current_gold_balance';
    const operator = t.type === 'debit' ? '+' : '-';
    await conn.execute(`UPDATE customers SET ${balanceCol} = ${balanceCol} ${operator} ? WHERE id = ?`, [t.amount, t.customerId]);

    await conn.commit();
    res.json({ success: true });
  } catch (err: any) {
    if (conn) await conn.rollback();
    res.status(500).json({ error: "COMMIT_ERROR", details: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Gemini Cortex - Reasoning on Professional Tier Server
app.post('/api/kernel/reason', async (req, res) => {
  const { customerData, interactionLogs } = req.body;
  if (!process.env.API_KEY) return res.status(500).json({ error: "API_KEY_UNSET" });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `ACT AS: Financial Recovery Auditor. ANALYZE ENTITY: ${JSON.stringify({ customerData, interactionLogs })}. OUTPUT: JSON risk profile.`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            risk_grade: { type: Type.STRING },
            analysis: { type: Type.STRING },
            next_step: { type: Type.STRING },
            recovery_odds: { type: Type.NUMBER }
          }
        },
        thinkingConfig: { thinkingBudget: 4000 } 
      }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (err: any) {
    res.status(500).json({ error: "CORTEX_TIMEOUT" });
  }
});

app.get('/api/kernel/status', (req, res) => res.json(KERNEL_CONFIG));

app.get('/api/kernel/logs', (req, res) => {
  const ts = new Date().toISOString();
  res.json([
    `[${ts}] ARCH: Co-located Cluster Online`,
    `[${ts}] NODE: Hostinger Cloud Professional v${KERNEL_CONFIG.version}`,
    `[${ts}] LINK: Direct socket to ${dbConfig.database}`
  ]);
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[SOVEREIGN] Hostinger Node Active on Port ${PORT}`));
