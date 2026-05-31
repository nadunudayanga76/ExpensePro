import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { getCategories, addCategory, updateCategory, deleteCategory, getExpenses } from '../api';
import Dropdown from '../components/Dropdown';
import { formatCurrency } from '../utils/format';
import { IconMap } from '../utils/IconMap';
import { Edit2, Trash2, X, Plus } from 'lucide-react';
import { useToast } from '../components/ToastProvider';

const PRESET_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e', '#64748b'];
const PRESET_ICONS = ['utensils', 'car', 'shopping-bag', 'film', 'zap', 'heart-pulse', 'home', 'book', 'wifi', 'briefcase', 'coffee', 'gift'];
const PRESET_GROUPS = ['Needs', 'Wants', 'Savings', 'General'];

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState('');
  const [formData, setFormData] = useState({ name: '', color: PRESET_COLORS[0], icon: PRESET_ICONS[0], group: 'General' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const [catRes, expRes] = await Promise.all([getCategories(), getExpenses()]);
      setCategories(catRes.data);
      setExpenses(expRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({ name: '', color: PRESET_COLORS[0], icon: PRESET_ICONS[0], group: 'General' });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setIsEditing(true);
    setCurrentId(cat._id);
    setFormData({ name: cat.name, color: cat.color, icon: cat.icon, group: cat.group || 'General' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateCategory(currentId, formData);
      } else {
        await addCategory(formData);
      }
      closeModal();
      fetchCategories();
      showToast(isEditing ? 'Category updated successfully! ✏️' : 'Category added successfully! ✨', 'success');
    } catch (err) {
      showToast('Error saving category. Please try again.', 'error');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? It will fail if expenses use it.')) {
      try {
        await deleteCategory(id);
        fetchCategories();
        showToast('Category deleted successfully! 🗑️', 'success');
      } catch (err: any) {
        showToast(err.response?.data?.message || 'Error deleting category.', 'error');
      }
    }
  };

  // Group categories
  const groupedCategories = categories.reduce((acc, cat) => {
    const group = cat.group || 'General';
    if (!acc[group]) acc[group] = [];
    acc[group].push(cat);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) return <div className="text-secondary" style={{ padding: '2rem' }}>Loading categories...</div>;

  // Calculate max spent across all categories for progress bar scaling
  let maxSpent = 0;
  categories.forEach(cat => {
    const spent = expenses.filter(e => e.categoryId?._id === cat._id && e.type !== 'income').reduce((sum, e) => sum + e.amount, 0);
    if (spent > maxSpent) maxSpent = spent;
  });
  if (maxSpent === 0) maxSpent = 1; // Prevent division by zero

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '2rem' }}>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8" style={{ animation: 'fadeInDown 0.4s ease forwards' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>Categories</h2>
          <p style={{ color: 'var(--text-tertiary)', margin: 0, fontSize: '0.95rem' }}>{categories.length} categories · organize your spending</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={openAddModal} style={{ whiteSpace: 'nowrap' }}>
          <Plus size={18} /> New Category
        </button>
      </div>

      {Object.keys(groupedCategories).length === 0 ? (
        <p style={{ color: 'var(--text-tertiary)' }}>No categories found.</p>
      ) : (
        Object.entries(groupedCategories).map(([groupName, cats]: any) => (
          <div key={groupName} className="mb-10" style={{ animation: 'fadeInUp 0.4s var(--ease-spring) both' }}>
            <div className="flex items-center gap-3 mb-6">
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-tertiary)' }} />
              <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '1.5px', margin: 0, textTransform: 'uppercase' }}>
                {groupName}
              </h3>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)', opacity: 0.5 }} />
            </div>
            
            <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {cats.map((cat: any) => {
                const catExpenses = expenses.filter(e => e.categoryId?._id === cat._id && e.type !== 'income');
                const txCount = catExpenses.length;
                const totalSpent = catExpenses.reduce((sum, e) => sum + e.amount, 0);
                const percentage = Math.min((totalSpent / maxSpent) * 100, 100);

                return (
                  <div 
                    key={cat._id} 
                    className="glass-panel category-card group relative category-card-wrapper" 
                    style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.3s ease', minHeight: '200px' }}
                    onClick={() => navigate('/expenses', { state: { categoryId: cat._id, activeTab: 'expense' } })}
                  >
                    
                    {/* Edit/Delete Actions overlaying top right - visible on hover */}
                    <div className="category-actions" style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.25rem', opacity: 0, transition: 'opacity 0.2s', zIndex: 10 }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEditModal(cat)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '0.25rem' }} onMouseOver={e => e.currentTarget.style.color='var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color='var(--text-tertiary)'}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(cat._id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '0.25rem' }} onMouseOver={e => e.currentTarget.style.color='var(--accent-danger)'} onMouseOut={e => e.currentTarget.style.color='var(--text-tertiary)'}>
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div>
                      <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: `${cat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconMap name={cat.icon || 'help-circle'} color={cat.color} size={28} />
                      </div>
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                      <div className="flex justify-between items-end mb-4">
                        <div>
                          <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.3px' }}>{cat.name}</h4>
                          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                            {txCount} {txCount === 1 ? 'transaction' : 'transactions'}
                          </div>
                        </div>
                        <div className="currency-text" style={{ color: cat.color, fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
                          {formatCurrency(totalSpent)}
                        </div>
                      </div>

                      <div style={{ width: '100%', height: '3px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '1.5px', overflow: 'hidden' }}>
                        <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: cat.color, borderRadius: '1.5px', transition: 'width 1s var(--ease-spring)' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Modal Overlay */}
      {isModalOpen && createPortal(
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div className="glass-panel modal-content category-modal" style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 style={{ margin: 0 }}>{isEditing ? 'Edit Category' : 'New Category'}</h3>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="e.g. Groceries" />
              </div>

              <div className="form-group">
                <label className="form-label">Group</label>
                <Dropdown
                  value={formData.group}
                  onChange={(val) => setFormData({...formData, group: val})}
                  options={PRESET_GROUPS.map(g => ({ value: g, label: g }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Color</label>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map(c => (
                    <div 
                      key={c} 
                      onClick={() => setFormData({...formData, color: c})}
                      style={{ 
                        width: '32px', height: '32px', borderRadius: '50%', backgroundColor: c, cursor: 'pointer',
                        border: formData.color === c ? '2px solid white' : '2px solid transparent',
                        transform: formData.color === c ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.2s'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group mb-8">
                <label className="form-label">Icon</label>
                <div className="icon-picker-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem', marginBottom: 0 }}>
                  {PRESET_ICONS.map(i => (
                    <div 
                      key={i} 
                      onClick={() => setFormData({...formData, icon: i})}
                      style={{ 
                        padding: '0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: formData.icon === i ? `${formData.color}20` : 'var(--bg-dark)',
                        border: formData.icon === i ? `1px solid ${formData.color}` : '1px solid var(--border-color)',
                        color: formData.icon === i ? formData.color : 'var(--text-secondary)'
                      }}
                    >
                      <IconMap name={i} size={20} color="currentColor" />
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem' }}>
                {isEditing ? 'Save Changes' : 'Create Category'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Categories;
