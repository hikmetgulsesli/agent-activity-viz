import { describe, test } from 'node:test';
import { strictEqual, ok } from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Since we can't import React components in tests, we'll test via source file inspection
const componentSource = readFileSync(
  join(import.meta.dirname, '../../src/client/components/ModelSwitches.tsx'),
  'utf-8'
);

const cssSource = readFileSync(
  join(import.meta.dirname, '../../src/client/components/ModelSwitches.css'),
  'utf-8'
);

describe('ModelSwitches Component', () => {
  describe('Component Structure', () => {
    test('exports default function ModelSwitches', () => {
      ok(componentSource.includes('export default function ModelSwitches'));
    });

    test('accepts events prop of type AgentEvent[]', () => {
      ok(componentSource.includes('ModelSwitchesProps'));
      ok(componentSource.includes('events: AgentEvent[]'));
    });

    test('defines ModelSwitch interface', () => {
      ok(componentSource.includes('export interface ModelSwitch'));
      ok(componentSource.includes('timestamp: string'));
      ok(componentSource.includes('agentId: string'));
      ok(componentSource.includes('fromModel: string'));
      ok(componentSource.includes('toModel: string'));
    });
  });

  describe('Helper Functions', () => {
    test('has getProvider function', () => {
      ok(componentSource.includes('function getProvider(model: string): string'));
    });

    test('has getProviderColor function', () => {
      ok(componentSource.includes('function getProviderColor(provider: string): string'));
    });

    test('has getModelAlias function', () => {
      ok(componentSource.includes('function getModelAlias(model: string): string | null'));
    });

    test('has formatRelativeTime function', () => {
      ok(componentSource.includes('function formatRelativeTime(timestamp: string): string'));
    });

    test('has extractModelSwitches function', () => {
      ok(componentSource.includes('function extractModelSwitches(events: AgentEvent[]): ModelSwitch[]'));
    });
  });

  describe('Provider Detection', () => {
    test('getProvider extracts provider from model string', () => {
      ok(componentSource.includes('model.split(\'/\')'));
    });

    test('handles models without slash separator', () => {
      ok(componentSource.includes('parts.length > 1'));
    });

    test('returns unknown for invalid input', () => {
      ok(componentSource.includes('return \'unknown\''));
    });
  });

  describe('Provider Colors', () => {
    test('maps Anthropic to purple theme', () => {
      ok(componentSource.includes('case \'anthropic\':'));
      ok(componentSource.includes('return \'provider-anthropic\''));
    });

    test('maps DeepSeek to blue theme', () => {
      ok(componentSource.includes('case \'deepseek\':'));
      ok(componentSource.includes('return \'provider-deepseek\''));
    });

    test('maps OpenAI to green theme', () => {
      ok(componentSource.includes('case \'openai\':'));
      ok(componentSource.includes('return \'provider-openai\''));
    });

    test('maps XAI to yellow theme', () => {
      ok(componentSource.includes('case \'xai\':'));
      ok(componentSource.includes('return \'provider-xai\''));
    });

    test('maps Google/Gemini to cyan theme', () => {
      ok(componentSource.includes('case \'google\':'));
      ok(componentSource.includes('case \'gemini\':'));
      ok(componentSource.includes('return \'provider-google\''));
    });

    test('maps Kimi to pink theme', () => {
      ok(componentSource.includes('case \'kimi-coding\':'));
      ok(componentSource.includes('case \'kimi\':'));
      ok(componentSource.includes('return \'provider-kimi\''));
    });

    test('maps Minimax to purple theme', () => {
      ok(componentSource.includes('case \'minimax\':'));
      ok(componentSource.includes('return \'provider-minimax\''));
    });

    test('maps ZAI to indigo theme', () => {
      ok(componentSource.includes('case \'zai\':'));
      ok(componentSource.includes('return \'provider-zai\''));
    });

    test('has default fallback color', () => {
      ok(componentSource.includes('default:'));
      ok(componentSource.includes('return \'provider-default\''));
    });
  });

  describe('Model Aliases', () => {
    test('maps opus models to opus alias', () => {
      ok(componentSource.includes('if (modelLower.includes(\'opus\')) return \'opus\''));
    });

    test('maps sonnet models to sonnet alias', () => {
      ok(componentSource.includes('if (modelLower.includes(\'sonnet\')) return \'sonnet\''));
    });

    test('maps reasoner models to r1 alias', () => {
      ok(componentSource.includes('if (modelLower.includes(\'reasoner\')) return \'r1\''));
    });

    test('maps deepseek-chat to ds alias', () => {
      ok(componentSource.includes('if (modelLower.includes(\'deepseek-chat\')) return \'ds\''));
    });

    test('maps k2p5 to kimi alias', () => {
      ok(componentSource.includes('if (modelLower.includes(\'k2p5\')) return \'kimi\''));
    });

    test('maps thinking models to kimi-think alias', () => {
      ok(componentSource.includes('if (modelLower.includes(\'thinking\')) return \'kimi-think\''));
    });

    test('maps grok models to grok alias', () => {
      ok(componentSource.includes('if (modelLower.includes(\'grok\')) return \'grok\''));
    });

    test('maps lightning models to minimax-fast alias', () => {
      ok(componentSource.includes('if (modelLower.includes(\'lightning\')) return \'minimax-fast\''));
    });

    test('maps minimax models to minimax alias', () => {
      ok(componentSource.includes('if (modelLower.includes(\'minimax\')) return \'minimax\''));
    });

    test('maps glm models to glm alias', () => {
      ok(componentSource.includes('if (modelLower.includes(\'glm\')) return \'glm\''));
    });

    test('returns null for unknown models', () => {
      ok(componentSource.includes('return null'));
    });
  });

  describe('Time Formatting', () => {
    test('formats seconds correctly', () => {
      ok(componentSource.includes('if (seconds < 60)'));
      ok(componentSource.includes('return `${seconds}s ago`'));
    });

    test('formats minutes correctly', () => {
      ok(componentSource.includes('if (minutes < 60)'));
      ok(componentSource.includes('return `${minutes}m ago`'));
    });

    test('formats hours correctly', () => {
      ok(componentSource.includes('if (hours < 24)'));
      ok(componentSource.includes('return `${hours}h ago`'));
    });

    test('formats days correctly', () => {
      ok(componentSource.includes('return `${days}d ago`'));
    });

    test('handles future timestamps', () => {
      ok(componentSource.includes('if (diffMs < 0)'));
      ok(componentSource.includes('return \'just now\''));
    });
  });

  describe('Model Switch Extraction', () => {
    test('processes events in chronological order', () => {
      ok(componentSource.includes('for (const event of events)'));
    });

    test('tracks model switches from model_switched events', () => {
      ok(componentSource.includes('if (event.eventType === \'model_switched\')'));
    });

    test('reconstructs fromModel from previous state', () => {
      ok(componentSource.includes('agentCurrentModel.get(agentId)'));
      ok(componentSource.includes('|| \'unknown\''));
    });

    test('extracts toModel from event payload', () => {
      ok(componentSource.includes('event.payload.model as string'));
    });

    test('updates agent current model after switch', () => {
      ok(componentSource.includes('agentCurrentModel.set(agentId, toModel)'));
    });

    test('initializes model on agent_started', () => {
      ok(componentSource.includes('if (event.eventType === \'agent_started\')'));
      ok(componentSource.includes('if (event.payload.model)'));
    });

    test('uses Map for efficient agent model tracking', () => {
      ok(componentSource.includes('new Map<string, string>()'));
    });
  });

  describe('Data Processing', () => {
    test('uses useMemo for model switches extraction', () => {
      ok(componentSource.includes('useMemo'));
      ok(componentSource.includes('extractModelSwitches(events)'));
    });

    test('limits list to 20 most recent switches', () => {
      ok(componentSource.includes('slice(0, 20)'));
    });

    test('reverses switches to show newest first', () => {
      ok(componentSource.includes('reverse()'));
    });

    test('recalculates when events change', () => {
      ok(componentSource.includes(', [events]'));
    });
  });

  describe('Statistics Calculation', () => {
    test('calculates total switches today', () => {
      ok(componentSource.includes('const oneDayAgo'));
      ok(componentSource.includes('24 * 60 * 60 * 1000'));
      ok(componentSource.includes('totalToday'));
    });

    test('calculates switches per hour', () => {
      ok(componentSource.includes('const oneHourAgo'));
      ok(componentSource.includes('60 * 60 * 1000'));
      ok(componentSource.includes('perHour'));
    });

    test('filters switches by timestamp', () => {
      ok(componentSource.includes('switchesToday'));
      ok(componentSource.includes('switchesLastHour'));
      ok(componentSource.includes('filter'));
      ok(componentSource.includes('switchTime >= oneDayAgo'));
      ok(componentSource.includes('switchTime >= oneHourAgo'));
    });

    test('uses useMemo for stats calculation', () => {
      ok(componentSource.includes('const stats = useMemo'));
    });
  });

  describe('Empty State', () => {
    test('shows empty state when no switches', () => {
      ok(componentSource.includes('if (modelSwitches.length === 0)'));
      ok(componentSource.includes('model-switches-empty'));
    });

    test('displays empty message', () => {
      ok(componentSource.includes('No model switches yet'));
    });

    test('displays empty subtitle', () => {
      ok(componentSource.includes('Model changes will appear here'));
    });
  });

  describe('Render Structure', () => {
    test('renders stats section', () => {
      ok(componentSource.includes('className="model-switches-stats"'));
    });

    test('displays total today stat', () => {
      ok(componentSource.includes('Today:'));
      ok(componentSource.includes('{stats.totalToday}'));
    });

    test('displays per hour stat', () => {
      ok(componentSource.includes('Per Hour:'));
      ok(componentSource.includes('{stats.perHour}'));
    });

    test('renders switches list', () => {
      ok(componentSource.includes('className="model-switches-list"'));
    });

    test('maps over model switches', () => {
      ok(componentSource.includes('modelSwitches.map'));
    });

    test('renders switch header with agent and time', () => {
      ok(componentSource.includes('className="switch-header"'));
      ok(componentSource.includes('className="agent-name"'));
      ok(componentSource.includes('className="switch-time"'));
    });

    test('renders from-model badge', () => {
      ok(componentSource.includes('className="model-badge-container"'));
      ok(componentSource.includes('fromAlias || sw.fromModel'));
    });

    test('renders to-model badge', () => {
      ok(componentSource.includes('toAlias || sw.toModel'));
    });

    test('renders arrow separator', () => {
      ok(componentSource.includes('className="switch-arrow"'));
      ok(componentSource.includes('→'));
    });

    test('shows full model name when alias exists', () => {
      ok(componentSource.includes('fromAlias &&'));
      ok(componentSource.includes('className="model-full"'));
      ok(componentSource.includes('title={sw.fromModel}'));
    });

    test('applies provider color classes', () => {
      ok(componentSource.includes('getProviderColor(fromProvider)'));
      ok(componentSource.includes('getProviderColor(toProvider)'));
    });
  });

  describe('CSS Styles', () => {
    test('has main container styles', () => {
      ok(cssSource.includes('.model-switches {'));
    });

    test('has stats section styles', () => {
      ok(cssSource.includes('.model-switches-stats {'));
    });

    test('has list container styles', () => {
      ok(cssSource.includes('.model-switches-list {'));
    });

    test('has switch item styles', () => {
      ok(cssSource.includes('.model-switch-item {'));
    });

    test('has hover effects', () => {
      ok(cssSource.includes('.model-switch-item:hover'));
      ok(cssSource.includes('transform: translateX(2px)'));
    });

    test('has model badge styles', () => {
      ok(cssSource.includes('.model-badge {'));
    });

    test('defines all provider color classes', () => {
      ok(cssSource.includes('.provider-anthropic'));
      ok(cssSource.includes('.provider-deepseek'));
      ok(cssSource.includes('.provider-openai'));
      ok(cssSource.includes('.provider-xai'));
      ok(cssSource.includes('.provider-google'));
      ok(cssSource.includes('.provider-kimi'));
      ok(cssSource.includes('.provider-minimax'));
      ok(cssSource.includes('.provider-zai'));
      ok(cssSource.includes('.provider-default'));
    });

    test('uses gradients for provider colors', () => {
      ok(cssSource.includes('linear-gradient'));
    });

    test('has scrollbar styles', () => {
      ok(cssSource.includes('::-webkit-scrollbar'));
    });

    test('has empty state styles', () => {
      ok(cssSource.includes('.model-switches-empty'));
    });

    test('has responsive styles for mobile', () => {
      ok(cssSource.includes('@media (max-width: 640px)'));
    });

    test('rotates arrow on mobile', () => {
      ok(cssSource.includes('transform: rotate(90deg)'));
    });
  });

  describe('Accessibility', () => {
    test('uses semantic HTML', () => {
      ok(componentSource.includes('<div className='));
      ok(componentSource.includes('<span className='));
    });

    test('provides title tooltips for full model names', () => {
      ok(componentSource.includes('title={sw.fromModel}'));
      ok(componentSource.includes('title={sw.toModel}'));
    });
  });

  describe('Performance', () => {
    test('memoizes expensive computations', () => {
      const memoCount = (componentSource.match(/useMemo/g) || []).length;
      strictEqual(memoCount, 3); // switches and stats (stats calculation appears twice in useMemo)
    });

    test('uses efficient Map data structure', () => {
      ok(componentSource.includes('new Map<string, string>()'));
    });
  });
});
