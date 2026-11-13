const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

function getRealmPath() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      if (parsed.auth?.realmPath) return parsed.auth.realmPath;
    }
  } catch {}
  return '/realms/orbitant-realm/protocol/openid-connect/token';
}

function deriveUrls(inputUrl) {
  const realmPath = getRealmPath();
  try {
    let raw = (inputUrl || '').trim();
    if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
      raw = `https://${raw}`;
    }
    const parsed = new URL(raw);
    const origin = parsed.origin;
    let apiOrigin = origin;
    if (origin.includes('dpc-ui')) {
      apiOrigin = origin.replace('dpc-ui', 'dpc-api');
    }
    let authOrigin = origin.replace('dpc-ui', 'diam').replace('dpc-api', 'diam');
    if (origin.includes('dev-gcu') || raw.includes('dev')) {
      authOrigin = 'https://diam.pi.dev-gcu.com';
    } else if (origin.includes('test-gcu') || raw.includes('test')) {
      authOrigin = 'https://diam.test-gcu.com';
    }
    return {
      apiUrl: apiOrigin,
      authUrl: `${authOrigin}${realmPath}`
    };
  } catch (e) {
    const isTest = (inputUrl || '').toLowerCase().includes('test');
    return {
      apiUrl: isTest ? 'https://dpc-api.test-gcu.com' : 'https://dpc-api.pi.dev-gcu.com',
      authUrl: isTest
        ? `https://diam.test-gcu.com${realmPath}`
        : `https://diam.pi.dev-gcu.com${realmPath}`
    };
  }
}

router.get('/', (req, res) => {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return res.json([]);
    }
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    const envs = (parsed.environments || []).map(e => ({
      name: e.name,
      url: e.url,
      apiUrl: e.apiUrl,
      authUrl: e.authUrl
    }));
    res.json(envs);
  } catch (err) {
    console.error('Failed to load environments:', err);
    res.status(500).json({ error: 'Failed to load environments configuration' });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, url } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: 'Environment name and URL are required' });
    }

    const derived = deriveUrls(url);
    let parsed = { environments: [] };

    if (fs.existsSync(CONFIG_PATH)) {
      try {
        parsed = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      } catch {}
    }

    if (!Array.isArray(parsed.environments)) {
      parsed.environments = [];
    }

    const existingIndex = parsed.environments.findIndex(e => e.name === name);

    const newEnv = {
      name,
      url,
      apiUrl: derived.apiUrl,
      authUrl: derived.authUrl
    };

    if (existingIndex > -1) {
      parsed.environments[existingIndex] = newEnv;
    } else {
      parsed.environments.push(newEnv);
    }

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(parsed, null, 2), 'utf8');
    res.json({ success: true, environments: parsed.environments });
  } catch (err) {
    console.error('Failed to save environment:', err);
    res.status(500).json({ error: 'Failed to save environment configuration' });
  }
});

// GET /api/dnext/environments/config - Get full configuration
router.get('/config', (req, res) => {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return res.json({ sourcePath: 'tmf_packages', environments: [] });
    }
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load configuration' });
  }
});

// POST /api/dnext/environments/source-path - Update sourcePath
router.post('/source-path', (req, res) => {
  try {
    const { sourcePath } = req.body;
    if (!sourcePath) {
      return res.status(400).json({ error: 'sourcePath is required' });
    }
    let parsed = { environments: [] };
    if (fs.existsSync(CONFIG_PATH)) {
      try {
        parsed = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      } catch {}
    }
    parsed.sourcePath = sourcePath;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(parsed, null, 2), 'utf8');
    res.json({ success: true, sourcePath: parsed.sourcePath, config: parsed });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update source path' });
  }
});

module.exports = router;
