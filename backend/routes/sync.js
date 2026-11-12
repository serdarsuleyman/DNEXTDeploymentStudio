const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { dnextFetch, fetchPaginatedDnextCollection, getAutoToken } = require('../services/dnextClient');
const { clearCatalogCache } = require('../services/db');

const LOCAL_CATEGORIES_PATH = path.join(__dirname, '..', 'data', 'local_categories.json');

async function getEffectiveAuthHeader(req) {
  let authHeader = req.headers.authorization;
  if (!authHeader || authHeader === 'Bearer' || authHeader === 'Bearer null' || authHeader === 'Bearer undefined') {
    const token = await getAutoToken(req.headers['x-dnext-env-name'], req.headers['x-dnext-api-url'], req.headers['x-dnext-auth-url']);
    if (token) return `Bearer ${token}`;
  }
  return authHeader;
}

/**
 * GET /api/dnext/categories (Remote DNEXT Categories)
 */
router.get('/categories', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    const { items, totalCount, refreshedToken, fromCache, cachedAt } = await fetchPaginatedDnextCollection(
      '/api/productCatalogManagement/v4/category',
      req.query,
      authHeader
    );

    if (refreshedToken) res.setHeader('x-refreshed-token', refreshedToken);
    if (fromCache) res.setHeader('x-from-cache', 'true');
    if (cachedAt) res.setHeader('x-cache-updated-at', cachedAt);
    res.setHeader('x-total-count', totalCount);
    res.json(items);
  } catch (error) {
    console.error('[Sync] GET remote categories error:', error);
    res.status(error.status || 500).json(error.data || { error: error.message });
  }
});

/**
 * GET /api/dnext/categories/:id
 */
router.get('/categories/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    const { id } = req.params;
    const apiResponse = await dnextFetch(`https://dpc-api.pi.dev-gcu.com/api/productCatalogManagement/v4/category/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });

    const data = await apiResponse.json();
    if (!apiResponse.ok) {
      return res.status(apiResponse.status).json(data);
    }
    res.json(data);
  } catch (error) {
    console.error('[Sync] GET remote category by ID error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/dnext/categories
 */
router.post('/categories', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    const apiResponse = await dnextFetch('https://dpc-api.pi.dev-gcu.com/api/productCatalogManagement/v4/category', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json;charset=utf-8',
        'Accept': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await apiResponse.json();
    if (!apiResponse.ok) {
      return res.status(apiResponse.status).json(data);
    }
    res.json(data);
  } catch (error) {
    console.error('[Sync] POST category error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/dnext/categories/:id
 */
router.delete('/categories/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    const { id } = req.params;
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const targetUrl = `https://dpc-api.pi.dev-gcu.com/api/productCatalogManagement/v4/category/${encodeURIComponent(id)}${queryString}`;

    const apiResponse = await dnextFetch(targetUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });

    if (apiResponse.status === 204) {
      return res.status(204).send();
    }

    let data;
    try {
      data = await apiResponse.json();
    } catch {
      data = { status: apiResponse.status };
    }

    res.status(apiResponse.status).json(data);
  } catch (error) {
    console.error('[Sync] DELETE category error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/dnext/local-categories
 * Returns local category reference dataset
 */
router.get('/local-categories', (req, res) => {
  try {
    if (fs.existsSync(LOCAL_CATEGORIES_PATH)) {
      const data = JSON.parse(fs.readFileSync(LOCAL_CATEGORIES_PATH, 'utf8'));
      return res.json(data);
    }
    res.json([]);
  } catch (error) {
    console.error('[Sync] Fetch local categories error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/dnext/cache/clear
 * Clears the persistent SQLite catalog cache
 */
router.post('/cache/clear', async (req, res) => {
  try {
    const env = req.query.env || req.headers['x-dnext-env-name'] || null;
    await clearCatalogCache(env);
    res.json({ success: true, cleared: true, env: env || 'all' });
  } catch (error) {
    console.error('[Sync] Clear cache error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
