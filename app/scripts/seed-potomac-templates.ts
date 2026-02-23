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
  FOREST: '#1B4D3E',
  BURGUNDY: '#722F37',
};

// Helper to create element
const el = (id: string, type: string, x: number, y: number, w: number, h: number, extra: any = {}) => ({
  id, type, x, y, w, h, ...extra
});

// Helper for text element
const txt = (id: string, x: number, y: number, w: number, h: number, content: string, style: any = {}) => 
  el(id, 'text', x, y, w, h, { content, style: { fontFace: 'Rajdhani', ...style } });

// Helper for shape element
const shape = (id: string, x: number, y: number, w: number, h: number, options: any = {}) =>
  el(id, 'shape', x, y, w, h, { options: { shape: 'rect', ...options } });

// Helper for image element
const img = (id: string, x: number, y: number, w: number, h: number, content: string) =>
  el(id, 'image', x, y, w, h, { content, options: { sizing: 'contain' as const } });

// Helper for chart element
const chart = (id: string, x: number, y: number, w: number, h: number) =>
  el(id, 'chart', x, y, w, h, { style: { color: C.GRAY } });

// Helper for table element
const table = (id: string, x: number, y: number, w: number, h: number) =>
  el(id, 'table', x, y, w, h, { style: { color: C.GRAY } });

const templates: any[] = [];

// ==================== COVER SLIDES (20+) ====================

// Classic covers
templates.push({
  name: 'Cover - Classic Dark',
  category: 'cover', layout_type: 'cover',
  slide_config: { background: { color: C.DARK }, elements: [
    shape('accent_top', 0, 0, 13.33, 0.08, { fill: C.YELLOW }),
    img('logo', 0.4, 0.25, 2, 0.5, '/logos/Potomac Logo White.png'),
    shape('line1', 4.67, 2.8, 4, 0.03, { fill: C.YELLOW }),
    txt('title', 1, 3, 11.33, 1.5, 'PRESENTATION TITLE', { fontSize: 48, bold: true, color: C.WHITE, align: 'center' }),
    shape('line2', 4.67, 4.7, 4, 0.03, { fill: C.YELLOW }),
    txt('tagline', 1, 5.8, 11.33, 0.5, 'Built to Conquer Risk', { fontSize: 14, italic: true, color: C.YELLOW, align: 'center' }),
    shape('accent_bottom', 0, 7.42, 13.33, 0.08, { fill: C.YELLOW }),
  ]}
});

templates.push({
  name: 'Cover - Classic Light',
  category: 'cover', layout_type: 'cover',
  slide_config: { background: { color: C.WHITE }, elements: [
    shape('accent_top', 0, 0, 13.33, 0.08, { fill: C.YELLOW }),
    img('logo', 0.4, 0.25, 2, 0.5, '/logos/Potomac Logo Black.png'),
    txt('title', 1, 3, 11.33, 1.5, 'PRESENTATION TITLE', { fontSize: 48, bold: true, color: C.DARK, align: 'center' }),
    shape('line', 4.67, 4.7, 4, 0.03, { fill: C.YELLOW }),
    txt('tagline', 1, 5.8, 11.33, 0.5, 'Built to Conquer Risk', { fontSize: 14, italic: true, color: C.GRAY, align: 'center' }),
    shape('accent_bottom', 0, 7.42, 13.33, 0.08, { fill: C.YELLOW }),
  ]}
});

// Covers with subtitle
for (let i = 0; i < 3; i++) {
  const bgColors = [C.DARK, C.NAVY, C.FOREST];
  const names = ['Dark', 'Navy', 'Forest'];
  templates.push({
    name: `Cover - Subtitle ${names[i]}`,
    category: 'cover', layout_type: 'cover',
    slide_config: { background: { color: bgColors[i] }, elements: [
      shape('accent_top', 0, 0, 13.33, 0.08, { fill: C.YELLOW }),
      img('logo', 0.4, 0.25, 2, 0.5, '/logos/Potomac Logo White.png'),
      txt('title', 1, 2.5, 11.33, 1.2, 'MAIN TITLE', { fontSize: 44, bold: true, color: C.WHITE, align: 'center' }),
      txt('subtitle', 1, 3.8, 11.33, 0.6, 'Subtitle Goes Here', { fontSize: 20, color: C.YELLOW, align: 'center' }),
      shape('line', 5.17, 4.6, 3, 0.03, { fill: C.YELLOW }),
      txt('date', 1, 6.5, 11.33, 0.4, 'Q1 2026', { fontSize: 12, color: C.GRAY, align: 'center' }),
      shape('accent_bottom', 0, 7.42, 13.33, 0.08, { fill: C.YELLOW }),
    ]}
  });
}

// Left accent covers
for (let i = 0; i < 3; i++) {
  const bgColors = [C.DARK, C.NAVY, C.WHITE];
  const txtColors = [C.WHITE, C.WHITE, C.DARK];
  const logos = ['/logos/Potomac Logo White.png', '/logos/Potomac Logo White.png', '/logos/Potomac Logo Black.png'];
  const names = ['Dark', 'Navy', 'Light'];
  templates.push({
    name: `Cover - Left Accent ${names[i]}`,
    category: 'cover', layout_type: 'cover',
    slide_config: { background: { color: bgColors[i] }, elements: [
      shape('left_accent', 0, 0, 0.15, 7.5, { fill: C.YELLOW }),
      img('logo', 0.5, 0.4, 2, 0.5, logos[i]),
      txt('title', 0.5, 2.8, 12, 1.5, 'STRATEGY NAME', { fontSize: 48, bold: true, color: txtColors[i], align: 'left' }),
      txt('tagline', 0.5, 4.5, 12, 0.5, 'Built to Conquer Risk', { fontSize: 16, italic: true, color: C.YELLOW, align: 'left' }),
      txt('date', 0.5, 6.5, 12, 0.4, 'January 2026', { fontSize: 12, color: C.GRAY, align: 'left' }),
    ]}
  });
}

