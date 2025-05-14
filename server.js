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

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                // limit each IP to 100 requests per window
});
app.use(limiter);

// Serve static frontend
app.use('/', express.static(path.join(__dirname, 'public')));

// Proxy endpoint: /proxy?url=<target>
app.use('/proxy', (req, res, next) => {
  const target = req.query.url;
  if (!target) return res.status(400).send('No target URL specified.');

  try {
    const urlObj = new URL(target);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return res.status(400).send('Invalid URL scheme.');
    }
  } catch {
    return res.status(400).send('Malformed URL.');
  }

  createProxyMiddleware({
    target,
    changeOrigin: true,
    onProxyReq: (proxyReq) => {
      proxyReq.removeHeader('cookie');
    },
    onError: (err, req, res) => {
      res.status(500).send(`Proxy error: ${err.message}`);
    }
  })(req, res, next);
});

// Search endpoint: /search?q=<query>
app.get('/search', (req, res) => {
  const q = req.query.q;
  if (!q) return res.redirect('/');
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  res.redirect(`/proxy?url=${encodeURIComponent(googleUrl)}`);
});

app.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});
