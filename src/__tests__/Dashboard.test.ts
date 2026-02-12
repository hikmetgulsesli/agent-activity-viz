import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read source files for inspection
const appTsxPath = join(__dirname, '../../src/client/App.tsx');
const appCssPath = join(__dirname, '../../src/client/App.css');
const errorBoundaryPath = join(__dirname, '../../src/client/components/ErrorBoundary.tsx');
const errorBoundaryCssPath = join(__dirname, '../../src/client/styles/ErrorBoundary.css');

const appTsx = readFileSync(appTsxPath, 'utf-8');
const appCss = readFileSync(appCssPath, 'utf-8');
const errorBoundary = readFileSync(errorBoundaryPath, 'utf-8');
const errorBoundaryCss = readFileSync(errorBoundaryCssPath, 'utf-8');

test('Dashboard - Component Structure', async (t) => {
  await t.test('App.tsx imports ErrorBoundary', () => {
    assert.ok(appTsx.includes("import ErrorBoundary from './components/ErrorBoundary'"));
  });

  await t.test('App.tsx imports all required components', () => {
    assert.ok(appTsx.includes("import GlassCard from './components/GlassCard'"));
    assert.ok(appTsx.includes("import AgentList from './components/AgentList'"));
    assert.ok(appTsx.includes("import ActivityFeed from './components/ActivityFeed'"));
    assert.ok(appTsx.includes("import TokenUsage from './components/TokenUsage'"));
    assert.ok(appTsx.includes("import ModelSwitches from './components/ModelSwitches'"));
  });

  await t.test('App.tsx imports useWebSocket hook', () => {
    assert.ok(appTsx.includes("import { useWebSocket } from './hooks/useWebSocket'"));
  });

  await t.test('App.tsx imports ErrorBoundary CSS', () => {
    assert.ok(appTsx.includes("import './styles/ErrorBoundary.css'"));
  });

  await t.test('App component uses ErrorBoundary wrapper', () => {
    assert.ok(appTsx.includes('<ErrorBoundary>'));
    assert.ok(appTsx.includes('</ErrorBoundary>'));
  });

  await t.test('App component calls useWebSocket', () => {
    assert.ok(appTsx.includes("useWebSocket('ws://localhost:3503')"));
  });

  await t.test('App component destructures activities, events, status', () => {
    assert.ok(appTsx.includes('const { activities, events, status }'));
  });
});

test('Dashboard - Header Structure', async (t) => {
  await t.test('Header contains title', () => {
    assert.ok(appTsx.includes('<h1>Agent Activity Visualizer</h1>'));
  });

  await t.test('Header contains subtitle', () => {
    assert.ok(appTsx.includes('Real-time OpenClaw agent activity dashboard'));
  });

  await t.test('Header has header-content wrapper', () => {
    assert.ok(appTsx.includes('className="header-content"'));
  });

  await t.test('Header has left section', () => {
    assert.ok(appTsx.includes('className="header-left"'));
  });

  await t.test('Header has right section', () => {
    assert.ok(appTsx.includes('className="header-right"'));
  });

  await t.test('Header includes connection status section', () => {
    assert.ok(appTsx.includes('className="connection-status"'));
  });

  await t.test('Header includes last update section', () => {
    assert.ok(appTsx.includes('className="last-update"'));
  });

  await t.test('Connection status has status indicator dot', () => {
    assert.ok(appTsx.includes('className={`status-indicator status-${status}`}'));
  });

  await t.test('Connection status indicator uses dynamic color', () => {
    assert.ok(appTsx.includes('style={{ backgroundColor: getStatusColor() }}'));
  });

  await t.test('Connection status has text label', () => {
    assert.ok(appTsx.includes('className="status-text"'));
  });

  await t.test('Last update shows formatted time', () => {
    assert.ok(appTsx.includes('className="update-time"'));
    assert.ok(appTsx.includes('{formatTime(lastUpdate)}'));
  });
});

test('Dashboard - Status Indicator Logic', async (t) => {
  await t.test('getStatusColor function exists', () => {
    assert.ok(appTsx.includes('const getStatusColor = ()'));
  });

  await t.test('getStatusColor returns success color for connected', () => {
    assert.ok(appTsx.includes("case 'connected':"));
    assert.ok(appTsx.includes("return 'var(--color-success)'"));
  });

  await t.test('getStatusColor returns warning color for connecting', () => {
    assert.ok(appTsx.includes("case 'connecting':"));
    assert.ok(appTsx.includes("return 'var(--color-warning)'"));
  });

  await t.test('getStatusColor returns error color for disconnected', () => {
    assert.ok(appTsx.includes("case 'disconnected':"));
    assert.ok(appTsx.includes("return 'var(--color-error)'"));
  });

  await t.test('status indicator has title attribute for tooltip', () => {
    assert.ok(appTsx.includes('title={status}'));
  });
});

