import React, { useState, useEffect, useMemo, useRef } from 'react';
import { C } from '../../styles/theme';

/**
 * Shared Expand / Collapse Versions split button and dropdown menu
 * used across all grouped entity list views.
 */
export default function VersionMenuDropdown({
  groups = [],
  expandedGroups = new Set(),
  onExpandAll,
  onCollapseAll
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const multiVersionGroups = useMemo(
    () => groups.filter(g => g.previousVersions && g.previousVersions.length > 0),
    [groups]
  );

  const hasVersions = multiVersionGroups.length > 0;
  if (!hasVersions) return null;

  const isAnyExpanded = multiVersionGroups.some(g => expandedGroups && expandedGroups.has(g.groupKey));

  const handleToggleVersions = () => {
    if (isAnyExpanded) {
      if (onCollapseAll) onCollapseAll();
    } else {
      if (onExpandAll) onExpandAll();
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleToggleVersions}
          style={{
            background: isAnyExpanded ? 'rgba(230,0,0,0.08)' : '#ffffff',
            border: `1px solid ${isAnyExpanded ? 'var(--ds-brand)' : C.border}`,
            borderRight: 'none',
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            borderTopLeftRadius: '5px',
            borderBottomLeftRadius: '5px',
            color: isAnyExpanded ? 'var(--ds-brand)' : C.text,
            padding: '4px 9px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.15s ease'
          }}
          title={isAnyExpanded ? 'Click to collapse all version trees' : 'Click to expand all version trees'}
        >
          <span>{isAnyExpanded ? '⊟' : '⊞'}</span>
          <span>{isAnyExpanded ? 'Collapse Versions' : 'Expand Versions'}</span>
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          style={{
            background: isAnyExpanded ? 'rgba(230,0,0,0.08)' : '#ffffff',
            border: `1px solid ${isAnyExpanded ? 'var(--ds-brand)' : C.border}`,
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            borderTopRightRadius: '5px',
            borderBottomRightRadius: '5px',
            color: isAnyExpanded ? 'var(--ds-brand)' : C.muted,
            padding: '4px 6px',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Version options menu"
        >
          ▼
        </button>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: 'calc(100% + 6px)',
          background: '#ffffff',
          border: '1px solid var(--ds-border-strong)',
          borderRadius: '6px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 100,
          minWidth: '165px',
          padding: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <button
            type="button"
            onClick={() => {
              if (onExpandAll) onExpandAll();
              setIsOpen(false);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ds-text)',
              padding: '6px 10px',
              fontSize: '12px',
              borderRadius: '4px',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,0,0,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span>⊞</span>
            <span>Expand All Versions</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (onCollapseAll) onCollapseAll();
              setIsOpen(false);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ds-text)',
              padding: '6px 10px',
              fontSize: '12px',
              borderRadius: '4px',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,0,0,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span>⊟</span>
            <span>Collapse All Versions</span>
          </button>
        </div>
      )}
    </div>
  );
}
