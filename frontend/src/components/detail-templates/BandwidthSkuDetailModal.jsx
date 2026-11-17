import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../ui/Icon';
import { C } from '../../styles/theme';

export default function BandwidthSkuDetailModal({
  isOpen,
  onClose,
  tier = null,
  matchingOffer = null,
  allEntities = [],
  onNavigateToEntity = null
}) {
  const [charSearch, setCharSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const [fetchedOffering, setFetchedOffering] = useState(null);
  const [loading, setLoading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Copy helper
  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(String(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Resolve best offering representation
  const offerId = matchingOffer?.id || (tier?.svcBw ? `po_${tier.svcBw}_FN_Options_Bandwidth` : '');
  const realBw = tier?.svcBw || matchingOffer?.realBandwidth || matchingOffer?.serviceCode || '';
  const offerSku = tier?.sku || matchingOffer?.sku || '';
  const speedDown = tier?.speed || matchingOffer?.speeds?.down || '—';
  const speedUp = tier?.upload || matchingOffer?.speeds?.up || (speedDown >= 100 ? 40 : speedDown >= 50 ? 10 : 1);

  // Search in allEntities
  const localMatch = useMemo(() => {
    if (!allEntities || allEntities.length === 0) return null;
    return allEntities.find(e => {
      const eId = String(e.id || e.raw?.id || '').toLowerCase();
      const rawE = e.raw || e;
      if (offerId && eId === offerId.toLowerCase()) return true;
      if (realBw && (eId.includes(realBw.toLowerCase()) || String(rawE?.name || '').includes(realBw))) return true;
      if (offerSku && (eId.includes(offerSku.toLowerCase()) || String(rawE?.name || '').includes(offerSku))) return true;
      return false;
    }) || null;
  }, [allEntities, offerId, realBw, offerSku]);

  // Fetch full offering if not already available
  useEffect(() => {
    if (!isOpen) {
      setFetchedOffering(null);
      setCharSearch('');
      return;
    }

    const currentRaw = matchingOffer?.raw || localMatch?.raw || localMatch;
    if (currentRaw?.prodSpecCharValueUse && currentRaw.prodSpecCharValueUse.length > 0) {
      setFetchedOffering(currentRaw);
      return;
    }

    if (offerId) {
      setLoading(true);
      fetch(`/api/dnext/product-offerings/${encodeURIComponent(offerId)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data && data.id) {
            setFetchedOffering(data);
          } else {
            // Try fetching all offerings to match
            fetch('/api/dnext/product-offerings?limit=1000')
              .then(r => r.ok ? r.json() : [])
              .then(items => {
                const list = Array.isArray(items) ? items : items?.data || [];
                const found = list.find(it => {
                  const itId = String(it.id || '').toLowerCase();
                  if (itId === offerId.toLowerCase()) return true;
                  if (realBw && itId.includes(realBw.toLowerCase())) return true;
                  return false;
                });
                if (found) setFetchedOffering(found);
              })
              .catch(() => {});
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, offerId, realBw, matchingOffer, localMatch]);

  const rawEntity = fetchedOffering || matchingOffer?.raw || localMatch?.raw || localMatch || {};
  const offeringName = rawEntity?.name || matchingOffer?.name || (tier?.speed ? `DSL Bandbreite ${tier.speed} Mbit/s` : 'Bandwidth Option');
  const specObj = rawEntity?.productSpecification || matchingOffer?.productSpecification || { id: 'productSpecification_FN_Options_Bandwidth', name: 'productSpecification_FN_Options_Bandwidth' };
  const specId = specObj?.id || specObj?.name || 'productSpecification_FN_Options_Bandwidth';

  // Extract characteristics
  const characteristics = useMemo(() => {
    const rawList = Array.isArray(rawEntity?.prodSpecCharValueUse)
      ? rawEntity.prodSpecCharValueUse
      : (Array.isArray(rawEntity?.productSpecCharacteristic) ? rawEntity.productSpecCharacteristic : []);

    if (rawList.length > 0) {
      return rawList.map(c => {
        const valArr = Array.isArray(c.productSpecCharacteristicValue)
          ? c.productSpecCharacteristicValue.map(v => typeof v === 'object' ? (v.value !== undefined ? v.value : JSON.stringify(v)) : String(v))
          : (c.value !== undefined ? [String(c.value)] : []);
        return {
          id: c.id || c.name,
          name: c.name || c.id || 'Unnamed',
          values: valArr,
          valueType: c.valueType || 'string',
          mandatory: Boolean(c.mandatory),
          isModifiable: Boolean(c.isModifiable)
        };
      });
    }

    // Baseline characteristics if not populated
    const fallbackList = [
      { name: 'sku', values: [offerSku || realBw], valueType: 'string' },
      { name: 'service_code', values: [realBw], valueType: 'string' },
      { name: 'bandbreite', values: [speedDown ? String(Number(speedDown) * 1000) : '—'], valueType: 'integer' },
      { name: 'downstream_bandwidth', values: [String(speedDown)], valueType: 'integer' },
      { name: 'upstream_bandwidth', values: [String(speedUp)], valueType: 'integer' },
      { name: 'ccb_service_name', values: [`DSL Anschluss ${speedDown ? Number(speedDown) * 1000 : ''}`], valueType: 'string' },
      { name: 'ccb_service_domain', values: ['INTERNET'], valueType: 'string' },
      { name: 'ccb_access_products', values: ['I1203', 'I1204'], valueType: 'string' },
      { name: 'product_type', values: ['DSL, FIBRE'], valueType: 'string' },
      { name: 'package_type_id', values: ['DSL'], valueType: 'string' },
      { name: 'technology', values: [tier?.technology || 'DSL'], valueType: 'string' }
    ];
    return fallbackList;
  }, [rawEntity, offerSku, realBw, speedDown, speedUp, tier]);

  // Filter characteristics
  const filteredChars = useMemo(() => {
    const q = (charSearch || '').trim().toLowerCase();
    if (!q) return characteristics;
    return characteristics.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.values.some(v => String(v).toLowerCase().includes(q))
    );
  }, [characteristics, charSearch]);

  // Extract categories
  const categories = useMemo(() => {
    const cg = rawEntity?.extensions?.categoryGroupings || rawEntity?.categoryGroupings || [];
    const catList = [];
    if (Array.isArray(cg)) {
      cg.forEach(g => {
        (g.category || []).forEach(c => {
          if (!catList.some(existing => existing.id === (c.id || c.name))) {
            catList.push({
              id: c.id || c.name,
              name: c.name || c.id,
              version: c.version || '1',
              groupName: g.name || g.id
            });
          }
        });
      });
    }
    return catList;
  }, [rawEntity]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 1500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.panel || '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3), 0 10px 10px -5px rgba(0,0,0,0.2)',
          border: `1px solid ${C.cardBorder || '#e2e8f0'}`,
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Modal Header ─── */}
        <div style={{
          padding: '18px 24px',
          borderBottom: `1px solid ${C.cardBorder || '#e2e8f0'}`,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          background: 'var(--ds-surface-subtle)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                fontSize: '10.5px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                background: 'rgba(230,0,0,0.1)',
                color: 'var(--ds-brand-dark)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(230,0,0,0.2)'
              }}>
                Bandwidth Option Offering
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--ds-ok)',
                background: 'var(--ds-ok-soft)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(34,197,94,0.25)'
              }}>
                {rawEntity.lifecycleStatus || 'In test'}
              </span>
            </div>

            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '800',
              color: 'var(--ds-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{offeringName}</span>
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--ds-text-3)', fontFamily: 'var(--ds-font-mono)' }}>
                ID: {rawEntity.id || offerId}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(rawEntity.id || offerId, 'offerId')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '2px 6px',
                  cursor: 'pointer',
                  color: copiedKey === 'offerId' ? 'var(--ds-ok)' : 'var(--ds-text-3)',
                  fontSize: '11px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                title="Copy Offering ID"
              >
                <Icon name={copiedKey === 'offerId' ? 'check' : 'clipboard'} size={12} />
                <span>{copiedKey === 'offerId' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--ds-text-3)',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease'
            }}
            title="Close (Esc)"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* ─── Modal Body ─── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Key Identifiers Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '12px'
          }}>
            {/* Real Bandwidth */}
            <div style={{
              background: 'var(--ds-surface)',
              border: '1.5px solid rgba(230,0,0,0.25)',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <span style={{ fontSize: '10.5px', color: 'var(--ds-text-3)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Real Bandwidth (Service Code)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <code style={{
                  fontFamily: 'var(--ds-font-mono)',
                  fontSize: '16px',
                  fontWeight: '800',
                  color: 'var(--ds-brand-dark)',
                  background: 'rgba(230,0,0,0.06)',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {realBw || '—'}
                </code>
                {realBw && (
                  <button
                    type="button"
                    onClick={() => handleCopy(realBw, 'realBw')}
                    style={{
                      background: 'none',
                      border: '1px solid var(--ds-border)',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '10.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      color: copiedKey === 'realBw' ? 'var(--ds-ok)' : 'var(--ds-text-2)'
                    }}
                  >
                    {copiedKey === 'realBw' ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--ds-text-3)' }}>
                Target downstream line speed: <strong>{speedDown} Mbit/s</strong>
              </span>
            </div>

            {/* Offer SKU */}
            <div style={{
              background: 'var(--ds-surface)',
              border: '1.5px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <span style={{ fontSize: '10.5px', color: 'var(--ds-text-3)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Offer-Related SKU (Concatenated)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <code style={{
                  fontFamily: 'var(--ds-font-mono)',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#d97706',
                  background: 'rgba(245, 158, 11, 0.08)',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {offerSku || '—'}
                </code>
                {offerSku && (
                  <button
                    type="button"
                    onClick={() => handleCopy(offerSku, 'offerSku')}
                    style={{
                      background: 'none',
                      border: '1px solid var(--ds-border)',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '10.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      color: copiedKey === 'offerSku' ? 'var(--ds-ok)' : 'var(--ds-text-2)'
                    }}
                  >
                    {copiedKey === 'offerSku' ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--ds-text-3)' }}>
                Tariff + Bandwidth + Suffix commercial SKU
              </span>
            </div>

            {/* Speeds & Network */}
            <div style={{
              background: 'var(--ds-surface)',
              border: '1px solid var(--ds-border)',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <span style={{ fontSize: '10.5px', color: 'var(--ds-text-3)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Nominal Speeds & Access
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--ds-text)', fontFamily: 'var(--ds-font-mono)' }}>
                  ↓ {speedDown} Mbit/s
                </span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ds-ok)', fontFamily: 'var(--ds-font-mono)' }}>
                  ↑ {speedUp} Mbit/s
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--ds-text-3)' }}>
                {tier?.technologyBadge || 'I1204 NGN / I1203 Bitstream'}
              </span>
            </div>
          </div>

          {/* Product Specification Reference */}
          <div style={{
            background: 'var(--ds-surface-subtle)',
            border: '1px solid var(--ds-border)',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="puzzle" size={16} style={{ color: 'var(--ds-brand)' }} />
              <div>
                <span style={{ fontSize: '10.5px', color: 'var(--ds-text-3)', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>
                  Product Specification Reference
                </span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ds-text)' }}>
                  {specId}
                </span>
              </div>
            </div>
            {onNavigateToEntity && (
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  onNavigateToEntity(specObj || specId, 'ProductSpecification');
                }}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--ds-border)',
                  borderRadius: '5px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--ds-brand)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Inspect Product Specification"
              >
                <span>View Spec</span>
                <Icon name="arrowUpRight" size={11} />
              </button>
            )}
          </div>

          {/* Characteristics & Overrides */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ds-text)' }}>
                  Offering Characteristics ({characteristics.length})
                </span>
                {charSearch && (
                  <span style={{ fontSize: '11px', color: 'var(--ds-brand)', fontWeight: '600' }}>
                    ({filteredChars.length} matched)
                  </span>
                )}
              </div>

              {/* Search Filter */}
              <div style={{ position: 'relative', width: '240px' }}>
                <input
                  type="text"
                  value={charSearch}
                  onChange={(e) => setCharSearch(e.target.value)}
                  placeholder="Filter characteristics..."
                  style={{
                    width: '100%',
                    padding: '5px 28px 5px 10px',
                    fontSize: '11.5px',
                    borderRadius: '5px',
                    border: '1px solid var(--ds-border)',
                    background: 'var(--ds-surface)',
                    color: 'var(--ds-text)'
                  }}
                />
                {charSearch ? (
                  <button
                    type="button"
                    onClick={() => setCharSearch('')}
                    style={{
                      position: 'absolute',
                      right: '6px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--ds-text-3)',
                      padding: 0
                    }}
                  >
                    <Icon name="x" size={12} />
                  </button>
                ) : (
                  <Icon
                    name="search"
                    size={12}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ds-text-3)' }}
                  />
                )}
              </div>
            </div>

            {/* Characteristics Table */}
            <div style={{
              border: '1px solid var(--ds-border)',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#ffffff'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                <thead>
                  <tr style={{ background: 'var(--ds-surface-2)', borderBottom: '1px solid var(--ds-border)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: '700', color: 'var(--ds-text-2)', width: '40%' }}>
                      Characteristic Name
                    </th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: '700', color: 'var(--ds-text-2)', width: '60%' }}>
                      Configured Value(s)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChars.length === 0 ? (
                    <tr>
                      <td colSpan={2} style={{ padding: '16px', textAlign: 'center', color: 'var(--ds-text-3)', fontStyle: 'italic' }}>
                        No characteristics matched "{charSearch}".
                      </td>
                    </tr>
                  ) : (
                    filteredChars.map((ch, idx) => (
                      <tr
                        key={`${ch.name}_${idx}`}
                        style={{
                          borderBottom: idx === filteredChars.length - 1 ? 'none' : '1px solid var(--ds-surface-2)',
                          background: idx % 2 === 0 ? '#ffffff' : 'var(--ds-surface-subtle)'
                        }}
                      >
                        <td style={{ padding: '8px 12px', verticalAlign: 'top' }}>
                          <span style={{ fontWeight: '600', color: 'var(--ds-text)', fontFamily: 'var(--ds-font-mono)', fontSize: '11px' }}>
                            {ch.name}
                          </span>
                          {ch.valueType && (
                            <span style={{ fontSize: '10px', color: 'var(--ds-text-3)', marginLeft: '6px' }}>
                              ({ch.valueType})
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px 12px', verticalAlign: 'top' }}>
                          {ch.values.length > 1 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {ch.values.map((v, vIdx) => (
                                <code
                                  key={vIdx}
                                  style={{
                                    fontFamily: 'var(--ds-font-mono)',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    color: 'var(--ds-brand-dark)',
                                    background: 'var(--ds-surface-2)',
                                    padding: '1px 6px',
                                    borderRadius: '3px',
                                    border: '1px solid var(--ds-border)'
                                  }}
                                >
                                  {v}
                                </code>
                              ))}
                            </div>
                          ) : (
                            <code style={{
                              fontFamily: 'var(--ds-font-mono)',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: 'var(--ds-text)',
                              background: 'var(--ds-surface-2)',
                              padding: '1px 6px',
                              borderRadius: '3px'
                            }}>
                              {ch.values[0] !== undefined ? ch.values[0] : '—'}
                            </code>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Categories Section (if any) */}
          {categories.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ds-text)' }}>
                Assigned Categories ({categories.length})
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {categories.map(cat => (
                  <span
                    key={cat.id}
                    style={{
                      fontFamily: 'var(--ds-font-mono)',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      color: 'var(--ds-brand-dark)',
                      background: 'rgba(230,0,0,0.06)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(230,0,0,0.2)'
                    }}
                  >
                    {cat.id} {cat.name && cat.name !== cat.id ? `· ${cat.name}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── Modal Footer ─── */}
        <div style={{
          padding: '14px 24px',
          borderTop: `1px solid ${C.cardBorder || '#e2e8f0'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--ds-surface-subtle)'
        }}>
          <div>
            {loading && (
              <span style={{ fontSize: '11px', color: 'var(--ds-text-3)', fontStyle: 'italic' }}>
                Loading catalog details...
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onNavigateToEntity && (rawEntity.id || offerId) && (
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  onNavigateToEntity(rawEntity || offerId, 'ProductOffering');
                }}
                style={{
                  background: 'var(--ds-brand)',
                  border: '1px solid var(--ds-brand-dark)',
                  color: '#ffffff',
                  borderRadius: '6px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 2px rgba(230,0,0,0.2)'
                }}
                title="Open full Product Offering in Drawer"
              >
                <span>Open in Drawer</span>
                <Icon name="arrowUpRight" size={13} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--ds-surface)',
                border: '1px solid var(--ds-border)',
                borderRadius: '6px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--ds-text)',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
