const express = require('express');
const router = express.Router();
const { dnextFetch } = require('../services/dnextClient');

/**
 * Live DNEXT Product Catalog Proxy
 * e.g., /api/dnext-product-offering?... -> https://dpc-api.pi.dev-gcu.com/api/productCatalogManagement/v4/productOffering?...
 */
router.all('*', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is required' });
  }

  const targetPath = req.url;
  const targetUrl = `https://dpc-api.pi.dev-gcu.com/api/productCatalogManagement/v4/productOffering${targetPath}`;
  
  try {
    const options = {
      method: req.method,
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    };
    
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      options.headers['Content-Type'] = 'application/json;charset=utf-8';
      options.body = JSON.stringify(req.body);
    }
    
    const apiResponse = await dnextFetch(targetUrl, options);
    
    let data;
    try {
      data = await apiResponse.json();
    } catch {
      data = { status: apiResponse.status };
    }
    
    res.status(apiResponse.status).json(data);
  } catch (error) {
    console.error('[ProductCatalogProxy] Error:', error);
    res.status(500).json({ error: 'Proxy request failed: ' + error.message });
  }
});

module.exports = router;
