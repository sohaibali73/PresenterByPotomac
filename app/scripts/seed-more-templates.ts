import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'presenter.db');
const db = new Database(dbPath);

const C = {
  YELLOW: '#FEC00F',
  DARK: '#212121',
  WHITE: '#FFFFFF',
  GRAY: '#737373',
  LIGHT_GRAY: '#F5F5F5',
  NAVY: '#1A2744',
};

const txt = (id: string, x: number, y: number, w: number, h: number, content: string, style: any = {}) => ({
  id, type: 'text', x, y, w, h, content, style: { fontFace: 'Rajdhani', ...style }
});

const shape = (id: string, x: number, y: number, w: number, h: number, options: any = {}) => ({
  id, type: 'shape', x, y, w, h, options: { shape: 'rect', ...options }
});

const img = (id: string, x: number, y: number, w: number, h: number, content: string) => ({
  id, type: 'image', x, y, w, h, content, options: { sizing: 'contain' as const }
});

const chart = (id: string, x: number, y: number, w: number, h: number) => ({
  id, type: 'chart', x, y, w, h, style: { color: C.GRAY }
});

const table = (id: string, x: number, y: number, w: number, h: number) => ({
  id, type: 'table', x, y, w, h, style: { color: C.GRAY }
});

const templates: any[] = [];

// ==================== MORE COVER SLIDES ====================

// Strategy-specific covers
const strategies = ['Bull Bear', 'Guardian', 'Conservative', 'Growth', 'Income', 'Balanced', 'Dynamic', 'Tactical'];
strategies.forEach((name, i) => {
  templates.push({
    name: `Cover - ${name} Strategy`,
    category: 'cover', layout_type: 'cover',
    slide_config: { background: { color: i % 2 === 0 ? C.DARK : C.NAVY }, elements: [
      shape('accent', 0, 0, 13.33, 0.08, { fill: C.YELLOW }),
      img('logo', 0.4, 0.25, 2, 0.5, '/logos/Potomac Logo White.png'),
      txt('title', 1, 2.5, 11.33, 1.5, name.toUpperCase(), { fontSize: 48, bold: true, color: C.WHITE, align: 'center' }),
      shape('line', 5.17, 4.2, 3, 0.03, { fill: C.YELLOW }),
      txt('subtitle', 1, 4.8, 11.33, 0.5, 'INVESTMENT STRATEGY', { fontSize: 16, color: C.YELLOW, align: 'center' }),
    ]}
  });
});

// Quarterly covers
['Q1', 'Q2', 'Q3', 'Q4'].forEach((q, i) => {
  templates.push({
    name: `Cover - ${q} 2026`,
    category: 'cover', layout_type: 'cover',
    slide_config: { background: { color: C.DARK }, elements: [
      shape('accent', 0, 0, 13.33, 0.08, { fill: C.YELLOW }),
      img('logo', 0.4, 0.25, 2, 0.5, '/logos/Potomac Logo White.png'),
      txt('quarter', 1, 2, 11.33, 1, q + ' 2026', { fontSize: 72, bold: true, color: C.YELLOW, align: 'center' }),
      txt('title', 1, 3.5, 11.33, 1, 'QUARTERLY REVIEW', { fontSize: 36, bold: true, color: C.WHITE, align: 'center' }),
      shape('line', 5.17, 4.8, 3, 0.03, { fill: C.YELLOW }),
    ]}
  });
});

// ==================== MORE CONTENT SLIDES ====================

// Timeline slides
templates.push({
  name: 'Content - Timeline Vertical',
  category: 'content', layout_type: 'content',
  slide_config: { background: { color: C.DARK }, elements: [
    shape('accent', 0, 0, 13.33, 0.08, { fill: C.YELLOW }),
    txt('title', 0.5, 0.4, 12, 0.8, 'TIMELINE', { fontSize: 28, bold: true, color: C.WHITE, align: 'left' }),
    shape('line', 1.5, 1.5, 0.04, 5.5, { fill: C.YELLOW }),
    ...[1,2,3,4,5].map((n, i) => [
      shape(`dot${n}`, 1.3, 1.5 + i * 1.1, 0.4, 0.4, { shape: 'ellipse', fill: C.YELLOW }),
      txt(`year${n}`, 2, 1.5 + i * 1.1, 2, 0.4, `Year ${n}`, { fontSize: 14, bold: true, color: C.YELLOW, align: 'left' }),
      txt(`desc${n}`, 2, 1.9 + i * 1.1, 10, 0.5, `Milestone description ${n}`, { fontSize: 12, color: C.WHITE, align: 'left' }),
    ]).flat(),
  ]}
});

