import React from 'react';
import Icon from '../ui/Icon';
import { AREAS } from './areas';

/* Slim primary navigation rail: icon + label per application area. */
export default function AppRail({ activeArea, onNavigate, onOpenSettings }) {
  const main = AREAS.filter(a => a.group === 'main');
  const sync = AREAS.filter(a => a.group === 'sync');

  const renderItem = (a) => (
    <button
      key={a.id}
      type="button"
      className={`ds-rail__item${activeArea === a.id ? ' is-active' : ''}`}
      onClick={() => onNavigate(a.id)}
      title={a.title}
      aria-current={activeArea === a.id ? 'page' : undefined}
    >
      <Icon name={a.icon} size={20} />
      <span className="ds-rail__label">{a.label}</span>
    </button>
  );

  return (
    <nav className="ds-rail" aria-label="Primary">
      <div className="ds-rail__group">{main.map(renderItem)}</div>
      {sync.length > 0 && (
        <>
          <div className="ds-rail__divider" />
          <div className="ds-rail__caption">Sync</div>
          <div className="ds-rail__group">{sync.map(renderItem)}</div>
        </>
      )}
      <div className="ds-rail__spacer" />
      <button type="button" className="ds-rail__item" onClick={onOpenSettings} title="Configure Target Cloud Environments">
        <Icon name="settings" size={20} />
        <span className="ds-rail__label">Environments</span>
      </button>
    </nav>
  );
}
