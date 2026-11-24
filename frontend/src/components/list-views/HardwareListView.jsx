import React, { useMemo } from 'react';
import Icon from '../ui/Icon';
import { SpecLink, VersionCell, LifecyclePill, EntityTypeBadge, CodeList, splitValues } from './cellRenderers';
import { C } from './constants';
import { useColumnConfig } from '../../hooks/useColumnConfig';
import { useTableFilterSort } from '../../hooks/useTableFilterSort';
import ColumnCustomizerPopover from './ColumnCustomizerPopover';
import VersionMenuDropdown from './VersionMenuDropdown';
import {
  AVAILABLE_COLUMNS,
  DEFAULT_COLUMN_KEYS,
  evaluateJsonPath,
  getColumnRawValue
} from './hardwareColumnConfig';

const STORAGE_KEY = 'dnext_hardware_visible_columns';

function migrateHardwareColumns(parsed) {
  const valid = parsed.filter(k => AVAILABLE_COLUMNS.some(c => c.key === k));
  if (valid.length === 0) return parsed;
  return valid;
}

/**
 * Extracts SKU values from a hardware offering item
 */
function extractSkuValues(item) {
  if (!item) return [];
  if (item.sku) {
    return Array.isArray(item.sku) ? item.sku : [String(item.sku).trim()];
  }
  const charUses = item.prodSpecCharValueUse || item.raw?.prodSpecCharValueUse || [];
  for (const c of charUses) {
    const name = (c.name || '').toLowerCase();
    if (name === 'sku' || name === 'hardware_sku' || name === 'material_number') {
      const vals = c.productSpecCharacteristicValue || [];
      const extracted = vals.map(v => v.value).filter(Boolean);
      if (extracted.length > 0) return extracted;
    }
  }
  return [];
}

/**
 * HardwareListView
 * Dedicated, configurable list view component specifically tailored for Hardware Product Offerings
 * (productSpecification_FN_Hardware).
 *
 * Configurable Features:
 * - Dynamic Column Mappings: Configure visible columns via "Columns" popover.
 * - JSONPath Support: Custom fields like SKU, Product Type, Package Type, Family extracted declaratively.
 * - Sortable Columns: Click column headers to sort Ascending (▲), Descending (▼), or Reset.
 * - Filterable Columns: Inline filter row and active filter pills to filter by any field value.
 * - Version Expansion: Interactive click on the Version column expands all versions in a tree hierarchy.
 * - LocalStorage Persistence: Preserves user column choices across browser sessions.
 */
