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

const userSockets = new Map(); // uid -> ws

wss.on('connection', (ws) => {
  console.log('Client connected');
  let assignedUid = null; // track the UID for disconnect cleanup

  ws.on('message', (msg) => {
    const message = msg.toString();
    console.log('Received:', message);

    try {
      const data = JSON.parse(message);

      // this handles temperature log
      if (data.temperature !== undefined) {
        const timestamp = Date.now();
        db.ref("temperatureLogs").push({
          temperature: data.temperature,
          timestamp: timestamp,
          uid: data.uid || "unknown"
        });
        console.log(`Logged: ${data.temperature}°C @ ${new Date(timestamp).toLocaleString()}`);
      }

      // this handles LED status update
      if (data.ledStatus !== undefined) {
        db.ref("ledStatus").set(data.ledStatus);
        console.log(`LED Status: ${data.ledStatus}`);
      }

      // this registers UID with socket
      if (data.uid) {
        assignedUid = data.uid;

        // Update user socket map
        if (!userSockets.has(data.uid)) {
          userSockets.set(data.uid, ws);
          console.log(`Mapped UID ${data.uid} to socket`);
        }

        // this marks session as active
        db.ref("sessions/" + data.uid).set({
          email: data.email || "unknown@example.com",
          status: "Active"
        });
      }

    } catch (err) {
      console.error("Invalid JSON:", message);
    }

    // this broadcasts to other clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');

    // this removes from userSockets and update status in Firebase
    for (const [uid, sock] of userSockets.entries()) {
      if (sock === ws) {
        userSockets.delete(uid);
        console.log(`Unmapped UID ${uid}`);

        // this marks session as disconnected
        db.ref("sessions/" + uid + "/status").set("Disconnected");
        break;
      }
    }

    // this is just in case we want assignedUid tracked
    if (assignedUid && !userSockets.has(assignedUid)) {
      db.ref("sessions/" + assignedUid + "/status").set("Disconnected");
    }
  });

  // confirming connections
  ws.send(JSON.stringify({ message: "Connected to WebSocket server" }));
});

// this is the firebase kick command watcher
db.ref("control/kick").on("child_added", (snapshot) => {
  const uid = snapshot.key;
  const command = snapshot.val();
  console.log(`Received kick command for UID: ${uid}`);

  const targetSocket = userSockets.get(uid);
  if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
    targetSocket.send(JSON.stringify({
      type: "kick",
      message: command.message || "You have been kicked by an admin."
    }));

    setTimeout(() => {
      try {
        targetSocket.close();
      } catch (err) {
        console.error("Error closing kicked socket:", err);
      }
    }, 1000);
  }

  db.ref("control/kick/" + uid).remove();
});

console.log('WebSocket server running at ws://localhost:8888');
