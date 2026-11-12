import React, { useState } from 'react';
import DnextDeploymentDashboard from './components/DnextDeploymentDashboard';
import DnextRemoteCatalogView from './components/DnextRemoteCatalogView';
import Icon from './components/ui/Icon';
import AppRail from './components/shell/AppRail';
import EnvironmentModal from './components/shell/EnvironmentModal';
import LoginModal from './components/shell/LoginModal';
import { AREAS, useAreaRoute } from './components/shell/areas';
import { EnvironmentProvider, useEnvironment } from './context/EnvironmentContext';

export default function App() {
  return (
    <EnvironmentProvider>
      <StudioShell />
    </EnvironmentProvider>
  );
}

function StudioShell() {
  // Active application area, persisted in the URL hash (#/catalog, #/releases, ...)
  const [activeArea, navigate] = useAreaRoute();
  const [showEnvModal, setShowEnvModal] = useState(false);

  // Environments (single source of truth: EnvironmentContext)
  const {
    environments,
    selectedEnv,
    selectEnvironment,
    activeApiUrl,
    loginStatus,
    authUser,
    authError,
    disconnect,
    isLoginModalOpen,
    openLoginModal,
    closeLoginModal,
    loginTargetEnv
  } = useEnvironment();

  // Header Connect: opens LoginModal for user to enter username & password manually
  const handleConnect = () => {
    openLoginModal();
  };
  const statusLabel = {
    connected: 'Connected',
    connecting: 'Connecting…',
    error: 'Authentication failed',
    disconnected: 'Not connected',
  }[loginStatus] || 'Not connected';

  const area = AREAS.find(a => a.id === activeArea) || AREAS[0];

  const renderArea = () => {
    switch (activeArea) {
      case 'releases':
        return (
          <DnextDeploymentDashboard
            selectedEnv={selectedEnv}
            environments={environments}
            onSelectEnv={selectEnvironment}
          />
        );
      case 'catalog':
      default:
        return (
          <DnextRemoteCatalogView
            selectedEnv={selectedEnv}
            environments={environments}
            onSelectEnv={selectEnvironment}
          />
        );
    }
  };

  return (
    <div className="ds-app">

      {/* High-Level Header - VODAFONE RED BANNER */}
      <header className="ds-header">
        <div className="ds-header__left">
          {/* Vodafone Brand & Logo */}
          <div className="ds-brand">
            <div className="ds-brand__mark" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.6 4.2c-4.3.3-7.9 3.8-7.9 8.4a4.6 4.6 0 1 0 4.6-4.6c-.5 0-1 .1-1.5.2.7-1.9 2.5-3.3 4.8-3.6V4.2Z" />
              </svg>
            </div>
            <div className="ds-brand__text">
              <span className="ds-brand__title">vodafone</span>
              <span className="ds-brand__subtitle">DNEXT Studio</span>
            </div>
          </div>

          <span className="ds-header__divider" />

          {/* Current area */}
          <h1 className="ds-header__title">{area.title}</h1>
        </div>

        {/* Right Status & Environment Switcher - Single Connection Indicator on Top Banner */}
        <div className="ds-header__right">
          {/* Connection String Badge */}
          {activeApiUrl && <span className="ds-env-url" title={activeApiUrl}>{activeApiUrl}</span>}

          <label className="ds-env" title={`Active environment · ${statusLabel}`}>
            <span className={`ds-env__dot is-${loginStatus}`} aria-label={statusLabel} />
            <select
              className="ds-env__select"
              value={selectedEnv ? selectedEnv.name : ''}
              onChange={(e) => {
                const matched = environments.find(env => env.name === e.target.value);
                if (matched) selectEnvironment(matched);
              }}
            >
              {environments.map(env => (
                <option key={env.name} value={env.name}>{env.name}</option>
              ))}
            </select>
            <Icon name="chevronDown" size={14} className="ds-env__chevron" />
          </label>

          {/* Shared DNEXT session (EnvironmentContext): one login for every view */}
          {loginStatus === 'connected' ? (
            <div className="ds-auth" title={`Connected to ${selectedEnv?.name || 'environment'}${authUser ? ` as ${authUser}` : ''}`}>
              <span className="ds-auth__user">
                <Icon name="user" size={14} />
                {authUser || 'Connected'}
              </span>
              <button type="button" className="ds-auth__btn" onClick={disconnect} title="Disconnect">
                <Icon name="logout" size={15} />
              </button>
            </div>
          ) : (
            <div className={`ds-auth${loginStatus === 'error' ? ' is-error' : ''}`}>
              <button
                type="button"
                className="ds-auth__btn ds-auth__btn--connect"
                onClick={handleConnect}
                disabled={loginStatus === 'connecting' || !selectedEnv}
                title={loginStatus === 'error' && authError ? `Authentication failed: ${authError}` : `Connect to ${selectedEnv?.name || 'environment'}`}
              >
                <Icon name="login" size={15} />
                {loginStatus === 'connecting' ? 'Connecting…' : loginStatus === 'error' ? 'Retry' : 'Connect'}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="ds-body">
        <AppRail activeArea={activeArea} onNavigate={navigate} onOpenSettings={() => setShowEnvModal(true)} />

        {/* Main Workspace Area */}
        <main className="ds-main">
          <div style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
            {renderArea()}
          </div>
        </main>
      </div>

      {/* Environment Switcher & Modal */}
      {showEnvModal && <EnvironmentModal onClose={() => setShowEnvModal(false)} />}

      {/* Manual Login / Connect Modal */}
      {isLoginModalOpen && (
        <LoginModal
          onClose={closeLoginModal}
          targetEnv={loginTargetEnv}
        />
      )}
    </div>
  );
}