// Full yellow covers
templates.push({
  name: 'Cover - Full Yellow',
  category: 'cover', layout_type: 'cover',
  slide_config: { background: { color: C.YELLOW }, elements: [
    img('logo', 0.4, 0.25, 2, 0.5, '/logos/Potomac Logo Black.png'),
    txt('title', 1, 3, 11.33, 1.5, 'PRESENTATION TITLE', { fontSize: 48, bold: true, color: C.DARK, align: 'center' }),
    txt('tagline', 1, 5, 11.33, 0.5, 'Built to Conquer Risk', { fontSize: 14, italic: true, color: C.DARK, align: 'center' }),
  ]}
});

// Gradient-style covers (simulated with shapes)
templates.push({
  name: 'Cover - Diagonal Accent',
  category: 'cover', layout_type: 'cover',
  slide_config: { background: { color: C.DARK }, elements: [
    shape('diag1', 0, 0, 4, 7.5, { fill: C.NAVY }),
    shape('diag2', 3, 0, 0.2, 7.5, { fill: C.YELLOW }),
    img('logo', 0.4, 0.25, 2, 0.5, '/logos/Potomac Logo White.png'),
    txt('title', 4, 2.8, 8.5, 1.5, 'PRESENTATION TITLE', { fontSize: 44, bold: true, color: C.WHITE, align: 'left' }),
    txt('tagline', 4, 4.5, 8.5, 0.5, 'Built to Conquer Risk', { fontSize: 14, italic: true, color: C.YELLOW, align: 'left' }),
  ]}
});

// Minimal covers
for (let i = 0; i < 3; i++) {
  const names = ['Minimal Dark', 'Minimal Light', 'Minimal Navy'];
  const bgColors = [C.DARK, C.WHITE, C.NAVY];
  const txtColors = [C.WHITE, C.DARK, C.WHITE];
  templates.push({
    name: `Cover - ${names[i]}`,
    category: 'cover', layout_type: 'cover',
    slide_config: { background: { color: bgColors[i] }, elements: [
      txt('title', 1, 3, 11.33, 1.5, 'TITLE', { fontSize: 56, bold: true, color: txtColors[i], align: 'center' }),
      shape('line', 5.17, 4.8, 3, 0.04, { fill: C.YELLOW }),
    ]}
  });
}

// Image placeholder covers
templates.push({
  name: 'Cover - With Image Placeholder',
  category: 'cover', layout_type: 'cover',
  slide_config: { background: { color: C.DARK }, elements: [
    shape('img_placeholder', 8, 1, 4.5, 5.5, { fill: C.GRAY + '40', stroke: C.GRAY }),
    img('logo', 0.4, 0.25, 2, 0.5, '/logos/Potomac Logo White.png'),
    txt('title', 0.5, 2.5, 7, 1.5, 'PRESENTATION TITLE', { fontSize: 36, bold: true, color: C.WHITE, align: 'left' }),
    txt('subtitle', 0.5, 4.2, 7, 0.6, 'Subtitle or description', { fontSize: 16, color: C.YELLOW, align: 'left' }),
  ]}
});

// ==================== SECTION DIVIDERS (15+) ====================

// Basic section dividers
for (let i = 0; i < 4; i++) {
  const names = ['Light', 'Dark', 'Navy', 'Yellow'];
  const bgColors = [C.WHITE, C.DARK, C.NAVY, C.YELLOW];
  const txtColors = [C.DARK, C.WHITE, C.WHITE, C.DARK];
  templates.push({
    name: `Section - ${names[i]}`,
    category: 'section_divider', layout_type: 'section_divider',
    slide_config: { background: { color: bgColors[i] }, elements: [
      txt('section', 1, 3, 11.33, 1.5, 'SECTION TITLE', { fontSize: 56, bold: true, color: txtColors[i], align: 'center' }),
      shape('line', 5.17, 4.6, 3, 0.06, { fill: C.YELLOW }),
    ]}
  });
}

// Numbered sections
for (let i = 1; i <= 5; i++) {
  templates.push({
    name: `Section - Number 0${i}`,
    category: 'section_divider', layout_type: 'section_divider',
    slide_config: { background: { color: C.WHITE }, elements: [
      txt('num', 0.5, 1, 2.5, 2, `0${i}`, { fontSize: 72, bold: true, color: C.YELLOW, align: 'center' }),
      txt('section', 3, 3, 9.5, 1.5, 'SECTION TITLE', { fontSize: 48, bold: true, color: C.DARK, align: 'left' }),
      shape('line', 3, 4.6, 3, 0.06, { fill: C.YELLOW }),
    ]}
  });
}

