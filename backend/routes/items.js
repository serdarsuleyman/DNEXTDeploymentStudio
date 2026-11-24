const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { db, queryAll, queryOne, collectRegistryRows, collectRowsForPackage, scanAndSyncPackage, invalidateCatalogCache, STUDIO_ROOT } = require('../services/db');

/**
 * GET /api/dnext-deployment-item
 * Returns all rows from dnext_deployment_item.
 * Optional query params:
 *   ?entity_type=ProductOffering|ProductOfferingPrice|ProductSpecification
 *   ?offer_type=TV|Hardware|CallOption|SalesPackage|FiberConnectivity|RegioSurcharge|VoiceAnschluss|Specification
 *   ?status=pending|synced|error
 *   ?package_id=vf-germany-poc
 */
router.get('/', (req, res) => {
  const { entity_type, offer_type, status, package_id } = req.query;

  let sql = 'SELECT * FROM dnext_deployment_item WHERE 1=1';
  const params = [];

  if (entity_type)  { sql += ' AND dnext_entity_type = ?';       params.push(entity_type); }
  if (offer_type)   { sql += ' AND vf_de_offer_type = ?';        params.push(offer_type); }
  if (status)       { sql += ' AND sync_status = ?';             params.push(status); }
  if (package_id)   { sql += ' AND deployment_package_id = ?';   params.push(package_id); }

  sql += ' ORDER BY CASE WHEN dnext_entity_type = \'ProductOffering\' THEN 0 ELSE 1 END, dnext_entity_type, vf_de_offer_type, dnext_entity_id';

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('[Items] GET error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ total: rows.length, rows: rows || [] });
  });
});

/**
 * POST /api/dnext-deployment-item/reset
 * Re-seeds items from package configured file paths.
 * Optional body: { package_id } to reset only a specific package.
 */
