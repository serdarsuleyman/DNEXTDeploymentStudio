const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { dnextFetch, getActiveEnvironment } = require('../services/dnextClient');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

function getConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('Failed to read config.json:', err);
  }
  return {};
}

function getAuthConfig() {
  const cfg = getConfig().auth || {};
  return {
    clientId: process.env.DNEXT_CLIENT_ID || cfg.clientId || 'orbitant-ui-client',
    scope: process.env.DNEXT_AUTH_SCOPE || cfg.scope || 'openid'
  };
}

router.post('/login', async (req, res) => {
  try {
    const { username, password, envName, authUrl, apiUrl } = req.body;
    const selectedEnv = getActiveEnvironment(envName, apiUrl);

    const finalAuthUrl = (authUrl && authUrl.trim()) || selectedEnv.authUrl;
    const finalApiUrl = (apiUrl && apiUrl.trim()) || selectedEnv.apiUrl;
    const finalUsername = (username && username.trim()) || selectedEnv.username || process.env.DNEXT_USERNAME;
    const finalPassword = (password && password.trim()) || selectedEnv.password || process.env.DNEXT_PASSWORD;
    const finalEnvName = envName || selectedEnv.name;

    if (!finalUsername || !finalPassword) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const { clientId, scope } = getAuthConfig();
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', clientId);
    params.append('username', finalUsername);
    params.append('password', finalPassword);
    params.append('scope', scope);

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
