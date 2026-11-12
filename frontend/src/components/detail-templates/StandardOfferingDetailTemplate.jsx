import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../ui/Icon';
import { LifecyclePill, VersionCell } from '../list-views/cellRenderers';
import { isOptionSpec } from './viewTemplateRegistry';

const C = {
  bg: '#ffffff',
  panel: '#ffffff',
  cardBg: '#ffffff',
  cardBorder: 'var(--ds-border)',
  subCardBg: 'var(--ds-surface-subtle)',
  text: 'var(--ds-text)',
  muted: 'var(--ds-text-2)',
  indigo: 'var(--ds-brand)',
  vodafoneRed: 'var(--ds-brand)',
  accent: 'var(--ds-brand)',
  bundle: 'var(--ds-spec)',
  success: 'var(--ds-ok)',
  warning: 'var(--ds-warn)',
  danger: 'var(--ds-brand)'
};

/**
 * Categorizes a child POP by role based on its ID and naming conventions:
 * - _bw / bandwidth -> Bandwidth Option
 * - _va / voice_access / anschluss -> Voice Access Option
 * - _vt / voice_tariff / tariff / flat -> Voice Tariff Option
 * - _in / internet / access -> Access Technology Option
 */
export function getChildPopRole(popId = '', popName = '') {
  const str = `${popId} ${popName}`.trim().toLowerCase();
  if (str.endsWith('_bw') || str.includes('_bw_') || str.includes('bandwidth') || str.includes('bandbreite')) {
    return {
      role: 'bandwidth',
      label: 'Bandwidth Option',
      badgeBg: 'rgba(2,132,199,0.1)',
      badgeColor: 'var(--ds-info)',
      badgeBorder: 'rgba(2,132,199,0.3)',
      icon: 'sliders'
    };
  }
  if (str.endsWith('_va') || str.includes('_va_') || str.includes('voice_access') || str.includes('voiceaccess') || str.includes('anschluss')) {
    return {
      role: 'voice_access',
      label: 'Voice Access Option',
      badgeBg: 'rgba(124,58,237,0.1)',
      badgeColor: 'var(--ds-spec)',
      badgeBorder: 'rgba(124,58,237,0.3)',
      icon: 'phone'
    };
  }
  if (str.endsWith('_vt') || str.includes('_vt_') || str.includes('voice_tariff') || str.includes('voicetariff') || str.includes('flat')) {
    return {
      role: 'voice_tariff',
      label: 'Voice Tariff Option',
      badgeBg: 'rgba(245,158,11,0.1)',
      badgeColor: 'var(--ds-warn)',
      badgeBorder: 'rgba(245,158,11,0.3)',
      icon: 'tag'
    };
  }
  if (str.endsWith('_in') || str.includes('_in_') || str.includes('internet') || str.includes('access')) {
    return {
      role: 'access_tech',
      label: 'Access Technology Option',
      badgeBg: 'rgba(16,185,129,0.1)',
      badgeColor: 'var(--ds-ok)',
      badgeBorder: 'rgba(16,185,129,0.3)',
      icon: 'activity'
    };
  }
  return {
    role: 'general',
    label: 'Price Component',
    badgeBg: 'var(--ds-surface-2)',
    badgeColor: 'var(--ds-text-2)',
    badgeBorder: 'var(--ds-border)',
    icon: 'tag'
  };
}

/**
 * Extracts characteristic values dictionary from a POP or Offering entity
 */
function extractCharMap(entity) {
  if (!entity) return {};
  const raw = entity.raw || entity;
  const chars = Array.isArray(raw.prodSpecCharValueUse)
    ? raw.prodSpecCharValueUse
    : (Array.isArray(raw.productSpecCharacteristic)
      ? raw.productSpecCharacteristic
      : (Array.isArray(raw.prodSpecCharUse) ? raw.prodSpecCharUse : []));

  const map = {};
  for (const c of chars) {
    const name = (c.name || '').toLowerCase();
    if (!name) continue;
    const vals = Array.isArray(c.productSpecCharacteristicValue)
      ? c.productSpecCharacteristicValue.map(v => (v?.value !== undefined ? v.value : v))
      : (Array.isArray(c.productOfferingPriceCharacteristicValue)
        ? c.productOfferingPriceCharacteristicValue.map(v => (v?.value !== undefined ? v.value : v))
        : (Array.isArray(c.value) ? c.value : [c.value]));
    map[name] = vals.filter(v => v !== undefined && v !== null);
  }
  return map;
}

/**
 * Helper to extract a single characteristic value from an entity
 */
function extractChar(entity, charName) {
  if (!entity) return null;
  const map = extractCharMap(entity);
  const found = map[(charName || '').toLowerCase()];
  return found && found.length > 0 ? found[0] : null;
}

/**
 * Matches a child POP component of a bundle price to its corresponding Simple Offer
 */
