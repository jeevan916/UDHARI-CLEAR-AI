
import axios from 'axios';
import { Customer, AiStrategy, CommunicationLog, GradeRule } from '../types';

/**
 * Enterprise AI Bridge
 * Interfaces with the secure Authority Kernel at 139.59.10.70
 */

export const generateEnterpriseStrategy = async (customer: Customer, callLogs: CommunicationLog[] = []): Promise<AiStrategy | null> => {
  try {
    const response = await axios.post('/api/kernel/reason', {
      customerData: {
        name: customer.name,
        balance: customer.currentBalance,
        gold: customer.currentGoldBalance,
        grade: customer.grade
      },
      interactionLogs: callLogs.filter(l => l.customerId === customer.id).slice(0, 5)
    });
    
    const data = response.data;
    return {
      riskScore: (data.recovery_odds || 0.5) * 100,
      riskLevel: data.risk_grade || 'UNKNOWN',
      analysis: data.analysis || "Audit complete.",
      recommendedAction: data.next_step || "Manual Review",
      drafts: [{ tone: 'Professional', text: "Protocol synchronized with kernel." }],
      next_step: data.next_step
    };
  } catch (error) {
    console.error("Kernel AI Failure:", error);
    return null;
  }
};

export const getKernelStatus = async () => {
  try {
    const response = await axios.get('/api/kernel/status');
    return response.data;
  } catch (e) {
    return { nodeId: "OFFLINE", version: "N/A" };
  }
};

export const getLiveLogs = async () => {
  try {
    const response = await axios.get('/api/kernel/logs');
    return response.data;
  } catch (e) {
    return ["KERNEL_DISCONNECTED"];
  }
};

// --- Added Exports to fix missing members used in views ---

/**
 * Optimize grade rules using Gemini AI based on portfolio statistics.
 */
export const generateOptimizedGradeRules = async (stats: any): Promise<GradeRule[] | null> => {
  try {
    const response = await axios.post('/api/kernel/optimize-grades', { stats });
    return response.data;
  } catch (error) {
    console.error("Grade Optimization Failure:", error);
    return null;
  }
};

/**
 * Generate a new communication template based on user intent.
 */
export const generateSmartTemplate = async (intent: string, category: string): Promise<{ content: string; suggestedButtons: string[]; suggestedName?: string }> => {
  try {
    const response = await axios.post('/api/kernel/smart-template', { intent, category });
    return response.data;
  } catch (error) {
    console.error("Smart Template Failure:", error);
    return { content: `Error generating template for ${intent}`, suggestedButtons: [] };
  }
};

/**
 * Optimize existing template content for professional tone.
 */
export const optimizeTemplateContent = async (content: string, context: string): Promise<string> => {
  try {
    const response = await axios.post('/api/kernel/optimize-content', { content, context });
    return response.data.optimizedContent || content;
  } catch (error) {
    console.error("Content Optimization Failure:", error);
    return content;
  }
};
