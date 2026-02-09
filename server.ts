
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// --- SECURE KERNEL INITIALIZATION ---
// Always use process.env.API_KEY directly for initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const KERNEL_CONFIG = {
  nodeId: "139.59.10.70",
  version: "4.5.2-STABLE",
  uptime: new Date().toISOString()
};

// --- SECURE AI ENDPOINTS ---

app.post('/api/kernel/reason', async (req, res) => {
  const { customerData, interactionLogs } = req.body;
  if (!process.env.API_KEY) return res.status(500).json({ error: "Kernel API Key Missing" });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `ACT AS: Debt Recovery Strategist. 
      ANALYZE DATA: ${JSON.stringify({ customerData, interactionLogs })}. 
      OUTPUT JSON: { 
        "risk_grade": "A|B|C|D", 
        "analysis": "string", 
        "next_step": "string", 
        "recovery_odds": number 
      }`,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 1500 }
      }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (err: any) {
    res.status(500).json({ error: "AI reasoning failed", details: err.message });
  }
});

// Added optimize-grades endpoint
app.post('/api/kernel/optimize-grades', async (req, res) => {
  const { stats } = req.body;
  if (!process.env.API_KEY) return res.status(500).json({ error: "Kernel API Key Missing" });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `ACT AS: Financial Risk Architect. 
      OPTIMIZE: Debt collection grade rules based on portfolio stats: ${JSON.stringify(stats)}.
      OUTPUT JSON ARRAY of GradeRule: [
        { "id": "A|B|C|D", "label": "string", "color": "emerald|blue|amber|rose", "priority": number, "minBalance": number, "daysSincePayment": number, "daysSinceContact": number, "antiSpamThreshold": number, "antiSpamUnit": "hours|days", "whatsapp": boolean, "sms": boolean, "templateId": "string", "frequencyDays": number }
      ]. Ensure priorities are 1(D) to 4(A).`,
      config: { 
        responseMimeType: "application/json",
      }
    });
    res.json(JSON.parse(response.text || '[]'));
  } catch (err: any) {
    res.status(500).json({ error: "Optimization failed", details: err.message });
  }
});

// Added smart-template endpoint
app.post('/api/kernel/smart-template', async (req, res) => {
  const { intent, category } = req.body;
  if (!process.env.API_KEY) return res.status(500).json({ error: "Kernel API Key Missing" });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Draft a ${category} message for intent: ${intent}. 
      Return JSON: { "content": "string with {{1}} for name, {{2}} for balance", "suggestedButtons": ["string"], "suggestedName": "snake_case_name" }`,
      config: { 
        responseMimeType: "application/json",
      }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (err: any) {
    res.status(500).json({ error: "Template generation failed" });
  }
});

// Added optimize-content endpoint
app.post('/api/kernel/optimize-content', async (req, res) => {
  const { content, context } = req.body;
  if (!process.env.API_KEY) return res.status(500).json({ error: "Kernel API Key Missing" });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Optimize this debt recovery message: "${content}" for context: "${context}". 
      Keep variables like {{1}}, {{2}} intact. 
      Return JSON: { "optimizedContent": "string" }`,
      config: { 
        responseMimeType: "application/json",
      }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (err: any) {
    res.status(500).json({ error: "Content optimization failed" });
  }
});

app.post('/api/kernel/draft-protocol', async (req, res) => {
  const { intent, customerName, balance } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Draft a ${intent} message for ${customerName} owing ${balance}. 
      Tone: Enterprise Professional. Formatting: Use *bold* for emphasis. 
      Variables: Use {{1}} for Name, {{2}} for Balance.`,
    });
    res.json({ draft: response.text });
  } catch (err) {
    res.status(500).json({ error: "Drafting engine failure" });
  }
});

// --- INFRASTRUCTURE PROXIES ---

app.get('/api/kernel/status', (req, res) => {
  res.json(KERNEL_CONFIG);
});

// Mocking some system logs for the terminal interface
app.get('/api/kernel/logs', (req, res) => {
  res.json([
    `[${new Date().toISOString()}] NODE_BOOT: Kernel v4.5.2 active on 139.59.10.70`,
    `[${new Date().toISOString()}] HANDSHAKE: API Gateway synced with Meta Cloud`,
    `[${new Date().toISOString()}] DB_WATCH: Ledger clusters healthy`,
    `[${new Date().toISOString()}] SEC_AUDIT: All transactions AES-256 encrypted`
  ]);
});

// --- PRODUCTION SERVING ---
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[ArrearsFlow] Kernel Synchronized on Node ${KERNEL_CONFIG.nodeId}`);
});
