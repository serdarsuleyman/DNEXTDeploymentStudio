import React, { useState } from 'react';
import Icon from '../ui/Icon';
import { LifecyclePill, VersionCell } from '../list-views/cellRenderers';

const C = {
  bg: '#ffffff',
  panel: '#ffffff',
  cardBg: '#ffffff',
  cardBorder: 'var(--ds-border)',
  subCardBg: 'var(--ds-surface-subtle)',
  text: 'var(--ds-text)',
  muted: 'var(--ds-text-2)',
  indigo: 'var(--ds-brand)',
  accent: 'var(--ds-brand)',
  bundle: 'var(--ds-spec)',
  success: 'var(--ds-ok)',
  warning: 'var(--ds-warn)',
  danger: 'var(--ds-brand)'
};

export default function BundleCompositionDetailTemplate({
  item,
  allEntities = [],
  onNavigateToEntity,
  copyToClipboard,
  copiedKey
}) {
  const raw = item?.raw || {};
  const bundledOffers = Array.isArray(raw.bundledProductOffering) ? raw.bundledProductOffering : [];
  const pops = Array.isArray(raw.productOfferingPrice) ? raw.productOfferingPrice : [];
  const terms = Array.isArray(raw.productOfferingTerm) ? raw.productOfferingTerm : [];
  const spec = raw.productSpecification || item?.productSpecification;
  const chars = Array.isArray(raw.prodSpecCharValueUse)
    ? raw.prodSpecCharValueUse
    : (Array.isArray(raw.productSpecCharacteristic) ? raw.productSpecCharacteristic : []);

  const [searchChild, setSearchChild] = useState('');
  const [searchChar, setSearchChar] = useState('');
  const [activeTab, setActiveTab] = useState('components');

  const filteredChildren = bundledOffers.filter(b => {
    if (!searchChild.trim()) return true;
    const q = searchChild.toLowerCase();
    return (b.name || '').toLowerCase().includes(q) || (b.id || '').toLowerCase().includes(q);
  });

  const filteredChars = chars.filter(c => {
    if (!searchChar.trim()) return true;
    const q = searchChar.toLowerCase();
    const nameMatch = (c.name || '').toLowerCase().includes(q);
    const valMatch = (
      Array.isArray(c.productSpecCharacteristicValue)
        ? c.productSpecCharacteristicValue
        : (Array.isArray(c.productOfferingPriceCharacteristicValue) ? c.productOfferingPriceCharacteristicValue : [])
    ).some(v => String(v.value !== undefined ? v.value : v).toLowerCase().includes(q));
    return nameMatch || valMatch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ─── Bundle Hero Banner ─── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, #ffffff 85%)',
        border: '1px solid rgba(124,58,237,0.25)',
        borderRadius: '12px',
        padding: '22px 24px',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: 'rgba(124,58,237,0.1)',
                color: 'var(--ds-spec)',
                border: '1px solid rgba(124,58,237,0.3)',
                padding: '3px 10px',
                borderRadius: '6px'
              }}>
                <Icon name="layers" size={14} /> Composite Bundle Hierarchy
              </span>
              <span style={{ fontSize: '11px', color: C.muted }}>
                TMF620 Bundled Offering
              </span>
            </div>

            <h1 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: '800', color: C.text, letterSpacing: '-0.02em' }}>
              {item.name || item.id}
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: C.muted, maxWidth: '620px', lineHeight: '1.5' }}>
              {raw.description || 'Commercial bundle package grouping multiple standalone product offerings, hardware elements, and service plans under a unified commercial construct.'}
            </p>
          </div>

          {/* Bundle Stats Counters */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{
              background: '#ffffff',
              border: '1px solid rgba(124,58,237,0.25)',
              borderRadius: '10px',
              padding: '12px 18px',
              minWidth: '120px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', fontWeight: '700' }}>
                Bundled Items
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--ds-spec)', marginTop: '2px' }}>
                {bundledOffers.length}
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              border: `1px solid ${C.cardBorder}`,
              borderRadius: '10px',
              padding: '12px 18px',
              minWidth: '120px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', fontWeight: '700' }}>
                Bundle POPs
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--ds-warn)', marginTop: '2px' }}>
                {pops.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Parameters & Classification Grid ─── */}
      <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '13px', fontWeight: '700', color: C.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Pricing Parameters & Classification
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
          <div>
            <span style={{ fontSize: '11px', color: C.muted }}>Entity Type</span>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ds-brand-dark)', marginTop: '2px' }}>
              {item.entityType || 'ProductOffering'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: C.muted }}>Bundle Offering?</span>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ds-spec)', marginTop: '2px' }}>
              <Icon name="layers" size={14} /> Yes (Bundle Offer)
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: C.muted }}>Version</span>
            <div style={{ marginTop: '4px' }}><VersionCell version={item.version} /></div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: C.muted }}>Lifecycle Status</span>
            <div style={{ marginTop: '4px' }}><LifecyclePill status={item.lifecycleStatus || raw.lifecycleStatus} /></div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: C.muted }}>Product Specification</span>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ds-spec)', marginTop: '2px' }}>
              {spec?.name || spec?.id || (typeof spec === 'string' ? spec : '-')}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: C.muted }}>Valid From</span>
            <div style={{ fontSize: '12px', color: C.text, marginTop: '2px', fontFamily: 'var(--ds-font-mono)' }}>
              {raw.validFor?.startDateTime ? new Date(raw.validFor.startDateTime).toLocaleDateString() : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sub-Tabs under Pricing Parameters & Classification ─── */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${C.cardBorder}`, paddingBottom: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('components')}
          style={{
            background: activeTab === 'components' ? 'rgba(124,58,237,0.08)' : 'transparent',
            border: '1px solid',
            borderColor: activeTab === 'components' ? 'var(--ds-spec)' : 'transparent',
            color: activeTab === 'components' ? 'var(--ds-spec)' : C.muted,
            padding: '6px 14px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s'
          }}
        >
          <span><Icon name="tree" size={14} /></span>
          <span>Bundled Components ({bundledOffers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('characteristics')}
          style={{
            background: activeTab === 'characteristics' ? 'rgba(230,0,0,0.08)' : 'transparent',
            border: '1px solid',
            borderColor: activeTab === 'characteristics' ? 'var(--ds-brand)' : 'transparent',
            color: activeTab === 'characteristics' ? 'var(--ds-brand)' : C.muted,
            padding: '6px 14px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s'
          }}
        >
          <span><Icon name="settings" size={14} /></span>
          <span>Characteristics ({chars.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pricing_terms')}
          style={{
            background: activeTab === 'pricing_terms' ? 'rgba(2,132,199,0.08)' : 'transparent',
            border: '1px solid',
            borderColor: activeTab === 'pricing_terms' ? 'var(--ds-info)' : 'transparent',
            color: activeTab === 'pricing_terms' ? 'var(--ds-info)' : C.muted,
            padding: '6px 14px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s'
          }}
        >
          <span><Icon name="tag" size={14} /></span>
          <span>Pricing & Terms ({pops.length + terms.length})</span>
        </button>
      </div>

      {/* ─── TAB 1: BUNDLED CHILD OFFERINGS ─── */}
      {activeTab === 'components' && (
        <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span><Icon name="tree" size={14} /> Bundled Child Offerings & Cardinalities</span>
                <span style={{ fontSize: '12px', background: 'rgba(124,58,237,0.1)', color: 'var(--ds-spec)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
                  {filteredChildren.length} of {bundledOffers.length}
                </span>
              </h3>
              <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>
                Child offerings included in this bundle structure with their min/max selection bounds
              </div>
            </div>

            <input
              type="text"
              value={searchChild}
              onChange={e => setSearchChild(e.target.value)}
              placeholder="Search bundled components…"
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: `1px solid ${C.cardBorder}`,
                background: '#ffffff',
                color: C.text,
                fontSize: '12px',
                outline: 'none',
                width: '220px'
              }}
            />
          </div>

          {bundledOffers.length === 0 ? (
            <div style={{
              background: 'var(--ds-surface-subtle)',
              border: `1px dashed ${C.cardBorder}`,
              borderRadius: '8px',
              padding: '28px',
              textAlign: 'center',
              color: C.muted,
              fontSize: '13px'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}><Icon name="layers" size={24} /></div>
              <div>This offer has <code>isBundle = true</code>, but contains no child items in <code>bundledProductOffering</code>.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredChildren.map((b, idx) => {
                const card = b.bundledProductOfferingOption || {};
                const min = card.numberRelOfferLowerLimit !== undefined ? card.numberRelOfferLowerLimit : (card.min ?? 1);
                const max = card.numberRelOfferUpperLimit !== undefined ? card.numberRelOfferUpperLimit : (card.max ?? 1);
                const def = card.numberRelOfferDefault !== undefined ? card.numberRelOfferDefault : (card.default ?? 1);

                return (
                  <div key={idx} style={{
                    background: 'var(--ds-surface-subtle)',
                    border: `1px solid ${C.cardBorder}`,
                    borderRadius: '8px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    transition: 'border-color 0.15s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: 'rgba(124,58,237,0.1)',
                        border: '1px solid rgba(124,58,237,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '15px'
                      }}><Icon name="package" size={15} /></div>
                      <div>
                        {/* ── Hyperlink to Simple Child Offer Details ── */}
                        <div
                          onClick={() => onNavigateToEntity && onNavigateToEntity(b, 'ProductOffering')}
                          style={{
                            fontSize: '13px',
                            fontWeight: '700',
                            color: onNavigateToEntity ? 'var(--ds-brand-dark)' : C.text,
                            cursor: onNavigateToEntity ? 'pointer' : 'default',
                            textDecoration: onNavigateToEntity ? 'underline' : 'none',
                            textDecorationColor: 'rgba(230,0,0,0.3)',
                            textUnderlineOffset: '2px',
                            transition: 'color 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (onNavigateToEntity) e.currentTarget.style.color = 'var(--ds-brand)';
                          }}
                          onMouseLeave={(e) => {
                            if (onNavigateToEntity) e.currentTarget.style.color = 'var(--ds-brand-dark)';
                          }}
                          title={`Click to view simple offer details for ${b.name || b.id}`}
                        >
                          {b.name || b.id}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <code style={{ fontSize: '11px', color: 'var(--ds-spec)', fontFamily: 'var(--ds-font-mono)' }}>
                            {b.id}
                          </code>
                          {b.lifecycleStatus && (
                            <LifecyclePill status={b.lifecycleStatus} compact />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cardinality Tags & Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(230,0,0,0.06)',
                        border: '1px solid rgba(230,0,0,0.2)',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: 'var(--ds-brand-dark)'
                      }}>
                        <span>Cardinality:</span>
                        <strong>Min: {min}</strong>
                        <span style={{ opacity: 0.5 }}>|</span>
                        <strong>Default: {def}</strong>
                        <span style={{ opacity: 0.5 }}>|</span>
                        <strong>Max: {max}</strong>
                      </div>

                      {b.id && copyToClipboard && (
                        <button
                          onClick={() => copyToClipboard(b.id, `child_${idx}`)}
                          style={{
                            background: '#ffffff',
                            border: `1px solid ${C.cardBorder}`,
                            color: copiedKey === `child_${idx}` ? C.success : C.text,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          {copiedKey === `child_${idx}` ? '✓' : 'Copy ID'}
                        </button>
                      )}

                      {/* ── View Simple Offer Details Button ── */}
                      {onNavigateToEntity && (
                        <button
                          type="button"
                          onClick={() => onNavigateToEntity(b, 'ProductOffering')}
                          style={{
                            background: 'rgba(230,0,0,0.06)',
                            border: '1px solid rgba(230,0,0,0.25)',
                            color: 'var(--ds-brand-dark)',
                            padding: '4px 10px',
                            borderRadius: '5px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--ds-brand)';
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(230,0,0,0.06)';
                            e.currentTarget.style.color = 'var(--ds-brand-dark)';
                          }}
                          title="Open simple offer details in drawer"
                        >
                          <span>View Details</span>
                          <span>→</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: CHARACTERISTICS ─── */}
      {activeTab === 'characteristics' && (
        <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span><Icon name="settings" size={14} /> Characteristics ({chars.length})</span>
              </h3>
              <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>
                Commercial and technical characteristics defined on this bundle offering
              </div>
            </div>

            {chars.length > 4 && (
              <input
                type="text"
                value={searchChar}
                onChange={e => setSearchChar(e.target.value)}
                placeholder="Filter characteristics…"
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${C.cardBorder}`,
                  background: '#ffffff',
                  color: C.text,
                  fontSize: '12px',
                  outline: 'none',
                  width: '200px'
                }}
              />
            )}
          </div>

          {filteredChars.length === 0 ? (
            <div style={{
              background: 'var(--ds-surface-subtle)',
              border: `1px dashed ${C.cardBorder}`,
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              color: C.muted,
              fontSize: '13px'
            }}>
              {chars.length === 0 ? 'No characteristics declared on this bundle offering.' : `No characteristics match "${searchChar}".`}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
              {filteredChars.map((char, i) => {
                const values = Array.isArray(char.productSpecCharacteristicValue)
                  ? char.productSpecCharacteristicValue
                  : (Array.isArray(char.productOfferingPriceCharacteristicValue)
                    ? char.productOfferingPriceCharacteristicValue
                    : (Array.isArray(char.value) ? char.value : (char.value !== undefined ? [{ value: char.value }] : [])));

                return (
                  <div key={i} style={{ background: 'var(--ds-surface-subtle)', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${C.cardBorder}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: C.text }}>{char.name}</div>
                      {char.valueType && (
                        <span style={{ fontSize: '11px', color: C.muted, background: 'var(--ds-border)', padding: '1px 5px', borderRadius: '3px' }}>
                          {char.valueType}
                        </span>
                      )}
                    </div>

                    {char.productSpecification?.name && (
                      <div style={{ fontSize: '11px', color: 'var(--ds-spec)', marginTop: '2px' }}>
                        Spec: {char.productSpecification.name}
                      </div>
                    )}

                    {values.length > 0 ? (
                      <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {values.map((v, vi) => (
                          <span
                            key={vi}
                            style={{
                              fontSize: '11px',
                              background: 'rgba(230,0,0,0.06)',
                              color: 'var(--ds-brand-dark)',
                              border: '1px solid rgba(230,0,0,0.2)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontFamily: 'var(--ds-font-mono)',
                              fontWeight: '600'
                            }}
                          >
                            {String(v.value !== undefined ? v.value : v)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: C.muted, fontStyle: 'italic', marginTop: '6px' }}>
                        No default value specified
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: BUNDLE PRICING & TERMS ─── */}
      {activeTab === 'pricing_terms' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Bundle Prices */}
          <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span><Icon name="tag" size={14} /> Bundle Level Pricing</span>
              <span style={{ fontSize: '11px', color: C.muted, fontWeight: '400' }}>({pops.length})</span>
            </h3>
            {pops.length === 0 ? (
              <div style={{ fontSize: '12px', color: C.muted, fontStyle: 'italic' }}>
                Pricing is calculated dynamically from child components or not attached directly.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pops.map((p, i) => (
                  <div key={i} style={{ background: 'var(--ds-surface-subtle)', padding: '10px 12px', borderRadius: '6px', border: `1px solid ${C.cardBorder}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: C.text }}>{p.name || p.id}</span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ds-warn)' }}>
                        {p.price ? `${p.price.value} ${p.price.unit || 'EUR'}` : 'Dynamic'}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>
                      Type: {p.priceType || 'Standard'} {p.recurringChargePeriodType ? `(${p.recurringChargePeriodType})` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contractual Terms */}
          <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span><Icon name="edit" size={14} /> Bundle Terms & Conditions</span>
            </h3>
            {terms.length === 0 ? (
              <div style={{ fontSize: '12px', color: C.muted, fontStyle: 'italic' }}>
                Standard terms inherited from catalog policy.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {terms.map((t, i) => (
                  <div key={i} style={{ background: 'var(--ds-surface-subtle)', padding: '10px 12px', borderRadius: '6px', border: `1px solid ${C.cardBorder}` }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: C.text }}>{t.name || `Term #${i + 1}`}</div>
                    {t.description && <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>{t.description}</div>}
                    {t.duration && (
                      <div style={{ fontSize: '11px', color: 'var(--ds-ok)', fontWeight: '700', marginTop: '4px' }}>
                        Commitment: {t.duration.amount} {t.duration.units}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
