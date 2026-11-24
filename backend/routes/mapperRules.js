const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { db, queryAll, queryOne, runSql } = require('../services/db');
const { getAutoToken } = require('../services/dnextClient');

const STUDIO_ROOT = path.resolve(__dirname, '..', '..');
const REF_DB_PATH = path.join(STUDIO_ROOT, 'reference_data', '2_reference_db', 'vfde_catalog_reference.db');

// In-memory sync status per environment (isolated from standard rules sync)
const mapperSyncStatus = new Map();

const DEFAULT_MAPPER_FACTS = [
  { fact_object: 'cart', operation: 'containsProductInCategoryId', parameter_count: 1, parameter_types: 'string' },
  { fact_object: 'order', operation: 'containsInstallBaseProductInCategoryId', parameter_count: 1, parameter_types: 'string' },
  { fact_object: 'order', operation: 'containsProduct', parameter_count: 1, parameter_types: 'string' },
  { fact_object: 'order', operation: 'containsProduct', parameter_count: 1, parameter_types: 'integer' },
  { fact_object: 'order', operation: 'containsProductInCategoryId', parameter_count: 1, parameter_types: 'string' },
  { fact_object: 'order', operation: 'packageContainedInstalledBaseProduct', parameter_count: 1, parameter_types: 'string' },
  { fact_object: 'order', operation: 'packageContainedInstalledBaseProduct', parameter_count: 1, parameter_types: 'integer' },
  { fact_object: 'order', operation: 'packageContainedInstalledBaseProductInCategoryId', parameter_count: 1, parameter_types: 'string' },
  { fact_object: 'order', operation: 'packageContainedInstalledBaseProductInFamily', parameter_count: 1, parameter_types: 'string' }
];

function resolveEnvName(req) {
  return (req.headers['x-dnext-env-name'] || 'test').trim().toLowerCase();
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

async function resolveAuthToken(req, envName, apiUrl, authUrl, forceRefresh = false) {
  if (!forceRefresh) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 15) {
      const rawToken = authHeader.substring(7).trim();
      if (rawToken && rawToken !== 'null' && rawToken !== 'undefined') {
        return authHeader;
      }
    }
  }
  try {
    const autoToken = await getAutoToken(envName, apiUrl, authUrl, forceRefresh);
    if (autoToken) return `Bearer ${autoToken}`;
  } catch (e) {
    console.warn('[MapperRules] Could not auto-acquire token:', e.message);
  }
  return null;
}

function extractMapperFields(rule) {
  const chars = Array.isArray(rule?.ruleCharacteristic) ? rule.ruleCharacteristic : [];
  const charMap = {};
  for (const c of chars) {
    if (c && c.name) charMap[c.name] = c.value !== undefined && c.value !== null ? String(c.value) : '';
  }

  const entities = Array.isArray(rule?.managedAssetGroup?.entity) ? rule.managedAssetGroup.entity : [];
  const skuMap = new Map();
  for (const e of entities) {
    if (!e) continue;
    const sku = String(e.name || e.sku || e.id || '').trim();
    if (!sku) continue;
    const blockId = e.blockId !== undefined && e.blockId !== null ? String(e.blockId) : '';
    skuMap.set(`${sku}::${blockId}`, { sku, blockId });
  }
  const skuLinks = Array.from(skuMap.values());

  return {
    id: String(rule.id || ''),
    name: String(rule.name || rule.id || ''),
    status: String(rule.status || 'draft'),
    state_category: String(rule.stateCategory || 'Initial'),
    rule_type: String(rule.ruleType || 'FORALL'),
    mapper_type: charMap.mapper_type || '',
    direction: charMap.direction || '',
    attribute_code: charMap.attribute_code || '',
    attribute_value: charMap.attribute_value || '',
    attribute_additional_value: charMap.attribute_additional_value || '',
    basket_action: charMap.basket_action || '',
    attribute_action: charMap.attribute_action || '',
    source_component_id: charMap.source_component_id || '',
    system_name: charMap.system_name || '',
    process_contexts: charMap.process_contexts || '',
    sku_count: skuLinks.length,
    skuLinks
  };
}

