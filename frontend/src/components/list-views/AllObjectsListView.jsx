import React, { useState, useRef, useEffect, useMemo } from 'react';
import Icon from '../ui/Icon';
import { SpecLink, VersionCell, LifecyclePill, EntityTypeBadge } from './cellRenderers';
import { C, ENTITY_CONFIG } from './constants';

/**
 * AllObjectsListView
 * Dedicated list view component for general catalog overview and multi-entity browsing.
 * Features:
 * - Version column toggle button aligned with SalesPackageListView pattern
 * - Clean ID column
 * - Child version rows aligned with table headers
 * - Multi-version hierarchy tree
 */
export default function AllObjectsListView({
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
  onOpenDetail
}) {
  const [isVersionMenuOpen, setIsVersionMenuOpen] = useState(false);
  const versionMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (versionMenuRef.current && !versionMenuRef.current.contains(e.target)) {
        setIsVersionMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const multiVersionGroups = useMemo(() => groups.filter(g => g.previousVersions && g.previousVersions.length > 0), [groups]);
  const hasVersions = multiVersionGroups.length > 0;
  const isAnyExpanded = hasVersions && multiVersionGroups.some(g => expandedGroups && expandedGroups.has(g.groupKey));

  const handleToggleVersions = () => {
    if (isAnyExpanded) {
      onCollapseAll && onCollapseAll();
    } else {
      onExpandAll && onExpandAll();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* ── Toolbar: Expand/Collapse Versions & Refresh Catalog ── */}
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
        <div>
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
                  overflow: 'hidden',
                  padding: '4px 0'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsVersionMenuOpen(false);
                      onExpandAll && onExpandAll();
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '7px 12px',
                      background: 'none',
                      border: 'none',
                      fontSize: '12px',
                      color: C.text,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--ds-surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <span>⊞</span>
                    <span>Expand All Versions</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsVersionMenuOpen(false);
                      onCollapseAll && onCollapseAll();
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '7px 12px',
                      background: 'none',
                      border: 'none',
                      fontSize: '12px',
                      color: C.text,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--ds-surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <span>⊟</span>
                    <span>Collapse All Versions</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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
                opacity: isRefreshing ? 0.7 : 1,
                transition: 'all 0.15s ease'
              }}
              title="Reload live catalog from DNEXT Direct Cloud Gateway (bypasses cache)"
            >
              <span style={{ display: 'inline-block', animation: isRefreshing ? 'spin 1s infinite linear' : 'none' }}>
                {isRefreshing ? '' : '⟳'}
              </span>
              <span>{isRefreshing ? 'Refreshing…' : 'Refresh Catalog'}</span>
            </button>
          </div>
        )}
      </div>

      <table className="ds-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginTop: '12px', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <th style={{ padding: '10px 8px', width: '38px', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={groups.length > 0 && selectedIds.size === groups.length}
                onChange={onToggleSelectAll}
                style={{ cursor: 'pointer', accentColor: C.indigo }}
              />
            </th>
            <th style={{ padding: '10px 12px', width: '150px' }}>Type</th>
            <th style={{ padding: '10px 12px' }}>ID / Identifier</th>
            <th style={{ padding: '10px 12px' }}>Name / Title</th>
            <th style={{ padding: '10px 12px', width: '100px' }}>Version</th>
            <th style={{ padding: '10px 12px', width: '120px' }}>Lifecycle</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const item = group.latestItem;
            const isSelected = selectedIds.has(item.id);
            const isExpanded = expandedGroups.has(group.groupKey);
            const hasMultipleVersions = group.previousVersions && group.previousVersions.length > 0;
            const typeCfg = ENTITY_CONFIG[item.entityType] || {
              label: item.entityType,
              color: { bg: 'rgba(230,0,0,0.06)', border: 'var(--ds-danger-border)', text: 'var(--ds-brand)' },
              icon: 'file'
            };

            return (
              <React.Fragment key={group.groupKey}>
                {/* ── Parent / Latest Version Row ── */}
                <tr
                  onDoubleClick={() => onOpenDetail && onOpenDetail(item)}
                  title="Double-click to view details"
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
                  {/* Checkbox */}
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => onToggleSelectItem && onToggleSelectItem(item.id)}
                      style={{ cursor: 'pointer', accentColor: C.indigo }}
                    />
                  </td>

                  {/* Type Badge */}
                  <td style={{ padding: '10px 12px' }}>
                    <EntityTypeBadge
                      type={item.entityType}
                      label={typeCfg.label}
                      icon={typeCfg.icon}
                    />
                  </td>

                  {/* ID / Identifier (Clean, no version button jammed here) */}
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '12px', color: C.text, fontWeight: '600' }}>
                      {item.id}
                    </span>
                  </td>

                  {/* Name */}
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ color: C.text, fontSize: '13px', fontWeight: '500' }}>
                      {item.name || '-'}
                    </div>
                  </td>

                  {/* Version (Interactive Toggle Button as in SalesPackagesListView) */}
                  <td
                    style={{ padding: '10px 12px', cursor: hasMultipleVersions ? 'pointer' : undefined }}
                    onClick={hasMultipleVersions ? (e) => {
                      e.stopPropagation();
                      onToggleExpand && onToggleExpand(group.groupKey);
                    } : undefined}
                  >
                    <VersionCell
                      version={item.version}
                      totalVersions={hasMultipleVersions ? (group.totalVersions || group.previousVersions.length + 1) : 1}
                      isExpanded={Boolean(isExpanded)}
                      onToggle={() => onToggleExpand && onToggleExpand(group.groupKey)}
                      isParent
                    />
                  </td>

                  {/* Lifecycle Status */}
                  <td style={{ padding: '10px 12px' }}>
                    <LifecyclePill status={item.lifecycleStatus} />
                  </td>
                </tr>

                {/* ── Sub-rows: Previous Versions (Tree Expanded, Column-Aligned) ── */}
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

                      {/* Type */}
                      <td style={{ padding: '8px 12px' }}>
                        <EntityTypeBadge
                          type={prevItem.entityType}
                          label={typeCfg.label}
                          icon={typeCfg.icon}
                          isChild
                        />
                      </td>

                      {/* ID */}
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '11px', color: 'var(--ds-text-2)' }}>
                          {prevItem.id}
                        </span>
                      </td>

                      {/* Name */}
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ color: 'var(--ds-text-2)', fontSize: '12px' }}>
                          {prevItem.name || '-'}
                        </div>
                      </td>

                      {/* Version (Amber Badge for Child Row) */}
                      <td style={{ padding: '8px 12px' }}>
                        <VersionCell version={prevItem.version} isParent={false} />
                      </td>

                      {/* Lifecycle Status */}
                      <td style={{ padding: '8px 12px' }}>
                        <LifecyclePill status={prevItem.lifecycleStatus} compact />
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
