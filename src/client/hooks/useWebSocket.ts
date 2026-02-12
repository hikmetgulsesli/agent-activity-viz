import { useState, useEffect, useCallback, useRef } from 'react';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

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

export interface AgentActivity {
  agentId: string;
  status: 'active' | 'idle' | 'ended';
  lastSeen: string;
  toolsUsed: string[];
  currentModel?: string;
  tokenUsage?: {
    input: number;
    output: number;
  };
}

export interface UseWebSocketReturn {
  activities: Map<string, AgentActivity>;
  events: AgentEvent[];
  status: ConnectionStatus;
  error: Error | null;
}

const MAX_EVENTS = 100;
const RECONNECT_BASE_DELAY = 1000;
const RECONNECT_MAX_DELAY = 30000;

export function useWebSocket(url: string): UseWebSocketReturn {
  const [activities, setActivities] = useState<Map<string, AgentActivity>>(new Map());
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<Error | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const unmountedRef = useRef<boolean>(false);

  /**
   * Calculate exponential backoff delay for reconnection
   */
  const getReconnectDelay = useCallback((): number => {
    const attempts = reconnectAttemptsRef.current;
    const delay = Math.min(
      RECONNECT_BASE_DELAY * Math.pow(2, attempts),
      RECONNECT_MAX_DELAY
    );
    return delay;
  }, []);

  /**
   * Validate and parse incoming message
   */
  const parseMessage = useCallback((data: string): AgentEvent | null => {
    try {
      const parsed = JSON.parse(data);
      
      // Validate schema
      if (!parsed.timestamp || typeof parsed.timestamp !== 'string') {
        return null;
      }
      if (!parsed.agentId || typeof parsed.agentId !== 'string') {
        return null;
      }
      if (!parsed.eventType || typeof parsed.eventType !== 'string') {
        return null;
      }
      if (!parsed.payload || typeof parsed.payload !== 'object') {
        return null;
      }

      const validEventTypes: AgentEventType[] = [
        'agent_started',
        'agent_ended',
        'tool_called',
        'model_switched',
        'token_update',
        'heartbeat'
      ];
      
      if (!validEventTypes.includes(parsed.eventType as AgentEventType)) {
        return null;
      }

      return parsed as AgentEvent;
    } catch {
      return null;
    }
  }, []);

  /**
   * Update activities state based on incoming event
   */
  const updateActivities = useCallback((event: AgentEvent) => {
    setActivities(prevActivities => {
      const newActivities = new Map(prevActivities);
      const agentId = event.agentId;
      
      // Skip system events for activity tracking
      if (agentId === 'system') {
        return prevActivities;
      }

      const existing = newActivities.get(agentId);
      
      switch (event.eventType) {
        case 'agent_started': {
          newActivities.set(agentId, {
            agentId,
            status: 'active',
            lastSeen: event.timestamp,
            toolsUsed: [],
            tokenUsage: { input: 0, output: 0 }
          });
          break;
        }
        
        case 'agent_ended': {
          if (existing) {
            newActivities.set(agentId, {
              ...existing,
              status: 'ended',
              lastSeen: event.timestamp
            });
          }
          break;
        }
        
        case 'tool_called': {
          if (existing) {
            const toolName = event.payload.tool as string;
            const toolsUsed = existing.toolsUsed.includes(toolName)
              ? existing.toolsUsed
              : [...existing.toolsUsed, toolName];
            
            newActivities.set(agentId, {
              ...existing,
              toolsUsed,
              status: 'active',
              lastSeen: event.timestamp
            });
          }
          break;
        }
        
        case 'model_switched': {
          if (existing) {
            newActivities.set(agentId, {
              ...existing,
              currentModel: event.payload.model as string,
              status: 'active',
              lastSeen: event.timestamp
            });
          }
          break;
        }
        
        case 'token_update': {
          if (existing) {
            const inputTokens = event.payload.input as number || 0;
            const outputTokens = event.payload.output as number || 0;
            
            newActivities.set(agentId, {
              ...existing,
              tokenUsage: {
                input: inputTokens,
                output: outputTokens
              },
              status: 'active',
              lastSeen: event.timestamp
            });
          }
          break;
        }
        
        case 'heartbeat': {
          // Heartbeat doesn't update activities
          break;
        }
      }

      return newActivities;
    });
  }, []);

  /**
   * Handle incoming WebSocket message
   */
  const handleMessage = useCallback((event: MessageEvent) => {
    const parsed = parseMessage(event.data);
    
    if (!parsed) {
      console.warn('Invalid message received:', event.data);
      return;
    }

    // Add to events list (keep only last MAX_EVENTS)
    setEvents(prevEvents => {
      const newEvents = [...prevEvents, parsed];
      return newEvents.slice(-MAX_EVENTS);
    });

    // Update activities
    updateActivities(parsed);
  }, [parseMessage, updateActivities]);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    if (unmountedRef.current) {
      return;
    }

    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setStatus('connecting');
    setError(null);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmountedRef.current) {
          ws.close();
          return;
        }
        
        setStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = handleMessage;

      ws.onerror = () => {
        if (unmountedRef.current) {
          return;
        }
        
        const err = new Error('WebSocket connection error');
        setError(err);
      };

      ws.onclose = () => {
        if (unmountedRef.current) {
          return;
        }
        
        setStatus('disconnected');
        
        // Schedule reconnection with exponential backoff
        const delay = getReconnectDelay();
        reconnectAttemptsRef.current += 1;
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };

    } catch (err) {
      if (unmountedRef.current) {
        return;
      }
      
      setStatus('disconnected');
      setError(err instanceof Error ? err : new Error('Unknown error'));
      
      // Schedule reconnection
      const delay = getReconnectDelay();
      reconnectAttemptsRef.current += 1;
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    }
  }, [url, handleMessage, getReconnectDelay]);

  /**
   * Initialize connection on mount
   */
  useEffect(() => {
    unmountedRef.current = false;
    connect();

    // Cleanup on unmount
    return () => {
      unmountedRef.current = true;
      
      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Close WebSocket
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return {
    activities,
    events,
    status,
    error
  };
}
