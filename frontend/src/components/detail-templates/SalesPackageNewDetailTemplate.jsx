import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from '../ui/Icon';
import { isSalesPackageSpec } from '../../utils/entityClassifiers';
import { C } from '../../styles/theme';
import BandwidthSkuDetailModal from './BandwidthSkuDetailModal';
import BundledPopsTable from './BundledPopsTable';
import CcbServiceAssociationPanel from './CcbServiceAssociationPanel';
import CcbTariffSelectionPanel from './CcbTariffSelectionPanel';
import ReviewAndPublishEnvelopeModal from './ReviewAndPublishEnvelopeModal';
import { createSalesPackageDeploymentEnvelope } from '../../services/salesPackageBuilderService';
import { extractPortfolioId, extractTemplateName } from '../list-views/salesPackageColumnConfig';
import OfferingSpecificationAndOverridesTab from './OfferingSpecificationAndOverridesTab';
import {
  extractPsmStructure,
  syncPsmCharacteristics,
  detectSupportedNetworks,
  extractMasterPacketId,
  extractChar,
  extractCharValues,
  VODAFONE_DSL_FALLBACK_TIERS,
  getStandardFallbackTiers,
  FALLBACK_VFDE_CATEGORIES,
  BASELINE_SALES_PACKAGE_SPECS
} from '../../services/psmStructureService';

// Attach selected services (mandatoryIndicator === 'Y') under their matching tariff objects
function attachSelectedServicesToTariffs(tariffsList = [], associations = []) {
  const selectedOnly = (associations || []).filter((s) => s.mandatoryIndicator === 'Y');
  return (tariffsList || []).map((t) => {
    const tDomain = String(t.serviceDomain || '').toUpperCase();
    const tCode = String(t.pricingStructureCode || '').trim().toUpperCase();
    return {
      ...t,
      services: selectedOnly.filter(
        (s) =>
          String(s.serviceDomain || '').toUpperCase() === tDomain &&
          String(s.pricingStructureCode || '').trim().toUpperCase() === tCode
      )
    };
  });
}

// Helper to automatically append _v2 suffix to codes without duplicating
export function applyV2Suffix(code) {
  if (!code || typeof code !== 'string') return code;
  const trimmed = code.trim();
  if (!trimmed || trimmed === '-') return trimmed;
  return trimmed
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(token => {
      if (token === '-') return token;
      return /_v2$/i.test(token) ? token : `${token}_v2`;
    })
    .join(', ');
}

// Helper to detect technology from name or spec
function detectTechnology(name = '', specName = '', specId = '') {
  const combined = `${name} ${specName} ${specId}`.toLowerCase();
  if (combined.includes('dsl')) return 'DSL';
  if (combined.includes('cable') || combined.includes('docsis') || combined.includes('kabel')) return 'CABLE';
  if (combined.includes('fiber') || combined.includes('fibre') || combined.includes('ftth') || combined.includes('glasfaser')) return 'FIBRE';
  return 'FIBRE';
}

// Helper to extract real bandwidth code (e.g. V0178 from IP073V0178IB, V018C, IG006)
export function extractRealBandwidth(sku = '', serviceCode = '') {
  if (serviceCode && String(serviceCode).trim()) return String(serviceCode).trim();
  const s = String(sku || '').trim();
  if (!s) return '';
  if (/^(V\d{3}[A-Z0-9]?|IG\d{3})$/i.test(s)) return s.toUpperCase();
  const match = s.match(/(V\d{3}[A-Z0-9]?|IG\d{3})/i);
  if (match) return match[1].toUpperCase();
  return s;
}

// Helper to extract speeds from entity characteristics or text
function detectSpeeds(name = '', raw = null) {
  // 1. First priority: Check explicit characteristics on raw entity if available
  if (raw) {
    const chars = Array.isArray(raw.prodSpecCharValueUse)
      ? raw.prodSpecCharValueUse
      : (Array.isArray(raw.productSpecCharacteristic) ? raw.productSpecCharacteristic : []);

    let downChar = '';
    let upChar = '';
    chars.forEach(c => {
      const n = (c.name || '').toLowerCase();
      const val = c.productSpecCharacteristicValue?.[0]?.value || c.value;
      if (val !== undefined && val !== null && String(val).trim()) {
        if (n === 'downstream_bandwidth' || n === 'bandwidth_downstream_max') {
          downChar = String(val).trim();
        } else if (n === 'upstream_bandwidth' || n === 'bandwidth_upstream_max') {
          upChar = String(val).trim();
        } else if (n === 'bandwidth' && !downChar) {
          downChar = String(val).trim();
        }
      }
    });

    if (downChar) {
      let dVal = parseInt(downChar, 10);
      // If speed is represented in kbps (e.g. 300000 or 1000000), convert to Mbps
      if (dVal >= 10000) {
        dVal = Math.round(dVal / 1000);
      }
      if (!isNaN(dVal) && dVal > 0) {
        let uVal = parseInt(upChar, 10);
        if (uVal >= 10000) uVal = Math.round(uVal / 1000);
        const up = (!isNaN(uVal) && uVal > 0)
          ? uVal
          : (dVal >= 1000 ? 200 : dVal >= 500 ? 100 : dVal >= 250 ? 50 : dVal >= 100 ? 40 : 10);
        return { down: dVal, up };
      }
    }
  }

  // 2. Second priority: Match Gigabit units strictly with word boundary (prevents "G" from "Glasfaser" matching unit "g")
  const gigaMatch = name.match(/(\d+)\s*(?:gb|gbit|gbps)\b/i);
  if (gigaMatch) {
    const down = parseInt(gigaMatch[1], 10) * 1000;
    return { down, up: down >= 1000 ? 200 : 100 };
  }

  // 3. Third priority: Match Megabit units strictly with word boundary
  const megaMatch = name.match(/(\d+)\s*(?:mb|mbit|mbps)\b/i);
  if (megaMatch) {
    let down = parseInt(megaMatch[1], 10);
    if (down >= 10000) down = Math.round(down / 1000);
    const up = down >= 1000 ? 200 : down >= 500 ? 100 : down >= 250 ? 50 : down >= 100 ? 40 : 10;
    return { down, up };
  }

  // 4. Fourth priority: Match standalone speed numbers in offering titles (e.g. "GigaZuhause 300 Glasfaser")
  const numMatches = [...name.matchAll(/\b(\d+)\b/g)];
  for (const m of numMatches) {
    let num = parseInt(m[1], 10);
    if (num >= 10000) num = Math.round(num / 1000);
    if ([1000, 600, 500, 400, 300, 250, 175, 150, 100, 50, 25, 16, 6, 3, 2, 1].includes(num)) {
      const up = num >= 1000 ? 200 : num >= 500 ? 100 : num >= 250 ? 50 : num >= 100 ? 40 : 10;
      return { down: num, up };
    }
  }

  return { down: 250, up: 50 };
}