templates.push({
  name: 'Content - Timeline Horizontal',
  category: 'content', layout_type: 'content',
  slide_config: { background: { color: C.WHITE }, elements: [
    txt('title', 0.5, 0.4, 12, 0.8, 'OUR JOURNEY', { fontSize: 28, bold: true, color: C.DARK, align: 'left' }),
    shape('line', 1, 3.5, 11, 0.04, { fill: C.YELLOW }),
    ...[1,2,3,4].map((n, i) => [
      shape(`dot${n}`, 1 + i * 3.3, 3.3, 0.4, 0.4, { shape: 'ellipse', fill: C.YELLOW }),
      txt(`year${n}`, 0.5 + i * 3.3, 4, 2, 0.4, `202${n}`, { fontSize: 14, bold: true, color: C.DARK, align: 'center' }),
      txt(`desc${n}`, 0.5 + i * 3.3, 4.5, 2, 1.5, `Milestone ${n}`, { fontSize: 11, color: C.GRAY, align: 'center' }),
    ]).flat(),
  ]}
});

// Feature highlights
templates.push({
  name: 'Content - Feature Grid',
  category: 'content', layout_type: 'content',
  slide_config: { background: { color: C.DARK }, elements: [
    shape('accent', 0, 0, 13.33, 0.08, { fill: C.YELLOW }),
    txt('title', 0.5, 0.4, 12, 0.8, 'KEY FEATURES', { fontSize: 28, bold: true, color: C.WHITE, align: 'left' }),
    shape('f1', 0.5, 1.4, 4, 2.8, { fill: C.NAVY }),
    txt('f1_title', 0.5, 1.6, 4, 0.5, 'Feature One', { fontSize: 16, bold: true, color: C.YELLOW, align: 'center' }),
    txt('f1_desc', 0.7, 2.2, 3.6, 2, 'Description', { fontSize: 12, color: C.WHITE, align: 'left' }),
    shape('f2', 4.7, 1.4, 4, 2.8, { fill: C.NAVY }),
    txt('f2_title', 4.7, 1.6, 4, 0.5, 'Feature Two', { fontSize: 16, bold: true, color: C.YELLOW, align: 'center' }),
    txt('f2_desc', 4.9, 2.2, 3.6, 2, 'Description', { fontSize: 12, color: C.WHITE, align: 'left' }),
    shape('f3', 8.9, 1.4, 4, 2.8, { fill: C.NAVY }),
    txt('f3_title', 8.9, 1.6, 4, 0.5, 'Feature Three', { fontSize: 16, bold: true, color: C.YELLOW, align: 'center' }),
    txt('f3_desc', 9.1, 2.2, 3.6, 2, 'Description', { fontSize: 12, color: C.WHITE, align: 'left' }),
    shape('f4', 2.6, 4.4, 4, 2.8, { fill: C.NAVY }),
    txt('f4_title', 2.6, 4.6, 4, 0.5, 'Feature Four', { fontSize: 16, bold: true, color: C.YELLOW, align: 'center' }),
    txt('f4_desc', 2.8, 5.2, 3.6, 2, 'Description', { fontSize: 12, color: C.WHITE, align: 'left' }),
    shape('f5', 6.8, 4.4, 4, 2.8, { fill: C.NAVY }),
    txt('f5_title', 6.8, 4.6, 4, 0.5, 'Feature Five', { fontSize: 16, bold: true, color: C.YELLOW, align: 'center' }),
    txt('f5_desc', 7, 5.2, 3.6, 2, 'Description', { fontSize: 12, color: C.WHITE, align: 'left' }),
  ]}
});

