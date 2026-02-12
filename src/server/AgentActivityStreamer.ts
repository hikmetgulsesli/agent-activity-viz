import type { WebSocket } from 'ws';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export type AgentEventType = 
  | 'agent_started'
  | 'agent_ended'
  | 'tool_called'
  | 'model_switched'
  | 'token_update'
  | 'heartbeat';

export interface AgentEvent {
  timestamp: string;
  agentId: string;
  eventType: AgentEventType;
  payload: Record<string, unknown>;
}

export interface ClientInfo {
  ws: WebSocket;
  id: string;
  isAlive: boolean;
  connectedAt: Date;
}

export class AgentActivityStreamer {
  private clients: Map<string, ClientInfo> = new Map();
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private readonly POLL_INTERVAL_MS = 2000;
  private readonly HEARTBEAT_INTERVAL_MS = 30000;
  // private readonly HEARTBEAT_TIMEOUT_MS = 60000; // Reserved for future use
  private clientIdCounter = 0;
  private lastKnownSessions: Set<string> = new Set();

  constructor(private openclawDir: string = join(homedir(), '.openclaw')) {}

  /**
   * Add a new WebSocket client
   */
  addClient(ws: WebSocket): string {
    const clientId = `client-${++this.clientIdCounter}`;
    const clientInfo: ClientInfo = {
      ws,
      id: clientId,
      isAlive: true,
      connectedAt: new Date()
    };

    this.clients.set(clientId, clientInfo);

    // Set up pong handler for heartbeat
    ws.on('pong', () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.isAlive = true;
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      this.removeClient(clientId);
    });

    ws.on('error', () => {
      this.removeClient(clientId);
    });

    // Send welcome message
    this.sendToClient(clientId, {
      timestamp: new Date().toISOString(),
      agentId: 'system',
      eventType: 'agent_started',
      payload: {
        message: 'Connected to Agent Activity Viz Server',
        clientId,
        connectedClients: this.clients.size
      }
    });

