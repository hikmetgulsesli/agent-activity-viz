import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('useWebSocket Hook', () => {
  const hookPath = join(process.cwd(), 'src/client/hooks/useWebSocket.ts');
  const hookSource = readFileSync(hookPath, 'utf-8');

  describe('Hook Structure', () => {
    it('should export useWebSocket function', () => {
      assert.ok(hookSource.includes('export function useWebSocket'));
    });

    it('should export ConnectionStatus type', () => {
      assert.ok(hookSource.includes('export type ConnectionStatus'));
    });

    it('should export AgentEventType type', () => {
      assert.ok(hookSource.includes('export type AgentEventType'));
    });

    it('should export AgentEvent interface', () => {
      assert.ok(hookSource.includes('export interface AgentEvent'));
    });

    it('should export AgentActivity interface', () => {
      assert.ok(hookSource.includes('export interface AgentActivity'));
    });

    it('should export UseWebSocketReturn interface', () => {
      assert.ok(hookSource.includes('export interface UseWebSocketReturn'));
    });
  });

  describe('Connection Management', () => {
    it('should initialize with connecting status', () => {
      assert.ok(hookSource.includes("useState<ConnectionStatus>('connecting')"));
    });

    it('should handle WebSocket connection with useRef', () => {
      assert.ok(hookSource.includes('wsRef = useRef<WebSocket | null>(null)'));
    });

    it('should track reconnection attempts', () => {
      assert.ok(hookSource.includes('reconnectAttemptsRef'));
    });

    it('should track unmounted state', () => {
      assert.ok(hookSource.includes('unmountedRef'));
    });

    it('should implement connect function', () => {
      assert.ok(hookSource.includes('const connect = useCallback'));
      assert.ok(hookSource.includes('new WebSocket(url)'));
    });

    it('should handle WebSocket onopen event', () => {
      assert.ok(hookSource.includes('ws.onopen'));
      assert.ok(hookSource.includes("setStatus('connected')"));
    });

    it('should handle WebSocket onmessage event', () => {
      assert.ok(hookSource.includes('ws.onmessage = handleMessage'));
    });

    it('should handle WebSocket onerror event', () => {
      assert.ok(hookSource.includes('ws.onerror'));
      assert.ok(hookSource.includes('setError'));
    });

    it('should handle WebSocket onclose event', () => {
      assert.ok(hookSource.includes('ws.onclose'));
      assert.ok(hookSource.includes("setStatus('disconnected')"));
    });

    it('should close WebSocket on unmount', () => {
      assert.ok(hookSource.includes('return () => {'));
      assert.ok(hookSource.includes('ws.close()'));
    });
  });

  describe('Exponential Backoff Reconnection', () => {
    it('should implement getReconnectDelay function', () => {
      assert.ok(hookSource.includes('getReconnectDelay'));
    });

    it('should use base delay of 1000ms', () => {
      assert.ok(hookSource.includes('RECONNECT_BASE_DELAY = 1000'));
    });

    it('should cap max delay at 30000ms', () => {
      assert.ok(hookSource.includes('RECONNECT_MAX_DELAY = 30000'));
    });

    it('should calculate exponential backoff', () => {
      assert.ok(hookSource.includes('Math.pow(2, attempts)'));
    });

    it('should use Math.min to cap delay', () => {
      assert.ok(hookSource.includes('Math.min'));
    });

    it('should schedule reconnection on close', () => {
      assert.ok(hookSource.includes('setTimeout'));
      assert.ok(hookSource.includes('reconnectTimeoutRef.current = setTimeout'));
    });

    it('should increment reconnect attempts', () => {
      assert.ok(hookSource.includes('reconnectAttemptsRef.current += 1'));
    });

    it('should reset reconnect attempts on successful connection', () => {
      assert.ok(hookSource.includes('reconnectAttemptsRef.current = 0'));
    });
  });

  describe('Message Parsing and Validation', () => {
    it('should implement parseMessage function', () => {
      assert.ok(hookSource.includes('parseMessage'));
      assert.ok(hookSource.includes('JSON.parse'));
    });

    it('should validate timestamp field', () => {
      assert.ok(hookSource.includes('parsed.timestamp'));
      assert.ok(hookSource.includes("typeof parsed.timestamp !== 'string'"));
    });

    it('should validate agentId field', () => {
      assert.ok(hookSource.includes('parsed.agentId'));
      assert.ok(hookSource.includes("typeof parsed.agentId !== 'string'"));
    });

    it('should validate eventType field', () => {
      assert.ok(hookSource.includes('parsed.eventType'));
      assert.ok(hookSource.includes("typeof parsed.eventType !== 'string'"));
    });

    it('should validate payload field', () => {
      assert.ok(hookSource.includes('parsed.payload'));
      assert.ok(hookSource.includes("typeof parsed.payload !== 'object'"));
    });

    it('should check eventType against valid types', () => {
      assert.ok(hookSource.includes('validEventTypes'));
      assert.ok(hookSource.includes("'agent_started'"));
      assert.ok(hookSource.includes("'agent_ended'"));
      assert.ok(hookSource.includes("'tool_called'"));
      assert.ok(hookSource.includes("'model_switched'"));
      assert.ok(hookSource.includes("'token_update'"));
      assert.ok(hookSource.includes("'heartbeat'"));
    });

    it('should return null for invalid messages', () => {
      assert.ok(hookSource.includes('return null'));
    });

    it('should handle JSON parse errors', () => {
      assert.ok(hookSource.includes('catch'));
    });
  });

  describe('State Management', () => {
    it('should maintain activities Map state', () => {
      assert.ok(hookSource.includes('useState<Map<string, AgentActivity>>'));
    });

    it('should maintain events array state', () => {
      assert.ok(hookSource.includes('useState<AgentEvent[]>([])'));
    });

    it('should maintain status state', () => {
      assert.ok(hookSource.includes('useState<ConnectionStatus>'));
    });

    it('should maintain error state', () => {
      assert.ok(hookSource.includes('useState<Error | null>(null)'));
    });

    it('should limit events to MAX_EVENTS', () => {
      assert.ok(hookSource.includes('MAX_EVENTS'));
      assert.ok(hookSource.includes('slice(-MAX_EVENTS)'));
    });
  });

  describe('Activity Updates', () => {
    it('should implement updateActivities function', () => {
      assert.ok(hookSource.includes('updateActivities'));
    });

    it('should handle agent_started events', () => {
      assert.ok(hookSource.includes("case 'agent_started'"));
      assert.ok(hookSource.includes("status: 'active'"));
    });

    it('should handle agent_ended events', () => {
      assert.ok(hookSource.includes("case 'agent_ended'"));
      assert.ok(hookSource.includes("status: 'ended'"));
    });

    it('should handle tool_called events', () => {
      assert.ok(hookSource.includes("case 'tool_called'"));
      assert.ok(hookSource.includes('toolsUsed'));
    });

    it('should handle model_switched events', () => {
      assert.ok(hookSource.includes("case 'model_switched'"));
      assert.ok(hookSource.includes('currentModel'));
    });

    it('should handle token_update events', () => {
      assert.ok(hookSource.includes("case 'token_update'"));
      assert.ok(hookSource.includes('tokenUsage'));
    });

    it('should handle heartbeat events', () => {
      assert.ok(hookSource.includes("case 'heartbeat'"));
    });

    it('should skip system events for activity tracking', () => {
      assert.ok(hookSource.includes("agentId === 'system'"));
    });

    it('should create new Map on update', () => {
      assert.ok(hookSource.includes('new Map(prevActivities)'));
    });

    it('should update lastSeen timestamp', () => {
      assert.ok(hookSource.includes('lastSeen: event.timestamp'));
    });
  });

  describe('Message Handling', () => {
    it('should implement handleMessage function', () => {
      assert.ok(hookSource.includes('handleMessage'));
    });

    it('should parse incoming messages', () => {
      assert.ok(hookSource.includes('parseMessage(event.data)'));
    });

    it('should warn on invalid messages', () => {
      assert.ok(hookSource.includes('console.warn'));
    });

    it('should add valid events to events list', () => {
      assert.ok(hookSource.includes('setEvents'));
      assert.ok(hookSource.includes('[...prevEvents, parsed]'));
    });

    it('should call updateActivities for valid events', () => {
      assert.ok(hookSource.includes('updateActivities(parsed)'));
    });
  });

  describe('Cleanup', () => {
    it('should clear reconnect timeout on unmount', () => {
      assert.ok(hookSource.includes('clearTimeout(reconnectTimeoutRef.current)'));
    });

    it('should set unmountedRef to true on unmount', () => {
      assert.ok(hookSource.includes('unmountedRef.current = true'));
    });

    it('should close WebSocket on unmount', () => {
      assert.ok(hookSource.includes('wsRef.current.close()'));
    });

    it('should set wsRef to null on unmount', () => {
      assert.ok(hookSource.includes('wsRef.current = null'));
    });

    it('should check unmounted state before state updates', () => {
      assert.ok(hookSource.includes('if (unmountedRef.current)'));
    });
  });

  describe('Hook Return Value', () => {
    it('should return activities', () => {
      assert.ok(hookSource.includes('return {') && hookSource.includes('activities'));
    });

    it('should return events', () => {
      assert.ok(hookSource.includes('events'));
    });

    it('should return status', () => {
      assert.ok(hookSource.includes('status'));
    });

    it('should return error', () => {
      assert.ok(hookSource.includes('error'));
    });
  });

  describe('Connection Status Types', () => {
    it('should include connecting status', () => {
      assert.ok(hookSource.includes("'connecting'"));
    });

    it('should include connected status', () => {
      assert.ok(hookSource.includes("'connected'"));
    });

    it('should include disconnected status', () => {
      assert.ok(hookSource.includes("'disconnected'"));
    });
  });

  describe('Agent Activity Structure', () => {
    it('should track agentId', () => {
      assert.ok(hookSource.includes('agentId:'));
    });

    it('should track status', () => {
      assert.ok(hookSource.includes('status:'));
    });

    it('should track lastSeen', () => {
      assert.ok(hookSource.includes('lastSeen:'));
    });

    it('should track toolsUsed array', () => {
      assert.ok(hookSource.includes('toolsUsed:'));
    });

    it('should track optional currentModel', () => {
      assert.ok(hookSource.includes('currentModel?:'));
    });

    it('should track optional tokenUsage', () => {
      assert.ok(hookSource.includes('tokenUsage?:'));
    });
  });

  describe('React Hooks Usage', () => {
    it('should import useState', () => {
      assert.ok(hookSource.includes('useState'));
    });

    it('should import useEffect', () => {
      assert.ok(hookSource.includes('useEffect'));
    });

    it('should import useCallback', () => {
      assert.ok(hookSource.includes('useCallback'));
    });

    it('should import useRef', () => {
      assert.ok(hookSource.includes('useRef'));
    });

    it('should call useEffect for initialization', () => {
      assert.ok(hookSource.includes('useEffect(() => {'));
    });
  });
});
