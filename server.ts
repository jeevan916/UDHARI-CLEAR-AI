
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

// --- CORTEX ENGINE (Gemini 3 Pro) ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- DATABASE PERSISTENCE LAYER ---
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'u477692720_ArrearsFlow',
  password: process.env.DB_PASSWORD || 'ArrearsFlow@916',
  database: process.env.DB_NAME || 'sanghavi_recovery',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 50,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

const pool = mysql.createPool(dbConfig);

const SYSTEM_IDENTITY = {
  environment: "PRODUCTION_CORE",
  version: "5.5.0-ENTERPRISE",
  status: "INITIALIZING",
  region: "PRIMARY_CLUSTER"
};

// --- BOOT SEQUENCE ---
const bootSystem = async () => {
  try {
    const conn = await pool.getConnection();
    console.log(`[SYSTEM] DATABASE_LINK: Established.`);
    
    // Core Ledger Schema Integrity
    await conn.execute(`CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) UNIQUE NOT NULL,
      unique_payment_code VARCHAR(20) UNIQUE NOT NULL, current_balance DECIMAL(15,2) DEFAULT 0,
      current_gold_balance DECIMAL(15,3) DEFAULT 0, is_active BOOLEAN DEFAULT TRUE,
      grade VARCHAR(5) DEFAULT 'A'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    SYSTEM_IDENTITY.status = "OPERATIONAL";
    conn.release();
  } catch (err: any) {
    SYSTEM_IDENTITY.status = "DEGRADED";
    console.error(`[CRITICAL] BOOT_FAILURE: ${err.message}`);
  }
};

bootSystem();

// --- API ROUTES ---

app.get('/api/system/health', (req: Request, res: Response) => res.json(SYSTEM_IDENTITY));

app.get('/api/customers', async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.execute('SELECT * FROM customers ORDER BY current_balance DESC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: "LEDGER_READ_ERROR", details: err.message });
  }
});

app.post('/api/kernel/reason', async (req: Request, res: Response) => {
  const { customerData, interactions } = req.body;
  if (!process.env.API_KEY) return res.status(503).json({ error: "INTELLIGENCE_OFFLINE" });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `PERFORM FINANCIAL AUDIT: ${JSON.stringify({ customerData, interactions })}. Task: Generate deterministic recovery roadmap in JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            risk_score: { type: Type.NUMBER, description: "Scale 0-100" },
            risk_level: { type: Type.STRING, description: "LOW, MEDIUM, HIGH, CRITICAL" },
            analysis: { type: Type.STRING },
            action_plan: { type: Type.STRING }
          },
          required: ["risk_score", "risk_level", "analysis", "action_plan"]
        },
        thinkingConfig: { thinkingBudget: 4000 } as any
      }
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (err: any) {
    console.error(`[CORTEX] Reasoning Failure: ${err.message}`);
    res.status(500).json({ error: "REASONING_CYCLE_FAILED" });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req: Request, res: Response) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[CORE] Enterprise Platform Active on Port ${PORT}`));
