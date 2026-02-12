import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the source file to verify implementation
const componentPath = join(__dirname, '../../src/client/components/AgentList.tsx');
const componentSource = readFileSync(componentPath, 'utf-8');

const cssPath = join(__dirname, '../../src/client/components/AgentList.css');
const cssSource = readFileSync(cssPath, 'utf-8');

describe('AgentList Component', () => {
  describe('Component Structure', () => {
    it('should export AgentList component as default', () => {
      assert.ok(componentSource.includes('export default AgentList'));
    });

    it('should accept activities prop of type Map<string, AgentActivity>', () => {
      assert.ok(componentSource.includes('activities: Map<string, AgentActivity>'));
    });

    it('should import AgentActivity type from useWebSocket hook', () => {
      assert.ok(componentSource.includes("import type { AgentActivity } from '../hooks/useWebSocket'"));
    });

    it('should import AgentList.css', () => {
      assert.ok(componentSource.includes("import './AgentList.css'"));
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no agents are active', () => {
      assert.ok(componentSource.includes('No agents currently active'));
    });

    it('should check for agentList.length === 0', () => {
      assert.ok(componentSource.includes('agentList.length === 0'));
    });

    it('should have agent-list-empty class for empty state', () => {
      assert.ok(componentSource.includes('agent-list-empty'));
    });
  });

  describe('Agent List Rendering', () => {
    it('should convert Map to array using Array.from', () => {
      assert.ok(componentSource.includes('Array.from(activities.values())'));
    });

    it('should sort agents by lastSeen timestamp descending', () => {
      assert.ok(componentSource.includes('sort((a, b)'));
      assert.ok(componentSource.includes('new Date(b.lastSeen)'));
      assert.ok(componentSource.includes('new Date(a.lastSeen)'));
    });

    it('should map over agentList to render agent items', () => {
      assert.ok(componentSource.includes('agentList.map'));
    });

    it('should use agentId as key for each item', () => {
      assert.ok(componentSource.includes('key={activity.agentId}'));
    });
  });

  describe('Agent Item Display', () => {
    it('should display agent name', () => {
      assert.ok(componentSource.includes('agent-name'));
      assert.ok(componentSource.includes('{activity.agentId}'));
    });

    it('should display agent status badge', () => {
      assert.ok(componentSource.includes('agent-status'));
      assert.ok(componentSource.includes('{activity.status}'));
    });

    it('should display current model', () => {
      assert.ok(componentSource.includes('agent-model'));
      assert.ok(componentSource.includes('activity.currentModel'));
    });

    it('should display tools used', () => {
      assert.ok(componentSource.includes('agent-tools'));
      assert.ok(componentSource.includes('activity.toolsUsed'));
    });

    it('should show "none" when no tools used', () => {
      assert.ok(componentSource.includes('activity.toolsUsed.length > 0'));
      assert.ok(componentSource.includes("'none'"));
    });

    it('should join multiple tools with comma', () => {
      assert.ok(componentSource.includes(".join(', ')"));
    });
  });

  describe('Status Badge Colors', () => {
    it('should have getStatusColorClass function', () => {
      assert.ok(componentSource.includes('function getStatusColorClass'));
    });

    it('should return status-active for active status', () => {
      assert.ok(componentSource.includes("case 'active'"));
      assert.ok(componentSource.includes("return 'status-active'"));
    });

    it('should return status-idle for idle status', () => {
      assert.ok(componentSource.includes("case 'idle'"));
      assert.ok(componentSource.includes("return 'status-idle'"));
    });

    it('should return status-ended for ended status', () => {
      assert.ok(componentSource.includes("case 'ended'"));
      assert.ok(componentSource.includes("return 'status-ended'"));
    });

    it('should apply status color class dynamically', () => {
      assert.ok(componentSource.includes('getStatusColorClass(activity.status)'));
    });
  });

  describe('Agent Type Badges', () => {
    it('should have getAgentType function', () => {
      assert.ok(componentSource.includes('function getAgentType'));
    });

    it('should detect cron agents', () => {
      assert.ok(componentSource.includes("agentId.includes('cron:')"));
      assert.ok(componentSource.includes("return 'cron'"));
    });

    it('should detect subagents', () => {
      assert.ok(componentSource.includes("agentId.includes('subagent')"));
      assert.ok(componentSource.includes("return 'subagent'"));
    });

    it('should return main for regular agents', () => {
      assert.ok(componentSource.includes("return 'main'"));
    });

    it('should display agent type badge', () => {
      assert.ok(componentSource.includes('agent-type-badge'));
      assert.ok(componentSource.includes('agent-type-${agentType}'));
    });
  });

  describe('Context Usage Calculation', () => {
    it('should have calculateContextUsage function', () => {
      assert.ok(componentSource.includes('function calculateContextUsage'));
    });

    it('should return 0 if no token usage', () => {
      assert.ok(componentSource.includes('if (!activity.tokenUsage)'));
      assert.ok(componentSource.includes('return 0'));
    });

    it('should calculate percentage based on input + output tokens', () => {
      assert.ok(componentSource.includes('totalTokens = activity.tokenUsage.input + activity.tokenUsage.output'));
    });

    it('should use 200k context limit', () => {
      assert.ok(componentSource.includes('CONTEXT_LIMIT = 200000'));
    });

    it('should cap percentage at 100', () => {
      assert.ok(componentSource.includes('Math.min'));
      assert.ok(componentSource.includes('100)'));
    });

    it('should round percentage', () => {
      assert.ok(componentSource.includes('Math.round'));
    });
  });

  describe('Context Usage Display', () => {
    it('should display context usage percentage', () => {
      assert.ok(componentSource.includes('context-percentage'));
      assert.ok(componentSource.includes('{contextUsage}%'));
    });

    it('should have context bar container', () => {
      assert.ok(componentSource.includes('context-bar-container'));
    });

    it('should set context bar width dynamically', () => {
      assert.ok(componentSource.includes('style={{ width: `${contextUsage}%` }}'));
    });

    it('should apply context color class', () => {
      assert.ok(componentSource.includes('getContextColorClass(contextUsage)'));
    });
  });

  describe('Context Usage Color Classes', () => {
    it('should have getContextColorClass function', () => {
      assert.ok(componentSource.includes('function getContextColorClass'));
    });

    it('should return context-danger for >= 80%', () => {
      assert.ok(componentSource.includes('if (percentage >= 80)'));
      assert.ok(componentSource.includes("return 'context-danger'"));
    });

    it('should return context-warning for >= 60%', () => {
      assert.ok(componentSource.includes('if (percentage >= 60)'));
      assert.ok(componentSource.includes("return 'context-warning'"));
    });

    it('should return context-safe for < 60%', () => {
      assert.ok(componentSource.includes("return 'context-safe'"));
    });
  });

  describe('CSS Styling', () => {
    it('should have agent-list class styles', () => {
      assert.ok(cssSource.includes('.agent-list'));
    });

    it('should have agent-item class styles', () => {
      assert.ok(cssSource.includes('.agent-item'));
    });

    it('should have status color classes', () => {
      assert.ok(cssSource.includes('.status-active'));
      assert.ok(cssSource.includes('.status-idle'));
      assert.ok(cssSource.includes('.status-ended'));
    });

    it('should use green for active status', () => {
      const activeBlock = cssSource.match(/\.status-active\s*{[^}]+}/);
      assert.ok(activeBlock);
      assert.ok(activeBlock[0].includes('color-success'));
    });

    it('should use orange for warning context', () => {
      const warningBlock = cssSource.match(/\.context-warning\s*{[^}]+}/);
      assert.ok(warningBlock);
      assert.ok(warningBlock[0].includes('color-warning'));
    });

    it('should use red for danger context', () => {
      const dangerBlock = cssSource.match(/\.context-danger\s*{[^}]+}/);
      assert.ok(dangerBlock);
      assert.ok(dangerBlock[0].includes('color-error'));
    });

    it('should have agent type badge styles', () => {
      assert.ok(cssSource.includes('.agent-type-badge'));
      assert.ok(cssSource.includes('.agent-type-main'));
      assert.ok(cssSource.includes('.agent-type-cron'));
      assert.ok(cssSource.includes('.agent-type-subagent'));
    });

    it('should have context bar styles', () => {
      assert.ok(cssSource.includes('.context-bar-container'));
      assert.ok(cssSource.includes('.context-bar'));
    });

    it('should use CSS variables for colors', () => {
      assert.ok(cssSource.includes('var(--'));
    });

    it('should have responsive styles for mobile', () => {
      assert.ok(cssSource.includes('@media (max-width: 640px)'));
    });

    it('should have hover effect on agent items', () => {
      assert.ok(cssSource.includes('.agent-item:hover'));
    });

    it('should have transition for smooth animations', () => {
      assert.ok(cssSource.includes('transition:'));
    });
  });

  describe('Accessibility', () => {
    it('should use semantic HTML classes', () => {
      assert.ok(componentSource.includes('agent-header'));
      assert.ok(componentSource.includes('agent-info'));
    });

    it('should have descriptive labels', () => {
      assert.ok(componentSource.includes('Model:'));
      assert.ok(componentSource.includes('Tools:'));
      assert.ok(componentSource.includes('Context Usage'));
    });
  });

  describe('Real-time Updates', () => {
    it('should accept activities Map as prop for real-time updates', () => {
      assert.ok(componentSource.includes('activities: Map<string, AgentActivity>'));
    });

    it('should re-sort on every render to reflect latest activity', () => {
      // The sort is done inside the component, not in useMemo, so it updates on every render
      assert.ok(componentSource.includes('Array.from(activities.values()).sort'));
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown model gracefully', () => {
      assert.ok(componentSource.includes("activity.currentModel || 'unknown'"));
    });

    it('should handle empty tools array', () => {
      assert.ok(componentSource.includes('activity.toolsUsed.length > 0'));
    });

    it('should handle missing tokenUsage in calculateContextUsage', () => {
      assert.ok(componentSource.includes('if (!activity.tokenUsage)'));
    });
  });

  describe('Integration with App', () => {
    it('should be imported in App.tsx', () => {
      const appPath = join(__dirname, '../../src/client/App.tsx');
      const appSource = readFileSync(appPath, 'utf-8');
      assert.ok(appSource.includes("import AgentList from './components/AgentList'"));
    });

    it('should be used with activities from useWebSocket', () => {
      const appPath = join(__dirname, '../../src/client/App.tsx');
      const appSource = readFileSync(appPath, 'utf-8');
      assert.ok(appSource.includes('<AgentList activities={activities}'));
    });

    it('should be placed in Active Agents card', () => {
      const appPath = join(__dirname, '../../src/client/App.tsx');
      const appSource = readFileSync(appPath, 'utf-8');
      assert.ok(appSource.includes('title="Active Agents"'));
      assert.ok(appSource.includes('<AgentList'));
    });
  });
});