// Stat cards
templates.push({
  name: 'Content - Stats Cards',
  category: 'content', layout_type: 'content',
  slide_config: { background: { color: C.DARK }, elements: [
    txt('title', 0.5, 0.4, 12, 0.8, 'BY THE NUMBERS', { fontSize: 28, bold: true, color: C.WHITE, align: 'left' }),
    shape('card1', 0.5, 1.4, 3, 2.5, { fill: C.YELLOW }),
    txt('num1', 0.5, 1.6, 3, 1.2, '25+', { fontSize: 48, bold: true, color: C.DARK, align: 'center' }),
    txt('label1', 0.5, 2.8, 3, 0.5, 'Years Experience', { fontSize: 12, bold: true, color: C.DARK, align: 'center' }),
    shape('card2', 3.7, 1.4, 3, 2.5, { fill: C.NAVY }),
    txt('num2', 3.7, 1.6, 3, 1.2, '$5B+', { fontSize: 48, bold: true, color: C.YELLOW, align: 'center' }),
    txt('label2', 3.7, 2.8, 3, 0.5, 'Assets Managed', { fontSize: 12, bold: true, color: C.WHITE, align: 'center' }),
    shape('card3', 6.9, 1.4, 3, 2.5, { fill: C.NAVY }),
    txt('num3', 6.9, 1.6, 3, 1.2, '150+', { fontSize: 48, bold: true, color: C.YELLOW, align: 'center' }),
    txt('label3', 6.9, 2.8, 3, 0.5, 'Clients Served', { fontSize: 12, bold: true, color: C.WHITE, align: 'center' }),
    shape('card4', 10.1, 1.4, 3, 2.5, { fill: C.NAVY }),
    txt('num4', 10.1, 1.6, 3, 1.2, '98%', { fontSize: 48, bold: true, color: C.YELLOW, align: 'center' }),
    txt('label4', 10.1, 2.8, 3, 0.5, 'Client Retention', { fontSize: 12, bold: true, color: C.WHITE, align: 'center' }),
  ]}
});

// ==================== MORE FRAMEWORK SLIDES ====================

// Four quadrants
templates.push({
  name: 'Framework - Four Quadrants',
  category: 'framework', layout_type: 'content',
  slide_config: { background: { color: C.WHITE }, elements: [
    txt('title', 0.5, 0.4, 12, 0.8, 'QUADRANT ANALYSIS', { fontSize: 28, bold: true, color: C.DARK, align: 'left' }),
    shape('q1', 0.5, 1.4, 6, 3, { fill: C.YELLOW + '30', stroke: C.YELLOW }),
    txt('q1_title', 0.7, 1.6, 5.6, 0.5, 'Quadrant 1', { fontSize: 16, bold: true, color: C.DARK, align: 'left' }),
    shape('q2', 6.7, 1.4, 6, 3, { fill: C.NAVY + '30', stroke: C.NAVY }),
    txt('q2_title', 6.9, 1.6, 5.6, 0.5, 'Quadrant 2', { fontSize: 16, bold: true, color: C.DARK, align: 'left' }),
    shape('q3', 0.5, 4.5, 6, 3, { fill: C.NAVY + '30', stroke: C.NAVY }),
    txt('q3_title', 0.7, 4.7, 5.6, 0.5, 'Quadrant 3', { fontSize: 16, bold: true, color: C.DARK, align: 'left' }),
    shape('q4', 6.7, 4.5, 6, 3, { fill: C.YELLOW + '30', stroke: C.YELLOW }),
    txt('q4_title', 6.9, 4.7, 5.6, 0.5, 'Quadrant 4', { fontSize: 16, bold: true, color: C.DARK, align: 'left' }),
  ]}
});

