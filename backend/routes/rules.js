const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getAutoToken } = require('../services/dnextClient');
const { getCatalogCache, setCatalogCache } = require('../services/db');

const SEED_FILE = path.join(__dirname, '../data/seedRules.json');

// In-memory cache for local / offline rules
let localRulesCache = null;

function loadLocalRules() {
  if (localRulesCache && localRulesCache.length > 0) return localRulesCache;
  try {
    if (fs.existsSync(SEED_FILE)) {
      const data = fs.readFileSync(SEED_FILE, 'utf8');
      localRulesCache = JSON.parse(data);
      return localRulesCache;
    }
  } catch (err) {
    console.error('[RulesRoute] Failed to read seed rules:', err.message);
  }
  localRulesCache = [];
  return localRulesCache;
}

function saveLocalRules(rules) {
  localRulesCache = rules;
  try {
    fs.writeFileSync(SEED_FILE, JSON.stringify(rules, null, 2), 'utf8');
  } catch (err) {
    console.error('[RulesRoute] Failed to persist rules:', err.message);
  }
}

function resolveDruleBaseUrl(req) {
  if (process.env.DRULE_API_HOST) return process.env.DRULE_API_HOST.replace(/\/+$/, '');
  const headerDrule = req.headers['x-dnext-drule-url'];
  if (headerDrule) return headerDrule.trim().replace(/\/+$/, '');

  const headerApiUrl = req.headers['x-dnext-api-url'];
  if (headerApiUrl) {
    return headerApiUrl.replace('dpc-api', 'drule-api').replace(/\/+$/, '');
  }
  return 'https://drule-api.test-gcu.com';
}

async function resolveAuthToken(req, envName, apiUrl, authUrl) {
  let authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 15) {
    const rawToken = authHeader.substring(7).trim();
    if (rawToken && rawToken !== 'null' && rawToken !== 'undefined') {
      return authHeader;
    }
  }
  // Try auto-acquiring token via Keycloak
  try {
    const autoToken = await getAutoToken(envName, apiUrl, authUrl);
    if (autoToken) {
      return `Bearer ${autoToken}`;
    }
  } catch (e) {
    console.warn('[RulesRoute] Could not auto-acquire token:', e.message);
  }
  return null;
}

const CR_DEFINITIONS_FILE = path.join(__dirname, '../data/CR_BusinessDefinitions.json');
const ROOT_CR_DEFINITIONS_FILE = path.join(__dirname, '../../CR_BusinessDefinitions.json');
const LEGACY_DEFINITIONS_FILE = path.join(__dirname, '../data/rule_commercial_definitions.json');

// In-memory cache for commercial definitions
let definitionsCache = null;

function loadCommercialDefinitions() {
  if (definitionsCache) return definitionsCache;
  try {
    const fileToLoad = fs.existsSync(CR_DEFINITIONS_FILE)
      ? CR_DEFINITIONS_FILE
      : (fs.existsSync(ROOT_CR_DEFINITIONS_FILE) ? ROOT_CR_DEFINITIONS_FILE : LEGACY_DEFINITIONS_FILE);

    if (fs.existsSync(fileToLoad)) {
      definitionsCache = JSON.parse(fs.readFileSync(fileToLoad, 'utf8'));
      return definitionsCache;
    }
  } catch (err) {
    console.error('[RulesRoute] Failed to load rule commercial definitions:', err.message);
  }
  definitionsCache = {};
  return definitionsCache;
}

function saveCommercialDefinitions(defs) {
  definitionsCache = defs;
  try {
    const json = JSON.stringify(defs, null, 2);
    fs.writeFileSync(CR_DEFINITIONS_FILE, json, 'utf8');
    if (fs.existsSync(path.dirname(ROOT_CR_DEFINITIONS_FILE))) {
      fs.writeFileSync(ROOT_CR_DEFINITIONS_FILE, json, 'utf8');
    }
    fs.writeFileSync(LEGACY_DEFINITIONS_FILE, json, 'utf8');
  } catch (err) {
    console.error('[RulesRoute] Failed to save rule commercial definitions:', err.message);
  }
}

