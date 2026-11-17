import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from '../ui/Icon';
import { isSalesPackageSpec } from '../../utils/entityClassifiers';
import { C } from '../../styles/theme';
import BandwidthSkuDetailModal from './BandwidthSkuDetailModal';
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
  allEntities = [],
  onClose,
  onSuccessRefresh,
  activeEnv,
  token,
  onNavigateToEntity
}) {
  const [activeTab, setActiveTab] = useState('commercial');
  const [inspectedBandwidth, setInspectedBandwidth] = useState(null);
  const [remoteCatalogOfferings, setRemoteCatalogOfferings] = useState([]);
  const [remoteSpecifications, setRemoteSpecifications] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [autoSelectedMeta, setAutoSelectedMeta] = useState(null);
  const [charFilterQuery, setCharFilterQuery] = useState('');
  const [selectedPopId, setSelectedPopId] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  // ─── Filterable Template Dropdown State ───
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const templateDropdownRef = useRef(null);

  // ─── Filterable Specification Dropdown State ───
  const [specSearchQuery, setSpecSearchQuery] = useState('');
  const [isSpecDropdownOpen, setIsSpecDropdownOpen] = useState(false);
  const specDropdownRef = useRef(null);

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

  const selectedTemplateDisplayName = useMemo(() => {
    if (selectedTemplateObj) {
      return `${selectedTemplateObj.name} (${selectedTemplateObj.technology} · ${selectedTemplateObj.id})`;
    }
    return '';
  }, [selectedTemplateObj]);

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
        chars.forEach(c => {
          const cname = (c.name || '').toLowerCase();
          if (cname === 'sku') {
            const v = c.productSpecCharacteristicValue?.[0]?.value || c.value;
            if (v) sku = String(v);
          } else if (cname === 'service_code') {
            const v = c.productSpecCharacteristicValue?.[0]?.value || c.value;
            if (v) serviceCode = String(v);
          } else if (cname === 'bandbreite') {
            const v = c.productSpecCharacteristicValue?.[0]?.value || c.value;
            if (v) bandbreite = String(v);
          }
        });

        const realBandwidth = extractRealBandwidth(sku, serviceCode);

        map.set(id, {
          id,
          name,
          specId,
          specName,
          sku,
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
        { id: 'po_V018V_FN_Options_Bandwidth', name: 'DSL Bandbreite 250 Mbit/s', sku: 'IP077V018VIB', serviceCode: 'V018V', realBandwidth: 'V018V', speeds: { down: 250, up: 40 } },
        { id: 'po_V018U_FN_Options_Bandwidth', name: 'DSL Bandbreite 175 Mbit/s', sku: 'IP077V018UIB', serviceCode: 'V018U', realBandwidth: 'V018U', speeds: { down: 175, up: 40 } },
        { id: 'po_IG017_FN_Options_Bandwidth', name: 'Glasfaser Bandbreite 150 Mbit/s', sku: 'IG017', serviceCode: 'IG017', realBandwidth: 'IG017', speeds: { down: 150, up: 30 } },
        { id: 'po_V018N_FN_Options_Bandwidth', name: 'DSL Bandbreite 100 Mbit/s', sku: 'IP076V018NIB', serviceCode: 'V018N', realBandwidth: 'V018N', speeds: { down: 100, up: 40 } },
        { id: 'po_V018H_FN_Options_Bandwidth', name: 'DSL Bandbreite 50 Mbit/s', sku: 'IP074V018HIB', serviceCode: 'V018H', realBandwidth: 'V018H', speeds: { down: 50, up: 10 } },
        { id: 'po_V018G_FN_Options_Bandwidth', name: 'DSL Bandbreite 25 Mbit/s', sku: 'IP074V018GIB', serviceCode: 'V018G', realBandwidth: 'V018G', speeds: { down: 25, up: 5 } },
        { id: 'po_V018C_FN_Options_Bandwidth', name: 'DSL Bandbreite 16 Mbit/s', sku: 'IP073V018CIB', serviceCode: 'V018C', realBandwidth: 'V018C', speeds: { down: 16, up: 2.4 } },
        { id: 'po_V0178_FN_Options_Bandwidth', name: 'DSL Bandbreite 6 Mbit/s', sku: 'IP073V0178IB', serviceCode: 'V0178', realBandwidth: 'V0178', speeds: { down: 6, up: 1 } },
        { id: 'po_V0175_FN_Options_Bandwidth', name: 'DSL Bandbreite 3 Mbit/s', sku: 'IP073V0175IB', serviceCode: 'V0175', realBandwidth: 'V0175', speeds: { down: 3, up: 0.5 } },
        { id: 'po_V0174_FN_Options_Bandwidth', name: 'DSL Bandbreite 2 Mbit/s', sku: 'IP073V0174IB', serviceCode: 'V0174', realBandwidth: 'V0174', speeds: { down: 2, up: 0.5 } },
        { id: 'po_V0118_FN_Options_Bandwidth', name: 'DSL Bandbreite 1 Mbit/s', sku: 'IP073V0118IB', serviceCode: 'V0118', realBandwidth: 'V0118', speeds: { down: 1, up: 0.25 } }
      ];
      fallbacks.forEach(f => map.set(f.id, f));
    }

    // Sort descending by downstream speed
    return Array.from(map.values()).sort((a, b) => (b.speeds?.down || 0) - (a.speeds?.down || 0));
  }, [catalogPool]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    brand: 'Vodafone',
    lifecycleStatus: 'Draft',
    targetSegment: 'B2C',
    commercialDescription: '',

    // Supported Networks & Product Codes (Product can support Vodafone NGN, Bitstream, or both)
    isNgnSupported: true,
    isBitstreamSupported: true,
    productCodeNgn: 'I1204',
    productCodeBitstream: 'I1203',

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
    characteristics: []
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
      return;
    }

    const tpl = catalogSalesPackages.find(p => p.id === templateId);
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
      copiedTerms = psmStruct.terms.map((t, idx) => {
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
      const defaultTariffInt = tpl.technology === 'FIBRE'
        ? (downSpeed >= 1000 ? 'IP532' : downSpeed >= 600 ? 'IP531' : 'IP530')
        : (downSpeed >= 250 ? 'IP077' : downSpeed >= 100 ? 'IP076' : downSpeed >= 50 ? 'IP074' : 'IP073');
      const defaultTariffVoice = tpl.technology === 'FIBRE'
        ? (downSpeed >= 1000 ? 'VP532' : downSpeed >= 600 ? 'VP531' : 'VP530')
        : (downSpeed >= 250 ? 'VP077' : downSpeed >= 100 ? 'VP076' : downSpeed >= 50 ? 'VP074' : 'VP073');
      const defaultSvcBw = tpl.technology === 'FIBRE'
        ? (downSpeed >= 1000 ? 'IG006' : downSpeed >= 600 ? 'IG019' : downSpeed >= 300 ? 'IG018' : 'IG017')
        : (downSpeed >= 250 ? 'V018V' : downSpeed >= 175 ? 'V018U' : downSpeed >= 100 ? 'V018N' : downSpeed >= 50 ? 'V018H' : 'V018C');

      const psmBsBasic = tpl.technology === 'FIBRE' ? 'PR411' : (downSpeed >= 250 ? 'PR403' : downSpeed >= 100 ? 'PR393' : 'PR383');
      const psmBsComfort = tpl.technology === 'FIBRE' ? 'PR412' : (downSpeed >= 250 ? 'PR404' : downSpeed >= 100 ? 'PR394' : 'PR384');
      const psmNgnBasic = supportedNetworks.hasNgn ? (tpl.technology === 'FIBRE' ? 'PF340' : (downSpeed >= 50 ? 'PI216' : 'PI206')) : '-';
      const psmNgnComfort = supportedNetworks.hasNgn ? (tpl.technology === 'FIBRE' ? 'PF341' : (downSpeed >= 50 ? 'PI223' : 'PI207')) : '-';

      resolvedPops = [
        {
          id: `pop_pkg_${downSpeed}_bundle_mcd${term}_pt${pt}_basic_${downSpeed}`,
          name: `pop_pkg_${downSpeed}_bundle_mcd${term}_pt${pt}_basic_${downSpeed}`,
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
          id: `pop_pkg_${downSpeed}_bundle_mcd${term}_pt${pt}_comfort_${downSpeed}`,
          name: `pop_pkg_${downSpeed}_bundle_mcd${term}_pt${pt}_comfort_${downSpeed}`,
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
          category: Array.isArray(cg.category) ? cg.category.map(c => ({
            id: c.id || c.name,
            name: c.name || c.id,
            version: c.version || '1'
          })) : []
        };
      });
    } else {
      const primarySku = defaultTerm?.sku || `${primaryPacket}-24`;
      const defaultCatId = tpl.technology === 'FIBRE' ? 'FN0553' : 'FN0552';
      const defaultCatName = tpl.technology === 'FIBRE' ? 'Glasfaser 10/25' : 'DSL 10/25';
      copiedCategoryGroupings = [
        {
          id: `cg_${primarySku.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
          name: `Copy of ${tpl.name} (${primarySku})`,
          sku: primarySku,
          prodSpecCharValueUse: [
            {
              name: 'sku',
              productSpecCharacteristicValue: [{ value: primarySku }]
            }
          ],
          category: [
            { id: defaultCatId, name: defaultCatName, version: '1' }
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

    setFormData(prev => ({
      ...prev,
      name: `Copy of ${tpl.name}`,
      code: tpl.id,
      id: tpl.id,
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
      minContractTermMonths: defaultTerm ? defaultTerm.duration.amount : prev.minContractTermMonths,
      terms: copiedTerms,
      categoryGroupings: copiedCategoryGroupings,
      category: copiedDirectCats,
      characteristics: nextChars
    }));

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
    if (![24, 12, 18, 36].includes(num)) return;

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

        const termOrder = [36, 24, 18, 12];
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

      const termOrder = [36, 24, 18, 12];
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

      // Update categoryGroupings referencing old SKU
      const nextCategoryGroupings = (prev.categoryGroupings || []).map(cg => {
        let updatedSku = cg.sku;
        if (oldPktId && cg.sku && cg.sku.startsWith(`${oldPktId}-`)) {
          const suffix = cg.sku.substring(oldPktId.length);
          updatedSku = `${newValue}${suffix}`;
        }
        return {
          ...cg,
          sku: updatedSku,
          prodSpecCharValueUse: (cg.prodSpecCharValueUse || []).map(ps => {
            if ((ps.name || '').toLowerCase() === 'sku') {
              return {
                ...ps,
                productSpecCharacteristicValue: [{ value: updatedSku }],
                value: updatedSku
              };
            }
            return ps;
          })
        };
      });

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
      const nextCategoryGroupings = (prev.categoryGroupings || []).filter(cg => !String(cg.sku || '').startsWith(packetIdToRemove));

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
        const newId = `pop_pkg_${down}_bundle_mcd${term}_pt${pt}_${variant}_${down}`;
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

      return { ...prev, ...updates };
    });
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
        updates.ccbMasterPacketId = cleanPacket;
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
    return bandwidthOptionOffers.find(o => o.id === formData.selectedBandwidthOfferId) || null;
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
            const newId = `pop_pkg_${spd}_bundle_mcd${term}_pt${pt}_${variant}_${spd}`;
            updated.id = newId;
            updated.name = newId;
            if (popId === nextSelectedId) {
              nextSelectedId = newId;
            }
          }

          // If any atomic service code, speed, or variant changes, synchronize bundle service codes
          if (
            field === 'svcBw' || field === 'svcIn' ||
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
      let newId = `pop_pkg_${spd}_bundle_mcd${term}_pt${pt}_${variant}_${spd}`;
      
      let counter = 1;
      while ((prev.bundledPops || []).some(p => p.id === newId)) {
        newId = `pop_pkg_${spd}_bundle_mcd${term}_pt${pt}_${variant}_${spd}_${counter}`;
        counter++;
      }

      const defaultTariffInt = spd >= 250 ? 'IP077' : spd >= 100 ? 'IP076' : spd >= 50 ? 'IP074' : 'IP073';
      const defaultTariffVoice = spd >= 250 ? 'VP077' : spd >= 100 ? 'VP076' : spd >= 50 ? 'VP074' : 'VP073';
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
            const defaultTariffInt = spd >= 250 ? 'IP077' : spd >= 100 ? 'IP076' : spd >= 50 ? 'IP074' : 'IP073';
            const defaultTariffVoice = spd >= 250 ? 'VP077' : spd >= 100 ? 'VP076' : spd >= 50 ? 'VP074' : 'VP073';
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
          currentCats.push({
            id: categoryObj.id,
            name: categoryObj.name,
            version: categoryObj.version || '1'
          });
        }
        existingGroupings[groupIdx] = {
          ...existingGroupings[groupIdx],
          category: currentCats
        };
      } else {
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
              id: categoryObj.id,
              name: categoryObj.name,
              version: categoryObj.version || '1'
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

  const handleSaveDraft = () => {
    alert(`Draft "${formData.name}" saved successfully.`);
  };

  const handlePublish = () => {
    setIsPublished(true);
    if (onSuccessRefresh) onSuccessRefresh();
  };

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
              style={{
                background: 'var(--ds-surface-2)',
                border: '1px solid var(--ds-border-strong)',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--ds-text)',
                cursor: 'pointer'
              }}
            >
              Save Draft
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
            { id: 'commercial', label: '1. Commercial & Spec', icon: 'edit' },
            { id: 'technology', label: '2. Technology', icon: 'zap' },
            { id: 'pricing', label: '3. Pricing & Tariffs', icon: 'euro' },
            { id: 'characteristics', label: '4. Offering Characteristics', icon: 'settings' },
            { id: 'categories', label: '5. Categories', icon: 'folder' },
            { id: 'review', label: '6. Review & Summary', icon: '✓' }
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

      {/* ─── TAB 1: COMMERCIAL & SPEC ─── */}
      {activeTab === 'commercial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Preset Template & Selectable Product Specification Pull-down Menus */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* 1. Offer Template Pull-down (Filterable as user types) */}
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
                  {/* Right action icons (Clear & Toggle Arrow) */}
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

                {/* Filterable Dropdown Pulldown Menu */}
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
                        const isSelected = selectedTemplateId === tpl.id;
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

            {/* 2. Product Specification Pull-down (Filterable as user types) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <label style={{ ...labelStyle, marginBottom: 0, width: '220px', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--ds-text-2)' }}>
                Product Specification:
              </label>
              <div ref={specDropdownRef} style={{ flex: 1, minWidth: '280px', maxWidth: '520px', position: 'relative' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type="text"
                    placeholder={selectedSpecDisplayName || "-- Type to filter or select Specification --"}
                    value={isSpecDropdownOpen ? specSearchQuery : (selectedSpecDisplayName || '')}
                    onChange={(e) => {
                      setSpecSearchQuery(e.target.value);
                      if (!isSpecDropdownOpen) setIsSpecDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setIsSpecDropdownOpen(true);
                    }}
                    style={{
                      ...inputStyle,
                      paddingRight: '52px',
                      fontWeight: '600',
                      fontFamily: 'var(--ds-font-mono)',
                      fontSize: '12px',
                      borderColor: isSpecDropdownOpen ? 'var(--ds-brand)' : (formData.specificationId ? 'var(--ds-border-strong)' : 'var(--ds-border)'),
                      boxShadow: isSpecDropdownOpen ? '0 0 0 2px rgba(230,0,0,0.1)' : 'none',
                      background: '#ffffff'
                    }}
                  />
                  {/* Right action icons (Clear & Toggle Arrow) */}
                  <div style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {(formData.specificationId || specSearchQuery) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSpecSearchQuery('');
                          handleSelectSpecification('');
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
                        title="Clear specification selection"
                      >
                        ✕
                      </button>
                    )}
                    <span
                      onClick={() => setIsSpecDropdownOpen(prev => !prev)}
                      style={{
                        fontSize: '10px',
                        color: 'var(--ds-text-3)',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        transform: isSpecDropdownOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.15s ease'
                      }}
                      title={isSpecDropdownOpen ? "Close list" : "Open list"}
                    >
                      ▼
                    </span>
                  </div>
                </div>

                {/* Filterable Dropdown Pulldown Menu */}
                {isSpecDropdownOpen && (
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
                    {/* Filtered Specification Items */}
                    {filteredSalesPackageSpecs.length === 0 ? (
                      <div style={{ padding: '12px', fontSize: '12px', color: 'var(--ds-text-2)', fontStyle: 'italic', textAlign: 'center' }}>
                        No specifications matching "{specSearchQuery}"
                      </div>
                    ) : (
                      filteredSalesPackageSpecs.map(spec => {
                        const isSelected = formData.specificationId === spec.id;
                        return (
                          <div
                            key={spec.id}
                            onClick={() => {
                              handleSelectSpecification(spec.id);
                              setSpecSearchQuery('');
                              setIsSpecDropdownOpen(false);
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
                                {spec.name || spec.id}
                              </span>
                              {spec.name && spec.id !== spec.name && (
                                <span style={{ fontSize: '10px', color: 'var(--ds-text-3)', fontFamily: 'var(--ds-font-mono)' }}>
                                  {spec.id}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                              {spec.version && (
                                <span style={{
                                  fontSize: '10px',
                                  padding: '1px 6px',
                                  borderRadius: '10px',
                                  background: isSelected ? 'var(--ds-brand)' : 'var(--ds-surface-2)',
                                  color: isSelected ? '#ffffff' : 'var(--ds-text-2)',
                                  fontWeight: '600'
                                }}>
                                  v{spec.version}
                                </span>
                              )}
                              {isSelected && <span style={{ color: 'var(--ds-brand)', fontWeight: '800' }}>✓</span>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 3. PSM AAW Paket Id (multi-cardinality psm_aaw_packet_id) */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
              <label style={{ ...labelStyle, marginBottom: 0, width: '220px', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--ds-text-2)', paddingTop: '6px' }}>
                PSM AAW Paket Id * :
              </label>
              <div style={{ flex: 1, minWidth: '320px', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* List of configured PSM AAW Paket IDs */}
                {(formData.psmAawPacketIds || []).length === 0 ? (
                  <div style={{
                    background: 'var(--ds-surface-subtle)',
                    border: '1px dashed var(--ds-border)',
                    borderRadius: '6px',
                    padding: '12px 14px',
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
                      return (
                        <div
                          key={`psm_pkt_${idx}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#ffffff',
                            border: '1px solid var(--ds-border)',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            gap: '10px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <input
                              type="text"
                              value={pktId}
                              onChange={(e) => handleUpdatePsmAawPacketId(idx, e.target.value)}
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
                                padding: '3px 8px',
                                width: '185px',
                                outline: 'none'
                              }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--ds-warn)'; e.currentTarget.style.background = '#ffffff'; }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--ds-border-strong)'; e.currentTarget.style.background = 'var(--ds-surface-2)'; }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--ds-text-3)' }}>
                              {packetTerms.length} contract term{packetTerms.length !== 1 ? 's' : ''} configured
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                      maxWidth: '340px',
                      fontFamily: 'var(--ds-font-mono)',
                      fontSize: '12px'
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
                      padding: '8px 14px',
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

            {/* 4. Package Name Input (Directly after CCB Master Code) */}
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

            {/* 5. Product Offering Code Input (Directly after Package Name) */}
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

            {/* Commercial Description */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
              <label style={{ ...labelStyle, marginBottom: 0, width: '220px', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--ds-text-2)', paddingTop: '6px' }}>
                Commercial Description:
              </label>
              <div style={{ flex: 1, minWidth: '280px', maxWidth: '520px' }}>
                <textarea
                  rows={2}
                  value={formData.commercialDescription}
                  onChange={(e) => handleFieldChange('commercialDescription', e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical', fontSize: '12px' }}
                  placeholder="Customer-facing description of the package..."
                />
              </div>
            </div>

            {/* 6. Contract Terms Selection per PSM AAW Paket Id */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
              <label style={{ ...labelStyle, marginBottom: 0, width: '220px', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--ds-text-2)', paddingTop: '6px' }}>
                Select PSM Codes & SKUs:
              </label>
              <div style={{ flex: 1, minWidth: '320px', maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                          <span style={{ fontSize: '11px', color: 'var(--ds-text-3)' }}>
                            {packetTerms.length} of 4 durations selected
                          </span>
                        </div>

                        {/* Duration Pills for this Packet ID: 36, 24, 18, 12 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {[
                            { amount: 36, label: '36 Months' },
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
          </div>
        </div>
      )}

      {/* ─── TAB 2: TECHNOLOGY ─── */}
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
                Technology Configuration
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: C.muted }}>
                Configure supported network options (Vodafone NGN and/or Bitstream / DSL), specific product codes, and bandwidth offering.
              </p>
            </div>

            {/* 1. Supported Network(s): Vodafone NGN & Bitstream / DSL (both can be enabled!) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ ...labelStyle, marginBottom: 0, fontSize: '13px', color: 'var(--ds-text-2)', fontWeight: '700' }}>
                Supported Network(s) & Specific Product Codes *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                {/* Vodafone NGN */}
                <div style={{
                  border: `1px solid ${formData.isNgnSupported ? '#f87171' : 'var(--ds-border)'}`,
                  background: formData.isNgnSupported ? 'var(--ds-danger-soft)' : 'var(--ds-surface-subtle)',
                  borderRadius: '8px',
                  padding: '14px',
                  transition: 'all 0.15s ease'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: formData.isNgnSupported ? 'var(--ds-danger)' : 'var(--ds-text-2)' }}>
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
                      style={{ width: '16px', height: '16px', accentColor: C.vodafoneRed, cursor: 'pointer' }}
                    />
                    <span>Vodafone NGN</span>
                  </label>

                  {formData.isNgnSupported && (
                    <div style={{ marginTop: '10px', paddingLeft: '26px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-brand-text)', marginBottom: '4px' }}>
                        NGN Product Code (product_code_internet_ngn) *
                      </label>
                      <input
                        type="text"
                        value={formData.productCodeNgn || ''}
                        onChange={(e) => handleFieldChange('productCodeNgn', e.target.value)}
                        placeholder="I1204"
                        style={{ ...inputStyle, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', fontWeight: '700', color: 'var(--ds-danger)', background: '#ffffff', borderColor: '#fca5a5' }}
                      />
                    </div>
                  )}
                </div>

                {/* Bitstream / DSL */}
                <div style={{
                  border: `1px solid ${formData.isBitstreamSupported ? '#c084fc' : 'var(--ds-border)'}`,
                  background: formData.isBitstreamSupported ? 'var(--ds-spec-soft)' : 'var(--ds-surface-subtle)',
                  borderRadius: '8px',
                  padding: '14px',
                  transition: 'all 0.15s ease'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: formData.isBitstreamSupported ? 'var(--ds-spec-text)' : 'var(--ds-text-2)' }}>
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
                      style={{ width: '16px', height: '16px', accentColor: 'var(--ds-spec)', cursor: 'pointer' }}
                    />
                    <span>Bitstream (DSL)</span>
                  </label>

                  {formData.isBitstreamSupported && (
                    <div style={{ marginTop: '10px', paddingLeft: '26px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-spec-text)', marginBottom: '4px' }}>
                        Bitstream Product Code (product_code_internet_bitstream) *
                      </label>
                      <input
                        type="text"
                        value={formData.productCodeBitstream || ''}
                        onChange={(e) => handleFieldChange('productCodeBitstream', e.target.value)}
                        placeholder="I1203"
                        style={{ ...inputStyle, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', fontWeight: '700', color: 'var(--ds-spec-text)', background: '#ffffff', borderColor: '#d8b4fe' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Bandwidth Option (Selected from offers where specification like *options*bandwidth*) */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
              <label style={{ ...labelStyle, marginBottom: 0, width: '220px', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--ds-text-2)', paddingTop: '8px' }}>
                Bandwidth Option * :
              </label>
              <div style={{ flex: 1, minWidth: '320px', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <select
                  value={formData.selectedBandwidthOfferId || ''}
                  onChange={(e) => handleBandwidthOfferSelect(e.target.value)}
                  style={{ ...inputStyle, fontSize: '13px', fontWeight: '600' }}
                >
                  <option value="">-- Select Bandwidth Option --</option>
                  {bandwidthOptionOffers.map(offer => {
                    const realBw = offer.realBandwidth || offer.serviceCode || offer.sku;
                    const isConcatenated = offer.sku && offer.sku !== realBw;
                    return (
                      <option key={offer.id} value={offer.id}>
                        [{realBw}] {offer.name} · Real Bandwidth: {realBw}{isConcatenated ? ` (Offer SKU: ${offer.sku})` : ''}
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

              {/* Tiers Grid: High-visibility cards matching SalesPackageDetailTemplate */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {VODAFONE_DSL_FALLBACK_TIERS.map(tier => {
                  const isSelected = (formData.fallbackBandwidths || []).includes(tier.speed);
                  const matchingOffer = (bandwidthOptionOffers || []).find(o => o.speeds?.down === tier.speed);
                  const realBw = tier.svcBw; // Real bandwidth e.g. V0178
                  const offerSku = tier.sku; // Offer-related concatenated SKU e.g. IP073V0178IB
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

                      {/* Real Bandwidth & Offer SKU Breakdown */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11.5px', borderTop: `1px solid ${C.border}`, paddingTop: '8px' }}>
                        <div>
                          <span style={{ color: C.muted, display: 'block', fontSize: '10.5px', fontWeight: '600' }}>Real Bandwidth:</span>
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
                        <div>
                          <span style={{ color: C.muted, display: 'block', fontSize: '10.5px', fontWeight: '600' }}>Offer SKU:</span>
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
                            title={`Click to view details for Offer SKU ${offerSku}`}
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
                              {offerSku}
                            </code>
                            <Icon name="arrowUpRight" size={11} style={{ color: '#d97706' }} />
                          </button>
                        </div>
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleGenerateFallbackPops}
                    style={{
                      background: 'var(--ds-brand)',
                      border: '1px solid var(--ds-brand-dark)',
                      color: '#ffffff',
                      borderRadius: '5px',
                      padding: '6px 14px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 1px 2px rgba(230,0,0,0.2)'
                    }}
                    title="Generate Basic and Comfort Bundled POP variants for all selected fallback speeds in Tab 3"
                  >
                    <Icon name="refresh" size={13} />
                    <span>Sync Fallback Bundles ({((formData.fallbackBandwidths || []).length * 2)} POPs)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: PRICING & TARIFFS (Pricing Architecture & Bundled POP Assembly) ─── */}
      {activeTab === 'pricing' && (
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

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: 'var(--ds-surface-2)', borderBottom: '1px solid var(--ds-border)', color: 'var(--ds-text-2)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px', width: '30px' }}></th>
                      <th style={{ padding: '8px 12px', fontWeight: '700' }}>Bundled POP ID</th>
                      <th style={{ padding: '8px 12px', fontWeight: '700' }}>Variant</th>
                      <th style={{ padding: '8px 12px', fontWeight: '700' }}>Bandwidth</th>
                      <th style={{ padding: '8px 12px', fontWeight: '700' }}>Play Type</th>
                      <th style={{ padding: '8px 12px', fontWeight: '700' }}>Monthly Price</th>
                      <th style={{ padding: '8px 12px', fontWeight: '700', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(formData.bundledPops || []).length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: C.muted }}>
                          No Bundled POPs defined yet. Click <strong>+ Add Basic Variant</strong> or <strong>+ Add Comfort Variant</strong> above.
                        </td>
                      </tr>
                    ) : (
                      (formData.bundledPops || []).map((pop, idx) => {
                      const isSelected = pop.id === activePop.id;
                      return (
                        <tr
                          key={pop.id || idx}
                          onClick={() => handleSelectPop(pop.id)}
                          style={{
                            background: isSelected ? 'var(--ds-info-soft)' : idx % 2 === 0 ? '#ffffff' : '#fcfcfd',
                            borderBottom: '1px solid var(--ds-border)',
                            cursor: 'pointer',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <input
                              type="radio"
                              name="selectedBundledPop"
                              checked={isSelected}
                              onChange={() => handleSelectPop(pop.id)}
                              style={{ accentColor: '#2563eb', cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <code style={{
                              fontFamily: 'var(--ds-font-mono)',
                              fontWeight: '700',
                              fontSize: '12px',
                              color: isSelected ? 'var(--ds-info)' : 'var(--ds-text-2)'
                            }}>
                              {pop.id}
                            </code>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                              background: pop.connectionVariant === 'comfort' ? 'var(--ds-spec-soft)' : 'var(--ds-info-soft)',
                              color: pop.connectionVariant === 'comfort' ? 'var(--ds-spec)' : 'var(--ds-info)',
                              border: `1px solid ${pop.connectionVariant === 'comfort' ? '#d8b4fe' : '#bfdbfe'}`
                            }}>
                              {pop.connectionVariant === 'comfort' ? 'Comfort (ISDN)' : 'Basic'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--ds-text-2)', fontWeight: '600' }}>
                            {pop.speed || formData.downstreamSpeed || 250} Mbit/s
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              background: pop.playType === '1' ? 'var(--ds-surface-2)' : 'var(--ds-spec-soft)',
                              color: pop.playType === '1' ? 'var(--ds-text-2)' : 'var(--ds-spec)'
                            }}>
                              {pop.playType === '1' ? '1-Play' : '2-Play'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: '800', color: C.text }}>
                            €{(Number(pop.price) || 0).toFixed(2)} / mo
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateBundledPop(pop.id);
                                }}
                                title="Duplicate this POP"
                                style={{
                                  background: 'var(--ds-surface-2)',
                                  border: '1px solid var(--ds-border-strong)',
                                  borderRadius: '4px',
                                  padding: '3px 7px',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  color: 'var(--ds-text-2)'
                                }}
                              >
                                Duplicate
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBundledPop(pop.id);
                                }}
                                title="Delete this POP"
                                style={{
                                  background: 'var(--ds-danger-soft)',
                                  border: '1px solid #fca5a5',
                                  borderRadius: '4px',
                                  padding: '3px 7px',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  color: 'var(--ds-danger)'
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>
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
                  <span style={{ fontSize: '11px', color: 'var(--ds-text-3)' }}>
                    TMF620 bundledPopRelationship (Standalone & Unlocked)
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
                        <input
                          type="text"
                          value={activePop.svcBw !== undefined ? activePop.svcBw : (activePop.speed >= 250 ? 'V018V' : activePop.speed >= 100 ? 'V018N' : activePop.speed >= 50 ? 'V018H' : 'V018C')}
                          onChange={(e) => handleUpdateActivePopField('svcBw', e.target.value)}
                          placeholder="e.g. V018V"
                          style={{ ...inputStyle, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', fontWeight: '700', color: '#1e40af', background: '#ffffff' }}
                        />
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
                        <input
                          type="text"
                          value={activePop.svcIn !== undefined ? activePop.svcIn : 'V0017'}
                          onChange={(e) => handleUpdateActivePopField('svcIn', e.target.value)}
                          placeholder="e.g. V0017"
                          style={{ ...inputStyle, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', fontWeight: '700', color: 'var(--ds-spec-text)', background: '#ffffff' }}
                        />
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
                        {formData.isNgnSupported && formData.isBitstreamSupported ? (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-ok)', marginBottom: '2px' }}>
                                Svc (NGN)
                              </label>
                              <input
                                type="text"
                                value={activePop.svcVaNgn !== undefined ? activePop.svcVaNgn : (activePop.connectionVariant === 'comfort' ? 'VI003' : 'VI002')}
                                onChange={(e) => handleUpdateActivePopField('svcVaNgn', e.target.value)}
                                placeholder="VI002"
                                style={{ ...inputStyle, fontFamily: 'var(--ds-font-mono)', fontSize: '11px', fontWeight: '700', color: 'var(--ds-ok)', background: '#ffffff' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-ok)', marginBottom: '2px' }}>
                                Svc (Bitstream)
                              </label>
                              <input
                                type="text"
                                value={activePop.svcVaBitstream !== undefined ? activePop.svcVaBitstream : (activePop.connectionVariant === 'comfort' ? 'VI006' : 'VI009')}
                                onChange={(e) => handleUpdateActivePopField('svcVaBitstream', e.target.value)}
                                placeholder="VI009"
                                style={{ ...inputStyle, fontFamily: 'var(--ds-font-mono)', fontSize: '11px', fontWeight: '700', color: 'var(--ds-ok)', background: '#ffffff' }}
                              />
                            </div>
                          </div>
                        ) : formData.isBitstreamSupported ? (
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-ok)', marginBottom: '2px' }}>
                              Voice Access Svc Code (Bitstream)
                            </label>
                            <input
                              type="text"
                              value={activePop.svcVaBitstream !== undefined ? activePop.svcVaBitstream : (activePop.connectionVariant === 'comfort' ? 'VI006' : 'VI009')}
                              onChange={(e) => handleUpdateActivePopField('svcVaBitstream', e.target.value)}
                              placeholder="e.g. VI009"
                              style={{ ...inputStyle, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', fontWeight: '700', color: 'var(--ds-ok)', background: '#ffffff' }}
                            />
                          </div>
                        ) : (
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--ds-ok)', marginBottom: '2px' }}>
                              Voice Access Svc Code (NGN)
                            </label>
                            <input
                              type="text"
                              value={activePop.svcVaNgn !== undefined ? activePop.svcVaNgn : (activePop.connectionVariant === 'comfort' ? 'VI003' : 'VI002')}
                              onChange={(e) => handleUpdateActivePopField('svcVaNgn', e.target.value)}
                              placeholder="e.g. VI002"
                              style={{ ...inputStyle, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', fontWeight: '700', color: 'var(--ds-ok)', background: '#ffffff' }}
                            />
                          </div>
                        )}
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
                        <input
                          type="text"
                          value={activePop.svcVt !== undefined ? activePop.svcVt : 'V0017'}
                          onChange={(e) => handleUpdateActivePopField('svcVt', e.target.value)}
                          placeholder="e.g. V0017"
                          style={{ ...inputStyle, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', fontWeight: '700', color: 'var(--ds-warn)', background: '#ffffff' }}
                        />
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
          </div>
        </div>
      )}

      {/* ─── TAB 4: OFFERING CHARACTERISTICS ─── */}
      {activeTab === 'characteristics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Offering Characteristics Card (Inherited from Template & Fully Editable) */}
          <div style={{
            background: C.panel,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '13px',
                    fontWeight: '700',
                    color: C.text,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Offering Characteristics
                  </h3>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    fontFamily: 'var(--ds-font-mono)',
                    background: (formData.characteristics || []).length > 0 ? 'var(--ds-ok-soft)' : 'var(--ds-surface-2)',
                    color: (formData.characteristics || []).length > 0 ? 'var(--ds-ok)' : 'var(--ds-text-3)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: `1px solid ${(formData.characteristics || []).length > 0 ? 'var(--ds-ok-border)' : 'var(--ds-border)'}`
                  }}>
                    {(formData.characteristics || []).length} characteristics defined
                  </span>
                </div>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: C.muted }}>
                  Characteristic values defined by specification or copied from catalog template. You can directly edit, add, or delete any characteristic.
                </p>
              </div>

              {/* Search filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={charFilterQuery}
                  onChange={(e) => setCharFilterQuery(e.target.value)}
                  placeholder="Filter characteristics..."
                  style={{
                    ...inputStyle,
                    width: '240px',
                    padding: '6px 10px',
                    fontSize: '12px'
                  }}
                />
              </div>
            </div>

            {/* Characteristics Table */}
            {filteredCharacteristics.length > 0 ? (
              <div style={{
                border: '1px solid var(--ds-border)',
                borderRadius: '8px',
                overflow: 'hidden',
                maxHeight: '520px',
                overflowY: 'auto'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: 'var(--ds-surface-subtle)', borderBottom: '1px solid var(--ds-border)', color: 'var(--ds-text-2)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px', width: '36px', fontSize: '11px', fontWeight: '700' }}>#</th>
                      <th style={{ padding: '8px 12px', width: '35%', fontSize: '11px', fontWeight: '700' }}>Characteristic Name</th>
                      <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700' }}>Configured Value(s)</th>
                      <th style={{ padding: '8px 12px', width: '48px', textAlign: 'center', fontSize: '11px', fontWeight: '700' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCharacteristics.map((c, idx) => (
                      <tr
                        key={c.id || idx}
                        style={{
                          borderBottom: '1px solid var(--ds-surface-2)',
                          background: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                        }}
                      >
                        <td style={{ padding: '8px 12px', color: 'var(--ds-text-3)', fontSize: '11px', fontFamily: 'var(--ds-font-mono)' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                          <input
                            type="text"
                            value={c.name}
                            onChange={(e) => handleCharacteristicChange(c.id, 'name', e.target.value)}
                            style={{
                              ...inputStyle,
                              padding: '5px 8px',
                              fontSize: '12px',
                              fontFamily: 'var(--ds-font-mono)',
                              fontWeight: '600',
                              color: 'var(--ds-text)',
                              background: '#ffffff',
                              border: '1px solid var(--ds-border-strong)'
                            }}
                            placeholder="Characteristic name..."
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px', flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '11px',
                              fontFamily: 'var(--ds-font-mono)',
                              fontWeight: '700',
                              background: c.isArray ? '#ede9fe' : 'var(--ds-surface-2)',
                              color: c.isArray ? 'var(--ds-spec)' : 'var(--ds-text-2)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              border: `1px solid ${c.isArray ? 'var(--ds-spec-border)' : 'var(--ds-border)'}`
                            }}>
                              {c.isArray ? `Array (${(c.values || []).length})` : 'Single Value'}
                            </span>
                            {c.maxCardinality !== undefined && c.maxCardinality !== null && (
                              <span style={{
                                fontSize: '11px',
                                fontFamily: 'var(--ds-font-mono)',
                                fontWeight: '600',
                                color: 'var(--ds-text-2)',
                                background: 'var(--ds-surface-subtle)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                border: '1px solid var(--ds-border-strong)'
                              }} title={`Cardinality defined in spec: [${c.minCardinality !== undefined ? c.minCardinality : 0}..${c.maxCardinality}]`}>
                                Def: [{c.minCardinality !== undefined ? c.minCardinality : 0}..{c.maxCardinality}]
                              </span>
                            )}
                            {c.valueType && (
                              <span style={{
                                fontSize: '11px',
                                fontFamily: 'var(--ds-font-mono)',
                                color: 'var(--ds-text-3)',
                                background: 'var(--ds-surface-2)',
                                padding: '1px 5px',
                                borderRadius: '3px'
                              }}>
                                {c.valueType}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleToggleArrayType(c.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--ds-text-3)',
                                fontSize: '11px',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                marginLeft: 'auto'
                              }}
                              title={c.isArray ? 'Switch to single value' : 'Convert to array of values'}
                            >
                              {c.isArray ? 'Switch to Single' : 'Convert to Array'}
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                          {c.isArray ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {(c.values || ['']).map((val, vIdx) => (
                                <div key={vIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{
                                    fontSize: '11px',
                                    color: 'var(--ds-text-3)',
                                    fontFamily: 'var(--ds-font-mono)',
                                    background: 'var(--ds-surface-2)',
                                    padding: '2px 5px',
                                    borderRadius: '3px',
                                    minWidth: '22px',
                                    textAlign: 'center'
                                  }}>
                                    [{vIdx}]
                                  </span>
                                  <input
                                    type="text"
                                    value={val}
                                    onChange={(e) => handleArrayValueChange(c.id, vIdx, e.target.value)}
                                    style={{
                                      ...inputStyle,
                                      padding: '5px 8px',
                                      fontSize: '12px',
                                      fontFamily: c.name?.includes('id') || c.name?.includes('code') || c.name?.includes('sku') ? 'monospace' : 'inherit',
                                      color: (c.name === 'psm_aaw_packet_id' || c.name === 'psmAawPacketId') && String(val).startsWith('R025.') ? 'var(--ds-warn)' : C.text,
                                      fontWeight: (c.name === 'psm_aaw_packet_id' || c.name === 'psmAawPacketId') && String(val).startsWith('R025.') ? '700' : 'normal',
                                      flex: 1
                                    }}
                                    placeholder={`Value #${vIdx + 1}...`}
                                  />
                                  {(c.values || []).length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveArrayValue(c.id, vIdx)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--ds-text-3)',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        padding: '2px 6px'
                                      }}
                                      title="Remove this value from array"
                                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ds-danger)'; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ds-text-3)'; }}
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              ))}

                              {/* Add Value button for Array */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleAddArrayValue(c.id)}
                                  disabled={typeof c.maxCardinality === 'number' && (c.values || []).length >= c.maxCardinality}
                                  style={{
                                    background: '#ffffff',
                                    border: '1px dashed var(--ds-text-3)',
                                    borderRadius: '4px',
                                    padding: '3px 10px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    color: (typeof c.maxCardinality === 'number' && (c.values || []).length >= c.maxCardinality) ? 'var(--ds-text-3)' : 'var(--ds-text-2)',
                                    cursor: (typeof c.maxCardinality === 'number' && (c.values || []).length >= c.maxCardinality) ? 'not-allowed' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!(typeof c.maxCardinality === 'number' && (c.values || []).length >= c.maxCardinality)) {
                                      e.currentTarget.style.borderColor = C.vodafoneRed;
                                      e.currentTarget.style.color = C.vodafoneRed;
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!(typeof c.maxCardinality === 'number' && (c.values || []).length >= c.maxCardinality)) {
                                      e.currentTarget.style.borderColor = 'var(--ds-text-3)';
                                      e.currentTarget.style.color = 'var(--ds-text-2)';
                                    }
                                  }}
                                >
                                  <span style={{ fontWeight: '700', color: C.vodafoneRed }}>+</span> Add Value
                                </button>
                                <span style={{ fontSize: '11px', color: 'var(--ds-text-3)' }}>
                                  ({(c.values || []).length} {(c.values || []).length === 1 ? 'item' : 'items'} in array
                                  {c.maxCardinality !== undefined && c.maxCardinality !== null ? ` · max ${c.maxCardinality}` : ''})
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="text"
                                value={c.values?.[0] !== undefined ? c.values[0] : (c.value || '')}
                                onChange={(e) => handleArrayValueChange(c.id, 0, e.target.value)}
                                style={{
                                  ...inputStyle,
                                  padding: '5px 8px',
                                  fontSize: '12px',
                                  fontFamily: c.name?.includes('id') || c.name?.includes('code') || c.name?.includes('sku') ? 'monospace' : 'inherit',
                                  color: c.name === 'psm_aaw_packet_id' ? 'var(--ds-warn)' : C.text,
                                  fontWeight: c.name === 'psm_aaw_packet_id' ? '700' : 'normal',
                                  flex: 1
                                }}
                                placeholder="Value..."
                              />
                              {c.maxCardinality === 1 ? (
                                <span style={{
                                  fontSize: '11px',
                                  color: 'var(--ds-text-3)',
                                  fontFamily: 'var(--ds-font-mono)',
                                  whiteSpace: 'nowrap'
                                }} title="Max cardinality is 1 per characteristic definition">
                                  [max 1]
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddArrayValue(c.id)}
                                  style={{
                                    background: 'var(--ds-surface-subtle)',
                                    border: '1px solid var(--ds-border-strong)',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    color: 'var(--ds-text-2)',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title="Add another value"
                                >
                                  + Add Value
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteCharacteristic(c.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--ds-text-3)',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '700',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}
                            title="Delete Characteristic"
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ds-danger)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ds-text-3)'; }}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                background: 'var(--ds-surface-subtle)',
                border: '1px dashed var(--ds-border-strong)',
                borderRadius: '8px',
                color: C.muted,
                fontSize: '13px'
              }}>
                {(formData.characteristics || []).length === 0 ? (
                  <span>
                    Select a Product Specification or Catalog Template in Tab 1 to populate offering characteristics.
                  </span>
                ) : (
                  <span>No characteristics match the filter "{charFilterQuery}".</span>
                )}
              </div>
            )}

            {/* Bottom Tab Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '16px', borderTop: '1px solid var(--ds-border)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('pricing')}
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
                ← Back: Pricing & Tariffs
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 3px rgba(230,0,0,0.2)'
                }}
              >
                <span>Next: Categories & Groups</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
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
                onClick={() => setActiveTab('characteristics')}
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
                ← Back: Characteristics
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
    </div>
  );
}