// Icon section dividers
templates.push({
  name: 'Section - With Icon',
  category: 'section_divider', layout_type: 'section_divider',
  slide_config: { background: { color: C.DARK }, elements: [
    shape('icon_circle', 5.67, 1, 2, 2, { shape: 'ellipse', fill: C.YELLOW }),
    txt('icon', 5.67, 1.5, 2, 1, '1', { fontSize: 36, bold: true, color: C.DARK, align: 'center' }),
    txt('section', 1, 3.5, 11.33, 1.5, 'SECTION TITLE', { fontSize: 48, bold: true, color: C.WHITE, align: 'center' }),
    shape('line', 5.17, 5.2, 3, 0.04, { fill: C.YELLOW }),
  ]}
});

// Process step sections
for (let i = 1; i <= 3; i++) {
  templates.push({
    name: `Section - Process Step ${i}`,
    category: 'section_divider', layout_type: 'section_divider',
    slide_config: { background: { color: C.DARK }, elements: [
      txt('step', 1, 0.5, 11.33, 0.5, `STEP ${i} OF 5`, { fontSize: 12, bold: true, color: C.YELLOW, align: 'center' }),
      txt('section', 1, 3, 11.33, 1.5, 'PROCESS STEP', { fontSize: 56, bold: true, color: C.WHITE, align: 'center' }),
      shape('line', 5.17, 4.6, 3, 0.06, { fill: C.YELLOW }),
    ]}
  });
}

// ==================== CONTENT SLIDES (25+) ====================

// Basic content
for (let i = 0; i < 3; i++) {
  const names = ['Dark', 'Light', 'Navy'];
  const bgColors = [C.DARK, C.WHITE, C.NAVY];
  const txtColors = [C.WHITE, C.DARK, C.WHITE];
  templates.push({
    name: `Content - Basic ${names[i]}`,
    category: 'content', layout_type: 'content',
    slide_config: { background: { color: bgColors[i] }, elements: [
      shape('accent', 0, 0, 13.33, 0.08, { fill: C.YELLOW }),
      txt('title', 0.5, 0.4, 12, 0.8, 'CONTENT TITLE', { fontSize: 32, bold: true, color: txtColors[i], align: 'left' }),
      shape('line', 0.5, 1.3, 2, 0.04, { fill: C.YELLOW }),
      txt('body', 0.5, 1.6, 12, 5, 'Body content goes here. Add your key points, detailed information, or main message.', { fontSize: 16, color: txtColors[i], align: 'left' }),
    ]}
  });
}

// Two column layouts
for (let i = 0; i < 3; i++) {
  const names = ['Dark', 'Light', 'Split'];
  const bgColors = [C.DARK, C.WHITE, C.DARK];
  templates.push({
    name: `Content - Two Column ${names[i]}`,
    category: 'content', layout_type: 'two_column',
    slide_config: { background: { color: bgColors[i] }, elements: [
      shape('accent', 0, 0, 13.33, 0.08, { fill: C.YELLOW }),
      txt('title', 0.5, 0.4, 12, 0.8, 'TWO COLUMN LAYOUT', { fontSize: 28, bold: true, color: names[i] === 'Light' ? C.DARK : C.WHITE, align: 'left' }),
      txt('col1_title', 0.5, 1.5, 5.5, 0.5, 'Column One', { fontSize: 16, bold: true, color: C.YELLOW, align: 'left' }),
      txt('col1_body', 0.5, 2.1, 5.5, 4.5, 'First column content.', { fontSize: 14, color: names[i] === 'Light' ? C.DARK : C.WHITE, align: 'left' }),
      shape('divider', 6.4, 1.5, 0.03, 5, { fill: C.GRAY }),
      txt('col2_title', 6.8, 1.5, 5.5, 0.5, 'Column Two', { fontSize: 16, bold: true, color: C.YELLOW, align: 'left' }),
      txt('col2_body', 6.8, 2.1, 5.5, 4.5, 'Second column content.', { fontSize: 14, color: names[i] === 'Light' ? C.DARK : C.WHITE, align: 'left' }),
    ]}
  });
}

// Three column layouts
for (let i = 0; i < 2; i++) {
  const names = ['Dark', 'Light'];
  templates.push({
    name: `Content - Three Column ${names[i]}`,
    category: 'content', layout_type: 'three_column',
    slide_config: { background: { color: i === 0 ? C.DARK : C.WHITE }, elements: [
      shape('accent', 0, 0, 13.33, 0.08, { fill: C.YELLOW }),
      txt('title', 0.5, 0.4, 12, 0.8, 'THREE COLUMN LAYOUT', { fontSize: 28, bold: true, color: i === 0 ? C.WHITE : C.DARK, align: 'left' }),
      txt('col1_title', 0.5, 1.5, 3.8, 0.5, 'Column One', { fontSize: 14, bold: true, color: C.YELLOW, align: 'center' }),
      txt('col1_body', 0.5, 2.1, 3.8, 4.5, 'Content.', { fontSize: 12, color: i === 0 ? C.WHITE : C.DARK, align: 'center' }),
      txt('col2_title', 4.6, 1.5, 3.8, 0.5, 'Column Two', { fontSize: 14, bold: true, color: C.YELLOW, align: 'center' }),
      txt('col2_body', 4.6, 2.1, 3.8, 4.5, 'Content.', { fontSize: 12, color: i === 0 ? C.WHITE : C.DARK, align: 'center' }),
      txt('col3_title', 8.7, 1.5, 3.8, 0.5, 'Column Three', { fontSize: 14, bold: true, color: C.YELLOW, align: 'center' }),
      txt('col3_body', 8.7, 2.1, 3.8, 4.5, 'Content.', { fontSize: 12, color: i === 0 ? C.WHITE : C.DARK, align: 'center' }),
    ]}
  });
}