/**
 * GET /api/dnext/rules/definitions
 * Returns all LLM-generated commercial definitions and plain-language intents
 */
router.get('/rules/definitions', (req, res) => {
  const defs = loadCommercialDefinitions();
  res.json({
    total: Object.keys(defs).length,
    definitions: defs
  });
});

/**
 * GET /api/dnext/rules/:id/definition
 * Returns commercial definition and plain-language intent for a specific rule
 */
router.get('/rules/:id/definition', (req, res) => {
  const defs = loadCommercialDefinitions();
  const ruleDef = defs[req.params.id];
  if (!ruleDef) {
    return res.status(404).json({ error: `Definition for rule ${req.params.id} not found` });
  }
  res.json(ruleDef);
});

/**
 * PUT /api/dnext/rules/:id/definition
 * Updates or overrides commercial definition for a specific rule
 */
router.put('/rules/:id/definition', (req, res) => {
  const { id } = req.params;
  const { businessDefinition, plainLanguageIntent, policyTag, regulatoryRef } = req.body;
  const defs = loadCommercialDefinitions();

  defs[id] = {
    ...(defs[id] || { ruleId: id }),
    businessDefinition: businessDefinition !== undefined ? businessDefinition : defs[id]?.businessDefinition,
    plainLanguageIntent: plainLanguageIntent !== undefined ? plainLanguageIntent : defs[id]?.plainLanguageIntent,
    policyTag: policyTag || defs[id]?.policyTag || 'Commercial Policy',
    regulatoryRef: regulatoryRef || defs[id]?.regulatoryRef,
    userOverridden: true,
    lastUpdated: new Date().toISOString()
  };

  saveCommercialDefinitions(defs);
  res.json({ success: true, definition: defs[id] });
});

/**
 * GET /api/dnext/rules
 * List, filter and search BasicRules from live DNEXT Rule Engine or SQLite cache
 */
