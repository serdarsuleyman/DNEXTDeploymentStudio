import React from 'react';
import Icon from '../ui/Icon';
import { C } from '../../styles/theme';

/**
 * Shared Column Customizer button & dropdown popover
 * used by configurable list views (SalesPackagesListView, OptionsListView).
 */
export default function ColumnCustomizerPopover({
  entityLabel = 'Entities',
  availableColumns = [],
  visibleColumns = [],
  visibleColumnKeys = [],
  isOpen = false,
  onToggleOpen,
  customizerRef,
  onToggleColumn,
  onResetDefaults
}) {
  return (
    <div style={{ position: 'relative' }} ref={customizerRef}>
      <button
        type="button"
        onClick={onToggleOpen}
        style={{
          background: isOpen ? 'rgba(230,0,0,0.08)' : '#ffffff',
          border: `1px solid ${isOpen ? 'var(--ds-brand)' : C.border}`,
          color: isOpen ? 'var(--ds-brand)' : C.text,
          padding: '4px 10px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.15s ease'
        }}
        title={`Configure visible columns for ${entityLabel}`}
      >
        <span><Icon name="settings" size={14} /></span>
        <span>Columns</span>
        <span style={{
          background: 'var(--ds-brand)',
          color: '#fff',
          fontSize: '11px',
          padding: '1px 5px',
          borderRadius: '10px',
          fontWeight: '700'
        }}>
          {visibleColumns.length}/{availableColumns.length}
        </span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: 'calc(100% + 6px)',
          width: '340px',
          background: '#ffffff',
          border: '1px solid var(--ds-border-strong)',
          borderRadius: '8px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
          zIndex: 100,
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: C.text }}>Configure Table Columns</div>
              <div style={{ fontSize: '11px', color: C.muted }}>Toggle attributes for {entityLabel}</div>
            </div>
            <button
              type="button"
              onClick={onResetDefaults}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ds-brand)',
                fontSize: '11px',
                cursor: 'pointer',
                padding: '2px 4px',
                fontWeight: '600'
              }}
              title="Reset to default columns"
            >
              Reset Defaults
            </button>
          </div>

          <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {availableColumns.map(col => {
              const isChecked = visibleColumnKeys.includes(col.key);
              return (
                <label
                  key={col.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    background: isChecked ? 'rgba(230,0,0,0.06)' : 'transparent',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: isChecked ? 'var(--ds-text)' : 'var(--ds-text-3)',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleColumn(col.key)}
                      style={{ cursor: 'pointer', accentColor: 'var(--ds-brand)' }}
                    />
                    <span>{col.label}</span>
                    {col.jsonPath && (
                      <span style={{ fontSize: '10px', background: 'rgba(230,0,0,0.08)', color: 'var(--ds-brand)', padding: '1px 4px', borderRadius: '3px', fontWeight: '700' }}>
                        JSONPath
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {col.sortable && <span title="Sortable column" style={{ fontSize: '11px', color: 'var(--ds-brand)' }}>↕</span>}
                    {col.filterable && <span title="Filterable column" style={{ fontSize: '11px', color: 'var(--ds-ok)' }}><Icon name="search" size={12} /></span>}
                  </div>
                </label>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${C.border}`, paddingTop: '8px' }}>
            <button
              type="button"
              onClick={onToggleOpen}
              style={{
                background: 'var(--ds-brand)',
                border: 'none',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
