const sendAlert = require('./email');
const express = require('express');
const { exec } = require('child_process');
const WebSocket = require('ws');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 11000;

// ✅ enable JSON body
app.use(express.json());

// 🌐 serve frontend
app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// 👥 users
const users = [
  { username: "admin", password: "1234" },
  { username: "dev", password: "1234" }
];

// 🔐 login API
app.post('/login', (req, res) => {
  const user = users.find(u =>
    u.username === req.body.username &&
    u.password === req.body.password
  );

  if (user) {
    const token = jwt.sign({ user: user.username }, "secret", { expiresIn: "1h" });
    res.json({ message: "Login success", token });
  } else {
    res.status(401).send("Invalid credentials");
  }
});

// 🚀 start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// 🔌 WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log("Client connected");

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
        axios.get("http://127.0.0.1:8080/job/hyper-mall/lastBuild/consoleText", {
            auth: {
                username: process.env.JENKINS_USER,
                password: process.env.JENKINS_TOKEN
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

        // 🟢 container status
        exec('docker ps --filter "name=hyper-mall-container"', (err, stdout) => {
            ws.send(JSON.stringify({
                type: "status",
                data: stdout.includes("hyper-mall-container") ? "RUNNING" : "STOPPED"
            }));
        });

        // 🔔 alerts + email
        try {
            const alert = fs.readFileSync('./frontend/alert.txt', 'utf8').trim();

            ws.send(JSON.stringify({
                type: "alert",
                data: alert
            }));

            if (alert.toUpperCase().includes("FAILED")) {
                console.log("🚨 Sending email alert...");
                sendAlert(`🚨 Build Failed:\n\n${alert}`);
            }

        } catch (err) {
            // ignore if file not exists
        }

    }, 3000);

    ws.on('close', () => clearInterval(interval));
});