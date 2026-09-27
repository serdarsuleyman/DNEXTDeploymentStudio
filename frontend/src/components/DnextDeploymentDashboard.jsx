import React, { useState, useEffect, useCallback, useRef } from 'react';

// ─── Design tokens (match the app's existing palette) ─────────────────────────
const C = {
  bg:          '#0b0c10',
  panel:       'rgba(22,24,30,0.85)',
  border:      'rgba(255,255,255,0.08)',
  text:        '#f3f4f6',
  muted:       '#9ca3af',
  accent:      '#a78bfa',
  red:         '#E60000',
  success:     '#10b981',
  warning:     '#f59e0b',
  danger:      '#ef4444',
  indigo:      '#4f46e5',
};

// ─── Entity type badge colours & labels ───────────────────────────────────────
const ENTITY_COLORS = {
  ProductOffering:             { bg: 'rgba(79,70,229,0.18)',  border: '#4f46e5', text: '#818cf8' },
  ProductOfferingPrice:        { bg: 'rgba(16,185,129,0.15)', border: '#10b981', text: '#34d399' },
  BundledProductOfferingPrice: { bg: 'rgba(168,85,247,0.18)', border: '#a855f7', text: '#c084fc' },
  ProductSpecification:        { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', text: '#fbbf24' },
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
  BundlePOP:           'rgba(168,85,247,0.25)',
  PriceComponent:      'rgba(52,211,153,0.25)',
  TV:                  'rgba(167,139,250,0.2)',
  Hardware:            'rgba(251,146,60,0.2)',
  CallOption:          'rgba(52,211,153,0.2)',
  SalesPackage:        'rgba(56,189,248,0.2)',
  FiberConnectivity:   'rgba(16,185,129,0.2)',
  RegioSurcharge:      'rgba(245,158,11,0.2)',
  VoiceAnschluss:      'rgba(99,102,241,0.2)',
  Specification:       'rgba(148,163,184,0.2)',
  Promotion:           'rgba(236,72,153,0.2)',
  InstallationPackage: 'rgba(20,184,166,0.2)',
  InstallationPackages:'rgba(20,184,166,0.2)',
  Insurance:           'rgba(14,165,233,0.2)',
};

const STATUS_CONFIG = {
  pending: { color: C.warning,  label: 'Pending',  icon: '⏳' },
  synced:  { color: C.success,  label: 'Synced',   icon: '✓'  },
  error:   { color: C.danger,   label: 'Error',    icon: '✕'  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const btn = (override = {}) => ({
  padding: '6px 14px',
  borderRadius: '6px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.06)',
  color: C.text,
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '600',
  transition: 'all 0.15s ease',
  ...override,
});

export default function DnextDeploymentDashboard() {
  // Auth -----------------------------------------------------------------------
  const [token,       setToken]       = useState(() => localStorage.getItem('dnext_token') || '');
  const [loginStatus, setLoginStatus] = useState(token ? 'connected' : 'disconnected');
  const [username,    setUsername]    = useState(() => localStorage.getItem('dnext_username') || '');
  const [password,    setPassword]    = useState('');

  // Environments ----------------------------------------------------------------
  const [environments, setEnvironments] = useState([]);
  const [selectedEnvName, setSelectedEnvName] = useState(() => localStorage.getItem('dnext_env_name') || 'Default (dev-gcu)');
  const [showAddEnv, setShowAddEnv] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');
  const [newEnvUrl, setNewEnvUrl] = useState('');
  const [newEnvUsername, setNewEnvUsername] = useState('');
  const [newEnvPassword, setNewEnvPassword] = useState('');

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
      showToast(`✓ Scanned & synchronized ${data.count} items from "${data.file_path}"`, 'success');
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
        `/api/dnext/${pathSeg}?id=${encodeURIComponent(id)}&limit=1`,
        { headers: getDnextHeaders(token, null) }
      );
      const data = await res.json();
      const found = Array.isArray(data) ? data.length > 0 : !!data?.id;
      setExistsMap(m => ({ ...m, [id]: found }));
    } catch {
      setExistsMap(m => ({ ...m, [id]: false }));
    }
  }, [token, getDnextHeaders]);

  // Check existence for all visible items whenever token or items change
  useEffect(() => {
    if (!token || items.length === 0) return;
    items.forEach(item => {
      if (existsMap[item.dnext_entity_id] === undefined) {
        checkExistence(item);
      }
    });
  }, [token, items, checkExistence]);

  const handleAddEnv = (e) => {
    e.preventDefault();
    if (!newEnvName || !newEnvUrl) {
      alert('Name and URL are required.');
      return;
    }
    fetch('/api/dnext/environments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newEnvName,
        url: newEnvUrl,
        username: newEnvUsername,
        password: newEnvPassword
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setEnvironments(data.environments);
        setSelectedEnvName(newEnvName);
        setUsername(newEnvUsername);
        setPassword(newEnvPassword);
        setShowAddEnv(false);
        setNewEnvName('');
        setNewEnvUrl('');
        setNewEnvUsername('');
        setNewEnvPassword('');
      } else {
        alert('Failed to add environment: ' + data.error);
      }
    })
    .catch(err => alert('Error saving environment: ' + err.message));
  };

  // ─── Auth ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginStatus('connecting');
    try {
      const res  = await fetch('/api/dnext/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, envName: selectedEnvName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error_description || data.error || 'Auth failed');
      setToken(data.access_token);
      localStorage.setItem('dnext_token', data.access_token);
      localStorage.setItem('dnext_username', data.username);
      localStorage.setItem('dnext_api_url', data.apiUrl);
      localStorage.setItem('dnext_auth_url', data.authUrl);
      localStorage.setItem('dnext_env_name', data.envName);
      setLoginStatus('connected');
      setExistsMap({});
    } catch (e) {
      setLoginStatus('error');
      setErrorMsg(`Authentication failed: ${e.message}`);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('dnext_token');
    localStorage.removeItem('dnext_api_url');
    localStorage.removeItem('dnext_auth_url');
    localStorage.removeItem('dnext_env_name');
    setLoginStatus('disconnected');
    setExistsMap({});
  };

  // ─── Purge single item from DNEXT ─────────────────────────────────────────
  // Uses /api/dnext/purge-entity to purge all versions from remote DNEXT
  // and resets local sync_status to 'pending'
  const purgeAndResetItem = async (item) => {
    const id = item.dnext_entity_id;
    setActionState(s => ({ ...s, [id]: 'deleting' }));

    try {
      // 1. Purge from remote DNEXT if connected (tolerates 404/already gone)
      if (token && existsMap[id] !== false) {
        const purgeRes = await fetch('/api/dnext/purge-entity', {
          method: 'POST',
          headers: getDnextHeaders(token),
          body: JSON.stringify({
            objectType: item.dnext_entity_type,
            id,
          }),
        });

        // 404 / notFound = already not in DNEXT — that is fine, continue with local status reset
        if (!purgeRes.ok && purgeRes.status !== 404) {
          const errData = await purgeRes.json().catch(() => ({}));
          if (!errData.notFound && !errData.error?.toLowerCase().includes('not found')) {
            throw new Error(errData.error || `Purge failed (HTTP ${purgeRes.status})`);
          }
        }
      }

      // 2. Reset local registry sync_status to 'pending'
      await fetch(`/api/dnext-deployment-item/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_status: 'pending' }),
      });

      setExistsMap(m => ({ ...m, [id]: false }));
      setActionState(s => ({ ...s, [id]: 'done' }));
    } catch (e) {
      setActionState(s => ({ ...s, [id]: 'error' }));
      throw e;
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Purge ALL versions of "${item.dnext_entity_id}" from remote DNEXT?\n\nThis will purge every version from remote DNEXT and reset local status to pending.`)) return;
    try {
      await purgeAndResetItem(item);
      showToast(`✓ Purged all versions of ${item.dnext_entity_id} from DNEXT`, 'success');
      loadItems();
    } catch (e) {
      showToast(`Purge failed: ${e.message}`, 'error');
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

  // ─── Bulk purge selected from DNEXT ──────────────────────────────────────
  const handleBulkDelete = async () => {
    if (selected.size === 0) { showToast('Select at least one item.', 'error'); return; }
    if (!window.confirm(`Purge ALL versions of the ${selected.size} selected items from remote DNEXT?\n\nThis will purge every version from remote DNEXT and reset local status to pending.`)) return;
    setBulkLoading(true);
    const targets = items.filter(i => selected.has(i.dnext_entity_id));
    let ok = 0, fail = 0;
    for (const item of targets) {
      try {
        await purgeAndResetItem(item);
        ok++;
      } catch (e) {
        fail++;
      }
    }
    setBulkLoading(false);
    showToast(`Bulk purge complete: ${ok} purged from DNEXT, ${fail} failed`, fail > 0 ? 'error' : 'success');
    loadItems();
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
        // Query DNEXT: look up entity by id AND lifecycleStatus=Launched
        const res  = await fetch(
          `/api/dnext/${pathSeg}?id=${encodeURIComponent(id)}&lifecycleStatus=Launched&limit=1`,
          { headers: getDnextHeaders(token, null) }
        );
        const data = await res.json();

        // Determine if the entity exists in DNEXT with Launched status
        const found = Array.isArray(data)
          ? data.some(d => d.lifecycleStatus === 'Launched')
          : (data?.id && data?.lifecycleStatus === 'Launched');

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
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280', fontSize: '11px' }}>
        <span style={{ width: '7px', height: '7px', background: '#374151', borderRadius: '50%', border: '1px solid #4b5563' }} />
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
        .dep-row:hover { background: rgba(255,255,255,0.03) !important; }
        .dep-row:hover .dep-actions { opacity: 1 !important; }
        .dep-actions { opacity: 0; transition: opacity 0.15s; }
        .dep-btn:hover { filter: brightness(1.2); transform: translateY(-1px); }
      `}</style>

      {/* ── Header bar ─────────────────────────────────────────────────── */}
      <div style={{ padding: '18px 28px 14px', borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: 'rgba(10,10,16,0.7)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, background: 'linear-gradient(135deg, #a78bfa, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '3px' }}>
              DNEXT Deployment
            </h2>
            <p style={{ fontSize: '12px', color: C.muted }}>
              Manage and deploy catalog entities to DNEXT Product Catalog
            </p>
          </div>

          {/* Auth block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            {loginStatus === 'connected' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: C.success }}>
                  <span style={{ width: '8px', height: '8px', background: C.success, borderRadius: '50%', boxShadow: `0 0 8px ${C.success}` }} />
                  {username || 'Connected'} ({selectedEnvName})
                </span>
                <button style={btn({ borderColor: '#374151' })} onClick={handleLogout}>Disconnect</button>
              </div>
            ) : (
              <form onSubmit={handleLogin} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {/* Select Environment Dropdown */}
                <select
                  value={selectedEnvName}
                  onChange={(e) => {
                    const name = e.target.value;
                    setSelectedEnvName(name);
                    const env = environments.find(env => env.name === name);
                    if (env) {
                      setUsername(env.username || '');
                      setPassword(env.password || '');
                    }
                  }}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'rgba(10,10,16,0.9)', color: C.text, fontSize: '12px' }}
                >
                  {environments.map((env) => (
                    <option key={env.name} value={env.name}>
                      {env.name}
                    </option>
                  ))}
                </select>

                {/* Add Environment Button */}
                <button
                  type="button"
                  onClick={() => setShowAddEnv(!showAddEnv)}
                  style={btn({ padding: '6px 10px', fontSize: '11px', borderColor: 'rgba(255,255,255,0.15)' })}
                  title="Add New Environment URL"
                >
                  ⚙️
                </button>

                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username"
                  style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.05)', color: C.text, fontSize: '12px', width: '100px' }} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
                  style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.05)', color: C.text, fontSize: '12px', width: '90px' }} />
                <button type="submit" style={btn({ background: 'rgba(79,70,229,0.25)', borderColor: C.indigo, color: '#a5b4fc' })} disabled={loginStatus === 'connecting'}>
                  {loginStatus === 'connecting' ? 'Connecting…' : loginStatus === 'error' ? 'Retry' : 'Connect'}
                </button>

                {/* Add Environment Popover */}
                {showAddEnv && (
                  <div style={{
                    position: 'absolute', top: '40px', right: '0', background: '#11131e', border: `1px solid ${C.border}`,
                    padding: '16px', borderRadius: '8px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '10px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)', width: '280px', animation: 'fadeIn 0.2s ease-out'
                  }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '13px', color: '#fff', fontWeight: 600 }}>Add Environment</h4>
                    <input value={newEnvName} onChange={e => setNewEnvName(e.target.value)} placeholder="Environment Name (e.g. test-g)"
                      style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.05)', color: C.text, fontSize: '12px' }} />
                    <input value={newEnvUrl} onChange={e => setNewEnvUrl(e.target.value)} placeholder="UI URL (https://...)"
                      style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.05)', color: C.text, fontSize: '12px' }} />
                    <input value={newEnvUsername} onChange={e => setNewEnvUsername(e.target.value)} placeholder="Username"
                      style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.05)', color: C.text, fontSize: '12px' }} />
                    <input type="password" value={newEnvPassword} onChange={e => setNewEnvPassword(e.target.value)} placeholder="Password"
                      style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.05)', color: C.text, fontSize: '12px' }} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
                      <button type="button" onClick={() => setShowAddEnv(false)} style={btn({ borderColor: 'rgba(255,255,255,0.1)' })}>Cancel</button>
                      <button type="button" onClick={handleAddEnv} style={btn({ background: 'rgba(79,70,229,0.3)', borderColor: C.indigo, color: '#fff' })}>Save</button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── Deployment Package Pulldown Selector ─────────────────────────────────── */}
      <div style={{ padding: '12px 28px', borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: 'rgba(15,12,28,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <datalist id="folder-suggestions">
          {availableFolders.map(f => (
            <option key={f} value={f} />
          ))}
        </datalist>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#e5e7eb', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>📦</span> Deployment Package:
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
                  border: '1px solid rgba(99,102,241,0.4)',
                  background: '#161822',
                  color: '#f3f4f6',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minWidth: '280px',
                  outline: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}
              >
                <option value="all">
                  🌐 All Packages ({packages.reduce((sum, p) => sum + (p.item_count || 0), 0)} items)
                </option>
                {packages.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>
                    📦 {pkg.name} [{pkg.type}] — {pkg.item_count} items
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', color: '#a5b4fc' }}>
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
                        background: 'rgba(16,185,129,0.12)',
                        border: '1px solid rgba(16,185,129,0.3)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: '#6ee7b7',
                        fontFamily: "'JetBrains Mono', monospace"
                      }}
                    >
                      <span>📁</span>
                      <span style={{ fontWeight: 600 }}>{currentPkg.file_path || 'No path'}</span>
                    </div>

                    {/* Rescan button */}
                    <button
                      onClick={() => handleScanPackage(currentPkg.id)}
                      disabled={isScanning}
                      style={btn({
                        padding: '5px 10px',
                        fontSize: '11px',
                        color: '#a7f3d0',
                        background: 'rgba(16,185,129,0.15)',
                        border: '1px solid rgba(16,185,129,0.4)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      })}
                      title="Rescan JSON files from the package directory and sync items"
                    >
                      {isScanning ? (
                        <>
                          <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid rgba(167,243,208,0.3)', borderTopColor: '#a7f3d0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                          Scanning…
                        </>
                      ) : (
                        <>⚡ Rescan Directory</>
                      )}
                    </button>

                    {/* Edit Package button */}
                    <button
                      onClick={() => openEditPackageModal(currentPkg)}
                      style={btn({ padding: '5px 10px', fontSize: '11px', color: '#fde68a', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' })}
                      title="Edit package details and source file path"
                    >
                      ✏️ Edit Package
                    </button>
                  </div>
                );
              })()}

              {/* New package toggle */}
              <button
                onClick={() => setShowNewPkgForm(f => !f)}
                style={btn({ padding: '6px 12px', fontSize: '12px', color: '#a5b4fc', border: '1px dashed rgba(99,102,241,0.4)', background: showNewPkgForm ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)' })}
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
            style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px', width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.3)', flexWrap: 'wrap' }}
          >
            <input
              value={newPkgId} onChange={e => setNewPkgId(e.target.value)} placeholder="Package ID (e.g. vf-fiber-stage2)" required
              style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.05)', color: C.text, fontSize: '12px', width: '160px' }}
            />
            <input
              value={newPkgName} onChange={e => setNewPkgName(e.target.value)} placeholder="Display Name (e.g. Fiber Stage 2)" required
              style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.05)', color: C.text, fontSize: '12px', width: '180px' }}
            />
            <select
              value={newPkgType} onChange={e => setNewPkgType(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: '#161822', color: C.text, fontSize: '12px' }}
            >
              {['POC', 'Staging', 'Production', 'Release', 'Custom'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input
              value={newPkgFilePath} onChange={e => setNewPkgFilePath(e.target.value)} placeholder="Source Directory / File Path (e.g. tmf_packages/TMFVersion2)" list="folder-suggestions"
              style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.05)', color: '#6ee7b7', fontSize: '12px', width: '220px', fontFamily: "'JetBrains Mono', monospace" }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: C.muted, cursor: 'pointer' }}>
              <input
                type="checkbox" checked={newPkgScan} onChange={e => setNewPkgScan(e.target.checked)}
                style={{ accentColor: C.indigo }}
              />
              Auto-import JSON files
            </label>
            <button type="submit" style={btn({ background: 'rgba(79,70,229,0.3)', borderColor: C.indigo, color: '#fff', fontSize: '12px', padding: '6px 14px' })}>Create & Register</button>
            <button type="button" onClick={() => setShowNewPkgForm(false)} style={btn({ color: C.muted, fontSize: '12px', padding: '6px 10px' })}>Cancel</button>
          </form>
        )}
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', flexShrink: 0, background: 'rgba(10,10,16,0.4)' }}>

        {/* Search */}
        <input
          value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="🔍 Search by ID, type…"
          style={{ padding: '7px 12px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.05)', color: C.text, fontSize: '12px', width: '220px' }}
        />

        {/* Entity type filter */}
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setSelected(new Set()); }}
          style={{ padding: '7px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: '#111', color: C.text, fontSize: '12px' }}>
          <option value="all">All Types</option>
          {uniqueTypes.map(t => <option key={t} value={t}>{ENTITY_TYPE_LABELS[t] || t}</option>)}
        </select>

        {/* Offer type filter */}
        <select value={filterOffer} onChange={e => { setFilterOffer(e.target.value); setSelected(new Set()); }}
          style={{ padding: '7px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: '#111', color: C.text, fontSize: '12px' }}>
          <option value="all">All Offer Types</option>
          {uniqueOffers.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Status filter */}
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setSelected(new Set()); }}
          style={{ padding: '7px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: '#111', color: C.text, fontSize: '12px' }}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="synced">Synced</option>
          <option value="error">Error</option>
        </select>

        <div style={{ flex: 1 }} />

        {/* Bulk sync / delete */}
        {selected.size > 0 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleBulkSync} disabled={bulkLoading || !token}
              style={btn({ background: 'rgba(79,70,229,0.25)', borderColor: C.indigo, color: '#a5b4fc', opacity: bulkLoading ? 0.6 : 1 })}
              className="dep-btn"
            >
              {bulkLoading ? 'Syncing…' : `⚡ Sync Selected (${selected.size})`}
            </button>
            <button
              onClick={handleBulkDelete} disabled={bulkLoading}
              style={btn({ background: 'rgba(239,68,68,0.25)', borderColor: 'rgba(239,68,68,0.5)', color: '#fca5a5', opacity: bulkLoading ? 0.6 : 1 })}
              className="dep-btn"
              title="Delete selected items from remote DNEXT and reset local sync status to pending"
            >
              {bulkLoading ? 'Deleting…' : `🗑 Delete Selected (${selected.size})`}
            </button>
          </div>
        )}

        {/* Reload */}
        <button onClick={loadItems} disabled={isLoading} style={btn()} className="dep-btn">
          {isLoading ? '…' : '↻ Reload'}
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
                <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid rgba(16,185,129,0.3)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
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
          style={btn({ background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.4)', color: '#fca5a5' })}
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
        <div style={{ margin: '10px 28px 0', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '12px', color: '#fca5a5', flexShrink: 0 }}>
          ⚠ {errorMsg}
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
              <tr><td colSpan={11} style={{ padding: '48px', textAlign: 'center', color: C.muted }}>
                No items match the current filters.
              </td></tr>
            )}

            {!isLoading && visibleItems.map(item => {
              const id      = item.dnext_entity_id;
              const ec      = ENTITY_COLORS[item.dnext_entity_type] || {};
              const sc      = STATUS_CONFIG[item.sync_status] || STATUS_CONFIG.pending;
              const aState  = actionState[id];
              const isAct   = aState === 'deleting' || aState === 'syncing';

              return (
                <tr key={id} className="dep-row"
                  style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`, background: selected.has(id) ? 'rgba(79,70,229,0.07)' : 'transparent', transition: 'background 0.1s' }}>

                  {/* Checkbox */}
                  <td style={{ padding: '10px 10px 10px 0' }}>
                    <input type="checkbox" checked={selected.has(id)} onChange={() => toggleSelect(id)}
                      style={{ accentColor: C.indigo, width: '14px', height: '14px', cursor: 'pointer' }} />
                  </td>

                  {/* DNEXT Entity ID */}
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#c4b5fd' }}>{id}</span>
                  </td>

                  {/* Entity Name */}
                  <td style={{ padding: '10px 12px', color: C.text }}>
                    {item.entity_name || '—'}
                  </td>

                  {/* Entity Type badge */}
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      background: ec.bg || 'rgba(255,255,255,0.05)',
                      border: `1px solid ${ec.border || 'rgba(255,255,255,0.1)'}`,
                      color: ec.text || C.text,
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      {item.dnext_entity_type === 'BundledProductOfferingPrice' && <span>📦</span>}
                      {item.dnext_entity_type === 'ProductOfferingPrice' && <span>🏷️</span>}
                      {item.dnext_entity_type === 'ProductOffering' && <span>📋</span>}
                      {item.dnext_entity_type === 'ProductSpecification' && <span>⚙️</span>}
                      {ENTITY_TYPE_LABELS[item.dnext_entity_type] || item.dnext_entity_type?.replace('Product', '') || '—'}
                    </span>
                  </td>

                  {/* Offer Type */}
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: OFFER_TYPE_COLORS[item.vf_de_offer_type] || 'rgba(255,255,255,0.05)', color: C.text, border: `1px solid rgba(255,255,255,0.08)`, whiteSpace: 'nowrap' }}>
                      {item.vf_de_offer_type || '—'}
                    </span>
                  </td>

                  {/* Version */}
                  <td style={{ padding: '10px 12px', color: C.muted, fontFamily: 'monospace' }}>
                    {item.dnext_version !== null ? `v${item.dnext_version}` : '—'}
                  </td>

                  {/* VF-DE Offer ID */}
                  <td style={{ padding: '10px 12px', color: C.muted, fontSize: '11px', fontFamily: 'monospace' }}>
                    {item.vf_de_offer_id || '—'}
                  </td>

                  {/* Exists in DNEXT */}
                  <td style={{ padding: '10px 12px' }}>
                    <ExistsBadge id={id} />
                  </td>

                  {/* Sync Status */}
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: sc.color, fontSize: '11px', fontWeight: 700 }}>
                      <span>{sc.icon}</span>
                      {sc.label}
                    </span>
                  </td>

                  {/* Updated at */}
                  <td style={{ padding: '10px 12px', color: C.muted, fontSize: '10px', whiteSpace: 'nowrap' }}>
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
                        {aState === 'syncing' ? '⟳ Syncing…' : aState === 'done' ? '✓ Synced' : '⚡ Sync'}
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
                        🔍 Debug
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(item)} disabled={isAct}
                        className="dep-btn"
                        title="Remove from registry"
                        style={btn({
                          background: 'rgba(239,68,68,0.1)',
                          borderColor: 'rgba(239,68,68,0.35)',
                          color: '#fca5a5',
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
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
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
            background: '#0f1117', borderLeft: `1px solid ${C.border}`,
            zIndex: 8001, display: 'flex', flexDirection: 'column',
            animation: 'slideIn 0.25s ease',
            boxShadow: '-12px 0 48px rgba(0,0,0,0.6)',
          }}>
            <style>{`
              @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
            `}</style>

            {/* Drawer header */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fcd34d', marginBottom: '3px' }}>🔍 Sync Debug</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#c4b5fd' }}>{debugItem.dnext_entity_id}</div>
                <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>{debugItem.dnext_entity_type} · {debugItem.vf_de_offer_type} · {debugItem.file_path}</div>
              </div>
              <button onClick={() => setDebugItem(null)} style={{ background: 'none', border: 'none', color: C.muted, fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
              {[['preview', '📋 Payload Preview'], ['response', '📡 DNEXT Response']].map(([tab, label]) => (
                <button key={tab} onClick={() => setDebugTab(tab)} style={{
                  padding: '10px 20px', background: 'none', border: 'none',
                  borderBottom: debugTab === tab ? `2px solid #fcd34d` : '2px solid transparent',
                  color: debugTab === tab ? '#fcd34d' : C.muted,
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
                  background: debugSending ? 'rgba(79,70,229,0.3)' : 'rgba(79,70,229,0.2)',
                  borderColor: C.indigo, color: '#a5b4fc',
                  opacity: (debugSending || debugLoading || !token) ? 0.5 : 1,
                  fontSize: '12px',
                })}
              >
                {debugSending
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', border: '2px solid rgba(99,102,241,0.3)', borderTopColor: C.indigo, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      Sending…
                    </span>
                  : '⚡ Send to DNEXT'}
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {debugLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '48px', color: C.muted }}>
                  <div style={{ width: '28px', height: '28px', border: `3px solid rgba(252,211,77,0.2)`, borderTopColor: '#fcd34d', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Loading source file…
                </div>
              )}

              {/* Preview tab */}
              {!debugLoading && debugTab === 'preview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Raw source file */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: C.muted, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>📄 Source File (raw)</div>
                    <pre style={{
                      background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
                      borderRadius: '8px', padding: '12px', fontSize: '11px',
                      fontFamily: "'JetBrains Mono', monospace", color: '#d1d5db',
                      overflowX: 'auto', maxHeight: '200px', overflowY: 'auto',
                      whiteSpace: 'pre',
                    }}>{debugPayload ? JSON.stringify(debugPayload, null, 2) : '—'}</pre>
                  </div>

                  {/* v0 payload */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: C.warning, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>⬆ POST #1 — version "0" · In study</div>
                    <pre style={{
                      background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)',
                      borderRadius: '8px', padding: '12px', fontSize: '11px',
                      fontFamily: "'JetBrains Mono', monospace", color: '#fde68a',
                      overflowX: 'auto', maxHeight: '260px', overflowY: 'auto',
                      whiteSpace: 'pre',
                    }}>{debugV0 ? JSON.stringify(debugV0, null, 2) : '—'}</pre>
                  </div>

                  {/* v1 payload */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: C.success, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>⬆ POST #2 — version "1" · Launched</div>
                    <pre style={{
                      background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)',
                      borderRadius: '8px', padding: '12px', fontSize: '11px',
                      fontFamily: "'JetBrains Mono', monospace", color: '#6ee7b7',
                      overflowX: 'auto', maxHeight: '260px', overflowY: 'auto',
                      whiteSpace: 'pre',
                    }}>{debugV1 ? JSON.stringify(debugV1, null, 2) : '—'}</pre>
                  </div>

                  <div style={{ padding: '10px 14px', background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: '8px', fontSize: '11px', color: '#a5b4fc' }}>
                    ℹ Click <strong>Send to DNEXT</strong> to execute both POSTs and see the response.
                  </div>
                </div>
              )}

              {/* Response tab */}
              {!debugLoading && debugTab === 'response' && (
                <div>
                  {debugSending && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '48px', color: C.muted }}>
                      <div style={{ width: '28px', height: '28px', border: `3px solid rgba(99,102,241,0.2)`, borderTopColor: C.indigo, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Sending to DNEXT…
                    </div>
                  )}

                  {!debugSending && !debugResponse && (
                    <div style={{ padding: '48px', textAlign: 'center', color: C.muted, fontSize: '12px' }}>
                      No response yet. Click <strong style={{ color: '#a5b4fc' }}>Send to DNEXT</strong> above.
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
                          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#c4b5fd' }}>id: {debugResponse.body.id}</span>
                        )}
                      </div>

                      {/* Full response body */}
                      <div style={{ fontSize: '11px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Response body</div>
                      <pre style={{
                        background: debugResponse.ok ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                        border: `1px solid ${debugResponse.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        borderRadius: '8px', padding: '14px', fontSize: '11px',
                        fontFamily: "'JetBrains Mono', monospace",
                        color: debugResponse.ok ? '#6ee7b7' : '#fca5a5',
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
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: '#13141f', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '540px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 700 }}>
                  ✏️ Edit Deployment Package: <span style={{ color: '#a5b4fc', fontFamily: "'JetBrains Mono', monospace" }}>{editingPkg.id}</span>
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
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.05)', color: C.text, fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: C.muted, marginBottom: '4px', textTransform: 'uppercase' }}>
                    Type
                  </label>
                  <select
                    value={editPkgType} onChange={e => setEditPkgType(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: '#181a27', color: C.text, fontSize: '13px' }}
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
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.05)', color: '#6ee7b7', fontSize: '13px', fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: C.muted, marginBottom: '4px', textTransform: 'uppercase' }}>
                  Description (Optional)
                </label>
                <textarea
                  value={editPkgDesc} onChange={e => setEditPkgDesc(e.target.value)} rows={2} placeholder="Package details or release notes…"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.05)', color: C.text, fontSize: '12px', resize: 'vertical' }}
                />
              </div>

              <div style={{ padding: '8px 12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', fontSize: '11px', color: '#6ee7b7' }}>
                💡 Saving will update the package's linked directory and automatically trigger a directory scan to register any new or modified TMF 620 items.
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
                  style={btn({ background: 'rgba(79,70,229,0.3)', borderColor: C.indigo, color: '#fff', padding: '8px 20px', fontSize: '12px' })}
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
