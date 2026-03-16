const { Connection, PublicKey } = require('@solana/web3.js');
const { resolveTickerOrAddress } = require('./_tickerMap.js');

const MAX_BODY_SIZE = 1024;
const SOLANA_RPC = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

function json(body, status = 200) {
  return {
    statusCode: status,
    headers: corsHeaders(),
    body: JSON.stringify(body),
  };
}

function err(message, status = 400) {
  return json({ error: message }, status);
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

module.exports = async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { ...corsHeaders(), 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  let body;
  try {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      body = req.body;
    } else {
      const raw = await getRawBody(req);
      if (raw.length > MAX_BODY_SIZE) {
        res.writeHead(413, { ...corsHeaders(), 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Payload too large' }));
      }
      body = raw.length ? JSON.parse(raw.toString()) : {};
    }
    if (JSON.stringify(body).length > MAX_BODY_SIZE) {
      res.writeHead(413, { ...corsHeaders(), 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Payload too large' }));
    }
  } catch (e) {
    res.writeHead(400, { ...corsHeaders(), 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Invalid JSON' }));
  }

  const tokenInput = typeof body.token === 'string' ? body.token.trim() : '';
  if (!tokenInput) {
    res.writeHead(400, { ...corsHeaders(), 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Missing token' }));
  }

  const mintAddress = resolveTickerOrAddress(tokenInput);
  if (!mintAddress) {
    res.writeHead(400, { ...corsHeaders(), 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      error: 'Unknown ticker or invalid address',
      rugProbability: 50,
      verdict: 'CAUTION',
      riskLevel: 'Unknown token',
      metrics: { liquidityScore: 50, holderScore: 50, contractScore: 50, communityScore: 50 },
      flags: [{ severity: 'warn', label: 'Unknown token', detail: 'Ticker not in our list; use a mint address to analyze.' }],
      analysis: 'We could not resolve this ticker to a Solana mint. Paste the token contract (mint) address for analysis.',
      topHolders: [],
    }));
  }

  const connection = new Connection(SOLANA_RPC, 'confirmed');

  try {
    const mintPubkey = new PublicKey(mintAddress);

    const [supplyRes, largestRes] = await Promise.all([
      connection.getTokenSupply(mintPubkey).catch(() => null),
      connection.getTokenLargestAccounts(mintPubkey).catch(() => null),
    ]);

    if (!supplyRes || !supplyRes.value) {
      res.writeHead(404, { ...corsHeaders(), 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        error: 'Not a valid SPL token mint',
        rugProbability: 50,
        verdict: 'CAUTION',
        riskLevel: 'Invalid mint',
        metrics: { liquidityScore: 0, holderScore: 0, contractScore: 0, communityScore: 0 },
        flags: [{ severity: 'danger', label: 'Invalid mint', detail: 'Account is not a token mint or does not exist.' }],
        analysis: 'This address is not a valid SPL token mint on Solana.',
        topHolders: [],
      }));
    }

    const supply = supplyRes.value;
    const totalSupply = BigInt(supply.amount);
    const decimals = supply.decimals;
    const largest = (largestRes && largestRes.value) || [];
    const topBalances = largest.map((a) => ({ ...a, amountBig: BigInt(a.amount) }));

    let liquidityScore = 70;
    let holderScore = 70;
    let contractScore = 80;
    let communityScore = 60;
    const flags = [];
    let rugProbability = 20;

    if (topBalances.length > 0) {
      const top10Sum = topBalances.slice(0, 10).reduce((s, a) => s + a.amountBig, 0n);
      const top1Pct = totalSupply > 0n ? Number((topBalances[0].amountBig * 10000n) / totalSupply) / 100 : 0;
      const top10Pct = totalSupply > 0n ? Number((top10Sum * 10000n) / totalSupply) / 100 : 0;

      if (top1Pct > 50) {
        holderScore = Math.max(0, 50 - top1Pct);
        rugProbability += 35;
        flags.push({ severity: 'danger', label: 'Top holder concentration', detail: `Top wallet holds ${top1Pct.toFixed(1)}% of supply.` });
      } else if (top1Pct > 20) {
        holderScore = 50;
        rugProbability += 15;
        flags.push({ severity: 'warn', label: 'Concentrated ownership', detail: `Top holder has ${top1Pct.toFixed(1)}% of supply.` });
      } else {
        flags.push({ severity: 'safe', label: 'Holder distribution', detail: `Top 10 holders control ${top10Pct.toFixed(1)}% of supply.` });
      }

      if (top10Pct > 90) {
        liquidityScore = 30;
        rugProbability += 20;
        flags.push({ severity: 'warn', label: 'Low distribution', detail: 'Over 90% of supply in top 10 wallets.' });
      }
    } else {
      flags.push({ severity: 'warn', label: 'No holder data', detail: 'Could not fetch largest accounts.' });
    }

    if (totalSupply === 0n) {
      contractScore = 0;
      rugProbability = 95;
      flags.push({ severity: 'danger', label: 'Zero supply', detail: 'Token has no circulating supply.' });
    }

    rugProbability = clamp(rugProbability, 0, 100);
    liquidityScore = clamp(liquidityScore, 0, 100);
    holderScore = clamp(holderScore, 0, 100);
    contractScore = clamp(contractScore, 0, 100);
    communityScore = clamp(communityScore, 0, 100);

    const verdict = rugProbability > 75 ? 'DANGER' : rugProbability > 40 ? 'CAUTION' : 'SAFE';
    const riskLevel = rugProbability > 75 ? 'High risk' : rugProbability > 40 ? 'Medium risk' : 'Low risk';

    const topHolders = (body.isPremium && topBalances.length > 0)
      ? topBalances.slice(0, 15).map((a, i) => {
          const pct = totalSupply > 0n ? Number((a.amountBig * 10000n) / totalSupply) / 100 : 0;
          let label = 'Holder';
          if (i === 0 && pct > 30) label = 'Dev / Team';
          else if (pct > 10) label = 'Whale';
          const addr = (a.address || '').toString();
          return { address: addr ? addr.slice(0, 8) + '...' + addr.slice(-8) : '—', pct, label };
        })
      : [];

    const analysis = `This token has a total supply of ${supply.uiAmountString || supply.amount} (${decimals} decimals). ` +
      (topBalances.length
        ? `Top holder concentration and distribution suggest ${verdict === 'SAFE' ? 'moderate to low' : verdict === 'CAUTION' ? 'elevated' : 'high'} rug risk. `
        : '') +
      'Always verify liquidity pools and contract permissions on Solscan before trading. This is not financial advice.';

    res.writeHead(200, { ...corsHeaders(), 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      rugProbability,
      verdict,
      riskLevel,
      metrics: { liquidityScore, holderScore, contractScore, communityScore },
      flags,
      analysis,
      summary: analysis,
      topHolders,
    }));
  } catch (e) {
    console.error('analyze error', e.message);
    res.writeHead(500, { ...corsHeaders(), 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      error: 'Analysis failed',
      rugProbability: 50,
      verdict: 'CAUTION',
      riskLevel: 'Error',
      metrics: { liquidityScore: 50, holderScore: 50, contractScore: 50, communityScore: 50 },
      flags: [{ severity: 'warn', label: 'RPC error', detail: e.message || 'Could not fetch token data.' }],
      analysis: 'We could not complete the analysis. The RPC may be rate-limited or the mint may be invalid.',
      topHolders: [],
    }));
  }
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