export default function HardwareListView({
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
    defaultColumnKeys: DEFAULT_COLUMN_KEYS,
    migrateSavedKeys: migrateHardwareColumns
  });

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
    groups,
    availableColumns: AVAILABLE_COLUMNS,
    visibleColumns,
    getColumnRawValue
  });

  // ── Active Filters List for Pill Display ──
  const activeFilterEntries = useMemo(() => {
    return rawFilterEntries.map(([k, v]) => ({
      key: k,
      label: AVAILABLE_COLUMNS.find(c => c.key === k)?.label || k,
      val: v
    }));
  }, [rawFilterEntries]);

  // ── Cell Rendering ──
  const renderCellContent = (colKey, item, isParent, group) => {
    const isBundle = Boolean(item.isBundle || item.raw?.isBundle);
    const hasMultipleVersions = group.previousVersions && group.previousVersions.length > 0;
    const isExpanded = expandedGroups.has(group.groupKey);

    switch (colKey) {
      case 'id':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <EntityTypeBadge
              type={isBundle ? 'bundle' : 'hardware'}
              label={isBundle ? 'Bundle HW' : 'Hardware'}
              icon={isBundle ? 'layers' : 'cpu'}
              isChild={!isParent}
            />
            <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: isParent ? '12px' : '11px', color: isParent ? C.text : 'var(--ds-text-2)', fontWeight: '600' }}>
              {item.id}
            </span>
          </div>
        );

      case 'name':
        return (
          <div>
            <div style={{ color: isParent ? C.text : 'var(--ds-text-2)', fontSize: isParent ? '13px' : '12px', fontWeight: isParent ? '600' : 'normal' }}>
              {item.name || '-'}
            </div>
            {isParent && item.description && (
              <div style={{ fontSize: '11px', color: 'var(--ds-text-3)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '360px' }}>
                {item.description}
              </div>
            )}
          </div>
        );

      case 'spec': {
        const spec = item.productSpecification || item.raw?.productSpecification;
        return <SpecLink spec={spec} onFilter={onSpecFilter} compact={!isParent} />;
      }

      case 'sku': {
        const skuVals = extractSkuValues(item);
        return skuVals.length > 0 ? (
          <CodeList label="SKU" values={skuVals} compact={!isParent} />
        ) : (
          <span className="ds-cell-empty">–</span>
        );
      }

      case 'version':
        return (
          <VersionCell
            version={item.version}
            totalVersions={hasMultipleVersions ? (group.totalVersions || group.previousVersions.length + 1) : 1}
            isExpanded={Boolean(isExpanded)}
            onToggle={() => onToggleExpand && onToggleExpand(group.groupKey)}
            isParent={isParent}
          />
        );

      case 'lifecycle':
        return <LifecyclePill status={item.lifecycleStatus} compact={!isParent} />;

      default: {
        const colDef = AVAILABLE_COLUMNS.find(c => c.key === colKey);
        const rawVal = evaluateJsonPath(item, colDef?.jsonPath || `$.${colKey}`);
        if (rawVal === null || rawVal === undefined || String(rawVal).trim() === '') {
          return <span className="ds-cell-empty">–</span>;
        }
        const vals = splitValues(rawVal);
        if (colDef?.codeLabel || vals.length > 1) {
          return <CodeList label={colDef?.codeLabel} values={vals} compact={!isParent} />;
        }
        return (
          <span style={{ fontSize: isParent ? '12px' : '11px', color: isParent ? C.text : 'var(--ds-text-2)' }}>
            {rawVal}
          </span>
        );
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* ── Top Bar: Filter Toggle, Column Customizer & Version Controls ── */}
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

          {/* Configure Columns Popover Toggle */}
          <ColumnCustomizerPopover
            entityLabel="Hardware"
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

          {/* Expand / Collapse Versions Single Button & Menu */}
          <VersionMenuDropdown
            groups={groups}
            expandedGroups={expandedGroups}
            onExpandAll={onExpandAll}
            onCollapseAll={onCollapseAll}
          />
        </div>

        {/* Right: Active Sort Reset */}
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
              title="Clear active column sort"
            >
              <span>Sorted by: <strong>{AVAILABLE_COLUMNS.find(c => c.key === sortConfig.key)?.label || sortConfig.key}</strong> ({sortConfig.direction === 'asc' ? '▲' : '▼'})</span>
              <span style={{ marginLeft: '4px', fontSize: '12px' }}>✕</span>
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
                style={{ cursor: 'pointer', accentColor: 'var(--ds-brand)' }}
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
          {visibleColumns.length === 0 ? (
            <tr>
              <td colSpan={2} style={{ textAlign: 'center', padding: '36px 12px', color: C.muted }}>
                <div style={{ fontSize: '13px', fontWeight: '600' }}>No columns selected.</div>
                <div style={{ fontSize: '12px', color: 'var(--ds-text-2)', marginTop: '4px' }}>
                  Use the <strong>Columns</strong> menu above to select columns to display.
                </div>
              </td>
            </tr>
          ) : processedGroups.length === 0 ? (
            <tr>
              <td colSpan={visibleColumns.length + 1} style={{ textAlign: 'center', padding: '36px 12px', color: C.muted }}>
                <div style={{ fontSize: '20px', marginBottom: '6px' }}><Icon name="inbox" size={20} /></div>
                <div style={{ fontSize: '13px', fontWeight: '600' }}>No hardware offerings match the column filters.</div>
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
                    title="Double-click to view Hardware details"
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
