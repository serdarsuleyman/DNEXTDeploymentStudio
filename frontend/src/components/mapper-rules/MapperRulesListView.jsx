import React, { useMemo, useState } from 'react';
import Icon from '../ui/Icon';
import { C } from '../../styles/theme';
import { useColumnConfig } from '../../hooks/useColumnConfig';
import ColumnCustomizerPopover from '../list-views/ColumnCustomizerPopover';
import {
  AVAILABLE_MAPPER_COLUMNS,
  DEFAULT_MAPPER_COLUMN_KEYS,
  getMapperColumnRawValue
} from './mapperRuleColumnConfig';

const STORAGE_KEY = 'dnext_mapper_rules_visible_columns';

const KNOWN_MAPPER_TYPES = [
  'internet', 'voice', 'hardware', 'sales_package', 'accesses',
  'safetyPackage', 'SecureNet', 'SuperWlan', 'TV', 'directoryEntry', 'winback'
];

// Maps column keys to server-side query filter keys
const COL_TO_FILTER_KEY = {
  id: 'ruleId',
  mapperType: 'mapperType',
  direction: 'direction',
  sourceComponentId: 'sourceComponentId',
  attributeCode: 'attributeCode',
  attributeValue: 'attributeValue',
  attributeAdditionalValue: 'attributeAdditionalValue',
  basketAction: 'basketAction',
  attributeAction: 'attributeAction',
  processContexts: 'processContext',
  status: 'status',
  syncState: 'syncState'
};

