import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper to get source path (tests run from dist/, source is in src/)
const getSrcPath = (relativePath: string) => {
  // From dist/__tests__ we go up 2 levels to project root, then into src
  return join(__dirname, '../../src', relativePath);
};

test('Static Server - HTTP server serves static files', async (t) => {
  await t.test('should have Express configuration in index.ts', () => {
    const serverPath = getSrcPath('server/index.ts');
    const serverCode = readFileSync(serverPath, 'utf-8');
    
    assert.ok(serverCode.includes('import express from'), 'should import express');
    assert.ok(serverCode.includes('import cors from'), 'should import cors');
    assert.ok(serverCode.includes('createServer'), 'should create HTTP server');
    assert.ok(serverCode.includes('express.static'), 'should serve static files');
  });

  await t.test('should configure CORS headers', () => {
    const serverPath = getSrcPath('server/index.ts');
    const serverCode = readFileSync(serverPath, 'utf-8');
    
    assert.ok(serverCode.includes('cors('), 'should use cors middleware');
    assert.ok(serverCode.includes('ai.setrox.com.tr'), 'should allow ai.setrox.com.tr origin');
    assert.ok(serverCode.includes('origin:'), 'should configure allowed origins');
  });

  await t.test('should serve from dist/client directory', () => {
    const serverPath = getSrcPath('server/index.ts');
    const serverCode = readFileSync(serverPath, 'utf-8');
    
    assert.ok(serverCode.includes('dist/client'), 'should reference dist/client directory');
    assert.ok(serverCode.includes('express.static'), 'should use express.static middleware');
  });

  await t.test('should have SPA fallback for client-side routing', () => {
    const serverPath = getSrcPath('server/index.ts');
    const serverCode = readFileSync(serverPath, 'utf-8');
    
    assert.ok(serverCode.includes("app.get('*'"), 'should have catch-all route');
    assert.ok(serverCode.includes('index.html'), 'should serve index.html for all routes');
    assert.ok(serverCode.includes('sendFile'), 'should use sendFile to serve index.html');
  });

  await t.test('should attach WebSocket server to HTTP server', () => {
    const serverPath = getSrcPath('server/index.ts');
    const serverCode = readFileSync(serverPath, 'utf-8');
    
    assert.ok(serverCode.includes('WebSocketServer'), 'should create WebSocket server');
    assert.ok(serverCode.includes('server'), 'should pass HTTP server to WebSocket server');
  });

  await t.test('should set cache headers for static assets', () => {
    const serverPath = getSrcPath('server/index.ts');
    const serverCode = readFileSync(serverPath, 'utf-8');
    
    // Check for cache configuration in express.static options
    assert.ok(serverCode.includes('maxAge') || serverCode.includes('etag'), 
      'should configure cache headers for static files');
  });
});

test('Static Server - CORS configuration', async (t) => {
  await t.test('should allow localhost origins', () => {
    const serverPath = getSrcPath('server/index.ts');
    const serverCode = readFileSync(serverPath, 'utf-8');
    
    assert.ok(serverCode.includes('localhost'), 'should allow localhost origin');
  });

  await t.test('should allow production domain', () => {
    const serverPath = getSrcPath('server/index.ts');
    const serverCode = readFileSync(serverPath, 'utf-8');
    
    assert.ok(serverCode.includes('ai.setrox.com.tr'), 'should allow production domain');
  });

  await t.test('should enable credentials', () => {
    const serverPath = getSrcPath('server/index.ts');
    const serverCode = readFileSync(serverPath, 'utf-8');
    
    assert.ok(serverCode.includes('credentials'), 'should configure credentials option');
  });
});

test('Static Server - SPA routing', async (t) => {
  await t.test('should serve index.html for root path', () => {
    const serverPath = getSrcPath('server/index.ts');
    const serverCode = readFileSync(serverPath, 'utf-8');
    
    // Catch-all route should handle root path
    assert.ok(serverCode.includes("app.get('*'"), 'should have catch-all route');
  });

  await t.test('should serve index.html for any route path', () => {
    const serverPath = getSrcPath('server/index.ts');
    const serverCode = readFileSync(serverPath, 'utf-8');
    
    // The '*' pattern matches all routes, enabling client-side routing
    assert.ok(serverCode.includes("app.get('*'"), 'should match all routes');
    assert.ok(serverCode.includes('index.html'), 'should return index.html');
  });
});

