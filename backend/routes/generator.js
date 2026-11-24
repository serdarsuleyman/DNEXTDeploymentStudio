const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { generateSalesPackage, PRESETS } = require('../services/salesPackageEngine');
const { queryOne, runSql, getTmfPackagesDir, resolvePackageDir, STUDIO_ROOT } = require('../services/db');

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

/**
 * POST /api/sales-package/publish-envelope
 * Receives the synchronous deployment envelope, writes sub-entity JSON files to the filesystem
 * in the selected deployment package directory (e.g. tmf_packages/demo_deployment),
 * and registers them into dnext_deployment_item.
 */
router.post('/publish-envelope', async (req, res) => {
  try {
    const {
      deploymentPackageId = 'demo_deployment',
      newPackage,
      envelope
    } = req.body || {};

    if (!envelope || !Array.isArray(envelope.messages) || envelope.messages.length === 0) {
      return res.status(400).json({ error: 'Envelope with messages array is required.' });
    }

    const now = new Date().toISOString();
    const pkgId = (deploymentPackageId || 'demo_deployment').trim();

    // 1. If user requested to create a new deployment package
    if (newPackage && newPackage.id) {
      const newPkgId = newPackage.id.trim();
      const newPkgName = (newPackage.name || newPkgId).trim();
      const newPkgType = newPackage.type || 'Custom';
      const newPkgDesc = newPackage.description || '';
      const newPkgPath = newPackage.file_path || `tmf_packages/${newPkgId}`;

      await runSql(
        `INSERT OR IGNORE INTO dnext_deployment_package (id, name, type, description, file_path, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newPkgId, newPkgName, newPkgType, newPkgDesc, newPkgPath, now, now]
      );
    }

    // 2. Fetch or auto-create package record
    let pkg = await queryOne('SELECT * FROM dnext_deployment_package WHERE id = ?', [pkgId]);
    if (!pkg) {
      const defaultPath = pkgId === 'demo_deployment' ? 'tmf_packages/demo_deployment' : `tmf_packages/${pkgId}`;
      await runSql(
        `INSERT OR IGNORE INTO dnext_deployment_package (id, name, type, description, file_path, created_at, updated_at)
         VALUES (?, ?, 'Custom', 'Synchronous Envelope Deployment Package', ?, ?, ?)`,
        [pkgId, pkgId, defaultPath, now, now]
      );
      pkg = await queryOne('SELECT * FROM dnext_deployment_package WHERE id = ?', [pkgId]);
    }

    // 3. Resolve base destination folder on disk
    let baseDir = null;
    if (pkg && pkg.file_path) {
      baseDir = resolvePackageDir(pkg.file_path);
    }
    if (!baseDir) {
      baseDir = path.join(getTmfPackagesDir(), pkgId);
    }

    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    // 4. Process each message in the envelope
    const savedItems = [];

    for (const msg of envelope.messages) {
      const {
        entityType = 'ProductOffering',
        entityId,
        entityName,
        body
      } = msg;

      if (!entityId || !body) continue;

      // Ensure lifecycleStatus is 'In study' for all reviewed & published deployment entities
      body.lifecycleStatus = 'In study';

      let subDir;
      let offerType;

      const isSimplePop = msg.subType === 'sub_price_components' ||
        entityId.endsWith('_bw') ||
        entityId.endsWith('_in') ||
        entityId.endsWith('_va') ||
        entityId.endsWith('_vt') ||
        (entityType === 'ProductOfferingPrice' && body.isBundle === false);

      if (entityType === 'ProductOffering') {
        subDir = path.join(baseDir, 'offer');
        offerType = 'SalesPackage';
      } else if (entityType === 'ProductOfferingPrice') {
        if (isSimplePop) {
          subDir = path.join(baseDir, 'prices', 'sub_price_components');
          offerType = 'PriceComponent';
        } else {
          subDir = path.join(baseDir, 'prices', 'bundle_pops');
          offerType = 'BundledPOP';
        }
      } else {
        subDir = path.join(baseDir, entityType.toLowerCase());
        offerType = entityType;
      }

      if (!fs.existsSync(subDir)) {
        fs.mkdirSync(subDir, { recursive: true });
      }

      const filePath = path.join(subDir, `${entityId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(body, null, 2), 'utf8');

      // Compute relative path
      const relPath = path.relative(STUDIO_ROOT, filePath).replace(/\\/g, '/');

      const resolvedOfferType = offerType || (entityType === 'ProductOffering' ? 'SalesPackage' : 'BundledPOP');
      const version = String(body.version || '0');
      const displayName = entityName || body.name || entityId;

      await runSql(`
        INSERT INTO dnext_deployment_item
          (dnext_entity_id, dnext_entity_type, dnext_version, vf_de_offer_id, vf_de_offer_type,
           sync_status, file_path, entity_name, deployment_package_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
        ON CONFLICT(dnext_entity_id) DO UPDATE SET
          dnext_entity_type     = excluded.dnext_entity_type,
          dnext_version         = excluded.dnext_version,
          vf_de_offer_id        = excluded.vf_de_offer_id,
          vf_de_offer_type      = excluded.vf_de_offer_type,
          sync_status           = 'pending',
          file_path             = excluded.file_path,
          entity_name           = excluded.entity_name,
          deployment_package_id = excluded.deployment_package_id,
          updated_at            = excluded.updated_at
      `, [
        entityId,
        entityType,
        version,
        entityId,
        resolvedOfferType,
        relPath,
        displayName,
        pkgId,
        now,
        now
      ]);

      savedItems.push({
        id: entityId,
        type: entityType,
        name: displayName,
        filePath: relPath,
        packageId: pkgId
      });
    }

    // 5. Persist associated CCB tariffs & services if included on the envelope
    let ccbAssociationsFile = null;
    if (envelope.ccbAssociations && (envelope.ccbAssociations.tariffs?.length || envelope.ccbAssociations.services?.length)) {
      const assocPath = path.join(baseDir, 'ccb_associations.json');
      fs.writeFileSync(assocPath, JSON.stringify(envelope.ccbAssociations, null, 2), 'utf8');
      ccbAssociationsFile = path.relative(STUDIO_ROOT, assocPath).replace(/\\/g, '/');
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${savedItems.length} entities in '${pkgId}' under folder '${path.relative(STUDIO_ROOT, baseDir)}'.`,
      ccbAssociationsFile,
      deploymentPackageId: pkgId,
      packageDir: path.relative(STUDIO_ROOT, baseDir),
      items: savedItems
    });
  } catch (err) {
    console.error('[PublishEnvelope] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
