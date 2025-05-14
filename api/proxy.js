const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const target = req.query.url;
  if (!target) {
    res.status(400).json({ error: 'Missing `url` parameter' });
    return;
  }

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? null : req.body
    });

    // Copy status and headers
    res.status(upstream.status);
    upstream.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });

    // Stream body
    upstream.body.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