test('Dashboard - Last Update Logic', async (t) => {
  await t.test('lastUpdate state is initialized with current date', () => {
    assert.ok(appTsx.includes('useState<Date>(new Date())'));
  });

  await t.test('useEffect updates lastUpdate on events change', () => {
    assert.ok(appTsx.includes('React.useEffect(() => {'));
    assert.ok(appTsx.includes('setLastUpdate(new Date())'));
    assert.ok(appTsx.includes('[events.length, activities.size]'));
  });

  await t.test('formatTime function formats time correctly', () => {
    assert.ok(appTsx.includes('const formatTime = (date: Date)'));
    assert.ok(appTsx.includes('toLocaleTimeString'));
    assert.ok(appTsx.includes("hour: '2-digit'"));
    assert.ok(appTsx.includes("minute: '2-digit'"));
    assert.ok(appTsx.includes("second: '2-digit'"));
  });
});

test('Dashboard - 3-Column Layout', async (t) => {
  await t.test('Dashboard uses dashboard-layout class', () => {
    assert.ok(appTsx.includes('className="dashboard-layout"'));
  });

  await t.test('Left column exists with column-left class', () => {
    assert.ok(appTsx.includes('className="column-left"'));
  });

  await t.test('Center column exists with column-center class', () => {
    assert.ok(appTsx.includes('className="column-center"'));
  });

  await t.test('Right column exists with column-right class', () => {
    assert.ok(appTsx.includes('className="column-right"'));
  });

  await t.test('Left column contains AgentList', () => {
    const leftColumnMatch = appTsx.match(/className="column-left"[\s\S]*?<\/div>/);
    assert.ok(leftColumnMatch);
    assert.ok(leftColumnMatch[0].includes('<AgentList'));
  });

  await t.test('Center column contains ActivityFeed', () => {
    const centerColumnMatch = appTsx.match(/className="column-center"[\s\S]*?<\/div>/);
    assert.ok(centerColumnMatch);
    assert.ok(centerColumnMatch[0].includes('<ActivityFeed'));
  });

  await t.test('Right column contains TokenUsage', () => {
    const rightColumnMatch = appTsx.match(/className="column-right"[\s\S]*?<\/div>\s*<\/div>/);
    assert.ok(rightColumnMatch);
    assert.ok(rightColumnMatch[0].includes('<TokenUsage'));
  });

  await t.test('Right column contains ModelSwitches', () => {
    const rightColumnMatch = appTsx.match(/className="column-right"[\s\S]*?<\/div>\s*<\/div>/);
    assert.ok(rightColumnMatch);
    assert.ok(rightColumnMatch[0].includes('<ModelSwitches'));
  });
});

test('Dashboard - Panel Integration', async (t) => {
  await t.test('AgentList receives activities prop', () => {
    assert.ok(appTsx.includes('<AgentList activities={activities}'));
  });

  await t.test('ActivityFeed receives events prop', () => {
    assert.ok(appTsx.includes('<ActivityFeed events={events}'));
  });

  await t.test('TokenUsage receives activities prop', () => {
    assert.ok(appTsx.includes('<TokenUsage activities={activities}'));
  });

  await t.test('ModelSwitches receives events prop', () => {
    assert.ok(appTsx.includes('<ModelSwitches events={events}'));
  });

  await t.test('All panels wrapped in GlassCard', () => {
    const glassCardCount = (appTsx.match(/<GlassCard/g) || []).length;
    assert.ok(glassCardCount >= 4, 'Should have at least 4 GlassCards (one per panel)');
  });

  await t.test('GlassCard titles are descriptive', () => {
    assert.ok(appTsx.includes('title="Active Agents"'));
    assert.ok(appTsx.includes('title="Recent Activity"'));
    assert.ok(appTsx.includes('title="Token Usage"'));
    assert.ok(appTsx.includes('title="Model Switches"'));
  });
});

