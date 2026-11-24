import React from 'react';
import Icon from '../ui/Icon';

/**
 * Common List View Header
 * Rendered immediately under the application header across all catalog list views.
 * Displays:
 *  - Left: View Name (with icon and entity count badge)
 *  - Right: Cached(TimeStamp) status badge, Refresh Catalog button, and contextual actions.
 */
export default function ListViewHeader({
  title,
  icon = 'package',
  itemCount,
  cacheStatus,
  onRefreshCatalog,
  isRefreshing = false,
  disabled = false,
  isSalesPackagesView = false,
  onNewSalesPackage,
  selectedCount = 0,
  onBulkPurge,
  onClearSelection
}) {
  return (
    <div
      style={{
        padding: '12px 28px',
        borderBottom: '1px solid var(--ds-border, #e5e7eb)',
        background: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        flexShrink: 0
      }}
    >
      {/* ── Left: View Title & Item Count ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'rgba(230,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ds-brand, #e60000)'
          }}
        >
          <Icon name={icon} size={18} />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <h2
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '700',
              color: 'var(--ds-text, #111827)',
              letterSpacing: '-0.01em',
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            {title}
          </h2>

          {itemCount !== undefined && itemCount !== null && (
            <span
              style={{
                fontSize: '12px',
                color: 'var(--ds-text-2, #6b7280)',
                fontWeight: '500'
              }}
            >
              ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </span>
          )}
        </div>
      </div>

      {/* ── Right: Selection Actions, Cached(TimeStamp), Refresh Catalog & New Sales Package ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* Bulk Selection Actions (shown only when rows are selected) */}
        {selectedCount > 0 && onBulkPurge && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginRight: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--ds-text-2, #6b7280)', fontWeight: '600' }}>
              {selectedCount} selected
            </span>
            <button
              type="button"
              onClick={onBulkPurge}
              disabled={isRefreshing}
              style={{
                background: 'var(--ds-danger, #ef4444)',
                border: '1px solid var(--ds-danger, #ef4444)',
                color: '#ffffff',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Purge selected entities from DNEXT"
            >
              <Icon name="trash" size={13} />
              <span>Bulk Purge ({selectedCount})</span>
            </button>
            {onClearSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ds-text-2, #6b7280)',
                  padding: '4px 6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ✕ Clear
              </button>
            )}
          </div>
        )}

        {/* Cached(TimeStamp) Badge */}
        {cacheStatus && (
          <span
            style={{
              fontSize: '11px',
              color: cacheStatus.isCached ? 'var(--ds-ok, #059669)' : 'var(--ds-text-2, #6b7280)',
              background: cacheStatus.isCached ? 'rgba(16,185,129,0.08)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${cacheStatus.isCached ? 'rgba(16,185,129,0.25)' : 'var(--ds-border, #e5e7eb)'}`,
              padding: '4px 10px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '500'
            }}
            title={
              cacheStatus.cachedAt
                ? `Loaded from SQLite backend cache (${new Date(cacheStatus.cachedAt).toLocaleString()})`
                : 'Live catalog data'
            }
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: cacheStatus.isCached ? 'var(--ds-ok, #059669)' : 'var(--ds-text-2, #6b7280)'
              }}
            />
            <span>{cacheStatus.isCached ? 'Cached' : 'Live'}</span>
            {cacheStatus.cachedAt && (
              <span style={{ fontSize: '11px', color: 'var(--ds-text-2, #6b7280)' }}>
                ({new Date(cacheStatus.cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </span>
            )}
          </span>
        )}

        {/* Refresh Catalog Button */}
        {onRefreshCatalog && (
          <button
            type="button"
            onClick={onRefreshCatalog}
            disabled={isRefreshing || disabled}
            style={{
              background: '#ffffff',
              border: '1px solid var(--ds-border-strong, #d1d5db)',
              color: 'var(--ds-text, #111827)',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: isRefreshing || disabled ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            title="Fetch latest remote entities from active DNEXT environment (bypasses cache)"
          >
            <span
              style={{
                display: 'inline-block',
                animation: isRefreshing ? 'spin 1s infinite linear' : 'none'
              }}
            >
              {isRefreshing ? '' : '⟳'}
            </span>
            <span>{isRefreshing ? 'Refreshing…' : 'Refresh Catalog'}</span>
          </button>
        )}

        {/* + New Sales Package Button (Gated strictly to Sales Packages View) */}
        {isSalesPackagesView && onNewSalesPackage && (
          <button
            type="button"
            onClick={onNewSalesPackage}
            style={{
              background: 'var(--ds-brand, #e60000)',
              border: '1px solid var(--ds-brand-dark, #b91c1c)',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 3px rgba(230,0,0,0.25)',
              transition: 'all 0.15s ease'
            }}
            title="Create a new commercial Sales Package broadband offer"
          >
            <span style={{ fontSize: '14px', lineHeight: 1 }}>+</span>
            <span>New Sales Package</span>
          </button>
        )}
      </div>
    </div>
  );
}
