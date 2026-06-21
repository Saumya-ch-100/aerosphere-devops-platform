import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Solutions from './pages/Solutions';
import Platform from './pages/Platform';
import Security from './pages/Security';
import Company from './pages/Company';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login.html" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard.html" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/solutions" element={<Solutions />} />
      <Route path="/platform" element={<Platform />} />
      <Route path="/security" element={<Security />} />
      <Route path="/company" element={<Company />} />
    </Routes>
  );
}

export default App;
