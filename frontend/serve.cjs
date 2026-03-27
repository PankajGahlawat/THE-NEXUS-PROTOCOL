/**
 * Production static file server for Nexus Protocol frontend.
 * Serves the built dist/ folder and proxies /api + /socket.io to the backend.
 */
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.FRONTEND_PORT || 5173;
const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000';

// Proxy /api and /socket.io to backend, preserving full path
app.use(['/api', '/socket.io'], createProxyMiddleware({
  target: BACKEND,
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req) => {
      // Ensure the full original path is forwarded unchanged
      proxyReq.path = req.originalUrl;
    }
  }
}));

// Serve built React app
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Nexus Protocol frontend running on http://localhost:${PORT}`);
});
