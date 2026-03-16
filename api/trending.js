// Optional: serve trending tokens from backend (e.g. from DB or cache later)
const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

const defaultTrending = [
  { name: '$BONK', meta: 'Solana memecoin · 2.1M scans', pct: 12, verdict: 'safe' },
  { name: '$WIF', meta: 'dogwifhat · 1.8M scans', pct: 18, verdict: 'safe' },
  { name: '$MOODENG', meta: 'Hippo memecoin · 940K scans', pct: 31, verdict: 'caution' },
  { name: '$POPCAT', meta: 'Pop cat · 870K scans', pct: 22, verdict: 'safe' },
  { name: '$ELONDOGE', meta: 'New launch · 120K scans', pct: 87, verdict: 'danger' },
  { name: '$SAFEMOON2', meta: 'Relaunched · 98K scans', pct: 94, verdict: 'danger' },
  { name: '$MOONCAT', meta: '48h old · 76K scans', pct: 71, verdict: 'caution' },
  { name: '$JUPITER', meta: 'DEX token · 310K scans', pct: 9, verdict: 'safe' },
];

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }
  if (req.method !== 'GET') {
    res.writeHead(405, { ...cors });
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
  res.writeHead(200, cors);
  res.end(JSON.stringify({ trending: defaultTrending }));
};