// Bullet point layouts
for (let i = 0; i < 3; i++) {
  const names = ['Dark', 'Light', 'Navy'];
  const bgColors = [C.DARK, C.WHITE, C.NAVY];
  templates.push({
    name: `Content - Bullets ${names[i]}`,
    category: 'content', layout_type: 'content',
    slide_config: { background: { color: bgColors[i] }, elements: [
      shape('accent', 0, 0, 13.33, 0.08, { fill: C.YELLOW }),
      txt('title', 0.5, 0.4, 12, 0.8, 'KEY POINTS', { fontSize: 32, bold: true, color: i === 1 ? C.DARK : C.WHITE, align: 'left' }),
      ...[1,2,3,4,5].map((n, idx) => txt(`bullet${n}`, 0.5, 1.6 + idx * 0.9, 12, 0.7, `${n}. Key point number ${n}`, { fontSize: 18, color: i === 1 ? C.DARK : C.WHITE, align: 'left' })),
    ]}
  });
}

// Icon bullet layouts
templates.push({
  name: 'Content - Icon Bullets',
  category: 'content', layout_type: 'content',
  slide_config: { background: { color: C.DARK }, elements: [
    shape('accent', 0, 0, 13.33, 0.08, { fill: C.YELLOW }),
    txt('title', 0.5, 0.4, 12, 0.8, 'KEY FEATURES', { fontSize: 28, bold: true, color: C.WHITE, align: 'left' }),
    shape('icon1', 0.5, 1.6, 0.6, 0.6, { shape: 'ellipse', fill: C.YELLOW }),
    txt('point1', 1.3, 1.7, 10.5, 0.5, 'First feature description', { fontSize: 16, color: C.WHITE, align: 'left' }),
    shape('icon2', 0.5, 2.5, 0.6, 0.6, { shape: 'ellipse', fill: C.YELLOW }),
    txt('point2', 1.3, 2.6, 10.5, 0.5, 'Second feature description', { fontSize: 16, color: C.WHITE, align: 'left' }),
    shape('icon3', 0.5, 3.4, 0.6, 0.6, { shape: 'ellipse', fill: C.YELLOW }),
    txt('point3', 1.3, 3.5, 10.5, 0.5, 'Third feature description', { fontSize: 16, color: C.WHITE, align: 'left' }),
    shape('icon4', 0.5, 4.3, 0.6, 0.6, { shape: 'ellipse', fill: C.YELLOW }),
    txt('point4', 1.3, 4.4, 10.5, 0.5, 'Fourth feature description', { fontSize: 16, color: C.WHITE, align: 'left' }),
  ]}
});

// Numbered list
templates.push({
  name: 'Content - Numbered List',
  category: 'content', layout_type: 'content',
  slide_config: { background: { color: C.WHITE }, elements: [
    txt('title', 0.5, 0.4, 12, 0.8, 'AGENDA', { fontSize: 32, bold: true, color: C.DARK, align: 'left' }),
    shape('line', 0.5, 1.3, 2, 0.04, { fill: C.YELLOW }),
    ...[1,2,3,4,5].map((n, idx) => [
      txt(`num${n}`, 0.5, 1.6 + idx * 1, 0.8, 0.6, `0${n}`, { fontSize: 24, bold: true, color: C.YELLOW, align: 'center' }),
      txt(`item${n}`, 1.5, 1.7 + idx * 1, 10, 0.5, `List item number ${n}`, { fontSize: 16, color: C.DARK, align: 'left' }),
    ]).flat(),
  ]}
});

// Comparison layouts
templates.push({
  name: 'Content - Comparison',
  category: 'content', layout_type: 'content',
  slide_config: { background: { color: C.DARK }, elements: [
    txt('title', 0.5, 0.4, 12, 0.8, 'COMPARISON', { fontSize: 28, bold: true, color: C.WHITE, align: 'left' }),
    shape('left_box', 0.5, 1.4, 5.8, 5.5, { fill: C.NAVY }),
    txt('left_title', 0.7, 1.6, 5.4, 0.5, 'Option A', { fontSize: 20, bold: true, color: C.YELLOW, align: 'center' }),
    txt('left_body', 0.7, 2.3, 5.4, 4, 'Description of option A.', { fontSize: 14, color: C.WHITE, align: 'left' }),
    shape('right_box', 7, 1.4, 5.8, 5.5, { fill: C.YELLOW }),
    txt('right_title', 7.2, 1.6, 5.4, 0.5, 'Option B', { fontSize: 20, bold: true, color: C.DARK, align: 'center' }),
    txt('right_body', 7.2, 2.3, 5.4, 4, 'Description of option B.', { fontSize: 14, color: C.DARK, align: 'left' }),
  ]}
});

// ==================== FRAMEWORK SLIDES (15+) ====================

