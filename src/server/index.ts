import { WebSocketServer } from 'ws';
import { AgentActivityStreamer } from './AgentActivityStreamer.js';

const PORT = process.env.PORT || 3503;

// Create the activity streamer
const streamer = new AgentActivityStreamer();

// Create WebSocket server
const wss = new WebSocketServer({ 
  port: PORT as number,
  // Enable ping/pong for heartbeat
  perMessageDeflate: false
});

console.log(`Agent Activity Viz Server running on port ${PORT}`);

// Handle new connections
wss.on('connection', (ws) => {
  const clientId = streamer.addClient(ws);
  console.log(`Client connected: ${clientId} (total: ${streamer.getClientCount()})`);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`Received from ${clientId}:`, message);
      
      // Handle client messages if needed
      if (message.type === 'ping') {
        ws.send(JSON.stringify({
          timestamp: new Date().toISOString(),
          agentId: 'system',
          eventType: 'heartbeat',
          payload: { type: 'pong' }
        }));
      }
    } catch {
      console.log(`Received non-JSON message from ${clientId}:`, data.toString());
    }
  });

  ws.on('close', () => {
    console.log(`Client disconnected: ${clientId} (total: ${streamer.getClientCount()})`);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for ${clientId}:`, error);
  });
});

// Start the activity polling and heartbeat
streamer.start();

// Handle server shutdown gracefully
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  streamer.stop();
  wss.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  streamer.stop();
  wss.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
