/**
 * Analytics tracking and dashboard for Potomac Presenter
 */

import db from './db';

// Initialize analytics tables
db.exec(`
  -- Analytics events table
  CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    event_data TEXT, -- JSON
    user_id TEXT,
    session_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Daily stats aggregation
  CREATE TABLE IF NOT EXISTS daily_stats (
    date TEXT PRIMARY KEY,
    presentations_generated INTEGER DEFAULT 0,
    presentations_downloaded INTEGER DEFAULT 0,
    templates_used TEXT, -- JSON object with counts
    themes_used TEXT, -- JSON object with counts
    errors_count INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
  CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
`);

export type EventType = 
  | 'presentation_generated'
  | 'presentation_downloaded'
  | 'presentation_exported_pdf'
  | 'presentation_exported_images'
  | 'template_used'
  | 'ai_generation'
  | 'ai_refinement'
  | 'asset_uploaded'
  | 'template_created'
  | 'user_login'
  | 'error';

export interface AnalyticsEvent {
  id: string;
  event_type: EventType;
  event_data?: Record<string, any>;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Track an analytics event
 */
export function trackEvent(event: Omit<AnalyticsEvent, 'id'>): void {
  try {
    const id = crypto.randomUUID();
    const stmt = db.prepare(`
      INSERT INTO analytics_events (id, event_type, event_data, user_id, session_id, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      event.event_type,
      event.event_data ? JSON.stringify(event.event_data) : null,
      event.user_id || null,
      event.session_id || null,
      event.ip_address || null,
      event.user_agent || null
    );
  } catch (error) {
    console.error('Failed to track analytics event:', error);
  }
}

/**
 * Get analytics summary
 */
export function getAnalyticsSummary(days: number = 30): {
  totalEvents: number;
  eventsByType: Record<string, number>;
  dailyStats: Array<{
    date: string;
    presentations_generated: number;
    presentations_downloaded: number;
    errors_count: number;
  }>;
  topTemplates: Array<{ template: string; count: number }>;
  topThemes: Array<{ theme: string; count: number }>;
} {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Total events
  const totalStmt = db.prepare(`
    SELECT COUNT(*) as count FROM analytics_events 
    WHERE created_at >= ?
  `);
  const totalResult = totalStmt.get(cutoffDate) as any;
  const totalEvents = totalResult?.count || 0;

  // Events by type
  const typeStmt = db.prepare(`
    SELECT event_type, COUNT(*) as count 
    FROM analytics_events 
    WHERE created_at >= ?
    GROUP BY event_type
    ORDER BY count DESC
  `);
  const typeRows = typeStmt.all(cutoffDate) as any[];
  const eventsByType: Record<string, number> = {};
  typeRows.forEach(row => {
    eventsByType[row.event_type] = row.count;
  });

  // Daily stats
  const dailyStmt = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      SUM(CASE WHEN event_type = 'presentation_generated' THEN 1 ELSE 0 END) as presentations_generated,
      SUM(CASE WHEN event_type = 'presentation_downloaded' THEN 1 ELSE 0 END) as presentations_downloaded,
      SUM(CASE WHEN event_type = 'error' THEN 1 ELSE 0 END) as errors_count
    FROM analytics_events
    WHERE created_at >= ?
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `);
  const dailyStats = dailyStmt.all(cutoffDate) as any[];

  // Top templates
  const templateStmt = db.prepare(`
    SELECT 
      JSON_EXTRACT(event_data, '$.template') as template,
      COUNT(*) as count
    FROM analytics_events
    WHERE event_type = 'template_used' AND created_at >= ?
    GROUP BY template
    ORDER BY count DESC
    LIMIT 10
  `);
  const topTemplates = (templateStmt.all(cutoffDate) as any[])
    .filter(row => row.template)
    .map(row => ({ template: row.template, count: row.count }));

  // Top themes
  const themeStmt = db.prepare(`
    SELECT 
      JSON_EXTRACT(event_data, '$.theme') as theme,
      COUNT(*) as count
    FROM analytics_events
    WHERE event_type = 'presentation_generated' AND created_at >= ?
    GROUP BY theme
    ORDER BY count DESC
    LIMIT 10
  `);
  const topThemes = (themeStmt.all(cutoffDate) as any[])
    .filter(row => row.theme)
    .map(row => ({ theme: row.theme, count: row.count }));

  return {
    totalEvents,
    eventsByType,
    dailyStats,
    topTemplates,
    topThemes,
  };
}

/**
 * Get recent events
 */
export function getRecentEvents(limit: number = 100): Array<AnalyticsEvent & { created_at: string }> {
  const stmt = db.prepare(`
    SELECT * FROM analytics_events
    ORDER BY created_at DESC
    LIMIT ?
  `);
  
  const rows = stmt.all(limit) as any[];
  return rows.map(row => ({
    ...row,
    event_data: row.event_data ? JSON.parse(row.event_data) : null,
  }));
}

/**
 * Aggregate daily stats (run periodically)
 */
export function aggregateDailyStats(): void {
  const today = new Date().toISOString().split('T')[0];
  
  // Check if already aggregated
  const existing = db.prepare('SELECT date FROM daily_stats WHERE date = ?').get(today);
  if (existing) return;

  // Aggregate
  db.prepare(`
    INSERT OR REPLACE INTO daily_stats (date, presentations_generated, presentations_downloaded, errors_count)
    SELECT 
      DATE(created_at) as date,
      SUM(CASE WHEN event_type = 'presentation_generated' THEN 1 ELSE 0 END),
      SUM(CASE WHEN event_type = 'presentation_downloaded' THEN 1 ELSE 0 END),
      SUM(CASE WHEN event_type = 'error' THEN 1 ELSE 0 END)
    FROM analytics_events
    WHERE DATE(created_at) = ?
    GROUP BY DATE(created_at)
  `).run(today);
}

export default {
  trackEvent,
  getAnalyticsSummary,
  getRecentEvents,
  aggregateDailyStats,
};