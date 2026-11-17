import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../ui/Icon';
import { LifecyclePill, VersionCell, CodeChip } from '../list-views/cellRenderers';
import { C } from '../../styles/theme';
import BandwidthSkuDetailModal from './BandwidthSkuDetailModal';
import {
  extractPsmStructure,
  detectTechnology,
  detectSpeeds,
  VODAFONE_DSL_FALLBACK_TIERS,
  getStandardFallbackTiers,
  getDslAccessProfileDescription
} from '../../services/psmStructureService';

export default function SalesPackageDetailTemplate({
  item,
  allEntities = [],
  onNavigateToPrice,
  onNavigateToCategory,
  onNavigateToEntity,
  copyToClipboard,
  copiedKey
}) {
  const [inspectedBandwidth, setInspectedBandwidth] = useState(null);
  const raw = item?.raw || {};
  const spec = raw.productSpecification || item?.productSpecification || null;
  const specObj = typeof spec === 'object' && spec !== null ? spec : (spec ? { id: spec, name: spec } : null);

  const itemId = String(item?.id || '').toLowerCase();
  const itemName = String(item?.name || '').toLowerCase();
  const specId = String(specObj?.id || specObj?.['@id'] || '').toLowerCase();
  const specName = String(specObj?.name || '').toLowerCase();

  const isFTTH = specId.includes('ftth') || specName.includes('ftth') || itemId.includes('ftth') || itemName.includes('ftth');

  // Direct characteristic extraction for broadband bandwidth
  const rawDownCharObj = (Array.isArray(raw.prodSpecCharValueUse) ? raw.prodSpecCharValueUse : []).find(c =>
    ['default_bandwidth', 'downstream_bandwidth', 'bandwidth', 'bandwidth_downstream_max', 'speed_download'].includes((c.name || '').toLowerCase())
  );
  const downCharVal = rawDownCharObj?.productSpecCharacteristicValue?.[0]?.value || rawDownCharObj?.value;

  const rawUpCharObj = (Array.isArray(raw.prodSpecCharValueUse) ? raw.prodSpecCharValueUse : []).find(c =>
    ['upstream_bandwidth', 'bandwidth_upstream_max', 'upload_speed', 'speed_upload', 'bandwidth_up'].includes((c.name || '').toLowerCase())
  );
  const upCharVal = rawUpCharObj?.productSpecCharacteristicValue?.[0]?.value || rawUpCharObj?.value;

  // Extract speed from ID / Name as secondary for download
  const speedMatch = (itemId + ' ' + itemName).match(/\b(1000|600|300|250|150|100|50|16)\b/);
  const speedVal = downCharVal ? parseInt(downCharVal, 10) : (speedMatch ? parseInt(speedMatch[1], 10) : (isFTTH ? 1000 : 100));
  const downloadSpeedStr = speedVal >= 1000 ? `${speedVal / 1000} Gbps` : `${speedVal} Mbps`;

  // Direct characteristic solution: if not exist leave empty
  const uploadSpeedStr = upCharVal
    ? (String(upCharVal).includes('bps') ? String(upCharVal) : `${upCharVal} Mbps`)
    : '';

  const pops = (Array.isArray(raw.productOfferingPrice) && raw.productOfferingPrice.length > 0)
    ? raw.productOfferingPrice
    : (Array.isArray(raw.bundledProductOfferingPrice) && raw.bundledProductOfferingPrice.length > 0)
      ? raw.bundledProductOfferingPrice
      : [];
  const terms = Array.isArray(raw.productOfferingTerm) ? raw.productOfferingTerm : [];
  const bundledOffers = Array.isArray(raw.bundledProductOffering) ? raw.bundledProductOffering : [];

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

  const chars = Array.isArray(raw.prodSpecCharValueUse)
    ? raw.prodSpecCharValueUse
    : (Array.isArray(raw.productSpecCharacteristic) ? raw.productSpecCharacteristic : []);

  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [charSearch, setCharSearch] = useState('');
  const [expandedGroupIds, setExpandedGroupIds] = useState({});
  const [expandedPricingPops, setExpandedPricingPops] = useState({});
  const [activeSelectedPopId, setActiveSelectedPopId] = useState(null);
  const [popFilterMode, setPopFilterMode] = useState('all'); // 'all' | 'selected'
  const [pricingActiveNetwork, setPricingActiveNetwork] = useState('both');
  const [showDslMatrix, setShowDslMatrix] = useState(false);
  const [decompViewMode, setDecompViewMode] = useState('cards'); // 'cards' | 'table'

  // Category names lookup (from allEntities or fetched from /api/dnext/categories)
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

  // Extract category groups and direct categories into normalized tree data
  const treeGroups = useMemo(() => {
    const groups = [];

    // 1. Process categoryGroupings array
    categoryGroupings.forEach((cg, idx) => {
      const gName = cg.name || `Category Group #${idx + 1}`;
      const gId = cg.id || cg.name || `cg_${idx}`;
      const categories = Array.isArray(cg.category) ? cg.category : [];

      let sku = null;
      if (Array.isArray(cg.prodSpecCharValueUse)) {
        const skuChar = cg.prodSpecCharValueUse.find(c => (c.name || '').toLowerCase() === 'sku');
        if (skuChar) {
          const valObj = Array.isArray(skuChar.productSpecCharacteristicValue)
            ? skuChar.productSpecCharacteristicValue[0]
            : null;
          sku = valObj?.value || skuChar.value || null;
        }
      }

      groups.push({
        id: gId,
        name: gName,
        sku,
        raw: cg,
        categories
      });
    });

    // 2. Direct categories fallback if no category groupings exist
    if (directCategories.length > 0 && groups.length === 0) {
      groups.push({
        id: 'direct_categories',
        name: 'Direct Categories',
        sku: null,
        raw: null,
        categories: directCategories
      });
    }

    return groups;
  }, [categoryGroupings, directCategories]);

  const totalAssociationsCount = useMemo(() => {
    return treeGroups.reduce((acc, g) => acc + (g.categories?.length || 0), 0);
  }, [treeGroups]);

  const filteredTreeGroups = useMemo(() => {
    if (!categoryFilter.trim()) return treeGroups;
    const q = categoryFilter.toLowerCase();
    return treeGroups.map(g => {
      const groupMatches = (g.name || '').toLowerCase().includes(q) || (g.sku || '').toLowerCase().includes(q);
      const matchingCats = (g.categories || []).filter(c => {
        const catId = (c.id || '').toLowerCase();
        const catName = (remoteCategories[c.id]?.name || c.name || '').toLowerCase();
        return catId.includes(q) || catName.includes(q);
      });

      if (groupMatches) return g;
      if (matchingCats.length > 0) return { ...g, categories: matchingCats };
      return null;
    }).filter(Boolean);
  }, [treeGroups, categoryFilter, remoteCategories]);

  const toggleGroup = (id) => {
    setExpandedGroupIds(prev => ({
      ...prev,
      [id]: prev[id] === false ? true : false
    }));
  };

  const expandAllGroups = () => {
    const allOpen = {};
    treeGroups.forEach(g => { allOpen[g.id] = true; });
    setExpandedGroupIds(allOpen);
  };

  const collapseAllGroups = () => {
    const allClosed = {};
    treeGroups.forEach(g => { allClosed[g.id] = false; });
    setExpandedGroupIds(allClosed);
  };

  const areGroupsExpanded = useMemo(() => {
    if (filteredTreeGroups.length === 0) return false;
    return filteredTreeGroups.some(g => expandedGroupIds[g.id] !== false);
  }, [filteredTreeGroups, expandedGroupIds]);

  const toggleAllGroups = () => {
    if (areGroupsExpanded) {
      collapseAllGroups();
    } else {
      expandAllGroups();
    }
  };

  // ─── Extract Normalized CCB & PSM Structure from Common Service ───
  const psmStructure = useMemo(() => {
    return extractPsmStructure(item?.raw || item, allEntities);
  }, [item, allEntities]);

  const effectiveTerms = useMemo(() => {
    return (terms && terms.length > 0) ? terms : (psmStructure?.terms || []);
  }, [terms, psmStructure]);

  const subTabs = [
    { id: 'overview', label: 'Overview', icon: 'chart' },
    { id: 'technology', label: 'Technology & Bandwidth', icon: 'zap' },
    { id: 'psm_structure', label: 'PSM Pricing Structure', icon: 'file' },
    { id: 'categories', label: `Categories/Groups (${treeGroups.length})`, icon: 'folder' },
    { id: 'network', label: 'Specification & Overrides', icon: 'clipboard' },
    { id: 'terms', label: `Contract Terms (${effectiveTerms.length})`, icon: 'edit' }
  ];

  // Filtered characteristics for Specification & Overrides tab
  const filteredChars = useMemo(() => {
    if (!charSearch.trim()) return chars;
    const q = charSearch.toLowerCase().trim();
    return chars.filter(c => {
      const nameMatch = (c.name || '').toLowerCase().includes(q);
      const valMatch = (
        Array.isArray(c.productSpecCharacteristicValue)
          ? c.productSpecCharacteristicValue.map(v => (v?.value !== undefined ? v.value : v))
          : (Array.isArray(c.value) ? c.value : [c.value])
      ).some(v => String(v || '').toLowerCase().includes(q));
      return nameMatch || valMatch;
    });
  }, [chars, charSearch]);

  const getCharValues = (charName) => {
    const target = (chars || []).find(c => (c.name || '').toLowerCase() === charName.toLowerCase());
    if (!target) return [];
    if (Array.isArray(target.productSpecCharacteristicValue)) {
      return target.productSpecCharacteristicValue.map(v => v.value !== undefined ? v.value : v);
    }
    if (target.value !== undefined) return [target.value];
    return [];
  };

  const psmAawPacketId = psmStructure?.masterPacketId || getCharValues('psm_aaw_packet_id')[0] || getCharValues('psmAawPacketId')[0] || getCharValues('psm_packet_id')[0] || getCharValues('psm_code')[0] || null;
  const skus = (psmStructure?.skus && psmStructure.skus.length > 0) ? psmStructure.skus : getCharValues('sku');
  const psmSalesPacketCodes = (psmStructure?.salesPacketCodes && psmStructure.salesPacketCodes.length > 0) ? psmStructure.salesPacketCodes : getCharValues('psm_sales_packet_code');

  const prodCodeInternetNgn = getCharValues('product_code_internet_ngn')[0] || getCharValues('product_code_internet')[0] || '-';
  const prodCodeInternetBitstream = getCharValues('product_code_internet_bitstream')[0] || getCharValues('product_code_internet')[1] || '-';
  const tariffCodeInternetNgn = getCharValues('tariff_code_internet_ngn')[0] || getCharValues('tariff_code_internet')[0] || '-';
  const tariffCodeInternetBitstream = getCharValues('tariff_code_internet_bitstream')[0] || getCharValues('tariff_code_internet')[0] || '-';
  const serviceCodeInternetNgn = getCharValues('service_code_internet_ngn');
  const serviceCodeInternetBitstream = getCharValues('service_code_internet_bitstream');

  const prodCodeVoiceNgn = getCharValues('product_code_voice_ngn')[0] || getCharValues('product_code_voice')[0] || '-';
  const prodCodeVoiceBitstream = getCharValues('product_code_voice_bitstream')[0] || getCharValues('product_code_voice')[1] || '-';
  const tariffCodeVoiceNgn = getCharValues('tariff_code_voice_ngn')[0] || getCharValues('tariff_code_voice')[0] || '-';
  const tariffCodeVoiceBitstream = getCharValues('tariff_code_voice_bitstream')[0] || getCharValues('tariff_code_voice')[0] || '-';
  const serviceCodeVoiceNgn = getCharValues('service_code_voice_ngn');
  const serviceCodeVoiceBitstream = getCharValues('service_code_voice_bitstream');

  // Helper to extract characteristic value from any entity
  const extractChar = (entity, charName) => {
    if (!entity) return null;
    const charList = entity.prodSpecCharValueUse || entity.productOfferingPriceCharacteristic || entity.prodSpecCharacteristic || [];
    const found = charList.find(c => (c.name || '').toLowerCase() === charName.toLowerCase());
    if (!found) return null;
    if (Array.isArray(found.productSpecCharacteristicValue) && found.productSpecCharacteristicValue.length > 0) {
      const val = found.productSpecCharacteristicValue[0];
      return val?.value !== undefined ? val.value : val;
    }
    if (Array.isArray(found.productOfferingPriceCharacteristicValue) && found.productOfferingPriceCharacteristicValue.length > 0) {
      const val = found.productOfferingPriceCharacteristicValue[0];
      return val?.value !== undefined ? val.value : val;
    }
    return found.value !== undefined ? found.value : null;
  };

  // ─── Commercial Terms Associated with Selling SKUs ───
  const commercialTerms = useMemo(() => {
    const list = [];
    const sourceTerms = (terms && terms.length > 0) ? terms : (psmStructure?.terms || []);

    if (sourceTerms && sourceTerms.length > 0) {
      sourceTerms.forEach((t, termIdx) => {
        const durationAmount = t.duration?.amount;
        const durationUnits = t.duration?.units || 'Month';
        const termChars = t.productOfferingTermCharacteristic || t.prodSpecCharValueUse || [];
        const termSkuChar = termChars.find(c => (c.name || '').toLowerCase() === 'sku');

        let termSkuValues = [];
        if (Array.isArray(termSkuChar?.productOfferingTermCharacteristicValue)) {
          termSkuValues = termSkuChar.productOfferingTermCharacteristicValue
            .map(v => v?.value !== undefined ? String(v.value).trim() : String(v).trim())
            .filter(Boolean);
        } else if (termSkuChar?.value !== undefined && termSkuChar?.value !== null) {
          termSkuValues = [String(termSkuChar.value).trim()];
        } else if (t.sku) {
          termSkuValues = [String(t.sku).trim()];
        }

        // If no SKUs on the term itself, fallback to skus array or generated packet-duration
        if (termSkuValues.length === 0) {
          const fallbackSku = (skus && skus[termIdx]) || (skus && skus.length === 1 ? skus[0] : null) || '-';
          termSkuValues = [fallbackSku];
        }

        let durVal = durationAmount;
        if (durVal === undefined || durVal === null) {
          const matchNum = String(t.name || '').match(/(\d+)/);
          if (matchNum) durVal = parseInt(matchNum[1], 10);
          else durVal = 24;
        }

        const formattedUnits = String(durationUnits).toLowerCase().startsWith('month')
          ? (durVal === 1 ? 'Month' : 'Months')
          : (durVal === 1 ? durationUnits : `${durationUnits}s`);

        const durationText = `${durVal} ${formattedUnits}`;
        const titleText = `Contract Duration: ${durationText}`;
        const isFlex = durVal === 0 || String(t.name || '').toLowerCase().includes('flex') || String(t.name || '').toLowerCase().includes('ohne');
        const noticePeriod = t.cancellationPeriod || extractChar(t, 'cancellation_period') || extractChar(t, 'notice_period') || '1 Month notice';

        termSkuValues.forEach((skuVal, skuIdx) => {
          list.push({
            id: t.id ? `${t.id}_${skuVal}` : `term-${termIdx}-${skuIdx}`,
            name: titleText,
            durationAmount: durVal,
            durationUnits,
            durationLabel: durationText,
            isFlex,
            sku: skuVal,
            description: t.description || null,
            validFor: t.validFor,
            cancellationPeriod: noticePeriod,
            raw: t
          });
        });
      });
    }

    // Also include any selling SKUs from skus (e.g. from prodSpecCharValueUse) not yet mapped
    if (Array.isArray(skus) && skus.length > 0) {
      const existingSkus = new Set(list.map(item => item.sku));
      skus.forEach((skuVal, sIdx) => {
        if (!existingSkus.has(skuVal)) {
          const durMatch = String(skuVal).match(/-(\d+)$/);
          const durAmount = durMatch ? parseInt(durMatch[1], 10) : 24;
          const formattedUnits = durAmount === 1 ? 'Month' : 'Months';
          const durationText = `${durAmount} ${formattedUnits}`;
          list.push({
            id: `sku-extra-${sIdx}`,
            name: `Contract Duration: ${durationText}`,
            durationAmount: durAmount,
            durationUnits: 'Month',
            durationLabel: durationText,
            isFlex: durAmount === 0,
            sku: skuVal,
            description: null,
            cancellationPeriod: '1 Month notice',
            raw: null
          });
          existingSkus.add(skuVal);
        }
      });
    }

    // Sort: 24M first (or descending duration), then SKU
    list.sort((a, b) => {
      const durA = a.durationAmount !== undefined ? a.durationAmount : 24;
      const durB = b.durationAmount !== undefined ? b.durationAmount : 24;
      if (durB !== durA) return durB - durA;
      return String(a.sku).localeCompare(String(b.sku));
    });

    return list;
  }, [terms, skus, psmStructure]);

  // ─── Bandwidth Options & Technology Detection ───
  const bandwidthOptionOffers = useMemo(() => {
    const map = new Map();
    (allEntities || []).forEach(entity => {
      const rawE = entity?.raw || entity;
      const id = String(entity?.id || rawE?.id || '');
      const s = rawE?.productSpecification || entity?.productSpecification || {};
      const specIdStr = String(s?.id || '');
      const specNameStr = String(s?.name || '');

      const isBandwidthSpec = (
        specIdStr.toLowerCase().includes('bandwidth') ||
        specNameStr.toLowerCase().includes('bandwidth') ||
        id.toLowerCase().includes('options_bandwidth')
      );

      if (isBandwidthSpec && id) {
        const spds = detectSpeeds(rawE);
        const skuVal = extractChar(rawE, 'sku') || extractChar(rawE, 'CFS_Specification_Code') || '';
        const svcCode = extractChar(rawE, 'service_code') || '';
        map.set(id, {
          id,
          name: entity.name || rawE.name || id,
          sku: skuVal,
          serviceCode: svcCode,
          realBandwidth: svcCode || skuVal,
          speeds: spds,
          raw: rawE
        });
      }
    });

    if (map.size === 0) {
      const fallbacks = [
        { id: 'po_IG006_FN_Options_Bandwidth', name: 'Glasfaser Bandbreite 1000 Mbit/s', sku: 'IG006', serviceCode: 'IG006', realBandwidth: 'IG006', speeds: { down: 1000, up: 200 } },
        { id: 'po_IG019_FN_Options_Bandwidth', name: 'Glasfaser Bandbreite 600 Mbit/s', sku: 'IG019', serviceCode: 'IG019', realBandwidth: 'IG019', speeds: { down: 600, up: 100 } },
        { id: 'po_IG018_FN_Options_Bandwidth', name: 'Glasfaser Bandbreite 300 Mbit/s', sku: 'IG018', serviceCode: 'IG018', realBandwidth: 'IG018', speeds: { down: 300, up: 50 } },
        { id: 'po_V018V_FN_Options_Bandwidth', name: 'DSL Bandbreite 250 Mbit/s', sku: 'IP077V018VIB', serviceCode: 'V018V', realBandwidth: 'V018V', speeds: { down: 250, up: 40 } },
        { id: 'po_V018U_FN_Options_Bandwidth', name: 'DSL Bandbreite 175 Mbit/s', sku: 'IP077V018UIB', serviceCode: 'V018U', realBandwidth: 'V018U', speeds: { down: 175, up: 40 } },
        { id: 'po_V018N_FN_Options_Bandwidth', name: 'DSL Bandbreite 100 Mbit/s', sku: 'IP076V018NIB', serviceCode: 'V018N', realBandwidth: 'V018N', speeds: { down: 100, up: 40 } },
        { id: 'po_V018H_FN_Options_Bandwidth', name: 'DSL Bandbreite 50 Mbit/s', sku: 'IP074V018HIB', serviceCode: 'V018H', realBandwidth: 'V018H', speeds: { down: 50, up: 10 } },
        { id: 'po_V018C_FN_Options_Bandwidth', name: 'DSL Bandbreite 16 Mbit/s', sku: 'IP073V018CIB', serviceCode: 'V018C', realBandwidth: 'V018C', speeds: { down: 16, up: 2.4 } },
        { id: 'po_V0178_FN_Options_Bandwidth', name: 'DSL Bandbreite 6 Mbit/s', sku: 'IP073V0178IB', serviceCode: 'V0178', realBandwidth: 'V0178', speeds: { down: 6, up: 1 } },
        { id: 'po_V0175_FN_Options_Bandwidth', name: 'DSL Bandbreite 3 Mbit/s', sku: 'IP073V0175IB', serviceCode: 'V0175', realBandwidth: 'V0175', speeds: { down: 3, up: 0.5 } },
        { id: 'po_V0174_FN_Options_Bandwidth', name: 'DSL Bandbreite 2 Mbit/s', sku: 'IP073V0174IB', serviceCode: 'V0174', realBandwidth: 'V0174', speeds: { down: 2, up: 0.5 } },
        { id: 'po_V0118_FN_Options_Bandwidth', name: 'DSL Bandbreite 1 Mbit/s', sku: 'IP073V0118IB', serviceCode: 'V0118', realBandwidth: 'V0118', speeds: { down: 1, up: 0.25 } }
      ];
      fallbacks.forEach(f => map.set(f.id, f));
    }

    return Array.from(map.values()).sort((a, b) => (b.speeds?.down || 0) - (a.speeds?.down || 0));
  }, [allEntities]);

  // Technology & Speeds resolution
  const resolvedTechnology = psmStructure?.technology || detectTechnology(item?.raw || item) || 'DSL';
  const resolvedDownSpeed = psmStructure?.speeds?.down || Number(getCharValues('default_bandwidth')[0]) || Number(getCharValues('downstream_bandwidth')[0]) || speedVal || 100;
  const rawUpSpeedChar = getCharValues('upstream_bandwidth')[0] || getCharValues('bandwidth_upstream_max')[0] || getCharValues('upload_speed')[0] || getCharValues('speed_upload')[0] || getCharValues('bandwidth_up')[0];
  const resolvedUpSpeed = rawUpSpeedChar ? Number(rawUpSpeedChar) : (psmStructure?.speeds?.up || null);

  // Fallback bandwidths: characteristic values or standard fallbacks
  const rawFallbackVals = (getCharValues('fallback_bandwidth') || []).map(v => parseInt(v, 10)).filter(n => !isNaN(n) && n > 0);
  const resolvedFallbackBandwidths = rawFallbackVals.length > 0
    ? rawFallbackVals
    : (resolvedTechnology === 'DSL' ? getStandardFallbackTiers(resolvedDownSpeed) : []);

  // Matching Bandwidth Option Offer
  const matchingBwOffer = useMemo(() => {
    const matching = (bandwidthOptionOffers || []).filter(o => o.speeds?.down === resolvedDownSpeed);
    if (matching.length === 1) return matching[0];
    if (matching.length > 1) {
      if (resolvedTechnology === 'FIBRE') return matching.find(o => /glasfaser|ftth|fiber/i.test(o.name || o.id)) || matching[0];
      if (resolvedTechnology === 'DSL') return matching.find(o => /dsl/i.test(o.name || o.id)) || matching[0];
      if (resolvedTechnology === 'CABLE') return matching.find(o => /kabel|cable|docsis/i.test(o.name || o.id)) || matching[0];
      return matching[0];
    }
    return null;
  }, [bandwidthOptionOffers, resolvedDownSpeed, resolvedTechnology]);

  // Supported Networks resolution
  const resolvedSupportedNetworks = psmStructure?.supportedNetworks || {
    technology: resolvedTechnology,
    hasNgn: prodCodeInternetNgn !== '-' && prodCodeInternetNgn !== '',
    hasBitstream: prodCodeInternetBitstream !== '-' && prodCodeInternetBitstream !== '',
    primaryNetwork: (prodCodeInternetNgn !== '-' && prodCodeInternetBitstream !== '-')
      ? 'Vodafone NGN / Telekom Bitstream'
      : (prodCodeInternetBitstream !== '-' ? 'Telekom Bitstream' : 'Vodafone NGN')
  };

  const accessTypeDescription = resolvedTechnology === 'FIBRE'
    ? 'FTTH (Fibre To The Home) / GPON'
    : resolvedTechnology === 'CABLE'
      ? 'DOCSIS 3.1 / Coaxial Cable'
      : getDslAccessProfileDescription(resolvedDownSpeed);

  // ─── Resolve POPs & Child Component Decomposition (Fully Dynamic) ───
  const resolvedPops = useMemo(() => {
    return pops.map((popRef) => {
      const pId = popRef.id || popRef.name;
      const matched = (allEntities || []).find(e => 
        (e.id && String(e.id).toLowerCase() === String(pId).toLowerCase()) ||
        (e.raw?.id && String(e.raw.id).toLowerCase() === String(pId).toLowerCase())
      );
      const rawPop = matched?.raw || matched || popRef;

      // Extract characteristics dynamically from POP
      const connectionType = extractChar(rawPop, 'connection_type') || 
        (String(rawPop.name || rawPop.id).toLowerCase().includes('comfort') ? 'comfort' : 
         String(rawPop.name || rawPop.id).toLowerCase().includes('basic') ? 'basic' : '-');

      const bandwidth = extractChar(rawPop, 'bandwidth') || 
        extractChar(rawPop, 'downstream_bandwidth') || 
        (String(rawPop.name || rawPop.id).match(/_(\d+)(?:_|$)/)?.[1]) || 
        (speedVal ? String(speedVal) : '-');

      const playType = extractChar(rawPop, 'play_type') || '-';

      // Check if this specific POP supports NGN / Bitstream
      const rawPopPsmNgn = extractChar(rawPop, 'psm_sales_packet_code_internet_ngn') || 
        extractChar(rawPop, 'psm_sales_packet_code_voice_ngn') || 
        extractChar(rawPop, 'psm_sales_packet_code_ngn') || 
        null;

      const rawPopTariffNgn = extractChar(rawPop, 'tariff_code_internet_ngn') ||
        extractChar(rawPop, 'tariff_code_voice_ngn') ||
        null;

      const rawPopProdNgn = extractChar(rawPop, 'product_code_internet_ngn') ||
        extractChar(rawPop, 'product_code_voice_ngn') ||
        null;

      const rawPopSvcNgn = extractChar(rawPop, 'service_code_internet_ngn') ||
        extractChar(rawPop, 'service_code_voice_ngn') ||
        null;

      const rawPopPsmBs = extractChar(rawPop, 'psm_sales_packet_code_internet_bitstream') || 
        extractChar(rawPop, 'psm_sales_packet_code_voice_bitstream') || 
        extractChar(rawPop, 'psm_sales_packet_code_bitstream') || 
        null;

      const rawPopTariffBs = extractChar(rawPop, 'tariff_code_internet_bitstream') ||
        extractChar(rawPop, 'tariff_code_voice_bitstream') ||
        null;

      const rawPopProdBs = extractChar(rawPop, 'product_code_internet_bitstream') ||
        extractChar(rawPop, 'product_code_voice_bitstream') ||
        null;

      const rawPopSvcBs = extractChar(rawPop, 'service_code_internet_bitstream') ||
        extractChar(rawPop, 'service_code_voice_bitstream') ||
        null;

      // Discover actual child components attached to this bundle POP
      let childRefs = rawPop.bundledPopRelationship || rawPop.bundledProductOfferingPrice || [];
      let resolvedChildren = [];

      if (Array.isArray(childRefs) && childRefs.length > 0) {
        resolvedChildren = childRefs.map(ref => {
          const refId = ref.id || ref.name;
          const match = (allEntities || []).find(e => 
            (e.id && String(e.id).toLowerCase() === String(refId).toLowerCase()) ||
            (e.raw?.id && String(e.raw.id).toLowerCase() === String(refId).toLowerCase())
          );
          return match?.raw || match || ref;
        });
      } else if (Array.isArray(allEntities)) {
        // Look for actual child entities in allEntities prefixed with rawPop.id
        const baseId = rawPop.id;
        resolvedChildren = allEntities
          .filter(e => {
            const eid = e.id || e.raw?.id;
            return eid && eid.startsWith(baseId + '_');
          })
          .map(e => e.raw || e);
      }

      const hasChildNgn = resolvedChildren.some(c => 
        extractChar(c, 'psm_sales_packet_code_internet_ngn') ||
        extractChar(c, 'psm_sales_packet_code_voice_ngn') ||
        extractChar(c, 'tariff_code_internet_ngn') ||
        extractChar(c, 'tariff_code_voice_ngn') ||
        extractChar(c, 'product_code_internet_ngn') ||
        extractChar(c, 'service_code_internet_ngn')
      );

      const hasChildBs = resolvedChildren.some(c => 
        extractChar(c, 'psm_sales_packet_code_internet_bitstream') ||
        extractChar(c, 'psm_sales_packet_code_voice_bitstream') ||
        extractChar(c, 'tariff_code_internet_bitstream') ||
        extractChar(c, 'tariff_code_voice_bitstream') ||
        extractChar(c, 'product_code_internet_bitstream') ||
        extractChar(c, 'service_code_internet_bitstream')
      );

      const psmStructPop = (psmStructure?.resolvedPops || []).find(p => p.id === pId || p.id === rawPop.id);

      const hasNgn = Boolean(rawPopPsmNgn || rawPopTariffNgn || rawPopProdNgn || rawPopSvcNgn || hasChildNgn || (psmStructPop && psmStructPop.hasNgn));
      const hasBitstream = Boolean(rawPopPsmBs || rawPopTariffBs || rawPopProdBs || rawPopSvcBs || hasChildBs || (psmStructPop && psmStructPop.hasBitstream));

      // Dynamic sales packet codes from POP, only falling back to offer if this POP actually participates in the network
      const psmNgn = rawPopPsmNgn || (psmStructPop?.psmInternetNgn && psmStructPop.psmInternetNgn !== '-' ? psmStructPop.psmInternetNgn : null) || 
        (hasNgn ? (getCharValues('psm_sales_packet_code_internet_ngn')[0] || getCharValues('psm_sales_packet_code_voice_ngn')[0] || null) : null);

      const psmBitstream = rawPopPsmBs || (psmStructPop?.psmInternetBitstream && psmStructPop.psmInternetBitstream !== '-' ? psmStructPop.psmInternetBitstream : null) || 
        (hasBitstream ? (getCharValues('psm_sales_packet_code_internet_bitstream')[0] || getCharValues('psm_sales_packet_code_voice_bitstream')[0] || null) : null);

      // Map each child component with its real characteristics
      const components = resolvedChildren.map(childRaw => {
        const cId = childRaw.id || '';
        const suffix = cId.match(/_([a-z0-9]+)$/)?.[0] || '';
        const childPrice = childRaw.price?.value !== undefined ? childRaw.price.value : (typeof childRaw.price === 'number' ? childRaw.price : 0);

        const charDomain = extractChar(childRaw, 'domain');
        const isVoice = charDomain?.toLowerCase() === 'voice' || suffix === '_va' || suffix === '_vt' || cId.toLowerCase().includes('voice');
        const domain = isVoice ? 'Voice' : 'Internet';

        const name = childRaw.name || (suffix === '_bw' ? 'Bandwidth Fee' : suffix === '_in' ? 'Internet Fee' : suffix === '_va' ? 'Voice Access Fee' : suffix === '_vt' ? 'Voice Tariff / Flat' : 'Component Fee');

        const svcCodeNgn = hasNgn ? (
          extractChar(childRaw, isVoice ? 'service_code_voice_ngn' : 'service_code_internet_ngn') || 
          extractChar(childRaw, 'service_code_ngn') || 
          extractChar(childRaw, 'service_code') || 
          null
        ) : null;

        const svcCodeBs = hasBitstream ? (
          extractChar(childRaw, isVoice ? 'service_code_voice_bitstream' : 'service_code_internet_bitstream') || 
          extractChar(childRaw, 'service_code_bitstream') || 
          extractChar(childRaw, 'service_code') || 
          null
        ) : null;

        const pktCodeNgn = hasNgn ? (
          extractChar(childRaw, isVoice ? 'psm_sales_packet_code_voice_ngn' : 'psm_sales_packet_code_internet_ngn') || psmNgn
        ) : null;

        const pktCodeBs = hasBitstream ? (
          extractChar(childRaw, isVoice ? 'psm_sales_packet_code_voice_bitstream' : 'psm_sales_packet_code_internet_bitstream') || psmBitstream
        ) : null;

        const pCodeNgn = hasNgn ? (
          extractChar(childRaw, isVoice ? 'product_code_voice_ngn' : 'product_code_internet_ngn') || 
          (isVoice ? (prodCodeVoiceNgn !== '-' ? prodCodeVoiceNgn : null) : (prodCodeInternetNgn !== '-' ? prodCodeInternetNgn : null))
        ) : null;

        const pCodeBs = hasBitstream ? (
          extractChar(childRaw, isVoice ? 'product_code_voice_bitstream' : 'product_code_internet_bitstream') || 
          (isVoice ? (prodCodeVoiceBitstream !== '-' ? prodCodeVoiceBitstream : null) : (prodCodeInternetBitstream !== '-' ? prodCodeInternetBitstream : null))
        ) : null;

        const tCodeNgn = hasNgn ? (
          extractChar(childRaw, isVoice ? 'tariff_code_voice_ngn' : 'tariff_code_internet_ngn') || 
          (isVoice ? (tariffCodeVoiceNgn !== '-' ? tariffCodeVoiceNgn : null) : (tariffCodeInternetNgn !== '-' ? tariffCodeInternetNgn : null))
        ) : null;

        const tCodeBs = hasBitstream ? (
          extractChar(childRaw, isVoice ? 'tariff_code_voice_bitstream' : 'tariff_code_internet_bitstream') || 
          (isVoice ? (tariffCodeVoiceBitstream !== '-' ? tariffCodeVoiceBitstream : null) : (tariffCodeInternetBitstream !== '-' ? tariffCodeInternetBitstream : null))
        ) : null;

        const priceType = childRaw.priceType || 'Recurring charge';
        const pricingCategory = childRaw.pricingCategory || 'Fee';
        const period = childRaw.recurringChargePeriodType || rawPop.recurringChargePeriodType || 'month';
        const periodLength = childRaw.recurringChargePeriodLength || 1;
        const taxRate = childRaw.tax?.[0]?.taxRate !== undefined ? `${childRaw.tax[0].taxRate}%` : (childRaw.taxRate !== undefined ? `${childRaw.taxRate}%` : '19%');
        const taxCategory = childRaw.tax?.[0]?.taxCategory || childRaw.taxCategory || 'VAT';
        const lifecycleStatus = childRaw.lifecycleStatus || null;
        const functionalRole = suffix === '_bw' 
          ? 'Physical access line speed tier charge' 
          : suffix === '_in' 
          ? 'IP transit & broadband ISP access fee' 
          : suffix === '_va' 
          ? 'Voice telephony access line (Basic vs Comfort)' 
          : suffix === '_vt' 
          ? 'Voice usage tariff & allnet flat telephony' 
          : 'Sub-price component fee';

        return {
          id: cId,
          suffix,
          name,
          domain,
          price: childPrice,
          unit: childRaw.price?.unit || 'EUR',
          priceType,
          pricingCategory,
          period,
          periodLength,
          taxRate,
          taxCategory,
          lifecycleStatus,
          functionalRole,
          raw: childRaw,
          serviceNgn: svcCodeNgn,
          serviceBitstream: svcCodeBs,
          packetNgn: pktCodeNgn,
          packetBitstream: pktCodeBs,
          prodCodeNgn: pCodeNgn,
          prodCodeBitstream: pCodeBs,
          tariffCodeNgn: tCodeNgn,
          tariffCodeBitstream: tCodeBs
        };
      });

      const basePriceVal = rawPop.price?.value !== undefined 
        ? rawPop.price.value 
        : (components.length > 0 ? components.reduce((acc, c) => acc + (c.price || 0), 0) : null);

      // Derive bandwidth service ID
      const bwComp = components.find(c => c.suffix === '_bw');
      const popSpeed = Number(bandwidth) || Number(speedVal) || Number(resolvedDownSpeed) || 0;
      const defaultSvcBw = resolvedTechnology === 'FIBRE'
        ? (popSpeed >= 1000 ? 'IG006' : popSpeed >= 600 ? 'IG019' : popSpeed >= 300 ? 'IG018' : 'IG017')
        : (popSpeed >= 250 ? 'V018V' : popSpeed >= 175 ? 'V018U' : popSpeed >= 100 ? 'V018N' : popSpeed >= 50 ? 'V018H' : popSpeed === 16 ? 'V018C' : 'V0178');

      const bandwidthServiceId = psmStructPop?.svcBw || 
        bwComp?.serviceBitstream || 
        bwComp?.serviceNgn || 
        extractChar(rawPop, 'service_code_bandwidth') || 
        extractChar(rawPop, 'service_code_bw') || 
        extractChar(rawPop, 'bandwidth_service_id') || 
        defaultSvcBw;

      // Derive Internet and Voice Tariff Codes
      const compIn = components.find(c => c.suffix === '_in');
      const compVt = components.find(c => c.suffix === '_vt');
      const compVa = components.find(c => c.suffix === '_va');

      const tariffInternet = (psmStructPop?.tariffInternetBitstream && psmStructPop.tariffInternetBitstream !== '-')
        ? psmStructPop.tariffInternetBitstream
        : (psmStructPop?.tariffInternetNgn && psmStructPop.tariffInternetNgn !== '-')
          ? psmStructPop.tariffInternetNgn
          : (compIn?.tariffCodeBitstream || compIn?.tariffCodeNgn || (tariffCodeInternetBitstream !== '-' ? tariffCodeInternetBitstream : (tariffCodeInternetNgn !== '-' ? tariffCodeInternetNgn : 'IP077')));

      const tariffVoice = (psmStructPop?.tariffVoiceBitstream && psmStructPop.tariffVoiceBitstream !== '-')
        ? psmStructPop.tariffVoiceBitstream
        : (psmStructPop?.tariffVoiceNgn && psmStructPop.tariffVoiceNgn !== '-')
          ? psmStructPop.tariffVoiceNgn
          : (compVt?.tariffCodeBitstream || compVt?.tariffCodeNgn || compVa?.tariffCodeBitstream || compVa?.tariffCodeNgn || (tariffCodeVoiceBitstream !== '-' ? tariffCodeVoiceBitstream : (tariffCodeVoiceNgn !== '-' ? tariffCodeVoiceNgn : 'VP077')));

      return {
        id: rawPop.id,
        name: rawPop.name || rawPop.id,
        connectionType,
        bandwidth,
        bandwidthServiceId,
        tariffInternet,
        tariffVoice,
        playType,
        totalPrice: basePriceVal,
        unit: rawPop.price?.unit || 'EUR',
        period: rawPop.recurringChargePeriodType || 'month',
        hasNgn,
        hasBitstream,
        psmNgn,
        psmBitstream,
        raw: rawPop,
        components
      };
    });
  }, [pops, allEntities, speedVal, resolvedDownSpeed, resolvedTechnology, prodCodeInternetNgn, prodCodeInternetBitstream, tariffCodeInternetNgn, tariffCodeInternetBitstream, prodCodeVoiceNgn, prodCodeVoiceBitstream, tariffCodeVoiceNgn, tariffCodeVoiceBitstream]);

  // Distinct bandwidths across resolved bundle POPs (for speed fallback matrix)
  const uniqueBandwidths = useMemo(() => {
    const bws = [];
    resolvedPops.forEach(p => {
      if (p.bandwidth && p.bandwidth !== '-' && !bws.includes(p.bandwidth)) {
        bws.push(p.bandwidth);
      }
    });
    return bws.sort((a, b) => (Number(b) || 0) - (Number(a) || 0));
  }, [resolvedPops]);

  // Default activeSelectedPopId to the first resolved POP if none selected
  useEffect(() => {
    if (!activeSelectedPopId && resolvedPops.length > 0) {
      setActiveSelectedPopId(resolvedPops[0].id);
    }
  }, [resolvedPops, activeSelectedPopId]);

  const togglePricingPop = (id) => {
    setExpandedPricingPops(prev => ({
      ...prev,
      [id]: prev[id] === false ? true : (prev[id] === true ? false : false)
    }));
  };

  const expandAllPricingPops = () => {
    const allOpen = {};
    resolvedPops.forEach(p => { allOpen[p.id] = true; });
    setExpandedPricingPops(allOpen);
  };

  const collapseAllPricingPops = () => {
    const allClosed = {};
    resolvedPops.forEach(p => { allClosed[p.id] = false; });
    setExpandedPricingPops(allClosed);
  };

  const arePricingPopsExpanded = useMemo(() => {
    if (resolvedPops.length === 0) return false;
    return resolvedPops.some(p => expandedPricingPops[p.id] !== false);
  }, [resolvedPops, expandedPricingPops]);

  const toggleAllPricingPops = () => {
    if (arePricingPopsExpanded) {
      collapseAllPricingPops();
    } else {
      expandAllPricingPops();
    }
  };

  const scrollToPop = (popId) => {
    setActiveSelectedPopId(popId);
    setExpandedPricingPops(prev => ({ ...prev, [popId]: true }));
    setTimeout(() => {
      const el = document.getElementById(`pricing-pop-${popId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const origBoxShadow = el.style.boxShadow;
        el.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
        el.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.4)';
        setTimeout(() => {
          el.style.boxShadow = origBoxShadow;
        }, 1500);
      }
    }, 60);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ─── Hero Broadband Banner (Technology Type removed from header) ─── */}
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

            {/* Offer ID, Copy ID & Spec ID inside the box */}
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
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: C.muted, maxWidth: '580px', lineHeight: '1.5' }}>
              {raw.description || 'High-performance broadband package offering reliable high-speed data, integrated voice/data, and SLA-backed network delivery.'}
            </p>
          </div>

          {/* Speed Dial / Hero Metrics */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
                Download
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--ds-brand-dark)', marginTop: '2px' }}>
                ↓ {downloadSpeedStr}
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
              <div style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                Upload
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: uploadSpeedStr ? C.text : C.muted, marginTop: '2px' }}>
                {uploadSpeedStr ? `↑ ${uploadSpeedStr}` : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sales Package Sub-Navigation ─── */}
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

      {/* ─── TAB CONTENT 1: OVERVIEW ─── */}
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
                  {raw.isBundle ? 'Yes (Bundle)' : 'No (Atomic Offer)'}
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
          </div>

          {/* ── Contract Terms & Commercial SKUs ── */}
          {commercialTerms.length > 0 && (
            <div style={{
              background: C.panel,
              border: `1px solid ${C.cardBorder}`,
              borderRadius: '10px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: C.text, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name="tag" size={15} />
                    <span>PSM Codes & SKUs</span>
                  </h3>
                  <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>
                    Commercial selling SKU codes associated with contract commitment variants and orderable fulfillment terms.
                  </div>
                </div>
                <span style={{ fontSize: '11px', background: 'rgba(230,0,0,0.08)', color: 'var(--ds-brand)', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                  {commercialTerms.length} {commercialTerms.length === 1 ? 'Variant' : 'Variants'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                {commercialTerms.map((ct, idx) => (
                  <div
                    key={ct.id || idx}
                    style={{
                      background: ct.isFlex ? 'linear-gradient(135deg, rgba(2,132,199,0.04) 0%, #ffffff 85%)' : 'linear-gradient(135deg, rgba(16,185,129,0.04) 0%, #ffffff 85%)',
                      border: `1px solid ${ct.isFlex ? 'rgba(2,132,199,0.25)' : 'rgba(16,185,129,0.25)'}`,
                      borderRadius: '8px',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div>
                      {/* Header: Term Name & Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ fontSize: '13.5px', fontWeight: '700', color: C.text }}>
                          {ct.name}
                        </div>
                        <span style={{
                          fontSize: '10.5px',
                          background: ct.isFlex ? 'rgba(2,132,199,0.1)' : 'rgba(16,185,129,0.1)',
                          color: ct.isFlex ? 'var(--ds-info)' : 'var(--ds-ok)',
                          border: `1px solid ${ct.isFlex ? 'rgba(2,132,199,0.2)' : 'rgba(16,185,129,0.2)'}`,
                          padding: '1px 7px',
                          borderRadius: '10px',
                          fontWeight: '700',
                          whiteSpace: 'nowrap'
                        }}>
                          Active Term
                        </span>
                      </div>

                      {/* Selling SKU Code Box with 1-Click Copy */}
                      <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em', display: 'block', marginBottom: '4px' }}>
                          Selling SKU Code
                        </span>
                        <div style={{
                          background: '#ffffff',
                          border: '1px solid var(--ds-border-strong)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <code style={{
                            fontFamily: 'var(--ds-font-mono)',
                            fontSize: '13px',
                            fontWeight: '800',
                            color: 'var(--ds-warn)',
                            letterSpacing: '0.02em'
                          }}>
                            {ct.sku}
                          </code>
                          {copyToClipboard && ct.sku !== '-' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(ct.sku, `sku_${idx}`);
                              }}
                              style={{
                                background: copiedKey === `sku_${idx}` ? 'rgba(16,185,129,0.1)' : 'var(--ds-surface-2)',
                                border: `1px solid ${copiedKey === `sku_${idx}` ? 'var(--ds-ok)' : 'var(--ds-border)'}`,
                                color: copiedKey === `sku_${idx}` ? 'var(--ds-ok)' : C.text,
                                borderRadius: '4px',
                                padding: '3px 8px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s'
                              }}
                              title="Copy SKU code to clipboard"
                            >
                              <Icon name={copiedKey === `sku_${idx}` ? 'check' : 'clipboard'} size={12} />
                              <span>{copiedKey === `sku_${idx}` ? 'Copied' : 'Copy'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Description (if present and not redundant commitment text) */}
                      {ct.description && !ct.description.toLowerCase().includes('minimum contract commitment') && !ct.description.toLowerCase().includes('commitment') && (
                        <div style={{ fontSize: '11.5px', color: C.muted, lineHeight: '1.4', marginBottom: '6px' }}>
                          {ct.description}
                        </div>
                      )}
                    </div>

                    {/* Footer: Validity */}
                    {ct.raw?.validFor?.startDateTime && (
                      <div style={{ borderTop: `1px solid ${C.cardBorder}`, paddingTop: '8px', marginTop: '8px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', fontSize: '11px', color: 'var(--ds-text-3)' }}>
                        <span>Valid: {new Date(ct.raw.validFor.startDateTime).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB CONTENT 2: TECHNOLOGY & BANDWIDTH ─── */}
      {activeSubTab === 'technology' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            background: C.panel,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: '10px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '22px'
          }}>
            {/* Header & Badges */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{
                  margin: '0 0 4px 0',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: C.text,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Icon name="zap" size={15} />
                  <span>Technology & Bandwidth Configuration</span>
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: C.muted }}>
                  Primary access technology, network carrier infrastructure (Vodafone NGN / Telekom Bitstream), and certified DSL fallback profiles.
                </p>
              </div>

              {/* Status Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: resolvedTechnology === 'FIBRE' ? 'var(--ds-ok)' : 'var(--ds-brand)',
                  background: resolvedTechnology === 'FIBRE' ? 'var(--ds-ok-soft)' : 'var(--ds-brand-soft)',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  border: `1px solid ${resolvedTechnology === 'FIBRE' ? 'rgba(34,197,94,0.3)' : 'rgba(230,0,0,0.2)'}`
                }}>
                  {resolvedTechnology}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--ds-info)',
                  background: 'var(--ds-info-soft)',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  border: '1px solid rgba(2,132,199,0.2)'
                }}>
                  {resolvedUpSpeed ? `${resolvedDownSpeed} / ${resolvedUpSpeed} Mbps` : `${resolvedDownSpeed} Mbps`}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--ds-text-2)',
                  background: 'var(--ds-surface-2)',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  border: '1px solid var(--ds-border)'
                }}>
                  {resolvedSupportedNetworks.primaryNetwork}
                </span>
              </div>
            </div>

            {/* 1. Supported Network(s): Vodafone NGN & Bitstream / DSL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '13px', color: 'var(--ds-text-2)', fontWeight: '700' }}>
                Supported Network(s) & Specific Product Codes *
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                {/* Vodafone NGN */}
                <div style={{
                  border: `1px solid ${resolvedSupportedNetworks.hasNgn ? '#f87171' : 'var(--ds-border)'}`,
                  background: resolvedSupportedNetworks.hasNgn ? 'var(--ds-danger-soft)' : 'var(--ds-surface-subtle)',
                  borderRadius: '8px',
                  padding: '14px',
                  transition: 'all 0.15s ease'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '13px', color: resolvedSupportedNetworks.hasNgn ? 'var(--ds-danger)' : 'var(--ds-text-2)' }}>
                    <input
                      type="checkbox"
                      checked={!!resolvedSupportedNetworks.hasNgn}
                      readOnly
                      style={{ width: '16px', height: '16px', accentColor: C.vodafoneRed, cursor: 'default' }}
                    />
                    <span>Vodafone NGN</span>
                  </label>

                  {resolvedSupportedNetworks.hasNgn ? (
                    <div style={{ marginTop: '10px', paddingLeft: '26px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-brand-text)', marginBottom: '4px' }}>
                        NGN Product Code (product_code_internet_ngn) *
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={(prodCodeInternetNgn && prodCodeInternetNgn !== '-') ? prodCodeInternetNgn : 'I1204'}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #fca5a5',
                          background: '#ffffff',
                          fontFamily: 'var(--ds-font-mono)',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: 'var(--ds-danger)',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ marginTop: '10px', paddingLeft: '26px', fontSize: '11.5px', color: 'var(--ds-text-3)', fontStyle: 'italic' }}>
                      Not supported for this speed tier / technology.
                    </div>
                  )}
                </div>

                {/* Bitstream / DSL */}
                <div style={{
                  border: `1px solid ${resolvedSupportedNetworks.hasBitstream ? '#c084fc' : 'var(--ds-border)'}`,
                  background: resolvedSupportedNetworks.hasBitstream ? 'var(--ds-spec-soft)' : 'var(--ds-surface-subtle)',
                  borderRadius: '8px',
                  padding: '14px',
                  transition: 'all 0.15s ease'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '13px', color: resolvedSupportedNetworks.hasBitstream ? 'var(--ds-spec-text)' : 'var(--ds-text-2)' }}>
                    <input
                      type="checkbox"
                      checked={!!resolvedSupportedNetworks.hasBitstream}
                      readOnly
                      style={{ width: '16px', height: '16px', accentColor: 'var(--ds-spec)', cursor: 'default' }}
                    />
                    <span>Bitstream (DSL)</span>
                  </label>

                  {resolvedSupportedNetworks.hasBitstream ? (
                    <div style={{ marginTop: '10px', paddingLeft: '26px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-spec-text)', marginBottom: '4px' }}>
                        Bitstream Product Code (product_code_internet_bitstream) *
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={(prodCodeInternetBitstream && prodCodeInternetBitstream !== '-') ? prodCodeInternetBitstream : 'I1203'}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #d8b4fe',
                          background: '#ffffff',
                          fontFamily: 'var(--ds-font-mono)',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: 'var(--ds-spec-text)',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ marginTop: '10px', paddingLeft: '26px', fontSize: '11.5px', color: 'var(--ds-text-3)', fontStyle: 'italic' }}>
                      Not supported for this speed tier / technology.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Fallback Bandwidths Configuration (Using Available Data Only) */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              paddingTop: '20px',
              borderTop: `1px solid ${C.cardBorder}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--ds-text)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Fallback Bandwidths (DSL Line Profiles)
                    </h4>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: resolvedFallbackBandwidths.length > 0 ? 'var(--ds-ok)' : 'var(--ds-text-2)',
                      background: resolvedFallbackBandwidths.length > 0 ? 'var(--ds-ok-soft)' : 'var(--ds-surface-2)',
                      border: `1px solid ${resolvedFallbackBandwidths.length > 0 ? 'rgba(34,197,94,0.3)' : 'var(--ds-border)'}`,
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      {resolvedFallbackBandwidths.length > 0 ? `${resolvedFallbackBandwidths.length} Configured` : 'None Configured'}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: C.muted }}>
                    Certified lower-speed profiles applicable if local line conditions cannot sustain the nominal bandwidth ({resolvedDownSpeed} Mbit/s).
                  </p>
                </div>
              </div>

              {/* Display Configured Fallback Profiles Only */}
              {resolvedFallbackBandwidths.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {resolvedFallbackBandwidths.map(speed => {
                    const tier = VODAFONE_DSL_FALLBACK_TIERS.find(t => t.speed === speed);
                    const matchingOffer = (bandwidthOptionOffers || []).find(o => o.speeds?.down === speed || (tier?.svcBw && (o.serviceCode === tier.svcBw || o.realBandwidth === tier.svcBw)));
                    const upSpeed = tier?.upload || (speed >= 100 ? 40 : speed >= 50 ? 10 : 2.4);
                    const networkBadge = tier?.technologyBadge || tier?.technology || (tier?.isBitstreamOnly ? 'I1203 Bitstream Only' : 'I1204 NGN / I1203 Bitstream');

                    return (
                      <div
                        key={speed}
                        style={{
                          background: 'var(--ds-surface-subtle)',
                          border: `1px solid ${C.cardBorder}`,
                          borderRadius: '8px',
                          padding: '14px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        {/* Speed & Network Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--ds-text)', fontFamily: 'var(--ds-font-mono)' }}>
                              {speed}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: C.muted }}>
                              Mbit/s
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--ds-ok)', fontWeight: '600', marginLeft: '4px' }}>
                              (↑ {upSpeed} Mbit/s)
                            </span>
                          </div>
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: tier?.isBitstreamOnly ? '#faf5ff' : 'var(--ds-ok-soft)',
                            color: tier?.isBitstreamOnly ? '#7e22ce' : 'var(--ds-ok)',
                            border: `1px solid ${tier?.isBitstreamOnly ? '#d8b4fe' : 'rgba(34,197,94,0.3)'}`
                          }}>
                            {networkBadge}
                          </span>
                        </div>

                        {/* Profile & Code Details */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11.5px', borderTop: `1px solid ${C.border}`, paddingTop: '8px' }}>
                          {tier?.svcBw && (
                            <div>
                              <span style={{ color: C.muted, display: 'block', fontSize: '10.5px', fontWeight: '600' }}>Real Bandwidth:</span>
                              <button
                                type="button"
                                onClick={() => setInspectedBandwidth({ tier, matchingOffer })}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  margin: 0,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title={`Click to view details for Real Bandwidth ${tier.svcBw}`}
                              >
                                <code style={{
                                  fontWeight: '800',
                                  color: 'var(--ds-brand)',
                                  fontFamily: 'var(--ds-font-mono)',
                                  fontSize: '12px',
                                  textDecoration: 'underline',
                                  textDecorationColor: 'rgba(230,0,0,0.35)',
                                  textUnderlineOffset: '2px'
                                }}>
                                  {tier.svcBw}
                                </code>
                                <Icon name="arrowUpRight" size={11} style={{ color: 'var(--ds-brand)' }} />
                              </button>
                            </div>
                          )}
                          {tier?.sku && (
                            <div>
                              <span style={{ color: C.muted, display: 'block', fontSize: '10.5px', fontWeight: '600' }}>Offer SKU:</span>
                              <button
                                type="button"
                                onClick={() => setInspectedBandwidth({ tier, matchingOffer })}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  margin: 0,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title={`Click to view details for Offer SKU ${tier.sku}`}
                              >
                                <code style={{
                                  fontWeight: '700',
                                  color: '#d97706',
                                  fontFamily: 'var(--ds-font-mono)',
                                  fontSize: '11.5px',
                                  textDecoration: 'underline',
                                  textDecorationColor: 'rgba(217, 119, 6, 0.4)',
                                  textUnderlineOffset: '2px'
                                }}>
                                  {tier.sku}
                                </code>
                                <Icon name="arrowUpRight" size={11} style={{ color: '#d97706' }} />
                              </button>
                            </div>
                          )}
                        </div>

                        {tier?.desc && (
                          <div style={{ fontSize: '11px', color: C.muted, lineHeight: '1.4' }}>
                            {tier.desc}
                          </div>
                        )}

                        {matchingOffer && (
                          <div style={{
                            fontSize: '11px',
                            color: 'var(--ds-text-2)',
                            background: '#ffffff',
                            border: `1px solid ${C.border}`,
                            borderRadius: '4px',
                            padding: '5px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '6px'
                          }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <span style={{ color: C.muted }}>Option Offer: </span>
                              <span style={{ fontWeight: '600' }}>{matchingOffer.name || matchingOffer.id}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setInspectedBandwidth({ tier, matchingOffer })}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '2px 4px',
                                cursor: 'pointer',
                                color: 'var(--ds-brand)',
                                fontWeight: '700',
                                fontSize: '10.5px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                              title="Inspect Offering Details"
                            >
                              <span>Details</span>
                              <Icon name="arrowUpRight" size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  padding: '16px',
                  background: 'var(--ds-surface-subtle)',
                  border: `1px solid ${C.cardBorder}`,
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: C.muted,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Icon name="info" size={15} color={C.muted} />
                  <span>No fallback profiles configured for this package (operates at nominal speed of {resolvedDownSpeed} Mbit/s only).</span>
                </div>
              )}

              {/* Characteristic Values Summary Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                background: 'var(--ds-surface-subtle)',
                border: `1px solid ${C.cardBorder}`,
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '600', color: 'var(--ds-text)' }}>Offering Characteristic:</span>
                  <code style={{
                    background: 'var(--ds-surface)',
                    border: '1px solid var(--ds-border)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontFamily: 'var(--ds-font-mono)'
                  }}>
                    fallback_bandwidth = "{resolvedFallbackBandwidths.length > 0 ? resolvedFallbackBandwidths.join(', ') : 'none'}"
                  </code>
                </div>

                <div style={{ fontSize: '11px', color: C.muted }}>
                  Physical profiles verified against catalog specification
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB CONTENT: PSM PRICING STRUCTURE (New Dedicated Tab) ─── */}
      {activeSubTab === 'psm_structure' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* 1. PSM / AAW Packet Codes & SKU Mapping Card */}
          <div style={{
            background: C.panel,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: '10px',
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '14.5px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span><Icon name="file" size={14} /> CCB Master Packet & Selling SKUs</span>
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: C.muted }}>
                  Base packet identifier in CCB/AAW order management and its contract commitment variations.
                </p>
              </div>

              {/* Master Packet ID Badge */}
              {psmAawPacketId && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', padding: '5px 12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', color: C.muted, fontWeight: '600' }}>Master Packet ID:</span>
                  <code style={{ fontSize: '13px', color: 'var(--ds-ok)', fontWeight: '800', fontFamily: 'var(--ds-font-mono)' }}>
                    {psmAawPacketId}
                  </code>
                  {copyToClipboard && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(psmAawPacketId, 'master_packet')}
                      style={{ background: 'none', border: 'none', color: copiedKey === 'master_packet' ? C.success : C.muted, cursor: 'pointer', padding: '0 2px', fontSize: '11px' }}
                      title="Copy Master Packet ID"
                    >
                      {copiedKey === 'master_packet' ? '✓' : ''}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* SKU Commitments Row - Dynamic from terms or skus */}
            {terms.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                {terms.map((t, idx) => {
                  const durationAmount = t.duration?.amount;
                  const durationUnits = t.duration?.units || 'Month';
                  const termSku = t.productOfferingTermCharacteristic?.find(c => (c.name || '').toLowerCase() === 'sku')?.productOfferingTermCharacteristicValue?.[0]?.value || (skus && skus[idx]) || '-';

                  return (
                    <div key={idx} style={{ background: 'var(--ds-surface-subtle)', border: `1px solid ${C.cardBorder}`, borderRadius: '8px', padding: '10px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: C.text }}>
                          {durationAmount ? `${durationAmount} ${durationUnits} Commitment` : (t.name || `Term #${idx + 1}`)}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--ds-ok)', background: 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
                          Active SKU
                        </span>
                      </div>
                      <code style={{ fontSize: '12px', color: 'var(--ds-warn)', fontFamily: 'var(--ds-font-mono)', fontWeight: '700' }}>
                        {termSku}
                      </code>
                      <div style={{ fontSize: '11px', color: C.muted, marginTop: '3px' }}>
                        {t.description || (durationAmount ? `${durationAmount}-${durationUnits.toLowerCase()} minimum contract duration` : 'Contract commitment term')}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : skus.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                {skus.map((skuVal, idx) => (
                  <div key={idx} style={{ background: 'var(--ds-surface-subtle)', border: `1px solid ${C.cardBorder}`, borderRadius: '8px', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: C.text }}>Selling SKU #{idx + 1}</span>
                      <span style={{ fontSize: '11px', color: 'var(--ds-ok)', background: 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>Active</span>
                    </div>
                    <code style={{ fontSize: '12px', color: 'var(--ds-warn)', fontFamily: 'var(--ds-font-mono)', fontWeight: '700' }}>{skuVal}</code>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Sales Packet Codes Matrix (Dynamic across all resolved bundle POPs) */}
            <div style={{ background: '#ffffff', border: `1px solid ${C.cardBorder}`, borderRadius: '8px', padding: '12px 16px' }}>
              <div style={{
                overflowX: 'auto',
                overflowY: 'auto',
                maxHeight: '280px',
                border: `1px solid ${C.cardBorder}`,
                borderRadius: '6px'
              }}>
                <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: '#f8fafc', borderBottom: `1px solid ${C.cardBorder}` }}>
                    <tr style={{ color: C.muted, fontSize: '11px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '8px 10px', width: '32px', textAlign: 'center' }}></th>
                      <th style={{ padding: '8px 12px' }}>Bundle POP Name</th>
                      <th style={{ padding: '8px 12px' }}>Monthly Total</th>
                      <th style={{ padding: '8px 12px' }}>Bandwith Service ID</th>
                      <th style={{ padding: '8px 12px' }}>NGN Packet Code</th>
                      <th style={{ padding: '8px 12px' }}>Bitstream Packet Code</th>
                      <th style={{ padding: '8px 12px' }}>Internet Tariff Code</th>
                      <th style={{ padding: '8px 12px' }}>Voice Tariff Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolvedPops.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '16px', textAlign: 'center', color: C.muted, fontStyle: 'italic' }}>
                          No pricing variants attached to this offering.
                        </td>
                      </tr>
                    ) : (
                      resolvedPops.map((pop, pIdx) => {
                        const isComfort = pop.connectionType === 'comfort';
                        const isSelected = activeSelectedPopId === pop.id;
                        return (
                          <tr
                            key={pop.id || pIdx}
                            onClick={() => scrollToPop(pop.id)}
                            style={{
                              borderBottom: `1px solid ${C.cardBorder}`,
                              background: isSelected ? 'var(--ds-info-soft)' : (pIdx % 2 === 0 ? '#ffffff' : 'var(--ds-surface-subtle)'),
                              cursor: 'pointer',
                              transition: 'background 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.background = 'rgba(2,132,199,0.06)';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.background = pIdx % 2 === 0 ? '#ffffff' : 'var(--ds-surface-subtle)';
                            }}
                            title="Click to select and view this POP's decomposition below"
                          >
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <input
                                type="radio"
                                name="selectedPopRadioPsmTable"
                                checked={isSelected}
                                onChange={() => scrollToPop(pop.id)}
                                onClick={(e) => e.stopPropagation()}
                                style={{ accentColor: '#2563eb', cursor: 'pointer', width: '15px', height: '15px' }}
                                title="Select this POP"
                              />
                            </td>
                            <td style={{ padding: '8px 12px', fontWeight: '700', color: isComfort ? 'var(--ds-spec)' : 'var(--ds-info)' }}>
                              <span>{isComfort ? '' : ''}{pop.name || pop.id}</span>
                            </td>
                            <td style={{ padding: '8px 12px', fontWeight: '800', color: 'var(--ds-warn)' }}>
                              {pop.totalPrice !== null ? `€${Number(pop.totalPrice).toFixed(2)}` : '-'}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              {pop.bandwidthServiceId ? (
                                <code style={{
                                  fontFamily: 'var(--ds-font-mono)',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  color: 'var(--ds-warn)',
                                  background: 'var(--ds-surface-2)',
                                  border: '1px solid rgba(245, 158, 11, 0.25)',
                                  padding: '2px 8px',
                                  borderRadius: '4px'
                                }}>
                                  {pop.bandwidthServiceId}
                                </code>
                              ) : (
                                <span style={{ color: C.muted, fontSize: '11px' }}>-</span>
                              )}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              {pop.psmNgn ? (
                                <code style={{ background: 'rgba(2,132,199,0.08)', color: 'var(--ds-info)', border: '1px solid rgba(2,132,199,0.2)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700', fontFamily: 'var(--ds-font-mono)' }}>
                                  {pop.psmNgn}
                                </code>
                              ) : (
                                <span style={{ color: C.muted, fontSize: '11px' }}>-</span>
                              )}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              {pop.psmBitstream ? (
                                <code style={{ background: 'rgba(124,58,237,0.08)', color: 'var(--ds-spec)', border: '1px solid rgba(124,58,237,0.2)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700', fontFamily: 'var(--ds-font-mono)' }}>
                                  {pop.psmBitstream}
                                </code>
                              ) : (
                                <span style={{ color: C.muted, fontSize: '11px' }}>-</span>
                              )}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              {pop.tariffInternet ? (
                                <code style={{ background: 'rgba(59,130,246,0.08)', color: '#2563eb', border: '1px solid rgba(59,130,246,0.2)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700', fontFamily: 'var(--ds-font-mono)' }}>
                                  {pop.tariffInternet}
                                </code>
                              ) : (
                                <span style={{ color: C.muted, fontSize: '11px' }}>-</span>
                              )}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              {pop.tariffVoice ? (
                                <code style={{ background: 'rgba(16,185,129,0.08)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700', fontFamily: 'var(--ds-font-mono)' }}>
                                  {pop.tariffVoice}
                                </code>
                              ) : (
                                <span style={{ color: C.muted, fontSize: '11px' }}>-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dynamic Speed Fallback Matrix: shown only when multiple bandwidth variants exist */}
            {uniqueBandwidths.length > 1 && (
              <div style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowDslMatrix(prev => !prev)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ds-brand)',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 0'
                  }}
                >
                  <span>{showDslMatrix ? '▼ Hide' : '▶ Show'} Speed Fallback Matrix ({uniqueBandwidths.join(', ')} Mbit/s)</span>
                </button>

                {showDslMatrix && (
                  <div style={{ marginTop: '8px', background: 'var(--ds-surface-subtle)', border: `1px solid ${C.cardBorder}`, borderRadius: '8px', padding: '14px 16px', overflowX: 'auto' }}>
                    <div style={{ fontSize: '12px', color: C.muted, marginBottom: '10px' }}>
                      Bandwidth variations and packet provisioning codes derived from the {resolvedPops.length} attached POP variants:
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${C.cardBorder}`, color: C.muted, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.04em' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', width: '18%' }}>Bandwidth</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', width: '16%' }}>Basic NGN</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', width: '17%' }}>Basic Bitstream</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', width: '16%' }}>Comfort NGN</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', width: '17%' }}>Comfort Bitstream</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', width: '16%' }}>Service Code</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uniqueBandwidths.map((bw, i) => {
                          const bPop = resolvedPops.find(p => String(p.bandwidth) === String(bw) && p.connectionType === 'basic');
                          const cPop = resolvedPops.find(p => String(p.bandwidth) === String(bw) && p.connectionType === 'comfort');
                          const sCode = bPop?.components?.find(c => c.suffix === '_bw')?.serviceNgn || 
                                        bPop?.components?.find(c => c.suffix === '_bw')?.serviceBitstream || 
                                        cPop?.components?.find(c => c.suffix === '_bw')?.serviceNgn || 
                                        '-';

                          return (
                            <tr key={i} style={{ borderBottom: `1px solid ${C.cardBorder}`, background: i % 2 === 0 ? '#ffffff' : 'var(--ds-surface-subtle)' }}>
                              <td style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '700', color: C.text }}>
                                {bw} Mbit/s
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'left' }}>
                                {bPop?.psmNgn ? (
                                  <code style={{ fontSize: '11px', background: 'rgba(2,132,199,0.08)', color: 'var(--ds-info)', border: '1px solid rgba(2,132,199,0.2)', padding: '2px 7px', borderRadius: '4px', fontFamily: 'var(--ds-font-mono)', fontWeight: '700' }}>
                                    {bPop.psmNgn}
                                  </code>
                                ) : (
                                  <span style={{ color: C.muted, fontSize: '11px' }}>-</span>
                                )}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'left' }}>
                                {bPop?.psmBitstream ? (
                                  <code style={{ fontSize: '11px', background: 'rgba(124,58,237,0.08)', color: 'var(--ds-spec)', border: '1px solid rgba(124,58,237,0.2)', padding: '2px 7px', borderRadius: '4px', fontFamily: 'var(--ds-font-mono)', fontWeight: '700' }}>
                                    {bPop.psmBitstream}
                                  </code>
                                ) : (
                                  <span style={{ color: C.muted, fontSize: '11px' }}>-</span>
                                )}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'left' }}>
                                {cPop?.psmNgn ? (
                                  <code style={{ fontSize: '11px', background: 'rgba(2,132,199,0.08)', color: 'var(--ds-info)', border: '1px solid rgba(2,132,199,0.2)', padding: '2px 7px', borderRadius: '4px', fontFamily: 'var(--ds-font-mono)', fontWeight: '700' }}>
                                    {cPop.psmNgn}
                                  </code>
                                ) : (
                                  <span style={{ color: C.muted, fontSize: '11px' }}>-</span>
                                )}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'left' }}>
                                {cPop?.psmBitstream ? (
                                  <code style={{ fontSize: '11px', background: 'rgba(124,58,237,0.08)', color: 'var(--ds-spec)', border: '1px solid rgba(124,58,237,0.2)', padding: '2px 7px', borderRadius: '4px', fontFamily: 'var(--ds-font-mono)', fontWeight: '700' }}>
                                    {cPop.psmBitstream}
                                  </code>
                                ) : (
                                  <span style={{ color: C.muted, fontSize: '11px' }}>-</span>
                                )}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'left' }}>
                                {sCode !== '-' ? (
                                  <code style={{ fontSize: '11px', background: 'rgba(16,185,129,0.1)', color: 'var(--ds-ok)', border: '1px solid rgba(16,185,129,0.25)', padding: '2px 7px', borderRadius: '4px', fontFamily: 'var(--ds-font-mono)', fontWeight: '700' }}>
                                    {sCode}
                                  </code>
                                ) : (
                                  <span style={{ color: C.muted, fontSize: '11px' }}>-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Interactive 2-Tier Pricing Hierarchy Tree */}
          <div style={{
            background: C.panel,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: '10px',
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span><Icon name="tag" size={14} /> 2-Tier Price Decomposition Tree</span>
                  <span style={{ fontSize: '11px', background: 'rgba(230,0,0,0.08)', color: 'var(--ds-brand)', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                    {resolvedPops.length} Bundle Variants
                  </span>
                </h3>
              </div>

              {/* Hierarchy Tree Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {/* View Mode Toggle: Atomic Cards vs Matrix Table */}
                <div style={{ display: 'inline-flex', background: 'var(--ds-surface-subtle)', border: `1px solid ${C.cardBorder}`, padding: '2px', borderRadius: '6px', gap: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setDecompViewMode('cards')}
                    style={{
                      background: decompViewMode !== 'table' ? '#ffffff' : 'transparent',
                      color: decompViewMode !== 'table' ? 'var(--ds-brand)' : C.muted,
                      border: decompViewMode !== 'table' ? `1px solid ${C.cardBorder}` : 'none',
                      padding: '3px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: decompViewMode !== 'table' ? '700' : '500',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: decompViewMode !== 'table' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                    }}
                    title="Display atomic sub-price cards view"
                  >
                    Atomic Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecompViewMode('table')}
                    style={{
                      background: decompViewMode === 'table' ? '#ffffff' : 'transparent',
                      color: decompViewMode === 'table' ? 'var(--ds-brand)' : C.muted,
                      border: decompViewMode === 'table' ? `1px solid ${C.cardBorder}` : 'none',
                      padding: '3px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: decompViewMode === 'table' ? '700' : '500',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: decompViewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                    }}
                    title="Display matrix table comparison view"
                  >
                    Matrix Table
                  </button>
                </div>

                {resolvedPops.length > 1 && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--ds-surface-subtle)', border: `1px solid ${C.cardBorder}`, borderRadius: '6px', padding: '2px', gap: '2px' }}>
                    <button
                      type="button"
                      onClick={() => setPopFilterMode('all')}
                      style={{
                        background: popFilterMode === 'all' ? '#ffffff' : 'transparent',
                        border: popFilterMode === 'all' ? `1px solid ${C.cardBorder}` : 'none',
                        color: popFilterMode === 'all' ? C.text : C.muted,
                        borderRadius: '4px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: popFilterMode === 'all' ? '700' : '500',
                        cursor: 'pointer'
                      }}
                    >
                      All POPs ({resolvedPops.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPopFilterMode('selected');
                        if (activeSelectedPopId) {
                          setExpandedPricingPops(prev => ({ ...prev, [activeSelectedPopId]: true }));
                        }
                      }}
                      style={{
                        background: popFilterMode === 'selected' ? 'var(--ds-info-soft)' : 'transparent',
                        border: popFilterMode === 'selected' ? '1px solid #bfdbfe' : 'none',
                        color: popFilterMode === 'selected' ? 'var(--ds-info)' : C.muted,
                        borderRadius: '4px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: popFilterMode === 'selected' ? '700' : '500',
                        cursor: 'pointer'
                      }}
                    >
                      Selected POP Only
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={toggleAllPricingPops}
                  style={{
                    background: arePricingPopsExpanded ? 'rgba(230,0,0,0.06)' : '#ffffff',
                    border: `1px solid ${arePricingPopsExpanded ? 'rgba(230,0,0,0.3)' : C.cardBorder}`,
                    color: arePricingPopsExpanded ? 'var(--ds-brand-dark)' : C.text,
                    padding: '4px 12px',
                    borderRadius: '5px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease'
                  }}
                  title={arePricingPopsExpanded ? "Click to collapse all pricing hierarchy tiers" : "Click to expand all pricing hierarchy tiers"}
                >
                  <span>{arePricingPopsExpanded ? '⊟' : '⊞'}</span>
                  <span>{arePricingPopsExpanded ? 'Collapse All' : 'Expand All'}</span>
                </button>
              </div>
            </div>

            {/* Bundle POPs Accordion List */}
            {resolvedPops.length === 0 ? (
              <div style={{ color: C.muted, fontSize: '13px', fontStyle: 'italic', padding: '16px', textAlign: 'center' }}>
                No Product Offering Prices attached.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {(popFilterMode === 'selected'
                  ? resolvedPops.filter(p => p.id === activeSelectedPopId)
                  : resolvedPops
                ).map((pop, idx) => {
                  const isExpanded = expandedPricingPops[pop.id] !== false; // default expanded
                  const sumVal = pop.components.reduce((acc, c) => acc + (c.price || 0), 0);
                  const isComfort = pop.connectionType === 'comfort';

                  const isSelected = activeSelectedPopId === pop.id;

                  return (
                    <div
                      key={pop.id || idx}
                      id={`pricing-pop-${pop.id}`}
                      style={{
                        background: '#ffffff',
                        border: `1px solid ${isSelected ? 'var(--ds-info)' : (isComfort ? 'rgba(124,58,237,0.3)' : 'rgba(2,132,199,0.3)')}`,
                        borderRadius: '10px',
                        overflow: 'hidden',
                        boxShadow: isSelected ? '0 0 0 2px var(--ds-info-soft), 0 3px 8px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.03)',
                        transition: 'all 0.25s ease'
                      }}
                    >
                      {/* Bundle POP Header (Tier 1) */}
                      <div
                        onClick={() => togglePricingPop(pop.id)}
                        style={{
                          background: isComfort ? 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, #ffffff 85%)' : 'linear-gradient(135deg, rgba(2,132,199,0.06) 0%, #ffffff 85%)',
                          padding: '14px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: isComfort ? 'var(--ds-spec)' : 'var(--ds-info)',
                              fontSize: '12px',
                              cursor: 'pointer',
                              padding: 0,
                              fontWeight: 'bold'
                            }}
                          >
                            {isExpanded ? '▼' : '▶'}
                          </button>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                color: isComfort ? 'var(--ds-spec)' : 'var(--ds-info)',
                                background: isComfort ? 'rgba(124,58,237,0.1)' : 'rgba(2,132,199,0.1)',
                                padding: '2px 8px',
                                borderRadius: '4px'
                              }}>
                                {isComfort ? 'Comfort Bundle' : 'Basic Bundle'}
                              </span>

                              <span style={{ fontSize: '11px', color: C.muted, fontWeight: '600' }}>
                                Speed: {pop.bandwidth} Mbps · Dual Play (pt2)
                              </span>

                              <span style={{ fontSize: '11px', color: 'var(--ds-ok)', background: 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                                4 Sub-Prices
                              </span>
                            </div>

                            <div style={{ fontSize: '13.5px', fontWeight: '700', color: C.text, marginTop: '3px' }}>
                              {pop.name || pop.id}
                            </div>

                            {/* POP Details as in above table */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginTop: '6px' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ fontSize: '11px', color: C.muted, fontWeight: '600' }}>Bandwith Service ID:</span>
                                {pop.bandwidthServiceId ? (
                                  <code style={{
                                    fontFamily: 'var(--ds-font-mono)',
                                    fontSize: '11.5px',
                                    fontWeight: '700',
                                    color: 'var(--ds-warn)',
                                    background: 'var(--ds-surface-2)',
                                    border: '1px solid rgba(245, 158, 11, 0.25)',
                                    padding: '2px 8px',
                                    borderRadius: '4px'
                                  }}>
                                    {pop.bandwidthServiceId}
                                  </code>
                                ) : (
                                  <span style={{ color: C.muted, fontSize: '11px' }}>-</span>
                                )}
                              </div>

                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ fontSize: '11px', color: C.muted, fontWeight: '600' }}>NGN Packet Code:</span>
                                {pop.psmNgn ? (
                                  <code style={{
                                    background: 'rgba(2,132,199,0.08)',
                                    color: 'var(--ds-info)',
                                    border: '1px solid rgba(2,132,199,0.2)',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontWeight: '700',
                                    fontFamily: 'var(--ds-font-mono)',
                                    fontSize: '11.5px'
                                  }}>
                                    {pop.psmNgn}
                                  </code>
                                ) : (
                                  <span style={{ color: C.muted, fontSize: '11px' }}>-</span>
                                )}
                              </div>

                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ fontSize: '11px', color: C.muted, fontWeight: '600' }}>Bitstream Packet Code:</span>
                                {pop.psmBitstream ? (
                                  <code style={{
                                    background: 'rgba(124,58,237,0.08)',
                                    color: 'var(--ds-spec)',
                                    border: '1px solid rgba(124,58,237,0.2)',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontWeight: '700',
                                    fontFamily: 'var(--ds-font-mono)',
                                    fontSize: '11.5px'
                                  }}>
                                    {pop.psmBitstream}
                                  </code>
                                ) : (
                                  <span style={{ color: C.muted, fontSize: '11px' }}>-</span>
                                )}
                              </div>

                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ fontSize: '11px', color: C.muted, fontWeight: '600' }}>Internet Tariff Code:</span>
                                {pop.tariffInternet ? (
                                  <code style={{
                                    background: 'rgba(59,130,246,0.08)',
                                    color: '#2563eb',
                                    border: '1px solid rgba(59,130,246,0.2)',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontWeight: '700',
                                    fontFamily: 'var(--ds-font-mono)',
                                    fontSize: '11.5px'
                                  }}>
                                    {pop.tariffInternet}
                                  </code>
                                ) : (
                                  <span style={{ color: C.muted, fontSize: '11px' }}>-</span>
                                )}
                              </div>

                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ fontSize: '11px', color: C.muted, fontWeight: '600' }}>Voice Tariff Code:</span>
                                {pop.tariffVoice ? (
                                  <code style={{
                                    background: 'rgba(16,185,129,0.08)',
                                    color: '#059669',
                                    border: '1px solid rgba(16,185,129,0.2)',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontWeight: '700',
                                    fontFamily: 'var(--ds-font-mono)',
                                    fontSize: '11.5px'
                                  }}>
                                    {pop.tariffVoice}
                                  </code>
                                ) : (
                                  <span style={{ color: C.muted, fontSize: '11px' }}>-</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bundle Price & Quick Links */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'right' }}>
                          <div>
                            <div style={{ fontSize: '19px', fontWeight: '800', color: 'var(--ds-warn)' }}>
                              €{pop.totalPrice.toFixed(2)} <span style={{ fontSize: '12px', color: C.muted, fontWeight: 'normal' }}>/ {pop.period}</span>
                            </div>
                          </div>

                          {onNavigateToPrice && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToPrice(pop.raw);
                              }}
                              style={{
                                background: '#ffffff',
                                border: '1px solid var(--ds-border-strong)',
                                color: 'var(--ds-brand)',
                                fontSize: '11px',
                                fontWeight: '700',
                                padding: '5px 10px',
                                borderRadius: '5px',
                                cursor: 'pointer'
                              }}
                              title="Open full POP Model in Drawer"
                            >
                              View Details →
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Decomposed Simple POPs List (Tier 2) */}
                      {isExpanded && (
                        <div style={{ padding: '16px 20px', background: '#fafbfc', borderTop: `1px solid ${C.cardBorder}` }}>
                          {/* Decomposition Controls & Rollup Status */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '13px', fontWeight: '700', color: C.text }}>
                                Atomic Sub-Price Decomposition ({pop.components.length} Components):
                              </span>
                            </div>

                            {/* Mathematical Rollup Verification Pill */}
                            {pop.totalPrice !== null && (
                              <span style={{
                                fontSize: '12px',
                                color: Math.abs(sumVal - pop.totalPrice) < 0.05 ? 'var(--ds-ok)' : 'var(--ds-warn)',
                                fontWeight: '700',
                                background: '#ffffff',
                                border: `1px solid ${C.cardBorder}`,
                                padding: '3px 10px',
                                borderRadius: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}>
                                <span>{Math.abs(sumVal - pop.totalPrice) < 0.05 ? '✓' : ''}</span>
                                <span>Rollup: €{sumVal.toFixed(2)} = €{Number(pop.totalPrice).toFixed(2)} / {pop.period}</span>
                              </span>
                            )}
                          </div>

                          {/* ─── VIEW 1: THE 4 ATOMIC COMPONENTS CARD GRID (Aligned with New Sales Package View) ─── */}
                          {decompViewMode !== 'table' && (() => {
                            const compBw = pop.components.find(c => c.suffix === '_bw') || pop.components.find(c => (c.id || '').includes('_bw') || (c.name || '').toLowerCase().includes('bandwidth'));
                            const compIn = pop.components.find(c => c.suffix === '_in') || pop.components.find(c => (c.id || '').includes('_in') || (c.name || '').toLowerCase().includes('internet'));
                            const compVa = pop.components.find(c => c.suffix === '_va') || pop.components.find(c => (c.id || '').includes('_va') || (c.name || '').toLowerCase().includes('voice access'));
                            const compVt = pop.components.find(c => c.suffix === '_vt') || pop.components.find(c => c.suffix === '_vf') || pop.components.find(c => (c.id || '').includes('_vt') || (c.name || '').toLowerCase().includes('tariff') || (c.name || '').toLowerCase().includes('flat'));

                            const sharePct = (comp) => (comp && pop.totalPrice > 0 ? ((comp.price / pop.totalPrice) * 100).toFixed(1) : null);
                            const otherComponents = pop.components.filter(c => c !== compBw && c !== compIn && c !== compVa && c !== compVt);

                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {/* Top Label */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--ds-text-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Atomic Components ({pop.id})
                                  </span>
                                  <span style={{ fontSize: '11px', color: 'var(--ds-text-3)' }}>
                                    TMF620 bundledPopRelationship (Standalone & Unlocked)
                                  </span>
                                </div>

                                {/* The 4 Atomic Components Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                                  {/* 1. Bandwidth Option (_bw) */}
                                  <div style={{
                                    border: '1px solid #bfdbfe',
                                    background: 'var(--ds-info-soft)',
                                    borderRadius: '8px',
                                    padding: '14px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                  }}>
                                    <div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#1e40af' }}>
                                          Bandwidth Option (_bw)
                                        </span>
                                        <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                          Tier Price
                                        </span>
                                      </div>
                                      <div style={{ fontSize: '11px', color: '#3b82f6', marginBottom: '10px' }}>
                                        Capacity: {pop.bandwidth || speedVal || 250} Mbit/s
                                      </div>
                                      <div style={{
                                        background: '#ffffff',
                                        border: '1px solid #bfdbfe',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                        marginBottom: '10px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'baseline'
                                      }}>
                                        <span style={{ fontSize: '16px', fontWeight: '800', color: '#1e40af' }}>
                                          €{compBw ? Number(compBw.price).toFixed(2) : '0.00'}
                                        </span>
                                        <span style={{ fontSize: '11px', color: C.muted, fontWeight: '600' }}>
                                          EUR / {compBw?.period || pop.period || 'month'}
                                        </span>
                                        {sharePct(compBw) && (
                                          <span style={{ fontSize: '10.5px', color: 'var(--ds-ok)', background: 'rgba(16,185,129,0.1)', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>
                                            {sharePct(compBw)}%
                                          </span>
                                        )}
                                      </div>
                                      <div style={{ marginBottom: '8px' }}>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#1e40af', marginBottom: '3px' }}>
                                          Speed Service Code (Internet)
                                        </label>
                                        <div style={{
                                          background: '#ffffff',
                                          border: '1px solid #bfdbfe',
                                          borderRadius: '6px',
                                          padding: '6px 10px',
                                          fontFamily: 'var(--ds-font-mono)',
                                          fontSize: '12px',
                                          fontWeight: '700',
                                          color: '#1e40af'
                                        }}>
                                          {compBw?.serviceBitstream || compBw?.serviceNgn || (Number(pop.bandwidth) >= 250 ? 'V018V' : Number(pop.bandwidth) >= 100 ? 'V018N' : 'V018C')}
                                        </div>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid #dbeafe', paddingTop: '8px', marginTop: '6px' }}>
                                      {compBw && onNavigateToPrice && compBw.raw && (
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); onNavigateToPrice(compBw.raw); }}
                                          style={{
                                            background: '#ffffff',
                                            border: '1px solid #bfdbfe',
                                            color: '#1e40af',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            padding: '4px 10px',
                                            borderRadius: '5px',
                                            cursor: 'pointer'
                                          }}
                                          title="Inspect POP in drawer"
                                        >
                                          Inspect →
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* 2. Internet Access Baseline (_in) */}
                                  <div style={{
                                    border: '1px solid #e9d5ff',
                                    background: 'var(--ds-spec-soft)',
                                    borderRadius: '8px',
                                    padding: '14px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                  }}>
                                    <div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--ds-spec-text)' }}>
                                          Internet Access (_in)
                                        </span>
                                        <span style={{ fontSize: '11px', background: 'var(--ds-spec-soft)', color: 'var(--ds-spec-text)', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                          Baseline Price
                                        </span>
                                      </div>
                                      <div style={{ fontSize: '11px', color: '#9333ea', marginBottom: '10px' }}>
                                        Broadband Line baseline
                                      </div>
                                      <div style={{
                                        background: '#ffffff',
                                        border: '1px solid #e9d5ff',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                        marginBottom: '10px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'baseline'
                                      }}>
                                        <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--ds-spec-text)' }}>
                                          €{compIn ? Number(compIn.price).toFixed(2) : '14.00'}
                                        </span>
                                        <span style={{ fontSize: '11px', color: C.muted, fontWeight: '600' }}>
                                          EUR / {compIn?.period || pop.period || 'month'}
                                        </span>
                                        {sharePct(compIn) && (
                                          <span style={{ fontSize: '10.5px', color: 'var(--ds-ok)', background: 'rgba(16,185,129,0.1)', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>
                                            {sharePct(compIn)}%
                                          </span>
                                        )}
                                      </div>
                                      <div style={{ marginBottom: '8px' }}>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-spec-text)', marginBottom: '3px' }}>
                                          Access Service Code (Internet)
                                        </label>
                                        <div style={{
                                          background: '#ffffff',
                                          border: '1px solid #e9d5ff',
                                          borderRadius: '6px',
                                          padding: '6px 10px',
                                          fontFamily: 'var(--ds-font-mono)',
                                          fontSize: '12px',
                                          fontWeight: '700',
                                          color: 'var(--ds-spec-text)'
                                        }}>
                                          {compIn?.serviceBitstream || compIn?.serviceNgn || 'V0017'}
                                        </div>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid var(--ds-spec-soft)', paddingTop: '8px', marginTop: '6px' }}>
                                      {compIn && onNavigateToPrice && compIn.raw && (
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); onNavigateToPrice(compIn.raw); }}
                                          style={{
                                            background: '#ffffff',
                                            border: '1px solid #e9d5ff',
                                            color: 'var(--ds-spec-text)',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            padding: '4px 10px',
                                            borderRadius: '5px',
                                            cursor: 'pointer'
                                          }}
                                          title="Inspect POP in drawer"
                                        >
                                          Inspect →
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* 3. Voice Access (_va) */}
                                  <div style={{
                                    border: '1px solid var(--ds-ok-border)',
                                    background: 'var(--ds-ok-soft)',
                                    borderRadius: '8px',
                                    padding: '14px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                  }}>
                                    <div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--ds-ok)' }}>
                                          Voice Access (_va)
                                        </span>
                                        <span style={{ fontSize: '11px', background: '#d1fae5', color: 'var(--ds-ok)', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                          Line Fee
                                        </span>
                                      </div>
                                      <div style={{ fontSize: '11px', color: 'var(--ds-ok)', marginBottom: '10px' }}>
                                        Landline access ({isComfort ? 'Comfort / 2 Lines' : 'Basic / 1 Line'})
                                      </div>
                                      <div style={{
                                        background: '#ffffff',
                                        border: '1px solid var(--ds-ok-border)',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                        marginBottom: '10px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'baseline'
                                      }}>
                                        <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--ds-ok)' }}>
                                          €{compVa ? Number(compVa.price).toFixed(2) : (isComfort ? '19.98' : '15.99')}
                                        </span>
                                        <span style={{ fontSize: '11px', color: C.muted, fontWeight: '600' }}>
                                          EUR / {compVa?.period || pop.period || 'month'}
                                        </span>
                                        {sharePct(compVa) && (
                                          <span style={{ fontSize: '10.5px', color: 'var(--ds-ok)', background: 'rgba(16,185,129,0.1)', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>
                                            {sharePct(compVa)}%
                                          </span>
                                        )}
                                      </div>
                                      <div style={{ marginBottom: '8px' }}>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-ok)', marginBottom: '3px' }}>
                                          Voice Svc (NGN / Bitstream)
                                        </label>
                                        <div style={{
                                          background: '#ffffff',
                                          border: '1px solid var(--ds-ok-border)',
                                          borderRadius: '6px',
                                          padding: '6px 10px',
                                          fontFamily: 'var(--ds-font-mono)',
                                          fontSize: '11px',
                                          fontWeight: '700',
                                          color: 'var(--ds-ok)'
                                        }}>
                                          NGN: {compVa?.serviceNgn || (isComfort ? 'VI003' : 'VI002')} • DSL: {compVa?.serviceBitstream || (isComfort ? 'VI006' : 'VI009')}
                                        </div>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid #d1fae5', paddingTop: '8px', marginTop: '6px' }}>
                                      {compVa && onNavigateToPrice && compVa.raw && (
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); onNavigateToPrice(compVa.raw); }}
                                          style={{
                                            background: '#ffffff',
                                            border: '1px solid var(--ds-ok-border)',
                                            color: 'var(--ds-ok)',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            padding: '4px 10px',
                                            borderRadius: '5px',
                                            cursor: 'pointer'
                                          }}
                                          title="Inspect POP in drawer"
                                        >
                                          Inspect →
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* 4. Voice Tariff (_vt) */}
                                  <div style={{
                                    border: '1px solid #fed7aa',
                                    background: '#fff7ed',
                                    borderRadius: '8px',
                                    padding: '14px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                  }}>
                                    <div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--ds-warn)' }}>
                                          Voice Tariff (_vt)
                                        </span>
                                        <span style={{ fontSize: '11px', background: '#ffedd5', color: 'var(--ds-warn)', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                          Flatrate Fee
                                        </span>
                                      </div>
                                      <div style={{ fontSize: '11px', color: '#ea580c', marginBottom: '10px' }}>
                                        German Festnetz flatrate
                                      </div>
                                      <div style={{
                                        background: '#ffffff',
                                        border: '1px solid #fed7aa',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                        marginBottom: '10px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'baseline'
                                      }}>
                                        <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--ds-warn)' }}>
                                          €{compVt ? Number(compVt.price).toFixed(2) : '5.00'}
                                        </span>
                                        <span style={{ fontSize: '11px', color: C.muted, fontWeight: '600' }}>
                                          EUR / {compVt?.period || pop.period || 'month'}
                                        </span>
                                        {sharePct(compVt) && (
                                          <span style={{ fontSize: '10.5px', color: 'var(--ds-ok)', background: 'rgba(16,185,129,0.1)', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>
                                            {sharePct(compVt)}%
                                          </span>
                                        )}
                                      </div>
                                      <div style={{ marginBottom: '8px' }}>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-warn)', marginBottom: '3px' }}>
                                          Flatrate Service Code (Voice)
                                        </label>
                                        <div style={{
                                          background: '#ffffff',
                                          border: '1px solid #fed7aa',
                                          borderRadius: '6px',
                                          padding: '6px 10px',
                                          fontFamily: 'var(--ds-font-mono)',
                                          fontSize: '12px',
                                          fontWeight: '700',
                                          color: 'var(--ds-warn)'
                                        }}>
                                          {compVt?.serviceBitstream || compVt?.serviceNgn || 'V0017'}
                                        </div>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid #fed7aa', paddingTop: '8px', marginTop: '6px' }}>
                                      {compVt && onNavigateToPrice && compVt.raw && (
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); onNavigateToPrice(compVt.raw); }}
                                          style={{
                                            background: '#ffffff',
                                            border: '1px solid #fed7aa',
                                            color: 'var(--ds-warn)',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            padding: '4px 10px',
                                            borderRadius: '5px',
                                            cursor: 'pointer'
                                          }}
                                          title="Inspect POP in drawer"
                                        >
                                          Inspect →
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Any other components if present */}
                                  {otherComponents.map((cExtra, eIdx) => (
                                    <div
                                      key={eIdx}
                                      style={{
                                        border: `1px solid ${C.cardBorder}`,
                                        background: 'var(--ds-surface-subtle)',
                                        borderRadius: '8px',
                                        padding: '14px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between'
                                      }}
                                    >
                                      <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                          <span style={{ fontSize: '12px', fontWeight: '800', color: C.text }}>
                                            {cExtra.name}
                                          </span>
                                          <span style={{ fontSize: '11px', background: 'var(--ds-surface-2)', color: C.muted, padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                            {cExtra.suffix || 'Component'}
                                          </span>
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--ds-warn)', margin: '8px 0' }}>
                                          €{Number(cExtra.price).toFixed(2)} EUR
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: `1px solid ${C.cardBorder}`, paddingTop: '8px', marginTop: '6px' }}>
                                        {onNavigateToPrice && cExtra.raw && (
                                          <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); onNavigateToPrice(cExtra.raw); }}
                                            style={{ background: '#ffffff', border: `1px solid ${C.cardBorder}`, color: C.text, padding: '4px 10px', borderRadius: '5px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                            title="Inspect POP in drawer"
                                          >
                                            Inspect →
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* CCB Network Billing, Tariff & PSM Codes Box (Aligned with New Sales Package View) */}
                                {(() => {
                                  const psmStructPop = (psmStructure?.resolvedPops || []).find(p => p.id === pop.id);

                                  const popPsmNgnInternet = (pop.hasNgn && (psmStructPop?.psmInternetNgn && psmStructPop.psmInternetNgn !== '-' ? psmStructPop.psmInternetNgn : compIn?.pktCodeNgn || compBw?.pktCodeNgn || pop.psmNgn)) || '-';
                                  const popTariffNgnInternet = (pop.hasNgn && (psmStructPop?.tariffInternetNgn && psmStructPop.tariffInternetNgn !== '-' ? psmStructPop.tariffInternetNgn : compIn?.tCodeNgn || compBw?.tCodeNgn || tariffCodeInternetNgn)) || '-';
                                  const popServiceNgnInternet = (pop.hasNgn && (psmStructPop?.serviceInternetNgn && psmStructPop.serviceInternetNgn !== '-' ? psmStructPop.serviceInternetNgn : [compIn?.svcCodeNgn, compBw?.svcCodeNgn].filter(Boolean).join(', ') || serviceCodeInternetNgn.join(', '))) || '-';

                                  const popPsmNgnVoice = (pop.hasNgn && (psmStructPop?.psmVoiceNgn && psmStructPop.psmVoiceNgn !== '-' ? psmStructPop.psmVoiceNgn : compVa?.pktCodeNgn || compVt?.pktCodeNgn || pop.psmNgn)) || '-';
                                  const popTariffNgnVoice = (pop.hasNgn && (psmStructPop?.tariffVoiceNgn && psmStructPop.tariffVoiceNgn !== '-' ? psmStructPop.tariffVoiceNgn : compVa?.tCodeNgn || compVt?.tCodeNgn || tariffCodeVoiceNgn)) || '-';
                                  const popServiceNgnVoice = (pop.hasNgn && (psmStructPop?.serviceVoiceNgn && psmStructPop.serviceVoiceNgn !== '-' ? psmStructPop.serviceVoiceNgn : [compVa?.svcCodeNgn, compVt?.svcCodeNgn].filter(Boolean).join(', ') || serviceCodeVoiceNgn.join(', '))) || '-';

                                  const popPsmBsInternet = (pop.hasBitstream && (psmStructPop?.psmInternetBitstream && psmStructPop.psmInternetBitstream !== '-' ? psmStructPop.psmInternetBitstream : compIn?.pktCodeBs || compBw?.pktCodeBs || pop.psmBitstream)) || '-';
                                  const popTariffBsInternet = (pop.hasBitstream && (psmStructPop?.tariffInternetBitstream && psmStructPop.tariffInternetBitstream !== '-' ? psmStructPop.tariffInternetBitstream : compIn?.tCodeBs || compBw?.tCodeBs || tariffCodeInternetBitstream)) || '-';
                                  const popServiceBsInternet = (pop.hasBitstream && (psmStructPop?.serviceInternetBitstream && psmStructPop.serviceInternetBitstream !== '-' ? psmStructPop.serviceInternetBitstream : [compIn?.svcCodeBs, compBw?.svcCodeBs].filter(Boolean).join(', ') || serviceCodeInternetBitstream.join(', '))) || '-';

                                  const popPsmBsVoice = (pop.hasBitstream && (psmStructPop?.psmVoiceBitstream && psmStructPop.psmVoiceBitstream !== '-' ? psmStructPop.psmVoiceBitstream : compVa?.pktCodeBs || compVt?.pktCodeBs || pop.psmBitstream)) || '-';
                                  const popTariffBsVoice = (pop.hasBitstream && (psmStructPop?.tariffVoiceBitstream && psmStructPop.tariffVoiceBitstream !== '-' ? psmStructPop.tariffVoiceBitstream : compVa?.tCodeBs || compVt?.tCodeBs || tariffCodeVoiceBitstream)) || '-';
                                  const popServiceBsVoice = (pop.hasBitstream && (psmStructPop?.serviceVoiceBitstream && psmStructPop.serviceVoiceBitstream !== '-' ? psmStructPop.serviceVoiceBitstream : [compVa?.svcCodeBs, compVt?.svcCodeBs].filter(Boolean).join(', ') || serviceCodeVoiceBitstream.join(', '))) || '-';

                                  return (
                                    <div style={{ paddingTop: '16px', borderTop: '1px solid var(--ds-border)', marginTop: '16px' }}>
                                      <div style={{ marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                          <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--ds-text)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                            CCB Network Billing, Tariff & PSM Codes ({pop.id})
                                          </span>
                                          <span style={{ fontSize: '11px', color: 'var(--ds-text-3)' }}>
                                            Syncs to offer characteristics: <code>psm_sales_packet_code</code>, <code>tariff_code_*</code>, <code>service_code_*</code>
                                          </span>
                                        </div>
                                        <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: C.muted }}>
                                          CCB PSM Sales Packet codes, Tariff codes, and Service codes for this variant across supported access networks.
                                        </p>
                                      </div>

                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
                                        {/* Vodafone NGN Network */}
                                        <div style={{
                                          background: '#ffffff',
                                          border: '1px solid var(--ds-danger-border, #fecaca)',
                                          borderTop: '3px solid var(--ds-danger, #e60000)',
                                          borderRadius: '8px',
                                          padding: '14px',
                                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                                        }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--ds-brand-text, #991b1b)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--ds-danger, #e60000)' }}></span>
                                              Vodafone NGN Network
                                            </span>
                                            <span style={{ fontSize: '11px', background: 'var(--ds-danger-soft, #fef2f2)', color: 'var(--ds-brand-text, #991b1b)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                                              {pop.hasNgn ? 'FTTH / VDSL (NGN)' : 'Not Supported'}
                                            </span>
                                          </div>

                                          {pop.hasNgn ? (
                                            <>
                                              {/* NGN Internet Domain */}
                                              <div style={{ background: 'var(--ds-danger-soft, #fef2f2)', borderRadius: '6px', padding: '10px 12px', marginBottom: '10px' }}>
                                                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ds-brand-text, #991b1b)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                                  Internet Domain (_in)
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                                  <div>
                                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-brand-text, #991b1b)', marginBottom: '2px' }}>
                                                      PSM Packet Code
                                                    </label>
                                                    <div style={{
                                                      background: '#ffffff',
                                                      border: '1px solid var(--ds-border, #e2e8f0)',
                                                      borderRadius: '4px',
                                                      padding: '6px 10px',
                                                      fontFamily: 'var(--ds-font-mono)',
                                                      fontSize: '12px',
                                                      fontWeight: '700',
                                                      color: 'var(--ds-danger, #e60000)',
                                                      minHeight: '20px',
                                                      display: 'flex',
                                                      alignItems: 'center'
                                                    }}>
                                                      {popPsmNgnInternet}
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-brand-text, #991b1b)', marginBottom: '2px' }}>
                                                      Tariff Code
                                                    </label>
                                                    <div style={{
                                                      background: '#ffffff',
                                                      border: '1px solid var(--ds-border, #e2e8f0)',
                                                      borderRadius: '4px',
                                                      padding: '6px 10px',
                                                      fontFamily: 'var(--ds-font-mono)',
                                                      fontSize: '12px',
                                                      fontWeight: '700',
                                                      color: 'var(--ds-danger, #e60000)',
                                                      minHeight: '20px',
                                                      display: 'flex',
                                                      alignItems: 'center'
                                                    }}>
                                                      {popTariffNgnInternet}
                                                    </div>
                                                  </div>
                                                </div>
                                                <div>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                                    <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--ds-brand-text, #991b1b)' }}>
                                                      Service Codes (Combined: _in + _bw)
                                                    </label>
                                                    <span style={{ fontSize: '10px', color: 'var(--ds-brand-text, #991b1b)', background: 'var(--ds-danger-soft, #fef2f2)', padding: '1px 5px', borderRadius: '3px', fontWeight: '600' }}>
                                                      Auto-Combined
                                                    </span>
                                                  </div>
                                                  <div style={{
                                                    background: '#ffffff',
                                                    border: '1px solid var(--ds-border, #e2e8f0)',
                                                    borderRadius: '4px',
                                                    padding: '6px 10px',
                                                    fontFamily: 'var(--ds-font-mono)',
                                                    fontSize: '12px',
                                                    color: 'var(--ds-text-2)',
                                                    minHeight: '20px',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                  }}>
                                                    {popServiceNgnInternet}
                                                  </div>
                                                </div>
                                              </div>

                                              {/* NGN Voice Domain */}
                                              <div style={{ background: 'var(--ds-danger-soft, #fef2f2)', borderRadius: '6px', padding: '10px 12px' }}>
                                                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ds-brand-text, #991b1b)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                                  Voice Domain (_va / _vt)
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                                  <div>
                                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-brand-text, #991b1b)', marginBottom: '2px' }}>
                                                      PSM Packet Code
                                                    </label>
                                                    <div style={{
                                                      background: '#ffffff',
                                                      border: '1px solid var(--ds-border, #e2e8f0)',
                                                      borderRadius: '4px',
                                                      padding: '6px 10px',
                                                      fontFamily: 'var(--ds-font-mono)',
                                                      fontSize: '12px',
                                                      fontWeight: '700',
                                                      color: 'var(--ds-danger, #e60000)',
                                                      minHeight: '20px',
                                                      display: 'flex',
                                                      alignItems: 'center'
                                                    }}>
                                                      {popPsmNgnVoice}
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-brand-text, #991b1b)', marginBottom: '2px' }}>
                                                      Tariff Code
                                                    </label>
                                                    <div style={{
                                                      background: '#ffffff',
                                                      border: '1px solid var(--ds-border, #e2e8f0)',
                                                      borderRadius: '4px',
                                                      padding: '6px 10px',
                                                      fontFamily: 'var(--ds-font-mono)',
                                                      fontSize: '12px',
                                                      fontWeight: '700',
                                                      color: 'var(--ds-danger, #e60000)',
                                                      minHeight: '20px',
                                                      display: 'flex',
                                                      alignItems: 'center'
                                                    }}>
                                                      {popTariffNgnVoice}
                                                    </div>
                                                  </div>
                                                </div>
                                                <div>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                                    <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--ds-brand-text, #991b1b)' }}>
                                                      Service Codes (Combined: _vt + _va)
                                                    </label>
                                                    <span style={{ fontSize: '10px', color: 'var(--ds-brand-text, #991b1b)', background: 'var(--ds-danger-soft, #fef2f2)', padding: '1px 5px', borderRadius: '3px', fontWeight: '600' }}>
                                                      Auto-Combined
                                                    </span>
                                                  </div>
                                                  <div style={{
                                                    background: '#ffffff',
                                                    border: '1px solid var(--ds-border, #e2e8f0)',
                                                    borderRadius: '4px',
                                                    padding: '6px 10px',
                                                    fontFamily: 'var(--ds-font-mono)',
                                                    fontSize: '12px',
                                                    color: 'var(--ds-text-2)',
                                                    minHeight: '20px',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                  }}>
                                                    {popServiceNgnVoice}
                                                  </div>
                                                </div>
                                              </div>
                                            </>
                                          ) : (
                                            <div style={{ padding: '24px 12px', textAlign: 'center', color: C.muted, fontStyle: 'italic', fontSize: '12px' }}>
                                              Not applicable for this variant (Provisioned exclusively on Telekom Bitstream wholesale network).
                                            </div>
                                          )}
                                        </div>

                                        {/* Telekom Bitstream Network */}
                                        <div style={{
                                          background: '#ffffff',
                                          border: '1px solid #e9d5ff',
                                          borderTop: '3px solid #9333ea',
                                          borderRadius: '8px',
                                          padding: '14px',
                                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                                        }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--ds-spec-text)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#9333ea' }}></span>
                                              Bitstream (DSL) Network
                                            </span>
                                            <span style={{ fontSize: '11px', background: 'var(--ds-spec-soft)', color: 'var(--ds-spec-text)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                                              {pop.hasBitstream ? 'Wholesale DSL (Bitstream)' : 'Not Supported'}
                                            </span>
                                          </div>

                                          {pop.hasBitstream ? (
                                            <>
                                              {/* Bitstream Internet Domain */}
                                              <div style={{ background: 'var(--ds-spec-soft)', borderRadius: '6px', padding: '10px 12px', marginBottom: '10px' }}>
                                                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ds-spec-text)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                                  Internet Domain (_in)
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                                  <div>
                                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-spec-text)', marginBottom: '2px' }}>
                                                      PSM Packet Code
                                                    </label>
                                                    <div style={{
                                                      background: '#ffffff',
                                                      border: '1px solid var(--ds-border, #e2e8f0)',
                                                      borderRadius: '4px',
                                                      padding: '6px 10px',
                                                      fontFamily: 'var(--ds-font-mono)',
                                                      fontSize: '12px',
                                                      fontWeight: '700',
                                                      color: 'var(--ds-spec-text)',
                                                      minHeight: '20px',
                                                      display: 'flex',
                                                      alignItems: 'center'
                                                    }}>
                                                      {popPsmBsInternet}
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-spec-text)', marginBottom: '2px' }}>
                                                      Tariff Code
                                                    </label>
                                                    <div style={{
                                                      background: '#ffffff',
                                                      border: '1px solid var(--ds-border, #e2e8f0)',
                                                      borderRadius: '4px',
                                                      padding: '6px 10px',
                                                      fontFamily: 'var(--ds-font-mono)',
                                                      fontSize: '12px',
                                                      fontWeight: '700',
                                                      color: 'var(--ds-spec-text)',
                                                      minHeight: '20px',
                                                      display: 'flex',
                                                      alignItems: 'center'
                                                    }}>
                                                      {popTariffBsInternet}
                                                    </div>
                                                  </div>
                                                </div>
                                                <div>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                                    <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--ds-spec-text)' }}>
                                                      Service Codes (Combined: _in + _bw)
                                                    </label>
                                                    <span style={{ fontSize: '10px', color: 'var(--ds-spec-text)', background: 'var(--ds-spec-soft)', padding: '1px 5px', borderRadius: '3px', fontWeight: '600' }}>
                                                      Auto-Combined
                                                    </span>
                                                  </div>
                                                  <div style={{
                                                    background: '#ffffff',
                                                    border: '1px solid var(--ds-border, #e2e8f0)',
                                                    borderRadius: '4px',
                                                    padding: '6px 10px',
                                                    fontFamily: 'var(--ds-font-mono)',
                                                    fontSize: '12px',
                                                    color: 'var(--ds-text-2)',
                                                    minHeight: '20px',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                  }}>
                                                    {popServiceBsInternet}
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Bitstream Voice Domain */}
                                              <div style={{ background: 'var(--ds-spec-soft)', borderRadius: '6px', padding: '10px 12px' }}>
                                                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ds-spec-text)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                                  Voice Domain (_va / _vt)
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                                  <div>
                                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-spec-text)', marginBottom: '2px' }}>
                                                      PSM Packet Code
                                                    </label>
                                                    <div style={{
                                                      background: '#ffffff',
                                                      border: '1px solid var(--ds-border, #e2e8f0)',
                                                      borderRadius: '4px',
                                                      padding: '6px 10px',
                                                      fontFamily: 'var(--ds-font-mono)',
                                                      fontSize: '12px',
                                                      fontWeight: '700',
                                                      color: 'var(--ds-spec-text)',
                                                      minHeight: '20px',
                                                      display: 'flex',
                                                      alignItems: 'center'
                                                    }}>
                                                      {popPsmBsVoice}
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-spec-text)', marginBottom: '2px' }}>
                                                      Tariff Code
                                                    </label>
                                                    <div style={{
                                                      background: '#ffffff',
                                                      border: '1px solid var(--ds-border, #e2e8f0)',
                                                      borderRadius: '4px',
                                                      padding: '6px 10px',
                                                      fontFamily: 'var(--ds-font-mono)',
                                                      fontSize: '12px',
                                                      fontWeight: '700',
                                                      color: 'var(--ds-spec-text)',
                                                      minHeight: '20px',
                                                      display: 'flex',
                                                      alignItems: 'center'
                                                    }}>
                                                      {popTariffBsVoice}
                                                    </div>
                                                  </div>
                                                </div>
                                                <div>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                                    <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--ds-spec-text)' }}>
                                                      Service Codes (Combined: _vt + _va)
                                                    </label>
                                                    <span style={{ fontSize: '10px', color: 'var(--ds-spec-text)', background: 'var(--ds-spec-soft)', padding: '1px 5px', borderRadius: '3px', fontWeight: '600' }}>
                                                      Auto-Combined
                                                    </span>
                                                  </div>
                                                  <div style={{
                                                    background: '#ffffff',
                                                    border: '1px solid var(--ds-border, #e2e8f0)',
                                                    borderRadius: '4px',
                                                    padding: '6px 10px',
                                                    fontFamily: 'var(--ds-font-mono)',
                                                    fontSize: '12px',
                                                    color: 'var(--ds-text-2)',
                                                    minHeight: '20px',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                  }}>
                                                    {popServiceBsVoice}
                                                  </div>
                                                </div>
                                              </div>
                                            </>
                                          ) : (
                                            <div style={{ padding: '24px 12px', textAlign: 'center', color: C.muted, fontStyle: 'italic', fontSize: '12px' }}>
                                              Not applicable for this variant (Provisioned exclusively on Vodafone NGN network).
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            );
                          })()}

                            {/* ─── VIEW 2: ALIGNED MATRIX TABLE VIEW ─── */}
                            {decompViewMode === 'table' && (
                              <div style={{ background: '#ffffff', border: `1px solid ${C.cardBorder}`, borderRadius: '8px', overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                                  <thead>
                                    <tr style={{ borderBottom: `1px solid ${C.cardBorder}`, background: 'var(--ds-surface-subtle)', color: C.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                      <th style={{ padding: '9px 12px', width: '28%' }}>Component</th>
                                      <th style={{ padding: '9px 12px', width: '18%' }}>Recurring Fee</th>
                                      <th style={{ padding: '9px 12px', width: '25%' }}>Vodafone NGN</th>
                                      <th style={{ padding: '9px 12px', width: '25%' }}>Telekom Bitstream</th>
                                      <th style={{ padding: '9px 12px', width: '4%', textAlign: 'center' }}>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {pop.components.map((comp, cIdx) => {
                                      const sharePct = pop.totalPrice > 0 ? ((comp.price / pop.totalPrice) * 100).toFixed(1) : null;
                                      return (
                                        <tr key={cIdx} style={{ borderBottom: `1px solid ${C.cardBorder}`, background: cIdx % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                                          {/* Component */}
                                          <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                              <span><Icon name={comp.suffix === '_bw' ? '' : comp.suffix === '_in' ? '' : comp.suffix === '_va' ? 'phone' : 'message'} size={14} /></span>
                                              <strong style={{ color: C.text }}>{comp.name}</strong>
                                              <code style={{ fontSize: '11px', color: 'var(--ds-spec)', background: 'rgba(124,58,237,0.08)', padding: '1px 5px', borderRadius: '3px', fontWeight: '700' }}>
                                                {comp.suffix}
                                              </code>
                                            </div>
                                            <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>
                                              {comp.functionalRole}
                                            </div>
                                            <code style={{ fontSize: '11px', color: 'var(--ds-text-3)', display: 'block', marginTop: '2px', fontFamily: 'var(--ds-font-mono)' }}>
                                              {comp.id}
                                            </code>
                                          </td>

                                          {/* Recurring Fee */}
                                          <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                                            <div style={{ fontSize: '14.5px', fontWeight: '800', color: 'var(--ds-warn)' }}>
                                              €{Number(comp.price).toFixed(2)}
                                            </div>
                                            <div style={{ fontSize: '11px', color: C.muted }}>
                                              per {comp.period}
                                            </div>
                                            {sharePct && (
                                              <span style={{ fontSize: '11px', color: 'var(--ds-ok)', background: 'rgba(16,185,129,0.1)', padding: '1px 5px', borderRadius: '3px', fontWeight: '700', display: 'inline-block', marginTop: '2px' }}>
                                                {sharePct}% of total
                                              </span>
                                            )}
                                          </td>

                                          {/* Vodafone NGN */}
                                        <td style={{ padding: '10px 12px', verticalAlign: 'top', fontSize: '11px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                                            <span style={{ color: C.muted, fontSize: '11px' }}>Packet:</span>
                                            <code style={{ color: 'var(--ds-info)', fontWeight: '700', fontFamily: 'var(--ds-font-mono)' }}>{comp.packetNgn || '-'}</code>
                                            <span style={{ color: 'var(--ds-text-3)' }}>+</span>
                                            <span style={{ color: C.muted, fontSize: '11px' }}>Svc:</span>
                                            <code style={{ color: 'var(--ds-ok)', fontWeight: '700', fontFamily: 'var(--ds-font-mono)' }}>{comp.serviceNgn || '-'}</code>
                                          </div>
                                          <div style={{ fontSize: '11px', color: C.muted }}>
                                            Prod/Tariff: <code style={{ fontFamily: 'var(--ds-font-mono)' }}>{comp.prodCodeNgn || '-'}/{comp.tariffCodeNgn || '-'}</code>
                                          </div>
                                          <div style={{ fontSize: '11px', color: 'var(--ds-warn)', fontWeight: '700', fontFamily: 'var(--ds-font-mono)', marginTop: '2px' }}>
                                            Key: {comp.packetNgn && comp.serviceNgn ? `${comp.packetNgn}+${comp.serviceNgn}` : '-'}
                                          </div>
                                        </td>

                                        {/* Telekom Bitstream */}
                                        <td style={{ padding: '10px 12px', verticalAlign: 'top', fontSize: '11px' }}>
                                          {pop.hasBitstream ? (
                                            <>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                                                <span style={{ color: C.muted, fontSize: '11px' }}>Packet:</span>
                                                <code style={{ color: 'var(--ds-spec)', fontWeight: '700', fontFamily: 'var(--ds-font-mono)' }}>{comp.packetBitstream || '-'}</code>
                                                <span style={{ color: 'var(--ds-text-3)' }}>+</span>
                                                <span style={{ color: C.muted, fontSize: '11px' }}>Svc:</span>
                                                <code style={{ color: 'var(--ds-info)', fontWeight: '700', fontFamily: 'var(--ds-font-mono)' }}>{comp.serviceBitstream || '-'}</code>
                                              </div>
                                              <div style={{ fontSize: '11px', color: C.muted }}>
                                                Prod/Tariff: <code style={{ fontFamily: 'var(--ds-font-mono)' }}>{comp.prodCodeBitstream || '-'}/{comp.tariffCodeBitstream || '-'}</code>
                                              </div>
                                              <div style={{ fontSize: '11px', color: 'var(--ds-warn)', fontWeight: '700', fontFamily: 'var(--ds-font-mono)', marginTop: '2px' }}>
                                                Key: {comp.packetBitstream && comp.serviceBitstream ? `${comp.packetBitstream}+${comp.serviceBitstream}` : '-'}
                                              </div>
                                            </>
                                          ) : (
                                            <div style={{ color: 'var(--ds-text-3)', fontStyle: 'italic', fontSize: '11px', padding: '4px 0' }}>
                                              Not applicable (NGN only)
                                            </div>
                                          )}
                                        </td>

                                        {/* Action */}
                                        <td style={{ padding: '10px 12px', verticalAlign: 'middle', textAlign: 'center' }}>
                                          {onNavigateToPrice && comp.raw && (
                                            <button
                                              type="button"
                                              onClick={() => onNavigateToPrice(comp.raw)}
                                              style={{
                                                background: '#ffffff',
                                                border: '1px solid var(--ds-border-strong)',
                                                color: 'var(--ds-brand)',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap'
                                              }}
                                              title="Inspect POP in drawer"
                                            >
                                              Inspect →
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
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
        </div>
      )}

      {/* ─── TAB CONTENT 3: CATEGORIES / GROUPS TREE ─── */}
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
                  <span><Icon name="folder" size={14} /> Categories & Category Groups</span>
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: C.muted }}>
                  Tree hierarchy of category groups (Level 1) and associated product categories (Level 2).
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
                  {totalAssociationsCount} Associated {totalAssociationsCount === 1 ? 'Category' : 'Categories'}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
                    <input
                      type="text"
                      placeholder="Filter groups or categories..."
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px 6px 30px',
                        fontSize: '12px',
                        border: `1px solid ${C.cardBorder}`,
                        borderRadius: '6px',
                        outline: 'none',
                        background: '#ffffff',
                        color: C.text
                      }}
                    />
                    <span style={{ position: 'absolute', left: '9px', top: '7px', fontSize: '12px', color: C.muted }}><Icon name="search" size={13} /></span>
                    {categoryFilter && (
                      <button
                        type="button"
                        onClick={() => setCategoryFilter('')}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '6px',
                          border: 'none',
                          background: 'none',
                          color: C.muted,
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '0 4px'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={toggleAllGroups}
                    style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: areGroupsExpanded ? 'var(--ds-brand-dark)' : C.text,
                      background: areGroupsExpanded ? 'rgba(230,0,0,0.06)' : '#ffffff',
                      border: `1px solid ${areGroupsExpanded ? 'rgba(230,0,0,0.3)' : C.cardBorder}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                    title={areGroupsExpanded ? "Click to collapse all category groups" : "Click to expand all category groups"}
                  >
                    <span>{areGroupsExpanded ? '⊟' : '⊞'}</span>
                    <span>{areGroupsExpanded ? 'Collapse All' : 'Expand All'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tree View */}
          {treeGroups.length === 0 ? (
            <div style={{
              background: C.panel,
              border: `1px solid ${C.cardBorder}`,
              borderRadius: '10px',
              padding: '36px 20px',
              textAlign: 'center',
              color: C.muted
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}><Icon name="folder" size={32} /></div>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: C.text }}>No Category Groups Configured</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                This sales package offering does not contain any category group extensions or direct category assignments.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredTreeGroups.length === 0 ? (
                <div style={{
                  background: C.panel,
                  border: `1px solid ${C.cardBorder}`,
                  borderRadius: '10px',
                  padding: '24px',
                  textAlign: 'center',
                  color: C.muted,
                  fontSize: '13px'
                }}>
                  No groups or categories match the filter "{categoryFilter}".
                </div>
              ) : (
                filteredTreeGroups.map((group, groupIdx) => {
                  const isExpanded = expandedGroupIds[group.id] !== false; // default open
                  const catList = group.categories || [];
                  const skuVal = group.sku;

                  return (
                    <div
                      key={group.id || groupIdx}
                      style={{
                        background: '#ffffff',
                        border: `1px solid ${C.cardBorder}`,
                        borderRadius: '10px',
                        overflow: 'hidden',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                      }}
                    >
                      {/* ── Level 1: Category Group Node ── */}
                      <div
                        onClick={() => toggleGroup(group.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          background: isExpanded ? 'var(--ds-surface-subtle)' : '#ffffff',
                          borderBottom: isExpanded ? `1px solid ${C.cardBorder}` : 'none',
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '20px',
                            height: '20px',
                            fontSize: '11px',
                            color: 'var(--ds-brand-dark)',
                            fontWeight: 'bold',
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.15s ease'
                          }}>
                            ▶
                          </span>

                          <span style={{ fontSize: '16px' }}><Icon name="folder" size={16} /></span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13.5px', fontWeight: '700', color: C.text }}>
                              {group.name}
                            </span>

                            <span style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              color: 'var(--ds-text-2)',
                              background: 'var(--ds-border)',
                              padding: '2px 8px',
                              borderRadius: '12px'
                            }}>
                              {catList.length} {catList.length === 1 ? 'category' : 'categories'}
                            </span>

                            {skuVal && (
                              <span style={{
                                fontSize: '11px',
                                color: 'var(--ds-spec)',
                                background: 'rgba(124,58,237,0.08)',
                                border: '1px solid rgba(124,58,237,0.2)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontFamily: 'var(--ds-font-mono)'
                              }}>
                                SKU: {skuVal}
                              </span>
                            )}
                          </div>
                        </div>

                        <span style={{ fontSize: '11px', color: C.muted, marginLeft: '8px' }}>
                          {isExpanded ? 'Click to collapse' : 'Click to expand'}
                        </span>
                      </div>

                      {/* ── Level 2: Associated Categories List (Tree Branch) ── */}
                      {isExpanded && (
                        <div style={{
                          padding: '12px 16px 14px 20px',
                          background: '#ffffff',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          {catList.length === 0 ? (
                            <div style={{
                              fontSize: '12px',
                              color: C.muted,
                              fontStyle: 'italic',
                              padding: '8px 12px',
                              marginLeft: '20px'
                            }}>
                              No categories associated with this category group.
                            </div>
                          ) : (
                            catList.map((catRef, catIdx) => {
                              const isLast = catIdx === catList.length - 1;
                              const catId = catRef.id || catRef.name;
                              const remoteData = remoteCategories[catId] || {};
                              const catName = remoteData.name || catRef.name || catId;
                              const catVersion = catRef.version || remoteData.version || '1';
                              const status = remoteData.lifecycleStatus || catRef.lifecycleStatus;
                              const isCatLaunched = (status || '').toLowerCase() === 'launched';

                              return (
                                <div
                                  key={catId || catIdx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    position: 'relative',
                                    paddingLeft: '24px'
                                  }}
                                >
                                  {/* Tree Connector Guidelines */}
                                  <div style={{
                                    position: 'absolute',
                                    left: '6px',
                                    top: 0,
                                    bottom: isLast ? '50%' : 0,
                                    width: '1px',
                                    background: 'var(--ds-border-strong)'
                                  }} />
                                  <div style={{
                                    position: 'absolute',
                                    left: '6px',
                                    top: '50%',
                                    width: '12px',
                                    height: '1px',
                                    background: 'var(--ds-border-strong)'
                                  }} />

                                  {/* Category Item Card */}
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      gap: '12px',
                                      flex: 1,
                                      padding: '8px 12px',
                                      background: 'var(--ds-surface-subtle)',
                                      border: `1px solid ${C.cardBorder}`,
                                      borderRadius: '6px',
                                      transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.borderColor = 'var(--ds-border-strong)';
                                      e.currentTarget.style.background = 'var(--ds-surface-2)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.borderColor = C.cardBorder;
                                      e.currentTarget.style.background = 'var(--ds-surface-subtle)';
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                                      <span style={{ fontSize: '13px' }}><Icon name="tag" size={14} /></span>

                                      {/* Resolved Category Friendly Name */}
                                      <span style={{ fontSize: '13px', fontWeight: '600', color: C.text }}>
                                        {catName}
                                      </span>

                                      {/* Category ID Pill */}
                                      <code style={{
                                        fontSize: '11px',
                                        color: 'var(--ds-warn)',
                                        background: 'rgba(245,158,11,0.08)',
                                        border: '1px solid rgba(245,158,11,0.25)',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        fontFamily: 'var(--ds-font-mono)'
                                      }}>
                                        {catId}
                                      </code>

                                      {/* Category Version */}
                                      {catVersion && (
                                        <span style={{
                                          fontSize: '11px',
                                          fontWeight: '700',
                                          color: 'var(--ds-ok)',
                                          background: 'rgba(16,185,129,0.1)',
                                          border: '1px solid rgba(16,185,129,0.25)',
                                          padding: '1px 5px',
                                          borderRadius: '3px'
                                        }}>
                                          v{catVersion}
                                        </span>
                                      )}

                                      {/* Lifecycle Status if known */}
                                      {status && (
                                        <span style={{
                                          fontSize: '11px',
                                          fontWeight: '600',
                                          color: isCatLaunched ? 'var(--ds-ok)' : 'var(--ds-warn)',
                                          background: isCatLaunched ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                                          padding: '1px 6px',
                                          borderRadius: '3px'
                                        }}>
                                          {status}
                                        </span>
                                      )}
                                    </div>

                                    {/* Action Buttons: Copy ID & Navigate to Category */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                      {copyToClipboard && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(catId, `cat_${groupIdx}_${catIdx}`);
                                          }}
                                          style={{
                                            background: '#ffffff',
                                            border: `1px solid ${C.cardBorder}`,
                                            color: copiedKey === `cat_${groupIdx}_${catIdx}` ? C.success : C.muted,
                                            padding: '2px 7px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                          }}
                                          title="Copy Category ID"
                                        >
                                          {copiedKey === `cat_${groupIdx}_${catIdx}` ? '✓ Copied' : 'Copy ID'}
                                        </button>
                                      )}

                                      {onNavigateToCategory && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onNavigateToCategory(remoteData.id ? remoteData : { id: catId, name: catName, version: catVersion });
                                          }}
                                          style={{
                                            background: 'rgba(230,0,0,0.06)',
                                            border: '1px solid rgba(230,0,0,0.25)',
                                            color: 'var(--ds-brand-dark)',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                          }}
                                          title="Open Category Details in Drawer"
                                        >
                                          <span>View</span>
                                          <span>→</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB CONTENT 3: SPECIFICATION & OVERRIDES ─── */}
      {activeSubTab === 'network' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Associated Product Specification Card */}
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

          {/* Characteristics Overrides Grid */}
          <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span><Icon name="settings" size={14} /> Spec Characteristic Overrides</span>
                  <span style={{ fontSize: '11px', background: 'rgba(2,132,199,0.1)', color: 'var(--ds-info)', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                    {filteredChars.length} / {chars.length}
                  </span>
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: C.muted }}>
                  Characteristic values and parameters configured on this sales package.
                </p>
              </div>

              {/* Filter by Characteristic Name */}
              {chars.length > 0 && (
                <div style={{ position: 'relative', minWidth: '240px', maxWidth: '340px', width: '100%' }}>
                  <input
                    type="text"
                    placeholder="Filter by characteristic name..."
                    value={charSearch}
                    onChange={(e) => setCharSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 28px 7px 30px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: `1px solid ${C.cardBorder}`,
                      background: 'var(--ds-surface-subtle)',
                      color: C.text,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                    <Icon name="search" size={13} />
                  </span>
                  {charSearch && (
                    <button
                      onClick={() => setCharSearch('')}
                      title="Clear filter"
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: C.muted,
                        cursor: 'pointer',
                        fontSize: '13px',
                        padding: 0,
                        lineHeight: 1
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>

            {filteredChars.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: C.muted, fontSize: '12px', fontStyle: 'italic', background: 'var(--ds-surface-subtle)', borderRadius: '8px' }}>
                {charSearch ? `No characteristics matching "${charSearch}".` : 'No characteristic overrides present on this offering.'}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
                {filteredChars.map((char, i) => (
                  <div key={i} style={{ background: 'var(--ds-surface-subtle)', border: `1px solid ${C.cardBorder}`, borderRadius: '6px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: C.text }}>{char.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--ds-info)', marginTop: '2px', wordBreak: 'break-all' }}>
                      {Array.isArray(char.productSpecCharacteristicValue)
                        ? char.productSpecCharacteristicValue.map(v => v.value).join(', ')
                        : (char.value || 'N/A')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB CONTENT 4: CONTRACT TERMS ─── */}
      {activeSubTab === 'terms' && (
        <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span><Icon name="edit" size={14} /> Contract Terms</span>
            <span style={{ fontSize: '11px', color: C.muted, fontWeight: '400' }}>({effectiveTerms.length})</span>
          </h3>

          {effectiveTerms.length === 0 ? (
            <div style={{ fontSize: '12px', color: C.muted, fontStyle: 'italic', padding: '8px 0' }}>
              No contract terms associated directly with this offering.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {effectiveTerms.map((t, idx) => {
                const termChars = t.productOfferingTermCharacteristic || t.prodSpecCharValueUse || [];
                const termSkuChar = termChars.find(c => (c.name || '').toLowerCase() === 'sku');
                const termSku = termSkuChar?.productOfferingTermCharacteristicValue?.[0]?.value || termSkuChar?.value || t.sku || null;

                return (
                  <div key={idx} style={{ background: 'var(--ds-surface-subtle)', border: `1px solid ${C.cardBorder}`, padding: '12px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: C.text }}>{t.name || `Term #${idx + 1}`}</div>
                      {t.description && <div style={{ fontSize: '12px', color: C.muted, marginTop: '4px' }}>{t.description}</div>}
                      {t.duration && (
                        <div style={{ fontSize: '12px', color: 'var(--ds-ok)', fontWeight: '600', marginTop: '6px' }}>
                          Duration: {t.duration.amount} {t.duration.units}
                        </div>
                      )}
                    </div>
                    {termSku && (
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '10px', color: C.muted, textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '2px' }}>
                          Selling SKU
                        </span>
                        <code style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '12px', fontWeight: '700', color: 'var(--ds-warn)', background: '#ffffff', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--ds-border-strong)' }}>
                          {termSku}
                        </code>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Bandwidth SKU Detail Modal ─── */}
      {inspectedBandwidth && (
        <BandwidthSkuDetailModal
          isOpen={Boolean(inspectedBandwidth)}
          onClose={() => setInspectedBandwidth(null)}
          tier={inspectedBandwidth.tier}
          matchingOffer={inspectedBandwidth.matchingOffer}
          allEntities={allEntities}
          onNavigateToEntity={onNavigateToEntity}
        />
      )}
    </div>
  );
}