// Pyramid
templates.push({
  name: 'Framework - Pyramid',
  category: 'framework', layout_type: 'content',
  slide_config: { background: { color: C.DARK }, elements: [
    txt('title', 0.5, 0.4, 12, 0.8, 'PRIORITY PYRAMID', { fontSize: 28, bold: true, color: C.WHITE, align: 'left' }),
    shape('level1', 5.17, 1.4, 3, 1.2, { fill: C.YELLOW }),
    txt('l1', 5.17, 1.6, 3, 0.8, 'Priority 1', { fontSize: 14, bold: true, color: C.DARK, align: 'center' }),
    shape('level2', 4.17, 2.8, 5, 1.2, { fill: C.NAVY, stroke: C.YELLOW }),
    txt('l2', 4.17, 3, 5, 0.8, 'Priority 2', { fontSize: 14, bold: true, color: C.WHITE, align: 'center' }),
    shape('level3', 3.17, 4.2, 7, 1.2, { fill: C.NAVY, stroke: C.YELLOW }),
    txt('l3', 3.17, 4.4, 7, 0.8, 'Priority 3', { fontSize: 14, bold: true, color: C.WHITE, align: 'center' }),
    shape('level4', 2.17, 5.6, 9, 1.2, { fill: C.NAVY, stroke: C.YELLOW }),
    txt('l4', 2.17, 5.8, 9, 0.8, 'Foundation', { fontSize: 14, bold: true, color: C.WHITE, align: 'center' }),
  ]}
});

// Venn diagram style
templates.push({
  name: 'Framework - Overlapping Circles',
  category: 'framework', layout_type: 'content',
  slide_config: { background: { color: C.WHITE }, elements: [
    txt('title', 0.5, 0.4, 12, 0.8, 'CONVERGENCE MODEL', { fontSize: 28, bold: true, color: C.DARK, align: 'left' }),
    shape('c1', 2, 2, 4, 4, { shape: 'ellipse', fill: C.YELLOW + '40', stroke: C.YELLOW }),
    txt('c1_label', 2, 2.5, 2, 0.5, 'Factor A', { fontSize: 14, bold: true, color: C.DARK, align: 'center' }),
    shape('c2', 5, 2, 4, 4, { shape: 'ellipse', fill: C.NAVY + '40', stroke: C.NAVY }),
    txt('c2_label', 7, 2.5, 2, 0.5, 'Factor B', { fontSize: 14, bold: true, color: C.DARK, align: 'center' }),
    txt('center', 4.5, 3.5, 2, 0.5, 'Result', { fontSize: 16, bold: true, color: C.DARK, align: 'center' }),
  ]}
});

// ==================== MORE CHART SLIDES ====================

// Chart with callouts
templates.push({
  name: 'Chart - With Callouts',
  category: 'chart', layout_type: 'chart',
  slide_config: { background: { color: C.WHITE }, elements: [
    txt('title', 0.5, 0.4, 12, 0.7, 'PERFORMANCE ANALYSIS', { fontSize: 28, bold: true, color: C.DARK, align: 'left' }),
    shape('line', 0.5, 1.2, 2, 0.04, { fill: C.YELLOW }),
    chart('chart', 0.5, 1.5, 10, 5),
    shape('callout1', 11, 2, 1.8, 1.2, { fill: C.YELLOW }),
    txt('callout1_txt', 11.1, 2.3, 1.6, 0.6, 'Peak', { fontSize: 10, bold: true, color: C.DARK, align: 'center' }),
    shape('callout2', 11, 4, 1.8, 1.2, { fill: C.NAVY }),
    txt('callout2_txt', 11.1, 4.3, 1.6, 0.6, 'Avg', { fontSize: 10, bold: true, color: C.WHITE, align: 'center' }),
    txt('caption', 0.5, 6.8, 12, 0.4, 'For illustrative purposes only.', { fontSize: 10, italic: true, color: C.GRAY, align: 'left' }),
  ]}
});

