import { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, LogOut, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getExpenses } from '../api';
import { formatCurrency } from '../utils/format';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  
  // Get user from localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  // Fetch recent activities for notifications
  useEffect(() => {
    getExpenses().then(res => {
      const exps = res.data || [];
      // Sort by date descending
      const sorted = exps.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const recent = sorted.slice(0, 4).map((exp: any) => {
        const isIncome = exp.type === 'income';
        const amountStr = formatCurrency(exp.amount);
        const sourceName = isIncome ? (exp.incomeSource || 'Income') : (exp.categoryId?.name || 'Expense');
        const timeStr = new Date(exp.date).toLocaleDateString();
        
        return {
          id: exp._id,
          date: new Date(exp.date),
          timeStr,
          isIncome,
          message: isIncome 
            ? `You received ${amountStr} from ${sourceName}.`
            : `You spent ${amountStr} on ${sourceName}.`
        };
      });
      
      setNotifications(recent);
      
      const lastRead = localStorage.getItem('lastReadNotifTime');
      if (recent.length > 0) {
        const latestTime = recent[0].date.getTime();
        if (!lastRead || latestTime > Number(lastRead)) {
          setHasUnread(true);
        }
      }
    }).catch(err => console.error(err));
  }, [location.pathname]); // Refresh when navigating to pick up new transactions

  const handleMarkAllRead = () => {
    setHasUnread(false);
    if (notifications.length > 0) {
      localStorage.setItem('lastReadNotifTime', notifications[0].date.getTime().toString());
    }
  };

  // Handle click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/expenses': return 'All Transactions';
      case '/add-expense': return 'Add New Transaction';
      case '/categories': return 'Manage Categories';
      case '/budgets': return 'Budget Planning';
      case '/insights': return 'Financial Insights';
      default: return 'ExpensePro';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="top-header">
      <div className="header-title-container">
        <h2 style={{ margin: 0, fontWeight: 600 }} className="header-title desktop-title">{getPageTitle()}</h2>
        <h1 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.5rem' }} className="header-title mobile-title text-gradient">
          ExpensePro
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div style={{ position: 'relative' }} className="header-search">
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="form-input" 
            style={{ paddingLeft: '2.5rem', backgroundColor: 'var(--bg-surface)' }}
          />
        </div>
        
        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.5rem', borderRadius: '50%', position: 'relative' }}
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
          >
            <Bell size={20} />
            {/* Notification Badge */}
            {hasUnread && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '4px',
                width: '8px',
                height: '8px',
                backgroundColor: 'var(--accent-danger)',
                borderRadius: '50%',
                border: '2px solid var(--bg-dark)'
              }}></span>
            )}
          </button>

          {showNotifications && (
            <div className="glass-panel" style={{
              position: 'absolute',
              top: '120%',
              right: 0,
              width: '320px',
              padding: '1rem',
              zIndex: 50,
              animation: 'fadeInDown 0.2s ease-out'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Recent Activity</h3>
                {hasUnread && (
                  <span 
                    onClick={handleMarkAllRead} 
                    style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Mark all read
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {notifications.length === 0 ? (
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', textAlign: 'center', margin: '1rem 0' }}>No recent activity.</p>
                ) : (
                  notifications.map((notif, index) => {
                    const isNew = hasUnread && (!localStorage.getItem('lastReadNotifTime') || notif.date.getTime() > Number(localStorage.getItem('lastReadNotifTime')));
                    
                    return (
                      <div key={notif.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', paddingBottom: index === notifications.length - 1 ? 0 : '0.75rem', borderBottom: index === notifications.length - 1 ? 'none' : '1px solid var(--border-color)', opacity: isNew ? 1 : 0.6 }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isNew ? 'var(--accent-primary)' : 'var(--text-tertiary)', marginTop: '6px', flexShrink: 0 }}></div>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                            {notif.message}
                          </p>
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{notif.timeStr}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* User Profile */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <div 
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            overflow: 'hidden',
            border: '2px solid transparent',
            transition: 'border-color 0.2s',
            ...(showProfileMenu ? { borderColor: 'var(--accent-primary)' } : {})
          }}>
            {user?.picture ? (
              <img src={user.picture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
            ) : user?.name ? (
              <span style={{ color: 'white', fontWeight: 600, fontSize: '1.2rem' }}>{user.name.charAt(0).toUpperCase()}</span>
            ) : (
              <User size={20} color="white" />
            )}
          </div>

          {showProfileMenu && (
            <div className="glass-panel" style={{
              position: 'absolute',
              top: '120%',
              right: 0,
              width: '260px',
              padding: '0.5rem',
              zIndex: 50,
              animation: 'fadeInDown 0.2s ease-out'
            }}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name || 'Guest User'}</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-tertiary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user?.email || 'Not logged in'}</p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <button 
                  onClick={() => {
                    navigate('/settings');
                    setShowProfileMenu(false);
                  }}
                  className="nav-item" 
                  style={{ margin: 0, width: '100%', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                >
                  <Settings size={16} /> Preferences & Settings
                </button>
                
                <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.25rem 0' }}></div>
                
                <button 
                  onClick={handleLogout}
                  className="nav-item" 
                  style={{ margin: 0, width: '100%', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                >
                  <LogOut size={16} /> Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
