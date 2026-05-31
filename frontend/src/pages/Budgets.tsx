import { useState, useEffect } from 'react';
import { getBudgets, getExpenses, getCategories, updateBudget } from '../api';
import Dropdown from '../components/Dropdown';
import { formatCurrency } from '../utils/format';
import { IconMap } from '../utils/IconMap';
import { Plus, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useToast } from '../components/ToastProvider';

const Budgets = () => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amountLimit, setAmountLimit] = useState('');

  const fetchData = () => {
    Promise.all([getBudgets(), getExpenses(), getCategories()]).then(([bRes, eRes, cRes]) => {
      setBudgets(bRes.data);
      setExpenses(eRes.data);
      setCategories(cRes.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !amountLimit) return;
    
    try {
      await updateBudget({ 
        categoryId: selectedCategory, 
        amountLimit: Number(amountLimit) 
      });
      setIsModalOpen(false);
      setAmountLimit('');
      setSelectedCategory('');
      fetchData();
      showToast('Budget saved successfully! 🎯', 'success');
    } catch (err) {
      console.error('Failed to save budget:', err);
      showToast('Failed to save budget. Please try again.', 'error');
    }
  };

  const getSpentAmount = (categoryId: string) => {
    return expenses
      .filter(e => e.categoryId?._id === categoryId)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amountLimit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + getSpentAmount(b.categoryId?._id), 0);
  const totalRemaining = totalBudgeted - totalSpent;

  if (loading) return <div className="text-secondary">Loading budgets...</div>;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 style={{ fontSize: '1.75rem', margin: '0 0 0.25rem 0', fontWeight: 700 }}>Budgets</h2>
          <p style={{ color: 'var(--text-tertiary)', margin: 0, fontSize: '0.95rem' }}>Spending limits per category</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          <Plus size={18} /> New Budget
        </button>
      </div>

      {/* Top Summary Panel */}
      <div className="glass-panel mb-8" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Total Budgeted</div>
          <div className="currency-text" style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>{formatCurrency(totalBudgeted)}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Total Spent</div>
          <div className="currency-text" style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>{formatCurrency(totalSpent)}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Remaining</div>
          <div className="currency-text" style={{ fontSize: '1.5rem', color: totalRemaining >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
            {formatCurrency(totalRemaining)}
          </div>
        </div>
      </div>

      {/* Budget Cards Grid */}
      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {budgets.map(budget => {
          const spent = getSpentAmount(budget.categoryId?._id);
          const limit = budget.amountLimit;
          const remaining = limit - spent;
          const percentage = Math.min((spent / limit) * 100, 100);
          
          const isWarning = percentage > 85 && percentage < 100;
          const isExceeded = percentage >= 100;
          
          const progressColor = isExceeded ? 'var(--accent-danger)' : (isWarning ? 'var(--accent-warning)' : 'var(--accent-secondary)');
          
          return (
            <div key={budget._id} className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Card Header */}
              <div className="flex items-center gap-3">
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', 
                  backgroundColor: `${budget.categoryId?.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <IconMap name={budget.categoryId?.icon || 'help-circle'} size={20} color={budget.categoryId?.color} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{budget.categoryId?.name}</h4>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '0.1rem' }}>Monthly</div>
                </div>
              </div>

              {/* Amount and Percentage */}
              <div className="flex justify-between items-end">
                <div className="flex items-baseline gap-2">
                  <span className="currency-text" style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>
                    {formatCurrency(spent)}
                  </span>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                    of {formatCurrency(limit)} budget
                  </span>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {percentage.toFixed(0)}%
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-dark)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${percentage}%`, 
                  height: '100%', 
                  backgroundColor: progressColor,
                  transition: 'width 0.5s ease',
                  borderRadius: '3px'
                }}></div>
              </div>
              
              {/* Footer */}
              <div className="flex items-center gap-2" style={{ color: isExceeded ? 'var(--accent-danger)' : 'var(--accent-success)', fontSize: '0.9rem', fontWeight: 500 }}>
                {isExceeded ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                <span>
                  {isExceeded 
                    ? `${formatCurrency(Math.abs(remaining))} over budget` 
                    : `${formatCurrency(remaining)} remaining`}
                </span>
              </div>

            </div>
          );
        })}
        {budgets.length === 0 && (
          <p style={{ color: 'var(--text-tertiary)', gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0' }}>No budgets set yet.</p>
        )}
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 style={{ margin: 0 }}>Set New Budget</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveBudget}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <Dropdown
                  value={selectedCategory}
                  onChange={(val: string) => setSelectedCategory(val)}
                  options={categories.map(cat => ({ value: cat._id, label: `${cat.name} ${cat.group ? `(${cat.group})` : ''}` }))}
                  placeholder="Select Category"
                  required
                />
              </div>

              <div className="form-group mb-8">
                <label className="form-label">Monthly Limit (LKR)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={amountLimit} 
                  onChange={e => setAmountLimit(e.target.value)} 
                  placeholder="e.g. 5000"
                  required 
                  min="0"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem' }}>
                Save Budget
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;
