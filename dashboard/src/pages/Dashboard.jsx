import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

const planeIcon = L.divIcon({
  html: '<i class="fa-solid fa-plane" style="color: var(--accent-lime); font-size: 16px; transform: rotate(45deg);"></i>',
  className: 'custom-plane-icon',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

function Dashboard() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'overview');
  
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const [servicesHealth, setServicesHealth] = useState({
    'flight-ops': false, 'telemetry': false, 'maintenance': false,
    'weather-intel': false, 'baggage-ops': false, 'passenger-ops': false
  });
  const [flights, setFlights] = useState([]);
  const [newFlight, setNewFlight] = useState({ id: '', airline: '', origin: '', destination: '', status: 'Scheduled', aircraft_type: '', departure_time: '', estimated_arrival: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const searchQueryRef = React.useRef('');
  const [apiRequests, setApiRequests] = useState([120, 190, 300, 450, 380, 250, 200]);
  const [totalReqs, setTotalReqs] = useState(1425900);
  const [vaultLogs, setVaultLogs] = useState([]);

  useEffect(() => {
    // API Polling
    const checkHealth = async () => {
      const services = ['flight-ops', 'telemetry', 'maintenance', 'weather-intel', 'baggage-ops', 'passenger-ops'];
      const health = {};
      for (const svc of services) {
        try {
          const res = await fetch(`/api/${svc}/health`, { cache: 'no-store' });
          health[svc] = res.ok;
        } catch {
          health[svc] = false;
        }
      }
      setServicesHealth(health);
    };

    const fetchFlights = async () => {
      try {
        const query = searchQueryRef.current;
        const url = query ? `/api/flight-ops/flights/search?query=${query}` : '/api/flight-ops/flights';
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          setFlights(await res.json());
        }
      } catch (e) {
        setFlights([]);
      }
    };

    checkHealth();
    fetchFlights();
    
    // Initial fetch for Prometheus
    const fetchPrometheus = async () => {
      try {
        const res = await fetch('/api/prometheus/api/v1/query?query=sum(http_requests_total)');
        if (res.ok) {
          const data = await res.json();
          const total = parseInt(data.data.result[0]?.value[1] || 0);
          setTotalReqs(prev => {
            const delta = total > prev ? total - prev : 0;
            setApiRequests(arr => {
              const next = [...arr];
              next.shift();
              next.push(delta);
              return next;
            });
            return total;
          });
        }
      } catch (e) {
        // Silent fail on prometheus fetch
      }
    };
    fetchPrometheus();

    const interval = setInterval(() => {
      checkHealth();
      fetchFlights();
      fetchPrometheus();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Vault Real Logs
    const fetchVaultStatus = async () => {
      try {
        const res = await fetch('/api/vault/v1/sys/seal-status');
        if (res.ok) {
          const data = await res.json();
          const time = new Date().toLocaleTimeString('en-US', { hour12: false });
          const msg = data.sealed ? '<span class="text-main">WARN</span> Vault is sealed' : '<span class="text-lime">AUDIT</span> Vault is unsealed and operational. Version: ' + data.version;
          setVaultLogs(prev => {
            const next = [...prev, `[${time}] ${msg}`];
            if (next.length > 15) next.shift();
            return next;
          });
        }
      } catch (e) {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        setVaultLogs(prev => {
            const next = [...prev, `[${time}] <span class="text-main">ERROR</span> Failed to connect to Vault API.`];
            if (next.length > 15) next.shift();
            return next;
        });
      }
    };
    
    fetchVaultStatus();
    const logInterval = setInterval(fetchVaultStatus, 5000);
    return () => clearInterval(logInterval);
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    searchQueryRef.current = e.target.value;
  };

  const handleAddFlight = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/flight-ops/flights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFlight)
      });
      setNewFlight({ id: '', airline: '', origin: '', destination: '', status: 'Scheduled', aircraft_type: '', departure_time: '', estimated_arrival: '' });
      // The polling will auto-refresh it
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await fetch(`/api/flight-ops/flights/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      // Optimistic update
      setFlights(flights.map(f => f.id === id ? { ...f, status } : f));
    } catch(e) {
      console.error(e);
    }
  };

  const handleDeleteFlight = async (id) => {
    try {
      await fetch(`/api/flight-ops/flights/${id}`, { method: 'DELETE' });
      setFlights(flights.filter(f => f.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handlePurge = async () => {
    if (!window.confirm("CRITICAL: Are you sure you want to purge the entire flights database? This action cannot be undone.")) return;
    try {
      await fetch('/api/flight-ops/admin/purge', { method: 'DELETE' });
      alert("Database purged successfully.");
    } catch (e) {
      console.error(e);
    }
  };

  const handleShutoff = async () => {
    if (!window.confirm("WARNING: Are you sure you want to gracefully shut down the telemetry container? It will start failing health checks.")) return;
    try {
      await fetch('/api/telemetry/admin/shutoff', { method: 'POST' });
      alert("Telemetry shutoff signal sent. The service will return 503s and eventually be killed by K8s.");
    } catch (e) {
      console.error(e);
    }
  };

  const handleTurnOn = async () => {
    try {
      await fetch('/api/telemetry/admin/turnon', { method: 'POST' });
      alert("Recovery signal sent. Telemetry will become healthy instantly.");
    } catch (e) {
      console.error(e);
    }
  };

  const chartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Live'],
    datasets: [{
      label: 'API Requests',
      data: apiRequests,
      borderColor: 'var(--accent-lime)',
      backgroundColor: 'rgba(57, 255, 20, 0.05)',
      borderWidth: 1,
      fill: true,
      tension: 0.4
    }]
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b' } },
      x: { grid: { display: false }, ticks: { color: '#64748b' } }
    }
  };

  const healthyCount = Object.values(servicesHealth).filter(Boolean).length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-darker)' }}>
      {/* Sidebar */}
      <div style={{ width: '260px', background: 'var(--bg-darker)', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 500, color: 'white', marginBottom: '2.5rem', letterSpacing: '-0.5px' }}>
          <i className="fa-solid fa-plane-departure text-lime"></i> AeroSphere
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><i className="fa-solid fa-chart-line" style={{ width: '24px' }}></i> Overview</button>
          <button className={`nav-btn ${activeTab === 'flightops' ? 'active' : ''}`} onClick={() => setActiveTab('flightops')}><i className="fa-solid fa-plane" style={{ width: '24px' }}></i> Flight Ops</button>
          <button className={`nav-btn ${activeTab === 'infrastructure' ? 'active' : ''}`} onClick={() => setActiveTab('infrastructure')}><i className="fa-solid fa-server" style={{ width: '24px' }}></i> Infrastructure</button>
          <button className={`nav-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}><i className="fa-solid fa-shield-halved" style={{ width: '24px' }}></i> Security & DR</button>
          <button className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><i className="fa-solid fa-gear" style={{ width: '24px' }}></i> Settings</button>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <Link to="/" style={{ color: '#64748b', fontSize: '0.9rem', textDecoration: 'none' }}><i className="fa-solid fa-arrow-left"></i> Exit to Landing</Link>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flexGrow: 1, padding: '3rem', overflowY: 'auto' }}>
        
        {activeTab === 'overview' && (
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 300, marginBottom: '2rem', letterSpacing: '-0.5px' }}>Global Overview</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="bg-charcoal border-lime-thin" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', borderRadius: '8px' }}>
                <i className="fa-solid fa-server text-lime" style={{ fontSize: '2rem' }}></i>
                <div>
                  <h3 style={{ color: '#64748b', fontSize: '0.85rem' }}>System Health</h3>
                  <div style={{ fontSize: '1.5rem', fontWeight: 400 }}>{healthyCount}/6 Services</div>
                </div>
              </div>
              <div className="bg-charcoal border-lime-thin" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', borderRadius: '8px' }}>
                <i className="fa-solid fa-network-wired text-lime" style={{ fontSize: '2rem' }}></i>
                <div>
                  <h3 style={{ color: '#64748b', fontSize: '0.85rem' }}>Total API Requests</h3>
                  <div style={{ fontSize: '1.5rem', fontWeight: 400 }}>{totalReqs.toLocaleString()}</div>
                </div>
              </div>
              <div className="bg-charcoal border-lime-thin" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', borderRadius: '8px' }}>
                <i className="fa-solid fa-plane text-lime" style={{ fontSize: '2rem' }}></i>
                <div>
                  <h3 style={{ color: '#64748b', fontSize: '0.85rem' }}>Active Flights</h3>
                  <div style={{ fontSize: '1.5rem', fontWeight: 400 }}>{flights.length.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
              <div className="bg-charcoal border-lime-thin" style={{ padding: '1.5rem', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', fontWeight: 400 }}>Live Air Traffic Telemetry</h3>
                <div style={{ height: '350px' }}>
                  <MapContainer center={[30, 0]} zoom={2} style={{ height: '100%', width: '100%', background: 'var(--charcoal)', borderRadius: '4px' }} zoomControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <Marker position={[40.7128, -74.0060]} icon={planeIcon} />
                    <Marker position={[51.5074, -0.1278]} icon={planeIcon} />
                    <Marker position={[35.6762, 139.6503]} icon={planeIcon} />
                  </MapContainer>
                </div>
              </div>
              <div className="bg-charcoal border-lime-thin" style={{ padding: '1.5rem', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', fontWeight: 400 }}>Service Health</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {Object.entries(servicesHealth).map(([svc, isUp]) => (
                    <div key={svc} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                      <span style={{ fontSize: '0.9rem' }}>{svc}</span>
                      <span style={{ color: isUp ? 'var(--accent-lime)' : '#ef4444', fontWeight: 500, fontSize: '0.85rem' }}>{isUp ? 'Online' : 'Offline'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-charcoal border-lime-thin" style={{ padding: '1.5rem', marginTop: '1.5rem', height: '300px', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '1rem', fontWeight: 400 }}>API Gateway Traffic</h3>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        {activeTab === 'infrastructure' && (
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 300, marginBottom: '2rem', letterSpacing: '-0.5px' }}>Infrastructure Command</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="bg-charcoal border-lime-thin" style={{ padding: '1.5rem', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', fontWeight: 400 }}>AWS EC2 K3s Cluster</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {Object.entries(servicesHealth).map(([svc, isUp]) => (
                    <div key={svc} style={{ border: `1px solid ${isUp ? 'rgba(57,255,20,0.3)' : 'rgba(239,68,68,0.3)'}`, padding: '1rem', width: '140px', textAlign: 'center', borderRadius: '4px' }}>
                      <i className="fa-solid fa-cube" style={{ color: isUp ? 'var(--accent-lime)' : '#ef4444', fontSize: '1.25rem', marginBottom: '0.5rem' }}></i>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{svc}-pod</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{isUp ? 'Running' : 'Terminated'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'flightops' && (
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 300, marginBottom: '2rem', letterSpacing: '-0.5px' }}>Flight Operations Control Center</h1>
            
            <div className="bg-charcoal border-lime-thin" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '1rem', fontWeight: 400 }}>Schedule New Flight</h3>
              <form onSubmit={handleAddFlight} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input type="text" placeholder="Flight ID (e.g. BA293)" required value={newFlight.id} onChange={e => setNewFlight({...newFlight, id: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Airline" required value={newFlight.airline} onChange={e => setNewFlight({...newFlight, airline: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Aircraft (e.g. B777)" value={newFlight.aircraft_type} onChange={e => setNewFlight({...newFlight, aircraft_type: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Origin (e.g. LHR)" required value={newFlight.origin} onChange={e => setNewFlight({...newFlight, origin: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Destination (e.g. JFK)" required value={newFlight.destination} onChange={e => setNewFlight({...newFlight, destination: e.target.value})} style={inputStyle} />
                <input type="time" required value={newFlight.departure_time} onChange={e => setNewFlight({...newFlight, departure_time: e.target.value})} style={inputStyle} />
                <input type="time" required value={newFlight.estimated_arrival} onChange={e => setNewFlight({...newFlight, estimated_arrival: e.target.value})} style={inputStyle} />
                <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1.25rem', borderRadius: '4px' }}>Add Flight</button>
              </form>
            </div>

            <div className="bg-charcoal border-lime-thin" style={{ padding: '1.5rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 400, margin: 0 }}>Active Flights Database</h3>
                <input type="text" placeholder="Search by ID, Airline, Airport..." value={searchQuery} onChange={handleSearchChange} style={{ ...inputStyle, width: '300px' }} />
              </div>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <th style={{ padding: '1rem 0.5rem', color: '#64748b', fontWeight: 500 }}>ID</th>
                    <th style={{ padding: '1rem 0.5rem', color: '#64748b', fontWeight: 500 }}>Airline</th>
                    <th style={{ padding: '1rem 0.5rem', color: '#64748b', fontWeight: 500 }}>Aircraft</th>
                    <th style={{ padding: '1rem 0.5rem', color: '#64748b', fontWeight: 500 }}>Route</th>
                    <th style={{ padding: '1rem 0.5rem', color: '#64748b', fontWeight: 500 }}>Schedule</th>
                    <th style={{ padding: '1rem 0.5rem', color: '#64748b', fontWeight: 500 }}>Status</th>
                    <th style={{ padding: '1rem 0.5rem', color: '#64748b', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flights.map(f => (
                    <tr key={f.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '1rem 0.5rem', color: 'var(--text-main)', fontWeight: 500 }}>{f.id}</td>
                      <td style={{ padding: '1rem 0.5rem', color: '#94a3b8' }}>{f.airline}</td>
                      <td style={{ padding: '1rem 0.5rem', color: '#94a3b8' }}>{f.aircraft_type || 'Unknown'}</td>
                      <td style={{ padding: '1rem 0.5rem', color: '#f8fafc' }}>{f.origin} <i className="fa-solid fa-arrow-right" style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 4px' }}></i> {f.destination}</td>
                      <td style={{ padding: '1rem 0.5rem', color: '#94a3b8' }}>{f.departure_time || 'TBD'} - {f.estimated_arrival || 'TBD'}</td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <select 
                          value={f.status} 
                          onChange={(e) => handleUpdateStatus(f.id, e.target.value)}
                          style={{
                            background: f.status === 'Delayed' ? 'rgba(239, 68, 68, 0.1)' : (f.status === 'In Air' ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255, 255, 255, 0.05)'),
                            color: f.status === 'Delayed' ? '#ef4444' : (f.status === 'In Air' ? 'var(--accent-lime)' : '#e2e8f0'),
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '4px 8px', borderRadius: '4px', outline: 'none', cursor: 'pointer'
                          }}
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="Boarding">Boarding</option>
                          <option value="In Air">In Air</option>
                          <option value="Delayed">Delayed</option>
                          <option value="Landed">Landed</option>
                        </select>
                      </td>
                      <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                        <button onClick={() => handleUpdateStatus(f.id, 'Delayed')} style={{ background: 'transparent', border: '1px solid rgba(234, 179, 8, 0.5)', color: '#eab308', padding: '0.25rem 0.5rem', cursor: 'pointer', borderRadius: '4px', fontSize: '0.75rem', marginRight: '0.5rem' }}>Delay</button>
                        <button onClick={() => handleDeleteFlight(f.id)} style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.25rem 0.5rem', cursor: 'pointer', borderRadius: '4px', fontSize: '0.75rem' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {flights.length === 0 && <tr><td colSpan="7" style={{ padding: '2rem', color: '#ef4444', textAlign: 'center' }}>No active flights found or database connection offline.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 300, marginBottom: '2rem', letterSpacing: '-0.5px' }}>Security & DR</h1>
            <div className="bg-charcoal border-lime-thin" style={{ padding: '1.5rem', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '1rem', fontWeight: 400 }}>Vault Access Logs</h3>
              <div style={{ background: '#050505', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', height: '300px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.85rem', borderRadius: '4px' }}>
                {vaultLogs.map((log, i) => <div key={i} dangerouslySetInnerHTML={{ __html: log }} style={{ marginBottom: '0.5rem', color: '#94a3b8' }} />)}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 300, marginBottom: '2rem', letterSpacing: '-0.5px' }}>Platform Settings</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="bg-charcoal border-lime-thin" style={{ padding: '2rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <i className="fa-solid fa-database" style={{ fontSize: '1.5rem', color: '#ef4444' }}></i>
                  <h3 style={{ fontWeight: 400 }}>Emergency Database Purge</h3>
                </div>
                <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.9rem' }}>
                  Instantly execute a global DELETE on the flight operations PostgreSQL table. This will clear all active flights from the telemetry map.
                </p>
                <button onClick={handlePurge} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>
                  Purge Database
                </button>
              </div>

              <div className="bg-charcoal border-lime-thin" style={{ padding: '2rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <i className="fa-solid fa-power-off" style={{ fontSize: '1.5rem', color: '#eab308' }}></i>
                  <h3 style={{ fontWeight: 400 }}>Disaster Recovery Simulation (Telemetry)</h3>
                </div>
                <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.9rem' }}>
                  Trigger a 503 Service Unavailable state in the Telemetry microservice. Watch Kubernetes automatically self-heal by killing the unresponsive pod and replacing it, or click 'Recover' to heal it instantly via the API.
                </p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={handleShutoff} style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.5)', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>
                    Simulate Outage
                  </button>
                  <button onClick={handleTurnOn} style={{ background: 'rgba(57, 255, 20, 0.1)', color: 'var(--accent-lime)', border: '1px solid var(--accent-lime)', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>
                    Recover Service
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      <style>{`
        .nav-btn { background: transparent; border: none; color: #64748b; padding: 0.75rem 1rem; text-align: left; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; border-radius: 4px; display: flex; align-items: center; gap: 0.5rem; }
        .nav-btn:hover { background: rgba(255,255,255,0.05); color: #f8fafc; }
        .nav-btn.active { background: rgba(57,255,20,0.05); color: var(--accent-lime); }
      `}</style>
    </div>
  );
}

const inputStyle = {
  background: 'var(--bg-darker)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--text-main)',
  padding: '0.75rem 1rem',
  outline: 'none',
  borderRadius: '4px',
  fontSize: '0.95rem'
};

export default Dashboard;
