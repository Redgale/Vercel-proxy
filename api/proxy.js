// Enhanced proxy handler with error logging and buffer-based response
export default async function handler(req, res) {
  const target = req.query.url;
  if (!target) {
    return res.status(400).json({ error: 'Missing `url` parameter' });
  }

  try {
    console.log(`Proxying request to: ${target}`);
    const upstream = await fetch(target, {
      method: req.method,
      headers: {
        'user-agent': req.headers['user-agent'] || ''
      },
      body: ['GET', 'HEAD'].includes(req.method) ? null : req.body
    });

    // Copy status and essential headers
    res.status(upstream.status);
    upstream.headers.forEach((value, name) => {
      // Skip transfer-encoding to let Vercel manage it
      if (name.toLowerCase() !== 'transfer-encoding') {
        res.setHeader(name, value);
      }
    });

    // Read the full response into a buffer and send
    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`Responding with ${buffer.length} bytes`);
    res.send(buffer);
  } catch (err) {
    console.error('Proxy function error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
}