export default function SalesPackageNewDetailTemplate({
  item,
  allEntities = [],
  onClose,
  onSuccessRefresh,
  activeEnv,
  token,
  onNavigateToEntity,
  onUpdateItem
}) {
  const [activeTab, setActiveTab] = useState('step1');
  const [inspectedBandwidth, setInspectedBandwidth] = useState(null);
  const [remoteCatalogOfferings, setRemoteCatalogOfferings] = useState([]);
  const [remoteSpecifications, setRemoteSpecifications] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => {
    if (item?.selectedTemplateId) return item.selectedTemplateId;
    if (item?.draftData?.selectedTemplateId) return item.draftData.selectedTemplateId;
    const tplNameChar = item?.template_name || extractTemplateName(item);
    if (tplNameChar) {
      return tplNameChar.replace(/:\(version=[^)]+\)$/i, '');
    }
    return '';
  });
  const [autoSelectedMeta, setAutoSelectedMeta] = useState(null);
  const [charFilterQuery, setCharFilterQuery] = useState('');
  const [selectedPopId, setSelectedPopId] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // ─── Filterable Template Dropdown State ───
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const templateDropdownRef = useRef(null);

  // ─── Filterable Specification Dropdown State ───
  const [specSearchQuery, setSpecSearchQuery] = useState('');
  const [isSpecDropdownOpen, setIsSpecDropdownOpen] = useState(false);
  const specDropdownRef = useRef(null);

  // Guard refs to prevent re-initializing during active session typing
  const resumedDraftIdRef = useRef(null);
  const initializedItemTplRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(e.target)) {
        setIsTemplateDropdownOpen(false);
      }
      if (specDropdownRef.current && !specDropdownRef.current.contains(e.target)) {
        setIsSpecDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Categories & Category Groupings State ───
  const [categoriesCatalog, setCategoriesCatalog] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedSkuForCategory, setSelectedSkuForCategory] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [customSkuInput, setCustomSkuInput] = useState('');
  const [isAddingCustomSku, setIsAddingCustomSku] = useState(false);
  const [expandedGroupIds, setExpandedGroupIds] = useState({});
  const [newPsmPacketInput, setNewPsmPacketInput] = useState('');

  const envHeaders = useMemo(() => {
    const isTest = (activeEnv?.name && activeEnv.name.toLowerCase().includes('test')) || (activeEnv?.apiUrl && activeEnv.apiUrl.toLowerCase().includes('test'));
    const envName = activeEnv?.name || localStorage.getItem('dnext_env_name') || (isTest ? 'dpc_ui.test-g' : 'Default (dev-gcu)');
    const apiUrl = activeEnv?.apiUrl || localStorage.getItem('dnext_api_url') || (isTest ? 'https://dpc-api.test-gcu.com' : 'https://dpc-api.pi.dev-gcu.com');
    const authUrl = activeEnv?.authUrl || localStorage.getItem('dnext_auth_url') || (isTest ? 'https://diam.test-gcu.com/realms/orbitant-realm/protocol/openid-connect/token' : 'https://diam.pi.dev-gcu.com/realms/orbitant-realm/protocol/openid-connect/token');

    return {
      'Accept': 'application/json',
      'x-dnext-api-url': apiUrl,
      'x-dnext-auth-url': authUrl,
      'x-dnext-env-name': envName,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }, [activeEnv, token]);

  // Fetch catalog categories
  useEffect(() => {
    let isMounted = true;
    setLoadingCategories(true);

    const fromEntities = [];
    if (Array.isArray(allEntities)) {
      allEntities.forEach(e => {
        const entType = e.entityType || e.raw?.entityType;
        const id = e.id || e.raw?.id;
        const name = e.name || e.raw?.name;
        if ((entType === 'Category' || String(id).startsWith('FN')) && id && name) {
          fromEntities.push({
            id,
            name,
            version: e.version || e.raw?.version || '1',
            parentId: e.parentId || e.raw?.parentId || null
          });
        }
      });
    }

    fetch('/api/dnext/categories?limit=1000', { headers: envHeaders })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          const map = {};
          fromEntities.forEach(c => { map[c.id] = c; });
          data.forEach(c => {
            if (c.id) {
              map[c.id] = {
                id: c.id,
                name: c.name || c.id,
                version: c.version || '1',
                parentId: c.parentId || null
              };
            }
          });
          setCategoriesCatalog(Object.values(map));
          setLoadingCategories(false);
        } else {
          fetch('/api/dnext/local-categories')
            .then(r => r.ok ? r.json() : [])
            .then(localData => {
              if (!isMounted) return;
              if (Array.isArray(localData) && localData.length > 0) {
                setCategoriesCatalog(localData);
              } else if (fromEntities.length > 0) {
                setCategoriesCatalog(fromEntities);
              } else {
                setCategoriesCatalog(FALLBACK_VFDE_CATEGORIES);
              }
              setLoadingCategories(false);
            })
            .catch(() => {
              if (isMounted) {
                setCategoriesCatalog(fromEntities.length > 0 ? fromEntities : FALLBACK_VFDE_CATEGORIES);
                setLoadingCategories(false);
              }
            });
        }
      })
      .catch(() => {
        if (!isMounted) return;
        fetch('/api/dnext/local-categories')
          .then(r => r.ok ? r.json() : [])
          .then(localData => {
            if (!isMounted) return;
            setCategoriesCatalog(Array.isArray(localData) && localData.length > 0 ? localData : FALLBACK_VFDE_CATEGORIES);
            setLoadingCategories(false);
          })
          .catch(() => {
            if (isMounted) {
              setCategoriesCatalog(FALLBACK_VFDE_CATEGORIES);
              setLoadingCategories(false);
            }
          });
      });

    return () => { isMounted = false; };
  }, [allEntities, envHeaders]);

  // Fetch catalog offerings and specifications if allEntities does not contain them
  useEffect(() => {
    let isMounted = true;
    if (!allEntities || allEntities.length === 0) {
      setLoadingCatalog(true);
      Promise.all([
        fetch('/api/dnext/product-offerings?limit=1000', { headers: envHeaders }).then(r => r.json()).catch(() => []),
        fetch('/api/dnext/product-specifications?limit=1000', { headers: envHeaders }).then(r => r.json()).catch(() => [])
      ]).then(([offeringsData, specsData]) => {
        if (!isMounted) return;
        const oItems = Array.isArray(offeringsData) ? offeringsData : offeringsData?.data || offeringsData?.items || [];
        const sItems = Array.isArray(specsData) ? specsData : specsData?.data || specsData?.items || [];
        setRemoteCatalogOfferings(oItems);
        setRemoteSpecifications(sItems);
        setLoadingCatalog(false);
      }).catch(err => {
        console.warn('[SalesPackageNew] Failed to fetch catalog data:', err);
        if (isMounted) setLoadingCatalog(false);
      });
    } else {
      // If allEntities is passed, also attempt to load product-specifications if needed
      fetch('/api/dnext/product-specifications?limit=1000', { headers: envHeaders })
        .then(r => r.json())
        .then(specsData => {
          if (!isMounted) return;
          const sItems = Array.isArray(specsData) ? specsData : specsData?.data || specsData?.items || [];
          setRemoteSpecifications(sItems);
        })
        .catch(() => {});
    }
    return () => { isMounted = false; };
  }, [allEntities, envHeaders]);

  // Merge available entities
  const catalogPool = useMemo(() => {
    if (allEntities && allEntities.length > 0) return allEntities;
    return remoteCatalogOfferings;
  }, [allEntities, remoteCatalogOfferings]);

  // Combined product specifications map
  const allSpecifications = useMemo(() => {
    const map = new Map();
    // 1. From remote specifications
    (remoteSpecifications || []).forEach(s => {
      const raw = s.raw || s;
      const id = String(s.id || raw.id || '');
      if (id) map.set(id, raw);
    });
    // 2. From catalogPool / allEntities
    (catalogPool || []).forEach(e => {
      const raw = e.raw || e;
      const type = String(e.entityType || raw['@type'] || e['@type'] || '');
      const id = String(e.id || raw.id || '');
      if (type.includes('ProductSpecification') || id.startsWith('productSpecification_') || id.startsWith('spec_') || id.startsWith('VF_DE_SPEC_')) {
        map.set(id, raw);
      }
    });
    return map;
  }, [catalogPool, remoteSpecifications]);

  // Extract real Sales Packages from DNEXT Catalog
  const catalogSalesPackages = useMemo(() => {
    // 1. Strictly filter using isSalesPackageSpec
    const spEntities = catalogPool.filter(entity => {
      if (!entity) return false;
      const raw = entity.raw || entity;
      const type = String(entity.entityType || raw['@type'] || entity['@type'] || '');
      // Entity must be a ProductOffering (or start with po_/PO_) and match isSalesPackageSpec
      const isOffering = !type || type === 'ProductOffering' || type.includes('ProductOffering') || String(entity.id || '').toLowerCase().startsWith('po_');
      return isOffering && isSalesPackageSpec(entity);
    });

    // 2. Deduplicate by ID (keep latest version if multiple versions exist)
    const map = new Map();
    spEntities.forEach(entity => {
      const raw = entity?.raw || entity;
      const id = String(entity?.id || raw?.id || '');
      if (!id) return;

      const prev = map.get(id);
      const currVer = Number(entity?.version || raw?.version || 1);
      const prevVer = prev ? Number(prev.entity?.version || prev.raw?.version || 0) : -1;

      if (!prev || currVer >= prevVer) {
        const name = entity?.name || raw?.name || id;
        const spec = raw?.productSpecification || entity?.productSpecification || {};
        const technology = detectTechnology(name, spec?.name, spec?.id);
        const speeds = detectSpeeds(name, raw);

        const masterPacket = extractMasterPacketId(raw);

        map.set(id, {
          id,
          name,
          version: entity?.version || raw?.version || '1.0',
          entity,
          raw,
          specId: spec?.id || 'productSpecification_FN_SalesPackage',
          specName: spec?.name || 'FN_SalesPackage',
          specVersion: spec?.version || '1.0',
          technology,
          speeds,
          masterPacket,
          bundledCount: raw?.bundledProductOffering?.length || 0
        });
      }
    });

    // 3. Sort FIBRE first, then DSL, then CABLE; within technology by speed desc
    return Array.from(map.values()).sort((a, b) => {
      if (a.technology !== b.technology) {
        const order = { FIBRE: 1, DSL: 2, CABLE: 3 };
        return (order[a.technology] || 99) - (order[b.technology] || 99);
      }
      return (b.speeds?.down || 0) - (a.speeds?.down || 0);
    });
  }, [catalogPool]);

  // Filtered available templates based on search input
  const filteredCatalogTemplates = useMemo(() => {
    const q = (templateSearchQuery || '').trim().toLowerCase();
    if (!q) return catalogSalesPackages;
    return catalogSalesPackages.filter(tpl => {
      const name = (tpl.name || '').toLowerCase();
      const id = (tpl.id || '').toLowerCase();
      const tech = (tpl.technology || '').toLowerCase();
      const speed = tpl.speeds?.down ? `${tpl.speeds.down}` : '';
      return name.includes(q) || id.includes(q) || tech.includes(q) || speed.includes(q);
    });
  }, [catalogSalesPackages, templateSearchQuery]);

  const selectedTemplateObj = useMemo(() => {
    return catalogSalesPackages.find(p => p.id === selectedTemplateId) || null;
  }, [catalogSalesPackages, selectedTemplateId]);

  // Extract distinct Sales Package Product Specifications
  const availableSalesPackageSpecs = useMemo(() => {
    const specMap = new Map();

    // 1. From catalogPool (ProductSpecification entities)
    catalogPool.forEach(entity => {
      const raw = entity?.raw || entity;
      const type = String(entity?.entityType || raw?.['@type'] || entity?.['@type'] || '');
      const id = String(entity?.id || raw?.id || '');
      const name = String(entity?.name || raw?.name || id);

      const isSpec = type.includes('ProductSpecification') || id.startsWith('productSpecification_') || id.startsWith('spec_');
      const isSalesPkgSpec = (
        id.toLowerCase().includes('salespackage') ||
        id.toLowerCase().includes('sales_package') ||
        name.toLowerCase().includes('salespackage') ||
        name.toLowerCase().includes('sales_package')
      );

      if (isSpec && isSalesPkgSpec) {
        specMap.set(id, {
          id,
          name,
          version: entity?.version || raw?.version || '1.0'
        });
      }
    });

    // 2. From catalogSalesPackages (ensures all specs used by existing packages exist)
    catalogSalesPackages.forEach(pkg => {
      if (pkg.specId && !specMap.has(pkg.specId)) {
        specMap.set(pkg.specId, {
          id: pkg.specId,
          name: pkg.specName || pkg.specId,
          version: pkg.specVersion || '1.0'
        });
      }
    });

    // Fallbacks
    if (!specMap.has('productSpecification_FN_SalesPackage_FTTH')) {
      specMap.set('productSpecification_FN_SalesPackage_FTTH', {
        id: 'productSpecification_FN_SalesPackage_FTTH',
        name: 'productSpecification_FN_SalesPackage_FTTH',
        version: '1.0'
      });
    }
    if (!specMap.has('productSpecification_FN_SalesPackage_DSL')) {
      specMap.set('productSpecification_FN_SalesPackage_DSL', {
        id: 'productSpecification_FN_SalesPackage_DSL',
        name: 'productSpecification_FN_SalesPackage_DSL',
        version: '1.0'
      });
    }

    return Array.from(specMap.values());
  }, [catalogPool, catalogSalesPackages]);

  // Filtered available sales package specifications based on search input
  const filteredSalesPackageSpecs = useMemo(() => {
    const q = (specSearchQuery || '').trim().toLowerCase();
    if (!q) return availableSalesPackageSpecs;
    return availableSalesPackageSpecs.filter(spec => {
      const name = (spec.name || '').toLowerCase();
      const id = (spec.id || '').toLowerCase();
      return name.includes(q) || id.includes(q);
    });
  }, [availableSalesPackageSpecs, specSearchQuery]);

  // Extract Bandwidth Options from offers where specification matches *options*bandwith*
  const bandwidthOptionOffers = useMemo(() => {
    const map = new Map();

    (catalogPool || []).forEach(entity => {
      const raw = entity?.raw || entity;
      const id = String(entity?.id || raw?.id || '');
      const spec = raw?.productSpecification || entity?.productSpecification || {};
      const specId = String(spec?.id || '');
      const specName = String(spec?.name || '');

      const isBandwidthSpec = (
        (/options?.*bandw/i.test(specId)) ||
        (/options?.*bandw/i.test(specName))
      );

      if (isBandwidthSpec && id) {
        const name = entity?.name || raw?.name || id;
        const speeds = detectSpeeds(name, raw);
        const chars = Array.isArray(raw?.prodSpecCharValueUse)
          ? raw.prodSpecCharValueUse
          : (Array.isArray(raw?.productSpecCharacteristic) ? raw.productSpecCharacteristic : []);

        let sku = '';
        let serviceCode = '';
        let bandbreite = '';
        let hasTariffChar = false;

        chars.forEach(c => {
          const cname = (c.name || '').toLowerCase();
          const v = c.productSpecCharacteristicValue?.[0]?.value || c.value;
          if (cname === 'sku') {
            if (v) sku = String(v);
          } else if (cname === 'service_code') {
            if (v) serviceCode = String(v);
          } else if (cname === 'bandbreite') {
            if (v) bandbreite = String(v);
          } else if (cname === 'tariff_code' || cname === 'internettariffcode' || cname === 'voicetariffcode' || cname === 'tariff') {
            if (v && String(v).trim()) hasTariffChar = true;
          }
        });

        const realBandwidth = extractRealBandwidth(sku, serviceCode);

        // Filter out bandwidths associated with tariffs to show only real bandwidths
        const isTariffPrefixedSku = sku && sku !== realBandwidth && /^(IP|VP)\d{3}/i.test(sku);
        const hasTariffNameOrSpec = /tariff|tarif/i.test(name) || /tariff|tarif/i.test(specName) || /tariff|tarif/i.test(specId);

        if (hasTariffChar || isTariffPrefixedSku || hasTariffNameOrSpec) {
          return;
        }

        map.set(id, {
          id,
          name,
          specId,
          specName,
          sku: realBandwidth || sku,
          serviceCode: serviceCode || realBandwidth,
          realBandwidth: realBandwidth || sku,
          bandbreite,
          speeds,
          raw: raw || entity
        });
      }
    });

    // Provide default fallbacks if catalog is still loading
    if (map.size === 0) {
      const fallbacks = [
        { id: 'po_IG006_FN_Options_Bandwidth', name: 'Glasfaser Bandbreite 1000 Mbit/s', sku: 'IG006', serviceCode: 'IG006', realBandwidth: 'IG006', speeds: { down: 1000, up: 200 } },
        { id: 'po_IG019_FN_Options_Bandwidth', name: 'Glasfaser Bandbreite 600 Mbit/s', sku: 'IG019', serviceCode: 'IG019', realBandwidth: 'IG019', speeds: { down: 600, up: 100 } },
        { id: 'po_IG018_FN_Options_Bandwidth', name: 'Glasfaser Bandbreite 300 Mbit/s', sku: 'IG018', serviceCode: 'IG018', realBandwidth: 'IG018', speeds: { down: 300, up: 50 } },
        { id: 'po_V018V-generic_FN_Options_Bandwidth', name: 'Bandbreite 250 Mbit/s', sku: 'V018V', serviceCode: 'V018V', realBandwidth: 'V018V', speeds: { down: 250, up: 40 } },
        { id: 'po_V018U-generic_FN_Options_Bandwidth', name: 'Bandbreite 175 Mbit/s', sku: 'V018U', serviceCode: 'V018U', realBandwidth: 'V018U', speeds: { down: 175, up: 40 } },
        { id: 'po_IG017_FN_Options_Bandwidth', name: 'Glasfaser Bandbreite 150 Mbit/s', sku: 'IG017', serviceCode: 'IG017', realBandwidth: 'IG017', speeds: { down: 150, up: 30 } },
        { id: 'po_V018N-generic_FN_Options_Bandwidth', name: 'Bandbreite 100 Mbit/s', sku: 'V018N', serviceCode: 'V018N', realBandwidth: 'V018N', speeds: { down: 100, up: 40 } },
        { id: 'po_V018H-generic_FN_Options_Bandwidth', name: 'Bandbreite 50 Mbit/s', sku: 'V018H', serviceCode: 'V018H', realBandwidth: 'V018H', speeds: { down: 50, up: 10 } },
        { id: 'po_V018G-generic_FN_Options_Bandwidth', name: 'Bandbreite 25 Mbit/s', sku: 'V018G', serviceCode: 'V018G', realBandwidth: 'V018G', speeds: { down: 25, up: 5 } },
        { id: 'po_V018C-generic_FN_Options_Bandwidth', name: 'Bandbreite 16 Mbit/s', sku: 'V018C', serviceCode: 'V018C', realBandwidth: 'V018C', speeds: { down: 16, up: 2.4 } },
        { id: 'po_V0178-generic_FN_Options_Bandwidth', name: 'Bandbreite 6 Mbit/s', sku: 'V0178', serviceCode: 'V0178', realBandwidth: 'V0178', speeds: { down: 6, up: 1 } },
        { id: 'po_V0175-generic_FN_Options_Bandwidth', name: 'Bandbreite 3 Mbit/s', sku: 'V0175', serviceCode: 'V0175', realBandwidth: 'V0175', speeds: { down: 3, up: 0.5 } },
        { id: 'po_V0174-generic_FN_Options_Bandwidth', name: 'Bandbreite 2 Mbit/s', sku: 'V0174', serviceCode: 'V0174', realBandwidth: 'V0174', speeds: { down: 2, up: 0.5 } },
        { id: 'po_V0118-generic_FN_Options_Bandwidth', name: 'Bandbreite 1 Mbit/s', sku: 'V0118', serviceCode: 'V0118', realBandwidth: 'V0118', speeds: { down: 1, up: 0.25 } }
      ];
      fallbacks.forEach(f => map.set(f.id, f));
    }

    // Sort descending by downstream speed
    return Array.from(map.values()).sort((a, b) => (b.speeds?.down || 0) - (a.speeds?.down || 0));
  }, [catalogPool]);

  // Form State
  const [formData, setFormData] = useState(() => {
    let initialName = '';
    let initialCode = '';
    if (item && (item.name || item.raw?.name)) {
      const rawName = (item.name || item.raw?.name || '').replace(/^Copy of\s+/i, '').trim();
      initialName = /[\s_]+v2$/i.test(rawName) ? rawName : `${rawName} v2`;
    }
    if (item && (item.id || item.raw?.id)) {
      const rawId = item.id || item.raw?.id || '';
      initialCode = /[\s_]+v2$/i.test(rawId) ? rawId : `${rawId}_v2`;
    }

    const initialChars = [];
    if (initialName) {
      initialChars.push({
        id: 'DisplayNameCart',
        name: 'DisplayNameCart',
        valueType: 'string',
        isArray: false,
        value: initialName,
        values: [initialName],
        description: 'Display name rendered in shopping cart summary'
      });
      initialChars.push({
        id: 'DisplayNameConfigurator',
        name: 'DisplayNameConfigurator',
        valueType: 'string',
        isArray: false,
        value: initialName,
        values: [initialName],
        description: 'Display name rendered in web shop configurator step'
      });
    }

    const initialDirectChars = [];
    const rawDirect = item?.productOfferingCharacteristic || item?.raw?.productOfferingCharacteristic;
    if (Array.isArray(rawDirect)) {
      rawDirect.forEach((c, idx) => {
        const vals = Array.isArray(c.productOfferingCharacteristicValue)
          ? c.productOfferingCharacteristicValue.map(v => v?.value !== undefined ? String(v.value) : String(v))
          : (c.value !== undefined ? [String(c.value)] : ['']);
        initialDirectChars.push({
          id: c.id || `direct_char_${idx}`,
          name: c.name || `direct_char_${idx}`,
          valueType: c.valueType || 'string',
          isArray: vals.length > 1,
          values: vals.length > 0 ? vals : [''],
          value: vals.join(', '),
          raw: c
        });
      });
    }
    const portId = (item ? extractPortfolioId(item) : '') || '';
    if (portId && !initialDirectChars.some(c => (c.name || '').toLowerCase() === 'portfolio_id')) {
      initialDirectChars.unshift({
        id: 'portfolio_id',
        name: 'portfolio_id',
        valueType: 'string',
        isArray: false,
        values: [portId],
        value: portId,
        productOfferingCharacteristicValue: [{ value: portId, isDefault: true }]
      });
    }

    const initialTplName = (item ? (item.template_name || extractTemplateName(item)) : '') || '';
    if (initialTplName && !initialDirectChars.some(c => (c.name || '').toLowerCase() === 'template_name')) {
      initialDirectChars.unshift({
        id: 'template_name',
        name: 'template_name',
        valueType: 'string',
        isArray: false,
        values: [initialTplName],
        value: initialTplName
      });
    }

    if (item && (item.isDraft || item.draftData)) {
      const d = item.draftData || item;
      const resumedTplName = d.template_name || initialTplName || '';
      return {
        ...d,
        task_type: d.task_type || item.task_type || 'new_sales_package',
        id: d.id || d.code || initialCode,
        name: d.name || initialName,
        code: d.code || initialCode,
        portfolio_id: d.portfolio_id || portId || '',
        template_name: resumedTplName,
        characteristics: Array.isArray(d.characteristics) ? d.characteristics : initialChars,
        productOfferingCharacteristic: Array.isArray(d.productOfferingCharacteristic) ? d.productOfferingCharacteristic : initialDirectChars,
        bundledPops: Array.isArray(d.bundledPops) ? d.bundledPops : [],
        terms: Array.isArray(d.terms) ? d.terms : [],
        categoryGroupings: Array.isArray(d.categoryGroupings) ? d.categoryGroupings : [],
        category: Array.isArray(d.category) ? d.category : []
      };
    }

    return {
      task_type: 'new_sales_package',
      name: initialName,
      code: initialCode,
      id: initialCode,
      portfolio_id: portId,
      template_name: initialTplName,
      productOfferingCharacteristic: initialDirectChars,
      brand: 'Vodafone',
      lifecycleStatus: 'In study',
      targetSegment: 'B2C',
      commercialDescription: '',

    // Supported Networks & Product Codes (Product can support Vodafone NGN, Bitstream, or both)
    isNgnSupported: true,
    isBitstreamSupported: true,
    productCodeNgn: 'I1204',
    productCodeBitstream: 'I1203',
    isVoiceNgnSupported: true,
    isVoiceBitstreamSupported: true,
    voiceProductCodeNgn: 'VI204',
    voiceProductCodeBitstream: 'VI203',

    // Spec & Technology (Configured in Technology tab)
    specificationId: '',
    specificationName: '',
    specificationVersion: '',
    networkType: 'Vodafone NGN & Bitstream',
    technology: 'FIBRE', // 'FIBRE' | 'DSL' | 'CABLE'
    technologyType: 'FTTH',
    technologyProductId: '',
    accessType: 'FTTH',
    selectedBandwidthOfferId: '',
    bandwidthOption: '',
    downstreamSpeed: null,
    upstreamSpeed: null,
    fallbackBandwidths: [],
    routerIncluded: true,
    routerModel: 'Vodafone Ultra Hub 7',

    // Sub-Bundles
    internetBundleId: 'PO_FN_INTERNET_FTTH_250',
    internetBundleName: 'Internet Flat 250',
    voiceBundleId: 'PO_FN_VOICE_STANDARD',
    voiceBundleName: 'Festnetz-Flat Standard',
    tvBundleId: '',
    tvBundleName: 'None (Optional add-on)',
    hardwareBundleId: 'PO_HW_ROUTER_ULTRA7',
    hardwareBundleName: 'Vodafone Ultra Hub 7 Rental',

    // Pricing & Promotions
    standardPrice: 44.99,
    promoPrice: 19.99,
    promoMonths: 9,
    activationFee: 69.99,
    isActivationFeeWaived: true,
    shippingFee: 9.99,
    minContractTermMonths: 24,
    currency: 'EUR',

    // Bundled POP Assembly Matrix (TMF620 Decomposition)
    bundledPops: [],
    selectedPopId: '',
    connectionVariant: 'basic', // 'basic' | 'comfort'
    playType: '2', // '2' (Internet + Voice) | '1' (Internet only)
    popBandwidthAmount: 10.00,
    popInternetAmount: 14.00,
    popVoiceAccessAmount: 15.99,
    popVoiceTariffAmount: 5.00,

    // CCB / Billing & PSM AAW Paket IDs (multi-cardinality psm_aaw_packet_id)
    ccbMasterPacketId: '',
    psmAawPacketIds: [],
    ccbInternetTariff: '',
    ccbVoiceTariff: '',
    ccbBandwidthSku: '',

    // Contract Terms (per PSM AAW Paket ID: ordered strictly 36, 24, 18, 12 with 24 Months as Primary)
    terms: [],

    // Category Groupings (associated to SKUs) & Direct Categories
    categoryGroupings: [],
    category: [],

    // Characteristics copied from template
    characteristics: initialChars
  };
});

  // ─── Selected Specification Display & Resolution ───
  const selectedSpecObj = useMemo(() => {
    return availableSalesPackageSpecs.find(s => s.id === formData.specificationId) || null;
  }, [availableSalesPackageSpecs, formData.specificationId]);

  const selectedSpecDisplayName = useMemo(() => {
    if (selectedSpecObj) {
      return `${selectedSpecObj.name || selectedSpecObj.id}${selectedSpecObj.version ? ` (v${selectedSpecObj.version})` : ''}`;
    }
    return formData.specificationName || formData.specificationId || '';
  }, [selectedSpecObj, formData.specificationName, formData.specificationId]);

  // ─── Selected Template Display & Resolution ───
  const selectedTemplateDisplayName = useMemo(() => {
    if (selectedTemplateObj) {
      const ver = selectedTemplateObj.version ? ` · v${selectedTemplateObj.version}` : '';
      return `${selectedTemplateObj.name} (${selectedTemplateObj.technology} · ${selectedTemplateObj.id}${ver})`;
    }
    if (formData.selectedTemplateName) {
      return formData.selectedTemplateName;
    }
    if (formData.template_name) {
      const match = formData.template_name.match(/^(.+?):\(version=(.+?)\)$/);
      if (match) {
        return `${match[1]} (v${match[2]})`;
      }
      return formData.template_name;
    }
    if (selectedTemplateId) {
      return selectedTemplateId;
    }
    return '';
  }, [selectedTemplateObj, formData.template_name, formData.selectedTemplateName, selectedTemplateId]);

  // Canonical characteristic definition lookup aligned strictly with ProductSpecification / prodSpecCharValueUse
  const getCharDefinition = (charName, specId, offeringChar = null) => {
    if (!charName) return null;
    const cleanName = String(charName).trim();
    const lowerName = cleanName.toLowerCase();

    // 1. Offering characteristic definition (prodSpecCharValueUse)
    const offRaw = offeringChar?.raw || offeringChar || {};
    let offMaxCard = offRaw.maxCardinality !== undefined ? offRaw.maxCardinality : offeringChar?.maxCardinality;
    let offMinCard = offRaw.minCardinality !== undefined ? offRaw.minCardinality : offeringChar?.minCardinality;
    let offValType = offRaw.valueType || offeringChar?.valueType;

    // 2. Underlying ProductSpecification definition (productSpecCharacteristic)
    const targetSpecId = specId || formData?.specificationId;
    let spec = targetSpecId ? allSpecifications.get(targetSpecId) : null;
    if (!spec && targetSpecId) {
      for (const [sId, sObj] of allSpecifications.entries()) {
        if (sId.toLowerCase() === targetSpecId.toLowerCase() || (sObj.name && sObj.name.toLowerCase() === targetSpecId.toLowerCase())) {
          spec = sObj;
          break;
        }
      }
    }

    let specChar = null;
    if (spec) {
      const specChars = Array.isArray(spec.productSpecCharacteristic)
        ? spec.productSpecCharacteristic
        : (Array.isArray(spec.raw?.productSpecCharacteristic) ? spec.raw.productSpecCharacteristic : []);
      specChar = specChars.find(sc => (sc.name || '').trim().toLowerCase() === lowerName);
    }

    // 3. Fallback search across any SalesPackage specifications in catalog
    if (!specChar) {
      for (const [sId, sObj] of allSpecifications.entries()) {
        if (sId.toLowerCase().includes('salespackage') || sId.toLowerCase().includes('sales_package')) {
          const specChars = sObj.productSpecCharacteristic || sObj.raw?.productSpecCharacteristic || [];
          const match = specChars.find(sc => (sc.name || '').trim().toLowerCase() === lowerName);
          if (match) {
            specChar = match;
            break;
          }
        }
      }
    }

    // 4. Fallback to baseline specification dictionary
    const baseline = BASELINE_SALES_PACKAGE_SPECS[lowerName];

    // Priority merge: offering override -> spec definition -> baseline dictionary
    let maxCard = (offMaxCard !== undefined && offMaxCard !== null)
      ? offMaxCard
      : (specChar?.maxCardinality !== undefined && specChar?.maxCardinality !== null)
        ? specChar.maxCardinality
        : baseline?.maxCardinality;

    let minCard = (offMinCard !== undefined && offMinCard !== null)
      ? offMinCard
      : (specChar?.minCardinality !== undefined && specChar?.minCardinality !== null)
        ? specChar.minCardinality
        : baseline?.minCardinality;

    let valueType = offValType || specChar?.valueType || baseline?.valueType || 'string';

    let hasDef = false;
    let isArray = false;

    if (maxCard !== undefined && maxCard !== null) {
      hasDef = true;
      if (String(maxCard) === '*' || String(maxCard).toLowerCase() === 'unbounded') {
        isArray = true;
      } else {
        const num = Number(maxCard);
        if (!isNaN(num)) {
          isArray = num > 1;
        }
      }
    } else if (String(valueType).toLowerCase() === 'array' || String(valueType).toLowerCase() === 'list') {
      hasDef = true;
      isArray = true;
    }

    return {
      specChar,
      hasDef,
      minCardinality: minCard !== undefined && minCard !== null ? Number(minCard) : 0,
      maxCardinality: maxCard !== undefined && maxCard !== null ? (String(maxCard) === '*' ? '*' : Number(maxCard)) : undefined,
      valueType,
      isArray
    };
  };

  // Helper to determine whether a characteristic is an array strictly aligning with its definition
  const resolveIsArray = (charName, specId, offeringChar, configuredValues = []) => {
    const def = getCharDefinition(charName, specId, offeringChar);
    if (def && def.hasDef) {
      // Definition explicitly dictates array vs scalar
      return def.isArray;
    }
    // Fallback if no definition specifies cardinality:
    const vals = configuredValues.length > 0
      ? configuredValues
      : (Array.isArray(offeringChar?.productSpecCharacteristicValue)
          ? offeringChar.productSpecCharacteristicValue
          : (offeringChar?.values || []));
    return vals.length > 1;
  };

  // Handle template selection from DNEXT Catalog
  const handleSelectCatalogTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setAutoSelectedMeta(null);
      setFormData(prev => ({
        ...prev,
        template_name: '',
        selectedTemplateId: '',
        selectedTemplateName: '',
        productOfferingCharacteristic: (prev.productOfferingCharacteristic || []).filter(c => (c.name || '').toLowerCase() !== 'template_name')
      }));
      return;
    }

    let tpl = catalogSalesPackages.find(p => p.id === templateId);
    if (!tpl) {
      const match = (allEntities || []).find(p => p.id === templateId || p.raw?.id === templateId) || 
        (item && (item.id === templateId || item.raw?.id === templateId) ? item : null);
      if (match) {
        const raw = match.raw || match;
        const name = match.name || raw?.name || templateId;
        const spec = raw?.productSpecification || match.productSpecification || {};
        const technology = detectTechnology(name, spec?.name, spec?.id);
        const speeds = detectSpeeds(name, raw);
        const masterPacket = extractMasterPacketId(raw);
        tpl = {
          id: templateId,
          name,
          version: match.version || raw?.version || '1.0',
          entity: match,
          raw,
          specId: spec?.id || 'productSpecification_FN_SalesPackage',
          specName: spec?.name || 'FN_SalesPackage',
          specVersion: spec?.version || '1.0',
          technology,
          speeds,
          masterPacket,
          bundledCount: raw?.bundledProductOffering?.length || 0
        };
      }
    }
    if (!tpl) return;

    // Copy all characteristics from template
    const rawChars = Array.isArray(tpl.raw?.prodSpecCharValueUse)
      ? tpl.raw.prodSpecCharValueUse
      : (Array.isArray(tpl.raw?.productSpecCharacteristic) ? tpl.raw.productSpecCharacteristic : []);

    const copiedChars = rawChars.map((c, idx) => {
      let vals = [];
      if (Array.isArray(c.productSpecCharacteristicValue)) {
        vals = c.productSpecCharacteristicValue.map(v => v.value !== undefined ? String(v.value) : String(v));
      } else if (c.value !== undefined) {
        vals = [String(c.value)];
      }

      // Strictly determine whether it is an array based on the characteristic definition
      const def = getCharDefinition(c.name, tpl.specId, c);
      const isArray = resolveIsArray(c.name, tpl.specId, c, vals);
      const minCard = def?.minCardinality !== undefined ? def.minCardinality : c.minCardinality;
      const maxCard = def?.maxCardinality !== undefined ? def.maxCardinality : c.maxCardinality;
      const valType = def?.valueType || c.valueType || 'string';

      return {
        id: c.name || `char_${idx}`,
        name: c.name || `char_${idx}`,
        isArray,
        minCardinality: minCard,
        maxCardinality: maxCard,
        valueType: valType,
        values: vals.length > 0 ? vals : [''],
        value: vals.join(', '),
        raw: c
      };
    });

    // ─── Extract Normalized PSM Structure from Template & Catalog Pool ───
    const psmStruct = extractPsmStructure(tpl.raw || tpl, catalogPool);
    const supportedNetworks = psmStruct?.supportedNetworks || detectSupportedNetworks(tpl);
    const tplPacket = psmStruct?.masterPacketId || tpl.masterPacket || 'R025.5000000530';
    const downSpeed = psmStruct?.speeds?.down || tpl.speeds?.down || 100;
    const upSpeed = psmStruct?.speeds?.up || tpl.speeds?.up || (downSpeed >= 1000 ? 200 : downSpeed >= 500 ? 100 : downSpeed >= 250 ? 50 : downSpeed >= 100 ? 40 : 10);

    // Extract all PSM AAW Paket IDs (supports multi-cardinality in psm_aaw_packet_id)
    const rawAawVals = extractCharValues(tpl.raw || tpl, 'psm_aaw_packet_id');
    const cleanedAawVals = rawAawVals
      .map(v => String(v || '').split('-')[0].trim())
      .filter(v => v.length > 0);
    const resolvedPacketIds = cleanedAawVals.length > 0
      ? Array.from(new Set(cleanedAawVals))
      : [tplPacket];
    const primaryPacket = resolvedPacketIds[0] || tplPacket;

    // Extract actual contract terms and SKUs from template offering
    let copiedTerms = [];
    if (psmStruct?.terms && psmStruct.terms.length > 0) {
      copiedTerms = psmStruct.terms.filter(t => Number(t.duration?.amount) !== 36).map((t, idx) => {
        const durAmount = Number(t.duration?.amount) || 24;
        const durUnits = t.duration?.units || 'Month';
        const pktId = t.packetId || (t.sku && t.sku.includes('-') ? t.sku.split('-')[0] : primaryPacket);
        return {
          id: t.id || `term_${pktId}_${durAmount}_${idx}`,
          packetId: pktId,
          name: t.name || 'minimum_contract_duration',
          description: t.description || `${durAmount} ${durUnits}s Commitment`,
          duration: { amount: durAmount, units: durUnits },
          sku: t.sku || `${pktId}-${durAmount}`,
          isDefault: t.isDefault !== undefined ? t.isDefault : (durAmount === 24 && idx === 0)
        };
      });
    } else {
      // Fallback only when template has no terms or SKUs defined
      resolvedPacketIds.forEach((pktId, pktIdx) => {
        copiedTerms.push({
          id: `term_${pktId}_24`,
          packetId: pktId,
          name: 'minimum_contract_duration',
          description: '24 Months Commitment',
          duration: { amount: 24, units: 'Month' },
          sku: `${pktId}-24`,
          isDefault: pktIdx === 0
        });
      });
    }

    // Ensure at least one term is marked default (prefer 24 months on primary packet)
    if (!copiedTerms.some(t => t.isDefault)) {
      const default24 = copiedTerms.find(t => t.duration?.amount === 24 && t.packetId === primaryPacket) 
        || copiedTerms.find(t => t.duration?.amount === 24) 
        || copiedTerms[0];
      if (default24) default24.isDefault = true;
    }

    // Update resolvedPacketIds to include any packetIds present in copiedTerms
    const termPacketIds = Array.from(new Set(copiedTerms.map(t => t.packetId).filter(Boolean)));
    if (termPacketIds.length > 0) {
      termPacketIds.forEach(p => {
        if (!resolvedPacketIds.includes(p)) {
          resolvedPacketIds.push(p);
        }
      });
    }

    const defaultTerm = copiedTerms.find(t => t.isDefault) || copiedTerms[0];

    // ─── 1. AUTO-FILL BANDWIDTH FROM TEMPLATE ───
    const matchingBwOffers = (bandwidthOptionOffers || []).filter(o => o.speeds?.down === downSpeed);
    let matchedBwOffer = null;
    if (matchingBwOffers.length === 1) {
      matchedBwOffer = matchingBwOffers[0];
    } else if (matchingBwOffers.length > 1) {
      if (tpl.technology === 'FIBRE') {
        matchedBwOffer = matchingBwOffers.find(o => /glasfaser|ftth|fiber/i.test(o.name || o.id)) || matchingBwOffers[0];
      } else if (tpl.technology === 'DSL') {
        matchedBwOffer = matchingBwOffers.find(o => /dsl/i.test(o.name || o.id)) || matchingBwOffers[0];
      } else if (tpl.technology === 'CABLE') {
        matchedBwOffer = matchingBwOffers.find(o => /kabel|cable|docsis/i.test(o.name || o.id)) || matchingBwOffers[0];
      } else {
        matchedBwOffer = matchingBwOffers[0];
      }
    }

    const autoSelectedBandwidthOfferId = matchedBwOffer?.id || '';
    const autoBandwidthOption = matchedBwOffer?.name || (tpl.technology === 'FIBRE' ? `Glasfaser Bandbreite ${downSpeed} Mbit/s` : `DSL Bandbreite ${downSpeed} Mbit/s`);
    const autoBandwidthSku = matchedBwOffer?.realBandwidth || matchedBwOffer?.serviceCode || matchedBwOffer?.sku || `BW_${downSpeed}_${upSpeed}_${tpl.technology}`;

    // ─── 2. AUTO-FILL BUNDLE PRICE DEFINITIONS (bundledPops) FROM PSM STRUCTURE ───
    let resolvedPops = psmStruct?.resolvedPops || [];

    if (resolvedPops.length === 0) {
      // If template did not carry explicit POPs, generate standard Basic and Comfort bundles
      const term = defaultTerm?.duration?.amount || 24;
      const pt = '2';
      const isDsl = tpl.technology === 'DSL';
      const basePrice = downSpeed >= 1000 ? 69.99 : downSpeed >= 500 ? 59.99 : downSpeed >= 250 ? 49.99 : downSpeed >= 100 ? 44.99 : downSpeed >= 50 ? 39.99 : 34.99;
      const comfortPrice = Number((basePrice + 3.99).toFixed(2));
      const defaultTariffInt = applyV2Suffix(tpl.technology === 'FIBRE'
        ? (downSpeed >= 1000 ? 'IP532' : downSpeed >= 600 ? 'IP531' : 'IP530')
        : (downSpeed >= 250 ? 'IP077' : downSpeed >= 100 ? 'IP076' : downSpeed >= 50 ? 'IP074' : 'IP073'));
      const defaultTariffVoice = applyV2Suffix(tpl.technology === 'FIBRE'
        ? (downSpeed >= 1000 ? 'VP532' : downSpeed >= 600 ? 'VP531' : 'VP530')
        : (downSpeed >= 250 ? 'VP077' : downSpeed >= 100 ? 'VP076' : downSpeed >= 50 ? 'VP074' : 'VP073'));
      const defaultSvcBw = tpl.technology === 'FIBRE'
        ? (downSpeed >= 1000 ? 'IG006' : downSpeed >= 600 ? 'IG019' : downSpeed >= 300 ? 'IG018' : 'IG017')
        : (downSpeed >= 250 ? 'V018V' : downSpeed >= 175 ? 'V018U' : downSpeed >= 100 ? 'V018N' : downSpeed >= 50 ? 'V018H' : 'V018C');

      const fibreBsBasic = downSpeed >= 1000 ? 'PR417' : downSpeed >= 600 ? 'PR413' : downSpeed >= 300 ? 'PR411' : 'PR409';
      const fibreBsComfort = downSpeed >= 1000 ? 'PR418' : downSpeed >= 600 ? 'PR414' : downSpeed >= 300 ? 'PR412' : 'PR410';
      const fibreNgnBasic = downSpeed >= 1000 ? 'PF346' : downSpeed >= 600 ? 'PF342' : downSpeed >= 300 ? 'PF340' : 'PF338';
      const fibreNgnComfort = downSpeed >= 1000 ? 'PF347' : downSpeed >= 600 ? 'PF343' : downSpeed >= 300 ? 'PF341' : 'PF339';

      const psmBsBasic = applyV2Suffix(tpl.technology === 'FIBRE' ? fibreBsBasic : (downSpeed >= 250 ? 'PR403' : downSpeed >= 100 ? 'PR393' : 'PR383'));
      const psmBsComfort = applyV2Suffix(tpl.technology === 'FIBRE' ? fibreBsComfort : (downSpeed >= 250 ? 'PR404' : downSpeed >= 100 ? 'PR394' : 'PR384'));
      const psmNgnBasic = supportedNetworks.hasNgn ? applyV2Suffix(tpl.technology === 'FIBRE' ? fibreNgnBasic : (downSpeed >= 50 ? 'PI216' : 'PI206')) : '-';
      const psmNgnComfort = supportedNetworks.hasNgn ? applyV2Suffix(tpl.technology === 'FIBRE' ? fibreNgnComfort : (downSpeed >= 50 ? 'PI223' : 'PI207')) : '-';

      const basePkgId = (tpl.id ? tpl.id.toLowerCase().replace(/[^a-z0-9]+/g, '_') : `pkg_${downSpeed}`).replace(/^(po_|pop_)/i, '').replace(/_v2$/i, '');
      const pkgCodeV2 = `${basePkgId}_v2`;
      const basicBundleId = `pop_${pkgCodeV2}_bundle_mcd${term}_pt${pt}_basic_${downSpeed}`;
      const comfortBundleId = `pop_${pkgCodeV2}_bundle_mcd${term}_pt${pt}_comfort_${downSpeed}`;

      resolvedPops = [
        {
          id: `pop_pkg_${downSpeed}_bundle_mcd${term}_pt${pt}_basic_${downSpeed}_v2`,
          name: `pop_pkg_${downSpeed}_bundle_mcd${term}_pt${pt}_basic_${downSpeed}_v2`,
          id: basicBundleId,
          name: basicBundleId,
          connectionVariant: 'basic',
          playType: pt,
          speed: downSpeed,
          price: basePrice,
          hasNgn: supportedNetworks.hasNgn,
          hasBitstream: supportedNetworks.hasBitstream,
          popBandwidthAmount: isDsl ? 0.00 : 15.00,
          popInternetAmount: 14.00,
          popVoiceAccessAmount: 15.99,
          popVoiceTariffAmount: 5.00,
          svcBw: defaultSvcBw,
          svcIn: 'V0017',
          svcVaNgn: supportedNetworks.hasNgn ? 'VI002' : '-',
          svcVaBitstream: 'VI009',
          svcVt: 'V0017',
          psmInternetNgn: psmNgnBasic,
          tariffInternetNgn: supportedNetworks.hasNgn ? defaultTariffInt : '-',
          serviceInternetNgn: supportedNetworks.hasNgn ? `V0017, ${defaultSvcBw}` : '-',
          psmVoiceNgn: psmNgnBasic,
          tariffVoiceNgn: supportedNetworks.hasNgn ? defaultTariffVoice : '-',
          serviceVoiceNgn: supportedNetworks.hasNgn ? 'V0017, VI002' : '-',
          psmInternetBitstream: psmBsBasic,
          tariffInternetBitstream: defaultTariffInt,
          serviceInternetBitstream: `V0017, ${defaultSvcBw}`,
          psmVoiceBitstream: psmBsBasic,
          tariffVoiceBitstream: defaultTariffVoice,
          serviceVoiceBitstream: 'V0017, VI009',
          bitstream: {
            isAvailable: supportedNetworks.hasBitstream,
            salesPacketCode: psmBsBasic,
            internet: { packetCode: psmBsBasic, tariffCode: defaultTariffInt, serviceCodes: ['V0017', defaultSvcBw] },
            voice: { packetCode: psmBsBasic, tariffCode: defaultTariffVoice, serviceCodes: ['V0017', 'VI009'] }
          },
          ngn: {
            isAvailable: supportedNetworks.hasNgn,
            salesPacketCode: supportedNetworks.hasNgn ? psmNgnBasic : null,
            internet: supportedNetworks.hasNgn ? { packetCode: psmNgnBasic, tariffCode: defaultTariffInt, serviceCodes: ['V0017', defaultSvcBw] } : null,
            voice: supportedNetworks.hasNgn ? { packetCode: psmNgnBasic, tariffCode: defaultTariffVoice, serviceCodes: ['V0017', 'VI002'] } : null
          }
        },
        {
          id: `pop_pkg_${downSpeed}_bundle_mcd${term}_pt${pt}_comfort_${downSpeed}_v2`,
          name: `pop_pkg_${downSpeed}_bundle_mcd${term}_pt${pt}_comfort_${downSpeed}_v2`,
          id: comfortBundleId,
          name: comfortBundleId,
          connectionVariant: 'comfort',
          playType: pt,
          speed: downSpeed,
          price: comfortPrice,
          hasNgn: supportedNetworks.hasNgn,
          hasBitstream: supportedNetworks.hasBitstream,
          popBandwidthAmount: isDsl ? 0.00 : 15.00,
          popInternetAmount: 14.00,
          popVoiceAccessAmount: 19.98,
          popVoiceTariffAmount: 5.00,
          svcBw: defaultSvcBw,
          svcIn: 'V0017',
          svcVaNgn: supportedNetworks.hasNgn ? 'VI003' : '-',
          svcVaBitstream: 'VI006',
          svcVt: 'V0017',
          psmInternetNgn: psmNgnComfort,
          tariffInternetNgn: supportedNetworks.hasNgn ? defaultTariffInt : '-',
          serviceInternetNgn: supportedNetworks.hasNgn ? `V0017, ${defaultSvcBw}` : '-',
          psmVoiceNgn: psmNgnComfort,
          tariffVoiceNgn: supportedNetworks.hasNgn ? defaultTariffVoice : '-',
          serviceVoiceNgn: supportedNetworks.hasNgn ? 'V0017, VI003' : '-',
          psmInternetBitstream: psmBsComfort,
          tariffInternetBitstream: defaultTariffInt,
          serviceInternetBitstream: `V0017, ${defaultSvcBw}`,
          psmVoiceBitstream: psmBsComfort,
          tariffVoiceBitstream: defaultTariffVoice,
          serviceVoiceBitstream: 'V0017, VI006',
          bitstream: {
            isAvailable: supportedNetworks.hasBitstream,
            salesPacketCode: psmBsComfort,
            internet: { packetCode: psmBsComfort, tariffCode: defaultTariffInt, serviceCodes: ['V0017', defaultSvcBw] },
            voice: { packetCode: psmBsComfort, tariffCode: defaultTariffVoice, serviceCodes: ['V0017', 'VI006'] }
          },
          ngn: {
            isAvailable: supportedNetworks.hasNgn,
            salesPacketCode: supportedNetworks.hasNgn ? psmNgnComfort : null,
            internet: supportedNetworks.hasNgn ? { packetCode: psmNgnComfort, tariffCode: defaultTariffInt, serviceCodes: ['V0017', defaultSvcBw] } : null,
            voice: supportedNetworks.hasNgn ? { packetCode: psmNgnComfort, tariffCode: defaultTariffVoice, serviceCodes: ['V0017', 'VI003'] } : null
          }
        }
      ];
    } else {
      // Existing resolved POPs from template: automatically update POP IDs, NGN Packet Code, Bitstream Packet Code,
      // Internet Tariff Code, and Voice Tariff Code with suffix _v2
      resolvedPops = resolvedPops.map(p => {
        let popIdV2 = p.id || '';
        if (/_bundle_/i.test(popIdV2)) {
          popIdV2 = popIdV2.replace(/_v2$/i, '');
          const parts = popIdV2.split(/_bundle_/i);
          const prefix = /_v2$/i.test(parts[0]) ? parts[0] : `${parts[0]}_v2`;
          popIdV2 = `${prefix}_bundle_${parts[1]}`;
        } else {
          popIdV2 = /_v2$/i.test(popIdV2) ? popIdV2 : `${popIdV2}_v2`;
        }
        const popNameV2 = (p.name === p.id || !p.name)
          ? popIdV2
          : (/_v2$/i.test(p.name) ? p.name : `${p.name}_v2`);

        const rawPsmNgn = p.psmNgn || p.psmInternetNgn || p.ngn?.salesPacketCode;
        const psmNgnV2 = (p.hasNgn === false || rawPsmNgn === '-') ? '-' : applyV2Suffix(rawPsmNgn);

        const rawPsmBs = p.psmBitstream || p.psmInternetBitstream || p.bitstream?.salesPacketCode;
        const psmBsV2 = (p.hasBitstream === false || rawPsmBs === '-') ? '-' : applyV2Suffix(rawPsmBs);

        const rawTariffInt = p.tariffInternet || p.tariffInternetNgn || p.tariffInternetBitstream || p.bitstream?.internet?.tariffCode || p.ngn?.internet?.tariffCode;
        const tariffIntV2 = rawTariffInt === '-' ? '-' : applyV2Suffix(rawTariffInt);

        const rawTariffVoice = p.tariffVoice || p.tariffVoiceNgn || p.tariffVoiceBitstream || p.bitstream?.voice?.tariffCode || p.ngn?.voice?.tariffCode;
        const tariffVoiceV2 = rawTariffVoice === '-' ? '-' : applyV2Suffix(rawTariffVoice);

        return {
          ...p,
          id: popIdV2,
          name: popNameV2,
          psmNgn: psmNgnV2,
          psmInternetNgn: psmNgnV2,
          psmVoiceNgn: psmNgnV2,
          psmBitstream: psmBsV2,
          psmInternetBitstream: psmBsV2,
          psmVoiceBitstream: psmBsV2,
          tariffInternet: tariffIntV2,
          tariffInternetNgn: tariffIntV2,
          tariffInternetBitstream: tariffIntV2,
          tariffVoice: tariffVoiceV2,
          tariffVoiceNgn: tariffVoiceV2,
          tariffVoiceBitstream: tariffVoiceV2,
          bitstream: p.bitstream ? {
            ...p.bitstream,
            salesPacketCode: psmBsV2,
            internet: p.bitstream.internet ? { ...p.bitstream.internet, packetCode: psmBsV2, tariffCode: tariffIntV2 } : p.bitstream.internet,
            voice: p.bitstream.voice ? { ...p.bitstream.voice, packetCode: psmBsV2, tariffCode: tariffVoiceV2 } : p.bitstream.voice
          } : p.bitstream,
          ngn: p.ngn ? {
            ...p.ngn,
            salesPacketCode: psmNgnV2,
            internet: p.ngn.internet ? { ...p.ngn.internet, packetCode: psmNgnV2, tariffCode: tariffIntV2 } : p.ngn.internet,
            voice: p.ngn.voice ? { ...p.ngn.voice, packetCode: psmNgnV2, tariffCode: tariffVoiceV2 } : p.ngn.voice
          } : p.ngn
        };
      });
    }

    // Auto-detect fallback bandwidths from template offering characteristics, resolved POPs, or standards
    const tplFallbackChar = copiedChars.find(c => (c.name || '').toLowerCase() === 'fallback_bandwidth');
    const tplFallbackVals = (tplFallbackChar?.values || []).map(v => parseInt(v, 10)).filter(n => !isNaN(n) && n > 0);
    const extractedFallbacks = [...new Set(resolvedPops.map(p => Number(p.speed)).filter(s => s && s < downSpeed))].sort((a, b) => b - a);
    const autoFallbackBandwidths = tplFallbackVals.length > 0
      ? tplFallbackVals
      : (tpl.technology === 'DSL'
          ? (extractedFallbacks.length > 0 ? extractedFallbacks : getStandardFallbackTiers(downSpeed))
          : []);

    const allBandwidthSpeeds = [downSpeed, ...autoFallbackBandwidths].map(String);

    // Sync characteristics with bandwidth speeds and POP codes
    let nextChars = copiedChars.map(ch => {
      const n = (ch.name || '').toLowerCase();
      if (n === 'bandwidth') {
        return { ...ch, values: allBandwidthSpeeds, value: allBandwidthSpeeds.join(', ') };
      }
      if (n === 'default_bandwidth') {
        return { ...ch, values: [String(downSpeed)], value: String(downSpeed) };
      }
      if (n === 'fallback_bandwidth') {
        return { ...ch, values: autoFallbackBandwidths.map(String), value: autoFallbackBandwidths.join(', ') };
      }
      if (n === 'downstream_bandwidth' || n === 'bandwidth_downstream_max') {
        return { ...ch, values: [String(downSpeed)], value: String(downSpeed) };
      }
      if (n === 'upstream_bandwidth' || n === 'bandwidth_upstream_max') {
        return { ...ch, values: [String(upSpeed)], value: String(upSpeed) };
      }
      return ch;
    });

    nextChars = syncPsmCharacteristics(resolvedPops, nextChars, supportedNetworks);

    // Sync psm_aaw_packet_id and sku characteristics with resolved packet IDs and terms
    const allSkus = copiedTerms.map(t => t.sku).filter(Boolean);
    const allTermDurations = Array.from(new Set(copiedTerms.map(t => String(t.duration?.amount)))).filter(Boolean);
    let aawCharFound = false;
    let skuCharFound = false;
    let mcdCharFound = false;

    nextChars = nextChars.map(ch => {
      const n = (ch.name || '').toLowerCase();
      if (n === 'psm_aaw_packet_id' || n === 'psmaawpacketid' || n === 'psm_packet_id') {
        aawCharFound = true;
        return {
          ...ch,
          isArray: true,
          values: resolvedPacketIds,
          value: resolvedPacketIds.join(', ')
        };
      }
      if (n === 'sku') {
        skuCharFound = true;
        return {
          ...ch,
          isArray: true,
          values: allSkus.length > 0 ? allSkus : [''],
          value: allSkus.join(', ')
        };
      }
      if (n === 'minimum_contract_duration') {
        mcdCharFound = true;
        return {
          ...ch,
          values: allTermDurations,
          value: allTermDurations.join(', ')
        };
      }
      return ch;
    });

    if (!aawCharFound) {
      nextChars.push({
        id: 'psm_aaw_packet_id',
        name: 'psm_aaw_packet_id',
        isArray: true,
        minCardinality: 0,
        maxCardinality: 99,
        valueType: 'string',
        values: resolvedPacketIds,
        value: resolvedPacketIds.join(', ')
      });
    }

    if (!skuCharFound) {
      nextChars.push({
        id: 'sku',
        name: 'sku',
        isArray: true,
        minCardinality: 0,
        maxCardinality: 99,
        valueType: 'string',
        values: allSkus.length > 0 ? allSkus : [''],
        value: allSkus.join(', ')
      });
    }

    const firstPopId = resolvedPops.length > 0 ? resolvedPops[0].id : '';
    const basicPop = resolvedPops.find(p => p.connectionVariant === 'basic') || resolvedPops[0];
    const autoStandardPrice = basicPop ? basicPop.price : 44.99;

    setSelectedPopId(firstPopId);

    // Extract Category Groupings from Template or generate default from primary SKU
    const rawCg = tpl.raw?.extensions?.categoryGroupings || tpl.raw?.categoryGroupings || tpl.raw?.categoryGrouping;
    let copiedCategoryGroupings = [];
    if (Array.isArray(rawCg) && rawCg.length > 0) {
      copiedCategoryGroupings = rawCg.map((cg, idx) => {
        const gName = cg.name || `Category Group #${idx + 1}`;
        const gId = cg.id || cg.name || `cg_${idx}`;
        let gSku = null;
        if (Array.isArray(cg.prodSpecCharValueUse)) {
          const skuChar = cg.prodSpecCharValueUse.find(c => (c.name || '').toLowerCase() === 'sku');
          gSku = skuChar?.productSpecCharacteristicValue?.[0]?.value || skuChar?.value || null;
        }
        if (!gSku) gSku = defaultTerm?.sku || `${primaryPacket}-24`;

        return {
          id: gId,
          name: gName,
          sku: gSku,
          prodSpecCharValueUse: [
            {
              name: 'sku',
              productSpecCharacteristicValue: [{ value: gSku }]
            }
          ],
          category: Array.isArray(cg.category) ? cg.category.map(c => {
            const catId = c.id || c.name;
            const catVer = c.version ? String(c.version) : '1';
            return {
              id: catId,
              name: c.name || catId,
              version: catVer,
              href: c.href || `/api/productCatalogManagement/v4/category/${catId}:(version=${catVer})`
            };
          }) : []
        };
      });
    } else {
      const primarySku = defaultTerm?.sku || `${primaryPacket}-24`;
      const defaultCatId = tpl.technology === 'FIBRE' ? 'FN0553' : 'FN0552';
      const defaultCatName = tpl.technology === 'FIBRE' ? 'Glasfaser 10/25' : 'DSL 10/25';
      const baseOfferName = (tpl.name || tpl.id || '').replace(/^Copy of\s+/i, '').trim();
      const offerNameV2 = /[\s_]+v2$/i.test(baseOfferName) ? baseOfferName : `${baseOfferName} v2`;

      copiedCategoryGroupings = [
        {
          id: `cg_${primarySku.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
          name: `${offerNameV2} (${primarySku})`,
          sku: primarySku,
          prodSpecCharValueUse: [
            {
              name: 'sku',
              productSpecCharacteristicValue: [{ value: primarySku }]
            }
          ],
          category: [
            {
              id: defaultCatId,
              name: defaultCatName,
              version: '1',
              href: `/api/productCatalogManagement/v4/category/${defaultCatId}:(version=1)`
            }
          ]
        }
      ];
    }

    const seenCats = new Set();
    const copiedDirectCats = [];
    copiedCategoryGroupings.forEach(cg => {
      (cg.category || []).forEach(c => {
        if (!seenCats.has(c.id)) {
          seenCats.add(c.id);
          copiedDirectCats.push(c);
        }
      });
    });

    const baseOfferName = (tpl.name || tpl.id || '').replace(/^Copy of\s+/i, '').trim();
    const offerNameV2 = /[\s_]+v2$/i.test(baseOfferName) ? baseOfferName : `${baseOfferName} v2`;
    const offerCodeV2 = tpl.id ? (/[\s_]+v2$/i.test(tpl.id) ? tpl.id : `${tpl.id}_v2`) : '';

    // Align display name characteristics with offerNameV2
    let cartCharFound = false;
    let configuratorCharFound = false;

    nextChars = nextChars.map(ch => {
      const n = (ch.name || '').toLowerCase().replace(/[_\s-]+/g, '');
      if (n === 'displaynamecart') {
        cartCharFound = true;
        const curVal = ch.values?.[0] || ch.value || offerNameV2;
        const v2Val = /[\s_]+v2$/i.test(curVal) ? curVal : `${curVal.replace(/^Copy of\s+/i, '').trim()} v2`;
        return {
          ...ch,
          value: v2Val,
          values: [v2Val],
          description: ch.description || 'Display name rendered in shopping cart summary'
        };
      }
      if (n === 'displaynameconfigurator') {
        configuratorCharFound = true;
        const curVal = ch.values?.[0] || ch.value || offerNameV2;
        const v2Val = /[\s_]+v2$/i.test(curVal) ? curVal : `${curVal.replace(/^Copy of\s+/i, '').trim()} v2`;
        return {
          ...ch,
          value: v2Val,
          values: [v2Val],
          description: ch.description || 'Display name rendered in web shop configurator step'
        };
      }
      return ch;
    });

    if (!cartCharFound) {
      nextChars.push({
        id: 'DisplayNameCart',
        name: 'DisplayNameCart',
        valueType: 'string',
        isArray: false,
        values: [offerNameV2],
        value: offerNameV2,
        description: 'Display name rendered in shopping cart summary'
      });
    }

    if (!configuratorCharFound) {
      nextChars.push({
        id: 'DisplayNameConfigurator',
        name: 'DisplayNameConfigurator',
        valueType: 'string',
        isArray: false,
        values: [offerNameV2],
        value: offerNameV2,
        description: 'Display name rendered in web shop configurator step'
      });
    }

    // Extract direct characteristics from template if any
    const tplDirect = tpl.raw?.productOfferingCharacteristic || tpl.productOfferingCharacteristic;
    const copiedDirectChars = [];
    if (Array.isArray(tplDirect)) {
      tplDirect.forEach((c, idx) => {
        const vals = Array.isArray(c.productOfferingCharacteristicValue)
          ? c.productOfferingCharacteristicValue.map(v => v?.value !== undefined ? String(v.value) : String(v))
          : (c.value !== undefined ? [String(c.value)] : ['']);
        copiedDirectChars.push({
          id: c.id || `direct_char_${idx}`,
          name: c.name || `direct_char_${idx}`,
          valueType: c.valueType || 'string',
          isArray: vals.length > 1,
          values: vals.length > 0 ? vals : [''],
          value: vals.join(', '),
          raw: c
        });
      });
    }
    const tplPortId = extractPortfolioId(tpl.raw || tpl);
    const effectivePortId = tplPortId || formData.portfolio_id || '';
    if (effectivePortId) {
      const existingPortIdx = copiedDirectChars.findIndex(c => (c.name || '').toLowerCase() === 'portfolio_id');
      if (existingPortIdx >= 0) {
        copiedDirectChars[existingPortIdx] = {
          ...copiedDirectChars[existingPortIdx],
          values: [effectivePortId],
          value: effectivePortId,
          productOfferingCharacteristicValue: [{ value: effectivePortId, isDefault: true }]
        };
      } else {
        copiedDirectChars.unshift({
          id: 'portfolio_id',
          name: 'portfolio_id',
          valueType: 'string',
          "@type": 'ProductOfferingCharacteristic',
          configurable: false,
          isArray: false,
          values: [effectivePortId],
          value: effectivePortId,
          productOfferingCharacteristicValue: [{ value: effectivePortId, isDefault: true }]
        });
      }
    }

    const tplVersion = String(tpl.version || tpl.raw?.version || '1');
    const cleanTplId = tpl.id.replace(/:\(version=[^)]+\)$/i, '');
    const templateNameVal = `${cleanTplId}:(version=${tplVersion})`;
    const fullDisplayName = `${tpl.name} (${tpl.technology} · ${cleanTplId} · v${tplVersion})`;

    const existingTplIdx = copiedDirectChars.findIndex(c => (c.name || '').toLowerCase() === 'template_name');
    if (existingTplIdx >= 0) {
      copiedDirectChars[existingTplIdx] = {
        ...copiedDirectChars[existingTplIdx],
        values: [templateNameVal],
        value: templateNameVal,
        productOfferingCharacteristicValue: [{ value: templateNameVal, isDefault: true }]
      };
    } else {
      copiedDirectChars.unshift({
        id: 'template_name',
        name: 'template_name',
        valueType: 'string',
        "@type": 'ProductOfferingCharacteristic',
        configurable: false,
        isArray: false,
        values: [templateNameVal],
        value: templateNameVal,
        productOfferingCharacteristicValue: [{ value: templateNameVal, isDefault: true }]
      });
    }

    setFormData(prev => {
      const finalPortId = effectivePortId || prev.portfolio_id || '';
      let finalDirectChars = [...copiedDirectChars];
      if (finalPortId && !finalDirectChars.some(c => (c.name || '').toLowerCase() === 'portfolio_id')) {
        finalDirectChars.unshift({
          id: 'portfolio_id',
          name: 'portfolio_id',
          valueType: 'string',
          "@type": 'ProductOfferingCharacteristic',
          configurable: false,
          isArray: false,
          values: [finalPortId],
          value: finalPortId,
          productOfferingCharacteristicValue: [{ value: finalPortId, isDefault: true }]
        });
      }

      return {
        ...prev,
        name: offerNameV2,
        code: offerCodeV2 || prev.code,
        id: offerCodeV2 || prev.id,
        portfolio_id: finalPortId,
        template_name: templateNameVal,
        selectedTemplateId: cleanTplId,
        selectedTemplateName: fullDisplayName,
        specificationId: tpl.specId,
        specificationName: tpl.specName,
        specificationVersion: tpl.specVersion,
        technology: tpl.technology,
        accessType: tpl.technology === 'FIBRE' ? 'FTTH (GPON)' : tpl.technology === 'DSL' ? 'VDSL2 Vectoring (17a)' : 'DOCSIS 3.1',
        technologyType: tpl.technology === 'FIBRE' ? 'FTTH (GPON)' : tpl.technology === 'DSL' ? 'VDSL2 Vectoring (17a)' : 'DOCSIS 3.1',
        isNgnSupported: supportedNetworks.hasNgn,
        isBitstreamSupported: supportedNetworks.hasBitstream,
        networkType: supportedNetworks.primaryNetwork,
        technologyProductId: `PR_${tpl.technology}_${downSpeed}M`,
        selectedBandwidthOfferId: autoSelectedBandwidthOfferId,
        bandwidthOption: autoBandwidthOption,
        downstreamSpeed: downSpeed,
        upstreamSpeed: upSpeed,
        fallbackBandwidths: autoFallbackBandwidths,
        bundledPops: resolvedPops,
        selectedPopId: firstPopId,
        standardPrice: autoStandardPrice,
        ccbMasterPacketId: primaryPacket,
        psmAawPacketIds: resolvedPacketIds,
        ccbInternetTariff: `IP_${tpl.technology}_${downSpeed}`,
        ccbBandwidthSku: autoBandwidthSku,
        productCodeNgn: supportedNetworks.hasNgn ? (extractChar(tpl, 'product_code_internet_ngn') || 'I1204') : '',
        productCodeBitstream: extractChar(tpl, 'product_code_internet_bitstream') || extractChar(tpl, 'product_code_internet') || 'I1203',
        isVoiceNgnSupported: Boolean(extractChar(tpl, 'product_code_voice_ngn') || supportedNetworks.hasNgn),
        isVoiceBitstreamSupported: Boolean(extractChar(tpl, 'product_code_voice_bitstream') || extractChar(tpl, 'product_code_voice') || supportedNetworks.hasBitstream),
        voiceProductCodeNgn: extractChar(tpl, 'product_code_voice_ngn') || 'VI204',
        voiceProductCodeBitstream: extractChar(tpl, 'product_code_voice_bitstream') || extractChar(tpl, 'product_code_voice') || 'VI203',
        selectedInternetTariffCode: (resolvedPops[0]?.tariffInternet || resolvedPops[0]?.tariffInternetNgn || resolvedPops[0]?.tariffInternetBitstream || extractChar(tpl, 'tariff_code_internet_ngn') || extractChar(tpl, 'tariff_code_internet') || '').replace(/_v2$/i, ''),
        selectedVoiceTariffCode: (resolvedPops[0]?.tariffVoice || resolvedPops[0]?.tariffVoiceNgn || resolvedPops[0]?.tariffVoiceBitstream || extractChar(tpl, 'tariff_code_voice_ngn') || extractChar(tpl, 'tariff_code_voice') || '').replace(/_v2$/i, ''),
        minContractTermMonths: defaultTerm ? defaultTerm.duration.amount : prev.minContractTermMonths,
        terms: copiedTerms,
        categoryGroupings: copiedCategoryGroupings,
        category: copiedDirectCats,
        characteristics: nextChars,
        productOfferingCharacteristic: finalDirectChars.length > 0 ? finalDirectChars : (prev.productOfferingCharacteristic || [])
      };
    });

    setAutoSelectedMeta({
      sourceId: tpl.id,
      sourceName: tpl.name,
      specId: tpl.specId,
      specName: tpl.specName,
      technology: tpl.technology,
      charsCount: nextChars.length,
      bandwidthOption: autoBandwidthOption,
      popsCount: resolvedPops.length
    });
  };

  // When an existing sales package item is passed (e.g. from drawer layout switch), prefill from it as template
  useEffect(() => {
    if (item && item.id && !item.isNew && !item.isDraft && initializedItemTplRef.current !== item.id) {
      initializedItemTplRef.current = item.id;
      handleSelectCatalogTemplate(item.id);
    }
  }, [item?.id]);

  // When resuming a draft, synchronize template state and formData immediately (once per draft session)
  useEffect(() => {
    if (item && (item.isDraft || item.draftData)) {
      const currentDraftKey = item.draftId || item.id;
      if (resumedDraftIdRef.current === currentDraftKey) {
        return; // Already resumed this draft session, avoid clobbering active user edits
      }
      resumedDraftIdRef.current = currentDraftKey;

      const d = item.draftData || item;
      const tplName = d.template_name || item.template_name || extractTemplateName(item) || '';
      const tplId = d.selectedTemplateId || item.selectedTemplateId || (tplName ? tplName.replace(/:\(version=[^)]+\)$/i, '') : '');
      const tplDisplayName = d.selectedTemplateName || item.selectedTemplateName || 
        (tplName ? (tplName.match(/^(.+?):\(version=(.+?)\)$/) ? `${RegExp.$1} (v${RegExp.$2})` : tplName) : tplId);
      if (tplId) {
        setSelectedTemplateId(tplId);
      }
      setFormData(prev => ({
        ...prev,
        ...d,
        template_name: tplName || prev.template_name,
        selectedTemplateId: tplId || prev.selectedTemplateId,
        selectedTemplateName: tplDisplayName || prev.selectedTemplateName
      }));
    }
  }, [item?.draftId, item?.id]);

  const handleSelectSpecification = (specId) => {
    if (!specId) {
      setFormData(prev => ({
        ...prev,
        specificationId: '',
        specificationName: '',
        specificationVersion: '',
        characteristics: []
      }));
      return;
    }

    const spec = availableSalesPackageSpecs.find(s => s.id === specId);
    const specName = spec?.name || specId;
    const specVersion = spec?.version || '1.0';
    const technology = detectTechnology('', specName, specId);

    // Look up characteristic definitions for this specification
    let rawSpecChars = [];

    // 1. From allSpecifications
    let specObj = allSpecifications.get(specId);
    if (!specObj) {
      for (const [sId, s] of allSpecifications.entries()) {
        if (sId.toLowerCase() === specId.toLowerCase() || (s?.name && s.name.toLowerCase() === specName.toLowerCase())) {
          specObj = s;
          break;
        }
      }
    }

    if (specObj) {
      const chars = Array.isArray(specObj.productSpecCharacteristic)
        ? specObj.productSpecCharacteristic
        : (Array.isArray(specObj.raw?.productSpecCharacteristic) ? specObj.raw.productSpecCharacteristic : []);
      if (chars.length > 0) {
        rawSpecChars = chars;
      }
    }

    // 2. From offerings or packages in catalogPool matching this spec
    if (rawSpecChars.length === 0) {
      const matchEntity = (catalogPool || []).find(entity => {
        const raw = entity?.raw || entity;
        const s = raw?.productSpecification || entity?.productSpecification;
        return s?.id === specId || (s?.name && s.name.toLowerCase() === specName.toLowerCase());
      });
      if (matchEntity) {
        const raw = matchEntity.raw || matchEntity;
        const chars = Array.isArray(raw?.prodSpecCharValueUse)
          ? raw.prodSpecCharValueUse
          : (Array.isArray(raw?.productSpecCharacteristic) ? raw.productSpecCharacteristic : []);
        if (chars.length > 0) {
          rawSpecChars = chars;
        }
      }
    }

    // 3. From catalogSalesPackages (e.g. matching technology or standard sales package)
    if (rawSpecChars.length === 0) {
      const matchingTpl = catalogSalesPackages.find(p => p.specId === specId || p.technology === technology) || catalogSalesPackages[0];
      if (matchingTpl) {
        const tplChars = Array.isArray(matchingTpl.raw?.prodSpecCharValueUse)
          ? matchingTpl.raw.prodSpecCharValueUse
          : (Array.isArray(matchingTpl.raw?.productSpecCharacteristic) ? matchingTpl.raw.productSpecCharacteristic : []);
        if (tplChars.length > 0) {
          rawSpecChars = tplChars;
        }
      }
    }

    // 4. Fallback to BASELINE_SALES_PACKAGE_SPECS
    if (rawSpecChars.length === 0) {
      rawSpecChars = Object.entries(BASELINE_SALES_PACKAGE_SPECS).map(([name, def]) => ({
        name,
        minCardinality: def.minCardinality,
        maxCardinality: def.maxCardinality,
        valueType: def.valueType
      }));
    }

    // Deduplicate characteristic definitions by name
    const seenNames = new Set();
    const dedupedRawChars = [];
    rawSpecChars.forEach(c => {
      const n = (c.name || '').trim().toLowerCase();
      if (n && !seenNames.has(n)) {
        seenNames.add(n);
        dedupedRawChars.push(c);
      }
    });

    // Create characteristics with empty values
    const createdChars = dedupedRawChars.map((c, idx) => {
      const charName = c.name || `char_${idx}`;
      const def = getCharDefinition(charName, specId, c);
      const minCard = def?.minCardinality !== undefined ? def.minCardinality : (c.minCardinality !== undefined ? c.minCardinality : 0);
      const maxCard = def?.maxCardinality !== undefined ? def.maxCardinality : (c.maxCardinality !== undefined ? c.maxCardinality : 99);
      const valType = def?.valueType || c.valueType || 'string';
      const isArray = def?.isArray !== undefined ? def.isArray : resolveIsArray(charName, specId, c, []);

      return {
        id: charName,
        name: charName,
        isArray,
        minCardinality: minCard,
        maxCardinality: maxCard,
        valueType: valType,
        values: [''],
        value: '',
        raw: c
      };
    });

    setFormData(prev => ({
      ...prev,
      specificationId: specId,
      specificationName: specName,
      specificationVersion: specVersion,
      technology,
      accessType: technology === 'FIBRE' ? 'FTTH (GPON)' : technology === 'DSL' ? 'VDSL2 Vectoring' : 'DOCSIS 3.1',
      ccbInternetTariff: `IP_${technology}_${prev.downstreamSpeed || 250}`,
      ccbBandwidthSku: `BW_${prev.downstreamSpeed || 250}_${prev.upstreamSpeed || 50}_${technology}`,
      characteristics: createdChars
    }));
  };

  // ─── PSM AAW Paket ID & Contract Term Management ───
  // Supports multi-cardinality psm_aaw_packet_id with terms selectable per Paket ID
  const handleToggleTerm = (targetPacketIdOrAmount, maybeAmount, units = 'Month') => {
    let targetPacketId;
    let amount;

    if (typeof targetPacketIdOrAmount === 'number' || (!maybeAmount && !isNaN(Number(targetPacketIdOrAmount)))) {
      amount = Number(targetPacketIdOrAmount);
      targetPacketId = formData.psmAawPacketIds?.[0] || formData.ccbMasterPacketId || '';
    } else {
      targetPacketId = String(targetPacketIdOrAmount || formData.psmAawPacketIds?.[0] || formData.ccbMasterPacketId || '');
      amount = Number(maybeAmount);
    }

    if (!targetPacketId) {
      alert('Please add a PSM AAW Paket ID first.');
      return;
    }

    const num = Number(amount);
    if (![24, 18, 12].includes(num)) return;

    setFormData(prev => {
      const cleanTargetPacket = String(targetPacketId || prev.psmAawPacketIds?.[0] || prev.ccbMasterPacketId || '').split('-')[0].trim();
      if (!cleanTargetPacket) return prev;
      const existing = (prev.terms || []).find(t =>
        (t.packetId === cleanTargetPacket || (!t.packetId && cleanTargetPacket === prev.ccbMasterPacketId)) &&
        t.duration?.amount === num
      );

      let nextTerms;
      if (existing) {
        if ((prev.terms || []).length <= 1) {
          alert('At least one contract term is required.');
          return prev;
        }
        nextTerms = (prev.terms || []).filter(t => t.id !== existing.id && !(
          (t.packetId === cleanTargetPacket || (!t.packetId && cleanTargetPacket === prev.ccbMasterPacketId)) &&
          t.duration?.amount === num
        ));
        if (existing.isDefault && nextTerms.length > 0) {
          nextTerms[0].isDefault = true;
        }
      } else {
        const newTerm = {
          id: `term_${cleanTargetPacket}_${num}`,
          packetId: cleanTargetPacket,
          name: 'minimum_contract_duration',
          description: `${num} ${units}s Commitment`,
          duration: { amount: num, units },
          sku: `${cleanTargetPacket}-${num}`,
          isDefault: (prev.terms || []).length === 0
        };

        const termOrder = [24, 18, 12];
        const packetList = prev.psmAawPacketIds || [prev.ccbMasterPacketId];
        nextTerms = [...(prev.terms || []), newTerm].sort((a, b) => {
          const pA = a.packetId || '';
          const pB = b.packetId || '';
          const idxA = packetList.indexOf(pA);
          const idxB = packetList.indexOf(pB);
          if (idxA !== -1 && idxB !== -1 && idxA !== idxB) return idxA - idxB;
          const iA = termOrder.indexOf(Number(a.duration?.amount));
          const iB = termOrder.indexOf(Number(b.duration?.amount));
          if (iA !== -1 && iB !== -1) return iA - iB;
          return (b.duration?.amount || 0) - (a.duration?.amount || 0);
        });
      }

      // Sync with characteristics (minimum_contract_duration and sku)
      const termAmounts = Array.from(new Set(nextTerms.map(t => String(t.duration?.amount))));
      const termSkus = nextTerms.map(t => t.sku).filter(Boolean);

      const nextChars = (prev.characteristics || []).map(ch => {
        const n = (ch.name || '').toLowerCase();
        if (n === 'minimum_contract_duration') {
          return { ...ch, values: termAmounts, value: termAmounts.join(', ') };
        }
        if (n === 'sku') {
          return { ...ch, values: termSkus.length > 0 ? termSkus : [''], value: termSkus.join(', ') };
        }
        return ch;
      });

      const defaultTerm = nextTerms.find(t => t.isDefault) || nextTerms[0];

      return {
        ...prev,
        terms: nextTerms,
        minContractTermMonths: defaultTerm ? defaultTerm.duration.amount : prev.minContractTermMonths,
        characteristics: nextChars
      };
    });
  };

  const handleSetDefaultTerm = (termId) => {
    setFormData(prev => {
      const nextTerms = (prev.terms || []).map(t => ({
        ...t,
        isDefault: t.id === termId
      }));
      const selected = nextTerms.find(t => t.id === termId);
      return {
        ...prev,
        terms: nextTerms,
        minContractTermMonths: selected ? selected.duration.amount : prev.minContractTermMonths
      };
    });
  };

  const handleTermSkuChange = (termId, newSku) => {
    setFormData(prev => {
      let oldSku = '';
      const nextTerms = (prev.terms || []).map(t => {
        if (t.id === termId) {
          oldSku = t.sku;
          return { ...t, sku: newSku };
        }
        return t;
      });
      const termSkus = nextTerms.map(t => t.sku).filter(Boolean);
      const nextChars = (prev.characteristics || []).map(ch => {
        if ((ch.name || '').toLowerCase() === 'sku') {
          return { ...ch, values: termSkus.length > 0 ? termSkus : [''], value: termSkus.join(', ') };
        }
        return ch;
      });

      // Synchronize categoryGroupings if referencing old SKU
      let nextGroupings = prev.categoryGroupings;
      if (oldSku && oldSku !== newSku) {
        nextGroupings = (prev.categoryGroupings || []).map(cg => {
          if (cg.sku === oldSku) {
            return {
              ...cg,
              sku: newSku,
              name: `${prev.name} (${newSku})`,
              prodSpecCharValueUse: [
                {
                  name: 'sku',
                  productSpecCharacteristicValue: [{ value: newSku }]
                }
              ]
            };
          }
          return cg;
        });
      }

      return { ...prev, terms: nextTerms, categoryGroupings: nextGroupings, characteristics: nextChars };
    });
  };

  const handleAddPsmAawPacketId = (customPacketId) => {
    const rawVal = customPacketId !== undefined ? customPacketId : newPsmPacketInput;
    const cleanPacket = String(rawVal || '').split('-')[0].trim();
    if (!cleanPacket) {
      alert('Please enter a valid PSM AAW Paket ID (e.g. R025.5000000531)');
      return;
    }

    setFormData(prev => {
      const currentList = prev.psmAawPacketIds || (prev.ccbMasterPacketId ? [prev.ccbMasterPacketId] : []);
      if (currentList.includes(cleanPacket)) {
        alert(`PSM AAW Paket ID "${cleanPacket}" is already added.`);
        return prev;
      }

      const nextPacketIds = [...currentList, cleanPacket];
      // Automatically configure default terms (24M, 18M, 12M) for this new Paket ID
      const newTerms = [24, 18, 12].map(dur => ({
        id: `term_${cleanPacket}_${dur}`,
        packetId: cleanPacket,
        name: 'minimum_contract_duration',
        description: `${dur} Months Commitment`,
        duration: { amount: dur, units: 'Month' },
        sku: `${cleanPacket}-${dur}`,
        isDefault: (prev.terms || []).length === 0 && dur === 24
      }));

      const termOrder = [24, 18, 12];
      const nextTerms = [...(prev.terms || []), ...newTerms].sort((a, b) => {
        const idxA = nextPacketIds.indexOf(a.packetId);
        const idxB = nextPacketIds.indexOf(b.packetId);
        if (idxA !== -1 && idxB !== -1 && idxA !== idxB) return idxA - idxB;
        const iA = termOrder.indexOf(Number(a.duration?.amount));
        const iB = termOrder.indexOf(Number(b.duration?.amount));
        if (iA !== -1 && iB !== -1) return iA - iB;
        return (b.duration?.amount || 0) - (a.duration?.amount || 0);
      });

      const termAmounts = Array.from(new Set(nextTerms.map(t => String(t.duration?.amount))));
      const termSkus = nextTerms.map(t => t.sku).filter(Boolean);

      let aawFound = false;
      let skuFound = false;
      let mcdFound = false;

      let nextChars = (prev.characteristics || []).map(ch => {
        const n = (ch.name || '').toLowerCase();
        if (n === 'psm_aaw_packet_id' || n === 'psmaawpacketid' || n === 'psm_packet_id') {
          aawFound = true;
          return {
            ...ch,
            isArray: true,
            values: nextPacketIds,
            value: nextPacketIds.join(', ')
          };
        }
        if (n === 'sku') {
          skuFound = true;
          return {
            ...ch,
            isArray: true,
            values: termSkus,
            value: termSkus.join(', ')
          };
        }
        if (n === 'minimum_contract_duration') {
          mcdFound = true;
          return {
            ...ch,
            values: termAmounts,
            value: termAmounts.join(', ')
          };
        }
        return ch;
      });

      if (!aawFound) {
        nextChars.push({
          id: 'psm_aaw_packet_id',
          name: 'psm_aaw_packet_id',
          isArray: true,
          minCardinality: 0,
          maxCardinality: 99,
          valueType: 'string',
          values: nextPacketIds,
          value: nextPacketIds.join(', ')
        });
      }
      if (!skuFound) {
        nextChars.push({
          id: 'sku',
          name: 'sku',
          isArray: true,
          minCardinality: 0,
          maxCardinality: 99,
          valueType: 'string',
          values: termSkus,
          value: termSkus.join(', ')
        });
      }

      return {
        ...prev,
        psmAawPacketIds: nextPacketIds,
        terms: nextTerms,
        characteristics: nextChars
      };
    });

    setNewPsmPacketInput('');
  };

  /**
   * Helper trigger that propagates updated PSM AAW Paket ID to category mappings (categoryGroupings).
   * Fully preserves all assigned product categories under the group while migrating:
   * - sku: replaces oldPktId prefix or exact match with newPktId
   * - name: updates group name (e.g. "R025.5000000531-24" or "Offer (R025.5000000531-24)")
   * - id: re-keys cg_ identifier
   * - prodSpecCharValueUse: updates characteristic value for "sku"
   */
  const propagateAawPacketIdToCategoryGroupings = (categoryGroupings = [], oldPktId, newPktId, offerName = '') => {
    if (!oldPktId || oldPktId === newPktId) return categoryGroupings;
    const cleanOld = String(oldPktId).trim();
    const cleanNew = String(newPktId || '').trim();
    if (!cleanOld) return categoryGroupings;

    return (categoryGroupings || []).map(cg => {
      let updatedSku = cg.sku || '';
      let isMatched = false;

      // 1. Exact match with old Paket ID (e.g. "R025.5000000528")
      if (updatedSku === cleanOld) {
        updatedSku = cleanNew;
        isMatched = true;
      }
      // 2. SKU with duration suffix (e.g. "R025.5000000528-24" -> "R026.5000000528-24")
      else if (cleanOld && updatedSku.startsWith(`${cleanOld}-`)) {
        const suffix = updatedSku.substring(cleanOld.length);
        updatedSku = cleanNew ? `${cleanNew}${suffix}` : '';
        isMatched = true;
      }
      // 3. Name or ID match if SKU was empty or bare
      else if (cg.name && (cg.name === cleanOld || cg.name.startsWith(`${cleanOld}-`))) {
        const suffix = cg.name.substring(cleanOld.length);
        updatedSku = cleanNew ? `${cleanNew}${suffix}` : '';
        isMatched = true;
      } else if (cg.id && cg.id.startsWith(`cg_${cleanOld.replace(/[^a-zA-Z0-9_-]/g, '_')}`)) {
        const suffix = cg.sku && cg.sku.includes('-') ? `-${cg.sku.split('-')[1]}` : '';
        updatedSku = cleanNew ? `${cleanNew}${suffix}` : '';
        isMatched = true;
      }

      if (!isMatched) {
        return cg;
      }

      // Compute updated name:
      // If cg.name was the SKU (canonical TM Forum e.g. "R025.5000000528-24"), update to updatedSku.
      // If cg.name contained oldPktId in parentheses or text, replace oldPktId with cleanNew.
      let updatedName = cg.name || updatedSku;
      if (updatedName === cleanOld || updatedName.startsWith(`${cleanOld}-`)) {
        const suffix = updatedName.substring(cleanOld.length);
        updatedName = cleanNew ? `${cleanNew}${suffix}` : '';
      } else if (cleanOld && updatedName.includes(cleanOld)) {
        updatedName = updatedName.replaceAll(cleanOld, cleanNew);
      } else if (updatedSku) {
        updatedName = offerName ? `${offerName} (${updatedSku})` : updatedSku;
      }

      const updatedId = updatedSku ? `cg_${updatedSku.replace(/[^a-zA-Z0-9_-]/g, '_')}` : (cg.id || 'cg_group');

      const updatedCharUses = (cg.prodSpecCharValueUse || []).map(ps => {
        if ((ps.name || '').toLowerCase() === 'sku') {
          return {
            ...ps,
            productSpecCharacteristicValue: [{ value: updatedSku }],
            value: updatedSku
          };
        }
        return ps;
      });

      if (!updatedCharUses.some(ps => (ps.name || '').toLowerCase() === 'sku') && updatedSku) {
        updatedCharUses.push({
          name: 'sku',
          valueType: 'string',
          productSpecCharacteristicValue: [{ value: updatedSku }],
          value: updatedSku
        });
      }

      return {
        ...cg,
        id: updatedId,
        name: updatedName || updatedSku,
        sku: updatedSku,
        prodSpecCharValueUse: updatedCharUses,
        category: Array.isArray(cg.category) ? [...cg.category] : []
      };
    });
  };

  // Trigger to navigate directly to Category Mappings for a given PSM AAW Paket ID
  const handleGoToCategoryMappings = (packetId) => {
    const matchingTerm = (formData.terms || []).find(t => t.packetId === packetId || String(t.sku || '').startsWith(`${packetId}-`));
    const targetSku = matchingTerm?.sku || packetId;
    setSelectedSkuForCategory(targetSku);
    setActiveTab('categories');
  };

  const handleUpdatePsmAawPacketId = (index, newValue) => {
    setFormData(prev => {
      const currentList = [...(prev.psmAawPacketIds || (prev.ccbMasterPacketId ? [prev.ccbMasterPacketId] : []))];
      const oldPktId = currentList[index] ?? '';
      currentList[index] = newValue;

      const isPrimary = (prev.ccbMasterPacketId === oldPktId) || (index === 0 && (!prev.ccbMasterPacketId || prev.ccbMasterPacketId === oldPktId));
      const nextMaster = isPrimary ? newValue : prev.ccbMasterPacketId;

      // Update terms matching oldPktId or index 0 fallback
      const nextTerms = (prev.terms || []).map(t => {
        if (t.packetId === oldPktId || (!t.packetId && index === 0)) {
          const dur = t.duration?.amount || 24;
          return {
            ...t,
            id: `term_${newValue || 'empty'}_${dur}`,
            packetId: newValue,
            sku: newValue ? `${newValue}-${dur}` : ''
          };
        }
        return t;
      });

      // TRIGGER: Propagate to categoryGroupings, preserving all assigned categories
      const nextCategoryGroupings = propagateAawPacketIdToCategoryGroupings(
        prev.categoryGroupings,
        oldPktId,
        newValue,
        prev.name
      );

      // Synchronize active category SKU selection
      if (selectedSkuForCategory) {
        if (selectedSkuForCategory === oldPktId) {
          setSelectedSkuForCategory(newValue);
        } else if (selectedSkuForCategory.startsWith(`${oldPktId}-`)) {
          const suffix = selectedSkuForCategory.substring(oldPktId.length);
          setSelectedSkuForCategory(newValue ? `${newValue}${suffix}` : '');
        }
      }

      const termAmounts = Array.from(new Set(nextTerms.map(t => String(t.duration?.amount))));
      const termSkus = nextTerms.map(t => t.sku).filter(Boolean);

      const nextChars = (prev.characteristics || []).map(ch => {
        const n = (ch.name || '').toLowerCase();
        if (n === 'psm_aaw_packet_id' || n === 'psmaawpacketid' || n === 'psm_packet_id') {
          return {
            ...ch,
            isArray: true,
            values: currentList,
            value: currentList.join(', ')
          };
        }
        if (n === 'sku') {
          return {
            ...ch,
            isArray: true,
            values: termSkus.length > 0 ? termSkus : [''],
            value: termSkus.join(', ')
          };
        }
        if (n === 'minimum_contract_duration') {
          return {
            ...ch,
            values: termAmounts,
            value: termAmounts.join(', ')
          };
        }
        return ch;
      });

      return {
        ...prev,
        psmAawPacketIds: currentList,
        ccbMasterPacketId: nextMaster,
        terms: nextTerms,
        categoryGroupings: nextCategoryGroupings,
        characteristics: nextChars
      };
    });
  };

  const handleRemovePsmAawPacketId = (packetIdToRemove) => {
    setFormData(prev => {
      const currentList = prev.psmAawPacketIds || (prev.ccbMasterPacketId ? [prev.ccbMasterPacketId] : []);
      if (currentList.length <= 1) {
        alert('At least one PSM AAW Paket ID is required on a Sales Package.');
        return prev;
      }

      const nextPacketIds = currentList.filter(p => p !== packetIdToRemove);
      let nextTerms = (prev.terms || []).filter(t => t.packetId !== packetIdToRemove && !String(t.sku || '').startsWith(packetIdToRemove));
      if (nextTerms.length === 0) {
        const fallbackPacket = nextPacketIds[0];
        nextTerms = [
          {
            id: `term_${fallbackPacket}_24`,
            packetId: fallbackPacket,
            name: 'minimum_contract_duration',
            description: '24 Months Commitment',
            duration: { amount: 24, units: 'Month' },
            sku: `${fallbackPacket}-24`,
            isDefault: true
          }
        ];
      } else if (!nextTerms.some(t => t.isDefault)) {
        nextTerms[0].isDefault = true;
      }

      const nextMaster = prev.ccbMasterPacketId === packetIdToRemove ? nextPacketIds[0] : prev.ccbMasterPacketId;
      const termAmounts = Array.from(new Set(nextTerms.map(t => String(t.duration?.amount))));
      const termSkus = nextTerms.map(t => t.sku).filter(Boolean);

      const nextChars = (prev.characteristics || []).map(ch => {
        const n = (ch.name || '').toLowerCase();
        if (n === 'psm_aaw_packet_id' || n === 'psmaawpacketid' || n === 'psm_packet_id') {
          return {
            ...ch,
            isArray: true,
            values: nextPacketIds,
            value: nextPacketIds.join(', ')
          };
        }
        if (n === 'sku') {
          return {
            ...ch,
            values: termSkus.length > 0 ? termSkus : [''],
            value: termSkus.join(', ')
          };
        }
        if (n === 'minimum_contract_duration') {
          return {
            ...ch,
            values: termAmounts,
            value: termAmounts.join(', ')
          };
        }
        return ch;
      });

      // Filter out category groupings referencing removed SKUs
      const nextCategoryGroupings = (prev.categoryGroupings || []).filter(cg => !String(cg.sku || '').startsWith(packetIdToRemove) && cg.sku !== packetIdToRemove);

      return {
        ...prev,
        psmAawPacketIds: nextPacketIds,
        ccbMasterPacketId: nextMaster,
        terms: nextTerms,
        categoryGroupings: nextCategoryGroupings,
        characteristics: nextChars
      };
    });
  };

  const handleBandwidthOfferSelect = (offerId) => {
    if (!offerId) {
      setFormData(prev => ({
        ...prev,
        selectedBandwidthOfferId: '',
        bandwidthOption: '',
        downstreamSpeed: null,
        upstreamSpeed: null,
        ccbBandwidthSku: '',
        fallbackBandwidths: []
      }));
      return;
    }
    const offer = bandwidthOptionOffers.find(o => o.id === offerId);
    if (!offer) return;
    const down = offer.speeds?.down || 250;
    const up = offer.speeds?.up || (down >= 1000 ? 200 : down >= 500 ? 100 : down >= 250 ? 50 : down >= 100 ? 40 : 10);

    setFormData(prev => {
      const nextChars = (prev.characteristics || []).map(ch => {
        const n = (ch.name || '').toLowerCase();
        if (n === 'downstream_bandwidth' || n === 'bandwidth_downstream_max') {
          return { ...ch, values: [String(down)], value: String(down) };
        }
        if (n === 'upstream_bandwidth' || n === 'bandwidth_upstream_max') {
          return { ...ch, values: [String(up)], value: String(up) };
        }
        if (n === 'bandwidth') {
          return { ...ch, values: [offer.name], value: offer.name };
        }
        return ch;
      });

      const term = prev.minContractTermMonths || 24;
      const realBw = offer.realBandwidth || offer.serviceCode;
      const nextPops = (prev.bundledPops || []).map(p => {
        const variant = p.connectionVariant || 'basic';
        const pt = p.playType || '2';
        const newId = `pop_pkg_${down}_bundle_mcd${term}_pt${pt}_${variant}_${down}_v2`;
        return {
          ...p,
          speed: down,
          id: newId,
          name: newId,
          ...(realBw ? {
            svcBw: realBw,
            serviceInternetNgn: p.hasNgn ? `V0017, ${realBw}` : p.serviceInternetNgn,
            serviceInternetBitstream: `V0017, ${realBw}`
          } : {})
        };
      });

      if (nextPops.length > 0) {
        setSelectedPopId(nextPops[0].id);
      }

      const stdFallbacks = (prev.technology === 'DSL' || prev.isBitstreamSupported)
        ? getStandardFallbackTiers(down)
        : (prev.fallbackBandwidths || []).filter(s => s < down);

      return {
        ...prev,
        selectedBandwidthOfferId: offer.id,
        bandwidthOption: offer.name,
        downstreamSpeed: down,
        upstreamSpeed: up,
        fallbackBandwidths: stdFallbacks,
        ccbBandwidthSku: offer.realBandwidth || offer.serviceCode || offer.sku || `BW_${down}_${up}`,
        bundledPops: nextPops,
        characteristics: nextChars
      };
    });
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => {
      const updates = { [field]: value };
      if (field === 'ccbMasterPacketId') {
        const cleanPacket = String(value || '').split('-')[0].trim();
        // Automatically update all Contract Term SKU values based on the new CCB Master Packet ID
        const nextTerms = (prev.terms || []).map(t => {
          const dur = t.duration?.amount || 24;
          return {
            ...t,
            sku: cleanPacket ? `${cleanPacket}-${dur}` : ''
          };
        });
        updates.terms = nextTerms;

        if (cleanPacket) {
          updates.categoryGroupings = (prev.categoryGroupings || []).map(cg => {
            const durMatch = String(cg.sku || '').match(/-(\d+)$/);
            if (durMatch) {
              const dur = durMatch[1];
              const newSku = `${cleanPacket}-${dur}`;
              return {
                ...cg,
                sku: newSku,
                name: `${prev.name} (${newSku})`,
                prodSpecCharValueUse: [
                  {
                    name: 'sku',
                    productSpecCharacteristicValue: [{ value: newSku }]
                  }
                ]
              };
            }
            return cg;
          });
        }

        const termSkus = nextTerms.map(t => t.sku).filter(Boolean);
        const nextChars = (prev.characteristics || []).map(ch => {
          const n = (ch.name || '').toLowerCase();
          if (n === 'psm_aaw_packet_id' || n === 'psmaawpacketid' || n === 'psm_packet_id') {
            return {
              ...ch,
              value: cleanPacket,
              values: ch.isArray ? (cleanPacket ? [cleanPacket] : ['']) : [cleanPacket]
            };
          }
          if (n === 'sku') {
            return {
              ...ch,
              values: termSkus.length > 0 ? termSkus : [''],
              value: termSkus.join(', ')
            };
          }
          return ch;
        });
        updates.characteristics = nextChars;
      }

      if (field === 'productCodeNgn' || field === 'isNgnSupported') {
        const nextNgnCode = field === 'productCodeNgn' ? value : prev.productCodeNgn;
        const nextNgnSupported = field === 'isNgnSupported' ? value : prev.isNgnSupported;
        let charFound = false;
        let nextChars = (updates.characteristics || prev.characteristics || []).map(ch => {
          if ((ch.name || '').toLowerCase() === 'product_code_internet_ngn') {
            charFound = true;
            return {
              ...ch,
              values: nextNgnSupported && nextNgnCode ? [nextNgnCode] : [''],
              value: nextNgnSupported && nextNgnCode ? nextNgnCode : ''
            };
          }
          return ch;
        });
        if (!charFound && nextNgnSupported && nextNgnCode) {
          nextChars.push({
            id: 'product_code_internet_ngn',
            name: 'product_code_internet_ngn',
            isArray: true,
            minCardinality: 0,
            maxCardinality: 99,
            valueType: 'string',
            values: [nextNgnCode],
            value: nextNgnCode
          });
        }
        updates.characteristics = nextChars;
      }

      if (field === 'productCodeBitstream' || field === 'isBitstreamSupported') {
        const nextBsCode = field === 'productCodeBitstream' ? value : prev.productCodeBitstream;
        const nextBsSupported = field === 'isBitstreamSupported' ? value : prev.isBitstreamSupported;
        let charFound = false;
        let nextChars = (updates.characteristics || prev.characteristics || []).map(ch => {
          if ((ch.name || '').toLowerCase() === 'product_code_internet_bitstream') {
            charFound = true;
            return {
              ...ch,
              values: nextBsSupported && nextBsCode ? [nextBsCode] : [''],
              value: nextBsSupported && nextBsCode ? nextBsCode : ''
            };
          }
          return ch;
        });
        if (!charFound && nextBsSupported && nextBsCode) {
          nextChars.push({
            id: 'product_code_internet_bitstream',
            name: 'product_code_internet_bitstream',
            isArray: true,
            minCardinality: 0,
            maxCardinality: 99,
            valueType: 'string',
            values: [nextBsCode],
            value: nextBsCode
          });
        }
        updates.characteristics = nextChars;
      }

      if (
        field === 'voiceProductCodeNgn' ||
        field === 'isVoiceNgnSupported' ||
        field === 'voiceProductCodeBitstream' ||
        field === 'isVoiceBitstreamSupported'
      ) {
        const nextVoiceNgnCode = field === 'voiceProductCodeNgn' ? value : (prev.voiceProductCodeNgn ?? 'VI204');
        const nextVoiceNgnSupported = field === 'isVoiceNgnSupported' ? value : (prev.isVoiceNgnSupported ?? true);
        const nextVoiceBsCode = field === 'voiceProductCodeBitstream' ? value : (prev.voiceProductCodeBitstream ?? 'VI203');
        const nextVoiceBsSupported = field === 'isVoiceBitstreamSupported' ? value : (prev.isVoiceBitstreamSupported ?? true);

        const activeVoiceCodes = [
          nextVoiceNgnSupported && nextVoiceNgnCode ? String(nextVoiceNgnCode).trim() : '',
          nextVoiceBsSupported && nextVoiceBsCode ? String(nextVoiceBsCode).trim() : ''
        ].filter(Boolean);

        const syncChar = (chars, charName, vals) => {
          let found = false;
          const mapped = chars.map(ch => {
            if ((ch.name || '').toLowerCase() === charName) {
              found = true;
              return {
                ...ch,
                values: vals.length > 0 ? vals : [''],
                value: vals[0] || ''
              };
            }
            return ch;
          });
          if (!found && vals.length > 0) {
            mapped.push({
              id: charName,
              name: charName,
              isArray: true,
              minCardinality: 0,
              maxCardinality: 99,
              valueType: 'string',
              values: vals,
              value: vals[0]
            });
          }
          return mapped;
        };

        let nextChars = updates.characteristics || prev.characteristics || [];
        nextChars = syncChar(nextChars, 'product_code_voice_ngn', nextVoiceNgnSupported && nextVoiceNgnCode ? [String(nextVoiceNgnCode).trim()] : []);
        nextChars = syncChar(nextChars, 'product_code_voice_bitstream', nextVoiceBsSupported && nextVoiceBsCode ? [String(nextVoiceBsCode).trim()] : []);
        nextChars = syncChar(nextChars, 'product_code_voice', activeVoiceCodes);
        updates.characteristics = nextChars;
      }

      if (field === 'portfolio_id') {
        const cleanVal = String(value || '').trim();
        let portFound = false;
        let nextDirect;
        if (!cleanVal) {
          nextDirect = (prev.productOfferingCharacteristic || []).filter(ch => (ch.name || '').toLowerCase() !== 'portfolio_id');
        } else {
          nextDirect = (prev.productOfferingCharacteristic || []).map(ch => {
            if ((ch.name || '').toLowerCase() === 'portfolio_id') {
              portFound = true;
              return {
                ...ch,
                id: ch.id || 'portfolio_id',
                name: 'portfolio_id',
                valueType: 'string',
                "@type": 'ProductOfferingCharacteristic',
                configurable: false,
                isArray: false,
                value: cleanVal,
                values: [cleanVal],
                productOfferingCharacteristicValue: [{ value: cleanVal, isDefault: true }]
              };
            }
            return ch;
          });
          if (!portFound) {
            nextDirect.unshift({
              id: 'portfolio_id',
              name: 'portfolio_id',
              valueType: 'string',
              "@type": 'ProductOfferingCharacteristic',
              configurable: false,
              isArray: false,
              value: cleanVal,
              values: [cleanVal],
              productOfferingCharacteristicValue: [{ value: cleanVal, isDefault: true }]
            });
          }
        }
        updates.portfolio_id = cleanVal;
        updates.productOfferingCharacteristic = nextDirect;
      }

      if (field === 'template_name') {
        const cleanVal = String(value || '').trim();
        let tplFound = false;
        let nextDirect;
        if (!cleanVal) {
          nextDirect = (prev.productOfferingCharacteristic || []).filter(ch => (ch.name || '').toLowerCase() !== 'template_name');
        } else {
          nextDirect = (prev.productOfferingCharacteristic || []).map(ch => {
            if ((ch.name || '').toLowerCase() === 'template_name') {
              tplFound = true;
              return {
                ...ch,
                id: ch.id || 'template_name',
                name: 'template_name',
                valueType: 'string',
                "@type": 'ProductOfferingCharacteristic',
                configurable: false,
                isArray: false,
                value: cleanVal,
                values: [cleanVal],
                productOfferingCharacteristicValue: [{ value: cleanVal, isDefault: true }]
              };
            }
            return ch;
          });
          if (!tplFound) {
            nextDirect.unshift({
              id: 'template_name',
              name: 'template_name',
              valueType: 'string',
              "@type": 'ProductOfferingCharacteristic',
              configurable: false,
              isArray: false,
              value: cleanVal,
              values: [cleanVal],
              productOfferingCharacteristicValue: [{ value: cleanVal, isDefault: true }]
            });
          }
        }
        updates.template_name = cleanVal;
        updates.productOfferingCharacteristic = nextDirect;
      }

      if (field === 'name') {
        const oldName = prev.name;
        const nextChars = (updates.characteristics || prev.characteristics || []).map(ch => {
          const n = (ch.name || '').toLowerCase().replace(/[_\s-]+/g, '');
          if (n.startsWith('displayname')) {
            const curVal = ch.values?.[0] || ch.value || '';
            if (!curVal || curVal === oldName) {
              return {
                ...ch,
                value,
                values: [value]
              };
            }
          }
          return ch;
        });
        updates.characteristics = nextChars;
      }

      return { ...prev, ...updates };
    });
  };

  // Helper to identify characteristics starting with "display name"
  const isDisplayNameChar = (charName = '') => {
    const normalized = (charName || '').toLowerCase().replace(/[_\s-]+/g, '');
    return normalized.startsWith('displayname');
  };

  // Get all characteristics starting with "display name", ensuring standard ones exist
  const displayNameCharacteristics = useMemo(() => {
    const existing = (formData.characteristics || []).filter(c => isDisplayNameChar(c.name || ''));

    const hasCart = existing.some(c => (c.name || '').toLowerCase().replace(/[_\s-]+/g, '') === 'displaynamecart');
    const hasConfigurator = existing.some(c => (c.name || '').toLowerCase().replace(/[_\s-]+/g, '') === 'displaynameconfigurator');

    const result = [...existing];
    if (!hasCart) {
      result.push({
        id: 'DisplayNameCart',
        name: 'DisplayNameCart',
        valueType: 'string',
        isArray: false,
        value: formData.name || '',
        values: [formData.name || ''],
        description: 'Display name rendered in shopping cart summary'
      });
    }
    if (!hasConfigurator) {
      result.push({
        id: 'DisplayNameConfigurator',
        name: 'DisplayNameConfigurator',
        valueType: 'string',
        isArray: false,
        value: formData.name || '',
        values: [formData.name || ''],
        description: 'Display name rendered in web shop configurator step'
      });
    }

    return result;
  }, [formData.characteristics, formData.name]);

  const handleUpdateDisplayNameChar = (charName, nextVal) => {
    setFormData(prev => {
      let found = false;
      const nextChars = (prev.characteristics || []).map(ch => {
        if ((ch.name || '').toLowerCase() === charName.toLowerCase() || ch.id === charName) {
          found = true;
          return {
            ...ch,
            value: nextVal,
            values: [nextVal]
          };
        }
        return ch;
      });

      if (!found) {
        nextChars.push({
          id: charName,
          name: charName,
          valueType: 'string',
          isArray: false,
          value: nextVal,
          values: [nextVal],
          description: charName.toLowerCase().includes('cart')
            ? 'Display name rendered in shopping cart summary'
            : charName.toLowerCase().includes('config')
              ? 'Display name rendered in web shop configurator step'
              : 'Display name characteristic'
        });
      }

      return {
        ...prev,
        characteristics: nextChars
      };
    });
  };

  const formatCharLabel = (name) => {
    if (name === 'DisplayNameCart') return 'Display Name (Cart) :';
    if (name === 'DisplayNameConfigurator') return 'Display Name (Configurator) :';
    if (name.startsWith('DisplayName')) {
      return `Display Name (${name.replace('DisplayName', '')}) :`;
    }
    if (name.startsWith('display_name_')) {
      return `Display Name (${name.replace('display_name_', '')}) :`;
    }
    return `${name} :`;
  };

  const handleCharacteristicChange = (id, field, value) => {
    setFormData(prev => {
      const nextChars = (prev.characteristics || []).map(ch => {
        if (ch.id === id) {
          const updated = { ...ch, [field]: value };
          // If the characteristic name changes, re-align with the definition for the new name
          if (field === 'name') {
            const def = getCharDefinition(value, prev.specificationId, ch);
            if (def && def.hasDef) {
              updated.isArray = def.isArray;
              updated.minCardinality = def.minCardinality;
              updated.maxCardinality = def.maxCardinality;
              updated.valueType = def.valueType;
              if (!def.isArray && (updated.values || []).length > 1) {
                updated.values = [updated.values[0] || ''];
                updated.value = updated.values[0];
              }
            }
          }
          return updated;
        }
        return ch;
      });

      const updates = { characteristics: nextChars };
      const changedChar = nextChars.find(c => c.id === id);
      if (changedChar && (changedChar.name === 'psm_aaw_packet_id' || changedChar.name === 'psmAawPacketId')) {
        const cleanPacket = String(value || '').split('-')[0].trim();
        const oldPacket = prev.ccbMasterPacketId || prev.psmAawPacketIds?.[0] || '';
        updates.ccbMasterPacketId = cleanPacket;
        updates.categoryGroupings = propagateAawPacketIdToCategoryGroupings(
          prev.categoryGroupings,
          oldPacket,
          cleanPacket,
          prev.name
        );
        // Also auto-update Contract Term SKUs when psm_aaw_packet_id characteristic is edited directly
        const nextTerms = (prev.terms || []).map(t => {
          const dur = t.duration?.amount || 24;
          return {
            ...t,
            sku: cleanPacket ? `${cleanPacket}-${dur}` : ''
          };
        });
        updates.terms = nextTerms;
        const termSkus = nextTerms.map(t => t.sku).filter(Boolean);
        updates.characteristics = nextChars.map(ch => {
          if ((ch.name || '').toLowerCase() === 'sku') {
            return {
              ...ch,
              values: termSkus.length > 0 ? termSkus : [''],
              value: termSkus.join(', ')
            };
          }
          return ch;
        });
      }
      return { ...prev, ...updates };
    });
  };

  const handleArrayValueChange = (charId, valueIndex, newValue) => {
    setFormData(prev => {
      const nextChars = (prev.characteristics || []).map(ch => {
        if (ch.id === charId) {
          const nextVals = [...(ch.values || [''])];
          nextVals[valueIndex] = newValue;
          return {
            ...ch,
            values: nextVals,
            value: nextVals.join(', ')
          };
        }
        return ch;
      });

      const updates = { characteristics: nextChars };
      const changed = nextChars.find(c => c.id === charId);
      if (changed && (changed.name === 'psm_aaw_packet_id' || changed.name === 'psmAawPacketId')) {
        const oldChar = prev.characteristics.find(c => c.id === charId);
        const oldVal = oldChar?.values?.[valueIndex] || '';
        const cleanOld = oldVal ? oldVal.split('-')[0].trim() : '';
        const cleanNew = newValue ? newValue.split('-')[0].trim() : '';
        if (cleanOld && cleanNew && cleanOld !== cleanNew) {
          updates.categoryGroupings = propagateAawPacketIdToCategoryGroupings(
            prev.categoryGroupings,
            cleanOld,
            cleanNew,
            prev.name
          );
        }
        const primary = (changed.values || []).find(v => v && String(v).startsWith('R025.')) || changed.values?.[0] || '';
        const cleanPacket = primary ? primary.split('-')[0].trim() : '';
        if (cleanPacket) {
          updates.ccbMasterPacketId = cleanPacket;
          const nextTerms = (prev.terms || []).map(t => {
            const dur = t.duration?.amount || 24;
            return {
              ...t,
              sku: `${cleanPacket}-${dur}`
            };
          });
          updates.terms = nextTerms;
          const termSkus = nextTerms.map(t => t.sku).filter(Boolean);
          updates.characteristics = nextChars.map(ch => {
            if ((ch.name || '').toLowerCase() === 'sku') {
              return {
                ...ch,
                values: termSkus.length > 0 ? termSkus : [''],
                value: termSkus.join(', ')
              };
            }
            return ch;
          });
        }
      }
      return { ...prev, ...updates };
    });
  };

  const handleAddArrayValue = (charId) => {
    setFormData(prev => {
      const nextChars = (prev.characteristics || []).map(ch => {
        if (ch.id === charId) {
          // Check maxCardinality
          if (ch.maxCardinality !== undefined && ch.maxCardinality !== '*' && typeof ch.maxCardinality === 'number') {
            if ((ch.values || []).length >= ch.maxCardinality) {
              alert(`Maximum cardinality (${ch.maxCardinality}) reached for ${ch.name}`);
              return ch;
            }
          }
          const nextVals = [...(ch.values || []), ''];
          return {
            ...ch,
            isArray: true,
            values: nextVals,
            value: nextVals.join(', ')
          };
        }
        return ch;
      });
      return { ...prev, characteristics: nextChars };
    });
  };

  const handleRemoveArrayValue = (charId, valueIndex) => {
    setFormData(prev => {
      const nextChars = (prev.characteristics || []).map(ch => {
        if (ch.id === charId) {
          const nextVals = (ch.values || []).filter((_, idx) => idx !== valueIndex);
          const finalVals = nextVals.length > 0 ? nextVals : [''];
          return {
            ...ch,
            values: finalVals,
            value: finalVals.join(', ')
          };
        }
        return ch;
      });
      return { ...prev, characteristics: nextChars };
    });
  };

  const handleToggleArrayType = (charId) => {
    setFormData(prev => {
      const nextChars = (prev.characteristics || []).map(ch => {
        if (ch.id === charId) {
          const nextIsArray = !ch.isArray;
          return {
            ...ch,
            isArray: nextIsArray,
            values: ch.values && ch.values.length > 0 ? ch.values : ['']
          };
        }
        return ch;
      });
      return { ...prev, characteristics: nextChars };
    });
  };

  const handleDeleteCharacteristic = (id) => {
    setFormData(prev => ({
      ...prev,
      characteristics: (prev.characteristics || []).filter(c => c.id !== id)
    }));
  };

  // ─── Direct Offering Characteristics Handlers ───
  const generateDirectCharUuid = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
          const r = (Math.random() * 16) | 0;
          return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        });

  const handleAddDirectChar = () => {
    setFormData(prev => {
      const newId = generateDirectCharUuid();
      const newChar = {
        id: newId,
        isUnique: false,
        maxCardinality: 1,
        minCardinality: 0,
        name: '',
        valueType: 'string',
        characteristicType: 'Simple Value',
        value: '',
        values: [''],
        isArray: false,
        productOfferingCharacteristicValue: [
          {
            value: '',
            valueType: 'string',
            isDefault: false,
            unitOfMeasure: ''
          }
        ],
        configurable: true,
        extensible: false,
        '@type': 'ProductOfferingPriceCharacteristic'
      };
      return {
        ...prev,
        productOfferingCharacteristic: [...(prev.productOfferingCharacteristic || []), newChar]
      };
    });
  };

  const handleDeleteDirectChar = (idOrIdx) => {
    setFormData(prev => {
      const nextDirect = (prev.productOfferingCharacteristic || []).filter((c, idx) => c.id !== idOrIdx && idx !== idOrIdx);
      const updates = { productOfferingCharacteristic: nextDirect };
      const deletedChar = (prev.productOfferingCharacteristic || []).find((c, idx) => c.id === idOrIdx || idx === idOrIdx);
      if (deletedChar && (deletedChar.name || '').toLowerCase() === 'portfolio_id') {
        updates.portfolio_id = '';
      }
      return { ...prev, ...updates };
    });
  };

  const handleUpdateDirectChar = (idOrIdx, field, value) => {
    setFormData(prev => {
      let updatedPortfolioId = prev.portfolio_id;
      const nextDirect = (prev.productOfferingCharacteristic || []).map((ch, idx) => {
        if (ch.id === idOrIdx || idx === idOrIdx) {
          const updated = { ...ch, [field]: value };
          if (field === 'name' && value.toLowerCase() === 'portfolio_id') {
            updatedPortfolioId = updated.values?.[0] || updated.value || '';
          } else if (field === 'value') {
            if ((ch.name || '').toLowerCase() === 'portfolio_id') {
              updatedPortfolioId = value;
            }
            const prevFirst = ch.productOfferingCharacteristicValue?.[0] || {};
            updated.values = [value];
            updated.productOfferingCharacteristicValue = [
              {
                value,
                valueType: prevFirst.valueType || ch.valueType || 'string',
                isDefault: prevFirst.isDefault ?? false,
                ...(prevFirst.unitOfMeasure ? { unitOfMeasure: prevFirst.unitOfMeasure } : {})
              }
            ];
          } else if (field === 'valueType' && Array.isArray(ch.productOfferingCharacteristicValue)) {
            updated.productOfferingCharacteristicValue = ch.productOfferingCharacteristicValue.map(v => ({
              ...v,
              valueType: value
            }));
          }
          return updated;
        }
        return ch;
      });
      return {
        ...prev,
        portfolio_id: updatedPortfolioId,
        productOfferingCharacteristic: nextDirect
      };
    });
  };

  const handleDirectArrayValueChange = (idOrIdx, valueIndex, newValue) => {
    setFormData(prev => {
      let updatedPortfolioId = prev.portfolio_id;
      const nextDirect = (prev.productOfferingCharacteristic || []).map((ch, idx) => {
        if (ch.id === idOrIdx || idx === idOrIdx) {
          const nextVals = [...(ch.values || [''])];
          nextVals[valueIndex] = newValue;
          if ((ch.name || '').toLowerCase() === 'portfolio_id' && valueIndex === 0) {
            updatedPortfolioId = newValue;
          }
          const existingPocv = Array.isArray(ch.productOfferingCharacteristicValue) ? ch.productOfferingCharacteristicValue : [];
          const nextPocv = nextVals.map((v, i) => ({
            value: v,
            valueType: existingPocv[i]?.valueType || ch.valueType || 'string',
            isDefault: existingPocv[i]?.isDefault ?? false,
            ...(existingPocv[i]?.unitOfMeasure ? { unitOfMeasure: existingPocv[i].unitOfMeasure } : {})
          }));
          return {
            ...ch,
            values: nextVals,
            value: nextVals.join(', '),
            productOfferingCharacteristicValue: nextPocv
          };
        }
        return ch;
      });
      return {
        ...prev,
        portfolio_id: updatedPortfolioId,
        productOfferingCharacteristic: nextDirect
      };
    });
  };

  const handleAddDirectArrayValue = (idOrIdx) => {
    setFormData(prev => {
      const nextDirect = (prev.productOfferingCharacteristic || []).map((ch, idx) => {
        if (ch.id === idOrIdx || idx === idOrIdx) {
          const nextVals = [...(ch.values || []), ''];
          return {
            ...ch,
            isArray: true,
            values: nextVals,
            value: nextVals.join(', ')
          };
        }
        return ch;
      });
      return { ...prev, productOfferingCharacteristic: nextDirect };
    });
  };

  const handleRemoveDirectArrayValue = (idOrIdx, valueIndex) => {
    setFormData(prev => {
      const nextDirect = (prev.productOfferingCharacteristic || []).map((ch, idx) => {
        if (ch.id === idOrIdx || idx === idOrIdx) {
          const nextVals = (ch.values || []).filter((_, i) => i !== valueIndex);
          const finalVals = nextVals.length > 0 ? nextVals : [''];
          return {
            ...ch,
            values: finalVals,
            value: finalVals.join(', ')
          };
        }
        return ch;
      });
      return { ...prev, productOfferingCharacteristic: nextDirect };
    });
  };

  const handleToggleDirectArrayType = (idOrIdx) => {
    setFormData(prev => {
      const nextDirect = (prev.productOfferingCharacteristic || []).map((ch, idx) => {
        if (ch.id === idOrIdx || idx === idOrIdx) {
          const nextIsArray = !ch.isArray;
          return {
            ...ch,
            isArray: nextIsArray,
            values: ch.values && ch.values.length > 0 ? ch.values : ['']
          };
        }
        return ch;
      });
      return { ...prev, productOfferingCharacteristic: nextDirect };
    });
  };

  // Filtered characteristics for search
  const filteredCharacteristics = useMemo(() => {
    const list = formData.characteristics || [];
    if (!charFilterQuery.trim()) return list;
    const q = charFilterQuery.toLowerCase();
    return list.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.value || '').toLowerCase().includes(q) ||
      (c.values || []).some(v => String(v).toLowerCase().includes(q))
    );
  }, [formData.characteristics, charFilterQuery]);

  // Currently selected bandwidth offer definition
  const selectedBandwidthOffer = useMemo(() => {
    if (!formData.selectedBandwidthOfferId) return null;
    return bandwidthOptionOffers.find(o => o.id === formData.selectedBandwidthOfferId) ||
           bandwidthOptionOffers.find(o => o.id === formData.selectedBandwidthOfferId.replace(/_FN_Options_Bandwidth$/, '-generic_FN_Options_Bandwidth')) ||
           null;
  }, [bandwidthOptionOffers, formData.selectedBandwidthOfferId]);

  // Bundled POP Assembly Computations (TMF620 Multi-POP Decomposition)
  const activePop = useMemo(() => {
    const pops = formData.bundledPops || [];
    if (pops.length === 0) return null;
    return pops.find(p => p.id === selectedPopId) || pops[0] || null;
  }, [formData.bundledPops, selectedPopId]);

  const bundledPopId = activePop ? activePop.id : '';

  const popComponentsSum = useMemo(() => {
    if (!activePop) return 0;
    const bw = Number(activePop.popBandwidthAmount) || 0;
    const inAmt = Number(activePop.popInternetAmount !== undefined ? activePop.popInternetAmount : 14.00);
    const va = Number(activePop.popVoiceAccessAmount !== undefined ? activePop.popVoiceAccessAmount : (activePop.connectionVariant === 'comfort' ? 19.99 : 15.99));
    const vt = Number(activePop.popVoiceTariffAmount !== undefined ? activePop.popVoiceTariffAmount : (activePop.playType === '1' ? 0.00 : 5.00));
    return Number((bw + inAmt + va + vt).toFixed(2));
  }, [activePop]);

  const isSumBalanced = useMemo(() => {
    if (!activePop) return true;
    return Math.abs(popComponentsSum - Number(activePop.price || 0)) < 0.01;
  }, [popComponentsSum, activePop]);

  const handleSelectPop = (popId) => {
    setSelectedPopId(popId);
  };

  const syncPopCharacteristics = (pops, prevCharacteristics = []) => {
    return syncPsmCharacteristics(pops, prevCharacteristics, {
      hasNgn: !!formData.isNgnSupported,
      hasBitstream: !!formData.isBitstreamSupported
    });
  };

  const handleUpdatePopField = (popId, field, value) => {
    setFormData(prev => {
      let nextSelectedId = selectedPopId || prev.selectedPopId;
      const nextPops = (prev.bundledPops || []).map(pop => {
        if (pop.id === popId) {
          const updated = { ...pop, [field]: value };
          // If variant, speed, or playType changes, update the POP ID and name
          if (field === 'connectionVariant' || field === 'speed' || field === 'playType') {
            const spd = field === 'speed' ? value : (pop.speed || prev.downstreamSpeed || 250);
            const variant = field === 'connectionVariant' ? value : (pop.connectionVariant || 'basic');
            const pt = field === 'playType' ? value : (pop.playType || '2');
            const term = prev.minContractTermMonths || 24;
            const pkgBase = (prev.code || prev.id || `pkg_${spd}`).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^(po_|pop_)/i, '').replace(/_v2$/i, '');
            const pkgCodeV2 = `${pkgBase}_v2`;
            const newId = `pop_${pkgCodeV2}_bundle_mcd${term}_pt${pt}_${variant}_${spd}`;
            updated.id = newId;
            updated.name = newId;
            if (popId === nextSelectedId) {
              nextSelectedId = newId;
            }
          }

          // Price update and component rebalancing
          if (field === 'price') {
            const numVal = parseFloat(value) || 0;
            updated.price = value;
            updated.totalPrice = numVal;
            const inPrice = Number(updated.popInternetAmount !== undefined ? updated.popInternetAmount : 14.00);
            const isComfort = (updated.connectionVariant || 'basic') === 'comfort';
            const isPlay1 = String(updated.playType || '2') === '1';
            const vaPrice = Number(updated.popVoiceAccessAmount !== undefined ? updated.popVoiceAccessAmount : (isPlay1 ? 0.00 : (isComfort ? 19.98 : 15.99)));
            const vtPrice = Number(updated.popVoiceTariffAmount !== undefined ? updated.popVoiceTariffAmount : (isPlay1 ? 0.00 : 5.00));
            updated.popBandwidthAmount = Math.max(0, Number((numVal - (inPrice + vaPrice + vtPrice)).toFixed(2)));
          }

          // Bandwidth Service ID / OSM code update
          if (field === 'bandwidthServiceId') {
            updated.bandwidthServiceId = value;
            updated.svcBw = value;
          }

          if (field === 'aawPacketId') {
            updated.aawPacketId = value;
            updated.packetId = value;
          }

          // Synchronize NGN packet code across sub-structures
          if (field === 'psmNgn' || field === 'psmInternetNgn' || field === 'psmVoiceNgn') {
            updated.psmNgn = value;
            updated.psmInternetNgn = value;
            updated.psmVoiceNgn = value;
            if (updated.ngn) {
              updated.ngn.salesPacketCode = value;
              if (updated.ngn.internet) updated.ngn.internet.packetCode = value;
              if (updated.ngn.voice) updated.ngn.voice.packetCode = value;
            }
          }

          // Synchronize Bitstream packet code across sub-structures
          if (field === 'psmBitstream' || field === 'psmInternetBitstream' || field === 'psmVoiceBitstream') {
            updated.psmBitstream = value;
            updated.psmInternetBitstream = value;
            updated.psmVoiceBitstream = value;
            if (updated.bitstream) {
              updated.bitstream.salesPacketCode = value;
              if (updated.bitstream.internet) updated.bitstream.internet.packetCode = value;
              if (updated.bitstream.voice) updated.bitstream.voice.packetCode = value;
            }
          }

          // Synchronize Internet tariff code across sub-structures
          if (field === 'tariffInternet' || field === 'tariffInternetNgn' || field === 'tariffInternetBitstream') {
            updated.tariffInternet = value;
            updated.tariffInternetNgn = value;
            updated.tariffInternetBitstream = value;
            if (updated.ngn?.internet) updated.ngn.internet.tariffCode = value;
            if (updated.bitstream?.internet) updated.bitstream.internet.tariffCode = value;
          }

          // Synchronize Voice tariff code across sub-structures
          if (field === 'tariffVoice' || field === 'tariffVoiceNgn' || field === 'tariffVoiceBitstream') {
            updated.tariffVoice = value;
            updated.tariffVoiceNgn = value;
            updated.tariffVoiceBitstream = value;
            if (updated.ngn?.voice) updated.ngn.voice.tariffCode = value;
            if (updated.bitstream?.voice) updated.bitstream.voice.tariffCode = value;
          }

          // If any atomic service code, speed, or variant changes, synchronize bundle service codes
          if (
            field === 'bandwidthServiceId' || field === 'svcBw' || field === 'svcIn' ||
            field === 'svcVaNgn' || field === 'svcVaBitstream' ||
            field === 'svcVt' || field === 'speed' || field === 'connectionVariant'
          ) {
            const spd = updated.speed || prev.downstreamSpeed || 250;
            const variant = updated.connectionVariant || 'basic';

            const curSvcIn = updated.svcIn !== undefined ? updated.svcIn : 'V0017';
            const curSvcBw = updated.svcBw !== undefined ? updated.svcBw : (spd >= 250 ? 'V018V' : spd >= 100 ? 'V018N' : spd >= 50 ? 'V018H' : 'V018C');
            const curSvcVt = updated.svcVt !== undefined ? updated.svcVt : 'V0017';
            const curSvcVaNgn = updated.svcVaNgn !== undefined ? updated.svcVaNgn : (variant === 'comfort' ? 'VI003' : 'VI002');
            const curSvcVaBs = updated.svcVaBitstream !== undefined ? updated.svcVaBitstream : (variant === 'comfort' ? 'VI006' : 'VI009');

            updated.svcIn = curSvcIn;
            updated.svcBw = curSvcBw;
            updated.svcVt = curSvcVt;
            updated.svcVaNgn = curSvcVaNgn;
            updated.svcVaBitstream = curSvcVaBs;

            updated.serviceInternetNgn = [curSvcIn, curSvcBw].filter(Boolean).join(', ');
            updated.serviceInternetBitstream = [curSvcIn, curSvcBw].filter(Boolean).join(', ');
            updated.serviceVoiceNgn = [curSvcVt, curSvcVaNgn].filter(Boolean).join(', ');
            updated.serviceVoiceBitstream = [curSvcVt, curSvcVaBs].filter(Boolean).join(', ');
          }

          return updated;
        }
        return pop;
      });

      const nextChars = syncPopCharacteristics(nextPops, prev.characteristics);

      if (nextSelectedId !== selectedPopId) {
        setSelectedPopId(nextSelectedId);
      }

      return {
        ...prev,
        bundledPops: nextPops,
        selectedPopId: nextSelectedId,
        standardPrice: nextPops[0]?.price ?? prev.standardPrice,
        characteristics: nextChars
      };
    });
  };

  const handleUpdateActivePopField = (field, value) => {
    if (activePop?.id) {
      handleUpdatePopField(activePop.id, field, value);
    }
  };

  const handleAddBundledPop = (customVariant = 'basic', customSpeed = null) => {
    setFormData(prev => {
      const spd = customSpeed || prev.downstreamSpeed || 250;
      const term = prev.minContractTermMonths || 24;
      const pt = prev.playType || '2';
      const variant = customVariant;
      const pkgBase = (prev.code || prev.id || `pkg_${spd}`).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^(po_|pop_)/i, '').replace(/_v2$/i, '');
      const pkgCodeV2 = `${pkgBase}_v2`;
      let newId = `pop_${pkgCodeV2}_bundle_mcd${term}_pt${pt}_${variant}_${spd}`;
      
      let counter = 1;
      while ((prev.bundledPops || []).some(p => p.id === newId)) {
        newId = `pop_${pkgCodeV2}_bundle_mcd${term}_pt${pt}_${variant}_${spd}_${counter}`;
        counter++;
      }

      const defaultTariffInt = applyV2Suffix(spd >= 250 ? 'IP077' : spd >= 100 ? 'IP076' : spd >= 50 ? 'IP074' : 'IP073');
      const defaultTariffVoice = applyV2Suffix(spd >= 250 ? 'VP077' : spd >= 100 ? 'VP076' : spd >= 50 ? 'VP074' : 'VP073');
      const defaultSvcBw = spd >= 250 ? 'V018V' : spd >= 100 ? 'V018N' : spd >= 50 ? 'V018H' : 'V018C';
      const defaultSvcIn = 'V0017';
      const defaultSvcVaNgn = variant === 'comfort' ? 'VI003' : 'VI002';
      const defaultSvcVaBitstream = variant === 'comfort' ? 'VI006' : 'VI009';
      const defaultSvcVt = 'V0017';

      const defaultSvcInt = `${defaultSvcIn}, ${defaultSvcBw}`;
      const defaultSvcVoiceNgn = `${defaultSvcVt}, ${defaultSvcVaNgn}`;
      const defaultSvcVoiceBitstream = `${defaultSvcVt}, ${defaultSvcVaBitstream}`;

      const newPop = {
        id: newId,
        name: newId,
        connectionVariant: variant,
        playType: pt,
        speed: spd,
        price: variant === 'comfort' ? 49.99 : 44.99,
        popBandwidthAmount: 10.00,
        popInternetAmount: 14.00,
        popVoiceAccessAmount: variant === 'comfort' ? 19.99 : 15.99,
        popVoiceTariffAmount: variant === 'comfort' ? 6.00 : 5.00,
        svcBw: defaultSvcBw,
        svcIn: defaultSvcIn,
        svcVaNgn: defaultSvcVaNgn,
        svcVaBitstream: defaultSvcVaBitstream,
        svcVt: defaultSvcVt,
        psmInternetNgn: '',
        tariffInternetNgn: defaultTariffInt,
        serviceInternetNgn: defaultSvcInt,
        psmVoiceNgn: '',
        tariffVoiceNgn: defaultTariffVoice,
        serviceVoiceNgn: defaultSvcVoiceNgn,
        psmInternetBitstream: '',
        tariffInternetBitstream: defaultTariffInt,
        serviceInternetBitstream: defaultSvcInt,
        psmVoiceBitstream: '',
        tariffVoiceBitstream: defaultTariffVoice,
        serviceVoiceBitstream: defaultSvcVoiceBitstream
      };

      const nextPops = [...(prev.bundledPops || []), newPop];
      setSelectedPopId(newId);
      const nextChars = syncPopCharacteristics(nextPops, prev.characteristics);

      return {
        ...prev,
        bundledPops: nextPops,
        selectedPopId: newId,
        standardPrice: nextPops.length === 1 ? newPop.price : prev.standardPrice,
        characteristics: nextChars
      };
    });
  };

  const handleGenerateFallbackPops = () => {
    const fallbacks = formData.fallbackBandwidths || [];
    if (fallbacks.length === 0) {
      alert('Please select at least one fallback bandwidth tier in the Technology tab first.');
      return;
    }

    setFormData(prev => {
      const existing = prev.bundledPops || [];
      const newPops = [...existing];
      const term = prev.minContractTermMonths || 24;
      const pt = prev.playType || '2';
      const stdPrice = prev.standardPrice || 34.99;
      const comfortPrice = prev.standardPrice ? Number((Number(prev.standardPrice) + 3.99).toFixed(2)) : 38.98;

      let addedCount = 0;

      fallbacks.forEach(spd => {
        ['basic', 'comfort'].forEach(variant => {
          const expectedId = `pop_pkg_${spd}_bundle_mcd${term}_pt${pt}_${variant}_${spd}`;
          const alreadyExists = newPops.some(p => p.id === expectedId || (p.speed === spd && p.connectionVariant === variant));
          if (!alreadyExists) {
            const isBitstreamOnly = spd === 3;
            const defaultTariffInt = applyV2Suffix(spd >= 250 ? 'IP077' : spd >= 100 ? 'IP076' : spd >= 50 ? 'IP074' : 'IP073');
            const defaultTariffVoice = applyV2Suffix(spd >= 250 ? 'VP077' : spd >= 100 ? 'VP076' : spd >= 50 ? 'VP074' : 'VP073');
            const tierObj = VODAFONE_DSL_FALLBACK_TIERS.find(t => t.speed === spd);
            const defaultSvcBw = tierObj?.svcBw || (spd >= 250 ? 'V018V' : spd >= 100 ? 'V018N' : spd >= 50 ? 'V018H' : 'V018C');
            const defaultSvcIn = 'V0017';
            const defaultSvcVaNgn = variant === 'comfort' ? 'VI003' : 'VI002';
            const defaultSvcVaBitstream = variant === 'comfort' ? 'VI006' : 'VI009';
            const defaultSvcVt = 'V0017';

            newPops.push({
              id: expectedId,
              name: expectedId,
              connectionVariant: variant,
              playType: pt,
              speed: spd,
              price: variant === 'comfort' ? comfortPrice : stdPrice,
              popBandwidthAmount: 0.00,
              popInternetAmount: 14.00,
              popVoiceAccessAmount: variant === 'comfort' ? 19.98 : 15.99,
              popVoiceTariffAmount: 5.00,
              svcBw: defaultSvcBw,
              svcIn: defaultSvcIn,
              svcVaNgn: isBitstreamOnly ? '-' : defaultSvcVaNgn,
              svcVaBitstream: defaultSvcVaBitstream,
              svcVt: defaultSvcVt,
              psmInternetNgn: isBitstreamOnly ? '-' : '',
              tariffInternetNgn: isBitstreamOnly ? '-' : defaultTariffInt,
              serviceInternetNgn: isBitstreamOnly ? '-' : `${defaultSvcIn}, ${defaultSvcBw}`,
              psmVoiceNgn: isBitstreamOnly ? '-' : '',
              tariffVoiceNgn: isBitstreamOnly ? '-' : defaultTariffVoice,
              serviceVoiceNgn: isBitstreamOnly ? '-' : `${defaultSvcVt}, ${defaultSvcVaNgn}`,
              psmInternetBitstream: '',
              tariffInternetBitstream: defaultTariffInt,
              serviceInternetBitstream: `${defaultSvcIn}, ${defaultSvcBw}`,
              psmVoiceBitstream: '',
              tariffVoiceBitstream: defaultTariffVoice,
              serviceVoiceBitstream: `${defaultSvcVt}, ${defaultSvcVaBitstream}`
            });
            addedCount++;
          }
        });
      });

      const nextChars = syncPopCharacteristics(newPops, prev.characteristics);

      return {
        ...prev,
        bundledPops: newPops,
        characteristics: nextChars
      };
    });
  };

  const handleDuplicateBundledPop = (popId) => {
    setFormData(prev => {
      const source = (prev.bundledPops || []).find(p => p.id === popId);
      if (!source) return prev;
      let newId = `${source.id}_copy`;
      let counter = 1;
      while ((prev.bundledPops || []).some(p => p.id === newId)) {
        newId = `${source.id}_copy${counter}`;
        counter++;
      }
      const newPop = {
        ...source,
        id: newId,
        name: newId
      };
      const nextPops = [...(prev.bundledPops || []), newPop];
      setSelectedPopId(newId);
      const nextChars = syncPopCharacteristics(nextPops, prev.characteristics);
      return {
        ...prev,
        bundledPops: nextPops,
        characteristics: nextChars
      };
    });
  };

  const handleDeleteBundledPop = (popId) => {
    setFormData(prev => {
      const nextPops = (prev.bundledPops || []).filter(p => p.id !== popId);
      const nextSelected = nextPops[0]?.id || '';
      setSelectedPopId(nextSelected);

      const nextChars = syncPopCharacteristics(nextPops, prev.characteristics);

      return {
        ...prev,
        bundledPops: nextPops,
        selectedPopId: nextSelected,
        standardPrice: nextPops[0]?.price ?? 0,
        characteristics: nextChars
      };
    });
  };

  // ─── Categories & Category Groupings Helpers ───
  const possibleSkus = useMemo(() => {
    const list = [];
    (formData.terms || []).forEach(t => {
      if (t.sku && !list.some(x => x.sku === t.sku)) {
        const pkt = t.packetId || t.sku.split('-')[0];
        list.push({
          sku: t.sku,
          packetId: pkt,
          label: `${t.sku} (${t.duration?.amount || 24}M · ${pkt})`,
          duration: t.duration?.amount || 24,
          isDefault: !!t.isDefault
        });
      }
    });

    (formData.psmAawPacketIds || (formData.ccbMasterPacketId ? [formData.ccbMasterPacketId] : [])).filter(Boolean).forEach(pktId => {
      if (!list.some(x => x.sku === pktId)) {
        list.push({
          sku: pktId,
          packetId: pktId,
          label: `${pktId} (PSM AAW Paket Id)`,
          duration: null,
          isDefault: false
        });
      }
    });

    (formData.categoryGroupings || []).forEach(cg => {
      const gSku = cg.sku;
      if (gSku && !list.some(x => x.sku === gSku)) {
        list.push({
          sku: gSku,
          label: `${gSku} (Configured Group)`,
          duration: null,
          isDefault: false
        });
      }
    });

    return list;
  }, [formData.terms, formData.psmAawPacketIds, formData.ccbMasterPacketId, formData.categoryGroupings]);

  const activeSelectedSku = useMemo(() => {
    if (selectedSkuForCategory && possibleSkus.some(s => s.sku === selectedSkuForCategory)) {
      return selectedSkuForCategory;
    }
    const defaultItem = possibleSkus.find(s => s.isDefault) || possibleSkus[0];
    return defaultItem ? defaultItem.sku : '';
  }, [selectedSkuForCategory, possibleSkus]);

  const filteredCategoriesCatalog = useMemo(() => {
    if (!categorySearchQuery.trim()) return categoriesCatalog;
    const q = categorySearchQuery.toLowerCase().trim();
    return categoriesCatalog.filter(c =>
      (c.id && c.id.toLowerCase().includes(q)) ||
      (c.name && c.name.toLowerCase().includes(q))
    );
  }, [categoriesCatalog, categorySearchQuery]);

  const recommendedCategories = useMemo(() => {
    const isFiber = formData.technology === 'FIBRE' || /glasfaser|ftth/i.test(formData.name);
    const techTarget = isFiber ? 'glasfaser' : 'dsl';
    return categoriesCatalog.filter(c => {
      const n = (c.name || '').toLowerCase();
      const id = (c.id || '').toLowerCase();
      return n.includes(techTarget) || id === (isFiber ? 'fn0553' : 'fn0552') || id === 'fn2' || n.includes('gui configuration');
    }).slice(0, 4);
  }, [categoriesCatalog, formData.technology, formData.name]);

  const handleAssociateCategoryToSku = (targetSku, categoryObj) => {
    if (!targetSku || !categoryObj) return;

    setFormData(prev => {
      const existingGroupings = [...(prev.categoryGroupings || [])];
      const groupIdx = existingGroupings.findIndex(g => g.sku === targetSku);

      if (groupIdx >= 0) {
        const currentCats = [...(existingGroupings[groupIdx].category || [])];
        if (!currentCats.some(c => c.id === categoryObj.id)) {
          const catId = categoryObj.id;
          const catVer = categoryObj.version ? String(categoryObj.version) : '1';
          currentCats.push({
            id: catId,
            name: categoryObj.name || catId,
            version: catVer,
            href: categoryObj.href || `/api/productCatalogManagement/v4/category/${catId}:(version=${catVer})`
          });
        }
        existingGroupings[groupIdx] = {
          ...existingGroupings[groupIdx],
          category: currentCats
        };
      } else {
        const catId = categoryObj.id;
        const catVer = categoryObj.version ? String(categoryObj.version) : '1';
        existingGroupings.push({
          id: `cg_${targetSku.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
          name: `${prev.name} (${targetSku})`,
          sku: targetSku,
          prodSpecCharValueUse: [
            {
              name: 'sku',
              productSpecCharacteristicValue: [{ value: targetSku }]
            }
          ],
          category: [
            {
              id: catId,
              name: categoryObj.name || catId,
              version: catVer,
              href: categoryObj.href || `/api/productCatalogManagement/v4/category/${catId}:(version=${catVer})`
            }
          ]
        });
      }

      const seen = new Set();
      const uniqueCats = [];
      existingGroupings.forEach(g => {
        (g.category || []).forEach(c => {
          if (!seen.has(c.id)) {
            seen.add(c.id);
            uniqueCats.push(c);
          }
        });
      });

      return {
        ...prev,
        categoryGroupings: existingGroupings,
        category: uniqueCats
      };
    });
  };

  const handleAssociateCategoryToAllSkus = (categoryObj) => {
    if (!categoryObj) return;
    possibleSkus.forEach(s => {
      handleAssociateCategoryToSku(s.sku, categoryObj);
    });
  };

  const handleDisassociateCategoryFromSku = (targetSku, categoryId) => {
    setFormData(prev => {
      const existingGroupings = (prev.categoryGroupings || []).map(g => {
        if (g.sku === targetSku) {
          return {
            ...g,
            category: (g.category || []).filter(c => c.id !== categoryId)
          };
        }
        return g;
      });

      const seen = new Set();
      const uniqueCats = [];
      existingGroupings.forEach(g => {
        (g.category || []).forEach(c => {
          if (!seen.has(c.id)) {
            seen.add(c.id);
            uniqueCats.push(c);
          }
        });
      });

      return {
        ...prev,
        categoryGroupings: existingGroupings,
        category: uniqueCats
      };
    });
  };

  const handleRemoveCategoryGroup = (groupKey) => {
    setFormData(prev => {
      const nextGroupings = (prev.categoryGroupings || []).filter(g => g.id !== groupKey && g.sku !== groupKey);
      const seen = new Set();
      const uniqueCats = [];
      nextGroupings.forEach(g => {
        (g.category || []).forEach(c => {
          if (!seen.has(c.id)) {
            seen.add(c.id);
            uniqueCats.push(c);
          }
        });
      });

      return {
        ...prev,
        categoryGroupings: nextGroupings,
        category: uniqueCats
      };
    });
  };

  const toggleGroup = (id) => {
    setExpandedGroupIds(prev => ({
      ...prev,
      [id]: prev[id] === false ? true : false
    }));
  };

  const handleAddCustomSku = () => {
    const val = (customSkuInput || '').trim();
    if (!val) return;
    setSelectedSkuForCategory(val);
    setCustomSkuInput('');
    setIsAddingCustomSku(false);
  };

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSavedToast, setDraftSavedToast] = useState(null);

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setDraftSavedToast(null);
    try {
      const entityId = formData.code || formData.id || 'NEW_SALES_PACKAGE';
      const portId = formData.portfolio_id ? String(formData.portfolio_id).trim() : '';
      const draftId = item?.draftId || `draft_${entityId.toLowerCase().replace(/[^a-z0-9]+/g, '_')}${portId ? `_${portId.toLowerCase().replace(/[^a-z0-9]+/g, '_')}` : ''}`;

      const now = new Date().toISOString();
      const taskType = formData.task_type || item?.task_type || 'new_sales_package';
      const payload = {
        id: draftId,
        task_type: taskType,
        entity_id: entityId,
        entity_name: formData.name || 'New Sales Package',
        entity_type: 'ProductOffering',
        portfolio_id: portId,
        technology: formData.technology || 'FIBRE',
        speed: formData.downstreamSpeed ? `${formData.downstreamSpeed} Mbps` : '',
        form_data: {
          ...formData,
          task_type: taskType,
          template_name: formData.template_name || '',
          selectedTemplateId: selectedTemplateId || formData.selectedTemplateId || '',
          selectedTemplateName: selectedTemplateDisplayName || formData.selectedTemplateName || ''
        },
        created_at: now,
        updated_at: now
      };

      // 1. Immediately mirror to localStorage
      try {
        const raw = localStorage.getItem('dnext_drafts_cache');
        const existing = raw ? JSON.parse(raw) : [];
        const filtered = existing.filter(d => d.id !== draftId);
        filtered.unshift(payload);
        localStorage.setItem('dnext_drafts_cache', JSON.stringify(filtered));
      } catch (_) {}

      // 2. Persist to backend SQLite
      try {
        await fetch('/api/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (beErr) {
        console.warn('[handleSaveDraft] Backend /api/drafts offline or needs restart, saved in local cache:', beErr);
      }

      setDraftSavedToast(`Draft saved successfully`);
      setTimeout(() => setDraftSavedToast(null), 3500);
      if (onSuccessRefresh) onSuccessRefresh();
    } catch (err) {
      alert(`Failed to save draft: ${err.message}`);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = () => {
    setIsPublishModalOpen(true);
  };

  const handlePublishSuccess = (result) => {
    setIsPublished(true);
    if (item?.draftId) {
      try {
        const raw = localStorage.getItem('dnext_drafts_cache');
        if (raw) {
          const list = JSON.parse(raw).filter(d => d.id !== item.draftId);
          localStorage.setItem('dnext_drafts_cache', JSON.stringify(list));
        }
      } catch (_) {}
      fetch(`/api/drafts/${encodeURIComponent(item.draftId)}`, { method: 'DELETE' }).catch(() => {});
    }
    if (onSuccessRefresh) onSuccessRefresh();
  };

  // Dedicated centralized deployment builder generating Offering, Bundle POPs,
  // the 4 Simple POPs (_bw, _in, _va, _vt), and the synchronous TM Forum 620 envelope
  const deploymentPackageData = useMemo(() => {
    return createSalesPackageDeploymentEnvelope(formData);
  }, [formData]);

  const generatedTmfJson = deploymentPackageData.offering;
  const synchronousEnvelope = deploymentPackageData.synchronousEnvelope;

  // Synchronize live TMF payload & synchronous envelope to parent drawer for top-level JSON tabs
  useEffect(() => {
    if (onUpdateItem) {
      onUpdateItem({
        id: formData.id || 'NEW_SALES_PACKAGE',
        name: formData.name || 'New Sales Package',
        raw: generatedTmfJson,
        synchronousEnvelope
      });
    }
  }, [generatedTmfJson, synchronousEnvelope, onUpdateItem, formData.id, formData.name]);

  // Measure Network Boxes row width so Bandwidth Option pulldown aligns exactly with the end of Bitstream (DSL) box
  const networkBoxesRowRef = useRef(null);
  const [networkBoxesWidth, setNetworkBoxesWidth] = useState(null);

  useEffect(() => {
    if (!networkBoxesRowRef.current) return;
    const updateWidth = () => {
      if (networkBoxesRowRef.current) {
        const w = networkBoxesRowRef.current.getBoundingClientRect().width;
        if (w > 0) setNetworkBoxesWidth(Math.round(w));
      }
    };
    updateWidth();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateWidth) : null;
    if (ro && networkBoxesRowRef.current) {
      ro.observe(networkBoxesRowRef.current);
    }
    return () => {
      if (ro) ro.disconnect();
    };
  }, [activeTab, formData.isNgnSupported, formData.isBitstreamSupported, formData.productCodeNgn, formData.productCodeBitstream]);

  // Reusable input style
  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '13px',
    color: C.text,
    background: '#ffffff',
    border: '1px solid var(--ds-border-strong)',
    borderRadius: '6px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  };

  const readOnlyInputStyle = {
    ...inputStyle,
    background: 'var(--ds-surface-subtle)',
    color: 'var(--ds-text-2)',
    borderColor: 'var(--ds-border)',
    fontFamily: 'var(--ds-font-mono)',
    fontSize: '13px'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--ds-text-2)',
    marginBottom: '6px'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: C.text }}>
      {/* ─── Hero Banner & Controls ─── */}
      <div style={{
        background: '#ffffff',
        border: `1px solid ${C.cardBorder}`,
        borderRadius: '12px',
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Top line: Breadcrumbs & Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: 'var(--ds-danger-soft)',
              color: 'var(--ds-danger)',
              fontSize: '11px',
              fontWeight: '700',
              padding: '3px 8px',
              borderRadius: '4px',
              letterSpacing: '0.04em'
            }}>
              NEW TEMPLATE
            </span>
            <span style={{ color: 'var(--ds-border-strong)', fontSize: '13px' }}>/</span>
            <span style={{ fontSize: '12px', fontWeight: '500', color: C.muted }}>Product Offering Wizard</span>
            <span style={{ color: 'var(--ds-border-strong)', fontSize: '13px' }}>/</span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: C.text }}>Sales Package</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {draftSavedToast && (
              <span style={{
                fontSize: '11.5px',
                color: 'var(--ds-ok)',
                fontWeight: '600',
                background: 'var(--ds-ok-soft)',
                border: '1px solid var(--ds-ok-border)',
                padding: '4px 10px',
                borderRadius: '5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <Icon name="check" size={13} /> {draftSavedToast}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#ffffff',
                border: '1px solid var(--ds-border-strong)',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--ds-text-2)',
                cursor: 'pointer'
              }}
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              style={{
                background: 'var(--ds-surface-2)',
                border: '1px solid var(--ds-border-strong)',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--ds-text)',
                cursor: isSavingDraft ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Icon name="edit" size={13} /> {isSavingDraft ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              type="button"
              onClick={handlePublish}
              style={{
                background: C.vodafoneRed,
                border: 'none',
                borderRadius: '6px',
                padding: '6px 18px',
                fontSize: '12px',
                fontWeight: '700',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(230,0,0,0.2)'
              }}
            >
              Review & Publish
            </button>
          </div>
        </div>

        {/* Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: C.text, letterSpacing: '-0.02em' }}>
                {formData.name || 'Untitled Sales Package'}
              </h1>
              <span style={{
                fontFamily: 'var(--ds-font-mono)',
                fontSize: '11px',
                fontWeight: '600',
                background: 'var(--ds-surface-2)',
                border: '1px solid var(--ds-border)',
                padding: '2px 8px',
                borderRadius: '4px',
                color: 'var(--ds-warn)'
              }}>
                {formData.code || 'NO_CODE'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: C.muted }}>
              Configure commercial parameters, technical specs, sub-bundles, and CCB billing tariffs.
            </p>
          </div>
        </div>

        {/* Wizard Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid var(--ds-border)',
          paddingTop: '6px',
          margin: '0 -24px -20px -24px',
          paddingLeft: '20px'
        }}>
          {[
            { id: 'step1', label: 'STEP 1: Package', icon: 'zap' },
            { id: 'technology', label: 'STEP 2: Bandwidth', icon: 'sliders' },
            { id: 'tariffSelection', label: 'STEP 3: Tariff Selection', icon: 'tag' },
            { id: 'psmCodes', label: 'STEP 4: PSM CODES', icon: 'euro' },
            { id: 'commercial', label: 'STEP 5: Terms', icon: 'edit' },
            { id: 'categories', label: 'STEP 6: Categories', icon: 'folder' },
            { id: 'characteristics', label: 'Offering Characteristics', icon: 'settings' },
            { id: 'review', label: 'Review & Summary', icon: '✓' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? `2px solid ${C.vodafoneRed}` : '2px solid transparent',
                color: activeTab === tab.id ? C.vodafoneRed : 'var(--ds-text-3)',
                fontWeight: activeTab === tab.id ? '700' : '500',
                fontSize: '13px',
                padding: '8px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Icon name={tab.icon} size={14} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Published Notification Modal / Alert ─── */}
      {isPublished && (
        <div style={{
          background: 'var(--ds-ok-soft)',
          border: '1px solid var(--ds-ok-border)',
          borderRadius: '10px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}></span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#065f46' }}>
                Sales Package Published Successfully!
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ds-ok)', marginTop: '2px' }}>
                Offering <strong>{formData.name}</strong> ({formData.code}) has been staged and registered in the DNEXT Product Catalog.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--ds-ok)',
              color: '#ffffff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      )}

      {/* ─── TAB 1: STEP 1 ─── */}
      {activeTab === 'step1' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            background: C.panel,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: '10px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: C.vodafoneRed }}><Icon name="zap" size={16} /></span>
                <span>STEP 1: Primary Package Setup</span>
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: C.muted }}>
                Define the essential baseline parameters to bootstrap the sales package: Portfolio ID, Offer Template, PSM AAW Paket ID, Package Name, and Product Offering Code.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 1. Portfolio Id */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <label style={{ ...labelStyle, marginBottom: 0, width: '220px', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--ds-text-2)' }}>
                  Portfolio Id:
                </label>
                <div style={{ flex: 1, minWidth: '280px', maxWidth: '520px' }}>
                  <input
                    type="text"
                    placeholder="e.g. PF_2026_Q1_FIXED"
                    value={formData.portfolio_id || ''}
                    onChange={(e) => handleFieldChange('portfolio_id', e.target.value)}
                    style={{
                      ...inputStyle,
                      fontFamily: 'var(--ds-font-mono)',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}
                  />
                  <div style={{ fontSize: '11px', color: C.muted, marginTop: '3px' }}>
                    Direct characteristic <code>portfolio_id</code> on the broadband offer.
                  </div>
                </div>
              </div>

              {/* 2. Offer Template */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <label style={{ ...labelStyle, marginBottom: 0, width: '220px', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--ds-text-2)' }}>
                  Offer Template:
                </label>
                <div ref={templateDropdownRef} style={{ flex: 1, minWidth: '280px', maxWidth: '520px', position: 'relative' }}>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      type="text"
                      placeholder={selectedTemplateDisplayName || "-- Type to filter or select Offer Template --"}
                      value={isTemplateDropdownOpen ? templateSearchQuery : (selectedTemplateDisplayName || '')}
                      onChange={(e) => {
                        setTemplateSearchQuery(e.target.value);
                        if (!isTemplateDropdownOpen) setIsTemplateDropdownOpen(true);
                      }}
                      onFocus={() => {
                        setIsTemplateDropdownOpen(true);
                      }}
                      style={{
                        ...inputStyle,
                        paddingRight: '52px',
                        fontWeight: '600',
                        fontFamily: 'var(--ds-font-mono)',
                        fontSize: '12px',
                        borderColor: isTemplateDropdownOpen ? 'var(--ds-brand)' : (selectedTemplateId ? 'var(--ds-border-strong)' : 'var(--ds-border)'),
                        boxShadow: isTemplateDropdownOpen ? '0 0 0 2px rgba(230,0,0,0.1)' : 'none',
                        background: '#ffffff'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {(selectedTemplateId || templateSearchQuery) && (
                        <button
                          type="button"
                          onClick={() => {
                            setTemplateSearchQuery('');
                            handleSelectCatalogTemplate('');
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--ds-brand)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '2px 4px',
                            lineHeight: 1
                          }}
                          title="Clear template selection"
                        >
                          ✕
                        </button>
                      )}
                      <span
                        onClick={() => setIsTemplateDropdownOpen(prev => !prev)}
                        style={{
                          fontSize: '10px',
                          color: 'var(--ds-text-3)',
                          cursor: 'pointer',
                          padding: '2px 4px',
                          transform: isTemplateDropdownOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.15s ease'
                        }}
                        title={isTemplateDropdownOpen ? "Close list" : "Open list"}
                      >
                        ▼
                      </span>
                    </div>
                  </div>

                  {isTemplateDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        maxHeight: '260px',
                        overflowY: 'auto',
                        background: '#ffffff',
                        border: '1px solid var(--ds-border-strong)',
                        borderRadius: '6px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        zIndex: 1000
                      }}
                    >
                      {filteredCatalogTemplates.length === 0 ? (
                        <div style={{ padding: '12px', fontSize: '12px', color: 'var(--ds-text-2)', fontStyle: 'italic', textAlign: 'center' }}>
                          No templates matching "{templateSearchQuery}"
                        </div>
                      ) : (
                        filteredCatalogTemplates.map(tpl => {
                          const isSelected = Boolean(selectedTemplateId && (
                            selectedTemplateId === tpl.id ||
                            selectedTemplateId.replace(/:\(version=[^)]+\)$/i, '') === tpl.id.replace(/:\(version=[^)]+\)$/i, '')
                          ));
                          return (
                            <div
                              key={tpl.id}
                              onClick={() => {
                                handleSelectCatalogTemplate(tpl.id);
                                setTemplateSearchQuery('');
                                setIsTemplateDropdownOpen(false);
                              }}
                              style={{
                                padding: '8px 12px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid var(--ds-border)',
                                background: isSelected ? 'rgba(230,0,0,0.06)' : '#ffffff',
                                color: isSelected ? 'var(--ds-brand)' : 'var(--ds-text)',
                                fontWeight: isSelected ? '700' : '500'
                              }}
                              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--ds-surface-subtle)'; }}
                              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#ffffff'; }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {tpl.name}
                                </span>
                                <span style={{ fontSize: '10px', color: 'var(--ds-text-3)', fontFamily: 'var(--ds-font-mono)' }}>
                                  {tpl.id}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                <span style={{
                                  fontSize: '10px',
                                  padding: '1px 6px',
                                  borderRadius: '10px',
                                  background: isSelected ? 'var(--ds-brand)' : 'var(--ds-surface-2)',
                                  color: isSelected ? '#ffffff' : 'var(--ds-text-2)',
                                  fontWeight: '600'
                                }}>
                                  {tpl.technology}
                                </span>
                                {isSelected && <span style={{ color: 'var(--ds-brand)', fontWeight: '800' }}>✓</span>}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
                {autoSelectedMeta && (
                  <span style={{
                    fontSize: '12px',
                    background: '#f0fdf4',
                    color: '#15803d',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    border: '1px solid #bbf7d0',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ fontWeight: '800' }}>✓</span>
                    <span>Template: <strong>{autoSelectedMeta.sourceName}</strong> &bull; Bandwidth: <strong>{autoSelectedMeta.bandwidthOption}</strong> &bull; <strong>{autoSelectedMeta.popsCount}</strong> Bundled POPs</span>
                  </span>
                )}
              </div>

              {/* 3. PSM AAW Paket Id * : */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <label style={{ ...labelStyle, marginBottom: 0, width: '220px', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--ds-text-2)', paddingTop: '6px' }}>
                  PSM AAW Paket Id * :
                </label>
                <div style={{ flex: 1, minWidth: '280px', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(formData.psmAawPacketIds || []).length === 0 ? (
                    <div style={{
                      background: 'var(--ds-surface-subtle)',
                      border: '1px dashed var(--ds-border)',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      fontSize: '12px',
                      color: 'var(--ds-text-3)',
                      fontStyle: 'italic'
                    }}>
                      No PSM AAW Paket ID configured yet. Enter a Paket ID below and click "+ Add Paket Id".
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {formData.psmAawPacketIds.map((pktId, idx) => {
                        const packetTerms = (formData.terms || []).filter(t => {
                          const tPkt = t.packetId || (t.sku && t.sku.includes('-') ? t.sku.split('-')[0] : null);
                          return tPkt ? tPkt === pktId : idx === 0;
                        });
                        const pktCatCount = (formData.categoryGroupings || [])
                          .filter(cg => cg.sku === pktId || cg.sku?.startsWith(`${pktId}-`) || cg.name?.includes(pktId))
                          .reduce((sum, cg) => sum + (cg.category?.length || 0), 0);
                        return (
                          <div
                            key={`step1_psm_pkt_${idx}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              width: '100%',
                              boxSizing: 'border-box'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                              <input
                                type="text"
                                value={pktId}
                                onChange={(e) => handleUpdatePsmAawPacketId(idx, e.target.value)}
                                placeholder="e.g. R025.5000000530"
                                title="Click to edit PSM AAW Paket Id"
                                style={{
                                  ...inputStyle,
                                  flex: 1,
                                  fontSize: '13px',
                                  padding: '7px 10px',
                                  boxSizing: 'border-box'
                                }}
                              />
                              <span style={{ fontSize: '11px', color: 'var(--ds-text-3)', whiteSpace: 'nowrap' }}>
                                {packetTerms.length} term{packetTerms.length !== 1 ? 's' : ''}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleGoToCategoryMappings(pktId)}
                                style={{
                                  background: 'rgba(124,58,237,0.08)',
                                  border: '1px solid rgba(124,58,237,0.3)',
                                  color: 'var(--ds-spec)',
                                  borderRadius: '4px',
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  whiteSpace: 'nowrap'
                                }}
                                title="Go to Category Mappings for this PSM AAW Paket ID"
                              >
                                <Icon name="folder" size={12} />
                                <span>Category Mappings ({pktCatCount}) →</span>
                              </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {(formData.psmAawPacketIds || []).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePsmAawPacketId(pktId)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--ds-text-3)',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    padding: '2px 6px'
                                  }}
                                  title="Remove PSM AAW Paket Id"
                                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ds-danger)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ds-text-3)'; }}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Inline Add Box */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                    <input
                      type="text"
                      value={newPsmPacketInput}
                      onChange={(e) => setNewPsmPacketInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPsmAawPacketId(newPsmPacketInput);
                        }
                      }}
                      style={{
                        ...inputStyle,
                        flex: 1,
                        fontFamily: 'var(--ds-font-mono)',
                        fontSize: '12px',
                        padding: '7px 10px',
                        boxSizing: 'border-box'
                      }}
                      placeholder="Add PSM AAW Paket Id (e.g. R025.5000000531)"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddPsmAawPacketId(newPsmPacketInput)}
                      style={{
                        background: 'var(--ds-surface-2)',
                        border: '1px solid var(--ds-border-strong)',
                        borderRadius: '6px',
                        padding: '7px 14px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--ds-text)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      + Add Paket Id
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Package Name * : */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <label style={{ ...labelStyle, marginBottom: 0, width: '220px', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--ds-text-2)' }}>
                  Package Name * :
                </label>
                <div style={{ flex: 1, minWidth: '280px', maxWidth: '520px' }}>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    style={{ ...inputStyle, fontSize: '13px', fontWeight: '600' }}
                    placeholder="e.g. GigaZuhause 250 Glasfaser"
                  />
                </div>
              </div>

              {/* 5. Product Offering Code * : */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <label style={{ ...labelStyle, marginBottom: 0, width: '220px', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--ds-text-2)' }}>
                  Product Offering Code * :
                </label>
                <div style={{ flex: 1, minWidth: '280px', maxWidth: '520px' }}>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleFieldChange('code', e.target.value)}
                    style={{ ...inputStyle, fontFamily: 'var(--ds-font-mono)', fontSize: '13px', fontWeight: '600' }}
                    placeholder="e.g. PO_FN_FTTH_250M"
                  />
                </div>
              </div>
            </div>

            {/* Navigation Buttons for Step 1 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid var(--ds-border)' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--ds-border-strong)',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--ds-text-2)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('technology')}
                style={{
                  background: C.vodafoneRed,
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(230,0,0,0.2)'
                }}
              >
                Next: STEP 2: Bandwidth →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: STEP 2: BANDWIDTH ─── */}
      {activeTab === 'technology' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            background: C.panel,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: '10px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div>
              <h3 style={{
                margin: '0 0 4px 0',
                fontSize: '13px',
                fontWeight: '700',
                color: C.text,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                STEP 2: Bandwidth Configuration
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: C.muted }}>
                Configure supported network options (Vodafone NGN and/or Bitstream / DSL), specific product codes, and bandwidth offering.
              </p>
            </div>

            {/* 1. Supported Network(s) & Product Codes: Internet (Left, 2 cols) + Voice (Right, 2 cols) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', alignItems: 'start' }}>
              {/* Internet Product Selection (2 atomic card columns) */}
              <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ ...labelStyle, marginBottom: 0, fontSize: '13px', color: 'var(--ds-text-2)', fontWeight: '700' }}>
                  Supported Network(s) &amp; Internet Product Codes *
                </label>
                <div
                  ref={networkBoxesRowRef}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}
                >
                  {/* Vodafone NGN Box */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    border: `1px solid ${formData.isNgnSupported ? '#fca5a5' : 'var(--ds-border)'}`,
                    background: formData.isNgnSupported ? 'var(--ds-danger-soft)' : 'var(--ds-surface-subtle)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    minHeight: '34px',
                    boxSizing: 'border-box',
                    transition: 'all 0.15s ease'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12.5px', color: formData.isNgnSupported ? 'var(--ds-danger)' : 'var(--ds-text-2)', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={!!formData.isNgnSupported}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (!checked && !formData.isBitstreamSupported) {
                            alert('A sales package must support at least one network (Vodafone NGN or Bitstream / DSL).');
                            return;
                          }
                          handleFieldChange('isNgnSupported', checked);
                          const nextBs = formData.isBitstreamSupported;
                          handleFieldChange('networkType', checked && nextBs ? 'Vodafone NGN & Bitstream' : checked ? 'Vodafone NGN' : 'Bitstream (DSL)');
                        }}
                        style={{ width: '15px', height: '15px', accentColor: C.vodafoneRed, cursor: 'pointer', margin: 0 }}
                      />
                      <span>Vodafone NGN</span>
                    </label>

                    {formData.isNgnSupported && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px', borderLeft: '1px solid #fca5a5', paddingLeft: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--ds-brand-text)', whiteSpace: 'nowrap' }}>
                          Code:
                        </span>
                        <input
                          type="text"
                          value={formData.productCodeNgn || ''}
                          onChange={(e) => handleFieldChange('productCodeNgn', e.target.value)}
                          placeholder="I1204"
                          title="NGN Internet Product Code (product_code_internet_ngn)"
                          style={{
                            width: '72px',
                            padding: '3px 6px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            fontFamily: 'var(--ds-font-mono)',
                            color: 'var(--ds-danger)',
                            background: '#ffffff',
                            border: '1px solid #fca5a5',
                            borderRadius: '4px',
                            outline: 'none',
                            textAlign: 'center'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Bitstream / DSL Box */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    border: `1px solid ${formData.isBitstreamSupported ? '#d8b4fe' : 'var(--ds-border)'}`,
                    background: formData.isBitstreamSupported ? 'var(--ds-spec-soft)' : 'var(--ds-surface-subtle)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    minHeight: '34px',
                    boxSizing: 'border-box',
                    transition: 'all 0.15s ease'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12.5px', color: formData.isBitstreamSupported ? 'var(--ds-spec-text)' : 'var(--ds-text-2)', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={!!formData.isBitstreamSupported}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (!checked && !formData.isNgnSupported) {
                            alert('A sales package must support at least one network (Vodafone NGN or Bitstream / DSL).');
                            return;
                          }
                          handleFieldChange('isBitstreamSupported', checked);
                          const nextNgn = formData.isNgnSupported;
                          handleFieldChange('networkType', nextNgn && checked ? 'Vodafone NGN & Bitstream' : nextNgn ? 'Vodafone NGN' : 'Bitstream (DSL)');
                        }}
                        style={{ width: '15px', height: '15px', accentColor: 'var(--ds-spec)', cursor: 'pointer', margin: 0 }}
                      />
                      <span>Bitstream (DSL)</span>
                    </label>

                    {formData.isBitstreamSupported && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px', borderLeft: '1px solid #d8b4fe', paddingLeft: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--ds-spec-text)', whiteSpace: 'nowrap' }}>
                          Code:
                        </span>
                        <input
                          type="text"
                          value={formData.productCodeBitstream || ''}
                          onChange={(e) => handleFieldChange('productCodeBitstream', e.target.value)}
                          placeholder="I1203"
                          title="Bitstream Internet Product Code (product_code_internet_bitstream)"
                          style={{
                            width: '72px',
                            padding: '3px 6px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            fontFamily: 'var(--ds-font-mono)',
                            color: 'var(--ds-spec-text)',
                            background: '#ffffff',
                            border: '1px solid #d8b4fe',
                            borderRadius: '4px',
                            outline: 'none',
                            textAlign: 'center'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Voice Product Selection (2 atomic card columns) */}
              <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ ...labelStyle, marginBottom: 0, fontSize: '13px', color: 'var(--ds-text-2)', fontWeight: '700' }}>
                  Voice Product Codes
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                  {/* Voice NGN Box */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    border: `1px solid ${formData.isVoiceNgnSupported ? '#fca5a5' : 'var(--ds-border)'}`,
                    background: formData.isVoiceNgnSupported ? 'var(--ds-danger-soft)' : 'var(--ds-surface-subtle)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    minHeight: '34px',
                    boxSizing: 'border-box',
                    transition: 'all 0.15s ease'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12.5px', color: formData.isVoiceNgnSupported ? 'var(--ds-danger)' : 'var(--ds-text-2)', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={!!formData.isVoiceNgnSupported}
                        onChange={(e) => handleFieldChange('isVoiceNgnSupported', e.target.checked)}
                        style={{ width: '15px', height: '15px', accentColor: C.vodafoneRed, cursor: 'pointer', margin: 0 }}
                      />
                      <span>Voice NGN</span>
                    </label>
                    {formData.isVoiceNgnSupported && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px', borderLeft: '1px solid #fca5a5', paddingLeft: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--ds-brand-text)', whiteSpace: 'nowrap' }}>
                          Code:
                        </span>
                        <input
                          type="text"
                          value={formData.voiceProductCodeNgn ?? 'VI204'}
                          onChange={(e) => handleFieldChange('voiceProductCodeNgn', e.target.value)}
                          placeholder="VI204"
                          title="NGN Voice Product Code (product_code_voice_ngn)"
                          style={{
                            width: '72px',
                            padding: '3px 6px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            fontFamily: 'var(--ds-font-mono)',
                            color: 'var(--ds-danger)',
                            background: '#ffffff',
                            border: '1px solid #fca5a5',
                            borderRadius: '4px',
                            outline: 'none',
                            textAlign: 'center'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Voice Bitstream Box */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    border: `1px solid ${formData.isVoiceBitstreamSupported ? '#d8b4fe' : 'var(--ds-border)'}`,
                    background: formData.isVoiceBitstreamSupported ? 'var(--ds-spec-soft)' : 'var(--ds-surface-subtle)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    minHeight: '34px',
                    boxSizing: 'border-box',
                    transition: 'all 0.15s ease'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12.5px', color: formData.isVoiceBitstreamSupported ? 'var(--ds-spec-text)' : 'var(--ds-text-2)', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={!!formData.isVoiceBitstreamSupported}
                        onChange={(e) => handleFieldChange('isVoiceBitstreamSupported', e.target.checked)}
                        style={{ width: '15px', height: '15px', accentColor: 'var(--ds-spec)', cursor: 'pointer', margin: 0 }}
                      />
                      <span>Voice Bitstream</span>
                    </label>
                    {formData.isVoiceBitstreamSupported && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px', borderLeft: '1px solid #d8b4fe', paddingLeft: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--ds-spec-text)', whiteSpace: 'nowrap' }}>
                          Code:
                        </span>
                        <input
                          type="text"
                          value={formData.voiceProductCodeBitstream ?? 'VI203'}
                          onChange={(e) => handleFieldChange('voiceProductCodeBitstream', e.target.value)}
                          placeholder="VI203"
                          title="Bitstream Voice Product Code (product_code_voice_bitstream)"
                          style={{
                            width: '72px',
                            padding: '3px 6px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            fontFamily: 'var(--ds-font-mono)',
                            color: 'var(--ds-spec-text)',
                            background: '#ffffff',
                            border: '1px solid #d8b4fe',
                            borderRadius: '4px',
                            outline: 'none',
                            textAlign: 'center'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Bandwidth Option & Selected Bandwidth Pane (2 atomic card columns wide in 4-col grid) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
              <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ ...labelStyle, marginBottom: 0, fontSize: '13px', color: 'var(--ds-text-2)' }}>
                  Bandwidth Option * :
                </label>
                <div style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                <select
                  value={selectedBandwidthOffer?.id || formData.selectedBandwidthOfferId || ''}
                  onChange={(e) => handleBandwidthOfferSelect(e.target.value)}
                  style={{ ...inputStyle, width: '100%', fontSize: '13px', fontWeight: '600' }}
                >
                  <option value="">-- Select Bandwidth Option --</option>
                  {bandwidthOptionOffers.map(offer => {
                    const realBw = offer.realBandwidth || offer.serviceCode || offer.sku;
                    return (
                      <option key={offer.id} value={offer.id}>
                        [{realBw}] {offer.name} · Real Bandwidth: {realBw}
                      </option>
                    );
                  })}
                </select>

                {!selectedBandwidthOffer && (
                  <span style={{ fontSize: '11px', color: 'var(--ds-text-3)', fontStyle: 'italic' }}>
                    No bandwidth option selected. Please choose a bandwidth tier above.
                  </span>
                )}

                {/* Prominent Selected Bandwidth SKU & Profile Details */}
                {selectedBandwidthOffer && (
                  <div style={{
                    background: 'var(--ds-surface-subtle)',
                    border: '1px solid var(--ds-border)',
                    borderRadius: '8px',
                    padding: '14px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--ds-text-3)', textTransform: 'uppercase', fontWeight: '700' }}>
                            Real Bandwidth:
                          </span>
                          <button
                            type="button"
                            onClick={() => setInspectedBandwidth({ matchingOffer: selectedBandwidthOffer })}
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
                            title="Click to view Bandwidth Details"
                          >
                            <code style={{
                              fontFamily: 'var(--ds-font-mono)',
                              fontSize: '13px',
                              fontWeight: '800',
                              color: 'var(--ds-brand-dark)',
                              background: 'rgba(230,0,0,0.08)',
                              padding: '3px 10px',
                              borderRadius: '4px',
                              border: '1px solid rgba(230,0,0,0.2)',
                              textDecoration: 'underline',
                              textDecorationColor: 'rgba(230,0,0,0.4)',
                              textUnderlineOffset: '2px'
                            }}>
                              {selectedBandwidthOffer.realBandwidth || selectedBandwidthOffer.serviceCode || formData.ccbBandwidthSku}
                            </code>
                            <Icon name="arrowUpRight" size={12} style={{ color: 'var(--ds-brand)' }} />
                          </button>
                        </div>

                        {selectedBandwidthOffer.sku && selectedBandwidthOffer.sku !== (selectedBandwidthOffer.realBandwidth || selectedBandwidthOffer.serviceCode) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--ds-text-3)', textTransform: 'uppercase', fontWeight: '700' }}>
                              Offer SKU:
                            </span>
                            <button
                              type="button"
                              onClick={() => setInspectedBandwidth({ matchingOffer: selectedBandwidthOffer })}
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
                              title="Click to view Bandwidth SKU Details"
                            >
                              <code style={{
                                fontFamily: 'var(--ds-font-mono)',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: 'var(--ds-warn)',
                                background: 'var(--ds-surface-2)',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                textDecoration: 'underline',
                                textDecorationColor: 'rgba(245, 158, 11, 0.5)',
                                textUnderlineOffset: '2px'
                              }}>
                                {selectedBandwidthOffer.sku}
                              </code>
                              <Icon name="arrowUpRight" size={11} style={{ color: '#d97706' }} />
                            </button>
                          </div>
                        )}
                      </div>

                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: 'var(--ds-ok)',
                        background: 'var(--ds-ok-soft)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--ds-ok-border)'
                      }}>
                        Active Bandwidth Offer
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '10px',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--ds-surface-2)'
                    }}>
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--ds-text-3)', textTransform: 'uppercase', display: 'block', fontWeight: '600' }}>Downstream</span>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--ds-text)' }}>{formData.downstreamSpeed} Mbit/s</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--ds-text-3)', textTransform: 'uppercase', display: 'block', fontWeight: '600' }}>Upstream</span>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--ds-text)' }}>{formData.upstreamSpeed} Mbit/s</span>
                      </div>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>

            {/* 3. Fallback Bandwidths Selection (Copper DSL Line Profiles) */}
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
                    <label style={{ ...labelStyle, marginBottom: 0, fontSize: '13px', color: 'var(--ds-text)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Fallback Bandwidths (DSL Line Profiles)
                    </label>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: (formData.fallbackBandwidths || []).length > 0 ? 'var(--ds-ok)' : 'var(--ds-text-2)',
                      background: (formData.fallbackBandwidths || []).length > 0 ? 'var(--ds-ok-soft)' : 'var(--ds-surface-2)',
                      border: `1px solid ${(formData.fallbackBandwidths || []).length > 0 ? 'rgba(34,197,94,0.3)' : 'var(--ds-border)'}`,
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      {(formData.fallbackBandwidths || []).length > 0 ? `${(formData.fallbackBandwidths || []).length} Active` : 'None Configured'}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: C.muted }}>
                    Certified lower-speed profiles applicable if local line conditions cannot sustain the nominal bandwidth ({formData.downstreamSpeed || 250} Mbit/s).
                  </p>
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const std = getStandardFallbackTiers(formData.downstreamSpeed || 250);
                      handleFieldChange('fallbackBandwidths', std);
                    }}
                    style={{
                      background: 'var(--ds-surface)',
                      border: '1px solid var(--ds-border)',
                      borderRadius: '5px',
                      padding: '5px 12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: 'var(--ds-text)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="Apply Vodafone standard certified fallbacks for this speed"
                  >
                    Standard Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange('fallbackBandwidths', VODAFONE_DSL_FALLBACK_TIERS.map(t => t.speed));
                    }}
                    style={{
                      background: 'var(--ds-surface)',
                      border: '1px solid var(--ds-border)',
                      borderRadius: '5px',
                      padding: '5px 12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: 'var(--ds-text)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="Select all speed tiers"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('fallbackBandwidths', [])}
                    style={{
                      background: 'var(--ds-surface)',
                      border: '1px solid var(--ds-border)',
                      borderRadius: '5px',
                      padding: '5px 12px',
                      fontSize: '11px',
                      fontWeight: '500',
                      color: 'var(--ds-text-3)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="Clear fallback tiers"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Tiers Grid: High-visibility cards matching SalesPackageDetailTemplate - 4 cards in a row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
                {VODAFONE_DSL_FALLBACK_TIERS.map(tier => {
                  const isSelected = (formData.fallbackBandwidths || []).includes(tier.speed);
                  const matchingOffer = (bandwidthOptionOffers || []).find(o => o.speeds?.down === tier.speed);
                  const realBw = tier.svcBw; // Real bandwidth e.g. V0178
                  const networkBadge = tier.technologyBadge || tier.technology || (tier.isBitstreamOnly ? 'I1203 Bitstream Only' : 'I1204 NGN / I1203 Bitstream');

                  return (
                    <div
                      key={tier.speed}
                      onClick={() => {
                        const curr = formData.fallbackBandwidths || [];
                        const next = isSelected
                          ? curr.filter(s => s !== tier.speed)
                          : [...curr, tier.speed].sort((a, b) => b - a);
                        handleFieldChange('fallbackBandwidths', next);
                      }}
                      style={{
                        background: isSelected
                          ? 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, var(--ds-surface-subtle) 100%)'
                          : 'var(--ds-surface-subtle)',
                        border: `1.5px solid ${isSelected ? 'var(--ds-ok)' : C.cardBorder}`,
                        borderRadius: '8px',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 2px 6px rgba(16,185,129,0.12)' : 'none',
                        position: 'relative'
                      }}
                    >
                      {/* Speed & Network Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                          <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--ds-text)', fontFamily: 'var(--ds-font-mono)' }}>
                            {tier.speed}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: C.muted }}>
                            Mbit/s
                          </span>
                          {tier.upload && (
                            <span style={{ fontSize: '11px', color: 'var(--ds-ok)', fontWeight: '600', marginLeft: '4px' }}>
                              (↑ {tier.upload} Mbit/s)
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: tier.isBitstreamOnly ? '#faf5ff' : 'var(--ds-ok-soft)',
                            color: tier.isBitstreamOnly ? '#7e22ce' : 'var(--ds-ok)',
                            border: `1px solid ${tier.isBitstreamOnly ? '#d8b4fe' : 'rgba(34,197,94,0.3)'}`
                          }}>
                            {networkBadge}
                          </span>

                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: isSelected ? 'var(--ds-ok)' : 'var(--ds-surface-2)',
                            color: isSelected ? '#ffffff' : 'var(--ds-text-3)',
                            border: `1px solid ${isSelected ? 'var(--ds-ok)' : 'var(--ds-border)'}`
                          }}>
                            {isSelected ? '✓ Active' : '+ Click to Add'}
                          </span>
                        </div>
                      </div>

                      {/* Real Bandwidth Breakdown */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', borderTop: `1px solid ${C.border}`, paddingTop: '8px' }}>
                        <span style={{ color: C.muted, fontSize: '10.5px', fontWeight: '600' }}>Real Bandwidth:</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectedBandwidth({ tier, matchingOffer });
                          }}
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
                          title={`Click to view details for Real Bandwidth ${realBw}`}
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
                            {realBw}
                          </code>
                          <Icon name="arrowUpRight" size={11} style={{ color: 'var(--ds-brand)' }} />
                        </button>
                      </div>

                      {tier.desc && (
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectedBandwidth({ tier, matchingOffer });
                            }}
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

              {/* Action & Characteristic Preview Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginTop: '4px',
                padding: '12px 16px',
                background: 'var(--ds-surface-subtle)',
                borderRadius: '8px',
                border: '1px solid var(--ds-border)'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--ds-text-2)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '600' }}>Characteristic:</span>
                  <code style={{
                    fontFamily: 'var(--ds-font-mono)',
                    fontSize: '11px',
                    color: 'var(--ds-text)',
                    background: 'var(--ds-surface)',
                    border: '1px solid var(--ds-border)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    fallback_bandwidth = "{(formData.fallbackBandwidths || []).join(', ') || 'none'}"
                  </code>
                  {(formData.fallbackBandwidths || []).length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: 'var(--ds-text-3)', fontWeight: '600' }}>Real Bandwidths:</span>
                      {(formData.fallbackBandwidths || []).map(spd => {
                        const tier = VODAFONE_DSL_FALLBACK_TIERS.find(t => t.speed === spd);
                        const realBw = tier?.svcBw || `BW_${spd}`;
                        const matchingOffer = (bandwidthOptionOffers || []).find(o => o.speeds?.down === spd || (tier?.svcBw && (o.serviceCode === tier.svcBw || o.realBandwidth === tier.svcBw)));
                        return (
                          <button
                            key={spd}
                            type="button"
                            onClick={() => setInspectedBandwidth({ tier, matchingOffer })}
                            style={{
                              fontFamily: 'var(--ds-font-mono)',
                              fontSize: '11px',
                              fontWeight: '800',
                              color: 'var(--ds-brand)',
                              background: 'var(--ds-surface-2)',
                              padding: '1px 7px',
                              borderRadius: '3px',
                              border: '1px solid var(--ds-border-strong)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              textDecoration: 'underline',
                              textDecorationColor: 'rgba(230,0,0,0.3)'
                            }}
                            title={`Click to view details for ${realBw} (${spd} Mbit/s)`}
                          >
                            <span>{realBw} ({spd}M)</span>
                            <Icon name="arrowUpRight" size={10} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                </div>
            </div>

            {/* Navigation Buttons for Technology Tab */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid var(--ds-border)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('step1')}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--ds-border-strong)',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--ds-text-2)',
                  cursor: 'pointer'
                }}
              >
                ← Back: STEP 1: Package
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tariffSelection')}
                style={{
                  background: C.vodafoneRed,
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(230,0,0,0.2)'
                }}
              >
                Next: STEP 3: Tariff Selection →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: STEP 3: TARIFF SELECTION FOR INTERNET AND VOICE ─── */}
      {activeTab === 'tariffSelection' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <CcbTariffSelectionPanel
            technology={formData.technology || 'FIBRE'}
            aawPacketId={formData.ccbMasterPacketId || ''}
            psmPacketCodes={formData.psmAawPacketIds || []}
            bundledPops={formData.bundledPops || []}
            internetProductCode={formData.productCodeNgn || formData.productCodeBitstream || 'I1204'}
            voiceProductCode={formData.voiceProductCodeNgn || formData.voiceProductCodeBitstream || 'VI204'}
            internetProductCodes={[
              ...(formData.isNgnSupported && formData.productCodeNgn
                ? [{ network: 'NGN', productCode: formData.productCodeNgn }]
                : []),
              ...(formData.isBitstreamSupported && formData.productCodeBitstream
                ? [{ network: 'BITSTREAM', productCode: formData.productCodeBitstream }]
                : [])
            ]}
            voiceProductCodes={[
              ...(formData.isVoiceNgnSupported && formData.voiceProductCodeNgn
                ? [{ network: 'NGN', productCode: formData.voiceProductCodeNgn }]
                : []),
              ...(formData.isVoiceBitstreamSupported && formData.voiceProductCodeBitstream
                ? [{ network: 'BITSTREAM', productCode: formData.voiceProductCodeBitstream }]
                : [])
            ]}
            selectedInternetTariffCode={formData.selectedInternetTariffCode || ''}
            selectedVoiceTariffCode={formData.selectedVoiceTariffCode || ''}
            customInternetTariff={formData.customInternetTariff || null}
            customVoiceTariff={formData.customVoiceTariff || null}
            onSelectInternetTariff={(tariffCode, tariffObj) => {
              const assocNets = (tariffObj?.associatedNetworks || []).map((n) => n.network);
              const applyNgn = assocNets.length === 0 || assocNets.includes('NGN');
              const applyBs = assocNets.length === 0 || assocNets.includes('BITSTREAM');
              setFormData((prev) => {
                let nextChars = [...(prev.characteristics || [])];
                const upsertChar = (charName, val) => {
                  if (!val) return;
                  let found = false;
                  nextChars = nextChars.map((ch) => {
                    if ((ch.name || '').toLowerCase() === charName) {
                      found = true;
                      return { ...ch, values: [val], value: val };
                    }
                    return ch;
                  });
                  if (!found) {
                    nextChars.push({ id: charName, name: charName, isArray: true, minCardinality: 0, maxCardinality: 99, valueType: 'string', values: [val], value: val });
                  }
                };
                if (tariffCode) {
                  if (applyNgn) upsertChar('tariff_code_internet_ngn', tariffCode);
                  if (applyBs) upsertChar('tariff_code_internet_bitstream', tariffCode);
                }
                return {
                  ...prev,
                  selectedInternetTariffCode: tariffCode,
                  customInternetTariff: tariffObj?.isCustom ? tariffObj : null,
                  characteristics: nextChars
                };
              });
            }}
            onSelectVoiceTariff={(tariffCode, tariffObj) => {
              const assocNets = (tariffObj?.associatedNetworks || []).map((n) => n.network);
              const applyNgn = assocNets.length === 0 || assocNets.includes('NGN');
              const applyBs = assocNets.length === 0 || assocNets.includes('BITSTREAM');
              setFormData((prev) => {
                let nextChars = [...(prev.characteristics || [])];
                const upsertChar = (charName, val) => {
                  if (!val) return;
                  let found = false;
                  nextChars = nextChars.map((ch) => {
                    if ((ch.name || '').toLowerCase() === charName) {
                      found = true;
                      return { ...ch, values: [val], value: val };
                    }
                    return ch;
                  });
                  if (!found) {
                    nextChars.push({ id: charName, name: charName, isArray: true, minCardinality: 0, maxCardinality: 99, valueType: 'string', values: [val], value: val });
                  }
                };
                if (tariffCode) {
                  if (applyNgn) upsertChar('tariff_code_voice_ngn', tariffCode);
                  if (applyBs) upsertChar('tariff_code_voice_bitstream', tariffCode);
                }
                return {
                  ...prev,
                  selectedVoiceTariffCode: tariffCode,
                  customVoiceTariff: tariffObj?.isCustom ? tariffObj : null,
                  characteristics: nextChars
                };
              });
            }}
            onSyncTariffCharacteristics={(charMap) => {
              setFormData((prev) => {
                let nextChars = [...(prev.characteristics || [])];
                for (const [charName, vals] of Object.entries(charMap || {})) {
                  const arr = Array.isArray(vals) ? vals.filter(Boolean) : [];
                  let found = false;
                  nextChars = nextChars.map((ch) => {
                    if ((ch.name || '').toLowerCase() === charName) {
                      found = true;
                      return {
                        ...ch,
                        values: arr.length > 0 ? arr : [''],
                        value: arr[0] || ''
                      };
                    }
                    return ch;
                  });
                  if (!found && arr.length > 0) {
                    nextChars.push({
                      id: charName,
                      name: charName,
                      isArray: true,
                      minCardinality: 0,
                      maxCardinality: 99,
                      valueType: 'string',
                      values: arr,
                      value: arr[0]
                    });
                  }
                }
                return { ...prev, characteristics: nextChars };
              });
            }}
            onLoadTariffServices={async (domain, prods, tariffCode) => {
              const prodList = Array.isArray(prods) && prods.length > 0 ? prods : [domain === 'VOICE' ? 'VI202' : 'I1204'];
              const targetBwSku = String(
                formData.ccbBandwidthSku ||
                selectedBandwidthOffer?.realBandwidth ||
                selectedBandwidthOffer?.serviceCode ||
                ''
              ).trim().toUpperCase();
              const targetDownSpeed = Number(formData.downstreamSpeed) || 0;

              const isMatchingBandwidth = (s) => {
                const code = String(s.serviceCode || '').trim().toUpperCase();
                if (targetBwSku) return code === targetBwSku;
                if (targetDownSpeed > 0) {
                  const name = String(s.serviceName || '');
                  return (
                    name.includes(`${targetDownSpeed} Mbit/s`) ||
                    name.includes(` ${targetDownSpeed * 1000}`)
                  );
                }
                return false;
              };

              const fetched = await Promise.all(
                prodList.map(async (prod) => {
                  const res = await fetch(
                    `/api/reference/tariffs/${encodeURIComponent(prod)}/${encodeURIComponent(tariffCode)}/services`
                  );
                  let serviceList = [];
                  if (res.ok) {
                    const data = await res.json();
                    serviceList = data.services || [];
                  }
                  if (serviceList.length === 0) {
                    const masterRes = await fetch(`/api/reference/services?serviceDomain=${encodeURIComponent(domain)}`);
                    if (masterRes.ok) {
                      const masterData = await masterRes.json();
                      serviceList = masterData.items || [];
                    }
                  }
                  return serviceList.map((s) => {
                    const isBw = s.serviceType === 'BANDWIDTH';
                    const isMandatory =
                      s.subscriptionRule === 'M' ||
                      s.serviceCode === 'V0017' ||
                      (isBw ? isMatchingBandwidth(s) : false);
                    return {
                      productCode: prod,
                      pricingStructureCode: tariffCode,
                      serviceDomain: s.serviceDomain,
                      serviceCode: s.serviceCode,
                      serviceName: s.serviceName,
                      serviceType: s.serviceType,
                      tmfPopRole: s.tmfPopRole,
                      mandatoryIndicator: isMandatory ? 'Y' : 'N',
                      subscriptionRule: s.subscriptionRule,
                      rcNet: s.charges?.rcNet ?? 0,
                      rcGross: Math.round(((s.charges?.rcNet ?? 0) * 1.19 + Number.EPSILON) * 100) / 100,
                      otNet: s.charges?.otNet ?? 0,
                      billingName: s.billingName || '',
                      ppmArticleCode: ''
                    };
                  });
                })
              );
              const flat = fetched.flat().filter((s) => s.serviceDomain === domain);
              const targetCodeUpper = String(tariffCode || '').trim().toUpperCase();
              setFormData((prev) => {
                const existingOther = (prev.ccbServiceAssociations || []).filter(
                  (item) =>
                    !(
                      item.serviceDomain === domain &&
                      String(item.pricingStructureCode || '').trim().toUpperCase() === targetCodeUpper
                    )
                );
                const nextAssociations = [...existingOther, ...flat];
                return {
                  ...prev,
                  ccbServiceAssociations: nextAssociations,
                  ccbTariffs: attachSelectedServicesToTariffs(prev.ccbTariffs, nextAssociations)
                };
              });
              return flat.length;
            }}
            onEditTariff={(domain, oldCode, updatedObj) => {
              const newCode = updatedObj.pricingStructureCode;
              const assocNets = (updatedObj.associatedNetworks || []).map((n) => n.network);
              const applyNgn = assocNets.length === 0 || assocNets.includes('NGN');
              const applyBs = assocNets.length === 0 || assocNets.includes('BITSTREAM');

              setFormData((prev) => {
                // Preserve matched services for this tariff/domain (re-keying if tariff code changed)
                const preservedServices = (prev.ccbServiceAssociations || []).map((svc) => {
                  if (
                    svc.serviceDomain === domain &&
                    String(svc.pricingStructureCode || '').toUpperCase() === String(oldCode || '').toUpperCase()
                  ) {
                    return { ...svc, pricingStructureCode: newCode };
                  }
                  return svc;
                });

                let nextChars = [...(prev.characteristics || [])];
                const upsertChar = (charName, val) => {
                  if (!val) return;
                  let found = false;
                  nextChars = nextChars.map((ch) => {
                    if ((ch.name || '').toLowerCase() === charName) {
                      found = true;
                      return { ...ch, values: [val], value: val };
                    }
                    return ch;
                  });
                  if (!found) {
                    nextChars.push({ id: charName, name: charName, isArray: true, minCardinality: 0, maxCardinality: 99, valueType: 'string', values: [val], value: val });
                  }
                };
                if (domain === 'INTERNET') {
                  if (applyNgn) upsertChar('tariff_code_internet_ngn', newCode);
                  if (applyBs) upsertChar('tariff_code_internet_bitstream', newCode);
                } else {
                  if (applyNgn) upsertChar('tariff_code_voice_ngn', newCode);
                  if (applyBs) upsertChar('tariff_code_voice_bitstream', newCode);
                }

                return {
                  ...prev,
                  ...(domain === 'INTERNET' ? { selectedInternetTariffCode: newCode } : { selectedVoiceTariffCode: newCode }),
                  ccbServiceAssociations: preservedServices,
                  ccbTariffs: attachSelectedServicesToTariffs(
                    (prev.ccbTariffs || []).map((t) =>
                      t.serviceDomain === domain &&
                      String(t.pricingStructureCode || '').toUpperCase() === String(oldCode || '').toUpperCase()
                        ? { ...t, pricingStructureCode: newCode }
                        : t
                    ),
                    preservedServices
                  ),
                  characteristics: nextChars
                };
              });
            }}
            onTariffListChange={(tariffsList) => {
              setFormData((prev) => ({
                ...prev,
                ccbTariffs: attachSelectedServicesToTariffs(tariffsList, prev.ccbServiceAssociations)
              }));
            }}
            savedTariffUiState={formData.ccbTariffUiState || null}
            onTariffUiStateChange={(uiState) => {
              setFormData((prev) => ({ ...prev, ccbTariffUiState: uiState }));
            }}
          />

          <CcbServiceAssociationPanel
            technology={formData.technology || 'FIBRE'}
            activePop={activePop}
            savedAssociations={formData.ccbServiceAssociations || []}
            tablesOnly={true}
            onAssociationsChange={(nextAssociations) => {
              setFormData((prev) => ({
                ...prev,
                ccbServiceAssociations: nextAssociations,
                ccbTariffs: attachSelectedServicesToTariffs(prev.ccbTariffs, nextAssociations)
              }));
            }}
            onApplyToActivePop={({
              tmfPopBreakdown,
              mandatoryGrossRcSum,
              internetTariffCode,
              voiceTariffCode,
              bandwidthServiceCode,
              associations
            }) => {
              setFormData(prev => {
                const targetId = activePop?.id || prev.selectedPopId;
                const nextPops = (prev.bundledPops || []).map(pop => {
                  if (pop.id !== targetId) return pop;
                  const bwGross = tmfPopBreakdown?._bw?.gross ?? pop.popBandwidthAmount ?? 0;
                  const inGross = tmfPopBreakdown?._in?.gross ?? pop.popInternetAmount ?? 0;
                  const vaGross = tmfPopBreakdown?._va?.gross ?? pop.popVoiceAccessAmount ?? 0;
                  const vtGross = tmfPopBreakdown?._vt?.gross ?? pop.popVoiceTariffAmount ?? 0;
                  return {
                    ...pop,
                    price: String(mandatoryGrossRcSum),
                    totalPrice: mandatoryGrossRcSum,
                    popBandwidthAmount: bwGross,
                    popInternetAmount: inGross,
                    popVoiceAccessAmount: vaGross,
                    popVoiceTariffAmount: vtGross,
                    ...(bandwidthServiceCode ? { bandwidthServiceId: bandwidthServiceCode, svcBw: bandwidthServiceCode } : {}),
                    ...(internetTariffCode ? { tariffInternet: internetTariffCode, tariffInternetNgn: internetTariffCode, tariffInternetBitstream: internetTariffCode } : {}),
                    ...(voiceTariffCode ? { tariffVoice: voiceTariffCode, tariffVoiceNgn: voiceTariffCode, tariffVoiceBitstream: voiceTariffCode } : {})
                  };
                });
                return {
                  ...prev,
                  bundledPops: nextPops,
                  ccbServiceAssociations: associations,
                  ccbTariffs: attachSelectedServicesToTariffs(prev.ccbTariffs, associations)
                };
              });
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--ds-border)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('technology')}
              style={{
                background: '#ffffff',
                border: '1px solid var(--ds-border-strong)',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--ds-text-2)',
                cursor: 'pointer'
              }}
            >
              ← Back: STEP 2: Bandwidth
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('psmCodes')}
              style={{
                background: C.vodafoneRed,
                border: 'none',
                borderRadius: '6px',
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: '700',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(230,0,0,0.2)'
              }}
            >
              Next: STEP 4: PSM CODES →
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB: STEP 5: TERMS ─── */}
      {activeTab === 'commercial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* 6. Contract Terms Selection per PSM AAW Paket Id */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              <label style={{ ...labelStyle, marginBottom: 0, fontSize: '13px', color: 'var(--ds-text-2)' }}>
                Select PSM Codes & SKUs:
              </label>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(formData.psmAawPacketIds || []).length === 0 ? (
                  <div style={{
                    background: 'var(--ds-surface-subtle)',
                    border: '1px dashed var(--ds-border)',
                    borderRadius: '8px',
                    padding: '16px',
                    fontSize: '12px',
                    color: 'var(--ds-text-3)',
                    textAlign: 'center',
                    fontStyle: 'italic'
                  }}>
                    Please add at least one PSM AAW Paket ID above to configure contract terms.
                  </div>
                ) : (
                  formData.psmAawPacketIds.map((pktId, pIdx) => {
                    const packetTerms = (formData.terms || []).filter(t => {
                      const tPkt = t.packetId || (t.sku && t.sku.includes('-') ? t.sku.split('-')[0] : null);
                      return tPkt ? tPkt === pktId : pIdx === 0;
                    });

                    return (
                      <div
                        key={`psm_term_card_${pIdx}`}
                        style={{
                          background: '#ffffff',
                          border: '1px solid var(--ds-border)',
                          borderRadius: '8px',
                          padding: '14px 16px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}
                      >
                        {/* Header per Paket Id */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ds-text-2)' }}>
                              PSM AAW Paket Id:
                            </span>
                            <input
                              type="text"
                              value={pktId}
                              onChange={(e) => handleUpdatePsmAawPacketId(pIdx, e.target.value)}
                              placeholder="e.g. R025.5000000530"
                              title="Click to edit PSM AAW Paket Id"
                              style={{
                                fontFamily: 'var(--ds-font-mono)',
                                fontWeight: '700',
                                fontSize: '13px',
                                color: 'var(--ds-warn)',
                                background: 'var(--ds-surface-2)',
                                border: '1px solid var(--ds-border-strong)',
                                borderRadius: '4px',
                                padding: '2px 8px',
                                width: '185px',
                                outline: 'none'
                              }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--ds-warn)'; e.currentTarget.style.background = '#ffffff'; }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--ds-border-strong)'; e.currentTarget.style.background = 'var(--ds-surface-2)'; }}
                            />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleGoToCategoryMappings(pktId)}
                              style={{
                                background: 'rgba(124,58,237,0.08)',
                                border: '1px solid rgba(124,58,237,0.3)',
                                color: 'var(--ds-spec)',
                                borderRadius: '4px',
                                padding: '2px 8px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Go to Category Mappings for this PSM AAW Paket ID"
                            >
                              <Icon name="folder" size={12} />
                              <span>Category Mappings ({(formData.categoryGroupings || []).filter(cg => cg.sku === pktId || cg.sku?.startsWith(`${pktId}-`) || cg.name?.includes(pktId)).reduce((sum, cg) => sum + (cg.category?.length || 0), 0)}) →</span>
                            </button>
                            <span style={{ fontSize: '11px', color: 'var(--ds-text-3)' }}>
                              {packetTerms.length} of 3 durations selected
                            </span>
                          </div>
                        </div>

                        {/* Duration Pills for this Packet ID: 24, 18, 12 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {[
                            { amount: 24, label: '24 Months' },
                            { amount: 18, label: '18 Months' },
                            { amount: 12, label: '12 Months' }
                          ].map(opt => {
                            const isSelected = packetTerms.some(t => t.duration?.amount === opt.amount);
                            const matchingTerm = packetTerms.find(t => t.duration?.amount === opt.amount);
                            const isDefault = matchingTerm?.isDefault;
                            return (
                              <button
                                key={opt.amount}
                                type="button"
                                onClick={() => handleToggleTerm(pktId, opt.amount)}
                                style={{
                                  background: isSelected ? (isDefault ? 'var(--ds-danger)' : 'var(--ds-danger-soft)') : '#ffffff',
                                  border: `1px solid ${isSelected ? (isDefault ? 'var(--ds-danger)' : '#f87171') : 'var(--ds-border-strong)'}`,
                                  color: isSelected ? (isDefault ? '#ffffff' : 'var(--ds-brand-text)') : 'var(--ds-text-2)',
                                  fontWeight: isSelected ? '700' : '500',
                                  borderRadius: '6px',
                                  padding: '6px 14px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                                }}
                              >
                                <span>{isSelected ? '✓' : '+'}</span>
                                <span>{opt.label}</span>
                                {isDefault && (
                                  <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.3)', padding: '1px 4px', borderRadius: '3px', fontWeight: '800' }}>
                                    Default
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Selected Terms Details Table for this Packet ID */}
                        {packetTerms.length > 0 && (
                          <div style={{
                            background: '#ffffff',
                            border: '1px solid var(--ds-border)',
                            borderRadius: '6px',
                            overflow: 'hidden'
                          }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                              <thead>
                                <tr style={{ background: 'var(--ds-surface-subtle)', borderBottom: '1px solid var(--ds-border)', color: 'var(--ds-text-2)', textAlign: 'left' }}>
                                  <th style={{ padding: '6px 10px', width: '28px', fontSize: '11px', fontWeight: '700' }}>#</th>
                                  <th style={{ padding: '6px 10px', width: '130px', fontSize: '11px', fontWeight: '700' }}>Commitment</th>
                                  <th style={{ padding: '6px 10px', width: '110px', fontSize: '11px', fontWeight: '700' }}>Default Term</th>
                                  <th style={{ padding: '6px 10px', fontSize: '11px', fontWeight: '700' }}>Contract Term SKU</th>
                                  <th style={{ padding: '6px 10px', width: '36px', textAlign: 'center', fontSize: '11px', fontWeight: '700' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {packetTerms.map((term, idx) => (
                                  <tr key={term.id || idx} style={{ borderBottom: '1px solid var(--ds-surface-2)' }}>
                                    <td style={{ padding: '6px 10px', color: 'var(--ds-text-3)', fontSize: '11px', fontFamily: 'var(--ds-font-mono)' }}>
                                      {idx + 1}
                                    </td>
                                    <td style={{ padding: '6px 10px' }}>
                                      <span style={{
                                        fontWeight: '700',
                                        color: 'var(--ds-text)',
                                        fontFamily: 'var(--ds-font-mono)',
                                        fontSize: '12px',
                                        background: 'var(--ds-surface-2)',
                                        padding: '2px 6px',
                                        borderRadius: '4px'
                                      }}>
                                        {term.duration.amount} {term.duration.units}s
                                      </span>
                                    </td>
                                    <td style={{ padding: '6px 10px' }}>
                                      {term.isDefault ? (
                                        <span style={{
                                          fontSize: '11px',
                                          fontWeight: '700',
                                          color: 'var(--ds-ok)',
                                          background: 'var(--ds-ok-soft)',
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          border: '1px solid var(--ds-ok-border)'
                                        }}>
                                          ★ Default
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleSetDefaultTerm(term.id)}
                                          style={{
                                            background: 'none',
                                            border: '1px solid var(--ds-border-strong)',
                                            borderRadius: '4px',
                                            padding: '2px 6px',
                                            fontSize: '11px',
                                            color: 'var(--ds-text-3)',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          Set as Default
                                        </button>
                                      )}
                                    </td>
                                    <td style={{ padding: '6px 10px' }}>
                                      <input
                                        type="text"
                                        value={term.sku || ''}
                                        onChange={(e) => handleTermSkuChange(term.id, e.target.value)}
                                        style={{
                                          ...inputStyle,
                                          padding: '4px 8px',
                                          fontSize: '12px',
                                          fontFamily: 'var(--ds-font-mono)',
                                          fontWeight: '600',
                                          color: 'var(--ds-warn)'
                                        }}
                                        placeholder={`e.g. ${pktId}-${term.duration.amount}`}
                                      />
                                    </td>
                                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                      {(formData.terms || []).length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => handleToggleTerm(pktId, term.duration.amount)}
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--ds-text-3)',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                          }}
                                          title="Deselect this term"
                                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ds-danger)'; }}
                                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ds-text-3)'; }}
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Display Name Characteristics (characteristics starting with display name, wired with characteristic values) */}
            <div style={{
              background: 'var(--ds-surface-subtle)',
              border: '1px solid var(--ds-border)',
              borderRadius: '8px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: C.text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Display Name Characteristics
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '12px'
              }}>
                {displayNameCharacteristics.map((c) => {
                  const charValue = c.values?.[0] !== undefined ? c.values[0] : (c.value || '');
                  return (
                    <div
                      key={c.id || c.name}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        background: '#ffffff',
                        border: '1px solid var(--ds-border)',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ ...labelStyle, marginBottom: 0, fontSize: '12px', fontWeight: '700', color: C.text, whiteSpace: 'nowrap' }}>
                          {formatCharLabel(c.name)}
                        </label>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <input
                          type="text"
                          value={charValue}
                          onChange={(e) => handleUpdateDisplayNameChar(c.name, e.target.value)}
                          style={{ ...inputStyle, width: '100%', fontSize: '13px', fontWeight: '500' }}
                          placeholder={`e.g. ${formData.name || 'Sales Package'} (${c.name})`}
                        />
                        {c.description && (
                          <p style={{ margin: 0, fontSize: '11px', color: C.muted, lineHeight: '1.4' }}>
                            {c.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Buttons for Name & Specs Tab */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid var(--ds-border)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('psmCodes')}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--ds-border-strong)',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--ds-text-2)',
                  cursor: 'pointer'
                }}
              >
                ← Back: STEP 4: PSM CODES
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                style={{
                  background: C.vodafoneRed,
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(230,0,0,0.2)'
                }}
              >
                Next: STEP 6: Categories →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 4: PSM CODES ─── */}
      {activeTab === 'psmCodes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

          {/* Card 1: Bundled POPs Matrix & Multi-POP Manager */}
          <div style={{
            background: C.panel,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: '10px',
            padding: '22px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            {/* Header & Quick Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: C.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Pricing Architecture & Bundled POP Assembly
                  </h3>
                  <span style={{ background: 'var(--ds-info-soft)', color: 'var(--ds-info)', border: '1px solid #bfdbfe', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
                    TMF620 Multi-POP
                  </span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: C.muted }}>
                  Assign multiple Bundled POPs (e.g. Basic, Comfort, and Fallback Speeds) for this Sales Package Offer. Each POP decomposes into 4 atomic components.
                </p>
              </div>

              {/* Action Buttons */}
              {/* Action Buttons: Button for Basic Variant & Button for Comfort Variant */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleAddBundledPop('basic')}
                  style={{
                    background: 'var(--ds-info-soft)',
                    color: 'var(--ds-info)',
                    border: '1px solid #bfdbfe',
                    borderRadius: '6px',
                    padding: '7px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}
                >
                  <span style={{ fontSize: '13px' }}>+</span>
                  <span>Add Basic Variant</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddBundledPop('comfort')}
                  style={{
                    background: 'var(--ds-spec-soft)',
                    color: 'var(--ds-spec)',
                    border: '1px solid #d8b4fe',
                    borderRadius: '6px',
                    padding: '7px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}
                >
                  <span style={{ fontSize: '13px' }}>+</span>
                  <span>Add Comfort Variant</span>
                </button>

                {(formData.fallbackBandwidths || []).length > 0 && (
                  <button
                    type="button"
                    onClick={handleGenerateFallbackPops}
                    style={{
                      background: 'var(--ds-surface-2)',
                      color: 'var(--ds-text)',
                      border: '1px solid var(--ds-border-strong)',
                      borderRadius: '6px',
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}
                    title="Generate Basic and Comfort Bundled POP variants for all selected fallback bandwidth tiers"
                  >
                    <Icon name="refresh" size={13} />
                    <span>Generate Fallback Bundles ({(formData.fallbackBandwidths || []).length} speeds)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bundled POPs Table */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--ds-border)',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'var(--ds-surface-subtle)',
                padding: '10px 14px',
                borderBottom: '1px solid var(--ds-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ds-text-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Bundled POPs for this Offer ({(formData.bundledPops || []).length})
                </span>
                <span style={{ fontSize: '11px', color: 'var(--ds-text-3)' }}>
                  Click a row to edit its atomic components and PSM codes below
                </span>
              </div>

              <BundledPopsTable
                pops={formData.bundledPops || []}
                selectedPopId={activePop?.id || selectedPopId}
                onSelectPop={handleSelectPop}
                isEditMode={true}
                onUpdatePop={handleUpdatePopField}
                onDuplicatePop={handleDuplicateBundledPop}
                onDeletePop={handleDeleteBundledPop}
                maxHeight="320px"
                plainColumns={true}
                aawPacketIdOptions={Array.from(new Set(
                  (formData.psmAawPacketIds && formData.psmAawPacketIds.length > 0
                    ? formData.psmAawPacketIds
                    : (formData.ccbMasterPacketId ? [formData.ccbMasterPacketId] : [])
                  ).filter(Boolean)
                ))}
                internetTariffOptions={(() => {
                  const map = new Map();
                  (formData.ccbTariffs || [])
                    .filter(t => t.serviceDomain === 'INTERNET' && t.pricingStructureCode)
                    .forEach(t => map.set(t.pricingStructureCode, { code: t.pricingStructureCode, name: t.name || '' }));
                  (formData.ccbTariffUiState?.createdTariffs?.INTERNET || [])
                    .filter(t => t.pricingStructureCode && !formData.ccbTariffUiState?.removedTariffs?.[`INTERNET|${t.pricingStructureCode}`])
                    .forEach(t => map.set(t.pricingStructureCode, { code: t.pricingStructureCode, name: t.name || '' }));
                  if (formData.selectedInternetTariffCode && !map.has(formData.selectedInternetTariffCode)) {
                    map.set(formData.selectedInternetTariffCode, { code: formData.selectedInternetTariffCode, name: formData.customInternetTariff?.name || '' });
                  }
                  return Array.from(map.values());
                })()}
                voiceTariffOptions={(() => {
                  const map = new Map();
                  (formData.ccbTariffs || [])
                    .filter(t => t.serviceDomain === 'VOICE' && t.pricingStructureCode)
                    .forEach(t => map.set(t.pricingStructureCode, { code: t.pricingStructureCode, name: t.name || '' }));
                  (formData.ccbTariffUiState?.createdTariffs?.VOICE || [])
                    .filter(t => t.pricingStructureCode && !formData.ccbTariffUiState?.removedTariffs?.[`VOICE|${t.pricingStructureCode}`])
                    .forEach(t => map.set(t.pricingStructureCode, { code: t.pricingStructureCode, name: t.name || '' }));
                  if (formData.selectedVoiceTariffCode && !map.has(formData.selectedVoiceTariffCode)) {
                    map.set(formData.selectedVoiceTariffCode, { code: formData.selectedVoiceTariffCode, name: formData.customVoiceTariff?.name || '' });
                  }
                  return Array.from(map.values());
                })()}
                bandwidthServiceOptions={(() => {
                  const map = new Map();
                  (formData.ccbServiceAssociations || [])
                    .filter(s => s.serviceDomain === 'INTERNET' && (s.tmfPopRole === '_bw' || s.serviceType === 'BANDWIDTH'))
                    .forEach(s => map.set(s.serviceCode, { code: s.serviceCode, name: s.serviceName || '' }));
                  return Array.from(map.values());
                })()}
              />
            </div>

            {/* Selected Bundled POP Configuration Panel */}
            {activePop ? (
              <div style={{
                background: 'var(--ds-surface-subtle)',
                border: '1px solid var(--ds-border-strong)',
                borderRadius: '8px',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
              {/* Active POP Identifier & Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: C.muted, textTransform: 'uppercase' }}>Selected POP ID:</span>
                  <code style={{ fontSize: '13px', fontFamily: 'var(--ds-font-mono)', fontWeight: '800', color: 'var(--ds-info)', background: '#e0f2fe', padding: '3px 8px', borderRadius: '4px' }}>
                    {activePop.id}
                  </code>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ds-text-2)' }}>Monthly Price:</span>
                  <div style={{ position: 'relative', width: '130px' }}>
                    <input
                      type="number"
                      step="0.01"
                      value={activePop.price !== undefined ? activePop.price : 44.99}
                      onChange={(e) => handleUpdateActivePopField('price', Number(e.target.value))}
                      style={{ ...inputStyle, paddingRight: '45px', fontWeight: '800', fontSize: '14px', textAlign: 'right' }}
                    />
                    <span style={{ position: 'absolute', right: '10px', top: '8px', fontSize: '11px', color: C.muted, fontWeight: '700' }}>
                      €/mo
                    </span>
                  </div>
                </div>
              </div>

              {/* Variant, Speed, and Play Type Selectors for Active POP */}
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid var(--ds-border)', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--ds-text-2)' }}>Connection Variant:</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[
                      { id: 'basic', label: 'Basic' },
                      { id: 'comfort', label: 'Comfort (ISDN)' }
                    ].map(v => {
                      const isSel = (activePop.connectionVariant || 'basic') === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleUpdateActivePopField('connectionVariant', v.id)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '12px',
                            borderRadius: '4px',
                            border: `1px solid ${isSel ? '#2563eb' : 'var(--ds-border-strong)'}`,
                            background: isSel ? 'var(--ds-info-soft)' : '#ffffff',
                            color: isSel ? 'var(--ds-info)' : 'var(--ds-text-2)',
                            fontWeight: isSel ? '700' : '500',
                            cursor: 'pointer'
                          }}
                        >
                          {v.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--ds-text-2)' }}>Play Type:</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[
                      { id: '2', label: '2-Play (Internet + Voice)' },
                      { id: '1', label: '1-Play (Internet Only)' }
                    ].map(p => {
                      const isSel = (activePop.playType || '2') === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleUpdateActivePopField('playType', p.id)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '12px',
                            borderRadius: '4px',
                            border: `1px solid ${isSel ? 'var(--ds-spec)' : 'var(--ds-border-strong)'}`,
                            background: isSel ? 'var(--ds-spec-soft)' : '#ffffff',
                            color: isSel ? 'var(--ds-spec)' : 'var(--ds-text-2)',
                            fontWeight: isSel ? '700' : '500',
                            cursor: 'pointer'
                          }}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--ds-text-2)' }}>Bandwidth:</span>
                  <input
                    type="number"
                    value={activePop.speed || formData.downstreamSpeed || 250}
                    onChange={(e) => handleUpdateActivePopField('speed', Number(e.target.value))}
                    style={{ ...inputStyle, width: '90px', padding: '4px 8px', fontSize: '12px', fontWeight: '700' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--ds-text-3)' }}>Mbit/s</span>
                </div>
              </div>

              {/* The 4 Atomic Components Grid for Active POP */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ds-text-2)', textTransform: 'uppercase' }}>
                    Atomic Components ({activePop.id})
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
                  {/* 1. Bandwidth Option (_bw) */}
                  <div style={{
                    border: '1px solid #bfdbfe',
                    background: 'var(--ds-info-soft)',
                    borderRadius: '8px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
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
                        Capacity: {activePop.speed || formData.downstreamSpeed || 250} Mbit/s
                      </div>
                      <div style={{ position: 'relative', marginBottom: '10px' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={activePop.popBandwidthAmount || 0}
                          onChange={(e) => handleUpdateActivePopField('popBandwidthAmount', Number(e.target.value))}
                          style={{ ...inputStyle, paddingRight: '45px', fontWeight: '700', fontSize: '14px' }}
                        />
                        <span style={{ position: 'absolute', right: '12px', top: '9px', fontSize: '12px', color: C.muted, fontWeight: '700' }}>
                          EUR
                        </span>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#1e40af', marginBottom: '2px' }}>
                          Speed Service Code (Internet)
                        </label>
                        {(() => {
                          const opts = Array.from(
                            new Map(
                              (formData.ccbServiceAssociations || [])
                                .filter(s => s.serviceDomain === 'INTERNET' && (s.tmfPopRole === '_bw' || s.serviceType === 'BANDWIDTH'))
                                .map(s => [s.serviceCode, s])
                            ).values()
                          );
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                type="text"
                                value={activePop.svcBw !== undefined ? activePop.svcBw : (activePop.speed >= 250 ? 'V018V' : activePop.speed >= 100 ? 'V018N' : activePop.speed >= 50 ? 'V018H' : 'V018C')}
                                onChange={(e) => handleUpdateActivePopField('svcBw', e.target.value)}
                                placeholder="e.g. V018V"
                                style={{ ...inputStyle, flex: 1, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', fontWeight: '700', color: '#1e40af', background: '#ffffff' }}
                              />
                              {opts.length > 0 && (
                                <select
                                  value=""
                                  onChange={(e) => {
                                    const svc = opts.find(o => o.serviceCode === e.target.value);
                                    if (!svc) return;
                                    const gross = Math.round(((Number(svc.rcNet) || 0) * 1.19 + Number.EPSILON) * 100) / 100;
                                    handleUpdateActivePopField('svcBw', svc.serviceCode);
                                    handleUpdateActivePopField('popBandwidthAmount', gross);
                                  }}
                                  title="Select Internet _bw service"
                                  style={{ width: '26px', padding: '7px 0', fontSize: '11px', borderRadius: '6px', border: '1px solid #bfdbfe', background: '#ffffff', color: '#1e40af', cursor: 'pointer' }}
                                >
                                  <option value="">▾</option>
                                  {opts.map(s => {
                                    const gross = Math.round(((Number(s.rcNet) || 0) * 1.19 + Number.EPSILON) * 100) / 100;
                                    return (
                                      <option key={s.serviceCode} value={s.serviceCode}>
                                        {s.serviceCode} — {s.serviceName} (€{gross.toFixed(2)})
                                      </option>
                                    );
                                  })}
                                </select>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--ds-text-3)', borderTop: '1px solid #dbeafe', paddingTop: '6px' }}>
                      SKU: <code>{formData.ccbBandwidthSku || 'BW_OPTION'}</code> • Svc: <code>{activePop.svcBw || 'V018V'}</code>
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
                    justifyContent: 'space-between'
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
                      <div style={{ position: 'relative', marginBottom: '10px' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={activePop.popInternetAmount !== undefined ? activePop.popInternetAmount : 14.00}
                          onChange={(e) => handleUpdateActivePopField('popInternetAmount', Number(e.target.value))}
                          style={{ ...inputStyle, paddingRight: '45px', fontWeight: '700', fontSize: '14px' }}
                        />
                        <span style={{ position: 'absolute', right: '12px', top: '9px', fontSize: '12px', color: C.muted, fontWeight: '700' }}>
                          EUR
                        </span>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-spec-text)', marginBottom: '2px' }}>
                          Access Service Code (Internet)
                        </label>
                        {(() => {
                          const opts = Array.from(
                            new Map(
                              (formData.ccbServiceAssociations || [])
                                .filter(s => s.serviceDomain === 'INTERNET' && s.tmfPopRole === '_in')
                                .map(s => [s.serviceCode, s])
                            ).values()
                          );
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                type="text"
                                value={activePop.svcIn !== undefined ? activePop.svcIn : 'V0017'}
                                onChange={(e) => handleUpdateActivePopField('svcIn', e.target.value)}
                                placeholder="e.g. V0017"
                                style={{ ...inputStyle, flex: 1, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', fontWeight: '700', color: 'var(--ds-spec-text)', background: '#ffffff' }}
                              />
                              {opts.length > 0 && (
                                <select
                                  value=""
                                  onChange={(e) => {
                                    const svc = opts.find(o => o.serviceCode === e.target.value);
                                    if (!svc) return;
                                    const gross = Math.round(((Number(svc.rcNet) || 0) * 1.19 + Number.EPSILON) * 100) / 100;
                                    handleUpdateActivePopField('svcIn', svc.serviceCode);
                                    handleUpdateActivePopField('popInternetAmount', gross);
                                  }}
                                  title="Select Internet _in service"
                                  style={{ width: '26px', padding: '7px 0', fontSize: '11px', borderRadius: '6px', border: '1px solid #e9d5ff', background: '#ffffff', color: 'var(--ds-spec-text)', cursor: 'pointer' }}
                                >
                                  <option value="">▾</option>
                                  {opts.map(s => {
                                    const gross = Math.round(((Number(s.rcNet) || 0) * 1.19 + Number.EPSILON) * 100) / 100;
                                    return (
                                      <option key={s.serviceCode} value={s.serviceCode}>
                                        {s.serviceCode} — {s.serviceName} (€{gross.toFixed(2)})
                                      </option>
                                    );
                                  })}
                                </select>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--ds-text-3)', borderTop: '1px solid var(--ds-spec-soft)', paddingTop: '6px' }}>
                      Tariff: <code>{activePop.tariffInternetNgn || activePop.tariffInternetBitstream || 'IP077'}</code> • Svc: <code>{activePop.svcIn || 'V0017'}</code>
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
                    justifyContent: 'space-between'
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
                        Landline connection access fee
                      </div>
                      <div style={{ position: 'relative', marginBottom: '10px' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={activePop.popVoiceAccessAmount !== undefined ? activePop.popVoiceAccessAmount : 15.99}
                          onChange={(e) => handleUpdateActivePopField('popVoiceAccessAmount', Number(e.target.value))}
                          style={{ ...inputStyle, paddingRight: '45px', fontWeight: '700', fontSize: '14px' }}
                        />
                        <span style={{ position: 'absolute', right: '12px', top: '9px', fontSize: '12px', color: C.muted, fontWeight: '700' }}>
                          EUR
                        </span>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        {(() => {
                          const vaOpts = Array.from(
                            new Map(
                              (formData.ccbServiceAssociations || [])
                                .filter(s => s.serviceDomain === 'VOICE' && s.tmfPopRole === '_va')
                                .map(s => [s.serviceCode, s])
                            ).values()
                          );
                          const renderVaSelect = (fieldKey) => vaOpts.length > 0 && (
                            <select
                              value=""
                              onChange={(e) => {
                                const svc = vaOpts.find(o => o.serviceCode === e.target.value);
                                if (!svc) return;
                                const gross = Math.round(((Number(svc.rcNet) || 0) * 1.19 + Number.EPSILON) * 100) / 100;
                                handleUpdateActivePopField(fieldKey, svc.serviceCode);
                                handleUpdateActivePopField('popVoiceAccessAmount', gross);
                              }}
                              title="Select Voice _va service"
                              style={{ width: '24px', padding: '6px 0', fontSize: '11px', borderRadius: '6px', border: '1px solid var(--ds-ok-border)', background: '#ffffff', color: 'var(--ds-ok)', cursor: 'pointer' }}
                            >
                              <option value="">▾</option>
                              {vaOpts.map(s => {
                                const gross = Math.round(((Number(s.rcNet) || 0) * 1.19 + Number.EPSILON) * 100) / 100;
                                return (
                                  <option key={s.serviceCode} value={s.serviceCode}>
                                    {s.serviceCode} — {s.serviceName} (€{gross.toFixed(2)})
                                  </option>
                                );
                              })}
                            </select>
                          );

                          if (formData.isNgnSupported && formData.isBitstreamSupported) {
                            return (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-ok)', marginBottom: '2px' }}>
                                    Svc (NGN)
                                  </label>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <input
                                      type="text"
                                      value={activePop.svcVaNgn !== undefined ? activePop.svcVaNgn : (activePop.connectionVariant === 'comfort' ? 'VI003' : 'VI002')}
                                      onChange={(e) => handleUpdateActivePopField('svcVaNgn', e.target.value)}
                                      placeholder="VI002"
                                      style={{ ...inputStyle, flex: 1, minWidth: 0, fontFamily: 'var(--ds-font-mono)', fontSize: '11px', fontWeight: '700', color: 'var(--ds-ok)', background: '#ffffff' }}
                                    />
                                    {renderVaSelect('svcVaNgn')}
                                  </div>
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-ok)', marginBottom: '2px' }}>
                                    Svc (Bitstream)
                                  </label>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <input
                                      type="text"
                                      value={activePop.svcVaBitstream !== undefined ? activePop.svcVaBitstream : (activePop.connectionVariant === 'comfort' ? 'VI006' : 'VI009')}
                                      onChange={(e) => handleUpdateActivePopField('svcVaBitstream', e.target.value)}
                                      placeholder="VI009"
                                      style={{ ...inputStyle, flex: 1, minWidth: 0, fontFamily: 'var(--ds-font-mono)', fontSize: '11px', fontWeight: '700', color: 'var(--ds-ok)', background: '#ffffff' }}
                                    />
                                    {renderVaSelect('svcVaBitstream')}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          if (formData.isBitstreamSupported) {
                            return (
                              <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-ok)', marginBottom: '2px' }}>
                                  Voice Access Svc Code (Bitstream)
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <input
                                    type="text"
                                    value={activePop.svcVaBitstream !== undefined ? activePop.svcVaBitstream : (activePop.connectionVariant === 'comfort' ? 'VI006' : 'VI009')}
                                    onChange={(e) => handleUpdateActivePopField('svcVaBitstream', e.target.value)}
                                    placeholder="e.g. VI009"
                                    style={{ ...inputStyle, flex: 1, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', fontWeight: '700', color: 'var(--ds-ok)', background: '#ffffff' }}
                                  />
                                  {renderVaSelect('svcVaBitstream')}
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-ok)', marginBottom: '2px' }}>
                                Voice Access Svc Code (NGN)
                              </label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                  type="text"
                                  value={activePop.svcVaNgn !== undefined ? activePop.svcVaNgn : (activePop.connectionVariant === 'comfort' ? 'VI003' : 'VI002')}
                                  onChange={(e) => handleUpdateActivePopField('svcVaNgn', e.target.value)}
                                  placeholder="e.g. VI002"
                                  style={{ ...inputStyle, flex: 1, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', fontWeight: '700', color: 'var(--ds-ok)', background: '#ffffff' }}
                                />
                                {renderVaSelect('svcVaNgn')}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--ds-text-3)', borderTop: '1px solid #d1fae5', paddingTop: '6px' }}>
                      NGN: <code>{activePop.svcVaNgn || (activePop.connectionVariant === 'comfort' ? 'VI003' : 'VI002')}</code> • DSL: <code>{activePop.svcVaBitstream || (activePop.connectionVariant === 'comfort' ? 'VI006' : 'VI009')}</code>
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
                    justifyContent: 'space-between'
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
                      <div style={{ position: 'relative', marginBottom: '10px' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={activePop.popVoiceTariffAmount !== undefined ? activePop.popVoiceTariffAmount : 5.00}
                          onChange={(e) => handleUpdateActivePopField('popVoiceTariffAmount', Number(e.target.value))}
                          style={{ ...inputStyle, paddingRight: '45px', fontWeight: '700', fontSize: '14px' }}
                        />
                        <span style={{ position: 'absolute', right: '12px', top: '9px', fontSize: '12px', color: C.muted, fontWeight: '700' }}>
                          EUR
                        </span>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-warn)', marginBottom: '2px' }}>
                          Flatrate Service Code (Voice)
                        </label>
                        {(() => {
                          const opts = Array.from(
                            new Map(
                              (formData.ccbServiceAssociations || [])
                                .filter(s => s.serviceDomain === 'VOICE' && s.tmfPopRole === '_vt')
                                .map(s => [s.serviceCode, s])
                            ).values()
                          );
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                type="text"
                                value={activePop.svcVt !== undefined ? activePop.svcVt : 'V0017'}
                                onChange={(e) => handleUpdateActivePopField('svcVt', e.target.value)}
                                placeholder="e.g. V0017"
                                style={{ ...inputStyle, flex: 1, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', fontWeight: '700', color: 'var(--ds-warn)', background: '#ffffff' }}
                              />
                              {opts.length > 0 && (
                                <select
                                  value=""
                                  onChange={(e) => {
                                    const svc = opts.find(o => o.serviceCode === e.target.value);
                                    if (!svc) return;
                                    const gross = Math.round(((Number(svc.rcNet) || 0) * 1.19 + Number.EPSILON) * 100) / 100;
                                    handleUpdateActivePopField('svcVt', svc.serviceCode);
                                    handleUpdateActivePopField('popVoiceTariffAmount', gross);
                                  }}
                                  title="Select Voice _vt service"
                                  style={{ width: '26px', padding: '7px 0', fontSize: '11px', borderRadius: '6px', border: '1px solid #fed7aa', background: '#ffffff', color: 'var(--ds-warn)', cursor: 'pointer' }}
                                >
                                  <option value="">▾</option>
                                  {opts.map(s => {
                                    const gross = Math.round(((Number(s.rcNet) || 0) * 1.19 + Number.EPSILON) * 100) / 100;
                                    return (
                                      <option key={s.serviceCode} value={s.serviceCode}>
                                        {s.serviceCode} — {s.serviceName} (€{gross.toFixed(2)})
                                      </option>
                                    );
                                  })}
                                </select>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--ds-text-3)', borderTop: '1px solid #fed7aa', paddingTop: '6px' }}>
                      Tariff: <code>{activePop.tariffVoiceNgn || activePop.tariffVoiceBitstream || 'VP077'}</code> • Svc: <code>{activePop.svcVt || 'V0017'}</code>
                    </div>
                  </div>
                </div>

                {/* Component Breakdown Summary */}
                <div style={{ background: '#ffffff', border: '1px solid var(--ds-border)', borderRadius: '6px', padding: '10px 14px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'gap', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ds-text-2)' }}>
                      Components Sum ({activePop.id}):
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: C.text }}>
                      €{popComponentsSum.toFixed(2)} / mo {isSumBalanced ? '✓ Balanced' : `(Diff: €${(Number(activePop.price || 0) - popComponentsSum).toFixed(2)})`}
                    </span>
                  </div>
                </div>

                {/* CCB Network Billing, Tariff & PSM Codes for this specific POP variant */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid var(--ds-border)', marginTop: '16px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--ds-text)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        CCB Network Billing, Tariff & PSM Codes ({activePop.id})
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--ds-text-3)' }}>
                        Syncs to offer characteristics: <code>psm_sales_packet_code</code>, <code>tariff_code_*</code>, <code>service_code_*</code>
                      </span>
                    </div>
                    <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: C.muted }}>
                      Configure the CCB PSM Sales Packet codes, Tariff codes, and Service codes for this variant across supported access networks.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
                    {/* NGN Network Billing Codes */}
                    {formData.isNgnSupported && (
                      <div style={{
                        background: '#ffffff',
                        border: '1px solid var(--ds-danger-border)',
                        borderTop: '3px solid var(--ds-danger)',
                        borderRadius: '8px',
                        padding: '14px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--ds-brand-text)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--ds-danger)' }}></span>
                            Vodafone NGN Network
                          </span>
                          <span style={{ fontSize: '11px', background: 'var(--ds-danger-soft)', color: 'var(--ds-brand-text)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                            FTTH / VDSL (NGN)
                          </span>
                        </div>

                        {/* NGN Internet Domain */}
                        <div style={{ background: 'var(--ds-danger-soft)', borderRadius: '6px', padding: '10px 12px', marginBottom: '10px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ds-brand-text)', marginBottom: '8px', textTransform: 'uppercase' }}>
                            Internet Domain (_in)
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-brand-text)', marginBottom: '2px' }}>
                                PSM Packet Code
                              </label>
                              <input
                                type="text"
                                value={activePop.psmInternetNgn || ''}
                                onChange={(e) => handleUpdateActivePopField('psmInternetNgn', e.target.value)}
                                placeholder="e.g. PI208"
                                style={{ ...inputStyle, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', fontWeight: '700', color: 'var(--ds-danger)', background: '#ffffff' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-brand-text)', marginBottom: '2px' }}>
                                Tariff Code
                              </label>
                              <input
                                type="text"
                                list="bundled-pops-internet-tariffs"
                                value={activePop.tariffInternetNgn || ''}
                                onChange={(e) => handleUpdateActivePopField('tariffInternetNgn', e.target.value)}
                                placeholder="e.g. IP077"
                                style={{ ...inputStyle, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', fontWeight: '700', color: 'var(--ds-danger)', background: '#ffffff' }}
                              />
                            </div>
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--ds-brand-text)' }}>
                                Service Codes (Combined: _in + _bw)
                              </label>
                              <span style={{ fontSize: '10px', color: 'var(--ds-brand-text)', background: 'var(--ds-danger-soft)', padding: '1px 5px', borderRadius: '3px', fontWeight: '600' }}>
                                Auto-Combined
                              </span>
                            </div>
                            <input
                              type="text"
                              value={activePop.serviceInternetNgn || ''}
                              onChange={(e) => handleUpdateActivePopField('serviceInternetNgn', e.target.value)}
                              placeholder="e.g. V0017, V018V"
                              style={{ ...inputStyle, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', color: 'var(--ds-text-2)', background: '#ffffff' }}
                            />
                          </div>
                        </div>

                        {/* NGN Voice Domain */}
                        <div style={{ background: 'var(--ds-danger-soft)', borderRadius: '6px', padding: '10px 12px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ds-brand-text)', marginBottom: '8px', textTransform: 'uppercase' }}>
                            Voice Domain (_va / _vt)
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-brand-text)', marginBottom: '2px' }}>
                                PSM Packet Code
                              </label>
                              <input
                                type="text"
                                value={activePop.psmVoiceNgn || ''}
                                onChange={(e) => handleUpdateActivePopField('psmVoiceNgn', e.target.value)}
                                placeholder="e.g. PI208"
                                style={{ ...inputStyle, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', fontWeight: '700', color: 'var(--ds-danger)', background: '#ffffff' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-brand-text)', marginBottom: '2px' }}>
                                Tariff Code
                              </label>
                              <input
                                type="text"
                                list="bundled-pops-voice-tariffs"
                                value={activePop.tariffVoiceNgn || ''}
                                onChange={(e) => handleUpdateActivePopField('tariffVoiceNgn', e.target.value)}
                                placeholder="e.g. VP077"
                                style={{ ...inputStyle, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', fontWeight: '700', color: 'var(--ds-danger)', background: '#ffffff' }}
                              />
                            </div>
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--ds-brand-text)' }}>
                                Service Codes (Combined: _vt + _va)
                              </label>
                              <span style={{ fontSize: '10px', color: 'var(--ds-brand-text)', background: 'var(--ds-danger-soft)', padding: '1px 5px', borderRadius: '3px', fontWeight: '600' }}>
                                Auto-Combined
                              </span>
                            </div>
                            <input
                              type="text"
                              value={activePop.serviceVoiceNgn || ''}
                              onChange={(e) => handleUpdateActivePopField('serviceVoiceNgn', e.target.value)}
                              placeholder="e.g. V0017, VI002"
                              style={{ ...inputStyle, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', color: 'var(--ds-text-2)', background: '#ffffff' }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bitstream Network Billing Codes */}
                    {formData.isBitstreamSupported && (
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
                            Wholesale DSL (Bitstream)
                          </span>
                        </div>

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
                              <input
                                type="text"
                                value={activePop.psmInternetBitstream || ''}
                                onChange={(e) => handleUpdateActivePopField('psmInternetBitstream', e.target.value)}
                                placeholder="e.g. PR403"
                                style={{ ...inputStyle, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', fontWeight: '700', color: 'var(--ds-spec-text)', background: '#ffffff' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-spec-text)', marginBottom: '2px' }}>
                                Tariff Code
                              </label>
                              <input
                                type="text"
                                list="bundled-pops-internet-tariffs"
                                value={activePop.tariffInternetBitstream || ''}
                                onChange={(e) => handleUpdateActivePopField('tariffInternetBitstream', e.target.value)}
                                placeholder="e.g. IP077"
                                style={{ ...inputStyle, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', fontWeight: '700', color: 'var(--ds-spec-text)', background: '#ffffff' }}
                              />
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
                            <input
                              type="text"
                              value={activePop.serviceInternetBitstream || ''}
                              onChange={(e) => handleUpdateActivePopField('serviceInternetBitstream', e.target.value)}
                              placeholder="e.g. V0017, V018V"
                              style={{ ...inputStyle, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', color: 'var(--ds-text-2)', background: '#ffffff' }}
                            />
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
                              <input
                                type="text"
                                value={activePop.psmVoiceBitstream || ''}
                                onChange={(e) => handleUpdateActivePopField('psmVoiceBitstream', e.target.value)}
                                placeholder="e.g. PR403"
                                style={{ ...inputStyle, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', fontWeight: '700', color: 'var(--ds-spec-text)', background: '#ffffff' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-spec-text)', marginBottom: '2px' }}>
                                Tariff Code
                              </label>
                              <input
                                type="text"
                                list="bundled-pops-voice-tariffs"
                                value={activePop.tariffVoiceBitstream || ''}
                                onChange={(e) => handleUpdateActivePopField('tariffVoiceBitstream', e.target.value)}
                                placeholder="e.g. VP077"
                                style={{ ...inputStyle, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', fontWeight: '700', color: 'var(--ds-spec-text)', background: '#ffffff' }}
                              />
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
                            <input
                              type="text"
                              value={activePop.serviceVoiceBitstream || ''}
                              onChange={(e) => handleUpdateActivePopField('serviceVoiceBitstream', e.target.value)}
                              placeholder="e.g. V0017, VI009"
                              style={{ ...inputStyle, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', color: 'var(--ds-text-2)', background: '#ffffff' }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'var(--ds-surface-subtle)',
              border: '1px dashed var(--ds-border-strong)',
              borderRadius: '8px',
              padding: '28px',
              textAlign: 'center',
              color: 'var(--ds-text-3)'
            }}>
              <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--ds-text-2)', marginBottom: '6px' }}>
                No Bundled POP Selected
              </div>
              <div style={{ fontSize: '12px' }}>
                Click <strong>+ Add Basic Variant</strong> or <strong>+ Add Comfort Variant</strong> above to configure atomic pricing and PSM codes.
              </div>
            </div>
          )}

            {/* Navigation Buttons for PSM CODES Tab */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid var(--ds-border)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('tariffSelection')}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--ds-border-strong)',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--ds-text-2)',
                  cursor: 'pointer'
                }}
              >
                ← Back: STEP 3: Tariff Selection
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('commercial')}
                style={{
                  background: C.vodafoneRed,
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(230,0,0,0.2)'
                }}
              >
                Next: STEP 5: Terms →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: SPECIFICATION & OVERRIDES / CHARACTERISTICS ─── */}
      {activeTab === 'characteristics' && (
        <OfferingSpecificationAndOverridesTab
          raw={formData}
          specObj={selectedSpecObj}
          specChars={formData.characteristics}
          directChars={formData.productOfferingCharacteristic}
          editable={true}
          onUpdateSpecChar={handleCharacteristicChange}
          onDeleteSpecChar={handleDeleteCharacteristic}
          onArrayValueChange={handleArrayValueChange}
          onAddArrayValue={handleAddArrayValue}
          onRemoveArrayValue={handleRemoveArrayValue}
          onToggleArrayType={handleToggleArrayType}
          onUpdateDirectChar={handleUpdateDirectChar}
          onDeleteDirectChar={handleDeleteDirectChar}
          onDirectArrayValueChange={handleDirectArrayValueChange}
          onAddDirectArrayValue={handleAddDirectArrayValue}
          onRemoveDirectArrayValue={handleRemoveDirectArrayValue}
          onToggleDirectArrayType={handleToggleDirectArrayType}
          onAddDirectChar={handleAddDirectChar}
          renderFooter={(
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '16px', borderTop: '1px solid var(--ds-border)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--ds-border-strong)',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--ds-text-2)',
                  cursor: 'pointer'
                }}
              >
                ← Back: STEP 6: Categories
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('review')}
                style={{
                  background: C.vodafoneRed,
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 3px rgba(230,0,0,0.2)'
                }}
              >
                <span>Next: Review & Summary</span>
                <span>→</span>
              </button>
            </div>
          )}
        />
      )}

      {/* ─── TAB 5: CATEGORIES & CATEGORY GROUPINGS ─── */}
      {activeTab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            background: C.panel,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: '10px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Header & Stats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h3 style={{
                  margin: '0 0 4px 0',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: C.text,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Icon name="folder" size={16} />
                  <span>Category Association & SKU Grouping</span>
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: C.muted, maxWidth: '720px' }}>
                  Associate sales package offers to product categories grouped by contract term SKU (Category Groupings).
                  First select the target SKU, then choose the category to associate to that SKU.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: 'var(--ds-spec)',
                  background: 'rgba(124,58,237,0.08)',
                  border: '1px solid rgba(124,58,237,0.25)',
                  padding: '4px 10px',
                  borderRadius: '6px'
                }}>
                  {(formData.categoryGroupings || []).length} { (formData.categoryGroupings || []).length === 1 ? 'Category Group' : 'Category Groups' }
                </span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: 'var(--ds-ok)',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  padding: '4px 10px',
                  borderRadius: '6px'
                }}>
                  {(formData.category || []).length} { (formData.category || []).length === 1 ? 'Associated Category' : 'Associated Categories' }
                </span>
              </div>
            </div>

            {/* ── STEP 1: SELECT SKU ── */}
            <div style={{
              background: 'var(--ds-surface-subtle)',
              border: '1px solid var(--ds-border)',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: C.vodafoneRed,
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '800'
                  }}>
                    1
                  </span>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ds-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Select SKU for Category Association *
                  </label>
                </div>

                <span style={{ fontSize: '11px', color: 'var(--ds-text-3)' }}>
                  Possible SKUs from configured Contract Terms ({possibleSkus.length} available)
                </span>
              </div>

              {/* SKU Selection Cards / Pills */}
              {possibleSkus.length === 0 ? (
                <div style={{
                  background: 'var(--ds-surface-subtle)',
                  border: '1px dashed var(--ds-border)',
                  borderRadius: '8px',
                  padding: '16px',
                  fontSize: '12px',
                  color: 'var(--ds-text-3)',
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}>
                  No SKUs available yet. Please add a PSM AAW Paket ID and select contract terms in Tab 1, or enter a custom SKU below.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  {possibleSkus.map(s => {
                    const isSelected = activeSelectedSku === s.sku;
                    const groupForSku = (formData.categoryGroupings || []).find(g => g.sku === s.sku);
                    const catsCount = groupForSku?.category?.length || 0;

                    return (
                      <div
                        key={s.sku}
                        onClick={() => setSelectedSkuForCategory(s.sku)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: isSelected ? `2px solid ${C.vodafoneRed}` : '1px solid var(--ds-border)',
                          background: isSelected ? 'rgba(230,0,0,0.04)' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 2px 6px rgba(230,0,0,0.12)' : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="radio"
                              name="selectedSkuRadio"
                              checked={isSelected}
                              onChange={() => setSelectedSkuForCategory(s.sku)}
                              style={{ accentColor: C.vodafoneRed, cursor: 'pointer' }}
                            />
                            <span style={{
                              fontFamily: 'var(--ds-font-mono)',
                              fontSize: '12px',
                              fontWeight: '700',
                              color: isSelected ? C.vodafoneRed : 'var(--ds-text)'
                            }}>
                              {s.sku}
                            </span>
                          </div>
                          {s.isDefault && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              background: 'var(--ds-brand-soft)',
                              color: 'var(--ds-brand)',
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}>
                              DEFAULT
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--ds-text-3)', paddingLeft: '22px' }}>
                          <span>{s.duration ? `${s.duration} Months Term` : 'PSM AAW Paket Id'}</span>
                          <span style={{
                            fontWeight: '600',
                            color: catsCount > 0 ? 'var(--ds-ok)' : 'var(--ds-text-3)'
                          }}>
                            {catsCount > 0 ? `${catsCount} categories` : 'No categories'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Custom SKU Option */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                {!isAddingCustomSku ? (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomSku(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: C.vodafoneRed,
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0
                    }}
                  >
                    <span>+ Add Custom SKU manually</span>
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Enter SKU (e.g. R025.5000000530-CUSTOM)"
                      value={customSkuInput}
                      onChange={(e) => setCustomSkuInput(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        fontSize: '12px',
                        fontFamily: 'var(--ds-font-mono)',
                        border: '1px solid var(--ds-border-strong)',
                        borderRadius: '6px',
                        outline: 'none',
                        width: '240px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSku}
                      style={{
                        background: C.vodafoneRed,
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Add SKU
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsAddingCustomSku(false); setCustomSkuInput(''); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: C.muted,
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── STEP 2: ASSOCIATE CATEGORY TO SELECTED SKU ── */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--ds-border)',
              borderRadius: '8px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: C.vodafoneRed,
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '800'
                  }}>
                    2
                  </span>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ds-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Associate Category to Target SKU
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: C.muted }}>Target SKU:</span>
                  <span style={{
                    fontFamily: 'var(--ds-font-mono)',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: C.vodafoneRed,
                    background: 'var(--ds-brand-soft)',
                    border: '1px solid rgba(230,0,0,0.2)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {activeSelectedSku || 'None Selected'}
                  </span>
                </div>
              </div>

              {/* Category Picker Controls */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                {/* Single Unified Searchable Category Box */}
                <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ds-text-2)', textTransform: 'uppercase' }}>
                    Select / Filter Category from Catalog
                  </label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      type="text"
                      placeholder="Type to filter and select category (e.g. Glasfaser 10/25, FN0553)..."
                      value={categorySearchQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCategorySearchQuery(val);
                        setIsCategoryDropdownOpen(true);
                        const exact = categoriesCatalog.find(c =>
                          `${c.name} (${c.id})`.toLowerCase() === val.toLowerCase() ||
                          c.id.toLowerCase() === val.toLowerCase()
                        );
                        if (exact) {
                          setSelectedCategoryId(exact.id);
                        } else {
                          setSelectedCategoryId('');
                        }
                      }}
                      onFocus={() => setIsCategoryDropdownOpen(true)}
                      onBlur={() => {
                        setTimeout(() => setIsCategoryDropdownOpen(false), 220);
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 36px 9px 12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        border: isCategoryDropdownOpen ? `1px solid ${C.vodafoneRed}` : '1px solid var(--ds-border-strong)',
                        borderRadius: '6px',
                        background: '#ffffff',
                        color: C.text,
                        outline: 'none',
                        boxSizing: 'border-box',
                        boxShadow: isCategoryDropdownOpen ? '0 0 0 2px rgba(230,0,0,0.1)' : 'none'
                      }}
                    />

                    {/* Right action icons (Clear & Dropdown Arrow) */}
                    <div style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {categorySearchQuery && (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setCategorySearchQuery('');
                            setSelectedCategoryId('');
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: C.muted,
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '2px 4px',
                            borderRadius: '3px'
                          }}
                          title="Clear category selection"
                        >
                          ✕
                        </button>
                      )}
                      <span
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setIsCategoryDropdownOpen(prev => !prev);
                        }}
                        style={{
                          fontSize: '10px',
                          color: C.muted,
                          cursor: 'pointer',
                          padding: '2px',
                          transform: isCategoryDropdownOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        ▼
                      </span>
                    </div>

                    {/* Dropdown Menu */}
                    {isCategoryDropdownOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          left: 0,
                          right: 0,
                          maxHeight: '260px',
                          overflowY: 'auto',
                          background: '#ffffff',
                          border: '1px solid var(--ds-border-strong)',
                          borderRadius: '6px',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                          zIndex: 100
                        }}
                      >
                        <div style={{
                          padding: '6px 12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: 'var(--ds-text-3)',
                          textTransform: 'uppercase',
                          background: 'var(--ds-surface-subtle)',
                          borderBottom: '1px solid var(--ds-border)'
                        }}>
                          {filteredCategoriesCatalog.length} {filteredCategoriesCatalog.length === 1 ? 'Category' : 'Categories'} Available
                        </div>

                        {filteredCategoriesCatalog.length === 0 ? (
                          <div style={{ padding: '12px 14px', fontSize: '12px', color: C.muted, fontStyle: 'italic' }}>
                            No categories matching "{categorySearchQuery}".
                          </div>
                        ) : (
                          filteredCategoriesCatalog.map(cat => {
                            const isSelected = selectedCategoryId === cat.id;
                            return (
                              <div
                                key={cat.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setSelectedCategoryId(cat.id);
                                  setCategorySearchQuery(`${cat.name} (${cat.id})`);
                                  setIsCategoryDropdownOpen(false);
                                }}
                                style={{
                                  padding: '8px 12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                  cursor: 'pointer',
                                  background: isSelected ? 'rgba(230,0,0,0.06)' : '#ffffff',
                                  borderBottom: '1px solid var(--ds-surface-subtle)',
                                  transition: 'background 0.1s ease'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) e.currentTarget.style.background = 'var(--ds-surface-subtle)';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) e.currentTarget.style.background = '#ffffff';
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '12px' }}><Icon name="tag" size={13} /></span>
                                  <span style={{ fontSize: '13px', fontWeight: isSelected ? '700' : '500', color: isSelected ? C.vodafoneRed : C.text }}>
                                    {cat.name}
                                  </span>
                                </div>
                                <code style={{
                                  fontSize: '11px',
                                  fontFamily: 'var(--ds-font-mono)',
                                  background: isSelected ? 'rgba(230,0,0,0.1)' : 'var(--ds-surface-2)',
                                  color: isSelected ? C.vodafoneRed : 'var(--ds-text-2)',
                                  padding: '1px 6px',
                                  borderRadius: '4px'
                                }}>
                                  {cat.id}
                                </code>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Association Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    disabled={!activeSelectedSku || (!selectedCategoryId && !categorySearchQuery)}
                    onClick={() => {
                      const cat = categoriesCatalog.find(c => c.id === selectedCategoryId) ||
                        categoriesCatalog.find(c => `${c.name} (${c.id})`.toLowerCase() === categorySearchQuery.toLowerCase() || c.id.toLowerCase() === categorySearchQuery.toLowerCase());
                      if (cat && activeSelectedSku) {
                        handleAssociateCategoryToSku(activeSelectedSku, cat);
                        setSelectedCategoryId('');
                        setCategorySearchQuery('');
                      }
                    }}
                    style={{
                      background: (!activeSelectedSku || (!selectedCategoryId && !categorySearchQuery)) ? 'var(--ds-surface-2)' : C.vodafoneRed,
                      color: (!activeSelectedSku || (!selectedCategoryId && !categorySearchQuery)) ? 'var(--ds-text-3)' : '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '9px 16px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: (!activeSelectedSku || (!selectedCategoryId && !categorySearchQuery)) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: (!activeSelectedSku || (!selectedCategoryId && !categorySearchQuery)) ? 'none' : '0 1px 3px rgba(230,0,0,0.2)'
                    }}
                  >
                    <span>+ Associate to {activeSelectedSku || 'Selected SKU'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={!selectedCategoryId && !categorySearchQuery}
                    onClick={() => {
                      const cat = categoriesCatalog.find(c => c.id === selectedCategoryId) ||
                        categoriesCatalog.find(c => `${c.name} (${c.id})`.toLowerCase() === categorySearchQuery.toLowerCase() || c.id.toLowerCase() === categorySearchQuery.toLowerCase());
                      if (cat) {
                        handleAssociateCategoryToAllSkus(cat);
                        setSelectedCategoryId('');
                        setCategorySearchQuery('');
                      }
                    }}
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--ds-border-strong)',
                      borderRadius: '6px',
                      padding: '9px 14px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: (!selectedCategoryId && !categorySearchQuery) ? 'var(--ds-text-3)' : 'var(--ds-text)',
                      cursor: (!selectedCategoryId && !categorySearchQuery) ? 'not-allowed' : 'pointer'
                    }}
                    title="Associate this category to all configured term SKUs"
                  >
                    Associate to All SKUs
                  </button>
                </div>
              </div>

              {/* Quick Vodafone Technology Presets */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '6px', borderTop: '1px solid var(--ds-border)' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ds-text-3)', textTransform: 'uppercase' }}>
                  Quick Presets:
                </span>
                {recommendedCategories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleAssociateCategoryToSku(activeSelectedSku, cat)}
                    style={{
                      background: 'var(--ds-surface-subtle)',
                      border: '1px solid var(--ds-border)',
                      borderRadius: '16px',
                      padding: '3px 10px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: 'var(--ds-brand-dark)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.vodafoneRed; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ds-border)'; }}
                    title={`Associate ${cat.name} (${cat.id}) to ${activeSelectedSku}`}
                  >
                    + {cat.name} ({cat.id})
                  </button>
                ))}
              </div>
            </div>

            {/* ── STEP 3: CONFIGURED CATEGORY GROUPINGS TREE ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: C.text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Configured Category Groupings Tree
                </h4>
                <span style={{ fontSize: '11px', color: C.muted }}>
                  Level 1: Category Group (SKU) • Level 2: Associated Product Categories
                </span>
              </div>

              {(formData.categoryGroupings || []).length === 0 ? (
                <div style={{
                  padding: '32px 20px',
                  textAlign: 'center',
                  background: 'var(--ds-surface-subtle)',
                  border: '1px dashed var(--ds-border-strong)',
                  borderRadius: '8px',
                  color: C.muted
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '6px' }}><Icon name="folder" size={28} /></div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: C.text }}>No Category Groupings Configured Yet</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    Select a SKU above and choose catalog categories to associate as category groupings.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(formData.categoryGroupings || []).map((group, gIdx) => {
                    const isExpanded = expandedGroupIds[group.id || group.sku] !== false;
                    const catList = group.category || [];

                    return (
                      <div
                        key={group.id || group.sku || gIdx}
                        style={{
                          background: '#ffffff',
                          border: `1px solid ${C.cardBorder}`,
                          borderRadius: '8px',
                          overflow: 'hidden',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                        }}
                      >
                        {/* Level 1: Group Node */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            background: isExpanded ? 'var(--ds-surface-subtle)' : '#ffffff',
                            borderBottom: isExpanded ? `1px solid ${C.cardBorder}` : 'none',
                            userSelect: 'none'
                          }}
                        >
                          <div
                            onClick={() => toggleGroup(group.id || group.sku)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}
                          >
                            <span style={{
                              fontSize: '11px',
                              color: 'var(--ds-brand-dark)',
                              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.15s ease'
                            }}>
                              ▶
                            </span>
                            <span style={{ fontSize: '15px' }}><Icon name="folder" size={15} /></span>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: C.text }}>
                              {group.name}
                            </span>
                            <span style={{
                              fontFamily: 'var(--ds-font-mono)',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: 'var(--ds-spec)',
                              background: 'rgba(124,58,237,0.08)',
                              border: '1px solid rgba(124,58,237,0.25)',
                              padding: '1px 8px',
                              borderRadius: '4px'
                            }}>
                              SKU: {group.sku}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              color: 'var(--ds-text-2)',
                              background: 'var(--ds-border)',
                              padding: '1px 8px',
                              borderRadius: '10px'
                            }}>
                              {catList.length} {catList.length === 1 ? 'category' : 'categories'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedSkuForCategory(group.sku)}
                              style={{
                                background: 'none',
                                border: '1px solid var(--ds-border)',
                                borderRadius: '4px',
                                padding: '3px 8px',
                                fontSize: '11px',
                                color: C.vodafoneRed,
                                cursor: 'pointer'
                              }}
                              title="Select this SKU in Step 1 to add more categories"
                            >
                              + Add Category
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveCategoryGroup(group.id || group.sku)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--ds-danger)',
                                fontSize: '11px',
                                cursor: 'pointer',
                                padding: '2px 6px'
                              }}
                              title="Delete this entire category group"
                            >
                              Remove Group
                            </button>
                          </div>
                        </div>

                        {/* Level 2: Associated Categories List */}
                        {isExpanded && (
                          <div style={{ padding: '10px 14px 12px 28px', display: 'flex', flexDirection: 'column', gap: '6px', background: '#ffffff' }}>
                            {catList.length === 0 ? (
                              <div style={{ fontSize: '12px', color: C.muted, fontStyle: 'italic', padding: '6px 0' }}>
                                No categories associated with this SKU yet.
                              </div>
                            ) : (
                              catList.map((cat, cIdx) => (
                                <div
                                  key={cat.id || cIdx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '6px 12px',
                                    background: 'var(--ds-surface-subtle)',
                                    border: '1px solid var(--ds-border)',
                                    borderRadius: '6px'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '13px' }}><Icon name="tag" size={13} /></span>
                                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: C.text }}>
                                      {cat.name}
                                    </span>
                                    <code style={{
                                      fontSize: '11px',
                                      fontFamily: 'var(--ds-font-mono)',
                                      color: 'var(--ds-brand)',
                                      background: 'var(--ds-surface-2)',
                                      padding: '1px 6px',
                                      borderRadius: '4px'
                                    }}>
                                      {cat.id}
                                    </code>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDisassociateCategoryFromSku(group.sku, cat.id)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--ds-text-3)',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      padding: '2px 6px'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ds-danger)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ds-text-3)'; }}
                                    title="Disassociate this category from this SKU"
                                  >
                                    ✕ Disassociate
                                  </button>
                                </div>
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

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid var(--ds-border)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('commercial')}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--ds-border-strong)',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--ds-text-2)',
                  cursor: 'pointer'
                }}
              >
                ← Back: STEP 5: Terms
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('characteristics')}
                style={{
                  background: C.vodafoneRed,
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 3px rgba(230,0,0,0.2)'
                }}
              >
                <span>Next: Offering Characteristics</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 6: REVIEW & SUMMARY ─── */}
      {activeTab === 'review' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            background: C.panel,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: '10px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: '700',
              color: C.text,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Package Review Summary
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', background: 'var(--ds-surface-subtle)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ds-border)' }}>
              <div>
                <span style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase' }}>Package Name</span>
                <div style={{ fontSize: '13px', fontWeight: '700', color: formData.name ? C.text : C.muted, marginTop: '2px' }}>
                  {formData.name || 'Untitled Sales Package'}
                </div>
              </div>
              {formData.portfolio_id && (
                <div>
                  <span style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase' }}>Portfolio Id</span>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ds-text)', marginTop: '2px', fontFamily: 'var(--ds-font-mono)' }}>
                    {formData.portfolio_id}
                  </div>
                </div>
              )}
              <div>
                <span style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase' }}>Supported Networks & Codes</span>
                <div style={{ fontSize: '12px', fontWeight: '700', marginTop: '2px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {formData.isNgnSupported && (
                    <span style={{ background: 'var(--ds-danger-soft)', color: 'var(--ds-danger)', padding: '2px 6px', borderRadius: '4px' }}>
                      NGN: <code>{formData.productCodeNgn || 'I1204'}</code>
                    </span>
                  )}
                  {formData.isBitstreamSupported && (
                    <span style={{ background: 'var(--ds-spec-soft)', color: 'var(--ds-spec)', padding: '2px 6px', borderRadius: '4px' }}>
                      Bitstream: <code>{formData.productCodeBitstream || 'I1203'}</code>
                    </span>
                  )}
                  {!formData.isNgnSupported && !formData.isBitstreamSupported && (
                    <span style={{ color: C.muted }}>None</span>
                  )}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase' }}>Bandwidth Option</span>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f766e', marginTop: '2px' }}>
                  {formData.bandwidthOption || 'None selected'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase' }}>Speeds (Down / Up)</span>
                <div style={{ fontSize: '13px', fontWeight: '700', color: C.text, marginTop: '2px' }}>
                  {formData.downstreamSpeed && formData.upstreamSpeed
                    ? `${formData.downstreamSpeed} / ${formData.upstreamSpeed} Mbps`
                    : '-'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase' }}>Fallback Bandwidths</span>
                <div style={{ fontSize: '12px', fontWeight: '600', color: (formData.fallbackBandwidths || []).length > 0 ? 'var(--ds-text)' : C.muted, marginTop: '2px' }}>
                  {(formData.fallbackBandwidths || []).length > 0
                    ? `${formData.fallbackBandwidths.join(', ')} Mbit/s`
                    : 'None'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase' }}>Package Code</span>
                <div style={{ fontSize: '12px', fontFamily: 'var(--ds-font-mono)', fontWeight: '700', color: 'var(--ds-text)', marginTop: '2px' }}>
                  {formData.code || '-'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase' }}>PSM AAW Paket Id(s)</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                  {(formData.psmAawPacketIds || []).length === 0 ? (
                    <span style={{ fontSize: '12px', color: C.muted }}>None configured</span>
                  ) : (
                    formData.psmAawPacketIds.map((pkt, idx) => (
                      <span key={pkt || idx} style={{
                        fontSize: '12px',
                        fontFamily: 'var(--ds-font-mono)',
                        fontWeight: '700',
                        color: 'var(--ds-warn)',
                        background: 'var(--ds-surface-2)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: (formData.ccbMasterPacketId === pkt || idx === 0) ? '1px solid var(--ds-warn)' : '1px solid var(--ds-border)'
                      }}>
                        {pkt} {(formData.ccbMasterPacketId === pkt || idx === 0) ? '★' : ''}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--ds-surface-subtle)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ds-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', fontWeight: '700' }}>
                  Bundled Product Offering Prices ({(formData.bundledPops || []).length})
                </span>
                <span style={{ fontSize: '11px', color: 'var(--ds-text-3)' }}>
                  Standard Price: <strong>€{formData.standardPrice} / mo</strong>
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(formData.bundledPops || []).map((pop, idx) => (
                  <div key={pop.id || idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#ffffff',
                    border: '1px solid var(--ds-border)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', color: 'var(--ds-info)' }}>{pop.id}</code>
                      <span style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        fontWeight: '700',
                        background: pop.connectionVariant === 'comfort' ? 'var(--ds-spec-soft)' : 'var(--ds-info-soft)',
                        color: pop.connectionVariant === 'comfort' ? 'var(--ds-spec)' : 'var(--ds-info)'
                      }}>
                        {pop.connectionVariant === 'comfort' ? 'Comfort (ISDN)' : 'Basic'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--ds-text-3)' }}>{pop.speed || formData.downstreamSpeed} Mbit/s</span>
                      <span style={{ fontSize: '11px', color: 'var(--ds-text-3)' }}>{pop.playType === '1' ? '1-Play' : '2-Play'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--ds-text-3)' }}>
                        BW: €{pop.popBandwidthAmount} • IN: €{pop.popInternetAmount} • VA: €{pop.popVoiceAccessAmount} • VT: €{pop.popVoiceTariffAmount}
                      </span>
                      <span style={{ fontWeight: '800', color: C.text, fontSize: '13px' }}>€{pop.price} / mo</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', background: 'var(--ds-surface-subtle)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ds-border)' }}>
              <div>
                <span style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase' }}>
                  Contract Terms ({(formData.terms || []).length})
                </span>
                <div style={{ fontSize: '12px', fontWeight: '700', color: C.text, marginTop: '2px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(formData.terms || []).map(t => (
                    <span key={t.id} style={{
                      background: t.isDefault ? 'var(--ds-danger-soft)' : 'var(--ds-surface-2)',
                      color: t.isDefault ? 'var(--ds-danger)' : 'var(--ds-text-2)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${t.isDefault ? '#fca5a5' : 'var(--ds-border)'}`,
                      fontFamily: 'var(--ds-font-mono)',
                      fontSize: '11px'
                    }}>
                      {t.duration.amount}M {t.isDefault ? '★' : ''} ({t.sku})
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase' }}>Product Specification</span>
                <div style={{ fontSize: '12px', fontFamily: 'var(--ds-font-mono)', fontWeight: '700', color: 'var(--ds-text-2)', marginTop: '2px' }}>
                  {formData.specificationName}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase' }}>Characteristics</span>
                <div style={{ fontSize: '12px', fontFamily: 'var(--ds-font-mono)', fontWeight: '700', color: 'var(--ds-ok)', marginTop: '2px' }}>
                  {(formData.characteristics || []).length} configured
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase' }}>Direct Characteristics</span>
                <div style={{ fontSize: '12px', fontFamily: 'var(--ds-font-mono)', fontWeight: '700', color: 'var(--ds-spec)', marginTop: '2px' }}>
                  {(formData.productOfferingCharacteristic || []).length} configured
                  {(formData.portfolio_id || (formData.productOfferingCharacteristic || []).some(c => (c.name || '').toLowerCase() === 'portfolio_id')) && (
                    <span style={{ fontSize: '10.5px', marginLeft: '6px', background: 'rgba(124,58,237,0.1)', color: 'var(--ds-spec)', padding: '1px 5px', borderRadius: '3px' }}>
                      PF: {formData.portfolio_id || (formData.productOfferingCharacteristic || []).find(c => (c.name || '').toLowerCase() === 'portfolio_id')?.value}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase' }}>
                  Category Groupings ({(formData.categoryGroupings || []).length})
                </span>
                <div style={{ fontSize: '12px', fontWeight: '700', color: C.text, marginTop: '2px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(formData.categoryGroupings || []).map(cg => (
                    <span key={cg.id || cg.sku} style={{
                      background: 'rgba(124,58,237,0.08)',
                      color: 'var(--ds-spec)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(124,58,237,0.2)',
                      fontFamily: 'var(--ds-font-mono)',
                      fontSize: '11px'
                    }}>
                      {cg.sku}: {(cg.category || []).map(c => c.name || c.id).join(', ') || 'No categories'}
                    </span>
                  ))}
                  {(formData.categoryGroupings || []).length === 0 && (
                    <span style={{ color: C.muted }}>None configured</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--ds-border)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--ds-border-strong)',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--ds-text-2)',
                  cursor: 'pointer'
                }}
              >
                ← Back: Categories
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--ds-border-strong)',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--ds-text-2)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  style={{
                    background: C.vodafoneRed,
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 24px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(230,0,0,0.2)'
                  }}
                >
                  Confirm & Deploy to Catalog
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Bandwidth SKU Detail Modal ─── */}
      {inspectedBandwidth && (
        <BandwidthSkuDetailModal
          isOpen={Boolean(inspectedBandwidth)}
          onClose={() => setInspectedBandwidth(null)}
          tier={inspectedBandwidth.tier}
          matchingOffer={inspectedBandwidth.matchingOffer}
          allEntities={catalogPool}
          onNavigateToEntity={onNavigateToEntity}
        />
      )}

      {/* ─── Review & Publish Synchronous Envelope Modal ─── */}
      <ReviewAndPublishEnvelopeModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        envelope={synchronousEnvelope}
        formData={formData}
        onSuccess={handlePublishSuccess}
      />
    </div>
  );
}