export default function MapperRulesListView({
  rules = [],
  totalCount = 0,
  facets = {},
  loading = false,
  filters,
  onFilterChange,
  sortBy,
  sortDir,
  onSortChange,
  pageSize,
  pageIndex,
  onPageSizeChange,
  onPageChange,
  onOpenDetail,
  onCreateRule,
  onPushRule,
  onLiveSkuQuery,
  liveQuerying = false,
  syncStatus = {},
  onSyncAll,
  onSyncFiltered
}) {
  const [showFilterRow, setShowFilterRow] = useState(false);

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
    availableColumns: AVAILABLE_MAPPER_COLUMNS,
    defaultColumnKeys: DEFAULT_MAPPER_COLUMN_KEYS
  });

  const typeCountMap = {};
  (facets.byMapperType || []).forEach(r => {
    if (r.key) typeCountMap[r.key] = r.count;
  });

  const allTypes = Array.from(new Set([
    ...KNOWN_MAPPER_TYPES,
    ...Object.keys(typeCountMap)
  ]));

  const distinctOptionsMap = useMemo(() => ({
    mapperType: allTypes,
    direction: ['out', 'in'],
    basketAction: ['keep', 'change', 'add', 'remove'],
    attributeAction: ['add', 'overwrite', 'takeover'],
    status: ['active', 'draft', 'inactive'],
    syncState: ['synced', 'modified', 'new']
  }), [allTypes]);

  const activeColumnFilters = useMemo(() => {
    const entries = [];
    Object.entries(COL_TO_FILTER_KEY).forEach(([colKey, filterKey]) => {
      const val = filters[filterKey];
      if (val && val !== 'all' && String(val).trim() !== '') {
        const colDef = AVAILABLE_MAPPER_COLUMNS.find(c => c.key === colKey);
        entries.push({ colKey, filterKey, label: colDef?.label || colKey, val });
      }
    });
    return entries;
  }, [filters]);

  const handleColumnFilterChange = (colKey, value) => {
    const filterKey = COL_TO_FILTER_KEY[colKey];
    if (!filterKey) return;
    const colDef = AVAILABLE_MAPPER_COLUMNS.find(c => c.key === colKey);
    const defaultVal = colDef?.filterType === 'select' ? 'all' : '';
    onFilterChange({ [filterKey]: value ? value : defaultVal });
  };

  const clearAllColumnFilters = () => {
    const resetPatch = {};
    Object.entries(COL_TO_FILTER_KEY).forEach(([colKey, filterKey]) => {
      const colDef = AVAILABLE_MAPPER_COLUMNS.find(c => c.key === colKey);
      resetPatch[filterKey] = colDef?.filterType === 'select' ? 'all' : '';
    });
    onFilterChange(resetPatch);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const renderCellContent = (col, rule) => {
    const rawVal = getMapperColumnRawValue(rule, col);
    const m = rule._meta || {};

    switch (col.key) {
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
            {rawVal}
          </code>
        );

      case 'mapperType':
        return (
          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#0e7490',
            background: '#ecfeff',
            border: '1px solid #a5f3fc',
            padding: '2px 6px',
            borderRadius: '4px',
            whiteSpace: 'nowrap'
          }}>
            {rawVal || '-'}
          </span>
        );

      case 'direction': {
        const isOut = rawVal === 'out';
        return (
          <span style={{
            fontSize: '10.5px',
            fontWeight: '800',
            textTransform: 'uppercase',
            color: isOut ? '#1d4ed8' : '#7e22ce',
            background: isOut ? '#eff6ff' : '#faf5ff',
            border: `1px solid ${isOut ? '#bfdbfe' : '#e9d5ff'}`,
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {rawVal || '-'}
          </span>
        );
      }

      case 'sourceComponentId':
        return (
          <span style={{
            fontSize: '11.5px',
            fontFamily: 'var(--ds-font-mono)',
            fontWeight: '600',
            color: C.text,
            background: rawVal ? 'var(--ds-surface-2)' : 'transparent',
            padding: rawVal ? '2px 6px' : '0',
            borderRadius: '4px'
          }}>
            {rawVal || '-'}
          </span>
        );

      case 'attributeCode':
        return <span style={{ fontWeight: '600', color: C.text }}>{rawVal || '-'}</span>;

      case 'attributeValue':
        return (
          <span
            title={rawVal}
            style={{
              fontFamily: 'var(--ds-font-mono)',
              fontSize: '11.5px',
              color: C.text,
              display: 'inline-block',
              maxWidth: '160px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {rawVal || '-'}
          </span>
        );

      case 'attributeAdditionalValue':
        return (
          <span
            title={rawVal}
            style={{
              fontFamily: 'var(--ds-font-mono)',
              fontSize: '11px',
              color: C.muted,
              display: 'inline-block',
              maxWidth: '240px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {rawVal || '-'}
          </span>
        );

      case 'skuCount':
        return (
          <span style={{
            fontSize: '11px',
            fontWeight: '700',
            background: '#f1f5f9',
            color: '#334155',
            padding: '2px 7px',
            borderRadius: '10px'
          }}>
            {rawVal || '0'}
          </span>
        );

      case 'condition': {
        const condText = rawVal === 'true' ? 'Catch-all (true)' : rawVal;
        return (
          <span
            title={condText}
            style={{
              display: 'inline-block',
              maxWidth: '210px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '11px',
              fontFamily: 'var(--ds-font-mono)',
              color: C.muted
            }}
          >
            <strong style={{ color: '#0f172a', marginRight: '4px' }}>{rule.ruleType || 'FORALL'}</strong>
            {condText}
          </span>
        );
      }

      case 'status': {
        const isDirty = m.syncState && m.syncState !== 'synced';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
            <span style={{
              fontSize: '10.5px',
              fontWeight: '700',
              color: rawVal === 'active' ? '#15803d' : '#b45309',
              background: rawVal === 'active' ? '#dcfce7' : '#fef3c7',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              {rawVal.toUpperCase()}
            </span>
            {isDirty && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onPushRule(rule);
                }}
                title="Push local changes to DNEXT Rule Engine"
                style={{
                  fontSize: '10.5px',
                  fontWeight: '700',
                  color: '#ffffff',
                  background: '#0284c7',
                  border: 'none',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Push ({m.syncState})
              </button>
            )}
          </div>
        );
      }

      default:
        return <span style={{ fontSize: '11.5px', color: C.text }}>{rawVal || '-'}</span>;
    }
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
      {/* Tier 1: Functional Area (mapper_type) Tabs + New Mapper Rule */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: `1px solid ${C.border}`,
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onFilterChange({ mapperType: 'all' })}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: filters.mapperType === 'all' ? '700' : '600',
              borderRadius: '16px',
              border: `1px solid ${filters.mapperType === 'all' ? 'var(--ds-brand)' : C.border}`,
              background: filters.mapperType === 'all' ? 'rgba(230,0,0,0.08)' : '#ffffff',
              color: filters.mapperType === 'all' ? 'var(--ds-brand)' : C.text,
              cursor: 'pointer'
            }}
          >
            All ({(facets.totalCached || 0).toLocaleString()})
          </button>
          {allTypes.map(mt => {
            const cnt = typeCountMap[mt] || 0;
            const active = filters.mapperType === mt;
            return (
              <button
                key={mt}
                type="button"
                onClick={() => onFilterChange({ mapperType: mt })}
                style={{
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  fontWeight: active ? '700' : '500',
                  borderRadius: '16px',
                  border: `1px solid ${active ? '#0891b2' : C.border}`,
                  background: active ? '#ecfeff' : '#ffffff',
                  color: active ? '#0e7490' : (cnt > 0 ? C.text : C.muted),
                  cursor: 'pointer',
                  opacity: cnt > 0 || active ? 1 : 0.65
                }}
              >
                {mt} {cnt > 0 ? `(${cnt.toLocaleString()})` : ''}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onCreateRule}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#ffffff',
            background: 'var(--ds-brand)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          <Icon name="plus" size={14} />
          New Mapper Rule
        </button>
      </div>

      {/* Tier 2: Global Search & SKU Reverse-Lookup + Live SKU Query */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 14px',
        background: 'var(--ds-surface-subtle)',
        borderBottom: `1px solid ${C.border}`,
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          value={filters.q}
          onChange={e => onFilterChange({ q: e.target.value })}
          placeholder="Search ID, attribute code, value, path…"
          style={{
            flex: '1 1 240px',
            minWidth: '200px',
            padding: '6px 10px',
            fontSize: '12px',
            border: `1px solid ${C.border}`,
            borderRadius: '6px',
            background: '#ffffff'
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            type="text"
            value={filters.sku}
            onChange={e => onFilterChange({ sku: e.target.value })}
            placeholder="Filter by SKU (e.g. R70.1000000129-24)"
            style={{
              width: '220px',
              padding: '6px 10px',
              fontSize: '12px',
              fontFamily: 'var(--ds-font-mono)',
              border: `1px solid ${C.border}`,
              borderRadius: '6px',
              background: '#ffffff'
            }}
          />
          <button
            type="button"
            onClick={onLiveSkuQuery}
            disabled={liveQuerying}
            title="Query live drule-api directly using SKU & characteristic filters"
            style={{
              padding: '6px 10px',
              fontSize: '11.5px',
              fontWeight: '700',
              color: '#0369a1',
              background: '#e0f2fe',
              border: '1px solid #bae6fd',
              borderRadius: '6px',
              cursor: liveQuerying ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {liveQuerying ? 'Querying…' : 'Live SKU Query'}
          </button>
        </div>
      </div>

      {/* Tier 3: Catalog-Aligned Toolbar (Filter Columns & Columns Popover on Left, Sync Mapper Rules on Right) */}
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
            title={showFilterRow ? 'Hide column filters' : 'Show column filter inputs'}
          >
            <span><Icon name="search" size={14} /></span>
            <span>{showFilterRow ? 'Hide Filters' : 'Filter Columns'}</span>
            {activeColumnFilters.length > 0 && (
              <span style={{ background: 'var(--ds-brand)', color: '#fff', fontSize: '11px', padding: '1px 5px', borderRadius: '10px', fontWeight: '700' }}>
                {activeColumnFilters.length}
              </span>
            )}
          </button>

          <ColumnCustomizerPopover
            entityLabel="Mapper Rules"
            availableColumns={AVAILABLE_MAPPER_COLUMNS}
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

        {/* Right: Sort Reset + Sync Mapper Rules */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {sortBy && sortBy !== 'id' && (
            <button
              type="button"
              onClick={() => onSortChange(null)}
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
              <span>Sorted by {AVAILABLE_MAPPER_COLUMNS.find(c => c.key === sortBy)?.label || sortBy} ({sortDir.toUpperCase()})</span>
            </button>
          )}

          {(filters.mapperType !== 'all' || filters.direction !== 'all') && onSyncFiltered && (
            <button
              type="button"
              onClick={onSyncFiltered}
              disabled={syncStatus.inProgress}
              style={{
                background: '#ecfeff',
                border: '1px solid #a5f3fc',
                color: '#0891b2',
                padding: '4px 10px',
                borderRadius: '5px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: syncStatus.inProgress ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Sync only the currently selected functional area / direction"
            >
              <Icon name="refresh" size={13} />
              <span>Sync Filtered Slice</span>
            </button>
          )}

          <button
            type="button"
            onClick={onSyncAll}
            disabled={syncStatus.inProgress}
            style={{
              background: '#ffffff',
              border: `1px solid ${C.border}`,
              color: C.text,
              padding: '4px 10px',
              borderRadius: '5px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: syncStatus.inProgress ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease'
            }}
            title="Run dedicated background sync for all category=mapperRules rules"
          >
            <Icon name="refresh" size={13} style={{ animation: syncStatus.inProgress ? 'spin 1s infinite linear' : 'none' }} />
            <span>
              {syncStatus.inProgress
                ? `Syncing (${(syncStatus.fetched || 0).toLocaleString()} / ${syncStatus.total ? syncStatus.total.toLocaleString() : '…'})`
                : 'Sync Mapper Rules'}
            </span>
          </button>
        </div>
      </div>

      {/* Active Column Filter Chips Bar */}
      {activeColumnFilters.length > 0 && (
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
          {activeColumnFilters.map(entry => (
            <span
              key={entry.colKey}
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
                onClick={() => handleColumnFilterChange(entry.colKey, null)}
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
            onClick={clearAllColumnFilters}
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

      {/* Empty Cache Onboarding State */}
      {!loading && facets.totalCached === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center', color: C.muted }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: C.text, marginBottom: '6px' }}>
            No Mapper Rules cached yet for this environment
          </div>
          <div style={{ fontSize: '13px', maxWidth: '520px', margin: '0 auto 16px auto' }}>
            Click <strong>Sync Mapper Rules</strong> to fetch ~30K <code>category=mapperRules</code> rules into the dedicated SQLite index,
            or enter a SKU above and click <strong>Live SKU Query</strong> to fetch matching rules immediately.
          </div>
          <button
            type="button"
            onClick={onSyncAll}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '700',
              color: '#ffffff',
              background: '#0f172a',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Sync Mapper Rules
          </button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="ds-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {visibleColumns.map(col => {
                  const isSorted = sortBy === col.key;
                  const filterKey = COL_TO_FILTER_KEY[col.key];
                  const isFiltered = Boolean(filterKey && filters[filterKey] && filters[filterKey] !== 'all');

                  return (
                    <th
                      key={col.key}
                      onClick={() => col.sortable && onSortChange(col.key)}
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
                            {isSorted ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>

              {/* Inline Column Filter Row */}
              {showFilterRow && (
                <tr style={{ background: 'var(--ds-surface-subtle)', borderBottom: `1px solid ${C.border}` }}>
                  {visibleColumns.map(col => {
                    const filterKey = COL_TO_FILTER_KEY[col.key];
                    if (!col.filterable || !filterKey) {
                      return <th key={col.key} style={{ padding: '6px 10px' }} />;
                    }
                    const rawFilter = filters[filterKey] || '';
                    const filterVal = rawFilter === 'all' ? '' : rawFilter;
                    const distinctOptions = distinctOptionsMap[col.key] || [];

                    return (
                      <th key={col.key} style={{ padding: '6px 10px' }}>
                        {col.filterType === 'select' && distinctOptions.length > 0 ? (
                          <select
                            value={filterVal}
                            onChange={e => handleColumnFilterChange(col.key, e.target.value)}
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
                            onChange={e => handleColumnFilterChange(col.key, e.target.value)}
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
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleColumns.length} style={{ padding: '32px', textAlign: 'center', color: C.muted }}>
                    Loading mapper rules…
                  </td>
                </tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} style={{ padding: '32px', textAlign: 'center', color: C.muted }}>
                    No mapper rules match the current filters.
                  </td>
                </tr>
              ) : rules.map(rule => {
                const m = rule._meta || {};
                const isDirty = m.syncState && m.syncState !== 'synced';
                return (
                  <tr
                    key={rule.id}
                    onClick={() => onOpenDetail(rule)}
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                      cursor: 'pointer',
                      background: isDirty ? '#fffbeb' : '#ffffff'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isDirty ? '#fffbeb' : '#ffffff'; }}
                  >
                    {visibleColumns.map(col => (
                      <td key={col.key} style={{ padding: '9px 14px', verticalAlign: 'middle' }}>
                        {renderCellContent(col, rule)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Server-Side Pagination Footer */}
      {totalCount > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderTop: `1px solid ${C.border}`,
          background: '#f8fafc',
          fontSize: '12px',
          color: C.muted
        }}>
          <div>
            Showing <strong>{(pageIndex * pageSize + 1).toLocaleString()}</strong>–<strong>{Math.min((pageIndex + 1) * pageSize, totalCount).toLocaleString()}</strong> of <strong>{totalCount.toLocaleString()}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
              style={{ padding: '4px 6px', fontSize: '12px', border: `1px solid ${C.border}`, borderRadius: '4px', background: '#ffffff' }}
            >
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
            <button
              type="button"
              disabled={pageIndex === 0}
              onClick={() => onPageChange(pageIndex - 1)}
              style={{ padding: '4px 10px', fontSize: '12px', border: `1px solid ${C.border}`, borderRadius: '4px', background: '#ffffff', cursor: pageIndex === 0 ? 'not-allowed' : 'pointer', opacity: pageIndex === 0 ? 0.5 : 1 }}
            >
              Prev
            </button>
            <span>Page <strong>{pageIndex + 1}</strong> / {totalPages.toLocaleString()}</span>
            <button
              type="button"
              disabled={pageIndex + 1 >= totalPages}
              onClick={() => onPageChange(pageIndex + 1)}
              style={{ padding: '4px 10px', fontSize: '12px', border: `1px solid ${C.border}`, borderRadius: '4px', background: '#ffffff', cursor: pageIndex + 1 >= totalPages ? 'not-allowed' : 'pointer', opacity: pageIndex + 1 >= totalPages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
