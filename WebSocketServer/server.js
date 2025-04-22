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
  let assignedUid = null;

  ws.on('message', (msg) => {
    const message = msg.toString();
    console.log('Received:', message);

    try {
      const data = JSON.parse(message);

      // this handles register-uid from frontend
      if (data.type === "register-uid" && data.uid) {
        assignedUid = data.uid;

        if (!userSockets.has(assignedUid)) {
          userSockets.set(assignedUid, ws);
          console.log(`Mapped UID ${assignedUid} to socket via register-uid`);
        }

        // this forwards register-uid to any other client in this case the arduino
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
            console.log(`Forwarded register-uid to other clients for UID: ${data.uid}`);
          }
        });

        return;
      }

      const uid = data.uid;
      if (!uid) return;

      const timestamp = Date.now();

      // this is for temperature logging
      if (data.temperature !== undefined) {
        db.ref(`users/${uid}/temperatureLogs`).push({
          temperature: data.temperature,
          timestamp: timestamp,
          ledStatus: data.ledStatus || "UNKNOWN"
        });

        console.log(`Logged: ${data.temperature}°C from UID ${uid} @ ${new Date(timestamp).toLocaleString()}`);
      }

      // this is LED Status Update
      if (data.ledStatus !== undefined) {
        db.ref(`users/${uid}/ledStatus`).set({
          value: data.ledStatus,
          timestamp: timestamp
        });
        console.log(`LED Status (${uid}): ${data.ledStatus}`);
      }

      // this registers UID with WebSocket and mark session active
      if (!userSockets.has(uid)) {
        userSockets.set(uid, ws);
        console.log(`Mapped UID ${uid} to socket`);
      }
      assignedUid = uid;

      const sessionId = `session_${timestamp}`;
      db.ref(`users/${uid}/sessions/${sessionId}`).set({
        email: data.email || "unknown@example.com",
        active: true,
        sessionStart: new Date(timestamp).toISOString(),
        lastActivity: new Date(timestamp).toISOString()
      });

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

    for (const [uid, sock] of userSockets.entries()) {
      if (sock === ws) {
        userSockets.delete(uid);
        console.log(`Unmapped UID ${uid}`);

        db.ref(`users/${uid}/sessions`).orderByChild("active").equalTo(true).once("value", snapshot => {
          snapshot.forEach(child => {
            db.ref(`users/${uid}/sessions/${child.key}/active`).set(false);
          });
        });

        break;
      }
    }

    if (assignedUid && !userSockets.has(assignedUid)) {
      db.ref(`users/${assignedUid}/sessions`).orderByChild("active").equalTo(true).once("value", snapshot => {
        snapshot.forEach(child => {
          db.ref(`users/${assignedUid}/sessions/${child.key}/active`).set(false);
        });
      });
    }
  });

  ws.send(JSON.stringify({ message: "Connected to WebSocket server" }));
});

// this is the admin's kick command
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
