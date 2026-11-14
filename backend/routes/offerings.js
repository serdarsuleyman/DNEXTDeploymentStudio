const express = require('express');
const router = express.Router();
const { dnextFetch, fetchPaginatedDnextCollection, getAutoToken } = require('../services/dnextClient');
const { getCatalogCache } = require('../services/db');

async function getEffectiveAuthHeader(req) {
  let authHeader = req.headers.authorization;
  if (!authHeader || authHeader === 'Bearer' || authHeader === 'Bearer null' || authHeader === 'Bearer undefined') {
    const token = await getAutoToken(req.headers['x-dnext-env-name'], req.headers['x-dnext-api-url'], req.headers['x-dnext-auth-url']);
    if (token) return `Bearer ${token}`;
  }
  return authHeader;
}

/**
 * GET /api/dnext/product-offerings
 */
router.get('/product-offerings', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    const { items, totalCount, refreshedToken, fromCache, cachedAt } = await fetchPaginatedDnextCollection(
      '/api/productCatalogManagement/v4/productOffering',
      req.query,
      authHeader
    );

    if (refreshedToken) res.setHeader('x-refreshed-token', refreshedToken);
    if (fromCache) res.setHeader('x-from-cache', 'true');
    if (cachedAt) res.setHeader('x-cache-updated-at', cachedAt);
    res.setHeader('x-total-count', totalCount);
    res.json(items);
  } catch (error) {
    const catId = req.query['extensions.categoryGroupings.category.id'] || req.query['category.id'];
    if (catId) {
      try {
        const envName = (req.headers['x-dnext-env-name'] || 'default').toLowerCase();
        let allOffersCache = await getCatalogCache(`${envName}:/api/productCatalogManagement/v4/productOffering:limit=1000`);
        if (!allOffersCache?.payload) {
          allOffersCache = await getCatalogCache(`dpc_ui.test-g:/api/productCatalogManagement/v4/productOffering:limit=1000`);
        }
        if (!allOffersCache?.payload) {
          allOffersCache = await getCatalogCache(`test:/api/productCatalogManagement/v4/productOffering:limit=1000`);
        }
        if (allOffersCache?.payload) {
          const allOffers = JSON.parse(allOffersCache.payload);
          const matched = allOffers.filter(offer => {
            const groupings = offer.extensions?.categoryGroupings || [];
            return groupings.some(g => (g.category || []).some(c => String(c.id).toLowerCase() === String(catId).toLowerCase()));
          });
          console.log(`[Offerings] Cache fallback: Filtered ${matched.length} offers for category ${catId}`);
          res.setHeader('x-from-cache', 'true');
          res.setHeader('x-total-count', matched.length);
          return res.json(matched);
        }
      } catch (fallbackErr) {
        console.warn('[Offerings] Cache fallback error:', fallbackErr.message);
      }
    }
    console.error('[Offerings] GET error:', error);
    res.status(error.status || 500).json(error.data || { error: error.message });
  }
});

/**
 * GET /api/dnext/product-offerings/test-category-queries
 * Diagnostic tool to test which query candidate works against live DNEXT gateway
 */
