# Agent Activity Visualizer - Deployment Guide

This guide covers deploying the Agent Activity Visualizer to production at `ai.setrox.com.tr/agents-viz`.

## Prerequisites

- Ubuntu/Debian server with root/sudo access
- Node.js v18+ installed
- Nginx installed
- Domain DNS configured to point to your server
- Port 80 and 443 open in firewall

## Deployment Steps

### 1. Build the Application

```bash
cd /home/setrox/.openclaw/agent-activity-viz
npm install
npm run build
```

This creates:
- `dist/server/` - Compiled server code
- `dist/client/` - Static frontend assets (HTML, CSS, JS)

### 2. Install Nginx Configuration

Copy the nginx configuration to sites-available:

```bash
sudo cp nginx/agents-viz.conf /etc/nginx/sites-available/agents-viz.conf
```

Enable the site by creating a symlink:

```bash
sudo ln -s /etc/nginx/sites-available/agents-viz.conf /etc/nginx/sites-enabled/agents-viz.conf
```

### 3. Create Certbot Directory

Create directory for Let's Encrypt ACME challenges:

```bash
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot
```

### 4. Test Nginx Configuration

Before reloading, test the configuration:

```bash
sudo nginx -t
```

Expected output:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

If there are errors, fix them before proceeding.

### 5. Obtain SSL Certificate with Certbot

Install certbot if not already installed:

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

Obtain certificate for ai.setrox.com.tr:

```bash
sudo certbot certonly --webroot -w /var/www/certbot -d ai.setrox.com.tr
```

Follow the prompts:
- Enter email address for renewal notifications
- Agree to terms of service
- Choose whether to share email with EFF (optional)

Certbot will create certificates at:
- `/etc/letsencrypt/live/ai.setrox.com.tr/fullchain.pem`
- `/etc/letsencrypt/live/ai.setrox.com.tr/privkey.pem`

### 6. Reload Nginx

After obtaining the SSL certificate, reload nginx:

```bash
sudo systemctl reload nginx
```

Or restart if reload doesn't work:

```bash
sudo systemctl restart nginx
```

### 7. Start the Application

Start the Node.js server:

```bash
cd /home/setrox/.openclaw/agent-activity-viz
node dist/server/index.js
```

For production, use a process manager like PM2:

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start dist/server/index.js --name agent-activity-viz

# Save PM2 configuration
pm2 save

# Configure PM2 to start on system boot
pm2 startup
```

### 8. Verify Deployment

Test the deployment:

1. **HTTP to HTTPS redirect:**
   ```bash
   curl -I http://ai.setrox.com.tr/agents-viz
   # Should return 301 redirect to https://
   ```

2. **HTTPS access:**
   ```bash
   curl -I https://ai.setrox.com.tr/agents-viz
   # Should return 200 OK
   ```

3. **WebSocket connection:**
   Open browser to `https://ai.setrox.com.tr/agents-viz`
   - Check browser console for WebSocket connection
   - Should see "WebSocket connected" or similar message
   - Connection status indicator should be green

4. **Static asset caching:**
   ```bash
   curl -I https://ai.setrox.com.tr/agents-viz/assets/index.js
   # Should include: Cache-Control: public, max-age=3600
   ```

5. **Rate limiting:**
   Test by opening 11+ WebSocket connections from same IP
   - 11th connection should be rejected with 429 status

## Configuration Details

### Nginx Configuration Highlights

- **Port:** Application runs on localhost:3503
- **URL Path:** `/agents-viz` (proxied to root `/` on backend)
- **WebSocket Support:** Upgrade and Connection headers configured
- **SSL/TLS:** TLS 1.2 and 1.3 enabled
- **Rate Limiting:** Max 10 concurrent WebSocket connections per IP
- **Static Asset Caching:** 1 hour (3600 seconds) for JS, CSS, images, fonts
- **Security Headers:** HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection

### Environment Variables

The application uses default configuration:
- WebSocket server port: 3503
- Agent data directory: `~/.openclaw/agents/`
- Dashboard data: `~/.openclaw/workspaces/dashboard/data.json`

