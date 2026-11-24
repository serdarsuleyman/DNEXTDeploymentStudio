import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Icon from './ui/Icon';
import { useAuth } from '../context/EnvironmentContext';
import DnextEntityDrawer from './DnextEntityDrawer';
import ConfigurableListView from './list-views/ConfigurableListView';
import { resolveListViewTemplateId, getAvailableListViewTemplates, isSalesPackageSpec, isOptionSpec, isHardwareSpec, LIST_VIEW_TEMPLATES } from './list-views/listViewRegistry';
import ListViewHeader from './list-views/ListViewHeader';
import ConfigurableLeftMenu from './navigation/ConfigurableLeftMenu';

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:          '#ffffff',
  panel:       '#ffffff',
  border:      'var(--ds-border)',
  text:        'var(--ds-text)',
  muted:       'var(--ds-text-2)',
  accent:      'var(--ds-brand)',
  indigo:      'var(--ds-brand)',
  vodafoneRed: 'var(--ds-brand)',
  success:     'var(--ds-ok)',
  warning:     'var(--ds-warn)',
  danger:      'var(--ds-brand)',
};

const ENTITY_CONFIG = {
  Category: {
    label: 'Category',
    endpoint: '/api/dnext/categories',
    color: { bg: 'var(--ds-warn-soft)', border: 'var(--ds-warn-border)', text: 'var(--ds-warn)' },
    icon: 'folder'
  },
  ProductOffering: {
    label: 'Product Offering',
    endpoint: '/api/dnext/product-offerings',
    color: { bg: 'rgba(230,0,0,0.06)', border: 'var(--ds-danger-border)', text: 'var(--ds-brand)' },
    icon: 'package'
  },
  ProductOfferingPrice: {
    label: 'Product Offering Price',
    endpoint: '/api/dnext/product-offering-prices',
    color: { bg: 'var(--ds-ok-soft)', border: 'var(--ds-ok-border)', text: 'var(--ds-ok)' },
    icon: 'tag'
  },
  ProductSpecification: {
    label: 'Product Specification',
    endpoint: '/api/dnext/product-specifications',
    color: { bg: 'var(--ds-spec-soft)', border: 'var(--ds-spec-border)', text: 'var(--ds-spec)' },
    icon: 'clipboard'
  }
};

const btn = (override = {}) => ({
  padding: '6px 14px',
  borderRadius: '6px',
  border: '1px solid var(--ds-border-strong)',
  background: '#ffffff',
  color: '#1f2937',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '600',
  transition: 'all 0.15s ease',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  ...override,
});

function parseVersion(v) {
  if (v === undefined || v === null || v === '-') return [0];
  const str = String(v).trim();
  const parts = str.split('.').map(p => {
    const num = parseInt(p, 10);
    return isNaN(num) ? p : num;
  });
  return parts;
}

function compareVersionsDesc(a, b) {
  const vA = parseVersion(a.version);
  const vB = parseVersion(b.version);
  const maxLen = Math.max(vA.length, vB.length);
  for (let i = 0; i < maxLen; i++) {
    const partA = vA[i] !== undefined ? vA[i] : 0;
    const partB = vB[i] !== undefined ? vB[i] : 0;
    if (typeof partA === 'number' && typeof partB === 'number') {
      if (partA !== partB) return partB - partA; // Descending: latest first
    } else {
      const cmp = String(partB).localeCompare(String(partA));
      if (cmp !== 0) return cmp;
    }
  }
  const statusScore = s => (s || '').toLowerCase() === 'launched' ? 2 : (s || '').toLowerCase() === 'in study' ? 1 : 0;
  return statusScore(b.lifecycleStatus) - statusScore(a.lifecycleStatus);
}

const DEFAULT_ENVIRONMENTS = [
  {
    name: 'dpc_ui.test-g',
    url: 'https://dpc-ui.test-gcu.com/ui/productCatalogManagement/',
    apiUrl: 'https://dpc-api.test-gcu.com',
    authUrl: 'https://diam.test-gcu.com/realms/orbitant-realm/protocol/openid-connect/token'
  },
  {
    name: 'test',
    url: 'https://dpc-ui.test-gcu.com/ui/productCatalogManagement/',
    apiUrl: 'https://dpc-api.test-gcu.com',
    authUrl: 'https://diam.test-gcu.com/realms/orbitant-realm/protocol/openid-connect/token'
  },
  {
    name: 'Default (dev-gcu)',
    url: 'https://dpc-api.pi.dev-gcu.com/ui/productCatalogManagement/',
    apiUrl: 'https://dpc-api.pi.dev-gcu.com',
    authUrl: 'https://diam.pi.dev-gcu.com/realms/orbitant-realm/protocol/openid-connect/token'
  }
];

