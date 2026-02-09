import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- HOSTINGER CLOUD CONFIGURATION ---
// Targeting co-located environment config
dotenv.config({ path: path.resolve('public_html/.builds/config/.env') });

const app = express();
app.use(cors());
app.use(express.json());

// --- GEMINI 3 PRO INITIALIZATION ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- CO-LOCATED MYSQL VAULT (LOCAL LOOPBACK) ---
const dbConfig = {
  host: '127.0.0.1', // Low-latency local socket connection
  user: process.env.DB_USER || 'u477692720_ArrearsFlow',
  password: process.env.DB_PASSWORD || 'ArrearsFlow@916',
  database: process.env.DB_NAME || 'u477692720_ArrearsFlow',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 30,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

const pool = mysql.createPool(dbConfig);

const KERNEL_STATUS = {
  nodeId: "139.59.10.70",
  cluster: "Hostinger Cloud Professional",
  database_link: "127.0.0.1",
  status: "INITIALIZING",
  version: "3.5.0-PRO"
};

// Initialize DB and ensure schema integrity
const bootSystem = async () => {
  try {
    const conn = await pool.getConnection();
    console.log(`[BOOT] VAULT_READY: Local connection to ${dbConfig.database} verified via 127.0.0.1`);
    
    // Core Schema Logic
    await conn.execute(`CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) NOT NULL UNIQUE,
      unique_payment_code VARCHAR(20) UNIQUE NOT NULL, current_balance DECIMAL(15,2) DEFAULT 0,
      current_gold_balance DECIMAL(15,3) DEFAULT 0, is_active BOOLEAN DEFAULT TRUE,
      grade VARCHAR(5) DEFAULT 'A'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(50) PRIMARY KEY, customer_id VARCHAR(50) NOT NULL,
      type ENUM('credit', 'debit') NOT NULL, unit ENUM('money', 'gold') DEFAULT 'money',
      amount DECIMAL(15,3) NOT NULL, date DATE NOT NULL, description TEXT,
      balance_after DECIMAL(15,3), INDEX(customer_id)
    ) ENGINE=InnoDB`);

    KERNEL_STATUS.status = "OPERATIONAL";
    conn.release();
  } catch (err: any) {
    KERNEL_STATUS.status = "DEGRADED";
    console.error(`[CRITICAL] BOOT_FAILURE: ${err.message}`);
  }
};

bootSystem();

// --- AUTHORITY API LAYER ---

app.get('/api/kernel/health', (req, res) => res.json(KERNEL_STATUS));

app.get('/api/customers', async (req, res) => {
  try {
    const [rows]: any = await pool.execute('SELECT * FROM customers');
    // Map data for enterprise-grade UI consumption
    res.json(rows.map((r: any) => ({
      ...r,
      enabledGateways: { razorpay: true, setu: true },
      contactList: [{ id: 'primary', value: r.phone, type: 'mobile', isPrimary: true }],
      addressList: [], fingerprints: [], transactions: []
    })));
  } catch (err: any) {
    res.status(500).json({ error: "VAULT_ACCESS_ERROR", details: err.message });
  }
});

app.post('/api/kernel/reason', async (req, res) => {
  const { customerData, interactionLogs } = req.body;
  if (!process.env.API_KEY) return res.status(503).json({ error: "CORTEX_OFFLINE" });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `PERFORM AUDIT: ${JSON.stringify({ customerData, interactionLogs })}. Role: Chief Recovery Officer. Task: Generate recovery roadmap in JSON.`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.NUMBER, description: "Percentage of loss risk 0-100" },
            riskLevel: { type: Type.STRING, description: "LOW, MEDIUM, HIGH, CRITICAL" },
            analysis: { type: Type.STRING, description: "Detailed behavioral analysis" },
            recommendedAction: { type: Type.STRING, description: "Immediate next step" }
          },
          required: ["riskScore", "riskLevel", "analysis", "recommendedAction"]
        },
        thinkingConfig: { thinkingBudget: 4000 } 
      }
    });
    
    // Proper extraction from property per instructions
    res.json(JSON.parse(response.text || '{}'));
  } catch (err: any) {
    console.error("[CORTEX] Reasoning Failure:", err);
    res.status(500).json({ error: "REASONING_INTERRUPTED" });
  }
});

// Static hosting for Hostinger Deployment
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[SOVEREIGN] Hostinger Node 139.59.10.70 operational on port ${PORT}`));