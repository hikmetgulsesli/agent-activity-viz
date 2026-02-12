import { test, describe, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const README_PATH = resolve(process.cwd(), 'README.md');

describe('README.md Documentation', () => {
  test('README.md exists', () => {
    expect(existsSync(README_PATH)).toBe(true);
  });

  describe('Content Structure', () => {
    let readmeContent: string;

    test('README is readable', () => {
      expect(() => {
        readmeContent = readFileSync(README_PATH, 'utf-8');
      }).not.toThrow();
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent.length).toBeGreaterThan(0);
    });

    test('has project title and description', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toContain('# Agent Activity Visualizer');
      expect(readmeContent).toContain('Real-time WebSocket-based dashboard');
      expect(readmeContent).toContain('OpenClaw agent activities');
    });

    test('includes feature list', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/##\s+Features/);
      expect(readmeContent).toContain('Real-Time Monitoring');
      expect(readmeContent).toContain('Comprehensive Tracking');
      expect(readmeContent).toContain('Modern UI');
      expect(readmeContent).toContain('Production Ready');
    });

    test('includes quick start section', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/##\s+Quick Start/);
      expect(readmeContent).toMatch(/###\s+Development/);
      expect(readmeContent).toMatch(/###\s+Production Build/);
    });

    test('documents npm install command', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toContain('npm install');
    });

    test('documents npm run dev command', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toContain('npm run dev');
    });

    test('documents npm run build command', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toContain('npm run build');
    });

    test('documents npm start command', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toContain('npm start');
    });
  });

  describe('Architecture Documentation', () => {
    let readmeContent: string;

    test('includes architecture section', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/##\s+Architecture/);
    });

    test('explains data flow', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/###\s+Data Flow/);
      expect(readmeContent).toContain('OpenClaw Agents');
      expect(readmeContent).toContain('DataCollector');
      expect(readmeContent).toContain('WebSocket Server');
      expect(readmeContent).toContain('React Dashboard');
    });

    test('documents backend components', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toContain('AgentActivityStreamer');
      expect(readmeContent).toContain('DataCollector');
      expect(readmeContent).toContain('Express server');
    });

    test('documents frontend components', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toContain('AgentList');
      expect(readmeContent).toContain('ActivityFeed');
      expect(readmeContent).toContain('TokenUsage');
      expect(readmeContent).toContain('ModelSwitches');
      expect(readmeContent).toContain('useWebSocket');
    });

    test('documents event types', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/###\s+Event Types/);
      expect(readmeContent).toContain('agent_started');
      expect(readmeContent).toContain('agent_ended');
      expect(readmeContent).toContain('tool_called');
      expect(readmeContent).toContain('model_switched');
      expect(readmeContent).toContain('token_update');
      expect(readmeContent).toContain('heartbeat');
    });

    test('includes file structure diagram', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/###\s+File Structure/);
      expect(readmeContent).toContain('agent-activity-viz/');
      expect(readmeContent).toContain('src/');
      expect(readmeContent).toContain('server/');
      expect(readmeContent).toContain('client/');
    });
  });

  describe('Configuration Documentation', () => {
    let readmeContent: string;

    test('includes configuration section', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/##\s+Configuration/);
    });

    test('documents environment variables', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/###\s+Environment Variables/);
      expect(readmeContent).toContain('PORT');
      expect(readmeContent).toContain('POLL_INTERVAL');
      expect(readmeContent).toContain('NODE_ENV');
    });

    test('documents default PORT value', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toContain('3503');
    });

    test('documents default POLL_INTERVAL value', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toContain('2000');
    });

    test('documents OpenClaw data sources', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/###\s+OpenClaw Data Sources/);
      expect(readmeContent).toContain('~/.openclaw/agents/');
      expect(readmeContent).toContain('~/.openclaw/workspaces/dashboard/data.json');
      expect(readmeContent).toContain('~/.openclaw/openclaw.json');
    });
  });

  describe('Testing Documentation', () => {
    let readmeContent: string;

    test('includes testing section', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/##\s+Testing/);
    });

    test('documents npm test command', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toContain('npm test');
    });

    test('documents npm run test:watch command', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toContain('npm run test:watch');
    });

    test('documents npm run test:ui command', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toContain('npm run test:ui');
    });

    test('documents npm run test:coverage command', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toContain('npm run test:coverage');
    });

    test('includes test coverage section', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/###\s+Test Coverage/);
      expect(readmeContent).toContain('Lines');
      expect(readmeContent).toContain('Functions');
      expect(readmeContent).toContain('Branches');
      expect(readmeContent).toContain('Statements');
    });

    test('documents test structure', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/###\s+Test Structure/);
      expect(readmeContent).toContain('Integration tests');
      expect(readmeContent).toContain('Unit tests');
      expect(readmeContent).toContain('Component tests');
    });
  });

  describe('Deployment Documentation', () => {
    let readmeContent: string;

    test('includes deployment section', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/##\s+Deployment/);
    });

    test('references DEPLOY.md', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toContain('DEPLOY.md');
    });

    test('documents production build steps', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/###\s+Production Deployment/);
      expect(readmeContent).toContain('npm run build');
    });

    test('documents systemd service', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/###\s+systemd Service/);
      expect(readmeContent).toContain('install-service.sh');
      expect(readmeContent).toContain('systemctl start');
      expect(readmeContent).toContain('systemctl stop');
      expect(readmeContent).toContain('systemctl status');
    });

    test('documents nginx configuration', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/###\s+Nginx Configuration/);
      expect(readmeContent).toContain('nginx/agents-viz.conf');
      expect(readmeContent).toContain('Reverse proxy');
      expect(readmeContent).toContain('WebSocket support');
      expect(readmeContent).toContain('SSL/TLS');
      expect(readmeContent).toContain('Rate limiting');
    });

    test('includes deployment URL', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toContain('ai.setrox.com.tr/agents-viz');
    });
  });

  describe('Troubleshooting Section', () => {
    let readmeContent: string;

    test('includes troubleshooting section', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/##\s+Troubleshooting/);
    });

    test('documents WebSocket connection issues', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/###\s+WebSocket Connection Fails/);
      expect(readmeContent).toContain('disconnected');
    });

    test('documents no agent data issues', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/###\s+No Agent Data Showing/);
    });

    test('documents build error solutions', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/###\s+Build Errors/);
      expect(readmeContent).toContain('npm install');
    });

    test('documents rate limiting issues', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/###\s+Rate Limiting Issues/);
      expect(readmeContent).toContain('429');
    });
  });

  describe('Performance Documentation', () => {
    let readmeContent: string;

    test('includes performance section', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/##\s+Performance/);
    });

    test('documents benchmarks', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/###\s+Benchmarks/);
      expect(readmeContent).toContain('Latency');
      expect(readmeContent).toContain('Throughput');
      expect(readmeContent).toContain('Memory');
      expect(readmeContent).toContain('CPU');
    });

    test('includes optimization tips', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/###\s+Optimization Tips/);
      expect(readmeContent).toContain('POLL_INTERVAL');
    });
  });

  describe('Contributing Guidelines', () => {
    let readmeContent: string;

    test('includes contributing section', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/##\s+Contributing/);
    });

    test('documents contribution workflow', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toContain('Fork the repository');
      expect(readmeContent).toContain('Write tests');
      expect(readmeContent).toContain('npm run typecheck');
      expect(readmeContent).toContain('npm test');
    });

    test('documents commit message format', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/###\s+Commit Messages/);
      expect(readmeContent).toContain('conventional commits');
      expect(readmeContent).toContain('feat:');
      expect(readmeContent).toContain('fix:');
      expect(readmeContent).toContain('docs:');
      expect(readmeContent).toContain('test:');
    });
  });

  describe('License and Support', () => {
    let readmeContent: string;

    test('includes license section', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/##\s+License/);
    });

    test('specifies MIT license', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toContain('MIT License');
      expect(readmeContent).toContain('Permission is hereby granted, free of charge');
    });

    test('includes support section', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/##\s+Support/);
    });

    test('links to OpenClaw resources', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toContain('github.com/openclaw/openclaw');
      expect(readmeContent).toContain('discord.com/invite/clawd');
    });
  });

  describe('Additional Sections', () => {
    let readmeContent: string;

    test('includes roadmap section', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/##\s+Roadmap/);
      expect(readmeContent).toContain('Future enhancements');
    });

    test('includes acknowledgments section', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/##\s+Acknowledgments/);
      expect(readmeContent).toContain('Built with');
    });

    test('lists key technologies', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toContain('Node.js');
      expect(readmeContent).toContain('TypeScript');
      expect(readmeContent).toContain('React');
      expect(readmeContent).toContain('Vite');
      expect(readmeContent).toContain('Vitest');
      expect(readmeContent).toContain('Express');
      expect(readmeContent).toContain('ws');
    });
  });

  describe('Code Examples', () => {
    let readmeContent: string;

    test('includes code block examples', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      const codeBlockCount = (readmeContent.match(/```/g) || []).length;
      expect(codeBlockCount).toBeGreaterThan(20); // Should have many code examples
    });

    test('includes bash code blocks', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toContain('```bash');
    });

    test('examples use correct commands', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      // Verify examples show actual project commands
      expect(readmeContent).toContain('cd agent-activity-viz');
      expect(readmeContent).toContain('npm run dev');
      expect(readmeContent).toContain('npm run build');
      expect(readmeContent).toContain('npm start');
    });
  });

  describe('Formatting and Style', () => {
    let readmeContent: string;

    test('uses proper markdown headers', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/^#\s+\w+/m); // H1 header
      expect(readmeContent).toMatch(/^##\s+\w+/m); // H2 headers
      expect(readmeContent).toMatch(/^###\s+\w+/m); // H3 headers
    });

    test('includes badges', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toMatch(/!\[.*\]\(https:\/\/img\.shields\.io/);
    });

    test('uses emoji icons for features', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      const emojiCount = (readmeContent.match(/[✨🎯🎨🔒]/g) || []).length;
      expect(emojiCount).toBeGreaterThan(0);
    });

    test('includes tables for configuration', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent).toContain('| Variable |');
      expect(readmeContent).toContain('|----------|');
    });

    test('has proper line length (mostly)', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      const lines = readmeContent.split('\n');
      const longLines = lines.filter(line => 
        line.length > 120 && 
        !line.startsWith('http') && 
        !line.startsWith('- **') &&
        !line.includes('```')
      );
      // Most lines should be reasonably short
      expect(longLines.length / lines.length).toBeLessThan(0.2);
    });
  });

  describe('Completeness', () => {
    let readmeContent: string;

    test('README is comprehensive (> 10KB)', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      expect(readmeContent.length).toBeGreaterThan(10000);
    });

    test('covers all acceptance criteria sections', () => {
      readmeContent = readFileSync(README_PATH, 'utf-8');
      // 1. README.md exists with clear project description ✓
      expect(readmeContent).toContain('Agent Activity Visualizer');
      
      // 2. Development setup section with all commands ✓
      expect(readmeContent).toContain('npm install');
      expect(readmeContent).toContain('npm run dev');
      
      // 3. Production build and deployment instructions ✓
      expect(readmeContent).toContain('npm run build');
      expect(readmeContent).toContain('Production Deployment');
      
      // 4. Environment variables documented ✓
      expect(readmeContent).toContain('PORT');
      expect(readmeContent).toContain('POLL_INTERVAL');
      
      // 5. Architecture section explaining data flow ✓
      expect(readmeContent).toContain('Architecture');
      expect(readmeContent).toContain('Data Flow');
      
      // 6. Troubleshooting section for common issues ✓
      expect(readmeContent).toContain('Troubleshooting');
      
      // 7. License and contribution guidelines included ✓
      expect(readmeContent).toContain('MIT License');
      expect(readmeContent).toContain('Contributing');
    });
  });
});
