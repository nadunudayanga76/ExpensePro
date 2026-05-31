import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getExpenses, deleteExpense, getCategories } from '../api';
import Dropdown from '../components/Dropdown';
import { Trash2, Search } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { IconMap } from '../utils/IconMap';
import { useToast } from '../components/ToastProvider';

const Expenses = () => {
  const location = useLocation();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(location.state?.categoryId || '');
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'all' | 'expense' | 'income'>(location.state?.activeTab || 'all');
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expRes, catRes] = await Promise.all([getExpenses(), getCategories()]);
      setExpenses(expRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id);
        setExpenses(expenses.filter(e => e._id !== id));
        showToast('Expense deleted successfully! 🗑️', 'success');
      } catch (err) {
        console.error(err);
        showToast('Failed to delete expense.', 'error');
      }
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const notes = exp.notes || '';
    const catName = exp.categoryId?.name || '';
    const matchesSearch = notes.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          catName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? exp.categoryId?._id === selectedCategory : true;
    
    // Time filter
    let matchesTime = true;
    if (filter !== 'all') {
      const expDate = new Date(exp.date);
      const now = new Date();
      if (filter === 'month') {
        matchesTime = expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
      } else if (filter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesTime = expDate >= weekAgo;
      }
    }

    // Tab filter
    const matchesTab = activeTab === 'all' || exp.type === activeTab;

    return matchesSearch && matchesCategory && matchesTime && matchesTab;
  });

  const totalFilteredAmount = filteredExpenses.reduce((sum, exp) => sum + (exp.type === 'income' ? exp.amount : (activeTab === 'all' ? -exp.amount : exp.amount)), 0);

  if (loading) return <div className="text-secondary" style={{ padding: '2rem' }}>Loading transactions...</div>;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '2rem' }}>
      
      {/* Tabs */}
      <div className="flex gap-4 mb-6" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('all')}
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1.05rem', fontWeight: 600, cursor: 'pointer',
            color: activeTab === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'all' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            marginBottom: '-0.5rem', transition: 'all 0.2s'
          }}
        >
          All
        </button>
        <button 
          onClick={() => setActiveTab('expense')}
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1.05rem', fontWeight: 600, cursor: 'pointer',
            color: activeTab === 'expense' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'expense' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            marginBottom: '-0.5rem', transition: 'all 0.2s'
          }}
        >
          Expenses
        </button>
        <button 
          onClick={() => setActiveTab('income')}
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1.05rem', fontWeight: 600, cursor: 'pointer',
            color: activeTab === 'income' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'income' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            marginBottom: '-0.5rem', transition: 'all 0.2s'
          }}
        >
          Income
        </button>
      </div>
      
      {activeTab === 'income' && filteredExpenses.length > 0 && (
        <div className="glass-panel mb-6" style={{ padding: '1.5rem 1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Income Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {(Object.entries(
              filteredExpenses.reduce((acc, exp) => {
                const source = exp.incomeSource || 'other';
                acc[source] = (acc[source] || 0) + exp.amount;
                return acc;
              }, {} as Record<string, number>)
            ) as [string, number][]).sort((a, b) => b[1] - a[1]).map(([source, amount], index) => {
              const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
              const color = colors[index % colors.length];
              
              return (
                <div 
                  key={source} 
                  style={{ 
                    padding: '1.25rem', 
                    backgroundColor: `${color}10`, 
                    borderRadius: 'var(--radius-md)', 
                    border: `1px solid ${color}30`,
                    animation: 'fadeInUp 0.4s var(--ease-spring) both',
                    animationDelay: `${index * 0.1}s`,
                    transition: 'transform 0.2s',
                    cursor: 'default'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textTransform: 'capitalize', marginBottom: '0.25rem' }}>{source}</div>
                  <div style={{ fontSize: '1.35rem', color, fontWeight: 700 }}>{formatCurrency(amount)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filter Top Bar */}
      <div className="glass-panel mb-6" style={{ padding: '1.5rem 1.75rem' }}>
        <div className="flex gap-4 mb-6">
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} color="var(--text-tertiary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search transactions..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '0.875rem 1rem 0.875rem 2.75rem',
                color: 'var(--text-primary)',
                fontSize: '0.95rem'
              }}
            />
          </div>
          <Dropdown
            value={filter}
            onChange={(val) => setFilter(val)}
            options={[
              { value: 'all', label: 'All Time' },
              { value: 'month', label: 'This Month' },
              { value: 'week', label: 'This Week' }
            ]}
          />
          {activeTab !== 'income' && (
            <div style={{ width: '220px' }}>
              <Dropdown
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
                options={[{ value: '', label: 'All Categories' }, ...categories.map(cat => ({ value: cat._id, label: cat.name }))]}
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center" style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
          <div>{filteredExpenses.length} results</div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatCurrency(totalFilteredAmount)}</div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="glass-panel" style={{ padding: '1.5rem 1.75rem' }}>
        {filteredExpenses.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '3rem 0' }}>No transactions found.</p>
        ) : (
          <div className="flex-col">
            {filteredExpenses.map((exp, index) => {
              const catColor = exp.categoryId?.color || 'var(--text-secondary)';
              return (
                <div key={exp._id} className="transaction-card flex justify-between items-center group" style={{ 
                  padding: '1.25rem 0', 
                  borderBottom: index < filteredExpenses.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                  gap: '1rem'
                }}>
                  <div className="flex items-center gap-4" style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ flexShrink: 0 }}>
                      {exp.type === 'income' ? (
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconMap name="trending-up" color="#10b981" size={24} />
                        </div>
                      ) : (
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: `${catColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconMap name={exp.categoryId?.icon || 'help-circle'} color={catColor} size={24} />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1rem', fontWeight: 600, textTransform: exp.type === 'income' && !exp.notes ? 'capitalize' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {exp.notes || (exp.type === 'income' ? (exp.incomeSource || 'Income') : exp.categoryId?.name) || 'Unknown'}
                      </h4>
                      <div className="flex items-center gap-2" style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                        <span style={{ whiteSpace: 'nowrap' }}>{new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        {exp.walletId && (
                          <>
                            <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>{exp.walletId?.name || 'Wallet'}</span>
                          </>
                        )}
                        <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                        <span style={{ 
                          backgroundColor: exp.type === 'income' ? 'rgba(16, 185, 129, 0.15)' : `${catColor}15`, 
                          color: exp.type === 'income' ? '#10b981' : catColor, 
                          padding: '2px 8px', 
                          borderRadius: 'var(--radius-full)', 
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          textTransform: 'capitalize',
                          whiteSpace: 'nowrap'
                        }}>
                          {exp.type === 'income' ? (exp.incomeSource || 'Income') : (exp.categoryId?.name || 'Unknown')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
                    <div className="currency-text" style={{ fontSize: '1.1rem', fontWeight: 600, color: exp.type === 'income' ? '#10b981' : 'var(--text-primary)' }}>
                      {exp.type === 'income' ? '+' : '-'}{formatCurrency(exp.amount)}
                    </div>
                    <button 
                      onClick={() => handleDelete(exp._id)}
                      style={{ 
                        background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '0.5rem',
                        opacity: 0.5, transition: 'opacity 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseOut={(e) => e.currentTarget.style.opacity = '0.5'}
                      title="Delete Transaction"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default Expenses;
