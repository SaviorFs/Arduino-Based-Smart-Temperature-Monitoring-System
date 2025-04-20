const WebSocket = require('ws');
const admin = require("firebase-admin");
const path = require('path');
const fs = require('fs');

const serviceAccount = require("./firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://arduinotempmonitor-default-rtdb.firebaseio.com"
});

const db = admin.database();

const wss = new WebSocket.Server({ port: 8888 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (msg) => {
    const message = msg.toString();
    console.log('Received:', message);

    try {
      const data = JSON.parse(message);

      if (data.temperature !== undefined) {
        const timestamp = Date.now();
        db.ref("temperatureLogs").push({
          temperature: data.temperature,
          timestamp: timestamp
        });
        console.log(`Logged: ${data.temperature}°C @ ${new Date(timestamp).toLocaleString()}`);
      }

      if (data.ledStatus !== undefined) {
        db.ref("ledStatus").set(data.ledStatus);
        console.log(`LED Status: ${data.ledStatus}`);
      }

    } catch (err) {
      console.error("Invalid JSON:", message);
    }

    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.send(JSON.stringify({ message: "Connected to WebSocket server" }));
});

console.log('WebSocket server running at ws://localhost:8888');
