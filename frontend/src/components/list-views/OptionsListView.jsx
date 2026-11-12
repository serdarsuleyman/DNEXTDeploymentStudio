import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from '../ui/Icon';
import { CodeList, PriceCell, splitValues, SpecLink, VersionCell, LifecyclePill } from './cellRenderers';
import { C } from './constants';
import {
  AVAILABLE_COLUMNS,
  DEFAULT_COLUMN_KEYS,
  evaluateJsonPath,
  getColumnRawValue
} from './optionColumnConfig';

const STORAGE_KEY = 'dnext_options_visible_columns';

/**
 * OptionsListView
 * Dedicated, configurable list view component specifically tailored for Product Offerings
 * whose Product Specification contains "option" in its name.
 *
 * Configurable Features:
 * - Dynamic Column Mappings: Configure visible columns via "Columns".
 * - JSONPath Support: Custom fields like Tariff Codes & PSM Code extracted declaratively.
 * - Sortable Columns: Click column headers to sort Ascending (▲), Descending (▼), or Reset.
 * - Filterable Columns: Inline filter row and active filter pills to filter by any field value.
 * - Version Expansion: Interactive click on the Version column expands all versions in a tree hierarchy.
 * - LocalStorage Persistence: Preserves user column choices across browser sessions.
 */
