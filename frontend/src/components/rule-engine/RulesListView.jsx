import React, { useMemo, useState } from 'react';
import Icon from '../ui/Icon';
import { C } from '../../styles/theme';
import { useColumnConfig } from '../../hooks/useColumnConfig';
import { useTableFilterSort } from '../../hooks/useTableFilterSort';
import ColumnCustomizerPopover from '../list-views/ColumnCustomizerPopover';
import {
  AVAILABLE_COLUMNS,
  DEFAULT_COLUMN_KEYS,
  getColumnRawValue
} from './ruleColumnConfig';
import {
  RULE_CATEGORIES,
  RULE_ARCHETYPES,
  COMPATIBILITY_ACTIONS,
  extractCompatibilityCharacteristics,
  classifyRule,
  detectProductDomain
} from '../../utils/ruleDescriptors';

const STORAGE_KEY = 'dnext_rules_visible_columns';

export default function RulesListView({
  rules = [],
  selectedCategory = 'all',
  onSelectCategory,
  onOpenDetail,
  onCreateRule,
  onDeleteRule,
  onRefresh,
  isRefreshing = false
}) {
  // ── Classification Filter States ──
  const [selectedArchetype, setSelectedArchetype] = useState('all');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedContext, setSelectedContext] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grouped'
  const [collapsedGroups, setCollapsedGroups] = useState({});

  // ── Column Configuration State (persisted in localStorage) ──
  const {
    visibleColumnKeys,
    visibleColumns,
    toggleColumn,
    moveColumn,
    reorderColumns,
    selectAll,
    deselectAll,
    toggleSelectAll,
    resetToDefaults,
    isCustomizerOpen,
    setIsCustomizerOpen,
    customizerRef
  } = useColumnConfig({
    storageKey: STORAGE_KEY,
    availableColumns: AVAILABLE_COLUMNS,
    defaultColumnKeys: DEFAULT_COLUMN_KEYS
  });

  // Calculate Archetype Counts
  const archetypeCounts = useMemo(() => {
    const counts = { all: rules.length };
    RULE_ARCHETYPES.forEach(a => { counts[a.id] = 0; });
    rules.forEach(r => {
      const arch = classifyRule(r);
      counts[arch.id] = (counts[arch.id] || 0) + 1;
    });
    return counts;
  }, [rules]);

  // Calculate Product Domain Counts
  const domainCounts = useMemo(() => {
    const counts = { all: rules.length };
    ['DSL', 'Cable', 'Fiber / GPON', 'Mobile', 'Hardware'].forEach(d => { counts[d] = 0; });
    rules.forEach(r => {
      const dom = detectProductDomain(r);
      counts[dom] = (counts[dom] || 0) + 1;
    });
    return counts;
  }, [rules]);

  // Multi-tier pre-filtered rules
  const preFilteredRules = useMemo(() => {
    return rules.filter(r => {
      // 1. TMF category filter
      if (selectedCategory !== 'all') {
        if (!Array.isArray(r.category) || !r.category.includes(selectedCategory)) return false;
      }
      // 2. Business Archetype filter
      if (selectedArchetype !== 'all') {
        const arch = classifyRule(r);
        if (arch.id !== selectedArchetype) return false;
      }
      // 3. Product Domain filter
      if (selectedDomain !== 'all') {
        const dom = detectProductDomain(r);
        if (dom !== selectedDomain) return false;
      }
      // 4. Process Context filter
      if (selectedContext !== 'all') {
        const chars = extractCompatibilityCharacteristics(r);
        if (!chars.process_contexts.includes(selectedContext)) return false;
      }
      return true;
    });
  }, [rules, selectedCategory, selectedArchetype, selectedDomain, selectedContext]);

  // Wrap items in pseudo-groups for useTableFilterSort
  const ruleGroups = useMemo(() => {
    return preFilteredRules.map(r => ({
      groupKey: r.id,
      latestItem: r,
      previousVersions: []
    }));
  }, [preFilteredRules]);

  const {
    showFilterRow,
    setShowFilterRow,
    sortConfig,
    handleSort,
    clearSort,
    columnFilters,
    handleFilterChange,
    clearAllFilters,
    activeFilterEntries: rawFilterEntries,
    distinctOptionsMap,
    processedGroups
  } = useTableFilterSort({
    groups: ruleGroups,
    availableColumns: AVAILABLE_COLUMNS,
    visibleColumns,
    getColumnRawValue
  });

  const activeFilterEntries = useMemo(() => {
    return rawFilterEntries.map(([k, v]) => ({
      key: k,
      label: AVAILABLE_COLUMNS.find(c => c.key === k)?.label || k,
      val: v
    }));
  }, [rawFilterEntries]);

  // Cell Content Renderer
  const renderCellContent = (colKey, item) => {
    const chars = extractCompatibilityCharacteristics(item);

    switch (colKey) {
      case 'id':
        return (
          <code style={{
            fontSize: '12px',
            fontFamily: 'var(--ds-font-mono)',
            fontWeight: '700',
            color: 'var(--ds-brand)',
            background: 'rgba(230,0,0,0.06)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {item.id}
          </code>
        );

      case 'archetype': {
        const arch = classifyRule(item);
        const iconChar = arch.icon === 'shield' ? '🛡️' :
          arch.icon === 'bag' ? '📦' :
          arch.icon === 'tag' ? '🎁' :
          arch.icon === 'lock' ? '🔒' :
          arch.icon === 'cpu' ? '⚡' :
          arch.icon === 'user' ? '👤' :
          arch.icon === 'dollar' ? '💰' : '🧭';

        return (
          <span
            title={arch.description}
            style={{
              fontSize: '11px',
              fontWeight: '700',
              color: arch.color,
              background: arch.bg,
              border: `1px solid ${arch.border}`,
              padding: '2px 8px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{iconChar}</span>
            <span>{arch.shortLabel}</span>
          </span>
        );
      }

      case 'domain': {
        const dom = detectProductDomain(item);
        return (
          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            color: 'var(--ds-text)',
            background: 'var(--ds-surface)',
            border: '1px solid var(--ds-border)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {dom}
          </span>
        );
      }

      case 'name':
        return (
          <div style={{ fontWeight: '600', color: C.text, fontSize: '13px' }}>
            {item.name || '-'}
          </div>
        );

      case 'category': {
        const cat = Array.isArray(item.category) ? item.category[0] : item.category;
        return (
          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            color: 'var(--ds-spec)',
            background: 'rgba(124,58,237,0.08)',
            padding: '2px 7px',
            borderRadius: '4px'
          }}>
            {cat || '-'}
          </span>
        );
      }

      case 'ruleType':
        return (
          <span style={{
            fontSize: '11px',
            fontWeight: '800',
            color: 'var(--ds-brand-dark)',
            background: 'rgba(230,0,0,0.06)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'var(--ds-font-mono)'
          }}>
            {item.ruleType || 'FORALL'}
          </span>
        );

      case 'operationValue': {
        const act = COMPATIBILITY_ACTIONS.find(a => a.id === chars.operation_value) || {
          label: chars.operation_value || 'Allowed',
          color: 'var(--ds-ok)',
          bg: 'rgba(16,185,129,0.1)',
          border: 'rgba(16,185,129,0.3)'
        };
        return (
          <span style={{
            fontSize: '11px',
            fontWeight: '700',
            color: act.color,
            background: act.bg,
            border: `1px solid ${act.border}`,
            padding: '2px 8px',
            borderRadius: '4px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>●</span>
            <span>{act.label}</span>
          </span>
        );
      }

      case 'status': {
        const isAct = item.status === 'active';
        return (
          <span style={{
            fontSize: '11px',
            fontWeight: '700',
            color: isAct ? 'var(--ds-ok)' : 'var(--ds-warn)',
            background: isAct ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
            border: `1px solid ${isAct ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {(item.status || 'draft').toUpperCase()}
          </span>
        );
      }

      case 'stateCategory':
        return (
          <span style={{
            fontSize: '11px',
            color: C.muted,
            background: 'var(--ds-surface-2)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {item.stateCategory || 'Initial'}
          </span>
        );

      case 'effectiveDate':
        return (
          <span style={{ fontSize: '12px', color: C.text, fontFamily: 'var(--ds-font-mono)' }}>
            {chars.effective_date || '-'}
          </span>
        );

      case 'priority':
        return (
          <span style={{
            fontSize: '11px',
            fontWeight: '700',
            color: 'var(--ds-text)',
            background: 'var(--ds-surface-2)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            P{chars.priority}
          </span>
        );

      case 'operationType':
        return (
          <span style={{ fontSize: '11px', color: C.muted }}>
            {chars.operation_type || '-'}
          </span>
        );

      case 'channels':
        return (
          <span style={{ fontSize: '12px', color: C.text }}>
            {chars.channels || '*'}
          </span>
        );

      case 'processContexts':
        return (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {chars.process_contexts.map(ctx => (
              <span key={ctx} style={{
                fontSize: '10px',
                fontWeight: '600',
                color: 'var(--ds-text)',
                background: 'var(--ds-surface-2)',
                border: `1px solid ${C.border}`,
                padding: '1px 5px',
                borderRadius: '3px'
              }}>
                {ctx}
              </span>
            ))}
          </div>
        );

      case 'description':
        return (
          <span style={{ fontSize: '12px', color: C.muted }}>
            {chars.description || '-'}
          </span>
        );

      default:
        return item[colKey] ? String(item[colKey]) : '-';
    }
  };

  // Grouped Rules Structure for 'grouped' viewMode
  const groupedRules = useMemo(() => {
    if (viewMode !== 'grouped') return [];
    const groups = [];
    RULE_ARCHETYPES.forEach(arch => {
      const itemsInArch = processedGroups.filter(g => classifyRule(g.latestItem).id === arch.id);
      if (itemsInArch.length > 0) {
        groups.push({
          archetype: arch,
          items: itemsInArch
        });
      }
    });
    return groups;
  }, [viewMode, processedGroups]);

  const toggleGroupCollapse = (archId) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [archId]: !prev[archId]
    }));
  };

  return (
    <div style={{
      background: '#ffffff',
      border: `1px solid ${C.border}`,
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      {/* ── Tier 1: Primary Business Archetype Classification Tabs ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: `1px solid ${C.border}`,
        background: '#ffffff',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {/* Left: Archetype Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
          {/* All Rules Tab */}
          <button
            type="button"
            onClick={() => setSelectedArchetype('all')}
            style={{
              background: selectedArchetype === 'all' ? 'var(--ds-brand)' : 'var(--ds-surface-subtle)',
              border: `1px solid ${selectedArchetype === 'all' ? 'var(--ds-brand-dark)' : C.border}`,
              color: selectedArchetype === 'all' ? '#ffffff' : C.text,
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>All Purposes</span>
            <span style={{
              background: selectedArchetype === 'all' ? 'rgba(255,255,255,0.25)' : 'var(--ds-surface-2)',
              color: selectedArchetype === 'all' ? '#ffffff' : C.muted,
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: '10px'
            }}>
              {rules.length}
            </span>
          </button>

          {/* Individual Business Archetype Pills */}
          {RULE_ARCHETYPES.map(arch => {
            const count = archetypeCounts[arch.id] || 0;
            if (count === 0 && selectedArchetype !== arch.id) return null;
            const isSel = selectedArchetype === arch.id;
            const iconChar = arch.icon === 'shield' ? '🛡️' :
              arch.icon === 'bag' ? '📦' :
              arch.icon === 'tag' ? '🎁' :
              arch.icon === 'lock' ? '🔒' :
              arch.icon === 'cpu' ? '⚡' :
              arch.icon === 'user' ? '👤' :
              arch.icon === 'dollar' ? '💰' : '🧭';

            return (
              <button
                key={arch.id}
                type="button"
                onClick={() => setSelectedArchetype(arch.id)}
                title={arch.description}
                style={{
                  background: isSel ? arch.color : '#ffffff',
                  border: `1px solid ${isSel ? arch.color : C.border}`,
                  color: isSel ? '#ffffff' : C.text,
                  padding: '5px 11px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: isSel ? '700' : '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{iconChar}</span>
                <span>{arch.shortLabel}</span>
                <span style={{
                  background: isSel ? 'rgba(255,255,255,0.25)' : arch.bg,
                  color: isSel ? '#ffffff' : arch.color,
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  border: isSel ? 'none' : `1px solid ${arch.border}`
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: New Rule Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={onCreateRule}
            style={{
              background: 'var(--ds-brand)',
              border: '1px solid var(--ds-brand-dark)',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 3px rgba(230,0,0,0.2)'
            }}
          >
            <span>+</span>
            <span>New Basic Rule</span>
          </button>
        </div>
      </div>

      {/* ── Tier 2: Secondary Quick-Facet Chips (Domain & Context) ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 14px',
        background: 'var(--ds-surface-subtle)',
        borderBottom: `1px solid ${C.border}`,
        fontSize: '12px',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        {/* Left: Domain & Context Facet Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {/* Domain Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: C.muted, textTransform: 'uppercase' }}>Line:</span>
            {['all', 'DSL', 'Cable', 'Fiber / GPON', 'Mobile', 'Hardware'].map(dom => {
              const count = dom === 'all' ? rules.length : (domainCounts[dom] || 0);
              const isSel = selectedDomain === dom;
              return (
                <button
                  key={dom}
                  type="button"
                  onClick={() => setSelectedDomain(dom)}
                  style={{
                    background: isSel ? 'var(--ds-text)' : '#ffffff',
                    color: isSel ? '#ffffff' : C.text,
                    border: `1px solid ${isSel ? 'var(--ds-text)' : C.border}`,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: isSel ? '700' : '500',
                    cursor: 'pointer'
                  }}
                >
                  {dom === 'all' ? 'All' : dom} ({count})
                </button>
              );
            })}
          </div>

          {/* Context Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: C.muted, textTransform: 'uppercase' }}>Context:</span>
            {['all', 'ACQ', 'ILSBLU', 'MOVBLU', 'MIGCOC'].map(ctx => {
              const isSel = selectedContext === ctx;
              return (
                <button
                  key={ctx}
                  type="button"
                  onClick={() => setSelectedContext(ctx)}
                  style={{
                    background: isSel ? 'var(--ds-spec)' : '#ffffff',
                    color: isSel ? '#ffffff' : C.text,
                    border: `1px solid ${isSel ? 'var(--ds-spec)' : C.border}`,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: isSel ? '700' : '500',
                    cursor: 'pointer'
                  }}
                >
                  {ctx === 'all' ? 'All' : ctx}
                </button>
              );
            })}
          </div>

          {/* Reset All Quick Filters */}
          {(selectedArchetype !== 'all' || selectedDomain !== 'all' || selectedContext !== 'all' || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSelectedArchetype('all');
                setSelectedDomain('all');
                setSelectedContext('all');
                onSelectCategory && onSelectCategory('all');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ds-brand)',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Right: View Mode Toggle (Table vs Grouped) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: C.muted }}>View:</span>
          <div style={{ display: 'inline-flex', background: '#ffffff', borderRadius: '5px', padding: '1px', border: `1px solid ${C.border}` }}>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? 'var(--ds-surface-2)' : 'transparent',
                border: 'none',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: viewMode === 'table' ? '700' : '500',
                color: C.text,
                cursor: 'pointer'
              }}
            >
              Flat Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              style={{
                background: viewMode === 'grouped' ? 'var(--ds-surface-2)' : 'transparent',
                border: 'none',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: viewMode === 'grouped' ? '700' : '500',
                color: C.text,
                cursor: 'pointer'
              }}
            >
              Grouped by Purpose
            </button>
          </div>
        </div>
      </div>

      {/* ── Toolbar: Filter Columns & Columns Popover ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        background: '#ffffff',
        borderBottom: `1px solid ${C.border}`,
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {/* Left: Filter Columns & Columns Popover */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Toggle Column Filter Inputs */}
          <button
            type="button"
            onClick={() => setShowFilterRow(prev => !prev)}
            style={{
              background: showFilterRow ? 'rgba(230,0,0,0.08)' : '#ffffff',
              border: `1px solid ${showFilterRow ? 'var(--ds-brand)' : C.border}`,
              color: showFilterRow ? 'var(--ds-brand)' : C.text,
              padding: '4px 10px',
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

          {/* Configure Columns Popover Toggle */}
          <ColumnCustomizerPopover
            entityLabel="Compatibility Rules"
            availableColumns={AVAILABLE_COLUMNS}
            visibleColumns={visibleColumns}
            visibleColumnKeys={visibleColumnKeys}
            isOpen={isCustomizerOpen}
            onToggleOpen={() => setIsCustomizerOpen(prev => !prev)}
            customizerRef={customizerRef}
            onToggleColumn={toggleColumn}
            onMoveColumn={moveColumn}
            onReorderColumns={reorderColumns}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
            onToggleSelectAll={toggleSelectAll}
            onResetDefaults={resetToDefaults}
          />
        </div>

        {/* Right: Active Sort Reset & Refresh Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {sortConfig.key && (
            <button
              type="button"
              onClick={clearSort}
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
              title="Reset table sort"
            >
              <span>✕</span>
              <span>Sorted by {AVAILABLE_COLUMNS.find(c => c.key === sortConfig.key)?.label || sortConfig.key} ({sortConfig.direction.toUpperCase()})</span>
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              style={{
                background: '#ffffff',
                border: `1px solid ${C.border}`,
                color: C.text,
                padding: '4px 10px',
                borderRadius: '5px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ display: 'inline-block', animation: isRefreshing ? 'spin 1s infinite linear' : 'none' }}>
                ⟳
              </span>
              <span>{isRefreshing ? 'Refreshing…' : 'Refresh Rules'}</span>
            </button>
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

      {/* ── Table Content ── */}
      {viewMode === 'table' ? (
        <table className="ds-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {visibleColumns.map(col => {
                const isSorted = sortConfig.key === col.key;
                const isFiltered = Boolean(columnFilters[col.key]);

                return (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    style={{
                      padding: '10px 14px',
                      cursor: col.sortable ? 'pointer' : 'default',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                      width: col.width,
                      minWidth: col.minWidth,
                      background: isSorted ? 'rgba(230,0,0,0.03)' : 'transparent',
                      color: isSorted || isFiltered ? 'var(--ds-brand)' : C.muted
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{col.label}</span>
                      {col.sortable && (
                        <span style={{ fontSize: '10px', opacity: isSorted ? 1 : 0.4 }}>
                          {isSorted ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
              <th style={{ width: '80px', padding: '10px 14px', textAlign: 'right' }}>Actions</th>
            </tr>

            {/* Filter Inputs Row */}
            {showFilterRow && (
              <tr style={{ background: 'var(--ds-surface-subtle)', borderBottom: `1px solid ${C.border}` }}>
                {visibleColumns.map(col => {
                  const filterVal = columnFilters[col.key] || '';
                  const distinctOptions = distinctOptionsMap[col.key] || [];

                  return (
                    <th key={col.key} style={{ padding: '6px 10px' }}>
                      {col.filterType === 'select' && distinctOptions.length > 0 ? (
                        <select
                          value={filterVal}
                          onChange={e => handleFilterChange(col.key, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '3px 6px',
                            fontSize: '11px',
                            borderRadius: '4px',
                            border: `1px solid ${filterVal ? 'var(--ds-brand)' : C.border}`,
                            background: '#ffffff',
                            color: filterVal ? 'var(--ds-brand)' : C.text
                          }}
                        >
                          <option value="">All</option>
                          {distinctOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Filter…"
                          value={filterVal}
                          onChange={e => handleFilterChange(col.key, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '3px 6px',
                            fontSize: '11px',
                            borderRadius: '4px',
                            border: `1px solid ${filterVal ? 'var(--ds-brand)' : C.border}`,
                            background: '#ffffff',
                            color: filterVal ? 'var(--ds-brand)' : C.text,
                            boxSizing: 'border-box'
                          }}
                        />
                      )}
                    </th>
                  );
                })}
                <th style={{ padding: '6px 10px', textAlign: 'right' }}>
                  {activeFilterEntries.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--ds-brand)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        padding: 0
                      }}
                      title="Clear filters"
                    >
                      Clear
                    </button>
                  )}
                </th>
              </tr>
            )}
          </thead>

          <tbody>
            {processedGroups.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} style={{ textAlign: 'center', padding: '40px 14px', color: C.muted }}>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>No matching rules found</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>Try adjusting your filters, archetype selection, or search query.</div>
                </td>
              </tr>
            ) : (
              processedGroups.map(group => {
                const item = group.latestItem;
                return (
                  <tr
                    key={item.id}
                    onClick={() => onOpenDetail && onOpenDetail(item)}
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--ds-surface-subtle)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {visibleColumns.map(col => (
                      <td key={col.key} style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        {renderCellContent(col.key, item)}
                      </td>
                    ))}

                    {/* Row Actions */}
                    <td style={{ padding: '10px 14px', textAlign: 'right', verticalAlign: 'middle' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onOpenDetail && onOpenDetail(item)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--ds-brand)',
                            cursor: 'pointer',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                          title="Open rule details"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete rule ${item.id}?`)) {
                              onDeleteRule && onDeleteRule(item.id);
                            }
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: C.muted,
                            cursor: 'pointer',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}
                          title="Delete rule"
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--ds-brand)'}
                          onMouseLeave={e => e.currentTarget.style.color = C.muted}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      ) : (
        /* ── Grouped Accordion View Mode ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px' }}>
          {groupedRules.map(({ archetype: arch, items }) => {
            const isCollapsed = Boolean(collapsedGroups[arch.id]);
            const iconChar = arch.icon === 'shield' ? '🛡️' :
              arch.icon === 'bag' ? '📦' :
              arch.icon === 'tag' ? '🎁' :
              arch.icon === 'lock' ? '🔒' :
              arch.icon === 'cpu' ? '⚡' :
              arch.icon === 'user' ? '👤' :
              arch.icon === 'dollar' ? '💰' : '🧭';

            return (
              <div
                key={arch.id}
                style={{
                  border: `1px solid ${arch.border}`,
                  borderRadius: '8px',
                  background: '#ffffff',
                  overflow: 'hidden'
                }}
              >
                {/* Accordion Group Header */}
                <div
                  onClick={() => toggleGroupCollapse(arch.id)}
                  style={{
                    padding: '10px 16px',
                    background: arch.bg,
                    borderBottom: isCollapsed ? 'none' : `1px solid ${arch.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>{iconChar}</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: arch.color }}>
                        {arch.label}
                      </div>
                      <div style={{ fontSize: '11px', color: C.muted, marginTop: '1px' }}>
                        {arch.description}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      background: '#ffffff',
                      color: arch.color,
                      fontWeight: '800',
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: `1px solid ${arch.border}`
                    }}>
                      {items.length} Rules
                    </span>
                    <span style={{ fontSize: '12px', color: C.muted }}>
                      {isCollapsed ? '▼' : '▲'}
                    </span>
                  </div>
                </div>

                {/* Group Rule Rows */}
                {!isCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {items.map(group => {
                      const item = group.latestItem;
                      const chars = extractCompatibilityCharacteristics(item);

                      return (
                        <div
                          key={item.id}
                          onClick={() => onOpenDetail && onOpenDetail(item)}
                          style={{
                            padding: '10px 16px',
                            borderBottom: `1px solid ${C.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            cursor: 'pointer',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--ds-surface-subtle)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                            <code style={{
                              fontSize: '12px',
                              fontFamily: 'var(--ds-font-mono)',
                              fontWeight: '700',
                              color: 'var(--ds-brand)',
                              background: 'rgba(230,0,0,0.06)',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {item.id}
                            </code>
                            <div style={{ fontWeight: '600', fontSize: '13px', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.name}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              color: 'var(--ds-text)',
                              background: 'var(--ds-surface)',
                              border: '1px solid var(--ds-border)',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {detectProductDomain(item)}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              color: chars.operation_value === 'Allowed' ? 'var(--ds-ok)' :
                                chars.operation_value === 'Defaulted-Obligated' ? 'var(--ds-brand)' : 'var(--ds-info)',
                              background: 'var(--ds-surface-2)',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {chars.operation_value}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenDetail && onOpenDetail(item);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--ds-brand)',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                padding: '2px 6px'
                              }}
                            >
                              Edit →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Table Footer ── */}
      <div style={{
        padding: '8px 14px',
        background: 'var(--ds-surface-subtle)',
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: C.muted
      }}>
        <div>
          Showing <strong>{processedGroups.length}</strong> of <strong>{rules.length}</strong> rules
          {selectedArchetype !== 'all' && (
            <span> in <strong>{RULE_ARCHETYPES.find(a => a.id === selectedArchetype)?.shortLabel}</strong></span>
          )}
        </div>
        <div style={{ fontSize: '11px' }}>
          TMF620 Rule Engine • v1.4.2
        </div>
      </div>
    </div>
  );
}
