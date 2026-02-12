import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('TokenUsage Component', () => {
  // Read from src/ directory (tests run from dist/ but source files are in src/)
  const srcDir = join(__dirname, '..', '..', 'src');
  const componentPath = join(srcDir, 'client', 'components', 'TokenUsage.tsx');
  const componentCode = readFileSync(componentPath, 'utf-8');

  const cssPath = join(srcDir, 'client', 'components', 'TokenUsage.css');
  const cssCode = readFileSync(cssPath, 'utf-8');

  describe('Component Structure', () => {
    it('should define TokenUsageProps interface', () => {
      assert.ok(componentCode.includes('interface TokenUsageProps'));
      assert.ok(componentCode.includes('activities: Map<string, AgentActivity>'));
    });

    it('should define AgentTokenData interface', () => {
      assert.ok(componentCode.includes('interface AgentTokenData'));
      assert.ok(componentCode.includes('agentId: string'));
      assert.ok(componentCode.includes('input: number'));
      assert.ok(componentCode.includes('output: number'));
      assert.ok(componentCode.includes('total: number'));
    });

    it('should define ModelTokenData interface', () => {
      assert.ok(componentCode.includes('interface ModelTokenData'));
      assert.ok(componentCode.includes('model: string'));
      assert.ok(componentCode.includes('total: number'));
    });

    it('should accept activities Map prop', () => {
      assert.ok(componentCode.includes('activities }: TokenUsageProps'));
    });

    it('should export TokenUsage component as default', () => {
      assert.ok(componentCode.includes('export default TokenUsage'));
    });

    it('should import AgentActivity type from useWebSocket hook', () => {
      assert.ok(componentCode.includes("import type { AgentActivity } from '../hooks/useWebSocket'"));
    });

    it('should import TokenUsage.css', () => {
      assert.ok(componentCode.includes("import './TokenUsage.css'"));
    });
  });

  describe('Data Processing', () => {
    it('should calculate per-agent token usage from activities Map', () => {
      assert.ok(componentCode.includes('Array.from(activities.values())'));
      assert.ok(componentCode.includes('.filter((activity) => activity.tokenUsage !== undefined)'));
      assert.ok(componentCode.includes('.map((activity) => ({'));
      assert.ok(componentCode.includes('agentId: activity.agentId'));
      assert.ok(componentCode.includes('input: activity.tokenUsage!.input'));
      assert.ok(componentCode.includes('output: activity.tokenUsage!.output'));
    });

    it('should calculate total tokens per agent', () => {
      assert.ok(componentCode.includes('total: activity.tokenUsage!.input + activity.tokenUsage!.output'));
    });

    it('should sort agents by total tokens descending', () => {
      assert.ok(componentCode.includes('.sort((a, b) => b.total - a.total)'));
    });

    it('should calculate total tokens across all agents', () => {
      assert.ok(componentCode.includes('const totalTokens = agentTokens.reduce'));
      assert.ok(componentCode.includes('(sum, agent) => sum + agent.total, 0'));
    });

    it('should calculate per-model token usage', () => {
      assert.ok(componentCode.includes('const modelTokensMap = new Map<string, number>()'));
      assert.ok(componentCode.includes('if (activity.tokenUsage && activity.currentModel)'));
      assert.ok(componentCode.includes('modelTokensMap.get(activity.currentModel)'));
      assert.ok(componentCode.includes('modelTokensMap.set'));
    });

    it('should sort models by total tokens descending', () => {
      // Check that modelTokens is created and sorted
      assert.ok(componentCode.includes('const modelTokens: ModelTokenData[] = Array.from(modelTokensMap.entries())'));
      assert.ok(componentCode.includes('.map(([model, total]) => ({ model, total }))'));
      // Verify the sort is applied (may be on different lines)
      const sortIndex = componentCode.indexOf('.map(([model, total]) => ({ model, total }))');
      const afterMap = componentCode.slice(sortIndex);
      assert.ok(afterMap.includes('.sort((a, b) => b.total - a.total)'), 'Should sort model tokens by total descending');
    });

    it('should calculate max agent tokens for bar scaling', () => {
      assert.ok(componentCode.includes('const maxAgentTokens = Math.max(...agentTokens.map((a) => a.total), 1)'));
    });
  });

  describe('Model Color Mapping', () => {
    it('should define getModelColor function', () => {
      assert.ok(componentCode.includes('const getModelColor = (model: string): string =>'));
    });

    it('should map common OpenClaw models to colors', () => {
      assert.ok(componentCode.includes("'claude-sonnet-4': 'var(--color-primary)'"));
      assert.ok(componentCode.includes("'claude-opus-4': 'var(--color-accent)'"));
      assert.ok(componentCode.includes("'gpt-4': 'var(--color-success)'"));
      assert.ok(componentCode.includes("'deepseek': 'var(--color-warning)'"));
      assert.ok(componentCode.includes("'gemini': 'var(--color-info)'"));
    });

    it('should use partial matching for model names', () => {
      assert.ok(componentCode.includes('model.toLowerCase().includes(key)'));
    });

    it('should have default color for unknown models', () => {
      assert.ok(componentCode.includes("return 'var(--color-text-secondary)'"));
    });
  });

  describe('Number Formatting', () => {
    it('should define formatNumber function', () => {
      assert.ok(componentCode.includes('const formatNumber = (num: number): string =>'));
    });

    it('should format millions with M suffix', () => {
      assert.ok(componentCode.includes('if (num >= 1000000)'));
      assert.ok(componentCode.includes('(num / 1000000).toFixed(2) + \'M\''));
    });

    it('should format thousands with K suffix', () => {
      assert.ok(componentCode.includes('if (num >= 1000)'));
      assert.ok(componentCode.includes('(num / 1000).toFixed(2) + \'K\''));
    });

    it('should format small numbers without suffix', () => {
      assert.ok(componentCode.includes('num.toFixed(0)'));
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no token data', () => {
      assert.ok(componentCode.includes('if (agentTokens.length === 0)'));
      assert.ok(componentCode.includes('token-usage-empty'));
      assert.ok(componentCode.includes('No token usage data yet'));
    });
  });

  describe('Total Tokens Display', () => {
    it('should display total tokens section', () => {
      assert.ok(componentCode.includes('className="token-total"'));
    });

    it('should show label "Total Tokens Today"', () => {
      assert.ok(componentCode.includes('Total Tokens Today'));
    });

    it('should show formatted total number', () => {
      assert.ok(componentCode.includes('className="token-total-number"'));
      assert.ok(componentCode.includes('{formatNumber(totalTokens)}'));
    });

    it('should show exact token count with locale formatting', () => {
      assert.ok(componentCode.includes('className="token-total-exact"'));
      assert.ok(componentCode.includes('{totalTokens.toLocaleString()}'));
    });
  });

  describe('Per-Agent Token Bars', () => {
    it('should display per-agent section', () => {
      assert.ok(componentCode.includes('Per-Agent Usage'));
      assert.ok(componentCode.includes('className="token-agent-bars"'));
    });

    it('should map over agentTokens array', () => {
      assert.ok(componentCode.includes('{agentTokens.map((agent) =>'));
    });

    it('should calculate percentage for bar width', () => {
      assert.ok(componentCode.includes('const percentage = (agent.total / maxAgentTokens) * 100'));
    });

    it('should display agent name', () => {
      assert.ok(componentCode.includes('className="token-agent-name"'));
      assert.ok(componentCode.includes('{agent.agentId}'));
    });

    it('should display formatted total', () => {
      assert.ok(componentCode.includes('className="token-agent-total"'));
      assert.ok(componentCode.includes('{formatNumber(agent.total)}'));
    });

    it('should set bar width with inline style', () => {
      assert.ok(componentCode.includes('style={{ width: `${percentage}%` }}'));
    });

    it('should show input/output breakdown in tooltip', () => {
      assert.ok(componentCode.includes('title={`Input: ${agent.input.toLocaleString()}, Output: ${agent.output.toLocaleString()}`}'));
    });

    it('should display input segment within bar', () => {
      assert.ok(componentCode.includes('className="token-bar-input"'));
      assert.ok(componentCode.includes('style={{ width: `${(agent.input / agent.total) * 100}%` }}'));
    });

    it('should use key for React list rendering', () => {
      assert.ok(componentCode.includes('key={agent.agentId}'));
    });
  });

  describe('Per-Model Breakdown', () => {
    it('should conditionally render model section', () => {
      assert.ok(componentCode.includes('{modelTokens.length > 0 &&'));
      assert.ok(componentCode.includes('Per-Model Breakdown'));
    });

    it('should display stacked bar chart', () => {
      assert.ok(componentCode.includes('className="token-model-bar-container"'));
      assert.ok(componentCode.includes('className="token-model-segment"'));
    });

    it('should map over modelTokens for segments', () => {
      assert.ok(componentCode.includes('{modelTokens.map((modelData) =>'));
    });

    it('should calculate model percentage', () => {
      const percentageMatches = componentCode.match(/const percentage = \(modelData\.total \/ totalTokens\) \* 100/g);
      assert.ok(percentageMatches && percentageMatches.length >= 1, 'Should calculate model percentage');
    });

    it('should set segment width and color', () => {
      assert.ok(componentCode.includes('width: `${percentage}%`'));
      assert.ok(componentCode.includes('backgroundColor: getModelColor(modelData.model)'));
    });

    it('should display tooltip with model details', () => {
      assert.ok(componentCode.includes('title={`${modelData.model}: ${formatNumber(modelData.total)} (${percentage.toFixed(1)}%)`}'));
    });

    it('should display legend', () => {
      assert.ok(componentCode.includes('className="token-model-legend"'));
    });

    it('should display legend items', () => {
      assert.ok(componentCode.includes('className="token-model-legend-item"'));
      assert.ok(componentCode.includes('className="token-model-legend-color"'));
      assert.ok(componentCode.includes('className="token-model-legend-name"'));
      assert.ok(componentCode.includes('className="token-model-legend-value"'));
    });

    it('should show model name in legend', () => {
      assert.ok(componentCode.includes('{modelData.model}'));
    });

    it('should show formatted value and percentage in legend', () => {
      assert.ok(componentCode.includes('{formatNumber(modelData.total)} ({percentage.toFixed(1)}%)'));
    });

    it('should use model color for legend indicator', () => {
      const colorMatches = componentCode.match(/backgroundColor: getModelColor\(modelData\.model\)/g);
      assert.ok(colorMatches && colorMatches.length >= 2, 'Should use model color in legend');
    });
  });

  describe('CSS Styles', () => {
    it('should define token-usage container styles', () => {
      assert.ok(cssCode.includes('.token-usage'));
      assert.ok(cssCode.includes('display: flex'));
      assert.ok(cssCode.includes('flex-direction: column'));
    });

    it('should define empty state styles', () => {
      assert.ok(cssCode.includes('.token-usage-empty'));
    });

    it('should define total tokens styles', () => {
      assert.ok(cssCode.includes('.token-total'));
      assert.ok(cssCode.includes('.token-total-label'));
      assert.ok(cssCode.includes('.token-total-number'));
      assert.ok(cssCode.includes('.token-total-exact'));
    });

    it('should animate total number with pulse', () => {
      assert.ok(cssCode.includes('animation: pulse-count'));
      assert.ok(cssCode.includes('@keyframes pulse-count'));
      assert.ok(cssCode.includes('transform: scale(1.05)'));
    });

    it('should define section styles', () => {
      assert.ok(cssCode.includes('.token-section'));
      assert.ok(cssCode.includes('.token-section-title'));
    });

    it('should define agent bar styles', () => {
      assert.ok(cssCode.includes('.token-agent-bars'));
      assert.ok(cssCode.includes('.token-agent-bar'));
      assert.ok(cssCode.includes('.token-agent-info'));
      assert.ok(cssCode.includes('.token-agent-name'));
      assert.ok(cssCode.includes('.token-agent-total'));
    });

    it('should define bar container and bar styles', () => {
      assert.ok(cssCode.includes('.token-bar-container'));
      assert.ok(cssCode.includes('.token-bar'));
      assert.ok(cssCode.includes('.token-bar-input'));
    });

    it('should use CSS transitions for smooth updates', () => {
      assert.ok(cssCode.includes('transition: width 0.3s ease-out'));
    });

    it('should use gradient for token bar', () => {
      assert.ok(cssCode.includes('background: linear-gradient'));
    });

    it('should define model chart styles', () => {
      assert.ok(cssCode.includes('.token-model-chart'));
      assert.ok(cssCode.includes('.token-model-bar-container'));
      assert.ok(cssCode.includes('.token-model-segment'));
    });

    it('should define legend styles', () => {
      assert.ok(cssCode.includes('.token-model-legend'));
      assert.ok(cssCode.includes('.token-model-legend-item'));
      assert.ok(cssCode.includes('.token-model-legend-color'));
      assert.ok(cssCode.includes('.token-model-legend-name'));
      assert.ok(cssCode.includes('.token-model-legend-value'));
    });

    it('should have hover effects', () => {
      const hoverMatches = cssCode.match(/:hover/g);
      assert.ok(hoverMatches && hoverMatches.length >= 3, 'Should have multiple hover effects');
    });

    it('should be responsive with media query', () => {
      assert.ok(cssCode.includes('@media (max-width: 640px)'));
    });

    it('should reduce font sizes on mobile', () => {
      const mobileSection = cssCode.split('@media (max-width: 640px)')[1];
      assert.ok(mobileSection.includes('.token-total-number'));
      assert.ok(mobileSection.includes('font-size: 2.5rem'));
    });

    it('should reduce bar heights on mobile', () => {
      const mobileSection = cssCode.split('@media (max-width: 640px)')[1];
      assert.ok(mobileSection.includes('.token-bar-container'));
      assert.ok(mobileSection.includes('height: 20px'));
    });

    it('should use CSS custom properties for colors', () => {
      assert.ok(cssCode.includes('var(--color-primary)'));
      assert.ok(cssCode.includes('var(--color-text-secondary)'));
      assert.ok(cssCode.includes('var(--spacing-'));
      assert.ok(cssCode.includes('var(--border-radius-'));
    });

    it('should use glass-morphism effect', () => {
      assert.ok(cssCode.includes('rgba(255, 255, 255, 0.0'));
    });
  });

  describe('Accessibility', () => {
    it('should use semantic HTML elements', () => {
      assert.ok(componentCode.includes('<h3'));
    });

    it('should provide title tooltips for data visualization', () => {
      const titleMatches = componentCode.match(/title=/g);
      assert.ok(titleMatches && titleMatches.length >= 2, 'Should have tooltips for bars and segments');
    });

    it('should handle text overflow gracefully', () => {
      assert.ok(cssCode.includes('text-overflow: ellipsis'));
      assert.ok(cssCode.includes('overflow: hidden'));
      assert.ok(cssCode.includes('white-space: nowrap'));
    });
  });

  describe('Performance', () => {
    it('should use Map for efficient model token aggregation', () => {
      assert.ok(componentCode.includes('new Map<string, number>()'));
      assert.ok(componentCode.includes('modelTokensMap.get'));
      assert.ok(componentCode.includes('modelTokensMap.set'));
    });

    it('should sort data once, not in render loop', () => {
      const sortMatches = componentCode.match(/\.sort\(/g);
      // Should have exactly 2 sorts: one for agents, one for models
      assert.ok(sortMatches && sortMatches.length === 2, 'Should have exactly 2 sort operations');
    });

    it('should use CSS transitions instead of JS animations', () => {
      assert.ok(cssCode.includes('transition:'));
    });
  });
});
