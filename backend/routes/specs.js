const express = require('express');
const router = express.Router();
const { dnextFetch } = require('../services/dnextClient');

/**
 * GET /api/dnext/product-specifications
 */
router.get('/product-specifications', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    const url = new URL('https://dpc-api.pi.dev-gcu.com/api/productCatalogManagement/v4/productSpecification');
    Object.keys(req.query).forEach(key => {
      url.searchParams.append(key, req.query[key]);
    });

    const apiResponse = await dnextFetch(url.toString(), {
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
    console.error('[Specs] GET error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/dnext/product-specifications/:id
 */
router.get('/product-specifications/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    const { id } = req.params;
    const apiResponse = await dnextFetch(`https://dpc-api.pi.dev-gcu.com/api/productCatalogManagement/v4/productSpecification/${encodeURIComponent(id)}`, {
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
    console.error('[Specs] GET by ID error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/dnext/product-specifications (V0 In study -> V1 Launched sequence)
 */
router.post('/product-specifications', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    const payload = req.body;
    const specId = payload.id;
    if (!specId) {
      return res.status(400).json({ error: 'id is required' });
    }

    // Check existing
    const checkResponse = await dnextFetch(`https://dpc-api.pi.dev-gcu.com/api/productCatalogManagement/v4/productSpecification/${encodeURIComponent(specId)}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });

    if (checkResponse.ok) {
      return res.status(400).json({ error: `Product Specification with ID ${specId} already exists.` });
    }

    const startDateTime = new Date(Date.now() + 3 * 60 * 1000).toISOString();

    // Step 2: Create V0
    const payloadV0 = {
      ...payload,
      version: "0",
      lifecycleStatus: "In study",
      validFor: {
        ...payload.validFor,
        startDateTime: startDateTime
      }
    };

    const createV0Response = await dnextFetch('https://dpc-api.pi.dev-gcu.com/api/productCatalogManagement/v4/productSpecification', {
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

    // Step 3: Re-post as V1
    const payloadV1 = {
      ...payload,
      version: "1",
      lifecycleStatus: "Launched",
      validFor: {
        ...payload.validFor,
        startDateTime: startDateTime
      }
    };

    const createV1Response = await dnextFetch('https://dpc-api.pi.dev-gcu.com/api/productCatalogManagement/v4/productSpecification', {
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
    console.error('[Specs] POST sequence error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/dnext/product-specifications/:id
 */
router.delete('/product-specifications/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    const { id } = req.params;
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const targetUrl = `https://dpc-api.pi.dev-gcu.com/api/productCatalogManagement/v4/productSpecification/${encodeURIComponent(id)}${queryString}`;

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
    console.error('[Specs] DELETE error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
