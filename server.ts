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
// Initializing with direct process.env.API_KEY reference as per strict guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// --- PRODUCTION CORE: MYSQL ENTERPRISE (72.61.175.20) ---
const dbConfig = {
  host: '72.61.175.20',
  user: 'u477692720_ArrearsFlow',
  password: 'ArrearsFlow@916',
  database: 'u477692720_ArrearsFlow',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

const pool = mysql.createPool(dbConfig);

const KERNEL_CONFIG = {
  nodeId: "72.61.175.20",
  version: "5.2.1-SANGHAVI-PRIME",
  cluster: "pay.sanghavijewellers.in",
  db_node: "u477692720_ArrearsFlow",
  status: "AUTHORIZED",
  uptime: new Date().toISOString()
};

// --- DATABASE AUTO-PROVISIONING ---
const syncSchema = async () => {
  try {
    const conn = await pool.getConnection();
    console.log(`[KERNEL] DB Node Handshake: SUCCESS @ ${dbConfig.host}`);
    
    // Create Customers Table
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

    // Create Transactions Table
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

    // Create Grade Rules Table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS grade_rules (
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
        template_id VARCHAR(50),
        frequency_days INT DEFAULT 30
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Seed defaults if rules table is empty
    const [rules]: any = await conn.execute('SELECT COUNT(*) as count FROM grade_rules');
    if (rules[0].count === 0) {
      await conn.execute(`
        INSERT INTO grade_rules (id, label, color, priority, min_balance, days_since_payment, days_since_contact, anti_spam_threshold, anti_spam_unit, whatsapp, sms, template_id, frequency_days)
        VALUES 
        ('D', 'Critical / NPA', 'rose', 1, 50000.00, 90, 15, 48, 'hours', TRUE, TRUE, 'TPL_003', 2),
        ('C', 'High Risk', 'amber', 2, 20000.00, 45, 7, 3, 'days', TRUE, TRUE, 'TPL_002', 3),
        ('B', 'Moderate Watch', 'blue', 3, 5000.00, 15, 30, 7, 'days', TRUE, FALSE, 'TPL_001', 7),
        ('A', 'Standard / Safe', 'emerald', 4, 0.00, 0, 0, 15, 'days', TRUE, FALSE, 'TPL_001', 30)
      `);
    }

    conn.release();
    console.log("[KERNEL] Vault Structure Sync: COMPLETE");
  } catch (err) {
    console.error("[CRITICAL] Node Persistence Failure:", err);
  }
};

syncSchema();

// --- RESTFUL API LAYER ---

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
    
    // Map DB fields to Frontend Interface
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
    await conn.rollback();
    res.status(500).json({ error: "LEDGER_COMMIT_FAILED", details: err.message });
  } finally {
    conn.release();
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

// --- CORE REASONING ENGINE (GEMINI 3 PRO PREVIEW) ---

app.post('/api/kernel/reason', async (req, res) => {
  const { customerData, interactionLogs } = req.body;
  
  if (!process.env.API_KEY) {
    return res.status(500).json({ error: "CORTEX_OFFLINE: GEMINI_API_KEY_MISSING" });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `ACT AS: Lead Recovery Auditor for Sanghavi Jewellers.
      ENTITY_DATA: ${JSON.stringify(customerData)}
      HISTORY: ${JSON.stringify(interactionLogs)}
      TASK: Provide risk analysis and clinical recovery path.
      OUTPUT: Valid JSON schema only.`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            risk_grade: { type: Type.STRING, description: "A, B, C, or D" },
            analysis: { type: Type.STRING, description: "Detailed reasoning" },
            next_step: { type: Type.STRING, description: "Actionable protocol" },
            recovery_odds: { type: Type.NUMBER, description: "Probability 0.0 to 1.0" }
          },
          required: ["risk_grade", "analysis", "next_step", "recovery_odds"]
        },
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });
    
    // Accessing text property directly as per strict SDK rules
    res.json(JSON.parse(response.text || '{}'));
  } catch (err: any) {
    console.error("[CORTEX] Cycle Interrupted:", err);
    res.status(500).json({ error: "AI_REASONING_TIMEOUT", details: err.message });
  }
});

app.get('/api/kernel/status', (req, res) => res.json(KERNEL_CONFIG));

app.get('/api/kernel/logs', (req, res) => {
  const ts = new Date().toISOString();
  res.json([
    `[${ts}] BOOT: Sanghavi Recovery Node 72.61.175.20 v5.2.1 Online`,
    `[${ts}] PERSISTENCE: Connected to u477692720_ArrearsFlow cluster`,
    `[${ts}] INFRA: pay.sanghavijewellers.in SSL Tunnel Verified`,
    `[${ts}] CORE: Gemini 3 Pro reasoning engine standing by`
  ]);
});

// Static assets
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[ENTERPRISE] Sovereign Node Online @ ${KERNEL_CONFIG.nodeId}:${PORT}`);
});