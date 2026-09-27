const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

function deriveUrls(inputUrl) {
  try {
    const parsed = new URL(inputUrl);
    const origin = parsed.origin;
    let apiOrigin = origin;
    if (origin.includes('dpc-ui')) {
      apiOrigin = origin.replace('dpc-ui', 'dpc-api');
    }
    let authOrigin = origin.replace('dpc-ui', 'diam').replace('dpc-api', 'diam');
    if (origin.includes('dev-gcu')) {
      authOrigin = 'https://diam.pi.dev-gcu.com';
    } else if (origin.includes('test-gcu')) {
      authOrigin = 'https://diam.test-gcu.com';
    }
    return {
      apiUrl: apiOrigin,
      authUrl: `${authOrigin}/realms/orbitant-realm/protocol/openid-connect/token`
    };
  } catch (e) {
    return {
      apiUrl: inputUrl,
      authUrl: 'https://diam.pi.dev-gcu.com/realms/orbitant-realm/protocol/openid-connect/token'
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
    res.json(parsed.environments || []);
  } catch (err) {
    console.error('Failed to load environments:', err);
    res.status(500).json({ error: 'Failed to load environments configuration' });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, url, username, password } = req.body;
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
    const existingEnv = existingIndex > -1 ? parsed.environments[existingIndex] : null;
    const newEnv = {
      name,
      url,
      apiUrl: derived.apiUrl,
      authUrl: derived.authUrl,
      username: username !== undefined ? username : (existingEnv ? existingEnv.username : ''),
      password: (password && password.trim()) ? password : (existingEnv ? existingEnv.password : '')
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
