
import { Transaction, Customer, CustomerGrade, GradeRule, CommunicationLog } from '../types';

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

export const generateUniqueRef = (prefix: string) => {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
};

/**
 * DETERMINISTIC BEHAVIORAL ENGINE (K-NODE) v2.3
 * Refactored to separate Risk Classification from Action Eligibility.
 * Includes "Waterfall Safety" to handle overlapping financial criteria.
 */
export const analyzeCustomerBehavior = (customer: Customer, rules: GradeRule[], callLogs: CommunicationLog[] = []) => {
  const now = new Date();
  
  // 1. DATA AGGREGATION
  // Get recent call data specific to this customer
  const customerCalls = callLogs.filter(l => l.customerId === customer.id);
  const lastCallLog = customerCalls.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  // Determine effective last contact date (combining logs and legacy props)
  const effectiveLastCallDate = lastCallLog ? lastCallLog.timestamp : customer.lastCallDate;
  const lastContactDate = customer.lastWhatsappDate || effectiveLastCallDate || customer.lastTxDate;

  // LOGIC FIX: Calculate Days Since Last Payment (Credit) specifically
  // Checks BOTH ledgers (Money and Gold) for recent activity
  const lastCreditTx = [...customer.transactions]
    .filter(t => t.type === 'credit')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const lastPaymentDate = lastCreditTx ? lastCreditTx.date : customer.lastTxDate; // Fallback to lastTx if no credits found
  
  const daysInactive = Math.floor((now.getTime() - new Date(customer.lastTxDate).getTime()) / (1000 * 3600 * 24)); // General Ledger Inactivity
  const daysSincePayment = Math.floor((now.getTime() - new Date(lastPaymentDate).getTime()) / (1000 * 3600 * 24)); // Specific Payment Dormancy
  const daysSinceContact = Math.floor((now.getTime() - new Date(lastContactDate).getTime()) / (1000 * 3600 * 24));

  // 2. RISK CLASSIFICATION (The Grade)
  // CRITICAL FIX: Sort by Priority ASC, then by MinBalance DESC (Stricter rules first)
  const sortedRules = [...rules].sort((a, b) => {
     if (a.priority !== b.priority) return a.priority - b.priority;
     return b.minBalance - a.minBalance; // Tie-breaker: Check higher balance requirement first
  });

  // Default to the lowest priority rule (Safety Net) if no specific criteria matched
  let matchedRule = sortedRules[sortedRules.length - 1]; 
  
  // Find the pure Risk Grade based on Financials & History ONLY
  // Note: Currently risk rules are primarily based on Rupee Balance. 
  // Future upgrade: Add Gold Balance weightage (e.g. 1g Gold = 6500 Rs equivalent risk)
  for (const rule of sortedRules) {
     const balanceMatch = customer.currentBalance >= rule.minBalance;
     // We compare the rule's requirement against the specific Payment Dormancy, not just generic inactivity
     const dormancyMatch = daysSincePayment >= rule.daysSincePayment;
     const contactHistoryMatch = daysSinceContact >= rule.daysSinceContact; // General contact gap
     
     if (balanceMatch && dormancyMatch && contactHistoryMatch) {
        matchedRule = rule;
        break; // Stop at first match (Highest Priority / Strictest)
     }
  }

  // 3. ACTION ELIGIBILITY (The Gatekeeper)
  // Now that we know the Grade (e.g., 'D'), we check if we are allowed to message them.
  
  const digitalDates = [
    customer.lastWhatsappDate ? new Date(customer.lastWhatsappDate).getTime() : 0,
    customer.lastSmsDate ? new Date(customer.lastSmsDate).getTime() : 0
  ];
  const lastDigitalContactTimestamp = Math.max(...digitalDates);
  
  let isSpamBlocked = false;
  let cooldownRemainingLabel = '';

  if (lastDigitalContactTimestamp > 0) {
    const diffMs = now.getTime() - lastDigitalContactTimestamp;
    let diffVal = 0;
    
    if (matchedRule.antiSpamUnit === 'hours') {
        diffVal = diffMs / (1000 * 3600); // Hours passed
    } else {
        diffVal = diffMs / (1000 * 3600 * 24); // Days passed
    }

    if (diffVal < matchedRule.antiSpamThreshold) {
        isSpamBlocked = true;
        const remaining = matchedRule.antiSpamThreshold - diffVal;
        
        if (matchedRule.antiSpamUnit === 'hours') {
            const hrs = Math.floor(remaining);
            const mins = Math.floor((remaining - hrs) * 60);
            cooldownRemainingLabel = `${hrs}h ${mins}m`;
        } else {
             const days = Math.floor(remaining);
             const hrs = Math.floor((remaining - days) * 24);
             cooldownRemainingLabel = `${days}d ${hrs}h`;
        }
    }
  }

  // 4. SCORING & OUTPUT
  // Calculate generic health score for UI visual only
  let score = 100;
  if (daysSincePayment > 15) score -= 15;
  if (daysSincePayment > 60) score -= 40;
  if (customer.currentBalance > 500000) score -= 10;
  if (customer.currentGoldBalance > 100) score -= 10; // New: Risk penalty for high gold debt

  if (lastCallLog) {
    if (lastCallLog.outcome === 'Connected') score += 5;
    else if (lastCallLog.outcome === 'No Answer') score -= 5;
    else if (lastCallLog.outcome === 'Wrong Number') score -= 20;
  } else if (customer.currentBalance > 10000) {
     score -= 5;
  }

  if (score < 0) score = 0;
  if (score > 100) score = 100;

  // Construct Next Action Label
  let nextAction = matchedRule.whatsapp ? 'WHATSAPP_PROTOCOL' : 'SMS_FALLBACK';
  if (isSpamBlocked) {
      nextAction = `COOLDOWN (${cooldownRemainingLabel})`;
  }

  return {
    score,
    calculatedGrade: matchedRule.id, // Stable Risk Grade
    daysInactive: daysSincePayment, // Expose payment dormancy as the primary "Days Inactive" metric for the UI
    daysSinceContact,
    tags: [matchedRule.label, isSpamBlocked ? 'Spam Protection Active' : 'Actionable'],
    nextAction: nextAction,
    actionColor: matchedRule.color,
    isSpamBlocked, // New Flag for UI
    cooldownRemainingLabel,
    matchedRule
  };
};