router.get('/rules', async (req, res) => {
  const {
    name,
    category,
    status,
    stateCategory,
    limit = 1000,
    offset = 0,
    refresh
  } = req.query;

  const isForceRefresh = refresh === 'true' || refresh === true || refresh === '1';
  const envName = (req.headers['x-dnext-env-name'] || 'test').toLowerCase();
  const apiUrl = req.headers['x-dnext-api-url'] || 'https://dpc-api.test-gcu.com';
  const authUrl = req.headers['x-dnext-auth-url'] || 'https://diam.test-gcu.com/realms/orbitant-realm/protocol/openid-connect/token';
  const druleBaseUrl = resolveDruleBaseUrl(req);

  const endpointPath = '/api/ruleEngine/v1/rule';
  const cacheKey = `${envName}:${endpointPath}:all`;

  // 1. Check SQLite cache if not forcing refresh
  if (!isForceRefresh) {
    let cached = await getCatalogCache(cacheKey);
    if ((!cached || !cached.payload) && (envName === 'test' || envName === 'default')) {
      cached = await getCatalogCache(`dpc_ui.test-g:${endpointPath}:all`);
    } else if ((!cached || !cached.payload) && envName === 'dpc_ui.test-g') {
      cached = await getCatalogCache(`test:${endpointPath}:all`);
    }

    if (cached && cached.payload) {
      try {
        const cachedRules = JSON.parse(cached.payload);
        if (Array.isArray(cachedRules) && cachedRules.length > 0) {
          console.log(`[RulesRoute] Cache HIT for ${cacheKey} (${cachedRules.length} rules)`);
          return filterAndRespond(cachedRules, true, cached.updated_at, cached.total_count);
        }
      } catch (parseErr) {
        console.warn('[RulesRoute] Error parsing cached rules:', parseErr.message);
      }
    }
  }

  // 2. Attempt fetching from Live DNEXT Rule Engine Gateway
  let authToken = await resolveAuthToken(req, envName, apiUrl, authUrl);
  if (authToken && druleBaseUrl && !druleBaseUrl.includes('localhost')) {
    try {
      console.log(`[RulesRoute] Fetching live rules from ${druleBaseUrl}${endpointPath}...`);

      const page0Url = new URL(`${druleBaseUrl}${endpointPath}`);
      page0Url.searchParams.set('limit', '100');
      page0Url.searchParams.set('offset', '0');

      let page0Res = await fetch(page0Url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': authToken,
          'Accept': 'application/json;charset=utf-8'
        }
      });

      // If 401 Unauthorized, force refresh token and retry
      if (page0Res.status === 401) {
        console.log('[RulesRoute] 401 Unauthorized on Rule Engine, acquiring fresh token...');
        const fresh = await getAutoToken(envName, apiUrl, authUrl, true);
        if (fresh) {
          authToken = `Bearer ${fresh}`;
          res.setHeader('x-refreshed-token', fresh);
          page0Res = await fetch(page0Url.toString(), {
            method: 'GET',
            headers: {
              'Authorization': authToken,
              'Accept': 'application/json;charset=utf-8'
            }
          });
        }
      }

      if (page0Res.ok) {
        const page0Data = await page0Res.json();
        if (Array.isArray(page0Data)) {
          const totalCountHeader = page0Res.headers.get('x-total-count');
          const totalCount = totalCountHeader ? parseInt(totalCountHeader, 10) : page0Data.length;

          let allRules = [...page0Data];

          // If there are more pages, fetch them in parallel
          const requestedMax = parseInt(limit, 10) || 1000;
          const maxToFetch = Math.min(requestedMax, totalCount);

          if (maxToFetch > 100) {
            const pageOffsets = [];
            for (let off = 100; off < maxToFetch; off += 100) {
              pageOffsets.push(off);
            }

            console.log(`[RulesRoute] Total rules reported: ${totalCount}. Fetching ${pageOffsets.length} remaining pages...`);
            const pagePromises = pageOffsets.map(async (off) => {
              try {
                const pUrl = new URL(`${druleBaseUrl}${endpointPath}`);
                pUrl.searchParams.set('limit', '100');
                pUrl.searchParams.set('offset', String(off));

                const pRes = await fetch(pUrl.toString(), {
                  method: 'GET',
                  headers: {
                    'Authorization': authToken,
                    'Accept': 'application/json;charset=utf-8'
                  }
                });

                if (pRes.ok) {
                  const pData = await pRes.json();
                  if (Array.isArray(pData)) return pData;
                }
              } catch (pErr) {
                console.warn(`[RulesRoute] Page offset ${off} failed:`, pErr.message);
              }
              return [];
            });

            const pageResults = await Promise.all(pagePromises);
            for (const chunk of pageResults) {
              allRules.push(...chunk);
            }
          }

          console.log(`[RulesRoute] Successfully fetched ${allRules.length} rules from DNEXT Rule Engine.`);

          // Persist to SQLite cache for fast sub-second loads
          await setCatalogCache(cacheKey, envName, endpointPath, allRules, allRules.length);
          const altEnv = envName === 'test' ? 'dpc_ui.test-g' : (envName === 'dpc_ui.test-g' ? 'test' : null);
          if (altEnv) {
            await setCatalogCache(`${altEnv}:${endpointPath}:all`, altEnv, endpointPath, allRules, allRules.length);
          }

          // Save backup copy to seedRules.json
          saveLocalRules(allRules);

          return filterAndRespond(allRules, false, new Date().toISOString(), allRules.length);
        }
      } else {
        console.warn(`[RulesRoute] Live rule engine returned HTTP ${page0Res.status}`);
      }
    } catch (liveErr) {
      console.warn('[RulesRoute] Failed to query live Rule Engine:', liveErr.message);
    }
  } else {
    console.log('[RulesRoute] No valid auth token provided or auto-token unavailable; falling back.');
  }

  // 3. Fallback: check SQLite cache even if stale or under different key
  let fallbackCached = await getCatalogCache(`test:${endpointPath}:all`);
  if (!fallbackCached || !fallbackCached.payload) {
    fallbackCached = await getCatalogCache(`dpc_ui.test-g:${endpointPath}:all`);
  }
  if (fallbackCached && fallbackCached.payload) {
    try {
      const parsed = JSON.parse(fallbackCached.payload);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`[RulesRoute] Serving from fallback SQLite cache (${parsed.length} rules)`);
        return filterAndRespond(parsed, true, fallbackCached.updated_at, fallbackCached.total_count);
      }
    } catch (e) {}
  }

  // 4. Final Fallback: serve local seed rules
  const seedRules = loadLocalRules();
  console.log(`[RulesRoute] Serving local seed rules (${seedRules.length} rules)`);
  return filterAndRespond(seedRules, true, null, seedRules.length);

  function filterAndRespond(rulesList, isFromCache, cacheDate, totalAvailable) {
    let filtered = [...rulesList];

    if (name) {
      const q = name.toLowerCase();
      filtered = filtered.filter(r => (r.name && r.name.toLowerCase().includes(q)) || (r.id && r.id.toLowerCase().includes(q)));
    }
    if (category) {
      const cats = Array.isArray(category) ? category : [category];
      filtered = filtered.filter(r => Array.isArray(r.category) && r.category.some(c => cats.includes(c)));
    }
    if (status) {
      const stats = Array.isArray(status) ? status : [status];
      filtered = filtered.filter(r => stats.includes(r.status));
    }
    if (stateCategory) {
      const states = Array.isArray(stateCategory) ? stateCategory : [stateCategory];
      filtered = filtered.filter(r => states.includes(r.stateCategory));
    }

    const total = totalAvailable || filtered.length;
    const paginated = filtered.slice(Number(offset), Number(offset) + Number(limit));

    res.set({
      'x-total-count': String(total),
      'x-result-count': String(paginated.length),
      'x-from-cache': isFromCache ? 'true' : 'false'
    });
    if (cacheDate) {
      res.set('x-cache-updated-at', cacheDate);
    }
    res.json(paginated);
  }
});

