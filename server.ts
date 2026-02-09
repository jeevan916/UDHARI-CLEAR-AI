
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

// Gemini AI Initialization
/* Always use process.env.API_KEY directly as a named parameter per Gemini SDK guidelines */
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// MySQL Connection Pool (Production Grade)
const dbConfig = {
  host: process.env.DB_HOST || '72.61.175.20',
  user: process.env.DB_USER || 'u477692720_recovery',
  password: process.env.DB_PASSWORD || 'sanghavi_db_pass',
  database: process.env.DB_NAME || 'sanghavi_recovery',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

const KERNEL_CONFIG = {
  nodeId: "72.61.175.20",
  version: "3.1.0-SANGHAVI-PERSISTENT",
  cluster: "server1645-asia",
  uptime: new Date().toISOString()
};

// --- DATA PERSISTENCE API ---

// GET All Customers
app.get('/api/customers', async (req, res) => {
  try {
    const [rows]: any = await pool.execute(`
      SELECT c.*, 
      (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', t.id, 'type', t.type, 'unit', t.unit, 'amount', t.amount, 'date', t.date, 'description', t.description, 'balanceAfter', t.balance_after)) 
       FROM transactions t WHERE t.customer_id = c.id ORDER BY t.date DESC LIMIT 50) as transactions
      FROM customers c
    `);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST New Customer
app.post('/api/customers', async (req, res) => {
  const c = req.body;
  try {
    await pool.execute(
      `INSERT INTO customers (id, name, phone, email, address, tax_number, group_id, unique_payment_code, current_balance, current_gold_balance, credit_limit) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.name, c.phone, c.email, c.address, c.taxNumber, c.groupId, c.uniquePaymentCode, c.currentBalance, 0, c.creditLimit || 0]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST New Transaction
app.post('/api/transactions', async (req, res) => {
  const t = req.body;
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 1. Insert Transaction
      await connection.execute(
        `INSERT INTO transactions (id, customer_id, type, unit, amount, method, description, date, staff_id, balance_after) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [t.id, t.customerId, t.type, t.unit, t.amount, t.method, t.description, t.date, t.staffId, t.balanceAfter]
      );

      // 2. Update Customer Balance
      if (t.unit === 'money') {
        const op = t.type === 'debit' ? '+' : '-';
        await connection.execute(`UPDATE customers SET current_balance = current_balance ${op} ? WHERE id = ?`, [t.amount, t.customerId]);
      } else {
        const op = t.type === 'debit' ? '+' : '-';
        await connection.execute(`UPDATE customers SET current_gold_balance = current_gold_balance ${op} ? WHERE id = ?`, [t.amount, t.customerId]);
      }

      await connection.commit();
      res.json({ success: true });
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Grade Rules
app.get('/api/grade-rules', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM grade_rules ORDER BY priority ASC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- AI KERNEL ---

app.post('/api/kernel/reason', async (req, res) => {
  const { customerData, interactionLogs } = req.body;
  if (!process.env.API_KEY) return res.status(500).json({ error: "Kernel API Key Missing" });

  try {
    /* Using ai.models.generateContent with appropriate model name and thinking configuration */
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `ACT AS: Head of Recovery for Sanghavi Jewellers.
      ANALYZE DATASET: ${JSON.stringify({ customerData, interactionLogs })}.
      TASK: Determine recovery probability and provide a deterministic strategy.
      OUTPUT FORMAT: JSON strictly.`,
      config: { 
        responseMimeType: "application/json",
        /* responseSchema ensures structured and reliable JSON output from the model */
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            risk_grade: {
              type: Type.STRING,
              description: 'The risk classification: A, B, C, or D.',
            },
            analysis: {
              type: Type.STRING,
              description: 'Reasoning behind the risk grade.',
            },
            next_step: {
              type: Type.STRING,
              description: 'The recommended clinical next action for recovery.',
            },
            recovery_odds: {
              type: Type.NUMBER,
              description: 'Probability of recovery between 0 and 1.',
            },
          },
          required: ["risk_grade", "analysis", "next_step", "recovery_odds"],
        },
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });
    /* response.text returns the generated string output as a property */
    res.json(JSON.parse(response.text || '{}'));
  } catch (err: any) {
    console.error("[Kernel Error]", err);
    res.status(500).json({ error: "AI Reasoning Interruption", details: err.message });
  }
});

app.get('/api/kernel/status', (req, res) => {
  res.json(KERNEL_CONFIG);
});

app.get('/api/kernel/logs', (req, res) => {
  const timestamp = new Date().toISOString();
  res.json([
    `[${timestamp}] BOOT: Sanghavi Recovery Kernel v3.1 initialized`,
    `[${timestamp}] PERSISTENCE: MySQL Cluster connected @ ${dbConfig.host}`,
    `[${timestamp}] DB: Sovereign tables synchronized`
  ]);
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[Sanghavi Jewellers] Sovereign Recovery Node Online @ ${KERNEL_CONFIG.nodeId}:${PORT}`);
});
