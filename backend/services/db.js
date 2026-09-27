const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'dnext_deployment.db');
const CONFIG_PATH = path.join(__dirname, '..', 'config.json');
const STUDIO_ROOT = path.resolve(__dirname, '..', '..');

function getTmfPackagesDir() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
      const cfg = JSON.parse(raw);
      const customPath = cfg.sourcePath || cfg.jsonSourcePath || cfg.tmfPackagesPath;
      if (customPath) {
        return path.isAbsolute(customPath)
          ? customPath
          : path.resolve(STUDIO_ROOT, customPath);
      }
    }
  } catch (e) {
    console.error('[DB] Failed to read sourcePath from config.json:', e.message);
  }
  return path.join(STUDIO_ROOT, 'tmf_packages');
}

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('[DB] Error opening SQLite database:', err.message);
  } else {
    console.log('[DB] Connected to standalone DNEXT SQLite database at:', DB_PATH);
  }
});

// Promisified DB helpers
const queryAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

const queryOne = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const runSql = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

// Initialize tables and migrations
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS dnext_deployment_package (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      type        TEXT NOT NULL DEFAULT 'POC',
      description TEXT,
      file_path   TEXT,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    )
  `);

  // Synchronously in serialization queue attempt adding column (safe if already exists)
  db.run('ALTER TABLE dnext_deployment_package ADD COLUMN file_path TEXT', () => {
    // Ignore duplicate column name error if column already exists
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS dnext_deployment_item (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      dnext_entity_id       TEXT    NOT NULL UNIQUE,
      dnext_entity_type     TEXT    NOT NULL,
      dnext_version         TEXT    DEFAULT '0',
      vf_de_offer_id        TEXT,
      vf_de_offer_type      TEXT,
      sync_status           TEXT    NOT NULL DEFAULT 'pending',
      file_path             TEXT    NOT NULL,
      entity_name           TEXT,
      deployment_package_id TEXT    REFERENCES dnext_deployment_package(id) ON DELETE SET NULL,
      last_synced_at        TEXT,
      error_details         TEXT,
      created_at            TEXT    NOT NULL,
      updated_at            TEXT    NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dnext_environments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL UNIQUE,
      url         TEXT    NOT NULL,
      api_url     TEXT    NOT NULL,
      auth_url    TEXT    NOT NULL,
      username    TEXT,
      password    TEXT,
      is_default  INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dnext_deployment_history (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_id   TEXT NOT NULL,
      action      TEXT NOT NULL,
      environment TEXT NOT NULL,
      status_code INTEGER,
      response    TEXT,
      created_at  TEXT NOT NULL
    )
  `);

  // Default packages & backfilling file_path
  const now = new Date().toISOString();
  db.run(`INSERT OR IGNORE INTO dnext_deployment_package (id, name, type, description, file_path, created_at, updated_at)
          VALUES ('vf-germany-poc', 'DNEXT Standard POC Package', 'POC', 'Standard DNEXT TMF 620 POC Entities', 'tmf_packages', '${now}', '${now}')`);
  db.run(`INSERT OR IGNORE INTO dnext_deployment_package (id, name, type, description, file_path, created_at, updated_at)
          VALUES ('POC_V2', 'DNEXT Commercial Bundles (POC_V2)', 'POC', 'Standardized TMF 620 Commercial Bundle Packages', 'tmf_packages/TMFVersion2', '${now}', '${now}')`);

  db.run("UPDATE dnext_deployment_package SET file_path = 'tmf_packages' WHERE id = 'vf-germany-poc' AND (file_path IS NULL OR file_path = '')");
  db.run("UPDATE dnext_deployment_package SET file_path = 'tmf_packages/TMFVersion2' WHERE id = 'POC_V2' AND (file_path IS NULL OR file_path = '')");
});

/**
 * Resolves a given relative or absolute file_path to an absolute directory
 */
function resolvePackageDir(filePath) {
  if (!filePath) return null;
  const packagesDir = getTmfPackagesDir();
  const candidates = [
    path.isAbsolute(filePath) ? filePath : null,
    path.resolve(STUDIO_ROOT, filePath),
    path.resolve(packagesDir, filePath),
    path.resolve(packagesDir, filePath.replace(/^tmf_packages\/?/, ''))
  ].filter(Boolean);

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return c;
    }
  }
  return path.resolve(STUDIO_ROOT, filePath);
}

