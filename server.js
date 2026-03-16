const http = require('http');
const fs = require('fs');
const path = require('path');

const analyzeHandler = require('./api/analyze.js');
const trendingHandler = require('./api/trending.js');

const PORT = process.env.PORT || 3000;
const INDEX_PATH = path.join(__dirname, 'index.html');

function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url?.split('?')[0] || '/';

  if (url === '/api/analyze') {
    if (req.method === 'POST') {
      const raw = await collectBody(req);
      req.body = raw.length ? JSON.parse(raw.toString()) : {};
    }
    return analyzeHandler(req, res);
  }

  if (url === '/api/trending') {
    return trendingHandler(req, res);
  }

  // Static: serve index.html for all other routes (SPA)
  fs.readFile(INDEX_PATH, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end('Error loading app');
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`RugSniffer running at http://localhost:${PORT}`);
  console.log('Scanner, Portfolio, and Trending are ready. Deploy later with: vercel login && npm run deploy');
});
