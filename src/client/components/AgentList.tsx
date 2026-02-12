import React from 'react';
import type { AgentActivity } from '../hooks/useWebSocket';
import './AgentList.css';

interface AgentListProps {
  activities: Map<string, AgentActivity>;
}

/**
 * Calculate context usage percentage (0-100)
 * Based on token usage relative to typical context limits
 */
function calculateContextUsage(activity: AgentActivity): number {
  if (!activity.tokenUsage) {
    return 0;
  }
  
  const totalTokens = activity.tokenUsage.input + activity.tokenUsage.output;
  // Assume 200k context limit for now (Claude Sonnet 4)
  const CONTEXT_LIMIT = 200000;
  
  return Math.min(Math.round((totalTokens / CONTEXT_LIMIT) * 100), 100);
}

/**
 * Determine agent type badge based on agentId
 */
function getAgentType(agentId: string): 'main' | 'cron' | 'subagent' {
  if (agentId.includes('cron:')) {
    return 'cron';
  }
  if (agentId.includes('subagent') || agentId.includes('sub-')) {
    return 'subagent';
  }
  return 'main';
}

/**
 * Get color class for status badge
 */
function getStatusColorClass(status: AgentActivity['status']): string {
  switch (status) {
    case 'active':
      return 'status-active';
    case 'idle':
      return 'status-idle';
    case 'ended':
      return 'status-ended';
    default:
      return 'status-idle';
  }
}

/**
 * Get color class for context usage bar
 */
function getContextColorClass(percentage: number): string {
  if (percentage >= 80) {
    return 'context-danger';
  }
  if (percentage >= 60) {
    return 'context-warning';
  }
  return 'context-safe';
}

function AgentList({ activities }: AgentListProps): React.ReactElement {
  // Convert Map to array and sort by lastSeen timestamp (most recent first)
  const agentList = Array.from(activities.values()).sort((a, b) => {
    return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
  });

  if (agentList.length === 0) {
    return (
      <div className="agent-list-empty">
        <p>No agents currently active</p>
      </div>
    );
  }

  return (
    <div className="agent-list">
      {agentList.map(activity => {
        const agentType = getAgentType(activity.agentId);
        const contextUsage = calculateContextUsage(activity);
        const statusClass = getStatusColorClass(activity.status);
        const contextClass = getContextColorClass(contextUsage);

        return (
          <div key={activity.agentId} className="agent-item">
            <div className="agent-header">
              <div className="agent-name-row">
                <span className="agent-name">{activity.agentId}</span>
                <span className={`agent-type-badge agent-type-${agentType}`}>
                  {agentType}
                </span>
              </div>
              <span className={`agent-status ${statusClass}`}>
                {activity.status}
              </span>
            </div>

            <div className="agent-info">
              <div className="agent-model">
                <span className="label">Model:</span>
                <span className="value">{activity.currentModel || 'unknown'}</span>
              </div>
              
              <div className="agent-tools">
                <span className="label">Tools:</span>
                <span className="value">
                  {activity.toolsUsed.length > 0 
                    ? activity.toolsUsed.join(', ')
                    : 'none'}
                </span>
              </div>
            </div>

            <div className="agent-context">
              <div className="context-label">
                <span>Context Usage</span>
                <span className="context-percentage">{contextUsage}%</span>
              </div>
              <div className="context-bar-container">
                <div 
                  className={`context-bar ${contextClass}`}
                  style={{ width: `${contextUsage}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AgentList;
