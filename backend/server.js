const express = require('express');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const app = express();
const PORT = 3000;

// serve frontend
app.use(express.static(path.join(__dirname, '../public')));

// logs API
app.get('/logs', (req, res) => {
  fs.readFile(path.join(__dirname, '../logs.txt'), 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error reading logs');
    res.send(data);
  });
});

// report API (for chart)
app.get('/report', (req, res) => {
  const data = [
    { time: "10:00", status: 1 },
    { time: "10:05", status: 0 },
    { time: "10:10", status: 1 }
  ];
  res.json(data);
});

// start HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// ✅ attach WebSocket to SAME server (no 8080 issue)
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');

  const interval = setInterval(() => {
    ws.send(`Log update: ${new Date().toLocaleTimeString()}`);
  }, 3000);

  ws.on('close', () => {
    clearInterval(interval);
    console.log('Client disconnected');
  });
});