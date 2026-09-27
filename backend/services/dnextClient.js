const { AsyncLocalStorage } = require('async_hooks');
const fs = require('fs');
const path = require('path');

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
    const found = envs.find(e => e.apiUrl && e.apiUrl.toLowerCase() === apiUrl.toLowerCase());
    if (found) return found;
  }
  if (envName) {
    const found = envs.find(e => e.name && e.name.toLowerCase() === envName.toLowerCase());
    if (found) return found;
  }
  const defaultEnv = envs.find(e => e.is_default) || envs[0];
  if (defaultEnv) return defaultEnv;
  return {
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

  const dnextApiUrl = (headerApiUrl && headerApiUrl.trim()) ? headerApiUrl.trim().replace(/\/+$/, '') : resolvedEnv.apiUrl.replace(/\/+$/, '');
  const dnextAuthUrl = (headerAuthUrl && headerAuthUrl.trim()) ? headerAuthUrl.trim() : resolvedEnv.authUrl;
  const dnextEnvName = headerEnvName || resolvedEnv.name || 'default';

  asyncLocalStorage.run({ dnextApiUrl, dnextAuthUrl, dnextEnvName }, () => {
    next();
  });
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

module.exports = {
  dnextEnvMiddleware,
  dnextFetch,
  getCurrentApiUrl,
  getCurrentAuthUrl,
  logFilePath
};
