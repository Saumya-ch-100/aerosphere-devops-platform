import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav style={navStyle}>
      <Link to="/" style={logoStyle}>
        <i className="fa-solid fa-plane-departure" style={{color: 'var(--accent-lime)'}}></i> AeroSphere
      </Link>
      <div style={linksContainerStyle}>
        <Link to="/solutions" style={linkStyle}>Solutions</Link>
        <Link to="/platform" style={linkStyle}>Platform</Link>
        <Link to="/security" style={linkStyle}>Security</Link>
        <Link to="/company" style={linkStyle}>Company</Link>
      </div>
      <Link to="/login" className="btn-primary" style={{padding: '0.75rem 2rem'}}>Command Center Login</Link>
    </nav>
  );
}

const navStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '2rem 5%',
  background: '#111111',
  borderBottom: '2px solid var(--accent-lime)',
  position: 'sticky',
  top: 0,
  zIndex: 100
};

const logoStyle = {
  fontSize: '1.8rem',
  fontWeight: 800,
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  color: 'white',
  textDecoration: 'none',
  letterSpacing: '1px',
  textTransform: 'uppercase'
};

const linksContainerStyle = {
  display: 'flex',
  gap: '2.5rem'
};

const linkStyle = {
  color: '#cbd5e1',
  textDecoration: 'none',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '0.9rem',
  letterSpacing: '1px',
  transition: 'color 0.3s ease'
};

export default Navbar;
