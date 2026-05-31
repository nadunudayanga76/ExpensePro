import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { addExpense, getCategories, scanReceipt, getWallets, type Wallet } from '../api';
import Dropdown from '../components/Dropdown';
import { RefreshCcw, Camera, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useToast } from '../components/ToastProvider';

const AddExpense = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [formData, setFormData] = useState({
    type: 'expense',
    walletId: '',
    amount: '',
    categoryId: '',
    incomeSource: 'salary',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    isRecurring: false
  });
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    showToast('Scanning receipt with AI... 🔍', 'info');
    
    try {
      const res = await scanReceipt(file);
      const data = res.data;
      
      let matchedCategoryId = formData.categoryId;
      if (data.categoryName) {
        const match = categories.find(c => 
          c.name.toLowerCase().includes(data.categoryName.toLowerCase()) || 
          data.categoryName.toLowerCase().includes(c.name.toLowerCase())
        );
        if (match) matchedCategoryId = match._id;
      }

      setFormData(prev => ({
        ...prev,
        amount: data.amount ? data.amount.toString() : prev.amount,
        notes: data.notes ? (prev.notes ? `${prev.notes} - ${data.notes}` : data.notes) : prev.notes,
        categoryId: matchedCategoryId
      }));
      
      showToast('Receipt scanned successfully! ✨', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to scan receipt. Please try manually.', 'error');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([getCategories(), getWallets()]).then(([catRes, walRes]) => {
      setCategories(catRes.data);
      setWallets(walRes.data);
      setFormData(prev => ({ 
        ...prev, 
        categoryId: catRes.data.length > 0 ? catRes.data[0]._id : '',
        walletId: walRes.data.length > 0 ? walRes.data[0]._id : ''
      }));
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount)
      };
      // Income transactions should not have a category, expenses should not have incomeSource
      if (payload.type === 'income') {
        delete (payload as any).categoryId;
      } else {
        delete (payload as any).incomeSource;
      }
      await addExpense(payload);
      showToast('Expense added successfully! ✅', 'success');
      navigate('/expenses');
    } catch (err) {
      console.error(err);
      showToast('Failed to add expense. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2 className="mb-2" style={{ fontSize: '1.5rem', margin: 0 }}>Add Transaction</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Record a new income or expense.</p>
        </div>
        
        <button 
          type="button" 
          onClick={handleScanClick}
          className="btn" 
          style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-primary)', border: '1px solid rgba(139, 92, 246, 0.3)', flexShrink: 0 }}
          disabled={isScanning}
        >
          <Camera size={18} />
          {isScanning ? 'Scanning...' : 'Scan Receipt'}
        </button>
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
        />
      </div>
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => setFormData({...formData, type: 'expense'})}
            style={{ 
              flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600,
              backgroundColor: formData.type === 'expense' ? 'rgba(244, 63, 94, 0.15)' : 'var(--bg-dark)',
              color: formData.type === 'expense' ? '#f43f5e' : 'var(--text-secondary)',
              border: formData.type === 'expense' ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-color)',
              transition: 'all 0.2s'
            }}
          >
            <ArrowUpRight size={18} /> Expense
          </button>
          <button
            type="button"
            onClick={() => setFormData({...formData, type: 'income'})}
            style={{ 
              flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600,
              backgroundColor: formData.type === 'income' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-dark)',
              color: formData.type === 'income' ? '#10b981' : 'var(--text-secondary)',
              border: formData.type === 'income' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)',
              transition: 'all 0.2s'
            }}
          >
            <ArrowDownRight size={18} /> Income
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">Wallet</label>
          <Dropdown
            value={formData.walletId}
            onChange={(val) => setFormData({...formData, walletId: val})}
            options={wallets.map(w => ({ value: w._id, label: `${w.name} (${w.type})` }))}
            placeholder={wallets.length === 0 ? "No wallets found - please add one first" : "Select Wallet"}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Amount (LKR)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontWeight: 500 }}>Rs</span>
            <input 
              type="number" 
              step="0.01"
              className="form-input currency-text" 
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              required
              placeholder="0.00"
              style={{ paddingLeft: '2.5rem', fontSize: '1.1rem' }}
            />
          </div>
        </div>
        
        {formData.type === 'expense' ? (
          <div className="form-group">
            <label className="form-label">Category</label>
            <Dropdown
              value={formData.categoryId}
              onChange={(val) => setFormData({...formData, categoryId: val})}
              options={categories.map(cat => ({ value: cat._id, label: `${cat.name} ${cat.group ? `(${cat.group})` : ''}` }))}
              placeholder="Select Category"
              required
            />
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">Income Source</label>
            <Dropdown
              value={formData.incomeSource}
              onChange={(val) => setFormData({...formData, incomeSource: val})}
              options={[
                { value: 'salary', label: 'Salary' },
                { value: 'freelance', label: 'Freelance' },
                { value: 'investment', label: 'Investment' },
                { value: 'business', label: 'Business' },
                { value: 'rental', label: 'Rental' },
                { value: 'gift', label: 'Gift' },
                { value: 'refund', label: 'Refund' },
                { value: 'other', label: 'Other' }
              ]}
              required
            />
          </div>
        )}
        
        <div className="form-group">
          <label className="form-label">Date</label>
          <input 
            type="date" 
            className="form-input" 
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
          />
        </div>
        
        <div className="form-group mb-6">
          <label className="form-label">Notes (Optional)</label>
          <textarea 
            className="form-input" 
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="What was this expense for?"
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="form-group mb-8" style={{ padding: '1rem', backgroundColor: 'var(--bg-dark)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', margin: 0 }}>
            <div className="flex items-center gap-3">
              <div style={{ padding: '0.5rem', backgroundColor: formData.isRecurring ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', transition: 'all 0.3s' }}>
                <RefreshCcw size={18} color={formData.isRecurring ? 'var(--accent-secondary)' : 'var(--text-tertiary)'} />
              </div>
              <div>
                <span style={{ display: 'block', fontWeight: 500, color: 'var(--text-primary)' }}>Recurring Subscription</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Mark this if it repeats automatically</span>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={formData.isRecurring}
              onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})}
              style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--accent-secondary)', cursor: 'pointer' }}
            />
          </label>
        </div>
        
        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }} disabled={loading}>
          {loading ? 'Saving...' : 'Save Expense'}
        </button>
      </form>
    </div>
  );
};

export default AddExpense;
