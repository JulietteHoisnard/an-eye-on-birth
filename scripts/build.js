#!/usr/bin/env node
// Build script — copies site to dist/ and substitutes {{ENV.*}} placeholders
// from .env into all HTML files.

const fs   = require('fs');
const path = require('path');

// ── Load .env ────────────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('ERROR: .env file not found. Copy .env.example to .env and fill in your values.');
  process.exit(1);
}

const env = {};
fs.readFileSync(envPath, 'utf8')
  .split('\n')
  .forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    env[key] = val;
  });

// ── Helpers ──────────────────────────────────────────────────────────────────
const SRC  = path.join(__dirname, '..');
const DIST = path.join(SRC, 'dist');

// Files / dirs to exclude from the dist copy
const EXCLUDE = new Set(['.env', '.env.example', '.gitignore', 'dist', 'node_modules', 'scripts', 'package.json', 'package-lock.json']);

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    if (EXCLUDE.has(entry)) continue;
    const srcPath  = path.join(src, entry);
    const destPath = path.join(dest, entry);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function substitute(content) {
  return content.replace(/\{\{ENV\.(\w+)\}\}/g, (match, key) => {
    if (key in env) return env[key];
    console.warn(`  WARNING: placeholder {{ENV.${key}}} found but not defined in .env`);
    return match;
  });
}

// ── Build ────────────────────────────────────────────────────────────────────
console.log('Building to dist/...');

// Clean dist
fs.rmSync(DIST, { recursive: true, force: true });

// Copy everything
copyDir(SRC, DIST);

// Substitute placeholders in all HTML files
let count = 0;
function processHtml(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      processHtml(fullPath);
    } else if (entry.endsWith('.html')) {
      const original    = fs.readFileSync(fullPath, 'utf8');
      const substituted = substitute(original);
      if (original !== substituted) {
        fs.writeFileSync(fullPath, substituted, 'utf8');
        console.log(`  substituted: ${path.relative(DIST, fullPath)}`);
        count++;
      }
    }
  }
}
processHtml(DIST);

console.log(`Done. ${count} file(s) had placeholders substituted.`);
console.log(`Serve the dist/ folder.`);
