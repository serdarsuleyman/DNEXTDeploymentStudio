const express = require('express');
const router = express.Router();
const { db, queryAll, queryOne, runSql } = require('../services/db');

/**
 * GET /api/drafts
 * Retrieve all in-progress drafts, ordered by last updated.
 */
router.get('/', async (req, res) => {
  try {
    const rows = await queryAll('SELECT * FROM dnext_drafts ORDER BY updated_at DESC');
    const parsedDrafts = rows.map(r => {
      let parsedData = {};
      try {
        parsedData = JSON.parse(r.form_data);
      } catch (e) {
        parsedData = {};
      }
      return {
        ...r,
        form_data: parsedData
      };
    });
    res.json({ total: parsedDrafts.length, drafts: parsedDrafts });
  } catch (err) {
    console.error('[Drafts GET] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/drafts/:id
 * Retrieve a single draft by ID.
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const row = await queryOne('SELECT * FROM dnext_drafts WHERE id = ?', [id]);
    if (!row) {
      return res.status(404).json({ error: `Draft '${id}' not found.` });
    }
    let parsedData = {};
    try {
      parsedData = JSON.parse(row.form_data);
    } catch (e) {
      parsedData = {};
    }
    res.json({ ...row, form_data: parsedData });
  } catch (err) {
    console.error('[Drafts GET by ID] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/drafts
 * Create or update an in-progress draft.
 */
router.post('/', async (req, res) => {
  try {
    const {
      id,
      entity_id,
      entity_name,
      entity_type = 'ProductOffering',
      task_type = 'new_sales_package',
      portfolio_id = '',
      technology = '',
      speed = '',
      form_data = {}
    } = req.body || {};

    const rawEntityId = entity_id || form_data.code || form_data.id || 'NEW_SALES_PACKAGE';
    const rawEntityName = entity_name || form_data.name || 'New Sales Package';
    const rawTaskType = task_type || form_data.task_type || req.body?.taskType || 'new_sales_package';
    const rawPortfolioId = portfolio_id || form_data.portfolio_id || '';
    const rawTech = technology || form_data.technology || 'FIBRE';
    const rawSpeed = speed || (form_data.downstreamSpeed ? `${form_data.downstreamSpeed} Mbps` : '');

    const draftId = id || `draft_${rawEntityId.toLowerCase().replace(/[^a-z0-9]+/g, '_')}${rawPortfolioId ? `_${rawPortfolioId.toLowerCase().replace(/[^a-z0-9]+/g, '_')}` : ''}`;
    const now = new Date().toISOString();
    const serializedForm = typeof form_data === 'string' ? form_data : JSON.stringify(form_data);

    await runSql(`
      INSERT INTO dnext_drafts (id, entity_id, entity_name, entity_type, task_type, portfolio_id, technology, speed, form_data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        entity_id    = excluded.entity_id,
        entity_name  = excluded.entity_name,
        entity_type  = excluded.entity_type,
        task_type    = excluded.task_type,
        portfolio_id = excluded.portfolio_id,
        technology   = excluded.technology,
        speed        = excluded.speed,
        form_data    = excluded.form_data,
        updated_at   = excluded.updated_at
    `, [draftId, rawEntityId, rawEntityName, entity_type, rawTaskType, rawPortfolioId, rawTech, rawSpeed, serializedForm, now, now]);

    const saved = await queryOne('SELECT * FROM dnext_drafts WHERE id = ?', [draftId]);
    res.json({
      success: true,
      message: `Draft "${rawEntityName}" saved successfully.`,
      draft: {
        ...saved,
        form_data: typeof form_data === 'object' ? form_data : JSON.parse(serializedForm)
      }
    });
  } catch (err) {
    console.error('[Drafts POST] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/drafts/:id
 * Discard / delete a draft.
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await runSql('DELETE FROM dnext_drafts WHERE id = ?', [id]);
    res.json({ success: true, deleted: id, message: `Draft '${id}' discarded successfully.` });
  } catch (err) {
    console.error('[Drafts DELETE] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
