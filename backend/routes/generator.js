const express = require('express');
const router = express.Router();
const { generateSalesPackage, PRESETS } = require('../services/salesPackageEngine');

/**
 * GET /api/sales-package/presets
 * Returns pre-configured templates for sales package creation.
 */
router.get('/presets', (req, res) => {
  res.json({ presets: PRESETS });
});

/**
 * POST /api/sales-package/generate
 * Generates all TMF 620 JSON files and registers them into POC_V2 deployment package.
 */
router.post('/generate', async (req, res) => {
  try {
    const config = req.body;
    if (!config || !config.name) {
      return res.status(400).json({ error: 'Package `name` is required.' });
    }
    const result = await generateSalesPackage(config);
    res.status(201).json(result);
  } catch (err) {
    console.error('[SalesPackageGenerator] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
