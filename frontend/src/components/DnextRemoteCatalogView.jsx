import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:          '#0b0c10',
  panel:       'rgba(22,24,30,0.85)',
  border:      'rgba(255,255,255,0.08)',
  text:        '#f3f4f6',
  muted:       '#9ca3af',
  accent:      '#a78bfa',
  indigo:      '#4f46e5',
  success:     '#10b981',
  warning:     '#f59e0b',
  danger:      '#ef4444',
};

const ENTITY_CONFIG = {
  Category: {
    label: 'Category',
    endpoint: '/api/dnext/categories',
    color: { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', text: '#fbbf24' },
    icon: '📂'
  },
  ProductOffering: {
    label: 'Product Offering',
    endpoint: '/api/dnext/product-offerings',
    color: { bg: 'rgba(79,70,229,0.18)', border: '#4f46e5', text: '#818cf8' },
    icon: '📦'
  },
  ProductOfferingPrice: {
    label: 'Product Offering Price',
    endpoint: '/api/dnext/product-offering-prices',
    color: { bg: 'rgba(16,185,129,0.15)', border: '#10b981', text: '#34d399' },
    icon: '🏷️'
  },
  ProductSpecification: {
    label: 'Product Specification',
    endpoint: '/api/dnext/product-specifications',
    color: { bg: 'rgba(168,85,247,0.18)', border: '#a855f7', text: '#c084fc' },
    icon: '📋'
  }
};

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
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  ...override,
});

