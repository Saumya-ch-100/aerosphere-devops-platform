import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [btnText, setBtnText] = useState('Authenticate');
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    // Mock authentication delay
    setTimeout(() => {
      setIsLoading(false);
      setBtnText('Verified');
      
      // Redirect
      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    }, 1500);
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={logoContainerStyle}>
          <i className="fa-solid fa-shield-halved" style={{ fontSize: '2.5rem', color: 'var(--accent-lime)', marginBottom: '1.5rem' }}></i>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 400, letterSpacing: '-0.5px' }}>AeroSphere Identity</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Secure SSO Portal</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Work Email</label>
            <i className="fa-solid fa-envelope" style={iconStyle}></i>
            <input type="email" style={inputStyle} placeholder="commander@aerosphere.local" required defaultValue="commander@aerosphere.local" />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Password</label>
            <i className="fa-solid fa-lock" style={iconStyle}></i>
            <input type="password" style={inputStyle} placeholder="••••••••" required defaultValue="demo123" />
          </div>

          <a href="#" style={forgotStyle}>Use Vault OTP?</a>

          <button type="submit" className="btn-primary" style={submitBtnStyle} disabled={isLoading}>
            {isLoading ? <div className="spinner" style={spinnerStyle}></div> : btnText}
          </button>
          
          {error && <div style={errorStyle}>Invalid credentials.</div>}
        </form>
      </div>
    </div>
  );
}

const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const cardStyle = {
  background: 'var(--charcoal)',
  border: '1px solid var(--panel-border)',
  borderRadius: '8px',
  padding: '3rem',
  width: '100%',
  maxWidth: '420px',
};

const logoContainerStyle = {
  textAlign: 'center',
  marginBottom: '2.5rem'
};

const formGroupStyle = {
  marginBottom: '1.5rem',
  position: 'relative'
};

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 500,
  marginBottom: '0.5rem',
  color: 'var(--text-muted)'
};

const inputStyle = {
  width: '100%',
  background: 'var(--bg-darker)',
  border: '1px solid var(--panel-border)',
  color: 'var(--text-main)',
  borderRadius: '4px',
  padding: '0.85rem 1rem 0.85rem 2.5rem',
  fontSize: '1rem',
  outline: 'none'
};

const iconStyle = {
  position: 'absolute',
  left: '0.85rem',
  top: '2.3rem',
  color: 'var(--text-muted)',
  fontSize: '0.9rem'
};

const forgotStyle = {
  display: 'block',
  textAlign: 'right',
  fontSize: '0.85rem',
  color: 'var(--text-muted)',
  textDecoration: 'none',
  marginBottom: '2rem',
  fontWeight: 400
};

const submitBtnStyle = {
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.85rem',
  fontSize: '1rem',
  borderRadius: '4px',
  fontWeight: 500
};

const spinnerStyle = {
  width: '20px',
  height: '20px',
  border: '2px solid rgba(0,0,0,0.3)',
  borderRadius: '50%',
  borderTopColor: '#000',
  animation: 'spin 1s ease-in-out infinite'
};

const errorStyle = {
  color: 'var(--accent-red)',
  fontSize: '0.9rem',
  textAlign: 'center',
  marginTop: '1rem',
  background: 'rgba(239, 68, 68, 0.1)',
  padding: '0.75rem',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  borderRadius: '4px'
};

export default Login;
