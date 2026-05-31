import { useState } from 'react';
import { Save, Download, Settings as SettingsIcon } from 'lucide-react';
import Dropdown from '../components/Dropdown';
import { api } from '../api';

const Settings = () => {
  const [currency, setCurrency] = useState(localStorage.getItem('currency') || 'LKR');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem('currency', currency);
    setTimeout(() => {
      setIsSaving(false);
      window.location.reload(); // Reload to apply currency format globally
    }, 500);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await api.get('/expenses');
      const expenses = res.data;
      
      if (expenses.length === 0) {
        alert('No expenses to export');
        setIsExporting(false);
        return;
      }

      // Convert to CSV
      const headers = ['Date', 'Amount', 'Category', 'Notes'];
      const csvContent = [
        headers.join(','),
        ...expenses.map((e: any) => 
          `${new Date(e.date).toLocaleDateString()},${e.amount},${e.categoryId?.name || 'Unknown'},"${e.notes || ''}"`
        )
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `expenses_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export data', err);
      alert('Failed to export data');
    }
    setIsExporting(false);
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <SettingsIcon size={28} color="var(--accent-primary)" />
          Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your application preferences and data.</p>
      </div>

      <div className="grid-cards">
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Preferences</h2>
          
          <div className="form-group">
            <label className="form-label">Currency</label>
            <Dropdown
              value={currency}
              onChange={(val) => setCurrency(val)}
              options={[
                { value: 'LKR', label: 'LKR (Sri Lankan Rupee)' },
                { value: 'USD', label: 'USD (US Dollar)' },
                { value: 'EUR', label: 'EUR (Euro)' },
                { value: 'GBP', label: 'GBP (British Pound)' },
                { value: 'INR', label: 'INR (Indian Rupee)' }
              ]}
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
              This currency will be used to display all monetary values in the app.
            </p>
          </div>

          <button 
            className="btn btn-primary mt-4" 
            onClick={handleSave}
            disabled={isSaving}
            style={{ width: '100%' }}
          >
            <Save size={18} /> {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Data Management</h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Export Data</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Download a complete CSV backup of all your recorded expenses.
            </p>
          </div>

          <button 
            className="btn btn-secondary" 
            onClick={handleExport}
            disabled={isExporting}
            style={{ width: '100%' }}
          >
            <Download size={18} /> {isExporting ? 'Exporting...' : 'Export as CSV'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