// Side by side charts
templates.push({
  name: 'Chart - Dual Charts',
  category: 'chart', layout_type: 'chart',
  slide_config: { background: { color: C.DARK }, elements: [
    txt('title', 0.5, 0.4, 12, 0.7, 'COMPARISON VIEW', { fontSize: 28, bold: true, color: C.WHITE, align: 'left' }),
    txt('chart1_title', 0.5, 1.2, 6, 0.4, 'Strategy A', { fontSize: 14, bold: true, color: C.YELLOW, align: 'left' }),
    chart('chart1', 0.5, 1.7, 6, 4.8),
    txt('chart2_title', 6.8, 1.2, 6, 0.4, 'Strategy B', { fontSize: 14, bold: true, color: C.YELLOW, align: 'left' }),
    chart('chart2', 6.8, 1.7, 6, 4.8),
  ]}
});

// ==================== MORE TABLE SLIDES ====================

// Table with highlights
templates.push({
  name: 'Table - Highlighted Rows',
  category: 'table', layout_type: 'strategy_table',
  slide_config: { background: { color: C.WHITE }, elements: [
    txt('title', 0.5, 0.4, 12, 0.7, 'RISK METRICS', { fontSize: 28, bold: true, color: C.DARK, align: 'left' }),
    shape('line', 0.5, 1.2, 2, 0.04, { fill: C.YELLOW }),
    table('table', 0.5, 1.5, 12, 5),
    shape('highlight1', 0.5, 2.5, 12, 0.8, { fill: C.YELLOW + '20' }),
    shape('highlight2', 0.5, 4.1, 12, 0.8, { fill: C.YELLOW + '20' }),
    txt('footnote', 0.5, 6.8, 12, 0.4, 'Highlighted rows indicate key metrics.', { fontSize: 9, italic: true, color: C.GRAY, align: 'left' }),
  ]}
});

// ==================== MORE QUOTE SLIDES ====================

// Quote with image
templates.push({
  name: 'Quote - With Image',
  category: 'quote', layout_type: 'quote',
  slide_config: { background: { color: C.DARK }, elements: [
    shape('img_placeholder', 9, 1.5, 3.5, 4, { fill: C.GRAY + '40' }),
    txt('quote_mark', 0.5, 1.5, 1.5, 1.5, '"', { fontSize: 120, color: C.YELLOW, align: 'center' }),
    txt('quote', 1.5, 2.5, 7, 2, 'The quote goes here with a powerful message.', { fontSize: 24, italic: true, color: C.WHITE, align: 'left' }),
    txt('author', 1.5, 5, 7, 0.5, '- Author Name, Title', { fontSize: 14, color: C.YELLOW, align: 'left' }),
  ]}
});

// Testimonial style
templates.push({
  name: 'Quote - Testimonial',
  category: 'quote', layout_type: 'quote',
  slide_config: { background: { color: C.YELLOW }, elements: [
    txt('quote', 1, 2, 11.33, 2.5, '"This is a testimonial quote from a satisfied client about their experience."', { fontSize: 24, italic: true, color: C.DARK, align: 'center' }),
    txt('name', 1, 5, 11.33, 0.4, 'CLIENT NAME', { fontSize: 14, bold: true, color: C.DARK, align: 'center' }),
    txt('title', 1, 5.5, 11.33, 0.4, 'Company, Title', { fontSize: 12, color: C.DARK, align: 'center' }),
  ]}
});

// ==================== MORE THANK YOU SLIDES ====================

// Thank you with social
templates.push({
  name: 'Thank You - Social',
  category: 'thank_you', layout_type: 'thank_you',
  slide_config: { background: { color: C.DARK }, elements: [
    img('logo', 4.67, 0.5, 4, 0.8, '/logos/Potomac Logo White.png'),
    txt('thank_you', 1, 2, 11.33, 1, 'THANK YOU', { fontSize: 48, bold: true, color: C.WHITE, align: 'center' }),
    txt('social', 1, 3.5, 11.33, 0.4, 'Follow us @PotomacFunds', { fontSize: 14, color: C.YELLOW, align: 'center' }),
    txt('website', 1, 4.2, 11.33, 0.4, 'potomac.com', { fontSize: 12, color: C.WHITE, align: 'center' }),
    txt('email', 1, 4.7, 11.33, 0.4, 'info@potomac.com', { fontSize: 12, color: C.WHITE, align: 'center' }),
    txt('phone', 1, 5.2, 11.33, 0.4, '(800) 555-0123', { fontSize: 12, color: C.WHITE, align: 'center' }),
  ]}
});