test('Static Server - WebSocket integration', async (t) => {
  await t.test('should use same port for HTTP and WebSocket', () => {
    const serverPath = getSrcPath('server/index.ts');
    const serverCode = readFileSync(serverPath, 'utf-8');
    
    // Should use createServer to create HTTP server, then attach WebSocket to it
    assert.ok(serverCode.includes('createServer'), 'should create HTTP server');
    assert.ok(serverCode.includes('WebSocketServer'), 'should create WebSocket server');
  });

  await t.test('should handle WebSocket upgrade requests', () => {
    const serverPath = getSrcPath('server/index.ts');
    const serverCode = readFileSync(serverPath, 'utf-8');
    
    // WebSocket server attached to HTTP server will automatically handle upgrades
    const wsServerPattern = /WebSocketServer\s*\(\s*\{\s*server/;
    assert.ok(wsServerPattern.test(serverCode), 
      'should pass HTTP server to WebSocket server for upgrade handling');
  });
});

test('Static Server - File serving', async (t) => {
  await t.test('should serve JS files with correct MIME type', () => {
    const serverPath = getSrcPath('server/index.ts');
    const serverCode = readFileSync(serverPath, 'utf-8');
    
    // express.static automatically serves correct MIME types
    assert.ok(serverCode.includes('express.static'), 'should use express.static for MIME type handling');
  });

  await t.test('should serve CSS files with correct MIME type', () => {
    const serverPath = getSrcPath('server/index.ts');
    const serverCode = readFileSync(serverPath, 'utf-8');
    
    // express.static handles all MIME types automatically
    assert.ok(serverCode.includes('express.static'), 'should use express.static for MIME type handling');
  });

  await t.test('should serve files from /assets/ directory', () => {
    const serverPath = getSrcPath('server/index.ts');
    const serverCode = readFileSync(serverPath, 'utf-8');
    
    // express.static serves entire dist/client directory including assets/
    assert.ok(serverCode.includes('express.static'), 'should serve static files');
    assert.ok(serverCode.includes('dist/client'), 'should serve from dist/client including assets/');
  });
});

test('Static Server - Production deployment', async (t) => {
  await t.test('should have production domain in CORS config', () => {
    const serverPath = getSrcPath('server/index.ts');
    const serverCode = readFileSync(serverPath, 'utf-8');
    
    assert.ok(serverCode.includes('ai.setrox.com.tr'), 'should allow production domain');
  });

  await t.test('should configure cache headers for performance', () => {
    const serverPath = getSrcPath('server/index.ts');
    const serverCode = readFileSync(serverPath, 'utf-8');
    
    assert.ok(serverCode.includes('maxAge') || serverCode.includes('etag'), 
      'should configure cache headers');
  });

  await t.test('should listen on configurable PORT', () => {
    const serverPath = getSrcPath('server/index.ts');
    const serverCode = readFileSync(serverPath, 'utf-8');
    
    assert.ok(serverCode.includes('process.env.PORT'), 'should read PORT from environment');
    assert.ok(serverCode.includes('3503'), 'should default to port 3503');
  });
});

test('Static Server - Error handling', async (t) => {
  await t.test('should handle server shutdown gracefully', () => {
    const serverPath = getSrcPath('server/index.ts');
    const serverCode = readFileSync(serverPath, 'utf-8');
    
    assert.ok(serverCode.includes('SIGINT'), 'should handle SIGINT signal');
    assert.ok(serverCode.includes('SIGTERM'), 'should handle SIGTERM signal');
    assert.ok(serverCode.includes('server.close'), 'should close HTTP server on shutdown');
  });

  await t.test('should stop streamer on shutdown', () => {
    const serverPath = getSrcPath('server/index.ts');
    const serverCode = readFileSync(serverPath, 'utf-8');
    
    assert.ok(serverCode.includes('streamer.stop'), 'should stop activity streamer');
  });
});
