#!/usr/bin/env node
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'presenter.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Fix all file_path entries to store just the filename
const assets = db.prepare('SELECT id, file_path FROM assets').all();
let fixed = 0;

for (const asset of assets) {
  const oldPath = asset.file_path;
  const filename = path.basename(oldPath);
  
  if (oldPath !== filename) {
    db.prepare('UPDATE assets SET file_path = ? WHERE id = ?').run(filename, asset.id);
    fixed++;
    console.log(`✓ ${asset.id}: → ${filename}`);
  }
}

console.log(`\nFixed ${fixed} asset paths to filenames only.`);
db.close();
