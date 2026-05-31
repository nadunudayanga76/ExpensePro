import React, { useState } from 'react';
import { createWallet, deleteWallet, type Wallet } from '../api';
import Dropdown from './Dropdown';
import { CreditCard, Banknote, Landmark, Plus, Trash2 } from 'lucide-react';
import { useToast } from './ToastProvider';

interface WalletsWidgetProps {
  wallets: Wallet[];
  onWalletsChange: () => void;
}

const WalletsWidget: React.FC<WalletsWidgetProps> = ({ wallets, onWalletsChange }) => {
  const { showToast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [newWallet, setNewWallet] = useState<{name: string, type: string, balance: number | string, color: string}>({ name: '', type: 'cash', balance: '', color: '#8b5cf6' });

  const getIcon = (type: string) => {
    switch (type) {
      case 'cash': return <Banknote size={20} />;
      case 'bank': return <Landmark size={20} />;
      case 'credit_card': return <CreditCard size={20} />;
      default: return <Banknote size={20} />;
    }
  };

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWallet.name) return;
    try {
      await createWallet({ ...newWallet, balance: Number(newWallet.balance) || 0 } as any);
      showToast('Wallet created successfully! 🎉', 'success');
      setNewWallet({ name: '', type: 'cash', balance: '', color: '#8b5cf6' });
      setIsAdding(false);
      onWalletsChange();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to create wallet', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this wallet?')) return;
    try {
      await deleteWallet(id);
      showToast('Wallet deleted', 'success');
      onWalletsChange();
    } catch (err) {
      showToast('Failed to delete wallet', 'error');
    }
  };

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  const currency = localStorage.getItem('currency') || 'LKR';

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>My Wallets</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>
            Total Net Worth: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currency} {totalBalance.toLocaleString()}</span>
          </p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="btn" 
          style={{ padding: '0.5rem 1rem', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-primary)', border: '1px solid rgba(139, 92, 246, 0.3)' }}
        >
          <Plus size={16} /> Add Wallet
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddWallet} className="glass-panel add-wallet-form" style={{ display: 'flex', flexWrap: 'wrap', border: '1px solid rgba(139, 92, 246, 0.3)', background: 'rgba(139, 92, 246, 0.05)' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '200px', margin: 0 }}>
            <label className="form-label">Wallet Name</label>
            <input className="form-input" type="text" value={newWallet.name} onChange={e => setNewWallet({...newWallet, name: e.target.value})} placeholder="e.g. Commercial Bank" required />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '150px', margin: 0 }}>
            <label className="form-label">Account Type</label>
            <Dropdown
              value={newWallet.type}
              onChange={(val) => setNewWallet({...newWallet, type: val})}
              options={[
                { value: 'cash', label: 'Cash' },
                { value: 'bank', label: 'Bank Account' },
                { value: 'credit_card', label: 'Credit Card' }
              ]}
            />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '150px', margin: 0 }}>
            <label className="form-label">Starting Balance</label>
            <input className="form-input" type="number" step="0.01" value={newWallet.balance} onChange={e => setNewWallet({...newWallet, balance: e.target.value})} />
          </div>
          <div className="color-btn-row" style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '250px', alignItems: 'flex-end', margin: 0 }}>
            <div className="form-group" style={{ width: '60px', margin: 0 }}>
              <label className="form-label">Color</label>
              <input type="color" value={newWallet.color} onChange={e => setNewWallet({...newWallet, color: e.target.value})} style={{ height: '42px', width: '100%', padding: '0.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', cursor: 'pointer' }} />
            </div>
            <div style={{ flex: 1, margin: 0 }}>
              <button type="submit" className="btn btn-primary" style={{ height: '42px', width: '100%', padding: '0 1.5rem' }}>Save Wallet</button>
            </div>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
        {wallets.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-surface)', borderRadius: '0.75rem', gridColumn: '1 / -1' }}>
            No wallets added yet. Create one to start tracking your balances!
          </div>
        ) : (
          wallets.map(wallet => (
            <div key={wallet._id} style={{ 
              background: `linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.8))`,
              border: `1px solid ${wallet.color}40`, 
              borderRadius: '0.75rem', 
              padding: '1.25rem',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: wallet.color }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: wallet.color }}>
                  <div style={{ padding: '0.5rem', background: `${wallet.color}20`, borderRadius: '0.5rem' }}>
                    {getIcon(wallet.type)}
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{wallet.name}</span>
                </div>
                <button 
                  onClick={() => handleDelete(wallet._id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                  title="Delete wallet"
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '0 0 0.25rem 0' }}>Current Balance</p>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                  {currency} {wallet.balance.toLocaleString()}
                </h3>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WalletsWidget;
