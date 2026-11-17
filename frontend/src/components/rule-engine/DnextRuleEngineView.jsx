import React, { useState, useEffect, useCallback } from 'react';
import RulesListView from './RulesListView';
import RuleDetailDrawer from './RuleDetailDrawer';
import Icon from '../ui/Icon';
import { useEnvironment } from '../../context/EnvironmentContext';

export default function DnextRuleEngineView() {
  const {
    selectedEnv,
    activeApiUrl,
    token,
    setToken,
    loginStatus,
    openLoginModal
  } = useEnvironment();

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cacheInfo, setCacheInfo] = useState({ isCached: false, cachedAt: null, total: 0 });

  // Drawer State
  const [selectedRule, setSelectedRule] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Helper to build dynamic environment headers
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

  // Fetch Rules from Backend API
  const fetchRules = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const headers = getRequestHeaders();
      const refreshQuery = forceRefresh ? '&refresh=true' : '';
      const res = await fetch(`/api/dnext/rules?limit=1000${refreshQuery}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load rules`);

      // Update token if backend auto-refreshed it
      const refreshedToken = res.headers.get('x-refreshed-token');
      if (refreshedToken && refreshedToken !== token) {
        setToken(refreshedToken);
        localStorage.setItem('dnext_token', refreshedToken);
      }

      const fromCache = res.headers.get('x-from-cache') === 'true';
      const cachedAt = res.headers.get('x-cache-updated-at');
      const totalCount = res.headers.get('x-total-count');

      const data = await res.json();
      const items = Array.isArray(data) ? data : [];
      setRules(items);
      setCacheInfo({
        isCached: fromCache,
        cachedAt: cachedAt,
        total: totalCount ? parseInt(totalCount, 10) : items.length
      });
    } catch (err) {
      console.error('[DnextRuleEngineView] fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [getRequestHeaders, token, setToken]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules, selectedEnv]);

  // Handle Create New Rule
  const handleCreateRule = () => {
    const template = {
      id: '',
      name: 'New Compatibility Rule',
      branchName: 'MATCH',
      ruleType: 'FORALL',
      conditionVariantType: 'expression',
      condition: [],
      result: {
        "@type": "Result",
        variantType: "attributeValueList",
        attribute: {
          name: "Target Selection",
          attribute: [
            { name: "TargetAggregator", value: "having" },
            { name: "ConditionValue", value: "" },
            {
              name: "TargetCondition",
              attribute: [
                { name: "Type", value: "catalog.getProductsInCategory" },
                { name: "Operator", value: "" },
                { name: "ConditionValue", value: "" },
                {
                  name: "Params",
                  attribute: [
                    { name: "name", value: "categoryID" },
                    { name: "value", value: "FN0548" }
                  ]
                }
              ]
            }
          ]
        }
      },
      category: ['implicitCompatibility'],
      status: 'draft',
      stateCategory: 'Initial',
      ruleCharacteristic: [
        { name: 'package_type', value: 'DSL' },
        { name: 'description', value: '' },
        { name: 'source_type', value: 'Service' },
        { name: 'priority', value: '5' },
        { name: 'operation_type', value: 'Service-Service' },
        { name: 'effective_date', value: new Date().toISOString().split('T')[0] },
        { name: 'operation.value', value: 'Allowed' },
        { name: 'operation.askconfirmationfirst', value: 'false' },
        { name: 'operation.overrideinitialselectable', value: 'false' },
        { name: 'channels', value: '*' },
        { name: 'process_contexts', value: 'ILSBLU,MOVBLU' }
      ]
    };
    setSelectedRule(template);
    setIsDrawerOpen(true);
  };

  // Handle Save / Update Rule
  const handleSaveRule = async (ruleData) => {
    setIsSaving(true);
    try {
      const isNew = !ruleData.id;
      const url = isNew ? '/api/dnext/rules' : `/api/dnext/rules/${ruleData.id}`;
      const method = isNew ? 'POST' : 'PATCH';
      const headers = getRequestHeaders();

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(ruleData)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const saved = await res.json();
      await fetchRules();
      setSelectedRule(saved);
      setIsDrawerOpen(false);
    } catch (err) {
      alert(`Failed to save rule: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Rule
  const handleDeleteRule = async (ruleId) => {
    try {
      const headers = getRequestHeaders();
      const res = await fetch(`/api/dnext/rules/${ruleId}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchRules();
      if (selectedRule?.id === ruleId) {
        setIsDrawerOpen(false);
        setSelectedRule(null);
      }
    } catch (err) {
      alert(`Failed to delete rule: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff', overflowY: 'auto' }}>
      {/* Top Banner / Area Subtitle */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--ds-text)', letterSpacing: '-0.02em' }}>
              Compatibility & Eligibility Rule Engine
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              color: 'var(--ds-brand)',
              background: 'rgba(230,0,0,0.08)',
              border: '1px solid rgba(230,0,0,0.25)',
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              v1.4.2 TMF620
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
            Author, inspect and validate commercial product compatibility, defaulting and downgrade guarantee rules
          </div>
        </div>

        {/* Stats Pill & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Cache / Live State Badge */}
          {cacheInfo.isCached ? (
            <span style={{
              fontSize: '11px',
              color: '#0891b2',
              background: '#ecfeff',
              border: '1px solid #a5f3fc',
              padding: '3px 8px',
              borderRadius: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0891b2' }} />
              Cached {cacheInfo.cachedAt ? new Date(cacheInfo.cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          ) : rules.length > 0 ? (
            <span style={{
              fontSize: '11px',
              color: '#16a34a',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '3px 8px',
              borderRadius: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
              Live Gateway
            </span>
          ) : null}

          {/* Total Rules Count */}
          <span style={{ fontSize: '12px', color: 'var(--ds-text-2)', fontWeight: '600' }}>
            Total Rules: <strong style={{ color: 'var(--ds-text)' }}>{rules.length}</strong>
          </span>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={() => fetchRules(true)}
            disabled={loading || isRefreshing}
            title="Refresh rules from DNEXT gateway"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--ds-text)',
              background: '#ffffff',
              border: '1px solid var(--ds-border)',
              borderRadius: '6px',
              cursor: (loading || isRefreshing) ? 'not-allowed' : 'pointer',
              opacity: (loading || isRefreshing) ? 0.6 : 1
            }}
          >
            <Icon
              name="refresh"
              size={13}
              style={{
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
              }}
            />
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>

          {/* Connect Keycloak button if disconnected */}
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

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '16px 24px' }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--ds-text-2)' }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid var(--ds-border)',
              borderTopColor: 'var(--ds-brand)',
              borderRadius: '50%',
              margin: '0 auto 12px auto',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--ds-text)' }}>
              Loading rules from DNEXT Rule Engine…
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--ds-text-2)' }}>
              Fetching commercial compatibility, defaulting and guarantee rules
            </div>
          </div>
        ) : error ? (
          <div style={{ padding: '24px', background: 'var(--ds-danger-soft)', border: '1px solid var(--ds-danger-border)', borderRadius: '8px', color: 'var(--ds-brand-text)' }}>
            <div style={{ fontWeight: '700', fontSize: '14px' }}>Failed to load rules</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>{error}</div>
            <button
              type="button"
              onClick={() => fetchRules(true)}
              style={{ marginTop: '12px', background: 'var(--ds-brand)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
            >
              Retry
            </button>
          </div>
        ) : (
          <RulesListView
            rules={rules}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onOpenDetail={rule => {
              setSelectedRule(rule);
              setIsDrawerOpen(true);
            }}
            onCreateRule={handleCreateRule}
            onDeleteRule={handleDeleteRule}
            onRefresh={() => fetchRules(true)}
            isRefreshing={isRefreshing}
          />
        )}
      </div>

      {/* Rule Detail & Authoring Drawer */}
      {isDrawerOpen && selectedRule && (
        <RuleDetailDrawer
          key={selectedRule.id || 'new-rule'}
          rule={selectedRule}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedRule(null);
          }}
          onSaveRule={handleSaveRule}
          onDeleteRule={handleDeleteRule}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
