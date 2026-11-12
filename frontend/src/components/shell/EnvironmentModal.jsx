import React, { useState } from 'react';
import Icon from '../ui/Icon';
import { useEnvironment } from '../../context/EnvironmentContext';

/* Environment management dialog (select / register DNEXT target environments). */
export default function EnvironmentModal({ onClose }) {
  const { environments, selectedEnv, selectEnvironment, saveEnvironment } = useEnvironment();

  const [newEnvName, setNewEnvName] = useState('');
  const [newEnvUrl, setNewEnvUrl] = useState('');
  const [envSaveMsg, setEnvSaveMsg] = useState('');
  const [envSaveError, setEnvSaveError] = useState('');

  const handleSelect = (env) => {
    selectEnvironment(env);
    onClose();
  };

  const handleSaveNewEnv = async (e) => {
    e.preventDefault();
    if (!newEnvName || !newEnvUrl) return;
    setEnvSaveError('');
    try {
      await saveEnvironment({ name: newEnvName, url: newEnvUrl });
      setNewEnvName('');
      setNewEnvUrl('');
      setEnvSaveMsg('Environment saved successfully!');
      setTimeout(() => {
        setEnvSaveMsg('');
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error saving environment:', err);
      setEnvSaveError(err.message);
    }
  };

  return (
    <div className="ds-modal-backdrop" onClick={onClose}>
      <div className="ds-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="ds-modal__header">
          <div>
            <h3 className="ds-modal__title">Target Cloud Environments</h3>
            <p className="ds-modal__desc">
              Select an active DNEXT Cloud environment or register a new DPC API Gateway endpoint.
            </p>
          </div>
          <button type="button" className="ds-btn ds-btn--ghost ds-btn--icon" onClick={onClose} title="Close">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSaveNewEnv}>
          <div className="ds-modal__body">
            <div className="ds-env-list">
              {environments.map((env) => {
                const isCurrent = selectedEnv && selectedEnv.name === env.name;
                return (
                  <button
                    type="button"
                    key={env.name}
                    onClick={() => handleSelect(env)}
                    className={`ds-env-option${isCurrent ? ' is-active' : ''}`}
                  >
                    <div>
                      <div className="ds-env-option__name">
                        <Icon name="server" size={14} />
                        {env.name}
                        {isCurrent && <span className="ds-pill ds-pill--danger">Active</span>}
                      </div>
                      <div className="ds-env-option__url">{env.apiUrl || env.url}</div>
                    </div>
                    {isCurrent && <Icon name="check" size={18} className="ds-env-option__check" />}
                  </button>
                );
              })}
            </div>

            {/* Add New Environment */}
            <div className="ds-section-title">Add / Update Environment</div>
            <div className="ds-form-grid">
              <div>
                <label className="ds-label" htmlFor="env-name">Environment name</label>
                <input id="env-name" className="ds-input" type="text" placeholder="e.g. stage-gcu"
                  value={newEnvName} onChange={(e) => setNewEnvName(e.target.value)} required />
              </div>
              <div>
                <label className="ds-label" htmlFor="env-url">URL</label>
                <input id="env-url" className="ds-input" type="text" placeholder="https://dpc-ui.stage-gcu.com"
                  value={newEnvUrl} onChange={(e) => setNewEnvUrl(e.target.value)} required />
              </div>
            </div>

            {envSaveMsg && <div className="ds-form-msg">{envSaveMsg}</div>}
            {envSaveError && <div className="ds-form-msg" style={{ color: 'var(--ds-danger)' }}>{envSaveError}</div>}
          </div>

          <div className="ds-modal__footer">
            <button type="button" className="ds-btn" onClick={onClose}>Close</button>
            <button type="submit" className="ds-btn ds-btn--primary">Save Environment</button>
          </div>
        </form>
      </div>
    </div>
  );
}