export default function DnextRemoteCatalogView() {
  // Auth state
  const [token, setToken] = useState(() => localStorage.getItem('dnext_token') || '');
  const [authLoading, setAuthLoading] = useState(false);

  // Live remote entities
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fetchStats, setFetchStats] = useState({ categories: 0, offerings: 0, prices: 0, specs: 0 });

  // Filtering & Search
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Inspect Modal
  const [inspectItem, setInspectItem] = useState(null);

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

  // Quick Keycloak login helper
  const handleConnectKeycloak = async () => {
    setAuthLoading(true);
    try {
      const storedEnvName = localStorage.getItem('dnext_env_name') || 'Default (dev-gcu)';
      const envsRes = await fetch('/api/dnext/environments');
      const envs = await envsRes.json();
      const currentEnv = envs.find(e => e.name === storedEnvName) || envs[0] || {};

      const res = await fetch('/api/dnext/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          envName: currentEnv.name || storedEnvName,
          authUrl: currentEnv.authUrl || 'https://diam.pi.dev-gcu.com/realms/orbitant-realm/protocol/openid-connect/token',
          apiUrl: currentEnv.apiUrl || 'https://dpc-api.pi.dev-gcu.com',
          username: currentEnv.username || 'nora',
          password: currentEnv.password || '1234'
        })
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        localStorage.setItem('dnext_token', data.access_token);
        if (data.apiUrl) localStorage.setItem('dnext_api_url', data.apiUrl);
        if (data.authUrl) localStorage.setItem('dnext_auth_url', data.authUrl);
        if (data.envName) localStorage.setItem('dnext_env_name', data.envName);
        setToken(data.access_token);
        showToast('✓ Successfully authenticated with Keycloak', 'success');
        return data.access_token;
      } else {
        throw new Error(data.error_description || data.error || 'Authentication failed');
      }
    } catch (err) {
      showToast(`Auth Failed: ${err.message}`, 'error');
      return null;
    } finally {
      setAuthLoading(false);
    }
  };

  // Helper to construct dynamic environment headers
  const getTargetEnvHeaders = useCallback(async (authToken) => {
    const storedEnvName = localStorage.getItem('dnext_env_name') || 'Default (dev-gcu)';
    let apiUrl = localStorage.getItem('dnext_api_url');
    let authUrl = localStorage.getItem('dnext_auth_url');

    if (!apiUrl || !authUrl) {
      try {
        const envsRes = await fetch('/api/dnext/environments');
        const envs = await envsRes.json().catch(() => []);
        const currentEnv = Array.isArray(envs) ? (envs.find(e => e.name === storedEnvName) || envs[0] || {}) : {};
        if (currentEnv.apiUrl) apiUrl = currentEnv.apiUrl;
        if (currentEnv.authUrl) authUrl = currentEnv.authUrl;
      } catch (e) {}
    }

    return {
      'Authorization': authToken ? `Bearer ${authToken}` : '',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(apiUrl ? { 'x-dnext-api-url': apiUrl } : {}),
      ...(authUrl ? { 'x-dnext-auth-url': authUrl } : {}),
      'x-dnext-env-name': storedEnvName
    };
  }, []);

  // Fetch all remote entities across the 4 TMF endpoints
  const fetchRemoteEntities = useCallback(async (tokenOverride = null) => {
    const activeToken = tokenOverride || token;
    if (!activeToken) {
      const newToken = await handleConnectKeycloak();
      if (!newToken) {
        setErrorMsg('Please connect to Keycloak to query remote catalog entities.');
        return;
      }
      return fetchRemoteEntities(newToken);
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const headers = await getTargetEnvHeaders(activeToken);

      const [catRes, offRes, popRes, specRes] = await Promise.allSettled([
        fetch('/api/dnext/categories?limit=500', { headers }),
        fetch('/api/dnext/product-offerings?limit=500', { headers }),
        fetch('/api/dnext/product-offering-prices?limit=500', { headers }),
        fetch('/api/dnext/product-specifications?limit=500', { headers })
      ]);

      // Check for 401 across responses
      const any401 = [catRes, offRes, popRes, specRes].some(
        r => r.status === 'fulfilled' && r.value.status === 401
      );
      if (any401 && !tokenOverride) {
        const refreshedToken = await handleConnectKeycloak();
        if (refreshedToken) {
          return fetchRemoteEntities(refreshedToken);
        }
      }

      let allItems = [];
      let stats = { categories: 0, offerings: 0, prices: 0, specs: 0 };

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

      if (offRes.status === 'fulfilled' && offRes.value.ok) {
        const data = await offRes.value.json();
        if (Array.isArray(data)) {
          stats.offerings = data.length;
          data.forEach(item => {
            allItems.push({
              id: item.id || item.name,
              name: item.name || item.id,
              entityType: 'ProductOffering',
              version: item.version !== undefined ? String(item.version) : '0',
              lifecycleStatus: item.lifecycleStatus || 'In study',
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

      setEntities(allItems);
      setFetchStats(stats);
      setSelectedIds(new Set());
      showToast(`✓ Loaded ${allItems.length} live entities from DNEXT Catalog`, 'success');
    } catch (err) {
      console.error('Failed to fetch remote entities:', err);
      setErrorMsg(err.message);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [token, showToast]);

  useEffect(() => {
    if (token) {
      fetchRemoteEntities();
    } else {
      handleConnectKeycloak();
    }
  }, [token, fetchRemoteEntities]);

  // Purge a single entity
  const handlePurgeSingle = async (item) => {
    if (!token) return;
    if (!window.confirm(`Are you sure you want to permanently purge ${item.entityType} "${item.id}" across all versions from remote DNEXT?`)) {
      return;
    }

    setIsPurging(true);
    setPurgeProgress({ current: 1, total: 1, currentId: item.id });
    try {
      const headers = await getTargetEnvHeaders(token);
      const res = await fetch('/api/dnext/purge-entity', {
        method: 'POST',
        headers,
        body: JSON.stringify({ objectType: item.entityType, id: item.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Purge failed');

      setPurgeAudit(data.auditTrail || []);
      showToast(`✓ Purged ${item.entityType} "${item.id}"`, 'success');
      await fetchRemoteEntities();
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

    const headers = await getTargetEnvHeaders(token);

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

  // Filtered & Searched entities
  const filteredEntities = useMemo(() => {
    return entities.filter(item => {
      if (typeFilter !== 'all' && item.entityType !== typeFilter) return false;
      if (statusFilter !== 'all') {
        const s = (item.lifecycleStatus || '').toLowerCase();
        if (statusFilter.toLowerCase() !== s) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = (item.id || '').toLowerCase().includes(q);
        const matchName = (item.name || '').toLowerCase().includes(q);
        const matchType = (item.entityType || '').toLowerCase().includes(q);
        const matchStatus = (item.lifecycleStatus || '').toLowerCase().includes(q);
        if (!matchId && !matchName && !matchType && !matchStatus) return false;
      }
      return true;
    });
  }, [entities, typeFilter, statusFilter, searchQuery]);

  // Toggle selection
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredEntities.length && filteredEntities.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEntities.map(e => e.id)));
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden', background: C.bg, color: C.text }}>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 99999,
          padding: '10px 18px',
          borderRadius: '8px',
          background: toast.type === 'success' ? '#064e3b' : toast.type === 'error' ? '#7f1d1d' : '#1e1b4b',
          border: `1px solid ${toast.type === 'success' ? C.success : toast.type === 'error' ? C.danger : C.accent}`,
          color: '#fff',
          fontSize: '13px',
          fontWeight: '600',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header / Stats Bar */}
      <div style={{ padding: '16px 28px', borderBottom: `1px solid ${C.border}`, background: 'rgba(17,19,26,0.85)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>
              🌐 Live DNEXT Catalog Explorer
            </h2>
            <span style={{ fontSize: '11px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', padding: '2px 8px', borderRadius: '4px', color: '#a5b4fc', fontWeight: '600' }}>
              Direct Cloud Gateway
            </span>
          </div>
          <p style={{ fontSize: '12px', color: C.muted, margin: '4px 0 0 0' }}>
            Query, inspect, and purge live catalog entities directly from the active DNEXT environment.
          </p>
        </div>

        {/* Live Counters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '12px' }}>
            <span style={{ color: C.muted }}>Total:</span>
            <span style={{ fontWeight: '700', color: '#fff' }}>{entities.length}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: ENTITY_CONFIG.Category.color.bg, padding: '6px 12px', borderRadius: '8px', border: `1px solid ${ENTITY_CONFIG.Category.color.border}`, fontSize: '12px', color: ENTITY_CONFIG.Category.color.text }}>
            <span>📂 Categories:</span>
            <span style={{ fontWeight: '700' }}>{fetchStats.categories}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: ENTITY_CONFIG.ProductOffering.color.bg, padding: '6px 12px', borderRadius: '8px', border: `1px solid ${ENTITY_CONFIG.ProductOffering.color.border}`, fontSize: '12px', color: ENTITY_CONFIG.ProductOffering.color.text }}>
            <span>📦 Offerings:</span>
            <span style={{ fontWeight: '700' }}>{fetchStats.offerings}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: ENTITY_CONFIG.ProductOfferingPrice.color.bg, padding: '6px 12px', borderRadius: '8px', border: `1px solid ${ENTITY_CONFIG.ProductOfferingPrice.color.border}`, fontSize: '12px', color: ENTITY_CONFIG.ProductOfferingPrice.color.text }}>
            <span>🏷️ Prices:</span>
            <span style={{ fontWeight: '700' }}>{fetchStats.prices}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: ENTITY_CONFIG.ProductSpecification.color.bg, padding: '6px 12px', borderRadius: '8px', border: `1px solid ${ENTITY_CONFIG.ProductSpecification.color.border}`, fontSize: '12px', color: ENTITY_CONFIG.ProductSpecification.color.text }}>
            <span>📋 Specs:</span>
            <span style={{ fontWeight: '700' }}>{fetchStats.specs}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchRemoteEntities}
            disabled={loading || !token}
            style={btn({ background: 'rgba(99,102,241,0.2)', borderColor: C.indigo, color: '#a5b4fc', padding: '6px 14px' })}
            title="Fetch latest remote entities"
          >
            {loading ? '⏳ Loading…' : '⟳ Refresh Catalog'}
          </button>
        </div>
      </div>

      {/* Auth Banner if not authenticated */}
      {!token && (
        <div style={{ padding: '12px 28px', background: 'rgba(239,68,68,0.12)', borderBottom: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#fca5a5' }}>
            <span>⚠️</span>
            <span>Keycloak token is missing or expired. Connect to query and manage remote DNEXT entities.</span>
          </div>
          <button
            onClick={handleConnectKeycloak}
            disabled={authLoading}
            style={btn({ background: '#ef4444', borderColor: '#ef4444', color: '#fff' })}
          >
            {authLoading ? 'Connecting…' : '🔐 Connect Keycloak'}
          </button>
        </div>
      )}

      {/* Purge Progress Bar Banner */}
      {isPurging && purgeProgress && (
        <div style={{ padding: '10px 28px', background: 'rgba(245,158,11,0.15)', borderBottom: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#fde68a' }}>
            <span style={{ animation: 'spin 1s infinite linear' }}>⏳</span>
            <span>Purging entity <strong>{purgeProgress.currentId}</strong> ({purgeProgress.current} of {purgeProgress.total})…</span>
          </div>
          <div style={{ width: '200px', height: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${(purgeProgress.current / purgeProgress.total) * 100}%`, height: '100%', background: C.warning, transition: 'width 0.2s' }}></div>
          </div>
        </div>
      )}

      {/* ── Control Bar: Search & Filters ── */}
      <div style={{ padding: '12px 28px', borderBottom: `1px solid ${C.border}`, background: 'rgba(10,12,18,0.6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', flexShrink: 0 }}>
        
        {/* Left Filter Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Search */}
          <input
            type="text"
            placeholder="🔍 Search ID, name, status…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              border: `1px solid ${C.border}`,
              background: 'rgba(255,255,255,0.05)',
              color: C.text,
              fontSize: '12px',
              width: '240px',
              outline: 'none'
            }}
          />

          {/* Type Filter Pulldown */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              border: `1px solid ${C.border}`,
              background: '#161822',
              color: C.text,
              fontSize: '12px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="all">🌐 All Entity Types ({entities.length})</option>
            <option value="Category">📂 Categories ({fetchStats.categories})</option>
            <option value="ProductOffering">📦 Product Offerings ({fetchStats.offerings})</option>
            <option value="ProductOfferingPrice">🏷️ Product Offering Prices ({fetchStats.prices})</option>
            <option value="ProductSpecification">📋 Product Specifications ({fetchStats.specs})</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              border: `1px solid ${C.border}`,
              background: '#161822',
              color: C.text,
              fontSize: '12px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="all">⚡ All Statuses</option>
            <option value="In study">⏳ In study</option>
            <option value="Launched">🚀 Launched</option>
            <option value="Active">✓ Active</option>
            <option value="Obsolete">✕ Obsolete</option>
          </select>
        </div>

        {/* Right Bulk Actions Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {selectedIds.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 12px', borderRadius: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#fca5a5' }}>
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => setShowConfirmBulkModal(true)}
                disabled={isPurging}
                style={btn({ background: '#ef4444', borderColor: '#ef4444', color: '#fff', padding: '4px 10px', fontSize: '11px' })}
                title="Purge selected entities from DNEXT"
              >
                🗑️ Bulk Purge ({selectedIds.size})
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                style={btn({ background: 'transparent', borderColor: 'transparent', color: C.muted, padding: '4px 6px', fontSize: '11px' })}
              >
                ✕ Clear
              </button>
            </div>
          )}

          <span style={{ fontSize: '12px', color: C.muted }}>
            Showing <strong>{filteredEntities.length}</strong> of {entities.length}
          </span>
        </div>
      </div>

      {/* ── Table Container ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: '0 28px 24px 28px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px', color: C.muted }}>
            <div style={{ fontSize: '24px' }}>⏳</div>
            <div>Querying remote DNEXT endpoints…</div>
          </div>
        ) : filteredEntities.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '8px', color: C.muted }}>
            <div style={{ fontSize: '28px' }}>📭</div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>No live entities found matching the current filters.</div>
            <div style={{ fontSize: '12px' }}>Try adjusting your search terms or click "Refresh Catalog".</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginTop: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <th style={{ padding: '10px 8px', width: '38px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={filteredEntities.length > 0 && selectedIds.size === filteredEntities.length}
                    onChange={handleToggleSelectAll}
                    style={{ cursor: 'pointer', accentColor: C.indigo }}
                  />
                </th>
                <th style={{ padding: '10px 12px', width: '160px' }}>Type</th>
                <th style={{ padding: '10px 12px' }}>ID / Identifier</th>
                <th style={{ padding: '10px 12px' }}>Name / Title</th>
                <th style={{ padding: '10px 12px', width: '90px' }}>Version</th>
                <th style={{ padding: '10px 12px', width: '120px' }}>Lifecycle</th>
                <th style={{ padding: '10px 12px', width: '140px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntities.map((item) => {
                const isSelected = selectedIds.has(item.id);
                const typeCfg = ENTITY_CONFIG[item.entityType] || { label: item.entityType, color: { bg: 'rgba(255,255,255,0.1)', border: 'transparent', text: '#fff' }, icon: '📄' };
                const isLaunched = (item.lifecycleStatus || '').toLowerCase() === 'launched';
                const isInStudy = (item.lifecycleStatus || '').toLowerCase() === 'in study';

                return (
                  <tr
                    key={`${item.entityType}-${item.id}`}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: isSelected ? 'rgba(99,102,241,0.08)' : 'transparent',
                      transition: 'background 0.15s'
                    }}
                  >
                    {/* Checkbox */}
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectItem(item.id)}
                        style={{ cursor: 'pointer', accentColor: C.indigo }}
                      />
                    </td>

                    {/* Type Badge */}
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: typeCfg.color.bg,
                        border: `1px solid ${typeCfg.color.border}`,
                        color: typeCfg.color.text,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        <span>{typeCfg.icon}</span>
                        <span>{typeCfg.label}</span>
                      </span>
                    </td>

                    {/* ID */}
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#e5e7eb', fontWeight: '600' }}>
                        {item.id}
                      </div>
                    </td>

                    {/* Name */}
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ color: '#d1d5db', fontSize: '13px' }}>
                        {item.name || '-'}
                      </div>
                    </td>

                    {/* Version */}
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: '11px', color: C.muted, background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
                        v{item.version}
                      </span>
                    </td>

                    {/* Lifecycle Status */}
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: isLaunched ? C.success : isInStudy ? C.warning : '#9ca3af',
                        background: isLaunched ? 'rgba(16,185,129,0.12)' : isInStudy ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isLaunched ? 'rgba(16,185,129,0.3)' : isInStudy ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isLaunched ? C.success : isInStudy ? C.warning : '#9ca3af' }}></span>
                        <span>{item.lifecycleStatus}</span>
                      </span>
                    </td>

                    {/* Row Actions */}
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {/* Inspect JSON */}
                        <button
                          onClick={() => setInspectItem(item)}
                          style={btn({ padding: '4px 8px', fontSize: '11px', background: 'rgba(255,255,255,0.05)', color: '#d1d5db' })}
                          title="Inspect raw JSON entity"
                        >
                          👁️ JSON
                        </button>

                        {/* Purge / Delete */}
                        <button
                          onClick={() => handlePurgeSingle(item)}
                          disabled={isPurging}
                          style={btn({ padding: '4px 8px', fontSize: '11px', background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' })}
                          title="Purge entity across all versions"
                        >
                          🗑️ Purge
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
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
                <span style={{ fontSize: '16px' }}>👁️</span>
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
                  📋 Copy JSON
                </button>
                <button
                  onClick={() => setInspectItem(null)}
                  style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '18px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', background: 'rgba(0,0,0,0.3)' }}>
              <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '12px', color: '#a5b4fc', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(inspectItem.raw, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

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
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#ef4444' }}>
                ⚠️
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>Confirm Bulk Entity Purge</h3>
                <span style={{ fontSize: '12px', color: C.muted }}>This action will permanently delete items from remote DNEXT</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#d1d5db', lineHeight: '1.5', marginBottom: '20px' }}>
              You have selected <strong style={{ color: '#ef4444' }}>{selectedIds.size} entities</strong> for deletion.
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
                style={btn({ background: '#ef4444', borderColor: '#ef4444', color: '#fff', padding: '8px 18px', fontSize: '12px' })}
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