router.get('/product-offerings-test-queries', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    const categoryId = req.query.categoryId || 'FN155';
    const baseUrl = req.headers['x-dnext-api-url'] || 'https://dpc-api.test-gcu.com';

    const candidates = [
      {
        id: 'nested_dot_notation',
        label: '1. extensions.categoryGroupings.category.id={id}',
        url: `${baseUrl}/api/productCatalogManagement/v4/productOffering?extensions.categoryGroupings.category.id=${encodeURIComponent(categoryId)}&limit=10`
      },
      {
        id: 'unwrapped_dot_notation',
        label: '2. categoryGroupings.category.id={id}',
        url: `${baseUrl}/api/productCatalogManagement/v4/productOffering?categoryGroupings.category.id=${encodeURIComponent(categoryId)}&limit=10`
      },
      {
        id: 'root_category_id',
        label: '3. category.id={id}',
        url: `${baseUrl}/api/productCatalogManagement/v4/productOffering?category.id=${encodeURIComponent(categoryId)}&limit=10`
      },
      {
        id: 'tmf_eq_operator',
        label: '4. extensions.categoryGroupings.category.id.eq={id}',
        url: `${baseUrl}/api/productCatalogManagement/v4/productOffering?extensions.categoryGroupings.category.id.eq=${encodeURIComponent(categoryId)}&limit=10`
      },
      {
        id: 'category_resource_direct',
        label: '5. Direct Category Resource: /category/{id}',
        url: `${baseUrl}/api/productCatalogManagement/v4/category/${encodeURIComponent(categoryId)}`
      }
    ];

    const results = [];
    for (const cand of candidates) {
      try {
        const resp = await dnextFetch(cand.url, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json'
          }
        });
        const status = resp.status;
        let data = null;
        try {
          data = await resp.json();
        } catch (e) {
          data = null;
        }

        let count = 0;
        let sampleItems = [];
        if (Array.isArray(data)) {
          count = data.length;
          sampleItems = data.slice(0, 3).map(o => ({ id: o.id, name: o.name }));
        } else if (data && typeof data === 'object') {
          const po = Array.isArray(data.productOffering) ? data.productOffering : [];
          count = po.length;
          sampleItems = po.slice(0, 3).map(o => ({ id: o.id, name: o.name }));
        }

        results.push({
          candidate: cand.label,
          status,
          success: status === 200 && count > 0,
          count,
          totalCountHeader: resp.headers?.get ? resp.headers.get('x-total-count') : null,
          sampleItems,
          url: cand.url
        });
      } catch (err) {
        results.push({
          candidate: cand.label,
          status: 500,
          success: false,
          error: err.message,
          url: cand.url
        });
      }
    }

    res.json({
      categoryId,
      baseUrl,
      testedAt: new Date().toISOString(),
      results
    });
  } catch (error) {
    console.error('[test-category-queries] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/dnext/product-offerings/:id
 */
router.get('/product-offerings/:id', async (req, res) => {
  try {
    const authHeader = await getEffectiveAuthHeader(req);
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    const { id } = req.params;
    const apiResponse = await dnextFetch(`https://dpc-api.pi.dev-gcu.com/api/productCatalogManagement/v4/productOffering/${encodeURIComponent(id)}`, {
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
    console.error('[Offerings] GET by ID error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/dnext/product-offerings (V0 In study -> V1 Launched sequence)
 */
router.post('/product-offerings', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    const payload = req.body;
    const offerId = payload.id;
    if (!offerId) {
      return res.status(400).json({ error: 'id is required' });
    }

    // Step 1: Check if offering already exists
    const checkResponse = await dnextFetch(`https://dpc-api.pi.dev-gcu.com/api/productCatalogManagement/v4/productOffering/${encodeURIComponent(offerId)}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });

    if (checkResponse.ok) {
      return res.status(400).json({ error: `Product Offering with ID ${offerId} already exists.` });
    }

    const startDateTime = new Date(Date.now() + 3 * 60 * 1000).toISOString();

    // Step 2: Create V0 (In study)
    const payloadV0 = {
      ...payload,
      version: "0",
      lifecycleStatus: "In study",
      validFor: {
        ...payload.validFor,
        startDateTime: startDateTime
      }
    };

    const createV0Response = await dnextFetch('https://dpc-api.pi.dev-gcu.com/api/productCatalogManagement/v4/productOffering', {
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

    // Step 3: Re-post as V1 (Launched)
    const payloadV1 = {
      ...payload,
      version: "1",
      lifecycleStatus: "Launched",
      validFor: {
        ...payload.validFor,
        startDateTime: startDateTime
      }
    };

    const createV1Response = await dnextFetch('https://dpc-api.pi.dev-gcu.com/api/productCatalogManagement/v4/productOffering', {
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
    console.error('[Offerings] POST sequence error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/dnext/product-offerings/:id
 */
router.delete('/product-offerings/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    const { id } = req.params;
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const targetUrl = `https://dpc-api.pi.dev-gcu.com/api/productCatalogManagement/v4/productOffering/${encodeURIComponent(id)}${queryString}`;

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
    console.error('[Offerings] DELETE error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
