import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Service file should be in project root (2 levels up from dist/__tests__)
const SERVICE_FILE_PATH = path.resolve(__dirname, '../../agent-activity-viz.service');
const INSTALL_SCRIPT_PATH = path.resolve(__dirname, '../../install-service.sh');

test('systemd service file exists', () => {
  assert.ok(fs.existsSync(SERVICE_FILE_PATH), 'Service file should exist at project root');
});

test('service file is readable', () => {
  const stats = fs.statSync(SERVICE_FILE_PATH);
  assert.ok(stats.isFile(), 'Service file should be a file');
  assert.ok(stats.mode & fs.constants.R_OK, 'Service file should be readable');
});

test('install script exists', () => {
  assert.ok(fs.existsSync(INSTALL_SCRIPT_PATH), 'Install script should exist at project root');
});

test('install script is executable', () => {
  const stats = fs.statSync(INSTALL_SCRIPT_PATH);
  assert.ok(stats.isFile(), 'Install script should be a file');
  // Check if executable bit is set for user
  assert.ok(stats.mode & 0o100, 'Install script should be executable');
});

test('service file contains [Unit] section', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('[Unit]'), 'Service file should have [Unit] section');
});

test('service file contains Description', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('Description='), 'Service file should have Description');
  assert.ok(content.includes('Agent Activity Visualizer'), 'Description should mention Agent Activity Visualizer');
});

test('service file has After=network.target', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('After=network.target'), 'Service should start after network is available');
});

test('service file contains [Service] section', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('[Service]'), 'Service file should have [Service] section');
});

test('service Type is simple', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('Type=simple'), 'Service type should be simple');
});

test('service runs as setrox user', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('User=setrox'), 'Service should run as setrox user');
});

test('service runs with setrox group', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('Group=setrox'), 'Service should run with setrox group');
});

test('service has correct WorkingDirectory', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('WorkingDirectory=/home/setrox/.openclaw/agent-activity-viz'), 
    'WorkingDirectory should point to project root');
});

test('service has ExecStart command', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('ExecStart='), 'Service should have ExecStart command');
});

test('ExecStart uses node to run server', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('ExecStart=/usr/bin/node dist/server/index.js'), 
    'ExecStart should run node with dist/server/index.js');
});

test('service has Restart=always', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('Restart=always'), 'Service should have Restart=always for auto-restart');
});

test('service has RestartSec=5', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('RestartSec=5'), 'Service should have 5 second restart delay');
});

test('StandardOutput is journal', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('StandardOutput=journal'), 
    'StandardOutput should be directed to journal');
});

test('StandardError is journal', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('StandardError=journal'), 
    'StandardError should be directed to journal');
});

test('service has SyslogIdentifier', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('SyslogIdentifier=agent-activity-viz'), 
    'Service should have SyslogIdentifier for easier log filtering');
});

test('service file contains [Install] section', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('[Install]'), 'Service file should have [Install] section');
});

test('service has WantedBy=multi-user.target', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('WantedBy=multi-user.target'), 
    'Service should be enabled in multi-user.target for auto-start');
});

test('service has NODE_ENV=production', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('Environment="NODE_ENV=production"'), 
    'Service should set NODE_ENV to production');
});

test('service has PATH environment variable', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('Environment="PATH='), 
    'Service should set PATH for node binary access');
});

test('service has security hardening: NoNewPrivileges', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('NoNewPrivileges=true'), 
    'Service should have NoNewPrivileges for security');
});

test('service has security hardening: PrivateTmp', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('PrivateTmp=true'), 
    'Service should have PrivateTmp for security');
});

test('service has security hardening: ProtectSystem', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('ProtectSystem=strict'), 
    'Service should have ProtectSystem for security');
});

test('service has security hardening: ProtectHome', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('ProtectHome=read-only'), 
    'Service should have ProtectHome for security');
});

test('service has ReadWritePaths for .openclaw directory', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('ReadWritePaths=/home/setrox/.openclaw'), 
    'Service should have ReadWritePaths for .openclaw directory access');
});

test('install script has shebang', () => {
  const content = fs.readFileSync(INSTALL_SCRIPT_PATH, 'utf-8');
  assert.ok(content.startsWith('#!/bin/bash'), 'Install script should have bash shebang');
});

test('install script checks for root privileges', () => {
  const content = fs.readFileSync(INSTALL_SCRIPT_PATH, 'utf-8');
  assert.ok(content.includes('EUID'), 'Install script should check for root privileges');
  assert.ok(content.includes('sudo'), 'Install script should mention sudo in error message');
});

test('install script copies service file', () => {
  const content = fs.readFileSync(INSTALL_SCRIPT_PATH, 'utf-8');
  assert.ok(content.includes('cp "$SERVICE_FILE"'), 'Install script should copy service file');
  assert.ok(content.includes('/etc/systemd/system'), 'Install script should copy to systemd directory');
});

test('install script reloads systemd daemon', () => {
  const content = fs.readFileSync(INSTALL_SCRIPT_PATH, 'utf-8');
  assert.ok(content.includes('systemctl daemon-reload'), 'Install script should reload systemd daemon');
});

test('install script enables service', () => {
  const content = fs.readFileSync(INSTALL_SCRIPT_PATH, 'utf-8');
  assert.ok(content.includes('systemctl enable'), 'Install script should enable service for auto-start');
});

test('install script starts service', () => {
  const content = fs.readFileSync(INSTALL_SCRIPT_PATH, 'utf-8');
  assert.ok(content.includes('systemctl start'), 'Install script should start the service');
});

test('install script shows status', () => {
  const content = fs.readFileSync(INSTALL_SCRIPT_PATH, 'utf-8');
  assert.ok(content.includes('systemctl status'), 'Install script should show service status');
});

