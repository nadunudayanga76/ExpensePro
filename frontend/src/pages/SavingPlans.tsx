import { useState, useEffect } from 'react';
import { getExpenses, getBudgets, getCategories } from '../api';
import { generateSavingPlans } from '../utils/savingPlanGenerator';
import type { SavingPlan } from '../utils/savingPlanGenerator';
import { formatCurrency } from '../utils/format';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Target, Zap, Scissors, PieChart, ShieldAlert, TrendingUp } from 'lucide-react';

const SavingPlans = () => {
  const [plans, setPlans] = useState<{ sevenDay: SavingPlan, thirtyDay: SavingPlan } | null>(null);
  const [activePlanType, setActivePlanType] = useState<'7-day' | '30-day'>('7-day');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getExpenses(), getBudgets(), getCategories()]).then(([eRes, bRes, cRes]) => {
      const generated = generateSavingPlans(eRes.data, bRes.data, cRes.data);
      setPlans(generated);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading || !plans) return <div className="text-secondary">Analyzing behavior and generating plans...</div>;

  const activePlan = activePlanType === '7-day' ? plans.sevenDay : plans.thirtyDay;

  const renderIcon = (name: string) => {
    switch (name) {
      case 'zap': return <Zap size={20} color="var(--accent-warning)" />;
      case 'scissors': return <Scissors size={20} color="var(--accent-danger)" />;
      case 'pie-chart': return <PieChart size={20} color="var(--accent-primary)" />;
      case 'shield-alert': return <ShieldAlert size={20} color="var(--accent-danger)" />;
      case 'trending-up': return <TrendingUp size={20} color="var(--accent-success)" />;
      default: return <Target size={20} color="var(--accent-secondary)" />;
    }
  };

  return (
    <div>
      <div className="saving-plans-header flex justify-between items-center mb-8">
        <div>
          <h2 style={{ fontSize: '1.75rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Target color="var(--accent-primary)" /> Smart Saving Plans
          </h2>
          <p style={{ color: 'var(--text-tertiary)', margin: '0.5rem 0 0 0' }}>AI-generated strategies based on your historical behavior.</p>
        </div>

        {/* Toggle Switch */}
        <div className="plan-toggle-container" style={{ display: 'flex', backgroundColor: 'var(--bg-dark)', padding: '0.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => setActivePlanType('7-day')}
            className={`btn plan-toggle-btn ${activePlanType === '7-day' ? 'btn-primary' : ''}`}
            style={{ padding: '0.5rem 1.5rem', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', background: activePlanType === '7-day' ? 'var(--accent-primary)' : 'transparent', color: activePlanType === '7-day' ? 'white' : 'var(--text-secondary)' }}
          >
            7-Day Aggressive
          </button>
          <button 
            onClick={() => setActivePlanType('30-day')}
            className={`btn plan-toggle-btn ${activePlanType === '30-day' ? 'btn-primary' : ''}`}
            style={{ padding: '0.5rem 1.5rem', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', background: activePlanType === '30-day' ? 'var(--accent-primary)' : 'transparent', color: activePlanType === '30-day' ? 'white' : 'var(--text-secondary)' }}
          >
            30-Day Sustainable
          </button>
        </div>
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: '1.2fr 1fr', alignItems: 'start' }}>
        
        {/* Left Column: Action Items */}
        <div>
          <div className="glass-panel mb-6" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(59, 130, 246, 0.05))' }}>
            <h4 style={{ color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', fontWeight: 500 }}>Total Potential Savings</h4>
            <div className="currency-text text-gradient" style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1 }}>
              {formatCurrency(activePlan.totalProjectedSavings)}
            </div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
              If you stick to this {activePlanType} plan.
            </p>
          </div>

          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Action Plan</h3>
          <div className="flex-col gap-4" style={{ display: 'flex' }}>
            {activePlan.actionItems.map(item => (
              <div key={item.id} className="glass-panel flex items-start gap-4" style={{ padding: '1.25rem', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateX(4px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateX(0)'}>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-dark)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  {renderIcon(item.iconName)}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                    {item.category}
                    <span className="currency-text" style={{ color: 'var(--accent-success)' }}>+{formatCurrency(item.savingsLKR)}</span>
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.4 }}>
                    {item.instruction}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Projection Chart */}
        <div className="glass-panel" style={{ padding: '2rem', height: '100%', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>6-Month Wealth Projection</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: '2rem' }}>Compounding growth if you maintain this behavior.</p>
          
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activePlan.projectionData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-success)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-success)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(val) => `Rs${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                  itemStyle={{ color: 'var(--accent-success)', fontWeight: 600, fontFamily: 'JetBrains Mono' }}
                  labelStyle={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}
                  formatter={(value: any) => [formatCurrency(value), 'Projected Savings']}
                />
                <Area type="monotone" dataKey="cumulative" stroke="var(--accent-success)" strokeWidth={3} fillOpacity={1} fill="url(#colorCumulative)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SavingPlans;
