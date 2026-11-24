import React, { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '../ui/Icon';
import { useEnvironment } from '../../context/EnvironmentContext';
import MapperRulesListView from './MapperRulesListView';
import MapperRuleDetailDrawer from './MapperRuleDetailDrawer';

export default function DnextMapperRulesView() {
  const {
    selectedEnv,
    activeApiUrl,
    token,
    setToken,
    loginStatus,
    openLoginModal
  } = useEnvironment();

  const [rules, setRules] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [facets, setFacets] = useState({ byMapperType: [], byDirection: [], byStatus: [], totalCached: 0, dirtyCount: 0, lastUpdatedAt: null });
  const [mapperFacts, setMapperFacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [filters, setFilters] = useState({
    mapperType: 'all',
    direction: 'all',
    attributeAction: 'all',
    basketAction: 'all',
    processContext: '',
    sourceComponentId: '',
    attributeCode: '',
    attributeValue: '',
    attributeAdditionalValue: '',
    ruleId: '',
    status: 'all',
    syncState: 'all',
    q: '',
    sku: ''
  });
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [pageSize, setPageSize] = useState(50);
  const [pageIndex, setPageIndex] = useState(0);

  // Differentiated Big-Data Sync State
  const [syncStatus, setSyncStatus] = useState({
    inProgress: false,
    fetched: 0,
    total: 0,
    error: null,
    totalCached: 0,
    dirtyCount: 0,
    lastUpdatedAt: null
  });
  const [liveQuerying, setLiveQuerying] = useState(false);
  const [liveNotice, setLiveNotice] = useState(null);
  const pollRef = useRef(null);

  // Detail / Authoring Drawer State
  const [selectedRule, setSelectedRule] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  const getRequestHeaders = useCallback(() => {
    const isTest = (selectedEnv?.name && selectedEnv.name.toLowerCase().includes('test')) ||
      (activeApiUrl && activeApiUrl.toLowerCase().includes('test'));
    const envName = selectedEnv?.name || localStorage.getItem('dnext_env_name') || (isTest ? 'dpc_ui.test-g' : 'test');
    const apiUrl = activeApiUrl || localStorage.getItem('dnext_api_url') || 'https://dpc-api.test-gcu.com';
    const authUrl = selectedEnv?.authUrl || localStorage.getItem('dnext_auth_url') || 'https://diam.test-gcu.com/realms/orbitant-realm/protocol/openid-connect/token';
    const activeToken = token || localStorage.getItem('dnext_token') || '';

    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-dnext-api-url': apiUrl,
      'x-dnext-env-name': envName,
      'x-dnext-auth-url': authUrl,
      ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
    };
  }, [selectedEnv, activeApiUrl, token]);

  const fetchSyncStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/dnext/mapper-rules/sync/status', { headers: getRequestHeaders() });
      if (!res.ok) return null;
      const data = await res.json();
      setSyncStatus(data);
      return data;
    } catch {
      return null;
    }
  }, [getRequestHeaders]);

  const fetchFacts = useCallback(async () => {
    try {
      const res = await fetch('/api/dnext/mapper-rules/facts', { headers: getRequestHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMapperFacts(data.facts || []);
      }
    } catch {}
  }, [getRequestHeaders]);

  const fetchMapperRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(pageIndex * pageSize),
        sortBy,
        sortDir
      });
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== 'all') params.set(k, v);
      });

      const res = await fetch(`/api/dnext/mapper-rules?${params.toString()}`, {
        headers: getRequestHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load mapper rules`);
      const data = await res.json();
      setRules(data.items || []);
      setTotalCount(data.totalCount || 0);
      if (data.facets) setFacets(data.facets);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, pageSize, pageIndex, sortBy, sortDir, getRequestHeaders]);

  useEffect(() => {
    fetchMapperRules();
  }, [fetchMapperRules, selectedEnv]);

  useEffect(() => {
    fetchFacts();
    fetchSyncStatus();
  }, [fetchFacts, fetchSyncStatus, selectedEnv]);

  // Poll sync status while sync is active
  useEffect(() => {
    if (syncStatus.inProgress) {
      pollRef.current = setInterval(async () => {
        const st = await fetchSyncStatus();
        if (st && !st.inProgress) {
          clearInterval(pollRef.current);
          fetchMapperRules();
        }
      }, 1200);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [syncStatus.inProgress, fetchSyncStatus, fetchMapperRules]);

  const handleStartSync = async (scopedOnly = false) => {
    setLiveNotice(null);
    try {
      const body = scopedOnly ? {
        mapperType: filters.mapperType !== 'all' ? filters.mapperType : undefined,
        direction: filters.direction !== 'all' ? filters.direction : undefined
      } : {};
      const res = await fetch('/api/dnext/mapper-rules/sync', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 && openLoginModal) {
          openLoginModal(selectedEnv);
          return;
        }
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      if (data.status) setSyncStatus(prev => ({ ...prev, ...data.status }));
    } catch (err) {
      alert(`Mapper sync failed to start: ${err.message}`);
    }
  };

  // Live drule-api query by SKU / direction / mapper_type
  const handleLiveSkuQuery = async () => {
    if (!filters.sku.trim() && filters.mapperType === 'all') {
      alert('Enter a SKU (e.g. R70.1000000129-24 or 10041) or select a Functional Area to run a live DNEXT query.');
      return;
    }
    setLiveQuerying(true);
    setLiveNotice(null);
    try {
      const params = new URLSearchParams({ limit: '200', offset: '0', cacheResults: 'true' });
      if (filters.sku.trim()) params.set('sku', filters.sku.trim());
      if (filters.direction !== 'all') params.set('direction', filters.direction);
      if (filters.mapperType !== 'all') params.set('mapperType', filters.mapperType);

      const res = await fetch(`/api/dnext/mapper-rules/live-query?${params.toString()}`, {
        headers: getRequestHeaders()
      });
      const refreshedToken = res.headers.get('x-refreshed-token');
      if (refreshedToken && refreshedToken !== token) {
        setToken(refreshedToken);
        localStorage.setItem('dnext_token', refreshedToken);
      }
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 && openLoginModal) openLoginModal(selectedEnv);
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setLiveNotice(`Live query fetched ${(data.items || []).length} of ${data.totalCount} matching rule(s) and cached them locally.`);
      setPageIndex(0);
      await fetchMapperRules();
      await fetchSyncStatus();
    } catch (err) {
      alert(`Live query failed: ${err.message}`);
    } finally {
      setLiveQuerying(false);
    }
  };

  const handleCreateRule = () => {
    const defaultType = filters.mapperType !== 'all' ? filters.mapperType : 'sales_package';
    const defaultDir = filters.direction !== 'all' ? filters.direction : 'out';
    const template = {
      id: '',
      name: '',
      '@type': 'BasicRule',
      category: ['mapperRules'],
      ruleType: 'FORALL',
      conditionVariantType: 'expression',
      condition: ['true'],
      result: 'true',
      status: 'draft',
      stateCategory: 'Initial',
      ruleCharacteristic: [
        { name: 'source_component_id', value: '6' },
        { name: 'system_name', value: 'FN' },
        { name: 'mapper_type', value: defaultType },
        { name: 'direction', value: defaultDir },
        ...(defaultDir === 'out' ? [
          { name: 'basket_action', value: 'keep' },
          { name: 'attribute_action', value: 'add' }
        ] : []),
        { name: 'process_contexts', value: '*' },
        { name: 'attribute_code', value: '' },
        { name: 'attribute_value', value: '' },
        { name: 'attribute_additional_value', value: '' }
      ],
      managedAssetGroup: {
        entityType: 'SKU',
        entity: []
      },
      _isNew: true
    };
    setSelectedRule(template);
    setIsDrawerOpen(true);
  };

  const handleOpenRule = async (rule) => {
    setSelectedRule(rule);
    setIsDrawerOpen(true);
    try {
      const res = await fetch(`/api/dnext/mapper-rules/${encodeURIComponent(rule.id)}`, {
        headers: getRequestHeaders()
      });
      if (res.ok) {
        const full = await res.json();
        setSelectedRule(full);
      }
    } catch {}
  };

  const handleSaveRule = async (ruleData) => {
    setIsSaving(true);
    try {
      const isNew = Boolean(ruleData._isNew);
      const cleanPayload = { ...ruleData };
      delete cleanPayload._isNew;
      delete cleanPayload._meta;

      const url = isNew ? '/api/dnext/mapper-rules' : `/api/dnext/mapper-rules/${encodeURIComponent(cleanPayload.id)}`;
      const method = isNew ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: getRequestHeaders(),
        body: JSON.stringify(cleanPayload)
      });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error || `HTTP ${res.status}`);

      setSelectedRule(saved);
      await fetchMapperRules();
      await fetchSyncStatus();
      return saved;
    } catch (err) {
      alert(`Failed to save mapper rule: ${err.message}`);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handlePushRule = async (ruleData) => {
    setIsPushing(true);
    try {
      let targetRule = ruleData;
      if (ruleData._isNew || ruleData._dirty) {
        targetRule = await handleSaveRule(ruleData);
        if (!targetRule) return;
      }
      const cleanPayload = { ...targetRule };
      delete cleanPayload._isNew;
      delete cleanPayload._meta;
      delete cleanPayload._dirty;

      const res = await fetch(`/api/dnext/mapper-rules/${encodeURIComponent(cleanPayload.id)}/push`, {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify(cleanPayload)
      });
      const refreshedToken = res.headers.get('x-refreshed-token');
      if (refreshedToken && refreshedToken !== token) {
        setToken(refreshedToken);
        localStorage.setItem('dnext_token', refreshedToken);
      }
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 && openLoginModal) openLoginModal(selectedEnv);
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setSelectedRule(data.rule);
      await fetchMapperRules();
      await fetchSyncStatus();
      setLiveNotice(`Pushed ${cleanPayload.id} to DNEXT Rule Engine successfully.`);
    } catch (err) {
      alert(`Failed to push rule: ${err.message}`);
    } finally {
      setIsPushing(false);
    }
  };

  const handleDeleteRule = async (ruleId, remote = false) => {
    try {
      const res = await fetch(`/api/dnext/mapper-rules/${encodeURIComponent(ruleId)}?remote=${remote ? 'true' : 'false'}`, {
        method: 'DELETE',
        headers: getRequestHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      if (selectedRule?.id === ruleId) {
        setIsDrawerOpen(false);
        setSelectedRule(null);
      }
      await fetchMapperRules();
      await fetchSyncStatus();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleFilterChange = (patch) => {
    setFilters(prev => ({ ...prev, ...patch }));
    setPageIndex(0);
  };

  const syncPct = syncStatus.total > 0 ? Math.min(100, Math.round((syncStatus.fetched / syncStatus.total) * 100)) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff', overflowY: 'auto' }}>
      {/* Top Banner */}
      <div style={{
        padding: '16px 24px 12px 24px',
        borderBottom: '1px solid var(--ds-border)',
        background: 'var(--ds-surface-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--ds-text)', letterSpacing: '-0.02em' }}>
              Mapper Rules Explorer
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#0891b2',
              background: '#ecfeff',
              border: '1px solid #a5f3fc',
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              category: mapperRules
            </span>
            {selectedEnv && (
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--ds-text-2)',
                background: 'var(--ds-surface)',
                border: '1px solid var(--ds-border)',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                Env: {selectedEnv.name}
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ds-text-2)', marginTop: '2px' }}>
            Dedicated high-volume workspace (~30K rules) for Multimapper IN/OUT enrichment, SKU associations, and DNEXT Rule Engine push
          </div>
        </div>

        {/* Cache Stats & Auth Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--ds-text-2)', fontWeight: '600' }}>
            Cached: <strong style={{ color: 'var(--ds-text)' }}>{(facets.totalCached || 0).toLocaleString()}</strong>
          </span>

          {(facets.dirtyCount > 0) && (
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#b45309',
              background: '#fef3c7',
              border: '1px solid #fde68a',
              padding: '3px 8px',
              borderRadius: '12px'
            }}>
              {facets.dirtyCount} unpushed
            </span>
          )}

          {loginStatus !== 'connected' && (
            <button
              type="button"
              onClick={() => openLoginModal && openLoginModal(selectedEnv)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#ffffff',
                background: 'var(--ds-brand)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <Icon name="key" size={13} />
              Connect to DNEXT
            </button>
          )}
        </div>
      </div>

      {/* Sync Progress / Live Notice Banner */}
      {(syncStatus.inProgress || syncStatus.error || liveNotice) && (
        <div style={{
          padding: '8px 24px',
          background: syncStatus.error ? '#fef2f2' : '#f0f9ff',
          borderBottom: '1px solid var(--ds-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '12px'
        }}>
          {syncStatus.inProgress ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: '700', color: '#0369a1' }}>
                Background Mapper Sync ({syncStatus.mode}): {syncStatus.fetched.toLocaleString()} / {syncStatus.total ? syncStatus.total.toLocaleString() : 'discovering…'} ({syncPct}%)
              </span>
              <div style={{ flex: 1, maxWidth: '320px', height: '7px', background: '#bae6fd', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${syncPct}%`, height: '100%', background: '#0284c7', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          ) : syncStatus.error ? (
            <span style={{ color: '#b91c1c', fontWeight: '600' }}>Sync error: {syncStatus.error}</span>
          ) : (
            <span style={{ color: '#0369a1', fontWeight: '600' }}>{liveNotice}</span>
          )}
          {liveNotice && !syncStatus.inProgress && (
            <button type="button" onClick={() => setLiveNotice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>✕</button>
          )}
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, padding: '16px 24px' }}>
        {error ? (
          <div style={{ padding: '20px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b' }}>
            <strong>Failed to load mapper rules:</strong> {error}
          </div>
        ) : (
          <MapperRulesListView
            rules={rules}
            totalCount={totalCount}
            facets={facets}
            loading={loading}
            filters={filters}
            onFilterChange={handleFilterChange}
            sortBy={sortBy}
            sortDir={sortDir}
            onSortChange={(col) => {
              if (col === null) {
                setSortBy('id');
                setSortDir('asc');
                return;
              }
              if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
              else { setSortBy(col); setSortDir('asc'); }
            }}
            pageSize={pageSize}
            pageIndex={pageIndex}
            onPageSizeChange={(sz) => { setPageSize(sz); setPageIndex(0); }}
            onPageChange={setPageIndex}
            onOpenDetail={handleOpenRule}
            onCreateRule={handleCreateRule}
            onPushRule={handlePushRule}
            onLiveSkuQuery={handleLiveSkuQuery}
            liveQuerying={liveQuerying}
            syncStatus={syncStatus}
            onSyncAll={() => handleStartSync(false)}
            onSyncFiltered={() => handleStartSync(true)}
          />
        )}
      </div>

      {isDrawerOpen && selectedRule && (
        <MapperRuleDetailDrawer
          key={selectedRule.id || 'new-mapper-rule'}
          rule={selectedRule}
          isOpen={isDrawerOpen}
          mapperFacts={mapperFacts}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedRule(null);
          }}
          onSaveRule={handleSaveRule}
          onPushRule={handlePushRule}
          onDeleteRule={handleDeleteRule}
          isSaving={isSaving}
          isPushing={isPushing}
        />
      )}
    </div>
  );
}
