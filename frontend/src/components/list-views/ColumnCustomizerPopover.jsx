import React, { useRef, useState, useMemo } from 'react';
import Icon from '../ui/Icon';
import { C } from '../../styles/theme';

/**
 * Shared Column Customizer button & dropdown popover
 * used across configurable list views.
 *
 * Capabilities:
 * - Single-button Select All / Deselect All with dynamic state and count
 * - Drag and drop column reordering with visual drag-over indicators
 * - Display order arrangement with Move Up (▲) / Move Down (▼) fallback buttons
 * - Section separation: Displayed Columns (in table sequence) vs Hidden Columns
 * - Reset Defaults button
 */
export default function ColumnCustomizerPopover({
  entityLabel = 'Entities',
  // Can be passed as a single unified config bundle from useColumnConfig:
  config = null,
  // Or passed as individual props (for granular overrides or backwards compatibility):
  availableColumns: availableColumnsProp,
  visibleColumns: visibleColumnsProp,
  visibleColumnKeys: visibleColumnKeysProp,
  isOpen: isOpenProp,
  onToggleOpen: onToggleOpenProp,
  customizerRef: customizerRefProp,
  onToggleColumn: onToggleColumnProp,
  onMoveColumn: onMoveColumnProp,
  onReorderColumns: onReorderColumnsProp,
  onSelectAll: onSelectAllProp,
  onDeselectAll: onDeselectAllProp,
  onToggleSelectAll: onToggleSelectAllProp,
  onResetDefaults: onResetDefaultsProp
}) {
  const availableColumns = availableColumnsProp || config?.availableColumns || [];
  const visibleColumns = visibleColumnsProp || config?.visibleColumns || [];
  const visibleColumnKeys = visibleColumnKeysProp || config?.visibleColumnKeys || [];
  const isOpen = isOpenProp !== undefined ? isOpenProp : (config?.isCustomizerOpen || false);
  const onToggleOpen = onToggleOpenProp || config?.onToggleOpen || (config ? () => config.setIsCustomizerOpen(prev => !prev) : undefined);
  const customizerRef = customizerRefProp || config?.customizerRef;
  const onToggleColumn = onToggleColumnProp || config?.toggleColumn;
  const onMoveColumn = onMoveColumnProp || config?.moveColumn;
  const onReorderColumns = onReorderColumnsProp || config?.reorderColumns;
  const onSelectAll = onSelectAllProp || config?.selectAll;
  const onDeselectAll = onDeselectAllProp || config?.deselectAll;
  const onToggleSelectAll = onToggleSelectAllProp || config?.toggleSelectAll;
  const onResetDefaults = onResetDefaultsProp || config?.resetToDefaults;

  // ── Drag & Drop State ──
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const isAllSelected = availableColumns.length > 0 && visibleColumnKeys.length === availableColumns.length;

  const handleMasterToggle = () => {
    if (onToggleSelectAll) {
      onToggleSelectAll();
    } else if (isAllSelected) {
      onDeselectAll && onDeselectAll();
    } else {
      onSelectAll && onSelectAll();
    }
  };

  // Group columns into displayed (ordered) and hidden
  const displayedCols = useMemo(() => {
    return visibleColumnKeys
      .map(k => availableColumns.find(c => c.key === k))
      .filter(Boolean);
  }, [availableColumns, visibleColumnKeys]);

  const hiddenCols = useMemo(() => {
    const visibleSet = new Set(visibleColumnKeys);
    return availableColumns.filter(c => !visibleSet.has(c.key));
  }, [availableColumns, visibleColumnKeys]);

  // ── Drag & Drop Event Handlers ──
  const handleDragStart = (e, index, colKey) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', colKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e, index) => {
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      if (onReorderColumns) {
        onReorderColumns(draggedIndex, targetIndex);
      } else if (config?.reorderColumns) {
        config.reorderColumns(draggedIndex, targetIndex);
      } else if (config?.setVisibleColumnKeys) {
        config.setVisibleColumnKeys(prev => {
          const next = [...prev];
          const [moved] = next.splice(draggedIndex, 1);
          next.splice(targetIndex, 0, moved);
          return next;
        });
      }
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

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
        title={`Configure visible columns and display order for ${entityLabel}`}
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
          width: '390px',
          background: '#ffffff',
          border: '1px solid var(--ds-border-strong)',
          borderRadius: '8px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.14)',
          zIndex: 100,
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Header with Title and Reset Defaults */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: C.text }}>Configure Table Columns</div>
              <div style={{ fontSize: '11px', color: C.muted }}>Drag to reorder & toggle columns for {entityLabel}</div>
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
              title="Reset columns and order to defaults"
            >
              Reset Defaults
            </button>
          </div>

          {/* Master Select All / Deselect All Single Button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--ds-surface-subtle)',
            border: `1px solid ${C.border}`,
            borderRadius: '6px',
            padding: '7px 10px',
            gap: '8px'
          }}>
            <button
              type="button"
              onClick={handleMasterToggle}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '5px',
                border: `1px solid ${isAllSelected ? 'var(--ds-border-strong)' : 'var(--ds-brand)'}`,
                background: isAllSelected ? '#ffffff' : 'var(--ds-brand)',
                color: isAllSelected ? C.text : '#ffffff',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isAllSelected ? 'none' : '0 1px 3px rgba(230,0,0,0.2)'
              }}
              title={isAllSelected ? 'Hide all columns' : 'Show all available columns'}
            >
              <span>{isAllSelected ? '☒' : '☑'}</span>
              <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
            </button>

            <span style={{
              fontSize: '11px',
              color: 'var(--ds-text-2)',
              fontWeight: '600'
            }}>
              {displayedCols.length} of {availableColumns.length} visible
            </span>
          </div>

          {/* Scrollable Columns List */}
          <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* ── Displayed Columns (Ordered & Draggable) ── */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '4px'
              }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ds-brand)', fontWeight: '700' }}>
                  Displayed Columns (Drag to Reorder):
                </span>
                <span style={{ fontSize: '10px', color: C.muted, fontStyle: 'italic' }}>
                  Drop to reposition
                </span>
              </div>

              {displayedCols.length === 0 ? (
                <div style={{ padding: '10px', fontSize: '12px', color: C.muted, fontStyle: 'italic', textAlign: 'center', background: 'var(--ds-surface-subtle)', borderRadius: '4px' }}>
                  No columns selected. Check columns below or click Select All.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {displayedCols.map((col, index) => {
                    const isFirst = index === 0;
                    const isLast = index === displayedCols.length - 1;
                    const isDragging = draggedIndex === index;
                    const isDragOver = dragOverIndex === index && draggedIndex !== index;

                    return (
                      <div
                        key={col.key}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, index, col.key)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={(e) => handleDragLeave(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '5px 8px',
                          borderRadius: '4px',
                          background: isDragOver
                            ? 'rgba(230,0,0,0.14)'
                            : isDragging
                            ? 'rgba(230,0,0,0.02)'
                            : 'rgba(230,0,0,0.06)',
                          border: isDragOver
                            ? '2px dashed var(--ds-brand)'
                            : isDragging
                            ? '1px dashed var(--ds-border-strong)'
                            : '1px solid rgba(230,0,0,0.12)',
                          opacity: isDragging ? 0.4 : 1,
                          fontSize: '12px',
                          color: 'var(--ds-text)',
                          cursor: 'grab',
                          transition: 'background 0.15s ease, border 0.15s ease, transform 0.15s ease'
                        }}
                      >
                        {/* Drag Handle, Checkbox, Order Sequence, Label */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                          {/* Drag Grip Handle */}
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              cursor: 'grab',
                              color: isDragging ? 'var(--ds-brand)' : 'var(--ds-text-2)',
                              padding: '1px 2px',
                              userSelect: 'none'
                            }}
                            title="Drag and drop to reorder column"
                          >
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                              <circle cx="5" cy="3" r="1.5" />
                              <circle cx="11" cy="3" r="1.5" />
                              <circle cx="5" cy="8" r="1.5" />
                              <circle cx="11" cy="8" r="1.5" />
                              <circle cx="5" cy="13" r="1.5" />
                              <circle cx="11" cy="13" r="1.5" />
                            </svg>
                          </span>

                          <input
                            type="checkbox"
                            checked={true}
                            onChange={() => onToggleColumn && onToggleColumn(col.key)}
                            style={{ cursor: 'pointer', accentColor: 'var(--ds-brand)' }}
                            title="Uncheck to hide column"
                          />

                          <span style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            color: '#ffffff',
                            background: 'var(--ds-brand)',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            lineHeight: 1.2
                          }}>
                            #{index + 1}
                          </span>

                          <span style={{
                            fontWeight: '600',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }} title={col.description || col.label}>
                            {col.label}
                          </span>

                          {col.jsonPath && (
                            <span style={{ fontSize: '9px', background: 'rgba(230,0,0,0.08)', color: 'var(--ds-brand)', padding: '1px 4px', borderRadius: '3px', fontWeight: '700' }}>
                              JSONPath
                            </span>
                          )}
                        </div>

                        {/* Reorder Up/Down Arrow Controls (as precision click fallback) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '6px' }}>
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveColumn && onMoveColumn(col.key, 'up');
                            }}
                            style={{
                              background: isFirst ? 'transparent' : '#ffffff',
                              border: `1px solid ${isFirst ? 'transparent' : C.border}`,
                              color: isFirst ? 'rgba(0,0,0,0.2)' : 'var(--ds-brand)',
                              cursor: isFirst ? 'not-allowed' : 'pointer',
                              padding: '2px 5px',
                              borderRadius: '3px',
                              fontSize: '10px',
                              lineHeight: 1,
                              fontWeight: '700'
                            }}
                            title={isFirst ? 'Already first column' : 'Move column earlier / left'}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={isLast}
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveColumn && onMoveColumn(col.key, 'down');
                            }}
                            style={{
                              background: isLast ? 'transparent' : '#ffffff',
                              border: `1px solid ${isLast ? 'transparent' : C.border}`,
                              color: isLast ? 'rgba(0,0,0,0.2)' : 'var(--ds-brand)',
                              cursor: isLast ? 'not-allowed' : 'pointer',
                              padding: '2px 5px',
                              borderRadius: '3px',
                              fontSize: '10px',
                              lineHeight: 1,
                              fontWeight: '700'
                            }}
                            title={isLast ? 'Already last column' : 'Move column later / right'}
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Hidden Columns (Available to Add) ── */}
            {hiddenCols.length > 0 && (
              <div style={{ borderTop: `1px dashed ${C.border}`, paddingTop: '8px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: C.muted, fontWeight: '700', marginBottom: '4px' }}>
                  Hidden Columns ({hiddenCols.length}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {hiddenCols.map(col => (
                    <div
                      key={col.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: 'var(--ds-surface-subtle)',
                        border: `1px solid ${C.border}`,
                        fontSize: '12px',
                        color: 'var(--ds-text-2)'
                      }}
                    >
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: 0, flex: 1 }}>
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => onToggleColumn && onToggleColumn(col.key)}
                          style={{ cursor: 'pointer', accentColor: 'var(--ds-brand)' }}
                        />
                        <span style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }} title={col.description || col.label}>
                          {col.label}
                        </span>
                        {col.jsonPath && (
                          <span style={{ fontSize: '9px', background: 'rgba(0,0,0,0.05)', color: C.muted, padding: '1px 4px', borderRadius: '3px' }}>
                            JSONPath
                          </span>
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={() => onToggleColumn && onToggleColumn(col.key)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--ds-brand)',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: '600',
                          padding: '1px 4px'
                        }}
                        title={`Show ${col.label}`}
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Help Footer */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '6px', fontSize: '11px', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Drag items or use ▲/▼ to arrange columns</span>
            <button
              type="button"
              onClick={onToggleOpen}
              style={{
                background: 'var(--ds-brand)',
                border: 'none',
                color: '#ffffff',
                padding: '3px 10px',
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
