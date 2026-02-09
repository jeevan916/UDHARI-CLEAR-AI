
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
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'u477692720_ArrearsFlow',
  password: process.env.DB_PASSWORD || 'ArrearsFlow@916',
  database: process.env.DB_NAME || 'sanghavi_recovery',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 50, // Increased for concurrent ledger reads
  queueLimit: 0,
  enableKeepAlive: true
};

const pool = mysql.createPool(dbConfig);

const SYSTEM_IDENTITY = {
  environment: "PRODUCTION_CORE",
  version: "6.0.0-ENTERPRISE-SCALED",
  status: "INITIALIZING",
  region: "PRIMARY_CLUSTER"
};

const bootSystem = async (retries = 5, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await pool.getConnection();
      console.log(`[SYSTEM] DATABASE_LINK: Scaled core active on attempt ${i + 1}.`);
      SYSTEM_IDENTITY.status = "OPERATIONAL";
      conn.release();
      return;
    } catch (err: any) {
      console.error(`[CRITICAL] DB Failed: ${err.message}`);
      if (i < retries - 1) {
        await new Promise(res => setTimeout(res, delay));
        delay *= 2;
      }
    }
  }
};

bootSystem();

// --- PAGINATED LEDGER API ---
app.get('/api/ledger/global', async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : null;
    const startDate = req.query.startDate || '1970-01-01';
    const endDate = req.query.endDate || '2099-12-31';

    let query = `
      SELECT t.*, c.name as customerName, c.unique_payment_code as upc
      FROM transactions t
      JOIN customers c ON t.customer_id = c.id
      WHERE (t.date BETWEEN ? AND ?)
    `;
    const params: any[] = [startDate, endDate];

    if (search) {
      query += ` AND (c.name LIKE ? OR t.description LIKE ? OR c.unique_payment_code LIKE ?)`;
      params.push(search, search, search);
    }

    query += ` ORDER BY t.date DESC, t.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows]: any = await pool.execute(query, params);
    
    // Get total count for pagination metadata
    let countQuery = `SELECT COUNT(*) as total FROM transactions t JOIN customers c ON t.customer_id = c.id WHERE (t.date BETWEEN ? AND ?)`;
    const countParams: any[] = [startDate, endDate];
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
    res.status(500).json({ error: "FETCH_ERROR" });
  }
});

app.post('/api/kernel/reason', async (req: Request, res: Response) => {
  const { customerData, interactions } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `AUDIT: ${JSON.stringify({ customerData, interactions })}. Task: Strategic recovery JSON.`,
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
    res.status(500).json({ error: "REASONING_ERROR" });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req: Request, res: Response) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[CORE] Scaled Platform Port ${PORT}`));
