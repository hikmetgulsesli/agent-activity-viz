import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

describe('UI Components', () => {
  describe('Source Files', () => {
    it('App.tsx exists and contains component', async () => {
      const appPath = resolve('src/client/App.tsx');
      const content = await readFile(appPath, 'utf-8');
      assert.ok(content.includes('function App'));
      assert.ok(content.includes('export default App'));
    });

    it('GlassCard.tsx exists and contains component', async () => {
      const cardPath = resolve('src/client/components/GlassCard.tsx');
      const content = await readFile(cardPath, 'utf-8');
      assert.ok(content.includes('function GlassCard'));
      assert.ok(content.includes('export default GlassCard'));
      assert.ok(content.includes('GlassCardProps'));
    });

    it('main.tsx exists and renders App', async () => {
      const mainPath = resolve('src/client/main.tsx');
      const content = await readFile(mainPath, 'utf-8');
      assert.ok(content.includes('import App'));
      assert.ok(content.includes('ReactDOM.createRoot'));
    });
  });

  describe('App Component Structure', () => {
    it('renders header with title', async () => {
      const appPath = resolve('src/client/App.tsx');
      const content = await readFile(appPath, 'utf-8');
      assert.ok(content.includes('Agent Activity Visualizer'));
      assert.ok(content.includes('Real-time OpenClaw agent activity dashboard'));
    });

    it('renders dashboard layout', async () => {
      const appPath = resolve('src/client/App.tsx');
      const content = await readFile(appPath, 'utf-8');
      assert.ok(content.includes('dashboard-layout'));
    });

    it('renders Active Agents card', async () => {
      const appPath = resolve('src/client/App.tsx');
      const content = await readFile(appPath, 'utf-8');
      assert.ok(content.includes('Active Agents'));
      assert.ok(content.includes('column-left'));
    });

    it('renders Recent Activity card', async () => {
      const appPath = resolve('src/client/App.tsx');
      const content = await readFile(appPath, 'utf-8');
      assert.ok(content.includes('Recent Activity'));
      assert.ok(content.includes('column-center'));
    });

    it('renders Model Switches card', async () => {
      const appPath = resolve('src/client/App.tsx');
      const content = await readFile(appPath, 'utf-8');
      assert.ok(content.includes('Model Switches'));
      assert.ok(content.includes('column-right'));
    });

    it('renders Token Usage card', async () => {
      const appPath = resolve('src/client/App.tsx');
      const content = await readFile(appPath, 'utf-8');
      assert.ok(content.includes('Token Usage'));
      assert.ok(content.includes('column-right'));
    });

    it('renders 3-column layout', async () => {
      const appPath = resolve('src/client/App.tsx');
      const content = await readFile(appPath, 'utf-8');
      assert.ok(content.includes('column-left'));
      assert.ok(content.includes('column-center'));
      assert.ok(content.includes('column-right'));
    });

    it('wraps app in ErrorBoundary', async () => {
      const appPath = resolve('src/client/App.tsx');
      const content = await readFile(appPath, 'utf-8');
      assert.ok(content.includes('import ErrorBoundary'));
      assert.ok(content.includes('<ErrorBoundary>'));
    });

    it('uses GlassCard components', async () => {
      const appPath = resolve('src/client/App.tsx');
      const content = await readFile(appPath, 'utf-8');
      assert.ok(content.includes('import GlassCard'));
      const glassCardMatches = content.match(/<GlassCard/g);
      assert.ok(glassCardMatches && glassCardMatches.length === 4, 'Should have 4 GlassCard components');
    });
  });

  describe('GlassCard Component', () => {
    it('accepts children prop', async () => {
      const cardPath = resolve('src/client/components/GlassCard.tsx');
      const content = await readFile(cardPath, 'utf-8');
      assert.ok(content.includes('children: React.ReactNode'));
    });

    it('accepts optional className prop', async () => {
      const cardPath = resolve('src/client/components/GlassCard.tsx');
      const content = await readFile(cardPath, 'utf-8');
      assert.ok(content.includes('className?: string'));
    });

    it('accepts optional title prop', async () => {
      const cardPath = resolve('src/client/components/GlassCard.tsx');
      const content = await readFile(cardPath, 'utf-8');
      assert.ok(content.includes('title?: string'));
    });

    it('imports CSS file', async () => {
      const cardPath = resolve('src/client/components/GlassCard.tsx');
      const content = await readFile(cardPath, 'utf-8');
      assert.ok(content.includes("import './GlassCard.css'"));
    });
  });

  describe('CSS Variables', () => {
    it('global.css exists and contains theme variables', async () => {
      const cssPath = resolve('src/client/styles/global.css');
      const css = await readFile(cssPath, 'utf-8');
      
      // Check for key CSS variables
      assert.ok(css.includes('--color-bg-primary'));
      assert.ok(css.includes('--color-text-primary'));
      assert.ok(css.includes('--spacing-md'));
      assert.ok(css.includes('--font-family-base'));
      assert.ok(css.includes('--glass-bg'));
      assert.ok(css.includes('--glass-blur'));
      assert.ok(css.includes('--glass-border'));
    });

    it('defines dark theme colors', async () => {
      const cssPath = resolve('src/client/styles/global.css');
      const css = await readFile(cssPath, 'utf-8');
      
      assert.ok(css.includes('--color-bg-primary: #0a0a0f'));
      assert.ok(css.includes('--color-accent'));
      assert.ok(css.includes('--color-success'));
      assert.ok(css.includes('--color-error'));
    });

    it('defines spacing variables', async () => {
      const cssPath = resolve('src/client/styles/global.css');
      const css = await readFile(cssPath, 'utf-8');
      
      assert.ok(css.includes('--spacing-xs'));
      assert.ok(css.includes('--spacing-sm'));
      assert.ok(css.includes('--spacing-md'));
      assert.ok(css.includes('--spacing-lg'));
      assert.ok(css.includes('--spacing-xl'));
    });

    it('defines typography variables', async () => {
      const cssPath = resolve('src/client/styles/global.css');
      const css = await readFile(cssPath, 'utf-8');
      
      assert.ok(css.includes('--font-family-base'));
      assert.ok(css.includes('--font-family-mono'));
      assert.ok(css.includes('--font-size-base'));
      assert.ok(css.includes('--line-height-normal'));
    });
  });

  describe('Responsive Layout', () => {
    it('App.css contains responsive media queries', async () => {
      const cssPath = resolve('src/client/App.css');
      const css = await readFile(cssPath, 'utf-8');
      
      // Check for desktop (3 columns: 1fr 2fr 1fr = 25% 50% 25%)
      assert.ok(css.includes('grid-template-columns: 1fr 2fr 1fr'));
      
      // Check for tablet media query (2 columns)
      assert.ok(css.includes('@media (max-width: 1023px)'));
      assert.ok(css.includes('grid-template-columns: 1fr 2fr'));
      
      // Check for mobile media query (1 column)
      assert.ok(css.includes('@media (max-width: 639px)'));
      assert.ok(css.includes('grid-template-columns: 1fr'));
    });

    it('has separate mobile styles', async () => {
      const cssPath = resolve('src/client/App.css');
      const css = await readFile(cssPath, 'utf-8');
      
      assert.ok(css.includes('640px') || css.includes('639px'), 'Should have mobile breakpoint');
      assert.ok(css.includes('1024px') || css.includes('1023px'), 'Should have tablet breakpoint');
    });
  });

  describe('GlassCard Styling', () => {
    it('GlassCard.css contains glass-morphism styles', async () => {
      const cssPath = resolve('src/client/components/GlassCard.css');
      const css = await readFile(cssPath, 'utf-8');
      
      // Check for glass-morphism properties
      assert.ok(css.includes('backdrop-filter: blur'));
      assert.ok(css.includes('-webkit-backdrop-filter: blur'));
      assert.ok(css.includes('var(--glass-bg)'));
      assert.ok(css.includes('var(--glass-border)'));
      assert.ok(css.includes('var(--glass-blur)'));
    });

    it('has hover effects', async () => {
      const cssPath = resolve('src/client/components/GlassCard.css');
      const css = await readFile(cssPath, 'utf-8');
      
      assert.ok(css.includes('.glass-card:hover'));
    });

    it('has card title styles', async () => {
      const cssPath = resolve('src/client/components/GlassCard.css');
      const css = await readFile(cssPath, 'utf-8');
      
      assert.ok(css.includes('.glass-card-title'));
    });
  });

  describe('Build Output', () => {
    it('vite build produces dist/client/index.html', async () => {
      const htmlPath = resolve('dist/client/index.html');
      const content = await readFile(htmlPath, 'utf-8');
      assert.ok(content.includes('<!DOCTYPE html') || content.includes('<!doctype html'));
      assert.ok(content.includes('<script'));
    });

    it('vite build produces CSS bundle in assets/', async () => {
      const { readdir } = await import('node:fs/promises');
      const assetsPath = resolve('dist/client/assets');
      const files = await readdir(assetsPath);
      const cssFiles = files.filter(f => f.endsWith('.css'));
      assert.ok(cssFiles.length > 0, 'Should have at least one CSS file in assets/');
    });

    it('vite build produces JS bundle in assets/', async () => {
      const { readdir } = await import('node:fs/promises');
      const assetsPath = resolve('dist/client/assets');
      const files = await readdir(assetsPath);
      const jsFiles = files.filter(f => f.endsWith('.js'));
      assert.ok(jsFiles.length > 0, 'Should have at least one JS file in assets/');
    });
  });
});
