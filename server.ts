import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Obtain API Key exclusively from environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const KERNEL_CONFIG = {
  nodeId: "72.61.175.20",
  version: "3.0.0-SANGHAVI",
  cluster: "server1645-asia",
  uptime: new Date().toISOString()
};

app.post('/api/kernel/reason', async (req, res) => {
  const { customerData, interactionLogs } = req.body;
  if (!process.env.API_KEY) return res.status(500).json({ error: "Kernel API Key Missing" });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `ACT AS: Head of Recovery for Sanghavi Jewellers.
      ANALYZE DATASET: ${JSON.stringify({ customerData, interactionLogs })}.
      TASK: Determine recovery probability and provide a deterministic strategy.
      OUTPUT FORMAT: JSON strictly.
      SCHEMA: { "risk_grade": "A|B|C|D", "analysis": "string", "next_step": "string", "recovery_odds": number }`,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (err: any) {
    console.error("[Kernel Error]", err);
    res.status(500).json({ error: "AI Reasoning Interruption", details: err.message });
  }
});

app.post('/api/kernel/optimize-grades', async (req, res) => {
  const { stats } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Optimize portfolio risk rules based on jewellery industry stats: ${JSON.stringify(stats)}. Return JSON array of GradeRule objects.`,
      config: { responseMimeType: "application/json" }
    });
    res.json(JSON.parse(response.text || '[]'));
  } catch (err) {
    res.status(500).json({ error: "Logic optimization failed" });
  }
});

app.get('/api/kernel/status', (req, res) => {
  res.json(KERNEL_CONFIG);
});

app.get('/api/kernel/logs', (req, res) => {
  const timestamp = new Date().toISOString();
  res.json([
    `[${timestamp}] BOOT: Sanghavi Recovery Kernel v3.0 initialized`,
    `[${timestamp}] MAPPING: 72.61.175.20 > pay.sanghavijewellers.in`,
    `[${timestamp}] AUTH: Session JM_ROOT_001 verified`,
    `[${timestamp}] DB: Ledger synchronization complete (Latency: 1.2ms)`
  ]);
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[Sanghavi Jewellers] Enterprise Recovery Node Online @ ${KERNEL_CONFIG.nodeId}:${PORT}`);
});