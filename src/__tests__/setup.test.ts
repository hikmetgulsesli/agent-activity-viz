import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

describe('Project Setup', () => {
  describe('package.json', () => {
    it('should exist', () => {
      assert.ok(existsSync(join(ROOT, 'package.json')), 'package.json should exist');
    });

    it('should have required dependencies', () => {
      const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
      
      assert.ok(pkg.dependencies?.ws, 'should have ws dependency');
      assert.ok(pkg.dependencies?.react, 'should have react dependency');
      assert.ok(pkg.dependencies?.['react-dom'], 'should have react-dom dependency');
    });

    it('should have required devDependencies', () => {
      const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
      
      assert.ok(pkg.devDependencies?.['@types/ws'], 'should have @types/ws');
      assert.ok(pkg.devDependencies?.['@types/react'], 'should have @types/react');
      assert.ok(pkg.devDependencies?.['@types/react-dom'], 'should have @types/react-dom');
      assert.ok(pkg.devDependencies?.typescript, 'should have typescript');
      assert.ok(pkg.devDependencies?.vite, 'should have vite');
    });

    it('should have build scripts', () => {
      const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
      
      assert.ok(pkg.scripts?.build, 'should have build script');
      assert.ok(pkg.scripts?.dev, 'should have dev script');
      assert.ok(pkg.scripts?.start, 'should have start script');
    });
  });

  describe('tsconfig.json', () => {
    it('should exist', () => {
      assert.ok(existsSync(join(ROOT, 'tsconfig.json')), 'tsconfig.json should exist');
    });

    it('should have proper compiler options', () => {
      const tsconfig = JSON.parse(readFileSync(join(ROOT, 'tsconfig.json'), 'utf-8'));
      
      assert.strictEqual(tsconfig.compilerOptions?.target, 'ES2022', 'target should be ES2022');
      assert.strictEqual(tsconfig.compilerOptions?.module, 'ESNext', 'module should be ESNext');
      assert.ok(tsconfig.compilerOptions?.strict, 'strict should be true');
      assert.strictEqual(tsconfig.compilerOptions?.jsx, 'react-jsx', 'jsx should be react-jsx');
    });
  });

  describe('Folder structure', () => {
    it('should have src/server directory', () => {
      assert.ok(existsSync(join(ROOT, 'src/server')), 'src/server should exist');
    });

    it('should have src/client directory', () => {
      assert.ok(existsSync(join(ROOT, 'src/client')), 'src/client should exist');
    });

    it('should have dist directory', () => {
      assert.ok(existsSync(join(ROOT, 'dist')), 'dist should exist');
    });
  });

  describe('Source files', () => {
    it('should have server entry point', () => {
      assert.ok(existsSync(join(ROOT, 'src/server/index.ts')), 'src/server/index.ts should exist');
    });

    it('should have client entry point', () => {
      assert.ok(existsSync(join(ROOT, 'src/client/main.tsx')), 'src/client/main.tsx should exist');
    });

    it('should have App component', () => {
      assert.ok(existsSync(join(ROOT, 'src/client/App.tsx')), 'src/client/App.tsx should exist');
    });
  });

  describe('Build configuration', () => {
    it('should have vite.config.ts', () => {
      assert.ok(existsSync(join(ROOT, 'vite.config.ts')), 'vite.config.ts should exist');
    });

    it('should have index.html', () => {
      assert.ok(existsSync(join(ROOT, 'index.html')), 'index.html should exist');
    });
  });

  describe('Module imports', () => {
    it('should be able to import ws module', async () => {
      const { WebSocketServer } = await import('ws');
      assert.ok(WebSocketServer, 'WebSocketServer should be importable');
    });

    it('should be able to import react module', async () => {
      const React = await import('react');
      assert.ok(React, 'React should be importable');
    });
  });
});
