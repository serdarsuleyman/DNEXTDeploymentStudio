const express = require('express');
const router = express.Router();
const { db, queryAll, queryOne, scanAndSyncPackage, getAvailableFolders } = require('../services/db');

/**
 * GET /api/dnext-deployment-package/available-folders
 * Returns list of folders in tmf_packages for suggestion/autocompletion.
 */
router.get('/available-folders', (req, res) => {
  try {
    const folders = getAvailableFolders();
    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/dnext-deployment-package
 * List all deployment packages with item counts.
 */
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT p.*, COUNT(i.id) AS item_count
      FROM dnext_deployment_package p
      LEFT JOIN dnext_deployment_item i ON i.deployment_package_id = p.id
      GROUP BY p.id
      ORDER BY p.name
    `;
    const rows = await queryAll(sql);
    res.json(rows);
  } catch (err) {
    console.error('Failed to get packages:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/dnext-deployment-package
 * Create a new deployment package.
 * Body: { id, name, type, description, file_path, scan_files }
 */
router.post('/', async (req, res) => {
  const {
    id,
    name,
    type = 'Custom',
    description = '',
    file_path,
    filePath,
    sourcePath,
    scan_files = true
  } = req.body;

  if (!id || !name) {
    return res.status(400).json({ error: '`id` and `name` are required.' });
  }

  const resolvedFilePath = (file_path || filePath || sourcePath || '').trim();
  const now = new Date().toISOString();

  db.run(
    'INSERT INTO dnext_deployment_package (id, name, type, description, file_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id.trim(), name.trim(), type, description, resolvedFilePath || null, now, now],
    async function (err) {
      if (err) return res.status(409).json({ error: err.message });

      let scannedCount = 0;
      if (resolvedFilePath && scan_files) {
        try {
          const scanResult = await scanAndSyncPackage(id.trim());
          scannedCount = scanResult.count || 0;
        } catch (scanErr) {
          console.error(`[Packages] Initial scan error for ${id}:`, scanErr.message);
        }
      }

      res.status(201).json({
        id: id.trim(),
        name: name.trim(),
        type,
        description,
        file_path: resolvedFilePath || null,
        scanned_items_count: scannedCount,
        created_at: now,
        updated_at: now
      });
    }
  );
});

/**
 * PATCH /api/dnext-deployment-package/:id
 * Update name, type, description, or file_path of a package.
 */
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { name, type, description, file_path, filePath, sourcePath } = req.body;

  const targetFilePath = file_path !== undefined ? file_path : (filePath !== undefined ? filePath : sourcePath);

  if (!name && !type && description === undefined && targetFilePath === undefined) {
    return res.status(400).json({ error: 'Provide `name`, `type`, `description`, or `file_path` to update.' });
  }

  const fields = [], params = [];
  if (name) { fields.push('name = ?'); params.push(name.trim()); }
  if (type) { fields.push('type = ?'); params.push(type); }
  if (description !== undefined) { fields.push('description = ?'); params.push(description); }
  if (targetFilePath !== undefined) { fields.push('file_path = ?'); params.push(targetFilePath ? targetFilePath.trim() : null); }

  const now = new Date().toISOString();
  fields.push('updated_at = ?');
  params.push(now);

  params.push(id);
  db.run(`UPDATE dnext_deployment_package SET ${fields.join(', ')} WHERE id = ?`, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: `Package '${id}' not found.` });
    res.json({ id, updated: true, updated_at: now });
  });
});

/**
 * POST /api/dnext-deployment-package/:id/scan
 * Scan the folder defined in the package's file_path and sync registry items.
 */
router.post('/:id/scan', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await scanAndSyncPackage(id);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error(`[Packages] Scan error for '${id}':`, err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/dnext-deployment-package/:id
 * Delete a package (only if it has no items assigned, unless cascade is true).
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { cascade } = req.query;

  try {
    if (cascade === 'true') {
      await queryAll('DELETE FROM dnext_deployment_item WHERE deployment_package_id = ?', [id]);
    } else {
      const row = await queryOne('SELECT COUNT(*) AS cnt FROM dnext_deployment_item WHERE deployment_package_id = ?', [id]);
      if (row && row.cnt > 0) {
        return res.status(409).json({ error: `Cannot delete: ${row.cnt} items still assigned to this package. Use ?cascade=true to delete items as well.` });
      }
    }

    db.run('DELETE FROM dnext_deployment_package WHERE id = ?', [id], function (delErr) {
      if (delErr) return res.status(500).json({ error: delErr.message });
      if (this.changes === 0) return res.status(404).json({ error: `Package '${id}' not found.` });
      res.json({ deleted: id });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
