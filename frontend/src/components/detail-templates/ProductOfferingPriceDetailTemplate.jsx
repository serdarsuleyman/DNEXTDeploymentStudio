import React, { useState, useMemo } from 'react';
import Icon from '../ui/Icon';
import { LifecyclePill, VersionCell, EntityTypeBadge } from '../list-views/cellRenderers';

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
  pop: 'var(--ds-warn)',
  bundle: 'var(--ds-spec)',
  success: 'var(--ds-ok)',
  warning: 'var(--ds-warn)',
  danger: 'var(--ds-brand)'
};

export default function ProductOfferingPriceDetailTemplate({
  item,
  allEntities = [],
  onNavigateToEntity,
  copyToClipboard,
  copiedKey
}) {
  const raw = item?.raw || {};
  const price = raw.price || {};
  const alterations = Array.isArray(raw.productOfferingPriceAlteration) ? raw.productOfferingPriceAlteration : [];
  const tax = Array.isArray(raw.tax) ? raw.tax : [];
  const chars = Array.isArray(raw.productOfferingPriceCharacteristic)
    ? raw.productOfferingPriceCharacteristic
    : (Array.isArray(raw.prodSpecCharValueUse) ? raw.prodSpecCharValueUse : []);

  // Determine if this is a Bundle POP vs Simple / Atomic POP
  const isBundle = Boolean(
    raw.isBundle === true ||
    (Array.isArray(raw.bundledPopRelationship) && raw.bundledPopRelationship.length > 0) ||
    (Array.isArray(raw.bundledProductOfferingPrice) && raw.bundledProductOfferingPrice.length > 0) ||
    (Array.isArray(raw.popRelationship) && raw.popRelationship.length > 0) ||
    (Array.isArray(raw.bundledPop) && raw.bundledPop.length > 0) ||
    (raw['@type'] && String(raw['@type']).toLowerCase().includes('bundled'))
  );

  // List of simple sub-prices bundled under this POP
  const bundledSimplePops = (
    Array.isArray(raw.bundledPopRelationship) ? raw.bundledPopRelationship :
    Array.isArray(raw.bundledProductOfferingPrice) ? raw.bundledProductOfferingPrice :
    Array.isArray(raw.popRelationship) ? raw.popRelationship :
    Array.isArray(raw.bundledPop) ? raw.bundledPop :
    []
  );

  const [searchSubPrice, setSearchSubPrice] = useState('');
  const [searchChar, setSearchChar] = useState('');
  const [activeTab, setActiveTab] = useState(isBundle ? 'bundled_prices' : 'characteristics');

  const filteredSubPrices = bundledSimplePops.filter(p => {
    if (!searchSubPrice.trim()) return true;
    const q = searchSubPrice.toLowerCase();
    return (p.name || '').toLowerCase().includes(q) || (p.id || '').toLowerCase().includes(q);
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

  // Resolve Price and Price Type for child components
  const resolveSubPopDetails = (subPop) => {
    let priceObj = subPop.price;
    let priceType = subPop.priceType;
    let recurringPeriod = subPop.recurringChargePeriodType;
    const targetId = subPop.id || subPop.productOfferingPrice?.id || subPop.bundledProductOfferingPrice?.id;

    // 1. Lookup in allEntities if available
    if ((!priceObj || !priceType) && Array.isArray(allEntities) && allEntities.length > 0 && targetId) {
      const match = allEntities.find(e => {
        const eid = e.id || e.raw?.id;
        return eid && String(eid).toLowerCase() === String(targetId).toLowerCase();
      });
      const rawMatch = match?.raw || match;
      if (rawMatch) {
        if (!priceObj && rawMatch.price) priceObj = rawMatch.price;
        if (!priceType && rawMatch.priceType) priceType = rawMatch.priceType;
        if (!recurringPeriod && rawMatch.recurringChargePeriodType) recurringPeriod = rawMatch.recurringChargePeriodType;
      }
    }

    // 2. Fallback extraction from name/description if contains e.g. "49.99€" or "0.00€"
    if (!priceObj && (subPop.name || subPop.description)) {
      const text = `${subPop.name || ''} ${subPop.description || ''}`;
      const euroMatch = text.match(/([\d+[.,]\d+)\s*(?:€|EUR)/i);
      if (euroMatch) {
        priceObj = { value: parseFloat(euroMatch[1].replace(',', '.')), unit: 'EUR' };
      }
    }

    // 3. Fallback infer priceType from keywords
    if (!priceType && (subPop.name || subPop.description)) {
      const lower = `${subPop.name || ''} ${subPop.description || ''}`.toLowerCase();
      if (lower.includes('activation') || lower.includes('bereitstellung') || lower.includes('onetime') || lower.includes('one-time') || lower.includes('setup') || lower.includes('installation')) {
        priceType = 'One time charge';
      } else if (lower.includes('recurring') || lower.includes('month') || lower.includes('monat') || lower.includes('recurrent') || lower.includes('tariff') || lower.includes('fee')) {
        priceType = 'Recurring charge';
        if (!recurringPeriod) recurringPeriod = 'month';
      }
    }

    return {
      price: priceObj,
      priceType: priceType || 'Standard Charge',
      recurringPeriod
    };
  };

  const formatCurrency = (val, unit = 'EUR') => {
    if (val === undefined || val === null || isNaN(val)) return `0.00 ${unit}`;
    return `${Number(val).toFixed(2)} ${unit}`;
  };

  // Compute aggregated totals for bundle POP
  const priceTotals = useMemo(() => {
    let recurringTotal = 0;
    let oneTimeTotal = 0;
    let unit = 'EUR';
    let recurringPeriod = 'month';
    let recurringCount = 0;
    let oneTimeCount = 0;

    bundledSimplePops.forEach(subPop => {
      const details = resolveSubPopDetails(subPop);
      const rawVal = details.price?.value;
      const numVal = typeof rawVal === 'number' ? rawVal : parseFloat(rawVal);
      const val = !isNaN(numVal) ? numVal : 0;

      if (details.price?.unit) unit = details.price.unit;
      if (details.recurringPeriod) recurringPeriod = details.recurringPeriod;

      const typeLower = (details.priceType || '').toLowerCase();
      if (typeLower.includes('recurring') || typeLower.includes('month') || typeLower.includes('monat') || typeLower.includes('recurrent')) {
        recurringTotal += val;
        recurringCount++;
      } else if (typeLower.includes('one time') || typeLower.includes('onetime') || typeLower.includes('activation') || typeLower.includes('bereitstellung') || typeLower.includes('setup') || typeLower.includes('installation')) {
        oneTimeTotal += val;
        oneTimeCount++;
      } else {
        if (details.recurringPeriod) {
          recurringTotal += val;
          recurringCount++;
        } else {
          const nameLower = `${subPop.name || ''} ${subPop.description || ''}`.toLowerCase();
          if (nameLower.includes('activation') || nameLower.includes('bereitstellung') || nameLower.includes('onetime') || nameLower.includes('one-time')) {
            oneTimeTotal += val;
            oneTimeCount++;
          } else {
            recurringTotal += val;
            recurringCount++;
          }
        }
      }
    });

    return {
      recurringTotal: Math.round(recurringTotal * 100) / 100,
      oneTimeTotal: Math.round(oneTimeTotal * 100) / 100,
      unit,
      recurringPeriod,
      recurringCount,
      oneTimeCount
    };
  }, [bundledSimplePops, allEntities]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ─── Hero Header: Differentiated for Bundle POP vs Simple POP ─── */}
      {isBundle ? (
        /* BUNDLE POP HERO */
        <div style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, #ffffff 85%)',
          border: '1px solid rgba(124,58,237,0.25)',
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
                letterSpacing: '0.06em',
                background: 'rgba(124,58,237,0.1)',
                color: 'var(--ds-spec)',
                border: '1px solid rgba(124,58,237,0.3)',
                padding: '3px 10px',
                borderRadius: '6px'
              }}>
                <Icon name="layers" size={14} /> Composite Bundle POP
              </span>
              <VersionCell version={item.version} />
              <LifecyclePill status={raw.lifecycleStatus || item.lifecycleStatus || 'In study'} />
            </div>

            <h1 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: '800', color: C.text, letterSpacing: '-0.01em' }}>
              {item.name || item.id}
            </h1>
            <div style={{ fontSize: '12px', color: C.muted, fontFamily: 'var(--ds-font-mono)', marginBottom: '8px' }}>
              ID: {item.id}
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: C.text, maxWidth: '580px', lineHeight: '1.5' }}>
              {raw.description || 'Composite bundle price container grouping multiple atomic sub-prices and fee components into a unified price structure.'}
            </p>
          </div>

          {/* Sub-Prices Counter */}
          <div style={{
            background: '#ffffff',
            border: '1px solid rgba(124,58,237,0.25)',
            borderRadius: '10px',
            padding: '16px 22px',
            textAlign: 'right',
            minWidth: '150px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--ds-spec)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
              Bundled Sub-Prices
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: C.text, marginTop: '2px' }}>
              {bundledSimplePops.length}
            </div>
            <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>
              Atomic components
            </div>
          </div>
        </div>
      ) : (
        /* SIMPLE POP HERO */
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, #ffffff 85%)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                textTransform: 'uppercase',
                background: 'rgba(245,158,11,0.1)',
                color: 'var(--ds-warn)',
                border: '1px solid rgba(245,158,11,0.3)',
                padding: '3px 10px',
                borderRadius: '6px'
              }}>
                <Icon name="tag" size={14} /> Simple Offering Price
              </span>
              <VersionCell version={item.version} />
              <LifecyclePill status={raw.lifecycleStatus || item.lifecycleStatus || 'In study'} />
            </div>

            <h1 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: '800', color: C.text }}>
              {item.name || item.id}
            </h1>
            <div style={{ fontSize: '12px', color: C.muted, fontFamily: 'var(--ds-font-mono)' }}>
              ID: {item.id}
            </div>
            {raw.description && (
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: C.muted, maxWidth: '580px', lineHeight: '1.5' }}>
                {raw.description}
              </p>
            )}
          </div>

          <div style={{
            textAlign: 'right',
            background: '#ffffff',
            padding: '16px 22px',
            borderRadius: '10px',
            border: '1px solid rgba(245,158,11,0.25)',
            minWidth: '150px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', fontWeight: '600' }}>Price Amount</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--ds-warn)' }}>
              {price.value !== undefined ? `${price.value} ${price.unit || 'EUR'}` : 'N/A'}
            </div>
            {raw.recurringChargePeriodType ? (
              <div style={{ fontSize: '11px', color: 'var(--ds-info)', marginTop: '2px', fontWeight: '600' }}>
                Cycle: {raw.recurringChargePeriodType}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>
                {raw.priceType || 'One-time fee'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Attributes & Parameters Grid ─── */}
      <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '13px', fontWeight: '700', color: C.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Pricing Parameters & Classification
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
          <div>
            <span style={{ fontSize: '11px', color: C.muted }}>Bundle Price?</span>
            <div style={{
              fontSize: '13px',
              fontWeight: '700',
              color: isBundle ? 'var(--ds-spec)' : 'var(--ds-warn)',
              marginTop: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>{isBundle ? 'Yes (Composite Bundle POP)' : 'No (Atomic / Simple Price)'}</span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: C.muted }}>Price Type</span>
            <div style={{ fontSize: '13px', fontWeight: '600', color: C.text, marginTop: '2px' }}>
              {raw.priceType || (isBundle ? 'Composite Bundle Price' : 'Standard Charge')}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: C.muted }}>Recurring Charge Period</span>
            <div style={{ fontSize: '13px', fontWeight: '600', color: C.text, marginTop: '2px' }}>
              {raw.recurringChargePeriodType || (isBundle ? 'Aggregated across components' : 'None (One-time)')}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: C.muted }}>Lifecycle Status</span>
            <div style={{ marginTop: '4px' }}><LifecyclePill status={item.lifecycleStatus || raw.lifecycleStatus} /></div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: C.muted }}>Unit of Measure</span>
            <div style={{ fontSize: '13px', color: C.text, marginTop: '2px' }}>
              {raw.unitOfMeasure?.amount ? `${raw.unitOfMeasure.amount} ${raw.unitOfMeasure.units}` : 'Per item / service'}
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
        {isBundle && (
          <button
            type="button"
            onClick={() => setActiveTab('bundled_prices')}
            style={{
              background: activeTab === 'bundled_prices' ? 'rgba(124,58,237,0.08)' : 'transparent',
              border: '1px solid',
              borderColor: activeTab === 'bundled_prices' ? 'var(--ds-spec)' : 'transparent',
              color: activeTab === 'bundled_prices' ? 'var(--ds-spec)' : C.muted,
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
            <span><Icon name="package" size={14} /></span>
            <span>Bundled Sub-Prices ({bundledSimplePops.length})</span>
          </button>
        )}

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

        {alterations.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('alterations')}
            style={{
              background: activeTab === 'alterations' ? 'rgba(2,132,199,0.08)' : 'transparent',
              border: '1px solid',
              borderColor: activeTab === 'alterations' ? 'var(--ds-info)' : 'transparent',
              color: activeTab === 'alterations' ? 'var(--ds-info)' : C.muted,
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
            <span>Alterations & Discounts ({alterations.length})</span>
          </button>
        )}
      </div>

      {/* ─── TAB 1: BUNDLED SUB-PRICES (for Bundle POP) ─── */}
      {isBundle && activeTab === 'bundled_prices' && (
        <div style={{ background: C.panel, border: '1px solid rgba(124,58,237,0.25)', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span><Icon name="package" size={14} /> Bundled Simple Price Components</span>
                <span style={{ fontSize: '12px', background: 'rgba(124,58,237,0.1)', color: 'var(--ds-spec)', border: '1px solid rgba(124,58,237,0.25)', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                  {filteredSubPrices.length} of {bundledSimplePops.length}
                </span>
              </h3>
              <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>
                Simple atomic price components aggregated inside this composite bundle price
              </div>
            </div>

            <input
              type="text"
              value={searchSubPrice}
              onChange={e => setSearchSubPrice(e.target.value)}
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

          {/* Aggregated Totals Summary Bar */}
          {bundledSimplePops.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(248,250,252,0.9) 0%, rgba(241,245,249,0.9) 100%)',
              border: `1px solid ${C.cardBorder}`,
              borderRadius: '8px',
              padding: '14px 18px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--ds-warn)', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span><Icon name="refresh" size={14} /></span>
                    <span>Total Recurring Fees</span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--ds-warn)', marginTop: '2px' }}>
                    {formatCurrency(priceTotals.recurringTotal, priceTotals.unit)}
                    <span style={{ fontSize: '12px', fontWeight: '600', color: C.muted, marginLeft: '4px' }}>
                      / {priceTotals.recurringPeriod || 'month'}
                    </span>
                  </div>
                </div>

                <div style={{ width: '1px', height: '32px', background: C.cardBorder }} />

                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--ds-info)', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span><Icon name="zap" size={14} /></span>
                    <span>Total One-Time Fees</span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--ds-info)', marginTop: '2px' }}>
                    {formatCurrency(priceTotals.oneTimeTotal, priceTotals.unit)}
                  </div>
                </div>

                <div style={{ width: '1px', height: '32px', background: C.cardBorder }} />

                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--ds-spec)', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span><Icon name="package" size={14} /></span>
                    <span>Component Count</span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: C.text, marginTop: '2px' }}>
                    {bundledSimplePops.length} <span style={{ fontSize: '12px', fontWeight: 'normal', color: C.muted }}>({priceTotals.recurringCount} recurring, {priceTotals.oneTimeCount} one-time)</span>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: C.muted, fontStyle: 'italic' }}>
                * Sum calculated from atomic simple price values
              </div>
            </div>
          )}

          {bundledSimplePops.length === 0 ? (
            <div style={{
              background: 'var(--ds-surface-subtle)',
              border: `1px dashed ${C.cardBorder}`,
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              color: C.muted,
              fontSize: '13px'
            }}>
              No child simple price components declared in <code>bundledPopRelationship</code>.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredSubPrices.map((subPop, idx) => {
                const details = resolveSubPopDetails(subPop);
                const isRecurring = (details.priceType || '').toLowerCase().includes('recurring');
                const isOneTime = (details.priceType || '').toLowerCase().includes('one time') || (details.priceType || '').toLowerCase().includes('onetime');

                return (
                  <div key={idx} style={{
                    background: 'var(--ds-surface-subtle)',
                    border: `1px solid ${C.cardBorder}`,
                    borderRadius: '8px',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    transition: 'border-color 0.15s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        background: isRecurring ? 'rgba(245,158,11,0.1)' : 'rgba(2,132,199,0.1)',
                        border: `1px solid ${isRecurring ? 'rgba(245,158,11,0.25)' : 'rgba(2,132,199,0.25)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px'
                      }}>
                        <Icon name={isRecurring ? 'refresh' : 'zap'} size={14} />
                      </div>
                      <div>
                        {/* ── Hyperlink to Simple Offer / Sub-Price Details ── */}
                        <div
                          onClick={() => onNavigateToEntity && onNavigateToEntity(subPop, 'ProductOfferingPrice')}
                          style={{
                            fontSize: '13px',
                            fontWeight: '700',
                            color: onNavigateToEntity ? 'var(--ds-brand-dark)' : C.text,
                            cursor: onNavigateToEntity ? 'pointer' : 'default',
                            textDecoration: onNavigateToEntity ? 'underline' : 'none',
                            textDecorationColor: 'rgba(230,0,0,0.3)',
                            textUnderlineOffset: '2px',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (onNavigateToEntity) e.currentTarget.style.color = 'var(--ds-brand)';
                          }}
                          onMouseLeave={(e) => {
                            if (onNavigateToEntity) e.currentTarget.style.color = 'var(--ds-brand-dark)';
                          }}
                          title={`Click to view simple offer / price details for ${subPop.name || subPop.id}`}
                        >
                          {subPop.name || subPop.id}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                          <code style={{ fontSize: '11px', color: 'var(--ds-warn)', fontFamily: 'var(--ds-font-mono)' }}>
                            {subPop.id}
                          </code>
                          {subPop.version !== undefined && (
                            <span style={{ fontSize: '11px', color: 'var(--ds-ok)', background: 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                              v{subPop.version}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price Type, Price Amount & Navigation Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {/* Price Type Badge */}
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: isRecurring ? 'var(--ds-warn)' : isOneTime ? 'var(--ds-info)' : 'var(--ds-spec)',
                        background: isRecurring ? 'rgba(245,158,11,0.1)' : isOneTime ? 'rgba(2,132,199,0.1)' : 'rgba(124,58,237,0.08)',
                        border: `1px solid ${isRecurring ? 'rgba(245,158,11,0.25)' : isOneTime ? 'rgba(2,132,199,0.25)' : 'rgba(124,58,237,0.25)'}`,
                        padding: '3px 8px',
                        borderRadius: '5px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span><Icon name={isRecurring ? '' : isOneTime ? 'zap' : 'tag'} size={14} /></span>
                        <span>{details.priceType}</span>
                        {details.recurringPeriod ? ` (${details.recurringPeriod})` : ''}
                      </span>

                      {/* Price Amount */}
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '800',
                        color: 'var(--ds-warn)',
                        background: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid rgba(245,158,11,0.25)',
                        minWidth: '80px',
                        textAlign: 'right'
                      }}>
                        {details.price?.value !== undefined ? (
                          <span>
                            {details.price.value} {details.price.unit || 'EUR'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: C.muted, fontWeight: 'normal' }}>
                            Included
                          </span>
                        )}
                      </div>

                      {/* Copy ID Button */}
                      {subPop.id && copyToClipboard && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(subPop.id, `subpop_${idx}`)}
                          style={{
                            background: '#ffffff',
                            border: `1px solid ${C.cardBorder}`,
                            color: copiedKey === `subpop_${idx}` ? C.success : C.text,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                          title="Copy component POP ID"
                        >
                          {copiedKey === `subpop_${idx}` ? '✓ Copied' : 'Copy ID'}
                        </button>
                      )}

                      {/* ── View Simple Offer Details Action Button ── */}
                      {onNavigateToEntity && (
                        <button
                          type="button"
                          onClick={() => onNavigateToEntity(subPop, 'ProductOfferingPrice')}
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
                            gap: '5px',
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
                          title="View simple offer / price details in drawer"
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

      {/* ─── TAB 2: CHARACTERISTICS (for Bundle POP & Simple POP) ─── */}
      {activeTab === 'characteristics' && (
        <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span><Icon name="settings" size={14} /> Characteristics ({chars.length})</span>
              </h3>
              <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>
                Technical & commercial parameter specifications, codes, and configured values
              </div>
            </div>

            {chars.length > 0 && (
              <input
                type="text"
                value={searchChar}
                onChange={e => setSearchChar(e.target.value)}
                placeholder="Filter by characteristic name..."
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${C.cardBorder}`,
                  background: '#ffffff',
                  color: C.text,
                  fontSize: '12px',
                  outline: 'none',
                  width: '220px'
                }}
              />
            )}
          </div>

          {filteredChars.length === 0 ? (
            <div style={{ fontSize: '12px', color: C.muted, fontStyle: 'italic', padding: '12px 0' }}>
              {chars.length === 0 ? 'No characteristics declared on this offering price.' : `No characteristics match "${searchChar}".`}
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

      {/* ─── TAB 3: ALTERATIONS & DISCOUNTS ─── */}
      {alterations.length > 0 && activeTab === 'alterations' && (
        <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '700', color: C.text }}>
            <Icon name="tag" size={14} /> Price Alterations & Discounts ({alterations.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
            {alterations.map((alt, i) => (
              <div key={i} style={{ background: 'var(--ds-surface-subtle)', padding: '12px', borderRadius: '6px', border: `1px solid ${C.cardBorder}` }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: C.text }}>{alt.name || `Alteration #${i + 1}`}</div>
                <div style={{ fontSize: '11px', color: 'var(--ds-info)', marginTop: '2px' }}>Type: {alt.priceType}</div>
                {alt.price && (
                  <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--ds-warn)', marginTop: '4px' }}>
                    {alt.price.percentage !== undefined ? `${alt.price.percentage}% Discount` : `${alt.price.value} ${alt.price.unit}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
