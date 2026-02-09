
import axios from 'axios';
import { Customer, AiStrategy, GradeRule, CommunicationLog } from '../types';

/**
 * LedgerOps Intelligence Advisor Node
 * version: 2.0.0 (Secure Proxy)
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

      OUTPUT STRICT JSON ONLY with keys: customer_insight, next_best_action, channel_and_template, staff_guidance, overdue_prediction, compliance_notes.
    `;

    const response = await axios.post('/api/ai/strategy', { prompt });
    const result = response.data;
    
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
    console.error("LedgerOps Intelligence Failover:", error);
    return null;
  }
};

export const generateTemplateDraft = async (intent: string, tone: string): Promise<string> => {
  return "Deprecated: Use Smart Template Generator";
};

export const generateSmartTemplate = async (promptText: string, category: string): Promise<{content: string, suggestedButtons: string[], suggestedName: string}> => {
   try {
      const response = await axios.post('/api/ai/template/smart', { prompt: promptText, category });
      return {
         content: response.data.content || "",
         suggestedButtons: response.data.buttons || [],
         suggestedName: response.data.suggestedName || `credit_flow_${Date.now()}`
      };
   } catch (e) {
      console.error("Smart Template Gen Error:", e);
      return { content: "Error generating template. Please try again.", suggestedButtons: [], suggestedName: "" };
   }
};

export const optimizeTemplateContent = async (currentContent: string, context: string): Promise<string> => {
   try {
      const response = await axios.post('/api/ai/template/optimize', { content: currentContent, context });
      return response.data.content || currentContent;
   } catch (e) {
      console.error("Optimization failed", e);
      return currentContent;
   }
};

export const generateOptimizedGradeRules = async (customerStats: any): Promise<GradeRule[] | null> => {
   try {
      const response = await axios.post('/api/ai/rules/optimize', { stats: customerStats });
      return Array.isArray(response.data) ? response.data : null;
   } catch (e) {
      console.error("Rule Optimization Failed:", e);
      return null;
   }
};
