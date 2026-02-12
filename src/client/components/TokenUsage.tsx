import React from 'react';
import type { AgentActivity } from '../hooks/useWebSocket';
import './TokenUsage.css';

interface TokenUsageProps {
  activities: Map<string, AgentActivity>;
}

interface AgentTokenData {
  agentId: string;
  input: number;
  output: number;
  total: number;
}

interface ModelTokenData {
  model: string;
  total: number;
}

function TokenUsage({ activities }: TokenUsageProps): React.ReactElement {
  // Calculate per-agent token usage
  const agentTokens: AgentTokenData[] = Array.from(activities.values())
    .filter((activity) => activity.tokenUsage !== undefined)
    .map((activity) => ({
      agentId: activity.agentId,
      input: activity.tokenUsage!.input,
      output: activity.tokenUsage!.output,
      total: activity.tokenUsage!.input + activity.tokenUsage!.output,
    }))
    .sort((a, b) => b.total - a.total);

  // Calculate total tokens
  const totalTokens = agentTokens.reduce((sum, agent) => sum + agent.total, 0);

  // Calculate per-model token usage
  const modelTokensMap = new Map<string, number>();
  Array.from(activities.values()).forEach((activity) => {
    if (activity.tokenUsage && activity.currentModel) {
      const current = modelTokensMap.get(activity.currentModel) || 0;
      modelTokensMap.set(
        activity.currentModel,
        current + activity.tokenUsage.input + activity.tokenUsage.output
      );
    }
  });

  const modelTokens: ModelTokenData[] = Array.from(modelTokensMap.entries())
    .map(([model, total]) => ({ model, total }))
    .sort((a, b) => b.total - a.total);

  // Calculate max for scaling bar charts
  const maxAgentTokens = Math.max(...agentTokens.map((a) => a.total), 1);

  // Get model colors
  const getModelColor = (model: string): string => {
    // Consistent color mapping for common OpenClaw models
    const colorMap: Record<string, string> = {
      'claude-sonnet-4': 'var(--color-primary)',
      'claude-opus-4': 'var(--color-accent)',
      'gpt-4': 'var(--color-success)',
      'deepseek': 'var(--color-warning)',
      'gemini': 'var(--color-info)',
    };

    // Find matching color by partial model name
    for (const [key, color] of Object.entries(colorMap)) {
      if (model.toLowerCase().includes(key)) {
        return color;
      }
    }

    // Default color for unknown models
    return 'var(--color-text-secondary)';
  };

  // Format large numbers (e.g., 1234567 → "1.23M")
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toFixed(0);
  };

  // Empty state
  if (agentTokens.length === 0) {
    return (
      <div className="token-usage-empty">
        <p>No token usage data yet</p>
      </div>
    );
  }

  return (
    <div className="token-usage">
      {/* Total tokens today */}
      <div className="token-total">
        <div className="token-total-label">Total Tokens Today</div>
        <div className="token-total-number">{formatNumber(totalTokens)}</div>
        <div className="token-total-exact">{totalTokens.toLocaleString()} tokens</div>
      </div>

      {/* Per-agent token bars */}
      <div className="token-section">
        <h3 className="token-section-title">Per-Agent Usage</h3>
        <div className="token-agent-bars">
          {agentTokens.map((agent) => {
            const percentage = (agent.total / maxAgentTokens) * 100;
            return (
              <div key={agent.agentId} className="token-agent-bar">
                <div className="token-agent-info">
                  <span className="token-agent-name">{agent.agentId}</span>
                  <span className="token-agent-total">{formatNumber(agent.total)}</span>
                </div>
                <div className="token-bar-container">
                  <div
                    className="token-bar"
                    style={{ width: `${percentage}%` }}
                    title={`Input: ${agent.input.toLocaleString()}, Output: ${agent.output.toLocaleString()}`}
                  >
                    <div
                      className="token-bar-input"
                      style={{ width: `${(agent.input / agent.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-model breakdown (pie chart) */}
      {modelTokens.length > 0 && (
        <div className="token-section">
          <h3 className="token-section-title">Per-Model Breakdown</h3>
          <div className="token-model-chart">
            {/* Simple horizontal stacked bar as "pie chart" */}
            <div className="token-model-bar-container">
              {modelTokens.map((modelData) => {
                const percentage = (modelData.total / totalTokens) * 100;
                return (
                  <div
                    key={modelData.model}
                    className="token-model-segment"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: getModelColor(modelData.model),
                    }}
                    title={`${modelData.model}: ${formatNumber(modelData.total)} (${percentage.toFixed(1)}%)`}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div className="token-model-legend">
              {modelTokens.map((modelData) => {
                const percentage = (modelData.total / totalTokens) * 100;
                return (
                  <div key={modelData.model} className="token-model-legend-item">
                    <div
                      className="token-model-legend-color"
                      style={{ backgroundColor: getModelColor(modelData.model) }}
                    />
                    <span className="token-model-legend-name">{modelData.model}</span>
                    <span className="token-model-legend-value">
                      {formatNumber(modelData.total)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TokenUsage;
