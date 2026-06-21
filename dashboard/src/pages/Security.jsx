import React from 'react';
import Navbar from '../components/Navbar';

function Security() {
  return (
    <>
      <Navbar />
      <div style={pageStyle}>
        <h1 style={titleStyle}>Zero Trust Security</h1>
        <p style={descStyle}>Military-grade cybersecurity implementation. AeroSphere relies on HashiCorp Vault for dynamic secret injection and strict Kubernetes network policies.</p>
        <div className="glass bg-charcoal border-lime" style={{padding: '3rem', marginTop: '3rem', textAlign: 'left', maxWidth: '800px', width: '100%'}}>
            <h2 className="text-lime" style={{marginBottom: '1rem'}}>Vault-Integrated Pods</h2>
            <p className="text-main">No database credentials are ever stored in code. Ephemeral tokens and dynamic credentials ensure attackers cannot pivot across namespaces.</p>
        </div>
      </div>
    </>
  );
}

const pageStyle = { minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5rem 5%', textAlign: 'center' };
const titleStyle = { fontSize: '4rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem' };
const descStyle = { fontSize: '1.2rem', color: '#cbd5e1', maxWidth: '800px', lineHeight: 1.6 };

export default Security;
