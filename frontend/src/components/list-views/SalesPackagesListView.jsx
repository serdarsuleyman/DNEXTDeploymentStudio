import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from '../ui/Icon';
import { CodeList, SpeedCell, PriceCell, DateCell, ValidityCell, TariffCodes, splitValues, SpecLink, VersionCell, LifecyclePill } from './cellRenderers';
import { C } from './constants';
import {
  AVAILABLE_COLUMNS,
  DEFAULT_COLUMN_KEYS,
  extractSpeedProfile,
  evaluateJsonPath,
  getColumnRawValue
} from './salesPackageColumnConfig';

const STORAGE_KEY = 'dnext_sp_visible_columns';

/**
 * SalesPackagesListView
 * Dedicated, configurable list view component specifically tailored for Sales Packages broadband offers.
 *
 * Configurable Features:
 * - Dynamic Column Mappings: Configure visible columns via "Configure Columns".
 * - JSONPath Support: Custom fields like Internet & Voice Tariff Codes extracted declaratively.
 * - Sortable Columns: Click column headers to sort Ascending (▲), Descending (▼), or Reset.
 * - Filterable Columns: Inline filter row and active filter pills to filter by any field value.
 * - Ready-to-Use Presets: Default, Commercial, Technical, Fulfillment, and Full Details.
 * - LocalStorage Persistence: Preserves user column choices across browser sessions.
 */
