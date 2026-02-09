import axios from 'axios';
import { Customer, AiStrategy, GradeRule, CommunicationLog } from '../types';

/**
 * Enterprise AI Bridge
 * Responsibility: Secure delegation of reasoning tasks to the Node Kernel.
 */

export const generateEnterpriseStrategy = async (customer: Customer, callLogs: CommunicationLog[] = []): Promise<AiStrategy | null> => {
  try {
    const response = await axios.post('/api/ai/analyze-risk', {
      context: {
        customer: {
          id: customer.id,
          name: customer.name,
          balance: customer.currentBalance,
          gold_balance: customer.currentGoldBalance,
          grade: customer.grade,
          last_tx: customer.lastTxDate
        },
        interactions: callLogs.filter(l => l.customerId === customer.id).slice(0, 5)
      }
    });
    
    const data = response.data;
    return {
      riskScore: data.recovery_probability * 100 || 0,
      riskLevel: data.risk_level || 'UNKNOWN',
      analysis: data.justification || "Audit complete.",
      recommendedAction: data.recommended_action || "Manual Review",
      drafts: [{ tone: 'Professional', text: "Protocol initiated." }]
    };
  } catch (error) {
    console.error("AI Node Failure:", error);
    return null;
  }
};

export const generateSmartTemplate = async (promptText: string, category: string): Promise<{content: string, suggestedButtons: string[], suggestedName: string}> => {
   try {
      const response = await axios.post('/api/ai/template/smart', { prompt: promptText, category });
      return response.data;
   } catch (e) {
      return { 
        content: "Drafting protocol offline.", 
        suggestedButtons: ["Retry"], 
        suggestedName: `fallback_${Date.now()}` 
      };
   }
};

export const optimizeTemplateContent = async (currentContent: string, context: string): Promise<string> => {
   try {
      const response = await axios.post('/api/ai/template/optimize', { content: currentContent, context });
      return response.data.content;
   } catch (e) {
      return currentContent;
   }
};

export const generateOptimizedGradeRules = async (customerStats: any): Promise<GradeRule[] | null> => {
   try {
      const response = await axios.post('/api/ai/rules/optimize', { stats: customerStats });
      return response.data;
   } catch (e) {
      return null;
   }
};