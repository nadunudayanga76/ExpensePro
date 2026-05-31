import { useState, useEffect } from 'react';
import { getExpenses, getBudgets } from '../api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { formatCurrency } from '../utils/format';
import { Calendar, Lightbulb, PiggyBank, Target } from 'lucide-react';
import GlowCard from '../components/GlowCard';

const Insights = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getExpenses(), getBudgets()]).then(([eRes, bRes]) => {
      setExpenses(eRes.data);
      setBudgets(bRes.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  // --- 1. Summaries ---
  const currentMonthExpenses = expenses.filter(e => new Date(e.date) >= currentMonthStart && new Date(e.date) < currentMonthEnd);
  const totalMtd = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const daysPassed = now.getDate();
  const avgDaily = totalMtd / daysPassed;

  const catSpending: Record<string, number> = {};
  currentMonthExpenses.forEach(e => {
    const name = e.categoryId?.name || 'Unknown';
    catSpending[name] = (catSpending[name] || 0) + e.amount;
  });

  // --- 2. Savings Potential Engine ---
  let wantsSpending = 0;
  let overBudgetAmount = 0;

  budgets.forEach(b => {
    const catId = b.categoryId?._id;
    if (!catId) return;
    
    const spent = currentMonthExpenses
      .filter(e => e.categoryId?._id === catId)
      .reduce((sum, e) => sum + e.amount, 0);
      
    if (spent > b.amountLimit) {
      overBudgetAmount += (spent - b.amountLimit);
    }
  });

  currentMonthExpenses.forEach(e => {
    const group = e.categoryId?.group;
    if (group === 'Wants' || group === 'General') {
      wantsSpending += e.amount;
    }
  });

  const potentialSavings = (wantsSpending * 0.20) + overBudgetAmount;

  // --- 3. Chart Data Prep ---
  // Pie Chart
  const pieData = Object.entries(catSpending).map(([name, value]) => {
    const cat = currentMonthExpenses.find(e => e.categoryId?.name === name)?.categoryId;
    return { name, value, color: cat?.color || '#94a3b8' };
  }).sort((a, b) => b.value - a.value);

  // Month over Month Bar Chart
  const momDataMap: Record<string, { category: string, current: number, previous: number }> = {};
  expenses.forEach(e => {
    const d = new Date(e.date);
    const catName = e.categoryId?.name || 'Unknown';
    if (!momDataMap[catName]) momDataMap[catName] = { category: catName, current: 0, previous: 0 };
    
    if (d >= currentMonthStart && d < currentMonthEnd) {
      momDataMap[catName].current += e.amount;
    } else if (d >= lastMonthStart && d < currentMonthStart) {
      momDataMap[catName].previous += e.amount;
    }
  });
  const momData = Object.values(momDataMap).filter(d => d.current > 0 || d.previous > 0).sort((a, b) => b.current - a.current).slice(0, 6);

  // Cumulative Trend Line
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const trendData = Array.from({ length: daysInMonth }).map((_, i) => ({ day: i + 1, actual: 0, target: 0 }));
  
  const totalBudget = budgets.reduce((sum, b) => sum + b.amountLimit, 0);
  const dailyTarget = totalBudget / daysInMonth;
  
  let runningActual = 0;
  let runningTarget = 0;
  
  for (let i = 0; i < daysInMonth; i++) {
    runningTarget += dailyTarget;
    trendData[i].target = runningTarget;
    
    if (i < daysPassed) {
      const dayExpenses = currentMonthExpenses.filter(e => new Date(e.date).getDate() === i + 1);
      runningActual += dayExpenses.reduce((sum, e) => sum + e.amount, 0);
      trendData[i].actual = runningActual;
    } else {
      trendData[i].actual = null as any; // Don't plot future days
    }
  }

  if (loading) return <div className="text-secondary">Loading insights...</div>;

  return (
    <div>
      
      {/* 1. Summaries */}
      <div className="insights-summary-grid">
        <GlowCard glowColor="rgba(59, 130, 246, 0.5)" style={{ padding: '1.5rem', animation: 'fadeInUp 0.4s ease forwards', animationDelay: '0.1s', opacity: 0 }}>
          <div className="flex items-center gap-3 mb-2" style={{ color: '#3b82f6' }}>
            <Calendar size={18} /> <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Month to Date</span>
          </div>
          <div className="currency-text" style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginTop: '0.5rem' }}>{formatCurrency(totalMtd)}</div>
        </GlowCard>
        
        <GlowCard glowColor="rgba(16, 185, 129, 0.5)" style={{ padding: '1.5rem', animation: 'fadeInUp 0.4s ease forwards', animationDelay: '0.2s', opacity: 0 }}>
          <div className="flex items-center gap-3 mb-2" style={{ color: '#10b981' }}>
            <Target size={18} /> <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Avg Daily Spend</span>
          </div>
          <div className="currency-text" style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginTop: '0.5rem' }}>{formatCurrency(avgDaily)}</div>
        </GlowCard>
        
        <GlowCard glowColor="rgba(139, 92, 246, 0.5)" className="span-2-desktop" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.05))', borderColor: 'rgba(139, 92, 246, 0.2)', animation: 'fadeInUp 0.4s ease forwards', animationDelay: '0.3s', opacity: 0 }}>
          <div className="flex items-center gap-3 mb-2" style={{ color: 'var(--accent-primary)' }}>
            <Lightbulb size={18} /> <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Actionable Savings Potential</span>
          </div>
          <div className="flex justify-between items-end mt-2">
            <div>
              <div className="currency-text" style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>{formatCurrency(potentialSavings)}</div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '0.35rem' }}>Could be saved by cutting 'Wants' by 20% & eliminating overages.</p>
            </div>
            <PiggyBank size={36} color="var(--accent-primary)" style={{ opacity: 0.3 }} />
          </div>
        </GlowCard>
      </div>

      <div className="insights-charts-grid">
        
        {/* Cumulative Trend */}
        <div className="glass-panel hover-lift" style={{ padding: '2rem', height: '400px', animation: 'fadeInUp 0.4s ease forwards', animationDelay: '0.4s', opacity: 0 }}>
          <h4 className="mb-4 text-center">Cumulative Spending vs Budget Pace</h4>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(val) => `Rs${val}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                itemStyle={{ color: 'var(--text-primary)' }}
                labelFormatter={(val) => `Day ${val}`}
                formatter={(value: any, name: any) => [formatCurrency(value), name === 'actual' ? 'Actual Spend' : 'Budget Pace']}
              />
              <Line type="monotone" dataKey="target" stroke="var(--text-secondary)" strokeDasharray="5 5" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="actual" stroke="var(--accent-primary)" dot={false} strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Current Month Composition */}
        <div className="glass-panel hover-lift" style={{ padding: '2rem', height: '400px', animation: 'fadeInUp 0.4s ease forwards', animationDelay: '0.5s', opacity: 0 }}>
          <h4 className="mb-4 text-center">Current Month Composition</h4>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  formatter={(value: any) => [formatCurrency(value), 'Amount']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-secondary">No data available</div>
          )}
        </div>

        {/* Month over Month Comparison */}
        <div className="glass-panel span-2-desktop hover-lift" style={{ padding: '2rem', height: '400px', animation: 'fadeInUp 0.4s ease forwards', animationDelay: '0.6s', opacity: 0 }}>
          <h4 className="mb-4 text-center">Month-over-Month Comparison (Top 6)</h4>
          {momData.length > 0 ? (
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={momData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="category" stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(val) => `Rs${val}`} />
                <Tooltip 
                  cursor={{ fill: 'var(--bg-surface-hover)' }}
                  contentStyle={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  formatter={(value: any, name: any) => [formatCurrency(value), name === 'current' ? 'This Month' : 'Last Month']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }} />
                <Bar dataKey="previous" name="Last Month" fill="var(--text-tertiary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="current" name="This Month" fill="var(--accent-secondary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-secondary">No data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Insights;
