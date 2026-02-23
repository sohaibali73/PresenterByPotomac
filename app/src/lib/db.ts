import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'presenter.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('journal_mode = WAL');

// Run migrations for existing databases
try {
  // Add pptx_base64 column if missing
  const columns = db.prepare("PRAGMA table_info(presentations)").all() as any[];
  const hasPptxBase64 = columns.some(c => c.name === 'pptx_base64');
  if (!hasPptxBase64) {
    db.exec('ALTER TABLE presentations ADD COLUMN pptx_base64 TEXT');
    console.log('Added pptx_base64 column to presentations table');
  }
} catch (e) {
  console.log('Migration check skipped (table may not exist yet)');
}

// Initialize schema
db.exec(`
  -- Assets table: logos, icons, backgrounds, charts
  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('logo', 'icon', 'background', 'chart', 'image')),
    category TEXT DEFAULT 'general',
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    width INTEGER,
    height INTEGER,
    metadata TEXT, -- JSON string for additional data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Templates table: custom slide layouts
  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'custom',
    layout_type TEXT NOT NULL, -- cover, section_divider, content, chart, etc.
    slide_config TEXT NOT NULL, -- JSON: full slide configuration
    thumbnail_path TEXT,
    is_public INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Template assets junction (many-to-many)
  CREATE TABLE IF NOT EXISTS template_assets (
    template_id TEXT NOT NULL,
    asset_id TEXT NOT NULL,
    position TEXT, -- e.g., 'logo', 'background', 'badge'
    PRIMARY KEY (template_id, asset_id),
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
  );

  -- Presentations history
  CREATE TABLE IF NOT EXISTS presentations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    outline TEXT, -- JSON of the full outline
    template_id TEXT,
    theme TEXT DEFAULT 'classic',
    file_path TEXT,
    slide_count INTEGER,
    pptx_base64 TEXT, -- Store the generated PPTX
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Presentation versions for undo/redo and history
  CREATE TABLE IF NOT EXISTS presentation_versions (
    id TEXT PRIMARY KEY,
    presentation_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    outline TEXT NOT NULL, -- JSON snapshot of the outline at this version
    theme TEXT DEFAULT 'classic',
    change_description TEXT, -- Optional description of what changed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (presentation_id) REFERENCES presentations(id) ON DELETE CASCADE
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
  CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
  CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
  CREATE INDEX IF NOT EXISTS idx_templates_layout_type ON templates(layout_type);
`);

export interface Asset {
  id: string;
  name: string;
  type: 'logo' | 'icon' | 'background' | 'chart' | 'image';
  category: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  layout_type: string;
  slide_config: SlideConfig;
  thumbnail_path?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface SlideConfig {
  background: { color?: string; image?: string; gradient?: any };
  elements: SlideElement[];
  master?: string;
}

export interface SlideElement {
  id: string;
  type: 'text' | 'shape' | 'image' | 'table' | 'chart';
  x: number;
  y: number;
  w: number;
  h: number;
  style?: Record<string, any>;
  content?: string | Record<string, any>;
  options?: Record<string, any>;
}

export interface Presentation {
  id: string;
  title: string;
  outline?: any;
  template_id?: string;
  theme: string;
  file_path?: string;
  slide_count?: number;
  pptx_base64?: string;
  created_at: string;
  updated_at?: string;
}

export interface PresentationVersion {
  id: string;
  presentation_id: string;
  version_number: number;
  outline: any;
  theme: string;
  change_description?: string;
  created_at: string;
}

// Asset operations
export const assetDb = {
  create: (asset: Omit<Asset, 'created_at' | 'updated_at'>): Asset => {
    const stmt = db.prepare(`
      INSERT INTO assets (id, name, type, category, file_path, file_size, mime_type, width, height, metadata)
      VALUES (@id, @name, @type, @category, @file_path, @file_size, @mime_type, @width, @height, @metadata)
    `);
    stmt.run({
      ...asset,
      metadata: asset.metadata ? JSON.stringify(asset.metadata) : null
    });
    return assetDb.getById(asset.id)!;
  },

  getById: (id: string): Asset | undefined => {
    const stmt = db.prepare('SELECT * FROM assets WHERE id = ?');
    const row = stmt.get(id) as any;
    if (row?.metadata) row.metadata = JSON.parse(row.metadata);
    return row;
  },

  getAll: (type?: string, category?: string): Asset[] => {
    let sql = 'SELECT * FROM assets WHERE 1=1';
    const params: any[] = [];
    if (type) { sql += ' AND type = ?'; params.push(type); }
    if (category) { sql += ' AND category = ?'; params.push(category); }
    sql += ' ORDER BY created_at DESC';
    const stmt = db.prepare(sql);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => {
      if (row.metadata) row.metadata = JSON.parse(row.metadata);
      return row;
    });
  },

