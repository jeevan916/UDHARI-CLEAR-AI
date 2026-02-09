import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'persistence.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// Enterprise System State (WORM Storage Simulation)
let KERNEL_STATE = {
  config: {
    nodeId: "139.59.10.70",
    version: "4.5.0-PRO",
    environment: "production",
    encryption: "AES-256-GCM"
  },
  credentials: {
    whatsapp: {
      PHONE_NUMBER_ID: '101607512732681',
      WABA_ID: '105647948987401',
      TOKEN: process.env.WHATSAPP_TOKEN || ''
    }
  }
};

const app = express();
app.use(cors());
app.use(express.json());

// --- GOOGLE GENAI KERNEL INITIALIZATION ---
// Strictly following the 2025 SDK guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// --- SECURE AI ENDPOINTS ---

app.post('/api/ai/analyze-risk', async (req, res) => {
  const { context } = req.body;
  if (!process.env.API_KEY) return res.status(500).json({ error: "Kernel API Key Missing" });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `ACT AS: Chief Risk Officer. ANALYZE LEDGER DATA: ${JSON.stringify(context)}. OUTPUT JSON: { "risk_level": "string", "justification": "string", "recommended_action": "string", "recovery_probability": number }`,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (err: any) {
    res.status(500).json({ error: "AI Kernel Interruption", message: err.message });
  }
});

app.post('/api/ai/draft-protocol', async (req, res) => {
  const { intent, customerName, balance } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Create a professional payment reminder for ${customerName} who owes ${balance}. Intent: ${intent}. Tone: Firm but Respectful. Use {{1}} for name and {{2}} for amount.`,
      config: {
        systemInstruction: "You are an automated debt recovery protocol agent."
      }
    });
    res.json({ draft: response.text });
  } catch (err: any) {
    res.status(500).json({ error: "Drafting Failed" });
  }
});

// --- SECURE COMMUNICATION PROXIES ---

app.post('/api/comms/whatsapp/send', async (req, res) => {
  const { to, content } = req.body;
  const { PHONE_NUMBER_ID, TOKEN } = KERNEL_STATE.credentials.whatsapp;
  
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to.replace(/\D/g, '').slice(-10),
        type: 'text',
        text: { body: content }
      },
      { headers: { 'Authorization': `Bearer ${TOKEN}` } }
    );
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: "Gateway Timeout", details: error.response?.data });
  }
});

// --- STATIC ASSET SERVING ---
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[ArrearsFlow] Kernel Synchronized on Node ${KERNEL_STATE.config.nodeId}`);
});