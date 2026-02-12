import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export interface AgentSession {
  sessionId: string;
  agentId: string;
  agentName: string;
  model: string;
  totalTokens: number;
  contextPct: number;
  lastActivity: string;
  updatedAt: number;
  type: string;
  label?: string;
  // Dashboard data.json uses 'agent' field
  agent?: string;
}

export interface AgentState {
  agentId: string;
  agentName: string;
  status: 'active' | 'idle' | 'ended';
  currentModel: string;
  totalTokens: number;
  contextPct: number;
  lastActivity: string;
  sessions: AgentSession[];
  toolsUsed: string[];
  skills: string[];
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  reasoning: boolean;
  contextWindow: number;
  maxTokens: number;
}

export interface TokenUsageDelta {
  agentId: string;
  previousTokens: number;
  currentTokens: number;
  delta: number;
  timestamp: string;
}

export interface ModelSwitchEvent {
  agentId: string;
  previousModel: string;
  currentModel: string;
  timestamp: string;
}

export interface AgentStateChange {
  agentId: string;
  previousState: 'active' | 'idle' | 'ended' | null;
  currentState: 'active' | 'idle' | 'ended';
  timestamp: string;
}

export interface ToolUsage {
  agentId: string;
  toolName: string;
  callCount: number;
  lastUsed: string;
}

export interface DataCollectorSnapshot {
  timestamp: string;
  agents: AgentState[];
  totalSessions: number;
  totalTokens: number;
}

export class DataCollector {
  private openclawDir: string;
  private agentsDir: string;
  private dashboardDataPath: string;
  private openclawConfigPath: string;
  
  // Previous state for delta calculations
  private previousAgentStates: Map<string, AgentState> = new Map();
  private previousSnapshot: DataCollectorSnapshot | null = null;

  constructor(openclawDir?: string) {
    this.openclawDir = openclawDir || join(homedir(), '.openclaw');
    this.agentsDir = join(this.openclawDir, 'agents');
    this.dashboardDataPath = join(this.openclawDir, 'dashboard', 'data.json');
    this.openclawConfigPath = join(this.openclawDir, 'openclaw.json');
  }