// Three pillars variations
for (let i = 0; i < 3; i++) {
  const names = ['Circles', 'Boxes', 'Cards'];
  const bgColors = [C.DARK, C.DARK, C.WHITE];
  templates.push({
    name: `Framework - Three Pillars ${names[i]}`,
    category: 'framework', layout_type: 'three_pillars',
    slide_config: { background: { color: bgColors[i] }, elements: [
      shape('accent', 0, 0, 13.33, 0.08, { fill: C.YELLOW }),
      txt('title', 0.5, 0.4, 12, 0.8, 'THREE PILLARS', { fontSize: 28, bold: true, color: i === 2 ? C.DARK : C.WHITE, align: 'left' }),
      ...(i === 0 ? [
        shape('p1_circle', 1, 2, 3, 3, { shape: 'ellipse', fill: 'transparent', stroke: C.YELLOW, strokeWidth: 2 }),
        txt('p1_num', 1, 3, 3, 1, '1', { fontSize: 48, bold: true, color: C.YELLOW, align: 'center' }),
        txt('p1_title', 1, 5.2, 3, 0.5, 'PILLAR ONE', { fontSize: 14, bold: true, color: C.WHITE, align: 'center' }),
        shape('p2_circle', 5, 2, 3, 3, { shape: 'ellipse', fill: 'transparent', stroke: C.YELLOW, strokeWidth: 2 }),
        txt('p2_num', 5, 3, 3, 1, '2', { fontSize: 48, bold: true, color: C.YELLOW, align: 'center' }),
        txt('p2_title', 5, 5.2, 3, 0.5, 'PILLAR TWO', { fontSize: 14, bold: true, color: C.WHITE, align: 'center' }),
        shape('p3_circle', 9, 2, 3, 3, { shape: 'ellipse', fill: 'transparent', stroke: C.YELLOW, strokeWidth: 2 }),
        txt('p3_num', 9, 3, 3, 1, '3', { fontSize: 48, bold: true, color: C.YELLOW, align: 'center' }),
        txt('p3_title', 9, 5.2, 3, 0.5, 'PILLAR THREE', { fontSize: 14, bold: true, color: C.WHITE, align: 'center' }),
      ] : i === 1 ? [
        shape('p1_box', 1, 1.8, 3.5, 4.5, { fill: C.NAVY, stroke: C.YELLOW, strokeWidth: 2 }),
        txt('p1_title', 1, 2, 3.5, 0.5, 'PILLAR ONE', { fontSize: 14, bold: true, color: C.YELLOW, align: 'center' }),
        txt('p1_body', 1.2, 2.6, 3.1, 3.5, 'Description', { fontSize: 12, color: C.WHITE, align: 'left' }),
        shape('p2_box', 5, 1.8, 3.5, 4.5, { fill: C.NAVY, stroke: C.YELLOW, strokeWidth: 2 }),
        txt('p2_title', 5, 2, 3.5, 0.5, 'PILLAR TWO', { fontSize: 14, bold: true, color: C.YELLOW, align: 'center' }),
        txt('p2_body', 5.2, 2.6, 3.1, 3.5, 'Description', { fontSize: 12, color: C.WHITE, align: 'left' }),
        shape('p3_box', 9, 1.8, 3.5, 4.5, { fill: C.NAVY, stroke: C.YELLOW, strokeWidth: 2 }),
        txt('p3_title', 9, 2, 3.5, 0.5, 'PILLAR THREE', { fontSize: 14, bold: true, color: C.YELLOW, align: 'center' }),
        txt('p3_body', 9.2, 2.6, 3.1, 3.5, 'Description', { fontSize: 12, color: C.WHITE, align: 'left' }),
      ] : [
        shape('p1_card', 1, 1.8, 3.5, 4.5, { fill: C.LIGHT_GRAY }),
        txt('p1_title', 1, 2, 3.5, 0.5, 'PILLAR ONE', { fontSize: 14, bold: true, color: C.DARK, align: 'center' }),
        txt('p1_body', 1.2, 2.6, 3.1, 3.5, 'Description', { fontSize: 12, color: C.GRAY, align: 'left' }),
        shape('p2_card', 5, 1.8, 3.5, 4.5, { fill: C.LIGHT_GRAY }),
        txt('p2_title', 5, 2, 3.5, 0.5, 'PILLAR TWO', { fontSize: 14, bold: true, color: C.DARK, align: 'center' }),
        txt('p2_body', 5.2, 2.6, 3.1, 3.5, 'Description', { fontSize: 12, color: C.GRAY, align: 'left' }),
        shape('p3_card', 9, 1.8, 3.5, 4.5, { fill: C.LIGHT_GRAY }),
        txt('p3_title', 9, 2, 3.5, 0.5, 'PILLAR THREE', { fontSize: 14, bold: true, color: C.DARK, align: 'center' }),
        txt('p3_body', 9.2, 2.6, 3.1, 3.5, 'Description', { fontSize: 12, color: C.GRAY, align: 'left' }),
      ]),
    ]}
  });
}