  update: (id: string, data: Partial<Asset>): Asset | undefined => {
    const fields = Object.keys(data).filter(k => k !== 'id');
    const setClause = fields.map(f => `${f} = @${f}`).join(', ');
    const stmt = db.prepare(`UPDATE assets SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`);
    stmt.run({ id, ...data });
    return assetDb.getById(id);
  },

  delete: (id: string): boolean => {
    const asset = assetDb.getById(id);
    if (asset) {
      // Delete file - resolve path
      try {
        const filePath = path.isAbsolute(asset.file_path) ? asset.file_path : path.join(process.cwd(), 'data', 'uploads', asset.file_path);
        fs.unlinkSync(filePath);
      } catch (e) {}
    }
    const stmt = db.prepare('DELETE FROM assets WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

// Template operations
export const templateDb = {
  create: (template: Omit<Template, 'created_at' | 'updated_at'>): Template => {
    const stmt = db.prepare(`
      INSERT INTO templates (id, name, description, category, layout_type, slide_config, thumbnail_path, is_public)
      VALUES (@id, @name, @description, @category, @layout_type, @slide_config, @thumbnail_path, @is_public)
    `);
    stmt.run({
      ...template,
      description: template.description || '',
      thumbnail_path: template.thumbnail_path || null,
      slide_config: JSON.stringify(template.slide_config),
      is_public: template.is_public ? 1 : 0
    });
    return templateDb.getById(template.id)!;
  },

  getById: (id: string): Template | undefined => {
    const stmt = db.prepare('SELECT * FROM templates WHERE id = ?');
    const row = stmt.get(id) as any;
    if (row) {
      row.slide_config = JSON.parse(row.slide_config);
      row.is_public = !!row.is_public;
    }
    return row;
  },

  getAll: (category?: string, layoutType?: string): Template[] => {
    let sql = 'SELECT * FROM templates WHERE 1=1';
    const params: any[] = [];
    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (layoutType) { sql += ' AND layout_type = ?'; params.push(layoutType); }
    sql += ' ORDER BY created_at DESC';
    const stmt = db.prepare(sql);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => {
      row.slide_config = JSON.parse(row.slide_config);
      row.is_public = !!row.is_public;
      return row;
    });
  },

  update: (id: string, data: Partial<Template>): Template | undefined => {
    const fields = Object.keys(data).filter(k => k !== 'id');
    const setClause = fields.map(f => {
      if (f === 'slide_config') return 'slide_config = @slide_config';
      if (f === 'is_public') return 'is_public = @is_public';
      return `${f} = @${f}`;
    }).join(', ');
    const stmt = db.prepare(`UPDATE templates SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`);
    const params: any = { id };
    if (data.slide_config) params.slide_config = JSON.stringify(data.slide_config);
    if (data.is_public !== undefined) params.is_public = data.is_public ? 1 : 0;
    Object.assign(params, data);
    stmt.run(params);
    return templateDb.getById(id);
  },

  delete: (id: string): boolean => {
    const stmt = db.prepare('DELETE FROM templates WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

// Presentation operations
export const presentationDb = {
  create: (pres: Omit<Presentation, 'created_at' | 'updated_at'>): Presentation => {
    const stmt = db.prepare(`
      INSERT INTO presentations (id, title, outline, template_id, theme, file_path, slide_count, pptx_base64)
      VALUES (@id, @title, @outline, @template_id, @theme, @file_path, @slide_count, @pptx_base64)
    `);
    stmt.run({
      ...pres,
      template_id: pres.template_id || null,
      file_path: pres.file_path || null,
      pptx_base64: pres.pptx_base64 || null,
      outline: pres.outline ? JSON.stringify(pres.outline) : null
    });
    return presentationDb.getById(pres.id)!;
  },

  getById: (id: string): Presentation | undefined => {
    const stmt = db.prepare('SELECT * FROM presentations WHERE id = ?');
    const row = stmt.get(id) as any;
    if (row?.outline) row.outline = JSON.parse(row.outline);
    return row;
  },

  getAll: (limit = 50): Presentation[] => {
    const stmt = db.prepare('SELECT * FROM presentations ORDER BY created_at DESC LIMIT ?');
    const rows = stmt.all(limit) as any[];
    return rows.map(row => {
      if (row.outline) row.outline = JSON.parse(row.outline);
      return row;
    });
  },

  update: (id: string, data: Partial<Presentation>): Presentation | undefined => {
    const fields = Object.keys(data).filter(k => k !== 'id');
    const setClause = fields.map(f => `${f} = @${f}`).join(', ');
    const stmt = db.prepare(`UPDATE presentations SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`);
    const params: any = { id, ...data };
    if (data.outline) params.outline = JSON.stringify(data.outline);
    stmt.run(params);
    return presentationDb.getById(id);
  },

  delete: (id: string): boolean => {
    const stmt = db.prepare('DELETE FROM presentations WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

// Presentation version operations for undo/redo and history
export const versionDb = {
  create: (version: Omit<PresentationVersion, 'created_at'>): PresentationVersion => {
    const stmt = db.prepare(`
      INSERT INTO presentation_versions (id, presentation_id, version_number, outline, theme, change_description)
      VALUES (@id, @presentation_id, @version_number, @outline, @theme, @change_description)
    `);
    stmt.run({
      ...version,
      outline: JSON.stringify(version.outline),
      change_description: version.change_description || null
    });
    return versionDb.getById(version.id)!;
  },

  getById: (id: string): PresentationVersion | undefined => {
    const stmt = db.prepare('SELECT * FROM presentation_versions WHERE id = ?');
    const row = stmt.get(id) as any;
    if (row?.outline) row.outline = JSON.parse(row.outline);
    return row;
  },

  getByPresentationId: (presentationId: string): PresentationVersion[] => {
    const stmt = db.prepare('SELECT * FROM presentation_versions WHERE presentation_id = ? ORDER BY version_number DESC');
    const rows = stmt.all(presentationId) as any[];
    return rows.map(row => {
      if (row.outline) row.outline = JSON.parse(row.outline);
      return row;
    });
  },

  getLatestVersion: (presentationId: string): PresentationVersion | undefined => {
    const stmt = db.prepare('SELECT * FROM presentation_versions WHERE presentation_id = ? ORDER BY version_number DESC LIMIT 1');
    const row = stmt.get(presentationId) as any;
    if (row?.outline) row.outline = JSON.parse(row.outline);
    return row;
  },

  getVersionByNumber: (presentationId: string, versionNumber: number): PresentationVersion | undefined => {
    const stmt = db.prepare('SELECT * FROM presentation_versions WHERE presentation_id = ? AND version_number = ?');
    const row = stmt.get(presentationId, versionNumber) as any;
    if (row?.outline) row.outline = JSON.parse(row.outline);
    return row;
  },

  getNextVersionNumber: (presentationId: string): number => {
    const stmt = db.prepare('SELECT MAX(version_number) as max FROM presentation_versions WHERE presentation_id = ?');
    const row = stmt.get(presentationId) as any;
    return (row?.max || 0) + 1;
  },

  deleteOldVersions: (presentationId: string, keepCount: number = 20): number => {
    // Get versions to delete (keep only the latest N)
    const versions = versionDb.getByPresentationId(presentationId);
    if (versions.length <= keepCount) return 0;
    
    const toDelete = versions.slice(keepCount);
    const stmt = db.prepare('DELETE FROM presentation_versions WHERE id = ?');
    let deleted = 0;
    for (const v of toDelete) {
      stmt.run(v.id);
      deleted++;
    }
    return deleted;
  },

  delete: (id: string): boolean => {
    const stmt = db.prepare('DELETE FROM presentation_versions WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  deleteByPresentationId: (presentationId: string): boolean => {
    const stmt = db.prepare('DELETE FROM presentation_versions WHERE presentation_id = ?');
    const result = stmt.run(presentationId);
    return result.changes > 0;
  }
};

export default db;
