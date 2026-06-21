import React from 'react';
import Navbar from '../components/Navbar';

function Platform() {
  return (
    <>
      <Navbar />
      <div style={pageStyle}>
        <h1 style={titleStyle}>The Platform</h1>
        <p style={descStyle}>A unified command center for autonomous aviation. Monitor live infrastructure telemetry, execute Kubernetes deployments, and review ELK log streams in real time.</p>
        <div className="glass bg-charcoal border-lime" style={{padding: '3rem', marginTop: '3rem', textAlign: 'left', maxWidth: '800px', width: '100%'}}>
            <h2 className="text-lime" style={{marginBottom: '1rem'}}>100% Infrastructure as Code</h2>
            <p className="text-main">Every component of the AeroSphere platform is provisioned via Terraform and Helm, ensuring exact replicability and automated disaster recovery.</p>
        </div>
      </div>
    </>
  );
}

const pageStyle = { minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5rem 5%', textAlign: 'center' };
const titleStyle = { fontSize: '4rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem' };
const descStyle = { fontSize: '1.2rem', color: '#cbd5e1', maxWidth: '800px', lineHeight: 1.6 };

export default Platform;
