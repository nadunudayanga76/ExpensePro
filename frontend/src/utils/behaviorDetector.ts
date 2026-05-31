import { formatCurrency } from './format';

export interface Alert {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  message: string;
  iconName: string;
}

export const analyzeSpendingBehavior = (expenses: any[], budgets: any[]): Alert[] => {
  const alerts: Alert[] = [];
  const now = new Date();
  
  // Helper: check if a date is within a specific range
  const isBetween = (dateStr: string, startDate: Date, endDate: Date) => {
    const d = new Date(dateStr);
    return d >= startDate && d < endDate;
  };

  // --- 1. Budget Exhaustion ---
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  
  budgets.forEach(budget => {
    const categoryId = budget.categoryId?._id;
    if (!categoryId) return;
    
    const spentThisMonth = expenses
      .filter(e => e.categoryId?._id === categoryId && isBetween(e.date, currentMonthStart, currentMonthEnd))
      .reduce((sum, e) => sum + e.amount, 0);
      
    const percentage = (spentThisMonth / budget.amountLimit) * 100;
    
    if (percentage >= 100) {
      alerts.push({
        id: `budget-exceeded-${categoryId}`,
        type: 'danger',
        message: `Your ${budget.categoryId.name} budget has been exceeded by ${formatCurrency(spentThisMonth - budget.amountLimit)}.`,
        iconName: 'alert-triangle'
      });
    } else if (percentage >= 90) {
      alerts.push({
        id: `budget-warning-${categoryId}`,
        type: 'warning',
        message: `Your ${budget.categoryId.name} budget is nearly exhausted (${percentage.toFixed(0)}%).`,
        iconName: 'alert-circle'
      });
    }
  });

  // --- 2. Category Spikes (Week-over-Week) ---
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(now.getDate() - 14);

  const wowSpikes = detectSpikes(expenses, fourteenDaysAgo, sevenDaysAgo, sevenDaysAgo, now, 0.25, 500);
  wowSpikes.forEach(spike => {
    alerts.push({
      id: `wow-spike-${spike.categoryId}`,
      type: 'warning',
      message: `${spike.categoryName} spending is up ${(spike.increasePercentage * 100).toFixed(0)}% this week compared to last week.`,
      iconName: 'trending-up'
    });
  });

  // --- 3. Category Spikes (Month-over-Month) ---
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

  const momSpikes = detectSpikes(expenses, lastMonthStart, lastMonthEnd, currentMonthStart, currentMonthEnd, 0.25, 1000);
  momSpikes.forEach(spike => {
    // Only show MoM if we haven't already shown a WoW for the same category to avoid spam
    if (!wowSpikes.find(w => w.categoryId === spike.categoryId)) {
      alerts.push({
        id: `mom-spike-${spike.categoryId}`,
        type: 'info',
        message: `${spike.categoryName} spending is trending ${(spike.increasePercentage * 100).toFixed(0)}% higher this month.`,
        iconName: 'trending-up'
      });
    }
  });

  // --- 4. Unusual Transaction Sizes ---
  if (expenses.length > 10) {
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const meanAmount = totalAmount / expenses.length;
    const threshold = meanAmount * 5; // 5x average
    
    const recentUnusuals = expenses.filter(e => e.amount > Math.max(threshold, 2000) && isBetween(e.date, sevenDaysAgo, now));
    
    recentUnusuals.forEach(e => {
      alerts.push({
        id: `unusual-${e._id}`,
        type: 'warning',
        message: `Unusually large transaction detected: ${formatCurrency(e.amount)} for ${e.categoryId?.name || 'Unknown'}.`,
        iconName: 'zap'
      });
    });
  }

  // --- 5. Recurring Subscriptions ---
  const activeRecurring = expenses.filter(e => e.isRecurring);
  // deduplicate by category/notes to get unique active subscriptions roughly
  const uniqueSubs = new Set(activeRecurring.map(e => `${e.categoryId?._id}-${e.notes}`));
  
  if (uniqueSubs.size > 0) {
    alerts.push({
      id: `recurring-summary`,
      type: 'info',
      message: `You currently have ${uniqueSubs.size} active recurring subscription(s).`,
      iconName: 'refresh-ccw'
    });
  }

  // Return max 5 alerts to keep dashboard clean
  return alerts.slice(0, 5);
};

// Helper for Spike Detection
function detectSpikes(
  expenses: any[], 
  period1Start: Date, period1End: Date, 
  period2Start: Date, period2End: Date, 
  increaseThreshold: number, 
  minAmountThreshold: number
) {
  const period1Map: Record<string, number> = {};
  const period2Map: Record<string, number> = {};
  const nameMap: Record<string, string> = {};

  expenses.forEach(e => {
    const catId = e.categoryId?._id;
    if (!catId) return;
    
    nameMap[catId] = e.categoryId.name;
    const d = new Date(e.date);
    
    if (d >= period1Start && d < period1End) {
      period1Map[catId] = (period1Map[catId] || 0) + e.amount;
    } else if (d >= period2Start && d < period2End) {
      period2Map[catId] = (period2Map[catId] || 0) + e.amount;
    }
  });

  const spikes = [];
  for (const catId in period2Map) {
    const p1Amount = period1Map[catId] || 0;
    const p2Amount = period2Map[catId];
    
    if (p2Amount > minAmountThreshold && p1Amount > 0) {
      const increase = (p2Amount - p1Amount) / p1Amount;
      if (increase >= increaseThreshold) {
        spikes.push({
          categoryId: catId,
          categoryName: nameMap[catId],
          increasePercentage: increase
        });
      }
    }
  }
  
  return spikes;
}
