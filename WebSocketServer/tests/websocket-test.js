const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8888');

ws.on('open', () => {
  console.log('WebSocket Client Connected Successfully');
  ws.send(JSON.stringify({ test: 'ci_test' }));
  ws.close();
});

ws.on('error', (err) => {
  console.error('WebSocket Client Connection Failed', err.message);
  process.exit(1);
});