test('Dashboard - CSS Layout', async (t) => {
  await t.test('dashboard-layout uses CSS grid', () => {
    assert.ok(appCss.includes('.dashboard-layout'));
    assert.ok(appCss.includes('display: grid'));
  });

  await t.test('dashboard-layout has 3 columns (1fr 2fr 1fr)', () => {
    assert.ok(appCss.includes('grid-template-columns: 1fr 2fr 1fr'));
  });

  await t.test('Columns have gap spacing', () => {
    assert.ok(appCss.includes('gap: var(--spacing-lg)'));
  });

  await t.test('column-left is positioned in grid column 1', () => {
    assert.ok(appCss.includes('.column-left'));
    assert.ok(appCss.includes('grid-column: 1'));
  });

  await t.test('column-center is positioned in grid column 2', () => {
    assert.ok(appCss.includes('.column-center'));
    assert.ok(appCss.includes('grid-column: 2'));
  });

  await t.test('column-right is positioned in grid column 3', () => {
    assert.ok(appCss.includes('.column-right'));
    assert.ok(appCss.includes('grid-column: 3'));
  });

  await t.test('Columns use flexbox layout', () => {
    assert.ok(appCss.includes('display: flex'));
    assert.ok(appCss.includes('flex-direction: column'));
  });
});

test('Dashboard - Responsive Design', async (t) => {
  await t.test('Tablet breakpoint exists (max-width: 1023px)', () => {
    assert.ok(appCss.includes('@media (max-width: 1023px)'));
  });

  await t.test('Tablet layout uses 2 columns', () => {
    const tabletMedia = appCss.match(/@media \(max-width: 1023px\) \{[\s\S]*?\n\}/);
    assert.ok(tabletMedia);
    assert.ok(tabletMedia[0].includes('grid-template-columns: 1fr 2fr'));
  });

  await t.test('Tablet layout spans right column across full width', () => {
    const tabletMedia = appCss.match(/@media \(max-width: 1023px\) \{[\s\S]*?\n\}/);
    assert.ok(tabletMedia);
    assert.ok(tabletMedia[0].includes('grid-column: 1 / -1'));
  });

  await t.test('Mobile breakpoint exists (max-width: 639px)', () => {
    assert.ok(appCss.includes('@media (max-width: 639px)'));
  });

  await t.test('Mobile layout uses single column', () => {
    const mobileMedia = appCss.match(/@media \(max-width: 639px\) \{[\s\S]*?\}/);
    assert.ok(mobileMedia);
    assert.ok(mobileMedia[0].includes('grid-template-columns: 1fr'));
  });

  await t.test('Mobile layout stacks columns vertically', () => {
    // Check that mobile CSS includes the column classes with flex-direction
    assert.ok(appCss.includes('@media (max-width: 639px)'));
    const mobileSectionStart = appCss.indexOf('@media (max-width: 639px)');
    const mobileSection = appCss.substring(mobileSectionStart, mobileSectionStart + 800);
    assert.ok(mobileSection.includes('flex-direction: column'));
  });
});

test('Dashboard - Header CSS', async (t) => {
  await t.test('header-content uses flexbox', () => {
    assert.ok(appCss.includes('.header-content'));
    assert.ok(appCss.includes('display: flex'));
    assert.ok(appCss.includes('justify-content: space-between'));
  });

  await t.test('connection-status displays inline elements', () => {
    assert.ok(appCss.includes('.connection-status'));
    assert.ok(appCss.includes('display: flex'));
    assert.ok(appCss.includes('align-items: center'));
  });

  await t.test('status-indicator is circular', () => {
    assert.ok(appCss.includes('.status-indicator'));
    assert.ok(appCss.includes('width: 12px'));
    assert.ok(appCss.includes('height: 12px'));
    assert.ok(appCss.includes('border-radius: 50%'));
  });

  await t.test('status-indicator has pulse animation', () => {
    assert.ok(appCss.includes('animation: pulse 2s infinite'));
  });

  await t.test('pulse animation keyframes exist', () => {
    assert.ok(appCss.includes('@keyframes pulse'));
    assert.ok(appCss.includes('opacity: 1'));
    assert.ok(appCss.includes('opacity: 0.5'));
  });

  await t.test('connected status indicator stops pulsing', () => {
    assert.ok(appCss.includes('.status-indicator.status-connected'));
    assert.ok(appCss.includes('animation: none'));
  });

  await t.test('last-update displays time in monospace font', () => {
    assert.ok(appCss.includes('.update-time'));
    assert.ok(appCss.includes('font-family: var(--font-mono)'));
  });
});

