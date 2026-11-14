import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  allEntities = [],
  activeEnv,
  token,
  onNavigateToEntity,
  copyToClipboard,
  copiedKey
}) {
  const raw = item?.raw || item || {};
  const categoryId = item?.id || raw.id;
  const isRoot = Boolean(raw.isRoot === true || !raw.parentId);
  const parent = raw.parent || (raw.parentId ? { id: raw.parentId, name: raw.parentId } : null);
  const subCategories = Array.isArray(raw.subCategory) ? raw.subCategory : [];

  // Tab State: 'structure' (Hierarchy & Subcategories) or 'offers' (Offerings)
  const [activeSubTab, setActiveSubTab] = useState('structure');
  const [offers, setOffers] = useState([]);
  const [totalOffersCount, setTotalOffersCount] = useState(null);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [offersError, setOffersError] = useState(null);
  const [offerSearch, setOfferSearch] = useState('');
  const hasFetchedRef = useRef(false);

  // Compute instant in-memory matches from allEntities if already available in parent view
  const instantMatches = useMemo(() => {
    if (!Array.isArray(allEntities) || allEntities.length === 0 || !categoryId) return [];
    return allEntities.filter(e => {
      const groupings = e.raw?.extensions?.categoryGroupings || e.extensions?.categoryGroupings || [];
      return groupings.some(g => (g.category || []).some(c => String(c.id).toLowerCase() === String(categoryId).toLowerCase()));
    });
  }, [allEntities, categoryId]);

  // Fetch assigned product offerings on demand
  const fetchOffers = useCallback(async (forceRefresh = false) => {
    if (!categoryId) return;
    setIsLoadingOffers(true);
    setOffersError(null);

    try {
      const isTest = (activeEnv?.name && activeEnv.name.toLowerCase().includes('test')) || (activeEnv?.apiUrl && activeEnv.apiUrl.toLowerCase().includes('test'));
      const envName = activeEnv?.name || localStorage.getItem('dnext_env_name') || (isTest ? 'dpc_ui.test-g' : 'Default (dev-gcu)');
      const apiUrl = activeEnv?.apiUrl || localStorage.getItem('dnext_api_url') || (isTest ? 'https://dpc-api.test-gcu.com' : 'https://dpc-api.pi.dev-gcu.com');
      const authUrl = activeEnv?.authUrl || localStorage.getItem('dnext_auth_url') || (isTest ? 'https://diam.test-gcu.com/realms/orbitant-realm/protocol/openid-connect/token' : 'https://diam.pi.dev-gcu.com/realms/orbitant-realm/protocol/openid-connect/token');

      const headers = {
        'Accept': 'application/json',
        'x-dnext-api-url': apiUrl,
        'x-dnext-auth-url': authUrl,
        'x-dnext-env-name': envName,
      };

      const storedToken = token || localStorage.getItem('dnext_token');
      if (storedToken) {
        headers['Authorization'] = storedToken.startsWith('Bearer ') ? storedToken : `Bearer ${storedToken}`;
      }

      const refreshParam = forceRefresh ? '&refresh=true' : '';
      const url = `/api/dnext/product-offerings?extensions.categoryGroupings.category.id=${encodeURIComponent(categoryId)}&limit=100${refreshParam}`;

      const res = await fetch(url, { headers });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.reason || `Remote server responded with ${res.status}`);
      }

      const totalCountHeader = res.headers.get('x-total-count');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.items || []);

      setOffers(list);
      setTotalOffersCount(totalCountHeader ? parseInt(totalCountHeader, 10) : list.length);
      hasFetchedRef.current = true;
    } catch (err) {
      console.warn('[CategoryDetailTemplate] Error fetching assigned offers:', err);
      // Fallback to instant client matches if remote call fails
      if (instantMatches.length > 0) {
        setOffers(instantMatches);
        setTotalOffersCount(instantMatches.length);
      } else {
        setOffersError(err.message || 'Failed to load assigned offers');
      }
    } finally {
      setIsLoadingOffers(false);
    }
  }, [categoryId, activeEnv, token, instantMatches]);

  // Reset tab data when category ID changes
  useEffect(() => {
    hasFetchedRef.current = false;
    setOffers(instantMatches.length > 0 ? instantMatches : []);
    setTotalOffersCount(instantMatches.length > 0 ? instantMatches.length : null);
    setOffersError(null);
    setOfferSearch('');

    if (activeSubTab === 'offers') {
      fetchOffers();
    }
  }, [categoryId]);

  // Helper to extract matched category groupings for an offer
  const getMatchedGroupings = useCallback((offer) => {
    const rawOffer = offer.raw || offer;
    const groupings = rawOffer.extensions?.categoryGroupings || [];
    return groupings.filter(g => (g.category || []).some(c => String(c.id).toLowerCase() === String(categoryId).toLowerCase()));
  }, [categoryId]);

  // Filter offers by in-drawer search query
  const filteredOffers = useMemo(() => {
    if (!offerSearch.trim()) return offers;
    const q = offerSearch.toLowerCase().trim();
    return offers.filter(o => {
      const nameMatch = (o.name || '').toLowerCase().includes(q);
      const idMatch = (o.id || '').toLowerCase().includes(q);
      const statusMatch = (o.lifecycleStatus || '').toLowerCase().includes(q);
      const matchedG = getMatchedGroupings(o);
      const skuMatch = matchedG.some(g => (g.name || '').toLowerCase().includes(q) || (g.id || '').toLowerCase().includes(q));
      return nameMatch || idMatch || statusMatch || skuMatch;
    });
  }, [offers, offerSearch, getMatchedGroupings]);

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
        <div style={{ flex: '1 1 340px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
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

        {/* Counter Stat Badges */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Subcategories Stat */}
          <div
            onClick={() => setActiveSubTab('structure')}
            style={{
              background: '#ffffff',
              border: activeSubTab === 'structure' ? '1px solid var(--ds-info)' : '1px solid rgba(2,132,199,0.2)',
              borderRadius: '10px',
              padding: '14px 18px',
              textAlign: 'center',
              minWidth: '120px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Click to view Direct Subcategories"
          >
            <div style={{ fontSize: '11px', color: 'var(--ds-info)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
              Subcategories
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: C.text, marginTop: '2px' }}>
              {subCategories.length}
            </div>
            <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>
              Child nodes
            </div>
          </div>

          {/* Offerings Stat */}
          <div
            onClick={() => {
              setActiveSubTab('offers');
              if (!hasFetchedRef.current) fetchOffers();
            }}
            style={{
              background: '#ffffff',
              border: activeSubTab === 'offers' ? '1px solid var(--ds-brand)' : '1px solid var(--ds-border)',
              borderRadius: '10px',
              padding: '14px 18px',
              textAlign: 'center',
              minWidth: '130px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Click to view Assigned Offerings"
          >
            <div style={{ fontSize: '11px', color: 'var(--ds-brand)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
              Offerings
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: C.text, marginTop: '2px' }}>
              {isLoadingOffers ? (
                <span style={{ fontSize: '18px', color: 'var(--ds-brand)' }}>...</span>
              ) : (
                totalOffersCount !== null ? totalOffersCount : (instantMatches.length > 0 ? instantMatches.length : '—')
              )}
            </div>
            <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>
              Assigned offers
            </div>
          </div>
        </div>
      </div>

      {/* ─── Dynamic Sub-Tabs Navigation Bar ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--ds-border)',
        paddingBottom: '12px',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('structure')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              border: activeSubTab === 'structure' ? '1px solid var(--ds-info)' : '1px solid var(--ds-border)',
              background: activeSubTab === 'structure' ? 'rgba(2,132,199,0.08)' : '#ffffff',
              color: activeSubTab === 'structure' ? 'var(--ds-info)' : C.text,
              transition: 'all 0.15s ease'
            }}
          >
            <Icon name="folder" size={15} />
            <span>Structure & Hierarchy</span>
            <span style={{
              fontSize: '11px',
              background: activeSubTab === 'structure' ? 'rgba(2,132,199,0.2)' : 'var(--ds-surface-2)',
              color: activeSubTab === 'structure' ? 'var(--ds-info)' : C.muted,
              padding: '1px 7px',
              borderRadius: '10px',
              fontWeight: '700'
            }}>
              {subCategories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('offers');
              if (!hasFetchedRef.current) fetchOffers();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              border: activeSubTab === 'offers' ? '1px solid var(--ds-brand)' : '1px solid var(--ds-border)',
              background: activeSubTab === 'offers' ? 'rgba(230,0,0,0.06)' : '#ffffff',
              color: activeSubTab === 'offers' ? 'var(--ds-brand)' : C.text,
              transition: 'all 0.15s ease'
            }}
          >
            <Icon name="package" size={15} />
            <span>Offerings</span>
            {totalOffersCount !== null ? (
              <span style={{
                fontSize: '11px',
                background: activeSubTab === 'offers' ? 'var(--ds-brand)' : 'var(--ds-surface-2)',
                color: activeSubTab === 'offers' ? '#ffffff' : C.muted,
                padding: '1px 7px',
                borderRadius: '10px',
                fontWeight: '700'
              }}>
                {totalOffersCount}
              </span>
            ) : isLoadingOffers ? (
              <span style={{ fontSize: '11px', color: 'var(--ds-brand)' }}>...</span>
            ) : null}
          </button>
        </div>

        {/* Tab 2 Quick Action Bar (when Offerings tab active) */}
        {activeSubTab === 'offers' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => fetchOffers(true)}
              disabled={isLoadingOffers}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: isLoadingOffers ? 'wait' : 'pointer',
                border: '1px solid var(--ds-border)',
                background: '#ffffff',
                color: C.text
              }}
              title="Force reload assigned offerings from DNEXT"
            >
              <Icon name="refresh" size={13} style={{ transform: isLoadingOffers ? 'rotate(180deg)' : 'none', transition: 'transform 0.5s ease' }} />
              <span>{isLoadingOffers ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── TAB 1: STRUCTURE & HIERARCHY ─── */}
      {activeSubTab === 'structure' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Parent Category Reference (if not root) */}
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
                      background: '#ffffff',
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

          {/* Child Subcategories Section */}
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
      )}

      {/* ─── TAB 2: ASSIGNED OFFERINGS (Dynamic Tab) ─── */}
      {activeSubTab === 'offers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Controls Bar: Search & Status */}
          <div style={{
            background: C.panel,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: '10px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 280px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
                <input
                  type="text"
                  value={offerSearch}
                  onChange={(e) => setOfferSearch(e.target.value)}
                  placeholder="Filter by offering name, ID, or SKU..."
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 32px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid var(--ds-border)',
                    outline: 'none',
                    background: '#ffffff',
                    color: C.text
                  }}
                />
                <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }}>
                  <Icon name="search" size={14} />
                </div>
                {offerSearch && (
                  <button
                    type="button"
                    onClick={() => setOfferSearch('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: C.muted,
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: C.muted }}>
              <span>
                {filteredOffers.length} {filteredOffers.length === 1 ? 'offering' : 'offerings'}
                {totalOffersCount !== null && totalOffersCount !== filteredOffers.length ? ` (of ${totalOffersCount} total)` : ''}
              </span>
              <span style={{ color: 'var(--ds-border)' }}>|</span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--ds-font-mono)' }}>
                Query: extensions.categoryGroupings.category.id={categoryId}
              </span>
            </div>
          </div>

          {/* Error Notice */}
          {offersError && (
            <div style={{
              background: 'var(--ds-danger-soft)',
              border: '1px solid var(--ds-danger-border)',
              borderRadius: '8px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              color: 'var(--ds-brand-text)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name="alert" size={16} />
                <span style={{ fontSize: '13px' }}>{offersError}</span>
              </div>
              <button
                type="button"
                onClick={() => fetchOffers(true)}
                style={{
                  background: 'var(--ds-danger)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoadingOffers && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2, 3].map(n => (
                <div
                  key={n}
                  style={{
                    background: '#ffffff',
                    border: `1px solid ${C.cardBorder}`,
                    borderRadius: '8px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    opacity: 0.6
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ height: '18px', width: '220px', background: 'var(--ds-surface-2)', borderRadius: '4px' }} />
                    <div style={{ height: '18px', width: '70px', background: 'var(--ds-surface-2)', borderRadius: '4px' }} />
                  </div>
                  <div style={{ height: '14px', width: '140px', background: 'var(--ds-surface-subtle)', borderRadius: '4px' }} />
                </div>
              ))}
            </div>
          )}

          {/* Offers List */}
          {!isLoadingOffers && filteredOffers.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredOffers.map((offer, idx) => {
                const rawOffer = offer.raw || offer;
                const matchedGroupings = getMatchedGroupings(offer);
                const isBundle = Boolean(offer.isBundle || rawOffer.isBundle || (Array.isArray(rawOffer.bundledProductOffering) && rawOffer.bundledProductOffering.length > 0));

                return (
                  <div
                    key={offer.id ? `${offer.id}-${offer.version || idx}` : idx}
                    style={{
                      background: '#ffffff',
                      border: `1px solid ${C.cardBorder}`,
                      borderRadius: '10px',
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          background: isBundle ? 'rgba(124,58,237,0.1)' : 'rgba(230,0,0,0.08)',
                          color: isBundle ? 'var(--ds-purple, #7c3aed)' : 'var(--ds-brand)',
                          border: `1px solid ${isBundle ? 'rgba(124,58,237,0.25)' : 'rgba(230,0,0,0.25)'}`,
                          padding: '2px 8px',
                          borderRadius: '5px'
                        }}>
                          {isBundle ? 'Bundle Offer' : 'Product Offering'}
                        </span>

                        <span
                          onClick={() => onNavigateToEntity && onNavigateToEntity(offer, 'ProductOffering')}
                          style={{
                            fontSize: '15px',
                            fontWeight: '700',
                            color: onNavigateToEntity ? 'var(--ds-brand-dark)' : C.text,
                            cursor: onNavigateToEntity ? 'pointer' : 'default',
                            textDecoration: onNavigateToEntity ? 'underline' : 'none'
                          }}
                          onMouseEnter={(e) => { if (onNavigateToEntity) e.currentTarget.style.color = 'var(--ds-brand)'; }}
                          onMouseLeave={(e) => { if (onNavigateToEntity) e.currentTarget.style.color = 'var(--ds-brand-dark)'; }}
                          title={`Click to open detail view for ${offer.name || offer.id}`}
                        >
                          {offer.name || offer.id}
                        </span>

                        <VersionCell version={offer.version || '0'} />
                        <LifecyclePill status={offer.lifecycleStatus || 'In study'} />
                      </div>

                      {/* Navigation Action Button */}
                      {onNavigateToEntity && (
                        <button
                          type="button"
                          onClick={() => onNavigateToEntity(offer, 'ProductOffering')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#ffffff',
                            border: '1px solid var(--ds-border-strong)',
                            borderRadius: '6px',
                            color: 'var(--ds-brand)',
                            fontSize: '12px',
                            fontWeight: '700',
                            padding: '5px 12px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--ds-brand)';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.borderColor = 'var(--ds-brand)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.color = 'var(--ds-brand)';
                            e.currentTarget.style.borderColor = 'var(--ds-border-strong)';
                          }}
                        >
                          <span>View Offering</span>
                          <span>→</span>
                        </button>
                      )}
                    </div>

                    {/* ID and Description Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: C.muted }}>ID:</span>
                        <code style={{ fontSize: '12px', color: 'var(--ds-warn)', fontFamily: 'var(--ds-font-mono)' }}>
                          {offer.id}
                        </code>
                        {copyToClipboard && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(offer.id, `po-${offer.id}`)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: copiedKey === `po-${offer.id}` ? 'var(--ds-ok)' : C.muted,
                              cursor: 'pointer',
                              fontSize: '11px',
                              padding: '2px 4px'
                            }}
                          >
                            {copiedKey === `po-${offer.id}` ? '✓' : 'Copy'}
                          </button>
                        )}
                      </div>

                      {offer.description && (
                        <span style={{ fontSize: '12px', color: C.muted, maxWidth: '480px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          — {offer.description}
                        </span>
                      )}
                    </div>

                    {/* Matched Category Groupings Context */}
                    {matchedGroupings.length > 0 && (
                      <div style={{
                        background: 'var(--ds-surface-subtle)',
                        border: '1px solid var(--ds-border)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Mapped via Contract SKU Grouping:
                        </span>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {matchedGroupings.map((g, gi) => (
                            <span
                              key={gi}
                              style={{
                                fontSize: '11px',
                                fontFamily: 'var(--ds-font-mono)',
                                background: '#ffffff',
                                border: '1px solid var(--ds-border)',
                                color: 'var(--ds-info)',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                fontWeight: '600'
                              }}
                              title={`Category ${categoryId} is assigned under grouping: ${g.name || g.id}`}
                            >
                              🏷️ {g.name || g.id}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!isLoadingOffers && filteredOffers.length === 0 && (
            <div style={{
              background: '#ffffff',
              border: `1px dashed ${C.cardBorder}`,
              borderRadius: '10px',
              padding: '36px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'var(--ds-surface-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: C.muted
              }}>
                <Icon name="package" size={22} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '700', color: C.text }}>
                  {offerSearch ? 'No matching offerings found' : 'No Offerings directly assigned to this category'}
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: C.muted, maxWidth: '520px', lineHeight: '1.5' }}>
                  {offerSearch ? (
                    `No offerings match the search term "${offerSearch}". Try clearing your search.`
                  ) : (
                    <>
                      In Vodafone DNEXT, product offerings are assigned to categories under contract duration groupings (<code style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '11px' }}>extensions.categoryGroupings</code>). Child subcategories under this node may contain the assigned offerings.
                    </>
                  )}
                </p>
              </div>

              {offerSearch ? (
                <button
                  type="button"
                  onClick={() => setOfferSearch('')}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--ds-border)',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    color: C.text
                  }}
                >
                  Clear search
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => fetchOffers(true)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--ds-border)',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    color: 'var(--ds-brand)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Icon name="refresh" size={12} />
                  <span>Check DNEXT Gateway again</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