export default function SalesPackagesListView({
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
          // Remove legacy 'tech', 'terms', 'categories' and migrate 'price' to 'maf'
          parsed = parsed.filter(k => k !== 'tech' && k !== 'terms' && k !== 'categories').map(k => k === 'price' ? 'maf' : k);
          const valid = parsed.filter(k => AVAILABLE_COLUMNS.some(c => c.key === k));
          if (valid.length > 0) {
            // If psm_code is newly introduced in default columns, automatically include it
            if (DEFAULT_COLUMN_KEYS.includes('psm_code') && !valid.includes('psm_code')) {
              const nameIdx = valid.indexOf('name');
              if (nameIdx !== -1) valid.splice(nameIdx + 1, 0, 'psm_code');
              else valid.push('psm_code');
            }
            // If sku is newly introduced in default columns, automatically include it
            if (DEFAULT_COLUMN_KEYS.includes('sku') && !valid.includes('sku')) {
              const psmIdx = valid.indexOf('psm_code');
              if (psmIdx !== -1) valid.splice(psmIdx + 1, 0, 'sku');
              else {
                const nameIdx = valid.indexOf('name');
                if (nameIdx !== -1) valid.splice(nameIdx + 1, 0, 'sku');
                else valid.push('sku');
              }
            }
            // If maf is newly introduced in default columns, automatically include it
            if (DEFAULT_COLUMN_KEYS.includes('maf') && !valid.includes('maf')) {
              const psmIdx = valid.indexOf('psm_code');
              if (psmIdx !== -1) valid.splice(psmIdx + 1, 0, 'maf');
              else valid.push('maf');
            }
            // If ngn_packet_codes is newly introduced in default columns, automatically include it
            if (DEFAULT_COLUMN_KEYS.includes('ngn_packet_codes') && !valid.includes('ngn_packet_codes')) {
              const psmIdx = valid.indexOf('psm_code');
              if (psmIdx !== -1) valid.splice(psmIdx + 1, 0, 'ngn_packet_codes');
              else valid.push('ngn_packet_codes');
            }
            // If vpn_packet_codes was present, migrate to bitstream_packet_codes
            if (valid.includes('vpn_packet_codes')) {
              const vpnIdx = valid.indexOf('vpn_packet_codes');
              valid.splice(vpnIdx, 1, 'bitstream_packet_codes');
            }
            // If bitstream_packet_codes is newly introduced in default columns, automatically include it
            if (DEFAULT_COLUMN_KEYS.includes('bitstream_packet_codes') && !valid.includes('bitstream_packet_codes')) {
              const ngnIdx = valid.indexOf('ngn_packet_codes');
              if (ngnIdx !== -1) valid.splice(ngnIdx + 1, 0, 'bitstream_packet_codes');
              else valid.push('bitstream_packet_codes');
            }
            // If start_date is newly introduced in default columns, automatically include it
            if (DEFAULT_COLUMN_KEYS.includes('start_date') && !valid.includes('start_date')) {
              const specIdx = valid.indexOf('spec');
              if (specIdx !== -1) valid.splice(specIdx + 1, 0, 'start_date');
              else valid.push('start_date');
            }
            // If end_date is newly introduced in default columns, automatically include it
            if (DEFAULT_COLUMN_KEYS.includes('end_date') && !valid.includes('end_date')) {
              const startIdx = valid.indexOf('start_date');
              if (startIdx !== -1) valid.splice(startIdx + 1, 0, 'end_date');
              else valid.push('end_date');
            }
            return valid;
          }
        }
      }
    } catch (e) {}
    return DEFAULT_COLUMN_KEYS;
  });

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [showFilterRow, setShowFilterRow] = useState(false);
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

  // Save visible columns to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumnKeys));
    } catch (e) {}
  }, [visibleColumnKeys]);

  // Click outside to close customizer popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (customizerRef.current && !customizerRef.current.contains(e.target)) {
        setIsCustomizerOpen(false);
      }
    };
    if (isCustomizerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCustomizerOpen]);

  // Active visible column definitions in display order
  const visibleColumns = useMemo(() => {
    return AVAILABLE_COLUMNS.filter(col => visibleColumnKeys.includes(col.key));
  }, [visibleColumnKeys]);

  const toggleColumn = (key) => {
    setVisibleColumnKeys(prev => {
      if (prev.includes(key)) {
        if (prev.length <= 1) return prev;
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
  const handleFilterChange = (colKey, value) => {
    setColumnFilters(prev => {
      const next = { ...prev };
      if (!value || value.trim() === '' || value === '__all__') {
        delete next[colKey];
      } else {
        next[colKey] = value;
      }
      return next;
    });
  };

  const clearAllFilters = () => {
    setColumnFilters({});
  };

  const activeFilterEntries = Object.entries(columnFilters);

  // Automatically open filter row if any column filter is active
  useEffect(() => {
    if (activeFilterEntries.length > 0 && !showFilterRow) {
      setShowFilterRow(true);
    }
  }, [activeFilterEntries.length]);

  // Compute distinct options for select-friendly filterable columns
  const distinctOptionsMap = useMemo(() => {
    const map = {};
    visibleColumns.forEach(col => {
      if (col.filterable && col.filterType === 'select') {
        const set = new Set();
        groups.forEach(g => {
          const val = getColumnRawValue(g.latestItem, col);
          if (val) set.add(val);
        });
        map[col.key] = Array.from(set).sort();
      }
    });
    return map;
  }, [groups, visibleColumns]);

  // ── Filter & Sort Groups ──
  const processedGroups = useMemo(() => {
    // 1. Column Filtering
    let result = groups.filter(group => {
      for (const [colKey, filterVal] of activeFilterEntries) {
        if (!filterVal) continue;
        const colDef = AVAILABLE_COLUMNS.find(c => c.key === colKey);
        if (!colDef) continue;

        const target = filterVal.toLowerCase().trim();
        const latestVal = getColumnRawValue(group.latestItem, colDef).toLowerCase();
        const matchLatest = colDef.filterType === 'select'
          ? latestVal === target
          : latestVal.includes(target);

        const matchPrev = (group.previousVersions || []).some(v => {
          const vVal = getColumnRawValue(v, colDef).toLowerCase();
          return colDef.filterType === 'select' ? vVal === target : vVal.includes(target);
        });

        if (!matchLatest && !matchPrev) return false;
      }
      return true;
    });

    // 2. Sorting
    if (sortConfig.key) {
      const colDef = AVAILABLE_COLUMNS.find(c => c.key === sortConfig.key);
      if (colDef) {
        const dir = sortConfig.direction === 'asc' ? 1 : -1;
        result = [...result].sort((a, b) => {
          // Special numeric handling for speed
          if (colDef.key === 'speed') {
            const numA = extractSpeedProfile(a.latestItem).numericDown || 0;
            const numB = extractSpeedProfile(b.latestItem).numericDown || 0;
            if (numA !== numB) return (numA - numB) * dir;
          }

          const valA = getColumnRawValue(a.latestItem, colDef);
          const valB = getColumnRawValue(b.latestItem, colDef);

          const numA = parseFloat(valA);
          const numB = parseFloat(valB);
          if (!isNaN(numA) && !isNaN(numB)) {
            return (numA - numB) * dir;
          }

          return valA.localeCompare(valB) * dir;
        });
      }
    }

    return result;
  }, [groups, activeFilterEntries, sortConfig]);

  // ── Cell Render Helpers ──
  const renderCellContent = (colKey, item, isParent = true, group = null) => {
    const colDef = AVAILABLE_COLUMNS.find(c => c.key === colKey);

    // Columns that have dedicated UI markup (version trees, clickable chips, styled badges, date badges)
    const hasCustomRenderer = ['id', 'name', 'spec', 'speed', 'sku', 'maf', 'price', 'start_date', 'end_date', 'version', 'lifecycle', 'tariff_codes', 'validity'].includes(colKey);

    // 1. Configurable custom fields (driven by accessor or JSONPath)
    if (colDef && (colDef.accessor || colDef.jsonPath) && !hasCustomRenderer) {
      const rawVal = colDef.accessor ? colDef.accessor(item) : evaluateJsonPath(item, colDef.jsonPath);
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

      case 'speed': {
        return <SpeedCell profile={extractSpeedProfile(item)} compact={!isParent} />;
      }

      case 'sku': {
        const rawVal = colDef?.jsonPath ? evaluateJsonPath(item, colDef.jsonPath) : null;
        return <CodeList label="SKU" values={splitValues(rawVal)} compact={!isParent} />;
      }

      case 'maf':
      case 'price': {
        const rawVal = colDef?.jsonPath ? evaluateJsonPath(item, colDef.jsonPath) : null;
        return <PriceCell raw={rawVal} compact={!isParent} />;
      }

      case 'start_date':
      case 'end_date': {
        const rawVal = colDef?.jsonPath
          ? evaluateJsonPath(item, colDef.jsonPath)
          : (colKey === 'start_date' ? (item.validFor?.startDateTime || item.raw?.validFor?.startDateTime) : (item.validFor?.endDateTime || item.raw?.validFor?.endDateTime));
        return <DateCell raw={rawVal} kind={colKey === 'start_date' ? 'start' : 'end'} compact={!isParent} />;
      }

      case 'tariff_codes': {
        return (
          <TariffCodes
            internet={splitValues(evaluateJsonPath(item, colDef.internetPath))}
            voice={splitValues(evaluateJsonPath(item, colDef.voicePath))}
            compact={!isParent}
          />
        );
      }

      case 'validity': {
        const startRaw = evaluateJsonPath(item, '$.validFor.startDateTime || $.validFor.startDate || $.startDateTime || $.startDate');
        const endRaw = evaluateJsonPath(item, '$.validFor.endDateTime || $.validFor.endDate || $.endDateTime || $.endDate');
        return <ValidityCell startRaw={startRaw} endRaw={endRaw} compact={!isParent} />;
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

      default:
        return <span style={{ color: C.text, fontSize: '12px' }}>{item[colKey] !== undefined && item[colKey] !== null ? String(item[colKey]) : '-'}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* ── Top Bar: Presets, Filter Toggle & Column Customizer ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        padding: '8px 12px',
        background: 'var(--ds-surface-subtle)',
        borderBottom: `1px solid ${C.border}`,
        borderRadius: '6px',
        marginTop: '8px'
      }}>
        {/* Left: Filter Toggle & Column Selection Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Toggle Filter Row Button */}
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
              title="Configure visible columns for Sales Packages"
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
                    <div style={{ fontSize: '11px', color: C.muted }}>Toggle attributes for Sales Packages</div>
                  </div>
                  <button
                    type="button"
                    onClick={resetToDefaults}
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

        {/* Right: Active Sort Reset */}
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
        </div>
      </div>

      {/* ── Active Filters Pill Bar ── */}
      {activeFilterEntries.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'wrap',
          padding: '6px 12px',
          background: 'rgba(230,0,0,0.04)',
          borderBottom: '1px dashed rgba(230,0,0,0.2)',
          fontSize: '11px'
        }}>
          <span style={{ color: 'var(--ds-brand)', fontWeight: '700' }}>Active Filters:</span>
          {activeFilterEntries.map(([colKey, filterVal]) => {
            const colDef = AVAILABLE_COLUMNS.find(c => c.key === colKey);
            return (
              <span
                key={colKey}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(230,0,0,0.08)',
                  border: '1px solid rgba(230,0,0,0.25)',
                  color: 'var(--ds-brand-dark)',
                  padding: '2px 7px',
                  borderRadius: '4px'
                }}
              >
                <span>{colDef?.label || colKey}: <strong>{filterVal}</strong></span>
                <button
                  type="button"
                  onClick={() => handleFilterChange(colKey, null)}
                  style={{ background: 'none', border: 'none', color: 'var(--ds-brand)', cursor: 'pointer', padding: '0 2px', fontSize: '11px' }}
                  title="Remove filter"
                >
                  ✕
                </button>
              </span>
            );
          })}
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
                  className={col.align === 'right' ? 'is-right' : undefined}
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

          {/* ── Optional Inline Filter Row (filterable: true columns) ── */}
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
                <div style={{ fontSize: '13px', fontWeight: '600' }}>No sales packages match the column filters.</div>
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
                    title="Double-click to view Sales Package details"
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
                          className={col.align === 'right' ? 'is-right' : undefined}
                          onClick={canToggle ? (e) => {
                            e.stopPropagation();
                            onToggleExpand && onToggleExpand(group.groupKey);
                          } : undefined}
                          style={{
                            padding: '10px 12px',
                            cursor: canToggle ? 'pointer' : undefined,
                            color: C.text
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
                          <td key={col.key} className={col.align === 'right' ? 'is-right' : undefined} style={{ padding: '8px 12px', color: C.text }}>
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
