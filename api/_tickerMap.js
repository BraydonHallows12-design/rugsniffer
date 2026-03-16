// Known Solana token ticker/symbol -> mint address (mainnet)
// Add more from https://solscan.io or Jupiter token list
module.exports = {
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  MOODENG: 'ED5nyyWEzpP3nrf3o9N2V2h4s2V1aRV7RjqF2tL2xR8aR',
  POPCAT: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  JUPITER: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  ORCA: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
  mSOL: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
  stSOL: '7dHbWXmni3p2282wBqdMmBqknktJEM3FW34wT5nb2oRh',
};

function resolveTickerOrAddress(input) {
  const trimmed = (input || '').trim().toUpperCase();
  if (!trimmed) return null;
  // Remove leading $ if present
  const symbol = trimmed.startsWith('$') ? trimmed.slice(1) : trimmed;
  const mint = module.exports[symbol];
  if (mint) return mint;
  // If it looks like a base58 address (length 32–44), use as mint
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) return trimmed;
  return null;
}

module.exports.resolveTickerOrAddress = resolveTickerOrAddress;
