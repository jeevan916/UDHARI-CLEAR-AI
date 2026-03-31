import { Router } from 'express';
import { getCustomers } from './services/customerService';
import { getTransactions } from './services/transactionService';
import { generateContent } from './services/aiService';

const router = Router();

router.get('/api/customers', async (req, res) => {
  try {
    res.json(await getCustomers());
  } catch (e) { res.status(500).json({ error: "DB_ERROR" }); }
});

router.post('/api/kernel/reason', async (req, res) => {
  try {
    const response = await generateContent("gemini-3-pro-preview", `Analyze Credit Risk for Jeweller Customer: ${JSON.stringify(req.body.customerData)}. Output JSON.`, { 
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          risk_score: { type: "NUMBER" },
          risk_level: { type: "STRING" },
          analysis: { type: "STRING" },
          next_step: { type: "STRING" }
        },
        required: ["risk_score", "risk_level", "analysis", "next_step"]
      }
    });
    res.json(response);
  } catch (err) { res.status(500).json({ error: "AI_OFFLINE" }); }
});

router.get('/api/ledger/global', async (req, res) => {
  try {
    res.json(await getTransactions(req.query));
  } catch (e) { res.status(500).json({ error: "DB_ERROR" }); }
});

router.post('/api/auth/login', async (req: any, res: any) => {
  const { email, password } = req.body;
  if ((email === 'admin' && password === 'admin') || (email === 'matrixjeevan@gmail.com' && password === 'admin123')) {
    return res.json({ id: 'usr_root', name: 'Root Admin', email, role: 'admin' });
  }
  res.status(401).json({ error: "Access Restricted" });
});

router.post('/api/kernel/optimize-grades', async (req: any, res: any) => {
  try {
    const response = await generateContent("gemini-3-pro-preview", `Optimize Grade Rules for Jeweller Portfolio. Stats: ${JSON.stringify(req.body.stats)}. Output JSON array of GradeRule objects.`, { responseMimeType: "application/json" });
    res.json(response);
  } catch (err) { res.status(500).json({ error: "AI_OFFLINE" }); }
});

router.post('/api/kernel/smart-template', async (req: any, res: any) => {
  try {
    const response = await generateContent("gemini-3-pro-preview", `Generate Smart Communication Template. Intent: ${req.body.intent}, Category: ${req.body.category}. Output JSON with content, suggestedButtons, and suggestedName.`, { responseMimeType: "application/json" });
    res.json(response);
  } catch (err) { res.status(500).json({ error: "AI_OFFLINE" }); }
});

router.post('/api/kernel/optimize-content', async (req: any, res: any) => {
  try {
    const response = await generateContent("gemini-3-pro-preview", `Optimize Template Content. Content: ${req.body.content}, Context: ${req.body.context}. Output JSON with optimizedContent.`, { responseMimeType: "application/json" });
    res.json(response);
  } catch (err) { res.status(500).json({ error: "AI_OFFLINE" }); }
});

export default router;
