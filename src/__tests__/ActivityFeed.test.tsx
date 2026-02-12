import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

describe('ActivityFeed Component', () => {
  const componentPath = path.join(process.cwd(), 'src/client/components/ActivityFeed.tsx');
  const cssPath = path.join(process.cwd(), 'src/client/components/ActivityFeed.css');

  test('component file exists', async () => {
    const exists = await fs.access(componentPath).then(() => true).catch(() => false);
    assert.ok(exists, 'ActivityFeed.tsx should exist');
  });

  test('CSS file exists', async () => {
    const exists = await fs.access(cssPath).then(() => true).catch(() => false);
    assert.ok(exists, 'ActivityFeed.css should exist');
  });

  test('component exports default function', async () => {
    const source = await fs.readFile(componentPath, 'utf-8');
    assert.ok(source.includes('export default function ActivityFeed'), 'Should export default function ActivityFeed');
  });

  test('component accepts events prop', async () => {
    const source = await fs.readFile(componentPath, 'utf-8');
    assert.ok(source.includes('events: AgentEvent[]'), 'Should accept events prop of type AgentEvent[]');
  });

  test('component imports AgentEvent type', async () => {
    const source = await fs.readFile(componentPath, 'utf-8');
    assert.ok(source.includes("import type { AgentEvent } from '../hooks/useWebSocket'"), 'Should import AgentEvent type');
  });

  test('component imports CSS file', async () => {
    const source = await fs.readFile(componentPath, 'utf-8');
    assert.ok(source.includes("import './ActivityFeed.css'"), 'Should import ActivityFeed.css');
  });

  describe('Event Display', () => {
    test('displays events in chronological order (newest first)', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('reverse()'), 'Should reverse events to show newest first');
    });

    test('shows timestamp for each event', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('event-timestamp'), 'Should display event timestamp');
    });

    test('shows agent name for each event', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('event-agent'), 'Should display agent name');
    });

    test('shows event type for each event', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('event-type'), 'Should display event type');
    });

    test('shows event details for each event', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('event-details'), 'Should display event details');
    });
  });

  describe('Event Type Colors', () => {
    test('has color class for tool_called events', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes("'tool_called'"), 'Should handle tool_called event type');
      assert.ok(source.includes("'event-tool'"), 'Should have event-tool color class');
    });

    test('has color class for model_switched events', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes("'model_switched'"), 'Should handle model_switched event type');
      assert.ok(source.includes("'event-model'"), 'Should have event-model color class');
    });

    test('has color class for agent_started events', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes("'agent_started'"), 'Should handle agent_started event type');
      assert.ok(source.includes("'event-agent-start'"), 'Should have event-agent-start color class');
    });

    test('has color class for agent_ended events', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes("'agent_ended'"), 'Should handle agent_ended event type');
      assert.ok(source.includes("'event-agent-end'"), 'Should have event-agent-end color class');
    });

    test('CSS has blue color for tool events', async () => {
      const css = await fs.readFile(cssPath, 'utf-8');
      assert.ok(css.includes('.event-tool'), 'Should have .event-tool class');
      assert.ok(css.includes('var(--color-accent)'), 'Should use accent color (blue) for tools');
    });

    test('CSS has purple color for model events', async () => {
      const css = await fs.readFile(cssPath, 'utf-8');
      assert.ok(css.includes('.event-model'), 'Should have .event-model class');
      assert.ok(css.includes('#a855f7') || css.includes('purple'), 'Should use purple color for models');
    });

    test('CSS has green color for agent_started events', async () => {
      const css = await fs.readFile(cssPath, 'utf-8');
      assert.ok(css.includes('.event-agent-start'), 'Should have .event-agent-start class');
      assert.ok(css.includes('var(--color-success)'), 'Should use success color (green) for agent start');
    });

    test('CSS has red color for agent_ended events', async () => {
      const css = await fs.readFile(cssPath, 'utf-8');
      assert.ok(css.includes('.event-agent-end'), 'Should have .event-agent-end class');
      assert.ok(css.includes('#ef4444') || css.includes('red'), 'Should use red color for agent end');
    });
  });

  describe('Relative Timestamps', () => {
    test('has formatRelativeTime function', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('function formatRelativeTime'), 'Should have formatRelativeTime function');
    });

    test('formatRelativeTime handles seconds', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('s ago'), 'Should format seconds as "Xs ago"');
    });

    test('formatRelativeTime handles minutes', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('m ago'), 'Should format minutes as "Xm ago"');
    });

    test('formatRelativeTime handles hours', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('h ago'), 'Should format hours as "Xh ago"');
    });

    test('formatRelativeTime handles days', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('d ago'), 'Should format days as "Xd ago"');
    });
  });

  describe('Auto-scroll Behavior', () => {
    test('implements auto-scroll to newest events', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('scrollTop') && source.includes('scrollHeight'), 'Should implement scroll behavior');
    });

    test('uses useRef for feed container', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('useRef'), 'Should use useRef for DOM reference');
      assert.ok(source.includes('feedRef'), 'Should have feedRef');
    });

    test('tracks user scroll state', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('userScrolled'), 'Should track userScrolled state');
    });

    test('pauses auto-scroll when user scrolls up', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('setUserScrolled'), 'Should update userScrolled state');
    });

    test('has onScroll handler', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('onScroll'), 'Should have onScroll handler');
      assert.ok(source.includes('handleScroll'), 'Should have handleScroll function');
    });

    test('uses useEffect to auto-scroll on new events', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('useEffect'), 'Should use useEffect for auto-scroll');
    });
  });

  describe('Event Limit', () => {
    test('limits feed to 100 events', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('100'), 'Should reference 100 event limit');
      assert.ok(source.includes('slice'), 'Should use slice to limit events');
    });

    test('displays only last 100 events', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('slice(0, 100)'), 'Should slice to first 100 events from reversed array');
    });
  });

  describe('Empty State', () => {
    test('shows empty state when no events', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('activity-feed-empty'), 'Should have empty state class');
    });

    test('empty state displays message', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('No activity yet') || source.includes('No events'), 'Should show empty message');
    });

    test('CSS styles empty state', async () => {
      const css = await fs.readFile(cssPath, 'utf-8');
      assert.ok(css.includes('.activity-feed-empty'), 'Should style empty state');
    });
  });

  describe('Event Details Function', () => {
    test('has getEventDetails function', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('function getEventDetails'), 'Should have getEventDetails function');
    });

    test('displays tool name for tool_called events', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.match(/case 'tool_called':[\s\S]*?Tool:/), 'Should display tool name for tool_called');
    });

    test('displays model name for model_switched events', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.match(/case 'model_switched':[\s\S]*?Model:/), 'Should display model name for model_switched');
    });

    test('displays "Agent started" for agent_started events', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.match(/case 'agent_started':[\s\S]*?Agent started/), 'Should display "Agent started"');
    });

    test('displays "Agent ended" for agent_ended events', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.match(/case 'agent_ended':[\s\S]*?Agent ended/), 'Should display "Agent ended"');
    });

    test('handles token_update events', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes("case 'token_update':"), 'Should handle token_update events');
    });
  });

  describe('CSS Styling', () => {
    test('has activity-feed container class', async () => {
      const css = await fs.readFile(cssPath, 'utf-8');
      assert.ok(css.includes('.activity-feed'), 'Should have .activity-feed class');
    });

    test('has scrollable overflow', async () => {
      const css = await fs.readFile(cssPath, 'utf-8');
      assert.ok(css.includes('overflow-y: auto') || css.includes('overflow: auto'), 'Should have scrollable overflow');
    });

    test('has max-height constraint', async () => {
      const css = await fs.readFile(cssPath, 'utf-8');
      assert.ok(css.includes('max-height'), 'Should have max-height constraint');
    });

    test('has activity-event class', async () => {
      const css = await fs.readFile(cssPath, 'utf-8');
      assert.ok(css.includes('.activity-event'), 'Should have .activity-event class');
    });

    test('has hover effect on events', async () => {
      const css = await fs.readFile(cssPath, 'utf-8');
      assert.ok(css.includes('.activity-event:hover'), 'Should have hover effect');
    });

    test('uses border-left for color coding', async () => {
      const css = await fs.readFile(cssPath, 'utf-8');
      assert.ok(css.includes('border-left'), 'Should use border-left for color coding');
    });

    test('has event-header layout', async () => {
      const css = await fs.readFile(cssPath, 'utf-8');
      assert.ok(css.includes('.event-header'), 'Should style event header');
    });

    test('has event-details layout', async () => {
      const css = await fs.readFile(cssPath, 'utf-8');
      assert.ok(css.includes('.event-details'), 'Should style event details');
    });
  });

  describe('Responsive Design', () => {
    test('has mobile media query', async () => {
      const css = await fs.readFile(cssPath, 'utf-8');
      assert.ok(css.includes('@media') && css.includes('640px'), 'Should have mobile media query');
    });

    test('adjusts padding on mobile', async () => {
      const css = await fs.readFile(cssPath, 'utf-8');
      const mobileSection = css.substring(css.indexOf('@media (max-width: 640px)'));
      assert.ok(mobileSection.includes('padding'), 'Should adjust padding on mobile');
    });

    test('adjusts max-height on mobile', async () => {
      const css = await fs.readFile(cssPath, 'utf-8');
      const mobileSection = css.substring(css.indexOf('@media (max-width: 640px)'));
      assert.ok(mobileSection.includes('max-height'), 'Should adjust max-height on mobile');
    });
  });

  describe('Scroll Indicator', () => {
    test('shows scroll indicator when user scrolled', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('scroll-indicator'), 'Should have scroll indicator');
      assert.ok(source.includes('userScrolled &&'), 'Should show indicator conditionally');
    });

    test('CSS styles scroll indicator', async () => {
      const css = await fs.readFile(cssPath, 'utf-8');
      assert.ok(css.includes('.scroll-indicator'), 'Should style scroll indicator');
    });

    test('scroll indicator is sticky', async () => {
      const css = await fs.readFile(cssPath, 'utf-8');
      const indicatorSection = css.substring(css.indexOf('.scroll-indicator'));
      assert.ok(indicatorSection.includes('position: sticky') || indicatorSection.includes('position:sticky'), 'Should be sticky positioned');
    });
  });

  describe('Type Safety', () => {
    test('uses React.ReactElement return type', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('React.ReactElement'), 'Should return React.ReactElement');
    });

    test('has ActivityFeedProps interface', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('interface ActivityFeedProps') || source.includes('type ActivityFeedProps'), 'Should define props interface');
    });

    test('imports React', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes("import React"), 'Should import React');
    });

    test('imports useState', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('useState'), 'Should import useState');
    });

    test('imports useEffect', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('useEffect'), 'Should import useEffect');
    });

    test('imports useRef', async () => {
      const source = await fs.readFile(componentPath, 'utf-8');
      assert.ok(source.includes('useRef'), 'Should import useRef');
    });
  });

  describe('Integration with App', () => {
    test('App.tsx imports ActivityFeed', async () => {
      const appPath = path.join(process.cwd(), 'src/client/App.tsx');
      const app = await fs.readFile(appPath, 'utf-8');
      assert.ok(app.includes("import ActivityFeed from './components/ActivityFeed'"), 'App should import ActivityFeed');
    });

    test('App.tsx uses events from useWebSocket', async () => {
      const appPath = path.join(process.cwd(), 'src/client/App.tsx');
      const app = await fs.readFile(appPath, 'utf-8');
      assert.ok(app.includes('events'), 'App should destructure events from useWebSocket');
    });

    test('App.tsx renders ActivityFeed component', async () => {
      const appPath = path.join(process.cwd(), 'src/client/App.tsx');
      const app = await fs.readFile(appPath, 'utf-8');
      assert.ok(app.includes('<ActivityFeed'), 'App should render ActivityFeed');
    });

    test('App.tsx passes events prop to ActivityFeed', async () => {
      const appPath = path.join(process.cwd(), 'src/client/App.tsx');
      const app = await fs.readFile(appPath, 'utf-8');
      assert.ok(app.includes('events={events}'), 'App should pass events prop');
    });
  });
});
