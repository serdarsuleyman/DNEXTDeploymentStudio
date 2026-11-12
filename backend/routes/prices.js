const express = require('express');
const router = express.Router();
const { dnextFetch, fetchPaginatedDnextCollection, getAutoToken } = require('../services/dnextClient');

async function getEffectiveAuthHeader(req) {
  let authHeader = req.headers.authorization;
  if (!authHeader || authHeader === 'Bearer' || authHeader === 'Bearer null' || authHeader === 'Bearer undefined') {
    const token = await getAutoToken(req.headers['x-dnext-env-name'], req.headers['x-dnext-api-url'], req.headers['x-dnext-auth-url']);
    if (token) return `Bearer ${token}`;
  }
  return authHeader;
}

/**
 * GET /api/dnext/product-offering-prices
 */
router.get('/product-offering-prices', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    const { items, totalCount, refreshedToken, fromCache, cachedAt } = await fetchPaginatedDnextCollection(
      '/api/productCatalogManagement/v4/productOfferingPrice',
      req.query,
      authHeader
    );

    if (refreshedToken) res.setHeader('x-refreshed-token', refreshedToken);
    if (fromCache) res.setHeader('x-from-cache', 'true');
    if (cachedAt) res.setHeader('x-cache-updated-at', cachedAt);
    res.setHeader('x-total-count', totalCount);
    res.json(items);
  } catch (error) {
    console.error('[Prices] GET error:', error);
    res.status(error.status || 500).json(error.data || { error: error.message });
  }
});

/**
 * POST /api/dnext/product-offering-prices (V0 -> V1 Launched sequence)
 */
router.post('/product-offering-prices', async (req, res) => {
  try {
    const authHeader = await getEffectiveAuthHeader(req);
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    const payload = req.body;
    const popId = payload.id;
    if (!popId) {
      return res.status(400).json({ error: 'id is required' });
    }

    // Step 1: Check if already exists
    const checkResponse = await dnextFetch(`https://dpc-api.pi.dev-gcu.com/api/productCatalogManagement/v4/productOfferingPrice/${encodeURIComponent(popId)}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });

    if (checkResponse.ok) {
      return res.status(400).json({ error: `Product Offering Price with ID ${popId} already exists.` });
    }

    const startDateTime = new Date(Date.now() + 3 * 60 * 1000).toISOString();

    // Step 2: Create V0
    const payloadV0 = {
      ...payload,
      version: "0",
      validFor: {
        ...payload.validFor,
        startDateTime: startDateTime
      }
    };

    const createV0Response = await dnextFetch('https://dpc-api.pi.dev-gcu.com/api/productCatalogManagement/v4/productOfferingPrice', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json;charset=utf-8',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payloadV0)
    });

    const dataV0 = await createV0Response.json();
    if (!createV0Response.ok) {
      return res.status(createV0Response.status).json({
        error: 'Failed to create version 0',
        dnextResponse: dataV0
      });
    }

    // Step 3: Re-post as V1 Launched
    const payloadV1 = {
      ...payload,
      version: "1",
      lifecycleStatus: "Launched",
      validFor: {
        ...payload.validFor,
        startDateTime: startDateTime
      }
    };

    const createV1Response = await dnextFetch('https://dpc-api.pi.dev-gcu.com/api/productCatalogManagement/v4/productOfferingPrice', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json;charset=utf-8',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payloadV1)
    });

    const dataV1 = await createV1Response.json();
    if (!createV1Response.ok) {
      return res.status(createV1Response.status).json({
        error: 'Created version 0 but failed to re-post version 1',
        createdV0: dataV0,
        dnextResponse: dataV1
      });
    }

    res.status(201).json(dataV1);
  } catch (error) {
    console.error('[Prices] POST sequence error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
