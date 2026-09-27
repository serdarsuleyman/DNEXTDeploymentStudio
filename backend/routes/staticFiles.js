const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { getTmfPackagesDir } = require('../services/db');

const STUDIO_ROOT = path.join(__dirname, '..', '..');

/**
 * GET /api/static-file?path=tmf_packages/TMFVersion2/...
 * Serve static JSON payload files safely
 */
router.get('/', (req, res) => {
  const { path: relPath } = req.query;
  if (!relPath) {
    return res.status(400).json({ error: '`path` query param required' });
  }

  // Handle both tmf_packages/... and scratch/... backward-compat paths
  let cleanRelPath = relPath;
  if (cleanRelPath.startsWith('scratch/')) {
    cleanRelPath = cleanRelPath.replace(/^scratch\//, 'tmf_packages/');
  }

  const packagesDir = getTmfPackagesDir();
  let candidatePaths = [
    path.resolve(STUDIO_ROOT, cleanRelPath),
    path.resolve(packagesDir, cleanRelPath),
    path.resolve(packagesDir, cleanRelPath.replace(/^tmf_packages\//, ''))
  ];

  if (path.isAbsolute(cleanRelPath)) {
    candidatePaths.unshift(cleanRelPath);
  }

  // Find candidate and ensure it is safely inside STUDIO_ROOT or packagesDir
  const absPath = candidatePaths.find(p => {
    try {
      const resolved = path.resolve(p);
      const isInside = resolved.startsWith(STUDIO_ROOT) || resolved.startsWith(packagesDir);
      return isInside && fs.existsSync(resolved) && !fs.statSync(resolved).isDirectory();
    } catch {
      return false;
    }
  });

  if (!absPath) {
    return res.status(404).json({ error: `File not found or access denied: ${relPath}` });
  }

  try {
    const content = fs.readFileSync(absPath, 'utf8');
    res.json(JSON.parse(content));
  } catch (e) {
    res.status(500).json({ error: `Failed to read file: ${e.message}` });
  }
});

module.exports = router;
