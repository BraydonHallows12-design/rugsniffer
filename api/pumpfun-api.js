const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PUMP_FUN_API = 'https://api.pump.fun/api';
const SOLANA_RPC = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';

let activeTokens = [];
let wsClients = new Set();

async function fetchPumpFunTokens() {
    try {
        const response = await axios.get(`${PUMP_FUN_API}/trending`, { params: { limit: 50, offset: 0 } });
        return response.data.tokens || [];
    } catch (error) {
        console.error('Error fetching pump.fun tokens:', error.message);
        return [];
    }
}

async function getTokenDetails(mint) {
    try {
        const response = await axios.get(`${PUMP_FUN_API}/token/${mint}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching token ${mint}:`, error.message);
        return null;
    }
}

async function analyzeTokenRisk(tokenData) {
    if (!tokenData) return { score: 0, risks: [] };
    const risks = [];
    let riskScore = 0;

    if (tokenData.liquidity < 1000) {
        risks.push({ severity: 'danger', label: 'Low Liquidity', detail: `${tokenData.liquidity} SOL` });
        riskScore += 25;
    } else if (tokenData.liquidity < 5000) {
        risks.push({ severity: 'warn', label: 'Medium Liquidity', detail: `${tokenData.liquidity} SOL` });
        riskScore += 10;
    }

    if (tokenData.marketCap < 10000) {
        risks.push({ severity: 'danger', label: 'Micro Market Cap', detail: `$${tokenData.marketCap}` });
        riskScore += 20;
    }

    if (tokenData.volume24h < 1000) {
        risks.push({ severity: 'warn', label: 'Low Trading Volume', detail: `$${tokenData.volume24h}` });
        riskScore += 15;
    }

    if (tokenData.topHolderPercent > 50) {
        risks.push({ severity: 'danger', label: 'High Holder Concentration', detail: `${tokenData.topHolderPercent}% in top wallet` });
        riskScore += 30;
    } else if (tokenData.topHolderPercent > 25) {
        risks.push({ severity: 'warn', label: 'Concentrated Holdings', detail: `${tokenData.topHolderPercent}% in top wallet` });
        riskScore += 15;
    }

    const ageHours = (Date.now() - tokenData.createdAt) / (1000 * 60 * 60);
    if (ageHours < 1) {
        risks.push({ severity: 'danger', label: 'Brand New Token', detail: `Created ${Math.round(ageHours * 60)} minutes ago` });
        riskScore += 25;
    } else if (ageHours < 24) {
        risks.push({ severity: 'warn', label: 'New Token', detail: `${Math.round(ageHours)} hours old` });
        riskScore += 10;
    }

    if (!tokenData.name || !tokenData.symbol) {
        risks.push({ severity: 'danger', label: 'Incomplete Metadata', detail: 'Missing token information' });
        riskScore += 20;
    }

    return { score: Math.min(100, riskScore), risks: risks };
}

app.get('/api/pumpfun/trending', async (req, res) => {
    try {
        const tokens = await fetchPumpFunTokens();
        const enrichedTokens = await Promise.all(
            tokens.slice(0, 20).map(async (token) => {
                const analysis = await analyzeTokenRisk(token);
                return { mint: token.mint, name: token.name, symbol: token.symbol, price: token.price || 0, priceChange24h: token.priceChange24h || 0, liquidity: token.liquidity || 0, marketCap: token.marketCap || 0, volume24h: token.volume24h || 0, holders: token.holders || 0, topHolderPercent: token.topHolderPercent || 0, createdAt: token.createdAt || Date.now(), riskScore: analysis.score, risks: analysis.risks, image: token.image || null };
            })
        );
        res.json({ success: true, data: enrichedTokens, timestamp: Date.now() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/pumpfun/token/:mint', async (req, res) => {
    try {
        const { mint } = req.params;
        const tokenData = await getTokenDetails(mint);
        const analysis = await analyzeTokenRisk(tokenData);
        res.json({ success: true, data: { ...tokenData, riskScore: analysis.score, risks: analysis.risks }, timestamp: Date.now() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const wss = new WebSocket.Server({ port: 8080 });
wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');
    wsClients.add(ws);
    ws.on('close', () => {
        console.log('Client disconnected');
        wsClients.delete(ws);
    });
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        wsClients.delete(ws);
    });
});

function broadcastUpdate(data) {
    wsClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

let lastTokens = [];
setInterval(async () => {
    try {
        const tokens = await fetchPumpFunTokens();
        const newTokens = tokens.filter(t => !lastTokens.some(lt => lt.mint === t.mint));
        for (const token of newTokens.slice(0, 5)) {
            const analysis = await analyzeTokenRisk(token);
            broadcastUpdate({ type: 'new_token', data: { mint: token.mint, name: token.name, symbol: token.symbol, price: token.price || 0, liquidity: token.liquidity || 0, marketCap: token.marketCap || 0, riskScore: analysis.score, risks: analysis.risks, image: token.image || null, timestamp: Date.now() } });
        }
        const priceUpdates = tokens.slice(0, 10).map(t => ({ mint: t.mint, symbol: t.symbol, price: t.price || 0, priceChange24h: t.priceChange24h || 0, volume24h: t.volume24h || 0, timestamp: Date.now() }));
        broadcastUpdate({ type: 'price_update', data: priceUpdates });
        lastTokens = tokens;
    } catch (error) {
        console.error('Error in polling service:', error);
    }
}, 5000);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`RugSniffer backend running on http://localhost:${PORT}`);
    console.log(`WebSocket server running on ws://localhost:8080`);
    console.log(`Pump.fun live stream active - polling every 5 seconds`);
});

module.exports = app;