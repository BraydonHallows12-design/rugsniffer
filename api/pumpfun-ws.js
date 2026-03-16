const WebSocket = require('ws');

// In-memory storage for pump.fun tokens
let tokenData = {};

// WebSocket server for real-time pump.fun token monitoring
const wss = new WebSocket.Server({ port: 8080 });

// SSE Fallback client connections
const clients = [];

// Function to send data to all connected clients
const sendToClients = (data) => {
    clients.forEach(client => client.res.write(`data: ${JSON.stringify(data)}\n\n`));
};

wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');
    // Send the current token data to the newly connected client
    ws.send(JSON.stringify(tokenData));

    ws.on('message', (message) => {
        // Handle messages (if needed)
        console.log(`Received message: ${message}`);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Example function to simulate streaming data
const simulateDataStream = () => {
    setInterval(() => {
        // Simulate fetching new token data and updating in-memory storage
        tokenData = { token: "pumpfun", price: Math.random() * 100 };  // Example token data
        console.log('Updated token data:', tokenData);

        // Broadcast the new data to all WebSocket clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(tokenData));
            }
        });

        // Also send data to SSE clients
        sendToClients(tokenData);
    }, 5000); // update every 5 seconds
};

// Start the data simulation
simulateDataStream();

// Express server for SSE fallback
const express = require('express');
const app = express();

// SSE endpoint
app.get('/sse', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    clients.push({ res });

    // Send the initial data
    res.write(`data: ${JSON.stringify(tokenData)}\n\n`);

    // Remove connection on client disconnect
    req.on('close', () => {
        clients = clients.filter(client => client.res !== res);
    });
});

// Start the Express server
app.listen(3000, () => {
    console.log('SSE server running on http://localhost:3000/sse');
});