// Process flow
templates.push({
  name: 'Framework - Process Flow',
  category: 'framework', layout_type: 'content',
  slide_config: { background: { color: C.DARK }, elements: [
    txt('title', 0.5, 0.4, 12, 0.8, 'OUR PROCESS', { fontSize: 28, bold: true, color: C.WHITE, align: 'left' }),
    shape('step1', 0.5, 2, 2.5, 3, { fill: C.YELLOW }),
    txt('s1_num', 0.5, 2.2, 2.5, 0.5, '01', { fontSize: 24, bold: true, color: C.DARK, align: 'center' }),
    txt('s1_title', 0.5, 2.8, 2.5, 0.5, 'DISCOVER', { fontSize: 12, bold: true, color: C.DARK, align: 'center' }),
    txt('arrow1', 3.2, 3, 0.5, 0.5, '>', { fontSize: 24, bold: true, color: C.YELLOW, align: 'center' }),
    shape('step2', 4, 2, 2.5, 3, { fill: C.NAVY }),
    txt('s2_num', 4, 2.2, 2.5, 0.5, '02', { fontSize: 24, bold: true, color: C.YELLOW, align: 'center' }),
    txt('s2_title', 4, 2.8, 2.5, 0.5, 'DESIGN', { fontSize: 12, bold: true, color: C.WHITE, align: 'center' }),
    txt('arrow2', 6.7, 3, 0.5, 0.5, '>', { fontSize: 24, bold: true, color: C.YELLOW, align: 'center' }),
    shape('step3', 7.5, 2, 2.5, 3, { fill: C.NAVY }),
    txt('s3_num', 7.5, 2.2, 2.5, 0.5, '03', { fontSize: 24, bold: true, color: C.YELLOW, align: 'center' }),
    txt('s3_title', 7.5, 2.8, 2.5, 0.5, 'DEVELOP', { fontSize: 12, bold: true, color: C.WHITE, align: 'center' }),
    txt('arrow3', 10.2, 3, 0.5, 0.5, '>', { fontSize: 24, bold: true, color: C.YELLOW, align: 'center' }),
    shape('step4', 11, 2, 2.5, 3, { fill: C.NAVY }),
    txt('s4_num', 11, 2.2, 2.5, 0.5, '04', { fontSize: 24, bold: true, color: C.YELLOW, align: 'center' }),
    txt('s4_title', 11, 2.8, 2.5, 0.5, 'DEPLOY', { fontSize: 12, bold: true, color: C.WHITE, align: 'center' }),
  ]}
});

// Hub and spoke
templates.push({
  name: 'Framework - Hub Spoke',
  category: 'framework', layout_type: 'five_component_diagram',
  slide_config: { background: { color: C.DARK }, elements: [
    txt('title', 0.5, 0.4, 12, 0.8, 'CENTRAL FRAMEWORK', { fontSize: 28, bold: true, color: C.WHITE, align: 'left' }),
    shape('center', 5.17, 2.8, 3, 2, { shape: 'ellipse', fill: C.YELLOW }),
    txt('center_txt', 5.17, 3.4, 3, 0.8, 'CORE', { fontSize: 20, bold: true, color: C.DARK, align: 'center' }),
    shape('node1', 1, 1.5, 2, 1.5, { fill: C.NAVY, stroke: C.YELLOW, strokeWidth: 1 }),
    shape('node2', 10.3, 1.5, 2, 1.5, { fill: C.NAVY, stroke: C.YELLOW, strokeWidth: 1 }),
    shape('node3', 1, 4.5, 2, 1.5, { fill: C.NAVY, stroke: C.YELLOW, strokeWidth: 1 }),
    shape('node4', 10.3, 4.5, 2, 1.5, { fill: C.NAVY, stroke: C.YELLOW, strokeWidth: 1 }),
  ]}
});

// ==================== CHART SLIDES (10+) ====================

for (let i = 0; i < 4; i++) {
  const names = ['Full Width', 'With Commentary', 'With Legend', 'Small'];
  templates.push({
    name: `Chart - ${names[i]}`,
    category: 'chart', layout_type: 'chart',
    slide_config: { background: { color: C.WHITE }, elements: [
      txt('title', 0.5, 0.4, 12, 0.7, 'CHART TITLE', { fontSize: 28, bold: true, color: C.DARK, align: 'left' }),
      shape('line', 0.5, 1.2, 2, 0.04, { fill: C.YELLOW }),
      chart('chart', 0.5, 1.5, i === 0 ? 12 : i === 1 ? 8 : i === 2 ? 9 : 6, i === 3 ? 4 : 5),
      ...(i === 1 ? [txt('commentary', 9, 1.5, 3.8, 5, 'Key insights.', { fontSize: 12, color: C.DARK, align: 'left' })] : []),
      ...(i === 2 ? [txt('legend', 9.8, 1.5, 2.7, 5, 'Legend items', { fontSize: 10, color: C.GRAY, align: 'left' })] : []),
      txt('caption', 0.5, 6.8, 12, 0.4, 'For illustrative purposes only.', { fontSize: 10, italic: true, color: C.GRAY, align: 'left' }),
    ]}
  });
}

// Dark chart
templates.push({
  name: 'Chart - Dark Background',
  category: 'chart', layout_type: 'chart',
  slide_config: { background: { color: C.DARK }, elements: [
    txt('title', 0.5, 0.4, 12, 0.7, 'CHART TITLE', { fontSize: 28, bold: true, color: C.WHITE, align: 'left' }),
    shape('line', 0.5, 1.2, 2, 0.04, { fill: C.YELLOW }),
    chart('chart', 0.5, 1.5, 12, 5),
    txt('caption', 0.5, 6.8, 12, 0.4, 'For illustrative purposes only.', { fontSize: 10, italic: true, color: C.GRAY, align: 'left' }),
  ]}
});

// ==================== COMPOSITE SLIDES (10+) ====================

