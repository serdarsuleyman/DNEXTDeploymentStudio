const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { dnextFetch } = require('../services/dnextClient');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

function getEnvironments() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      return parsed.environments || [];
    }
  } catch (err) {
    console.error('Failed to read config.json:', err);
  }
  return [];
}

router.post('/login', async (req, res) => {
  try {
    const { username, password, envName, authUrl, apiUrl } = req.body;
    const environments = getEnvironments();

    let selectedEnv = environments[0] || {
      name: "Default (dev-gcu)",
      apiUrl: "https://dpc-api.pi.dev-gcu.com",
      authUrl: "https://diam.pi.dev-gcu.com/realms/orbitant-realm/protocol/openid-connect/token",
      username: "nora",
      password: ""
    };

    if (envName) {
      const found = environments.find(e => e.name === envName);
      if (found) selectedEnv = found;
    }

    const finalAuthUrl = (authUrl && authUrl.trim()) || selectedEnv.authUrl;
    const finalApiUrl = (apiUrl && apiUrl.trim()) || selectedEnv.apiUrl;
    const finalUsername = username || selectedEnv.username;
    const finalPassword = password || selectedEnv.password;
    const finalEnvName = envName || selectedEnv.name;

    if (!finalUsername || !finalPassword) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', 'orbitant-ui-client');
    params.append('username', finalUsername);
    params.append('password', finalPassword);
    params.append('scope', 'openid');

    const tokenResponse = await fetch(finalAuthUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const data = await tokenResponse.json();
    if (!tokenResponse.ok) {
      return res.status(tokenResponse.status).json(data);
    }

    data.apiUrl = finalApiUrl;
    data.authUrl = finalAuthUrl;
    data.username = finalUsername;
    data.envName = finalEnvName;
    res.json(data);
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
