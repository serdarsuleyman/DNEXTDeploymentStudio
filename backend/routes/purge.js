const express = require('express');
const router = express.Router();
const { dnextFetch } = require('../services/dnextClient');

const VALID_TYPES = {
  'Category': 'category',
  'category': 'category',
  'ProductOffering': 'productOffering',
  'productOffering': 'productOffering',
  'ProductOfferingPrice': 'productOfferingPrice',
  'productOfferingPrice': 'productOfferingPrice',
  'BundledProductOfferingPrice': 'productOfferingPrice',
  'ProductSpecification': 'productSpecification',
  'productSpecification': 'productSpecification'
};

async function purgeSingleEntity(objectType, id, authHeader) {
  const apiPathSegment = VALID_TYPES[objectType];
  if (!apiPathSegment) {
    throw new Error(`Invalid objectType: ${objectType}. Must be one of: ${Object.keys(VALID_TYPES).join(', ')}`);
  }

  // 1. Search for all versions
  const searchUrl = `/api/productCatalogManagement/v4/${apiPathSegment}?id=${encodeURIComponent(id)}`;
  const searchRes = await dnextFetch(searchUrl, {
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json'
    }
  });

  let list = [];
  if (searchRes.ok) {
    const data = await searchRes.json().catch(() => []);
    list = Array.isArray(data) ? data : [data];
  }

  // If search didn't find anything, try direct get
  if (list.length === 0) {
    const directUrl = `/api/productCatalogManagement/v4/${apiPathSegment}/${encodeURIComponent(id)}`;
    const directRes = await dnextFetch(directUrl, {
      headers: { 'Authorization': authHeader, 'Accept': 'application/json' }
    });
    if (directRes.ok) {
      const d = await directRes.json().catch(() => null);
      if (d) list = [d];
    }
  }

  if (list.length === 0) {
    // If still not found, attempt direct delete
    const deleteDirect = `/api/productCatalogManagement/v4/${apiPathSegment}/${encodeURIComponent(id)}`;
    const delRes = await dnextFetch(deleteDirect, {
      method: 'DELETE',
      headers: { 'Authorization': authHeader, 'Accept': 'application/json' }
    });
    if (delRes.ok || delRes.status === 204) {
      return { success: true, message: `Deleted ${objectType} "${id}" directly.`, auditTrail: [{ step: 'Direct DELETE succeeded' }] };
    }
    const notFoundErr = new Error(`Record with id "${id}" not found on remote DNEXT gateway.`);
    notFoundErr.statusCode = 404;
    notFoundErr.notFound = true;
    throw notFoundErr;
  }

  const auditTrail = [];
  // Sort versions so version "0" is processed at the very end
  const sortedEntities = [...list].sort((a, b) => {
    if (a.version === '0') return 1;
    if (b.version === '0') return -1;
    return parseInt(a.version || '0') - parseInt(b.version || '0');
  });

  for (const entity of sortedEntities) {
    const ver = entity.version !== undefined ? String(entity.version) : null;
    const status = entity.lifecycleStatus || 'In study';
    const versionedId = ver ? `${id}:(version=${ver})` : id;
    const targetUrl = `/api/productCatalogManagement/v4/${apiPathSegment}/${encodeURIComponent(versionedId)}`;

    auditTrail.push({ step: `Processing version ${ver || 'default'} (lifecycleStatus: ${status})` });

    if (status === 'Launched') {
      const startMs = Date.parse(entity.validFor?.startDateTime || new Date().toISOString());
      const targetMs = Math.max(startMs + 5000, Date.now() + 3.1 * 60 * 1000);
      const endDateTime = new Date(targetMs).toISOString();

      const patchPayload = [
        {
          "op": "replace",
          "path": "/lifecycleStatus",
          "value": "Obsolete"
        },
        {
          "op": "add",
          "path": "/validFor/endDateTime",
          "value": endDateTime
        }
      ];

      auditTrail.push({ step: `Patching version ${ver || 'default'} to Obsolete (endDateTime: ${endDateTime})` });

      const patchRes = await dnextFetch(targetUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json-patch+json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(patchPayload)
      });

      if (!patchRes.ok) {
        const patchErr = await patchRes.json().catch(() => ({}));
        auditTrail.push({ step: `PATCH FAILED for version ${ver || 'default'}`, error: patchErr });
        throw new Error(`Failed to patch version ${ver || 'default'} to Obsolete: ${JSON.stringify(patchErr)}`);
      }
      auditTrail.push({ step: `PATCH SUCCEEDED for version ${ver || 'default'}` });
    }

    // Send DELETE command for this version
    auditTrail.push({ step: `Deleting version ${ver || 'default'}` });
    let deleteRes = await dnextFetch(targetUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });

    if (!deleteRes.ok && deleteRes.status !== 204) {
      // Fallback: try unversioned ID
      const unversionedUrl = `/api/productCatalogManagement/v4/${apiPathSegment}/${encodeURIComponent(id)}`;
      deleteRes = await dnextFetch(unversionedUrl, {
        method: 'DELETE',
        headers: { 'Authorization': authHeader, 'Accept': 'application/json' }
      });
    }

    if (!deleteRes.ok && deleteRes.status !== 204) {
      const deleteErr = await deleteRes.json().catch(() => ({}));
      auditTrail.push({ step: `DELETE FAILED for version ${ver || 'default'}`, error: deleteErr });
      throw new Error(`Failed to delete version ${ver || 'default'}: ${JSON.stringify(deleteErr)}`);
    }

    auditTrail.push({ step: `DELETE SUCCEEDED for version ${ver || 'default'}` });
  }

  return { success: true, message: `Successfully purged ${objectType} "${id}" across all versions.`, auditTrail };
}

/**
 * POST /api/dnext/purge-entity
 * Purge a versionable object across all versions
 */
router.post('/purge-entity', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    const { objectType, id } = req.body;
    if (!objectType || !id) {
      return res.status(400).json({ error: 'objectType and id are required in body' });
    }

    const result = await purgeSingleEntity(objectType, id, authHeader);
    res.json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    console.error(`[Purge] error (${status}):`, error.message);
    res.status(status).json({ error: error.message, notFound: !!error.notFound });
  }
});

/**
 * POST /api/dnext/purge-bulk
 * Bulk purge an array of entities
 */
router.post('/purge-bulk', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required' });
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const it of items) {
      try {
        const resObj = await purgeSingleEntity(it.objectType || it.entityType, it.id, authHeader);
        results.push({ id: it.id, objectType: it.objectType || it.entityType, success: true, message: resObj.message });
        successCount++;
      } catch (err) {
        results.push({ id: it.id, objectType: it.objectType || it.entityType, success: false, notFound: !!err.notFound, error: err.message });
        failCount++;
      }
    }

    res.json({
      total: items.length,
      successCount,
      failCount,
      results
    });
  } catch (error) {
    console.error('[Bulk Purge] error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
