import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  PlusCircle, 
  Tags, 
  Target, 
  PieChart,
  Wallet,
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="nav-icon" /> },
    { name: 'Transactions', path: '/expenses', icon: <Receipt className="nav-icon" /> },
    { name: 'Budgets', path: '/budgets', icon: <Target className="nav-icon" /> },
    { name: 'Add Transaction', path: '/add-expense', icon: <PlusCircle className="nav-icon" /> },
    { name: 'Categories', path: '/categories', icon: <Tags className="nav-icon" /> },
    { name: 'Insights', path: '/insights', icon: <PieChart className="nav-icon" /> },
    { name: 'Smart Plans', path: '/plans', icon: <Target className="nav-icon" /> },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div style={{ 
          background: 'var(--accent-primary)', 
          padding: '0.5rem', 
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
        }}>
          <Wallet size={24} color="white" />
        </div>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }} className="text-gradient">ExpensePro</h2>
      </div>
      <div className="sidebar-nav">
        {navItems.map((item) => (
          <Link 
            key={item.name} 
            to={item.path} 
            className={`nav-item ${location.pathname === item.path ? 'active' : ''} ${item.name === 'Add Transaction' ? 'nav-item-add' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
      <div style={{ padding: '1rem', marginTop: 'auto', borderTop: '1px solid var(--border-color)' }}>
        <button 
          onClick={handleLogout}
          className="nav-item" 
          style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', margin: 0, color: 'var(--accent-danger)' }}
        >
          <LogOut className="nav-icon" size={20} />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
