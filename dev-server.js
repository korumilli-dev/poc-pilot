/**
 * dev-server.js — Local development server for PocPilot
 *
 * Serves the frontend from /src and routes /api/generate-report
 * to the serverless function, loading environment variables from .env.
 *
 * Usage:
 *   node dev-server.js
 *   Then open: http://localhost:3000
 */

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const START_PORT = parseInt(process.env.PORT) || 3000;
const SRC_DIR = join(__dirname, 'src');

// ------------------------------------------------------------------
// Load .env into process.env
// ------------------------------------------------------------------
function loadEnv() {
  const envPath = join(__dirname, '.env');
  if (!existsSync(envPath)) {
    console.warn('⚠️  No .env file found. LLM report will use deterministic fallback.');
    return;
  }
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^"|"$|^'|'$/g, '');
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
  console.log('✅ Loaded .env variables');
}
loadEnv();

// ------------------------------------------------------------------
// Import the serverless handler (ESM)
// ------------------------------------------------------------------
import handler from './api/generate-report.js';

// ------------------------------------------------------------------
// MIME types
// ------------------------------------------------------------------
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.txt': 'text/plain',
};

// ------------------------------------------------------------------
// Parse request body
// ------------------------------------------------------------------
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// ------------------------------------------------------------------
// Serve static file
// ------------------------------------------------------------------
async function serveFile(res, filePath) {
  try {
    if (!existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      filePath = join(filePath, 'index.html');
    }
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server error');
  }
}

// ------------------------------------------------------------------
// Create HTTP server
// ------------------------------------------------------------------
const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${START_PORT}`);
  const pathname = url.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API route: /api/generate-report
  if (pathname === '/api/generate-report' && req.method === 'POST') {
    try {
      const body = await parseBody(req);

      // Wrap Node req/res to match Vercel's interface
      const vercelReq = {
        method: req.method,
        body,
        headers: req.headers,
        query: Object.fromEntries(url.searchParams),
      };

      const vercelRes = {
        statusCode: 200,
        headers: {},
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(data) { this.body = data; return this; },
        setHeader(k, v) { this.headers[k] = v; return this; },
      };

      await handler(vercelReq, vercelRes);

      res.writeHead(vercelRes.statusCode, {
        'Content-Type': 'application/json',
        ...vercelRes.headers,
      });
      res.end(JSON.stringify(vercelRes.body));
    } catch (err) {
      console.error('API error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Static files from /src
  const filePath = join(SRC_DIR, pathname === '/' ? 'index.html' : pathname.slice(1));
  await serveFile(res, filePath);
});

// ------------------------------------------------------------------
// Start — try ports starting from START_PORT
// ------------------------------------------------------------------
function startServer(port) {
  server.listen(port, () => {
    console.log(`\n🚀 PocPilot local server running at http://localhost:${port}`);
    console.log(`📁 Serving frontend from: ${SRC_DIR}`);
    console.log(`🔌 API endpoint: http://localhost:${port}/api/generate-report`);
    console.log(`🔑 OpenRouter configured: ${!!process.env.OPENROUTER_API_KEY}`);
    console.log(`\n   Press Ctrl+C to stop\n`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`⚠️  Port ${START_PORT} is in use, trying ${START_PORT + 1}...`);
    setTimeout(() => startServer(START_PORT + 1), 100);
  } else {
    console.error('Server error:', err.message);
    process.exit(1);
  }
});

startServer(START_PORT);
