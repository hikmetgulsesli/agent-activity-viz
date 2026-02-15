import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DataCollector, type AgentState } from '../server/DataCollector.js';

describe('DataCollector', () => {
  let testDir: string;
  let collector: DataCollector;

  beforeEach(() => {
    // Create a temporary directory for testing
    testDir = join(tmpdir(), `data-collector-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    mkdirSync(join(testDir, 'agents'), { recursive: true });
    mkdirSync(join(testDir, 'dashboard'), { recursive: true });
    
    collector = new DataCollector(testDir);
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Directory reading', () => {
    it('should read agent directories', () => {
      // Create test agent directories
      mkdirSync(join(testDir, 'agents', 'agent1'), { recursive: true });
      mkdirSync(join(testDir, 'agents', 'agent2'), { recursive: true });
      mkdirSync(join(testDir, 'agents', 'agent3'), { recursive: true });

      const dirs = collector.getAgentDirectories();
      
      assert.strictEqual(dirs.length, 3);
      assert.ok(dirs.includes('agent1'));
      assert.ok(dirs.includes('agent2'));
      assert.ok(dirs.includes('agent3'));
    });

    it('should return empty array when agents directory does not exist', () => {
      const nonExistentDir = join(tmpdir(), `non-existent-${Date.now()}`);
      const c = new DataCollector(nonExistentDir);
      
      const dirs = c.getAgentDirectories();
      
      assert.strictEqual(dirs.length, 0);
    });

    it('should return empty array when agents directory is empty', () => {
      const dirs = collector.getAgentDirectories();
      
      assert.strictEqual(dirs.length, 0);
    });
  });

  describe('Dashboard data reading', () => {
    it('should read dashboard data.json', () => {
      const dashboardData = {
        sessions: [
          {
            name: 'test-session',
            key: 'agent:test:session1',
            agent: 'test-agent',
            model: 'k2p5',
            contextPct: 10.5,
            lastActivity: '12:00:00',
            updatedAt: Date.now(),
            totalTokens: 1000,
            type: 'cron'
          }
        ],
        crons: [],
        tokenUsage: []
      };

      writeFileSync(
        join(testDir, 'dashboard', 'data.json'),
        JSON.stringify(dashboardData)
      );

      const data = collector.readDashboardData();
      
      assert.ok(data);
      assert.strictEqual(data?.sessions.length, 1);
      assert.strictEqual(data?.sessions[0].agent, 'test-agent');
    });

    it('should return null when dashboard data.json does not exist', () => {
      const data = collector.readDashboardData();
      
      assert.strictEqual(data, null);
    });

    it('should return null when dashboard data.json is invalid', () => {
      writeFileSync(
        join(testDir, 'dashboard', 'data.json'),
        'invalid json'
      );

      const data = collector.readDashboardData();
      
      assert.strictEqual(data, null);
    });
  });

  describe('Openclaw config reading', () => {
    it('should read openclaw.json', () => {
      const config = {
        models: {
          providers: {
            test: {
              models: [
                { id: 'model1', name: 'Model 1', provider: 'test', reasoning: false, contextWindow: 1000, maxTokens: 100 }
              ]
            }
          }
        }
      };

      writeFileSync(
        join(testDir, 'openclaw.json'),
        JSON.stringify(config)
      );

      const data = collector.readOpenclawConfig();
      
      assert.ok(data);
      assert.ok(data?.models?.providers?.test);
    });

    it('should return null when openclaw.json does not exist', () => {
      const data = collector.readOpenclawConfig();
      
      assert.strictEqual(data, null);
    });
  });

  describe('Agent sessions reading', () => {
    it('should read agent sessions from sessions.json', () => {
      const agentDir = join(testDir, 'agents', 'test-agent');
      const sessionsDir = join(agentDir, 'sessions');
      mkdirSync(sessionsDir, { recursive: true });

      const sessionsData = {
        'session1': {
          sessionId: 'sess-1',
          updatedAt: Date.now(),
          model: 'k2p5',
          totalTokens: 5000,
          label: 'Test Session',
          skillsSnapshot: {
            skills: [{ name: 'skill1' }, { name: 'skill2' }]
          },
          inputTokens: 4000,
          outputTokens: 1000
        }
      };

      writeFileSync(
        join(sessionsDir, 'sessions.json'),
        JSON.stringify(sessionsData)
      );

      const sessions = collector.readAgentSessions('test-agent');
      
      assert.strictEqual(sessions.size, 1);
      assert.ok(sessions.has('session1'));
      
      const session = sessions.get('session1');
      assert.strictEqual(session?.model, 'k2p5');
      assert.strictEqual(session?.totalTokens, 5000);
      assert.deepStrictEqual(session?.skills, ['skill1', 'skill2']);
    });

    it('should return empty map when sessions.json does not exist', () => {
      const agentDir = join(testDir, 'agents', 'test-agent');
      mkdirSync(agentDir, { recursive: true });

      const sessions = collector.readAgentSessions('test-agent');
      
      assert.strictEqual(sessions.size, 0);
    });

    it('should handle sessions without skillsSnapshot', () => {
      const agentDir = join(testDir, 'agents', 'test-agent');
      const sessionsDir = join(agentDir, 'sessions');
      mkdirSync(sessionsDir, { recursive: true });

      const sessionsData = {
        'session1': {
          sessionId: 'sess-1',
          updatedAt: Date.now(),
          model: 'k2p5',
          totalTokens: 5000
        }
      };

      writeFileSync(
        join(sessionsDir, 'sessions.json'),
        JSON.stringify(sessionsData)
      );

      const sessions = collector.readAgentSessions('test-agent');
      
      assert.strictEqual(sessions.size, 1);
      const session = sessions.get('session1');
      assert.deepStrictEqual(session?.skills, []);
    });
  });

  describe('Session file parsing', () => {
    it('should parse session JSONL files for tool usage', () => {
      const agentDir = join(testDir, 'agents', 'test-agent');
      const sessionsDir = join(agentDir, 'sessions');
      mkdirSync(sessionsDir, { recursive: true });

      const sessionContent = [
        JSON.stringify({ type: 'session', id: 'sess-1' }),
        JSON.stringify({ type: 'tool_result', toolName: 'read', timestamp: Date.now() }),
        JSON.stringify({ type: 'tool_result', tool: 'write', timestamp: Date.now() }),
        JSON.stringify({ type: 'message', message: { role: 'user' } })
      ].join('\n');

      writeFileSync(
        join(sessionsDir, 'session-1.jsonl'),
        sessionContent
      );

      const { tools, events } = collector.parseSessionFile(join(sessionsDir, 'session-1.jsonl'));
      
      assert.strictEqual(tools.length, 2);
      assert.ok(tools.includes('read'));
      assert.ok(tools.includes('write'));
      assert.strictEqual(events.length, 4);
    });

    it('should extract tool calls from message.tool_calls', () => {
      const agentDir = join(testDir, 'agents', 'test-agent');
      const sessionsDir = join(agentDir, 'sessions');
      mkdirSync(sessionsDir, { recursive: true });

      const sessionContent = JSON.stringify({
        type: 'message',
        message: {
          role: 'assistant',
          tool_calls: [
            { name: 'exec' },
            { function: { name: 'read' } }
          ]
        }
      });

      writeFileSync(
        join(sessionsDir, 'session-1.jsonl'),
        sessionContent
      );

      const { tools } = collector.parseSessionFile(join(sessionsDir, 'session-1.jsonl'));
      
      assert.ok(tools.includes('exec'));
      assert.ok(tools.includes('read'));
    });

    it('should return empty results for non-existent file', () => {
      const { tools, events } = collector.parseSessionFile(join(testDir, 'non-existent.jsonl'));
      
      assert.strictEqual(tools.length, 0);
      assert.strictEqual(events.length, 0);
    });

    it('should skip invalid JSON lines', () => {
      const agentDir = join(testDir, 'agents', 'test-agent');
      const sessionsDir = join(agentDir, 'sessions');
      mkdirSync(sessionsDir, { recursive: true });

      const sessionContent = [
        JSON.stringify({ type: 'tool_result', toolName: 'read' }),
        'invalid json line',
        JSON.stringify({ type: 'tool_result', toolName: 'write' })
      ].join('\n');

      writeFileSync(
        join(sessionsDir, 'session-1.jsonl'),
        sessionContent
      );

      const { tools, events } = collector.parseSessionFile(join(sessionsDir, 'session-1.jsonl'));
      
      assert.strictEqual(tools.length, 2);
      assert.strictEqual(events.length, 2);
    });
  });

  describe('Agent state collection', () => {
    it('should collect agent states from dashboard data', () => {
      // Create dashboard data
      const dashboardData = {
        sessions: [
          {
            name: 'session1',
            key: 'agent:test-agent:session1',
            agent: 'test-agent',
            model: 'k2p5',
            contextPct: 15.5,
            lastActivity: '12:00:00',
            updatedAt: Date.now(),
            totalTokens: 10000,
            type: 'cron'
          }
        ],
        crons: [],
        tokenUsage: []
      };

      writeFileSync(
        join(testDir, 'dashboard', 'data.json'),
        JSON.stringify(dashboardData)
      );

      // Create agent directory
      const agentDir = join(testDir, 'agents', 'test-agent');
      mkdirSync(agentDir, { recursive: true });

      const states = collector.collectAgentStates();
      
      assert.strictEqual(states.length, 1);
      assert.strictEqual(states[0].agentName, 'test-agent');
      assert.strictEqual(states[0].currentModel, 'k2p5');
      assert.strictEqual(states[0].totalTokens, 10000);
    });

    it('should combine dashboard and agent session data', () => {
      const now = Date.now();

      // Create dashboard data
      const dashboardData = {
        sessions: [
          {
            name: 'session1',
            key: 'agent:test-agent:session1',
            agent: 'test-agent',
            model: 'k2p5',
            contextPct: 15.5,
            lastActivity: '12:00:00',
            updatedAt: now,
            totalTokens: 10000,
            type: 'cron'
          }
        ],
        crons: [],
        tokenUsage: []
      };

      writeFileSync(
        join(testDir, 'dashboard', 'data.json'),
        JSON.stringify(dashboardData)
      );

      // Create agent sessions data
      const agentDir = join(testDir, 'agents', 'test-agent');
      const sessionsDir = join(agentDir, 'sessions');
      mkdirSync(sessionsDir, { recursive: true });

      const sessionsData = {
        'session1': {
          sessionId: 'sess-1',
          updatedAt: now,
          model: 'k2p5',
          totalTokens: 10000,
          skillsSnapshot: {
            skills: [{ name: 'github' }, { name: 'gemini' }]
          }
        }
      };

      writeFileSync(
        join(sessionsDir, 'sessions.json'),
        JSON.stringify(sessionsData)
      );

      const states = collector.collectAgentStates();
      
      assert.strictEqual(states.length, 1);
      assert.deepStrictEqual(states[0].skills, ['github', 'gemini']);
    });
  });

  describe('State change detection', () => {
    it('should detect new agents', () => {
      const currentStates: AgentState[] = [
        {
          agentId: 'agent:new-agent',
          agentName: 'new-agent',
          status: 'active',
          currentModel: 'k2p5',
          totalTokens: 1000,
          contextPct: 10,
          lastActivity: new Date().toISOString(),
          sessions: [],
          toolsUsed: [],
          skills: []
        }
      ];

      // Take initial snapshot to set previous state
      collector.takeSnapshot();
      
      // Now detect changes with new agent
      const changes = collector.detectStateChanges(currentStates);
      
      assert.strictEqual(changes.length, 1);
      assert.strictEqual(changes[0].agentId, 'agent:new-agent');
      assert.strictEqual(changes[0].previousState, null);
      assert.strictEqual(changes[0].currentState, 'active');
    });

    it('should detect status changes', () => {
      // First snapshot
      collector.takeSnapshot();
      
      // Simulate state change
      const currentStates: AgentState[] = [
        {
          agentId: 'agent:test-agent',
          agentName: 'test-agent',
          status: 'idle',  // Changed from active
          currentModel: 'k2p5',
          totalTokens: 2000,
          contextPct: 10,
          lastActivity: new Date().toISOString(),
          sessions: [],
          toolsUsed: [],
          skills: []
        }
      ];

      // Manually set previous state
      (collector as unknown as { previousAgentStates: Map<string, AgentState> }).previousAgentStates.set(
        'agent:test-agent',
        {
          agentId: 'agent:test-agent',
          agentName: 'test-agent',
          status: 'active',
          currentModel: 'k2p5',
          totalTokens: 1000,
          contextPct: 10,
          lastActivity: new Date().toISOString(),
          sessions: [],
          toolsUsed: [],
          skills: []
        }
      );

      const changes = collector.detectStateChanges(currentStates);
      
      assert.strictEqual(changes.length, 1);
      assert.strictEqual(changes[0].previousState, 'active');
      assert.strictEqual(changes[0].currentState, 'idle');
    });

    it('should detect ended agents', () => {
      // Set previous state with an agent
      (collector as unknown as { previousAgentStates: Map<string, AgentState> }).previousAgentStates.set(
        'agent:gone-agent',
        {
          agentId: 'agent:gone-agent',
          agentName: 'gone-agent',
          status: 'active',
          currentModel: 'k2p5',
          totalTokens: 1000,
          contextPct: 10,
          lastActivity: new Date().toISOString(),
          sessions: [],
          toolsUsed: [],
          skills: []
        }
      );

      // Current states is empty (agent gone)
      const changes = collector.detectStateChanges([]);
      
      assert.strictEqual(changes.length, 1);
      assert.strictEqual(changes[0].agentId, 'agent:gone-agent');
      assert.strictEqual(changes[0].currentState, 'ended');
    });
  });

  describe('Token usage delta calculation', () => {
    it('should calculate token deltas between snapshots', () => {
      // Set previous state
      (collector as unknown as { previousAgentStates: Map<string, AgentState> }).previousAgentStates.set(
        'agent:test-agent',
        {
          agentId: 'agent:test-agent',
          agentName: 'test-agent',
          status: 'active',
          currentModel: 'k2p5',
          totalTokens: 1000,
          contextPct: 10,
          lastActivity: new Date().toISOString(),
          sessions: [],
          toolsUsed: [],
          skills: []
        }
      );

      const currentStates: AgentState[] = [
        {
          agentId: 'agent:test-agent',
          agentName: 'test-agent',
          status: 'active',
          currentModel: 'k2p5',
          totalTokens: 1500,  // Increased by 500
          contextPct: 10,
          lastActivity: new Date().toISOString(),
          sessions: [],
          toolsUsed: [],
          skills: []
        }
      ];

      const deltas = collector.calculateTokenDeltas(currentStates);
      
      assert.strictEqual(deltas.length, 1);
      assert.strictEqual(deltas[0].delta, 500);
      assert.strictEqual(deltas[0].previousTokens, 1000);
      assert.strictEqual(deltas[0].currentTokens, 1500);
    });

    it('should not report delta when tokens unchanged', () => {
      // Set previous state
      (collector as unknown as { previousAgentStates: Map<string, AgentState> }).previousAgentStates.set(
        'agent:test-agent',
        {
          agentId: 'agent:test-agent',
          agentName: 'test-agent',
          status: 'active',
          currentModel: 'k2p5',
          totalTokens: 1000,
          contextPct: 10,
          lastActivity: new Date().toISOString(),
          sessions: [],
          toolsUsed: [],
          skills: []
        }
      );

      const currentStates: AgentState[] = [
        {
          agentId: 'agent:test-agent',
          agentName: 'test-agent',
          status: 'active',
          currentModel: 'k2p5',
          totalTokens: 1000,  // Unchanged
          contextPct: 10,
          lastActivity: new Date().toISOString(),
          sessions: [],
          toolsUsed: [],
          skills: []
        }
      ];

      const deltas = collector.calculateTokenDeltas(currentStates);
      
      assert.strictEqual(deltas.length, 0);
    });

    it('should not report delta for new agents (no previous state)', () => {
      const currentStates: AgentState[] = [
        {
          agentId: 'agent:new-agent',
          agentName: 'new-agent',
          status: 'active',
          currentModel: 'k2p5',
          totalTokens: 1000,
          contextPct: 10,
          lastActivity: new Date().toISOString(),
          sessions: [],
          toolsUsed: [],
          skills: []
        }
      ];

      const deltas = collector.calculateTokenDeltas(currentStates);
      
      assert.strictEqual(deltas.length, 0);
    });
  });

  describe('Model switch detection', () => {
    it('should detect model switches', () => {
      // Set previous state with old model
      (collector as unknown as { previousAgentStates: Map<string, AgentState> }).previousAgentStates.set(
        'agent:test-agent',
        {
          agentId: 'agent:test-agent',
          agentName: 'test-agent',
          status: 'active',
          currentModel: 'k2p5',
          totalTokens: 1000,
          contextPct: 10,
          lastActivity: new Date().toISOString(),
          sessions: [],
          toolsUsed: [],
          skills: []
        }
      );

      const currentStates: AgentState[] = [
        {
          agentId: 'agent:test-agent',
          agentName: 'test-agent',
          status: 'active',
          currentModel: 'claude-sonnet',  // Changed model
          totalTokens: 1500,
          contextPct: 10,
          lastActivity: new Date().toISOString(),
          sessions: [],
          toolsUsed: [],
          skills: []
        }
      ];

      const switches = collector.detectModelSwitches(currentStates);
      
      assert.strictEqual(switches.length, 1);
      assert.strictEqual(switches[0].previousModel, 'k2p5');
      assert.strictEqual(switches[0].currentModel, 'claude-sonnet');
    });

    it('should not detect switch when model unchanged', () => {
      // Set previous state
      (collector as unknown as { previousAgentStates: Map<string, AgentState> }).previousAgentStates.set(
        'agent:test-agent',
        {
          agentId: 'agent:test-agent',
          agentName: 'test-agent',
          status: 'active',
          currentModel: 'k2p5',
          totalTokens: 1000,
          contextPct: 10,
          lastActivity: new Date().toISOString(),
          sessions: [],
          toolsUsed: [],
          skills: []
        }
      );

      const currentStates: AgentState[] = [
        {
          agentId: 'agent:test-agent',
          agentName: 'test-agent',
          status: 'active',
          currentModel: 'k2p5',  // Same model
          totalTokens: 1500,
          contextPct: 10,
          lastActivity: new Date().toISOString(),
          sessions: [],
          toolsUsed: [],
          skills: []
        }
      ];

      const switches = collector.detectModelSwitches(currentStates);
      
      assert.strictEqual(switches.length, 0);
    });
  });

  describe('Snapshot functionality', () => {
    it('should take a snapshot of current state', () => {
      // Create dashboard data
      const dashboardData = {
        sessions: [
          {
            name: 'session1',
            key: 'agent:test-agent:session1',
            agent: 'test-agent',
            model: 'k2p5',
            contextPct: 15.5,
            lastActivity: '12:00:00',
            updatedAt: Date.now(),
            totalTokens: 10000,
            type: 'cron'
          }
        ],
        crons: [],
        tokenUsage: []
      };

      writeFileSync(
        join(testDir, 'dashboard', 'data.json'),
        JSON.stringify(dashboardData)
      );

      // Create agent directory
      const agentDir = join(testDir, 'agents', 'test-agent');
      mkdirSync(agentDir, { recursive: true });

      const snapshot = collector.takeSnapshot();
      
      assert.ok(snapshot.timestamp);
      assert.strictEqual(snapshot.agents.length, 1);
      assert.strictEqual(snapshot.totalSessions, 1);
      assert.strictEqual(snapshot.totalTokens, 10000);
    });

    it('should store previous snapshot', () => {
      // Create dashboard data
      const dashboardData = {
        sessions: [],
        crons: [],
        tokenUsage: []
      };

      writeFileSync(
        join(testDir, 'dashboard', 'data.json'),
        JSON.stringify(dashboardData)
      );

      const snapshot1 = collector.takeSnapshot();
      const snapshot2 = collector.getPreviousSnapshot();
      
      assert.strictEqual(snapshot1, snapshot2);
    });

    it('should clear cache when requested', () => {
      collector.takeSnapshot();
      
      assert.ok(collector.getPreviousSnapshot());
      
      collector.clearCache();
      
      assert.strictEqual(collector.getPreviousSnapshot(), null);
    });
  });

  describe('Tool usage tracking', () => {
    it('should track tool usage from agent states', () => {
      const currentStates: AgentState[] = [
        {
          agentId: 'agent:test-agent',
          agentName: 'test-agent',
          status: 'active',
          currentModel: 'k2p5',
          totalTokens: 1000,
          contextPct: 10,
          lastActivity: new Date().toISOString(),
          sessions: [],
          toolsUsed: ['read', 'write', 'exec'],
          skills: []
        }
      ];

      const usage = collector.getToolUsage(currentStates);
      
      assert.strictEqual(usage.length, 3);
      assert.ok(usage.some(u => u.toolName === 'read'));
      assert.ok(usage.some(u => u.toolName === 'write'));
      assert.ok(usage.some(u => u.toolName === 'exec'));
    });
  });
});