function upsertMapperRulesBatch(envName, rules, syncState = 'synced') {
  if (!Array.isArray(rules) || rules.length === 0) return Promise.resolve(0);
  const now = new Date().toISOString();

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      const ruleStmt = db.prepare(`
        INSERT OR REPLACE INTO dnext_mapper_rules (
          env_name, id, name, status, state_category, rule_type,
          mapper_type, direction, attribute_code, attribute_value, attribute_additional_value,
          basket_action, attribute_action, source_component_id, system_name, process_contexts,
          sku_count, sync_state, payload, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const delSkuStmt = db.prepare('DELETE FROM dnext_mapper_rule_skus WHERE env_name = ? AND rule_id = ?');
      const insSkuStmt = db.prepare('INSERT OR IGNORE INTO dnext_mapper_rule_skus (env_name, rule_id, sku, block_id) VALUES (?, ?, ?, ?)');

      for (const rule of rules) {
        if (!rule || !rule.id) continue;
        const f = extractMapperFields(rule);
        ruleStmt.run(
          envName, f.id, f.name, f.status, f.state_category, f.rule_type,
          f.mapper_type, f.direction, f.attribute_code, f.attribute_value, f.attribute_additional_value,
          f.basket_action, f.attribute_action, f.source_component_id, f.system_name, f.process_contexts,
          f.sku_count, syncState, JSON.stringify(rule), now
        );
        delSkuStmt.run(envName, f.id);
        for (const link of f.skuLinks) {
          insSkuStmt.run(envName, f.id, link.sku, link.blockId);
        }
      }

      ruleStmt.finalize();
      delSkuStmt.finalize();
      insSkuStmt.finalize();

      db.run('COMMIT', (err) => {
        if (err) {
          db.run('ROLLBACK', () => reject(err));
        } else {
          resolve(rules.length);
        }
      });
    });
  });
}

function queryRefDbAll(sql, params = []) {
  return new Promise((resolve) => {
    if (!fs.existsSync(REF_DB_PATH)) return resolve([]);
    const refConn = new sqlite3.Database(REF_DB_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) return resolve([]);
      refConn.all(sql, params, (qErr, rows) => {
        refConn.close();
        if (qErr) return resolve([]);
        resolve(rows || []);
      });
    });
  });
}

function getSyncStateObj(envName) {
  return mapperSyncStatus.get(envName) || {
    inProgress: false,
    fetched: 0,
    total: 0,
    error: null,
    startedAt: null,
    completedAt: null,
    mode: null
  };
}

/**
 * GET /api/dnext/mapper-rules/sync/status
 */
router.get('/mapper-rules/sync/status', async (req, res) => {
  try {
    const envName = resolveEnvName(req);
    const status = getSyncStateObj(envName);
    const counts = await queryOne(
      `SELECT COUNT(*) AS totalCached,
              SUM(CASE WHEN sync_state != 'synced' THEN 1 ELSE 0 END) AS dirtyCount,
              MAX(updated_at) AS lastUpdatedAt
       FROM dnext_mapper_rules WHERE env_name = ?`,
      [envName]
    );
    res.json({
      ...status,
      totalCached: counts?.totalCached || 0,
      dirtyCount: counts?.dirtyCount || 0,
      lastUpdatedAt: counts?.lastUpdatedAt || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/dnext/mapper-rules/sync
 * Differentiated big-data sync for category=mapperRules with bounded concurrency
 */
router.post('/mapper-rules/sync', async (req, res) => {
  const envName = resolveEnvName(req);
  const current = getSyncStateObj(envName);
  if (current.inProgress) {
    return res.status(409).json({ error: 'Mapper rules sync already in progress', status: current });
  }

  const apiUrl = req.headers['x-dnext-api-url'] || 'https://dpc-api.test-gcu.com';
  const authUrl = req.headers['x-dnext-auth-url'] || 'https://diam.test-gcu.com/realms/orbitant-realm/protocol/openid-connect/token';
  const druleBaseUrl = resolveDruleBaseUrl(req);
  let authToken = await resolveAuthToken(req, envName, apiUrl, authUrl);

  if (!authToken) {
    return res.status(401).json({ error: 'Authentication required. Please connect to DNEXT first.' });
  }

  const { mapperType, direction } = req.body || {};
  const pageSize = 200;
  const endpointPath = '/api/ruleEngine/v1/rule';

  const buildPageUrl = (offset) => {
    const u = new URL(`${druleBaseUrl}${endpointPath}`);
    u.searchParams.set('category', 'mapperRules');
    u.searchParams.set('limit', String(pageSize));
    u.searchParams.set('offset', String(offset));
    if (mapperType && mapperType !== 'all') {
      u.searchParams.append('ruleCharacteristic.name', 'mapper_type');
      u.searchParams.append('ruleCharacteristic.value', mapperType);
    }
    if (direction && direction !== 'all') {
      u.searchParams.append('ruleCharacteristic.name', 'direction');
      u.searchParams.append('ruleCharacteristic.value', direction);
    }
    return u.toString();
  };

  const syncState = {
    inProgress: true,
    fetched: 0,
    total: 0,
    error: null,
    startedAt: new Date().toISOString(),
    completedAt: null,
    mode: mapperType ? `mapper_type=${mapperType}` : 'all_mapper_rules'
  };
  mapperSyncStatus.set(envName, syncState);

  // Return 202 immediately and run bounded worker pool in background
  res.status(202).json({ started: true, status: syncState });

  (async () => {
    try {
      let page0Res = await fetch(buildPageUrl(0), {
        headers: { 'Authorization': authToken, 'Accept': 'application/json;charset=utf-8' }
      });

      if (page0Res.status === 401) {
        const fresh = await resolveAuthToken(req, envName, apiUrl, authUrl, true);
        if (fresh) {
          authToken = fresh;
          page0Res = await fetch(buildPageUrl(0), {
            headers: { 'Authorization': authToken, 'Accept': 'application/json;charset=utf-8' }
          });
        }
      }

      if (!page0Res.ok) {
        throw new Error(`DNEXT Rule Engine returned HTTP ${page0Res.status}`);
      }

      const page0Data = await page0Res.json();
      if (!Array.isArray(page0Data)) {
        throw new Error('Unexpected non-array response from Rule Engine');
      }

      const totalHeader = page0Res.headers.get('x-total-count');
      const totalCount = totalHeader ? parseInt(totalHeader, 10) : page0Data.length;
      syncState.total = totalCount;

      if (page0Data.length > 0) {
        await upsertMapperRulesBatch(envName, page0Data, 'synced');
        syncState.fetched += page0Data.length;
      }

      const offsets = [];
      for (let off = pageSize; off < totalCount; off += pageSize) {
        offsets.push(off);
      }

      // Bounded worker pool (concurrency = 5)
      const CONCURRENCY = 5;
      let cursor = 0;
      let pendingBatch = [];

      const flushBatch = async () => {
        if (pendingBatch.length === 0) return;
        const toInsert = pendingBatch;
        pendingBatch = [];
        await upsertMapperRulesBatch(envName, toInsert, 'synced');
      };

      const worker = async () => {
        while (cursor < offsets.length) {
          const idx = cursor++;
          const off = offsets[idx];
          try {
            const pRes = await fetch(buildPageUrl(off), {
              headers: { 'Authorization': authToken, 'Accept': 'application/json;charset=utf-8' }
            });
            if (pRes.ok) {
              const pData = await pRes.json();
              if (Array.isArray(pData) && pData.length > 0) {
                pendingBatch.push(...pData);
                syncState.fetched += pData.length;
                if (pendingBatch.length >= 1000) {
                  await flushBatch();
                }
              }
            }
          } catch (pageErr) {
            console.warn(`[MapperRulesSync] Page offset ${off} failed:`, pageErr.message);
          }
        }
      };

      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, offsets.length) }, () => worker()));
      await flushBatch();

      syncState.inProgress = false;
      syncState.completedAt = new Date().toISOString();
    } catch (err) {
      console.error('[MapperRulesSync] Failed:', err.message);
      syncState.inProgress = false;
      syncState.error = err.message;
      syncState.completedAt = new Date().toISOString();
    }
  })();
});

/**
 * GET /api/dnext/mapper-rules/live-query
 * Direct live query to drule-api using SKU & characteristic filters:
 * e.g. ?sku=R70.1000000129-24&direction=out&mapperType=sales_package
 */
router.get('/mapper-rules/live-query', async (req, res) => {
  try {
    const envName = resolveEnvName(req);
    const { sku, direction, mapperType, limit = 200, offset = 0, cacheResults = 'true' } = req.query;
    const apiUrl = req.headers['x-dnext-api-url'] || 'https://dpc-api.test-gcu.com';
    const authUrl = req.headers['x-dnext-auth-url'] || 'https://diam.test-gcu.com/realms/orbitant-realm/protocol/openid-connect/token';
    const druleBaseUrl = resolveDruleBaseUrl(req);
    let authToken = await resolveAuthToken(req, envName, apiUrl, authUrl);

    if (!authToken) {
      return res.status(401).json({ error: 'Authentication required to query live DNEXT Rule Engine.' });
    }

    const u = new URL(`${druleBaseUrl}/api/ruleEngine/v1/rule`);
    u.searchParams.set('category', 'mapperRules');
    u.searchParams.set('limit', String(limit));
    u.searchParams.set('offset', String(offset));

    if (sku && sku.trim()) {
      u.searchParams.set('managedAssetGroup.entityType', 'SKU');
      u.searchParams.set('managedAssetGroup.entity.name', sku.trim());
    }
    if (direction && direction !== 'all') {
      u.searchParams.append('ruleCharacteristic.name', 'direction');
      u.searchParams.append('ruleCharacteristic.value', direction);
    }
    if (mapperType && mapperType !== 'all') {
      u.searchParams.append('ruleCharacteristic.name', 'mapper_type');
      u.searchParams.append('ruleCharacteristic.value', mapperType);
    }

    let liveRes = await fetch(u.toString(), {
      headers: { 'Authorization': authToken, 'Accept': 'application/json;charset=utf-8' }
    });

    if (liveRes.status === 401) {
      const fresh = await resolveAuthToken(req, envName, apiUrl, authUrl, true);
      if (fresh) {
        authToken = fresh;
        res.setHeader('x-refreshed-token', fresh.replace(/^Bearer\s+/i, ''));
        liveRes = await fetch(u.toString(), {
          headers: { 'Authorization': authToken, 'Accept': 'application/json;charset=utf-8' }
        });
      }
    }

    if (!liveRes.ok) {
      const errText = await liveRes.text().catch(() => '');
      return res.status(liveRes.status).json({ error: `Live Rule Engine HTTP ${liveRes.status}`, details: errText });
    }

    const data = await liveRes.json();
    const items = Array.isArray(data) ? data : [];
    const totalCount = parseInt(liveRes.headers.get('x-total-count') || String(items.length), 10);

    if (cacheResults !== 'false' && items.length > 0) {
      await upsertMapperRulesBatch(envName, items, 'synced');
    }

    res.json({ items, totalCount, queryUrl: u.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/dnext/mapper-rules/facts
 * Returns distinct fact descriptors for mapperRules from reference DB
 */
router.get('/mapper-rules/facts', async (req, res) => {
  try {
    const rows = await queryRefDbAll(
      `SELECT DISTINCT fact_object, operation, parameter_count, parameter_types
       FROM STG_RULES_FACT_DESCRIPTOR
       WHERE category = 'mapperRules'
       ORDER BY fact_object, operation`
    );
    res.json({ facts: rows.length > 0 ? rows : DEFAULT_MAPPER_FACTS });
  } catch (err) {
    res.json({ facts: DEFAULT_MAPPER_FACTS });
  }
});

/**
 * GET /api/dnext/mapper-rules
 * Server-paginated, faceted query over local SQLite dnext_mapper_rules
 */
router.get('/mapper-rules', async (req, res) => {
  try {
    const envName = resolveEnvName(req);
    const {
      mapperType,
      direction,
      attributeAction,
      basketAction,
      processContext,
      sourceComponentId,
      attributeCode,
      attributeValue,
      attributeAdditionalValue,
      ruleId,
      status,
      syncState,
      q,
      sku,
      limit = 50,
      offset = 0,
      sortBy = 'id',
      sortDir = 'asc'
    } = req.query;

    const where = ['r.env_name = ?'];
    const params = [envName];

    if (mapperType && mapperType !== 'all') {
      where.push('r.mapper_type = ?');
      params.push(mapperType);
    }
    if (direction && direction !== 'all') {
      where.push('r.direction = ?');
      params.push(direction);
    }
    if (attributeAction && attributeAction !== 'all') {
      where.push('r.attribute_action = ?');
      params.push(attributeAction);
    }
    if (basketAction && basketAction !== 'all') {
      where.push('r.basket_action = ?');
      params.push(basketAction);
    }
    if (processContext && processContext !== 'all') {
      where.push('r.process_contexts LIKE ?');
      params.push(`%${processContext}%`);
    }
    if (sourceComponentId && sourceComponentId.trim()) {
      where.push('r.source_component_id = ?');
      params.push(sourceComponentId.trim());
    }
    if (attributeCode && attributeCode.trim()) {
      where.push('r.attribute_code LIKE ?');
      params.push(`%${attributeCode.trim()}%`);
    }
    if (attributeValue && attributeValue.trim()) {
      where.push('r.attribute_value LIKE ?');
      params.push(`%${attributeValue.trim()}%`);
    }
    if (attributeAdditionalValue && attributeAdditionalValue.trim()) {
      where.push('r.attribute_additional_value LIKE ?');
      params.push(`%${attributeAdditionalValue.trim()}%`);
    }
    if (ruleId && ruleId.trim()) {
      where.push('r.id LIKE ?');
      params.push(`%${ruleId.trim()}%`);
    }
    if (status && status !== 'all') {
      where.push('r.status = ?');
      params.push(status);
    }
    if (syncState && syncState !== 'all') {
      if (syncState === 'dirty') {
        where.push("r.sync_state != 'synced'");
      } else {
        where.push('r.sync_state = ?');
        params.push(syncState);
      }
    }
    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      where.push('(r.id LIKE ? OR r.name LIKE ? OR r.attribute_code LIKE ? OR r.attribute_value LIKE ? OR r.attribute_additional_value LIKE ?)');
      params.push(term, term, term, term, term);
    }

    let joinClause = '';
    if (sku && sku.trim()) {
      joinClause = 'INNER JOIN dnext_mapper_rule_skus s ON s.env_name = r.env_name AND s.rule_id = r.id';
      where.push('s.sku LIKE ?');
      params.push(`%${sku.trim()}%`);
    }

    const whereSql = where.join(' AND ');
    const allowedSortCols = {
      id: 'r.id',
      name: 'r.name',
      mapperType: 'r.mapper_type',
      direction: 'r.direction',
      sourceComponentId: 'r.source_component_id',
      attributeCode: 'r.attribute_code',
      attributeValue: 'r.attribute_value',
      attributeAdditionalValue: 'r.attribute_additional_value',
      basketAction: 'r.basket_action',
      attributeAction: 'r.attribute_action',
      processContexts: 'r.process_contexts',
      skuCount: 'r.sku_count',
      status: 'r.status',
      syncState: 'r.sync_state',
      systemName: 'r.system_name',
      updatedAt: 'r.updated_at'
    };
    const orderCol = allowedSortCols[sortBy] || 'r.id';
    const orderDir = String(sortDir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const lim = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const off = Math.max(parseInt(offset, 10) || 0, 0);

    const countRow = await queryOne(
      `SELECT COUNT(DISTINCT r.id) AS cnt FROM dnext_mapper_rules r ${joinClause} WHERE ${whereSql}`,
      params
    );
    const totalCount = countRow?.cnt || 0;

    const rows = await queryAll(
      `SELECT DISTINCT r.id, r.name, r.status, r.state_category, r.rule_type,
              r.mapper_type, r.direction, r.attribute_code, r.attribute_value,
              r.attribute_additional_value, r.basket_action, r.attribute_action,
              r.source_component_id, r.system_name, r.process_contexts,
              r.sku_count, r.sync_state, r.payload, r.updated_at
       FROM dnext_mapper_rules r
       ${joinClause}
       WHERE ${whereSql}
       ORDER BY ${orderCol} ${orderDir}
       LIMIT ? OFFSET ?`,
      [...params, lim, off]
    );

    const items = rows.map(row => {
      let parsed = {};
      try { parsed = JSON.parse(row.payload); } catch {}
      return {
        ...parsed,
        _meta: {
          mapperType: row.mapper_type,
          direction: row.direction,
          attributeCode: row.attribute_code,
          attributeValue: row.attribute_value,
          attributeAdditionalValue: row.attribute_additional_value,
          basketAction: row.basket_action,
          attributeAction: row.attribute_action,
          sourceComponentId: row.source_component_id,
          systemName: row.system_name,
          processContexts: row.process_contexts,
          skuCount: row.sku_count,
          syncState: row.sync_state,
          updatedAt: row.updated_at
        }
      };
    });

    // Facet counts for the environment
    const [byMapperType, byDirection, byStatus, syncStats] = await Promise.all([
      queryAll('SELECT mapper_type AS key, COUNT(*) AS count FROM dnext_mapper_rules WHERE env_name = ? GROUP BY mapper_type ORDER BY count DESC', [envName]),
      queryAll('SELECT direction AS key, COUNT(*) AS count FROM dnext_mapper_rules WHERE env_name = ? GROUP BY direction', [envName]),
      queryAll('SELECT status AS key, COUNT(*) AS count FROM dnext_mapper_rules WHERE env_name = ? GROUP BY status', [envName]),
      queryOne(
        `SELECT COUNT(*) AS totalCached,
                SUM(CASE WHEN sync_state != 'synced' THEN 1 ELSE 0 END) AS dirtyCount,
                MAX(updated_at) AS lastUpdatedAt
         FROM dnext_mapper_rules WHERE env_name = ?`,
        [envName]
      )
    ]);

    res.json({
      items,
      totalCount,
      facets: {
        byMapperType,
        byDirection,
        byStatus,
        totalCached: syncStats?.totalCached || 0,
        dirtyCount: syncStats?.dirtyCount || 0,
        lastUpdatedAt: syncStats?.lastUpdatedAt || null
      }
    });
  } catch (err) {
    console.error('[MapperRules] GET list error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/dnext/mapper-rules/:id
 */
router.get('/mapper-rules/:id', async (req, res) => {
  try {
    const envName = resolveEnvName(req);
    const { id } = req.params;
    const row = await queryOne('SELECT * FROM dnext_mapper_rules WHERE env_name = ? AND id = ?', [envName, id]);

    let rule = null;
    let syncState = 'synced';
    if (row && row.payload) {
      rule = JSON.parse(row.payload);
      syncState = row.sync_state;
    } else {
      // Fallback: try live DNEXT Rule Engine
      const apiUrl = req.headers['x-dnext-api-url'] || 'https://dpc-api.test-gcu.com';
      const authUrl = req.headers['x-dnext-auth-url'] || 'https://diam.test-gcu.com/realms/orbitant-realm/protocol/openid-connect/token';
      const druleBaseUrl = resolveDruleBaseUrl(req);
      const authToken = await resolveAuthToken(req, envName, apiUrl, authUrl);
      if (authToken) {
        const liveRes = await fetch(`${druleBaseUrl}/api/ruleEngine/v1/rule/${encodeURIComponent(id)}`, {
          headers: { 'Authorization': authToken, 'Accept': 'application/json' }
        });
        if (liveRes.ok) {
          rule = await liveRes.json();
          await upsertMapperRulesBatch(envName, [rule], 'synced');
        }
      }
    }

    if (!rule) {
      return res.status(404).json({ error: `Mapper rule ${id} not found in local cache or live system.` });
    }

    // Optional reference DB enrichment
    const attrId = id.replace(/^MAPPER_/, '');
    const refRows = await queryRefDbAll(
      'SELECT source_attribute_additional_value, component_element FROM STG_FN_MAPPER_ATTRIBUTE WHERE attribute_id = ? LIMIT 1',
      [attrId]
    );

    res.json({
      ...rule,
      _meta: {
        syncState,
        referenceMeta: refRows[0] || null
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/dnext/mapper-rules
 * Create a new Mapper Rule locally (and optionally push to DNEXT if ?push=true)
 */
router.post('/mapper-rules', async (req, res) => {
  try {
    const envName = resolveEnvName(req);
    const body = req.body || {};
    const now = new Date().toISOString();

    const id = (body.id && body.id.trim()) || `MAPPER_custom_${Date.now()}`;
    const newRule = {
      '@baseType': 'Rule',
      '@schemaLocation': '/api/ruleEngine/v1/schema/rule.json',
      '@type': 'BasicRule',
      ...body,
      id,
      name: body.name || id,
      href: `/api/ruleEngine/v1/rule/${id}`,
      category: ['mapperRules'],
      ruleType: body.ruleType || 'FORALL',
      conditionVariantType: body.conditionVariantType || 'expression',
      condition: Array.isArray(body.condition) && body.condition.length > 0 ? body.condition : ['true'],
      result: body.result !== undefined ? body.result : 'true',
      status: body.status || 'draft',
      stateCategory: body.stateCategory || 'Initial',
      ruleCharacteristic: Array.isArray(body.ruleCharacteristic) ? body.ruleCharacteristic : [],
      managedAssetGroup: body.managedAssetGroup || { entityType: 'SKU', entity: [] },
      createdDate: body.createdDate || now,
      updatedDate: now
    };

    await upsertMapperRulesBatch(envName, [newRule], 'new');
    res.status(201).json({ ...newRule, _meta: { syncState: 'new' } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/dnext/mapper-rules/:id
 * Update a Mapper Rule locally in SQLite (marks sync_state = 'modified' unless 'new')
 */
router.patch('/mapper-rules/:id', async (req, res) => {
  try {
    const envName = resolveEnvName(req);
    const { id } = req.params;
    const existingRow = await queryOne('SELECT sync_state, payload FROM dnext_mapper_rules WHERE env_name = ? AND id = ?', [envName, id]);

    const existingRule = existingRow ? JSON.parse(existingRow.payload) : {};
    const nextSyncState = existingRow?.sync_state === 'new' ? 'new' : 'modified';

    const updated = {
      ...existingRule,
      ...(req.body || {}),
      id,
      category: Array.isArray(req.body?.category) && req.body.category.length > 0 ? req.body.category : ['mapperRules'],
      updatedDate: new Date().toISOString()
    };
    delete updated._meta;

    await upsertMapperRulesBatch(envName, [updated], nextSyncState);
    res.json({ ...updated, _meta: { syncState: nextSyncState } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/dnext/mapper-rules/:id/push
 * Push local create/edit to live DNEXT Rule Engine (drule-api)
 */
router.post('/mapper-rules/:id/push', async (req, res) => {
  try {
    const envName = resolveEnvName(req);
    const { id } = req.params;
    const apiUrl = req.headers['x-dnext-api-url'] || 'https://dpc-api.test-gcu.com';
    const authUrl = req.headers['x-dnext-auth-url'] || 'https://diam.test-gcu.com/realms/orbitant-realm/protocol/openid-connect/token';
    const druleBaseUrl = resolveDruleBaseUrl(req);
    let authToken = await resolveAuthToken(req, envName, apiUrl, authUrl);

    if (!authToken) {
      return res.status(401).json({ error: 'Authentication required to push to DNEXT Rule Engine.' });
    }

    const row = await queryOne('SELECT sync_state, payload FROM dnext_mapper_rules WHERE env_name = ? AND id = ?', [envName, id]);
    let rulePayload = req.body && req.body.id ? { ...req.body } : (row ? JSON.parse(row.payload) : null);
    if (!rulePayload) {
      return res.status(404).json({ error: `Mapper rule ${id} not found.` });
    }
    delete rulePayload._meta;

    const isNew = row?.sync_state === 'new';
    const targetUrl = isNew
      ? `${druleBaseUrl}/api/ruleEngine/v1/rule`
      : `${druleBaseUrl}/api/ruleEngine/v1/rule/${encodeURIComponent(id)}`;
    let method = isNew ? 'POST' : 'PATCH';

    const sendPush = (m, url) => fetch(url, {
      method: m,
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json;charset=utf-8',
        'Accept': 'application/json;charset=utf-8'
      },
      body: JSON.stringify(rulePayload)
    });

    let pushRes = await sendPush(method, targetUrl);
    if (pushRes.status === 401) {
      const fresh = await resolveAuthToken(req, envName, apiUrl, authUrl, true);
      if (fresh) {
        authToken = fresh;
        res.setHeader('x-refreshed-token', fresh.replace(/^Bearer\s+/i, ''));
        pushRes = await sendPush(method, targetUrl);
      }
    }

    // Fallback: if PATCH returns 404 (not on remote yet), POST to collection; if 405, try PUT
    if (!isNew && pushRes.status === 404) {
      pushRes = await sendPush('POST', `${druleBaseUrl}/api/ruleEngine/v1/rule`);
    } else if (!isNew && pushRes.status === 405) {
      pushRes = await sendPush('PUT', targetUrl);
    }

    const resText = await pushRes.text();
    let resData = null;
    try { resData = JSON.parse(resText); } catch { resData = { raw: resText }; }

    if (!pushRes.ok) {
      return res.status(pushRes.status).json({
        error: `Push failed with HTTP ${pushRes.status}`,
        details: resData
      });
    }

    const savedRule = (resData && resData.id) ? resData : rulePayload;
    await upsertMapperRulesBatch(envName, [savedRule], 'synced');

    res.json({
      pushed: true,
      rule: { ...savedRule, _meta: { syncState: 'synced' } }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/dnext/mapper-rules/:id
 */
router.delete('/mapper-rules/:id', async (req, res) => {
  try {
    const envName = resolveEnvName(req);
    const { id } = req.params;
    const deleteRemote = req.query.remote === 'true';

    if (deleteRemote) {
      const apiUrl = req.headers['x-dnext-api-url'] || 'https://dpc-api.test-gcu.com';
      const authUrl = req.headers['x-dnext-auth-url'] || 'https://diam.test-gcu.com/realms/orbitant-realm/protocol/openid-connect/token';
      const druleBaseUrl = resolveDruleBaseUrl(req);
      const authToken = await resolveAuthToken(req, envName, apiUrl, authUrl);
      if (!authToken) {
        return res.status(401).json({ error: 'Authentication required to delete from remote DNEXT Rule Engine.' });
      }
      const delRes = await fetch(`${druleBaseUrl}/api/ruleEngine/v1/rule/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Authorization': authToken, 'Accept': 'application/json' }
      });
      if (!delRes.ok && delRes.status !== 404) {
        return res.status(delRes.status).json({ error: `Remote delete failed with HTTP ${delRes.status}` });
      }
    }

    await runSql('DELETE FROM dnext_mapper_rule_skus WHERE env_name = ? AND rule_id = ?', [envName, id]);
    await runSql('DELETE FROM dnext_mapper_rules WHERE env_name = ? AND id = ?', [envName, id]);

    res.json({ success: true, deletedId: id, remote: deleteRemote });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