export function findMatchingSimpleOffer(childPop, parentPop, parentOffer, allOfferings = []) {
  if (!childPop || !Array.isArray(allOfferings) || allOfferings.length === 0) return null;

  const childId = (childPop.id || '').toLowerCase();
  const parentOfferName = (parentOffer?.name || parentOffer?.raw?.name || '').toLowerCase();
  const parentOfferId = (parentOffer?.id || parentOffer?.raw?.id || '').toLowerCase();
  const isFiber = parentOfferName.includes('glasfaser') || parentOfferName.includes('ftth') || parentOfferId.includes('ftth') || childId.includes('ftth');

  // 1. Direct POP link: offering directly referencing childPop.id
  const direct = allOfferings.find(o => {
    const rawO = o.raw || o;
    const pops = Array.isArray(rawO.productOfferingPrice) ? rawO.productOfferingPrice : [];
    return pops.some(p => (typeof p === 'string' ? p : p?.id) === childPop.id);
  });
  if (direct) return direct;

  const charMap = extractCharMap(childPop);

  // Extract service codes from charMap
  const serviceCodes = [];
  for (const [k, vals] of Object.entries(charMap)) {
    if (k.includes('service_code') || k.includes('sku')) {
      for (const val of vals) {
        if (val) serviceCodes.push(String(val).trim());
      }
    }
  }

  const bwVal = charMap['bandwidth']?.[0] ? String(charMap['bandwidth'][0]).trim() : '';
  const connType = (charMap['connection_type']?.[0] ? String(charMap['connection_type'][0]) : '').toLowerCase();
  const { role } = getChildPopRole(childPop.id, childPop.name);

  // 2. Role-specific matching
  if (role === 'bandwidth') {
    // Match by service code first (e.g. V018N -> po_V018N_..., IG018 -> po_IG018_...)
    for (const sc of serviceCodes) {
      const match = allOfferings.find(o => {
        const oid = (o.id || o.raw?.id || '').toLowerCase();
        const oname = (o.name || o.raw?.name || '').toLowerCase();
        const scLower = sc.toLowerCase();
        return (oid.includes(scLower) || oname.includes(scLower)) && (oid.includes('bandwidth') || oname.includes('bandbreite') || oid.includes('option'));
      });
      if (match) return match;
    }
    // Match by speed & technology
    if (bwVal) {
      const match = allOfferings.find(o => {
        const oid = (o.id || o.raw?.id || '').toLowerCase();
        const oname = (o.name || o.raw?.name || '').toLowerCase();
        const techMatch = isFiber
          ? (oname.includes('glasfaser') || oid.includes('ig') || oid.includes('ftth'))
          : (oname.includes('dsl') || oid.includes('v01') || oid.includes('dsl'));
        const speedMatch = oname.includes(` ${bwVal} mbit`) || oname.includes(` ${bwVal} `) || oid.includes(`_${bwVal}_`) || oid.includes(`_${bwVal}`) || oname.endsWith(` ${bwVal}`);
        return (oid.includes('bandwidth') || oname.includes('bandbreite')) && techMatch && speedMatch;
      });
      if (match) return match;
    }
  } else if (role === 'voice_access') {
    const isComfort = connType.includes('comfort') || childId.includes('comfort');
    const targetId = isComfort ? 'po_c_comfort_fn_options_voiceaccess' : 'po_c_basic_fn_options_voiceaccess';
    const match = allOfferings.find(o => (o.id || o.raw?.id || '').toLowerCase() === targetId);
    if (match) return match;
    return allOfferings.find(o => {
      const oid = (o.id || o.raw?.id || '').toLowerCase();
      const oname = (o.name || o.raw?.name || '').toLowerCase();
      return (oid.includes('voiceaccess') || oname.includes('anschluss')) && (isComfort ? (oid.includes('comfort') || oname.includes('komfort')) : (oid.includes('basic') || oname.includes('basis')));
    });
  } else if (role === 'voice_tariff') {
    const match = allOfferings.find(o => (o.id || o.raw?.id || '').toLowerCase().includes('v1204_fn_options_voicetariff')) ||
                  allOfferings.find(o => (o.id || o.raw?.id || '').toLowerCase().includes('options_voicetariff'));
    if (match) return match;
  } else if (role === 'access_tech') {
    const match = allOfferings.find(o => {
      const oid = (o.id || o.raw?.id || '').toLowerCase();
      if (!oid.includes('options_accesstechnology')) return false;
      return isFiber ? oid.includes('ftth') : (oid.includes('bitstream') || oid.includes('dsl') || oid.includes('ngn'));
    });
    if (match) return match;
  }

  return null;
}

