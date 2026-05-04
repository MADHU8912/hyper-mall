const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 1. Dynamic Port for Render
const PORT = process.env.PORT || 10000;

// 2. Serve Frontend Files
// This allows Render to show your index.html when you visit the URL
app.use(express.static(path.join(__dirname, '../frontend')));

// 3. Root Route (Fixes "Cannot GET /")
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 4. API Status Route
app.get('/api/status', (req, res) => {
    res.json({
        project: "Hyper Mall",
        status: "Online",
        timestamp: new Date()
    });
});

// 5. WebSocket Logic for Live Logs
wss.on('connection', (ws) => {
    console.log('Dashboard Client Connected');
    
    // Send logs every 2 seconds to the UI
    const logInterval = setInterval(() => {
        const logPath = path.join(__dirname, '../frontend/logs.txt');
        
        if (fs.existsSync(logPath)) {
            const logs = fs.readFileSync(logPath, 'utf8');
            ws.send(JSON.stringify({ type: 'logs', data: logs }));
        } else {
            ws.send(JSON.stringify({ type: 'logs', data: "Waiting for Jenkins logs..." }));
        }
    }, 2000);

    ws.on('close', () => clearInterval(logInterval));
});

server.listen(PORT, () => {
    console.log(`🚀 Hyper Mall Server running on port ${PORT}`);
});