import React, { useState, useEffect, useCallback, useRef } from 'react';
import Icon from './ui/Icon';
import { useAuth } from '../context/EnvironmentContext';

// ─── Design tokens (match the app's existing palette) ─────────────────────────
const C = {
  bg:          '#ffffff',
  panel:       '#ffffff',
  border:      'var(--ds-border)',
  text:        'var(--ds-text)',
  muted:       'var(--ds-text-2)',
  accent:      'var(--ds-brand)',
  red:         'var(--ds-brand)',
  success:     'var(--ds-ok)',
  warning:     '#f59e0b',
  danger:      'var(--ds-danger)',
  indigo:      'var(--ds-brand)',
};

// ─── Entity type badge colours & labels ───────────────────────────────────────
const ENTITY_COLORS = {
  ProductOffering:             { bg: 'rgba(230,0,0,0.08)',  border: 'var(--ds-brand)', text: 'var(--ds-brand-dark)' },
  ProductOfferingPrice:        { bg: 'rgba(16,185,129,0.12)', border: 'var(--ds-ok)', text: 'var(--ds-ok)' },
  BundledProductOfferingPrice: { bg: 'rgba(168,85,247,0.12)', border: '#a855f7', text: 'var(--ds-spec)' },
  ProductSpecification:        { bg: 'rgba(245,158,11,0.12)', border: '#f59e0b', text: 'var(--ds-warn)' },
};

const ENTITY_TYPE_LABELS = {
  ProductOffering:             'Product Offering',
  ProductOfferingPrice:        'Simple POP',
  BundledProductOfferingPrice: 'Bundle POP',
  ProductSpecification:        'Product Spec',
};

const TYPE_TO_PATH = {
  ProductOffering:             'product-offerings',
  ProductOfferingPrice:        'product-offering-prices',
  BundledProductOfferingPrice: 'product-offering-prices',
  ProductSpecification:        'product-specifications',
};

const OFFER_TYPE_COLORS = {
  BundlePOP:           'rgba(168,85,247,0.15)',
  PriceComponent:      'rgba(52,211,153,0.15)',
  TV:                  'rgba(167,139,250,0.15)',
  Hardware:            'rgba(251,146,60,0.15)',
  CallOption:          'rgba(52,211,153,0.15)',
  SalesPackage:        'rgba(230,0,0,0.08)',
  FiberConnectivity:   'rgba(16,185,129,0.15)',
  RegioSurcharge:      'rgba(245,158,11,0.15)',
  VoiceAnschluss:      'rgba(99,102,241,0.15)',
  Specification:       'rgba(148,163,184,0.15)',
  Promotion:           'rgba(236,72,153,0.15)',
  InstallationPackage: 'rgba(20,184,166,0.15)',
  InstallationPackages:'rgba(20,184,166,0.15)',
  Insurance:           'rgba(14,165,233,0.15)',
};