/**
 * GET /api/dnext/rules/:id
 * Retrieve a single rule
 */
router.get('/rules/:id', async (req, res) => {
  const { id } = req.params;
  const envName = (req.headers['x-dnext-env-name'] || 'test').toLowerCase();
  const endpointPath = '/api/ruleEngine/v1/rule';
  const cacheKey = `${envName}:${endpointPath}:all`;

  // First check SQLite cache
  let cached = await getCatalogCache(cacheKey);
  if (!cached || !cached.payload) {
    cached = (await getCatalogCache(`test:${endpointPath}:all`)) || (await getCatalogCache(`dpc_ui.test-g:${endpointPath}:all`));
  }
  if (cached && cached.payload) {
    try {
      const rules = JSON.parse(cached.payload);
      const found = rules.find(r => r.id === id);
      if (found) return res.json(found);
    } catch (e) {}
  }

  // Check local seed rules
  const localRules = loadLocalRules();
  const localFound = localRules.find(r => r.id === id);
  if (localFound) return res.json(localFound);

  // Check live API
  const druleBaseUrl = resolveDruleBaseUrl(req);
  const authToken = await resolveAuthToken(req, envName, req.headers['x-dnext-api-url'], req.headers['x-dnext-auth-url']);
  if (authToken && druleBaseUrl) {
    try {
      const liveRes = await fetch(`${druleBaseUrl}/api/ruleEngine/v1/rule/${encodeURIComponent(id)}`, {
        headers: { 'Authorization': authToken, 'Accept': 'application/json' }
      });
      if (liveRes.ok) {
        const liveRule = await liveRes.json();
        return res.json(liveRule);
      }
    } catch (e) {}
  }

  res.status(404).json({ error: `Rule with ID ${id} not found.` });
});

/**
 * POST /api/dnext/rules
 * Create a new rule
 */