/**
 * Recursively find all .json files in a directory
 */
function findJsonFilesInDir(dir) {
  let results = [];
  if (!dir || !fs.existsSync(dir)) return results;
  const stat = fs.statSync(dir);
  if (!stat.isDirectory()) {
    if (dir.endsWith('.json')) return [dir];
    return results;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findJsonFilesInDir(full));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Helper to classify and resolve folder configs for legacy sample folders
 */
function getFolderConfig(folderName) {
  if (folderName === 'specification') {
    return {
      folder: folderName,
      entityType: 'ProductSpecification',
      offerType: 'Specification',
    };
  }
  if (folderName === 'sample_offers') {
    return {
      folder: folderName,
      entityType: 'ProductOffering',
      offerTypeResolver: (id) =>
        id.startsWith('VF_DE_OFFERING_REGIO_ZUSCHLAG') ? 'RegioSurcharge' : 'VoiceAnschluss',
    };
  }
  if (folderName === 'sample_pops') {
    return {
      folder: folderName,
      entityType: 'ProductOfferingPrice',
      offerTypeResolver: (id) => {
        const base = id.replace(/^pop-(recurrent|onetime)-/, '');
        return base.startsWith('VF_DE_OFFERING_REGIO_ZUSCHLAG') ? 'RegioSurcharge' : 'VoiceAnschluss';
      },
    };
  }

  let entityType = 'ProductOffering';
  if (folderName.endsWith('_pops') || folderName.endsWith('_pop') || folderName.startsWith('sample_pop_') || folderName.endsWith('_pop_offer.json')) {
    entityType = 'ProductOfferingPrice';
  }

  let clean = folderName.replace(/^sample_pop_/, '').replace(/^sample_/, '');
  clean = clean.replace(/_offer_pops$/, '').replace(/_offers$/, '').replace(/_offerings$/, '').replace(/_pops$/, '').replace(/_pop$/, '').replace(/_offer$/, '');

  const offerType = clean.split('_')
    .map(word => {
      if (word.toLowerCase() === 'tv') return 'TV';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');

  return {
    folder: folderName,
    entityType,
    offerType,
  };
}

/**
 * Parse a JSON file into a registry item object
 */
function parseJsonToItem(filePath, packageId) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const entityId = parsed.id !== undefined ? String(parsed.id) : path.basename(filePath, '.json');
    let entityType = parsed['@type'];
    if (!entityType) {
      if (parsed.isBundle === true || filePath.includes('bundled') || filePath.includes('/bundle_pops/')) {
        entityType = 'BundledProductOfferingPrice';
      } else if (filePath.includes('_pop') || filePath.includes('prices_') || parsed.priceType || parsed.price) {
        entityType = 'ProductOfferingPrice';
      } else if (filePath.includes('specification') || parsed.productSpecCharacteristic) {
        entityType = 'ProductSpecification';
      } else {
        entityType = 'ProductOffering';
      }
    }

    const version = parsed.version !== undefined ? String(parsed.version) : '0';
    const name = parsed.name || entityId;

    let offerType = 'Unknown';
    const lowPath = filePath.toLowerCase();
    const lowId = entityId.toLowerCase();

    if (entityType === 'ProductSpecification') {
      offerType = 'Specification';
    } else if (entityType === 'BundledProductOfferingPrice' || parsed.isBundle === true) {
      offerType = 'BundlePOP';
    } else if (lowPath.includes('hardware') || lowId.includes('hardware') || lowId.includes('fritzbox') || lowId.includes('ont_')) {
      offerType = 'Hardware';
    } else if (lowPath.includes('tv') || lowId.includes('tv_')) {
      offerType = 'TV';
    } else if (lowPath.includes('regio') || lowId.includes('regio')) {
      offerType = 'RegioSurcharge';
    } else if (lowPath.includes('superwlan') || lowId.includes('superwlan') || lowId.includes('repeater')) {
      offerType = 'SuperWLAN';
    } else if (lowPath.includes('voice') || lowId.includes('voice') || lowId.includes('anschluss')) {
      offerType = 'VoiceAnschluss';
    } else if (lowPath.includes('bandwidth') || lowId.includes('bandwidth') || lowId.includes('speed') || lowId.includes('glasfaser') || lowId.includes('dsl')) {
      offerType = 'FiberConnectivity';
    } else if (lowPath.includes('call_option') || lowId.includes('call_option')) {
      offerType = 'CallOption';
    } else if (lowPath.includes('installation') || lowId.includes('installation')) {
      offerType = 'Installation';
    } else if (lowPath.includes('insurance') || lowId.includes('insurance')) {
      offerType = 'Insurance';
    } else if (lowPath.includes('promotion') || lowId.includes('promotion')) {
      offerType = 'Promotion';
    } else if (lowPath.includes('sales_package') || lowId.includes('sales_package') || lowId.includes('gigazuhause')) {
      offerType = 'SalesPackage';
    } else if (entityType === 'ProductOfferingPrice') {
      offerType = 'PriceComponent';
    } else if (entityType === 'ProductOffering') {
      offerType = 'SalesPackage';
    }

    const vfDeOfferId = entityId.replace(/^pop-(recurrent|onetime)-/, '');
    const relPath = path.relative(STUDIO_ROOT, filePath).replace(/\\/g, '/');

    return {
      dnext_entity_id: entityId,
      dnext_entity_type: entityType,
      dnext_version: version,
      vf_de_offer_id: vfDeOfferId,
      vf_de_offer_type: offerType,
      file_path: relPath,
      entity_name: name,
      deployment_package_id: packageId || null
    };
  } catch (err) {
    return null;
  }
}

/**
 * Collect all items for a given package based on its defined file_path
 */
function collectRowsForPackage(pkg) {
  if (!pkg) return [];
  const packageId = pkg.id;
  const packagePath = pkg.file_path;
  if (!packagePath) return [];

  const targetDir = resolvePackageDir(packagePath);
  if (!targetDir || !fs.existsSync(targetDir)) return [];

  // Special legacy handling for vf-germany-poc when pointed to tmf_packages root
  if (packageId === 'vf-germany-poc' && (packagePath === 'tmf_packages' || packagePath === '.')) {
    const rows = [];
    const entries = fs.readdirSync(targetDir);
    const legacyFolders = entries.filter(f => (f.startsWith('sample') || f === 'specification'));
    for (const folderName of legacyFolders) {
      const config = getFolderConfig(folderName);
      const folderAbs = path.join(targetDir, config.folder);
      const folderRel = path.relative(STUDIO_ROOT, folderAbs);

      if (!fs.existsSync(folderAbs) || !fs.statSync(folderAbs).isDirectory()) continue;

      const files = fs.readdirSync(folderAbs).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const filePath = path.join(folderAbs, file);
        let parsed;
        try { parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')); }
        catch { continue; }

        const dnextEntityId = parsed.id !== undefined ? String(parsed.id) : path.basename(file, '.json');
        const vfDeOfferId   = dnextEntityId.replace(/^pop-(recurrent|onetime)-/, '');
        const vfDeOfferType = config.offerTypeResolver
          ? config.offerTypeResolver(dnextEntityId)
          : config.offerType;

        rows.push({
          dnext_entity_id:       dnextEntityId,
          dnext_entity_type:     config.entityType,
          dnext_version:         parsed.version !== undefined ? String(parsed.version) : '0',
          vf_de_offer_id:        vfDeOfferId,
          vf_de_offer_type:      vfDeOfferType,
          file_path:             path.join(folderRel, file).replace(/\\/g, '/'),
          entity_name:           parsed.name !== undefined ? String(parsed.name) : dnextEntityId,
          deployment_package_id: packageId,
        });
      }
    }
    return rows;
  }

  // Generic recursive scanner for any directory path
  const jsonFiles = findJsonFilesInDir(targetDir);
  const rows = [];
  for (const f of jsonFiles) {
    const item = parseJsonToItem(f, packageId);
    if (item) {
      rows.push(item);
    }
  }
  return rows;
}

/**
 * Collect all registry rows across all packages (or for a specific package)
 */
function collectRegistryRows(specificPackageId = null) {
  const rows = [];
  const defaultPkgs = [
    { id: 'vf-germany-poc', file_path: 'tmf_packages' },
    { id: 'POC_V2', file_path: 'tmf_packages/TMFVersion2' }
  ];

  let targetPkgs = defaultPkgs;
  if (specificPackageId) {
    targetPkgs = defaultPkgs.filter(p => p.id === specificPackageId);
    if (targetPkgs.length === 0) {
      targetPkgs = [{ id: specificPackageId, file_path: `tmf_packages/${specificPackageId}` }];
    }
  }

  for (const pkg of targetPkgs) {
    const pkgRows = collectRowsForPackage(pkg);
    rows.push(...pkgRows);
  }

  return rows;
}

/**
 * Scan and upsert items in the DB for a given package
 */
async function scanAndSyncPackage(packageId) {
  const pkg = await queryOne('SELECT * FROM dnext_deployment_package WHERE id = ?', [packageId]);
  if (!pkg) {
    throw new Error(`Package '${packageId}' not found.`);
  }
  if (!pkg.file_path) {
    return { count: 0, message: `Package '${packageId}' has no file_path configured.` };
  }

  const rows = collectRowsForPackage(pkg);
  if (rows.length === 0) {
    return { count: 0, message: `No JSON documents found at '${pkg.file_path}'.` };
  }

  const now = new Date().toISOString();
  await runSql('BEGIN TRANSACTION');

  try {
    const stmt = db.prepare(`
      INSERT INTO dnext_deployment_item
        (dnext_entity_id, dnext_entity_type, dnext_version, vf_de_offer_id,
         vf_de_offer_type, sync_status, file_path, deployment_package_id, entity_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
      ON CONFLICT(dnext_entity_id) DO UPDATE SET
        dnext_entity_type     = excluded.dnext_entity_type,
        dnext_version         = excluded.dnext_version,
        vf_de_offer_id        = excluded.vf_de_offer_id,
        vf_de_offer_type      = excluded.vf_de_offer_type,
        file_path             = excluded.file_path,
        entity_name           = excluded.entity_name,
        deployment_package_id = excluded.deployment_package_id,
        updated_at            = excluded.updated_at
    `);

    for (const r of rows) {
      stmt.run(
        r.dnext_entity_id, r.dnext_entity_type, r.dnext_version || '0',
        r.vf_de_offer_id, r.vf_de_offer_type,
        r.file_path, pkg.id, r.entity_name, now, now
      );
    }

    await new Promise((res, rej) => stmt.finalize((err) => err ? rej(err) : res()));
    await runSql('COMMIT');

    return {
      package_id: pkg.id,
      package_name: pkg.name,
      file_path: pkg.file_path,
      count: rows.length,
      synced_at: now
    };
  } catch (err) {
    await runSql('ROLLBACK');
    throw err;
  }
}

/**
 * List available folders within tmf_packages and studio root for easy selection
 */
function getAvailableFolders() {
  const folders = [];
  const packagesDir = getTmfPackagesDir();
  if (fs.existsSync(packagesDir)) {
    folders.push('tmf_packages');
    const entries = fs.readdirSync(packagesDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory() && !e.name.startsWith('.')) {
        folders.push(`tmf_packages/${e.name}`);
        // Subdirectories under TMFVersion2
        if (e.name === 'TMFVersion2') {
          const v2Entries = fs.readdirSync(path.join(packagesDir, 'TMFVersion2'), { withFileTypes: true });
          for (const v2 of v2Entries) {
            if (v2.isDirectory() && !v2.name.startsWith('.')) {
              folders.push(`tmf_packages/TMFVersion2/${v2.name}`);
            }
          }
        }
      }
    }
  }
  return folders;
}

module.exports = {
  db,
  queryAll,
  queryOne,
  runSql,
  collectRegistryRows,
  collectRowsForPackage,
  scanAndSyncPackage,
  getTmfPackagesDir,
  resolvePackageDir,
  getAvailableFolders,
  DB_PATH,
  STUDIO_ROOT
};

