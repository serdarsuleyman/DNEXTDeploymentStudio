const { AsyncLocalStorage } = require('async_hooks');
const fs = require('fs');
const path = require('path');
const { getCatalogCache, setCatalogCache } = require('./db');

const asyncLocalStorage = new AsyncLocalStorage();
const logFilePath = path.join(__dirname, '..', 'logs', 'dnext_api_proxy.log');
const configFilePath = path.join(__dirname, '..', 'config.json');

// Ensure logs directory exists
const logDir = path.dirname(logFilePath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Clear or init log file
if (!fs.existsSync(logFilePath)) {
  fs.writeFileSync(logFilePath, '', 'utf8');
}

/**
 * Read configured environments from config.json
 */
function getConfigEnvironments() {
  try {
    if (fs.existsSync(configFilePath)) {
      const raw = fs.readFileSync(configFilePath, 'utf8');
      const cfg = JSON.parse(raw);
      if (Array.isArray(cfg.environments) && cfg.environments.length > 0) {
        return cfg.environments;
      }
    }
  } catch (err) {
    console.error('[dnextClient] Error reading config.json:', err.message);
  }
  return [];
}

/**
 * Get active or default environment
 */
function getActiveEnvironment(envName, apiUrl) {
  const envs = getConfigEnvironments();
  if (apiUrl) {
    const cleanApi = apiUrl.trim().toLowerCase().replace(/\/+$/, '');
    const found = envs.find(e => e.apiUrl && e.apiUrl.toLowerCase().replace(/\/+$/, '') === cleanApi);
    if (found) return found;
  }
  if (envName) {
    const cleanName = envName.trim().toLowerCase();
    // 1. Exact name match
    let found = envs.find(e => e.name && e.name.toLowerCase() === cleanName);
    if (found) return found;

    // 2. Keyword matching for test vs dev
    if (cleanName.includes('test')) {
      found = envs.find(e => (e.name && e.name.toLowerCase().includes('test')) || (e.apiUrl && e.apiUrl.toLowerCase().includes('test')));
      if (found) return found;
    }
    if (cleanName.includes('dev')) {
      found = envs.find(e => (e.name && e.name.toLowerCase().includes('dev')) || (e.apiUrl && e.apiUrl.toLowerCase().includes('dev')));
      if (found) return found;
    }

    // 3. Substring matching
    found = envs.find(e => e.name && (e.name.toLowerCase().includes(cleanName) || cleanName.includes(e.name.toLowerCase())));
    if (found) return found;
  }
  const defaultEnv = envs.find(e => e.is_default) || envs[0];
  if (defaultEnv) return defaultEnv;
  return {
    name: 'test',
    apiUrl: 'https://dpc-api.test-gcu.com',
    authUrl: 'https://diam.test-gcu.com/realms/orbitant-realm/protocol/openid-connect/token'
  };
}

/**
 * Middleware to capture environment headers from frontend and attach to current execution context
 */
function dnextEnvMiddleware(req, res, next) {
  const headerApiUrl = req.headers['x-dnext-api-url'];
  const headerAuthUrl = req.headers['x-dnext-auth-url'];
  const headerEnvName = req.headers['x-dnext-env-name'];

  const resolvedEnv = getActiveEnvironment(headerEnvName, headerApiUrl);

  const dnextApiUrl = (headerApiUrl && headerApiUrl.trim()) ? headerApiUrl.trim().replace(/\/+$/, '') : (resolvedEnv.apiUrl || '').replace(/\/+$/, '');
  const dnextAuthUrl = (headerAuthUrl && headerAuthUrl.trim()) ? headerAuthUrl.trim() : resolvedEnv.authUrl;
  const dnextEnvName = headerEnvName || resolvedEnv.name || 'default';
  const dnextUsername = req.headers['x-dnext-username'] || resolvedEnv.username || process.env.DNEXT_USERNAME || '';
  const dnextPassword = req.headers['x-dnext-password'] || resolvedEnv.password || process.env.DNEXT_PASSWORD || '';

  asyncLocalStorage.run({ dnextApiUrl, dnextAuthUrl, dnextEnvName, dnextUsername, dnextPassword }, () => {
    next();
  });
}

const tokenCache = new Map();

/**
 * Fetch or get cached OAuth token for an environment
 */
async function getAutoToken(envName, apiUrl, authUrl, forceRefresh = false) {
  const store = asyncLocalStorage.getStore();
  const env = getActiveEnvironment(envName || store?.dnextEnvName, apiUrl || store?.dnextApiUrl);
  const finalAuthUrl = (authUrl && authUrl.trim()) || store?.dnextAuthUrl || env.authUrl;
  const username = store?.dnextUsername || env.username || process.env.DNEXT_USERNAME;
  const password = store?.dnextPassword || env.password || process.env.DNEXT_PASSWORD;

  if (!username || !password || !finalAuthUrl) {
    return null;
  }

  const cacheKey = `${finalAuthUrl}:${username}`;

  if (!forceRefresh) {
    const cached = tokenCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now() + 30000) {
      return cached.token;
    }
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', 'orbitant-ui-client');
    params.append('username', username);
    params.append('password', password);
    params.append('scope', 'openid');

    const response = await fetch(finalAuthUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[dnextClient] Auto token fetch failed (${response.status}):`, errText.slice(0, 120));
      return null;
    }

    const data = await response.json();
    const expiresInSec = data.expires_in || 300;
    tokenCache.set(cacheKey, {
      token: data.access_token,
      expiresAt: Date.now() + (expiresInSec * 1000)
    });
    console.log(`[dnextClient] Acquired fresh token for ${username} at ${finalAuthUrl}`);
    return data.access_token;
  } catch (err) {
    console.warn('[dnextClient] Auto token fetch exception:', err.message);
    return null;
  }
}

/**
 * Helper to get currently active API base URL
 */
function getCurrentApiUrl() {
  const store = asyncLocalStorage.getStore();
  if (store && store.dnextApiUrl) {
    return store.dnextApiUrl;
  }
  const env = getActiveEnvironment();
  return env.apiUrl.replace(/\/+$/, '');
}

/**
 * Helper to get currently active Auth token URL
 */
function getCurrentAuthUrl() {
  const store = asyncLocalStorage.getStore();
  if (store && store.dnextAuthUrl) {
    return store.dnextAuthUrl;
  }
  const env = getActiveEnvironment();
  return env.authUrl;
}

/**
 * Centralized fetch proxy that rewrites URLs according to the active environment
 */
async function dnextFetch(urlOrPath, options = {}) {
  const store = asyncLocalStorage.getStore();
  const baseApiUrl = (store?.dnextApiUrl || getCurrentApiUrl()).replace(/\/+$/, '');
  const baseAuthUrl = store?.dnextAuthUrl || getCurrentAuthUrl();

  let finalUrl = urlOrPath;

  if (typeof urlOrPath === 'string') {
    if (urlOrPath.startsWith('/')) {
      finalUrl = `${baseApiUrl}${urlOrPath}`;
    } else if (urlOrPath.includes('/api/productCatalogManagement/')) {
      const idx = urlOrPath.indexOf('/api/productCatalogManagement/');
      finalUrl = `${baseApiUrl}${urlOrPath.substring(idx)}`;
    } else if (urlOrPath.includes('openid-connect/token')) {
      finalUrl = baseAuthUrl;
    }
  }

  const method = options.method || 'GET';
  const requestHeaders = options.headers || {};
  const requestBody = options.body || null;

  console.log(`[DNEXT Proxy] [${method}] Target: ${finalUrl} (Env: ${store?.dnextEnvName || 'active'})`);

  // Mask sensitive headers in log (like Authorization)
  const cleanRequestHeaders = { ...requestHeaders };
  if (cleanRequestHeaders.authorization) cleanRequestHeaders.authorization = 'Bearer ***MASKED***';
  if (cleanRequestHeaders.Authorization) cleanRequestHeaders.Authorization = 'Bearer ***MASKED***';

  let reqBodyParsed = null;
  if (requestBody) {
    try {
      reqBodyParsed = JSON.parse(requestBody);
    } catch {
      reqBodyParsed = requestBody;
    }
  }

  try {
    const response = await fetch(finalUrl, options);
    return response;
  } catch (error) {
    const logEntryErr = {
      timestamp: new Date().toISOString(),
      event: 'error',
      method,
      url: typeof finalUrl === 'object' ? finalUrl.toString() : finalUrl,
      requestHeaders: cleanRequestHeaders,
      requestBody: reqBodyParsed,
      error: error.message
    };

    fs.appendFile(logFilePath, JSON.stringify(logEntryErr) + '\n', (err) => {
      if (err) console.error('[DNEXT Proxy] Failed to log error:', err);
    });

    throw error;
  }
}

/**
 * Query a DNEXT collection endpoint with multi-lifecycle support and parallel pagination.
 *
 * @param {string} endpointPath - e.g. '/api/productCatalogManagement/v4/productOfferingPrice'
 * @param {object} query - Express req.query
 * @param {string} authHeader - req.headers.authorization
 * @returns {Promise<{ items: Array, totalCount: number }>}
 */
async function fetchPaginatedDnextCollection(endpointPath, query = {}, authHeader) {
  const store = asyncLocalStorage.getStore();
  const envName = (store?.dnextEnvName || 'default').toLowerCase();

  const isForceRefresh = query.refresh === 'true' || query.refresh === true || String(query.refresh) === '1';

  // Build clean cache key (excluding cache control / cachebuster parameters)
  const cacheQueryParams = { ...query };
  delete cacheQueryParams.refresh;
  delete cacheQueryParams._t;
  delete cacheQueryParams.nocache;
  const sortedQueryKeys = Object.keys(cacheQueryParams).sort();
  const sortedQueryStr = sortedQueryKeys.map(k => `${k}=${cacheQueryParams[k]}`).join('&');
  const cacheKey = `${envName}:${endpointPath}:${sortedQueryStr}`;

  // Check persistent SQLite cache if not forcing refresh
  if (!isForceRefresh) {
    let cached = await getCatalogCache(cacheKey);
    // Resilient fallback: If cache miss on 'test' or 'default', try 'dpc_ui.test-g' where cached entities are stored
    if ((!cached || !cached.payload) && (envName === 'test' || envName === 'default')) {
      const altKey = `dpc_ui.test-g:${endpointPath}:${sortedQueryStr}`;
      cached = await getCatalogCache(altKey);
    } else if ((!cached || !cached.payload) && envName === 'dpc_ui.test-g') {
      const altKey = `test:${endpointPath}:${sortedQueryStr}`;
      cached = await getCatalogCache(altKey);
    }
    if (cached && cached.payload) {
      try {
        const cachedItems = JSON.parse(cached.payload);
        console.log(`[dnextClient] Cache HIT for ${cacheKey} (${cachedItems.length} items, cached: ${cached.updated_at})`);
        return {
          items: cachedItems,
          totalCount: cached.total_count,
          refreshedToken: null,
          fromCache: true,
          cachedAt: cached.updated_at
        };
      } catch (parseErr) {
        console.warn(`[dnextClient] Error parsing cached payload for ${cacheKey}:`, parseErr.message);
      }
    }
  }

  console.log(`[dnextClient] Cache ${isForceRefresh ? 'REFRESH' : 'MISS'} for ${cacheKey}. Querying DNEXT gateway...`);

  let effectiveAuth = authHeader;
  let refreshedToken = null;

  // Auto-acquire token if missing or empty
  if (!effectiveAuth || effectiveAuth === 'Bearer' || effectiveAuth === 'Bearer null' || effectiveAuth === 'Bearer undefined') {
    const token = await getAutoToken(store?.dnextEnvName, store?.dnextApiUrl, store?.dnextAuthUrl);
    if (token) {
      effectiveAuth = `Bearer ${token}`;
      refreshedToken = token;
    }
  }

  const queryParams = { ...query };
  delete queryParams.refresh;
  delete queryParams._t;
  delete queryParams.nocache;

  // Multi-lifecycle support: include all lifecycles unless caller explicitly requested one
  if (!queryParams.lifecycleStatus) {
    queryParams.lifecycleStatus = 'Launched,In test,In study,Retired,Obsolete';
  }

  const requestedLimit = queryParams.limit ? parseInt(queryParams.limit, 10) : 1000;
  const initialLimit = Math.min(requestedLimit, 100);

  const baseApiUrl = (store?.dnextApiUrl || getCurrentApiUrl()).replace(/\/+$/, '');
  const url = new URL(`${baseApiUrl}${endpointPath}`);

  Object.keys(queryParams).forEach(key => {
    if (key !== 'limit' && key !== 'offset') {
      url.searchParams.append(key, queryParams[key]);
    }
  });

  // Fetch page 0
  const page0Url = new URL(url.toString());
  page0Url.searchParams.set('limit', String(initialLimit));
  page0Url.searchParams.set('offset', String(queryParams.offset || 0));

  let page0Res = await dnextFetch(page0Url.toString(), {
    method: 'GET',
    headers: {
      ...(effectiveAuth ? { 'Authorization': effectiveAuth } : {}),
      'Accept': 'application/json'
    }
  });

  // If 401 Unauthorized, token might be expired -> force refresh token and retry
  if (page0Res.status === 401) {
    console.log(`[dnextClient] Got 401 on ${endpointPath}, refreshing token...`);
    const fresh = await getAutoToken(store?.dnextEnvName, store?.dnextApiUrl, store?.dnextAuthUrl, true);
    if (fresh) {
      effectiveAuth = `Bearer ${fresh}`;
      refreshedToken = fresh;
      page0Res = await dnextFetch(page0Url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': effectiveAuth,
          'Accept': 'application/json'
        }
      });
    }
  }

  if (!page0Res.ok) {
    const errorData = await page0Res.json().catch(() => ({}));
    const err = new Error(errorData.message || errorData.reason || `DNEXT responded with ${page0Res.status}`);
    err.status = page0Res.status;
    err.data = errorData;
    throw err;
  }

  const page0Items = await page0Res.json();
  if (!Array.isArray(page0Items)) {
    return { items: page0Items, totalCount: 1, refreshedToken, fromCache: false, cachedAt: new Date().toISOString() };
  }

  const totalCountHeader = page0Res.headers.get('x-total-count');
  const totalCount = totalCountHeader ? parseInt(totalCountHeader, 10) : page0Items.length;

  // If caller only asked for <= 100, or totalCount <= 100, or specific offset requested
  if (requestedLimit <= 100 || totalCount <= 100 || queryParams.offset !== undefined) {
    await setCatalogCache(cacheKey, envName, endpointPath, page0Items, totalCount);
    return { items: page0Items, totalCount, refreshedToken, fromCache: false, cachedAt: new Date().toISOString() };
  }

  // Parallel pagination to fetch remaining records up to requestedLimit
  const maxToFetch = Math.min(requestedLimit, totalCount);
  const remainingOffsets = [];
  for (let offset = 100; offset < maxToFetch; offset += 100) {
    remainingOffsets.push(offset);
  }

  const allItems = [...page0Items];

  if (remainingOffsets.length > 0) {
    const pagePromises = remainingOffsets.map(async (offset) => {
      const pageUrl = new URL(url.toString());
      pageUrl.searchParams.set('limit', '100');
      pageUrl.searchParams.set('offset', String(offset));

      try {
        const res = await dnextFetch(pageUrl.toString(), {
          method: 'GET',
          headers: {
            ...(effectiveAuth ? { 'Authorization': effectiveAuth } : {}),
            'Accept': 'application/json'
          }
        });
        if (res.ok) {
          const pageData = await res.json();
          if (Array.isArray(pageData)) {
            return pageData;
          }
        }
      } catch (err) {
        console.warn(`[fetchPaginatedDnextCollection] Error fetching offset ${offset}:`, err.message);
      }
      return [];
    });

    const results = await Promise.all(pagePromises);
    results.forEach(items => {
      allItems.push(...items);
    });
  }

  // Save to persistent SQLite cache
  await setCatalogCache(cacheKey, envName, endpointPath, allItems, totalCount);

  return { items: allItems, totalCount, refreshedToken, fromCache: false, cachedAt: new Date().toISOString() };
}

module.exports = {
  dnextEnvMiddleware,
  dnextFetch,
  fetchPaginatedDnextCollection,
  getActiveEnvironment,
  getCurrentApiUrl,
  getCurrentAuthUrl,
  getAutoToken,
  logFilePath
};