router.post('/rules', async (req, res) => {
  const body = req.body || {};
  const rules = loadLocalRules();

  // Generate CR ID if not given
  let id = body.id;
  if (!id) {
    const existingNums = rules
      .map(r => parseInt(String(r.id).replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 7000;
    id = `CR00${nextNum}`;
  }

  const now = new Date().toISOString();
  const newRule = {
    "@baseType": "Rule",
    "@schemaLocation": "/api/ruleEngine/v1/schema/rule.json",
    "@type": "BasicRule",
    id,
    href: `/api/ruleEngine/v1/rule/${id}`,
    name: body.name || `Rule ${id}`,
    branchName: body.branchName || "MATCH",
    ruleType: body.ruleType || "FORALL",
    conditionVariantType: body.conditionVariantType || "expression",
    condition: Array.isArray(body.condition) ? body.condition : [],
    result: body.result || {
      "@type": "Result",
      "variantType": "attributeValueList",
      "attribute": { "name": "Target Selection", "attribute": [] }
    },
    category: Array.isArray(body.category) ? body.category : ["implicitCompatibility"],
    status: body.status || "draft",
    stateCategory: body.stateCategory || "Initial",
    ruleCharacteristic: Array.isArray(body.ruleCharacteristic) ? body.ruleCharacteristic : [],
    revision: 0,
    createdDate: now,
    updatedDate: now
  };

  // Add to local cache
  rules.unshift(newRule);
  saveLocalRules(rules);

  // Update SQLite cache as well
  const envName = (req.headers['x-dnext-env-name'] || 'test').toLowerCase();
  const cacheKey = `${envName}:/api/ruleEngine/v1/rule:all`;
  try {
    let cached = await getCatalogCache(cacheKey);
    if (cached && cached.payload) {
      const cRules = JSON.parse(cached.payload);
      cRules.unshift(newRule);
      await setCatalogCache(cacheKey, envName, '/api/ruleEngine/v1/rule', cRules, cRules.length);
    }
  } catch (e) {}

  res.status(201).json(newRule);
});

/**
 * PATCH /api/dnext/rules/:id
 * Update an existing rule
 */
router.patch('/rules/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};
  const rules = loadLocalRules();
  const idx = rules.findIndex(r => r.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: `Rule with ID ${id} not found.` });
  }

  const existing = rules[idx];
  const updated = {
    ...existing,
    ...updates,
    id: existing.id, // Immutable ID
    updatedDate: new Date().toISOString(),
    revision: (existing.revision || 0) + 1
  };

  rules[idx] = updated;
  saveLocalRules(rules);

  // Update SQLite cache
  const envName = (req.headers['x-dnext-env-name'] || 'test').toLowerCase();
  const cacheKey = `${envName}:/api/ruleEngine/v1/rule:all`;
  try {
    let cached = await getCatalogCache(cacheKey);
    if (cached && cached.payload) {
      const cRules = JSON.parse(cached.payload);
      const cIdx = cRules.findIndex(r => r.id === id);
      if (cIdx !== -1) {
        cRules[cIdx] = updated;
        await setCatalogCache(cacheKey, envName, '/api/ruleEngine/v1/rule', cRules, cRules.length);
      }
    }
  } catch (e) {}

  res.json(updated);
});

/**
 * DELETE /api/dnext/rules/:id
 * Delete a rule
 */
router.delete('/rules/:id', async (req, res) => {
  const { id } = req.params;
  let rules = loadLocalRules();
  const initialLen = rules.length;
  rules = rules.filter(r => r.id !== id);

  if (rules.length === initialLen) {
    return res.status(404).json({ error: `Rule with ID ${id} not found.` });
  }

  saveLocalRules(rules);

  // Update SQLite cache
  const envName = (req.headers['x-dnext-env-name'] || 'test').toLowerCase();
  const cacheKey = `${envName}:/api/ruleEngine/v1/rule:all`;
  try {
    let cached = await getCatalogCache(cacheKey);
    if (cached && cached.payload) {
      let cRules = JSON.parse(cached.payload);
      cRules = cRules.filter(r => r.id !== id);
      await setCatalogCache(cacheKey, envName, '/api/ruleEngine/v1/rule', cRules, cRules.length);
    }
  } catch (e) {}

  res.json({ success: true, deletedId: id });
});

module.exports = router;
