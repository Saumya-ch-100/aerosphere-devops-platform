import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import './Landing.css';

function Landing() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-container">
      <Navbar />
      
      {/* Hero Section */}
      <main className="hero-section" style={{ transform: `translateY(${scrollY * 0.2}px)` }}>
        <div className="badge-modern">AeroSphere DevOps Platform 2.0</div>
        
        <h1 className="hero-title">
          Orchestrate the Skies with <br/>
          <span className="text-lime">Intelligent DevSecOps</span>
        </h1>
        
        <p className="hero-subtitle">
          The world's most advanced aviation infrastructure platform. Seamlessly manage global flight routing, real-time telemetry, and automated Kubernetes deployments across the AWS ecosystem.
        </p>

        <div className="hero-actions">
          <a href="/login" className="btn-primary">Access Command Center</a>
          <a href="/platform" className="btn-secondary">Explore Architecture</a>
        </div>
      </main>

      {/* Feature Grid */}
      <section className="features-section">
        <h2 className="section-title">Mission-Critical Resilience</h2>
        <div className="features-grid">
          <div className="feature-card tilt">
            <i className="fa-solid fa-server feature-icon"></i>
            <h3>Infrastructure Automation</h3>
            <p>Terraform-provisioned highly available K3s clusters scaling automatically to handle global aviation traffic.</p>
          </div>
          <div className="feature-card tilt">
            <i className="fa-solid fa-shield-halved feature-icon"></i>
            <h3>Zero Trust Vault</h3>
            <p>HashiCorp Vault automatically injects dynamic database credentials into ephemeral pods. No hardcoded secrets.</p>
          </div>
          <div className="feature-card tilt">
            <i className="fa-solid fa-database feature-icon"></i>
            <h3>Persistent State</h3>
            <p>Stateful PostgreSQL instances managed via persistent volume claims to ensure operational data survives node failures.</p>
          </div>
          <div className="feature-card tilt">
            <i className="fa-solid fa-satellite-dish feature-icon"></i>
            <h3>Global Observability</h3>
            <p>Real-time metrics via Prometheus, dynamic dashboards in Grafana, and centralized log aggregation with ELK.</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stat-box">
          <h2>99.999%</h2>
          <p>Uptime SLA</p>
        </div>
        <div className="stat-box">
          <h2>&lt; 50ms</h2>
          <p>Telemetry Latency</p>
        </div>
        <div className="stat-box">
          <h2>0 Trust</h2>
          <p>Security Architecture</p>
        </div>
      </section>
    </div>
  );
}

export default Landing;