    return clientId;
  }

  /**
   * Remove a client
   */
  removeClient(clientId: string): void {
    this.clients.delete(clientId);
  }

  /**
   * Get number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Send event to a specific client
   */
  private sendToClient(clientId: string, event: AgentEvent): void {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === 1) { // WebSocket.OPEN = 1
      try {
        client.ws.send(JSON.stringify(event));
      } catch {
        // Client disconnected, remove it
        this.removeClient(clientId);
      }
    }
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcast(event: AgentEvent): void {
    const message = JSON.stringify(event);
    for (const [clientId, client] of this.clients) {
      if (client.ws.readyState === 1) { // WebSocket.OPEN = 1
        try {
          client.ws.send(message);
        } catch {
          // Client disconnected, remove it
          this.removeClient(clientId);
        }
      }
    }
  }

  /**
   * Start polling for agent activities and heartbeats
   */
  start(): void {
    this.startPolling();
    this.startHeartbeat();
  }

  /**
   * Stop all intervals
   */
  stop(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Start polling OpenClaw data for agent activities
   */
  private startPolling(): void {
    this.pollingInterval = setInterval(() => {
      this.pollAgentActivities();
    }, this.POLL_INTERVAL_MS);
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      // Check all clients for heartbeat timeout
      for (const [clientId, client] of this.clients) {
        if (!client.isAlive) {
          // Client didn't respond to ping, terminate connection
          client.ws.terminate();
          this.removeClient(clientId);
          continue;
        }

        // Mark as not alive until pong received
        client.isAlive = false;
        
        // Send ping
        try {
          client.ws.ping();
        } catch {
          client.ws.terminate();
          this.removeClient(clientId);
        }
      }

      // Broadcast heartbeat to all clients
      this.broadcast({
        timestamp: new Date().toISOString(),
        agentId: 'system',
        eventType: 'heartbeat',
        payload: {
          connectedClients: this.clients.size,
          uptime: process.uptime()
        }
      });
    }, this.HEARTBEAT_INTERVAL_MS);
  }

  /**
   * Poll OpenClaw directories for agent activity
   */
  private pollAgentActivities(): void {
    try {
      // Check for active sessions in workspaces
      const workspacesDir = join(this.openclawDir, 'workspaces');
      
      if (!this.directoryExists(workspacesDir)) {
        return;
      }

      const currentSessions = this.findActiveSessions(workspacesDir);
      
      // Detect new sessions (agent_started)
      for (const sessionId of currentSessions) {
        if (!this.lastKnownSessions.has(sessionId)) {
          this.broadcast({
            timestamp: new Date().toISOString(),
            agentId: this.extractAgentId(sessionId),
            eventType: 'agent_started',
            payload: {
              sessionId,
              workspace: this.extractWorkspace(sessionId)
            }
          });
        }
      }

      // Detect ended sessions (agent_ended)
      for (const sessionId of this.lastKnownSessions) {
        if (!currentSessions.has(sessionId)) {
          this.broadcast({
            timestamp: new Date().toISOString(),
            agentId: this.extractAgentId(sessionId),
            eventType: 'agent_ended',
            payload: {
              sessionId
            }
          });
        }
      }

      this.lastKnownSessions = currentSessions;

      // Poll for tool usage and model info from session logs
      this.pollSessionDetails(workspacesDir);

    } catch (error) {
      // Silently handle errors - directory might not exist yet
      console.error('Error polling agent activities:', error);
    }
  }

  /**
   * Find all active sessions by looking at workspace directories
   */
  private findActiveSessions(workspacesDir: string): Set<string> {
    const sessions = new Set<string>();
    
    try {
      const workflowTypes = readdirSync(workspacesDir);
      
      for (const workflowType of workflowTypes) {
        const workflowPath = join(workspacesDir, workflowType);
        if (!this.isDirectory(workflowPath)) continue;

        const runs = readdirSync(workflowPath);
        for (const runId of runs) {
          const runPath = join(workflowPath, runId);
          if (!this.isDirectory(runPath)) continue;

          // Check for agent directories
          const agents = readdirSync(runPath).filter(name => {
            const agentPath = join(runPath, name);
            return this.isDirectory(agentPath);
          });

          for (const agent of agents) {
            sessions.add(`${workflowType}/${runId}/${agent}`);
          }
        }
      }
    } catch {
      // Directory might not exist
    }

    return sessions;
  }

  /**
   * Poll session directories for detailed activity
   */
  private pollSessionDetails(workspacesDir: string): void {
    try {
      // Look for tool calls in session logs or progress files
      for (const sessionId of this.lastKnownSessions) {
        const parts = sessionId.split('/');
        if (parts.length < 3) continue;

        const [workflowType, runId, agentName] = parts;
        const agentDir = join(workspacesDir, workflowType, runId, agentName);
        
        // Check for progress.txt which might contain activity info
        const progressPath = join(agentDir, 'progress.txt');
        if (this.fileExists(progressPath)) {
          // In a real implementation, we'd parse this for tool calls
          // For now, simulate activity detection
          this.detectToolActivity(agentName, progressPath);
        }

        // Check for any log files
        const logPath = join(agentDir, 'agent.log');
        if (this.fileExists(logPath)) {
          this.detectLogActivity(agentName, logPath);
        }
      }
    } catch {
      // Silently handle errors
    }
  }

  /**
   * Detect tool activity from progress file
   */
  private detectToolActivity(_agentId: string, _progressPath: string): void {
    // Placeholder for tool activity detection
    // In a real implementation, parse the file for tool usage patterns
    // and emit tool_called events
  }

  /**
   * Detect activity from log files
   */
  private detectLogActivity(_agentId: string, _logPath: string): void {
    // Placeholder for log activity detection
    // Parse log files for model switches, token usage, etc.
  }

  /**
   * Helper: Check if directory exists
   */
  private directoryExists(path: string): boolean {
    try {
      return statSync(path).isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Helper: Check if path is a directory
   */
  private isDirectory(path: string): boolean {
    try {
      return statSync(path).isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Helper: Check if file exists
   */
  private fileExists(path: string): boolean {
    try {
      return statSync(path).isFile();
    } catch {
      return false;
    }
  }

  /**
   * Extract agent ID from session path
   */
  private extractAgentId(sessionId: string): string {
    const parts = sessionId.split('/');
    return parts[parts.length - 1] || 'unknown';
  }

  /**
   * Extract workspace from session path
   */
  private extractWorkspace(sessionId: string): string {
    const parts = sessionId.split('/');
    return parts.slice(0, -1).join('/') || 'unknown';
  }
}