export default function StandardOfferingDetailTemplate({
  item,
  allEntities = [],
  onNavigateToPrice,
  onNavigateToCategory,
  onNavigateToEntity,
  copyToClipboard,
  copiedKey,
  isOptionView = false
}) {
  const raw = item?.raw || {};
  const pops = Array.isArray(raw.productOfferingPrice) ? raw.productOfferingPrice : [];
  const spec = raw.productSpecification || item?.productSpecification;
  const specObj = typeof spec === 'object' && spec !== null ? spec : (spec ? { id: spec, name: spec } : null);
  const terms = Array.isArray(raw.productOfferingTerm) ? raw.productOfferingTerm : [];
  const bundledOffers = Array.isArray(raw.bundledProductOffering) ? raw.bundledProductOffering : [];

  const isOption = isOptionView || isOptionSpec(item);

  // Tab state within the template
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [charSearch, setCharSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [expandedGroupIds, setExpandedGroupIds] = useState({});

  // ─── Extract Characteristics ───
  const chars = useMemo(() => {
    if (Array.isArray(raw.prodSpecCharValueUse) && raw.prodSpecCharValueUse.length > 0) {
      return raw.prodSpecCharValueUse;
    }
    if (Array.isArray(raw.productSpecCharacteristic) && raw.productSpecCharacteristic.length > 0) {
      return raw.productSpecCharacteristic;
    }
    if (Array.isArray(raw.prodSpecCharUse) && raw.prodSpecCharUse.length > 0) {
      return raw.prodSpecCharUse;
    }
    return [];
  }, [raw]);

  // ─── Speed and Network Extraction (for Hero Banner Metric Cards) ───
  const itemId = String(item?.id || '').toLowerCase();
  const itemName = String(item?.name || '').toLowerCase();
  const specId = String(specObj?.id || specObj?.['@id'] || '').toLowerCase();
  const specName = String(specObj?.name || '').toLowerCase();

  const isFTTH = specId.includes('ftth') || specName.includes('ftth') || itemId.includes('ftth') || itemName.includes('ftth') || itemName.includes('glasfaser');

  let speedVal = null;
  const bwChar = extractChar(raw, 'bandwidth') || extractChar(raw, 'downstream_bandwidth');
  if (bwChar && !isNaN(parseInt(bwChar, 10))) {
    speedVal = parseInt(bwChar, 10);
    if (speedVal >= 10000) speedVal = Math.round(speedVal / 1000);
  }

  if (!speedVal) {
    const speedMatch = (itemId + ' ' + itemName).match(/\b(1000|600|300|250|175|150|100|50|25|16|6|3|2|1)\b/);
    if (speedMatch) speedVal = parseInt(speedMatch[1], 10);
  }

  const hasSpeeds = Boolean(speedVal && (itemId.includes('bandwidth') || itemName.includes('bandbreite') || itemId.includes('dsl') || itemId.includes('ftth') || itemName.includes('glasfaser')));

  const downloadSpeedStr = speedVal >= 1000 ? `${speedVal / 1000} Gbps` : `${speedVal} Mbps`;
  const uploadSpeedStr = isFTTH
    ? (speedVal >= 1000 ? '500 Mbps' : `${Math.round(speedVal * 0.5)} Mbps`)
    : `${Math.min(40, Math.round(speedVal * 0.25))} Mbps`;

  // ─── Category Resolution (Cached & Remote API) ───
  const [remoteCategories, setRemoteCategories] = useState({});

  useEffect(() => {
    const map = {};
    if (Array.isArray(allEntities)) {
      allEntities.forEach(e => {
        const id = e.id || e.raw?.id;
        const name = e.name || e.raw?.name;
        if (id && name) {
          map[id] = e.raw || e;
        }
      });
    }

    let isMounted = true;
    fetch('/api/dnext/categories?limit=1000')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (isMounted && Array.isArray(data)) {
          const merged = { ...map };
          data.forEach(c => {
            if (c.id) merged[c.id] = c;
          });
          setRemoteCategories(merged);
        }
      })
      .catch(() => {
        if (isMounted && Object.keys(map).length > 0) {
          setRemoteCategories(map);
        }
      });

    return () => { isMounted = false; };
  }, [allEntities]);

  const categoryGroupings = useMemo(() => {
    const fromExt = raw.extensions?.categoryGroupings;
    if (Array.isArray(fromExt) && fromExt.length > 0) return fromExt;
    if (Array.isArray(raw.categoryGroupings)) return raw.categoryGroupings;
    if (Array.isArray(raw.categoryGrouping)) return raw.categoryGrouping;
    if (raw.categoryGrouping && typeof raw.categoryGrouping === 'object') return [raw.categoryGrouping];
    return [];
  }, [raw]);

  const directCategories = useMemo(() => {
    return Array.isArray(raw.category) ? raw.category : [];
  }, [raw]);

  // Tree of category groupings
  const treeGroups = useMemo(() => {
    const groups = [];

    categoryGroupings.forEach((cg, idx) => {
      const gName = cg.name || `Category Group #${idx + 1}`;
      const gId = cg.id || cg.name || `cg_${idx}`;
      const groupSku = cg.prodSpecCharValueUse?.find(c => (c.name || '').toLowerCase() === 'sku')?.productSpecCharacteristicValue?.[0]?.value || null;

      const cats = Array.isArray(cg.category) ? cg.category.map(c => {
        const cId = c.id || c.name;
        const resolved = remoteCategories[cId] || allEntities.find(e => e.entityType === 'Category' && (e.id === cId || e.raw?.id === cId))?.raw;
        return {
          id: cId,
          name: resolved?.name || c.name || cId,
          version: c.version || resolved?.version || '1',
          href: c.href || resolved?.href,
          raw: resolved || c
        };
      }) : [];

      groups.push({
        id: gId,
        name: gName,
        sku: groupSku,
        categories: cats
      });
    });

    if (Array.isArray(directCategories) && directCategories.length > 0) {
      const directCats = directCategories.map(c => {
        const cId = typeof c === 'string' ? c : (c.id || c.name);
        const resolved = remoteCategories[cId] || allEntities.find(e => e.entityType === 'Category' && (e.id === cId || e.raw?.id === cId))?.raw;
        return {
          id: cId,
          name: resolved?.name || (typeof c === 'object' ? c.name : null) || cId,
          version: typeof c === 'object' ? (c.version || resolved?.version || '1') : (resolved?.version || '1'),
          href: typeof c === 'object' ? c.href : null,
          raw: resolved || (typeof c === 'object' ? c : { id: cId })
        };
      });

      groups.push({
        id: 'direct_categories',
        name: 'Direct Categories',
        sku: null,
        categories: directCats
      });
    }

    return groups;
  }, [categoryGroupings, directCategories, remoteCategories, allEntities]);

  // Expand all groups initially
  useEffect(() => {
    const next = {};
    treeGroups.forEach(g => { next[g.id] = true; });
    setExpandedGroupIds(next);
  }, [treeGroups.length]);

  const totalCategoriesCount = useMemo(() => {
    return treeGroups.reduce((acc, g) => acc + g.categories.length, 0);
  }, [treeGroups]);

  // All offerings in catalog for simple offer resolution
  const allOfferings = useMemo(() => {
    return allEntities.filter(e => e.entityType === 'ProductOffering');
  }, [allEntities]);

  // Full map of all POPs
  const popMap = useMemo(() => {
    const map = new Map();
    for (const e of allEntities) {
      if (e.entityType === 'ProductOfferingPrice') {
        const full = e.raw || e;
        if (e.id) map.set(e.id, full);
        if (full.id) map.set(full.id, full);
      }
    }
    return map;
  }, [allEntities]);

  // Resolve POPs attached to this offering with full cached payloads
  const resolvedPops = useMemo(() => {
    return pops.map(pop => {
      const popId = typeof pop === 'string' ? pop : pop.id;
      const fullPop = popMap.get(popId) || (typeof pop === 'object' ? pop : { id: popId });
      const isBundlePop = Boolean(
        fullPop.isBundle ||
        (Array.isArray(fullPop.bundledPopRelationship) && fullPop.bundledPopRelationship.length > 0)
      );

      let childPopsWithOffers = [];
      if (isBundlePop && Array.isArray(fullPop.bundledPopRelationship)) {
        childPopsWithOffers = fullPop.bundledPopRelationship.map(ch => {
          const chId = typeof ch === 'string' ? ch : ch.id;
          const fullChild = popMap.get(chId) || (typeof ch === 'object' ? ch : { id: chId });
          const roleInfo = getChildPopRole(fullChild.id, fullChild.name);
          const matchedSimpleOffer = findMatchingSimpleOffer(fullChild, fullPop, item, allOfferings);
          const childCharMap = extractCharMap(fullChild);
          const svcCodes = [];
          for (const [k, vals] of Object.entries(childCharMap)) {
            if (k.includes('service_code') || k.includes('sku')) {
              for (const v of vals) if (v) svcCodes.push(String(v));
            }
          }

          return {
            pop: fullChild,
            roleInfo,
            matchedSimpleOffer,
            serviceCodes: Array.from(new Set(svcCodes)),
            bandwidth: childCharMap['bandwidth']?.[0]
          };
        });
      }

      return {
        pop: fullPop,
        isBundlePop,
        childPops: childPopsWithOffers
      };
    });
  }, [pops, popMap, item, allOfferings]);

  // If this entity is an option offering, find bundle POPs in catalog that include this option
  const associatedBundlePops = useMemo(() => {
    if (!isOption) return [];
    const thisId = (item?.id || '').toLowerCase();
    const results = [];

    for (const [, pop] of popMap) {
      if (!pop.isBundle && (!Array.isArray(pop.bundledPopRelationship) || pop.bundledPopRelationship.length === 0)) {
        continue;
      }
      const children = Array.isArray(pop.bundledPopRelationship) ? pop.bundledPopRelationship : [];
      let isAssociated = false;
      for (const ch of children) {
        const chId = typeof ch === 'string' ? ch : ch.id;
        const fullChild = popMap.get(chId) || ch;
        const matched = findMatchingSimpleOffer(fullChild, pop, item, allOfferings);
        if (matched && (matched.id === item?.id || (matched.id || '').toLowerCase() === thisId)) {
          isAssociated = true;
          break;
        }
      }
      if (isAssociated) {
        results.push(pop);
      }
    }
    return results;
  }, [isOption, item?.id, popMap, allOfferings]);

  // Header metric: Primary Price
  const hasBundlePop = resolvedPops.some(p => p.isBundlePop);
  const primaryPriceStr = useMemo(() => {
    if (resolvedPops.length === 0) {
      return isOption ? 'Catalog Option' : 'Dynamic';
    }
    const first = resolvedPops[0].pop;
    if (first?.price?.value !== undefined) {
      return `${first.price.value} ${first.price.unit || 'EUR'}`;
    }
    return 'Dynamic';
  }, [resolvedPops, isOption]);

  // Header metric: Option Badge Text
  const optionBadgeText = useMemo(() => {
    if (!isOption) {
      if (raw.isBundle) return 'Bundle Offering';
      return 'Standard Product Offering';
    }
    const role = getChildPopRole(item?.id, item?.name).role;
    if (role === 'bandwidth') return 'Bandwidth Option';
    if (role === 'voice_access') return 'Voice Access Option';
    if (role === 'voice_tariff') return 'Voice Tariff Option';
    if (role === 'access_tech') return 'Access Technology Option';
    return 'Option Offering';
  }, [isOption, raw.isBundle, item?.id, item?.name]);

  // Sub-tabs list aligned with Sales Package detail view
  const subTabs = useMemo(() => [
    { id: 'overview', label: 'Overview', icon: 'chart' },
    { id: 'pricing', label: `Pricing (${resolvedPops.length})`, icon: 'tag' },
    { id: 'characteristics', label: `Characteristics (${chars.length})`, icon: 'sliders' },
    { id: 'categories', label: `Categories (${totalCategoriesCount})`, icon: 'folder' },
    ...(terms.length > 0 ? [{ id: 'terms', label: `Contract Terms (${terms.length})`, icon: 'edit' }] : [])
  ], [resolvedPops.length, chars.length, totalCategoriesCount, terms.length]);

  // Filtered characteristics for Characteristics tab
  const filteredChars = useMemo(() => {
    if (!charSearch.trim()) return chars;
    const q = charSearch.toLowerCase();
    return chars.filter(c => {
      const nameMatch = (c.name || '').toLowerCase().includes(q);
      const valMatch = (
        Array.isArray(c.productSpecCharacteristicValue)
          ? c.productSpecCharacteristicValue.map(v => (v?.value !== undefined ? v.value : v))
          : [c.value]
      ).some(v => String(v || '').toLowerCase().includes(q));
      return nameMatch || valMatch;
    });
  }, [chars, charSearch]);

  // Filtered tree groups for Categories tab
  const filteredTreeGroups = useMemo(() => {
    if (!categoryFilter.trim()) return treeGroups;
    const q = categoryFilter.toLowerCase();
    return treeGroups.map(group => {
      const groupMatch = (group.name || '').toLowerCase().includes(q) || (group.sku || '').toLowerCase().includes(q);
      const matchingCats = group.categories.filter(c =>
        (c.name || '').toLowerCase().includes(q) || (c.id || '').toLowerCase().includes(q)
      );
      if (groupMatch) return group;
      if (matchingCats.length > 0) return { ...group, categories: matchingCats };
      return null;
    }).filter(Boolean);
  }, [treeGroups, categoryFilter]);

  const toggleGroup = (groupId) => {
    setExpandedGroupIds(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const expandAllGroups = () => {
    const next = {};
    treeGroups.forEach(g => { next[g.id] = true; });
    setExpandedGroupIds(next);
  };

  const collapseAllGroups = () => {
    setExpandedGroupIds({});
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ─── Hero Header Banner (Aligned with Sales Package Detail View) ─── */}
      <div style={{
        background: '#ffffff',
        border: `1px solid ${C.cardBorder}`,
        borderRadius: '12px',
        padding: '22px 24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <h1 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: '800', color: C.text, letterSpacing: '-0.02em' }}>
              {item.name || item.id}
            </h1>

            {/* Offer ID, Copy ID, Spec ID & Role Badge inside hero box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: C.muted }}>ID:</span>
              <code style={{ fontSize: '12px', color: 'var(--ds-warn)', background: 'var(--ds-surface-2)', border: '1px solid var(--ds-border)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--ds-font-mono)' }}>
                {item.id}
              </code>
              {copyToClipboard && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(item.id, 'offer_id')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copiedKey === 'offer_id' ? C.success : C.muted,
                    cursor: 'pointer',
                    fontSize: '11px',
                    padding: '2px 6px',
                    fontWeight: '600'
                  }}
                  title="Copy Offer ID"
                >
                  {copiedKey === 'offer_id' ? '✓ Copied' : 'Copy ID'}
                </button>
              )}

              {/* Spec ID next to Copy ID button */}
              {specObj?.id && (
                <>
                  <span style={{ color: 'var(--ds-border-strong)' }}>•</span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: C.muted }}>Spec ID:</span>
                    <code style={{ fontSize: '12px', color: 'var(--ds-spec)', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--ds-font-mono)' }}>
                      {specObj.id}
                    </code>
                  </div>
                </>
              )}

              {/* Component Role Badge */}
              <span style={{ color: 'var(--ds-border-strong)' }}>•</span>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                color: isOption ? 'var(--ds-info)' : (raw.isBundle ? 'var(--ds-spec)' : 'var(--ds-brand-dark)'),
                background: isOption ? 'rgba(2,132,199,0.1)' : (raw.isBundle ? 'rgba(124,58,237,0.1)' : 'rgba(230,0,0,0.08)'),
                border: isOption ? '1px solid rgba(2,132,199,0.3)' : (raw.isBundle ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(230,0,0,0.2)'),
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {optionBadgeText}
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: C.muted, maxWidth: '620px', lineHeight: '1.5' }}>
              {raw.description || (isOption
                ? 'Commercial component option for broadband access, speed tiering, or voice services.'
                : 'Commercial broadband product offering configured with commercial terms and pricing models.')}
            </p>
          </div>

          {/* Speed Dial / Hero Metrics */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {hasSpeeds && (
              <>
                <div style={{
                  background: '#ffffff',
                  border: `1px solid ${C.cardBorder}`,
                  borderRadius: '10px',
                  padding: '12px 18px',
                  minWidth: '115px',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                    Download
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--ds-brand-dark)', marginTop: '2px' }}>
                    ↓ {downloadSpeedStr}
                  </div>
                </div>

                <div style={{
                  background: '#ffffff',
                  border: `1px solid ${C.cardBorder}`,
                  borderRadius: '10px',
                  padding: '12px 18px',
                  minWidth: '115px',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                    Upload
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: C.text, marginTop: '2px' }}>
                    ↑ {uploadSpeedStr}
                  </div>
                </div>
              </>
            )}

            {/* Price Metric */}
            <div style={{
              background: '#ffffff',
              border: `1px solid ${C.cardBorder}`,
              borderRadius: '10px',
              padding: '12px 18px',
              minWidth: '115px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                {hasBundlePop ? 'Bundle Price' : 'Price'}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: hasBundlePop ? 'var(--ds-spec)' : 'var(--ds-warn)', marginTop: '2px' }}>
                {primaryPriceStr}
              </div>
            </div>

            {/* Status Metric */}
            <div style={{
              background: '#ffffff',
              border: `1px solid ${C.cardBorder}`,
              borderRadius: '10px',
              padding: '12px 16px',
              minWidth: '110px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                Status
              </div>
              <div style={{ marginTop: '4px' }}>
                <LifecyclePill status={item.lifecycleStatus} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sub-Tabs Navigation (Overview | Pricing | Characteristics | Categories) ─── */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${C.cardBorder}`, paddingBottom: '8px', flexWrap: 'wrap' }}>
        {subTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id)}
            style={{
              background: activeSubTab === t.id ? 'rgba(230,0,0,0.08)' : 'transparent',
              border: '1px solid',
              borderColor: activeSubTab === t.id ? 'var(--ds-brand)' : 'transparent',
              color: activeSubTab === t.id ? 'var(--ds-brand)' : C.muted,
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
            <Icon name={t.icon} size={14} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ─── TAB CONTENT 1: OVERVIEW ─── */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeSubTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Attributes & Lifecycle */}
          <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '13.5px', fontWeight: '700', color: C.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Attributes & Lifecycle
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', color: C.muted }}>Entity Type</span>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ds-brand-dark)', marginTop: '2px' }}>{item.entityType}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.muted }}>Version</span>
                <div style={{ marginTop: '4px' }}><VersionCell version={item.version} /></div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.muted }}>Lifecycle Status</span>
                <div style={{ marginTop: '4px' }}><LifecyclePill status={item.lifecycleStatus} /></div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.muted }}>Bundle Offering?</span>
                <div style={{ fontSize: '13px', fontWeight: '600', color: raw.isBundle ? 'var(--ds-spec)' : C.muted, marginTop: '2px' }}>
                  {raw.isBundle ? 'Yes (Bundle Offer)' : isOption ? 'No (Simple Option)' : 'No (Atomic Offer)'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.muted }}>Valid From</span>
                <div style={{ fontSize: '12px', color: C.text, marginTop: '2px', fontFamily: 'var(--ds-font-mono)' }}>
                  {raw.validFor?.startDateTime ? new Date(raw.validFor.startDateTime).toLocaleDateString() : '-'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.muted }}>Valid To</span>
                <div style={{ fontSize: '12px', color: C.text, marginTop: '2px', fontFamily: 'var(--ds-font-mono)' }}>
                  {raw.validFor?.endDateTime ? new Date(raw.validFor.endDateTime).toLocaleDateString() : 'Indefinite (Open)'}
                </div>
              </div>
            </div>

            {raw.description && (
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${C.cardBorder}` }}>
                <span style={{ fontSize: '11px', color: C.muted }}>Description</span>
                <div style={{ fontSize: '13px', color: C.text, marginTop: '4px', lineHeight: '1.5' }}>
                  {raw.description}
                </div>
              </div>
            )}
          </div>

          {/* Product Specification Linkage */}
          {spec && (
            <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '13.5px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span><Icon name="clipboard" size={14} /> Associated Product Specification</span>
              </h3>
              <div style={{
                background: 'rgba(124,58,237,0.06)',
                border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ds-spec)' }}>
                    {specObj?.name || specObj?.id}
                  </div>
                  <div style={{ fontSize: '11px', color: C.muted, fontFamily: 'var(--ds-font-mono)', marginTop: '2px' }}>
                    ID: {specObj?.id}
                  </div>
                </div>
                {specObj?.version && (
                  <span style={{ fontSize: '11px', background: 'rgba(124,58,237,0.12)', color: 'var(--ds-spec)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                    v{specObj.version}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Bundled Simple Offers (If Offering is a Bundle Offer) */}
          {bundledOffers.length > 0 && (
            <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span><Icon name="layers" size={16} /> Associated Simple Offers under Bundle Offer</span>
                  <span style={{ fontSize: '11px', color: 'var(--ds-spec)', background: 'rgba(124,58,237,0.1)', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                    {bundledOffers.length} Simple Offers
                  </span>
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {bundledOffers.map((childOffer, cIdx) => {
                  const fullChild = allOfferings.find(o => o.id === childOffer.id || o.raw?.id === childOffer.id) || childOffer;
                  const card = childOffer.bundledProductOfferingOption || {};

                  return (
                    <div
                      key={cIdx}
                      style={{
                        background: 'var(--ds-surface-subtle)',
                        border: `1px solid ${C.cardBorder}`,
                        borderRadius: '8px',
                        padding: '12px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: 'rgba(124,58,237,0.1)',
                          color: 'var(--ds-spec)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Icon name="package" size={16} />
                        </span>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: C.text }}>
                            {fullChild.name || childOffer.name || childOffer.id}
                          </div>
                          <div style={{ fontSize: '11px', color: C.muted, fontFamily: 'var(--ds-font-mono)', marginTop: '2px' }}>
                            ID: {childOffer.id}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {(card.numberRelOfferLowerLimit !== undefined || card.numberRelOfferUpperLimit !== undefined) && (
                          <span style={{
                            fontSize: '11px',
                            background: 'var(--ds-surface-2)',
                            border: '1px solid var(--ds-border)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            color: C.muted
                          }}>
                            Limits: {card.numberRelOfferLowerLimit ?? 0}..{card.numberRelOfferUpperLimit ?? 1}
                          </span>
                        )}

                        {onNavigateToEntity && (
                          <button
                            type="button"
                            onClick={() => onNavigateToEntity(fullChild, 'ProductOffering')}
                            style={{
                              background: 'rgba(230,0,0,0.06)',
                              border: '1px solid var(--ds-brand)',
                              color: 'var(--ds-brand)',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>View Simple Offer</span>
                            <span>→</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Snapshot Cards pointing to other tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {/* Pricing Snapshot */}
            <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="tag" size={14} /> Pricing Summary
                </span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ds-warn)' }}>
                  {resolvedPops.length} Prices
                </span>
              </div>
              <p style={{ fontSize: '12px', color: C.muted, margin: '0 0 10px 0' }}>
                {hasBundlePop
                  ? 'Includes composite bundle prices decomposed into simple child components.'
                  : 'Pricing models and recurring/one-time fees attached to this offer.'}
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('pricing')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ds-brand)',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>View Full Pricing Tab</span>
                <span>→</span>
              </button>
            </div>

            {/* Characteristics Snapshot */}
            <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="sliders" size={14} /> Characteristics
                </span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ds-info)' }}>
                  {chars.length} Attributes
                </span>
              </div>
              <p style={{ fontSize: '12px', color: C.muted, margin: '0 0 10px 0' }}>
                Technical & commercial attributes defining service parameters and codes.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('characteristics')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ds-brand)',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>View All Characteristics</span>
                <span>→</span>
              </button>
            </div>

            {/* Categories Snapshot */}
            <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="folder" size={14} /> Categories
                </span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ds-ok)' }}>
                  {totalCategoriesCount} Categories
                </span>
              </div>
              <p style={{ fontSize: '12px', color: C.muted, margin: '0 0 10px 0' }}>
                Category groups and catalog placement hierarchy for this offering.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('categories')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ds-brand)',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>View Categories Tree</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* ─── TAB CONTENT 2: PRICING ─── */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeSubTab === 'pricing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span><Icon name="tag" size={16} /> Attached Product Offering Prices</span>
                <span style={{ fontSize: '11px', color: C.muted, fontWeight: '400' }}>({resolvedPops.length})</span>
              </h3>
              {hasBundlePop && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--ds-spec)',
                  background: 'rgba(124,58,237,0.1)',
                  border: '1px solid rgba(124,58,237,0.25)',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  Contains Bundle Pricing
                </span>
              )}
            </div>

            {resolvedPops.length === 0 ? (
              <div style={{ color: C.muted, fontSize: '12px', fontStyle: 'italic', padding: '12px 0' }}>
                No pricing objects associated directly with this offering.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {resolvedPops.map(({ pop, isBundlePop, childPops }, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: isBundlePop ? 'linear-gradient(180deg, #ffffff 0%, var(--ds-surface-subtle) 100%)' : 'var(--ds-surface-subtle)',
                      border: isBundlePop ? '1px solid rgba(124,58,237,0.3)' : `1px solid ${C.cardBorder}`,
                      borderRadius: '10px',
                      padding: '16px',
                      boxShadow: isBundlePop ? '0 2px 6px rgba(124,58,237,0.06)' : 'none'
                    }}
                  >
                    {/* POP Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: isBundlePop ? 'rgba(124,58,237,0.12)' : 'rgba(2,132,199,0.12)',
                            color: isBundlePop ? 'var(--ds-spec)' : 'var(--ds-info)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Icon name={isBundlePop ? 'layers' : 'tag'} size={15} />
                          </span>
                          <span style={{ fontSize: '13.5px', fontWeight: '700', color: C.text }}>
                            {pop.name || pop.id}
                          </span>
                          {isBundlePop ? (
                            <span style={{
                              fontSize: '11px',
                              color: 'var(--ds-spec)',
                              background: 'rgba(124,58,237,0.12)',
                              border: '1px solid rgba(124,58,237,0.3)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: '700'
                            }}>
                              Bundle Price (Composite)
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '11px',
                              color: 'var(--ds-info)',
                              background: 'rgba(2,132,199,0.1)',
                              border: '1px solid rgba(2,132,199,0.25)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: '600'
                            }}>
                              {pop.priceType || 'Simple Price'}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: C.muted, fontFamily: 'var(--ds-font-mono)', marginTop: '4px' }}>
                          ID: {pop.id}
                        </div>
                      </div>

                      {/* POP Amount & Action */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '18px', fontWeight: '800', color: isBundlePop ? 'var(--ds-spec)' : 'var(--ds-warn)' }}>
                            {pop.price ? `${pop.price.value} ${pop.price.unit || 'EUR'}` : 'Dynamic'}
                          </div>
                          <div style={{ fontSize: '11px', color: C.muted }}>
                            {pop.recurringChargePeriodType ? `per ${pop.recurringChargePeriodType}` : (pop.priceType || 'Monthly')}
                          </div>
                        </div>

                        {onNavigateToPrice && (
                          <button
                            type="button"
                            onClick={() => onNavigateToPrice(pop)}
                            style={{
                              background: 'rgba(230,0,0,0.06)',
                              border: '1px solid var(--ds-brand)',
                              color: 'var(--ds-brand)',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="View Pricing Model details"
                          >
                            <span>View Price Model</span>
                            <span>→</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ── If Bundle Price: Render Child Components & Associated Simple Offers ── */}
                    {isBundlePop && childPops.length > 0 && (
                      <div style={{
                        marginTop: '16px',
                        paddingTop: '14px',
                        borderTop: '1px dashed rgba(124,58,237,0.25)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ds-spec)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Icon name="layers" size={13} />
                            Associated Simple Offers under Bundle Price ({childPops.length} Components)
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                          {childPops.map((ch, cIdx) => (
                            <div
                              key={cIdx}
                              style={{
                                background: '#ffffff',
                                border: `1px solid ${C.cardBorder}`,
                                borderRadius: '8px',
                                padding: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: '8px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                              }}
                            >
                              <div>
                                {/* Role badge & Component Price */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                  <span style={{
                                    fontSize: '10.5px',
                                    fontWeight: '700',
                                    color: ch.roleInfo.badgeColor,
                                    background: ch.roleInfo.badgeBg,
                                    border: `1px solid ${ch.roleInfo.badgeBorder}`,
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <Icon name={ch.roleInfo.icon} size={11} />
                                    {ch.roleInfo.label}
                                  </span>
                                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--ds-warn)' }}>
                                    {ch.pop.price ? `${ch.pop.price.value} ${ch.pop.price.unit || 'EUR'}` : '0 EUR'}
                                  </span>
                                </div>

                                {/* Child POP ID */}
                                <div style={{ fontSize: '11px', color: C.muted, fontFamily: 'var(--ds-font-mono)', marginBottom: '8px' }}>
                                  POP: {ch.pop.id}
                                </div>

                                {/* Service Code & Bandwidth Chips */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                                  {ch.bandwidth && (
                                    <span style={{ fontSize: '10.5px', background: 'var(--ds-surface-2)', padding: '1px 6px', borderRadius: '4px', color: C.text, fontWeight: '600' }}>
                                      {ch.bandwidth} Mbit/s
                                    </span>
                                  )}
                                  {ch.serviceCodes.map((sc, sIdx) => (
                                    <span key={sIdx} style={{ fontSize: '10.5px', background: 'rgba(230,0,0,0.06)', color: 'var(--ds-brand-dark)', border: '1px solid rgba(230,0,0,0.2)', padding: '1px 6px', borderRadius: '4px', fontFamily: 'var(--ds-font-mono)', fontWeight: '600' }}>
                                      {sc}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Associated Simple Offer Box */}
                              <div style={{
                                background: ch.matchedSimpleOffer ? 'rgba(124,58,237,0.04)' : 'var(--ds-surface-subtle)',
                                border: ch.matchedSimpleOffer ? '1px solid rgba(124,58,237,0.2)' : `1px solid ${C.cardBorder}`,
                                borderRadius: '6px',
                                padding: '8px 10px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                {ch.matchedSimpleOffer ? (
                                  <>
                                    <div style={{ overflow: 'hidden' }}>
                                      <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ds-spec)', fontWeight: '700' }}>
                                        Associated Simple Offer
                                      </div>
                                      <div style={{ fontSize: '12px', fontWeight: '700', color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ch.matchedSimpleOffer.name}>
                                        {ch.matchedSimpleOffer.name || ch.matchedSimpleOffer.id}
                                      </div>
                                      <div style={{ fontSize: '10px', color: C.muted, fontFamily: 'var(--ds-font-mono)' }}>
                                        {ch.matchedSimpleOffer.id}
                                      </div>
                                    </div>

                                    {onNavigateToEntity && (
                                      <button
                                        type="button"
                                        onClick={() => onNavigateToEntity(ch.matchedSimpleOffer, 'ProductOffering')}
                                        style={{
                                          background: '#ffffff',
                                          border: '1px solid var(--ds-brand)',
                                          color: 'var(--ds-brand)',
                                          padding: '4px 8px',
                                          borderRadius: '4px',
                                          fontSize: '11px',
                                          fontWeight: '700',
                                          cursor: 'pointer',
                                          flexShrink: 0,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px'
                                        }}
                                        title="Open this Simple Offer in Drawer"
                                      >
                                        <span>View</span>
                                        <span>→</span>
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <div style={{ fontSize: '11px', color: C.muted, fontStyle: 'italic' }}>
                                    Component Price: {ch.roleInfo.label}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Associated Bundle Prices in Catalog (For Option Offerings) */}
          {isOption && associatedBundlePops.length > 0 && (
            <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span><Icon name="layers" size={16} /> Composite Bundle Prices Including This Option</span>
                  <span style={{ fontSize: '11px', color: 'var(--ds-spec)', background: 'rgba(124,58,237,0.1)', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                    {associatedBundlePops.length} Bundles
                  </span>
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                {associatedBundlePops.slice(0, 10).map((bPop, bIdx) => (
                  <div
                    key={bIdx}
                    style={{
                      background: 'var(--ds-surface-subtle)',
                      border: `1px solid ${C.cardBorder}`,
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: C.text }}>
                        {bPop.name || bPop.id}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ds-warn)', fontWeight: '700', marginTop: '2px' }}>
                        {bPop.price ? `${bPop.price.value} ${bPop.price.unit || 'EUR'}` : 'Dynamic'}
                      </div>
                    </div>

                    {onNavigateToPrice && (
                      <button
                        type="button"
                        onClick={() => onNavigateToPrice(bPop)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid var(--ds-border)',
                          color: C.text,
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        View Bundle POP →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* ─── TAB CONTENT 3: CHARACTERISTICS ─── */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeSubTab === 'characteristics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Associated Product Specification Linkage Card */}
          {specObj && (
            <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '13.5px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span><Icon name="clipboard" size={14} /> Associated Product Specification</span>
              </h3>
              <div style={{
                background: 'rgba(124,58,237,0.06)',
                border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ds-spec)' }}>
                    {specObj.name || specObj.id}
                  </div>
                  <div style={{ fontSize: '11px', color: C.muted, fontFamily: 'var(--ds-font-mono)', marginTop: '2px' }}>
                    ID: {specObj.id}
                  </div>
                </div>
                {specObj.version && (
                  <span style={{ fontSize: '11px', background: 'rgba(124,58,237,0.12)', color: 'var(--ds-spec)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                    v{specObj.version}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Characteristics Grid with Live Search Filter */}
          <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span><Icon name="sliders" size={16} /> Product Offering Characteristics</span>
                  <span style={{ fontSize: '11px', background: 'rgba(2,132,199,0.1)', color: 'var(--ds-info)', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                    {filteredChars.length} / {chars.length}
                  </span>
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: C.muted }}>
                  Characteristic values, overrides, and technical codes defined on this offering.
                </p>
              </div>

              {/* Search input */}
              <div style={{ position: 'relative', minWidth: '220px', maxWidth: '320px', width: '100%' }}>
                <input
                  type="text"
                  placeholder="Filter characteristics..."
                  value={charSearch}
                  onChange={(e) => setCharSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 28px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: `1px solid ${C.cardBorder}`,
                    background: 'var(--ds-surface-subtle)',
                    color: C.text,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }}>
                  <Icon name="search" size={13} />
                </span>
                {charSearch && (
                  <button
                    onClick={() => setCharSearch('')}
                    style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '12px', padding: 0 }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {filteredChars.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: C.muted, fontSize: '12px', fontStyle: 'italic', background: 'var(--ds-surface-subtle)', borderRadius: '8px' }}>
                {charSearch ? `No characteristics matching "${charSearch}".` : 'No characteristics defined directly on this offering.'}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                {filteredChars.map((char, i) => {
                  const vals = Array.isArray(char.productSpecCharacteristicValue)
                    ? char.productSpecCharacteristicValue.map(v => (v?.value !== undefined ? v.value : v))
                    : (Array.isArray(char.productOfferingPriceCharacteristicValue)
                      ? char.productOfferingPriceCharacteristicValue.map(v => (v?.value !== undefined ? v.value : v))
                      : (Array.isArray(char.value) ? char.value : [char.value]));

                  const cleanVals = vals.filter(v => v !== undefined && v !== null);

                  return (
                    <div
                      key={i}
                      style={{
                        background: 'var(--ds-surface-subtle)',
                        border: `1px solid ${C.cardBorder}`,
                        borderRadius: '8px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '6px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: C.text, wordBreak: 'break-all' }}>
                          {char.name}
                        </div>
                        {char.valueType && (
                          <div style={{ fontSize: '10px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>
                            {char.valueType}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {cleanVals.length === 0 ? (
                          <span style={{ fontSize: '11px', color: C.muted, fontStyle: 'italic' }}>-</span>
                        ) : (
                          cleanVals.map((v, vIdx) => (
                            <span
                              key={vIdx}
                              style={{
                                fontSize: '11px',
                                color: 'var(--ds-info)',
                                background: 'rgba(2,132,199,0.08)',
                                border: '1px solid rgba(2,132,199,0.2)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontFamily: 'var(--ds-font-mono)',
                                wordBreak: 'break-all'
                              }}
                            >
                              {String(v)}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* ─── TAB CONTENT 4: CATEGORIES ─── */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeSubTab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header Card with Stats & Controls */}
          <div style={{
            background: C.panel,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: '10px',
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span><Icon name="folder" size={16} /> Categories & Category Groupings</span>
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: C.muted }}>
                  Catalog placement hierarchy and commercial grouping assignments.
                </p>
              </div>

              {/* Group & Category Summary Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: 'var(--ds-brand-dark)',
                  background: 'rgba(230,0,0,0.08)',
                  border: '1px solid rgba(230,0,0,0.2)',
                  padding: '3px 10px',
                  borderRadius: '6px'
                }}>
                  {treeGroups.length} {treeGroups.length === 1 ? 'Category Group' : 'Category Groups'}
                </span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: 'var(--ds-ok)',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  padding: '3px 10px',
                  borderRadius: '6px'
                }}>
                  {totalCategoriesCount} Associated {totalCategoriesCount === 1 ? 'Category' : 'Categories'}
                </span>
              </div>
            </div>

            {/* Controls Bar: Search Filter & Expand/Collapse All */}
            {treeGroups.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                marginTop: '16px',
                paddingTop: '14px',
                borderTop: `1px solid ${C.cardBorder}`,
                flexWrap: 'wrap'
              }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                  <input
                    type="text"
                    placeholder="Filter groups or categories..."
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px 6px 28px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: `1px solid ${C.cardBorder}`,
                      background: 'var(--ds-surface-subtle)',
                      color: C.text,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }}>
                    <Icon name="search" size={13} />
                  </span>
                  {categoryFilter && (
                    <button
                      onClick={() => setCategoryFilter('')}
                      style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '12px', padding: 0 }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={expandAllGroups}
                    style={{
                      background: '#ffffff',
                      border: `1px solid ${C.cardBorder}`,
                      color: C.text,
                      padding: '5px 10px',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Expand All
                  </button>
                  <button
                    type="button"
                    onClick={collapseAllGroups}
                    style={{
                      background: '#ffffff',
                      border: `1px solid ${C.cardBorder}`,
                      color: C.text,
                      padding: '5px 10px',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Collapse All
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Category Tree Groups */}
          {filteredTreeGroups.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: C.muted, fontSize: '12px', fontStyle: 'italic', background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}>
              {categoryFilter ? `No categories or groups matching "${categoryFilter}".` : 'No categories or category groupings associated with this offering.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredTreeGroups.map(group => {
                const isExpanded = Boolean(expandedGroupIds[group.id]);

                return (
                  <div
                    key={group.id}
                    style={{
                      background: C.panel,
                      border: `1px solid ${C.cardBorder}`,
                      borderRadius: '10px',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}
                  >
                    {/* Group Header */}
                    <div
                      onClick={() => toggleGroup(group.id)}
                      style={{
                        padding: '12px 16px',
                        background: 'var(--ds-surface-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', color: C.muted, transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block' }}>
                          ▶
                        </span>
                        <Icon name="folder" size={15} />
                        <span style={{ fontSize: '13px', fontWeight: '700', color: C.text }}>
                          {group.name}
                        </span>
                        {group.sku && (
                          <span style={{ fontSize: '10.5px', background: 'rgba(230,0,0,0.06)', color: 'var(--ds-brand-dark)', border: '1px solid rgba(230,0,0,0.2)', padding: '1px 6px', borderRadius: '4px', fontFamily: 'var(--ds-font-mono)' }}>
                            SKU: {group.sku}
                          </span>
                        )}
                      </div>

                      <span style={{ fontSize: '11px', color: C.muted, background: 'var(--ds-surface-2)', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>
                        {group.categories.length} {group.categories.length === 1 ? 'Category' : 'Categories'}
                      </span>
                    </div>

                    {/* Group Children (Categories) */}
                    {isExpanded && (
                      <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.cardBorder}` }}>
                        {group.categories.length === 0 ? (
                          <div style={{ fontSize: '12px', color: C.muted, fontStyle: 'italic', padding: '6px 0' }}>
                            No categories in this group.
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
                            {group.categories.map((cat, cIdx) => (
                              <div
                                key={cIdx}
                                style={{
                                  background: '#ffffff',
                                  border: `1px solid ${C.cardBorder}`,
                                  borderRadius: '6px',
                                  padding: '10px 12px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                              >
                                <div style={{ overflow: 'hidden' }}>
                                  <div style={{ fontSize: '12px', fontWeight: '700', color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {cat.name}
                                  </div>
                                  <div style={{ fontSize: '10.5px', color: C.muted, fontFamily: 'var(--ds-font-mono)', marginTop: '2px' }}>
                                    ID: {cat.id} &bull; v{cat.version}
                                  </div>
                                </div>

                                {(onNavigateToCategory || onNavigateToEntity) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onNavigateToCategory) onNavigateToCategory(cat.raw || cat);
                                      else if (onNavigateToEntity) onNavigateToEntity(cat.raw || cat, 'Category');
                                    }}
                                    style={{
                                      background: 'rgba(230,0,0,0.06)',
                                      border: '1px solid var(--ds-brand)',
                                      color: 'var(--ds-brand)',
                                      padding: '3px 8px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: '600',
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
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* ─── TAB CONTENT 5: CONTRACT TERMS ─── */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeSubTab === 'terms' && terms.length > 0 && (
        <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span><Icon name="edit" size={14} /> Contract Terms</span>
            <span style={{ fontSize: '11px', color: C.muted, fontWeight: '400' }}>({terms.length})</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {terms.map((t, idx) => (
              <div key={idx} style={{ background: 'var(--ds-surface-subtle)', border: `1px solid ${C.cardBorder}`, padding: '12px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: C.text }}>{t.name || `Term #${idx + 1}`}</div>
                {t.description && <div style={{ fontSize: '12px', color: C.muted, marginTop: '4px' }}>{t.description}</div>}
                {t.duration && (
                  <div style={{ fontSize: '12px', color: 'var(--ds-ok)', fontWeight: '600', marginTop: '6px' }}>
                    Duration: {t.duration.amount} {t.duration.units}
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
