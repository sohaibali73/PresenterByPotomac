import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'data', 'presenter.db'));
const stmt = db.prepare(`INSERT INTO templates (id, name, description, category, layout_type, slide_config, is_public, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`);

const templates = [
  { name: 'Cover - Annual Review', category: 'cover', layout_type: 'cover', config: '{"background":{"color":"#212121"},"elements":[{"id":"a","type":"shape","x":0,"y":0,"w":13.33,"h":0.08,"options":{"shape":"rect","fill":"#FEC00F"}},{"id":"t","type":"text","x":1,"y":3,"w":11.33,"h":1.5,"content":"ANNUAL REVIEW","style":{"fontSize":48,"bold":true,"color":"#FFFFFF","fontFace":"Rajdhani","align":"center"}}]}' },
  { name: 'Cover - Webinar', category: 'cover', layout_type: 'cover', config: '{"background":{"color":"#1A2744"},"elements":[{"id":"a","type":"shape","x":0,"y":0,"w":13.33,"h":0.08,"options":{"shape":"rect","fill":"#FEC00F"}},{"id":"t","type":"text","x":1,"y":3,"w":11.33,"h":1.5,"content":"WEBINAR","style":{"fontSize":56,"bold":true,"color":"#FEC00F","fontFace":"Rajdhani","align":"center"}}]}' },
  { name: 'Section - Agenda', category: 'section_divider', layout_type: 'section_divider', config: '{"background":{"color":"#212121"},"elements":[{"id":"t","type":"text","x":1,"y":3,"w":11.33,"h":1.5,"content":"AGENDA","style":{"fontSize":56,"bold":true,"color":"#FFFFFF","fontFace":"Rajdhani","align":"center"}}]}' },
  { name: 'Content - Summary', category: 'content', layout_type: 'content', config: '{"background":{"color":"#FFFFFF"},"elements":[{"id":"t","type":"text","x":0.5,"y":0.4,"w":12,"h":0.8,"content":"SUMMARY","style":{"fontSize":32,"bold":true,"color":"#212121","fontFace":"Rajdhani","align":"left"}},{"id":"b","type":"text","x":0.5,"y":1.6,"w":12,"h":5,"content":"Summary content.","style":{"fontSize":16,"color":"#212121","fontFace":"Rajdhani","align":"left"}}]}' },
];

let c = 0;
for (const t of templates) {
  try {
    stmt.run('p_' + Date.now() + '_' + Math.random().toString(36).substr(2,9), t.name, '', t.category, t.layout_type, t.config);
    c++;
    console.log('Created:', t.name);
  } catch (e) {
    console.error('Failed:', t.name);
  }
}
console.log('Done! Created', c, 'more templates.');
db.close();