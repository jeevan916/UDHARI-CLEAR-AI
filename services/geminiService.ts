
import { GoogleGenAI, Type } from "@google/genai";
import { Customer, AiStrategy, GradeRule, CommunicationLog } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * LedgerOps Intelligence Advisor Node
 * version: 1.2.0
 * Authority: Finance Ops / Collections Enforcement
 * Rules: DETERMINISTIC, AUDIT-SAFE, ADVISOR-ONLY.
 */
export const generateEnterpriseStrategy = async (customer: Customer, callLogs: CommunicationLog[] = []): Promise<AiStrategy | null> => {
  try {
    const now = new Date().toISOString();
    
    // Derived Ledger Snapshot Metrics
    const debits = customer.transactions
      .filter(t => t.type === 'debit')
      .reduce((s, t) => s + t.amount, 0);
    const credits = customer.transactions
      .filter(t => t.type === 'credit')
      .reduce((s, t) => s + t.amount, 0);
    const ledgerSample = customer.transactions.slice(0, 5).map(t => 
      `${t.date}: ${t.type.toUpperCase()} [${t.amount}] via ${t.method}`
    ).join(' | ');

    // Call Context
    const recentCalls = callLogs
      .filter(l => l.customerId === customer.id)
      .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 3);
    
    const callSummary = recentCalls.length > 0 
      ? recentCalls.map(c => `[${c.timestamp.split('T')[0]}] Outcome: ${c.outcome} | Duration: ${c.duration}s | Note: "${c.content}"`).join('\n      ')
      : "No recent voice logs recorded.";

    const prompt = `
      BUSINESS CONTEXT (ALWAYS TRUE):
      - This is NOT a generic CRM.
      - This is a ledger-based debt collection system.
      - Ledger is the single source of truth.
      - Balance = SUM(credits) - SUM(debits).
      - Negative balance = OVERDUE.
      - Grades define communication eligibility and frequency.
      - No spam is allowed.

      INPUT PAYLOAD:

      Customer Core:
      - Customer ID: ${customer.id}
      - Business Type: Retail / Jewellery
      - Grade: ${customer.grade}
      - Group: ${customer.groupId}

      Ledger Snapshot:
      - Total Debits: ${debits}
      - Total Credits: ${credits}
      - Current Balance: ${customer.currentBalance}
      - Last Payment Date: ${customer.lastTxDate}
      - Average Payment Gap (days): 30 (historical avg)
      - Balance Trend (last 90 days): ${customer.currentBalance > (debits / 2) ? 'Increasing Liability' : 'Stable'}

      Activity & Communication:
      - WhatsApp Sent: ${customer.lastWhatsappDate ? '1' : '0'}
      - WhatsApp Read: ${customer.paymentLinkStats.totalOpens > 0 ? '1' : '0'}
      - SMS Sent: 0
      - Calls Made: ${customer.lastCallDate ? '1' : '0'}
      - Last Action Type: ${customer.paymentLinkStats.totalOpens > 0 ? 'Digital Engagement' : 'Ledger Update'}
      - Last Action Date: ${customer.paymentLinkStats.lastOpened || customer.lastTxDate}

      Voice Log Context (CRITICAL):
      ${callSummary}

      Grade Constraints:
      - Communication Interval (days): 7
      - Allowed Channels: WhatsApp, SMS, Voice
      - Allowed Template IDs: AURAGOLD_PAYMENT_REQUEST, AURAGOLD_ORDER_CONFIRMATION

      Ledger History Sample: ${ledgerSample}

      Time Context:
      - Current DateTime: ${now}
      - Business Hours: 10:00 - 19:00 IST

      TASKS:
      1. Explain customer behavior analytically (Cite specific call outcomes if available).
      2. Assess risk direction (ledger-based + call sentiment).
      3. Recommend next best action (compliance-first).
      4. Recommend timing (respect 7-day cooldown).
      5. Select channel + approved template.
      6. Provide staff guidance.
      7. Predict overdue risk (next 14 days).

      OUTPUT STRICT JSON ONLY.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        temperature: 0.1,
        topP: 0.95,
        responseMimeType: "application/json",
        systemInstruction: `You are an AI intelligence engine embedded inside a REAL financial ledger system. 
        CRITICAL RULES:
        - You DO NOT calculate or change balances.
        - You DO NOT modify ledger entries.
        - You DO NOT override grade rules.
        - You DO NOT send messages or execute payments.
        - You ONLY analyze, recommend, and advise based on the authoritative ledger.
        - Be Conservative, Explainable, Deterministic, and Audit-safe.
        - Logic all requests and responses for compliance.
        - No function calls or code execution.`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            customer_insight: {
              type: Type.OBJECT,
              properties: {
                profile: { type: Type.STRING },
                likely_reason: { type: Type.STRING },
                risk_trend: { type: Type.STRING },
                confidence: { type: Type.NUMBER }
              },
              required: ["profile", "likely_reason", "risk_trend", "confidence"]
            },
            next_best_action: {
              type: Type.OBJECT,
              properties: {
                action: { type: Type.STRING },
                urgency: { type: Type.STRING },
                recommended_time: { type: Type.STRING },
                reasoning: { type: Type.STRING }
              },
              required: ["action", "urgency", "recommended_time", "reasoning"]
            },
            channel_and_template: {
              type: Type.OBJECT,
              properties: {
                channel: { type: Type.STRING },
                template_id: { type: Type.STRING, nullable: true },
                tone: { type: Type.STRING },
                fallback_channel: { type: Type.STRING },
                confidence: { type: Type.NUMBER }
              },
              required: ["channel", "template_id", "tone", "fallback_channel", "confidence"]
            },
            staff_guidance: {
              type: Type.OBJECT,
              properties: {
                recommended_action: { type: Type.STRING },
                why: { type: Type.STRING },
                follow_up_window_days: { type: Type.NUMBER }
              },
              required: ["recommended_action", "why", "follow_up_window_days"]
            },
            overdue_prediction: {
              type: Type.OBJECT,
              properties: {
                risk_next_14_days: { type: Type.STRING },
                probability: { type: Type.NUMBER },
                key_factors: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                confidence: { type: Type.NUMBER }
              },
              required: ["risk_next_14_days", "probability", "key_factors", "confidence"]
            },
            compliance_notes: {
              type: Type.OBJECT,
              properties: {
                ledger_modified: { type: Type.BOOLEAN },
                grade_overridden: { type: Type.BOOLEAN },
                cooldown_respected: { type: Type.BOOLEAN },
                audit_safe: { type: Type.BOOLEAN }
              },
              required: ["ledger_modified", "grade_overridden", "cooldown_respected", "audit_safe"]
            }
          },
          required: [
            "customer_insight",
            "next_best_action",
            "channel_and_template",
            "staff_guidance",
            "overdue_prediction",
            "compliance_notes"
          ]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    return {
      riskScore: (result.overdue_prediction?.probability ?? 0) * 100,
      riskLevel: result.overdue_prediction?.risk_next_14_days ?? 'MODERATE',
      analysis: `${result.customer_insight?.profile ?? 'Audit Analysis complete'}. Risk Factor: ${result.customer_insight?.risk_trend ?? 'Stable'}. Likely Context: ${result.customer_insight?.likely_reason ?? 'Awaiting payment cycle'}.`,
      recommendedAction: `${result.next_best_action?.action ?? 'Review Ledger'} [Target: ${result.next_best_action?.recommended_time ?? 'Standard Hours'}]`,
      drafts: [
        { 
          tone: result.channel_and_template?.tone ?? 'Professional', 
          text: `[ADVISORY GUIDANCE] Recommended Channel: ${result.channel_and_template?.channel ?? 'Internal'}. Template: ${result.channel_and_template?.template_id ?? 'None'}. Instruction: ${result.staff_guidance?.recommended_action ?? 'Manual ledger verification required.'}` 
        }
      ]
    };
  } catch (error) {
    console.error("LedgerOps Intelligence Failover Node 139.59.10.70:", error);
    return null;
  }
};

/**
 * AI Template Architect
 * Generates recovery messages based on intent and tone.
 */
export const generateTemplateDraft = async (intent: string, tone: string): Promise<string> => {
  try {
     const prompt = `
       ACT AS: Expert Debt Recovery Copywriter.
       TASK: Write a concise, high-converting WhatsApp/SMS message.
       INTENT: ${intent}
       TONE: ${tone}
       VARIABLES_REQUIRED: {{customer_name}}, {{balance}}, {{payment_link}}
       RULES: 
       - Keep it under 300 characters.
       - Use the variables naturally.
       - Be professional but firm.
       OUTPUT: Raw text only. No preamble.
     `;
     const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview",
        contents: prompt,
     });
     return response.text?.trim() || "System: AI Generation Interrupted.";
  } catch (e) {
    console.error("Template Gen Error:", e);
    return "System: AI Service Temporarily Unavailable.";
  }
};

/**
 * AI Smart Template Architect (Gemini 2.5)
 * Dedicated for Template Architect View - optimized for formatting.
 * Enforces 'credit_flow_' prefix for system names.
 */
export const generateSmartTemplate = async (promptText: string, category: string): Promise<{content: string, suggestedButtons: string[], suggestedName: string}> => {
   try {
      const prompt = `
         Create a WhatsApp Business Template message.
         Context: Debt Collection / Payment Reminder / Customer Service.
         Category: ${category}
         User Intent: ${promptText}
         
         Requirements:
         1. Use {{1}}, {{2}} format for variables (WhatsApp Standard). DO NOT use {{name}} or {{amount}}.
         2. Use *bold* for key amounts or names.
         3. Suggest 2 relevant button text labels.
         4. Suggest a system name that MUST start with 'credit_flow_' and follow snake_case.
         5. Be concise and professional.
         
         Output JSON: { "content": "string", "buttons": ["btn1", "btn2"], "suggestedName": "credit_flow_..." }
      `;

      const response = await ai.models.generateContent({
         model: "gemini-2.5-flash-preview",
         contents: prompt,
         config: { responseMimeType: "application/json" }
      });
      
      const res = JSON.parse(response.text || '{}');
      return {
         content: res.content || "",
         suggestedButtons: res.buttons || [],
         suggestedName: res.suggestedName || `credit_flow_${Date.now()}`
      };
   } catch (e) {
      console.error("Smart Template Gen Error:", e);
      return { content: "Error generating template. Please try again.", suggestedButtons: [], suggestedName: "" };
   }
};

/**
 * Template Language Optimizer
 * Rewrites existing content to be more effective while preserving variables.
 */
export const optimizeTemplateContent = async (currentContent: string, context: string): Promise<string> => {
   try {
      const prompt = `
         ACT AS: Conversion Optimization Specialist.
         TASK: Rewrite the following WhatsApp message to be more effective for: "${context}".
         
         CURRENT CONTENT:
         "${currentContent}"
         
         RULES:
         1. MUST preserve all existing variables like {{1}}, {{2}} in roughly the same logical position.
         2. Improve tone (professional, firm, yet polite).
         3. Use *bolding* strategically.
         4. Fix grammar or awkward phrasing.
         5. Do not add new variables.
         
         OUTPUT: The rewritten content string only.
      `;
      
      const response = await ai.models.generateContent({
         model: "gemini-3-flash-preview",
         contents: prompt
      });
      
      return response.text?.trim() || currentContent;
   } catch (e) {
      console.error("Optimization failed", e);
      return currentContent;
   }
};

/**
 * AI Grade Rule Optimizer
 * Analyzes portfolio stats and suggests optimal rule thresholds.
 */
export const generateOptimizedGradeRules = async (customerStats: any): Promise<GradeRule[] | null> => {
   try {
      const prompt = `
        ACT AS: Chief Risk Officer for a lending firm.
        TASK: Define segmentation logic (Grade Rules) for a debt portfolio based on the provided stats.
        
        PORTFOLIO STATS:
        - Total Customers: ${customerStats.count}
        - Total Outstanding: ${customerStats.totalBalance}
        - Avg Balance: ${customerStats.avgBalance}
        - Max Dormancy: ${customerStats.maxDormancy} days

        GOAL:
        Create 4 buckets (D=Critical, C=High Risk, B=Moderate, A=Safe).
        Grade D must be the strictest (highest priority).
        Grade A must be the catch-all (lowest priority).
      `;

      const response = await ai.models.generateContent({
         model: "gemini-3-pro-preview",
         contents: prompt,
         config: { 
           responseMimeType: "application/json",
           responseSchema: {
             type: Type.ARRAY,
             items: {
               type: Type.OBJECT,
               properties: {
                 id: { type: Type.STRING, enum: ["A", "B", "C", "D"] },
                 label: { type: Type.STRING },
                 color: { type: Type.STRING, enum: ["rose", "amber", "blue", "emerald"] },
                 priority: { type: Type.INTEGER },
                 minBalance: { type: Type.NUMBER },
                 daysSincePayment: { type: Type.NUMBER },
                 daysSinceContact: { type: Type.NUMBER },
                 whatsapp: { type: Type.BOOLEAN },
                 sms: { type: Type.BOOLEAN },
                 templateId: { type: Type.STRING },
                 frequencyDays: { type: Type.NUMBER },
                 antiSpamThreshold: { type: Type.NUMBER },
                 antiSpamUnit: { type: Type.STRING, enum: ["hours", "days"] }
               },
               required: ["id", "label", "color", "priority", "minBalance", "daysSincePayment", "daysSinceContact", "whatsapp", "sms", "templateId", "frequencyDays", "antiSpamThreshold", "antiSpamUnit"]
             }
           }
         }
      });

      const rules = JSON.parse(response.text || '[]');
      return Array.isArray(rules) ? rules : null;
   } catch (e) {
      console.error("Rule Optimization Failed:", e);
      return null;
   }
};
