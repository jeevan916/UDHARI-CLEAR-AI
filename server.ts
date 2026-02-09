
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1', // Using IP instead of localhost for reliability
  user: process.env.DB_USER || 'u477692720_ArrearsFlow',
  password: process.env.DB_PASSWORD || 'ArrearsFlow@916',
  database: process.env.DB_NAME || 'sanghavi_recovery',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

const pool = mysql.createPool(dbConfig);

const SYSTEM_IDENTITY = {
  environment: "PRODUCTION_CORE",
  version: "6.1.0-ENTERPRISE-STABLE",
  status: "INITIALIZING",
  db_health: "DISCONNECTED",
  error_trace: null as string | null
};

// --- SCHEMA INITIALIZATION (Auto-Migration) ---
const initializeSchema = async (conn: mysql.PoolConnection) => {
  console.log('[SYSTEM] Verifying Database Schema...');
  
  await conn.execute(`CREATE TABLE IF NOT EXISTS customers (
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
    INDEX idx_upc (unique_payment_code),
    INDEX idx_phone (phone)
  )`);

  await conn.execute(`CREATE TABLE IF NOT EXISTS transactions (
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
    INDEX idx_cust_date (customer_id, date),
    INDEX idx_global_date (date)
  )`);
};

const bootSystem = async (retries = 5, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await pool.getConnection();
      console.log(`[SYSTEM] DATABASE_LINK: Established on attempt ${i + 1}.`);
      
      await initializeSchema(conn);
      
      SYSTEM_IDENTITY.status = "OPERATIONAL";
      SYSTEM_IDENTITY.db_health = "CONNECTED";
      SYSTEM_IDENTITY.error_trace = null;
      conn.release();
      return;
    } catch (err: any) {
      console.error(`[CRITICAL] DB Connection Attempt ${i + 1} Failed: ${err.message}`);
      SYSTEM_IDENTITY.error_trace = err.message;
      if (i < retries - 1) {
        await new Promise(res => setTimeout(res, delay));
        delay *= 2;
      } else {
        SYSTEM_IDENTITY.status = "DEGRADED";
        SYSTEM_IDENTITY.db_health = "FAILED";
      }
    }
  }
};

bootSystem();

// --- HEALTH & DIAGNOSTICS ---
app.get('/api/system/health', (req, res) => res.json(SYSTEM_IDENTITY));

// --- PAGINATED LEDGER API ---
app.get('/api/ledger/global', async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : null;

    let query = `
      SELECT t.*, c.name as customerName, c.unique_payment_code as upc
      FROM transactions t
      JOIN customers c ON t.customer_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (c.name LIKE ? OR t.description LIKE ? OR c.unique_payment_code LIKE ?)`;
      params.push(search, search, search);
    }

    query += ` ORDER BY t.date DESC, t.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows]: any = await pool.execute(query, params);
    
    let countQuery = `SELECT COUNT(*) as total FROM transactions t JOIN customers c ON t.customer_id = c.id WHERE 1=1`;
    const countParams: any[] = [];
    if (search) {
      countQuery += ` AND (c.name LIKE ? OR t.description LIKE ? OR c.unique_payment_code LIKE ?)`;
      countParams.push(search, search, search);
    }
    const [countRow]: any = await pool.execute(countQuery, countParams);

    res.json({
      data: rows,
      meta: {
        total: countRow[0].total,
        page,
        limit,
        totalPages: Math.ceil(countRow[0].total / limit)
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: "LEDGER_SCALING_ERROR", details: err.message });
  }
});

app.get('/api/customers', async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.execute('SELECT * FROM customers ORDER BY name ASC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: "DATABASE_QUERY_ERROR", details: err.message });
  }
});

app.post('/api/kernel/reason', async (req: Request, res: Response) => {
  const { customerData, interactions } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `AUDIT: ${JSON.stringify({ customerData, interactions })}. Task: Strategic recovery roadmap in JSON.`,
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
  } catch (err: any) {
    res.status(500).json({ error: "AI_REASONING_FAILED" });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req: Request, res: Response) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[CORE] Scaled Platform Active on Port ${PORT}`));
