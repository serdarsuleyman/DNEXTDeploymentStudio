import React, { useState, useEffect, useRef } from 'react';
import Icon from '../ui/Icon';
import { useEnvironment, useAuth } from '../../context/EnvironmentContext';

/**
 * LoginModal — Manual credential entry dialog for connecting to DNEXT Cloud / Keycloak.
 * Prompts user for username and password with target environment context.
 */
export default function LoginModal({ onClose, targetEnv = null, onSuccess = null }) {
  const { environments, selectedEnv, selectEnvironment } = useEnvironment();
  const { connect, loginStatus } = useAuth();

  const initialEnv = targetEnv || selectedEnv || (environments && environments[0]) || null;
  const [envChoice, setEnvChoice] = useState(initialEnv?.name || '');
  const [username, setUsername] = useState(() => localStorage.getItem('dnext_username') || '');
  const [password, setPassword] = useState('');
  const [rememberUser, setRememberUser] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordInputRef = useRef(null);
  const usernameInputRef = useRef(null);

  // Auto-focus once on mount: username if empty, password if already pre-filled
  useEffect(() => {
    const savedUser = localStorage.getItem('dnext_username');
    if (savedUser) {
      passwordInputRef.current?.focus();
    } else {
      usernameInputRef.current?.focus();
    }
  }, []);

  const activeTarget = environments.find(e => e.name === envChoice) || initialEnv;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (activeTarget && activeTarget.name !== selectedEnv?.name) {
        selectEnvironment(activeTarget);
      }

      if (rememberUser) {
        localStorage.setItem('dnext_username', username.trim());
      } else {
        localStorage.removeItem('dnext_username');
      }

      const result = await connect({
        username: username.trim(),
        password,
        env: activeTarget
      });

      setPassword('');
      if (onSuccess) onSuccess(result);
      if (onClose) onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ds-modal-backdrop" onClick={onClose}>
      <div
        className="ds-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px' }}
      >
        <div className="ds-modal__header">
          <div>
            <h3 id="login-modal-title" className="ds-modal__title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="lock" size={16} />
              Connect to DNEXT
            </h3>
            <p className="ds-modal__desc">
              Enter your credentials to authenticate with Keycloak IAM.
            </p>
          </div>
          <button
            type="button"
            className="ds-btn ds-btn--ghost ds-btn--icon"
            onClick={onClose}
            title="Close"
            disabled={isSubmitting}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ds-modal__body">
            {/* Target Environment */}
            <div style={{ marginBottom: '14px' }}>
              <label className="ds-label" htmlFor="login-env-select">Target Environment</label>
              <select
                id="login-env-select"
                className="ds-input"
                value={envChoice}
                onChange={(e) => setEnvChoice(e.target.value)}
                disabled={isSubmitting}
              >
                {environments.map(env => (
                  <option key={env.name} value={env.name}>{env.name}</option>
                ))}
              </select>
              {activeTarget?.apiUrl && (
                <div style={{ fontSize: '11px', color: 'var(--ds-text-dim)', marginTop: '4px', wordBreak: 'break-all' }}>
                  Gateway: {activeTarget.apiUrl}
                </div>
              )}
            </div>

            {/* Username Input */}
            <div style={{ marginBottom: '14px' }}>
              <label className="ds-label" htmlFor="login-username">Username</label>
              <input
                id="login-username"
                ref={usernameInputRef}
                className="ds-input"
                type="text"
                placeholder="e.g. your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Password Input */}
            <div style={{ marginBottom: '14px' }}>
              <label className="ds-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                ref={passwordInputRef}
                className="ds-input"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Remember username checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--ds-text-dim)', marginBottom: '8px' }}>
              <input
                id="login-remember"
                type="checkbox"
                checked={rememberUser}
                onChange={(e) => setRememberUser(e.target.checked)}
                disabled={isSubmitting}
              />
              <label htmlFor="login-remember" style={{ cursor: 'pointer', userSelect: 'none' }}>
                Remember username on this device
              </label>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '6px',
                  padding: '9px 12px',
                  color: 'var(--ds-danger)',
                  fontSize: '12px',
                  lineHeight: '1.4',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginTop: '8px'
                }}
              >
                <span style={{ flexShrink: 0, marginTop: '2px' }}><Icon name="alert" size={14} /></span>
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <div className="ds-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              className="ds-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ds-btn ds-btn--primary"
              disabled={isSubmitting || loginStatus === 'connecting'}
              style={{ minWidth: '96px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {isSubmitting || loginStatus === 'connecting' ? (
                <>
                  <Icon name="clock" size={13} style={{ animation: 'spin 1s infinite linear' }} />
                  Connecting…
                </>
              ) : (
                <>
                  <Icon name="login" size={13} />
                  Connect
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
