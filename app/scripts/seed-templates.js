#!/usr/bin/env node
'use strict';
// Seed premade Potomac templates into the database

const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '..', 'data', 'presenter.db');
const db = new Database(dbPath);

const templates = [
  {
    name: 'Strategy Overview',
    description: 'Complete strategy presentation with cover, process, data, and closing slides',
    category: 'preset',
    layout_type: 'content',
    slide_config: JSON.stringify({
      slides: [
        { name: 'Cover', background: { color: '#212121' }, elements: [
          { id: 'topbar', type: 'shape', x: 0, y: 0, w: 13.33, h: 0.08, options: { fill: '#FEC00F' } },
          { id: 'logo', type: 'image', x: 0.4, y: 0.3, w: 2.0, h: 0.41, content: '/logos/potomac-logo-white.png', options: {} },
          { id: 'divider', type: 'shape', x: 4.67, y: 2.2, w: 4, h: 0.08, options: { fill: '#FEC00F' } },
          { id: 'title', type: 'text', x: 1.0, y: 2.6, w: 11.33, h: 2.2, style: { color: '#FFFFFF', fontSize: 48, fontFace: 'Rajdhani', bold: true, align: 'center' }, content: 'STRATEGY OVERVIEW' },
          { id: 'tagline', type: 'text', x: 0.4, y: 6.75, w: 12.53, h: 0.5, style: { color: '#FEC00F', fontSize: 14, fontFace: 'Quicksand', align: 'center' }, content: 'Built to Conquer Risk\u00AE' },
          { id: 'bottombar', type: 'shape', x: 0, y: 7.42, w: 13.33, h: 0.08, options: { fill: '#FEC00F' } }
        ]},
        { name: 'Section Divider', background: { color: '#FFFFFF' }, elements: [
          { id: 'icon', type: 'image', x: 12.33, y: 0.15, w: 0.7, h: 0.7, content: '/potomac-icon.png', options: {} },
          { id: 'title', type: 'text', x: 0.8, y: 2.5, w: 11.73, h: 2.0, style: { color: '#212121', fontSize: 44, fontFace: 'Rajdhani', bold: true, align: 'center' }, content: 'SECTION TITLE' },
          { id: 'bar', type: 'shape', x: 5.17, y: 4.65, w: 3, h: 0.08, options: { fill: '#FEC00F' } }
        ]},
        { name: 'Content - Dark', background: { color: '#212121' }, elements: [
          { id: 'logo', type: 'image', x: 0.4, y: 0.2, w: 1.6, h: 0.5, content: '/potomac-logo-white.png', options: {} },
          { id: 'icon', type: 'image', x: 12.33, y: 0.15, w: 0.7, h: 0.7, content: '/potomac-icon.png', options: {} },
          { id: 'title', type: 'text', x: 0.4, y: 0.9, w: 12.0, h: 0.8, style: { color: '#FFFFFF', fontSize: 32, fontFace: 'Rajdhani', bold: true }, content: 'SLIDE TITLE' },
          { id: 'bar', type: 'shape', x: 0.4, y: 1.8, w: 2, h: 0.06, options: { fill: '#FEC00F' } },
          { id: 'body', type: 'text', x: 0.4, y: 2.2, w: 12.0, h: 4.5, style: { color: '#FFFFFF', fontSize: 16, fontFace: 'Quicksand' }, content: 'Body text content goes here' }
        ]},
        { name: 'Content - Light', background: { color: '#FFFFFF' }, elements: [
          { id: 'icon', type: 'image', x: 12.33, y: 0.15, w: 0.7, h: 0.7, content: '/potomac-icon.png', options: {} },
          { id: 'title', type: 'text', x: 0.4, y: 0.55, w: 12.0, h: 0.7, style: { color: '#212121', fontSize: 28, fontFace: 'Rajdhani', bold: true }, content: 'SLIDE TITLE' },
          { id: 'bar', type: 'shape', x: 0.4, y: 1.3, w: 2, h: 0.06, options: { fill: '#FEC00F' } },
          { id: 'body', type: 'text', x: 0.4, y: 1.6, w: 12.0, h: 5.2, style: { color: '#212121', fontSize: 16, fontFace: 'Quicksand' }, content: 'Body text content goes here' }
        ]},
        { name: 'Thank You', background: { color: '#212121' }, elements: [
          { id: 'logo', type: 'image', x: 0.4, y: 0.25, w: 2.0, h: 0.5, content: '/potomac-logo-white.png', options: {} },
          { id: 'thanks', type: 'text', x: 0.4, y: 2.5, w: 12.53, h: 1.5, style: { color: '#FFFFFF', fontSize: 60, fontFace: 'Rajdhani', bold: true, align: 'center' }, content: 'THANK YOU!' },
          { id: 'sub', type: 'text', x: 0.4, y: 4.2, w: 12.53, h: 0.6, style: { color: '#FEC00F', fontSize: 16, fontFace: 'Quicksand', align: 'center' }, content: 'We have a team of regional consultants ready to help.' },
          { id: 'url', type: 'text', x: 0.4, y: 5.2, w: 12.53, h: 0.4, style: { color: '#FFFFFF', fontSize: 14, fontFace: 'Quicksand', align: 'center' }, content: 'potomac.com' }
        ]}
      ]
    })
  },
  {
    name: 'Three Pillars',
    description: 'Three-pillar process layout with numbered circles',
    category: 'preset',
    layout_type: 'three_column',
    slide_config: JSON.stringify({
      slides: [
        { name: 'Cover', background: { color: '#212121' }, elements: [
          { id: 'topbar', type: 'shape', x: 0, y: 0, w: 13.33, h: 0.08, options: { fill: '#FEC00F' } },
          { id: 'logo', type: 'image', x: 0.4, y: 0.3, w: 2.0, h: 0.41, content: '/logos/potomac-logo-white.png', options: {} },
          { id: 'divider', type: 'shape', x: 4.67, y: 2.2, w: 4, h: 0.08, options: { fill: '#FEC00F' } },
          { id: 'title', type: 'text', x: 1.0, y: 2.6, w: 11.33, h: 2.2, style: { color: '#FFFFFF', fontSize: 48, fontFace: 'Rajdhani', bold: true, align: 'center' }, content: 'THREE PILLARS' },
          { id: 'tagline', type: 'text', x: 0.4, y: 6.75, w: 12.53, h: 0.5, style: { color: '#FEC00F', fontSize: 14, fontFace: 'Quicksand', align: 'center' }, content: 'Built to Conquer Risk\u00AE' },
          { id: 'bottombar', type: 'shape', x: 0, y: 7.42, w: 13.33, h: 0.08, options: { fill: '#FEC00F' } }
        ]},
        { name: 'Three Pillars', background: { color: '#212121' }, elements: [
          { id: 'logo', type: 'image', x: 0.4, y: 0.2, w: 1.6, h: 0.5, content: '/potomac-logo-white.png', options: {} },
          { id: 'title', type: 'text', x: 0.4, y: 0.9, w: 12.0, h: 0.8, style: { color: '#FFFFFF', fontSize: 32, fontFace: 'Rajdhani', bold: true }, content: 'OUR PROCESS' },
          { id: 'c1', type: 'shape', x: 1.5, y: 2.8, w: 2.6, h: 2.6, options: { shape: 'ellipse', fill: '#212121', line: '#FEC00F' } },
          { id: 'n1', type: 'text', x: 2.35, y: 3.15, w: 0.9, h: 0.9, style: { color: '#212121', fontSize: 28, fontFace: 'Rajdhani', bold: true, align: 'center' }, content: '1' },
          { id: 'l1', type: 'text', x: 1.6, y: 4.25, w: 2.4, h: 0.45, style: { color: '#FEC00F', fontSize: 14, fontFace: 'Rajdhani', bold: true, align: 'center' }, content: 'PILLAR ONE' },
          { id: 'c2', type: 'shape', x: 5.37, y: 2.8, w: 2.6, h: 2.6, options: { shape: 'ellipse', fill: '#212121', line: '#FEC00F' } },
          { id: 'n2', type: 'text', x: 6.22, y: 3.15, w: 0.9, h: 0.9, style: { color: '#212121', fontSize: 28, fontFace: 'Rajdhani', bold: true, align: 'center' }, content: '2' },
          { id: 'l2', type: 'text', x: 5.47, y: 4.25, w: 2.4, h: 0.45, style: { color: '#FEC00F', fontSize: 14, fontFace: 'Rajdhani', bold: true, align: 'center' }, content: 'PILLAR TWO' },
          { id: 'c3', type: 'shape', x: 9.23, y: 2.8, w: 2.6, h: 2.6, options: { shape: 'ellipse', fill: '#212121', line: '#FEC00F' } },
          { id: 'n3', type: 'text', x: 10.08, y: 3.15, w: 0.9, h: 0.9, style: { color: '#212121', fontSize: 28, fontFace: 'Rajdhani', bold: true, align: 'center' }, content: '3' },
          { id: 'l3', type: 'text', x: 9.33, y: 4.25, w: 2.4, h: 0.45, style: { color: '#FEC00F', fontSize: 14, fontFace: 'Rajdhani', bold: true, align: 'center' }, content: 'PILLAR THREE' }
        ]}
      ]
    })
  },
  {
    name: 'Data Presentation',
    description: 'Performance data and risk statistics focused template',
    category: 'preset',
    layout_type: 'table',
    slide_config: JSON.stringify({
      slides: [
        { name: 'Cover', background: { color: '#212121' }, elements: [
          { id: 'topbar', type: 'shape', x: 0, y: 0, w: 13.33, h: 0.08, options: { fill: '#FEC00F' } },
          { id: 'logo', type: 'image', x: 0.4, y: 0.3, w: 2.0, h: 0.41, content: '/logos/potomac-logo-white.png', options: {} },
          { id: 'divider', type: 'shape', x: 4.67, y: 2.2, w: 4, h: 0.08, options: { fill: '#FEC00F' } },
          { id: 'title', type: 'text', x: 1.0, y: 2.6, w: 11.33, h: 2.2, style: { color: '#FFFFFF', fontSize: 48, fontFace: 'Rajdhani', bold: true, align: 'center' }, content: 'PERFORMANCE DATA' },
          { id: 'tagline', type: 'text', x: 0.4, y: 6.75, w: 12.53, h: 0.5, style: { color: '#FEC00F', fontSize: 14, fontFace: 'Quicksand', align: 'center' }, content: 'Built to Conquer Risk\u00AE' },
          { id: 'bottombar', type: 'shape', x: 0, y: 7.42, w: 13.33, h: 0.08, options: { fill: '#FEC00F' } }
        ]},
        { name: 'Data Table - Light', background: { color: '#FFFFFF' }, elements: [
          { id: 'icon', type: 'image', x: 12.33, y: 0.15, w: 0.7, h: 0.7, content: '/potomac-icon.png', options: {} },
          { id: 'title', type: 'text', x: 0.4, y: 0.55, w: 12.0, h: 0.7, style: { color: '#212121', fontSize: 28, fontFace: 'Rajdhani', bold: true }, content: 'PERFORMANCE COMPARISON' },
          { id: 'bar', type: 'shape', x: 0.4, y: 1.3, w: 2, h: 0.06, options: { fill: '#FEC00F' } },
          { id: 'tablearea', type: 'shape', x: 0.4, y: 1.5, w: 12.53, h: 5.2, options: { fill: '#F5F5F5' } },
          { id: 'tablehead', type: 'shape', x: 0.4, y: 1.5, w: 12.53, h: 0.5, options: { fill: '#FEC00F' } },
          { id: 'headtext', type: 'text', x: 0.4, y: 1.5, w: 12.53, h: 0.5, style: { color: '#212121', fontSize: 14, fontFace: 'Rajdhani', bold: true, align: 'center' }, content: 'TABLE HEADER' }
        ]},
        { name: 'Chart Placeholder', background: { color: '#FFFFFF' }, elements: [
          { id: 'icon', type: 'image', x: 12.33, y: 0.15, w: 0.7, h: 0.7, content: '/potomac-icon.png', options: {} },
          { id: 'title', type: 'text', x: 0.4, y: 0.55, w: 12.0, h: 0.7, style: { color: '#212121', fontSize: 28, fontFace: 'Rajdhani', bold: true }, content: 'CHART TITLE' },
          { id: 'bar', type: 'shape', x: 0.4, y: 1.3, w: 2, h: 0.06, options: { fill: '#FEC00F' } },
          { id: 'chartarea', type: 'shape', x: 0.4, y: 1.5, w: 12.53, h: 5.2, options: { fill: '#C6C6C6' } },
          { id: 'chartlabel', type: 'text', x: 0.4, y: 3.5, w: 12.53, h: 1.0, style: { color: '#737373', fontSize: 24, fontFace: 'Rajdhani', align: 'center' }, content: '[ CHART ]' }
        ]},
        { name: 'Disclosures', background: { color: '#212121' }, elements: [
          { id: 'icon', type: 'image', x: 12.33, y: 0.15, w: 0.7, h: 0.7, content: '/potomac-icon.png', options: {} },
          { id: 'title', type: 'text', x: 0.4, y: 0.25, w: 11.0, h: 0.55, style: { color: '#FEC00F', fontSize: 22, fontFace: 'Rajdhani', bold: true }, content: 'DISCLOSURES' },
          { id: 'body', type: 'text', x: 0.4, y: 0.9, w: 12.53, h: 6.1, style: { color: '#FFFFFF', fontSize: 10, fontFace: 'Quicksand' }, content: 'Disclosure text here...' }
        ]}
      ]
    })
  },
  {
    name: 'Minimal Pitch',
    description: 'Clean minimal pitch deck with white and yellow',
    category: 'preset',
    layout_type: 'content',
    slide_config: JSON.stringify({
      slides: [
        { name: 'Cover', background: { color: '#FFFFFF' }, elements: [
          { id: 'logo', type: 'image', x: 0.4, y: 0.25, w: 2.0, h: 0.41, content: '/potomac-logo.png', options: {} },
          { id: 'accent', type: 'shape', x: 0, y: 6.5, w: 13.33, h: 1.0, options: { fill: '#FEC00F' } },
          { id: 'title', type: 'text', x: 0.4, y: 2.5, w: 12.53, h: 2.0, style: { color: '#212121', fontSize: 48, fontFace: 'Rajdhani', bold: true, align: 'center' }, content: 'PRESENTATION TITLE' },
          { id: 'sub', type: 'text', x: 0.4, y: 4.5, w: 12.53, h: 0.6, style: { color: '#737373', fontSize: 16, fontFace: 'Quicksand', align: 'center' }, content: 'Subtitle or date' }
        ]},
        { name: 'Content', background: { color: '#FFFFFF' }, elements: [
          { id: 'accent', type: 'shape', x: 0, y: 0, w: 0.15, h: 7.5, options: { fill: '#FEC00F' } },
          { id: 'title', type: 'text', x: 0.6, y: 0.5, w: 12.0, h: 0.8, style: { color: '#212121', fontSize: 32, fontFace: 'Rajdhani', bold: true }, content: 'SLIDE TITLE' },
          { id: 'body', type: 'text', x: 0.6, y: 1.6, w: 12.0, h: 5.2, style: { color: '#212121', fontSize: 16, fontFace: 'Quicksand' }, content: 'Content goes here' }
        ]},
        { name: 'Two Column', background: { color: '#FFFFFF' }, elements: [
          { id: 'accent', type: 'shape', x: 0, y: 0, w: 0.15, h: 7.5, options: { fill: '#FEC00F' } },
          { id: 'title', type: 'text', x: 0.6, y: 0.5, w: 12.0, h: 0.8, style: { color: '#212121', fontSize: 32, fontFace: 'Rajdhani', bold: true }, content: 'TWO COLUMN' },
          { id: 'left', type: 'text', x: 0.6, y: 1.8, w: 5.8, h: 5.0, style: { color: '#212121', fontSize: 14, fontFace: 'Quicksand' }, content: 'Left column content' },
          { id: 'right', type: 'text', x: 6.93, y: 1.8, w: 5.8, h: 5.0, style: { color: '#212121', fontSize: 14, fontFace: 'Quicksand' }, content: 'Right column content' },
          { id: 'divider', type: 'shape', x: 6.57, y: 1.8, w: 0.06, h: 5.0, options: { fill: '#C6C6C6' } }
        ]}
      ]
    })
  }
];

// Insert templates
const stmt = db.prepare(`INSERT OR IGNORE INTO templates (id, name, description, category, layout_type, slide_config, is_public)
  VALUES (@id, @name, @description, @category, @layout_type, @slide_config, 1)`);

templates.forEach(t => {
  const id = crypto.randomUUID();
  stmt.run({ id, ...t });
  console.log('Inserted:', t.name);
});

console.log('Done! Seeded', templates.length, 'preset templates');
db.close();
