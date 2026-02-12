import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Nginx Configuration', () => {
  const configPath = resolve(process.cwd(), 'nginx/agents-viz.conf');
  const deployPath = resolve(process.cwd(), 'DEPLOY.md');

  describe('Configuration File', () => {
    it('should exist at nginx/agents-viz.conf', () => {
      assert.ok(existsSync(configPath), 'nginx/agents-viz.conf file should exist');
    });

    it('should be readable', () => {
      const content = readFileSync(configPath, 'utf-8');
      assert.ok(content.length > 0, 'nginx config should not be empty');
    });
  });

  describe('Rate Limiting Configuration', () => {
    const config = readFileSync(configPath, 'utf-8');

    it('should define rate limiting zone for WebSocket connections', () => {
      assert.ok(config.includes('limit_conn_zone'), 'should define limit_conn_zone');
      assert.ok(config.includes('$binary_remote_addr'), 'should use binary_remote_addr for efficient storage');
      assert.ok(config.includes('zone=ws_limit'), 'should create ws_limit zone');
    });

    it('should set rate limit status code to 429', () => {
      assert.ok(config.includes('limit_conn_status 429'), 'should return 429 when limit exceeded');
    });

    it('should apply rate limiting in location block', () => {
      assert.ok(config.includes('limit_conn ws_limit 10'), 'should limit to 10 connections per IP');
    });
  });

  describe('Upstream Configuration', () => {
    const config = readFileSync(configPath, 'utf-8');

    it('should define upstream for agent_activity_viz', () => {
      assert.ok(config.includes('upstream agent_activity_viz'), 'should define upstream block');
    });

    it('should proxy to localhost:3503', () => {
      assert.ok(config.includes('server 127.0.0.1:3503'), 'should target correct port');
    });

    it('should configure keepalive connections', () => {
      assert.ok(config.includes('keepalive 64'), 'should enable keepalive for performance');
    });
  });

  describe('HTTP Server (Port 80)', () => {
    const config = readFileSync(configPath, 'utf-8');

    it('should listen on port 80 for IPv4 and IPv6', () => {
      assert.ok(config.includes('listen 80'), 'should listen on port 80');
      assert.ok(config.includes('listen [::]:80'), 'should listen on IPv6 port 80');
    });

    it('should configure server_name for ai.setrox.com.tr', () => {
      const httpServerMatch = config.match(/server\s*{[^}]*listen 80[^}]*}/s);
      assert.ok(httpServerMatch, 'should have HTTP server block');
      assert.ok(httpServerMatch[0].includes('server_name ai.setrox.com.tr'), 'should set correct server_name');
    });

    it('should allow ACME challenge for Let\'s Encrypt', () => {
      assert.ok(config.includes('location /.well-known/acme-challenge/'), 'should define ACME challenge location');
      assert.ok(config.includes('root /var/www/certbot'), 'should serve from certbot webroot');
    });

    it('should redirect HTTP to HTTPS', () => {
      assert.ok(config.includes('return 301 https://'), 'should return 301 redirect');
      assert.ok(config.includes('$server_name$request_uri'), 'should preserve URI in redirect');
    });
  });

  describe('HTTPS Server (Port 443)', () => {
    const config = readFileSync(configPath, 'utf-8');

    it('should listen on port 443 with SSL and HTTP/2', () => {
      assert.ok(config.includes('listen 443 ssl http2'), 'should listen on 443 with SSL and HTTP/2 for IPv4');
      assert.ok(config.includes('listen [::]:443 ssl http2'), 'should listen on 443 with SSL and HTTP/2 for IPv6');
    });

    it('should configure SSL certificate paths', () => {
      assert.ok(config.includes('ssl_certificate /etc/letsencrypt/live/ai.setrox.com.tr/fullchain.pem'), 
        'should set ssl_certificate path');
      assert.ok(config.includes('ssl_certificate_key /etc/letsencrypt/live/ai.setrox.com.tr/privkey.pem'), 
        'should set ssl_certificate_key path');
    });

    it('should enable TLS 1.2 and 1.3', () => {
      assert.ok(config.includes('ssl_protocols TLSv1.2 TLSv1.3'), 'should enable TLS 1.2 and 1.3');
    });

    it('should configure SSL session cache', () => {
      assert.ok(config.includes('ssl_session_cache'), 'should enable session cache');
      assert.ok(config.includes('ssl_session_timeout'), 'should set session timeout');
    });

    it('should enable OCSP stapling', () => {
      assert.ok(config.includes('ssl_stapling on'), 'should enable OCSP stapling');
      assert.ok(config.includes('ssl_stapling_verify on'), 'should enable OCSP stapling verification');
    });
  });

  describe('Security Headers', () => {
    const config = readFileSync(configPath, 'utf-8');

    it('should set HSTS header', () => {
      assert.ok(config.includes('Strict-Transport-Security'), 'should include HSTS header');
      assert.ok(config.includes('max-age=31536000'), 'should set HSTS max-age to 1 year');
      assert.ok(config.includes('includeSubDomains'), 'should include subdomains in HSTS');
    });

    it('should set X-Frame-Options header', () => {
      assert.ok(config.includes('X-Frame-Options "SAMEORIGIN"'), 'should prevent clickjacking');
    });

    it('should set X-Content-Type-Options header', () => {
      assert.ok(config.includes('X-Content-Type-Options "nosniff"'), 'should prevent MIME sniffing');
    });

    it('should set X-XSS-Protection header', () => {
      assert.ok(config.includes('X-XSS-Protection "1; mode=block"'), 'should enable XSS protection');
    });

    it('should use "always" flag for security headers', () => {
      const hsts = config.match(/Strict-Transport-Security.*always/);
      assert.ok(hsts, 'HSTS should use "always" flag');
    });
  });

  describe('Application Location (/agents-viz)', () => {
    const config = readFileSync(configPath, 'utf-8');

    it('should define /agents-viz location', () => {
      assert.ok(config.includes('location /agents-viz'), 'should define /agents-viz location');
    });

    it('should rewrite URL to remove /agents-viz prefix', () => {
      assert.ok(config.includes('rewrite ^/agents-viz/(.*)$ /$1 break'), 
        'should rewrite /agents-viz/path to /path');
      assert.ok(config.includes('rewrite ^/agents-viz$ / break'), 
        'should rewrite /agents-viz to /');
    });

    it('should proxy to upstream', () => {
      assert.ok(config.includes('proxy_pass http://agent_activity_viz'), 
        'should proxy to upstream');
    });

    it('should set required proxy headers', () => {
      assert.ok(config.includes('proxy_set_header Host $host'), 'should set Host header');
      assert.ok(config.includes('proxy_set_header X-Real-IP $remote_addr'), 'should set X-Real-IP header');
      assert.ok(config.includes('proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for'), 
        'should set X-Forwarded-For header');
      assert.ok(config.includes('proxy_set_header X-Forwarded-Proto $scheme'), 
        'should set X-Forwarded-Proto header');
    });

    it('should use HTTP/1.1 for proxy', () => {
      assert.ok(config.includes('proxy_http_version 1.1'), 'should use HTTP/1.1 for upstream');
    });
  });

  describe('WebSocket Support', () => {
    const config = readFileSync(configPath, 'utf-8');

    it('should configure WebSocket upgrade headers', () => {
      assert.ok(config.includes('proxy_set_header Upgrade $http_upgrade'), 
        'should set Upgrade header for WebSocket');
      assert.ok(config.includes('proxy_set_header Connection "upgrade"'), 
        'should set Connection header for WebSocket');
    });

    it('should configure WebSocket timeouts', () => {
      assert.ok(config.includes('proxy_read_timeout 86400s'), 
        'should set long read timeout for WebSocket (24 hours)');
      assert.ok(config.includes('proxy_send_timeout 86400s'), 
        'should set long send timeout for WebSocket (24 hours)');
    });

    it('should disable buffering for real-time streaming', () => {
      assert.ok(config.includes('proxy_buffering off'), 
        'should disable proxy buffering for real-time data');
      assert.ok(config.includes('proxy_cache_bypass $http_upgrade'), 
        'should bypass cache for WebSocket upgrades');
    });
  });

  describe('Static Asset Caching', () => {
    const config = readFileSync(configPath, 'utf-8');

    it('should define location for static assets', () => {
      assert.ok(config.includes('location ~ \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$'), 
        'should define regex location for static file types');
    });

    it('should set Cache-Control header with max-age=3600', () => {
      const staticLocation = config.match(/location ~ \\\..*?\{[^}]*\}/s);
      assert.ok(staticLocation, 'should have static asset location block');
      assert.ok(staticLocation[0].includes('Cache-Control "public, max-age=3600"'), 
        'should set cache header to 1 hour');
    });

    it('should set expires header', () => {
      const staticLocation = config.match(/location ~ \\\..*?\{[^}]*\}/s);
      assert.ok(staticLocation, 'should have static asset location block');
      assert.ok(staticLocation[0].includes('expires 1h'), 
        'should set expires to 1 hour');
    });

    it('should add CORS headers for assets', () => {
      const staticLocation = config.match(/location ~ \\\..*?\{[^}]*\}/s);
      assert.ok(staticLocation, 'should have static asset location block');
      assert.ok(staticLocation[0].includes('Access-Control-Allow-Origin "*"'), 
        'should allow CORS for fonts and assets');
    });
  });

  describe('Health Check Endpoint', () => {
    const config = readFileSync(configPath, 'utf-8');

    it('should define /health endpoint', () => {
      assert.ok(config.includes('location /health'), 'should define health check endpoint');
    });

    it('should return 200 status', () => {
      assert.ok(config.includes('return 200'), 'should return 200 OK');
    });

    it('should disable access logging for health checks', () => {
      const healthLocation = config.match(/location \/health\s*\{[^}]*\}/s);
      assert.ok(healthLocation, 'should have health location block');
      assert.ok(healthLocation[0].includes('access_log off'), 
        'should disable access logging for health endpoint');
    });
  });

  describe('Logging Configuration', () => {
    const config = readFileSync(configPath, 'utf-8');

    it('should configure access log', () => {
      assert.ok(config.includes('access_log /var/log/nginx/agents-viz-access.log'), 
        'should define access log path');
    });

    it('should configure error log', () => {
      assert.ok(config.includes('error_log /var/log/nginx/agents-viz-error.log'), 
        'should define error log path');
    });
  });

  describe('DEPLOY.md Documentation', () => {
    it('should exist', () => {
      assert.ok(existsSync(deployPath), 'DEPLOY.md should exist');
    });

    it('should contain deployment steps', () => {
      const content = readFileSync(deployPath, 'utf-8');
      assert.ok(content.includes('Deployment Steps'), 'should have deployment steps section');
      assert.ok(content.includes('Build the Application'), 'should explain build process');
      assert.ok(content.includes('Install Nginx Configuration'), 'should explain nginx setup');
      assert.ok(content.includes('SSL Certificate'), 'should explain SSL setup');
    });

    it('should document nginx configuration details', () => {
      const content = readFileSync(deployPath, 'utf-8');
      assert.ok(content.includes('localhost:3503'), 'should document application port');
      assert.ok(content.includes('/agents-viz'), 'should document URL path');
      assert.ok(content.includes('Rate Limiting'), 'should document rate limiting');
      assert.ok(content.includes('max-age=3600'), 'should document cache settings');
    });

    it('should include certbot commands', () => {
      const content = readFileSync(deployPath, 'utf-8');
      assert.ok(content.includes('certbot'), 'should include certbot commands');
      assert.ok(content.includes('ai.setrox.com.tr'), 'should reference correct domain');
      assert.ok(content.includes('certonly --webroot'), 'should use webroot mode for certificate');
    });

    it('should document nginx -t validation', () => {
      const content = readFileSync(deployPath, 'utf-8');
      assert.ok(content.includes('nginx -t'), 'should document config testing');
    });

    it('should include troubleshooting section', () => {
      const content = readFileSync(deployPath, 'utf-8');
      assert.ok(content.includes('Troubleshooting'), 'should have troubleshooting section');
      assert.ok(content.includes('WebSocket connections fail'), 
        'should troubleshoot WebSocket issues');
    });

    it('should document verification steps', () => {
      const content = readFileSync(deployPath, 'utf-8');
      assert.ok(content.includes('Verify Deployment'), 'should have verification section');
      assert.ok(content.includes('curl'), 'should include curl commands for testing');
      assert.ok(content.includes('Cache-Control'), 'should verify cache headers');
    });

    it('should include security considerations', () => {
      const content = readFileSync(deployPath, 'utf-8');
      assert.ok(content.includes('Security Considerations'), 'should have security section');
      assert.ok(content.includes('Firewall'), 'should mention firewall configuration');
      assert.ok(content.includes('port 3503'), 'should warn about port exposure');
    });

    it('should document production checklist', () => {
      const content = readFileSync(deployPath, 'utf-8');
      assert.ok(content.includes('Production Checklist'), 'should have checklist');
      assert.ok(content.includes('[ ]'), 'should use checkbox format');
      assert.ok(content.includes('nginx -t'), 'should include config validation in checklist');
      assert.ok(content.includes('Rate limiting tested'), 
        'should include rate limit testing in checklist');
    });
  });

  describe('Configuration Best Practices', () => {
    const config = readFileSync(configPath, 'utf-8');

    it('should include comments explaining configuration', () => {
      assert.ok(config.includes('#'), 'should have comments');
      assert.ok(config.includes('# Rate limiting'), 'should explain rate limiting');
      assert.ok(config.includes('# WebSocket'), 'should explain WebSocket config');
    });

    it('should use secure SSL configuration', () => {
      assert.ok(config.includes('ssl_prefer_server_ciphers off'), 
        'should use modern SSL config (client ciphers preferred)');
      assert.ok(config.includes('ssl_ciphers'), 'should specify secure ciphers');
      assert.ok(config.includes('ECDHE'), 'should use forward secrecy ciphers');
    });

    it('should handle both IPv4 and IPv6', () => {
      const ipv6Listeners = config.match(/listen \[::\]:/g);
      assert.ok(ipv6Listeners && ipv6Listeners.length >= 2, 
        'should have IPv6 listeners for both HTTP and HTTPS');
    });

    it('should use http2 for HTTPS', () => {
      assert.ok(config.includes('443 ssl http2'), 'should enable HTTP/2 for better performance');
    });
  });
});
