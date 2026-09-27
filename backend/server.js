const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { db, collectRegistryRows } = require('./services/db');
const { dnextEnvMiddleware } = require('./services/dnextClient');

const authRouter = require('./routes/auth');
const environmentsRouter = require('./routes/environments');
const packagesRouter = require('./routes/packages');
const itemsRouter = require('./routes/items');
const offeringsRouter = require('./routes/offerings');
const specsRouter = require('./routes/specs');
const pricesRouter = require('./routes/prices');
const purgeRouter = require('./routes/purge');
const generatorRouter = require('./routes/generator');
const staticFilesRouter = require('./routes/staticFiles');
const syncRouter = require('./routes/sync');
const proxyRouter = require('./routes/proxy');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Custom middleware for environment URL header resolution
app.use(dnextEnvMiddleware);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Vodafone DNEXT Deployment Studio Backend', port: PORT });
});

// Mount Routes
app.use('/api/dnext/auth', authRouter);
app.use('/api/dnext/environments', environmentsRouter);
app.use('/api/dnext-deployment-package', packagesRouter);
app.use('/api/dnext-deployment-item', itemsRouter);
app.use('/api/dnext', offeringsRouter);
app.use('/api/dnext', specsRouter);
app.use('/api/dnext', pricesRouter);
app.use('/api/dnext', purgeRouter);
app.use('/api/dnext', syncRouter);
app.use('/api/sales-package', generatorRouter);
app.use('/api/static-file', staticFilesRouter);
app.use('/api/dnext-product-offering', proxyRouter);

// Auto-seed on first run if dnext_deployment_item is empty
db.get('SELECT COUNT(*) AS count FROM dnext_deployment_item', (err, row) => {
  if (!err && row && row.count === 0) {
    console.log('[Bootstrap] Initializing empty registry with files from tmf_packages...');
    const rows = collectRegistryRows();
    if (rows.length > 0) {
      const now = new Date().toISOString();
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO dnext_deployment_item
          (dnext_entity_id, dnext_entity_type, dnext_version, vf_de_offer_id,
           vf_de_offer_type, sync_status, file_path, deployment_package_id, entity_name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
      `);
      for (const r of rows) {
        stmt.run(r.dnext_entity_id, r.dnext_entity_type, r.dnext_version || '0', r.vf_de_offer_id, r.vf_de_offer_type, r.file_path, r.deployment_package_id || 'vf-germany-poc', r.entity_name, now, now);
      }
      stmt.finalize(() => {
        console.log(`[Bootstrap] Seeded ${rows.length} initial items into dnext_deployment.db`);
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 DNEXT Deployment Studio Backend Running on:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