for (let i = 0; i < 3; i++) {
  const names = ['A + B = C', 'X + Y = Z', 'Simple'];
  templates.push({
    name: `Composite - Formula ${names[i]}`,
    category: 'composite', layout_type: 'composite_three',
    slide_config: { background: { color: C.DARK }, elements: [
      txt('title', 0.5, 0.4, 12, 0.7, 'THE FORMULA', { fontSize: 28, bold: true, color: C.WHITE, align: 'left' }),
      shape('box_a', 0.5, 2, 3.5, 3, { fill: C.NAVY, stroke: C.YELLOW, strokeWidth: 2 }),
      txt('label_a', 0.5, 2.2, 3.5, 0.5, 'COMPONENT A', { fontSize: 14, bold: true, color: C.YELLOW, align: 'center' }),
      txt('body_a', 0.7, 2.8, 3.1, 2, 'Description.', { fontSize: 11, color: C.WHITE, align: 'left' }),
      txt('plus', 4.2, 3, 0.8, 1, '+', { fontSize: 36, bold: true, color: C.YELLOW, align: 'center' }),
      shape('box_b', 5, 2, 3.5, 3, { fill: C.NAVY, stroke: C.YELLOW, strokeWidth: 2 }),
      txt('label_b', 5, 2.2, 3.5, 0.5, 'COMPONENT B', { fontSize: 14, bold: true, color: C.YELLOW, align: 'center' }),
      txt('body_b', 5.2, 2.8, 3.1, 2, 'Description.', { fontSize: 11, color: C.WHITE, align: 'left' }),
      txt('equals', 8.7, 3, 0.8, 1, '=', { fontSize: 36, bold: true, color: C.YELLOW, align: 'center' }),
      shape('box_c', 9.5, 2, 3.5, 3, { fill: C.YELLOW }),
      txt('label_c', 9.5, 2.2, 3.5, 0.5, 'RESULT', { fontSize: 14, bold: true, color: C.DARK, align: 'center' }),
      txt('body_c', 9.7, 2.8, 3.1, 2, 'Outcome.', { fontSize: 11, color: C.DARK, align: 'left' }),
    ]}
  });
}

// ==================== TABLE SLIDES (8+) ====================

for (let i = 0; i < 4; i++) {
  const names = ['Statistics Light', 'Statistics Dark', 'Performance', 'Comparison'];
  templates.push({
    name: `Table - ${names[i]}`,
    category: 'table', layout_type: 'strategy_table',
    slide_config: { background: { color: i === 1 ? C.DARK : C.WHITE }, elements: [
      txt('title', 0.5, 0.4, 12, 0.7, names[i].toUpperCase() + ' TABLE', { fontSize: 28, bold: true, color: i === 1 ? C.WHITE : C.DARK, align: 'left' }),
      shape('line', 0.5, 1.2, 2, 0.04, { fill: C.YELLOW }),
      table('table', 0.5, 1.5, 12, 5),
      txt('footnote', 0.5, 6.8, 12, 0.4, 'Past performance does not guarantee future results.', { fontSize: 9, italic: true, color: C.GRAY, align: 'left' }),
    ]}
  });
}

// ==================== QUOTE SLIDES (5+) ====================

for (let i = 0; i < 3; i++) {
  const names = ['Centered', 'Left Aligned', 'Large'];
  templates.push({
    name: `Quote - ${names[i]}`,
    category: 'quote', layout_type: 'quote',
    slide_config: { background: { color: C.DARK }, elements: [
      txt('quote_mark', i === 2 ? 0.5 : 1, 1.5, 2, 1.5, '"', { fontSize: i === 2 ? 180 : 120, color: C.YELLOW, align: 'center' }),
      txt('quote', i === 1 ? 0.5 : 2, 2.5, i === 1 ? 12 : 9, 2, 'The quote goes here.', { fontSize: i === 2 ? 32 : 28, italic: true, color: C.WHITE, align: i === 1 ? 'left' : 'center' }),
      txt('author', i === 1 ? 0.5 : 2, 5, 9, 0.5, '- Author Name', { fontSize: 14, color: C.YELLOW, align: i === 1 ? 'left' : 'center' }),
    ]}
  });
}

// ==================== THANK YOU SLIDES (5+) ====================

templates.push({
  name: 'Thank You - Classic',
  category: 'thank_you', layout_type: 'thank_you',
  slide_config: { background: { color: C.DARK }, elements: [
    img('logo', 4.67, 1.5, 4, 0.8, '/logos/Potomac Logo White.png'),
    txt('thank_you', 1, 2.8, 11.33, 1.5, 'THANK YOU', { fontSize: 56, bold: true, color: C.WHITE, align: 'center' }),
    txt('tagline', 1, 4.5, 11.33, 0.5, 'We have a team ready to help.', { fontSize: 14, italic: true, color: C.YELLOW, align: 'center' }),
    txt('website', 1, 5.5, 11.33, 0.4, 'potomac.com', { fontSize: 12, color: C.WHITE, align: 'center' }),
  ]}
});

templates.push({
  name: 'Thank You - With Contact',
  category: 'thank_you', layout_type: 'thank_you',
  slide_config: { background: { color: C.DARK }, elements: [
    img('logo', 4.67, 0.8, 4, 0.8, '/logos/Potomac Logo White.png'),
    txt('thank_you', 1, 2, 11.33, 1.2, 'THANK YOU', { fontSize: 48, bold: true, color: C.WHITE, align: 'center' }),
    txt('contact', 1, 3.5, 11.33, 0.5, 'Contact Name', { fontSize: 18, bold: true, color: C.YELLOW, align: 'center' }),
    txt('email', 1, 4.5, 11.33, 0.4, 'email@potomac.com', { fontSize: 12, color: C.WHITE, align: 'center' }),
    txt('phone', 1, 4.9, 11.33, 0.4, '(800) 123-4567', { fontSize: 12, color: C.WHITE, align: 'center' }),
    txt('website', 1, 5.8, 11.33, 0.4, 'potomac.com', { fontSize: 12, color: C.GRAY, align: 'center' }),
  ]}
});

