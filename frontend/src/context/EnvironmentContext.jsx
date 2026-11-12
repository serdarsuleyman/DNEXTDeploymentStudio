import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/*
 * EnvironmentContext — single source of truth for the active DNEXT target environment.
 *
 * - Loads environments from /api/dnext/environments
 * - Persists the selection in localStorage (same keys the legacy views read:
 *   dnext_env_name, dnext_api_url, dnext_auth_url) so existing components keep working
 * - Exposes helpers to select / save environments
 * - Owns the shared auth state (token + login status) so every view and the header agree
 */

const EnvironmentContext = createContext(null);

const LS = {
  envName: 'dnext_env_name',
  apiUrl: 'dnext_api_url',
  authUrl: 'dnext_auth_url',
  token: 'dnext_token',
};

export function getStoredEnvironment() {
  return {
    name: localStorage.getItem(LS.envName) || '',
    apiUrl: localStorage.getItem(LS.apiUrl) || '',
    authUrl: localStorage.getItem(LS.authUrl) || '',
  };
}

function persistEnvironment(env) {
  if (!env) return;
  localStorage.setItem(LS.envName, env.name);
  if (env.apiUrl || env.url) localStorage.setItem(LS.apiUrl, env.apiUrl || env.url);
  else localStorage.removeItem(LS.apiUrl);
  if (env.authUrl) localStorage.setItem(LS.authUrl, env.authUrl);
  else localStorage.removeItem(LS.authUrl);
}

export function EnvironmentProvider({ children }) {
  const [environments, setEnvironments] = useState([]);
  const [selectedEnv, setSelectedEnv] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Shared DNEXT auth state (token is persisted under the legacy 'dnext_token' key)
  const [token, setTokenState] = useState(() => localStorage.getItem(LS.token) || '');
  const [loginStatus, setLoginStatus] = useState(() => (localStorage.getItem(LS.token) ? 'connected' : 'disconnected'));

  const [authUser, setAuthUser] = useState(() => localStorage.getItem('dnext_username') || '');
  const [authError, setAuthError] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginTargetEnv, setLoginTargetEnv] = useState(null);

  const openLoginModal = useCallback((target = null) => {
    setLoginTargetEnv(target || null);
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
    setLoginTargetEnv(null);
  }, []);

  const setToken = useCallback((next) => {
    setTokenState(prev => {
      const value = typeof next === 'function' ? next(prev) : next;
      if (value) localStorage.setItem(LS.token, value);
      else localStorage.removeItem(LS.token);
      return value || '';
    });
  }, []);

  const refreshEnvironments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dnext/environments');
      const data = await res.json();
      if (Array.isArray(data)) {
        setEnvironments(data);
        setSelectedEnv(prev => {
          if (prev) return data.find(e => e.name === prev.name) || prev;
          const saved = localStorage.getItem(LS.envName);
          const matched = data.find(e => e.name === saved) || data[0] || null;
          if (matched) persistEnvironment(matched);
          return matched;
        });
        setLoadError('');
      }
    } catch (err) {
      console.error('Error fetching environments:', err);
      setLoadError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshEnvironments();
  }, [refreshEnvironments]);

  const selectEnvironment = useCallback((env) => {
    if (!env) return;
    setSelectedEnv(prev => {
      // Switching environment invalidates the token issued by the previous realm
      if (prev && prev.name !== env.name) {
        localStorage.removeItem(LS.token);
        setTokenState('');
        setLoginStatus('disconnected');
      }
      return env;
    });
    persistEnvironment(env);
  }, []);

  const saveEnvironment = useCallback(async ({ name, url }) => {
    const res = await fetch('/api/dnext/environments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save environment');
    const list = data.environments || [];
    setEnvironments(list);
    const created = list.find(x => x.name === name);
    if (created) selectEnvironment(created);
    return created;
  }, [selectEnvironment]);

  // Keep the latest selection reachable from stable callbacks
  const selectedEnvRef = useRef(selectedEnv);
  useEffect(() => { selectedEnvRef.current = selectedEnv; }, [selectedEnv]);

  /*
   * Authenticate against the (given or active) environment via the backend Keycloak proxy.
   * Omitted credentials fall back to the ones configured for the environment on the server.
   * Resolves { token, username, data }; throws on failure (status is set to 'error').
   */
  const connect = useCallback(async ({ username, password, env } = {}) => {
    const target = env || selectedEnvRef.current;
    setLoginStatus('connecting');
    setAuthError('');
    try {
      const res = await fetch('/api/dnext/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username || undefined,
          password: password || undefined,
          envName: target?.name,
          apiUrl: target?.apiUrl || target?.url || undefined,
          authUrl: target?.authUrl || undefined,
        }),
      });
      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned non-JSON response (${res.status}): ${text.slice(0, 120)}`);
      }
      if (!res.ok) throw new Error(data.error_description || data.error || `Authentication failed (${res.status})`);

      const user = data.username || username || '';
      setToken(data.access_token);
      setAuthUser(user);
      localStorage.setItem('dnext_username', user);
      // Persist the URLs the server actually resolved for this environment
      if (data.apiUrl) localStorage.setItem(LS.apiUrl, data.apiUrl);
      if (data.authUrl) localStorage.setItem(LS.authUrl, data.authUrl);
      setLoginStatus('connected');
      return { token: data.access_token, username: user, data };
    } catch (err) {
      setLoginStatus('error');
      setAuthError(err.message);
      throw err;
    }
  }, [setToken]);

  const disconnect = useCallback(() => {
    setToken('');
    setLoginStatus('disconnected');
    setAuthError('');
  }, [setToken]);

  const activeApiUrl = selectedEnv?.apiUrl || selectedEnv?.url || '';

  const value = useMemo(() => ({
    environments,
    selectedEnv,
    activeApiUrl,
    isLoading,
    loadError,
    selectEnvironment,
    saveEnvironment,
    refreshEnvironments,
    token,
    setToken,
    loginStatus,
    setLoginStatus,
    authUser,
    authError,
    connect,
    disconnect,
    isLoginModalOpen,
    openLoginModal,
    closeLoginModal,
    loginTargetEnv,
  }), [environments, selectedEnv, activeApiUrl, isLoading, loadError, selectEnvironment, saveEnvironment, refreshEnvironments, token, setToken, loginStatus, authUser, authError, connect, disconnect, isLoginModalOpen, openLoginModal, closeLoginModal, loginTargetEnv]);

  return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>;
}

/* Shared DNEXT authentication state and actions. */
export function useAuth() {
  const { token, setToken, loginStatus, setLoginStatus, authUser, authError, connect, disconnect, isLoginModalOpen, openLoginModal, closeLoginModal, loginTargetEnv } = useEnvironment();
  return { token, setToken, loginStatus, setLoginStatus, authUser, authError, connect, disconnect, isLoginModalOpen, openLoginModal, closeLoginModal, loginTargetEnv };
}

export function useEnvironment() {
  const ctx = useContext(EnvironmentContext);
  if (!ctx) throw new Error('useEnvironment must be used inside <EnvironmentProvider>');
  return ctx;
}
