# RugSniffer — Solana Token Security

DeFi app for Solana token rug-risk analysis: scanner, portfolio view, and premium deep analysis. Secure backend deployable on **Vercel**.

**→ To put this repo on GitHub and deploy via Vercel:** see **[GITHUB_AND_VERCEL.md](./GITHUB_AND_VERCEL.md)** (install Git, create repo, push, then import in Vercel).

## Features

- **Token scanner** — Paste mint address or ticker ($BONK, $WIF, …), get instant risk metrics and AI-style analysis
- **Portfolio** — Connect Phantom wallet, view holdings, scan tokens for risk
- **Trending** — Browse most-scanned tokens
- **Premium** — Unlock top-holder breakdown via one-time 0.01 SOL payment (non-custodial)

## Project structure

```
rugsniffer-app/
├── api/
│   ├── _tickerMap.js   # Ticker → mint mapping (no route)
│   ├── analyze.js     # POST /api/analyze — token risk analysis
│   └── trending.js     # GET /api/trending — trending list
├── index.html          # Single-page frontend (served at /)
├── .env.example
├── package.json
├── vercel.json
└── README.md
```

## Local development

1. **Install and run**

   ```bash
   cd rugsniffer-app
   npm install
   npx vercel dev
   ```

2. Open **http://localhost:3000**. The app will call `/api/analyze` and `/api/trending` on the same host.

3. **Optional env** — Copy `.env.example` to `.env` and set:

   - `SOLANA_RPC_URL` — RPC endpoint (default: public mainnet; use Helius/QuickNode for production)
   - `TREASURY_WALLET` — Solana address for premium payments (also set in frontend; see below)

## Deploy to Vercel

1. **Install Vercel CLI** (if needed): `npm i -g vercel`

2. **Deploy**

   ```bash
   cd rugsniffer-app
   vercel
   ```

   Follow the prompts (link to a new or existing project).

3. **Environment variables** (Vercel dashboard → Project → Settings → Environment Variables):

   - `SOLANA_RPC_URL` — Your Solana RPC URL (recommended for production)
   - `TREASURY_WALLET` — Your wallet for 0.01 SOL premium payments

4. **Treasury in frontend** — In `index.html`, search for `TREASURY_WALLET` and replace `YOUR_SOLANA_WALLET_ADDRESS` with the same address you set in `TREASURY_WALLET`. (The frontend needs it to build the Solana transfer; the address is public.)

5. **Redeploy** after changing env vars or the HTML.

## Backend security

- **Input validation** — Token input is trimmed and length-limited; body size capped (1KB).
- **CORS** — APIs send `Access-Control-Allow-Origin` and allow POST/GET/OPTIONS as needed.
- **No secrets in client** — RPC URL and treasury are either env (backend) or a public wallet address (frontend).
- **RPC** — Use a dedicated RPC key (e.g. Helius, QuickNode) in production to avoid public rate limits.

For production you may also add:

- **Rate limiting** — e.g. per IP with Upstash Redis or Vercel Edge Config.
- **Stricter CORS** — Restrict `Access-Control-Allow-Origin` to your domain.

## API

### `POST /api/analyze`

Request body:

```json
{ "token": "$BONK or mint address", "wallet": "optional connected wallet", "isPremium": false }
```

Response: `rugProbability`, `verdict`, `riskLevel`, `metrics`, `flags`, `analysis`, `topHolders` (if `isPremium`).

### `GET /api/trending`

Returns `{ "trending": [ ... ] }` (static list; can be replaced with DB/cache later).

## License

Use and modify as you like. Not financial advice; always DYOR.
