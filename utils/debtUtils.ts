
import { Transaction, Customer, GradeRule, CommunicationLog } from '../types';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatGold = (grams: number) => {
  return `${grams.toFixed(3)} g`;
};

/**
 * SOVEREIGN RISK ENGINE v5.0
 * Calculates risk grades based on financial exposure and communication gaps.
 */
export const analyzeCustomerBehavior = (customer: Customer, rules: GradeRule[], callLogs: CommunicationLog[] = []) => {
  const now = new Date();
  
  // 1. Inactivity Calculation
  const lastCredit = [...customer.transactions]
    .filter(t => t.type === 'credit')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const lastContact = [customer.lastWhatsappDate, customer.lastCallDate]
    .filter(Boolean)
    .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];

  const daysSincePayment = lastCredit 
    ? Math.floor((now.getTime() - new Date(lastCredit.date).getTime()) / 86400000) 
    : 365;

  const daysSinceContact = lastContact 
    ? Math.floor((now.getTime() - new Date(lastContact).getTime()) / 86400000) 
    : 365;

  // 2. Waterfall Grade Matching
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);
  let matchedRule = sortedRules[sortedRules.length - 1]; 

  for (const rule of sortedRules) {
     if (customer.currentBalance >= rule.minBalance && 
         daysSincePayment >= rule.daysSincePayment && 
         daysSinceContact >= rule.daysSinceContact) {
        matchedRule = rule;
        break;
     }
  }

  // 3. Spam Protection
  let isSpamBlocked = false;
  if (lastContact) {
     const hoursPassed = (now.getTime() - new Date(lastContact).getTime()) / 3600000;
     const threshold = ruleToHours(matchedRule);
     if (hoursPassed < threshold) isSpamBlocked = true;
  }

  return {
    score: Math.max(0, 100 - (daysSincePayment / 2) - (customer.currentBalance / 10000)),
    calculatedGrade: matchedRule.id,
    daysInactive: daysSincePayment,
    isSpamBlocked,
    matchedRule
  };
};

const ruleToHours = (rule: GradeRule) => {
  return rule.antiSpamUnit === 'days' ? rule.antiSpamThreshold * 24 : rule.antiSpamThreshold;
};
