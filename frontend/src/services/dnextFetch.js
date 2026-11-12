import { getStoredEnvironment } from '../context/EnvironmentContext';

/*
 * Ensures every call to the DNEXT backend proxy carries the active environment.
 *
 * The backend (services/dnextClient.js → dnextEnvMiddleware) resolves the target
 * environment from the x-dnext-env-name / x-dnext-api-url / x-dnext-auth-url headers.
 * Some components build these headers themselves; others (e.g. the sync dashboards)
 * never did and silently hit the default environment. This wrapper adds the headers
 * only when they are missing, so explicit per-call headers always win.
 */

const DNEXT_PREFIX = '/api/dnext';

function isDnextCall(url) {
  try {
    const u = new URL(url, window.location.origin);
    return u.origin === window.location.origin && u.pathname.startsWith(DNEXT_PREFIX);
  } catch {
    return false;
  }
}

export function installDnextEnvFetch() {
  if (window.__dnextEnvFetchInstalled) return;
  window.__dnextEnvFetchInstalled = true;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url;
    if (!url || !isDnextCall(url)) return nativeFetch(input, init);

    const env = getStoredEnvironment();
    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    if (env.name && !headers.has('x-dnext-env-name')) headers.set('x-dnext-env-name', env.name);
    if (env.apiUrl && !headers.has('x-dnext-api-url')) headers.set('x-dnext-api-url', env.apiUrl);
    if (env.authUrl && !headers.has('x-dnext-auth-url')) headers.set('x-dnext-auth-url', env.authUrl);

    return nativeFetch(input, { ...init, headers });
  };
}