templates.push({
  name: 'Thank You - Yellow',
  category: 'thank_you', layout_type: 'thank_you',
  slide_config: { background: { color: C.YELLOW }, elements: [
    img('logo', 4.67, 1.5, 4, 0.8, '/logos/Potomac Logo Black.png'),
    txt('thank_you', 1, 2.8, 11.33, 1.5, 'THANK YOU', { fontSize: 56, bold: true, color: C.DARK, align: 'center' }),
    txt('tagline', 1, 4.5, 11.33, 0.5, 'We have a team ready to help.', { fontSize: 14, italic: true, color: C.DARK, align: 'center' }),
    txt('website', 1, 5.5, 11.33, 0.4, 'potomac.com', { fontSize: 12, color: C.DARK, align: 'center' }),
  ]}
});

templates.push({
  name: 'Thank You - Simple',
  category: 'thank_you', layout_type: 'thank_you',
  slide_config: { background: { color: C.DARK }, elements: [
    txt('thank_you', 1, 3, 11.33, 1.5, 'THANK YOU', { fontSize: 64, bold: true, color: C.WHITE, align: 'center' }),
    shape('line', 5.17, 4.8, 3, 0.04, { fill: C.YELLOW }),
  ]}
});

templates.push({
  name: 'Thank You - Questions',
  category: 'thank_you', layout_type: 'thank_you',
  slide_config: { background: { color: C.DARK }, elements: [
    img('logo', 4.67, 0.5, 4, 0.8, '/logos/Potomac Logo White.png'),
    txt('thank_you', 1, 2, 11.33, 1, 'THANK YOU', { fontSize: 48, bold: true, color: C.WHITE, align: 'center' }),
    txt('questions', 1, 3.2, 11.33, 0.6, 'Questions?', { fontSize: 28, color: C.YELLOW, align: 'center' }),
    txt('contact', 1, 4.5, 11.33, 0.4, 'Contact us at info@potomac.com', { fontSize: 14, color: C.WHITE, align: 'center' }),
    txt('website', 1, 5.5, 11.33, 0.4, 'potomac.com', { fontSize: 12, color: C.GRAY, align: 'center' }),
  ]}
});

// ==================== DISCLOSURES (3+) ====================

templates.push({
  name: 'Disclosures - Standard',
  category: 'disclosures', layout_type: 'disclosures',
  slide_config: { background: { color: C.DARK }, elements: [
    txt('header', 0.5, 0.4, 12, 0.5, 'DISCLOSURES', { fontSize: 16, bold: true, color: C.YELLOW, align: 'left' }),
    txt('text', 0.5, 1, 12, 6, 'Potomac is a registered investment adviser. Registration with the SEC does not imply a certain level of skill or training. Past performance does not guarantee future results. All investing involves risk, including possible loss of principal.', { fontSize: 9, color: C.WHITE, align: 'left' }),
  ]}
});

templates.push({
  name: 'Disclosures - Light',
  category: 'disclosures', layout_type: 'disclosures',
  slide_config: { background: { color: C.WHITE }, elements: [
    txt('header', 0.5, 0.4, 12, 0.5, 'DISCLOSURES', { fontSize: 16, bold: true, color: C.DARK, align: 'left' }),
    shape('line', 0.5, 1, 2, 0.03, { fill: C.YELLOW }),
    txt('text', 0.5, 1.3, 12, 5.7, 'Potomac is a registered investment adviser. Registration with the SEC does not imply a certain level of skill or training. Past performance does not guarantee future results.', { fontSize: 9, color: C.GRAY, align: 'left' }),
  ]}
});

templates.push({
  name: 'Definitions - Standard',
  category: 'disclosures', layout_type: 'definitions',
  slide_config: { background: { color: C.DARK }, elements: [
    txt('header', 0.5, 0.4, 12, 0.5, 'IMPORTANT DEFINITIONS', { fontSize: 14, bold: true, color: C.YELLOW, align: 'left' }),
    txt('def1', 0.5, 1.2, 12, 1, 'S&P 500: A market-cap weighted index of 500 large US companies.', { fontSize: 10, color: C.WHITE, align: 'left' }),
    txt('def2', 0.5, 2.2, 12, 1, 'Alpha: The excess return of an investment relative to its benchmark.', { fontSize: 10, color: C.WHITE, align: 'left' }),
    txt('def3', 0.5, 3.2, 12, 1, 'Beta: A measure of volatility relative to the overall market.', { fontSize: 10, color: C.WHITE, align: 'left' }),
    txt('def4', 0.5, 4.2, 12, 1, 'Sharpe Ratio: Risk-adjusted return measure.', { fontSize: 10, color: C.WHITE, align: 'left' }),
  ]}
});

console.log(`Total templates to create: ${templates.length}`);

function seedTemplates() {
  console.log('Seeding Potomac templates...');
  
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
  
  console.log(`\nDone! Created ${created} templates.`);
  db.close();
}

seedTemplates();