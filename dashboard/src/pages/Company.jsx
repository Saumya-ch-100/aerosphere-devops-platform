import React from 'react';
import Navbar from '../components/Navbar';

function Company() {
  return (
    <>
      <Navbar />
      <div style={pageStyle}>
        <h1 style={titleStyle}>AeroSphere Command</h1>
        <p style={descStyle}>Built for Case Study 133. We are modernizing the global autonomous aviation operations platform through extreme DevOps engineering.</p>
        <div className="glass bg-charcoal border-lime" style={{padding: '3rem', marginTop: '3rem', textAlign: 'left', maxWidth: '800px', width: '100%'}}>
            <h2 className="text-lime" style={{marginBottom: '1rem'}}>Executive Leadership</h2>
            <p className="text-main">Approved the cloud-native modernization initiative focused on infrastructure automation, continuous deployment, observability, and resilience.</p>
        </div>
      </div>
    </>
  );
}

const pageStyle = { minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5rem 5%', textAlign: 'center' };
const titleStyle = { fontSize: '4rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem' };
const descStyle = { fontSize: '1.2rem', color: '#cbd5e1', maxWidth: '800px', lineHeight: 1.6 };

export default Company;
