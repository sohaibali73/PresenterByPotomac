#!/usr/bin/env node
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SOURCE_DIR = 'C:\\Users\\SohaibAli\\Pictures\\Assets for Presentation';
const UPLOADS_DIR = path.join(__dirname, '..', 'data', 'uploads');
const DB_PATH = path.join(__dirname, '..', 'data', 'presenter.db');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const MIME_TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.webp': 'image/webp' };

function detectType(name) {
  const lower = name.toLowerCase();
  if (lower.includes('logo')) return 'logo';
  if (lower.includes('icon')) return 'icon';
  if (lower.includes('chart') || lower.includes('extracted')) return 'chart';
  return 'image';
}

function detectCategory(name) {
  const lower = name.toLowerCase();
  if (lower.includes('logo') || lower.includes('icon') || lower.includes('potomac')) return 'branding';
  if (lower.includes('bull') || lower.includes('bear') || lower.includes('guardian') || lower.includes('income') || lower.includes('navi') || lower.includes('btcr')) return 'strategy';
  if (lower.includes('extracted') || lower.includes('chart')) return 'charts';
  return 'general';
}

const files = fs.readdirSync(SOURCE_DIR);
const stmt = db.prepare(`INSERT OR IGNORE INTO assets (id, name, type, category, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?, ?)`);

let imported = 0;
for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (!MIME_TYPES[ext]) { console.log('Skipping:', file); continue; }

  const id = crypto.randomUUID();
  const destFilename = `${id}${ext}`;
  const destPath = path.join(UPLOADS_DIR, destFilename);
  const srcPath = path.join(SOURCE_DIR, file);

  fs.copyFileSync(srcPath, destPath);
  const stats = fs.statSync(destPath);

  stmt.run(id, file, detectType(file), detectCategory(file), destPath, stats.size, MIME_TYPES[ext]);
  imported++;
  console.log(`✓ ${file} → ${destFilename} (${detectType(file)}/${detectCategory(file)})`);
}

console.log(`\nImported ${imported} assets into database.`);
db.close();
