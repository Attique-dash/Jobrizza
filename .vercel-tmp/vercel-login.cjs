#!/usr/bin/env node
const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const isWindows = os.platform() === 'win32';
const tmpDir = path.join(process.cwd(), '.vercel-tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
if (!isWindows) { try { fs.chmodSync(tmpDir, 0o700); } catch (e) {} }
const LOG_FILE = path.join(tmpDir, 'login.log');

function log(msg) { console.error(msg); }

log('Checking login status...');
try {
  const result = spawnSync('vercel', ['whoami'], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  const output = (result.stdout || '').trim();
  if (result.status === 0 && output && !output.includes('Error') && !output.includes('not logged in')) {
    log('Logged in as: ' + output);
    console.log(JSON.stringify({ status: 'already_logged_in', message: 'Already logged in as ' + output }));
    process.exit(0);
  }
} catch (e) {}

log('Starting login...');
const logStream = fs.openSync(LOG_FILE, 'w');
const child = spawn('vercel', ['login'], { detached: true, stdio: ['ignore', logStream, logStream] });
child.unref();
log('Background login process started (PID: ' + child.pid + ')');
fs.writeFileSync(LOG_FILE + '.pid', String(child.pid));

(async () => {
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      if (fs.existsSync(LOG_FILE)) {
        const content = fs.readFileSync(LOG_FILE, 'utf8');
        const match = content.match(/https:\/\/vercel\.com\/oauth\/device\?user_code=[A-Z0-9-]+(?=\s|$)/);
        if (match) {
          const url = match[0];
          log('Authorization URL: ' + url);
          try { spawnSync('open', [url], { stdio: 'ignore' }); log('Browser opened.'); } catch(e) {}
          console.log(JSON.stringify({ status: 'needs_auth', auth_url: url, log_file: LOG_FILE }));
          process.exit(0);
        }
      }
    } catch (e) {}
  }
  log('Failed to get authorization URL');
  try { log('Log: ' + fs.readFileSync(LOG_FILE, 'utf8')); } catch(e) {}
  process.exit(1);
})();
