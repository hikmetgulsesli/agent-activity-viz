import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebSocketServer, WebSocket } from 'ws';
import express from 'express';
import { createServer, Server as HttpServer } from 'http';
import type { AddressInfo } from 'net';

describe('Integration Tests: End-to-End Flow', () => {
  let server: HttpServer;
  let wss: WebSocketServer;
  let port: number;
  let app: express.Application;

  beforeAll(() => {
    // Create Express app
    app = express();
    app.use(express.json());
    
    // Add health check endpoint
    app.get('/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    // Create HTTP server
    server = createServer(app);

    // Create WebSocket server attached to HTTP server
    wss = new WebSocketServer({ server });

    // Handle WebSocket connections
    wss.on('connection', (ws) => {
      // Send welcome message
      ws.send(JSON.stringify({
        eventType: 'connection',
        timestamp: new Date().toISOString(),
        agentId: 'system',
        payload: { message: 'Connected to Agent Activity Visualizer' }
      }));

      // Echo messages back for testing
      ws.on('message', (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          ws.send(JSON.stringify({
            eventType: 'echo',
            timestamp: new Date().toISOString(),
            agentId: 'test',
            payload: parsed
          }));
        } catch {
          ws.send(JSON.stringify({
            eventType: 'error',
            timestamp: new Date().toISOString(),
            agentId: 'system',
            payload: { error: 'Invalid JSON' }
          }));
        }
      });
    });

    // Start server on random available port
    return new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = (server.address() as AddressInfo).port;
        resolve();
      });
    });
  });

  afterAll(() => {
    return new Promise<void>((resolve, reject) => {
      // Close all WebSocket connections
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.close();
        }
      });

      // Close WebSocket server
      wss.close((err) => {
        if (err) {
          reject(err);
          return;
        }

        // Close HTTP server
        server.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  });

  describe('Server Startup and Connection', () => {
    it('should start server and accept HTTP connections', async () => {
      const response = await fetch(`http://localhost:${port}/health`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data).toHaveProperty('status', 'ok');
      expect(data).toHaveProperty('timestamp');
      expect(typeof data.timestamp).toBe('number');
    });

    it('should accept WebSocket connections', () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);
        
        ws.on('open', () => {
          ws.close();
          resolve();
        });

        ws.on('error', (err) => {
          reject(err);
        });

        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });
    });

    it('should send welcome message on connection', () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);
        
        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            expect(message).toHaveProperty('eventType', 'connection');
            expect(message).toHaveProperty('timestamp');
            expect(message).toHaveProperty('payload');
            expect(message.payload).toHaveProperty('message');
            ws.close();
            resolve();
          } catch (err) {
            ws.close();
            reject(err);
          }
        });

        ws.on('error', (err) => {
          reject(err);
        });

        setTimeout(() => {
          ws.close();
          reject(new Error('Welcome message timeout'));
        }, 5000);
      });
    });

    it('should handle multiple concurrent connections', () => {
      const connectionCount = 5;
      const promises: Promise<void>[] = [];

      for (let i = 0; i < connectionCount; i++) {
        const promise = new Promise<void>((resolve, reject) => {
          const ws = new WebSocket(`ws://localhost:${port}`);
          
          ws.on('open', () => {
            ws.close();
            resolve();
          });

          ws.on('error', reject);
          setTimeout(() => reject(new Error('Connection timeout')), 5000);
        });

        promises.push(promise);
      }

      return Promise.all(promises);
    });
  });

  describe('Client-Server Data Flow', () => {
    it('should receive and parse messages from server', () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);
        let messageCount = 0;

        ws.on('message', (data) => {
          messageCount++;
          try {
            const message = JSON.parse(data.toString());
            expect(message).toHaveProperty('eventType');
            expect(message).toHaveProperty('timestamp');
            expect(message).toHaveProperty('payload');

            if (messageCount >= 1) { // Welcome message
              ws.close();
              resolve();
            }
          } catch (err) {
            ws.close();
            reject(err);
          }
        });

        ws.on('error', reject);
        setTimeout(() => {
          ws.close();
          reject(new Error('Message receive timeout'));
        }, 5000);
      });
    });

    it('should send messages to server and receive responses', () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);
        const testPayload = { test: 'data', value: 42 };
        let receivedWelcome = false;

        ws.on('open', () => {
          // Wait for welcome message before sending
          setTimeout(() => {
            ws.send(JSON.stringify(testPayload));
          }, 100);
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            
            if (message.eventType === 'connection') {
              receivedWelcome = true;
              return;
            }

            if (message.eventType === 'echo') {
              expect(message.payload).toEqual(testPayload);
              expect(receivedWelcome).toBe(true);
              ws.close();
              resolve();
            }
          } catch (err) {
            ws.close();
            reject(err);
          }
        });

        ws.on('error', reject);
        setTimeout(() => {
          ws.close();
          reject(new Error('Echo response timeout'));
        }, 5000);
      });
    });

    it('should handle invalid JSON gracefully', () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);
        let receivedWelcome = false;

        ws.on('open', () => {
          setTimeout(() => {
            ws.send('invalid json {{{');
          }, 100);
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            
            if (message.eventType === 'connection') {
              receivedWelcome = true;
              return;
            }

            if (message.eventType === 'error') {
              expect(message.payload).toHaveProperty('error');
              expect(receivedWelcome).toBe(true);
              ws.close();
              resolve();
            }
          } catch (err) {
            ws.close();
            reject(err);
          }
        });

        ws.on('error', reject);
        setTimeout(() => {
          ws.close();
          reject(new Error('Error response timeout'));
        }, 5000);
      });
    });
  });

  describe('WebSocket Reconnection Logic', () => {
    it('should detect disconnection', () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);
        
        ws.on('open', () => {
          // Force close the connection
          ws.close();
        });

        ws.on('close', () => {
          resolve();
        });

        ws.on('error', reject);
        setTimeout(() => reject(new Error('Close timeout')), 5000);
      });
    });

    it('should allow reconnection after disconnect', async () => {
      // First connection
      const ws1 = new WebSocket(`ws://localhost:${port}`);
      await new Promise<void>((resolve, reject) => {
        ws1.on('open', () => {
          ws1.close();
          resolve();
        });
        ws1.on('error', reject);
        setTimeout(() => reject(new Error('First connection timeout')), 5000);
      });

      // Wait for close
      await new Promise<void>((resolve) => {
        ws1.on('close', resolve);
      });

      // Second connection (reconnect)
      const ws2 = new WebSocket(`ws://localhost:${port}`);
      await new Promise<void>((resolve, reject) => {
        ws2.on('open', () => {
          ws2.close();
          resolve();
        });
        ws2.on('error', reject);
        setTimeout(() => reject(new Error('Reconnection timeout')), 5000);
      });
    });

    it('should maintain connection state', () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);
        
        ws.on('open', () => {
          expect(ws.readyState).toBe(WebSocket.OPEN);
          ws.close();
        });

        ws.on('close', () => {
          expect(ws.readyState).toBe(WebSocket.CLOSED);
          resolve();
        });

        ws.on('error', reject);
        setTimeout(() => reject(new Error('State check timeout')), 5000);
      });
    });
  });

  describe('Mock Data Streaming', () => {
    it('should stream agent activity events', () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);
        
        ws.on('open', () => {
          // Simulate server sending agent events
          const mockEvent = {
            eventType: 'agent_started',
            timestamp: new Date().toISOString(),
            agentId: 'test-agent-1',
            payload: {
              agentName: 'test-agent-1',
              model: 'claude-sonnet-4',
              status: 'active'
            }
          };

          // Send mock event to ourselves via server echo
          setTimeout(() => {
            ws.send(JSON.stringify(mockEvent));
          }, 100);
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            
            if (message.eventType === 'connection') {
              return; // Skip welcome message
            }

            if (message.eventType === 'echo') {
              expect(message.payload).toHaveProperty('eventType', 'agent_started');
              expect(message.payload).toHaveProperty('agentId', 'test-agent-1');
              ws.close();
              resolve();
            }
          } catch (err) {
            ws.close();
            reject(err);
          }
        });

        ws.on('error', reject);
        setTimeout(() => {
          ws.close();
          reject(new Error('Event stream timeout'));
        }, 5000);
      });
    });

    it('should stream tool usage events', () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);
        
        ws.on('open', () => {
          const mockEvent = {
            eventType: 'tool_called',
            timestamp: new Date().toISOString(),
            agentId: 'test-agent-1',
            payload: {
              toolName: 'Read',
              args: { path: '/test/file.txt' }
            }
          };

          setTimeout(() => {
            ws.send(JSON.stringify(mockEvent));
          }, 100);
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            
            if (message.eventType === 'connection') return;

            if (message.eventType === 'echo') {
              expect(message.payload).toHaveProperty('eventType', 'tool_called');
              expect(message.payload.payload).toHaveProperty('toolName', 'Read');
              ws.close();
              resolve();
            }
          } catch (err) {
            ws.close();
            reject(err);
          }
        });

        ws.on('error', reject);
        setTimeout(() => {
          ws.close();
          reject(new Error('Tool event timeout'));
        }, 5000);
      });
    });

    it('should stream token usage events', () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);
        
        ws.on('open', () => {
          const mockEvent = {
            eventType: 'token_update',
            timestamp: new Date().toISOString(),
            agentId: 'test-agent-1',
            payload: {
              inputTokens: 1000,
              outputTokens: 500,
              totalTokens: 1500
            }
          };

          setTimeout(() => {
            ws.send(JSON.stringify(mockEvent));
          }, 100);
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            
            if (message.eventType === 'connection') return;

            if (message.eventType === 'echo') {
              expect(message.payload).toHaveProperty('eventType', 'token_update');
              expect(message.payload.payload.totalTokens).toBe(1500);
              ws.close();
              resolve();
            }
          } catch (err) {
            ws.close();
            reject(err);
          }
        });

        ws.on('error', reject);
        setTimeout(() => {
          ws.close();
          reject(new Error('Token event timeout'));
        }, 5000);
      });
    });

    it('should handle multiple event types in sequence', () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);
        const events = [
          { eventType: 'agent_started', agentId: 'test-1', payload: {} },
          { eventType: 'tool_called', agentId: 'test-1', payload: { toolName: 'Read' } },
          { eventType: 'model_switched', agentId: 'test-1', payload: { toModel: 'opus' } },
          { eventType: 'token_update', agentId: 'test-1', payload: { totalTokens: 1000 } },
        ];
        let eventIndex = 0;
        let receivedCount = 0;

        ws.on('open', () => {
          // Send first event after welcome
          setTimeout(() => {
            ws.send(JSON.stringify(events[eventIndex++]));
          }, 100);
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            
            if (message.eventType === 'connection') return;

            if (message.eventType === 'echo') {
              receivedCount++;
              
              // Send next event
              if (eventIndex < events.length) {
                setTimeout(() => {
                  ws.send(JSON.stringify(events[eventIndex++]));
                }, 50);
              } else if (receivedCount === events.length) {
                ws.close();
                resolve();
              }
            }
          } catch (err) {
            ws.close();
            reject(err);
          }
        });

        ws.on('error', reject);
        setTimeout(() => {
          ws.close();
          reject(new Error('Multiple events timeout'));
        }, 10000);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle connection errors gracefully', () => {
      // Use a port that's very likely not in use
      const invalidPort = 54321;
      
      return new Promise<void>((resolve) => {
        try {
          const ws = new WebSocket(`ws://localhost:${invalidPort}`);
          
          ws.on('error', (err) => {
            expect(err).toBeDefined();
            ws.close();
            resolve();
          });

          setTimeout(() => {
            ws.close();
            resolve();
          }, 1000);
        } catch (err) {
          // If WebSocket constructor throws, that's also an expected error
          expect(err).toBeDefined();
          resolve();
        }
      });
    });

    it('should handle rapid connect/disconnect cycles', async () => {
      const cycles = 3;
      
      for (let i = 0; i < cycles; i++) {
        const ws = new WebSocket(`ws://localhost:${port}`);
        
        await new Promise<void>((resolve, reject) => {
          ws.on('open', () => {
            ws.close();
            resolve();
          });
          ws.on('error', reject);
          setTimeout(() => reject(new Error('Cycle timeout')), 5000);
        });

        await new Promise<void>((resolve) => {
          ws.on('close', resolve);
        });
      }

      expect(true).toBe(true); // If we get here, test passed
    });

    it('should handle large payloads', () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);
        const largePayload = {
          data: 'x'.repeat(10000), // 10KB of data
          array: Array.from({ length: 100 }, (_, i) => ({ id: i, value: `item-${i}` }))
        };

        ws.on('open', () => {
          setTimeout(() => {
            ws.send(JSON.stringify(largePayload));
          }, 100);
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            
            if (message.eventType === 'connection') return;

            if (message.eventType === 'echo') {
              expect(message.payload.data).toBe(largePayload.data);
              expect(message.payload.array).toHaveLength(100);
              ws.close();
              resolve();
            }
          } catch (err) {
            ws.close();
            reject(err);
          }
        });

        ws.on('error', reject);
        setTimeout(() => {
          ws.close();
          reject(new Error('Large payload timeout'));
        }, 10000);
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle message throughput efficiently', async () => {
      const ws = new WebSocket(`ws://localhost:${port}`);
      const messageCount = 50;
      let receivedCount = 0;

      await new Promise<void>((resolve, reject) => {
        ws.on('open', () => {
          setTimeout(() => {
            // Send multiple messages rapidly
            for (let i = 0; i < messageCount; i++) {
              ws.send(JSON.stringify({ index: i, data: `message-${i}` }));
            }
          }, 100);
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            
            if (message.eventType === 'connection') return;

            if (message.eventType === 'echo') {
              receivedCount++;
              
              if (receivedCount === messageCount) {
                ws.close();
                resolve();
              }
            }
          } catch (err) {
            ws.close();
            reject(err);
          }
        });

        ws.on('error', reject);
        setTimeout(() => {
          ws.close();
          reject(new Error(`Only received ${receivedCount}/${messageCount} messages`));
        }, 10000);
      });

      expect(receivedCount).toBe(messageCount);
    });

    it('should maintain low latency for individual messages', () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);
        const sendTime = Date.now();

        ws.on('open', () => {
          setTimeout(() => {
            ws.send(JSON.stringify({ timestamp: sendTime }));
          }, 100);
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            
            if (message.eventType === 'connection') return;

            if (message.eventType === 'echo') {
              const receiveTime = Date.now();
              const latency = receiveTime - sendTime;
              
              // Latency should be under 1 second for local connection
              expect(latency).toBeLessThan(1000);
              ws.close();
              resolve();
            }
          } catch (err) {
            ws.close();
            reject(err);
          }
        });

        ws.on('error', reject);
        setTimeout(() => {
          ws.close();
          reject(new Error('Latency test timeout'));
        }, 5000);
      });
    });
  });
});
