import React, { useState, useEffect, useMemo } from 'react';
import Icon from './ui/Icon';
import { LifecyclePill, EntityTypeBadge, VersionCell } from './list-views/cellRenderers';
import { resolveTemplateId, getAvailableTemplates, TEMPLATES } from './detail-templates/viewTemplateRegistry';
import SalesPackageDetailTemplate from './detail-templates/SalesPackageDetailTemplate';
import BundleCompositionDetailTemplate from './detail-templates/BundleCompositionDetailTemplate';
import StandardOfferingDetailTemplate, { getChildPopRole, findMatchingSimpleOffer } from './detail-templates/StandardOfferingDetailTemplate';
import ProductOfferingPriceDetailTemplate from './detail-templates/ProductOfferingPriceDetailTemplate';
import ProductSpecificationDetailTemplate from './detail-templates/ProductSpecificationDetailTemplate';
import CategoryDetailTemplate from './detail-templates/CategoryDetailTemplate';
import SalesPackageNewDetailTemplate from './detail-templates/SalesPackageNewDetailTemplate';

// Design tokens (Vodafone Light Theme)
const C = {
  bg: '#ffffff',
  panel: '#ffffff',
  panelHeader: 'var(--ds-surface-subtle)',
  border: 'var(--ds-border)',
  text: 'var(--ds-text)',
  muted: 'var(--ds-text-2)',
  indigo: 'var(--ds-brand)',
  vodafoneRed: 'var(--ds-brand)',
  accent: 'var(--ds-brand)',
  success: 'var(--ds-ok)',
  warning: 'var(--ds-warn)',
  danger: 'var(--ds-brand)'
};

const ENTITY_TYPE_ICONS = {
  ProductOffering: '',
  ProductOfferingPrice: '',
  ProductSpecification: '',
  Category: ''
};

class DrawerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('DrawerErrorBoundary caught error:', error, errorInfo);
  }
  componentDidUpdate(prevProps) {
    if (prevProps.itemKey !== this.props.itemKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', background: 'var(--ds-danger-soft)', border: '1px solid var(--ds-danger-border)', borderRadius: '8px', color: 'var(--ds-brand-text)' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '700' }}><Icon name="alert" size={14} /> Render Error in Template</h4>
          <p style={{ margin: '0 0 12px 0', fontSize: '12px' }}>{this.state.error?.message || 'An unexpected rendering error occurred.'}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ background: 'var(--ds-danger)', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '5px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
          >
            Retry Render
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function DnextEntityDrawer({ item, isOpen, onClose, onPurge, allEntities = [], activeEnv, token, onSuccessRefresh, zIndex = 1200 }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [charSearch, setCharSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  // Active item in drawer with in-drawer navigation history
  const [activeItem, setActiveItem] = useState(item);
  const [navHistory, setNavHistory] = useState([]);

  // Sync when prop item or isOpen changes from outside
  useEffect(() => {
    setActiveItem(item);
    setNavHistory([]);
    if (item && (item.entityType === 'Category' || String(item.id).startsWith('FN')) && (!item.raw || !item.raw.subCategory)) {
      fetch('/api/dnext/categories?limit=1000')
        .then(res => res.ok ? res.json() : [])
        .then(categories => {
          if (Array.isArray(categories)) {
            const match = categories.find(c => c.id && String(c.id).toLowerCase() === String(item.id).toLowerCase());
            if (match) {
              setActiveItem(prev => {
                if (prev && String(prev.id).toLowerCase() === String(item.id).toLowerCase()) {
                  return {
                    ...prev,
                    name: match.name || prev.name,
                    version: match.version !== undefined ? String(match.version) : prev.version,
                    lifecycleStatus: match.lifecycleStatus || prev.lifecycleStatus,
                    raw: match
                  };
                }
                return prev;
              });
            }
          }
        })
        .catch(() => {});
    }
  }, [item?.id, item?.version, isOpen]);

  const currentItem = activeItem || item;

  // Template Resolver Engine state
  const autoTemplateId = useMemo(() => resolveTemplateId(currentItem), [currentItem]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(autoTemplateId);
  const [isUserOverridden, setIsUserOverridden] = useState(false);
  const availableTemplates = useMemo(() => getAvailableTemplates(currentItem), [currentItem]);

  // Close on Escape key (exit fullscreen first, then close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

  // Reset tab & template when currentItem changes
  useEffect(() => {
    if (currentItem) {
      const resolved = resolveTemplateId(currentItem);
      setSelectedTemplateId(resolved);
      setIsUserOverridden(false);
      setActiveTab('overview');
      setCharSearch('');
    }
  }, [currentItem?.id, currentItem?.version]);

  // In-drawer navigation handlers
  const handleNavigateToEntity = (targetObj, explicitType = null) => {
    if (!targetObj) return;
    const targetId = typeof targetObj === 'string' ? targetObj : (targetObj.id || targetObj.name);

    let nextEntity = null;
    if (Array.isArray(allEntities) && allEntities.length > 0) {
      nextEntity = allEntities.find(e =>
        (e.id && targetId && String(e.id).toLowerCase() === String(targetId).toLowerCase()) ||
        (e.raw?.id && targetId && String(e.raw.id).toLowerCase() === String(targetId).toLowerCase())
      );
    }

    const entityType = explicitType || targetObj.entityType || 'ProductOfferingPrice';

    if (!nextEntity) {
      nextEntity = {
        id: targetId,
        name: targetObj.name || targetId,
        entityType,
        version: targetObj.version !== undefined ? String(targetObj.version) : '0',
        lifecycleStatus: targetObj.lifecycleStatus || 'In study',
        raw: targetObj.raw || (typeof targetObj === 'object' ? targetObj : { id: targetId })
      };
    }

    if (currentItem) {
      setNavHistory(prev => [...prev, currentItem]);
    }
    setActiveItem(nextEntity);

    // Asynchronously enrich if full raw details are not already populated
    if (entityType === 'ProductOfferingPrice' && (!nextEntity.raw || !nextEntity.raw.priceType)) {
      fetch('/api/dnext/product-offering-prices?limit=1000')
        .then(res => res.ok ? res.json() : [])
        .then(prices => {
          if (Array.isArray(prices)) {
            const match = prices.find(p => p.id && String(p.id).toLowerCase() === String(targetId).toLowerCase());
            if (match) {
              setActiveItem(prev => {
                if (prev && String(prev.id).toLowerCase() === String(targetId).toLowerCase()) {
                  return {
                    ...prev,
                    name: match.name || prev.name,
                    version: match.version !== undefined ? String(match.version) : prev.version,
                    lifecycleStatus: match.lifecycleStatus || prev.lifecycleStatus,
                    raw: match
                  };
                }
                return prev;
              });
            }
          }
        })
        .catch(() => {});
    } else if (entityType === 'ProductOffering' && (!nextEntity.raw || !nextEntity.raw.productSpecification)) {
      fetch('/api/dnext/product-offerings?limit=1000')
        .then(res => res.ok ? res.json() : [])
        .then(offers => {
          if (Array.isArray(offers)) {
            const match = offers.find(o => o.id && String(o.id).toLowerCase() === String(targetId).toLowerCase());
            if (match) {
              setActiveItem(prev => {
                if (prev && String(prev.id).toLowerCase() === String(targetId).toLowerCase()) {
                  return {
                    ...prev,
                    name: match.name || prev.name,
                    version: match.version !== undefined ? String(match.version) : prev.version,
                    lifecycleStatus: match.lifecycleStatus || prev.lifecycleStatus,
                    raw: match
                  };
                }
                return prev;
              });
            }
          }
        })
        .catch(() => {});
    } else if (entityType === 'Category' && (!nextEntity.raw || !nextEntity.raw.subCategory)) {
      fetch('/api/dnext/categories?limit=1000')
        .then(res => res.ok ? res.json() : [])
        .then(categories => {
          if (Array.isArray(categories)) {
            const match = categories.find(c => c.id && String(c.id).toLowerCase() === String(targetId).toLowerCase());
            if (match) {
              setActiveItem(prev => {
                if (prev && String(prev.id).toLowerCase() === String(targetId).toLowerCase()) {
                  return {
                    ...prev,
                    name: match.name || prev.name,
                    version: match.version !== undefined ? String(match.version) : prev.version,
                    lifecycleStatus: match.lifecycleStatus || prev.lifecycleStatus,
                    raw: match
                  };
                }
                return prev;
              });
            }
          }
        })
        .catch(() => {});
    }
  };

  const handleBack = () => {
    if (navHistory.length === 0) return;
    const previous = navHistory[navHistory.length - 1];
    setNavHistory(prev => prev.slice(0, -1));
    setActiveItem(previous);
  };

  const handleNavigateToHistoryIndex = (index) => {
    if (index < 0 || index >= navHistory.length) return;
    const target = navHistory[index];
    setNavHistory(prev => prev.slice(0, index));
    setActiveItem(target);
  };

  if (!isOpen || !currentItem) return null;

  const raw = currentItem.raw || {};
  const isOffering = currentItem.entityType === 'ProductOffering';
  const isPop = currentItem.entityType === 'ProductOfferingPrice';
  const isSpec = currentItem.entityType === 'ProductSpecification';
  const isCategory = currentItem.entityType === 'Category';

  const isLaunched = (currentItem.lifecycleStatus || '').toLowerCase() === 'launched';
  const isInTest = (currentItem.lifecycleStatus || '').toLowerCase() === 'in test';
  const isInStudy = (currentItem.lifecycleStatus || '').toLowerCase() === 'in study';

  const statusColor = isLaunched ? 'var(--ds-ok)' : isInTest ? 'var(--ds-info)' : isInStudy ? 'var(--ds-warn)' : 'var(--ds-text-2)';
  const statusBg = isLaunched ? 'rgba(16,185,129,0.1)' : isInTest ? 'rgba(2,132,199,0.1)' : isInStudy ? 'rgba(245,158,11,0.1)' : 'var(--ds-surface-2)';
  const statusBorder = isLaunched ? 'rgba(16,185,129,0.3)' : isInTest ? 'rgba(2,132,199,0.3)' : isInStudy ? 'rgba(245,158,11,0.3)' : 'var(--ds-border-strong)';

  // Copy helper
  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Offering / Entity attributes
  const pops = Array.isArray(raw.productOfferingPrice) ? raw.productOfferingPrice : [];
  const spec = raw.productSpecification || null;
  const bundledOffers = Array.isArray(raw.bundledProductOffering) ? raw.bundledProductOffering : [];
  const chars = Array.isArray(raw.prodSpecCharValueUse)
    ? raw.prodSpecCharValueUse
    : (Array.isArray(raw.productSpecCharacteristic) ? raw.productSpecCharacteristic : []);
  const terms = Array.isArray(raw.productOfferingTerm) ? raw.productOfferingTerm : [];
  const categoryGroupings = raw.extensions?.categoryGroupings || [];
  const subCategories = Array.isArray(raw.subCategory) ? raw.subCategory : [];

  // Filtered characteristics
  const filteredChars = chars.filter(c => {
    if (!charSearch.trim()) return true;
    const q = charSearch.toLowerCase();
    const nameMatch = (c.name || '').toLowerCase().includes(q);
    const valueMatch = Array.isArray(c.productSpecCharacteristicValue) &&
      c.productSpecCharacteristicValue.some(v => String(v.value || '').toLowerCase().includes(q));
    return nameMatch || valueMatch;
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex, display: 'flex', justifyContent: 'flex-end' }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          transition: 'opacity 0.25s ease'
        }}
      />

      {/* Drawer Container */}
      <div
        style={{
          position: 'relative',
          zIndex: zIndex + 1,
          width: isFullscreen ? '100vw' : '740px',
          maxWidth: '100vw',
          height: '100vh',
          background: C.bg,
          borderLeft: isFullscreen ? 'none' : `1px solid ${C.border}`,
          boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden'
        }}
      >
        {/* ─── Drawer Header ─── */}
        <div
          style={{
            padding: '16px 24px',
            background: C.panelHeader,
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flexShrink: 0
          }}
        >
          {/* Top row controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            {/* Left Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
              <EntityTypeBadge
                type={currentItem.entityType}
                label={currentItem.isNew ? 'New Sales Package' : undefined}
              />

              {/* Version Badge */}
              <VersionCell version={currentItem.version || '0'} />

              {/* Lifecycle Status Badge */}
              <LifecyclePill status={currentItem.isNew ? 'Draft / In study' : currentItem.lifecycleStatus} />

              {raw.isBundle && (
                <EntityTypeBadge
                  type="bundle"
                  label="Bundle Offer"
                  icon="layers"
                />
              )}

              {/* POP price badge if POP */}
              {isPop && raw.price && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--ds-warn)',
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {raw.price.value} {raw.price.unit || 'EUR'}
                  {raw.recurringChargePeriodType ? ` / ${raw.recurringChargePeriodType}` : ''}
                </span>
              )}
            </div>

            {/* Top-Right Action & Window Controls: Always pinned to top right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {!currentItem.isNew && (
                <button
                  onClick={() => setActiveTab(activeTab === 'rawJson' ? 'overview' : 'rawJson')}
                  style={{
                    background: activeTab === 'rawJson' ? 'rgba(230,0,0,0.08)' : '#ffffff',
                    border: `1px solid ${activeTab === 'rawJson' ? 'var(--ds-brand)' : C.border}`,
                    color: activeTab === 'rawJson' ? 'var(--ds-brand)' : C.text,
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s'
                  }}
                  title={activeTab === 'rawJson' ? "Return to Detail View" : "View Raw TMF JSON"}
                >
                  <span><Icon name="eye" size={14} /></span>
                  <span>{activeTab === 'rawJson' ? 'Detail View' : 'JSON'}</span>
                </button>
              )}

              {/* Windowed / Fullscreen icon button */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                style={{
                  background: isFullscreen ? 'rgba(230,0,0,0.08)' : '#ffffff',
                  border: `1px solid ${isFullscreen ? 'var(--ds-brand)' : C.border}`,
                  color: isFullscreen ? 'var(--ds-brand)' : C.text,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '32px',
                  height: '32px',
                  transition: 'all 0.15s'
                }}
                title={isFullscreen ? 'Exit Fullscreen / Windowed (Esc)' : 'Expand to Fullscreen (⤢)'}
                aria-label={isFullscreen ? 'Windowed' : 'Fullscreen'}
              >
                <span>{isFullscreen ? '⤡' : '⤢'}</span>
              </button>

              {/* Close button */}
              <button
                onClick={onClose}
                style={{
                  background: '#ffffff',
                  border: `1px solid ${C.border}`,
                  color: C.text,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '32px',
                  height: '32px',
                  transition: 'all 0.15s'
                }}
                title="Close Drawer (Esc)"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Second Row: Navigation Back Button & Template / Layout Selector */}
          {!currentItem.isNew && (availableTemplates.length > 1 || navHistory.length > 0) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              flexWrap: 'wrap',
              paddingTop: '2px'
            }}>
              {/* Left side: Back Button & Full Clickable Breadcrumb Trail */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {navHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    style={{
                      background: 'rgba(230,0,0,0.06)',
                      border: '1px solid rgba(230,0,0,0.25)',
                      color: 'var(--ds-brand-dark)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s'
                    }}
                    title={`Return to ${navHistory[navHistory.length - 1].name || navHistory[navHistory.length - 1].id}`}
                  >
                    <span>← Back</span>
                    <span style={{ fontWeight: '700', color: C.text }}>
                      {navHistory[navHistory.length - 1].name || navHistory[navHistory.length - 1].id}
                    </span>
                  </button>
                )}

                {/* Clickable Breadcrumbs for Multi-Level Navigation: Offer › Bundle Offer › Simple Offer */}
                {navHistory.length > 0 && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: C.muted,
                    padding: '3px 8px',
                    background: 'var(--ds-surface-2)',
                    borderRadius: '6px',
                    border: `1px solid var(--ds-border)`,
                    flexWrap: 'wrap'
                  }}>
                    {navHistory.map((histItem, hIdx) => (
                      <React.Fragment key={`${histItem.id}_${hIdx}`}>
                        <span
                          onClick={() => handleNavigateToHistoryIndex(hIdx)}
                          style={{
                            cursor: 'pointer',
                            color: 'var(--ds-brand-dark)',
                            fontWeight: '600',
                            textDecoration: 'underline',
                            textDecorationColor: 'rgba(230,0,0,0.25)',
                            maxWidth: '140px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ds-brand)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ds-brand-dark)'; }}
                          title={`Click to jump directly back to ${histItem.name || histItem.id}`}
                        >
                          {histItem.name || histItem.id}
                        </span>
                        <span style={{ color: 'var(--ds-text-3)', margin: '0 2px' }}>›</span>
                      </React.Fragment>
                    ))}
                    <span style={{
                      fontWeight: '700',
                      color: C.text,
                      maxWidth: '160px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {currentItem.name || currentItem.id}
                    </span>
                  </div>
                )}
              </div>

              {/* Right side: Layout / Template Selector on second line */}
              {availableTemplates.length > 1 && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--ds-surface-subtle)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: `1px solid ${C.border}`,
                  marginLeft: 'auto'
                }}>
                  <span style={{ fontSize: '11px', color: C.muted, fontWeight: '600' }}>Layout:</span>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => {
                      setSelectedTemplateId(e.target.value);
                      setIsUserOverridden(true);
                    }}
                    style={{
                      background: '#ffffff',
                      border: `1px solid ${C.border}`,
                      borderRadius: '5px',
                      color: C.text,
                      fontSize: '12px',
                      fontWeight: '600',
                      padding: '3px 7px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                    title="Switch between configured detail view templates"
                  >
                    {availableTemplates.map(tpl => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name} {(!isUserOverridden && tpl.id === autoTemplateId) ? '(Auto)' : ''}
                      </option>
                    ))}
                  </select>
                  {!isUserOverridden && (
                    <span style={{
                      fontSize: '11px',
                      background: 'rgba(16,185,129,0.1)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      color: 'var(--ds-ok)',
                      padding: '2px 5px',
                      borderRadius: '4px',
                      fontWeight: '700'
                    }}>
                      AUTO
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Title & Copyable ID (hidden for templates with dedicated hero box) */}
          {!currentItem.isNew && !['sales_package', 'standard_offering', 'option_offering', 'hardware'].includes(selectedTemplateId) && (
            <div>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '700', color: C.text, lineHeight: '1.3' }}>
                {currentItem.name || currentItem.id}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: C.muted }}>ID:</span>
                <code style={{ fontSize: '12px', color: 'var(--ds-warn)', background: 'var(--ds-surface-2)', border: '1px solid var(--ds-border)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--ds-font-mono)' }}>
                  {currentItem.id}
                </code>
                <button
                  onClick={() => copyToClipboard(currentItem.id, 'id')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copiedKey === 'id' ? C.success : C.muted,
                    cursor: 'pointer',
                    fontSize: '11px',
                    padding: '2px 6px'
                  }}
                >
                  {copiedKey === 'id' ? '✓ Copied' : 'Copy ID'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── Drawer Body ─── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isFullscreen ? '28px 48px' : '20px 24px', background: C.bg }}>
          {/* TAB 1: OVERVIEW (Dynamic Configured Template) */}
          {activeTab === 'overview' && (
            <DrawerErrorBoundary itemKey={`${currentItem?.id}_${selectedTemplateId}`}>
              {selectedTemplateId === 'sales_package_new' && (
                <SalesPackageNewDetailTemplate
                  allEntities={allEntities}
                  onClose={onClose}
                  onSuccessRefresh={onSuccessRefresh}
                  activeEnv={activeEnv}
                  token={token}
                />
              )}
              {selectedTemplateId === 'sales_package' && (
                <SalesPackageDetailTemplate
                  item={currentItem}
                  allEntities={allEntities}
                  onNavigateToPrice={(pop) => handleNavigateToEntity(pop, 'ProductOfferingPrice')}
                  onNavigateToCategory={(cat) => handleNavigateToEntity(cat, 'Category')}
                  copyToClipboard={copyToClipboard}
                  copiedKey={copiedKey}
                />
              )}
              {selectedTemplateId === 'bundle_composition' && (
                <BundleCompositionDetailTemplate
                  item={currentItem}
                  allEntities={allEntities}
                  onNavigateToEntity={(entity, explicitType) => handleNavigateToEntity(entity, explicitType || 'ProductOffering')}
                  copyToClipboard={copyToClipboard}
                  copiedKey={copiedKey}
                />
              )}
              {selectedTemplateId === 'price_model' && (
                <ProductOfferingPriceDetailTemplate
                  item={currentItem}
                  allEntities={allEntities}
                  onNavigateToEntity={(entity, explicitType) => handleNavigateToEntity(entity, explicitType || 'ProductOfferingPrice')}
                  copyToClipboard={copyToClipboard}
                  copiedKey={copiedKey}
                />
              )}
              {selectedTemplateId === 'specification' && (
                <ProductSpecificationDetailTemplate
                  item={currentItem}
                  copyToClipboard={copyToClipboard}
                  copiedKey={copiedKey}
                />
              )}
              {selectedTemplateId === 'category' && (
                <CategoryDetailTemplate
                  item={currentItem}
                  allEntities={allEntities}
                  activeEnv={activeEnv}
                  token={token}
                  onNavigateToEntity={(entity, explicitType) => handleNavigateToEntity(entity, explicitType || (entity?.isBundle ? 'ProductOffering' : 'Category'))}
                  copyToClipboard={copyToClipboard}
                  copiedKey={copiedKey}
                />
              )}
              {(selectedTemplateId === 'standard_offering' || selectedTemplateId === 'option_offering' || selectedTemplateId === 'hardware') && (
                <StandardOfferingDetailTemplate
                  item={currentItem}
                  allEntities={allEntities}
                  isOptionView={selectedTemplateId === 'option_offering'}
                  isHardwareView={selectedTemplateId === 'hardware'}
                  onNavigateToPrice={(pop) => handleNavigateToEntity(pop, 'ProductOfferingPrice')}
                  onNavigateToCategory={(cat) => handleNavigateToEntity(cat, 'Category')}
                  onNavigateToEntity={(entity, explicitType) => handleNavigateToEntity(entity, explicitType || 'ProductOffering')}
                  copyToClipboard={copyToClipboard}
                  copiedKey={copiedKey}
                />
              )}
            </DrawerErrorBoundary>
          )}

          {/* TAB 2: PRICES & BUNDLES */}
          {activeTab === 'prices' && isOffering && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Attached POPs */}
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: C.muted }}>
                    Attached Product Offering Prices ({pops.length})
                  </div>
                </div>

                {pops.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: C.muted, fontSize: '13px' }}>
                    No Product Offering Prices directly attached to this offer.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pops.map((pop, idx) => {
                      const popId = typeof pop === 'string' ? pop : pop.id;
                      const fullPop = allEntities.find(e => e.entityType === 'ProductOfferingPrice' && (e.id === popId || e.raw?.id === popId))?.raw || (typeof pop === 'object' ? pop : { id: popId });
                      const isBundlePop = Boolean(fullPop.isBundle || (Array.isArray(fullPop.bundledPopRelationship) && fullPop.bundledPopRelationship.length > 0));
                      const childPops = isBundlePop && Array.isArray(fullPop.bundledPopRelationship) ? fullPop.bundledPopRelationship : [];
                      const allOfferings = allEntities.filter(e => e.entityType === 'ProductOffering');

                      return (
                        <div
                          key={idx}
                          style={{
                            background: isBundlePop ? 'linear-gradient(180deg, #ffffff 0%, var(--ds-surface-subtle) 100%)' : 'var(--ds-surface-subtle)',
                            border: isBundlePop ? '1px solid rgba(124,58,237,0.3)' : `1px solid ${C.border}`,
                            borderRadius: '8px',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '10px'
                          }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '14px' }}><Icon name={isBundlePop ? 'layers' : 'tag'} size={14} /></span>
                                <span style={{ fontSize: '13px', fontWeight: '600', color: C.text }}>
                                  {fullPop.name || fullPop.id}
                                </span>
                                {isBundlePop && (
                                  <span style={{ fontSize: '11px', color: 'var(--ds-spec)', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                    Bundle Price (Composite)
                                  </span>
                                )}
                                <span style={{ fontSize: '11px', color: 'var(--ds-ok)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', padding: '1px 6px', borderRadius: '4px' }}>
                                  v{fullPop.version || '1'}
                                </span>
                              </div>
                              <div style={{ fontSize: '11px', color: C.muted, fontFamily: 'var(--ds-font-mono)', marginTop: '4px' }}>
                                {fullPop.id}
                                {fullPop.price?.value !== undefined && (
                                  <span style={{ marginLeft: '8px', fontWeight: '700', color: isBundlePop ? 'var(--ds-spec)' : 'var(--ds-warn)' }}>
                                    &bull; {fullPop.price.value} {fullPop.price.unit || 'EUR'}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => handleNavigateToEntity(fullPop, 'ProductOfferingPrice')}
                                style={{
                                  background: 'rgba(230,0,0,0.06)',
                                  border: '1px solid var(--ds-brand)',
                                  color: 'var(--ds-brand)',
                                  padding: '5px 12px',
                                  borderRadius: '5px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Open Pricing Model View for this POP"
                              >
                                <span><Icon name="search" size={14} /> View Price Model</span>
                                <span>→</span>
                              </button>
                              <button
                                onClick={() => copyToClipboard(fullPop.id, `pop-${idx}`)}
                                style={{
                                  background: '#ffffff',
                                  border: `1px solid ${C.border}`,
                                  color: copiedKey === `pop-${idx}` ? C.success : C.text,
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  cursor: 'pointer'
                                }}
                              >
                                {copiedKey === `pop-${idx}` ? '✓ Copied' : 'Copy ID'}
                              </button>
                            </div>
                          </div>

                          {/* Decomposed simple offers under bundle price */}
                          {isBundlePop && childPops.length > 0 && (
                            <div style={{
                              paddingTop: '10px',
                              borderTop: '1px dashed rgba(124,58,237,0.2)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px'
                            }}>
                              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ds-spec)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Associated Simple Offers under Bundle Price ({childPops.length})
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
                                {childPops.map((ch, cIdx) => {
                                  const chId = typeof ch === 'string' ? ch : ch.id;
                                  const fullChild = allEntities.find(e => e.entityType === 'ProductOfferingPrice' && (e.id === chId || e.raw?.id === chId))?.raw || (typeof ch === 'object' ? ch : { id: chId });
                                  const roleInfo = getChildPopRole(fullChild.id, fullChild.name);
                                  const matchedOffer = findMatchingSimpleOffer(fullChild, fullPop, currentItem, allOfferings);

                                  return (
                                    <div
                                      key={cIdx}
                                      style={{
                                        background: '#ffffff',
                                        border: `1px solid ${C.border}`,
                                        borderRadius: '6px',
                                        padding: '8px 10px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px'
                                      }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '10px', fontWeight: '700', color: roleInfo.badgeColor, background: roleInfo.badgeBg, padding: '1px 6px', borderRadius: '4px' }}>
                                          {roleInfo.label}
                                        </span>
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ds-warn)' }}>
                                          {fullChild.price ? `${fullChild.price.value} ${fullChild.price.unit || 'EUR'}` : '0 EUR'}
                                        </span>
                                      </div>
                                      {matchedOffer ? (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                                          <div style={{ overflow: 'hidden' }}>
                                            <div style={{ fontSize: '11.5px', fontWeight: '600', color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                              {matchedOffer.name || matchedOffer.id}
                                            </div>
                                            <div style={{ fontSize: '10px', color: C.muted, fontFamily: 'var(--ds-font-mono)' }}>
                                              {matchedOffer.id}
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleNavigateToEntity(matchedOffer, 'ProductOffering')}
                                            style={{
                                              background: 'rgba(230,0,0,0.06)',
                                              border: '1px solid var(--ds-brand)',
                                              color: 'var(--ds-brand)',
                                              padding: '3px 8px',
                                              borderRadius: '4px',
                                              fontSize: '10.5px',
                                              fontWeight: '600',
                                              cursor: 'pointer',
                                              flexShrink: 0
                                            }}
                                          >
                                            View Offer →
                                          </button>
                                        </div>
                                      ) : (
                                        <div style={{ fontSize: '10.5px', color: C.muted, fontFamily: 'var(--ds-font-mono)' }}>
                                          {fullChild.id}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bundled Product Offerings */}
              {(raw.isBundle || bundledOffers.length > 0) && (
                <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: C.muted, marginBottom: '12px' }}>
                    Bundled Product Offerings ({bundledOffers.length})
                  </div>

                  {bundledOffers.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: C.muted, fontSize: '13px' }}>
                      No bundled sub-offerings defined.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {bundledOffers.map((bOffer, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: 'var(--ds-surface-subtle)',
                            border: `1px solid ${C.border}`,
                            borderRadius: '6px',
                            padding: '12px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '14px' }}><Icon name="package" size={14} /></span>
                              <span style={{ fontSize: '13px', fontWeight: '600', color: C.text }}>
                                {bOffer.name || bOffer.id}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--ds-spec)', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', padding: '1px 6px', borderRadius: '4px' }}>
                                v{bOffer.version || '1'}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: C.muted, fontFamily: 'var(--ds-font-mono)', marginTop: '4px' }}>
                              {bOffer.id}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleNavigateToEntity(bOffer, 'ProductOffering')}
                            style={{
                              background: 'rgba(230,0,0,0.06)',
                              border: '1px solid var(--ds-brand)',
                              color: 'var(--ds-brand)',
                              padding: '5px 12px',
                              borderRadius: '5px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>View Simple Offer</span>
                            <span>→</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CHARACTERISTICS */}
          {activeTab === 'characteristics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Search Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Filter characteristics by name or value…"
                  value={charSearch}
                  onChange={(e) => setCharSearch(e.target.value)}
                  style={{
                    flex: 1,
                    background: '#ffffff',
                    border: `1px solid ${C.border}`,
                    color: C.text,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '12px', color: C.muted, whiteSpace: 'nowrap' }}>
                  Showing {filteredChars.length} of {chars.length}
                </span>
              </div>

              {/* Characteristics List / Table */}
              {filteredChars.length === 0 ? (
                <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '32px', textAlign: 'center', color: C.muted, fontSize: '13px' }}>
                  No characteristics found matching your criteria.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredChars.map((charItem, idx) => {
                    const values = Array.isArray(charItem.productSpecCharacteristicValue)
                      ? charItem.productSpecCharacteristicValue
                      : [];

                    return (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--ds-surface-subtle)',
                          border: `1px solid ${C.border}`,
                          borderRadius: '8px',
                          padding: '12px 16px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: '700', color: C.text }}>
                                {charItem.name}
                              </span>
                              {charItem.valueType && (
                                <span style={{ fontSize: '11px', color: 'var(--ds-spec)', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                                  {charItem.valueType}
                                </span>
                              )}
                              {charItem.mandatory && (
                                <span style={{ fontSize: '11px', color: 'var(--ds-brand)', background: 'rgba(230,0,0,0.08)', border: '1px solid rgba(230,0,0,0.25)', padding: '1px 6px', borderRadius: '4px' }}>
                                  Required
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: C.muted, fontFamily: 'var(--ds-font-mono)', marginTop: '2px' }}>
                              ID: {charItem.id || '-'}
                            </div>
                          </div>

                          {/* Flags */}
                          <div style={{ display: 'flex', gap: '4px', fontSize: '11px' }}>
                            {charItem.isModifiable && (
                              <span style={{ background: 'var(--ds-surface-2)', color: C.muted, padding: '1px 6px', borderRadius: '3px' }}>
                                Modifiable
                              </span>
                            )}
                            {charItem.configurable && (
                              <span style={{ background: 'var(--ds-surface-2)', color: C.muted, padding: '1px 6px', borderRadius: '3px' }}>
                                Configurable
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Values chips */}
                        <div style={{ marginTop: '6px' }}>
                          <span style={{ fontSize: '11px', color: C.muted, marginRight: '8px' }}>Values:</span>
                          {values.length === 0 ? (
                            <span style={{ fontSize: '11px', color: C.muted, fontStyle: 'italic' }}>Open / Dynamic</span>
                          ) : (
                            <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                              {values.map((v, vIdx) => (
                                <span
                                  key={vIdx}
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    color: v.isDefault ? 'var(--ds-ok)' : C.text,
                                    background: v.isDefault ? 'rgba(16,185,129,0.1)' : '#ffffff',
                                    border: `1px solid ${v.isDefault ? 'rgba(16,185,129,0.3)' : 'var(--ds-border-strong)'}`,
                                    padding: '2px 8px',
                                    borderRadius: '4px'
                                  }}
                                >
                                  {String(v.value !== undefined ? v.value : v)}
                                  {v.isDefault && <span style={{ marginLeft: '4px', fontSize: '10px', opacity: 0.8 }}>(default)</span>}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: SUBCATEGORIES (Categories only) */}
          {activeTab === 'subcategories' && isCategory && (
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: C.muted, marginBottom: '12px' }}>
                Subcategories ({subCategories.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {subCategories.map((sub, idx) => (
                  <div key={idx} style={{ background: 'var(--ds-surface-subtle)', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: C.text }}>{sub.name || sub.id}</div>
                      <div style={{ fontSize: '11px', color: C.muted, fontFamily: 'var(--ds-font-mono)' }}>{sub.id}</div>
                    </div>
                    <span style={{ fontSize: '11px', background: 'rgba(245,158,11,0.1)', color: 'var(--ds-warn)', padding: '2px 6px', borderRadius: '4px' }}>
                      v{sub.version || '1'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: RAW TMF JSON */}
          {activeTab === 'rawJson' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: C.muted }}>
                  Raw TMF620 representation returned directly by the DNEXT Gateway
                </span>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(raw, null, 2), 'fullJson')}
                  style={{
                    background: 'rgba(230,0,0,0.06)',
                    border: '1px solid var(--ds-brand)',
                    color: 'var(--ds-brand)',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {copiedKey === 'fullJson' ? '✓ Copied to Clipboard' : 'Copy Full JSON'}
                </button>
              </div>

              <div style={{ flex: 1, background: 'var(--ds-surface-subtle)', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '16px', overflowY: 'auto' }}>
                <pre style={{ margin: 0, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', color: 'var(--ds-text)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(raw, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