const STATUS_CONFIG = {
  pending: { color: C.warning,  label: 'Pending',  icon: 'clock' },
  synced:  { color: C.success,  label: 'Synced',   icon: '✓'  },
  error:   { color: C.danger,   label: 'Error',    icon: '✕'  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const btn = (override = {}) => ({
  padding: '6px 14px',
  borderRadius: '6px',
  border: '1px solid var(--ds-border-strong)',
  background: '#ffffff',
  color: C.text,
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '600',
  transition: 'all 0.15s ease',
  ...override,
});

export default function DnextDeploymentDashboard({ selectedEnv, environments: propEnvironments, onSelectEnv }) {
  // Auth -----------------------------------------------------------------------
  // Shared auth state (EnvironmentContext) — one token for every view and the header
  const { token, setToken, loginStatus, setLoginStatus, authUser, connect, disconnect, openLoginModal } = useAuth();
  const [username,    setUsername]    = useState(() => localStorage.getItem('dnext_username') || '');
  const [password,    setPassword]    = useState('');

  // Environments ----------------------------------------------------------------
  const [environments, setEnvironments] = useState([]);
  const [selectedEnvName, setSelectedEnvName] = useState(() => localStorage.getItem('dnext_env_name') || 'test');

  // Registry data --------------------------------------------------------------
  const [items,         setItems]         = useState([]);
  const [isLoading,     setIsLoading]     = useState(false);
  const [errorMsg,      setErrorMsg]      = useState('');

  // DNEXT existence map: { dnext_entity_id → boolean | 'checking' } -----------
  const [existsMap,     setExistsMap]     = useState({});

  // Selection ------------------------------------------------------------------
  const [selected,      setSelected]      = useState(new Set());

  // Filters --------------------------------------------------------------------
  const [filterType,    setFilterType]    = useState('all');
  const [filterOffer,   setFilterOffer]   = useState('all');
  const [filterStatus,  setFilterStatus]  = useState('all');
  const [searchQ,       setSearchQ]       = useState('');

  // Action state ---------------------------------------------------------------
  const [actionState,       setActionState]       = useState({}); // { [id]: 'deleting'|'syncing'|'done'|'error' }
  const [resetLoading,      setResetLoading]      = useState(false);
  const [resetMsg,          setResetMsg]          = useState('');
  const [bulkLoading,       setBulkLoading]       = useState(false);
  const [syncStatusLoading, setSyncStatusLoading] = useState(false);
  const [syncStatusMsg,     setSyncStatusMsg]     = useState('');
  const [catalogRefreshing, setCatalogRefreshing] = useState(false);

  // Debug panel ----------------------------------------------------------------
  const [debugItem,      setDebugItem]      = useState(null);
  const [debugPayload,   setDebugPayload]   = useState(null);
  const [debugV0,        setDebugV0]        = useState(null);
  const [debugV1,        setDebugV1]        = useState(null);
  const [debugLoading,   setDebugLoading]   = useState(false);
  const [debugSending,   setDebugSending]   = useState(false);
  const [debugResponse,  setDebugResponse]  = useState(null);
  const [debugTab,       setDebugTab]       = useState('preview');

  // Deployment Package ---------------------------------------------------------
  const [packages,            setPackages]            = useState([]);
  const [selectedPackageId,   setSelectedPackageId]   = useState(null); // null = no filter (show all)
  const [packagesLoading,     setPackagesLoading]     = useState(false);
  const [showNewPkgForm,      setShowNewPkgForm]      = useState(false);
  const [newPkgId,            setNewPkgId]            = useState('');
  const [newPkgName,          setNewPkgName]          = useState('');
  const [newPkgType,          setNewPkgType]          = useState('POC');
  const [newPkgFilePath,      setNewPkgFilePath]      = useState('tmf_packages');
  const [newPkgDesc,          setNewPkgDesc]          = useState('');
  const [newPkgScan,          setNewPkgScan]          = useState(true);

  // Edit Package Modal State
  const [editPkgModalOpen,    setEditPkgModalOpen]    = useState(false);
  const [editingPkg,          setEditingPkg]          = useState(null);
  const [editPkgName,         setEditPkgName]         = useState('');
  const [editPkgType,         setEditPkgType]         = useState('POC');
  const [editPkgFilePath,     setEditPkgFilePath]     = useState('');
  const [editPkgDesc,         setEditPkgDesc]         = useState('');
  const [pkgSaving,           setPkgSaving]           = useState(false);
  const [scanningPkgId,       setScanningPkgId]       = useState(null);

  // Folder suggestions from backend
  const [availableFolders,    setAvailableFolders]    = useState([]);

  // Notification toast ---------------------------------------------------------
  const [toast,         setToast]         = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  // ─── Environment Management ────────────────────────────────────────────────
  const fetchEnvironments = useCallback(() => {
    fetch('/api/dnext/environments')
      .then(res => res.json())
      .then(data => {
        setEnvironments(data);
        const storedName = localStorage.getItem('dnext_env_name') || 'Default (dev-gcu)';
        const env = data.find(e => e.name === storedName);
        if (env) {
          setUsername(env.username || '');
          setPassword(env.password || '');
        } else if (data.length > 0) {
          setSelectedEnvName(data[0].name);
          setUsername(data[0].username || '');
          setPassword(data[0].password || '');
        }
      })
      .catch(err => console.error('Failed to load environments:', err));
  }, []);

  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  useEffect(() => {
    if (selectedEnv && selectedEnv.name && selectedEnv.name !== selectedEnvName) {
      setSelectedEnvName(selectedEnv.name);
      setUsername(selectedEnv.username || '');
      setPassword(selectedEnv.password || '');
    }
  }, [selectedEnv, selectedEnvName]);

  useEffect(() => {
    if (Array.isArray(propEnvironments) && propEnvironments.length > 0) {
      setEnvironments(propEnvironments);
    }
  }, [propEnvironments]);

  // ─── Load folder suggestions ───────────────────────────────────────────────
  const fetchAvailableFolders = useCallback(async () => {
    try {
      const res = await fetch('/api/dnext-deployment-package/available-folders');
      if (res.ok) {
        const list = await res.json();
        setAvailableFolders(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      console.error('Failed to load folder suggestions:', e);
    }
  }, []);

  useEffect(() => {
    fetchAvailableFolders();
  }, [fetchAvailableFolders]);

  // ─── Load packages ────────────────────────────────────────────────────────
  const loadPackages = useCallback(async () => {
    setPackagesLoading(true);
    try {
      const res  = await fetch('/api/dnext-deployment-package');
      const data = await res.json();
      setPackages(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load deployment packages:', e);
    } finally {
      setPackagesLoading(false);
    }
  }, []);

  useEffect(() => { loadPackages(); }, [loadPackages]);

  // ─── Scan package folder ─────────────────────────────────────────────────
  const handleScanPackage = async (pkgId) => {
    setScanningPkgId(pkgId);
    try {
      const res = await fetch(`/api/dnext-deployment-package/${encodeURIComponent(pkgId)}/scan`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to scan package files');
      await Promise.all([loadPackages(), loadItems()]);
      if (data.deleted_count > 0 && data.count === 0) {
        showToast(`✓ Directory empty: removed ${data.deleted_count} items from registry`, 'success');
      } else if (data.deleted_count > 0) {
        showToast(`✓ Scanned ${data.count} items from "${data.file_path}" (${data.deleted_count} deleted items removed)`, 'success');
      } else {
        showToast(`✓ Scanned & synchronized ${data.count} items from "${data.file_path}"`, 'success');
      }
    } catch (e) {
      showToast(`Scan error: ${e.message}`, 'error');
    } finally {
      setScanningPkgId(null);
    }
  };

  // ─── Open & Submit Edit Package Modal ─────────────────────────────────────
  const openEditPackageModal = (pkg) => {
    setEditingPkg(pkg);
    setEditPkgName(pkg.name || '');
    setEditPkgType(pkg.type || 'POC');
    setEditPkgFilePath(pkg.file_path || '');
    setEditPkgDesc(pkg.description || '');
    setEditPkgModalOpen(true);
  };

  const handleEditPackageSubmit = async (e) => {
    e.preventDefault();
    if (!editingPkg || !editPkgName.trim()) return;
    setPkgSaving(true);
    try {
      const res = await fetch(`/api/dnext-deployment-package/${encodeURIComponent(editingPkg.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editPkgName.trim(),
          type: editPkgType,
          file_path: editPkgFilePath.trim(),
          description: editPkgDesc.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update package');
      await loadPackages();
      setEditPkgModalOpen(false);
      showToast(`✓ Package "${editingPkg.name}" updated with path: ${editPkgFilePath || '(none)'}`, 'success');
      // Auto-scan items if a file path is defined
      if (editPkgFilePath.trim()) {
        handleScanPackage(editingPkg.id);
      }
    } catch (err) {
      showToast(`Update failed: ${err.message}`, 'error');
    } finally {
      setPkgSaving(false);
    }
  };

  // ─── Fetch registry items ──────────────────────────────────────────────────
  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      let url = '/api/dnext-deployment-item?';
      if (filterType !== 'all')     url += `entity_type=${encodeURIComponent(filterType)}&`;
      if (filterOffer !== 'all')    url += `offer_type=${encodeURIComponent(filterOffer)}&`;
      if (filterStatus !== 'all')   url += `status=${encodeURIComponent(filterStatus)}&`;
      if (selectedPackageId)        url += `package_id=${encodeURIComponent(selectedPackageId)}&`;
      const res  = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setItems(data.rows || []);
      setSelected(new Set());
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [filterType, filterOffer, filterStatus, selectedPackageId]);

  useEffect(() => { loadItems(); }, [loadItems]);

  // Helper to attach active environment headers to all DNEXT API calls
  const getDnextHeaders = useCallback((authToken = token, contentType = 'application/json') => {
    const storedApiUrl = localStorage.getItem('dnext_api_url') || '';
    const storedAuthUrl = localStorage.getItem('dnext_auth_url') || '';
    const storedEnvName = localStorage.getItem('dnext_env_name') || selectedEnvName || 'Default (dev-gcu)';

    const h = {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(contentType ? { 'Content-Type': contentType } : {}),
      Accept: 'application/json',
      'x-dnext-env-name': storedEnvName,
    };
    if (storedApiUrl) h['x-dnext-api-url'] = storedApiUrl;
    if (storedAuthUrl) h['x-dnext-auth-url'] = storedAuthUrl;
    return h;
  }, [token, selectedEnvName]);

  // ─── Check existence in DNEXT ─────────────────────────────────────────────
  const checkExistence = useCallback(async (item) => {
    if (!token) return;
    const id = item.dnext_entity_id;
    setExistsMap(m => ({ ...m, [id]: 'checking' }));

    const pathSeg = TYPE_TO_PATH[item.dnext_entity_type] || 'product-offerings';
    try {
      const res = await fetch(
        `/api/dnext/${pathSeg}?id=${encodeURIComponent(id)}&lifecycleStatus=In%20study,In%20test,Launched,Retired,Obsolete&limit=1`,
        { headers: getDnextHeaders(token, null) }
      );
      const data = await res.json();
      const found = Array.isArray(data) ? data.length > 0 : !!data?.id;
      setExistsMap(m => ({ ...m, [id]: found }));
    } catch {
      setExistsMap(m => ({ ...m, [id]: false }));
    }
  }, [token, getDnextHeaders]);

  // Check existence for visible items whenever token or items change (prioritizes ProductOffering first)
  useEffect(() => {
    if (!token || items.length === 0) return;
    const prioritized = [...items].sort((a, b) => {
      const aIsOffer = a.dnext_entity_type === 'ProductOffering' ? 0 : 1;
      const bIsOffer = b.dnext_entity_type === 'ProductOffering' ? 0 : 1;
      return aIsOffer - bIsOffer;
    });
    prioritized.forEach(item => {
      if (existsMap[item.dnext_entity_id] === undefined) {
        checkExistence(item);
      }
    });
  }, [token, items, checkExistence]);

  // ─── Auth ──────────────────────────────────────────────────────────────────
  const handleLogin = (e = null) => {
    if (e && e.preventDefault) e.preventDefault();
    openLoginModal();
  };

  const handleLogout = () => {
    // Environment selection is owned globally (EnvironmentContext) — only the token is cleared here
    disconnect();
    setExistsMap({});
  };

  // ─── Purge single item from DNEXT ─────────────────────────────────────────
  // ─── Delete item permanently from disk, registry & remote DNEXT ──────────
  const deleteItemPermanently = async (item) => {
    const id = item.dnext_entity_id;
    setActionState(s => ({ ...s, [id]: 'deleting' }));

    let remotePurgeWarning = null;
    try {
      // 1. Purge from remote DNEXT (always attempt if token is available)
      if (token) {
        try {
          const purgeRes = await fetch('/api/dnext/purge-entity', {
            method: 'POST',
            headers: getDnextHeaders(token),
            body: JSON.stringify({
              objectType: item.dnext_entity_type,
              id,
            }),
          });
          if (!purgeRes.ok && purgeRes.status !== 404) {
            const errData = await purgeRes.json().catch(() => ({}));
            remotePurgeWarning = errData.error || `Remote purge returned HTTP ${purgeRes.status}`;
            console.warn(`[Delete] Remote purge failed for ${id}:`, remotePurgeWarning);
          }
        } catch (purgeErr) {
          remotePurgeWarning = purgeErr.message;
          console.warn(`[Delete] Remote purge error for ${id}:`, purgeErr);
        }
      } else {
        remotePurgeWarning = 'Not connected to DNEXT; item removed locally only.';
      }

      // 2. Delete item from registry AND delete its JSON file from disk
      const delRes = await fetch(`/api/dnext-deployment-item/${encodeURIComponent(id)}?deleteFile=true`, {
        method: 'DELETE',
      });
      if (!delRes.ok) {
        const errData = await delRes.json().catch(() => ({}));
        throw new Error(errData.error || `Delete failed (HTTP ${delRes.status})`);
      }

      setExistsMap(m => ({ ...m, [id]: false }));
      setActionState(s => ({ ...s, [id]: 'done' }));
      return { success: true, remotePurgeWarning };
    } catch (e) {
      setActionState(s => ({ ...s, [id]: 'error' }));
      throw e;
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.dnext_entity_id}" permanently?\n\nThis will remove the item from the deployment package, delete the JSON file from disk, and purge it from remote DNEXT.`)) return;
    try {
      const res = await deleteItemPermanently(item);
      if (res?.remotePurgeWarning) {
        showToast(`✓ Deleted locally (warning: ${res.remotePurgeWarning})`, 'warning');
      } else {
        showToast(`✓ Deleted and purged ${item.dnext_entity_id}`, 'success');
      }
      await Promise.all([loadPackages(), loadItems()]);
    } catch (e) {
      showToast(`Delete failed: ${e.message}`, 'error');
    }
  };

  // ─── Sync single item ─────────────────────────────────────────────────────
  const handleSync = async (item, shouldReload = true) => {
    if (!token) { showToast('Please connect to DNEXT first.', 'error'); return; }
    const id = item.dnext_entity_id;
    setActionState(s => ({ ...s, [id]: 'syncing' }));

    try {
      // Read the source JSON file
      const fileRes = await fetch(`/api/static-file?path=${encodeURIComponent(item.file_path)}`);
      if (!fileRes.ok) throw new Error(`Cannot read source file: ${item.file_path}`);
      const payload = await fileRes.json();

      // Determine target endpoint
      const pathSeg = TYPE_TO_PATH[item.dnext_entity_type];
      if (!pathSeg) throw new Error(`Unknown entity type: ${item.dnext_entity_type}`);

      const res = await fetch(`/api/dnext/${pathSeg}`, {
        method: 'POST',
        headers: getDnextHeaders(token),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);

      // Update local registry status
      await fetch(`/api/dnext-deployment-item/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_status: 'synced', dnext_version: data.version || payload.version }),
      });

      setExistsMap(m => ({ ...m, [id]: true }));
      setActionState(s => ({ ...s, [id]: 'done' }));
      showToast(`✓ Synced ${id}`, 'success');
      if (shouldReload) loadItems();
    } catch (e) {
      // Mark as error in registry
      await fetch(`/api/dnext-deployment-item/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_status: 'error' }),
      }).catch(() => {});
      setActionState(s => ({ ...s, [id]: 'error' }));
      showToast(`Sync failed: ${e.message}`, 'error');
      if (shouldReload) loadItems();
    }
  };

  // ─── Bulk sync selected ───────────────────────────────────────────────────
  const handleBulkSync = async () => {
    if (!token) { showToast('Please connect to DNEXT first.', 'error'); return; }
    if (selected.size === 0) { showToast('Select at least one item.', 'error'); return; }
    setBulkLoading(true);
    const targets = items.filter(i => selected.has(i.dnext_entity_id));
    let ok = 0, fail = 0;
    for (const item of targets) {
      try { await handleSync(item, false); ok++; } catch { fail++; }
    }
    setBulkLoading(false);
    showToast(`Bulk sync complete: ${ok} synced, ${fail} failed`, fail > 0 ? 'error' : 'success');
    loadItems();
  };

  // ─── Bulk delete selected from disk, registry & remote DNEXT ────────────
  const handleBulkDelete = async () => {
    if (selected.size === 0) { showToast('Select at least one item.', 'error'); return; }
    if (!window.confirm(`Delete the ${selected.size} selected items permanently?\n\nThis will remove them from the deployment package, delete their JSON files from disk, and purge them from remote DNEXT.`)) return;
    setBulkLoading(true);
    const targets = items.filter(i => selected.has(i.dnext_entity_id));
    const wasFilteringSearch = !!searchQ.trim();
    const hadSelectedAllVisible = visibleItems.length > 0 && selected.size >= visibleItems.length;
    const hadSelectedAllItems = items.length > 0 && selected.size >= items.length;

    let ok = 0, fail = 0;
    for (const item of targets) {
      try {
        await deleteItemPermanently(item);
        ok++;
      } catch (e) {
        fail++;
      }
    }
    setBulkLoading(false);
    setSelected(new Set());

    // If search query was filtering and all visible items were deleted, clear search so remaining items are shown
    if (wasFilteringSearch && hadSelectedAllVisible) {
      setSearchQ('');
    }

    // If all items under an active filter were deleted, reset filter to 'all' so user is not stuck on an empty list
    if (hadSelectedAllItems) {
      if (filterOffer !== 'all') setFilterOffer('all');
      if (filterType !== 'all') setFilterType('all');
      if (filterStatus !== 'all') setFilterStatus('all');
    }

    // Refresh both deployment items registry AND deployment package counts
    await Promise.all([loadPackages(), loadItems()]);

    const msg = wasFilteringSearch && hadSelectedAllVisible
      ? `Bulk delete complete: ${ok} deleted, ${fail} failed. Search filter was cleared to show remaining items.`
      : `Bulk delete complete: ${ok} deleted, ${fail} failed`;
    showToast(msg, fail > 0 ? 'warning' : 'success');
  };

  // ─── Reset registry ───────────────────────────────────────────────────────
  const handleReset = async () => {
    if (!window.confirm('Truncate and re-seed dnext_deployment_item from all scratch files?')) return;
    setResetLoading(true);
    setResetMsg('');
    try {
      const res  = await fetch('/api/dnext-deployment-item/reset', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setResetMsg(`✓ Re-seeded ${data.total_seeded} items`);
      setExistsMap({});
      loadItems();
      showToast(`Registry reset — ${data.total_seeded} items loaded`, 'success');
    } catch (e) {
      setResetMsg(`✕ ${e.message}`);
      showToast(`Reset failed: ${e.message}`, 'error');
    } finally {
      setResetLoading(false);
    }
  };

  // ─── Sync Status ─────────────────────────────────────────────────────────
  // Queries DNEXT for every visible item by ID with lifecycleStatus=Launched.
  // Updates local sync_status to 'synced' if found with Launched, 'pending' otherwise.
  const handleSyncStatus = async () => {
    if (!token) { showToast('Please connect to DNEXT first.', 'error'); return; }
    setSyncStatusLoading(true);
    setSyncStatusMsg('');

    const targets = visibleItems.length > 0 ? visibleItems : items;
    let synced = 0, pending = 0, errors = 0;

    for (const item of targets) {
      const id      = item.dnext_entity_id;
      const pathSeg = TYPE_TO_PATH[item.dnext_entity_type];
      if (!pathSeg) continue;

      // Mark as checking in exists map
      setExistsMap(m => ({ ...m, [id]: 'checking' }));

      try {
        // Query DNEXT: look up entity by id across active lifecycle statuses
        const res  = await fetch(
          `/api/dnext/${pathSeg}?id=${encodeURIComponent(id)}&lifecycleStatus=Launched,In%20study,In%20test&limit=1`,
          { headers: getDnextHeaders(token, null) }
        );
        const data = await res.json();

        // Determine if the entity exists in DNEXT
        const validStatuses = ['Launched', 'In study', 'In test'];
        const found = Array.isArray(data)
          ? data.some(d => validStatuses.includes(d.lifecycleStatus))
          : (data?.id && (!data.lifecycleStatus || validStatuses.includes(data?.lifecycleStatus)));

        const newStatus = found ? 'synced' : 'pending';
        setExistsMap(m => ({ ...m, [id]: found }));

        // Update local registry only if status changes
        if (item.sync_status !== newStatus) {
          await fetch(`/api/dnext-deployment-item/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sync_status: newStatus }),
          });
        }

        found ? synced++ : pending++;
      } catch {
        setExistsMap(m => ({ ...m, [id]: false }));
        errors++;
      }
    }

    await loadItems();
    setSyncStatusLoading(false);
    const msg = `✓ Status refreshed — ${synced} Launched, ${pending} not found, ${errors} errors`;
    setSyncStatusMsg(msg);
    showToast(msg, errors > 0 ? 'error' : 'success');
  };

  // ─── Refresh Remote Catalog Cache ───────────────────────────────────────────
  const handleRefreshCatalog = async () => {
    if (!token) {
      if (openLoginModal) {
        openLoginModal();
      } else {
        showToast('Please connect to Keycloak/DNEXT to refresh remote catalog.', 'error');
      }
      return;
    }
    setCatalogRefreshing(true);
    try {
      const headers = getDnextHeaders(token);
      // Query remote catalog endpoints with &refresh=true to bypass and update SQLite catalog cache
      await Promise.allSettled([
        fetch('/api/dnext/product-offerings?limit=1000&refresh=true', { headers }),
        fetch('/api/dnext/product-offering-prices?limit=1000&refresh=true', { headers }),
        fetch('/api/dnext/product-specifications?limit=1000&refresh=true', { headers }),
        fetch('/api/dnext/categories?limit=1000&refresh=true', { headers }),
      ]);
      setExistsMap({});
      await loadItems();
      showToast('✓ Remote catalog refreshed successfully', 'success');
    } catch (err) {
      console.error('Failed to refresh remote catalog:', err);
      showToast(`Refresh catalog failed: ${err.message}`, 'error');
    } finally {
      setCatalogRefreshing(false);
    }
  };


  // ─── Sync Debug ───────────────────────────────────────────────────────────
  // Opens the debug panel: loads the source file and constructs the v0/v1
  // payloads exactly as the backend would, WITHOUT sending anything.
  const handleSyncDebug = async (item) => {
    setDebugItem(item);
    setDebugPayload(null);
    setDebugV0(null);
    setDebugV1(null);
    setDebugResponse(null);
    setDebugTab('preview');
    setDebugLoading(true);

    try {
      const fileRes = await fetch(`/api/static-file?path=${encodeURIComponent(item.file_path)}`);
      if (!fileRes.ok) throw new Error(`Cannot read source file: ${item.file_path}`);
      const raw = await fileRes.json();
      setDebugPayload(raw);

      // Replicate the exact v0 / v1 construction the backend does
      const startDateTime = new Date(Date.now() + 3 * 60 * 1000).toISOString();

      const v0 = {
        ...raw,
        version: '0',
        lifecycleStatus: 'In study',
        validFor: { ...(raw.validFor || {}), startDateTime },
      };

      const v1 = {
        ...raw,
        version: '1',
        lifecycleStatus: 'Launched',
        validFor: { ...(raw.validFor || {}), startDateTime },
      };

      setDebugV0(v0);
      setDebugV1(v1);
    } catch (e) {
      setDebugPayload({ _error: e.message });
    } finally {
      setDebugLoading(false);
    }
  };

  // Sends the debug item to DNEXT for real (same as handleSync) and captures the full response.
  const handleDebugSend = async () => {
    if (!token) { showToast('Please connect to DNEXT first.', 'error'); return; }
    if (!debugItem || !debugV1) return;
    setDebugSending(true);
    setDebugResponse(null);
    setDebugTab('response');

    const pathSeg = TYPE_TO_PATH[debugItem.dnext_entity_type];
    if (!pathSeg) throw new Error(`Unknown entity type: ${debugItem.dnext_entity_type}`);

    try {
      const res  = await fetch(`/api/dnext/${pathSeg}`, {
        method: 'POST',
        headers: getDnextHeaders(token),
        body: JSON.stringify(debugPayload),
      });
      const body = await res.json().catch(() => ({}));
      setDebugResponse({ ok: res.ok, status: res.status, body });

      if (res.ok) {
        // Update local registry
        await fetch(`/api/dnext-deployment-item/${encodeURIComponent(debugItem.dnext_entity_id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sync_status: 'synced', dnext_version: body.version || '1' }),
        });
        setExistsMap(m => ({ ...m, [debugItem.dnext_entity_id]: true }));
        showToast(`✓ Sent successfully — ID: ${body.id || debugItem.dnext_entity_id}`, 'success');
        loadItems();
      } else {
        await fetch(`/api/dnext-deployment-item/${encodeURIComponent(debugItem.dnext_entity_id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sync_status: 'error' }),
        }).catch(() => {});
        showToast(`DNEXT returned HTTP ${res.status}`, 'error');
      }
    } catch (e) {
      setDebugResponse({ ok: false, status: 0, body: { _error: e.message } });
      showToast(`Send failed: ${e.message}`, 'error');
    } finally {
      setDebugSending(false);
    }
  };

  // ─── Filtering ────────────────────────────────────────────────────────────
  const visibleItems = items.filter(item => {
    if (!searchQ.trim()) return true;
    const q = searchQ.toLowerCase();
    return (
      item.dnext_entity_id?.toLowerCase().includes(q) ||
      item.vf_de_offer_id?.toLowerCase().includes(q) ||
      item.dnext_entity_type?.toLowerCase().includes(q) ||
      item.vf_de_offer_type?.toLowerCase().includes(q)
    );
  });

  // ─── Selection helpers ────────────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const toggleAll = () => {
    if (selected.size === visibleItems.length) setSelected(new Set());
    else setSelected(new Set(visibleItems.map(i => i.dnext_entity_id)));
  };

  const uniqueTypes  = [...new Set(items.map(i => i.dnext_entity_type))].sort();
  const uniqueOffers = [...new Set(items.map(i => i.vf_de_offer_type))].sort();

  // ─── Existence badge ─────────────────────────────────────────────────────
  const ExistsBadge = ({ id }) => {
    const val = existsMap[id];
    if (!token) return <span style={{ color: C.muted, fontSize: '11px' }}>—</span>;
    if (val === 'checking') return (
      <span style={{ color: C.muted, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid #555', borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        Checking
      </span>
    );
    if (val === true) return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: C.success, fontSize: '11px', fontWeight: 700 }}>
        <span style={{ width: '7px', height: '7px', background: C.success, borderRadius: '50%', boxShadow: `0 0 6px ${C.success}` }} />
        In DNEXT
      </span>
    );
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--ds-text-2)', fontSize: '11px' }}>
        <span style={{ width: '7px', height: '7px', background: 'var(--ds-text-2)', borderRadius: '50%', border: '1px solid var(--ds-text-2)' }} />
        Not in DNEXT
      </span>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg, color: C.text, fontFamily: "'Outfit', sans-serif", overflow: 'hidden' }}>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform: translateY(-8px); } to { opacity:1; transform: translateY(0); } }
        .dep-row:hover { background: var(--ds-surface-subtle) !important; }
        .dep-row:hover .dep-actions { opacity: 1 !important; }
        .dep-actions { opacity: 0; transition: opacity 0.15s; }
        .dep-btn:hover { filter: brightness(0.95); transform: translateY(-1px); }
      `}</style>

      {/* ── Header bar ─────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 28px', borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '13px', color: C.muted }}>
              Manage and deploy catalog entities to DNEXT Product Catalog
            </p>
          </div>

          {/* Auth block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            {loginStatus === 'connected' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: C.success }}>
                  <span style={{ width: '8px', height: '8px', background: C.success, borderRadius: '50%', boxShadow: `0 0 8px ${C.success}` }} />
                  {authUser || username || 'Connected'} ({selectedEnvName})
                </span>
                <button style={btn({ borderColor: 'var(--ds-border-strong)' })} onClick={handleLogout}>Disconnect</button>
              </div>
            ) : (
              <form onSubmit={handleLogin} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {/* Target environment is selected globally in the header (EnvironmentContext) */}
                <span title="Change the target environment in the header" style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'var(--ds-surface-subtle)', color: C.muted, fontSize: '12px', fontFamily: 'var(--ds-font-mono)' }}>
                  {selectedEnvName}
                </span>

                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username"
                  style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: '#ffffff', color: C.text, fontSize: '12px', width: '100px' }} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
                  style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: '#ffffff', color: C.text, fontSize: '12px', width: '90px' }} />
                <button type="submit" style={btn({ background: 'var(--ds-brand)', borderColor: 'var(--ds-brand-dark)', color: '#ffffff' })} disabled={loginStatus === 'connecting'}>
                  {loginStatus === 'connecting' ? 'Connecting…' : loginStatus === 'error' ? 'Retry' : 'Connect'}
                </button>

              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── Deployment Package Pulldown Selector ─────────────────────────────────── */}
      <div style={{ padding: '12px 28px', borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: 'var(--ds-surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <datalist id="folder-suggestions">
          {availableFolders.map(f => (
            <option key={f} value={f} />
          ))}
        </datalist>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ds-text)', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span></span> Deployment Package:
          </label>

          {packagesLoading ? (
            <span style={{ fontSize: '12px', color: C.muted }}>Loading packages…</span>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <select
                value={selectedPackageId || 'all'}
                onChange={e => setSelectedPackageId(e.target.value === 'all' ? null : e.target.value)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--ds-border-strong)',
                  background: '#ffffff',
                  color: 'var(--ds-text)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minWidth: '280px',
                  outline: 'none',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                }}
              >
                <option value="all">
                  All Packages ({packages.reduce((sum, p) => sum + (p.item_count || 0), 0)} items)
                </option>
                {packages.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} [{pkg.type}] — {pkg.item_count} items
                  </option>
                ))}
              </select>

              {/* Active package summary chip & management actions */}
              {selectedPackageId && (() => {
                const currentPkg = packages.find(p => p.id === selectedPackageId);
                if (!currentPkg) return null;
                const isScanning = scanningPkgId === currentPkg.id;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(230,0,0,0.06)', border: '1px solid rgba(230,0,0,0.2)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', color: 'var(--ds-brand)' }}>
                      <span style={{ fontWeight: '700' }}>{currentPkg.type}</span>
                      <span style={{ opacity: 0.5 }}>•</span>
                      <span>{currentPkg.item_count} items</span>
                    </div>

                    {/* File path badge */}
                    <div
                      title={`Target directory on disk: ${currentPkg.file_path || 'No path configured'}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'rgba(16,185,129,0.1)',
                        border: '1px solid rgba(16,185,129,0.25)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: 'var(--ds-ok)',
                        fontFamily: "'JetBrains Mono', monospace"
                      }}
                    >
                      <span><Icon name="folder" size={14} /></span>
                      <span style={{ fontWeight: 600 }}>{currentPkg.file_path || 'No path'}</span>
                    </div>

                    {/* Rescan button */}
                    <button
                      onClick={() => handleScanPackage(currentPkg.id)}
                      disabled={isScanning}
                      style={btn({
                        padding: '5px 10px',
                        fontSize: '11px',
                        color: 'var(--ds-ok)',
                        background: 'rgba(16,185,129,0.1)',
                        border: '1px solid rgba(16,185,129,0.3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      })}
                      title="Rescan JSON files from the package directory and sync items"
                    >
                      {isScanning ? (
                        <>
                          <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid rgba(4,120,87,0.3)', borderTopColor: 'var(--ds-ok)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                          Scanning…
                        </>
                      ) : (
                        <><Icon name="zap" size={14} /> Rescan Directory</>
                      )}
                    </button>

                    {/* Edit Package button */}
                    <button
                      onClick={() => openEditPackageModal(currentPkg)}
                      style={btn({ padding: '5px 10px', fontSize: '11px', color: 'var(--ds-warn)', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' })}
                      title="Edit package details and source file path"
                    >
                      <Icon name="edit" size={14} /> Edit Package
                    </button>
                  </div>
                );
              })()}

              {/* New package toggle */}
              <button
                onClick={() => setShowNewPkgForm(f => !f)}
                style={btn({ padding: '6px 12px', fontSize: '12px', color: 'var(--ds-brand)', border: '1px dashed var(--ds-brand)', background: showNewPkgForm ? 'rgba(230,0,0,0.08)' : '#ffffff' })}
                title="Create a new deployment package with custom file path"
              >
                {showNewPkgForm ? '✕ Cancel' : '+ New Package'}
              </button>
            </div>
          )}
        </div>

        {/* Inline new package form */}
        {showNewPkgForm && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newPkgId.trim() || !newPkgName.trim()) return;
              const res = await fetch('/api/dnext-deployment-package', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: newPkgId.trim(),
                  name: newPkgName.trim(),
                  type: newPkgType,
                  file_path: newPkgFilePath.trim(),
                  description: newPkgDesc.trim(),
                  scan_files: newPkgScan
                }),
              });
              const data = await res.json();
              if (res.ok) {
                await loadPackages();
                setSelectedPackageId(data.id);
                setShowNewPkgForm(false);
                setNewPkgId('');
                setNewPkgName('');
                setNewPkgFilePath('tmf_packages');
                setNewPkgDesc('');
                showToast(`✓ Package "${data.name}" created (${data.scanned_items_count || 0} items imported)`, 'success');
                await loadItems();
              } else {
                showToast(`Failed: ${data.error}`, 'error');
              }
            }}
            style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px', width: '100%', padding: '12px 16px', background: '#ffffff', borderRadius: '8px', border: '1px solid var(--ds-border-strong)', flexWrap: 'wrap' }}
          >
            <input
              value={newPkgId} onChange={e => setNewPkgId(e.target.value)} placeholder="Package ID (e.g. vf-fiber-stage2)" required
              style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: '#ffffff', color: C.text, fontSize: '12px', width: '160px' }}
            />
            <input
              value={newPkgName} onChange={e => setNewPkgName(e.target.value)} placeholder="Display Name (e.g. Fiber Stage 2)" required
              style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: '#ffffff', color: C.text, fontSize: '12px', width: '180px' }}
            />
            <select
              value={newPkgType} onChange={e => setNewPkgType(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: '#ffffff', color: C.text, fontSize: '12px' }}
            >
              {['POC', 'Staging', 'Production', 'Release', 'Custom'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input
              value={newPkgFilePath} onChange={e => setNewPkgFilePath(e.target.value)} placeholder="Source Directory / File Path (e.g. tmf_packages/TMFVersion2)" list="folder-suggestions"
              style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: '#ffffff', color: 'var(--ds-ok)', fontSize: '12px', width: '220px', fontFamily: "'JetBrains Mono', monospace" }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: C.muted, cursor: 'pointer' }}>
              <input
                type="checkbox" checked={newPkgScan} onChange={e => setNewPkgScan(e.target.checked)}
                style={{ accentColor: C.indigo }}
              />
              Auto-import JSON files
            </label>
            <button type="submit" style={btn({ background: 'var(--ds-brand)', borderColor: 'var(--ds-brand-dark)', color: '#fff', fontSize: '12px', padding: '6px 14px' })}>Create & Register</button>
            <button type="button" onClick={() => setShowNewPkgForm(false)} style={btn({ color: C.muted, fontSize: '12px', padding: '6px 10px' })}>Cancel</button>
          </form>
        )}
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', flexShrink: 0, background: '#ffffff' }}>

        {/* Search with quick clear */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <input
            value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search by ID, type…"
            style={{ padding: '7px 26px 7px 12px', borderRadius: '6px', border: `1px solid ${C.border}`, background: '#ffffff', color: C.text, fontSize: '12px', width: '220px' }}
          />
          {searchQ && (
            <button
              onClick={() => setSearchQ('')}
              title="Clear search"
              style={{
                position: 'absolute',
                right: '7px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: C.muted,
                padding: '2px 4px',
                fontSize: '12px',
                lineHeight: 1
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Entity type filter */}
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setSelected(new Set()); }}
          style={{ padding: '7px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: '#ffffff', color: C.text, fontSize: '12px' }}>
          <option value="all">All Types</option>
          {uniqueTypes.map(t => <option key={t} value={t}>{ENTITY_TYPE_LABELS[t] || t}</option>)}
        </select>

        {/* Offer type filter */}
        <select value={filterOffer} onChange={e => { setFilterOffer(e.target.value); setSelected(new Set()); }}
          style={{ padding: '7px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: '#ffffff', color: C.text, fontSize: '12px' }}>
          <option value="all">All Offer Types</option>
          {uniqueOffers.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Status filter */}
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setSelected(new Set()); }}
          style={{ padding: '7px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: '#ffffff', color: C.text, fontSize: '12px' }}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="synced">Synced</option>
          <option value="error">Error</option>
        </select>

        {/* Clear filters shortcut */}
        {Boolean(searchQ.trim() || filterType !== 'all' || filterOffer !== 'all' || filterStatus !== 'all') && (
          <button
            onClick={() => {
              setSearchQ('');
              setFilterType('all');
              setFilterOffer('all');
              setFilterStatus('all');
            }}
            style={btn({ fontSize: '11px', padding: '6px 10px', color: C.muted })}
            className="dep-btn"
            title="Reset search and filters to view all items in active package"
          >
            ✕ Reset Filters
          </button>
        )}

        <div style={{ flex: 1 }} />

        {/* Bulk sync / delete */}
        {selected.size > 0 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleBulkSync} disabled={bulkLoading || !token}
              style={btn({ background: 'var(--ds-brand)', borderColor: 'var(--ds-brand-dark)', color: '#fff', opacity: bulkLoading ? 0.6 : 1 })}
              className="dep-btn"
            >
              {bulkLoading ? 'Syncing…' : `Sync Selected (${selected.size})`}
            </button>
            <button
              onClick={handleBulkDelete} disabled={bulkLoading}
              style={btn({ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: 'var(--ds-danger)', opacity: bulkLoading ? 0.6 : 1 })}
              className="dep-btn"
              title="Delete selected items permanently from disk, registry, and remote DNEXT"
            >
              {bulkLoading ? 'Deleting…' : `Delete Selected (${selected.size})`}
            </button>
          </div>
        )}

        {/* Reload */}
        <button
          onClick={() => { loadPackages(); loadItems(); }}
          disabled={isLoading || packagesLoading}
          style={btn()}
          className="dep-btn"
          title="Reload local deployment registry and package counts"
        >
          {(isLoading || packagesLoading) ? '…' : '↻ Reload'}
        </button>

        {/* Refresh Catalog */}
        <button
          onClick={handleRefreshCatalog}
          disabled={catalogRefreshing}
          style={btn({
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            opacity: catalogRefreshing ? 0.6 : 1,
          })}
          className="dep-btn"
          title={!token ? 'Log in to Keycloak to refresh remote catalog' : 'Fetch latest remote catalog entities from active DNEXT environment (bypasses cache)'}
        >
          {catalogRefreshing ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid rgba(0,0,0,0.25)', borderTopColor: 'var(--ds-brand)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Refreshing…
            </span>
          ) : (
            '⟳ Refresh Catalog'
          )}
        </button>

        {/* Sync Status */}
        <button
          onClick={handleSyncStatus}
          disabled={syncStatusLoading || !token}
          className="dep-btn"
          title="Query DNEXT for each item by ID with lifecycleStatus=Launched and update local sync_status"
          style={btn({
            background: syncStatusLoading ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.12)',
            borderColor: 'rgba(16,185,129,0.5)',
            color: '#6ee7b7',
            opacity: (!token || syncStatusLoading) ? 0.6 : 1,
          })}
        >
          {syncStatusLoading
            ? <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid rgba(16,185,129,0.3)', borderTopColor: 'var(--ds-ok)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Checking…
              </span>
            : '⟳ Sync Status'}
        </button>
        {syncStatusMsg && (
          <span style={{ fontSize: '11px', color: syncStatusMsg.includes('error') && !syncStatusMsg.startsWith('✓') ? C.danger : C.success }}>
            {syncStatusMsg}
          </span>
        )}

        {/* Reset registry */}
        <button onClick={handleReset} disabled={resetLoading}
          style={btn({ background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.4)', color: 'var(--ds-danger)' })}
          className="dep-btn"
          title="Truncate and re-seed the registry from scratch files"
        >
          {resetLoading ? 'Resetting…' : '⟳ Reset Registry'}
        </button>
        {resetMsg && <span style={{ fontSize: '11px', color: resetMsg.startsWith('✓') ? C.success : C.danger }}>{resetMsg}</span>}
      </div>

      {/* ── Stats bar ──────────────────────────────────────────────────── */}
      <div style={{ padding: '8px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: '20px', flexShrink: 0, background: 'rgba(10,10,16,0.3)' }}>
        {[
          { label: 'Total', val: items.length, color: C.accent },
          { label: 'Showing', val: visibleItems.length, color: C.text },
          { label: 'Selected', val: selected.size, color: C.indigo },
          { label: 'Synced', val: items.filter(i => i.sync_status === 'synced').length, color: C.success },
          { label: 'Pending', val: items.filter(i => i.sync_status === 'pending').length, color: C.warning },
          { label: 'Error', val: items.filter(i => i.sync_status === 'error').length, color: C.danger },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.val}</span>
            <span style={{ fontSize: '11px', color: C.muted }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Error banner ───────────────────────────────────────────────── */}
      {errorMsg && (
        <div style={{ margin: '10px 28px 0', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '12px', color: 'var(--ds-danger)', flexShrink: 0 }}>
          <Icon name="alert" size={14} /> {errorMsg}
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 28px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '12px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {/* Select all */}
              <th style={{ padding: '8px 10px 8px 0', textAlign: 'left', width: '36px' }}>
                <input
                  type="checkbox"
                  checked={visibleItems.length > 0 && selected.size === visibleItems.length}
                  onChange={toggleAll}
                  style={{ accentColor: C.indigo, width: '14px', height: '14px', cursor: 'pointer' }}
                />
              </th>
              {['DNEXT Entity ID', 'Entity Name', 'Entity Type', 'Offer Type', 'Version', 'VF-DE Offer ID', 'Exists in DNEXT', 'Sync Status', 'Updated', 'Actions'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: C.muted, fontWeight: 600, fontSize: '11px', whiteSpace: 'nowrap', userSelect: 'none' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={11} style={{ padding: '48px', textAlign: 'center', color: C.muted }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', border: `3px solid rgba(167,139,250,0.2)`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Loading deployment items…
                </div>
              </td></tr>
            )}

            {!isLoading && visibleItems.length === 0 && (
              <tr>
                <td colSpan={11} style={{ padding: '56px 24px', textAlign: 'center', background: '#fafafa', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ maxWidth: '540px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--ds-surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, border: `1px solid ${C.border}` }}>
                      <Icon name="search" size={22} />
                    </div>

                    <div style={{ fontSize: '15px', fontWeight: 600, color: C.text }}>
                      {items.length > 0 && searchQ.trim()
                        ? `No items match search "${searchQ}"`
                        : selectedPackageId
                        ? `Deployment package "${packages.find(p => p.id === selectedPackageId)?.name || selectedPackageId}" contains no items`
                        : (filterType !== 'all' || filterOffer !== 'all' || filterStatus !== 'all')
                        ? 'No items match the active filters'
                        : 'No deployment items found'}
                    </div>

                    <p style={{ fontSize: '12px', color: C.muted, margin: 0, lineHeight: 1.5 }}>
                      {items.length > 0 && searchQ.trim()
                        ? `There are ${items.length} items in this view that do not match "${searchQ}". Clear the search query to view them.`
                        : selectedPackageId
                        ? 'All items in this package may have been removed, or the package directory has not been scanned.'
                        : 'Try resetting the filters or scanning a deployment package directory.'}
                    </p>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
                      {searchQ.trim() && (
                        <button
                          onClick={() => setSearchQ('')}
                          style={btn({ background: 'var(--ds-brand)', borderColor: 'var(--ds-brand-dark)', color: '#ffffff', fontSize: '12px', padding: '6px 14px' })}
                          className="dep-btn"
                        >
                          Clear Search ({items.length} items available)
                        </button>
                      )}

                      {(filterType !== 'all' || filterOffer !== 'all' || filterStatus !== 'all') && (
                        <button
                          onClick={() => { setFilterType('all'); setFilterOffer('all'); setFilterStatus('all'); }}
                          style={btn({ background: '#ffffff', borderColor: C.border, color: C.text, fontSize: '12px', padding: '6px 14px' })}
                          className="dep-btn"
                        >
                          Reset Filters (Type, Offer, Status)
                        </button>
                      )}

                      {selectedPackageId && (
                        <button
                          onClick={() => { setSelectedPackageId(null); setSearchQ(''); setFilterType('all'); setFilterOffer('all'); setFilterStatus('all'); }}
                          style={btn({ background: 'var(--ds-brand)', borderColor: 'var(--ds-brand-dark)', color: '#ffffff', fontSize: '12px', padding: '6px 14px' })}
                          className="dep-btn"
                        >
                          View All Packages ({packages.reduce((sum, p) => sum + (p.item_count || 0), 0)} items)
                        </button>
                      )}

                      {selectedPackageId && (() => {
                        const activePkg = packages.find(p => p.id === selectedPackageId);
                        return activePkg?.file_path ? (
                          <button
                            onClick={() => handleScanPackage(activePkg.id)}
                            style={btn({ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)', color: 'var(--ds-ok)', fontSize: '12px', padding: '6px 14px' })}
                            className="dep-btn"
                          >
                            Rescan Package Directory
                          </button>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && visibleItems.map(item => {
              const id      = item.dnext_entity_id;
              const ec      = ENTITY_COLORS[item.dnext_entity_type] || {};
              const sc      = STATUS_CONFIG[item.sync_status] || STATUS_CONFIG.pending;
              const aState  = actionState[id];
              const isAct   = aState === 'deleting' || aState === 'syncing';

              return (
                <tr key={id} className="dep-row"
                  style={{ borderBottom: `1px solid ${C.border}`, background: selected.has(id) ? 'rgba(230,0,0,0.06)' : 'transparent', transition: 'background 0.1s' }}>

                  {/* Checkbox */}
                  <td style={{ padding: '10px 10px 10px 0' }}>
                    <input type="checkbox" checked={selected.has(id)} onChange={() => toggleSelect(id)}
                      style={{ accentColor: 'var(--ds-brand)', width: '14px', height: '14px', cursor: 'pointer' }} />
                  </td>

                  {/* DNEXT Entity ID */}
                  <td style={{ padding: '10px 12px' }}>
                    <a
                      href={`#/catalog?id=${encodeURIComponent(id)}&search=${encodeURIComponent(id)}&type=${encodeURIComponent(item.dnext_entity_type || 'all')}`}
                      title={`View ${item.dnext_entity_type || 'entity'} "${id}" in Live Catalog`}
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '11px',
                        color: 'var(--ds-brand)',
                        fontWeight: 600,
                        textDecoration: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'color 0.15s ease, text-decoration 0.15s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.textDecoration = 'underline';
                        e.currentTarget.style.color = 'var(--ds-brand-dark, #b91c1c)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.textDecoration = 'none';
                        e.currentTarget.style.color = 'var(--ds-brand)';
                      }}
                    >
                      {id}
                      <span style={{ fontSize: '10px', opacity: 0.65 }}>↗</span>
                    </a>
                  </td>

                  {/* Entity Name */}
                  <td style={{ padding: '10px 12px', color: C.text, fontWeight: 500 }}>
                    {item.entity_name || '—'}
                  </td>

                  {/* Entity Type badge */}
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: ec.bg || 'var(--ds-surface-2)',
                      border: `1px solid ${ec.border || 'var(--ds-border-strong)'}`,
                      color: ec.text || C.text,
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      {item.dnext_entity_type === 'BundledProductOfferingPrice' && <span><Icon name="package" size={14} /></span>}
                      {item.dnext_entity_type === 'ProductOfferingPrice' && <span><Icon name="tag" size={14} /></span>}
                      {item.dnext_entity_type === 'ProductOffering' && <span><Icon name="clipboard" size={14} /></span>}
                      {item.dnext_entity_type === 'ProductSpecification' && <span><Icon name="settings" size={14} /></span>}
                      {ENTITY_TYPE_LABELS[item.dnext_entity_type] || item.dnext_entity_type?.replace('Product', '') || '—'}
                    </span>
                  </td>

                  {/* Offer Type */}
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: OFFER_TYPE_COLORS[item.vf_de_offer_type] || 'var(--ds-surface-subtle)', color: C.text, border: `1px solid var(--ds-border)`, whiteSpace: 'nowrap' }}>
                      {item.vf_de_offer_type || '—'}
                    </span>
                  </td>

                  {/* Version */}
                  <td style={{ padding: '10px 12px', color: C.muted, fontFamily: 'var(--ds-font-mono)' }}>
                    {item.dnext_version !== null ? `v${item.dnext_version}` : '—'}
                  </td>

                  {/* VF-DE Offer ID */}
                  <td style={{ padding: '10px 12px', color: C.muted, fontSize: '11px', fontFamily: 'var(--ds-font-mono)' }}>
                    {item.vf_de_offer_id || '—'}
                  </td>

                  {/* Exists in DNEXT */}
                  <td style={{ padding: '10px 12px' }}>
                    <ExistsBadge id={id} />
                  </td>

                  {/* Sync Status */}
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: sc.color, fontSize: '11px', fontWeight: 700 }}>
                      <Icon name={sc.icon} size={14} />
                      {sc.label}
                    </span>
                  </td>

                  {/* Updated at */}
                  <td style={{ padding: '10px 12px', color: C.muted, fontSize: '11px', whiteSpace: 'nowrap' }}>
                    {item.updated_at ? new Date(item.updated_at).toLocaleString() : '—'}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '10px 12px' }}>
                    <div className="dep-actions" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {/* Sync */}
                      <button
                        onClick={() => handleSync(item)} disabled={isAct || !token}
                        className="dep-btn"
                        title={token ? 'Sync to DNEXT' : 'Connect to DNEXT first'}
                        style={btn({
                          background: aState === 'syncing' ? 'rgba(79,70,229,0.3)' : 'rgba(79,70,229,0.15)',
                          borderColor: aState === 'done' ? C.success : C.indigo,
                          color: aState === 'done' ? C.success : '#a5b4fc',
                          opacity: (!token || isAct) ? 0.5 : 1,
                          padding: '4px 10px',
                          fontSize: '11px',
                        })}
                      >
                        {aState === 'syncing' ? '⟳ Syncing…' : aState === 'done' ? '✓ Synced' : 'Sync'}
                      </button>

                      {/* Sync - Debug */}
                      <button
                        onClick={() => handleSyncDebug(item)}
                        className="dep-btn"
                        title="Preview payload and DNEXT response without committing"
                        style={btn({
                          background: 'rgba(245,158,11,0.12)',
                          borderColor: 'rgba(245,158,11,0.4)',
                          color: '#fcd34d',
                          padding: '4px 10px',
                          fontSize: '11px',
                        })}
                      >
                        <Icon name="search" size={14} /> Debug
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(item)} disabled={isAct}
                        className="dep-btn"
                        title="Delete item permanently from disk, registry, and remote DNEXT"
                        style={btn({
                          background: 'rgba(239,68,68,0.1)',
                          borderColor: 'rgba(239,68,68,0.35)',
                          color: 'var(--ds-danger)',
                          opacity: isAct ? 0.5 : 1,
                          padding: '4px 10px',
                          fontSize: '11px',
                        })}
                      >
                        {aState === 'deleting' ? '…' : '✕ Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Toast notification ─────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '28px', zIndex: 9999,
          padding: '12px 20px', borderRadius: '10px',
          background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : toast.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(79,70,229,0.15)',
          border: `1px solid ${toast.type === 'success' ? C.success : toast.type === 'error' ? C.danger : C.indigo}`,
          color: C.text, fontSize: '13px', fontWeight: 600,
          animation: 'fadeIn 0.25s ease',
          boxShadow: 'var(--ds-shadow-lg)',
          maxWidth: '380px',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Debug Drawer ────────────────────────────────────────────────── */}
      {debugItem && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setDebugItem(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 8000, animation: 'fadeIn 0.2s ease' }}
          />

          {/* Drawer panel */}
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '700px', maxWidth: '95vw',
            background: '#ffffff', borderLeft: `1px solid var(--ds-border-strong)`,
            zIndex: 8001, display: 'flex', flexDirection: 'column',
            animation: 'slideIn 0.25s ease',
            boxShadow: '-12px 0 48px rgba(0,0,0,0.15)',
          }}>
            <style>{`
              @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
            `}</style>

            {/* Drawer header */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0, background: 'var(--ds-surface-subtle)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ds-brand)', marginBottom: '3px' }}><Icon name="search" size={14} /> Sync Debug</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--ds-text)', fontWeight: 600 }}>{debugItem.dnext_entity_id}</div>
                <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>{debugItem.dnext_entity_type} · {debugItem.vf_de_offer_type} · {debugItem.file_path}</div>
              </div>
              <button onClick={() => setDebugItem(null)} style={{ background: 'none', border: 'none', color: C.muted, fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: '#ffffff' }}>
              {[['preview', 'Payload Preview'], ['response', 'DNEXT Response']].map(([tab, label]) => (
                <button key={tab} onClick={() => setDebugTab(tab)} style={{
                  padding: '10px 20px', background: 'none', border: 'none',
                  borderBottom: debugTab === tab ? `2px solid var(--ds-brand)` : '2px solid transparent',
                  color: debugTab === tab ? 'var(--ds-brand)' : C.muted,
                  fontWeight: debugTab === tab ? 700 : 400, fontSize: '12px', cursor: 'pointer',
                }}>{label}</button>
              ))}
              <div style={{ flex: 1 }} />
              {/* Send button */}
              <button
                onClick={handleDebugSend}
                disabled={debugSending || debugLoading || !token || !debugV1}
                style={btn({
                  margin: '6px 16px 6px 0',
                  background: 'var(--ds-brand)',
                  borderColor: 'var(--ds-brand-dark)', color: '#ffffff',
                  opacity: (debugSending || debugLoading || !token) ? 0.5 : 1,
                  fontSize: '12px',
                })}
              >
                {debugSending
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#ffffff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      Sending…
                    </span>
                  : 'Send to DNEXT'}
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', background: '#ffffff' }}>
              {debugLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '48px', color: C.muted }}>
                  <div style={{ width: '28px', height: '28px', border: `3px solid rgba(230,0,0,0.2)`, borderTopColor: 'var(--ds-brand)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Loading source file…
                </div>
              )}

              {/* Preview tab */}
              {!debugLoading && debugTab === 'preview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Raw source file */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: C.muted, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}><Icon name="file" size={12} /> Source File (raw)</div>
                    <pre style={{
                      background: 'var(--ds-surface-subtle)', border: `1px solid ${C.border}`,
                      borderRadius: '8px', padding: '12px', fontSize: '11px',
                      fontFamily: "'JetBrains Mono', monospace", color: 'var(--ds-text)',
                      overflowX: 'auto', maxHeight: '200px', overflowY: 'auto',
                      whiteSpace: 'pre',
                    }}>{debugPayload ? JSON.stringify(debugPayload, null, 2) : '—'}</pre>
                  </div>

                  {/* v0 payload */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ds-warn)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>⬆ POST #1 — version "0" · In study</div>
                    <pre style={{
                      background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)',
                      borderRadius: '8px', padding: '12px', fontSize: '11px',
                      fontFamily: "'JetBrains Mono', monospace", color: 'var(--ds-warn)',
                      overflowX: 'auto', maxHeight: '260px', overflowY: 'auto',
                      whiteSpace: 'pre',
                    }}>{debugV0 ? JSON.stringify(debugV0, null, 2) : '—'}</pre>
                  </div>

                  {/* v1 payload */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ds-ok)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>⬆ POST #2 — version "1" · Launched</div>
                    <pre style={{
                      background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)',
                      borderRadius: '8px', padding: '12px', fontSize: '11px',
                      fontFamily: "'JetBrains Mono', monospace", color: 'var(--ds-ok)',
                      overflowX: 'auto', maxHeight: '260px', overflowY: 'auto',
                      whiteSpace: 'pre',
                    }}>{debugV1 ? JSON.stringify(debugV1, null, 2) : '—'}</pre>
                  </div>

                  <div style={{ padding: '10px 14px', background: 'rgba(230,0,0,0.06)', border: '1px solid rgba(230,0,0,0.2)', borderRadius: '8px', fontSize: '11px', color: 'var(--ds-brand-dark)' }}>
                    ℹ Click <strong>Send to DNEXT</strong> to execute both POSTs and see the response.
                  </div>
                </div>
              )}

              {/* Response tab */}
              {!debugLoading && debugTab === 'response' && (
                <div>
                  {debugSending && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '48px', color: C.muted }}>
                      <div style={{ width: '28px', height: '28px', border: `3px solid rgba(230,0,0,0.2)`, borderTopColor: 'var(--ds-brand)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Sending to DNEXT…
                    </div>
                  )}

                  {!debugSending && !debugResponse && (
                    <div style={{ padding: '48px', textAlign: 'center', color: C.muted, fontSize: '12px' }}>
                      No response yet. Click <strong style={{ color: 'var(--ds-brand)' }}>Send to DNEXT</strong> above.
                    </div>
                  )}

                  {!debugSending && debugResponse && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Status badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                          background: debugResponse.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                          border: `1px solid ${debugResponse.ok ? C.success : C.danger}`,
                          color: debugResponse.ok ? C.success : C.danger,
                        }}>
                          HTTP {debugResponse.status} {debugResponse.ok ? '✓ OK' : '✕ Error'}
                        </span>
                        {debugResponse.ok && debugResponse.body?.id && (
                          <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '11px', color: 'var(--ds-text)', fontWeight: 600 }}>id: {debugResponse.body.id}</span>
                        )}
                      </div>

                      {/* Full response body */}
                      <div style={{ fontSize: '11px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Response body</div>
                      <pre style={{
                        background: debugResponse.ok ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                        border: `1px solid ${debugResponse.ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                        borderRadius: '8px', padding: '14px', fontSize: '11px',
                        fontFamily: "'JetBrains Mono', monospace",
                        color: debugResponse.ok ? 'var(--ds-ok)' : 'var(--ds-danger)',
                        overflowX: 'auto', overflowY: 'auto', maxHeight: '600px',
                        whiteSpace: 'pre',
                      }}>{JSON.stringify(debugResponse.body, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {/* ── Edit Package Modal ────────────────────────────────────────── */}
      {editPkgModalOpen && editingPkg && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'var(--ds-overlay)', backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: '#ffffff', border: '1px solid var(--ds-border-strong)',
            borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '540px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--ds-text)', fontWeight: 700 }}>
                  <Icon name="edit" size={14} /> Edit Deployment Package: <span style={{ color: 'var(--ds-brand)', fontFamily: "'JetBrains Mono', monospace" }}>{editingPkg.id}</span>
                </h3>
                <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>
                  Update package name, environment type, and linked source directory path.
                </div>
              </div>
              <button
                onClick={() => setEditPkgModalOpen(false)}
                style={{ background: 'none', border: 'none', color: C.muted, fontSize: '18px', cursor: 'pointer', padding: '4px' }}
              >✕</button>
            </div>

            <form onSubmit={handleEditPackageSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: C.muted, marginBottom: '4px', textTransform: 'uppercase' }}>
                  Package Display Name
                </label>
                <input
                  value={editPkgName} onChange={e => setEditPkgName(e.target.value)} required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${C.border}`, background: '#ffffff', color: C.text, fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: C.muted, marginBottom: '4px', textTransform: 'uppercase' }}>
                    Type
                  </label>
                  <select
                    value={editPkgType} onChange={e => setEditPkgType(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: '#ffffff', color: C.text, fontSize: '13px' }}
                  >
                    {['POC', 'Staging', 'Production', 'Release', 'Custom'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: C.muted, marginBottom: '4px', textTransform: 'uppercase' }}>
                    Source File Path / Directory
                  </label>
                  <input
                    value={editPkgFilePath} onChange={e => setEditPkgFilePath(e.target.value)} list="folder-suggestions" placeholder="e.g. tmf_packages/TMFVersion2"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${C.border}`, background: '#ffffff', color: 'var(--ds-ok)', fontSize: '13px', fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: C.muted, marginBottom: '4px', textTransform: 'uppercase' }}>
                  Description (Optional)
                </label>
                <textarea
                  value={editPkgDesc} onChange={e => setEditPkgDesc(e.target.value)} rows={2} placeholder="Package details or release notes…"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${C.border}`, background: '#ffffff', color: C.text, fontSize: '12px', resize: 'vertical' }}
                />
              </div>

              <div style={{ padding: '8px 12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', fontSize: '11px', color: 'var(--ds-ok)' }}>
                <Icon name="info" size={14} /> Saving will update the package's linked directory and automatically trigger a directory scan to register any new or modified TMF 620 items.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button" onClick={() => setEditPkgModalOpen(false)}
                  style={btn({ padding: '8px 16px', fontSize: '12px', color: C.muted })}
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={pkgSaving}
                  style={btn({ background: 'var(--ds-brand)', borderColor: 'var(--ds-brand-dark)', color: '#fff', padding: '8px 20px', fontSize: '12px' })}
                >
                  {pkgSaving ? 'Saving…' : 'Save Package & Resync'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
