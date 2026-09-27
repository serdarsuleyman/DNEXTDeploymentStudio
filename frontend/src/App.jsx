import React, { useState, useEffect } from 'react';
import DnextDeploymentDashboard from './components/DnextDeploymentDashboard';
import DnextRemoteCatalogView from './components/DnextRemoteCatalogView';

export default function App() {
  // Navigation layout state ('deployment' | 'remote-catalog')
  const [activeView, setActiveView] = useState('deployment');

  // Environments
  const [environments, setEnvironments] = useState([]);
  const [selectedEnv, setSelectedEnv] = useState(null);
  const [showEnvModal, setShowEnvModal] = useState(false);

  // New Environment form states
  const [newEnvName, setNewEnvName] = useState('');
  const [newEnvUrl, setNewEnvUrl] = useState('');
  const [newEnvUser, setNewEnvUser] = useState('');
  const [newEnvPass, setNewEnvPass] = useState('');
  const [envSaveMsg, setEnvSaveMsg] = useState('');

  const fetchEnvironments = async () => {
    try {
      const res = await fetch('/api/dnext/environments');
      const data = await res.json();
      if (Array.isArray(data)) {
        setEnvironments(data);
        if (!selectedEnv && data.length > 0) {
          const savedEnvName = localStorage.getItem('dnext_env_name');
          const matched = data.find(e => e.name === savedEnvName) || data[0];
          setSelectedEnv(matched);
        }
      }
    } catch (err) {
      console.error('Error fetching environments:', err);
    }
  };

  useEffect(() => {
    fetchEnvironments();
  }, []);

  const handleSelectEnv = (env) => {
    setSelectedEnv(env);
    localStorage.setItem('dnext_env_name', env.name);
    setShowEnvModal(false);
  };

  const handleSaveNewEnv = async (e) => {
    e.preventDefault();
    if (!newEnvName || !newEnvUrl) return;

    try {
      const res = await fetch('/api/dnext/environments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newEnvName,
          url: newEnvUrl,
          username: newEnvUser,
          password: newEnvPass
        })
      });
      const data = await res.json();
      if (res.ok) {
        setEnvironments(data.environments || []);
        const created = (data.environments || []).find(x => x.name === newEnvName);
        if (created) setSelectedEnv(created);
        setNewEnvName('');
        setNewEnvUrl('');
        setNewEnvUser('');
        setNewEnvPass('');
        setEnvSaveMsg('Environment saved successfully!');
        setTimeout(() => {
          setEnvSaveMsg('');
          setShowEnvModal(false);
        }, 1200);
      }
    } catch (err) {
      console.error('Error saving environment:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', background: '#0b0c10', color: '#f3f4f6' }}>
      
      {/* High-Level Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(17,19,24,0.95)', flexShrink: 0, backdropFilter: 'blur(12px)', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '15px', color: '#fff', boxShadow: '0 0 16px rgba(99,102,241,0.5)' }}>
              DN
            </div>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#fff', letterSpacing: '0.3px' }}>
              DNEXT <span style={{ color: '#818cf8' }}>Studio</span>
            </span>
          </div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', padding: '3px 8px', borderRadius: '4px', color: '#a5b4fc', fontWeight: '600' }}>
            TMF 620 Cloud Deployment Platform
          </span>
        </div>

        {/* View Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setActiveView('deployment')}
            style={{
              padding: '7px 16px',
              background: activeView === 'deployment' ? 'rgba(99,102,241,0.25)' : 'transparent',
              border: '1px solid',
              borderColor: activeView === 'deployment' ? '#6366f1' : 'transparent',
              color: activeView === 'deployment' ? '#fff' : '#9ca3af',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🚀</span> Deployment Packages
          </button>

          <button
            onClick={() => setActiveView('remote-catalog')}
            style={{
              padding: '7px 16px',
              background: activeView === 'remote-catalog' ? 'rgba(168,85,247,0.25)' : 'transparent',
              border: '1px solid',
              borderColor: activeView === 'remote-catalog' ? '#a855f7' : 'transparent',
              color: activeView === 'remote-catalog' ? '#fff' : '#9ca3af',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🌐</span> Live DNEXT Catalog
          </button>
        </div>

        {/* Right Status & Environment Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setShowEnvModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '6px',
              padding: '6px 12px',
              color: '#f3f4f6',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            title="Configure Target Cloud Environments"
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
            <span>Env: {selectedEnv ? selectedEnv.name : 'dev-gcu'}</span>
            <span style={{ color: '#9ca3af', fontSize: '10px' }}>▼</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeView === 'deployment' ? (
          <div style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
            <DnextDeploymentDashboard />
          </div>
        ) : (
          <div style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
            <DnextRemoteCatalogView />
          </div>
        )}
      </main>

      {/* Environment Switcher & Modal */}
      {showEnvModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#16181e',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px',
            width: '540px',
            maxWidth: '90vw',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#fff' }}>Target Cloud Environments</h3>
              <button
                onClick={() => setShowEnvModal(false)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '16px', lineHeight: '1.4' }}>
              Select an active DNEXT Cloud environment or register a new DPC API Gateway endpoint.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', maxHeight: '180px', overflowY: 'auto' }}>
              {environments.map((env) => {
                const isCurrent = selectedEnv && selectedEnv.name === env.name;
                return (
                  <div
                    key={env.name}
                    onClick={() => handleSelectEnv(env)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: isCurrent ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.03)',
                      border: '1px solid',
                      borderColor: isCurrent ? '#6366f1' : 'rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: isCurrent ? '#fff' : '#e5e7eb', fontSize: '14px' }}>
                        {env.name} {isCurrent && <span style={{ fontSize: '11px', color: '#818cf8', marginLeft: '6px' }}>(Active)</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px', fontFamily: 'monospace' }}>
                        {env.apiUrl || env.url}
                      </div>
                    </div>
                    {isCurrent && <span style={{ color: '#818cf8', fontWeight: 'bold' }}>✓</span>}
                  </div>
                );
              })}
            </div>

            {/* Add New Environment */}
            <form onSubmit={handleSaveNewEnv} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#e5e7eb', marginBottom: '10px' }}>
                Add / Update Environment
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="Env Name (e.g. stage-gcu)"
                  value={newEnvName}
                  onChange={(e) => setNewEnvName(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                  required
                />
                <input
                  type="text"
                  placeholder="URL (e.g. https://dpc-ui.stage-gcu.com)"
                  value={newEnvUrl}
                  onChange={(e) => setNewEnvUrl(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Keycloak Username"
                  value={newEnvUser}
                  onChange={(e) => setNewEnvUser(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                />
                <input
                  type="password"
                  placeholder="Keycloak Password"
                  value={newEnvPass}
                  onChange={(e) => setNewEnvPass(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                />
              </div>

              {envSaveMsg && (
                <div style={{ fontSize: '12px', color: '#10b981', marginBottom: '10px' }}>
                  {envSaveMsg}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowEnvModal(false)}
                  style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#aaa', cursor: 'pointer', fontSize: '12px' }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}
                >
                  Save Environment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
