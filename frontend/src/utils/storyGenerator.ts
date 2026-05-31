export interface MonthlyStory {
  monthName: string;
  totalSpent: number;
  totalBudget: number;
  topSpendingDay: { dateStr: string; amount: number };
  biggestSavingsDay: { dateStr: string; amountSaved: number };
  topCategory: { name: string; amount: number; percentage: number };
  performanceText: string;
  performanceType: 'success' | 'warning' | 'danger';
}

export const generateMonthlyStory = (expenses: any[], budgets: any[]): MonthlyStory => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Filter for current month
  const monthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d >= currentMonthStart && d < currentMonthEnd;
  });

  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = budgets.reduce((sum, b) => sum + b.amountLimit, 0);

  // Group by day
  const dailyTotals: Record<string, number> = {};
  monthExpenses.forEach(e => {
    const dateStr = new Date(e.date).toLocaleDateString();
    dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + e.amount;
  });

  // Top Spending Day
  let topSpendingDay = { dateStr: 'None', amount: 0 };
  Object.entries(dailyTotals).forEach(([date, amount]) => {
    if (amount > topSpendingDay.amount) {
      topSpendingDay = { dateStr: date, amount };
    }
  });

  // Biggest Savings Day
  // Defined as the day with the highest positive gap between daily target and actual spend
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyTarget = totalBudget / daysInMonth;
  
  let biggestSavingsDay = { dateStr: 'None', amountSaved: 0 };
  
  // Only check days that have passed
  const daysPassed = now.getDate();
  for (let i = 1; i <= daysPassed; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), i);
    const dateStr = d.toLocaleDateString();
    const spentThatDay = dailyTotals[dateStr] || 0;
    
    const saved = dailyTarget - spentThatDay;
    if (saved > biggestSavingsDay.amountSaved) {
      biggestSavingsDay = { dateStr, amountSaved: saved };
    }
  }

  // Top Category
  const catTotals: Record<string, number> = {};
  monthExpenses.forEach(e => {
    const name = e.categoryId?.name || 'Unknown';
    catTotals[name] = (catTotals[name] || 0) + e.amount;
  });

  let topCategory = { name: 'None', amount: 0, percentage: 0 };
  Object.entries(catTotals).forEach(([name, amount]) => {
    if (amount > topCategory.amount) {
      topCategory = { 
        name, 
        amount, 
        percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0 
      };
    }
  });

  // Performance
  let performanceText = '';
  let performanceType: 'success' | 'warning' | 'danger' = 'success';
  
  if (totalBudget === 0) {
    performanceText = "You haven't set any budgets yet!";
    performanceType = 'warning';
  } else if (totalSpent <= totalBudget) {
    const percentUnder = ((totalBudget - totalSpent) / totalBudget) * 100;
    performanceText = `You stayed ${percentUnder.toFixed(0)}% under budget. Incredible work!`;
    performanceType = 'success';
  } else {
    const percentOver = ((totalSpent - totalBudget) / totalBudget) * 100;
    performanceText = `You went ${percentOver.toFixed(0)}% over budget this month.`;
    performanceType = 'danger';
  }

  return {
    monthName,
    totalSpent,
    totalBudget,
    topSpendingDay,
    biggestSavingsDay,
    topCategory,
    performanceText,
    performanceType
  };
};