router.post('/reset', async (req, res) => {
  const { package_id } = req.body || {};

  try {
    if (package_id) {
      const result = await scanAndSyncPackage(package_id);
      return res.json({
        message: `Package '${package_id}' re-scanned and synchronized successfully.`,
        package_id,
        total_seeded: result.count,
        reset_at: result.synced_at
      });
    }

    const packages = await queryAll('SELECT * FROM dnext_deployment_package');
    let totalSeeded = 0;
    const now = new Date().toISOString();

    for (const pkg of packages) {
      if (pkg.file_path) {
        try {
          const scanRes = await scanAndSyncPackage(pkg.id);
          totalSeeded += (scanRes.count || 0);
        } catch (e) {
          console.warn(`[Items Reset] Skipped package ${pkg.id}:`, e.message);
        }
      }
    }

    db.all(
      `SELECT dnext_entity_type, vf_de_offer_type, COUNT(*) as count
       FROM dnext_deployment_item
       GROUP BY dnext_entity_type, vf_de_offer_type
       ORDER BY dnext_entity_type, vf_de_offer_type`,
      (sumErr, summary) => {
        res.json({
          message: 'All package deployment items synchronized successfully.',
          total_seeded: totalSeeded,
          reset_at: now,
          summary: sumErr ? [] : summary,
        });
      }
    );
  } catch (err) {
    console.error('[Items] Reset error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/dnext-deployment-item/:dnext_entity_id
 * Update sync_status and dnext_version.
 */
router.patch('/:dnext_entity_id', (req, res) => {
  const { dnext_entity_id } = req.params;
  const { sync_status, dnext_version } = req.body;

  if (!sync_status) {
    return res.status(400).json({ error: '`sync_status` is required in the request body.' });
  }

  const allowed = ['pending', 'synced', 'error'];
  if (!allowed.includes(sync_status)) {
    return res.status(400).json({ error: `sync_status must be one of: ${allowed.join(', ')}` });
  }

  const now = new Date().toISOString();
  const fields = ['sync_status = ?', 'updated_at = ?'];
  const params = [sync_status, now];

  if (dnext_version !== undefined) {
    fields.push('dnext_version = ?');
    params.push(String(dnext_version));
  }

  if (sync_status === 'synced') {
    fields.push('last_synced_at = ?');
    params.push(now);
  }

  params.push(dnext_entity_id);

  const sql = `UPDATE dnext_deployment_item SET ${fields.join(', ')} WHERE dnext_entity_id = ?`;

  db.run(sql, params, function (err) {
    if (err) {
      console.error('[Items] PATCH error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: `Entity '${dnext_entity_id}' not found in registry.` });
    }
    res.json({ updated: dnext_entity_id, sync_status, updated_at: now });
  });
});

/**
 * PATCH /api/dnext-deployment-item/:dnext_entity_id/package
 * Assign a deployment item to a package.
 */
router.patch('/:dnext_entity_id/package', (req, res) => {
  const { dnext_entity_id } = req.params;
  const { deployment_package_id } = req.body;
  if (!deployment_package_id) {
    return res.status(400).json({ error: '`deployment_package_id` is required.' });
  }
  const now = new Date().toISOString();
  db.run(
    'UPDATE dnext_deployment_item SET deployment_package_id = ?, updated_at = ? WHERE dnext_entity_id = ?',
    [deployment_package_id, now, dnext_entity_id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: `Item '${dnext_entity_id}' not found.` });
      res.json({ dnext_entity_id, deployment_package_id });
    }
  );
});

/**
 * DELETE /api/dnext-deployment-item/:dnext_entity_id
 * Remove an item from the local deployment registry and delete its file from disk.
 */
router.delete('/:dnext_entity_id', (req, res) => {
  const { dnext_entity_id } = req.params;
  const deleteFile = req.query.deleteFile !== 'false';

  db.get('SELECT file_path FROM dnext_deployment_item WHERE dnext_entity_id = ?', [dnext_entity_id], (lookupErr, row) => {
    if (lookupErr) {
      console.error('[Items] DELETE lookup error:', lookupErr.message);
      return res.status(500).json({ error: lookupErr.message });
    }

    let fileDeleted = false;
    const filePath = row ? row.file_path : null;

    if (deleteFile && filePath) {
      const candidates = [
        path.resolve(STUDIO_ROOT, filePath),
        path.resolve(STUDIO_ROOT, 'tmf_packages', filePath),
        filePath
      ];
      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          try {
            fs.unlinkSync(cand);
            fileDeleted = true;
            console.log(`[Items] Successfully deleted file: ${cand}`);
            break;
          } catch (fileErr) {
            console.warn(`[Items] Could not delete file ${cand}:`, fileErr.message);
          }
        }
      }
    }

    db.run('DELETE FROM dnext_deployment_item WHERE dnext_entity_id = ?', [dnext_entity_id], async function (delErr) {
      if (delErr) {
        console.error('[Items] DELETE error:', delErr.message);
        return res.status(500).json({ error: delErr.message });
      }
      await invalidateCatalogCache(null, dnext_entity_id);
      res.json({ success: true, deleted: dnext_entity_id, fileDeleted });
    });
  });
});

/**
 * POST /api/dnext-deployment-item/bulk-delete
 * Remove multiple items from the local deployment registry and delete their files from disk.
 */
router.post('/bulk-delete', (req, res) => {
  const { ids, deleteFile = true } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '`ids` array is required.' });
  }

  const placeholders = ids.map(() => '?').join(',');
  db.all(`SELECT dnext_entity_id, file_path FROM dnext_deployment_item WHERE dnext_entity_id IN (${placeholders})`, ids, (lookupErr, rows) => {
    if (lookupErr) {
      console.error('[Items] bulk-delete lookup error:', lookupErr.message);
      return res.status(500).json({ error: lookupErr.message });
    }

    if (deleteFile && Array.isArray(rows)) {
      for (const row of rows) {
        if (row.file_path) {
          const candidates = [
            path.resolve(STUDIO_ROOT, row.file_path),
            path.resolve(STUDIO_ROOT, 'tmf_packages', row.file_path),
            row.file_path
          ];
          for (const cand of candidates) {
            if (fs.existsSync(cand)) {
              try {
                fs.unlinkSync(cand);
                console.log(`[Items] Successfully deleted file: ${cand}`);
                break;
              } catch (fileErr) {
                console.warn(`[Items] Could not delete file ${cand}:`, fileErr.message);
              }
            }
          }
        }
      }
    }

    db.run(`DELETE FROM dnext_deployment_item WHERE dnext_entity_id IN (${placeholders})`, ids, async function (delErr) {
      if (delErr) {
        console.error('[Items] bulk-delete error:', delErr.message);
        return res.status(500).json({ error: delErr.message });
      }
      for (const id of ids) {
        await invalidateCatalogCache(null, id);
      }
      res.json({ success: true, deletedCount: this.changes });
    });
  });
});

module.exports = router;