To customize, set environment variables before starting:

```bash
export WS_PORT=3503
export OPENCLAW_HOME=/home/setrox/.openclaw
node dist/server/index.js
```

## Certificate Renewal

Let's Encrypt certificates expire after 90 days. Certbot sets up automatic renewal.

Test renewal:

```bash
sudo certbot renew --dry-run
```

Check renewal timer:

```bash
sudo systemctl status certbot.timer
```

Manual renewal (if needed):

```bash
sudo certbot renew
sudo systemctl reload nginx
```

## Troubleshooting

### Nginx won't start

Check error logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

Common issues:
- Port 80/443 already in use
- SSL certificate files not found (run certbot first)
- Syntax errors in config (run `nginx -t`)

### WebSocket connections fail

Check:
1. Application is running on port 3503
2. Firewall allows port 3503 from localhost
3. Nginx error logs: `/var/log/nginx/agents-viz-error.log`
4. Application logs

Test direct connection:
```bash
curl http://localhost:3503/
# Should return HTML page
```

### Rate limiting too aggressive

Edit `/etc/nginx/sites-available/agents-viz.conf`:

```nginx
# Increase limit from 10 to desired number
limit_conn ws_limit 20;  # Allow 20 connections per IP
```

Then reload nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### SSL certificate issues

Check certificate status:
```bash
sudo certbot certificates
```

Regenerate certificate:
```bash
sudo certbot delete --cert-name ai.setrox.com.tr
sudo certbot certonly --webroot -w /var/www/certbot -d ai.setrox.com.tr
sudo systemctl reload nginx
```

## Logs

Application logs (if using PM2):
```bash
pm2 logs agent-activity-viz
```

Nginx access logs:
```bash
sudo tail -f /var/log/nginx/agents-viz-access.log
```

Nginx error logs:
```bash
sudo tail -f /var/log/nginx/agents-viz-error.log
```

## Updating the Application

To deploy updates:

```bash
# Pull latest code
cd /home/setrox/.openclaw/agent-activity-viz
git pull

# Rebuild
npm install
npm run build

# Restart application
pm2 restart agent-activity-viz

# No nginx reload needed unless config changed
```

## Security Considerations

1. **SSL/TLS:** Always use HTTPS in production (handled by nginx config)
2. **Rate Limiting:** Prevents WebSocket DoS attacks (10 connections per IP)
3. **Security Headers:** HSTS, X-Frame-Options protect against common attacks
4. **Firewall:** Ensure port 3503 is NOT exposed to internet (nginx proxies on 443)
5. **Updates:** Keep certbot and nginx updated

```bash
# Update system packages
sudo apt update && sudo apt upgrade
```

## Monitoring

Monitor application health:

```bash
# Check if app is running
pm2 status

# Check nginx status
sudo systemctl status nginx

# Check WebSocket connections
sudo netstat -an | grep :3503

# Check rate limiting
sudo grep "limiting connections" /var/log/nginx/agents-viz-error.log
```

## Rollback

If deployment fails:

```bash
# Stop the application
pm2 stop agent-activity-viz

# Disable nginx site
sudo rm /etc/nginx/sites-enabled/agents-viz.conf
sudo systemctl reload nginx

# Revert code
git checkout <previous-commit-hash>
npm install
npm run build
```

## Production Checklist

- [ ] Application builds without errors
- [ ] Tests pass
- [ ] Typecheck passes
- [ ] Nginx config syntax valid (`nginx -t`)
- [ ] SSL certificate obtained
- [ ] Application running on port 3503
- [ ] HTTPS access works
- [ ] WebSocket connections work
- [ ] Static assets cached (check headers)
- [ ] Rate limiting tested (11+ connections rejected)
- [ ] PM2 configured for auto-restart
- [ ] Logs are being written
- [ ] Certificate auto-renewal configured
- [ ] Firewall rules correct (80, 443 open; 3503 localhost only)
