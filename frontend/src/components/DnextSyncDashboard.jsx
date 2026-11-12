import React, { useState, useEffect } from 'react';
import Icon from './ui/Icon';
import { getStoredEnvironment } from '../context/EnvironmentContext';

export default function DnextSyncDashboard({ onNavigateToDetails }) {
  // Active target environment (shared with the app header / EnvironmentContext)
  const activeEnv = getStoredEnvironment();
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'diff' | 'push'
  
  // Connection states
  const [username, setUsername] = useState(() => localStorage.getItem('dnext_username') || '');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(() => localStorage.getItem('dnext_token') || '');
  const [loginStatus, setLoginStatus] = useState(token ? 'connected' : 'disconnected');
  const [errorMsg, setErrorMsg] = useState('');

  // Remote data browsing states
  const [remoteCategories, setRemoteCategories] = useState([]);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFetchingRemote, setIsFetchingRemote] = useState(false);

  // Diff states
  const [localCategories, setLocalCategories] = useState([]);
  const [diffResults, setDiffResults] = useState([]);
  const [isDiffing, setIsDiffing] = useState(false);
  const [selectedDiffCategory, setSelectedDiffCategory] = useState(null);
  const [silentSyncingId, setSilentSyncingId] = useState(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

  const handleToggleSelectCategory = (id) => {
    setSelectedCategoryIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedCategoryIds.length === diffResults.length) {
      setSelectedCategoryIds([]);
    } else {
      setSelectedCategoryIds(diffResults.map(r => r.id));
    }
  };

  // Push / Export states
  const [pushSelectedCategory, setPushSelectedCategory] = useState(null);
  const [pushStatus, setPushStatus] = useState('idle'); // 'idle' | 'pushing' | 'success' | 'error'
  const [pushError, setPushError] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customVersion, setCustomVersion] = useState('1');
  const [resolvedParentUuid, setResolvedParentUuid] = useState('');
  const [parentResolutionStatus, setParentResolutionStatus] = useState('idle'); // 'idle' | 'resolving' | 'resolved' | 'failed'

  // Logs
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${message}`, ...prev]);
  };

  // Auth Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginStatus('connecting');
    setErrorMsg('');
    addLog('Initiating Keycloak authentication request...');

    try {
      const response = await fetch('/api/dnext/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, envName: activeEnv.name || undefined, apiUrl: activeEnv.apiUrl || undefined, authUrl: activeEnv.authUrl || undefined })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error_description || data.error || 'Failed to authenticate');
      }

      const accessToken = data.access_token;
      setToken(accessToken);
      localStorage.setItem('dnext_token', accessToken);
      setLoginStatus('connected');
      addLog('Authentication successful! Token stored.');
    } catch (err) {
      console.error(err);
      setLoginStatus('error');
      setErrorMsg(err.message);
      addLog(`Authentication failed: ${err.message}`);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('dnext_token');
    setLoginStatus('disconnected');
    setRemoteCategories([]);
    addLog('Logged out from DNEXT Platform.');
  };

  // Fetch remote categories
  const fetchRemoteCategories = async () => {
    if (!token) return;
    setIsFetchingRemote(true);
    addLog(`Fetching remote categories (limit: ${limit}, offset: ${offset})...`);
    try {
      let url = `/api/dnext/categories?limit=${limit}&offset=${offset}`;
      if (searchQuery) {
        url += `&name=${encodeURIComponent(searchQuery)}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 401) {
        handleLogout();
        throw new Error('Token expired or unauthorized');
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch categories');
      }

      setRemoteCategories(Array.isArray(data) ? data : [data]);
      addLog(`Successfully retrieved ${Array.isArray(data) ? data.length : 1} remote categories.`);
    } catch (err) {
      console.error(err);
      addLog(`Error fetching remote categories: ${err.message}`);
    } finally {
      setIsFetchingRemote(false);
    }
  };

  useEffect(() => {
    if (token && activeTab === 'browse') {
      fetchRemoteCategories();
    }
  }, [token, limit, offset, activeTab]);

  const fetchAllRemoteCategories = async (token) => {
    let remoteList = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const res = await fetch(`/api/dnext/categories?limit=${limit}&offset=${offset}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Failed to retrieve categories from remote TMF catalog.');
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        remoteList = [...remoteList, ...data];
        if (data.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }
      } else {
        hasMore = false;
      }
    }
    return remoteList;
  };

  // Handle run diff
  const handleRunDiff = async () => {
    if (!token) return;
    setIsDiffing(true);
    addLog('Starting in-memory alignment comparison across all catalog pages...');

    try {
      // 1. Fetch all local categories from our custom endpoint
      addLog('Fetching local category definitions from SQLite...');
      const localRes = await fetch('/api/dnext/local-categories');
      const localData = await localRes.json();
      setLocalCategories(localData);

      // 2. Fetch ALL remote categories using page loop
      addLog('Fetching all remote category definitions from DNEXT...');
      const remoteList = await fetchAllRemoteCategories(token);

      addLog(`Fetched ${remoteList.length} remote categories from DNEXT across all pages.`);

      // 3. Perform in-memory alignment
      const remoteMap = new Map();
      remoteList.forEach(c => remoteMap.set(c.id, c));
      
      const localMap = new Map();
      localData.forEach(c => localMap.set(c.id, c));

      const results = [];

      // Check local rows
      localData.forEach(localCat => {
        const remoteCat = remoteMap.get(localCat.id);
        
        if (remoteCat) {
          // Exists in both
          const nameMatch = remoteCat.name === localCat.name;
          const parentMatch = (!localCat.parentId && (remoteCat.isRoot || !remoteCat.parentId)) ||
                              (localCat.parentId && remoteCat.parentId === localCat.parentId) ||
                              (!localCat.parentId && !remoteCat.parentId);
          
          if (nameMatch && parentMatch) {
            results.push({
              id: localCat.id,
              name: localCat.name,
              parentId: localCat.parentId,
              source: 'Both',
              status: 'Synced',
              localData: localCat,
              remoteData: remoteCat
            });
          } else {
            results.push({
              id: localCat.id,
              name: localCat.name,
              parentId: localCat.parentId,
              source: 'Both',
              status: 'Mismatched',
              localData: localCat,
              remoteData: remoteCat,
              diffDetails: `Name Match: ${nameMatch ? 'Yes' : 'No'}, Parent Match: ${parentMatch ? 'Yes' : 'No'}`
            });
          }
        } else {
          // Only local
          results.push({
            id: localCat.id,
            name: localCat.name,
            parentId: localCat.parentId,
            source: 'Local Only',
            status: 'Local Only',
            localData: localCat,
            remoteData: null
          });
        }
      });

      // (1-Way Diff: Only German Catalog categories are evaluated for sync coverage to DNEXT)
      setDiffResults(results);
      addLog(`1-Way comparison completed: ${results.length} German categories analyzed against DNEXT.`);
    } catch (err) {
      console.error(err);
      addLog(`Comparison failed: ${err.message}`);
    } finally {
      setIsDiffing(false);
      setSelectedCategoryIds([]);
    }
  };

  useEffect(() => {
    if (token && activeTab === 'diff') {
      handleRunDiff();
    }
  }, [token, activeTab]);

  useEffect(() => {
    if (token) {
      fetch('/api/dnext/local-categories')
        .then(res => res.json())
        .then(data => setLocalCategories(data))
        .catch(err => console.error('Error fetching local categories:', err));
    }
  }, [token]);

  // Handle Export / Push Category
  const handleInitiatePush = async (localCategory) => {
    setPushSelectedCategory(localCategory);
    setCustomDescription(localCategory.name);
    setCustomVersion('1');
    setPushStatus('idle');
    setPushError('');
    setActiveTab('push');
    
    // Default parent ID directly to localCategory.parentId
    const defaultParentId = localCategory.parentId || '';
    setResolvedParentUuid(defaultParentId);
    setParentResolutionStatus(defaultParentId ? 'resolved' : 'idle');

    addLog(`Preparing sync for category: '${localCategory.name}' (${localCategory.id})...`);

    try {
      // 1. Check if category with the same Name already exists on DNEXT
      addLog(`Checking if category name '${localCategory.name}' already exists on DNEXT...`);
      const allRemoteCats = await fetchAllRemoteCategories(token);

      if (Array.isArray(allRemoteCats)) {
        const duplicateId = allRemoteCats.find(c => c.id === localCategory.id);
        if (duplicateId) {
          setPushStatus('error');
          setPushError(`Category with ID '${localCategory.id}' already exists on DNEXT (Name: '${duplicateId.name}').`);
          addLog(`Duplicate ID check failed: Category with ID '${localCategory.id}' already exists on DNEXT.`);
        } else {
          const duplicateName = allRemoteCats.find(c => c.name.trim().toLowerCase() === localCategory.name.trim().toLowerCase());
          if (duplicateName) {
            const newName = `${localCategory.name}_${localCategory.id}`;
            setPushSelectedCategory(prev => prev ? { ...prev, name: newName } : null);
            setCustomDescription(newName);
            addLog(`Duplicate name detected: Category name '${localCategory.name}' already exists on DNEXT (ID: '${duplicateName.id}'). Synced name rewritten to '${newName}'.`);
          }
        }
      }

      // 2. Resolve Remote Parent DNEXT Category ID if this is a subcategory
      if (localCategory.parentId) {
        setParentResolutionStatus('resolving');
        addLog(`Resolving remote DNEXT Parent Category ID for local parent '${localCategory.parentId}'...`);

        // Query by ID directly on remote server
        const directRes = await fetch(`/api/dnext/categories/${encodeURIComponent(localCategory.parentId)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (directRes.ok) {
          const directParent = await directRes.json();
          setResolvedParentUuid(directParent.id);
          setParentResolutionStatus('resolved');
          addLog(`Confirmed remote DNEXT Parent Category ID: '${directParent.id}' (${directParent.name})`);
          return;
        }

        // Fallback: search in list or by parent name
        const localParent = localCategories.find(c => c.id === localCategory.parentId);
        const parentName = localParent ? localParent.name : localCategory.parentId;

        if (Array.isArray(allRemoteCats)) {
          const remoteParent = allRemoteCats.find(c => c.id === localCategory.parentId || c.name === parentName);
          if (remoteParent) {
            setResolvedParentUuid(remoteParent.id);
            setParentResolutionStatus('resolved');
            addLog(`Resolved remote DNEXT Parent Category ID: '${remoteParent.id}' for parent '${parentName}'`);
          } else {
            setParentResolutionStatus('failed');
            addLog(`Parent category '${parentName}' (${localCategory.parentId}) does not exist on DNEXT yet. Please sync parent category first.`);
          }
        }
      }
    } catch (err) {
      console.error(err);
      addLog(`Error during initial remote verification: ${err.message}`);
    }
  };

  const handleSilentSyncCategory = async (localCategory) => {
    if (!token || !localCategory) return;
    setSilentSyncingId(localCategory.id);
    addLog(`Silent Sync: Preparing sync for category '${localCategory.name}' (${localCategory.id})...`);

    try {
      const allRemoteCats = await fetchAllRemoteCategories(token);

      let finalName = localCategory.name;
      if (Array.isArray(allRemoteCats)) {
        const duplicateId = allRemoteCats.find(c => c.id === localCategory.id);
        if (duplicateId) {
          throw new Error(`Category with ID '${localCategory.id}' already exists on DNEXT (Name: '${duplicateId.name}').`);
        }
        
        const duplicateName = allRemoteCats.find(c => c.name.trim().toLowerCase() === localCategory.name.trim().toLowerCase());
        if (duplicateName) {
          finalName = `${localCategory.name}_${localCategory.id}`;
          addLog(`Duplicate name detected: Category name '${localCategory.name}' already exists on DNEXT (ID: '${duplicateName.id}'). Synced name rewritten to '${finalName}'.`);
        }
      }

      // 2. Resolve Remote Parent DNEXT Category ID if this is a subcategory
      let resolvedParentId = '';
      if (localCategory.parentId) {
        addLog(`Silent Sync: Resolving remote parent ID for parent '${localCategory.parentId}'...`);
        const directRes = await fetch(`/api/dnext/categories/${encodeURIComponent(localCategory.parentId)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (directRes.ok) {
          const directParent = await directRes.json();
          resolvedParentId = directParent.id;
        } else {
          // Fallback to name search in case ID format differed
          if (Array.isArray(allRemoteCats)) {
            const remoteParent = allRemoteCats.find(c => c.id === localCategory.parentId);
            if (remoteParent) {
              resolvedParentId = remoteParent.id;
            } else {
              throw new Error(`Parent category '${localCategory.parentId}' does not exist on DNEXT yet. Please sync parent category first.`);
            }
          }
        }
      }

      // 3. Build Payload
      const payload = {
        id: localCategory.id,
        name: finalName,
        version: '1',
        isRoot: !localCategory.parentId,
        description: finalName,
        lifecycleStatus: 'Launched',
        validFor: {
          startDateTime: new Date(Date.now() + 2 * 60 * 1000).toISOString()
        }
      };

      if (localCategory.parentId) {
        payload.parentId = resolvedParentId;
      }

      // 4. Submit Category Creation to Gateway
      addLog(`Silent Sync: Sending POST request for '${localCategory.name}'...`);
      const response = await fetch('/api/dnext/categories', {
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

      addLog(`Silent Sync Success: Category '${localCategory.name}' created on DNEXT (ID: ${data.id})`);
      handleRunDiff();
    } catch (err) {
      console.error(err);
      addLog(`Silent Sync Error: ${err.message}`);
    } finally {
      setSilentSyncingId(null);
    }
  };

  const handleBulkSyncSelected = async () => {
    const toSync = diffResults.filter(r => selectedCategoryIds.includes(r.id) && (r.status === 'Local Only' || r.status === 'Mismatched'));
    if (toSync.length === 0) {
      alert('No eligible categories selected for sync (only Local Only or Mismatched categories can be synced).');
      return;
    }

    const confirmSync = window.confirm(`Are you sure you want to silently sync the ${toSync.length} selected categories to DNEXT?`);
    if (!confirmSync) return;

    addLog(`Bulk Sync: Starting sync for ${toSync.length} categories...`);
    setIsDiffing(true); // Disable controls during bulk operation

    // Pre-fetch remote categories once
    let allRemoteCats = [];
    try {
      allRemoteCats = await fetchAllRemoteCategories(token);
    } catch (e) {
      console.error('Bulk Sync: Failed to pre-fetch remote categories', e);
    }
    for (const row of toSync) {
      try {
        addLog(`Bulk Sync: Syncing '${row.localData.name}' (${row.localData.id})...`);
        const duplicateId = allRemoteCats.find(c => c.id === row.localData.id);
        if (duplicateId) {
          throw new Error(`Category with ID '${row.localData.id}' already exists on DNEXT (Name: '${duplicateId.name}').`);
        }
        
        let finalName = row.localData.name;
        const duplicateName = allRemoteCats.find(c => c.name.trim().toLowerCase() === row.localData.name.trim().toLowerCase());
        if (duplicateName) {
          finalName = `${row.localData.name}_${row.localData.id}`;
          addLog(`Bulk Sync: Duplicate name detected for '${row.localData.name}'. Synced name rewritten to '${finalName}'.`);
        }

        // 1. Resolve Remote Parent DNEXT Category ID if this is a subcategory
        let resolvedParentId = '';
        if (row.localData.parentId) {
          const directRes = await fetch(`/api/dnext/categories/${encodeURIComponent(row.localData.parentId)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (directRes.ok) {
            const directParent = await directRes.json();
            resolvedParentId = directParent.id;
          } else {
            const remoteParent = allRemoteCats.find(c => c.id === row.localData.parentId);
            if (remoteParent) {
              resolvedParentId = remoteParent.id;
            } else {
              addLog(`Bulk Sync Warning: Parent category '${row.localData.parentId}' not found. Attempting to sync without parent...`);
            }
          }
        }

        const payload = {
          id: row.localData.id,
          name: finalName,
          version: '1',
          isRoot: !row.localData.parentId,
          description: finalName,
          lifecycleStatus: 'Launched',
          validFor: {
            startDateTime: new Date(Date.now() + 2 * 60 * 1000).toISOString()
          }
        };

        if (row.localData.parentId && resolvedParentId) {
          payload.parentId = resolvedParentId;
        }

        const response = await fetch('/api/dnext/categories', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Push operation rejected by remote API');
        }
        addLog(`Bulk Sync: Successfully synced '${row.name}'`);
      } catch (err) {
        console.error(err);
        addLog(`Bulk Sync Error for '${row.name}': ${err.message}`);
      }
    }

    addLog('Bulk Sync completed.');
    setSelectedCategoryIds([]);
    setIsDiffing(false);
    handleRunDiff();
  };

  const handleBulkRemoveSelected = async () => {
    const toRemove = diffResults.filter(r => selectedCategoryIds.includes(r.id) && r.remoteData);
    if (toRemove.length === 0) {
      alert('No eligible categories selected for removal (only remote categories can be removed).');
      return;
    }

    const confirmRemove = window.confirm(`Are you sure you want to delete the ${toRemove.length} selected categories from the remote DNEXT catalog?`);
    if (!confirmRemove) return;

    addLog(`Bulk Remove: Starting deletion of ${toRemove.length} categories...`);
    setIsDiffing(true); // Disable controls during bulk operation

    for (const row of toRemove) {
      try {
        addLog(`Bulk Remove: Deleting remote category '${row.name}' (${row.id})...`);
        const response = await fetch(`/api/dnext/categories/${encodeURIComponent(row.remoteData.id)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok && response.status !== 204) {
          const data = await response.json();
          throw new Error(data.message || 'Delete operation rejected by remote API');
        }
        addLog(`Bulk Remove: Successfully deleted '${row.name}'`);
      } catch (err) {
        console.error(err);
        addLog(`Bulk Remove Error for '${row.name}': ${err.message}`);
      }
    }

    addLog('Bulk Remove completed.');
    setSelectedCategoryIds([]);
    setIsDiffing(false);
    handleRunDiff();
  };

  const handleExecutePush = async () => {
    if (!pushSelectedCategory || !token) return;

    // Safety Guard 1: Require Parent Category ID from DNEXT if this is a subcategory
    if (pushSelectedCategory.parentId && !resolvedParentUuid) {
      setPushStatus('error');
      setPushError(`Parent category '${pushSelectedCategory.parentId}' does not exist on DNEXT. You must sync the parent category to DNEXT first.`);
      addLog('Push aborted: Remote parent DNEXT Category ID is missing.');
      return;
    }

    setPushStatus('pushing');
    setPushError('');
    addLog(`Initiating category push for: ${pushSelectedCategory.name} (${pushSelectedCategory.id})...`);

    let finalName = pushSelectedCategory.name;
    // Safety Guard 2: Pre-check duplicate name right before posting
    try {
      const verifyData = await fetchAllRemoteCategories(token);
      if (Array.isArray(verifyData)) {
        const duplicateId = verifyData.find(c => c.id === pushSelectedCategory.id);
        if (duplicateId) {
          setPushStatus('error');
          setPushError(`Category with ID '${pushSelectedCategory.id}' already exists on DNEXT (Name: '${duplicateId.name}').`);
          addLog(`Push aborted: Duplicate category ID '${pushSelectedCategory.id}' already exists on DNEXT.`);
          return;
        }

        const duplicateName = verifyData.find(c => c.name.trim().toLowerCase() === pushSelectedCategory.name.trim().toLowerCase());
        if (duplicateName) {
          finalName = `${pushSelectedCategory.name}_${pushSelectedCategory.id}`;
          addLog(`Duplicate name detected. Synced category name rewritten to '${finalName}'.`);
        }
      }
    } catch (err) {
      console.error('Pre-push duplicate check warning:', err);
    }

    const payload = {
      id: pushSelectedCategory.id,
      name: finalName,
      version: customVersion,
      isRoot: !pushSelectedCategory.parentId,
      description: customDescription || finalName,
      lifecycleStatus: 'Launched',
      validFor: {
        startDateTime: new Date(Date.now() + 2 * 60 * 1000).toISOString()
      }
    };

    if (pushSelectedCategory.parentId) {
      payload.parentId = resolvedParentUuid; // Must be the ID field from DNEXT Category
    }

    try {
      const response = await fetch('/api/dnext/categories', {
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
      addLog(`Success: Category '${pushSelectedCategory.name}' created on DNEXT with ID: ${data.id}`);
    } catch (err) {
      console.error(err);
      setPushStatus('error');
      setPushError(err.message);
      addLog(`Push failed: ${err.message}`);
    }
  };

  // Handle Remove / Delete Category from DNEXT
  const handleDeleteCategory = async (category) => {
    if (!token || !category) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete category '${category.name}' (ID: ${category.id}) from the remote DNEXT catalog?`);
    if (!confirmDelete) return;

    addLog(`Deleting remote category '${category.name}' (${category.id}) from DNEXT...`);

    try {
      const response = await fetch(`/api/dnext/categories/${encodeURIComponent(category.id)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok && response.status !== 204) {
        const data = await response.json();
        throw new Error(data.message || `Delete failed with status ${response.status}`);
      }

      addLog(`Success: Category '${category.name}' (${category.id}) deleted from remote DNEXT catalog.`);
      
      // Refresh current views
      fetchRemoteCategories();
      if (activeTab === 'diff') {
        handleRunDiff();
      }
    } catch (err) {
      console.error(err);
      addLog(`Delete failed for category '${category.name}': ${err.message}`);
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', boxSizing: 'border-box', overflowY: 'auto' }}>
      
      {/* Top Credentials Panel */}
      <div className="detail-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0', borderBottom: '1px solid var(--ds-border)', paddingBottom: '12px' }}>
          <span style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: loginStatus === 'connected' ? 'var(--ds-ok)' : loginStatus === 'connecting' ? 'var(--ds-warn)' : 'var(--ds-danger)'
          }} />
          DNEXT Product Catalog API Authentication
        </h3>

        {loginStatus !== 'connected' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: 'var(--ds-text-2)' }}>API Gateway URL</label>
              <input 
                type="text" 
                value={activeEnv.apiUrl || '(default environment)'} 
                disabled 
                style={{ padding: '8px', background: 'var(--ds-surface)', border: '1px solid var(--ds-border)', borderRadius: '4px', color: 'var(--ds-text-3)', width: '220px' }} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: 'var(--ds-text-2)' }}>Keycloak Realm</label>
              <input 
                type="text" 
                value="orbitant-realm" 
                disabled 
                style={{ padding: '8px', background: 'var(--ds-surface)', border: '1px solid var(--ds-border)', borderRadius: '4px', color: 'var(--ds-text-3)', width: '150px' }} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: 'var(--ds-text-2)' }}>Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                style={{ padding: '8px', background: 'var(--ds-surface-subtle)', border: '1px solid var(--ds-border)', borderRadius: '4px', color: 'var(--ds-text)', width: '120px' }} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: 'var(--ds-text-2)' }}>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                style={{ padding: '8px', background: 'var(--ds-surface-subtle)', border: '1px solid var(--ds-border)', borderRadius: '4px', color: 'var(--ds-text)', width: '120px' }} 
              />
            </div>
            <button 
              type="submit" 
              className="action-btn" 
              style={{ height: '34px', background: 'var(--ds-brand)', color: '#fff', border: 'none', borderRadius: '4px', padding: '0 20px', cursor: 'pointer', fontWeight: '600' }}
              disabled={loginStatus === 'connecting'}
            >
              {loginStatus === 'connecting' ? 'Connecting...' : 'Connect to DNEXT'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--ds-text)' }}>
                Connected as <strong style={{ color: 'var(--ds-brand)' }}>{username}</strong> to <code style={{ background: 'var(--ds-surface)', padding: '2px 6px', borderRadius: '3px' }}>orbitant-realm</code>
              </p>
              <span style={{ fontSize: '11px', color: 'var(--ds-text-3)' }}>
                Bearer Token Active (JWT): ...{token.slice(-30)}
              </span>
            </div>
            <button 
              onClick={handleLogout} 
              style={{ background: 'var(--ds-surface-2)', color: 'var(--ds-text)', border: '1px solid var(--ds-border)', borderRadius: '4px', padding: '6px 16px', cursor: 'pointer', fontSize: '12px' }}
            >
              Disconnect
            </button>
          </div>
        )}

        {errorMsg && (
          <div style={{ marginTop: '12px', padding: '8px 12px', background: 'var(--ds-danger-soft)', border: '1px solid var(--ds-danger)', borderRadius: '4px', color: 'var(--ds-danger)', fontSize: '13px' }}>
            <strong>Connection Error:</strong> {errorMsg}
          </div>
        )}
      </div>

      {loginStatus === 'connected' ? (
        <div style={{ display: 'flex', flex: 1, gap: '24px', minHeight: '400px' }}>
          
          {/* Main Dashboard Panel */}
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', background: 'var(--ds-surface-subtle)', border: '1px solid var(--ds-border)', borderRadius: '8px', overflow: 'hidden' }}>
            
            {/* View Mode Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--ds-border)', background: 'rgba(0,0,0,0.2)' }}>
              <button 
                onClick={() => setActiveTab('browse')} 
                style={{ flex: 1, padding: '12px', border: 'none', borderBottom: activeTab === 'browse' ? '2px solid var(--ds-brand)' : 'none', background: 'none', color: activeTab === 'browse' ? 'var(--ds-brand)' : 'var(--ds-text-2)', cursor: 'pointer', fontWeight: '600' }}
              >
                Browse Remote DNEXT Catalog
              </button>
              <button 
                onClick={() => setActiveTab('diff')} 
                style={{ flex: 1, padding: '12px', border: 'none', borderBottom: activeTab === 'diff' ? '2px solid var(--ds-brand)' : 'none', background: 'none', color: activeTab === 'diff' ? 'var(--ds-brand)' : 'var(--ds-text-2)', cursor: 'pointer', fontWeight: '600' }}
              >
                In-Memory Diff (SQLite vs DNEXT)
              </button>
              <button 
                onClick={() => setActiveTab('push')} 
                style={{ flex: 1, padding: '12px', border: 'none', borderBottom: activeTab === 'push' ? '2px solid var(--ds-brand)' : 'none', background: 'none', color: activeTab === 'push' ? 'var(--ds-brand)' : 'var(--ds-text-2)', cursor: 'pointer', fontWeight: '600' }}
                disabled={!pushSelectedCategory}
              >
                Export Category Payload
              </button>
            </div>

            {/* Tab Contents */}
            <div style={{ flex: 1, padding: '20px', boxSizing: 'border-box', overflowY: 'auto' }}>
              
              {/* TAB 1: Browse remote */}
              {activeTab === 'browse' && (
                <div>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <input 
                      type="text" 
                      placeholder="Filter remote by name..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', background: 'var(--ds-surface-subtle)', border: '1px solid var(--ds-border)', borderRadius: '4px', color: 'var(--ds-text)' }}
                      onKeyDown={(e) => e.key === 'Enter' && fetchRemoteCategories()}
                    />
                    <button 
                      onClick={fetchRemoteCategories} 
                      style={{ background: 'var(--ds-surface-2)', color: 'var(--ds-text)', border: '1px solid var(--ds-border)', borderRadius: '4px', padding: '0 20px', cursor: 'pointer' }}
                    >
                      Search
                    </button>
                  </div>

                  {isFetchingRemote ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ds-text-2)' }}>Loading Categories from DNEXT...</div>
                  ) : (
                    <div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--ds-border)', color: 'var(--ds-text-2)' }}>
                            <th style={{ padding: '8px' }}>Category ID</th>
                            <th style={{ padding: '8px' }}>Name</th>
                            <th style={{ padding: '8px' }}>Parent ID</th>
                            <th style={{ padding: '8px' }}>Lifecycle Status</th>
                            <th style={{ padding: '8px' }}>Root Category?</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {remoteCategories.length > 0 ? remoteCategories.map((cat) => (
                            <tr key={cat.id} style={{ borderBottom: '1px solid var(--ds-border)' }}>
                              <td style={{ padding: '8px', fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-text-3)' }}>{cat.id}</td>
                              <td style={{ padding: '8px', color: 'var(--ds-text)', fontWeight: '500' }}>{cat.name}</td>
                              <td style={{ padding: '8px', fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-text-3)' }}>{cat.parentId || '-'}</td>
                              <td style={{ padding: '8px' }}>
                                <span style={{ background: 'var(--ds-ok-soft)', color: 'var(--ds-ok)', padding: '2px 6px', borderRadius: '3px', fontSize: '11px' }}>
                                  {cat.lifecycleStatus || 'Launched'}
                                </span>
                              </td>
                              <td style={{ padding: '8px', color: cat.isRoot ? 'var(--ds-ok)' : 'var(--ds-text-2)' }}>
                                {cat.isRoot ? 'Yes' : 'No'}
                              </td>
                               <td style={{ padding: '8px', textAlign: 'right' }}>
                                  <button 
                                    onClick={() => handleDeleteCategory(cat)}
                                    title="Delete category from DNEXT catalog"
                                    style={{ background: 'var(--ds-danger)', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: '600', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
                                  >
                                    <span style={{ fontSize: '12px' }}><Icon name="trash" size={13} /></span> Remove from DNEXT
                                  </button>
                                </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--ds-text-3)' }}>No categories found in DNEXT catalog.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      {/* Pagination Controls */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid var(--ds-border)', paddingTop: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <label style={{ fontSize: '12px', color: 'var(--ds-text-2)' }}>Items per page:</label>
                          <select 
                            value={limit} 
                            onChange={(e) => { setLimit(Number(e.target.value)); setOffset(0); }} 
                            style={{ background: 'var(--ds-surface)', color: 'var(--ds-text)', border: '1px solid var(--ds-border)', padding: '4px', borderRadius: '4px' }}
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
                            style={{ padding: '6px 12px', background: 'var(--ds-surface-2)', border: '1px solid var(--ds-border)', borderRadius: '4px', color: 'var(--ds-text)', cursor: 'pointer' }}
                          >
                            Previous
                          </button>
                          <button 
                            disabled={remoteCategories.length < limit} 
                            onClick={() => setOffset(offset + limit)}
                            style={{ padding: '6px 12px', background: 'var(--ds-surface-2)', border: '1px solid var(--ds-border)', borderRadius: '4px', color: 'var(--ds-text)', cursor: 'pointer' }}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: In-Memory Diff */}
              {activeTab === 'diff' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <p style={{ margin: '0', fontSize: '13px', color: 'var(--ds-text-2)' }}>
                      <strong style={{ color: 'var(--ds-ok)' }}>1-Way German Catalog Sync Analysis:</strong> Evaluates all German Catalog categories (SQLite) against DNEXT. <strong style={{ color: 'var(--ds-text)' }}>Local SQLite data is untouched.</strong>
                    </p>
                    <button 
                      onClick={handleRunDiff} 
                      disabled={isDiffing}
                      style={{ background: 'var(--ds-brand)', color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 16px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      {isDiffing ? 'Comparing...' : 'Run 1-Way Comparison'}
                    </button>
                  </div>

                  {/* Bulk Operations Bar */}
                  {selectedCategoryIds.length > 0 && (
                    <div style={{ background: 'var(--ds-surface-subtle)', border: '1px solid var(--ds-border)', borderRadius: '4px', padding: '10px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--ds-text)' }}>
                        Selected <strong>{selectedCategoryIds.length}</strong> items:
                      </span>
                      <button 
                        onClick={handleBulkSyncSelected}
                        style={{ padding: '6px 12px', background: 'var(--ds-ok)', border: 'none', color: '#fff', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        <Icon name="zap" size={14} /> Bulk Sync Selected
                      </button>
                      <button 
                        onClick={handleBulkRemoveSelected}
                        style={{ padding: '6px 12px', background: 'var(--ds-danger)', border: 'none', color: '#fff', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        <Icon name="trash" size={14} /> Bulk Remove Selected
                      </button>
                    </div>
                  )}

                  {isDiffing ? (
                    <div style={{ textAlignment: 'center', padding: '40px 0', color: 'var(--ds-text-2)' }}>Analyzing datasets...</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--ds-border)', color: 'var(--ds-text-2)' }}>
                          <th style={{ padding: '8px', width: '40px' }}>
                            <input 
                              type="checkbox" 
                              checked={diffResults.length > 0 && selectedCategoryIds.length === diffResults.length}
                              onChange={handleToggleSelectAll}
                              style={{ cursor: 'pointer' }}
                            />
                          </th>
                          <th style={{ padding: '8px' }}>Category ID</th>
                          <th style={{ padding: '8px' }}>Category Name</th>
                          <th style={{ padding: '8px' }}>Parent ID</th>
                          <th style={{ padding: '8px' }}>Alignment State</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {diffResults.length > 0 ? diffResults.map((row) => (
                          <tr key={row.id} style={{ borderBottom: '1px solid var(--ds-border)', transition: 'background 0.2s' }}>
                            <td style={{ padding: '8px', width: '40px' }}>
                              <input 
                                type="checkbox" 
                                checked={selectedCategoryIds.includes(row.id)}
                                onChange={() => handleToggleSelectCategory(row.id)}
                                style={{ cursor: 'pointer' }}
                              />
                            </td>
                            <td 
                              style={{ padding: '8px', fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-info)', cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => {
                                if (onNavigateToDetails) onNavigateToDetails(row.id);
                                setSelectedDiffCategory(row);
                              }}
                              title="Click to open category detail view"
                            >
                              {row.id}
                            </td>
                            <td 
                              style={{ padding: '8px', color: 'var(--ds-text)', fontWeight: '500', cursor: 'pointer' }}
                              onClick={() => {
                                if (onNavigateToDetails) onNavigateToDetails(row.id);
                                setSelectedDiffCategory(row);
                              }}
                              title="Click to open category detail view"
                            >
                              <span style={{ color: 'var(--ds-info)', textDecoration: 'underline' }}>{row.name}</span> <Icon name="search" size={14} /> 
                            </td>
                            <td style={{ padding: '8px', fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-text-3)' }}>{row.parentId || '-'}</td>
                            <td style={{ padding: '8px' }}>
                              <span style={{ 
                                padding: '2px 8px', 
                                borderRadius: '4px', 
                                fontSize: '11px',
                                fontWeight: '600',
                                background: 
                                  row.status === 'Synced' ? 'var(--ds-ok-soft)' :
                                  row.status === 'Mismatched' ? 'rgba(255, 152, 0, 0.1)' :
                                  row.status === 'Local Only' ? 'rgba(33, 150, 243, 0.1)' :
                                  'rgba(158, 158, 158, 0.15)',
                                color:
                                  row.status === 'Synced' ? 'var(--ds-ok)' :
                                  row.status === 'Mismatched' ? 'var(--ds-warn)' :
                                  row.status === 'Local Only' ? 'var(--ds-info)' :
                                  '#9e9e9e'
                              }}>
                                {row.status}
                              </span>
                            </td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>
                              {row.status === 'Local Only' && (
                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                  <button 
                                    onClick={() => handleSilentSyncCategory(row.localData)}
                                    disabled={silentSyncingId === row.id}
                                    style={{ padding: '4px 8px', fontSize: '11px', background: 'var(--ds-ok)', border: 'none', color: '#fff', fontWeight: 'bold', borderRadius: '3px', cursor: silentSyncingId === row.id ? 'not-allowed' : 'pointer' }}
                                  >
                                    {silentSyncingId === row.id ? 'Syncing...' : 'Sync Category'}
                                  </button>
                                  <button 
                                    onClick={() => handleInitiatePush(row.localData)}
                                    className="action-btn"
                                    style={{ padding: '4px 8px', fontSize: '11px', background: 'var(--ds-brand)', border: 'none', color: '#fff', borderRadius: '3px', cursor: 'pointer' }}
                                  >
                                    Push (Debug)
                                  </button>
                                </div>
                              )}
                              {row.status === 'Mismatched' && (
                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                  <button 
                                    onClick={() => handleSilentSyncCategory(row.localData)}
                                    disabled={silentSyncingId === row.id}
                                    style={{ padding: '4px 8px', fontSize: '11px', background: 'var(--ds-ok)', border: 'none', color: '#fff', fontWeight: 'bold', borderRadius: '3px', cursor: silentSyncingId === row.id ? 'not-allowed' : 'pointer' }}
                                  >
                                    {silentSyncingId === row.id ? 'Syncing...' : 'Sync Category'}
                                  </button>
                                  <button 
                                    onClick={() => handleInitiatePush(row.localData)}
                                    className="action-btn"
                                    style={{ padding: '4px 8px', fontSize: '11px', background: 'var(--ds-warn)', border: 'none', color: 'var(--ds-text)', borderRadius: '3px', cursor: 'pointer' }}
                                  >
                                    Resolve (Debug)
                                  </button>
                                </div>
                              )}
                               {row.remoteData && (
                                  <button 
                                    onClick={() => handleDeleteCategory(row.remoteData)}
                                    title="Delete category from DNEXT catalog"
                                    style={{ marginLeft: '6px', background: 'var(--ds-danger)', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: '600', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
                                  >
                                    <span style={{ fontSize: '12px' }}><Icon name="trash" size={13} /></span> Remove
                                  </button>
                                )}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--ds-text-3)' }}>No entries found. Refresh comparison to inspect datasets.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* TAB 3: Push payload preview & submit */}
              {activeTab === 'push' && pushSelectedCategory && (
                <div>
                  <h4 style={{ margin: '0 0 16px 0', color: 'var(--ds-text)' }}>Export Category to DNEXT (TMF 620 CategoryCreate)</h4>
                  
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--ds-text-2)' }}>Category ID (Local PK)</label>
                        <input 
                          type="text" 
                          value={pushSelectedCategory.id} 
                          disabled 
                          style={{ padding: '8px', background: 'var(--ds-surface)', border: '1px solid var(--ds-border)', borderRadius: '4px', color: 'var(--ds-text-3)' }} 
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--ds-text-2)' }}>Category Name</label>
                        <input 
                          type="text" 
                          value={pushSelectedCategory.name} 
                          disabled 
                          style={{ padding: '8px', background: 'var(--ds-surface)', border: '1px solid var(--ds-border)', borderRadius: '4px', color: 'var(--ds-text-3)' }} 
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--ds-text-2)' }}>Description</label>
                        <input 
                          type="text" 
                          value={customDescription} 
                          onChange={(e) => setCustomDescription(e.target.value)} 
                          style={{ padding: '8px', background: 'var(--ds-surface-subtle)', border: '1px solid var(--ds-border)', borderRadius: '4px', color: 'var(--ds-text)' }} 
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--ds-text-2)' }}>Version</label>
                        <input 
                          type="text" 
                          value={customVersion} 
                          onChange={(e) => setCustomVersion(e.target.value)} 
                          style={{ padding: '8px', background: 'var(--ds-surface-subtle)', border: '1px solid var(--ds-border)', borderRadius: '4px', color: 'var(--ds-text)', width: '80px' }} 
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--ds-text-2)' }}>Hierarchy Level</label>
                        <span style={{ fontSize: '13px', color: 'var(--ds-text)' }}>
                          {pushSelectedCategory.parentId ? (
                            <div>
                              Local Parent: <strong>{pushSelectedCategory.parentId}</strong>
                              <div style={{ fontSize: '11px', marginTop: '4px', color: parentResolutionStatus === 'resolved' ? 'var(--ds-ok)' : parentResolutionStatus === 'resolving' ? 'var(--ds-warn)' : 'var(--ds-danger)' }}>
                                {parentResolutionStatus === 'resolving' && 'Resolving remote UUID parent...'}
                                {parentResolutionStatus === 'resolved' && `Resolved remote parent UUID: ${resolvedParentUuid}`}
                                {parentResolutionStatus === 'failed' && '✗ Remote parent not found. Please sync the parent category first.'}
                              </div>
                            </div>
                          ) : 'Root Category'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        <button 
                          onClick={handleExecutePush} 
                          disabled={pushStatus === 'pushing' || (pushSelectedCategory.parentId && !resolvedParentUuid)}
                          style={{ background: 'var(--ds-brand)', color: '#fff', border: 'none', borderRadius: '4px', padding: '10px 24px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          {pushStatus === 'pushing' ? 'Pushing Category...' : 'Confirm and Push Category'}
                        </button>
                        <button 
                          onClick={() => setActiveTab('diff')} 
                          style={{ background: 'var(--ds-surface-2)', color: 'var(--ds-text)', border: '1px solid var(--ds-border)', borderRadius: '4px', padding: '10px 24px', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>

                      {pushStatus === 'success' && (
                        <div style={{ padding: '12px', background: 'var(--ds-ok-soft)', border: '1px solid var(--ds-ok)', borderRadius: '4px', color: 'var(--ds-ok)', fontSize: '13px' }}>
                          Category successfully pushed to remote catalog!
                        </div>
                      )}

                      {pushStatus === 'error' && (
                        <div style={{ padding: '12px', background: 'var(--ds-danger-soft)', border: '1px solid var(--ds-danger)', borderRadius: '4px', color: 'var(--ds-danger)', fontSize: '13px' }}>
                          <strong>Push Failed:</strong> {pushError}
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--ds-text-2)' }}>TMF 620 POST JSON Payload Preview</label>
                      <pre style={{ margin: '0', padding: '16px', background: 'var(--ds-surface-subtle)', border: '1px solid var(--ds-border)', borderRadius: '4px', color: 'var(--ds-ok)', fontSize: '12px', fontFamily: 'var(--ds-font-mono)', overflowX: 'auto', flex: 1 }}>
{JSON.stringify({
  id: pushSelectedCategory.id,
  name: pushSelectedCategory.name,
  version: customVersion,
  isRoot: !pushSelectedCategory.parentId,
  description: customDescription || pushSelectedCategory.name,
  lifecycleStatus: "Launched",
  validFor: {
    startDateTime: new Date(Date.now() + 2 * 60 * 1000).toISOString()
  },
  ...(pushSelectedCategory.parentId ? { parentId: resolvedParentUuid || "PARENT_ID_NOT_FOUND_ON_DNEXT" } : {})
}, null, 4)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Activity logs & Sync History on the right */}
          <div style={{ flex: 1, flexBasis: '280px', display: 'flex', flexDirection: 'column', background: 'var(--ds-surface-subtle)', border: '1px solid var(--ds-border)', borderRadius: '8px', padding: '16px', boxSizing: 'border-box' }}>
            <h4 style={{ margin: '0 0 12px 0', borderBottom: '1px solid var(--ds-border)', paddingBottom: '8px', color: 'var(--ds-text)' }}>Sync Activity Log</h4>
            <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'var(--ds-font-mono)', fontSize: '11px', color: 'var(--ds-text-2)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {logs.length > 0 ? logs.map((log, index) => (
                <div key={index} style={{ borderBottom: '1px dashed var(--ds-border)', paddingBottom: '4px', lineBreak: 'anywhere' }}>
                  {log}
                </div>
              )) : (
                <div style={{ color: 'var(--ds-text-3)', textAlign: 'center', padding: '20px 0' }}>Log history is currently empty.</div>
              )}
            </div>
            <button 
              onClick={() => setLogs([])} 
              style={{ marginTop: '12px', background: 'var(--ds-surface)', border: '1px solid var(--ds-border)', color: 'var(--ds-text-2)', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '11px' }}
            >
              Clear Logs
            </button>
          </div>
        </div>
      ) : (
        <div className="display-placeholder" style={{ flex: 1, border: '1px dashed var(--ds-border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
          <svg style={{ width: '48px', height: '48px', color: 'var(--ds-text-3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 style={{ margin: '0', color: 'var(--ds-text-3)' }}>Authentication Required</h3>
          <p style={{ margin: '0', color: 'var(--ds-text-3)', fontSize: '13px' }}>Please connect using Keycloak username and password credentials above.</p>
        </div>
      )}
    </div>
  );
}