  /**
   * Read the dashboard data.json file
   */
  readDashboardData(): { sessions: AgentSession[]; crons: unknown[]; tokenUsage: unknown[] } | null {
    try {
      if (!existsSync(this.dashboardDataPath)) {
        return null;
      }
      const content = readFileSync(this.dashboardDataPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Read the openclaw.json configuration file
   */
  readOpenclawConfig(): { models?: { providers?: Record<string, { models?: ModelConfig[] }> } } | null {
    try {
      if (!existsSync(this.openclawConfigPath)) {
        return null;
      }
      const content = readFileSync(this.openclawConfigPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Get all agent directories
   */
  getAgentDirectories(): string[] {
    try {
      if (!existsSync(this.agentsDir)) {
        return [];
      }
      return readdirSync(this.agentsDir).filter(name => {
        const agentPath = join(this.agentsDir, name);
        return statSync(agentPath).isDirectory();
      });
    } catch {
      return [];
    }
  }

  /**
   * Read sessions data for a specific agent
   */
  readAgentSessions(agentName: string): Map<string, AgentSessionInfo> {
    const sessions = new Map<string, AgentSessionInfo>();
    const sessionsDir = join(this.agentsDir, agentName, 'sessions');
    
    try {
      if (!existsSync(sessionsDir)) {
        return sessions;
      }

      const sessionsFile = join(sessionsDir, 'sessions.json');
      if (!existsSync(sessionsFile)) {
        return sessions;
      }

      const content = readFileSync(sessionsFile, 'utf-8');
      const data = JSON.parse(content) as Record<string, SessionData>;

      for (const [key, sessionData] of Object.entries(data)) {
        sessions.set(key, {
          sessionId: sessionData.sessionId,
          updatedAt: sessionData.updatedAt,
          model: sessionData.model || 'unknown',
          totalTokens: sessionData.totalTokens || 0,
          label: sessionData.label,
          skills: sessionData.skillsSnapshot?.skills?.map((s: { name: string }) => s.name) || [],
          inputTokens: sessionData.inputTokens || 0,
          outputTokens: sessionData.outputTokens || 0
        });
      }
    } catch {
      // Return empty map on error
    }

    return sessions;
  }

  /**
   * Parse a session file (JSONL) to extract tool usage
   */
  parseSessionFile(sessionPath: string): { tools: string[]; events: SessionEvent[] } {
    const tools = new Set<string>();
    const events: SessionEvent[] = [];

    try {
      if (!existsSync(sessionPath)) {
        return { tools: [], events: [] };
      }

      const content = readFileSync(sessionPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const event = JSON.parse(line) as SessionEvent;
          events.push(event);

          // Extract tool calls from tool_result or toolCall events
          if (event.type === 'tool_result' || event.type === 'toolCall') {
            const toolName = event.toolName || event.tool || event.name;
            if (toolName) {
              tools.add(toolName);
            }
          }

          // Also check message content for tool calls
          if (event.message?.tool_calls) {
            for (const toolCall of event.message.tool_calls) {
              if (toolCall.name || toolCall.function?.name) {
                tools.add(toolCall.name || toolCall.function?.name as string);
              }
            }
          }
        } catch {
          // Skip invalid lines
        }
      }
    } catch {
      // Return empty results on error
    }

    return { tools: Array.from(tools), events };
  }

  /**
   * Collect current state of all agents
   */
  collectAgentStates(): AgentState[] {
    const dashboardData = this.readDashboardData();
    const agentDirs = this.getAgentDirectories();
    const states: AgentState[] = [];

    // Group dashboard sessions by agent
    const sessionsByAgent = new Map<string, AgentSession[]>();
    if (dashboardData?.sessions) {
      for (const session of dashboardData.sessions) {
        const agentName = session.agent || session.agentName || 'unknown';
        const agentSessions = sessionsByAgent.get(agentName) || [];
        agentSessions.push(session);
        sessionsByAgent.set(agentName, agentSessions);
      }
    }

    // Process each agent directory
    for (const agentName of agentDirs) {
      const agentSessions = this.readAgentSessions(agentName);
      const dashboardSessions = sessionsByAgent.get(agentName) || [];

      // Get the most recent session info
      let mostRecentSession: AgentSessionInfo | null = null;
      let mostRecentTime = 0;

      for (const [, sessionInfo] of agentSessions) {
        if (sessionInfo.updatedAt > mostRecentTime) {
          mostRecentTime = sessionInfo.updatedAt;
          mostRecentSession = sessionInfo;
        }
      }

      // Get the most recent dashboard session
      let mostRecentDashboardSession: AgentSession | null = null;
      for (const session of dashboardSessions) {
        if (session.updatedAt > (mostRecentDashboardSession?.updatedAt || 0)) {
          mostRecentDashboardSession = session;
        }
      }

      // Combine data from both sources
      const currentModel = mostRecentDashboardSession?.model 
        || mostRecentSession?.model 
        || 'unknown';
      
      const totalTokens = mostRecentDashboardSession?.totalTokens 
        || mostRecentSession?.totalTokens 
        || 0;

      const contextPct = mostRecentDashboardSession?.contextPct 
        || 0;

      const lastActivity = mostRecentDashboardSession?.lastActivity 
        || new Date(mostRecentTime).toISOString();

      // Determine status based on recent activity
      const status = this.determineAgentStatus(
        agentName, 
        mostRecentTime, 
        dashboardSessions.length > 0
      );

      // Collect tools from session files
      const toolsUsed = new Set<string>();
      const sessionsDir = join(this.agentsDir, agentName, 'sessions');
      
      try {
        if (existsSync(sessionsDir)) {
          const sessionFiles = readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));
          for (const file of sessionFiles) {
            const { tools } = this.parseSessionFile(join(sessionsDir, file));
            for (const tool of tools) {
              toolsUsed.add(tool);
            }
          }
        }
      } catch {
        // Ignore errors reading session files
      }

      // Get skills from most recent session
      const skills = mostRecentSession?.skills || [];

      states.push({
        agentId: `agent:${agentName}`,
        agentName,
        status,
        currentModel,
        totalTokens,
        contextPct,
        lastActivity,
        sessions: dashboardSessions,
        toolsUsed: Array.from(toolsUsed),
        skills
      });
    }

    return states;
  }

  /**
   * Determine agent status based on activity
   */
  private determineAgentStatus(
    _agentName: string, 
    lastUpdateTime: number, 
    hasActiveSessions: boolean
  ): 'active' | 'idle' | 'ended' {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    if (hasActiveSessions && lastUpdateTime > fiveMinutesAgo) {
      return 'active';
    } else if (lastUpdateTime > oneHourAgo) {
      return 'idle';
    } else {
      return 'ended';
    }
  }

  /**
   * Detect state changes between current and previous snapshot
   */
  detectStateChanges(currentStates: AgentState[]): AgentStateChange[] {
    const changes: AgentStateChange[] = [];
    const now = new Date().toISOString();

    // Check for new or updated agents
    for (const currentState of currentStates) {
      const previousState = this.previousAgentStates.get(currentState.agentId);
      
      if (!previousState) {
        // New agent detected
        changes.push({
          agentId: currentState.agentId,
          previousState: null,
          currentState: currentState.status,
          timestamp: now
        });
      } else if (previousState.status !== currentState.status) {
        // State change detected
        changes.push({
          agentId: currentState.agentId,
          previousState: previousState.status,
          currentState: currentState.status,
          timestamp: now
        });
      }
    }

    // Check for ended agents (agents that existed before but not now)
    const currentAgentIds = new Set(currentStates.map(s => s.agentId));
    for (const [agentId, previousState] of this.previousAgentStates) {
      if (!currentAgentIds.has(agentId) && previousState.status !== 'ended') {
        changes.push({
          agentId,
          previousState: previousState.status,
          currentState: 'ended',
          timestamp: now
        });
      }
    }

    return changes;
  }

  /**
   * Calculate token usage deltas between current and previous snapshot
   */
  calculateTokenDeltas(currentStates: AgentState[]): TokenUsageDelta[] {
    const deltas: TokenUsageDelta[] = [];
    const now = new Date().toISOString();

    for (const currentState of currentStates) {
      const previousState = this.previousAgentStates.get(currentState.agentId);
      
      if (previousState) {
        const delta = currentState.totalTokens - previousState.totalTokens;
        if (delta !== 0) {
          deltas.push({
            agentId: currentState.agentId,
            previousTokens: previousState.totalTokens,
            currentTokens: currentState.totalTokens,
            delta,
            timestamp: now
          });
        }
      }
    }

    return deltas;
  }

  /**
   * Detect model switches between current and previous snapshot
   */
  detectModelSwitches(currentStates: AgentState[]): ModelSwitchEvent[] {
    const switches: ModelSwitchEvent[] = [];
    const now = new Date().toISOString();

    for (const currentState of currentStates) {
      const previousState = this.previousAgentStates.get(currentState.agentId);
      
      if (previousState && previousState.currentModel !== currentState.currentModel) {
        switches.push({
          agentId: currentState.agentId,
          previousModel: previousState.currentModel,
          currentModel: currentState.currentModel,
          timestamp: now
        });
      }
    }

    return switches;
  }

  /**
   * Get tool usage statistics for all agents
   */
  getToolUsage(currentStates: AgentState[]): ToolUsage[] {
    const usage: ToolUsage[] = [];
    const now = new Date().toISOString();

    for (const state of currentStates) {
      for (const toolName of state.toolsUsed) {
        usage.push({
          agentId: state.agentId,
          toolName,
          callCount: 1, // Simplified - would need to count from session files
          lastUsed: now
        });
      }
    }

    return usage;
  }

  /**
   * Take a snapshot of the current state
   */
  takeSnapshot(): DataCollectorSnapshot {
    const agents = this.collectAgentStates();
    const snapshot: DataCollectorSnapshot = {
      timestamp: new Date().toISOString(),
      agents,
      totalSessions: agents.reduce((sum, a) => sum + a.sessions.length, 0),
      totalTokens: agents.reduce((sum, a) => sum + a.totalTokens, 0)
    };

    // Update previous state for next comparison
    this.previousAgentStates.clear();
    for (const agent of agents) {
      this.previousAgentStates.set(agent.agentId, { ...agent });
    }
    this.previousSnapshot = snapshot;

    return snapshot;
  }

  /**
   * Get the previous snapshot
   */
  getPreviousSnapshot(): DataCollectorSnapshot | null {
    return this.previousSnapshot;
  }

  /**
   * Clear all cached state
   */
  clearCache(): void {
    this.previousAgentStates.clear();
    this.previousSnapshot = null;
  }
}

// Type definitions for internal use
interface SessionData {
  sessionId: string;
  updatedAt: number;
  model?: string;
  totalTokens?: number;
  label?: string;
  skillsSnapshot?: {
    skills?: { name: string }[];
  };
  inputTokens?: number;
  outputTokens?: number;
}

interface AgentSessionInfo {
  sessionId: string;
  updatedAt: number;
  model: string;
  totalTokens: number;
  label?: string;
  skills: string[];
  inputTokens: number;
  outputTokens: number;
}

interface SessionEvent {
  type: string;
  toolName?: string;
  tool?: string;
  name?: string;
  message?: {
    tool_calls?: Array<{
      name?: string;
      function?: { name?: string };
    }>;
  };
  timestamp?: string;
}
