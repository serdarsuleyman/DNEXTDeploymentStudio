import React from 'react';
import Icon from '../ui/Icon';
import { LifecyclePill, VersionCell } from '../list-views/cellRenderers';

const C = {
  bg: '#ffffff',
  panel: '#ffffff',
  cardBg: '#ffffff',
  cardBorder: 'var(--ds-border)',
  subCardBg: 'var(--ds-surface-subtle)',
  text: 'var(--ds-text)',
  muted: 'var(--ds-text-2)'
};

export default function CategoryDetailTemplate({
  item,
  onNavigateToEntity,
  copyToClipboard,
  copiedKey
}) {
  const raw = item?.raw || item || {};
  const isRoot = Boolean(raw.isRoot === true || !raw.parentId);
  const parent = raw.parent || (raw.parentId ? { id: raw.parentId, name: raw.parentId } : null);
  const subCategories = Array.isArray(raw.subCategory) ? raw.subCategory : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ─── Hero Header ─── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(2,132,199,0.08) 0%, #ffffff 85%)',
        border: '1px solid rgba(2,132,199,0.25)',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: '800',
              textTransform: 'uppercase',
              background: isRoot ? 'rgba(16,185,129,0.12)' : 'rgba(2,132,199,0.1)',
              color: isRoot ? 'var(--ds-ok)' : 'var(--ds-info)',
              border: `1px solid ${isRoot ? 'rgba(16,185,129,0.3)' : 'rgba(2,132,199,0.3)'}`,
              padding: '3px 10px',
              borderRadius: '6px'
            }}>
              {isRoot ? 'Root Category' : 'Category Node'}
            </span>
            <VersionCell version={item.version || raw.version || '1'} />
            <LifecyclePill status={raw.lifecycleStatus || item.lifecycleStatus || 'Launched'} />
          </div>

          <h1 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: '800', color: C.text }}>
            {item.name || raw.name || item.id}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <code style={{ fontSize: '12px', color: 'var(--ds-warn)', fontFamily: 'var(--ds-font-mono)' }}>
              ID: {item.id}
            </code>
            {copyToClipboard && (
              <button
                type="button"
                onClick={() => copyToClipboard(item.id, `cat-${item.id}`)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: copiedKey === `cat-${item.id}` ? 'var(--ds-ok)' : C.muted,
                  cursor: 'pointer',
                  fontSize: '11px',
                  padding: '2px 4px'
                }}
                title="Copy category ID"
              >
                {copiedKey === `cat-${item.id}` ? '✓ Copied' : 'Copy'}
              </button>
            )}
          </div>
          {raw.description && (
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: C.muted, maxWidth: '580px', lineHeight: '1.5' }}>
              {raw.description}
            </p>
          )}
        </div>

        {/* Counter Badge */}
        <div style={{
          background: '#ffffff',
          border: '1px solid rgba(2,132,199,0.25)',
          borderRadius: '10px',
          padding: '16px 20px',
          textAlign: 'right',
          minWidth: '140px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--ds-info)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
            Subcategories
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: C.text, marginTop: '2px' }}>
            {subCategories.length}
          </div>
          <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>
            Direct child nodes
          </div>
        </div>
      </div>

      {/* ─── Parent Category Reference (if not root) ─── */}
      {parent && !isRoot && (
        <div style={{
          background: '#ffffff',
          border: `1px solid ${C.cardBorder}`,
          borderRadius: '10px',
          padding: '16px 18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: C.muted, letterSpacing: '0.05em', marginBottom: '8px' }}>
            Hierarchy Parent
          </div>
          <div style={{
            background: 'var(--ds-surface-subtle)',
            border: `1px solid ${C.cardBorder}`,
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>⬆️</span>
              <div>
                <div
                  onClick={() => onNavigateToEntity && onNavigateToEntity(parent, 'Category')}
                  style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: onNavigateToEntity ? 'var(--ds-brand)' : C.text,
                    cursor: onNavigateToEntity ? 'pointer' : 'default',
                    textDecoration: onNavigateToEntity ? 'underline' : 'none'
                  }}
                  title="Navigate to parent category"
                >
                  {parent.name || parent.id}
                </div>
                <div style={{ fontSize: '11px', color: C.muted, fontFamily: 'var(--ds-font-mono)', marginTop: '2px' }}>
                  ID: {parent.id} {parent.version ? `(v${parent.version})` : ''}
                </div>
              </div>
            </div>

            {onNavigateToEntity && (
              <button
                type="button"
                onClick={() => onNavigateToEntity(parent, 'Category')}
                style={{
                  background: 'none',
                  border: '1px solid var(--ds-border)',
                  borderRadius: '4px',
                  color: 'var(--ds-brand)',
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '4px 10px',
                  cursor: 'pointer'
                }}
              >
                Go to Parent →
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Child Subcategories Section ─── */}
      <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span><Icon name="folder" size={14} /> Direct Subcategories</span>
              <span style={{ fontSize: '12px', background: 'rgba(2,132,199,0.1)', color: 'var(--ds-info)', border: '1px solid rgba(2,132,199,0.25)', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                {subCategories.length}
              </span>
            </h3>
            <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>
              Categories positioned immediately below this node in the taxonomy tree
            </div>
          </div>
        </div>

        {subCategories.length === 0 ? (
          <div style={{
            background: 'var(--ds-surface-subtle)',
            border: `1px dashed ${C.cardBorder}`,
            borderRadius: '8px',
            padding: '24px',
            textAlign: 'center',
            color: C.muted,
            fontSize: '13px'
          }}>
            This is a leaf category node with no further subcategories attached.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
            {subCategories.map((sub, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--ds-surface-subtle)',
                  border: `1px solid ${C.cardBorder}`,
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    onClick={() => onNavigateToEntity && onNavigateToEntity(sub, 'Category')}
                    style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: onNavigateToEntity ? 'var(--ds-brand-dark)' : C.text,
                      cursor: onNavigateToEntity ? 'pointer' : 'default',
                      textDecoration: onNavigateToEntity ? 'underline' : 'none',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    onMouseEnter={(e) => { if (onNavigateToEntity) e.currentTarget.style.color = 'var(--ds-brand)'; }}
                    onMouseLeave={(e) => { if (onNavigateToEntity) e.currentTarget.style.color = 'var(--ds-brand-dark)'; }}
                    title={`Click to view category details for ${sub.name || sub.id}`}
                  >
                    <Icon name="folder" size={14} /> {sub.name || sub.id}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                    <code style={{ fontSize: '11px', color: 'var(--ds-warn)', fontFamily: 'var(--ds-font-mono)' }}>
                      {sub.id}
                    </code>
                    {sub.version && (
                      <span style={{ fontSize: '11px', color: 'var(--ds-ok)', background: 'rgba(16,185,129,0.1)', padding: '1px 5px', borderRadius: '3px' }}>
                        v{sub.version}
                      </span>
                    )}
                  </div>
                </div>

                {onNavigateToEntity && (
                  <button
                    type="button"
                    onClick={() => onNavigateToEntity(sub, 'Category')}
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--ds-border-strong)',
                      borderRadius: '4px',
                      color: 'var(--ds-brand)',
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '3px 8px',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    View →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