export default function DnextRemoteCatalogView({ selectedEnv: propSelectedEnv, environments: propEnvironments = [], onSelectEnv }) {
  // Environments state (sourced from props, DEFAULT_ENVIRONMENTS, or /api/dnext/environments)
  const [environments, setEnvironments] = useState(() => {
    return Array.isArray(propEnvironments) && propEnvironments.length > 0 ? propEnvironments : DEFAULT_ENVIRONMENTS;
  });
  
  const [selectedEnvName, setSelectedEnvName] = useState(() => {
    return propSelectedEnv?.name || localStorage.getItem('dnext_env_name') || 'dpc_ui.test-g';
  });

  useEffect(() => {
    if (Array.isArray(propEnvironments) && propEnvironments.length > 0) {
      setEnvironments(propEnvironments);
    } else {
      fetch('/api/dnext/environments')
        .then(r => r.json())
        .then(d => {
          if (Array.isArray(d) && d.length > 0) {
            setEnvironments(d);
          }
        })
        .catch(() => {});
    }
  }, [propEnvironments]);

  // Sync with prop if it changes externally
  useEffect(() => {
    if (propSelectedEnv?.name && propSelectedEnv.name !== selectedEnvName) {
      setSelectedEnvName(propSelectedEnv.name);
    }
  }, [propSelectedEnv?.name]);

  const activeEnv = useMemo(() => {
    const name = selectedEnvName || 'dpc_ui.test-g';
    const envList = environments.length > 0 ? environments : DEFAULT_ENVIRONMENTS;
    const match = (name && envList.find(e => e.name && e.name.toLowerCase() === name.toLowerCase()))
      || (name && envList.find(e => e.name && (e.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(e.name.toLowerCase()))))
      || (propSelectedEnv && (!name || propSelectedEnv.name?.toLowerCase() === name.toLowerCase()) ? propSelectedEnv : null)
      || envList.find(e => (e.name || '').toLowerCase().includes('test'))
      || envList[0]
      || DEFAULT_ENVIRONMENTS[0];

    const isTest = (match.name || '').toLowerCase().includes('test') || (match.apiUrl || '').toLowerCase().includes('test');
    return {
      ...match,
      apiUrl: match.apiUrl || localStorage.getItem('dnext_api_url') || (isTest ? 'https://dpc-api.test-gcu.com' : 'https://dpc-api.pi.dev-gcu.com'),
      authUrl: match.authUrl || localStorage.getItem('dnext_auth_url') || (isTest ? 'https://diam.test-gcu.com/realms/orbitant-realm/protocol/openid-connect/token' : 'https://diam.pi.dev-gcu.com/realms/orbitant-realm/protocol/openid-connect/token'),
    };
  }, [selectedEnvName, environments, propSelectedEnv]);

  // Shared auth state (EnvironmentContext) — one token for every view and the header
  const { token, setToken, loginStatus, setLoginStatus, connect, disconnect, openLoginModal, authUser } = useAuth();
  // Token the catalog was last loaded with (prevents double loads when this view logs in itself)
  const fetchedForTokenRef = useRef(null);
  const username = authUser || localStorage.getItem('dnext_username') || '';
  const [authLoading, setAuthLoading] = useState(false);

  // Live remote entities
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fetchStats, setFetchStats] = useState({ categories: 0, offerings: 0, prices: 0, specs: 0 });
  const [cacheStatus, setCacheStatus] = useState({ isCached: false, cachedAt: null });

  // Filtering & Search (All Objects active by default for existing view)
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specFilter, setSpecFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [specSearchQuery, setSpecSearchQuery] = useState('');
  const [isSpecDropdownOpen, setIsSpecDropdownOpen] = useState(false);
  const specDropdownRef = useRef(null);

  // Close spec dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (specDropdownRef.current && !specDropdownRef.current.contains(event.target)) {
        setIsSpecDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Configurable List View Template state (null = auto-resolve based on entityType & field values)
  const [userListTemplateId, setUserListTemplateId] = useState(null);

  // Re-enable auto-resolution when navigating to a different entity type
  useEffect(() => {
    setUserListTemplateId(null);
  }, [typeFilter]);

  // Left Drawer Menu state
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [subFilter, setSubFilter] = useState(null);
  const [expandedMenuSections, setExpandedMenuSections] = useState(new Set(['product_offerings', 'offering_prices']));

  // Selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Inspect Modal & Offer Details Drawer
  const [inspectItem, setInspectItem] = useState(null);
  const [drawerItem, setDrawerItem] = useState(null);

  // In-progress Drafts count & resume handler
  const [draftsCount, setDraftsCount] = useState(0);

  const fetchDraftsCount = () => {
    fetch('/api/drafts')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.total === 'number') {
          setDraftsCount(data.total);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchDraftsCount();
  }, []);

  const handleResumeDraft = (draft) => {
    if (!draft) return;
    const formData = draft.form_data || {};
    const taskType = draft.task_type || formData.task_type || 'new_sales_package';
    const tplName = formData.template_name || '';
    const tplId = formData.selectedTemplateId || (tplName ? tplName.replace(/:\(version=[^)]+\)$/i, '') : '');
    const tplDisplayName = formData.selectedTemplateName || 
      (tplName ? (tplName.match(/^(.+?):\(version=(.+?)\)$/) ? `${RegExp.$1} (v${RegExp.$2})` : tplName) : tplId);

    const drawerItemPayload = {
      ...formData,
      id: draft.entity_id || formData.id || formData.code || 'NEW_SALES_PACKAGE',
      name: draft.entity_name || formData.name || 'New Sales Package',
      code: formData.code || draft.entity_id || '',
      portfolio_id: draft.portfolio_id || formData.portfolio_id || '',
      template_name: tplName,
      selectedTemplateId: tplId,
      selectedTemplateName: tplDisplayName,
      task_type: taskType,
      entityType: 'ProductOffering',
      templateId: 'sales_package_new',
      isNew: true,
      isDraft: true,
      draftId: draft.id,
      draftData: formData,
      raw: formData
    };
    setDrawerItem(drawerItemPayload);
  };

  // Deep-link navigation: read target entity ID / search / type from window.location.hash
  useEffect(() => {
    const handleUrlParams = () => {
      const hash = window.location.hash || '';
      const qIdx = hash.indexOf('?');
      if (qIdx === -1) return;
      const searchStr = hash.substring(qIdx + 1);
      const params = new URLSearchParams(searchStr);
      const targetId = params.get('id') || params.get('search');
      const targetType = params.get('type');

      if (targetId) {
        setSearchQuery(targetId);
        setUserListTemplateId(null);
        setSubFilter(null);
        if (targetType && targetType !== 'all') {
          const normalizedType = targetType === 'BundledProductOfferingPrice' ? 'ProductOfferingPrice' : targetType;
          setTypeFilter(normalizedType);
          setSelectedCategory(normalizedType);
        } else {
          setTypeFilter('all');
          setSelectedCategory('all');
        }
      }
    };

    handleUrlParams();
    window.addEventListener('hashchange', handleUrlParams);
    return () => window.removeEventListener('hashchange', handleUrlParams);
  }, []);

  // When remote entities load, if a target entity ID is in the URL hash, automatically open its detail drawer
  useEffect(() => {
    const hash = window.location.hash || '';
    const qIdx = hash.indexOf('?');
    if (qIdx === -1) return;
    const params = new URLSearchParams(hash.substring(qIdx + 1));
    const targetId = params.get('id') || params.get('search');
    if (!targetId || entities.length === 0) return;

    const matched = entities.find(e => e.id === targetId || e.raw?.id === targetId);
    if (matched && (!drawerItem || drawerItem.id !== targetId)) {
      setDrawerItem(matched);
    }
  }, [entities, drawerItem]);

  // Deletion / Purge state
  const [isPurging, setIsPurging] = useState(false);
  const [purgeProgress, setPurgeProgress] = useState(null);
  const [purgeAudit, setPurgeAudit] = useState([]);
  const [showConfirmBulkModal, setShowConfirmBulkModal] = useState(false);

  // Notification Toast
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  // Primary Login / Connect handler — opens the LoginModal dialog
  const handleLogin = (e = null, customEnv = null) => {
    if (e && e.preventDefault) e.preventDefault();
    openLoginModal(customEnv || activeEnv);
  };

  const handleLogout = () => {
    disconnect();
    setEntities([]);
    showToast('Disconnected from DNEXT', 'info');
  };

  const handleEnvChange = async (name) => {
    setSelectedEnvName(name);
    localStorage.setItem('dnext_env_name', name);
    const envList = environments.length > 0 ? environments : DEFAULT_ENVIRONMENTS;
    const env = envList.find(e => e.name === name) || DEFAULT_ENVIRONMENTS[0];
    if (onSelectEnv) onSelectEnv(env);
  };

  const handleConnectKeycloak = (targetEnv = null) => {
    openLoginModal(targetEnv || activeEnv);
  };

  // Helper to construct dynamic environment headers
  const getTargetEnvHeaders = useCallback(async (authToken, targetEnv = null) => {
    const env = targetEnv || activeEnv;
    const isTest = (env?.name && env.name.toLowerCase().includes('test')) || (env?.apiUrl && env.apiUrl.toLowerCase().includes('test'));
    const envName = env?.name || localStorage.getItem('dnext_env_name') || (isTest ? 'dpc_ui.test-g' : 'Default (dev-gcu)');
    const apiUrl = env?.apiUrl || localStorage.getItem('dnext_api_url') || (isTest ? 'https://dpc-api.test-gcu.com' : 'https://dpc-api.pi.dev-gcu.com');
    const authUrl = env?.authUrl || localStorage.getItem('dnext_auth_url') || (isTest ? 'https://diam.test-gcu.com/realms/orbitant-realm/protocol/openid-connect/token' : 'https://diam.pi.dev-gcu.com/realms/orbitant-realm/protocol/openid-connect/token');

    return {
      'Authorization': authToken ? `Bearer ${authToken}` : '',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-dnext-api-url': apiUrl,
      'x-dnext-auth-url': authUrl,
      'x-dnext-env-name': envName
    };
  }, [activeEnv]);

  // Environment Switcher handler
  const handleSwitchEnvironment = async (targetEnv) => {
    if (!targetEnv) return;
    handleEnvChange(targetEnv.name);
  };

  // Fetch all remote entities across the 4 TMF endpoints (with SQLite cache support)
  const fetchRemoteEntities = useCallback(async (tokenOverride = null, targetEnv = null, isRetry = false, forceRefresh = false) => {
    const env = targetEnv || activeEnv;
    const activeToken = tokenOverride || token;
    if (!activeToken) {
      const newToken = await handleConnectKeycloak(env);
      if (!newToken) {
        setErrorMsg(`Please connect to Keycloak to query ${env?.name || 'remote'} catalog entities.`);
        return;
      }
      return;
    }

    fetchedForTokenRef.current = activeToken;
    setLoading(true);
    setErrorMsg('');
    try {
      const headers = await getTargetEnvHeaders(activeToken, env);
      const refreshQuery = forceRefresh ? '&refresh=true' : '';

      // STEP 1: Query Product Offerings FIRST
      let initialOffers = [];
      let stats = { categories: 0, offerings: 0, prices: 0, specs: 0 };

      try {
        const offRes = await fetch(`/api/dnext/product-offerings?limit=1000${refreshQuery}`, { headers });

        // Update token if backend auto-refreshed it
        const refreshedTokenHeader = offRes.headers.get('x-refreshed-token');
        if (refreshedTokenHeader && refreshedTokenHeader !== activeToken) {
          fetchedForTokenRef.current = refreshedTokenHeader;
          setToken(refreshedTokenHeader);
          localStorage.setItem('dnext_token', refreshedTokenHeader);
        }

        // Cache detection header
        const fromCacheHeader = offRes.headers.get('x-from-cache');
        const cacheUpdatedAtHeader = offRes.headers.get('x-cache-updated-at');
        setCacheStatus({
          isCached: fromCacheHeader === 'true',
          cachedAt: cacheUpdatedAtHeader || (fromCacheHeader === 'true' ? null : new Date().toISOString())
        });

        if (offRes.status === 401 && !isRetry) {
          console.warn('Session 401: auto-refreshing Keycloak session...');
          const refreshedToken = await handleConnectKeycloak(env);
          if (refreshedToken) {
            return fetchRemoteEntities(refreshedToken, env, true, forceRefresh);
          }
        }
        if (offRes.ok) {
          const data = await offRes.json();
          if (Array.isArray(data)) {
            stats.offerings = data.length;
            data.forEach(item => {
              initialOffers.push({
                id: item.id || item.name,
                name: item.name || item.id,
                entityType: 'ProductOffering',
                version: item.version !== undefined ? String(item.version) : '0',
                lifecycleStatus: item.lifecycleStatus || 'In study',
                lastUpdate: item.lastUpdate || item.validFor?.startDateTime || '-',
                productSpecification: item.productSpecification || null,
                raw: item
              });
            });
            // Display offers immediately on screen
            setEntities([...initialOffers]);
            setFetchStats({ ...stats });
          }
        }
      } catch (err) {
        console.warn('Failed to fetch initial offers:', err);
      }

      // STEP 2: Query remaining entities (categories, prices, specifications)
      const [catRes, popRes, specRes] = await Promise.allSettled([
        fetch(`/api/dnext/categories?limit=1000${refreshQuery}`, { headers }),
        fetch(`/api/dnext/product-offering-prices?limit=1000${refreshQuery}`, { headers }),
        fetch(`/api/dnext/product-specifications?limit=1000${refreshQuery}`, { headers })
      ]);

      // ProductOfferings stay at the top of the combined list
      let allItems = [...initialOffers];

      if (catRes.status === 'fulfilled' && catRes.value.ok) {
        const data = await catRes.value.json();
        if (Array.isArray(data)) {
          stats.categories = data.length;
          data.forEach(item => {
            allItems.push({
              id: item.id || item.name,
              name: item.name || item.id,
              entityType: 'Category',
              version: item.version !== undefined ? String(item.version) : '-',
              lifecycleStatus: item.lifecycleStatus || 'Active',
              lastUpdate: item.lastUpdate || item.validFor?.startDateTime || '-',
              raw: item
            });
          });
        }
      }

      if (popRes.status === 'fulfilled' && popRes.value.ok) {
        const data = await popRes.value.json();
        if (Array.isArray(data)) {
          stats.prices = data.length;
          data.forEach(item => {
            allItems.push({
              id: item.id || item.name,
              name: item.name || item.id,
              entityType: 'ProductOfferingPrice',
              version: item.version !== undefined ? String(item.version) : '0',
              lifecycleStatus: item.lifecycleStatus || 'In study',
              lastUpdate: item.lastUpdate || item.validFor?.startDateTime || '-',
              raw: item
            });
          });
        }
      }

      if (specRes.status === 'fulfilled' && specRes.value.ok) {
        const data = await specRes.value.json();
        if (Array.isArray(data)) {
          stats.specs = data.length;
          data.forEach(item => {
            allItems.push({
              id: item.id || item.name,
              name: item.name || item.id,
              entityType: 'ProductSpecification',
              version: item.version !== undefined ? String(item.version) : '0',
              lifecycleStatus: item.lifecycleStatus || 'In study',
              lastUpdate: item.lastUpdate || item.validFor?.startDateTime || '-',
              raw: item
            });
          });
        }
      }

      // Deduplicate items by entityType:id:version
      const seen = new Set();
      const uniqueItems = [];
      for (const item of allItems) {
        const k = `${item.entityType}:${item.id}:${item.version}`;
        if (!seen.has(k)) {
          seen.add(k);
          uniqueItems.push(item);
        }
      }

      setEntities(uniqueItems);
      setFetchStats(stats);
      setSelectedIds(new Set());
      showToast(`✓ Loaded ${uniqueItems.length} live entities (${stats.offerings} offers queried first)`, 'success');
    } catch (err) {
      console.error('Failed to fetch remote entities:', err);
      setErrorMsg(err.message);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [token, showToast]);

  useEffect(() => {
    if (propSelectedEnv && propSelectedEnv.name && propSelectedEnv.name !== selectedEnvName) {
      handleSwitchEnvironment(propSelectedEnv);
    }
  }, [propSelectedEnv?.name]);

  useEffect(() => {
    if (token) {
      fetchRemoteEntities(token, activeEnv);
    } else {
      handleConnectKeycloak(activeEnv);
    }
  }, []);

  // Load the catalog when a token is obtained elsewhere (e.g. header Connect button),
  // and clear it when the session ends elsewhere (header Disconnect / environment switch)
  useEffect(() => {
    if (token && token !== fetchedForTokenRef.current) {
      fetchRemoteEntities(token, activeEnv);
    } else if (!token && fetchedForTokenRef.current) {
      fetchedForTokenRef.current = null;
      setEntities([]);
    }
  }, [token]);

  // Purge a single entity
  const handlePurgeSingle = async (item) => {
    if (!token) return;
    if (!window.confirm(`Are you sure you want to permanently purge ${item.entityType} "${item.id}" across all versions from remote DNEXT?`)) {
      return;
    }

    setIsPurging(true);
    setPurgeProgress({ current: 1, total: 1, currentId: item.id });
    try {
      const headers = await getTargetEnvHeaders(token, activeEnv);
      const res = await fetch('/api/dnext/purge-entity', {
        method: 'POST',
        headers,
        body: JSON.stringify({ objectType: item.entityType, id: item.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Purge failed');

      setPurgeAudit(data.auditTrail || []);
      showToast(`✓ Purged ${item.entityType} "${item.id}"`, 'success');
      await fetchRemoteEntities(token, activeEnv);
    } catch (err) {
      showToast(`Purge error: ${err.message}`, 'error');
    } finally {
      setIsPurging(false);
      setPurgeProgress(null);
    }
  };

  // Bulk purge selected entities
  const handleBulkPurge = async () => {
    setShowConfirmBulkModal(false);
    if (!token || selectedIds.size === 0) return;

    setIsPurging(true);
    const itemsToPurge = entities.filter(e => selectedIds.has(e.id));
    let successCount = 0;
    let failCount = 0;
    const auditLogs = [];

    const headers = await getTargetEnvHeaders(token, activeEnv);

    for (let i = 0; i < itemsToPurge.length; i++) {
      const item = itemsToPurge[i];
      setPurgeProgress({ current: i + 1, total: itemsToPurge.length, currentId: item.id });

      try {
        const res = await fetch('/api/dnext/purge-entity', {
          method: 'POST',
          headers,
          body: JSON.stringify({ objectType: item.entityType, id: item.id })
        });
        const data = await res.json();
        if (res.ok) {
          successCount++;
          auditLogs.push({ id: item.id, success: true, message: data.message });
        } else {
          failCount++;
          auditLogs.push({ id: item.id, success: false, error: data.error });
        }
      } catch (err) {
        failCount++;
        auditLogs.push({ id: item.id, success: false, error: err.message });
      }
    }

    setPurgeAudit(auditLogs);
    setIsPurging(false);
    setPurgeProgress(null);
    showToast(`Bulk Purge Complete: ${successCount} removed, ${failCount} failed`, successCount > 0 ? 'success' : 'error');
    await fetchRemoteEntities();
  };

  // Tree expansion state for multi-version entity groups
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // Group entities by entityType and ID, consolidating multiple versions into a tree
  const groupedEntities = useMemo(() => {
    const groupsMap = new Map();

    entities.forEach(item => {
      // Normalize baseId by stripping TMF version suffix :(version=...) so v0 and v1 group into one tree
      const rawId = String(item.id || item.name || '');
      const baseId = rawId.replace(/:\(version=[^)]+\)$/i, '');
      const gKey = `${item.entityType}:${baseId || rawId}`;
      if (!groupsMap.has(gKey)) {
        groupsMap.set(gKey, []);
      }
      groupsMap.get(gKey).push({
        ...item,
        baseId: baseId || rawId
      });
    });

    const groups = [];

    groupsMap.forEach((items, gKey) => {
      // Sort items descending by version so the highest/latest version is index 0
      const sorted = [...items].sort(compareVersionsDesc);
      const latest = sorted[0];
      const previousVersions = sorted.slice(1);

      groups.push({
        groupKey: gKey,
        id: latest.baseId || latest.id,
        name: latest.name,
        entityType: latest.entityType,
        latestVersion: latest.version,
        latestItem: latest,
        previousVersions,
        totalVersions: sorted.length,
        allItems: sorted
      });
    });

    // ProductOfferings first, then alphabetically by name or id
    return groups.sort((a, b) => {
      if (a.entityType === 'ProductOffering' && b.entityType !== 'ProductOffering') return -1;
      if (b.entityType === 'ProductOffering' && a.entityType !== 'ProductOffering') return 1;
      return (a.name || a.id).localeCompare(b.name || b.id);
    });
  }, [entities]);

  // Compute live category & status counts for Left Drawer
  const categoryCounts = useMemo(() => {
    let bundles = 0;
    let simple = 0;
    let salesPackages = 0;
    let options = 0;
    let hardware = 0;
    let recurring = 0;
    let oneTime = 0;
    let launched = 0;
    let inTestStudy = 0;
    let obsolete = 0;

    entities.forEach(e => {
      const status = (e.lifecycleStatus || '').toLowerCase();
      if (status === 'launched') launched++;
      else if (status === 'in test' || status === 'in study') inTestStudy++;
      else if (status === 'obsolete' || status === 'retired') obsolete++;

      if (e.entityType === 'ProductOffering') {
        if (e.raw?.isBundle) bundles++;
        else simple++;
        if (isSalesPackageSpec(e)) salesPackages++;
        if (isOptionSpec(e)) options++;
        if (isHardwareSpec(e)) hardware++;
      } else if (e.entityType === 'ProductOfferingPrice') {
        const pt = (e.raw?.priceType || '').toLowerCase();
        if (pt.includes('recurring')) recurring++;
        else if (pt.includes('one time') || pt.includes('onetime')) oneTime++;
      }
    });

    return {
      all: entities.length,
      offerings: fetchStats.offerings,
      bundles,
      simple,
      salesPackages,
      options,
      hardware,
      prices: fetchStats.prices,
      recurring,
      oneTime,
      specs: fetchStats.specs,
      categories: fetchStats.categories,
      drafts: draftsCount,
      launched,
      inTestStudy,
      obsolete
    };
  }, [entities, fetchStats, draftsCount]);

  const handleToggleMenuSection = (sec) => {
    setExpandedMenuSections(prev => {
      const next = new Set(prev);
      if (next.has(sec)) next.delete(sec);
      else next.add(sec);
      return next;
    });
  };

  const handleSelectMenuItem = (item) => {
    if (!item) return;

    // 1. Status-only toggle filter (e.g. Launched, In study, Obsolete)
    if (item.filterContext?.statusFilter !== undefined && item.filterContext?.typeFilter === undefined) {
      setStatusFilter(prev => prev === item.filterContext.statusFilter ? 'all' : item.filterContext.statusFilter);
      return;
    }

    // 2. Navigation filter context
    if (item.filterContext) {
      if (item.filterContext.typeFilter !== undefined) {
        setTypeFilter(item.filterContext.typeFilter);
        setSelectedCategory(item.filterContext.typeFilter);
      }
      if (item.filterContext.subFilter !== undefined) {
        setSubFilter(item.filterContext.subFilter);
      } else {
        setSubFilter(null);
      }
      if (item.filterContext.specFilter !== undefined) {
        setSpecFilter(item.filterContext.specFilter);
      } else {
        setSpecFilter('all');
      }
      if (item.filterContext.statusFilter !== undefined) {
        setStatusFilter(item.filterContext.statusFilter);
      }
    }

    // 3. Set associated target list view template if configured
    if (item.targetListViewTemplateId) {
      setUserListTemplateId(item.targetListViewTemplateId);
    } else {
      setUserListTemplateId(null);
    }

    // If entering Sales Packages, Options, Hardware, or Categories view, clear generic search/status/spec filters
    if (
      item.targetListViewTemplateId === 'sales_packages' ||
      item.targetListViewTemplateId === 'options' ||
      item.targetListViewTemplateId === 'hardware' ||
      item.targetListViewTemplateId === 'categories' ||
      item.filterContext?.subFilter === 'sales_packages' ||
      item.filterContext?.subFilter === 'options' ||
      item.filterContext?.subFilter === 'hardware'
    ) {
      setSearchQuery('');
      setSpecSearchQuery('');
      setStatusFilter('all');
      setSpecFilter('all');
    }
  };

  // Available specifications for ProductOfferings (used in spec filter dropdown)
  const availableProductSpecs = useMemo(() => {
    const specMap = new Map();
    let noSpecCount = 0;
    entities.forEach(e => {
      if (e.entityType === 'ProductOffering') {
        const spec = e.productSpecification || e.raw?.productSpecification;
        const name = (spec?.name || spec?.id || '').trim();
        if (name) {
          specMap.set(name, (specMap.get(name) || 0) + 1);
        } else {
          noSpecCount++;
        }
      }
    });
    const list = Array.from(specMap.entries())
      .map(([name, count]) => ({ name, label: name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    if (noSpecCount > 0) {
      list.push({ name: '__none__', label: 'Without Specification', count: noSpecCount });
    }
    return list;
  }, [entities]);

  // Available specifications filtered to the active context/subfilter for autocomplete
  const filteredProductSpecs = useMemo(() => {
    const specMap = new Map();
    entities.forEach(e => {
      if (e.entityType !== 'ProductOffering') return;
      if (subFilter === 'sales_packages' && !isSalesPackageSpec(e)) return;
      if (subFilter === 'options' && !isOptionSpec(e)) return;
      if (subFilter === 'hardware' && !isHardwareSpec(e)) return;

      const spec = e.productSpecification || e.raw?.productSpecification;
      let name = (spec?.name || spec?.id || '').trim();
      name = name.replace(/:\(version=[^)]+\)$/i, '').trim();
      if (name) {
        specMap.set(name, (specMap.get(name) || 0) + 1);
      }
    });

    return Array.from(specMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [entities, subFilter]);

  // Product specifications matching the user's typed search query in real time
  const matchingProductSpecs = useMemo(() => {
    if (!specSearchQuery.trim()) return filteredProductSpecs;
    const q = specSearchQuery.toLowerCase().trim();
    return filteredProductSpecs.filter(s => s.name.toLowerCase().includes(q));
  }, [filteredProductSpecs, specSearchQuery]);

  // Filtered groups based on type, subfilter, status, spec, and search query
  const isSpecializedActive =
    userListTemplateId === 'sales_packages' ||
    userListTemplateId === 'options' ||
    userListTemplateId === 'hardware' ||
    subFilter === 'sales_packages' ||
    subFilter === 'options' ||
    subFilter === 'hardware';

  const filteredGroups = useMemo(() => {
    return groupedEntities.filter(group => {
      if (typeFilter !== 'all' && group.entityType !== typeFilter) return false;

      // Specification filter (for ProductOfferings, bypassed in Sales Packages / Options view)
      if (!isSpecializedActive && typeFilter === 'ProductOffering' && specFilter !== 'all') {
        const getSpecName = (item) => {
          const spec = item.productSpecification || item.raw?.productSpecification;
          return (spec?.name || spec?.id || '').trim();
        };

        if (specFilter === '__none__') {
          const matchLatest = !getSpecName(group.latestItem);
          const matchPrev = (group.previousVersions || []).some(v => !getSpecName(v));
          if (!matchLatest && !matchPrev) return false;
        } else {
          const target = specFilter.toLowerCase();
          const matchLatest = getSpecName(group.latestItem).toLowerCase() === target;
          const matchPrev = (group.previousVersions || []).some(v => getSpecName(v).toLowerCase() === target);
          if (!matchLatest && !matchPrev) return false;
        }
      }

      // Search with Product Specification
      if (specSearchQuery.trim()) {
        const q = specSearchQuery.trim().toLowerCase();
        const getSpecName = (item) => {
          const spec = item.productSpecification || item.raw?.productSpecification;
          return (spec?.name || spec?.id || '').trim().toLowerCase();
        };
        const matchLatest = getSpecName(group.latestItem).includes(q);
        const matchPrev = (group.previousVersions || []).some(v => getSpecName(v).includes(q));
        if (!matchLatest && !matchPrev) return false;
      }

      // Subfilter checks (from Left Drawer sub-items)
      if (subFilter === 'sales_packages') {
        const matchLatest = isSalesPackageSpec(group.latestItem);
        const matchPrev = (group.previousVersions || []).some(v => isSalesPackageSpec(v));
        if (!matchLatest && !matchPrev) return false;
      }
      if (subFilter === 'options') {
        const matchLatest = isOptionSpec(group.latestItem);
        const matchPrev = (group.previousVersions || []).some(v => isOptionSpec(v));
        if (!matchLatest && !matchPrev) return false;
      }
      if (subFilter === 'hardware') {
        const matchLatest = isHardwareSpec(group.latestItem);
        const matchPrev = (group.previousVersions || []).some(v => isHardwareSpec(v));
        if (!matchLatest && !matchPrev) return false;
      }
      if (subFilter === 'bundle') {
        const isBundle = Boolean(group.latestItem.raw?.isBundle);
        if (!isBundle) return false;
      }
      if (subFilter === 'simple') {
        const isBundle = Boolean(group.latestItem.raw?.isBundle);
        if (isBundle) return false;
      }
      if (subFilter === 'recurring') {
        const pt = (group.latestItem.raw?.priceType || '').toLowerCase();
        if (!pt.includes('recurring')) return false;
      }
      if (subFilter === 'onetime') {
        const pt = (group.latestItem.raw?.priceType || '').toLowerCase();
        if (!pt.includes('one time') && !pt.includes('onetime')) return false;
      }

      // Status filter (bypassed in Sales Packages / Options view)
      if (!isSpecializedActive && statusFilter !== 'all') {
        const matchesLatest = (group.latestItem.lifecycleStatus || '').toLowerCase() === statusFilter.toLowerCase();
        const matchesPrev = group.previousVersions.some(
          v => (v.lifecycleStatus || '').toLowerCase() === statusFilter.toLowerCase()
        );
        if (!matchesLatest && !matchesPrev) return false;
      }

      // Search query (bypassed in Sales Packages / Options view)
      if (!isSpecializedActive && searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = (group.id || '').toLowerCase().includes(q);
        const matchName = (group.name || '').toLowerCase().includes(q);
        // Do not search/filter based on entity type when in Product Offerings view
        const matchType = (typeFilter === 'all')
          ? (group.entityType || '').toLowerCase().includes(q)
          : false;
        const matchStatus = (group.latestItem.lifecycleStatus || '').toLowerCase() === statusFilter.toLowerCase() || (group.latestItem.lifecycleStatus || '').toLowerCase().includes(q);
        const specObj = group.latestItem.productSpecification || group.latestItem.raw?.productSpecification || {};
        const matchSpec = (specObj.name || '').toLowerCase().includes(q) || (specObj.id || '').toLowerCase().includes(q);
        const matchPrev = group.previousVersions.some(
          v => (v.name || '').toLowerCase().includes(q) ||
               (v.version || '').toLowerCase().includes(q) ||
               (v.lifecycleStatus || '').toLowerCase().includes(q) ||
               (v.productSpecification?.name || v.raw?.productSpecification?.name || '').toLowerCase().includes(q)
        );
        if (!matchId && !matchName && !matchType && !matchStatus && !matchSpec && !matchPrev) return false;
      }
      return true;
    });
  }, [groupedEntities, typeFilter, subFilter, statusFilter, specFilter, searchQuery, isSpecializedActive, specSearchQuery]);

  const handleToggleExpand = (groupKey) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };

  const handleExpandAll = () => {
    const allMultiKeys = filteredGroups
      .filter(g => g.previousVersions.length > 0)
      .map(g => g.groupKey);
    setExpandedGroups(new Set(allMultiKeys));
  };

  const handleCollapseAll = () => {
    setExpandedGroups(new Set());
  };

  const isAnyGroupExpanded = expandedGroups.size > 0;
  const handleToggleAllGroups = () => {
    if (isAnyGroupExpanded) {
      handleCollapseAll();
    } else {
      handleExpandAll();
    }
  };

  // Toggle selection across groups
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredGroups.length && filteredGroups.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredGroups.map(g => g.id)));
    }
  };

  const handleToggleSelectItem = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenNewSalesPackage = () => {
    setDrawerItem({
      id: 'NEW_SALES_PACKAGE',
      name: 'New Sales Package',
      entityType: 'ProductOffering',
      isNew: true,
      templateId: 'sales_package_new',
      raw: {
        isBundle: false,
        productSpecification: {
          id: 'VF_DE_SPEC_SALES_PACKAGE',
          name: 'VF_DE_Sales_Package_Specification',
          version: '1'
        }
      }
    });
  };

  // ── Configurable List View Resolution Engine ──
  const listContext = useMemo(() => ({
    typeFilter,
    subFilter,
    specFilter,
    cacheStatus
  }), [typeFilter, subFilter, specFilter, cacheStatus]);

  const sampleListItem = filteredGroups.length > 0 ? filteredGroups[0]?.latestItem : null;
  const autoListTemplateId = useMemo(
    () => resolveListViewTemplateId(listContext, sampleListItem),
    [listContext, sampleListItem]
  );
  const activeListTemplateId = userListTemplateId || autoListTemplateId;
  const isSalesPackagesView =
    activeListTemplateId === 'sales_packages' ||
    subFilter === 'sales_packages';
  const isSpecializedOfferingView =
    activeListTemplateId === 'sales_packages' ||
    activeListTemplateId === 'options' ||
    activeListTemplateId === 'hardware' ||
    subFilter === 'sales_packages' ||
    subFilter === 'options' ||
    subFilter === 'hardware';
  const isSpecializedCustomView =
    isSpecializedOfferingView ||
    activeListTemplateId === 'categories';
  const availableListTemplates = useMemo(
    () => getAvailableListViewTemplates(listContext),
    [listContext]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden', background: C.bg, color: C.text }}>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 'calc(var(--ds-header-h) + 16px)',
          right: '24px',
          zIndex: 99999,
          padding: '10px 18px',
          borderRadius: '8px',
          background: toast.type === 'success' ? 'var(--ds-ok)' : toast.type === 'error' ? 'var(--ds-danger)' : 'var(--ds-text)',
          border: `1px solid ${toast.type === 'success' ? C.success : toast.type === 'error' ? C.danger : C.accent}`,
          color: '#fff',
          fontSize: '13px',
          fontWeight: '600',
          boxShadow: 'var(--ds-shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Auth Banner if not authenticated */}
      {(!token || loginStatus !== 'connected') && (
        <div style={{ padding: '12px 28px', background: 'rgba(239,68,68,0.12)', borderBottom: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--ds-danger)' }}>
            <span><Icon name="alert" size={14} /></span>
            <span>Disconnected from <strong>{selectedEnvName}</strong> ({activeEnv?.apiUrl}). Please connect to authenticate with Keycloak IAM.</span>
          </div>
          <button
            onClick={() => handleLogin()}
            style={btn({ background: 'var(--ds-brand)', borderColor: 'var(--ds-brand)', color: '#fff', padding: '6px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' })}
          >
            <Icon name="login" size={14} />
            Connect to {selectedEnvName}
          </button>
        </div>
      )}

      {/* Purge Progress Bar Banner */}
      {isPurging && purgeProgress && (
        <div style={{ padding: '10px 28px', background: 'rgba(245,158,11,0.15)', borderBottom: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--ds-warn)' }}>
            <span style={{ animation: 'spin 1s infinite linear' }}><Icon name="clock" size={14} /></span>
            <span>Purging entity <strong>{purgeProgress.currentId}</strong> ({purgeProgress.current} of {purgeProgress.total})…</span>
          </div>
          <div style={{ width: '200px', height: '8px', background: 'var(--ds-surface-3)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${(purgeProgress.current / purgeProgress.total) * 100}%`, height: '100%', background: C.warning, transition: 'width 0.2s' }}></div>
          </div>
        </div>
      )}

      {/* ── 2-Column Layout: Left Collapsible Drawer Menu + Right Catalog Table ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Floating Mini Tab when Left Drawer is closed */}
        {!isLeftDrawerOpen && (
          <button
            type="button"
            onClick={() => setIsLeftDrawerOpen(true)}
            style={{
              position: 'absolute',
              left: 0,
              top: '16px',
              zIndex: 30,
              background: '#ffffff',
              border: `1px solid var(--ds-border)`,
              borderLeft: 'none',
              borderTopRightRadius: '8px',
              borderBottomRightRadius: '8px',
              color: 'var(--ds-brand)',
              padding: '10px 7px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '2px 4px 12px rgba(0,0,0,0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
            title="Expand Left Navigation Menu"
            onMouseEnter={e => { e.currentTarget.style.background = '#fff1f0'; e.currentTarget.style.color = 'var(--ds-brand-dark)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = 'var(--ds-brand)'; }}
          >
            <span style={{ fontSize: '12px' }}>▶</span>
            <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', letterSpacing: '2px', fontSize: '11px', textTransform: 'uppercase' }}>Menu</span>
          </button>
        )}

        {/* ── Configurable Left Navigation Menu ── */}
        <ConfigurableLeftMenu
          isOpen={isLeftDrawerOpen}
          onClose={() => setIsLeftDrawerOpen(false)}
          currentContext={{
            typeFilter,
            subFilter,
            specFilter,
            statusFilter
          }}
          onSelectMenuItem={handleSelectMenuItem}
          categoryCounts={categoryCounts}
          expandedSections={expandedMenuSections}
          onToggleSection={handleToggleMenuSection}
        />

        {/* ── Main Content Area: Control Bar + Table ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* ── Common List View Header (Hidden for dedicated Drafts view which has its own header) ── */}
          {activeListTemplateId !== 'drafts' && (
            <ListViewHeader
              title={(() => {
                const t = Object.values(LIST_VIEW_TEMPLATES).find(tmpl => tmpl.id === activeListTemplateId);
                return t ? (t.badge || t.name) : 'Catalog Entities';
              })()}
              icon={(() => {
                const t = Object.values(LIST_VIEW_TEMPLATES).find(tmpl => tmpl.id === activeListTemplateId);
                return t?.icon || 'package';
              })()}
              itemCount={filteredGroups.length}
              cacheStatus={cacheStatus}
              onRefreshCatalog={() => fetchRemoteEntities(token, activeEnv, false, true)}
              isRefreshing={loading}
              disabled={!token}
              isSalesPackagesView={isSalesPackagesView}
              onNewSalesPackage={handleOpenNewSalesPackage}
              selectedCount={selectedIds.size}
              onBulkPurge={() => setShowConfirmBulkModal(true)}
              onClearSelection={() => setSelectedIds(new Set())}
            />
          )}

      {/* ── Table Container ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: activeListTemplateId === 'drafts' ? '16px 28px 24px 28px' : '0 28px 24px 28px' }}>
        {activeListTemplateId === 'drafts' ? (
          <ConfigurableListView
            templateId="drafts"
            context={listContext}
            onResumeDraft={handleResumeDraft}
            onDraftsCountChange={setDraftsCount}
          />
        ) : loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px', color: C.muted }}>
            <div style={{ fontSize: '24px' }}><Icon name="clock" size={24} /></div>
            <div>Querying remote DNEXT endpoints…</div>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '8px', color: C.muted }}>
            <div style={{ fontSize: '28px' }}><Icon name="inbox" size={28} /></div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>No live entities found matching the current filters.</div>
            <div style={{ fontSize: '12px' }}>Try adjusting your search terms or click "Refresh Catalog".</div>
          </div>
        ) : (
          <ConfigurableListView
            templateId={userListTemplateId}
            context={listContext}
            cacheStatus={cacheStatus}
            groups={filteredGroups}
            selectedIds={selectedIds}
            expandedGroups={expandedGroups}
            onToggleSelectAll={handleToggleSelectAll}
            onToggleSelectItem={handleToggleSelectItem}
            onToggleExpand={handleToggleExpand}
            onExpandAll={handleExpandAll}
            onCollapseAll={handleCollapseAll}
            onRefreshCatalog={() => fetchRemoteEntities(token, activeEnv, false, true)}
            isRefreshing={loading}
            onOpenDetail={setDrawerItem}
            onSpecFilter={(specName) => setSpecSearchQuery(specName)}
            onResumeDraft={handleResumeDraft}
            onDraftsCountChange={setDraftsCount}
          />
        )}
      </div>
    </div>
  </div>

  {/* ── JSON Inspect Modal ── */}
      {inspectItem && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#161822',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px',
            width: '800px',
            maxWidth: '90vw',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px rgba(0,0,0,0.7)'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px' }}><Icon name="eye" size={16} /></span>
                <span style={{ fontWeight: '700', fontSize: '15px', color: '#fff' }}>
                  {inspectItem.entityType}: {inspectItem.id}
                </span>
                <span style={{ fontSize: '11px', color: C.muted }}>v{inspectItem.version}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(inspectItem.raw, null, 2));
                    showToast('✓ JSON copied to clipboard', 'info');
                  }}
                  style={btn({ padding: '4px 10px', fontSize: '11px' })}
                >
                  <Icon name="clipboard" size={14} /> Copy JSON
                </button>
                <button
                  onClick={() => setInspectItem(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--ds-text-3)', fontSize: '18px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', background: 'rgba(0,0,0,0.3)' }}>
              <pre style={{ margin: 0, fontFamily: 'var(--ds-font-mono)', fontSize: '12px', color: '#a5b4fc', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(inspectItem.raw, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ── Slide-over Entity / Offer Details Drawer with Fullscreen Option ── */}
      <DnextEntityDrawer
        item={drawerItem}
        isOpen={Boolean(drawerItem)}
        onClose={() => setDrawerItem(null)}
        allEntities={entities}
        activeEnv={activeEnv}
        token={token}
        onSuccessRefresh={() => fetchRemoteEntities(token, activeEnv, false, true)}
      />

      {/* ── Bulk Purge Confirmation Modal ── */}
      {showConfirmBulkModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#1a1622',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '12px',
            width: '480px',
            maxWidth: '90vw',
            padding: '24px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(239,68,68,0.2)', border: '1px solid var(--ds-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: 'var(--ds-danger)' }}><Icon name="alert" size={20} /></div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>Confirm Bulk Entity Purge</h3>
                <span style={{ fontSize: '12px', color: C.muted }}>This action will permanently delete items from remote DNEXT</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ds-border-strong)', lineHeight: '1.5', marginBottom: '20px' }}>
              You have selected <strong style={{ color: 'var(--ds-danger)' }}>{selectedIds.size} entities</strong> for deletion.
              Each entity will be patched to <code>Obsolete</code> (if currently Launched) and deleted across all version trees.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowConfirmBulkModal(false)}
                style={btn({ padding: '8px 16px', fontSize: '12px' })}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkPurge}
                style={btn({ background: 'var(--ds-danger)', borderColor: 'var(--ds-danger)', color: '#fff', padding: '8px 18px', fontSize: '12px' })}
              >
                Yes, Purge {selectedIds.size} Entities
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
