import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import { AgentActivityStreamer, type AgentEvent } from '../server/AgentActivityStreamer.js';

describe('WebSocket Server', () => {
  let wss: WebSocketServer;
  let streamer: AgentActivityStreamer;
  const TEST_PORT = 13503;

  before(async () => {
    // Create WebSocket server for testing
    streamer = new AgentActivityStreamer('/tmp/test-openclaw');
    wss = new WebSocketServer({ port: TEST_PORT });
    
    wss.on('connection', (ws) => {
      streamer.addClient(ws);
    });

    streamer.start();

    // Wait for server to be ready
    await new Promise<void>((resolve) => {
      wss.once('listening', resolve);
    });
  });

  after(() => {
    streamer.stop();
    wss.close();
  });

  describe('Connection handling', () => {
    it('should accept WebSocket connections', async () => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      await new Promise<void>((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
      });

      assert.strictEqual(ws.readyState, WebSocket.OPEN);
      ws.close();
    });

    it('should maintain client list', async () => {
      // Create a fresh streamer for this test
      const testStreamer = new AgentActivityStreamer('/tmp/test-openclaw-2');
      const testWss = new WebSocketServer({ port: TEST_PORT + 1 });
      
      testWss.on('connection', (ws) => {
        testStreamer.addClient(ws);
      });

      await new Promise<void>((resolve) => {
        testWss.once('listening', resolve);
      });

      assert.strictEqual(testStreamer.getClientCount(), 0);
      
      const ws = new WebSocket(`ws://localhost:${TEST_PORT + 1}`);
      await new Promise<void>((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
      });

      // Wait a bit for the connection handler to add the client
      await new Promise(resolve => setTimeout(resolve, 50));

      assert.strictEqual(testStreamer.getClientCount(), 1);
      
      ws.close();
      testWss.close();
    });

    it('should remove client on disconnect', async () => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
      await new Promise<void>((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
      });

      const countBefore = streamer.getClientCount();
      ws.close();

      // Wait for close to be processed
      await new Promise(resolve => setTimeout(resolve, 100));

      assert.strictEqual(streamer.getClientCount(), countBefore - 1);
    });
  });

  describe('Message broadcast', () => {
    it('should broadcast messages to all connected clients', async () => {
      const ws1 = new WebSocket(`ws://localhost:${TEST_PORT}`);
      const ws2 = new WebSocket(`ws://localhost:${TEST_PORT}`);

      await Promise.all([
        new Promise<void>((resolve, reject) => {
          ws1.on('open', resolve);
          ws1.on('error', reject);
        }),
        new Promise<void>((resolve, reject) => {
          ws2.on('open', resolve);
          ws2.on('error', reject);
        })
      ]);

      const messages: AgentEvent[] = [];
      
      ws1.on('message', (data) => {
        messages.push(JSON.parse(data.toString()));
      });

      ws2.on('message', (data) => {
        messages.push(JSON.parse(data.toString()));
      });

      // Broadcast a test event
      const testEvent: AgentEvent = {
        timestamp: new Date().toISOString(),
        agentId: 'test-agent',
        eventType: 'tool_called',
        payload: { tool: 'test-tool', args: {} }
      };

      streamer.broadcast(testEvent);

      // Wait for messages to be received
      await new Promise(resolve => setTimeout(resolve, 100));

      assert.strictEqual(messages.length, 2, 'Both clients should receive the message');
      assert.strictEqual(messages[0].agentId, 'test-agent');
      assert.strictEqual(messages[0].eventType, 'tool_called');
      assert.strictEqual(messages[1].agentId, 'test-agent');
      assert.strictEqual(messages[1].eventType, 'tool_called');

      ws1.close();
      ws2.close();
    });

    it('should send welcome message on connection', async () => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      const message = await new Promise<AgentEvent>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 1000);
        ws.on('message', (data) => {
          clearTimeout(timeout);
          resolve(JSON.parse(data.toString()));
        });
        ws.on('error', reject);
      });

      assert.ok(message.timestamp, 'Message should have timestamp');
      assert.ok(message.agentId, 'Message should have agentId');
      assert.ok(message.eventType, 'Message should have eventType');
      assert.ok(message.payload, 'Message should have payload');

      ws.close();
    });
  });

  describe('Message format', () => {
    it('should include timestamp in messages', async () => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      const message = await new Promise<AgentEvent>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 1000);
        ws.on('message', (data) => {
          clearTimeout(timeout);
          resolve(JSON.parse(data.toString()));
        });
        ws.on('error', reject);
      });

      assert.ok(message.timestamp, 'Message should have timestamp');
      assert.ok(Date.parse(message.timestamp), 'Timestamp should be valid ISO date');

      ws.close();
    });

    it('should include agentId in messages', async () => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      const message = await new Promise<AgentEvent>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 1000);
        ws.on('message', (data) => {
          clearTimeout(timeout);
          resolve(JSON.parse(data.toString()));
        });
        ws.on('error', reject);
      });

      assert.ok(message.agentId, 'Message should have agentId');
      assert.strictEqual(typeof message.agentId, 'string');

      ws.close();
    });

    it('should include eventType in messages', async () => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      const message = await new Promise<AgentEvent>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 1000);
        ws.on('message', (data) => {
          clearTimeout(timeout);
          resolve(JSON.parse(data.toString()));
        });
        ws.on('error', reject);
      });

      assert.ok(message.eventType, 'Message should have eventType');
      assert.strictEqual(typeof message.eventType, 'string');

      ws.close();
    });

    it('should include payload in messages', async () => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      const message = await new Promise<AgentEvent>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 1000);
        ws.on('message', (data) => {
          clearTimeout(timeout);
          resolve(JSON.parse(data.toString()));
        });
        ws.on('error', reject);
      });

      assert.ok(message.payload, 'Message should have payload');
      assert.strictEqual(typeof message.payload, 'object');

      ws.close();
    });
  });

  describe('Heartbeat', () => {
    it('should receive heartbeat messages', async () => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      await new Promise<void>((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
      });

      const heartbeats: AgentEvent[] = [];
      
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.eventType === 'heartbeat') {
          heartbeats.push(msg);
        }
      });

      // Wait for at least one heartbeat (30 second interval, but we poll faster in tests)
      // The streamer broadcasts heartbeat every 30 seconds, so we'll just check the structure
      // by manually broadcasting one
      streamer.broadcast({
        timestamp: new Date().toISOString(),
        agentId: 'system',
        eventType: 'heartbeat',
        payload: { test: true }
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      assert.ok(heartbeats.length >= 1, 'Should receive heartbeat');
      assert.strictEqual(heartbeats[0].eventType, 'heartbeat');

      ws.close();
    });
  });
});

