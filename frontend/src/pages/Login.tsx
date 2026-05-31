import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';

import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Send the access token to our backend
        const res = await fetch('http://localhost:5000/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: tokenResponse.access_token }),
        });

        const data = await res.json();
        
        if (res.ok) {
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('token', data.token); // Store JWT
          localStorage.setItem('user', JSON.stringify(data.user)); // Store user info
          navigate('/');
        } else {
          toast.error('Google login failed');
          console.error('Google login failed on backend:', data.error);
        }
      } catch (err) {
        toast.error('Network error during login');
        console.error('Network error during Google login:', err);
      }
    },
    onError: errorResponse => {
      toast.error('Google Login Error');
      console.log('Google Login Error:', errorResponse);
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    toast.error('Email login is currently disabled. Please use "Continue with Google".', {
      duration: 4000,
      icon: '🔒'
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-dark)',
      padding: '2rem'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.05em', lineHeight: 1.2 }}>
          Welcome back to <br className="mobile-break" /><span className="text-gradient">ExpensePro</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Log in to your account
        </p>
      </div>

      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '2.5rem',
        borderRadius: '24px'
      }}>
        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                className="form-input" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{ 
                  paddingLeft: '2.75rem', 
                  paddingTop: '1rem', 
                  paddingBottom: '1rem',
                  borderRadius: '12px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
                <Lock size={18} />
              </div>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ 
                  paddingLeft: '2.75rem', 
                  paddingRight: '2.75rem',
                  paddingTop: '1rem', 
                  paddingBottom: '1rem',
                  borderRadius: '12px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              />
              <div 
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px', cursor: 'pointer' }} />
              Remember me
            </label>
            <Link to="/forgot-password" style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary" style={{ 
            width: '100%', 
            padding: '1rem', 
            fontSize: '1rem', 
            fontWeight: 600,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
          }}>
            Log in
          </button>
        </form>

        {/* OR Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
          <span style={{ margin: '0 1rem', color: 'var(--text-tertiary)', fontSize: '0.85rem', fontWeight: 500 }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
        </div>

        <button 
          onClick={() => googleLogin()}
          type="button"
          className="btn" style={{
          width: '100%',
          padding: '1rem',
          display: 'flex',
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
          color: '#3c4043',
          border: '1px solid #dadce0',
          borderRadius: '12px',
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: '0.5rem',
          boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)'
        }}>
          <div style={{ position: 'absolute', left: '1.25rem', display: 'flex', alignItems: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          Continue with Google
        </button>
      </div>

      <div style={{ marginTop: '2.5rem', color: 'var(--text-tertiary)' }}>
        Don't have an account? <Link to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>Create one</Link>
      </div>
    </div>
  );
};

export default Login;
