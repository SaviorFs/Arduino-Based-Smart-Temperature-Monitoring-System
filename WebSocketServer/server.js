const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8081 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (msg) => {
    const message = msg.toString(); // this will convert the buffer to string
    console.log('Received:', message);

    // now this will forward to all other clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message); // this is now a readable string
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.send(JSON.stringify({ message: "Connected to WebSocket server" }));
});

console.log('WebSocket server running at ws://localhost:8081');