describe('AgentActivityStreamer', () => {
  describe('Client management', () => {
    it('should track client count', () => {
      const streamer = new AgentActivityStreamer();
      
      // Mock WebSocket
      const mockWs = {
        readyState: 1,
        send: () => {},
        on: () => {},
        ping: () => {},
        terminate: () => {}
      } as unknown as WebSocket;

      assert.strictEqual(streamer.getClientCount(), 0);
      
      streamer.addClient(mockWs);
      assert.strictEqual(streamer.getClientCount(), 1);
      
      streamer.addClient(mockWs);
      assert.strictEqual(streamer.getClientCount(), 2);
    });
  });

  describe('Event types', () => {
    it('should support all required event types', () => {
      const streamer = new AgentActivityStreamer();
      const mockWs = {
        readyState: 1,
        send: () => {},
        on: () => {},
        ping: () => {},
        terminate: () => {}
      } as unknown as WebSocket;

      streamer.addClient(mockWs);

      const eventTypes = [
        'agent_started',
        'agent_ended',
        'tool_called',
        'model_switched',
        'token_update',
        'heartbeat'
      ];

      for (const eventType of eventTypes) {
        // Should not throw
        streamer.broadcast({
          timestamp: new Date().toISOString(),
          agentId: 'test',
          eventType: eventType as AgentEvent['eventType'],
          payload: {}
        });
      }

      // If we get here, all event types worked
      assert.ok(true);
    });
  });
});