// Thank you split
templates.push({
  name: 'Thank You - Split',
  category: 'thank_you', layout_type: 'thank_you',
  slide_config: { background: { color: C.DARK }, elements: [
    shape('left', 0, 0, 6, 7.5, { fill: C.YELLOW }),
    img('logo', 1.5, 3, 3, 0.8, '/logos/Potomac Logo Black.png'),
    txt('thank_you', 7, 2.5, 5.5, 1.5, 'THANK YOU', { fontSize: 42, bold: true, color: C.WHITE, align: 'left' }),
    txt('tagline', 7, 4.2, 5.5, 0.5, 'Built to Conquer Risk', { fontSize: 14, italic: true, color: C.YELLOW, align: 'left' }),
    txt('website', 7, 5.5, 5.5, 0.4, 'potomac.com', { fontSize: 12, color: C.GRAY, align: 'left' }),
  ]}
});

// ==================== MORE USE CASES ====================

// Use case cards
templates.push({
  name: 'Use Cases - Cards',
  category: 'framework', layout_type: 'use_cases',
  slide_config: { background: { color: C.DARK }, elements: [
    shape('accent', 0, 0, 13.33, 0.08, { fill: C.YELLOW }),
    txt('title', 0.5, 0.4, 12, 0.8, 'USE CASES', { fontSize: 28, bold: true, color: C.WHITE, align: 'left' }),
    shape('case1', 0.5, 1.4, 6, 2.5, { fill: C.NAVY }),
    txt('case1_title', 0.7, 1.6, 5.6, 0.5, 'Use Case 1', { fontSize: 16, bold: true, color: C.YELLOW, align: 'left' }),
    txt('case1_desc', 0.7, 2.2, 5.6, 1.5, 'Description here.', { fontSize: 12, color: C.WHITE, align: 'left' }),
    shape('case2', 6.8, 1.4, 6, 2.5, { fill: C.NAVY }),
    txt('case2_title', 7, 1.6, 5.6, 0.5, 'Use Case 2', { fontSize: 16, bold: true, color: C.YELLOW, align: 'left' }),
    txt('case2_desc', 7, 2.2, 5.6, 1.5, 'Description here.', { fontSize: 12, color: C.WHITE, align: 'left' }),
    shape('case3', 0.5, 4.2, 6, 2.5, { fill: C.NAVY }),
    txt('case3_title', 0.7, 4.4, 5.6, 0.5, 'Use Case 3', { fontSize: 16, bold: true, color: C.YELLOW, align: 'left' }),
    txt('case3_desc', 0.7, 5, 5.6, 1.5, 'Description here.', { fontSize: 12, color: C.WHITE, align: 'left' }),
    shape('case4', 6.8, 4.2, 6, 2.5, { fill: C.NAVY }),
    txt('case4_title', 7, 4.4, 5.6, 0.5, 'Use Case 4', { fontSize: 16, bold: true, color: C.YELLOW, align: 'left' }),
    txt('case4_desc', 7, 5, 5.6, 1.5, 'Description here.', { fontSize: 12, color: C.WHITE, align: 'left' }),
  ]}
});

console.log(`Total additional templates: ${templates.length}`);

function seedTemplates() {
  console.log('Seeding additional templates...');
  
  const stmt = db.prepare(`
    INSERT INTO templates (id, name, description, category, layout_type, slide_config, is_public, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `);
  
  let created = 0;
  for (const template of templates) {
    try {
      stmt.run(
        `potomac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        template.name,
        template.description || '',
        template.category,
        template.layout_type,
        JSON.stringify(template.slide_config)
      );
      created++;
      console.log(`[${created}] Created: ${template.name}`);
    } catch (error) {
      console.error(`Failed to create ${template.name}:`, error);
    }
  }
  
  console.log(`\nDone! Created ${created} additional templates.`);
  db.close();
}

seedTemplates();