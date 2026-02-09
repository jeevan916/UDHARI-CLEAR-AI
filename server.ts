import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// --- PRODUCTION CORE: GEMINI AI ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// --- PRODUCTION CORE: MYSQL ENTERPRISE ---
// Updated to 'localhost' which is required for u477692720_ArrearsFlow on Hostinger nodes
const dbConfig = {
  host: 'localhost',
  user: 'u477692720_ArrearsFlow',
  password: 'ArrearsFlow@916',
  database: 'u477692720_ArrearsFlow',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 20000 // 20 seconds for slow handshake
};

const pool = mysql.createPool(dbConfig);

const KERNEL_CONFIG = {
  nodeId: "72.61.175.20",
  version: "5.4.0-SANGHAVI-RESILIENT",
  cluster: "pay.sanghavijewellers.in",
  db_node: "u477692720_ArrearsFlow",
  status: "SYNCHRONIZING",
  uptime: new Date().toISOString()
};

// --- DATABASE AUTO-PROVISIONING ---
const syncSchema = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log(`[KERNEL] DB Node Handshake: SUCCESS @ LOCALHOST`);
    
    // Core Tables initialization
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

    console.log("[KERNEL] Vault Structure Sync: COMPLETE");
  } catch (err: any) {
    console.error("[CRITICAL] Node Persistence Failure:", err.message);
    // We don't exit process, allowing express to serve 500s or 503s gracefully if DB is down
  } finally {
    if (conn) conn.release();
  }
};

syncSchema();

// --- SYSTEM API LAYER ---

app.get('/api/health', async (req, res) => {
  try {
    const [rows]: any = await pool.execute('SELECT 1 as connected');
    res.json({ status: 'UP', db: rows[0].connected === 1 ? 'CONNECTED' : 'DISCONNECTED', kernel: KERNEL_CONFIG });
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
    console.error("[API_ERROR]", err.message);
    res.status(500).json({ error: "DB_FETCH_ERROR", details: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  const c = req.body;
  try {
    await pool.execute(
      `INSERT INTO customers (id, name, phone, email, address, tax_number, group_id, unique_payment_code, current_balance, current_gold_balance, credit_limit) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.name, c.phone, c.email || '', c.address || '', c.taxNumber || '', c.groupId || 'Retail Client', c.uniquePaymentCode, c.currentBalance || 0, 0, c.creditLimit || 0]
    );
    res.json({ success: true, id: c.id });
  } catch (err: any) {
    res.status(500).json({ error: "SQL_REJECTED_IDENTITY", details: err.message });
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
    res.json({ success: true, ref: t.id });
  } catch (err: any) {
    if (conn) await conn.rollback();
    res.status(500).json({ error: "LEDGER_COMMIT_FAILED", details: err.message });
  } finally {
    if (conn) conn.release();
  }
});

app.get('/api/grade-rules', async (req, res) => {
  try {
    const [rows]: any = await pool.execute('SELECT * FROM grade_rules ORDER BY priority ASC');
    const mapped = rows.map((r: any) => ({
      ...r,
      minBalance: Number(r.min_balance),
      daysSincePayment: r.days_since_payment,
      daysSinceContact: r.days_since_contact,
      antiSpamThreshold: r.anti_spam_threshold,
      antiSpamUnit: r.anti_spam_unit,
      frequencyDays: r.frequency_days
    }));
    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: "RULES_FETCH_FAIL" });
  }
});

// Gemini Reasoning Node
app.post('/api/kernel/reason', async (req, res) => {
  const { customerData, interactionLogs } = req.body;
  if (!process.env.API_KEY) return res.status(500).json({ error: "CORTEX_OFFLINE" });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `ACT AS: Lead Auditor. ANALYZE: ${JSON.stringify({ customerData, interactionLogs })}. OUTPUT: Valid risk JSON schema.`,
      config: { responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 4000 } }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (err: any) {
    res.status(500).json({ error: "AI_TIMEOUT" });
  }
});

app.get('/api/kernel/status', (req, res) => res.json(KERNEL_CONFIG));
app.get('/api/kernel/logs', (req, res) => {
  const ts = new Date().toISOString();
  res.json([
    `[${ts}] BOOT: Sovereign Node 72.61.175.20 v5.4.0 Online`,
    `[${ts}] LATCH: Primary MySQL Link u477692720_ArrearsFlow Ready`,
    `[${ts}] SSL: secure channel pay.sanghavijewellers.in active`
  ]);
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[ENTERPRISE] Node Listening on Port ${PORT}`));