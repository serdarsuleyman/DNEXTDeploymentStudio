import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from '../ui/Icon';
import SearchableSpecSelect from '../ui/SearchableSpecSelect';
import { LifecyclePill, VersionCell } from '../list-views/cellRenderers';
import { isOptionSpec, isHardwareSpec } from './viewTemplateRegistry';
import { lookupCatalogCategory, getAllCatalogCategories } from '../../utils/categoryResolver';

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
  isOptionView = false,
  isHardwareView = false,
  onUpdateItem
}) {
  const raw = item?.raw || {};
  const pops = Array.isArray(raw.productOfferingPrice) ? raw.productOfferingPrice : [];
  const spec = raw.productSpecification || item?.productSpecification;
  const specObj = useMemo(() => {
    if (!spec) return null;
    const base = typeof spec === 'object' && spec !== null ? { ...spec } : { id: spec, name: spec };
    if (base.version === undefined && Array.isArray(allEntities)) {
      const match = allEntities.find(e =>
        e.entityType === 'ProductSpecification' &&
        (e.id === base.id || e.raw?.id === base.id)
      );
      if (match) {
        base.version = match.version !== undefined ? match.version : (match.raw?.version || '0');
        if (!base.name) base.name = match.name;
        base.raw = match.raw || match;
      }
    }
    if (base.version === undefined) {
      base.version = '0';
    }
    return base;
  }, [spec, allEntities]);
  const terms = Array.isArray(raw.productOfferingTerm) ? raw.productOfferingTerm : [];
  const bundledOffers = Array.isArray(raw.bundledProductOffering) ? raw.bundledProductOffering : [];

  const isHardware = isHardwareView || isHardwareSpec(item);
  const isOption = !isHardware && (isOptionView || isOptionSpec(item));

  // ─── Edit Mode State ───
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(null);

  // Quick inputs in edit mode
  const [newCharName, setNewCharName] = useState('');
  const [newCharVal, setNewCharVal] = useState('');
  const [selectedCatToAdd, setSelectedCatToAdd] = useState('');

  // ─── Specifications Catalog (for Option edit mode specification selection) ───
  const [availableSpecs, setAvailableSpecs] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const specMap = new Map();
    if (Array.isArray(allEntities)) {
      allEntities.forEach(e => {
        if (e.entityType === 'ProductSpecification' || e.raw?.['@type'] === 'ProductSpecification') {
          const rawE = e.raw || e;
          const id = e.id || rawE.id;
          const ver = String(rawE.version !== undefined ? rawE.version : (e.version || '0'));
          const key = `${id}:::${ver}`;
          specMap.set(key, {
            id,
            name: e.name || rawE.name || id,
            version: ver,
            raw: rawE
          });
        }
      });
    }

    fetch('/api/dnext/product-specifications?limit=1000')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : data?.data || data?.items || [];
        list.forEach(s => {
          const id = s.id;
          const ver = String(s.version !== undefined ? s.version : '0');
          const key = `${id}:::${ver}`;
          specMap.set(key, {
            id,
            name: s.name || id,
            version: ver,
            raw: s
          });
        });
        setAvailableSpecs(Array.from(specMap.values()).sort((a, b) => {
          const nameCmp = (a.name || '').localeCompare(b.name || '');
          if (nameCmp !== 0) return nameCmp;
          return String(b.version).localeCompare(String(a.version), undefined, { numeric: true });
        }));
      })
      .catch(err => {
        console.warn('Failed to load specifications for option edit:', err);
        if (isMounted && specMap.size > 0) {
          setAvailableSpecs(Array.from(specMap.values()));
        }
      });

    return () => { isMounted = false; };
  }, [allEntities]);

  const allDropdownSpecs = useMemo(() => {
    const map = new Map();
    if (specObj?.id) {
      const currentVer = String(specObj.version !== undefined ? specObj.version : '0');
      const currentKey = `${specObj.id}:::${currentVer}`;
      map.set(currentKey, {
        id: specObj.id,
        name: specObj.name || specObj.id,
        version: currentVer,
        raw: specObj.raw || specObj
      });
    }
    availableSpecs.forEach(s => {
      const key = `${s.id}:::${s.version}`;
      map.set(key, s);
    });
    return Array.from(map.values()).sort((a, b) => {
      const nameCmp = (a.name || '').localeCompare(b.name || '');
      if (nameCmp !== 0) return nameCmp;
      return String(b.version).localeCompare(String(a.version), undefined, { numeric: true });
    });
  }, [availableSpecs, specObj]);

  // Working copy of data during edit
  // Note: Name and ID fields are strictly unique and immutable in DNEXT Product Catalog (agent.md)
  const [formData, setFormData] = useState({
    description: raw.description || '',
    lifecycleStatus: item?.lifecycleStatus || 'Launched',
    startDate: raw.validFor?.startDateTime ? raw.validFor.startDateTime.split('T')[0] : '',
    endDate: raw.validFor?.endDateTime ? raw.validFor.endDateTime.split('T')[0] : '',
    categories: Array.isArray(raw.category) ? raw.category : [],
    chars: Array.isArray(raw.prodSpecCharValueUse) ? raw.prodSpecCharValueUse : (Array.isArray(raw.productSpecCharacteristic) ? raw.productSpecCharacteristic : []),
    pops: Array.isArray(raw.productOfferingPrice) ? raw.productOfferingPrice : [],
    spec: specObj ? {
      id: specObj.id,
      name: specObj.name || specObj.id,
      version: specObj.version !== undefined ? String(specObj.version) : '0',
      href: specObj.href || `/api/productCatalogManagement/v4/productSpecification/${specObj.id}:(version=${specObj.version || '0'})`,
      '@referredType': 'ProductSpecification'
    } : null
  });

  useEffect(() => {
    setFormData({
      description: raw.description || '',
      lifecycleStatus: item?.lifecycleStatus || 'Launched',
      startDate: raw.validFor?.startDateTime ? raw.validFor.startDateTime.split('T')[0] : '',
      endDate: raw.validFor?.endDateTime ? raw.validFor.endDateTime.split('T')[0] : '',
      categories: Array.isArray(raw.category) ? raw.category : [],
      chars: Array.isArray(raw.prodSpecCharValueUse) ? raw.prodSpecCharValueUse : (Array.isArray(raw.productSpecCharacteristic) ? raw.productSpecCharacteristic : []),
      pops: Array.isArray(raw.productOfferingPrice) ? raw.productOfferingPrice : [],
      spec: specObj ? {
        id: specObj.id,
        name: specObj.name || specObj.id,
        version: specObj.version !== undefined ? String(specObj.version) : '0',
        href: specObj.href || `/api/productCatalogManagement/v4/productSpecification/${specObj.id}:(version=${specObj.version || '0'})`,
        '@referredType': 'ProductSpecification'
      } : null
    });
    setIsEditing(false);
    setIsDirty(false);
  }, [item?.id, item?.version, specObj]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setIsDirty(false);
    setSaveFeedback(null);
  };

  const handleCancelEdit = () => {
    setFormData({
      description: raw.description || '',
      lifecycleStatus: item?.lifecycleStatus || 'Launched',
      startDate: raw.validFor?.startDateTime ? raw.validFor.startDateTime.split('T')[0] : '',
      endDate: raw.validFor?.endDateTime ? raw.validFor.endDateTime.split('T')[0] : '',
      categories: Array.isArray(raw.category) ? raw.category : [],
      chars: Array.isArray(raw.prodSpecCharValueUse) ? raw.prodSpecCharValueUse : (Array.isArray(raw.productSpecCharacteristic) ? raw.productSpecCharacteristic : []),
      pops: Array.isArray(raw.productOfferingPrice) ? raw.productOfferingPrice : [],
      spec: specObj ? {
        id: specObj.id,
        name: specObj.name || specObj.id,
        version: specObj.version !== undefined ? String(specObj.version) : '0',
        href: specObj.href || `/api/productCatalogManagement/v4/productSpecification/${specObj.id}:(version=${specObj.version || '0'})`,
        '@referredType': 'ProductSpecification'
      } : null
    });
    setIsEditing(false);
    setIsDirty(false);
  };

  const handleSpecChange = (selectedSpecObj) => {
    if (!selectedSpecObj) return;
    const newSpecEntry = {
      id: selectedSpecObj.id,
      name: selectedSpecObj.name || selectedSpecObj.id,
      version: String(selectedSpecObj.version !== undefined ? selectedSpecObj.version : '0'),
      href: selectedSpecObj.raw?.href || `/api/productCatalogManagement/v4/productSpecification/${selectedSpecObj.id}:(version=${selectedSpecObj.version || '0'})`,
      '@referredType': 'ProductSpecification'
    };
    setFormData(prev => ({
      ...prev,
      spec: newSpecEntry
    }));
    setIsDirty(true);
  };

  const activeSpec = (isEditing && isOption && formData.spec) ? formData.spec : specObj;

  const handleFieldChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    setIsDirty(true);
  };

  const handleCharValChange = (charIndex, val) => {
    setFormData(prev => {
      const nextChars = [...prev.chars];
      const char = { ...nextChars[charIndex] };
      if (Array.isArray(char.productSpecCharacteristicValue)) {
        char.productSpecCharacteristicValue = [{ value: val }];
      } else if (Array.isArray(char.value)) {
        char.value = [val];
      } else {
        char.value = val;
      }
      nextChars[charIndex] = char;
      return { ...prev, chars: nextChars };
    });
    setIsDirty(true);
  };

  const handleAddChar = () => {
    if (!newCharName.trim()) return;
    setFormData(prev => ({
      ...prev,
      chars: [
        ...prev.chars,
        {
          name: newCharName.trim(),
          valueType: 'String',
          productSpecCharacteristicValue: [{ value: newCharVal.trim() }]
        }
      ]
    }));
    setNewCharName('');
    setNewCharVal('');
    setIsDirty(true);
  };

  const handleRemoveChar = (index) => {
    setFormData(prev => ({
      ...prev,
      chars: prev.chars.filter((_, idx) => idx !== index)
    }));
    setIsDirty(true);
  };

  const handleAddCategory = (catId) => {
    if (!catId) return;
    const catObj = lookupCatalogCategory(catId) || allEntities.find(e => e.id === catId);
    const catEntry = {
      id: catId,
      name: catObj?.name || catId,
      href: `/api/productCatalogManagement/v4/category/${catId}`,
      '@referredType': 'Category'
    };
    setFormData(prev => {
      if (prev.categories.some(c => (c?.id || c) === catId)) return prev;
      return {
        ...prev,
        categories: [...prev.categories, catEntry]
      };
    });
    setSelectedCatToAdd('');
    setIsDirty(true);
  };

  const handleRemoveCategory = (catId) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => (c?.id || c) !== catId)
    }));
    setIsDirty(true);
  };

  const handleAddPop = () => {
    const newPopId = `pop_${item?.id || 'option'}_rc_${Date.now().toString(36)}`;
    const newPop = {
      id: newPopId,
      name: `POP_${formData.name || item?.id}_RC`,
      priceType: 'Recurring charge',
      price: { value: 0, unit: 'EUR' },
      recurringChargePeriodType: 'monthly',
      '@referredType': 'ProductOfferingPrice'
    };
    setFormData(prev => ({
      ...prev,
      pops: [...prev.pops, newPop]
    }));
    setIsDirty(true);
  };

  const handleRemovePop = (popIndex) => {
    setFormData(prev => ({
      ...prev,
      pops: prev.pops.filter((_, idx) => idx !== popIndex)
    }));
    setIsDirty(true);
  };

  const handlePopFieldChange = (popIndex, field, val) => {
    setFormData(prev => {
      const nextPops = [...prev.pops];
      const p = { ...nextPops[popIndex] };
      if (field === 'priceValue') {
        const num = parseFloat(val);
        p.price = { ...(p.price || {}), value: isNaN(num) ? 0 : num, unit: p.price?.unit || 'EUR' };
      } else if (field === 'priceType') {
        p.priceType = val;
      } else if (field === 'period') {
        p.recurringChargePeriodType = val;
      }
      nextPops[popIndex] = p;
      return { ...prev, pops: nextPops };
    });
    setIsDirty(true);
  };

  const handleSave = () => {
    // Note: Name and ID fields are strictly unique and immutable in DNEXT Product Catalog (agent.md)
    const updatedRaw = {
      ...raw,
      description: (formData.description || '').trim(),
      lifecycleStatus: formData.lifecycleStatus,
      validFor: {
        ...(raw.validFor || {}),
        startDateTime: formData.startDate ? new Date(formData.startDate).toISOString() : raw.validFor?.startDateTime,
        endDateTime: formData.endDate ? new Date(formData.endDate).toISOString() : undefined
      },
      productSpecification: (isOption && formData.spec) ? formData.spec : (raw.productSpecification || specObj),
      category: formData.categories,
      prodSpecCharValueUse: formData.chars,
      productOfferingPrice: formData.pops
    };

    const updatedItem = {
      ...item,
      lifecycleStatus: formData.lifecycleStatus,
      productSpecification: (isOption && formData.spec) ? formData.spec : (item?.productSpecification || specObj),
      raw: updatedRaw
    };

    if (onUpdateItem) {
      onUpdateItem(updatedItem);
    }

    setIsEditing(false);
    setIsDirty(false);
    setSaveFeedback({
      type: 'success',
      message: `Option "${item?.name || item?.id}" updated in local state (ready for release management persistence).`
    });
    setTimeout(() => setSaveFeedback(null), 4500);
  };

  // Catalog category catalog list for searchable dropdowns
  const allCatalogCategories = useMemo(() => {
    return getAllCatalogCategories();
  }, []);

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
    const list = isEditing ? formData.categories : (Array.isArray(raw.category) ? raw.category : []);
    return Array.isArray(list) ? list : [];
  }, [raw, isEditing, formData.categories]);

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

  // Detailed pricing resolution for the header metric & price type display
  const pricingDetails = useMemo(() => {
    if (!resolvedPops || resolvedPops.length === 0) {
      return null;
    }

    // Sort to prioritize recurring charges or defined prices if multiple POPs exist
    const sorted = [...resolvedPops].sort((a, b) => {
      const typeA = (a.pop?.priceType || '').toLowerCase();
      const typeB = (b.pop?.priceType || '').toLowerCase();
      if (typeA.includes('recurring') && !typeB.includes('recurring')) return -1;
      if (!typeA.includes('recurring') && typeB.includes('recurring')) return 1;
      const valA = Number(a.pop?.price?.value || 0);
      const valB = Number(b.pop?.price?.value || 0);
      return valB - valA;
    });

    for (const item of sorted) {
      const p = item.pop;
      if (!p) continue;

      let val = null;
      let unit = 'EUR';
      if (p.price?.value !== undefined && p.price?.value !== null && p.price?.value !== '') {
        val = p.price.value;
        unit = p.price.unit || 'EUR';
      } else if (typeof p.price === 'number') {
        val = p.price;
        unit = 'EUR';
      } else if (p.price?.taxIncludedAmount?.value !== undefined) {
        val = p.price.taxIncludedAmount.value;
        unit = p.price.taxIncludedAmount.unit || 'EUR';
      } else if (p.price?.dutyFreeAmount?.value !== undefined) {
        val = p.price.dutyFreeAmount.value;
        unit = p.price.dutyFreeAmount.unit || 'EUR';
      }

      const hasNumericVal = val !== null && !isNaN(Number(val));
      const priceType = p.priceType || p.price_type || null;
      const period = p.recurringChargePeriodType || p.recurringChargePeriod || null;

      // Pricing is considered defined if either numeric price or explicit priceType is provided
      if (hasNumericVal || priceType) {
        let displayPrice = 'Dynamic';
        if (hasNumericVal) {
          const num = Number(val);
          displayPrice = `${!isNaN(num) ? num.toFixed(2).replace(/\.00$/, '') : val} ${unit}`;
        }

        const isRecurring = Boolean(
          (priceType && priceType.toLowerCase().includes('recurring')) ||
          (period && String(period).toLowerCase().includes('month'))
        );

        return {
          hasPrice: true,
          hasNumericVal,
          val: hasNumericVal ? Number(val) : null,
          unit,
          displayPrice,
          priceType: priceType || (item.isBundlePop ? 'Bundle Price' : 'Standard Charge'),
          period,
          isRecurring,
          isBundlePop: item.isBundlePop,
          popId: p.id
        };
      }
    }

    return null;
  }, [resolvedPops]);

  // Primary price string fallback
  const primaryPriceStr = useMemo(() => {
    if (pricingDetails) {
      return pricingDetails.displayPrice;
    }
    if (resolvedPops.length === 0) {
      return isOption ? 'Catalog Option' : 'Dynamic';
    }
    const first = resolvedPops[0]?.pop;
    if (first?.price?.value !== undefined) {
      return `${first.price.value} ${first.price.unit || 'EUR'}`;
    }
    return 'Dynamic';
  }, [pricingDetails, resolvedPops, isOption]);

  // Header metric: Primary Price
  const hasBundlePop = resolvedPops.some(p => p.isBundlePop);

  // Price box visibility in hero header:
  // - Hardware view: always hidden
  // - Option view: ONLY shown if there is a pricing defined under the option
  // - Other views (standard offer, bundle): shown if pricing is defined or dynamic
  const showPriceBox = !isHardware && (isOption ? Boolean(pricingDetails) : true);

  // Header metric: Option Badge Text
  const optionBadgeText = useMemo(() => {
    if (isHardware) return 'Hardware Offering';
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
  }, [isHardware, isOption, raw.isBundle, item?.id, item?.name]);

  const activeChars = isEditing ? formData.chars : chars;
  const activePopsCount = isEditing ? formData.pops.length : resolvedPops.length;
  const activeCategoriesCount = isEditing ? formData.categories.length : totalCategoriesCount;

  // Sub-tabs list aligned with Sales Package detail view
  const subTabs = useMemo(() => [
    { id: 'overview', label: 'Overview', icon: 'chart' },
    { id: 'pricing', label: `Pricing (${activePopsCount})`, icon: 'tag' },
    { id: 'characteristics', label: `Characteristics (${activeChars.length})`, icon: 'sliders' },
    { id: 'categories', label: `Categories (${activeCategoriesCount})`, icon: 'folder' },
    ...(terms.length > 0 ? [{ id: 'terms', label: `Contract Terms (${terms.length})`, icon: 'edit' }] : [])
  ], [activePopsCount, activeChars.length, activeCategoriesCount, terms.length]);

  // Filtered characteristics for Characteristics tab
  const filteredChars = useMemo(() => {
    if (!charSearch.trim()) return activeChars;
    const q = charSearch.toLowerCase();
    return activeChars.filter(c => {
      const nameMatch = (c.name || '').toLowerCase().includes(q);
      const valMatch = (
        Array.isArray(c.productSpecCharacteristicValue)
          ? c.productSpecCharacteristicValue.map(v => (v?.value !== undefined ? v.value : v))
          : (Array.isArray(c.value) ? c.value : [c.value])
      ).some(v => String(v || '').toLowerCase().includes(q));
      return nameMatch || valMatch;
    });
  }, [activeChars, charSearch]);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      {/* ─── Save Feedback Notice ─── */}
      {saveFeedback && (
        <div style={{
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.3)',
          color: 'var(--ds-ok)',
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✓</span>
            <span>{saveFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveFeedback(null)}
            style={{ background: 'none', border: 'none', color: 'var(--ds-ok)', cursor: 'pointer', fontSize: '12px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── Edit Mode Active Banner ─── */}
      {isEditing && (
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: '8px',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px' }}>✍️</span>
            <div>
              <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--ds-warn)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Editing Option Offering
              </span>
              <span style={{ fontSize: '12px', color: C.muted, marginLeft: '8px' }}>
                ID: <code>{item.id}</code>
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isDirty && (
              <span style={{ fontSize: '11px', color: 'var(--ds-warn)', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>●</span> Unsaved Changes
              </span>
            )}
            <button
              type="button"
              onClick={handleCancelEdit}
              style={{
                background: '#ffffff',
                border: `1px solid ${C.cardBorder}`,
                color: C.text,
                padding: '4px 10px',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                background: 'var(--ds-brand)',
                border: '1px solid var(--ds-brand)',
                color: '#ffffff',
                padding: '4px 14px',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(230,0,0,0.2)'
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* ─── Hero Header Banner (Aligned with Sales Package Detail View) ─── */}
      <div style={{
        background: '#ffffff',
        border: `1px solid ${isEditing ? 'rgba(230,0,0,0.3)' : C.cardBorder}`,
        borderRadius: '12px',
        padding: '22px 24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isEditing ? '0 0 0 2px rgba(230,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            {/* Option Name (Strictly non-editable per agent.md - ID and Name are unique in DNEXT Product Catalog) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: C.text, letterSpacing: '-0.02em' }}>
                {item?.name || item?.id}
              </h1>
              {isEditing && (
                <span
                  style={{
                    fontSize: '11px',
                    color: C.muted,
                    background: 'var(--ds-surface-2)',
                    border: '1px solid var(--ds-border)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Name field is unique and immutable in DNEXT Product Catalog"
                >
                  <span>🔒</span>
                  <span>Locked</span>
                </span>
              )}
            </div>

            {/* Offer ID, Copy ID, Spec ID & Role Badge inside hero box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: C.muted }}>ID:</span>
              <code style={{ fontSize: '12px', color: 'var(--ds-warn)', background: 'var(--ds-surface-2)', border: '1px solid var(--ds-border)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--ds-font-mono)' }}>
                {item.id}
              </code>
              {isEditing && (
                <span style={{ fontSize: '10.5px', color: C.muted }} title="ID field is unique and immutable">🔒</span>
              )}
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

              {/* Spec ID or Specification Selector / Link (Option View shows Spec with Version & pull-down in edit mode) */}
              {activeSpec?.id && (
                <>
                  <span style={{ color: 'var(--ds-border-strong)' }}>•</span>
                  {isOption ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: C.muted }}>Specification:</span>
                      {isEditing ? (
                        <SearchableSpecSelect
                          specs={allDropdownSpecs}
                          selectedSpec={activeSpec}
                          onChange={handleSpecChange}
                          compact={true}
                          placeholder="Type to search spec..."
                        />
                      ) : (
                        onNavigateToEntity ? (
                          <button
                            type="button"
                            onClick={() => onNavigateToEntity(activeSpec, 'ProductSpecification')}
                            title={`Navigate to Product Specification: ${activeSpec.name || activeSpec.id} (v${activeSpec.version})`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              background: 'rgba(124,58,237,0.08)',
                              border: '1px solid rgba(124,58,237,0.3)',
                              borderRadius: '4px',
                              padding: '2px 8px',
                              cursor: 'pointer',
                              color: 'var(--ds-spec)',
                              fontSize: '11.5px',
                              fontWeight: '600',
                              textDecoration: 'none',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(124,58,237,0.16)';
                              e.currentTarget.style.borderColor = 'var(--ds-spec)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(124,58,237,0.08)';
                              e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)';
                            }}
                          >
                            <Icon name="clipboard" size={12} />
                            <span style={{ fontFamily: 'var(--ds-font-mono)' }}>{activeSpec.name || activeSpec.id}</span>
                            <span style={{
                              fontSize: '10px',
                              background: 'rgba(124,58,237,0.18)',
                              color: 'var(--ds-spec)',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              fontWeight: '700'
                            }}>
                              v{activeSpec.version}
                            </span>
                            <span style={{ fontSize: '11px', lineHeight: 1 }}>→</span>
                          </button>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <code style={{ fontSize: '12px', color: 'var(--ds-spec)', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--ds-font-mono)' }}>
                              {activeSpec.name || activeSpec.id}
                            </code>
                            <span style={{ fontSize: '10px', background: 'rgba(124,58,237,0.12)', color: 'var(--ds-spec)', padding: '1px 5px', borderRadius: '3px', fontWeight: '700' }}>
                              v{activeSpec.version}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: C.muted }}>Spec ID:</span>
                      <code style={{ fontSize: '12px', color: 'var(--ds-spec)', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--ds-font-mono)' }}>
                        {specObj.id}
                      </code>
                    </div>
                  )}
                </>
              )}

              {/* Component Role Badge */}
              <span style={{ color: 'var(--ds-border-strong)' }}>•</span>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                color: isHardware ? 'var(--ds-brand)' : isOption ? 'var(--ds-info)' : (raw.isBundle ? 'var(--ds-spec)' : 'var(--ds-brand-dark)'),
                background: isHardware ? 'rgba(230,0,0,0.08)' : isOption ? 'rgba(2,132,199,0.1)' : (raw.isBundle ? 'rgba(124,58,237,0.1)' : 'rgba(230,0,0,0.08)'),
                border: isHardware ? '1px solid rgba(230,0,0,0.25)' : isOption ? '1px solid rgba(2,132,199,0.3)' : (raw.isBundle ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(230,0,0,0.2)'),
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {optionBadgeText}
              </span>

              {/* Price Type Badge in header metadata row if pricing is defined on option */}
              {isOption && pricingDetails?.priceType && (
                <>
                  <span style={{ color: 'var(--ds-border-strong)' }}>•</span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: pricingDetails.isRecurring ? 'var(--ds-info)' : 'var(--ds-spec)',
                    background: pricingDetails.isRecurring ? 'rgba(2,132,199,0.08)' : 'rgba(124,58,237,0.08)',
                    border: `1px solid ${pricingDetails.isRecurring ? 'rgba(2,132,199,0.25)' : 'rgba(124,58,237,0.25)'}`,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Icon name="tag" size={11} />
                    <span>{pricingDetails.priceType}</span>
                    {pricingDetails.period && <span style={{ opacity: 0.85 }}>({pricingDetails.period})</span>}
                  </span>
                </>
              )}

              {/* Edit Option Button */}
              {isOption && !isEditing && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  style={{
                    background: 'rgba(230,0,0,0.06)',
                    border: '1px solid var(--ds-brand)',
                    color: 'var(--ds-brand)',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    marginLeft: '8px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Edit details of this Option Offering"
                >
                  <Icon name="edit" size={12} />
                  <span>Edit Option</span>
                </button>
              )}
            </div>

            {isEditing ? (
              <div style={{ marginTop: '8px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => handleFieldChange('description', e.target.value)}
                  rows={2}
                  placeholder="Commercial description of this option offering..."
                  style={{
                    width: '100%',
                    maxWidth: '620px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${C.cardBorder}`,
                    outline: 'none',
                    fontSize: '12px',
                    lineHeight: '1.4',
                    background: '#ffffff',
                    color: C.text
                  }}
                />
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '13px', color: C.muted, maxWidth: '620px', lineHeight: '1.5' }}>
                {formData.description || raw.description || (isHardware
                  ? 'Commercial hardware product offering configured with technical specifications and device attributes.'
                  : isOption
                  ? 'Commercial component option for broadband access, speed tiering, or voice services.'
                  : 'Commercial broadband product offering configured with commercial terms and pricing models.')}
              </p>
            )}
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

            {/* Price Metric (Hidden for Hardware, and hidden for Options if no price defined) */}
            {showPriceBox && (
              <div style={{
                background: '#ffffff',
                border: `1px solid ${C.cardBorder}`,
                borderRadius: '10px',
                padding: '12px 18px',
                minWidth: '120px',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                  {pricingDetails?.isBundlePop || hasBundlePop ? 'Bundle Price' : 'Price'}
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '800',
                  color: (pricingDetails?.isBundlePop || hasBundlePop) ? 'var(--ds-spec)' : 'var(--ds-warn)',
                  marginTop: '2px'
                }}>
                  {pricingDetails ? pricingDetails.displayPrice : primaryPriceStr}
                </div>
                {/* Price Type badge in option/offering header */}
                {pricingDetails?.priceType && (
                  <div style={{ marginTop: '4px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        color: pricingDetails.isRecurring ? 'var(--ds-info)' : 'var(--ds-spec)',
                        background: pricingDetails.isRecurring ? 'rgba(2,132,199,0.08)' : 'rgba(124,58,237,0.08)',
                        border: `1px solid ${pricingDetails.isRecurring ? 'rgba(2,132,199,0.25)' : 'rgba(124,58,237,0.25)'}`,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        whiteSpace: 'nowrap'
                      }}
                      title={`Price Type: ${pricingDetails.priceType}${pricingDetails.period ? ` (${pricingDetails.period})` : ''}`}
                    >
                      <span>{pricingDetails.priceType}</span>
                      {pricingDetails.period && (
                        <span style={{ opacity: 0.85 }}>({pricingDetails.period})</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

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
                {isEditing ? (
                  <select
                    value={formData.lifecycleStatus}
                    onChange={e => handleFieldChange('lifecycleStatus', e.target.value)}
                    style={{
                      padding: '4px 6px',
                      borderRadius: '4px',
                      border: `1px solid ${C.cardBorder}`,
                      fontSize: '11px',
                      fontWeight: '700',
                      color: C.text,
                      cursor: 'pointer',
                      background: '#ffffff'
                    }}
                  >
                    <option value="Launched">Launched</option>
                    <option value="In test">In test</option>
                    <option value="In study">In study</option>
                    <option value="Retired">Retired</option>
                  </select>
                ) : (
                  <LifecyclePill status={formData.lifecycleStatus || item.lifecycleStatus} />
                )}
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
              Attributes & Lifecycle {isEditing && <span style={{ fontSize: '11px', color: 'var(--ds-warn)', fontWeight: 'bold' }}>(Editable Mode)</span>}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', color: C.muted }}>Entity Type</span>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ds-brand-dark)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{item.entityType}</span>
                  {isEditing && <span style={{ fontSize: '10px', color: C.muted }} title="Immutable TMF Type">🔒</span>}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.muted }}>Version</span>
                <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <VersionCell version={item.version} />
                  {isEditing && <span style={{ fontSize: '10px', color: C.muted }} title="Version managed by release lifecycle">🔒</span>}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.muted }}>Lifecycle Status</span>
                <div style={{ marginTop: '4px' }}>
                  {isEditing ? (
                    <select
                      value={formData.lifecycleStatus}
                      onChange={e => handleFieldChange('lifecycleStatus', e.target.value)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: `1px solid ${C.cardBorder}`,
                        fontSize: '12px',
                        fontWeight: '700',
                        color: C.text,
                        cursor: 'pointer',
                        background: '#ffffff'
                      }}
                    >
                      <option value="Launched">Launched</option>
                      <option value="In test">In test</option>
                      <option value="In study">In study</option>
                      <option value="Retired">Retired</option>
                    </select>
                  ) : (
                    <LifecyclePill status={formData.lifecycleStatus || item.lifecycleStatus} />
                  )}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.muted }}>Bundle Offering?</span>
                <div style={{ fontSize: '13px', fontWeight: '600', color: raw.isBundle ? 'var(--ds-spec)' : C.muted, marginTop: '2px' }}>
                  {raw.isBundle ? 'Yes (Bundle Offer)' : isOption ? 'No (Simple Option)' : 'No (Atomic Offer)'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.muted }}>Valid From</span>
                <div style={{ fontSize: '12px', color: C.text, marginTop: '2px' }}>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={e => handleFieldChange('startDate', e.target.value)}
                      style={{ padding: '3px 6px', borderRadius: '4px', border: `1px solid ${C.cardBorder}`, fontSize: '11px' }}
                    />
                  ) : (
                    <span style={{ fontFamily: 'var(--ds-font-mono)' }}>
                      {formData.startDate || (raw.validFor?.startDateTime ? new Date(raw.validFor.startDateTime).toLocaleDateString() : '-')}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.muted }}>Valid To</span>
                <div style={{ fontSize: '12px', color: C.text, marginTop: '2px' }}>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={e => handleFieldChange('endDate', e.target.value)}
                      style={{ padding: '3px 6px', borderRadius: '4px', border: `1px solid ${C.cardBorder}`, fontSize: '11px' }}
                    />
                  ) : (
                    <span style={{ fontFamily: 'var(--ds-font-mono)' }}>
                      {formData.endDate || (raw.validFor?.endDateTime ? new Date(raw.validFor.endDateTime).toLocaleDateString() : 'Indefinite (Open)')}
                    </span>
                  )}
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
          {(spec || activeSpec) && (
            <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span><Icon name="clipboard" size={14} /> Associated Product Specification</span>
                </h3>
                {isEditing && isOption && (
                  <span style={{ fontSize: '11px', color: 'var(--ds-spec)', background: 'rgba(124,58,237,0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                    Editable in Option Mode
                  </span>
                )}
              </div>

              {isEditing && isOption ? (
                /* Searchable Specification Selector when editing Option */
                <div style={{
                  background: 'rgba(124,58,237,0.04)',
                  border: '1px solid rgba(124,58,237,0.25)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--ds-spec)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                      Change Product Specification (Searchable as typed in with keystrokes) *
                    </label>
                    <SearchableSpecSelect
                      specs={allDropdownSpecs}
                      selectedSpec={activeSpec}
                      onChange={handleSpecChange}
                      compact={false}
                      placeholder="Type keystrokes to search by name, version (e.g. v1) or ID..."
                    />
                  </div>

                  {activeSpec && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#ffffff',
                      border: '1px solid rgba(124,58,237,0.2)',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ds-spec)' }}>
                          {activeSpec.name || activeSpec.id}
                        </div>
                        <div style={{ fontSize: '11px', color: C.muted, fontFamily: 'var(--ds-font-mono)', marginTop: '2px' }}>
                          ID: {activeSpec.id}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', background: 'rgba(124,58,237,0.14)', color: 'var(--ds-spec)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                          v{activeSpec.version !== undefined ? activeSpec.version : '0'}
                        </span>
                        {onNavigateToEntity && (
                          <button
                            type="button"
                            onClick={() => onNavigateToEntity(activeSpec, 'ProductSpecification')}
                            style={{
                              background: 'none',
                              border: '1px solid rgba(124,58,237,0.3)',
                              color: 'var(--ds-spec)',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                            title="Preview Specification Detail View"
                          >
                            Preview Spec →
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
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
                    {isOption && onNavigateToEntity ? (
                      <button
                        type="button"
                        onClick={() => onNavigateToEntity(activeSpec || specObj, 'ProductSpecification')}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          margin: 0,
                          fontSize: '13px',
                          fontWeight: '700',
                          color: 'var(--ds-spec)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          textDecoration: 'underline'
                        }}
                        title="Navigate to Product Specification Detail View"
                      >
                        <span>{activeSpec?.name || activeSpec?.id || specObj?.name || specObj?.id}</span>
                        <span style={{ fontSize: '11px', textDecoration: 'none' }}>↗</span>
                      </button>
                    ) : (
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ds-spec)' }}>
                        {activeSpec?.name || activeSpec?.id || specObj?.name || specObj?.id}
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: C.muted, fontFamily: 'var(--ds-font-mono)', marginTop: '2px' }}>
                      ID: {activeSpec?.id || specObj?.id}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', background: 'rgba(124,58,237,0.12)', color: 'var(--ds-spec)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                      v{(activeSpec?.version !== undefined ? activeSpec.version : specObj?.version) !== undefined ? (activeSpec?.version !== undefined ? activeSpec.version : specObj?.version) : '0'}
                    </span>
                    {isOption && onNavigateToEntity && (
                      <button
                        type="button"
                        onClick={() => onNavigateToEntity(activeSpec || specObj, 'ProductSpecification')}
                        style={{
                          background: 'var(--ds-spec)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '5px',
                          fontSize: '11.5px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 1px 3px rgba(124,58,237,0.3)',
                          transition: 'opacity 0.15s ease'
                        }}
                        title="Navigate to Product Specification Detail View"
                      >
                        <span>View Specification</span>
                        <span>→</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
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
          {/* Edit Mode: Direct Option Pricing Manager */}
          {isEditing && (
            <div style={{
              background: 'rgba(124,58,237,0.06)',
              border: '1px solid rgba(124,58,237,0.25)',
              borderRadius: '10px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ds-spec)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span><Icon name="tag" size={14} /> Direct Option Pricing (POPs)</span>
                  <span style={{ fontSize: '11px', background: 'rgba(124,58,237,0.15)', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                    {formData.pops.length} Components
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleAddPop}
                  style={{
                    background: 'var(--ds-spec)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '6px 14px',
                    borderRadius: '5px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  + Add Price Component
                </button>
              </div>

              {formData.pops.length === 0 ? (
                <div style={{ padding: '16px', background: '#ffffff', borderRadius: '6px', textAlign: 'center', color: C.muted, fontSize: '12px' }}>
                  No price components currently defined under this option. Click "+ Add Price Component" above to define one.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {formData.pops.map((p, pIdx) => {
                    const popObj = typeof p === 'object' ? p : (popMap.get(p) || { id: p });
                    const val = popObj.price?.value !== undefined ? popObj.price.value : (typeof popObj.price === 'number' ? popObj.price : 0);
                    const pType = popObj.priceType || 'Recurring charge';
                    const period = popObj.recurringChargePeriodType || 'monthly';

                    return (
                      <div
                        key={pIdx}
                        style={{
                          background: '#ffffff',
                          border: `1px solid ${C.cardBorder}`,
                          borderRadius: '8px',
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}
                      >
                        <div style={{ minWidth: '160px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: C.text }}>
                            {popObj.name || popObj.id}
                          </div>
                          <code style={{ fontSize: '10px', color: C.muted }}>{popObj.id}</code>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <div>
                            <span style={{ display: 'block', fontSize: '10px', color: C.muted }}>Amount (€):</span>
                            <input
                              type="number"
                              step="0.01"
                              value={val}
                              onChange={e => handlePopFieldChange(pIdx, 'priceValue', e.target.value)}
                              style={{ width: '85px', padding: '4px 6px', borderRadius: '4px', border: `1px solid ${C.cardBorder}`, fontSize: '12px', fontWeight: '700' }}
                            />
                          </div>

                          <div>
                            <span style={{ display: 'block', fontSize: '10px', color: C.muted }}>Price Type:</span>
                            <select
                              value={pType}
                              onChange={e => handlePopFieldChange(pIdx, 'priceType', e.target.value)}
                              style={{ padding: '4px 6px', borderRadius: '4px', border: `1px solid ${C.cardBorder}`, fontSize: '11px', fontWeight: '600' }}
                            >
                              <option value="Recurring charge">Recurring charge</option>
                              <option value="One time charge">One time charge</option>
                              <option value="Usage charge">Usage charge</option>
                            </select>
                          </div>

                          <div>
                            <span style={{ display: 'block', fontSize: '10px', color: C.muted }}>Cycle:</span>
                            <select
                              value={period}
                              onChange={e => handlePopFieldChange(pIdx, 'period', e.target.value)}
                              style={{ padding: '4px 6px', borderRadius: '4px', border: `1px solid ${C.cardBorder}`, fontSize: '11px' }}
                            >
                              <option value="monthly">monthly</option>
                              <option value="yearly">yearly</option>
                              <option value="weekly">weekly</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemovePop(pIdx)}
                            style={{
                              background: 'rgba(230,0,0,0.06)',
                              border: '1px solid rgba(230,0,0,0.2)',
                              color: 'var(--ds-brand)',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              marginTop: '12px'
                            }}
                            title="Remove price component"
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
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
          {/* In Edit Mode: Add Characteristic Bar */}
          {isEditing && (
            <div style={{
              background: 'rgba(2,132,199,0.06)',
              border: '1px solid rgba(2,132,199,0.25)',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px' }}>⚡</span>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--ds-info)' }}>
                    Add / Override Characteristic
                  </div>
                  <div style={{ fontSize: '11px', color: C.muted }}>
                    Define or adjust technical parameters on this option
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Name (e.g. bandwidth, service_code)"
                  value={newCharName}
                  onChange={e => setNewCharName(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '5px', border: `1px solid ${C.cardBorder}`, fontSize: '12px', minWidth: '180px' }}
                />
                <input
                  type="text"
                  placeholder="Value (e.g. 500, IP532)"
                  value={newCharVal}
                  onChange={e => setNewCharVal(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '5px', border: `1px solid ${C.cardBorder}`, fontSize: '12px', minWidth: '150px' }}
                />
                <button
                  type="button"
                  onClick={handleAddChar}
                  disabled={!newCharName.trim()}
                  style={{
                    background: newCharName.trim() ? 'var(--ds-info)' : 'var(--ds-surface-2)',
                    border: 'none',
                    color: newCharName.trim() ? '#ffffff' : C.muted,
                    padding: '6px 14px',
                    borderRadius: '5px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: newCharName.trim() ? 'pointer' : 'default'
                  }}
                >
                  + Add Characteristic
                </button>
              </div>
            </div>
          )}

          {/* Associated Product Specification Linkage Card */}
          {(specObj || activeSpec) && (
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
                  {isOption && onNavigateToEntity ? (
                    <button
                      type="button"
                      onClick={() => onNavigateToEntity(activeSpec || specObj, 'ProductSpecification')}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        margin: 0,
                        fontSize: '13px',
                        fontWeight: '700',
                        color: 'var(--ds-spec)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        textDecoration: 'underline'
                      }}
                      title="Navigate to Product Specification Detail View"
                    >
                      <span>{activeSpec?.name || activeSpec?.id || specObj?.name || specObj?.id}</span>
                      <span style={{ fontSize: '11px', textDecoration: 'none' }}>↗</span>
                    </button>
                  ) : (
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ds-spec)' }}>
                      {activeSpec?.name || activeSpec?.id || specObj?.name || specObj?.id}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: C.muted, fontFamily: 'var(--ds-font-mono)', marginTop: '2px' }}>
                    ID: {activeSpec?.id || specObj?.id}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', background: 'rgba(124,58,237,0.12)', color: 'var(--ds-spec)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                    v{(activeSpec?.version !== undefined ? activeSpec.version : specObj?.version) !== undefined ? (activeSpec?.version !== undefined ? activeSpec.version : specObj?.version) : '0'}
                  </span>
                  {isOption && onNavigateToEntity && (
                    <button
                      type="button"
                      onClick={() => onNavigateToEntity(activeSpec || specObj, 'ProductSpecification')}
                      style={{
                        background: 'var(--ds-spec)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '4px 10px',
                        borderRadius: '5px',
                        fontSize: '11.5px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 1px 3px rgba(124,58,237,0.3)',
                        transition: 'opacity 0.15s ease'
                      }}
                      title="Navigate to Product Specification Detail View"
                    >
                      <span>View Specification</span>
                      <span>→</span>
                    </button>
                  )}
                </div>
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
                    {filteredChars.length} / {activeChars.length}
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

                      {isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                          <input
                            type="text"
                            value={cleanVals.length > 0 ? String(cleanVals[0]) : ''}
                            onChange={e => handleCharValChange(i, e.target.value)}
                            style={{
                              flex: 1,
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: `1px solid ${C.cardBorder}`,
                              fontSize: '12px',
                              fontFamily: 'var(--ds-font-mono)',
                              background: '#ffffff',
                              color: C.text
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveChar(i)}
                            style={{
                              background: 'rgba(230,0,0,0.06)',
                              border: '1px solid rgba(230,0,0,0.2)',
                              color: 'var(--ds-brand)',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            title="Delete characteristic"
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        </div>
                      ) : (
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
                      )}
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
          {/* ─── EDIT MODE: CATEGORY ASSIGNMENTS ─── */}
          {isEditing && (
            <div style={{
              background: '#ffffff',
              border: '1px solid rgba(230,0,0,0.3)',
              borderRadius: '10px',
              padding: '16px 18px',
              boxShadow: '0 2px 8px rgba(230,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ds-brand-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="folder" size={14} /> Direct Category Assignments ({formData.categories.length})
                  </div>
                  <div style={{ fontSize: '11.5px', color: C.muted, marginTop: '2px' }}>
                    Assign or remove standard catalog categories for this option. Categories determine catalog placement and rule-engine targeting.
                  </div>
                </div>
              </div>

              {/* Current Categories Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                {formData.categories.length === 0 ? (
                  <div style={{ fontSize: '12px', color: C.muted, fontStyle: 'italic' }}>
                    No direct categories assigned. Select a catalog category below to assign one.
                  </div>
                ) : (
                  formData.categories.map((cat, idx) => {
                    const catId = typeof cat === 'string' ? cat : (cat?.id || cat?.name);
                    const catMeta = lookupCatalogCategory(catId) || (typeof cat === 'object' ? cat : null);
                    const catLabel = catMeta?.name || catId;
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(230,0,0,0.06)',
                          border: '1px solid rgba(230,0,0,0.2)',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: C.text
                        }}
                      >
                        <Icon name="folder" size={12} />
                        <span style={{ fontWeight: '600' }}>{catLabel}</span>
                        <span style={{ fontSize: '10.5px', color: C.muted, fontFamily: 'var(--ds-font-mono)' }}>({catId})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(catId)}
                          title={`Remove ${catLabel}`}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--ds-brand-dark)',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '700',
                            padding: '0 0 0 4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            lineHeight: 1
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Category Selector Bar */}
              <div style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                paddingTop: '12px',
                borderTop: `1px solid ${C.cardBorder}`,
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: '1 1 280px' }}>
                  <select
                    value={selectedCatToAdd}
                    onChange={(e) => setSelectedCatToAdd(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: `1px solid ${C.cardBorder}`,
                      background: '#ffffff',
                      color: C.text,
                      outline: 'none'
                    }}
                  >
                    <option value="">Select a catalog category to assign...</option>
                    {allCatalogCategories
                      .filter(cat => !formData.categories.some(c => (c?.id || c) === cat.id))
                      .map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.id} — {cat.name} {cat.parentId ? `(under ${cat.parentId})` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedCatToAdd) {
                      handleAddCategory(selectedCatToAdd);
                    }
                  }}
                  disabled={!selectedCatToAdd}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: selectedCatToAdd ? 'var(--ds-brand)' : 'var(--ds-surface-subtle)',
                    color: selectedCatToAdd ? '#ffffff' : C.muted,
                    border: 'none',
                    padding: '7px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: selectedCatToAdd ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon name="plus" size={13} />
                  Assign Category
                </button>
              </div>
            </div>
          )}

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

      {/* ══════════════════════════════════════════════════════ */}
      {/* ─── STICKY BOTTOM ACTION BAR (EDIT MODE) ─── */}
      {/* ══════════════════════════════════════════════════════ */}
      {isEditing && (
        <div style={{
          position: 'sticky',
          bottom: '0',
          left: 0,
          right: 0,
          zIndex: 100,
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(230,0,0,0.3)',
          borderRadius: '10px',
          padding: '12px 18px',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          marginTop: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isDirty ? 'var(--ds-warn)' : 'var(--ds-ok)',
              display: 'inline-block'
            }} />
            <span style={{ fontSize: '12px', fontWeight: '600', color: C.text }}>
              {isDirty ? 'Unsaved changes in local buffer' : 'Edit mode active (no changes yet)'}
            </span>
            <span style={{ fontSize: '11px', color: C.muted }}>
              &bull; Changes stay in-memory until Release Management persistence
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleCancelEdit}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#ffffff',
                border: `1px solid ${C.cardBorder}`,
                color: C.text,
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel / Discard
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--ds-brand)',
                border: 'none',
                color: '#ffffff',
                padding: '7px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(230,0,0,0.3)'
              }}
            >
              <Icon name="check" size={13} />
              Save Option Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
