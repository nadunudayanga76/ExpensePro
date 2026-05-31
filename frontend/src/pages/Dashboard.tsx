import { useEffect, useState } from 'react';
import { getExpenses, getBudgets, getWallets, type Wallet } from '../api';
import { DollarSign, TrendingUp, Activity, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import { IconMap } from '../utils/IconMap';
import GlowCard from '../components/GlowCard';
import WalletsWidget from '../components/WalletsWidget';

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <span style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
      {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
    </span>
  );
};

const Dashboard = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [expRes, budgRes, walRes] = await Promise.all([getExpenses(), getBudgets(), getWallets()]);
      setExpenses(expRes.data);
      setBudgets(budgRes.data);
      setWallets(walRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="text-secondary" style={{ padding: '2rem' }}>Loading dashboard...</div>;

  // Header Date & Greeting
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const hour = today.getHours();
  let greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.name) {
        const firstName = user.name.split(' ')[0];
        greeting = `${greeting}, ${firstName}`;
      }
    }
  } catch (e) {
    console.error('Error parsing user data:', e);
  }

  // Time calculations
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  let thisMonthSpent = 0;
  let lastMonthSpent = 0;
  let lastMonthTxCount = 0;
  let thisMonthIncome = 0;

  expenses.forEach(exp => {
    const d = new Date(exp.date);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      if (exp.type === 'income') thisMonthIncome += exp.amount;
      else thisMonthSpent += exp.amount;
    } else if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) {
      if (exp.type !== 'income') {
        lastMonthSpent += exp.amount;
        lastMonthTxCount++;
      }
    }
  });

  const percentChange = lastMonthSpent === 0 
    ? 0 
    : ((thisMonthSpent - lastMonthSpent) / lastMonthSpent) * 100;

  const allTimeSpent = expenses.filter(e => e.type !== 'income').reduce((sum, e) => sum + e.amount, 0);

  // Weekly Chart Data
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateStr: d.toISOString().split('T')[0],
      amount: 0
    };
  });

  let weeklyTotal = 0;
  expenses.forEach(exp => {
    if (exp.type === 'income') return;
    const expDate = new Date(exp.date).toISOString().split('T')[0];
    const day = last7DaysData.find(d => d.dateStr === expDate);
    if (day) {
      day.amount += exp.amount;
      weeklyTotal += exp.amount;
    }
  });

  // Budgets Progress
  const getSpentAmount = (categoryId: string) => {
    return expenses
      .filter(e => e.categoryId?._id === categoryId && e.type !== 'income')
      .reduce((sum, e) => sum + e.amount, 0);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '2rem' }}>
      
      {/* Header */}
      <div className="mb-8" style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>{greeting} 👋</h2>
        <div className="flex items-center gap-2">
          <p style={{ color: 'var(--text-tertiary)', margin: 0, fontSize: '0.95rem' }}>{dateString}</p>
          <span style={{ color: 'var(--text-tertiary)', opacity: 0.5 }}>•</span>
          <LiveClock />
        </div>
      </div>

      <WalletsWidget wallets={wallets} onWalletsChange={fetchData} />

      {/* Top Stats Row */}
      <div className="grid-cards mb-8" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        
        <GlowCard glowColor="rgba(139, 92, 246, 0.5)" style={{ 
          padding: '1.5rem', 
          border: '1px solid rgba(255,255,255,0.05)', 
          boxShadow: '0 10px 30px -10px rgba(139, 92, 246, 0.25)',
          background: 'var(--bg-surface)'
        }}>
          <div className="flex justify-between items-start mb-4">
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>This Month</span>
            <DollarSign size={18} color="#8b5cf6" />
          </div>
          <div className="currency-text" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{formatCurrency(thisMonthSpent)}</div>
          <div style={{ fontSize: '0.85rem', color: percentChange > 0 ? '#ef4444' : '#10b981' }}>
            {percentChange > 0 ? '↗ +' : '↘ '}{percentChange.toFixed(1)}% vs last month
          </div>
        </GlowCard>

        <GlowCard glowColor="rgba(16, 185, 129, 0.5)" style={{ 
          padding: '1.5rem', 
          border: '1px solid rgba(255,255,255,0.05)', 
          boxShadow: '0 10px 30px -10px rgba(16, 185, 129, 0.25)',
          background: 'var(--bg-surface)'
        }}>
          <div className="flex justify-between items-start mb-4">
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Income (Month)</span>
            <ArrowDownRight size={18} color="#10b981" />
          </div>
          <div className="currency-text" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#10b981' }}>+{formatCurrency(thisMonthIncome)}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
            Money in this month
          </div>
        </GlowCard>

        <GlowCard glowColor="rgba(59, 130, 246, 0.5)" style={{ 
          padding: '1.5rem', 
          border: '1px solid rgba(255,255,255,0.05)', 
          boxShadow: '0 10px 30px -10px rgba(59, 130, 246, 0.25)',
          background: 'var(--bg-surface)'
        }}>
          <div className="flex justify-between items-start mb-4">
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Net Savings</span>
            <TrendingUp size={18} color="#3b82f6" />
          </div>
          <div className="currency-text" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{formatCurrency(thisMonthIncome - thisMonthSpent)}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
            {thisMonthIncome > thisMonthSpent ? 'Great job saving!' : 'Over budget this month'}
          </div>
        </GlowCard>

        <GlowCard glowColor="rgba(244, 63, 94, 0.5)" style={{ 
          padding: '1.5rem', 
          border: '1px solid rgba(255,255,255,0.05)', 
          boxShadow: '0 10px 30px -10px rgba(244, 63, 94, 0.25)',
          background: 'var(--bg-surface)'
        }}>
          <div className="flex justify-between items-start mb-4">
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>All-Time Spent</span>
            <Activity size={18} color="#f43f5e" />
          </div>
          <div className="currency-text" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{formatCurrency(allTimeSpent)}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
            Since you started tracking
          </div>
        </GlowCard>

      </div>

      {/* Main Grid */}
      <div className="grid-cards" style={{ gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', alignItems: 'stretch' }}>
        
        {/* Weekly Chart */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0', fontWeight: 600 }}>Weekly Spending</h3>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Mon - Sun this week</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Total</div>
              <div className="currency-text" style={{ fontSize: '1.25rem' }}>{formatCurrency(weeklyTotal)}</div>
            </div>
          </div>
          
          <div style={{ flex: 1, minHeight: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7DaysData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} 
                  dy={10} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                  itemStyle={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'Inter' }}
                  formatter={(value: any) => [formatCurrency(value), '']}
                  labelStyle={{ display: 'none' }}
                />
                <Bar dataKey="amount" radius={[6, 6, 6, 6]} maxBarSize={32}>
                  {last7DaysData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill="var(--accent-primary)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Progress */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
          <div className="mb-6">
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0', fontWeight: 600 }}>Budget Progress</h3>
            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Current period limits</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
            {budgets.slice(0, 4).map(budget => {
              const spent = getSpentAmount(budget.categoryId?._id);
              const limit = budget.amountLimit;
              const remaining = limit - spent;
              const percentage = Math.min((spent / limit) * 100, 100);
              const color = budget.categoryId?.color || 'var(--text-secondary)';

              return (
                <div key={budget._id}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{budget.categoryId?.name}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      <span className="currency-text" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(spent)}</span>
                      <span style={{ color: 'var(--text-tertiary)' }}> / {formatCurrency(limit)}</span>
                    </div>
                  </div>
                  
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-dark)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                    <div style={{ 
                      width: `${percentage}%`, 
                      height: '100%', 
                      backgroundColor: color,
                      borderRadius: '3px'
                    }} />
                  </div>
                  
                  <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                    {remaining >= 0 
                      ? `${formatCurrency(remaining)} remaining · ${(100 - (spent/limit)*100).toFixed(0)}% left`
                      : `${formatCurrency(Math.abs(remaining))} over budget`}
                  </div>
                </div>
              );
            })}
            
            {budgets.length === 0 && (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', margin: 'auto' }}>No budgets created.</p>
            )}
          </div>
        </div>

      </div>

      {/* Recent Transactions */}
      <div className="glass-panel mt-8" style={{ padding: '1.75rem', marginTop: '1.5rem' }}>
        <div className="flex justify-between items-center mb-6" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0', fontWeight: 600 }}>Recent Transactions</h3>
            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Latest 6 expenses</div>
          </div>
          <Link to="/expenses" style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 500 }} className="flex items-center gap-1">
            View all &rarr;
          </Link>
        </div>

        <div className="flex-col" style={{ display: 'flex', flexDirection: 'column' }}>
          {expenses.slice(0, 6).map((exp, index) => {
            const catColor = exp.categoryId?.color || 'var(--text-secondary)';
            return (
              <div key={exp._id} className="flex justify-between items-center" style={{ 
                padding: '1.25rem 0', 
                borderBottom: index < Math.min(expenses.length - 1, 5) ? '1px solid rgba(255,255,255,0.03)' : 'none',
                gap: '1rem' 
              }}>
                <div className="flex items-center gap-4" style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    width: '42px', height: '42px', borderRadius: '10px', 
                    backgroundColor: exp.type === 'income' ? 'rgba(16, 185, 129, 0.15)' : `${catColor}15`, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {exp.type === 'income' 
                      ? <ArrowDownRight size={20} color="#10b981" />
                      : <IconMap name={exp.categoryId?.icon || 'help-circle'} size={20} color={catColor} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '0.95rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exp.notes || exp.categoryId?.name || (exp.type === 'income' ? 'Income' : 'Unknown')}</h4>
                    <div className="flex items-center gap-2" style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                      <span style={{ whiteSpace: 'nowrap' }}>{new Date(exp.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      {exp.walletId && (
                        <>
                          <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>{exp.walletId.name}</span>
                        </>
                      )}
                      <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                      <span style={{ 
                        backgroundColor: exp.type === 'income' ? 'rgba(16, 185, 129, 0.15)' : `${catColor}15`, 
                        color: exp.type === 'income' ? '#10b981' : catColor, 
                        padding: '2px 8px', 
                        borderRadius: 'var(--radius-full)', 
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        whiteSpace: 'nowrap'
                      }}>
                        {exp.type === 'income' ? 'Income' : (exp.categoryId?.name || 'Unknown')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="currency-text" style={{ fontSize: '1.05rem', fontWeight: 600, color: exp.type === 'income' ? '#10b981' : 'var(--text-primary)', flexShrink: 0 }}>
                  {exp.type === 'income' ? '+' : '-'}{formatCurrency(exp.amount)}
                </div>
              </div>
            );
          })}
          {expenses.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>No recent transactions.</div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
