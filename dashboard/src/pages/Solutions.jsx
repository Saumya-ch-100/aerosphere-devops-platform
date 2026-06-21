import React from 'react';
import Navbar from '../components/Navbar';

function Solutions() {
  return (
    <>
      <Navbar />
      <div style={pageStyle}>
        <h1 style={titleStyle}>Enterprise Solutions</h1>
        <p style={descStyle}>Tailored DevSecOps pipelines for global aviation networks. From low-latency baggage routing algorithms to predictive aircraft maintenance telemetry.</p>
        <div className="glass bg-charcoal border-lime" style={{padding: '3rem', marginTop: '3rem', textAlign: 'left', maxWidth: '800px', width: '100%'}}>
            <h2 className="text-lime" style={{marginBottom: '1rem'}}>Global Routing Ecosystem</h2>
            <p className="text-main">AeroSphere provides multi-region active-active deployments using AWS EC2 K3s, ensuring your critical routing systems never experience downtime.</p>
        </div>
      </div>
    </>
  );
}

const pageStyle = {
  minHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '5rem 5%',
  textAlign: 'center'
};
const titleStyle = { fontSize: '4rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem' };
const descStyle = { fontSize: '1.2rem', color: '#cbd5e1', maxWidth: '800px', lineHeight: 1.6 };

export default Solutions;
