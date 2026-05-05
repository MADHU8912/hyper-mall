const express = require('express');
const { exec } = require('child_process');
const WebSocket = require('ws');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 11000;

// serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// ✅ FIX: define WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');

    const interval = setInterval(() => {

        // 🔴 Docker logs
        exec('docker logs hyper-mall-container', (err, stdout) => {
            if (!err) {
                ws.send(JSON.stringify({
                    type: "docker",
                    data: stdout.slice(-2000)
                }));
            }
        });

        // ⚙️ Jenkins logs
        const USER = process.env.JENKINS_USER;
        const TOKEN = process.env.JENKINS_TOKEN;

        axios.get("http://127.0.0.1:8080/job/hyper-mall/lastBuild/consoleText", {
            auth: {
                username: USER,
                password: TOKEN
            }
        })
        .then(res => {
            ws.send(JSON.stringify({
                type: "jenkins",
                data: res.data.slice(-2000)
            }));
        })
        .catch(err => {
            console.log("Jenkins ERROR:", err.message);

            ws.send(JSON.stringify({
                type: "jenkins",
                data: "Jenkins not reachable"
            }));
        });

        // 🟢 status
        exec('docker ps --filter "name=hyper-mall-container"', (err, stdout) => {
            ws.send(JSON.stringify({
                type: "status",
                data: stdout.includes("hyper-mall-container") ? "RUNNING" : "STOPPED"
            }));
        });

    }, 3000);

    ws.on('close', () => clearInterval(interval));
});