test('install script uses set -e for error handling', () => {
  const content = fs.readFileSync(INSTALL_SCRIPT_PATH, 'utf-8');
  assert.ok(content.includes('set -e'), 'Install script should use set -e for error handling');
});

test('install script provides helpful output', () => {
  const content = fs.readFileSync(INSTALL_SCRIPT_PATH, 'utf-8');
  assert.ok(content.includes('Useful commands'), 'Install script should provide usage examples');
  assert.ok(content.includes('journalctl'), 'Install script should mention journalctl for logs');
});

test('service file has proper line endings', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  // Should not have Windows-style line endings
  assert.ok(!content.includes('\r\n'), 'Service file should use Unix line endings');
});

test('service file sections are in correct order', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  const unitIndex = content.indexOf('[Unit]');
  const serviceIndex = content.indexOf('[Service]');
  const installIndex = content.indexOf('[Install]');
  
  assert.ok(unitIndex < serviceIndex, '[Unit] should come before [Service]');
  assert.ok(serviceIndex < installIndex, '[Service] should come before [Install]');
});

test('ExecStart path matches expected node location', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  // Node should be in /usr/bin or /usr/local/bin
  const execMatch = content.match(/ExecStart=([^\s]+)/);
  assert.ok(execMatch, 'ExecStart should be found');
  const nodePath = execMatch[1];
  assert.ok(nodePath.includes('/usr/bin/node') || nodePath.includes('/usr/local/bin/node'),
    'Node path should be /usr/bin/node or /usr/local/bin/node');
});

test('service has documentation link', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  assert.ok(content.includes('Documentation='), 'Service should have Documentation field');
  assert.ok(content.includes('github.com'), 'Documentation should link to GitHub');
});

test('install script validates service file exists', () => {
  const content = fs.readFileSync(INSTALL_SCRIPT_PATH, 'utf-8');
  assert.ok(content.includes('! -f "$SERVICE_FILE"'), 
    'Install script should check if service file exists');
});

test('service file is valid INI format', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  const lines = content.split('\n');
  
  let inSection = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      inSection = true;
      continue;
    }
    
    if (inSection && trimmed.includes('=')) {
      // Valid key=value line
      continue;
    }
    
    // If we get here and line is not empty/comment, it's invalid
    if (inSection && trimmed.length > 0 && !trimmed.includes('=')) {
      assert.fail(`Invalid line in service file: "${line}"`);
    }
  }
});

test('service restart behavior is configured correctly', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  
  // Should have Restart=always
  assert.ok(content.includes('Restart=always'), 'Should have Restart=always');
  
  // Should have RestartSec
  const restartSecMatch = content.match(/RestartSec=(\d+)/);
  assert.ok(restartSecMatch, 'Should have RestartSec value');
  const restartSec = parseInt(restartSecMatch[1]);
  assert.ok(restartSec >= 5 && restartSec <= 10, 
    'RestartSec should be between 5-10 seconds (configured: ' + restartSec + ')');
});

test('service working directory matches project structure', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  const workDirMatch = content.match(/WorkingDirectory=(.+)/);
  assert.ok(workDirMatch, 'WorkingDirectory should be set');
  
  const workDir = workDirMatch[1].trim();
  assert.ok(workDir.endsWith('agent-activity-viz'), 
    'WorkingDirectory should end with agent-activity-viz');
  assert.ok(workDir.includes('.openclaw'), 
    'WorkingDirectory should be in .openclaw directory');
});

test('service log configuration uses journald', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  
  // Both stdout and stderr should go to journal
  assert.ok(content.includes('StandardOutput=journal'), 
    'StandardOutput should use journal');
  assert.ok(content.includes('StandardError=journal'), 
    'StandardError should use journal');
  
  // Should have identifier for filtering
  assert.ok(content.includes('SyslogIdentifier='), 
    'Should have SyslogIdentifier for log filtering');
});

test('README or DEPLOY documentation exists', () => {
  const readmePath = path.resolve(__dirname, '../../README.md');
  const deployPath = path.resolve(__dirname, '../../DEPLOY.md');
  
  const hasReadme = fs.existsSync(readmePath);
  const hasDeploy = fs.existsSync(deployPath);
  
  assert.ok(hasReadme || hasDeploy, 
    'Should have README.md or DEPLOY.md with deployment documentation');
});

test('service configuration includes all required fields', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  
  const requiredFields = [
    'Description=',
    'After=',
    'Type=',
    'User=',
    'WorkingDirectory=',
    'ExecStart=',
    'Restart=',
    'RestartSec=',
    'StandardOutput=',
    'StandardError=',
    'WantedBy='
  ];
  
  for (const field of requiredFields) {
    assert.ok(content.includes(field), 
      `Service file should include required field: ${field}`);
  }
});

test('install script has error messages', () => {
  const content = fs.readFileSync(INSTALL_SCRIPT_PATH, 'utf-8');
  assert.ok(content.includes('Error:'), 'Install script should have error messages');
  assert.ok(content.match(/echo.*Error/), 'Error messages should be echoed to user');
});

test('service security settings are appropriate', () => {
  const content = fs.readFileSync(SERVICE_FILE_PATH, 'utf-8');
  
  // Security hardening settings
  const securitySettings = [
    'NoNewPrivileges=true',
    'PrivateTmp=true',
    'ProtectSystem=',
    'ProtectHome='
  ];
  
  for (const setting of securitySettings) {
    assert.ok(content.includes(setting), 
      `Service should have security setting: ${setting}`);
  }
  
  // But should allow read/write to .openclaw directory
  assert.ok(content.includes('ReadWritePaths='), 
    'Should have ReadWritePaths for necessary directories');
});
