import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { installDnextEnvFetch } from './services/dnextFetch';

// Attach the active environment headers to every /api/dnext call
installDnextEnvFetch();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
