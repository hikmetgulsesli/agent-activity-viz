import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 3503;

const wss = new WebSocketServer({ port: PORT as number });

console.log(`Agent Activity Viz Server running on port ${PORT}`);

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (data) => {
    console.log('Received:', data.toString());
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to Agent Activity Viz Server'
  }));
});