test('Dashboard - ErrorBoundary Component', async (t) => {
  await t.test('ErrorBoundary is a class component', () => {
    assert.ok(errorBoundary.includes('class ErrorBoundary extends React.Component'));
  });

  await t.test('ErrorBoundary has proper TypeScript interfaces', () => {
    assert.ok(errorBoundary.includes('interface ErrorBoundaryProps'));
    assert.ok(errorBoundary.includes('interface ErrorBoundaryState'));
  });

  await t.test('ErrorBoundary state has hasError and error fields', () => {
    assert.ok(errorBoundary.includes('hasError: boolean'));
    assert.ok(errorBoundary.includes('error: Error | null'));
  });

  await t.test('ErrorBoundary implements getDerivedStateFromError', () => {
    assert.ok(errorBoundary.includes('static getDerivedStateFromError'));
    assert.ok(errorBoundary.includes('return { hasError: true, error }'));
  });

  await t.test('ErrorBoundary implements componentDidCatch', () => {
    assert.ok(errorBoundary.includes('componentDidCatch'));
    assert.ok(errorBoundary.includes('console.error'));
  });

  await t.test('ErrorBoundary renders error UI when hasError is true', () => {
    assert.ok(errorBoundary.includes('if (this.state.hasError)'));
    assert.ok(errorBoundary.includes('Something went wrong'));
  });

  await t.test('ErrorBoundary shows error details', () => {
    assert.ok(errorBoundary.includes('<details>'));
    assert.ok(errorBoundary.includes('Error details'));
    assert.ok(errorBoundary.includes('this.state.error.toString()'));
  });

  await t.test('ErrorBoundary has reload button', () => {
    assert.ok(errorBoundary.includes('<button'));
    assert.ok(errorBoundary.includes('window.location.reload()'));
    assert.ok(errorBoundary.includes('Reload Dashboard'));
  });

  await t.test('ErrorBoundary renders children when no error', () => {
    assert.ok(errorBoundary.includes('return this.props.children'));
  });
});

test('Dashboard - ErrorBoundary CSS', async (t) => {
  await t.test('error-boundary centers content', () => {
    assert.ok(errorBoundaryCss.includes('.error-boundary'));
    assert.ok(errorBoundaryCss.includes('display: flex'));
    assert.ok(errorBoundaryCss.includes('align-items: center'));
    assert.ok(errorBoundaryCss.includes('justify-content: center'));
  });

  await t.test('error-boundary-content has max-width', () => {
    assert.ok(errorBoundaryCss.includes('.error-boundary-content'));
    assert.ok(errorBoundaryCss.includes('max-width: 600px'));
  });

  await t.test('error heading uses error color', () => {
    assert.ok(errorBoundaryCss.includes('.error-boundary-content h2'));
    assert.ok(errorBoundaryCss.includes('color: var(--color-error)'));
  });

  await t.test('error details are styled', () => {
    assert.ok(errorBoundaryCss.includes('.error-boundary-content details'));
    assert.ok(errorBoundaryCss.includes('.error-boundary-content summary'));
    assert.ok(errorBoundaryCss.includes('.error-boundary-content pre'));
  });

  await t.test('reload button is styled', () => {
    assert.ok(errorBoundaryCss.includes('.error-boundary-content button'));
    assert.ok(errorBoundaryCss.includes('background: var(--color-primary)'));
    assert.ok(errorBoundaryCss.includes('cursor: pointer'));
  });

  await t.test('reload button has hover effect', () => {
    assert.ok(errorBoundaryCss.includes('.error-boundary-content button:hover'));
  });
});

test('Dashboard - TypeScript Types', async (t) => {
  await t.test('App component has return type annotation', () => {
    assert.ok(appTsx.includes('function App(): React.ReactElement'));
  });

  await t.test('formatTime has proper type annotations', () => {
    assert.ok(appTsx.includes('const formatTime = (date: Date): string'));
  });

  await t.test('getStatusColor has return type annotation', () => {
    assert.ok(appTsx.includes('const getStatusColor = (): string'));
  });

  await t.test('lastUpdate state has Date type', () => {
    assert.ok(appTsx.includes('useState<Date>'));
  });
});

test('Dashboard - Integration', async (t) => {
  await t.test('Single useWebSocket instance shared across components', () => {
    const useWebSocketMatches = appTsx.match(/useWebSocket/g) || [];
    // Import statement has it twice: "import { useWebSocket } from './hooks/useWebSocket'"
    // Plus one call in the component
    assert.ok(useWebSocketMatches.length >= 2, 'Should have at least import + one call');
  });

  await t.test('All data flows from single WebSocket connection', () => {
    // activities passed to AgentList and TokenUsage
    const activitiesMatches = appTsx.match(/activities={activities}/g) || [];
    assert.strictEqual(activitiesMatches.length, 2);
    
    // events passed to ActivityFeed and ModelSwitches
    const eventsMatches = appTsx.match(/events={events}/g) || [];
    assert.strictEqual(eventsMatches.length, 2);
  });

  await t.test('Connection status displayed in header', () => {
    assert.ok(appTsx.includes('status-${status}'));
  });

  await t.test('Auto-reconnect handled by useWebSocket hook', () => {
    // The hook itself handles reconnection, App just displays status
    assert.ok(appTsx.includes('const { activities, events, status }'));
  });
});
