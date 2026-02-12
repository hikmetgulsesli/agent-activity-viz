import React, { useMemo } from 'react';
import type { AgentEvent } from '../hooks/useWebSocket';
import './ModelSwitches.css';

export interface ModelSwitchesProps {
  events: AgentEvent[];
}

export interface ModelSwitch {
  timestamp: string;
  agentId: string;
  fromModel: string;
  toModel: string;
}

/**
 * Get provider from model string (e.g., "anthropic/claude-sonnet-4-5" → "anthropic")
 */
function getProvider(model: string): string {
  if (!model) return 'unknown';
  const parts = model.split('/');
  return parts.length > 1 ? parts[0] : 'unknown';
}

/**
 * Get provider color class based on provider name
 */
function getProviderColor(provider: string): string {
  switch (provider.toLowerCase()) {
    case 'anthropic':
      return 'provider-anthropic';
    case 'deepseek':
      return 'provider-deepseek';
    case 'openai':
      return 'provider-openai';
    case 'xai':
      return 'provider-xai';
    case 'google':
    case 'gemini':
      return 'provider-google';
    case 'kimi-coding':
    case 'kimi':
      return 'provider-kimi';
    case 'minimax':
      return 'provider-minimax';
    case 'zai':
      return 'provider-zai';
    default:
      return 'provider-default';
  }
}

/**
 * Extract model alias from model string if available
 * Map common model strings to their aliases based on AGENTS.md
 */
function getModelAlias(model: string): string | null {
  if (!model) return null;
  
  const modelLower = model.toLowerCase();
  
  // Anthropic models
  if (modelLower.includes('opus')) return 'opus';
  if (modelLower.includes('sonnet')) return 'sonnet';
  
  // DeepSeek models
  if (modelLower.includes('reasoner')) return 'r1';
  if (modelLower.includes('deepseek-chat')) return 'ds';
  
  // Kimi models
  if (modelLower.includes('k2p5')) return 'kimi';
  if (modelLower.includes('thinking')) return 'kimi-think';
  
  // XAI models
  if (modelLower.includes('grok')) return 'grok';
  
  // Minimax models
  if (modelLower.includes('lightning')) return 'minimax-fast';
  if (modelLower.includes('minimax')) return 'minimax';
  
  // ZAI models
  if (modelLower.includes('glm')) return 'glm';
  
  return null;
}

/**
 * Format timestamp as relative time (e.g., "2m ago")
 */
function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  
  if (diffMs < 0) {
    return 'just now';
  }
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) {
    return `${seconds}s ago`;
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    return `${days}d ago`;
  }
}

/**
 * Extract model switches from events and reconstruct from/to transitions
 */
function extractModelSwitches(events: AgentEvent[]): ModelSwitch[] {
  const switches: ModelSwitch[] = [];
  const agentCurrentModel = new Map<string, string>();
  
  // Process events in chronological order to track model transitions
  for (const event of events) {
    if (event.eventType === 'model_switched') {
      const agentId = event.agentId;
      const toModel = event.payload.model as string;
      const fromModel = agentCurrentModel.get(agentId) || 'unknown';
      
      switches.push({
        timestamp: event.timestamp,
        agentId,
        fromModel,
        toModel
      });
      
      agentCurrentModel.set(agentId, toModel);
    } else if (event.eventType === 'agent_started') {
      // Initialize agent model on start (if model in payload)
      if (event.payload.model) {
        agentCurrentModel.set(event.agentId, event.payload.model as string);
      }
    }
  }
  
  return switches;
}

export default function ModelSwitches({ events }: ModelSwitchesProps): React.ReactElement {
  // Extract and process model switches
  const modelSwitches = useMemo(() => {
    const switches = extractModelSwitches(events);
    // Reverse to show newest first, then take last 20
    return switches.reverse().slice(0, 20);
  }, [events]);
  
  // Calculate stats
  const stats = useMemo(() => {
    const allSwitches = extractModelSwitches(events);
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const switchesToday = allSwitches.filter(s => {
      const switchTime = new Date(s.timestamp).getTime();
      return switchTime >= oneDayAgo;
    });
    
    const switchesLastHour = allSwitches.filter(s => {
      const switchTime = new Date(s.timestamp).getTime();
      return switchTime >= oneHourAgo;
    });
    
    return {
      totalToday: switchesToday.length,
      perHour: switchesLastHour.length
    };
  }, [events]);
  
  if (modelSwitches.length === 0) {
    return (
      <div className="model-switches-empty">
        <p>No model switches yet</p>
        <p className="empty-subtitle">Model changes will appear here</p>
      </div>
    );
  }
  
  return (
    <div className="model-switches">
      <div className="model-switches-stats">
        <div className="stat-item">
          <span className="stat-label">Today:</span>
          <span className="stat-value">{stats.totalToday}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Per Hour:</span>
          <span className="stat-value">{stats.perHour}</span>
        </div>
      </div>
      
      <div className="model-switches-list">
        {modelSwitches.map((sw, index) => {
          const fromProvider = getProvider(sw.fromModel);
          const toProvider = getProvider(sw.toModel);
          const fromAlias = getModelAlias(sw.fromModel);
          const toAlias = getModelAlias(sw.toModel);
          
          return (
            <div key={`${sw.timestamp}-${index}`} className="model-switch-item">
              <div className="switch-header">
                <span className="agent-name">{sw.agentId}</span>
                <span className="switch-time">{formatRelativeTime(sw.timestamp)}</span>
              </div>
              
              <div className="switch-transition">
                <div className="model-badge-container">
                  <div className={`model-badge ${getProviderColor(fromProvider)}`}>
                    {fromAlias || sw.fromModel}
                  </div>
                  {fromAlias && (
                    <div className="model-full" title={sw.fromModel}>
                      {sw.fromModel}
                    </div>
                  )}
                </div>
                
                <div className="switch-arrow">→</div>
                
                <div className="model-badge-container">
                  <div className={`model-badge ${getProviderColor(toProvider)}`}>
                    {toAlias || sw.toModel}
                  </div>
                  {toAlias && (
                    <div className="model-full" title={sw.toModel}>
                      {sw.toModel}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
