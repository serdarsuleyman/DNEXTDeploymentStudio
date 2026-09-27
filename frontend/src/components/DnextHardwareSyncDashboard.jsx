import React, { useState, useEffect } from 'react';

export default function DnextHardwareSyncDashboard() {
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'diff' | 'push'
  
  // Connection states
  const [username, setUsername] = useState('nora');
  const [password, setPassword] = useState('1234');
  const [token, setToken] = useState(() => localStorage.getItem('dnext_token') || '');
  const [loginStatus, setLoginStatus] = useState(token ? 'connected' : 'disconnected');
  const [errorMsg, setErrorMsg] = useState('');

  // Remote data browsing states
  const [remoteOfferings, setRemoteOfferings] = useState([]);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFetchingRemote, setIsFetchingRemote] = useState(false);

  // Template Offering States
  const [templateOfferingId, setTemplateOfferingId] = useState('');
  const [templateOffering, setTemplateOffering] = useState(null);
  const [isFetchingTemplate, setIsFetchingTemplate] = useState(false);

  // Diff states
  const [localHardware, setLocalHardware] = useState([]);
  const [diffResults, setDiffResults] = useState([]);
  const [isDiffing, setIsDiffing] = useState(false);
  const [selectedHardwareModal, setSelectedHardwareModal] = useState(null);

  // Push / Export states
  const [pushSelectedHardware, setPushSelectedHardware] = useState(null);
  const [pushStatus, setPushStatus] = useState('idle'); // 'idle' | 'pushing' | 'success' | 'error'
  const [pushError, setPushError] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customVersion, setCustomVersion] = useState('1');

  // Logs
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${message}`, ...prev]);
  };

  // Login action to Keycloak
  const handleConnect = async (e) => {
    e.preventDefault();
    setLoginStatus('connecting');
    setErrorMsg('');
    addLog('Initiating Keycloak authentication for DNEXT API...');

    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('client_id', 'orbitant-ui-client');
      params.append('username', username);
      params.append('password', password);
      params.append('scope', 'openid');

      const response = await fetch('/api/dnext/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error_description || data.error || 'Authentication failed');
      }

      setToken(data.access_token);
      localStorage.setItem('dnext_token', data.access_token);
      setLoginStatus('connected');
      addLog('Keycloak authentication successful! Token cached.');
    } catch (err) {
      console.error(err);
      setLoginStatus('disconnected');
      setErrorMsg(err.message);
      addLog(`Authentication error: ${err.message}`);
    }
  };

  const handleDisconnect = () => {
    setToken('');
    localStorage.removeItem('dnext_token');
    setLoginStatus('disconnected');
    setRemoteOfferings([]);
    setDiffResults([]);
    setTemplateOffering(null);
    addLog('Disconnected from DNEXT Product Catalog.');
  };

  // Fetch Remote Offerings
  const fetchRemoteOfferings = async () => {
    if (!token) return;
    setIsFetchingRemote(true);
    addLog(`Fetching remote product offerings (offset=${offset}, limit=${limit})...`);

    try {
      let url = `/api/dnext/product-offerings?limit=${limit}&offset=${offset}`;
      if (searchQuery) {
        url += `&name=${encodeURIComponent(searchQuery)}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch remote product offerings');
      }

      const offerings = Array.isArray(data) ? data : [];
      setRemoteOfferings(offerings);
      addLog(`Fetched ${offerings.length} product offerings from DNEXT.`);
    } catch (err) {
      console.error(err);
      addLog(`Remote fetch error: ${err.message}`);
    } finally {
      setIsFetchingRemote(false);
    }
  };

  // Load Template Offering details by ID
  const loadTemplateOffering = async (id) => {
    if (!token || !id) return;
    setIsFetchingTemplate(true);
    addLog(`Loading template product offering details for ID: ${id}...`);

    try {
      const response = await fetch(`/api/dnext/product-offerings/${encodeURIComponent(id)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to fetch template offering ${id}`);
      }

      setTemplateOffering(data);
      setTemplateOfferingId(id);
      addLog(`✓ Template Offering loaded: '${data.name}' (${data.id}). Specification reference attached.`);
    } catch (err) {
      console.error(err);
      addLog(`Failed to load template offering '${id}': ${err.message}`);
    } finally {
      setIsFetchingTemplate(false);
    }
  };

  useEffect(() => {
    if (token && activeTab === 'browse') {
      fetchRemoteOfferings();
    }
  }, [token, limit, offset, activeTab]);

  useEffect(() => {
    if (token) {
      fetch('/api/dnext/local-fiber-hardware')
        .then(res => res.json())
        .then(data => setLocalHardware(data))
        .catch(err => console.error('Error fetching local fiber hardware:', err));
    }
  }, [token]);

  // Handle 1-Way In-Memory Diff with VF_DE_ Prefix Matching
  const handleRunDiff = async () => {
    if (!token) return;
    setIsDiffing(true);
    addLog('Starting 1-Way Fiber Hardware alignment comparison using prefix VF_DE_...');

    try {
      addLog('Fetching local active Fiber Hardware & Accessories from SQLite...');
      const localRes = await fetch('/api/dnext/local-fiber-hardware');
      const localData = await localRes.json();
      setLocalHardware(localData);

      addLog('Fetching all remote product offerings from DNEXT...');
      let remoteList = [];
      let pageOffset = 0;
      const pageLimit = 100;
      let hasMore = true;

      while (hasMore) {
        const remoteRes = await fetch(`/api/dnext/product-offerings?offset=${pageOffset}&limit=${pageLimit}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const pageData = await remoteRes.json();
        if (!Array.isArray(pageData) || pageData.length === 0) {
          hasMore = false;
        } else {
          remoteList = remoteList.concat(pageData);
          if (pageData.length < pageLimit) {
            hasMore = false;
          } else {
            pageOffset += pageLimit;
          }
        }
      }

      addLog(`Fetched ${remoteList.length} remote product offerings from DNEXT across all pages.`);

      const results = [];

      localData.forEach(localItem => {
        const expectedVfName = `VF_DE_${localItem.name}`;
        const expectedVfId = `VF_DE_${localItem.id}`;

        // Find remote item matching VF_DE_ prefixed name or ID, or exact name
        const remoteItem = remoteList.find(r => 
          r.name === expectedVfName || 
          r.id === expectedVfId || 
          r.name === localItem.name || 
          r.id === localItem.id
        );

        if (remoteItem) {
          const isExactVfNameMatch = remoteItem.name === expectedVfName || remoteItem.name === localItem.name;
          if (isExactVfNameMatch) {
            results.push({
              id: localItem.id,
              name: localItem.name,
              prefixedName: expectedVfName,
              prefixedId: expectedVfId,
              type: localItem.type,
              productType: localItem.product_type,
              price: localItem.price,
              maf: localItem.maf,
              status: 'Synced',
              localData: localItem,
              remoteData: remoteItem
            });
          } else {
            results.push({
              id: localItem.id,
              name: localItem.name,
              prefixedName: expectedVfName,
              prefixedId: expectedVfId,
              type: localItem.type,
              productType: localItem.product_type,
              price: localItem.price,
              maf: localItem.maf,
              status: 'Mismatched',
              localData: localItem,
              remoteData: remoteItem
            });
          }
        } else {
          results.push({
            id: localItem.id,
            name: localItem.name,
            prefixedName: expectedVfName,
            prefixedId: expectedVfId,
            type: localItem.type,
            productType: localItem.product_type,
            price: localItem.price,
            maf: localItem.maf,
            status: 'Local Only',
            localData: localItem,
            remoteData: null
          });
        }
      });

      setDiffResults(results);
      addLog(`1-Way comparison completed: ${results.length} Fiber hardware items evaluated using prefix VF_DE_.`);
    } catch (err) {
      console.error(err);
      addLog(`Hardware comparison failed: ${err.message}`);
    } finally {
      setIsDiffing(false);
    }
  };

  // Build Payload using Template Offering & VF_DE_ Prefix
  const generatePayload = () => {
    if (!pushSelectedHardware) return null;

    const prefixedId = pushSelectedHardware.id.startsWith('VF_DE_') ? pushSelectedHardware.id : `VF_DE_${pushSelectedHardware.id}`;
    const prefixedName = pushSelectedHardware.name.startsWith('VF_DE_') ? pushSelectedHardware.name : `VF_DE_${pushSelectedHardware.name}`;

    if (templateOffering) {
      // Clone Template Offering structure
      const clonedPayload = JSON.parse(JSON.stringify(templateOffering));

      clonedPayload.id = prefixedId;
      clonedPayload.name = prefixedName;
      clonedPayload.description = customDescription || pushSelectedHardware.name;
      clonedPayload.version = customVersion || '1';
      clonedPayload.lifecycleStatus = 'Launched';
      clonedPayload.validFor = {
        startDateTime: new Date(Date.now() + 2 * 60 * 1000).toISOString()
      };

      // Remove server metadata fields if any
      delete clonedPayload.href;
      delete clonedPayload.lastUpdate;

      // Update productOfferingPrice array
      clonedPayload.productOfferingPrice = [];
      if (pushSelectedHardware.maf > 0) {
        clonedPayload.productOfferingPrice.push({
          name: 'Monthly Rental Fee',
          priceType: 'recurring',
          recurringChargePeriod: 'month',
          price: { value: pushSelectedHardware.maf, unit: 'EUR' }
        });
      }
      if (pushSelectedHardware.price > 0) {
        clonedPayload.productOfferingPrice.push({
          name: 'One-off Purchase Price',
          priceType: 'oneTime',
          price: { value: pushSelectedHardware.price, unit: 'EUR' }
        });
      }

      return clonedPayload;
    }

    // Default template with mandatory productSpecification reference
    return {
      id: prefixedId,
      name: prefixedName,
      version: customVersion || '1',
      isBundle: false,
      description: customDescription || pushSelectedHardware.name,
      lifecycleStatus: 'Launched',
      validFor: {
        startDateTime: new Date(Date.now() + 2 * 60 * 1000).toISOString()
      },
      productSpecification: {
        id: "5acc6b4e-9025-42e6-999c-199bcfe71d6b",
        name: "Hardware Specification",
        href: "/api/productCatalogManagement/v4/productSpecification/5acc6b4e-9025-42e6-999c-199bcfe71d6b:(version=1)",
        "@referredType": "ProductSpecification"
      },
      productOfferingPrice: [
        ...(pushSelectedHardware.maf > 0 ? [{
          name: "Monthly Rental Fee",
          priceType: "recurring",
          recurringChargePeriod: "month",
          price: { value: pushSelectedHardware.maf, unit: "EUR" }
        }] : []),
        ...(pushSelectedHardware.price > 0 ? [{
          name: "One-off Purchase Price",
          priceType: "oneTime",
          price: { value: pushSelectedHardware.price, unit: "EUR" }
        }] : [])
      ]
    };
  };

  // Handle Push Initiate
  const handleInitiatePush = async (hardwareItem) => {
    setPushSelectedHardware(hardwareItem);
    setCustomDescription(hardwareItem.name);
    setCustomVersion('1');
    setPushStatus('idle');
    setPushError('');
    setActiveTab('push');

    const prefixedName = `VF_DE_${hardwareItem.name}`;
    addLog(`Preparing hardware sync for SKU: '${prefixedName}' (${hardwareItem.id})...`);

    try {
      addLog(`Checking if product offering '${prefixedName}' already exists on DNEXT...`);
      const checkRes = await fetch(`/api/dnext/product-offerings?limit=500`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const allRemoteOfferings = await checkRes.json();

      if (Array.isArray(allRemoteOfferings)) {
        const duplicateItem = allRemoteOfferings.find(c => c.name === prefixedName || c.name === hardwareItem.name);
        if (duplicateItem) {
          setPushStatus('error');
          setPushError(`Product offering '${prefixedName}' already exists on DNEXT (ID: '${duplicateItem.id}').`);
          addLog(`Duplicate name check: Product offering '${prefixedName}' already exists on DNEXT.`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Execute Push
  const handleExecutePush = async () => {
    if (!pushSelectedHardware || !token) return;

    setPushStatus('pushing');
    setPushError('');

    const payload = generatePayload();
    addLog(`Initiating product offering push for: ${payload.name} (${payload.id})...`);

    try {
      const response = await fetch('/api/dnext/product-offerings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Push operation rejected by remote API');
      }

      setPushStatus('success');
      addLog(`Success: Product Offering '${payload.name}' created on DNEXT with ID: ${data.id}`);
    } catch (err) {
      console.error(err);
      setPushStatus('error');
      setPushError(err.message);
      addLog(`Push failed: ${err.message}`);
    }
  };

  // Handle Remove / Delete Product Offering from DNEXT
  const handleDeleteOffering = async (offering) => {
    if (!token || !offering) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete product offering '${offering.name}' (ID: ${offering.id}) from the remote DNEXT catalog?`);
    if (!confirmDelete) return;

    addLog(`Deleting remote product offering '${offering.name}' (${offering.id}) from DNEXT...`);

    try {
      const response = await fetch(`/api/dnext/product-offerings/${encodeURIComponent(offering.id)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok && response.status !== 204) {
        const data = await response.json();
        throw new Error(data.message || `Delete failed with status ${response.status}`);
      }

      addLog(`Success: Product offering '${offering.name}' (${offering.id}) deleted from remote DNEXT catalog.`);
      fetchRemoteOfferings();
      if (activeTab === 'diff') {
        handleRunDiff();
      }
    } catch (err) {
      console.error(err);
      addLog(`Delete failed for product offering '${offering.name}': ${err.message}`);
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', boxSizing: 'border-box', overflowY: 'auto' }}>
      
      {/* Header & Auth Connection */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔌 DNEXT Hardware & Accessories Sync</span>
            <span style={{ fontSize: '11px', background: '#222', color: '#00e676', border: '1px solid #00e676', padding: '2px 8px', borderRadius: '12px' }}>
              Prefix: VF_DE_
            </span>
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#aaa' }}>
            Synchronize active Fiber Hardware using template specifications and prefix <code style={{ color: '#00e676' }}>VF_DE_</code>.
          </p>
        </div>

        {/* Auth form / Connected status */}
        {loginStatus === 'connected' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 230, 118, 0.1)', border: '1px solid #00e676', padding: '6px 12px', borderRadius: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00e676' }}></span>
              <span style={{ fontSize: '12px', color: '#00e676', fontWeight: '600' }}>Authenticated ({username})</span>
            </div>
            <button 
              onClick={handleDisconnect}
              style={{ background: '#333', color: '#fff', border: '1px solid #444', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <form onSubmit={handleConnect} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              style={{ padding: '6px 10px', background: '#222', border: '1px solid #444', borderRadius: '4px', color: '#fff', width: '90px', fontSize: '12px' }}
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: '6px 10px', background: '#222', border: '1px solid #444', borderRadius: '4px', color: '#fff', width: '90px', fontSize: '12px' }}
            />
            <button 
              type="submit" 
              disabled={loginStatus === 'connecting'}
              style={{ background: '#E60000', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 14px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}
            >
              {loginStatus === 'connecting' ? 'Connecting...' : 'Connect Keycloak'}
            </button>
          </form>
        )}
      </div>

      {/* Template Offering Bar */}
      {loginStatus === 'connected' && (
        <div style={{ background: '#181818', border: '1px solid #333', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' }}>📋 Offering Template:</span>
            <input 
              type="text"
              placeholder="Enter Template Offering ID (e.g. REDL)..."
              value={templateOfferingId}
              onChange={(e) => setTemplateOfferingId(e.target.value)}
              style={{ padding: '6px 12px', background: '#111', border: '1px solid #444', borderRadius: '4px', color: '#fff', width: '260px', fontSize: '12px' }}
            />
            <button 
              onClick={() => loadTemplateOffering(templateOfferingId)}
              disabled={isFetchingTemplate || !templateOfferingId}
              style={{ background: '#2196f3', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 14px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}
            >
              {isFetchingTemplate ? 'Loading Template...' : 'Load Template'}
            </button>
          </div>

          {templateOffering ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(33, 150, 243, 0.1)', border: '1px solid #2196f3', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', color: '#64b5f6' }}>
              <span>Active Template: <strong>{templateOffering.name}</strong> ({templateOffering.id})</span>
              <button 
                onClick={() => { setTemplateOffering(null); setTemplateOfferingId(''); }}
                style={{ background: 'none', border: 'none', color: '#ff9800', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕ Clear
              </button>
            </div>
          ) : (
            <span style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
              No template loaded (Default hardware specification schema will be attached)
            </span>
          )}
        </div>
      )}

      {errorMsg && (
        <div style={{ background: 'rgba(244, 67, 54, 0.1)', border: '1px solid #f44336', color: '#f44336', padding: '10px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '12px' }}>
          {errorMsg}
        </div>
      )}

      {/* Main Workspace Layout */}
      {loginStatus === 'connected' && (
        <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
          
          {/* Main Dashboard Tabs */}
          <div style={{ flex: 3, display: 'flex', flexDirection: 'column', background: '#111', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
            
            {/* Navigation Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #333', background: '#1a1a1a' }}>
              <button 
                onClick={() => setActiveTab('browse')} 
                style={{ flex: 1, padding: '12px', border: 'none', borderBottom: activeTab === 'browse' ? '2px solid #E60000' : 'none', background: 'none', color: activeTab === 'browse' ? '#fff' : '#aaa', cursor: 'pointer', fontWeight: '600' }}
              >
                Browse Remote DNEXT Offerings
              </button>
              <button 
                onClick={() => { setActiveTab('diff'); handleRunDiff(); }} 
                style={{ flex: 1, padding: '12px', border: 'none', borderBottom: activeTab === 'diff' ? '2px solid #E60000' : 'none', background: 'none', color: activeTab === 'diff' ? '#fff' : '#aaa', cursor: 'pointer', fontWeight: '600' }}
              >
                1-Way Fiber Hardware Sync (Prefix VF_DE_)
              </button>
              <button 
                onClick={() => setActiveTab('push')} 
                style={{ flex: 1, padding: '12px', border: 'none', borderBottom: activeTab === 'push' ? '2px solid #E60000' : 'none', background: 'none', color: activeTab === 'push' ? '#fff' : '#aaa', cursor: 'pointer', fontWeight: '600' }}
                disabled={!pushSelectedHardware}
              >
                Export Hardware Payload
              </button>
            </div>

            {/* Tab Contents */}
            <div style={{ flex: 1, padding: '20px', boxSizing: 'border-box', overflowY: 'auto' }}>
              
              {/* TAB 1: Browse Remote Offerings */}
              {activeTab === 'browse' && (
                <div>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <input 
                      type="text" 
                      placeholder="Filter offerings by name..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', background: '#111', border: '1px solid #444', borderRadius: '4px', color: '#fff' }}
                      onKeyDown={(e) => e.key === 'Enter' && fetchRemoteOfferings()}
                    />
                    <button 
                      onClick={fetchRemoteOfferings} 
                      style={{ background: '#333', color: '#fff', border: '1px solid #444', borderRadius: '4px', padding: '0 20px', cursor: 'pointer' }}
                    >
                      Search
                    </button>
                  </div>

                  {isFetchingRemote ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>Loading Product Offerings from DNEXT...</div>
                  ) : (
                    <div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #444', color: '#aaa' }}>
                            <th style={{ padding: '8px' }}>Offering ID</th>
                            <th style={{ padding: '8px' }}>Offering Name</th>
                            <th style={{ padding: '8px' }}>Lifecycle Status</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {remoteOfferings.length > 0 ? remoteOfferings.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #333' }}>
                              <td style={{ padding: '8px', fontFamily: 'monospace', color: '#888' }}>{item.id}</td>
                              <td style={{ padding: '8px', color: '#fff', fontWeight: '500' }}>{item.name}</td>
                              <td style={{ padding: '8px' }}>
                                <span style={{ background: 'rgba(0,230,118,0.1)', color: '#00e676', padding: '2px 6px', borderRadius: '3px', fontSize: '11px' }}>
                                  {item.lifecycleStatus || 'Launched'}
                                </span>
                              </td>
                              <td style={{ padding: '8px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button 
                                  onClick={() => loadTemplateOffering(item.id)}
                                  title="Use this offering as the cloning template"
                                  style={{ background: '#2196f3', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}
                                >
                                  📋 Set as Template
                                </button>
                                <button 
                                  onClick={() => handleDeleteOffering(item)}
                                  title="Delete product offering from DNEXT catalog"
                                  style={{ background: '#d32f2f', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}
                                >
                                  🗑️ Remove
                                </button>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No product offerings found in DNEXT catalog.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      {/* Pagination Controls */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid #333', paddingTop: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <label style={{ fontSize: '12px', color: '#aaa' }}>Items per page:</label>
                          <select 
                            value={limit} 
                            onChange={(e) => { setLimit(Number(e.target.value)); setOffset(0); }} 
                            style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '4px', borderRadius: '4px' }}
                          >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            disabled={offset === 0} 
                            onClick={() => setOffset(Math.max(0, offset - limit))}
                            style={{ padding: '6px 12px', background: '#333', border: '1px solid #444', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}
                          >
                            Previous
                          </button>
                          <button 
                            disabled={remoteOfferings.length < limit} 
                            onClick={() => setOffset(offset + limit)}
                            style={{ padding: '6px 12px', background: '#333', border: '1px solid #444', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: 1-Way Fiber Hardware Sync Analysis */}
              {activeTab === 'diff' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <p style={{ margin: '0', fontSize: '13px', color: '#aaa' }}>
                      <strong style={{ color: '#00e676' }}>1-Way Fiber Hardware Sync Analysis:</strong> Evaluates local items against remote offerings matching prefix <code style={{ color: '#00e676' }}>VF_DE_</code>.
                    </p>
                    <button 
                      onClick={handleRunDiff} 
                      disabled={isDiffing}
                      style={{ background: '#E60000', color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 16px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      {isDiffing ? 'Comparing...' : 'Run 1-Way Comparison'}
                    </button>
                  </div>

                  {isDiffing ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>Analyzing Fiber hardware datasets...</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #444', color: '#aaa' }}>
                          <th style={{ padding: '8px' }}>Local SKU</th>
                          <th style={{ padding: '8px' }}>Local Hardware Name</th>
                          <th style={{ padding: '8px' }}>DNEXT Target Name (VF_DE_)</th>
                          <th style={{ padding: '8px' }}>Price / MAF</th>
                          <th style={{ padding: '8px' }}>Alignment State</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {diffResults.length > 0 ? diffResults.map((row) => (
                          <tr key={row.id} style={{ borderBottom: '1px solid #333', transition: 'background 0.2s' }}>
                            <td 
                              style={{ padding: '8px', fontFamily: 'monospace', color: '#64b5f6', cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => setSelectedHardwareModal(row)}
                              title="Click to view hardware details"
                            >
                              {row.id}
                            </td>
                            <td 
                              style={{ padding: '8px', color: '#fff', fontWeight: '500', cursor: 'pointer' }}
                              onClick={() => setSelectedHardwareModal(row)}
                              title="Click to view hardware details"
                            >
                              <span style={{ color: '#64b5f6', textDecoration: 'underline' }}>{row.name}</span> 🔍
                            </td>
                            <td style={{ padding: '8px', fontFamily: 'monospace', color: '#00e676', fontSize: '12px' }}>
                              {row.prefixedName}
                            </td>
                            <td style={{ padding: '8px', fontSize: '11px', color: '#fff' }}>
                              €{row.price} / €{row.maf}mo
                            </td>
                            <td style={{ padding: '8px' }}>
                              <span style={{ 
                                padding: '2px 8px', 
                                borderRadius: '4px', 
                                fontSize: '11px',
                                fontWeight: '600',
                                background: 
                                  row.status === 'Synced' ? 'rgba(0, 230, 118, 0.1)' :
                                  row.status === 'Mismatched' ? 'rgba(255, 152, 0, 0.1)' :
                                  'rgba(33, 150, 243, 0.1)',
                                color:
                                  row.status === 'Synced' ? '#00e676' :
                                  row.status === 'Mismatched' ? '#ff9800' :
                                  '#2196f3'
                              }}>
                                {row.status}
                              </span>
                            </td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>
                              {row.status === 'Local Only' && (
                                <button 
                                  onClick={() => handleInitiatePush(row.localData)}
                                  className="action-btn"
                                  style={{ padding: '4px 8px', fontSize: '11px', background: '#E60000', border: 'none', color: '#fff', borderRadius: '3px', cursor: 'pointer' }}
                                >
                                  Push VF_DE_ Offering
                                </button>
                              )}
                              {row.remoteData && (
                                <button 
                                  onClick={() => handleDeleteOffering(row.remoteData)}
                                  title="Delete product offering from DNEXT catalog"
                                  style={{ marginLeft: '6px', background: '#d32f2f', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}
                                >
                                  🗑️ Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No entries analyzed. Click Run 1-Way Comparison.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* TAB 3: Push Hardware Payload */}
              {activeTab === 'push' && pushSelectedHardware && (
                <div>
                  <h4 style={{ margin: '0 0 16px 0', color: '#fff' }}>Export Hardware Product Offering to DNEXT (TMF 620 ProductOffering)</h4>
                  
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', color: '#aaa' }}>Target DNEXT Offering ID (Prefix: VF_DE_)</label>
                        <input 
                          type="text" 
                          value={`VF_DE_${pushSelectedHardware.id}`} 
                          disabled
                          style={{ padding: '8px 12px', background: '#222', border: '1px solid #444', borderRadius: '4px', color: '#00e676', fontFamily: 'monospace' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', color: '#aaa' }}>Target DNEXT Offering Name (Prefix: VF_DE_)</label>
                        <input 
                          type="text" 
                          value={`VF_DE_${pushSelectedHardware.name}`} 
                          disabled
                          style={{ padding: '8px 12px', background: '#222', border: '1px solid #444', borderRadius: '4px', color: '#00e676', fontWeight: '600' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', color: '#aaa' }}>Version</label>
                        <input 
                          type="text" 
                          value={customVersion} 
                          onChange={(e) => setCustomVersion(e.target.value)}
                          style={{ padding: '8px 12px', background: '#111', border: '1px solid #444', borderRadius: '4px', color: '#fff' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', color: '#aaa' }}>Description</label>
                        <textarea 
                          value={customDescription} 
                          onChange={(e) => setCustomDescription(e.target.value)}
                          rows="3"
                          style={{ padding: '8px 12px', background: '#111', border: '1px solid #444', borderRadius: '4px', color: '#fff', fontFamily: 'inherit' }}
                        />
                      </div>

                      {pushError && (
                        <div style={{ background: 'rgba(244, 67, 54, 0.1)', border: '1px solid #f44336', color: '#f44336', padding: '10px 14px', borderRadius: '4px', fontSize: '12px' }}>
                          {pushError}
                        </div>
                      )}

                      {pushStatus === 'success' && (
                        <div style={{ background: 'rgba(0, 230, 118, 0.1)', border: '1px solid #00e676', color: '#00e676', padding: '10px 14px', borderRadius: '4px', fontSize: '12px' }}>
                          Product Offering pushed successfully to DNEXT!
                        </div>
                      )}

                      <button 
                        onClick={handleExecutePush}
                        disabled={pushStatus === 'pushing'}
                        style={{ background: '#E60000', color: '#fff', border: 'none', borderRadius: '4px', padding: '10px 20px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' }}
                      >
                        {pushStatus === 'pushing' ? 'Posting to DNEXT...' : 'Execute Push to DNEXT'}
                      </button>
                    </div>

                    {/* JSON Preview */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>
                        TMF 620 Payload Preview {templateOffering ? `(Cloned from Template: ${templateOffering.name})` : '(With Mandatory ProductSpecification)'}
                      </label>
                      <pre style={{ flex: 1, background: '#080808', border: '1px solid #333', borderRadius: '6px', padding: '12px', color: '#00e676', fontSize: '11px', fontFamily: 'monospace', overflow: 'auto', margin: 0 }}>
{JSON.stringify(generatePayload(), null, 4)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Activity log sidebar */}
          <div style={{ flex: 1, flexBasis: '280px', display: 'flex', flexDirection: 'column', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '16px', boxSizing: 'border-box' }}>
            <h4 style={{ margin: '0 0 12px 0', borderBottom: '1px solid #333', paddingBottom: '8px', color: '#fff' }}>Sync Activity Log</h4>
            <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: '11px', color: '#aaa', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {logs.length > 0 ? logs.map((log, index) => (
                <div key={index} style={{ borderBottom: '1px dashed #2a2a2a', paddingBottom: '4px', lineBreak: 'anywhere' }}>
                  {log}
                </div>
              )) : (
                <div style={{ color: '#555', textAlign: 'center', padding: '20px 0' }}>Log history is currently empty.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hardware Details Modal */}
      {selectedHardwareModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#1e1e1e',
            border: '1px solid #333',
            borderRadius: '8px',
            width: '650px',
            maxWidth: '90%',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '24px',
            boxSizing: 'border-box',
            color: '#fff',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '12px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>📦 {selectedHardwareModal.name}</span>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: 
                      selectedHardwareModal.status === 'Synced' ? 'rgba(0, 230, 118, 0.15)' :
                      selectedHardwareModal.status === 'Mismatched' ? 'rgba(255, 152, 0, 0.15)' :
                      'rgba(33, 150, 243, 0.15)',
                    color:
                      selectedHardwareModal.status === 'Synced' ? '#00e676' :
                      selectedHardwareModal.status === 'Mismatched' ? '#ff9800' :
                      '#2196f3'
                  }}>
                    {selectedHardwareModal.status}
                  </span>
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888' }}>
                  Target DNEXT Name: <span style={{ fontFamily: 'monospace', color: '#00e676' }}>{selectedHardwareModal.prefixedName}</span>
                </p>
              </div>
              <button 
                onClick={() => setSelectedHardwareModal(null)}
                style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '20px', cursor: 'pointer', padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            {/* Grid details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: '#141414', border: '1px solid #2e2e2e', borderRadius: '6px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#2196f3', fontSize: '14px', borderBottom: '1px solid #2a2a2a', paddingBottom: '6px' }}>
                  🇩🇪 Local German Catalog
                </h4>
                {selectedHardwareModal.localData ? (
                  <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div><strong style={{ color: '#aaa' }}>SKU:</strong> <code style={{ color: '#fff' }}>{selectedHardwareModal.localData.id}</code></div>
                    <div><strong style={{ color: '#aaa' }}>Name:</strong> <span style={{ color: '#fff' }}>{selectedHardwareModal.localData.name}</span></div>
                    <div><strong style={{ color: '#aaa' }}>Subtype:</strong> {selectedHardwareModal.localData.type}</div>
                    <div><strong style={{ color: '#aaa' }}>Product Type:</strong> {selectedHardwareModal.localData.product_type}</div>
                    <div><strong style={{ color: '#aaa' }}>One-off Price:</strong> €{selectedHardwareModal.localData.price}</div>
                    <div><strong style={{ color: '#aaa' }}>Monthly Fee (MAF):</strong> €{selectedHardwareModal.localData.maf}/mo</div>
                  </div>
                ) : (
                  <div style={{ color: '#666', fontSize: '12px' }}>Not present in local German catalog</div>
                )}
              </div>

              <div style={{ background: '#141414', border: '1px solid #2e2e2e', borderRadius: '6px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#00e676', fontSize: '14px', borderBottom: '1px solid #2a2a2a', paddingBottom: '6px' }}>
                  🌐 Remote DNEXT Catalog
                </h4>
                {selectedHardwareModal.remoteData ? (
                  <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div><strong style={{ color: '#aaa' }}>Offering ID:</strong> <code style={{ color: '#fff' }}>{selectedHardwareModal.remoteData.id}</code></div>
                    <div><strong style={{ color: '#aaa' }}>Name:</strong> <span style={{ color: '#fff' }}>{selectedHardwareModal.remoteData.name}</span></div>
                    <div><strong style={{ color: '#aaa' }}>Lifecycle:</strong> {selectedHardwareModal.remoteData.lifecycleStatus || 'Launched'}</div>
                  </div>
                ) : (
                  <div style={{ color: '#888', fontSize: '12px', fontStyle: 'italic', padding: '10px 0' }}>
                    Not yet pushed to DNEXT Catalog (will be named: {selectedHardwareModal.prefixedName})
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #333', paddingTop: '16px' }}>
              <button 
                onClick={() => setSelectedHardwareModal(null)}
                style={{ background: '#333', color: '#fff', border: '1px solid #444', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer' }}
              >
                Close
              </button>
              {selectedHardwareModal.localData && (
                <button 
                  onClick={() => {
                    const item = selectedHardwareModal.localData;
                    setSelectedHardwareModal(null);
                    handleInitiatePush(item);
                  }}
                  style={{ background: '#E60000', color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 16px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Export VF_DE_ Payload
                </button>
              )}
              {selectedHardwareModal.remoteData && (
                <button 
                  onClick={() => {
                    const item = selectedHardwareModal.remoteData;
                    setSelectedHardwareModal(null);
                    handleDeleteOffering(item);
                  }}
                  style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 16px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  🗑️ Remove from DNEXT
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