export default function OptionsListView({
  groups = [],
  selectedIds = new Set(),
  expandedGroups = new Set(),
  onToggleSelectAll,
  onToggleSelectItem,
  onToggleExpand,
  onExpandAll,
  onCollapseAll,
  onRefreshCatalog,
  isRefreshing = false,
  cacheStatus = null,
  onOpenDetail,
  onSpecFilter
}) {
  // ── Column Configuration State (persisted in localStorage) ──
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(k => AVAILABLE_COLUMNS.some(c => c.key === k));
          if (valid.length > 0) {
            // Auto-include newly added default columns 'sku' and 'product_family_name'
            if (DEFAULT_COLUMN_KEYS.includes('sku') && !valid.includes('sku')) {
              const nameIdx = valid.indexOf('name');
              valid.splice(nameIdx !== -1 ? nameIdx + 1 : valid.length, 0, 'sku');
            }
            if (DEFAULT_COLUMN_KEYS.includes('product_family_name') && !valid.includes('product_family_name')) {
              const skuIdx = valid.indexOf('sku');
              valid.splice(skuIdx !== -1 ? skuIdx + 1 : valid.length, 0, 'product_family_name');
            }
            return valid;
          }
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_COLUMN_KEYS;
  });

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const customizerRef = useRef(null);

  // ── Version Expand / Collapse Single Button & Menu State ──
  const [isVersionMenuOpen, setIsVersionMenuOpen] = useState(false);
  const versionMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (versionMenuRef.current && !versionMenuRef.current.contains(e.target)) {
        setIsVersionMenuOpen(false);
      }
    };
    if (isVersionMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVersionMenuOpen]);

  const multiVersionGroups = useMemo(() => {
    return groups.filter(g => g.previousVersions && g.previousVersions.length > 0);
  }, [groups]);

  const hasVersions = multiVersionGroups.length > 0;
  const isAnyExpanded = hasVersions && multiVersionGroups.some(g => expandedGroups && expandedGroups.has(g.groupKey));

  const handleToggleVersions = () => {
    if (isAnyExpanded) {
      if (onCollapseAll) onCollapseAll();
    } else {
      if (onExpandAll) onExpandAll();
    }
  };

  // ── Sorting State ──
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // ── Column Filtering State ──
  const [columnFilters, setColumnFilters] = useState({});
  const [showFilterRow, setShowFilterRow] = useState(false);

  // Sync visible column preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumnKeys));
    } catch {
      // Ignore
    }
  }, [visibleColumnKeys]);

  // Click outside listener for column customizer popover
  useEffect(() => {
    if (!isCustomizerOpen) return;
    const handleClickOutside = (e) => {
      if (customizerRef.current && !customizerRef.current.contains(e.target)) {
        setIsCustomizerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCustomizerOpen]);

  // Visible column definitions in display order
  const visibleColumns = useMemo(() => {
    return visibleColumnKeys
      .map(key => AVAILABLE_COLUMNS.find(c => c.key === key))
      .filter(Boolean);
  }, [visibleColumnKeys]);

  const toggleColumn = (key) => {
    setVisibleColumnKeys(prev => {
      if (prev.includes(key)) {
        if (prev.length <= 1) return prev; // Keep at least one column
        return prev.filter(k => k !== key);
      }
      return [...prev, key];
    });
  };

  const resetToDefaults = () => {
    setVisibleColumnKeys(DEFAULT_COLUMN_KEYS);
  };

  // ── Sorting Handler ──
  const handleSort = (colKey) => {
    const colDef = AVAILABLE_COLUMNS.find(c => c.key === colKey);
    if (!colDef || !colDef.sortable) return;

    setSortConfig(prev => {
      if (prev.key === colKey) {
        if (prev.direction === 'asc') return { key: colKey, direction: 'desc' };
        if (prev.direction === 'desc') return { key: null, direction: 'asc' };
      }
      return { key: colKey, direction: 'asc' };
    });
  };

  // ── Column Filter Handler ──
  const handleFilterChange = (colKey, val) => {
    setColumnFilters(prev => {
      const next = { ...prev };
      if (!val || val === '__all__') {
        delete next[colKey];
      } else {
        next[colKey] = val;
      }
      return next;
    });
  };

  const clearAllFilters = () => {
    setColumnFilters({});
  };

  // Unique options for select filters (e.g. lifecycle)
  const distinctOptionsMap = useMemo(() => {
    const map = {};
    AVAILABLE_COLUMNS.forEach(col => {
      if (col.filterType === 'select') {
        const set = new Set();
        groups.forEach(g => {
          const raw = getColumnRawValue(g.latestItem, col);
          if (raw) set.add(raw);
          (g.previousVersions || []).forEach(v => {
            const vRaw = getColumnRawValue(v, col);
            if (vRaw) set.add(vRaw);
          });
        });
        map[col.key] = Array.from(set).sort();
      }
    });
    return map;
  }, [groups]);

  // ── Processed (Filtered + Sorted) Groups ──
  const processedGroups = useMemo(() => {
    let result = groups;

    // Apply column filters
    const activeFilters = Object.entries(columnFilters).filter(([, val]) => Boolean(val));
    if (activeFilters.length > 0) {
      result = result.filter(group => {
        return activeFilters.every(([colKey, filterVal]) => {
          const colDef = AVAILABLE_COLUMNS.find(c => c.key === colKey);
          if (!colDef) return true;

          const checkMatch = (item) => {
            const raw = getColumnRawValue(item, colDef).toLowerCase();
            const target = String(filterVal).toLowerCase();
            if (colDef.filterType === 'select') {
              return raw === target;
            }
            return raw.includes(target);
          };

          const matchLatest = checkMatch(group.latestItem);
          const matchPrev = (group.previousVersions || []).some(checkMatch);
          return matchLatest || matchPrev;
        });
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      const colDef = AVAILABLE_COLUMNS.find(c => c.key === sortConfig.key);
      if (colDef) {
        const dir = sortConfig.direction === 'asc' ? 1 : -1;
        result = [...result].sort((a, b) => {
          const valA = getColumnRawValue(a.latestItem, colDef);
          const valB = getColumnRawValue(b.latestItem, colDef);

          const numA = parseFloat(valA);
          const numB = parseFloat(valB);
          if (!isNaN(numA) && !isNaN(numB)) {
            return (numA - numB) * dir;
          }
          return String(valA).localeCompare(String(valB)) * dir;
        });
      }
    }

    return result;
  }, [groups, columnFilters, sortConfig]);

  // ── Active Filters List for Pill Display ──
  const activeFilterEntries = useMemo(() => {
    return Object.entries(columnFilters).map(([k, v]) => ({
      key: k,
      label: AVAILABLE_COLUMNS.find(c => c.key === k)?.label || k,
      val: v
    }));
  }, [columnFilters]);

  // ── Cell Rendering ──
  const renderCellContent = (colKey, item, isParent, group) => {
    const colDef = AVAILABLE_COLUMNS.find(c => c.key === colKey);

    // 1. JSONPath based column with badge style
    if (colDef?.jsonPath && colDef.key !== 'spec' && colDef.key !== 'id' && colDef.key !== 'name' && colDef.key !== 'maf' && colDef.key !== 'version' && colDef.key !== 'lifecycle') {
      const rawVal = evaluateJsonPath(item, colDef.jsonPath);
      if (rawVal === null || rawVal === undefined || String(rawVal).trim() === '') {
        return <span style={{ color: C.muted, fontSize: '12px' }}>-</span>;
      }
      const vals = splitValues(rawVal);
      // Code-like characteristics or any multi-value field → neutral typed chips with expandable "+N"
      if (colDef.codeLabel || colDef.badgeStyle || vals.length > 1) {
        return <CodeList label={colDef.codeLabel} values={vals} compact={!isParent} />;
      }
      return (
        <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '12px', color: C.text, fontWeight: '500' }}>
          {String(rawVal)}
        </span>
      );
    }

    // 2. Standard Built-in Columns
    switch (colKey) {
      case 'id': {
        return (
          <span style={{
            fontFamily: 'var(--ds-font-mono)',
            fontSize: isParent ? '12px' : '11px',
            color: isParent ? 'var(--ds-text)' : 'var(--ds-text-2)',
            fontWeight: isParent ? '600' : '400',
            display: 'inline-block',
            paddingLeft: isParent ? '0' : '4px'
          }}>
            {item.id}
          </span>
        );
      }

      case 'name': {
        return (
          <div style={{ color: isParent ? 'var(--ds-text)' : 'var(--ds-text-2)', fontSize: isParent ? '13px' : '12px', fontWeight: isParent ? '600' : '400' }}>
            {item.name || '-'}
          </div>
        );
      }

      case 'spec': {
        const spec = item.productSpecification || item.raw?.productSpecification;
        return (
          <SpecLink
            spec={spec}
            compact={!isParent}
            onFilter={(name) => {
              handleFilterChange('spec', name);
              setShowFilterRow(true);
              if (onSpecFilter) onSpecFilter(name);
            }}
          />
        );
      }

      case 'maf': {
        const rawVal = colDef?.jsonPath ? evaluateJsonPath(item, colDef.jsonPath) : null;
        return <PriceCell raw={rawVal} compact={!isParent} />;
      }

      case 'version': {
        const totalVersions = group?.previousVersions?.length
          ? (group.totalVersions || group.previousVersions.length + 1)
          : 1;
        return (
          <VersionCell
            version={item.version}
            totalVersions={totalVersions}
            isExpanded={Boolean(group && expandedGroups.has(group.groupKey))}
            onToggle={group ? () => onToggleExpand && onToggleExpand(group.groupKey) : undefined}
            isParent={isParent}
          />
        );
      }

      case 'lifecycle': {
        return <LifecyclePill status={item.lifecycleStatus} compact={!isParent} />;
      }

      default: {
        const val = colDef ? getColumnRawValue(item, colDef) : item[colKey];
        return <span style={{ fontSize: '12px', color: C.text }}>{val !== undefined && val !== null ? String(val) : '-'}</span>;
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'auto' }}>

      {/* ── Toolbar: Filter Toggle, Sort Reset & Configure Columns ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        background: 'var(--ds-surface-subtle)',
        borderBottom: `1px solid ${C.border}`,
        borderRadius: '6px',
        marginTop: '8px'
      }}>
        {/* Left: Filter Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowFilterRow(prev => !prev)}
            style={{
              background: showFilterRow || activeFilterEntries.length > 0 ? 'rgba(230,0,0,0.08)' : '#ffffff',
              border: `1px solid ${showFilterRow || activeFilterEntries.length > 0 ? 'var(--ds-brand)' : C.border}`,
              color: showFilterRow || activeFilterEntries.length > 0 ? 'var(--ds-brand)' : C.text,
              padding: '4px 9px',
              borderRadius: '5px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease'
            }}
            title={showFilterRow ? "Hide column filters" : "Show column filter inputs"}
          >
            <span><Icon name="search" size={14} /></span>
            <span>{showFilterRow ? 'Hide Filters' : 'Filter Columns'}</span>
            {activeFilterEntries.length > 0 && (
              <span style={{ background: 'var(--ds-brand)', color: '#fff', fontSize: '11px', padding: '1px 5px', borderRadius: '10px', fontWeight: '700' }}>
                {activeFilterEntries.length}
              </span>
            )}
          </button>
          {/* Configure Columns Popover Toggle - Positioned next to Filter Columns button */}
          <div style={{ position: 'relative' }} ref={customizerRef}>
            <button
              type="button"
              onClick={() => setIsCustomizerOpen(prev => !prev)}
              style={{
                background: isCustomizerOpen ? 'rgba(230,0,0,0.08)' : '#ffffff',
                border: `1px solid ${isCustomizerOpen ? 'var(--ds-brand)' : C.border}`,
                color: isCustomizerOpen ? 'var(--ds-brand)' : C.text,
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
              title="Configure visible columns for Options"
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
                {visibleColumns.length}/{AVAILABLE_COLUMNS.length}
              </span>
            </button>

            {/* ── Dropdown Popover ── */}
            {isCustomizerOpen && (
              <div style={{
                position: 'absolute',
                left: 0,
                top: 'calc(100% + 6px)',
                width: '340px',
                background: '#ffffff',
                border: `1px solid var(--ds-border-strong)`,
                borderRadius: '8px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                zIndex: 100,
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: C.text }}>Configure Table Columns</div>
                    <div style={{ fontSize: '11px', color: C.muted }}>Select visible attributes for Options</div>
                  </div>
                  <button
                    type="button"
                    onClick={resetToDefaults}
                    style={{
                      background: 'none',
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

                {/* Available Column Checkboxes */}
                <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {AVAILABLE_COLUMNS.map(col => {
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
                            onChange={() => toggleColumn(col.key)}
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

                {/* Footer */}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: C.muted }}>
                  <span>{visibleColumns.length} of {AVAILABLE_COLUMNS.length} active</span>
                  <button
                    type="button"
                    onClick={() => setIsCustomizerOpen(false)}
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

          {/* Expand / Collapse Versions Single Button & Menu */}
          {hasVersions && (
            <div style={{ position: 'relative' }} ref={versionMenuRef}>
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
                  title={isAnyExpanded ? "Click to collapse all version trees" : "Click to expand all version trees"}
                >
                  <span>{isAnyExpanded ? '⊟' : '⊞'}</span>
                  <span>{isAnyExpanded ? 'Collapse Versions' : 'Expand Versions'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsVersionMenuOpen(prev => !prev)}
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

              {isVersionMenuOpen && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 'calc(100% + 6px)',
                  background: '#ffffff',
                  border: `1px solid var(--ds-border-strong)`,
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
                      setIsVersionMenuOpen(false);
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
                      setIsVersionMenuOpen(false);
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
          )}
        </div>

        {/* Right: Active Sort Reset & Refresh Catalog Button (aligned right) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {sortConfig.key && (
            <button
              type="button"
              onClick={() => setSortConfig({ key: null, direction: 'asc' })}
              style={{
                background: 'rgba(230,0,0,0.06)',
                border: '1px solid rgba(230,0,0,0.25)',
                color: 'var(--ds-brand)',
                padding: '4px 8px',
                borderRadius: '5px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Clear active column sort"
            >
              <span>Sorted by: <strong>{AVAILABLE_COLUMNS.find(c => c.key === sortConfig.key)?.label || sortConfig.key}</strong> ({sortConfig.direction === 'asc' ? '▲' : '▼'})</span>
              <span style={{ marginLeft: '4px', fontSize: '12px' }}>✕</span>
            </button>
          )}

          {/* Refresh Catalog Button aligned on the right side of the row */}
          {onRefreshCatalog && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              {cacheStatus && (
                <span
                  style={{
                    fontSize: '11px',
                    color: cacheStatus.isCached ? 'var(--ds-ok)' : 'var(--ds-text-2)',
                    background: cacheStatus.isCached ? 'rgba(16,185,129,0.08)' : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${cacheStatus.isCached ? 'rgba(16,185,129,0.25)' : 'var(--ds-border)'}`,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title={cacheStatus.cachedAt ? `Loaded from SQLite backend cache (${new Date(cacheStatus.cachedAt).toLocaleString()})` : 'Live catalog data'}
                >
                  <span>{cacheStatus.isCached ? 'Cached' : 'Live'}</span>
                  {cacheStatus.cachedAt && (
                    <span style={{ fontSize: '11px', color: 'var(--ds-text-2)' }}>
                      ({new Date(cacheStatus.cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  )}
                </span>
              )}

              <button
                type="button"
                onClick={onRefreshCatalog}
                disabled={isRefreshing}
                style={{
                  background: 'var(--ds-brand)',
                  border: '1px solid var(--ds-brand-dark)',
                  color: '#ffffff',
                  padding: '4px 12px',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: isRefreshing ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 3px rgba(230,0,0,0.25)',
                  transition: 'all 0.15s ease'
                }}
                title="Fetch latest remote entities from active DNEXT environment (bypasses cache)"
              >
                <span style={{ display: 'inline-block', animation: isRefreshing ? 'spin 1s infinite linear' : 'none' }}>
                  {isRefreshing ? '' : '⟳'}
                </span>
                <span>{isRefreshing ? 'Refreshing…' : 'Refresh Catalog'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Active Column Filter Chips Bar ── */}
      {activeFilterEntries.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'wrap',
          padding: '6px 12px',
          background: 'rgba(230,0,0,0.04)',
          borderBottom: `1px solid ${C.border}`,
          fontSize: '12px'
        }}>
          <span style={{ color: 'var(--ds-brand)', fontWeight: '700' }}>Active Filters:</span>
          {activeFilterEntries.map(entry => (
            <span
              key={entry.key}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(230,0,0,0.08)',
                border: '1px solid rgba(230,0,0,0.25)',
                color: 'var(--ds-brand-dark)',
                padding: '2px 8px',
                borderRadius: '4px'
              }}
            >
              <span>{entry.label}: <strong>{entry.val}</strong></span>
              <button
                type="button"
                onClick={() => handleFilterChange(entry.key, null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ds-brand)',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '11px',
                  lineHeight: 1
                }}
                title={`Remove ${entry.label} filter`}
              >
                ✕
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAllFilters}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ds-brand)',
              cursor: 'pointer',
              fontSize: '11px',
              textDecoration: 'underline',
              padding: '2px 4px'
            }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Main Configurable Table ── */}
      <table className="ds-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginTop: '6px', textAlign: 'left' }}>
        <thead>
          {/* Header Row with Sort Triggers */}
          <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <th style={{ padding: '10px 8px', width: '38px', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={processedGroups.length > 0 && selectedIds.size === processedGroups.length}
                onChange={onToggleSelectAll}
                style={{ cursor: 'pointer', accentColor: C.indigo }}
              />
            </th>
            {visibleColumns.map(col => {
              const isSorted = sortConfig.key === col.key;
              const isFiltered = Boolean(columnFilters[col.key]);

              return (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  style={{
                    padding: '10px 12px',
                    width: col.width,
                    minWidth: col.minWidth,
                    cursor: col.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                    color: isSorted ? 'var(--ds-brand)' : isFiltered ? 'var(--ds-ok)' : C.muted,
                    transition: 'color 0.15s ease'
                  }}
                  title={col.sortable ? `Click to sort by ${col.label}` : col.label}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span style={{
                        fontSize: isSorted ? '10px' : '9px',
                        color: isSorted ? 'var(--ds-brand)' : 'rgba(0,0,0,0.25)',
                        fontWeight: isSorted ? '800' : '400'
                      }}>
                        {isSorted ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    )}
                    {isFiltered && (
                      <span style={{ fontSize: '10px', color: 'var(--ds-ok)' }} title="Active filter on this column">
                        ●
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>

          {/* ── Optional Inline Filter Row ── */}
          {showFilterRow && (
            <tr style={{ background: 'var(--ds-surface-2)', borderBottom: `1px solid ${C.border}` }}>
              <th style={{ padding: '4px 8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: C.muted }}><Icon name="search" size={12} /></span>
              </th>
              {visibleColumns.map(col => {
                if (!col.filterable) {
                  return <th key={col.key} style={{ padding: '4px 12px' }} />;
                }

                const currentVal = columnFilters[col.key] || '';
                const distinctOptions = distinctOptionsMap[col.key] || [];

                return (
                  <th key={col.key} style={{ padding: '4px 10px' }}>
                    {col.filterType === 'select' && distinctOptions.length > 0 ? (
                      <select
                        value={currentVal || '__all__'}
                        onChange={e => handleFilterChange(col.key, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          border: `1px solid ${currentVal ? 'var(--ds-brand)' : C.border}`,
                          background: currentVal ? 'rgba(230,0,0,0.06)' : '#ffffff',
                          color: currentVal ? 'var(--ds-brand)' : C.text,
                          fontSize: '11px',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="__all__">All {col.label}</option>
                        {distinctOptions.map(opt => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder={`Filter ${col.label}…`}
                          value={currentVal}
                          onChange={e => handleFilterChange(col.key, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '4px 20px 4px 6px',
                            borderRadius: '4px',
                            border: `1px solid ${currentVal ? 'var(--ds-brand)' : C.border}`,
                            background: currentVal ? 'rgba(230,0,0,0.06)' : '#ffffff',
                            color: currentVal ? 'var(--ds-brand)' : C.text,
                            fontSize: '11px',
                            outline: 'none'
                          }}
                        />
                        {currentVal && (
                          <button
                            type="button"
                            onClick={() => handleFilterChange(col.key, null)}
                            style={{
                              position: 'absolute',
                              right: '4px',
                              background: 'transparent',
                              border: 'none',
                              color: C.muted,
                              cursor: 'pointer',
                              fontSize: '11px',
                              padding: '1px'
                            }}
                            title="Clear column filter"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          )}
        </thead>
        <tbody>
          {processedGroups.length === 0 ? (
            <tr>
              <td colSpan={visibleColumns.length + 1} style={{ textAlign: 'center', padding: '36px 12px', color: C.muted }}>
                <div style={{ fontSize: '20px', marginBottom: '6px' }}><Icon name="inbox" size={20} /></div>
                <div style={{ fontSize: '13px', fontWeight: '600' }}>No options match the column filters.</div>
                {activeFilterEntries.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    style={{ marginTop: '8px', background: 'rgba(230,0,0,0.06)', border: '1px solid var(--ds-brand)', color: 'var(--ds-brand)', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Clear Active Filters
                  </button>
                )}
              </td>
            </tr>
          ) : (
            processedGroups.map((group) => {
              const item = group.latestItem;
              const isSelected = selectedIds.has(item.id);
              const isExpanded = expandedGroups.has(group.groupKey);
              const hasMultipleVersions = group.previousVersions && group.previousVersions.length > 0;

              return (
                <React.Fragment key={group.groupKey}>
                  {/* ── Parent / Latest Version Row ── */}
                  <tr
                    onDoubleClick={() => onOpenDetail && onOpenDetail(item)}
                    title="Double-click to view Option details"
                    style={{
                      borderBottom: hasMultipleVersions && isExpanded ? '1px dashed rgba(230,0,0,0.3)' : `1px solid ${C.border}`,
                      background: isSelected ? 'rgba(230,0,0,0.06)' : isExpanded ? 'rgba(230,0,0,0.02)' : 'transparent',
                      transition: 'background 0.15s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isSelected ? 'rgba(230,0,0,0.1)' : 'var(--ds-surface-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isSelected ? 'rgba(230,0,0,0.06)' : isExpanded ? 'rgba(230,0,0,0.02)' : 'transparent';
                    }}
                  >
                    {/* Fixed Checkbox Column */}
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => onToggleSelectItem && onToggleSelectItem(item.id)}
                        style={{ cursor: 'pointer', accentColor: 'var(--ds-brand)' }}
                      />
                    </td>

                    {/* Configurable Dynamic Columns */}
                    {visibleColumns.map(col => {
                      const isVersionCol = col.key === 'version';
                      const canToggle = isVersionCol && hasMultipleVersions;
                      return (
                        <td
                          key={col.key}
                          onClick={canToggle ? (e) => {
                            e.stopPropagation();
                            onToggleExpand && onToggleExpand(group.groupKey);
                          } : undefined}
                          style={{
                            padding: '10px 12px',
                            color: C.text,
                            cursor: canToggle ? 'pointer' : undefined
                          }}
                        >
                          {renderCellContent(col.key, item, true, group)}
                        </td>
                      );
                    })}
                  </tr>

                  {/* ── Sub-rows: Previous Versions (Tree Expanded) ── */}
                  {hasMultipleVersions && isExpanded && group.previousVersions.map((prevItem, pIdx) => {
                    const isLastChild = pIdx === group.previousVersions.length - 1;

                    return (
                      <tr
                        key={`${group.groupKey}-v${prevItem.version}-${pIdx}`}
                        onDoubleClick={() => onOpenDetail && onOpenDetail(prevItem)}
                        title={`Double-click to view version ${prevItem.version} details`}
                        style={{
                          background: 'var(--ds-surface-subtle)',
                          borderBottom: isLastChild ? `1px solid ${C.border}` : `1px dashed ${C.border}`,
                          borderLeft: '3px solid var(--ds-brand)',
                          cursor: 'pointer',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(230,0,0,0.04)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--ds-surface-subtle)';
                        }}
                      >
                        {/* Fixed Tree Indent Icon */}
                        <td style={{ padding: '8px 8px', textAlign: 'center', color: 'var(--ds-brand)', fontSize: '12px' }}>
                          <span style={{ opacity: 0.8 }}>↳</span>
                        </td>

                        {/* Matching Configurable Dynamic Columns for child rows */}
                        {visibleColumns.map(col => (
                          <td key={col.key} style={{ padding: '8px 12px', color: C.text }}>
                            {renderCellContent(col.key, prevItem, false, group)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
