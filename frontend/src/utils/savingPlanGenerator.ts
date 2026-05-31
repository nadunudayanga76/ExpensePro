export interface ActionItem {
  id: string;
  category: string;
  instruction: string;
  savingsLKR: number;
  iconName: string;
}

export interface SavingPlan {
  type: '7-day' | '30-day';
  totalProjectedSavings: number;
  actionItems: ActionItem[];
  projectionData: { month: string; cumulative: number }[];
}

export const generateSavingPlans = (expenses: any[], budgets: any[], categories: any[]): { sevenDay: SavingPlan, thirtyDay: SavingPlan } => {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  // Group mappings
  const categoryGroupMap: Record<string, string> = {};
  const categoryNameMap: Record<string, string> = {};
  categories.forEach(c => {
    categoryGroupMap[c._id] = c.group || 'General';
    categoryNameMap[c._id] = c.name;
  });

  // --- 7-DAY PLAN (Aggressive 50% cuts on top 3 Wants/General) ---
  const last7DaysWants = expenses.filter(e => {
    const d = new Date(e.date);
    const group = categoryGroupMap[e.categoryId?._id];
    return d >= sevenDaysAgo && d < now && (group === 'Wants' || group === 'General');
  });

  const sevenDayCatTotals: Record<string, number> = {};
  last7DaysWants.forEach(e => {
    const id = e.categoryId?._id;
    if (id) sevenDayCatTotals[id] = (sevenDayCatTotals[id] || 0) + e.amount;
  });

  // Sort and pick top 3
  const top7DayCategories = Object.entries(sevenDayCatTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const sevenDayActions: ActionItem[] = [];
  let sevenDayTotalSavings = 0;

  top7DayCategories.forEach(([catId, amount], idx) => {
    const savings = amount * 0.50; // Cut by 50%
    sevenDayTotalSavings += savings;
    sevenDayActions.push({
      id: `7day-${catId}`,
      category: categoryNameMap[catId],
      instruction: `Cap spending on ${categoryNameMap[catId]} to ${(amount * 0.50).toFixed(0)} LKR for the next 7 days.`,
      savingsLKR: savings,
      iconName: idx === 0 ? 'zap' : 'scissors'
    });
  });

  // Fallback if no wants
  if (sevenDayActions.length === 0) {
    sevenDayActions.push({
      id: '7day-fallback',
      category: 'General Optimization',
      instruction: 'Find 10% cheaper alternatives for your mandatory Needs (Groceries, Transit) this week.',
      savingsLKR: 500, // Dummy estimate
      iconName: 'target'
    });
    sevenDayTotalSavings = 500;
  }

  // Generate 6-month projection for 7-day plan (scaled up)
  // Assuming they save `sevenDayTotalSavings` every week for 6 months (approx 26 weeks)
  const sevenDayProjection = [];
  let cumulative7 = 0;
  for (let i = 1; i <= 6; i++) {
    cumulative7 += (sevenDayTotalSavings * 4.33); // approx weeks in a month
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    sevenDayProjection.push({
      month: d.toLocaleString('default', { month: 'short' }),
      cumulative: cumulative7
    });
  }

  // --- 30-DAY PLAN (Sustainable 20% cuts + Budget Enforcement) ---
  const last30Days = expenses.filter(e => {
    const d = new Date(e.date);
    return d >= thirtyDaysAgo && d < now;
  });

  const thirtyDayActions: ActionItem[] = [];
  let thirtyDayTotalSavings = 0;

  // 1. Cut Wants by 20%
  let totalWants30 = 0;
  last30Days.forEach(e => {
    const group = categoryGroupMap[e.categoryId?._id];
    if (group === 'Wants') totalWants30 += e.amount;
  });

  if (totalWants30 > 0) {
    const savings = totalWants30 * 0.20;
    thirtyDayTotalSavings += savings;
    thirtyDayActions.push({
      id: '30day-wants',
      category: 'Discretionary Spending',
      instruction: 'Reduce overall spending on "Wants" by 20% over the next month.',
      savingsLKR: savings,
      iconName: 'pie-chart'
    });
  }

  // 2. Eliminate Budget Overages
  let totalOverages = 0;
  budgets.forEach(b => {
    const catId = b.categoryId?._id;
    if (!catId) return;
    const spent = last30Days
      .filter(e => e.categoryId?._id === catId)
      .reduce((sum, e) => sum + e.amount, 0);
    
    if (spent > b.amountLimit) {
      totalOverages += (spent - b.amountLimit);
    }
  });

  if (totalOverages > 0) {
    thirtyDayTotalSavings += totalOverages;
    thirtyDayActions.push({
      id: '30day-overages',
      category: 'Budget Enforcement',
      instruction: 'Strictly adhere to your set budget limits to eliminate overspending penalties.',
      savingsLKR: totalOverages,
      iconName: 'shield-alert'
    });
  }

  // Fallback
  if (thirtyDayActions.length === 0) {
    thirtyDayActions.push({
      id: '30day-fallback',
      category: 'Investment Routing',
      instruction: 'Your spending is perfectly optimized! Route an extra 1000 LKR into savings automatically.',
      savingsLKR: 1000,
      iconName: 'trending-up'
    });
    thirtyDayTotalSavings = 1000;
  }

  // Generate 6-month projection for 30-day plan
  const thirtyDayProjection = [];
  let cumulative30 = 0;
  for (let i = 1; i <= 6; i++) {
    cumulative30 += thirtyDayTotalSavings;
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    thirtyDayProjection.push({
      month: d.toLocaleString('default', { month: 'short' }),
      cumulative: cumulative30
    });
  }

  return {
    sevenDay: {
      type: '7-day',
      totalProjectedSavings: sevenDayTotalSavings,
      actionItems: sevenDayActions,
      projectionData: sevenDayProjection
    },
    thirtyDay: {
      type: '30-day',
      totalProjectedSavings: thirtyDayTotalSavings,
      actionItems: thirtyDayActions,
      projectionData: thirtyDayProjection
    }
  };
};
