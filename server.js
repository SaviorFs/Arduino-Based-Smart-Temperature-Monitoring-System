const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');
const path = require('path');

// this SSL Certificate paths
const certOptions = {
  key: fs.readFileSync(path.join(__dirname, 'cert', 'private.key')),
  cert: fs.readFileSync(path.join(__dirname, 'cert', 'certificate.crt')),
  ca: fs.readFileSync(path.join(__dirname, 'cert', 'ca_bundle.crt'))
};

// this creates HTTPS server
const httpsServer = https.createServer(certOptions);

// this binds WebSocket server to HTTPS
const wss = new WebSocket.Server({ server: httpsServer });

let clients = [];

wss.on('connection', (ws) => {
  console.log("🔌 New device connected");
  clients.push(ws);

  ws.on('message', (message) => {
    console.log("Received:", message);
    // this broadcasts to other clients in this case it will be like the dashboard receiving Arduino data
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    clients = clients.filter((c) => c !== ws);
    console.log("A device disconnected");
  });

  ws.send(JSON.stringify({ message: "Connected to wss WebSocket server" }));
});

httpsServer.listen(8081, () => {
  console.log("Secure WebSocket server running at wss://realtimetempmonitor.com:8081");
});
