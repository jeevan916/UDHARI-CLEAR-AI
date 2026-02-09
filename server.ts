import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";

// Configure Environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini (Ensure process.env.API_KEY is set in Hostinger Environment Variables)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Build Memory Store
let BUILD_MEMORY = {
  buildId: "AF-ENT-NODE-001",
  version: "2.2.0-STABLE",
  primaryColor: "#007bff",
  navigationTree: ["Dashboard", "Transactions", "Customers", "Communication", "Staff", "Reports", "Miscellaneous"],
  mandatoryModules: ["TemplateArchitect", "DualColumnLedger", "ExtendedCustomerProfile", "RiskGradingEngine"],
  coreDesignElements: ["BlueHeroHeader", "SideBarHierarchy", "ModalForms", "GeminiAiStrategist"],
  lastUpdate: new Date().toISOString(),
  serverNode: "139.59.10.70"
};

// --- API ROUTES ---

// 1. Memory Sync
app.get('/api/system/memory', (req, res) => {
  res.json(BUILD_MEMORY);
});

app.post('/api/system/memory/commit', (req, res) => {
  BUILD_MEMORY = { ...BUILD_MEMORY, ...req.body, lastUpdate: new Date().toISOString() };
  res.json({ status: "committed", memory: BUILD_MEMORY });
});

// 2. Meta Infrastructure Proxy (Mock)
app.get('/api/infrastructure/templates', async (req, res) => {
  const synced = [
    { id: 'tpl_1', name: 'AURAGOLD_ORDER_CONFIRMATION', content: 'Order confirmed for {{1}}.', category: 'UTILITY', status: 'synced' },
    { id: 'tpl_2', name: 'AURAGOLD_PAYMENT_REQUEST', content: 'Payment due for {{1}} of {{2}}.', category: 'UTILITY', status: 'synced' }
  ];
  res.json(synced);
});

// --- SECURE AI ENDPOINTS ---

const handleAiError = (res: any, error: any) => {
  console.error("AI Error:", error);
  res.status(500).json({ error: 'AI Processing Failed', details: error.message });
};

// 3. Strategy Generator
app.post('/api/ai/strategy', async (req, res) => {
  const { prompt } = req.body;
  if (!process.env.API_KEY) return res.status(500).json({ error: 'API_KEY missing on server' });
  
  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // Schema is complex, defined in service prompt usually, but here we expect JSON string
      }
    });
    res.json(JSON.parse(result.text || '{}'));
  } catch (err) { handleAiError(res, err); }
});

// 4. Template Generator (Smart)
app.post('/api/ai/template/smart', async (req, res) => {
  const { prompt, category } = req.body;
  if (!process.env.API_KEY) return res.status(500).json({ error: 'API_KEY missing on server' });

  try {
    const geminiPrompt = `
         Create a WhatsApp Business Template message.
         Context: Debt Collection / Payment Reminder / Customer Service.
         Category: ${category}
         User Intent: ${prompt}
         
         Requirements:
         1. Use {{1}}, {{2}} format for variables.
         2. Use *bold* for key details.
         3. Suggest 2 relevant buttons.
         4. Suggest a snake_case system name starting with 'credit_flow_'.
         
         Output JSON: { "content": "string", "buttons": ["btn1", "btn2"], "suggestedName": "string" }
    `;
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview",
      contents: geminiPrompt,
      config: { responseMimeType: "application/json" }
    });
    res.json(JSON.parse(result.text || '{}'));
  } catch (err) { handleAiError(res, err); }
});

// 5. Template Optimizer
app.post('/api/ai/template/optimize', async (req, res) => {
  const { content, context } = req.body;
  if (!process.env.API_KEY) return res.status(500).json({ error: 'API_KEY missing on server' });

  try {
    const geminiPrompt = `
         ACT AS: Conversion Optimization Specialist.
         TASK: Rewrite the following WhatsApp message to be more effective for: "${context}".
         CURRENT CONTENT: "${content}"
         RULES: Preserve {{1}}, {{2}} variables. Improve tone. Output raw text only.
    `;
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: geminiPrompt
    });
    res.json({ content: result.text?.trim() });
  } catch (err) { handleAiError(res, err); }
});

// 6. Grade Rules Optimizer
app.post('/api/ai/rules/optimize', async (req, res) => {
  const { stats } = req.body;
  if (!process.env.API_KEY) return res.status(500).json({ error: 'API_KEY missing on server' });

  try {
    const geminiPrompt = `
        ACT AS: Chief Risk Officer.
        TASK: Define segmentation logic (Grade Rules) for a debt portfolio.
        STATS: Total Cust: ${stats.count}, Balance: ${stats.totalBalance}, Avg: ${stats.avgBalance}, Max Dormancy: ${stats.maxDormancy}.
        GOAL: Create 4 buckets (A, B, C, D) as JSON array.
    `;
    const result = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: geminiPrompt,
      config: { responseMimeType: "application/json" }
    });
    res.json(JSON.parse(result.text || '[]'));
  } catch (err) { handleAiError(res, err); }
});

// 7. Cortex Architect (Code Mods)
app.post('/api/ai/cortex/mod', async (req, res) => {
  const { prompt, context } = req.body;
  if (!process.env.API_KEY) return res.status(500).json({ error: 'API_KEY missing on server' });

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `ACT AS: Senior Engineer. REQUEST: ${prompt}. FILE CONTEXT: ${context}. OUTPUT JSON with explanation, suggestedCode, fileAffected, impact.`,
      config: { responseMimeType: "application/json" }
    });
    res.json(JSON.parse(result.text || '{}'));
  } catch (err) { handleAiError(res, err); }
});

// --- PRODUCTION SERVING ---

// Serve static files from the 'dist' directory (generated by 'npm run build')
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React Routing (SPA): Return index.html for any unknown route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[ArrearsFlow] Kernel Active on Node 139.59.10.70`);
  console.log(`[ArrearsFlow] Listening on port ${PORT}`);
});