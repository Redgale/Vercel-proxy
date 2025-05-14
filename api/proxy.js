export default async function handler(req, res) {
  const target = req.query.url;
  if (!target) {
    return res.status(400).json({ error: 'Missing `url` parameter' });
  }

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: {
        // Forward only essential headers
        'user-agent': req.headers['user-agent'] || ''
      },
      body: ['GET', 'HEAD'].includes(req.method) ? null : req.body
    });

    res.status(upstream.status);
    upstream.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });
    upstream.body.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
