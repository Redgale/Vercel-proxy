const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet());
app.disable('x-powered-by');

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Serve static frontend
app.use('/', express.static(path.join(__dirname, 'public')));

// Proxy endpoint
app.use('/proxy', (req, res, next) => {
  const target = req.query.url;
  if (!target) return res.status(400).send('No target URL specified.');

  try {
    const urlObj = new URL(target);
    if (!['http:', 'https:'].includes(urlObj.protocol)) return res.status(400).send('Invalid URL scheme.');
  } catch {
    return res.status(400).send('Malformed URL.');
  }

  createProxyMiddleware({
    target,
    changeOrigin: true,
    onProxyReq: proxyReq => proxyReq.removeHeader('cookie'),
    onProxyRes: (proxyRes) => {
      proxyRes.headers['access-control-allow-origin'] = '*';
      proxyRes.headers['access-control-allow-methods'] = 'GET,POST,PUT,DELETE,OPTIONS';
      proxyRes.headers['access-control-allow-headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
      delete proxyRes.headers['content-security-policy'];
    },
    onError: (err, req, res) => res.status(500).send(`Proxy error: ${err.message}`)
  })(req, res, next);
});

// Search endpoint
app.get('/search', (req, res) => {
  const q = req.query.q;
  if (!q) return res.redirect('/');
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  res.redirect(`/proxy?url=${encodeURIComponent(googleUrl)}`);
});

app.listen(PORT, () => console.log(`Proxy server listening on port ${PORT}`));
