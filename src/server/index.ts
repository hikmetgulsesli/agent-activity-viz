import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { AgentActivityStreamer } from './AgentActivityStreamer.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3503;

// Create Express app
const app = express();

// Enable CORS
app.use(cors({
  origin: [
    'http://localhost:3503',
    'http://localhost:5173', // Vite dev server
    'https://ai.setrox.com.tr',
    /\.setrox\.com\.tr$/
  ],
  credentials: true
}));

// Serve static files from dist/client
const clientPath = join(__dirname, '../../dist/client');
app.use(express.static(clientPath, {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// SPA fallback - serve index.html for all routes
app.get('*', (_req, res) => {
  res.sendFile(join(clientPath, 'index.html'));
});

// Create HTTP server
const server = createServer(app);

// Create the activity streamer
const streamer = new AgentActivityStreamer();

// Create WebSocket server attached to HTTP server
const wss = new WebSocketServer({ 
  server,
  // Enable ping/pong for heartbeat
  perMessageDeflate: false
});

console.log(`Agent Activity Viz Server running on port ${PORT}`);
console.log(`HTTP: http://localhost:${PORT}`);
console.log(`WebSocket: ws://localhost:${PORT}`);
console.log(`Serving client files from: ${clientPath}`);

// Handle new WebSocket connections
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

// Start the HTTP server
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Start the activity polling and heartbeat
streamer.start();

// Handle server shutdown gracefully
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  streamer.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  streamer.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
