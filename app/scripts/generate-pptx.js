#!/usr/bin/env node
'use strict';

// Potomac PPTX Generator - Fixed script, takes JSON outline as argv[1] file path
// Usage: node generate-pptx.js <outline.json> <output.pptx> [logo_path]

const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const OUTLINE_PATH = process.argv[2];
const OUTPUT_PATH = process.argv[3] || 'output.pptx';
const LOGO_PATH = process.argv[4] || '';
const THEME_NAME = process.argv[5] || 'classic';

if (!OUTLINE_PATH) {
  process.stderr.write('Usage: node generate-pptx.js <outline.json> <output.pptx> [logo_path] [theme]\n');
  process.exit(1);
}

const outline = JSON.parse(fs.readFileSync(OUTLINE_PATH, 'utf-8'));

// Theme definitions
var THEMES = {
  classic: { YELLOW: 'FEC00F', DARK: '212121', WHITE: 'FFFFFF', GRAY: '737373', GRAY20: 'C6C6C6', GRAYALT: 'F5F5F5', ACCENT: 'FEC00F' },
  navy:    { YELLOW: 'FEC00F', DARK: '1A2744', WHITE: 'FFFFFF', GRAY: '8899AA', GRAY20: 'D0D8E0', GRAYALT: 'F0F3F6', ACCENT: 'FEC00F' },
  forest:  { YELLOW: '4CAF50', DARK: '1B2E1B', WHITE: 'FFFFFF', GRAY: '6B8E6B', GRAY20: 'C8D8C8', GRAYALT: 'F0F5F0', ACCENT: '4CAF50' },
  slate:   { YELLOW: 'FF6B35', DARK: '2D2D3D', WHITE: 'FFFFFF', GRAY: '8E8E9E', GRAY20: 'D0D0D8', GRAYALT: 'F2F2F5', ACCENT: 'FF6B35' },
  minimal: { YELLOW: '333333', DARK: '1A1A1A', WHITE: 'FFFFFF', GRAY: '999999', GRAY20: 'E0E0E0', GRAYALT: 'F8F8F8', ACCENT: '666666' },
};

// Brand constants — theme-aware
var C = THEMES[THEME_NAME] || THEMES.classic;
var F = { HEAD: 'Rajdhani', BODY: 'Quicksand' };
const W = 13.33, H = 7.5;

function addLogo(slide, x, y, w, h) {
  x = x || 0.35; y = y || 0.18; w = w || 1.6; h = h || 0.5;
  if (LOGO_PATH && fs.existsSync(LOGO_PATH)) {
    // Use 'contain' sizing to preserve aspect ratio - logo won't stretch
    slide.addImage({ path: LOGO_PATH, x: x, y: y, w: w, h: h, sizing: { type: 'contain' } });
  } else {
    slide.addText('POTOMAC', { x: x, y: y, w: w, h: h, fontFace: F.HEAD, fontSize: 18, bold: true, color: C.YELLOW, align: 'left', valign: 'middle' });
  }
}

function addSectionTag(slide, tag, name) {
  if (!tag && !name) return;
  var text = name ? (name + (tag ? ' | ' + tag : '')) : (tag || '');
  slide.addText(text.toUpperCase(), { x: 0.4, y: 0.15, w: 6, h: 0.35, fontFace: F.HEAD, fontSize: 11, bold: true, color: C.YELLOW, align: 'left', valign: 'middle' });
}

// Resolve icon paths from logo path directory
var ICON_WHITE = LOGO_PATH ? path.join(path.dirname(LOGO_PATH), 'potomac-icon-white.png') : '';
var ICON_YELLOW = LOGO_PATH ? path.join(path.dirname(LOGO_PATH), 'potomac-icon-yellow.png') : '';
var ICON_BLACK = LOGO_PATH ? path.join(path.dirname(LOGO_PATH), 'potomac-icon-black.png') : '';

function addBadge(slide, darkBg) {
  // Use white icon on dark backgrounds, yellow/black on light
  var iconPath = darkBg !== false ? ICON_WHITE : ICON_BLACK;
  if (iconPath && fs.existsSync(iconPath)) {
    slide.addImage({ path: iconPath, x: W - 1.0, y: 0.15, w: 0.7, h: 0.7, sizing: { type: 'contain', w: 0.7, h: 0.7 } });
  } else if (ICON_YELLOW && fs.existsSync(ICON_YELLOW)) {
    slide.addImage({ path: ICON_YELLOW, x: W - 1.0, y: 0.15, w: 0.7, h: 0.7, sizing: { type: 'contain', w: 0.7, h: 0.7 } });
  } else {
    slide.addShape('ellipse', { x: W - 1.1, y: 0.15, w: 0.75, h: 0.75, fill: { color: C.YELLOW } });
  }
}

function buildCover(pres, d) {
  var slide = pres.addSlide();
  // Dark background - white logo is clearly visible, no contrast issues
  slide.background = { color: C.DARK };
  // Yellow accent bar at top
  slide.addShape('rect', { x: 0, y: 0, w: W, h: 0.08, fill: { color: C.YELLOW } });
  // White logo on dark background
  addLogo(slide, 0.4, 0.3, 2.0, 0.41);
  // Yellow divider bar
  slide.addShape('rect', { x: (W - 4) / 2, y: 2.2, w: 4, h: 0.08, fill: { color: C.YELLOW } });
  // Title in white
  slide.addText((d.title || 'POTOMAC PRESENTATION').toUpperCase(), { x: 1.0, y: 2.6, w: W - 2, h: 2.2, fontFace: F.HEAD, fontSize: 48, bold: true, color: C.WHITE, align: 'center', valign: 'middle' });
  // Tagline in yellow
  slide.addText('Built to Conquer Risk\u00AE', { x: 0.4, y: H - 0.75, w: W - 0.8, h: 0.5, fontFace: F.BODY, fontSize: 14, color: C.YELLOW, align: 'center', italic: true });
  // Yellow accent bar at bottom
  slide.addShape('rect', { x: 0, y: H - 0.08, w: W, h: 0.08, fill: { color: C.YELLOW } });
}

function buildSectionDivider(pres, d) {
  var slide = pres.addSlide();
  slide.background = { color: C.WHITE };
  addBadge(slide, false);
  slide.addText((d.section_title || d.title || 'SECTION').toUpperCase(), { x: 0.8, y: 2.5, w: W - 1.6, h: 2.0, fontFace: F.HEAD, fontSize: 44, bold: true, color: C.DARK, align: 'center', valign: 'middle' });
  slide.addShape('rect', { x: (W - 3) / 2, y: 4.65, w: 3, h: 0.08, fill: { color: C.YELLOW } });
}

function buildThreePillars(pres, d) {
  var slide = pres.addSlide();
  slide.background = { color: C.DARK };
  addSectionTag(slide, d.section_tag);
  addBadge(slide);

  // Title - large, spans full width
  slide.addText((d.title || '').toUpperCase(), { x: 0.4, y: 0.6, w: W - 1.5, h: 1.0, fontFace: F.HEAD, fontSize: 32, bold: true, color: C.WHITE, wrap: true });

  // Subtitle in yellow
  if (d.subtitle) {
    slide.addText(d.subtitle.toUpperCase(), { x: 0.4, y: 1.8, w: W - 1.5, h: 0.5, fontFace: F.HEAD, fontSize: 16, bold: true, color: C.YELLOW, align: 'center' });
  }

  var pillars = d.pillars || [];
  var circleD = 2.6;  // Large outer circle diameter
  var numD = 0.9;     // Small number circle diameter
  var totalW = pillars.length * circleD + (pillars.length - 1) * 0.8;
  var startX = (W - totalW) / 2;
  var circleY = 2.8;

  pillars.forEach(function(p, i) {
    var cx = startX + i * (circleD + 0.8);

    // Large outer circle - OUTLINE only, no fill
    slide.addShape('ellipse', {
      x: cx, y: circleY, w: circleD, h: circleD,
      fill: { color: C.DARK },
      line: { color: C.YELLOW, width: 2.5 }
    });

    // Small filled number circle inside
    var numX = cx + (circleD - numD) / 2;
    var numY = circleY + 0.35;
    slide.addShape('ellipse', {
      x: numX, y: numY, w: numD, h: numD,
      fill: { color: C.YELLOW }
    });
    slide.addText(String(i + 1), {
      x: numX, y: numY, w: numD, h: numD,
      fontFace: F.HEAD, fontSize: 28, bold: true, color: C.DARK,
      align: 'center', valign: 'middle'
    });

    // Label below the number, inside circle
    slide.addText((p.label || '').toUpperCase(), {
      x: cx + 0.1, y: circleY + 1.45, w: circleD - 0.2, h: 0.45,
      fontFace: F.HEAD, fontSize: 14, bold: true, color: C.YELLOW,
      align: 'center'
    });

    // Description below label, inside circle
    slide.addText(p.description || '', {
      x: cx + 0.15, y: circleY + 1.9, w: circleD - 0.3, h: 0.55,
      fontFace: F.BODY, fontSize: 10, color: C.WHITE,
      align: 'center', wrap: true
    });

    // Arrow connector between circles (triangle pointing right)
    if (i < pillars.length - 1) {
      var arrowX = cx + circleD + 0.15;
      var arrowY = circleY + circleD / 2 - 0.15;
      slide.addText('\u25B6', {
        x: arrowX, y: arrowY, w: 0.5, h: 0.3,
        fontFace: F.HEAD, fontSize: 14, color: C.GRAY,
        align: 'center', valign: 'middle'
      });
    }
  });
}

function buildChart(pres, d) {
  var slide = pres.addSlide();
  slide.background = { color: C.WHITE };
  addSectionTag(slide, d.section_tag);
  addBadge(slide, false);
  slide.addText((d.chart_title || d.title || 'CHART').toUpperCase(), { x: 0.4, y: 0.55, w: W - 1.5, h: 0.7, fontFace: F.HEAD, fontSize: 28, bold: true, color: C.DARK });
  slide.addShape('rect', { x: 0.4, y: 1.3, w: 2, h: 0.06, fill: { color: C.YELLOW } });
  
  // Check if chart has image data (from AI generator or uploaded)
  if (d.chart_image) {
    // Use the provided chart image
    slide.addImage({ 
      data: d.chart_image, // base64 data URI
      x: 0.6, y: 1.5, w: W - 1.2, h: 4.8,
      sizing: { type: 'contain' }
    });
  } else if (d.chart_data && d.chart_type) {
    // Build native PowerPoint chart with Potomac branding
    var chartOpts = {
      x: 0.6, y: 1.5, w: W - 1.2, h: 4.8,
      chartGrouping: d.chart_grouping || 'clustered',
      showTitle: false,
      showLegend: d.show_legend !== false,
      showValue: d.show_values === true,
      legendPos: d.legend_position || 'b',
      chartColors: [C.YELLOW, '3B82F6', '22C55E', 'EF4444', '8B5CF6', 'F97316'],
      catAxisTitle: d.x_axis_title || '',
      valAxisTitle: d.y_axis_title || '',
      catAxisLabelFontSize: 10,
      valAxisLabelFontSize: 10,
      catAxisLabelFontFace: F.BODY,
      valAxisLabelFontFace: F.BODY,
      catAxisLabelColor: C.GRAY,
      valAxisLabelColor: C.GRAY,
      valAxisMinVal: d.y_min || 0,
      chartAreaLine: { color: C.GRAY20, width: 0.5 },
      fill: C.WHITE
    };
    
    var chartData = d.chart_data;
    if (d.chart_type === 'bar') {
      slide.addChart('bar', chartData, chartOpts);
    } else if (d.chart_type === 'line') {
      slide.addChart('line', chartData, Object.assign({}, chartOpts, { lineSmooth: true }));
    } else if (d.chart_type === 'pie') {
      slide.addChart('pie', chartData, Object.assign({}, chartOpts, { showLegend: true, showValue: true }));
    } else if (d.chart_type === 'doughnut') {
      slide.addChart('doughnut', chartData, Object.assign({}, chartOpts, { showLegend: true, showValue: true, holeSize: 50 }));
    } else if (d.chart_type === 'area') {
      slide.addChart('area', chartData, chartOpts);
    } else {
      // Default to bar
      slide.addChart('bar', chartData, chartOpts);
    }
  } else {
    // Placeholder if no chart data
    slide.addShape('rect', { x: 0.4, y: 1.5, w: W - 0.8, h: 5.2, fill: { color: C.GRAY20 }, line: { color: C.GRAY } });
    slide.addText('[ CHART ]', { x: 0.4, y: 1.5, w: W - 0.8, h: 5.2, fontFace: F.HEAD, fontSize: 24, color: C.GRAY, align: 'center', valign: 'middle' });
  }
  
  if (d.chart_caption) slide.addText(d.chart_caption, { x: 0.4, y: H - 0.45, w: W - 0.8, h: 0.35, fontFace: F.BODY, fontSize: 9, color: C.GRAY, italic: true });
}

function buildCompositeThree(pres, d) {
  var slide = pres.addSlide();
  slide.background = { color: C.DARK };
  addSectionTag(slide, d.section_tag);
  addBadge(slide);
  slide.addText((d.headline || d.title || '').toUpperCase(), { x: 0.4, y: 0.55, w: W - 1.5, h: 0.9, fontFace: F.HEAD, fontSize: 22, bold: true, color: C.WHITE, wrap: true });
  var comps = d.components || [];
  var boxW = (W - 1.4) / 3, boxY = 1.7, boxH = H - boxY - 0.4;
  comps.forEach(function(c, i) {
    var x = 0.4 + i * (boxW + 0.1);
    var isR = c.is_result;
    slide.addShape('roundRect', { x: x, y: boxY, w: boxW, h: boxH, rectRadius: 0.15, fill: { color: isR ? C.YELLOW : C.DARK }, line: { color: C.YELLOW, width: 2 }, shadow: { type: 'outer', blur: 6, offset: 2, color: '000000', opacity: 0.2 } });
    if (i < comps.length - 1) {
      var sym = i === comps.length - 2 ? '=' : '+';
      slide.addText(sym, { x: x + boxW - 0.05, y: boxY + boxH / 2 - 0.3, w: 0.3, h: 0.6, fontFace: F.HEAD, fontSize: 24, bold: true, color: C.YELLOW, align: 'center' });
    }
    // Pill-shaped title above box
    slide.addShape('roundRect', { x: x + 0.3, y: boxY - 0.2, w: boxW - 0.6, h: 0.4, rectRadius: 0.2, fill: { color: isR ? C.YELLOW : '444444' } });
    slide.addText((c.title || '').toUpperCase(), { x: x + 0.3, y: boxY - 0.2, w: boxW - 0.6, h: 0.4, fontFace: F.HEAD, fontSize: 11, bold: true, color: isR ? C.DARK : C.YELLOW, align: 'center', valign: 'middle' });
    slide.addText(c.body || '', { x: x + 0.15, y: boxY + 0.35, w: boxW - 0.3, h: boxH - 0.6, fontFace: F.BODY, fontSize: 13, color: isR ? C.DARK : C.WHITE, align: 'center', valign: 'middle', wrap: true });
  });
}

function buildCompositeFour(pres, d) {
  var slide = pres.addSlide();
  slide.background = { color: C.DARK };
  addSectionTag(slide, d.section_tag);
  addBadge(slide);
  slide.addText((d.title || '').toUpperCase(), { x: 0.4, y: 0.55, w: W - 1.5, h: 0.65, fontFace: F.HEAD, fontSize: 26, bold: true, color: C.WHITE });
  var comps = d.components || [];
  var inputs = comps.filter(function(c) { return !c.is_result; });
  var result = comps.find(function(c) { return c.is_result; });
  var iH = 1.4, iW = 5.0, sY = 1.85, gap = 0.2;
  inputs.forEach(function(c, i) {
    var y = sY + i * (iH + gap);
    slide.addShape('rect', { x: 0.4, y: y, w: iW, h: iH, fill: { color: C.DARK }, line: { color: C.YELLOW, width: 2 } });
    slide.addText((c.title || '').toUpperCase(), { x: 0.6, y: y + 0.1, w: iW - 0.4, h: 0.4, fontFace: F.HEAD, fontSize: 14, bold: true, color: C.YELLOW });
    slide.addText(c.body || '', { x: 0.6, y: y + 0.55, w: iW - 0.4, h: iH - 0.65, fontFace: F.BODY, fontSize: 12, color: C.WHITE, wrap: true });
  });
  slide.addText('\u2192', { x: iW + 0.4, y: sY + (inputs.length * (iH + gap)) / 2 - 0.4, w: 0.8, h: 0.8, fontFace: F.HEAD, fontSize: 36, color: C.YELLOW, align: 'center', valign: 'middle' });
  if (result) {
    var rX = iW + 1.4, rW = W - rX - 0.4, rH = inputs.length * (iH + gap) - gap;
    slide.addShape('rect', { x: rX, y: sY, w: rW, h: rH, fill: { color: C.YELLOW } });
    slide.addText((result.title || '').toUpperCase(), { x: rX + 0.2, y: sY + 0.2, w: rW - 0.4, h: 0.55, fontFace: F.HEAD, fontSize: 15, bold: true, color: C.DARK, align: 'center' });
    slide.addText(result.body || '', { x: rX + 0.2, y: sY + 0.85, w: rW - 0.4, h: rH - 1.1, fontFace: F.BODY, fontSize: 13, color: C.DARK, align: 'center', wrap: true });
  }
}

function buildFiveComponent(pres, d) {
  var slide = pres.addSlide();
  slide.background = { color: C.DARK };
  addSectionTag(slide, d.section_tag, d.subtitle);
  addBadge(slide);
  slide.addText((d.title || '').toUpperCase(), { x: 0.4, y: 0.55, w: W - 1.5, h: 0.7, fontFace: F.HEAD, fontSize: 26, bold: true, color: C.WHITE });
  var corners = { top_left: [0.4, 1.5], top_right: [W - 4.5, 1.5], bottom_left: [0.4, 4.5], bottom_right: [W - 4.5, 4.5] };
  (d.components || []).forEach(function(c) {
    var pos = corners[c.position]; if (!pos) return;
    slide.addText((c.label || '').toUpperCase(), { x: pos[0], y: pos[1], w: 3.8, h: 0.4, fontFace: F.HEAD, fontSize: 14, bold: true, color: C.YELLOW });
    slide.addText(c.body || '', { x: pos[0], y: pos[1] + 0.4, w: 3.8, h: 1.0, fontFace: F.BODY, fontSize: 12, color: C.WHITE, wrap: true });
  });
  var cx = (W - 3.2) / 2, cy = 2.7;
  slide.addShape('rect', { x: cx, y: cy, w: 3.2, h: 2.2, fill: { color: C.DARK }, line: { color: C.YELLOW, width: 2 } });
  slide.addText((d.center_label || '').toUpperCase(), { x: cx, y: cy + 0.2, w: 3.2, h: 0.5, fontFace: F.HEAD, fontSize: 14, bold: true, color: C.YELLOW, align: 'center' });
  slide.addText(d.center_body || '', { x: cx, y: cy + 0.75, w: 3.2, h: 1.2, fontFace: F.BODY, fontSize: 12, color: C.WHITE, align: 'center', wrap: true });
}

function buildStrategyTable(pres, d) {
  var slide = pres.addSlide();
  slide.background = { color: C.WHITE };
  addSectionTag(slide, null, d.strategy_name);
  addBadge(slide, false);
  slide.addText((d.title || '').toUpperCase(), { x: 0.4, y: 0.55, w: W - 1.5, h: 0.7, fontFace: F.HEAD, fontSize: 28, bold: true, color: C.DARK });
  slide.addShape('rect', { x: 0.4, y: 1.3, w: 2, h: 0.06, fill: { color: C.YELLOW } });
  var cols = d.columns || ['COLUMN 1', 'COLUMN 2'];
  var rows = d.rows || [];
  var tableRows = [];
  tableRows.push([{ text: (d.table_title || '').toUpperCase(), options: { fontFace: F.HEAD, fontSize: 14, bold: true, color: C.DARK, fill: { color: C.YELLOW }, align: 'center', colspan: cols.length } }]);
  tableRows.push(cols.map(function(c) { return { text: c.toUpperCase(), options: { fontFace: F.HEAD, fontSize: 12, bold: true, color: C.WHITE, fill: { color: C.DARK }, align: 'center' } }; }));
  rows.forEach(function(row, i) {
    var fc = i % 2 === 0 ? C.WHITE : C.GRAYALT;
    var cells = (Array.isArray(row) ? row : [row]).map(function(cell) { return { text: String(cell), options: { fontFace: F.BODY, fontSize: 12, color: C.DARK, fill: { color: fc } } }; });
    tableRows.push(cells);
  });
  slide.addTable(tableRows, { x: 0.4, y: 1.5, w: W - 0.8, rowH: 0.45, border: { type: 'solid', color: C.GRAY20, pt: 1 } });
  if (d.footnote) slide.addText(d.footnote, { x: 0.4, y: H - 0.45, w: W - 0.8, h: 0.35, fontFace: F.BODY, fontSize: 9, color: C.GRAY, italic: true });
}

function buildRiskStatistics(pres, d) {
  var slide = pres.addSlide();
  slide.background = { color: C.WHITE };
  addSectionTag(slide, null, d.strategy_name);
  addBadge(slide, false);
  slide.addText((d.headline || d.title || '').toUpperCase(), { x: 0.4, y: 0.55, w: W - 1.5, h: 0.7, fontFace: F.HEAD, fontSize: 26, bold: true, color: C.DARK });
  slide.addShape('rect', { x: 0.4, y: 1.3, w: 2, h: 0.06, fill: { color: C.YELLOW } });
  var cols = d.columns || ['NET'];
  var rows = d.rows || [];
  var hdr = [''].concat(cols);
  var tableRows = [];
  tableRows.push([{ text: (d.table_title || 'RISK STATISTICS').toUpperCase(), options: { fontFace: F.HEAD, fontSize: 14, bold: true, color: C.DARK, fill: { color: C.YELLOW }, align: 'center', colspan: hdr.length } }]);
  tableRows.push(hdr.map(function(h) { return { text: h.toUpperCase(), options: { fontFace: F.HEAD, fontSize: 12, bold: true, color: C.WHITE, fill: { color: C.DARK }, align: 'center' } }; }));
  rows.forEach(function(row, i) {
    var fc = i % 2 === 0 ? C.WHITE : C.GRAYALT;
    var cells;
    if (Array.isArray(row)) {
      // Handle array format rows
      cells = row.map(function(cell) { return { text: String(cell), options: { fontFace: F.BODY, fontSize: 12, color: C.DARK, fill: { color: fc } } }; });
    } else {
      // Handle object format rows {label, values}
      cells = [{ text: row.label || '', options: { fontFace: F.BODY, fontSize: 12, color: C.DARK, fill: { color: fc } } }];
      var vals = Array.isArray(row.values) ? row.values : [];
      vals.forEach(function(v) { cells.push({ text: String(v), options: { fontFace: F.HEAD, fontSize: 13, bold: true, color: C.DARK, fill: { color: fc }, align: 'center' } }); });
    }
    tableRows.push(cells);
  });
  slide.addTable(tableRows, { x: 0.4, y: 1.5, w: W - 0.8, rowH: 0.45, border: { type: 'solid', color: C.GRAY20, pt: 1 } });
  if (d.disclaimer) slide.addText(d.disclaimer, { x: 0.4, y: H - 0.55, w: W - 0.8, h: 0.45, fontFace: F.BODY, fontSize: 9, color: C.GRAY, italic: true, wrap: true });
}

function buildUseCases(pres, d) {
  var slide = pres.addSlide();
  slide.background = { color: C.DARK };
  addSectionTag(slide, null, d.strategy_name);
  addBadge(slide);
  slide.addText((d.title || '').toUpperCase(), { x: 0.4, y: 0.55, w: W - 1.5, h: 0.7, fontFace: F.HEAD, fontSize: 28, bold: true, color: C.WHITE });
  var cases = (d.cases || []).slice(0, 4);
  var cD = 2.8;
  var gap = cases.length > 1 ? (W - 0.8 - cases.length * cD) / (cases.length - 1) : 0;
  cases.forEach(function(c, i) {
    var x = 0.4 + i * (cD + gap), y = 1.7;
    slide.addShape('ellipse', { x: x, y: y, w: cD, h: cD, fill: { color: C.DARK }, line: { color: C.YELLOW, width: 3 } });
    slide.addText((c.title || '').toUpperCase(), { x: x + 0.1, y: y + 0.4, w: cD - 0.2, h: 0.55, fontFace: F.HEAD, fontSize: 13, bold: true, color: C.YELLOW, align: 'center' });
    slide.addText(c.body || '', { x: x + 0.1, y: y + 1.0, w: cD - 0.2, h: 1.4, fontFace: F.BODY, fontSize: 11, color: C.WHITE, align: 'center', wrap: true });
  });
}

function buildThankYou(pres) {
  var slide = pres.addSlide();
  slide.background = { color: C.DARK };
  addLogo(slide, 0.4, 0.25, 2.0, 0.65);
  slide.addText('THANK YOU!', { x: 0.4, y: 2.5, w: W - 0.8, h: 1.5, fontFace: F.HEAD, fontSize: 60, bold: true, color: C.WHITE, align: 'center', valign: 'middle' });
  slide.addText('We have a team of regional consultants ready to help.', { x: 0.4, y: 4.2, w: W - 0.8, h: 0.6, fontFace: F.BODY, fontSize: 16, color: C.YELLOW, align: 'center', italic: true });
  slide.addText([{ text: 'potomac.com', options: { fontFace: F.BODY, fontSize: 14, color: C.WHITE, hyperlink: { url: 'https://www.potomac.com' } } }], { x: 0.4, y: 5.2, w: W - 0.8, h: 0.4, align: 'center' });
}

function buildDisclosures(pres) {
  var slide = pres.addSlide();
  slide.background = { color: C.DARK };
  addBadge(slide);
  var today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  var txt = 'Potomac is a registered investment adviser. Registration with the SEC does not imply a certain level of skill or training. The information presented herein is for informational and educational purposes only and is not intended as investment advice. Past performance does not guarantee future results. All investing involves risk, including possible loss of principal. The strategies described may not be suitable for all investors.\n\nIndices referenced are unmanaged and cannot be invested in directly. The S&P 500 Index is a market-capitalization-weighted index of 500 leading publicly traded companies in the U.S.\n\nPlease refer to Potomac\'s Form ADV Part 2A for additional information about our services, fees, and risks. A copy is available at www.adviserinfo.sec.gov or by contacting us at info@potomac.com.\n\nPFM-508-' + today;
  slide.addText('DISCLOSURES', { x: 0.4, y: 0.25, w: W - 1.5, h: 0.55, fontFace: F.HEAD, fontSize: 22, bold: true, color: C.YELLOW });
  slide.addText(txt, { x: 0.4, y: 0.9, w: W - 0.8, h: H - 1.1, fontFace: F.BODY, fontSize: 9.5, color: C.WHITE, wrap: true, lineSpacingMultiple: 1.1 });
}

function buildDefinitions(pres, d) {
  var slide = pres.addSlide();
  slide.background = { color: C.DARK };
  addBadge(slide);
  var defs = (d && d.definitions && d.definitions.length > 0) ? d.definitions : [
    { term: 'S&P 500 Index', definition: 'A market-capitalization-weighted index of 500 leading publicly traded companies in the U.S.' },
    { term: 'Beta', definition: 'Measures the relationship between an investment and the S&P 500. A beta of 1.0 means the investment moves in line with the market.' },
    { term: 'Standard Deviation', definition: 'A measure of investment volatility. Higher standard deviation indicates higher risk.' },
    { term: 'Maximum Drawdown', definition: 'The largest peak-to-trough decline in a portfolio\'s value.' },
    { term: 'Sharpe Ratio', definition: 'A measure of risk-adjusted return calculated as excess return divided by standard deviation.' }
  ];
  var defText = defs.map(function(dd) { return dd.term + ': ' + dd.definition; }).join('\n\n');
  slide.addText('IMPORTANT DEFINITIONS USED IN THIS REPORT', { x: 0.4, y: 0.25, w: W - 1.5, h: 0.55, fontFace: F.HEAD, fontSize: 18, bold: true, color: C.YELLOW });
  slide.addText(defText, { x: 0.4, y: 0.95, w: W - 0.8, h: H - 1.1, fontFace: F.BODY, fontSize: 11, color: C.WHITE, wrap: true, lineSpacingMultiple: 1.3 });
}

// ═══════════════════════════════════════════════════════════════
// DIAGRAM BUILDERS - Dynamic Shape Generation
// ═══════════════════════════════════════════════════════════════

function buildDiagram(pres, d) {
  var diagramType = d.diagram_type || 'process_flow';
  
  switch (diagramType) {
    case 'process_flow': return buildProcessFlow(pres, d);
    case 'cycle': return buildCycleDiagram(pres, d);
    case 'hierarchy': return buildHierarchyDiagram(pres, d);
    case 'hub_spoke': return buildHubSpokeDiagram(pres, d);
    case 'comparison': return buildComparisonDiagram(pres, d);
    case 'funnel': return buildFunnelDiagram(pres, d);
    case 'timeline': return buildTimelineDiagram(pres, d);
    default: return buildProcessFlow(pres, d);
  }
}

function buildProcessFlow(pres, d) {
  var slide = pres.addSlide();
  slide.background = { color: C.DARK };
  addSectionTag(slide, d.section_tag);
  addBadge(slide);
  
  slide.addText((d.title || 'PROCESS').toUpperCase(), { x: 0.4, y: 0.55, w: W - 1.5, h: 0.65, fontFace: F.HEAD, fontSize: 28, bold: true, color: C.WHITE });
  if (d.subtitle) {
    slide.addText(d.subtitle, { x: 0.4, y: 1.2, w: W - 1.5, h: 0.4, fontFace: F.BODY, fontSize: 14, color: C.YELLOW });
  }
  
  var nodes = d.nodes || [];
  if (nodes.length === 0) return;
  
  var boxW = 3.2, boxH = 2.2;
  var totalW = nodes.length * boxW + (nodes.length - 1) * 0.8;
  var startX = (W - totalW) / 2;
  var boxY = 2.5;
  
  nodes.forEach(function(node, i) {
    var x = startX + i * (boxW + 0.8);
    
    // Box with border
    slide.addShape('roundRect', {
      x: x, y: boxY, w: boxW, h: boxH,
      rectRadius: 0.1,
      fill: { color: C.DARK },
      line: { color: C.YELLOW, width: 2 }
    });
    
    // Node label
    slide.addText((node.label || '').toUpperCase(), {
      x: x + 0.1, y: boxY + 0.2, w: boxW - 0.2, h: 0.5,
      fontFace: F.HEAD, fontSize: 14, bold: true, color: C.YELLOW,
      align: 'center'
    });
    
    // Node body
    slide.addText(node.body || '', {
      x: x + 0.1, y: boxY + 0.75, w: boxW - 0.2, h: boxH - 1,
      fontFace: F.BODY, fontSize: 12, color: C.WHITE,
      align: 'center', wrap: true
    });
    
    // Arrow connector
    if (i < nodes.length - 1) {
      var arrowX = x + boxW + 0.15;
      slide.addText('\u2192', {
        x: arrowX, y: boxY + boxH / 2 - 0.3, w: 0.5, h: 0.6,
        fontFace: F.HEAD, fontSize: 32, bold: true, color: C.YELLOW,
        align: 'center', valign: 'middle'
      });
    }
  });
}

function buildCycleDiagram(pres, d) {
  var slide = pres.addSlide();
  slide.background = { color: C.DARK };
  addSectionTag(slide, d.section_tag);
  addBadge(slide);
  
  slide.addText((d.title || 'CYCLE').toUpperCase(), { x: 0.4, y: 0.55, w: W - 1.5, h: 0.65, fontFace: F.HEAD, fontSize: 28, bold: true, color: C.WHITE });
  
  var nodes = d.nodes || [];
  if (nodes.length < 2) return;
  
  var centerX = W / 2, centerY = 4.0;
  var radius = 2.4;
  var angleStep = 360 / nodes.length;
  
  // Draw connecting arcs/lines first (behind nodes)
  nodes.forEach(function(node, i) {
    var angle = (i * angleStep - 90) * Math.PI / 180;
    var nextAngle = ((i + 1) * angleStep - 90) * Math.PI / 180;
    
    var x1 = centerX + radius * Math.cos(angle);
    var y1 = centerY + radius * Math.sin(angle);
    var x2 = centerX + radius * Math.cos(nextAngle);
    var y2 = centerY + radius * Math.sin(nextAngle);
    
    // Draw curved arrow (approximated with line)
    slide.addShape('line', {
      x: x1, y: y1, w: x2 - x1, h: y2 - y1,
      line: { color: C.YELLOW, width: 1.5, dashType: 'dash' }
    });
  });
  
  // Center label
  if (d.center_label) {
    slide.addShape('ellipse', {
      x: centerX - 1.2, y: centerY - 1.2, w: 2.4, h: 2.4,
      fill: { color: C.DARK },
      line: { color: C.YELLOW, width: 2 }
    });
    slide.addText(d.center_label.toUpperCase(), {
      x: centerX - 1.2, y: centerY - 0.4, w: 2.4, h: 0.8,
      fontFace: F.HEAD, fontSize: 12, bold: true, color: C.YELLOW,
      align: 'center', valign: 'middle'
    });
  }
  
  // Draw nodes in a circle
  nodes.forEach(function(node, i) {
    var angle = (i * angleStep - 90) * Math.PI / 180;
    var x = centerX + radius * Math.cos(angle) - 1.1;
    var y = centerY + radius * Math.sin(angle) - 0.7;
    
    // Node circle
    slide.addShape('ellipse', {
      x: x, y: y, w: 2.2, h: 1.4,
      fill: { color: C.DARK },
      line: { color: C.YELLOW, width: 2 }
    });
    
    slide.addText((node.label || '').toUpperCase(), {
      x: x, y: y + 0.15, w: 2.2, h: 0.4,
      fontFace: F.HEAD, fontSize: 11, bold: true, color: C.YELLOW,
      align: 'center'
    });
    
    slide.addText(node.body || '', {
      x: x + 0.1, y: y + 0.55, w: 2.0, h: 0.75,
      fontFace: F.BODY, fontSize: 9, color: C.WHITE,
      align: 'center', wrap: true
    });
  });
}

function buildHierarchyDiagram(pres, d) {
  var slide = pres.addSlide();
  slide.background = { color: C.DARK };
  addSectionTag(slide, d.section_tag);
  addBadge(slide);
  
  slide.addText((d.title || 'HIERARCHY').toUpperCase(), { x: 0.4, y: 0.55, w: W - 1.5, h: 0.65, fontFace: F.HEAD, fontSize: 28, bold: true, color: C.WHITE });
  
  var root = d.root || { label: 'ROOT' };
  var children = d.children || [];
  
  // Root node - centered at top
  var rootW = 4.0, rootH = 1.2;
  var rootX = (W - rootW) / 2, rootY = 1.5;
  
  slide.addShape('roundRect', {
    x: rootX, y: rootY, w: rootW, h: rootH,
    rectRadius: 0.1,
    fill: { color: C.YELLOW }
  });
  slide.addText((root.label || '').toUpperCase(), {
    x: rootX, y: rootY + 0.15, w: rootW, h: 0.45,
    fontFace: F.HEAD, fontSize: 14, bold: true, color: C.DARK,
    align: 'center'
  });
  slide.addText(root.body || '', {
    x: rootX + 0.1, y: rootY + 0.6, w: rootW - 0.2, h: 0.5,
    fontFace: F.BODY, fontSize: 11, color: C.DARK,
    align: 'center', wrap: true
  });
  
  // Children nodes
  if (children.length > 0) {
    var childW = 2.8, childH = 1.1;
    var gap = 0.3;
    var totalChildW = children.length * childW + (children.length - 1) * gap;
    var childStartX = (W - totalChildW) / 2;
    var childY = 3.2;
    
    // Draw connecting lines
    children.forEach(function(child, i) {
      var childX = childStartX + i * (childW + gap) + childW / 2;
      slide.addShape('line', {
        x: W / 2, y: rootY + rootH,
        w: childX - W / 2, h: childY - (rootY + rootH),
        line: { color: C.YELLOW, width: 1.5 }
      });
    });
    
    children.forEach(function(child, i) {
      var childX = childStartX + i * (childW + gap);
      
      slide.addShape('roundRect', {
        x: childX, y: childY, w: childW, h: childH,
        rectRadius: 0.08,
        fill: { color: C.DARK },
        line: { color: C.YELLOW, width: 2 }
      });
      slide.addText((child.label || '').toUpperCase(), {
        x: childX, y: childY + 0.1, w: childW, h: 0.35,
        fontFace: F.HEAD, fontSize: 12, bold: true, color: C.YELLOW,
        align: 'center'
      });
      slide.addText(child.body || '', {
        x: childX + 0.1, y: childY + 0.5, w: childW - 0.2, h: 0.55,
        fontFace: F.BODY, fontSize: 10, color: C.WHITE,
        align: 'center', wrap: true
      });
      
      // Grandchildren
      if (child.children && child.children.length > 0) {
        var gcW = 1.8, gcH = 0.9;
        var gcGap = 0.2;
        var gcTotalW = child.children.length * gcW + (child.children.length - 1) * gcGap;
        var gcStartX = childX + (childW - gcTotalW) / 2;
        var gcY = childY + childH + 0.5;
        
        child.children.forEach(function(gc, j) {
          var gcX = gcStartX + j * (gcW + gcGap);
          
          slide.addShape('roundRect', {
            x: gcX, y: gcY, w: gcW, h: gcH,
            rectRadius: 0.06,
            fill: { color: C.DARK },
            line: { color: C.GRAY, width: 1 }
          });
          slide.addText((gc.label || '').toUpperCase(), {
            x: gcX, y: gcY + 0.08, w: gcW, h: 0.28,
            fontFace: F.HEAD, fontSize: 9, bold: true, color: C.GRAY20,
            align: 'center'
          });
          slide.addText(gc.body || '', {
            x: gcX + 0.05, y: gcY + 0.4, w: gcW - 0.1, h: 0.45,
            fontFace: F.BODY, fontSize: 8, color: C.GRAY,
            align: 'center', wrap: true
          });
        });
      }
    });
  }
}

function buildHubSpokeDiagram(pres, d) {
  var slide = pres.addSlide();
  slide.background = { color: C.DARK };
  addSectionTag(slide, d.section_tag);
  addBadge(slide);
  
  slide.addText((d.title || 'HUB & SPOKE').toUpperCase(), { x: 0.4, y: 0.55, w: W - 1.5, h: 0.65, fontFace: F.HEAD, fontSize: 28, bold: true, color: C.WHITE });
  
  var center = d.center || { label: 'CENTER' };
  var surrounding = d.surrounding || [];
  
  var centerX = W / 2, centerY = 4.0;
  var radius = 2.6;
  
  // Draw spokes (lines from center to surrounding)
  surrounding.forEach(function(item, i) {
    var angle = (i * 360 / surrounding.length - 90) * Math.PI / 180;
    var x = centerX + radius * Math.cos(angle);
    var y = centerY + radius * Math.sin(angle);
    
    slide.addShape('line', {
      x: centerX, y: centerY,
      w: x - centerX, h: y - centerY,
      line: { color: C.YELLOW, width: 1.5, dashType: 'dash' }
    });
  });
  
  // Center hub
  slide.addShape('ellipse', {
    x: centerX - 1.3, y: centerY - 1.3, w: 2.6, h: 2.6,
    fill: { color: C.YELLOW }
  });
  slide.addText((center.label || '').toUpperCase(), {
    x: centerX - 1.3, y: centerY - 0.5, w: 2.6, h: 0.5,
    fontFace: F.HEAD, fontSize: 12, bold: true, color: C.DARK,
    align: 'center'
  });
  slide.addText(center.body || '', {
    x: centerX - 1.2, y: centerY + 0.1, w: 2.4, h: 0.8,
    fontFace: F.BODY, fontSize: 10, color: C.DARK,
    align: 'center', wrap: true
  });
  
  // Surrounding nodes
  surrounding.forEach(function(item, i) {
    var angle = (i * 360 / surrounding.length - 90) * Math.PI / 180;
    var x = centerX + radius * Math.cos(angle) - 1.2;
    var y = centerY + radius * Math.sin(angle) - 0.6;
    
    slide.addShape('roundRect', {
      x: x, y: y, w: 2.4, h: 1.2,
      rectRadius: 0.08,
      fill: { color: C.DARK },
      line: { color: C.YELLOW, width: 2 }
    });
    slide.addText((item.label || '').toUpperCase(), {
      x: x, y: y + 0.1, w: 2.4, h: 0.35,
      fontFace: F.HEAD, fontSize: 10, bold: true, color: C.YELLOW,
      align: 'center'
    });
    slide.addText(item.body || '', {
      x: x + 0.1, y: y + 0.5, w: 2.2, h: 0.6,
      fontFace: F.BODY, fontSize: 9, color: C.WHITE,
      align: 'center', wrap: true
    });
  });
}

function buildComparisonDiagram(pres, d) {
  var slide = pres.addSlide();
  slide.background = { color: C.DARK };
  addSectionTag(slide, d.section_tag);
  addBadge(slide);
  
  slide.addText((d.title || 'COMPARISON').toUpperCase(), { x: 0.4, y: 0.55, w: W - 1.5, h: 0.65, fontFace: F.HEAD, fontSize: 28, bold: true, color: C.WHITE });
  
  var left = d.left_column || { title: 'LEFT', items: [] };
  var right = d.right_column || { title: 'RIGHT', items: [] };
  
  var colW = 5.5, colH = 5.0;
  var leftX = 0.5, rightX = W - colW - 0.5;
  var colY = 1.5;
  
  // VS divider
  slide.addText('VS', {
    x: (W - 1) / 2, y: 3.5, w: 1, h: 0.6,
    fontFace: F.HEAD, fontSize: 24, bold: true, color: C.YELLOW,
    align: 'center', valign: 'middle'
  });
  
  // Left column
  slide.addShape('roundRect', {
    x: leftX, y: colY, w: colW, h: colH,
    rectRadius: 0.1,
    fill: { color: C.DARK },
    line: { color: C.YELLOW, width: 2 }
  });
  slide.addShape('roundRect', {
    x: leftX + 0.5, y: colY - 0.25, w: colW - 1, h: 0.5,
    rectRadius: 0.25,
    fill: { color: C.DARK }
  });
  slide.addText((left.title || 'LEFT').toUpperCase(), {
    x: leftX + 0.5, y: colY - 0.25, w: colW - 1, h: 0.5,
    fontFace: F.HEAD, fontSize: 14, bold: true, color: C.YELLOW,
    align: 'center', valign: 'middle'
  });
  
  (left.items || []).forEach(function(item, i) {
    var itemY = colY + 0.6 + i * 1.3;
    slide.addText((item.label || '').toUpperCase(), {
      x: leftX + 0.3, y: itemY, w: colW - 0.6, h: 0.35,
      fontFace: F.HEAD, fontSize: 12, bold: true, color: C.YELLOW
    });
    slide.addText(item.body || '', {
      x: leftX + 0.3, y: itemY + 0.4, w: colW - 0.6, h: 0.7,
      fontFace: F.BODY, fontSize: 11, color: C.WHITE, wrap: true
    });
  });
  
  // Right column
  slide.addShape('roundRect', {
    x: rightX, y: colY, w: colW, h: colH,
    rectRadius: 0.1,
    fill: { color: C.DARK },
    line: { color: '4CAF50', width: 2 }
  });
  slide.addShape('roundRect', {
    x: rightX + 0.5, y: colY - 0.25, w: colW - 1, h: 0.5,
    rectRadius: 0.25,
    fill: { color: C.DARK }
  });
  slide.addText((right.title || 'RIGHT').toUpperCase(), {
    x: rightX + 0.5, y: colY - 0.25, w: colW - 1, h: 0.5,
    fontFace: F.HEAD, fontSize: 14, bold: true, color: '4CAF50',
    align: 'center', valign: 'middle'
  });
  
  (right.items || []).forEach(function(item, i) {
    var itemY = colY + 0.6 + i * 1.3;
    slide.addText((item.label || '').toUpperCase(), {
      x: rightX + 0.3, y: itemY, w: colW - 0.6, h: 0.35,
      fontFace: F.HEAD, fontSize: 12, bold: true, color: '4CAF50'
    });
    slide.addText(item.body || '', {
      x: rightX + 0.3, y: itemY + 0.4, w: colW - 0.6, h: 0.7,
      fontFace: F.BODY, fontSize: 11, color: C.WHITE, wrap: true
    });
  });
}

function buildFunnelDiagram(pres, d) {
  var slide = pres.addSlide();
  slide.background = { color: C.DARK };
  addSectionTag(slide, d.section_tag);
  addBadge(slide);
  
  slide.addText((d.title || 'FUNNEL').toUpperCase(), { x: 0.4, y: 0.55, w: W - 1.5, h: 0.65, fontFace: F.HEAD, fontSize: 28, bold: true, color: C.WHITE });
  
  var stages = d.stages || [];
  if (stages.length === 0) return;
  
  var startY = 1.6;
  var stageH = (H - startY - 0.5) / stages.length;
  var maxWidth = 10;
  var minWidth = 3;
  var centerX = W / 2;
  
  stages.forEach(function(stage, i) {
    var widthRatio = stage.width !== undefined ? stage.width : (1 - i * 0.25);
    var stageW = minWidth + (maxWidth - minWidth) * widthRatio;
    var stageX = centerX - stageW / 2;
    var stageY = startY + i * stageH;
    
    // Funnel segment (trapezoid-like using rect with varying widths)
    slide.addShape('roundRect', {
      x: stageX, y: stageY, w: stageW, h: stageH - 0.15,
      rectRadius: 0.1,
      fill: { color: i % 2 === 0 ? C.YELLOW : '333333' },
      line: { color: C.YELLOW, width: 1 }
    });
    
    slide.addText((stage.label || '').toUpperCase(), {
      x: stageX, y: stageY + stageH * 0.15, w: stageW, h: 0.4,
      fontFace: F.HEAD, fontSize: 14, bold: true,
      color: i % 2 === 0 ? C.DARK : C.YELLOW,
      align: 'center'
    });
    slide.addText(stage.body || '', {
      x: stageX + 0.2, y: stageY + stageH * 0.4, w: stageW - 0.4, h: stageH * 0.45,
      fontFace: F.BODY, fontSize: 11,
      color: i % 2 === 0 ? C.DARK : C.WHITE,
      align: 'center', wrap: true
    });
  });
}

function buildTimelineDiagram(pres, d) {
  var slide = pres.addSlide();
  slide.background = { color: C.DARK };
  addSectionTag(slide, d.section_tag);
  addBadge(slide);
  
  slide.addText((d.title || 'TIMELINE').toUpperCase(), { x: 0.4, y: 0.55, w: W - 1.5, h: 0.65, fontFace: F.HEAD, fontSize: 28, bold: true, color: C.WHITE });
  
  var events = d.events || [];
  if (events.length === 0) return;
  
  // Draw timeline line
  var lineY = 3.8;
  slide.addShape('rect', {
    x: 0.8, y: lineY, w: W - 1.6, h: 0.06,
    fill: { color: C.YELLOW }
  });
  
  // Draw events
  var eventSpacing = (W - 1.6) / (events.length + 1);
  
  events.forEach(function(event, i) {
    var x = 0.8 + (i + 1) * eventSpacing;
    
    // Marker circle
    slide.addShape('ellipse', {
      x: x - 0.25, y: lineY - 0.2, w: 0.5, h: 0.5,
      fill: { color: C.YELLOW }
    });
    
    // Year above/below line
    var yearY = i % 2 === 0 ? lineY - 0.9 : lineY + 0.5;
    slide.addText(event.year || String(i + 1), {
      x: x - 0.5, y: yearY, w: 1, h: 0.35,
      fontFace: F.HEAD, fontSize: 14, bold: true, color: C.YELLOW,
      align: 'center'
    });
    
    // Event box
    var boxY = i % 2 === 0 ? lineY - 2.4 : lineY + 0.9;
    slide.addShape('roundRect', {
      x: x - 1.2, y: boxY, w: 2.4, h: 1.3,
      rectRadius: 0.08,
      fill: { color: C.DARK },
      line: { color: C.YELLOW, width: 1 }
    });
    
    slide.addText((event.label || '').toUpperCase(), {
      x: x - 1.2, y: boxY + 0.1, w: 2.4, h: 0.4,
      fontFace: F.HEAD, fontSize: 11, bold: true, color: C.YELLOW,
      align: 'center'
    });
    slide.addText(event.body || '', {
      x: x - 1.1, y: boxY + 0.55, w: 2.2, h: 0.65,
      fontFace: F.BODY, fontSize: 9, color: C.WHITE,
      align: 'center', wrap: true
    });
  });
}

function buildCallout(pres, d) {
  var slide = pres.addSlide();
  slide.background = { color: C.DARK };
  addSectionTag(slide, d.section_tag);
  addBadge(slide);
  
  slide.addText((d.title || 'KEY INSIGHT').toUpperCase(), { x: 0.4, y: 0.55, w: W - 1.5, h: 0.65, fontFace: F.HEAD, fontSize: 28, bold: true, color: C.WHITE });
  
  // Big number
  if (d.big_number) {
    slide.addText(d.big_number, {
      x: 1.5, y: 1.8, w: W - 3, h: 2.2,
      fontFace: F.HEAD, fontSize: 96, bold: true, color: C.YELLOW,
      align: 'center', valign: 'middle'
    });
  }
  
  if (d.big_number_label) {
    slide.addText(d.big_number_label.toUpperCase(), {
      x: 1.5, y: 4.0, w: W - 3, h: 0.5,
      fontFace: F.HEAD, fontSize: 20, bold: true, color: C.WHITE,
      align: 'center'
    });
  }
  
  if (d.context) {
    slide.addText(d.context, {
      x: 1.5, y: 4.5, w: W - 3, h: 0.4,
      fontFace: F.BODY, fontSize: 14, color: C.GRAY,
      align: 'center'
    });
  }
  
  if (d.body) {
    slide.addText(d.body, {
      x: 1.5, y: 5.2, w: W - 3, h: 1.5,
      fontFace: F.BODY, fontSize: 16, color: C.WHITE,
      align: 'center', wrap: true
    });
  }
}

function buildQuote(pres, d) {
  var slide = pres.addSlide();
  slide.background = { color: C.DARK };
  addSectionTag(slide, d.section_tag);
  addBadge(slide);
  
  if (d.title) {
    slide.addText(d.title.toUpperCase(), { x: 0.4, y: 0.55, w: W - 1.5, h: 0.5, fontFace: F.HEAD, fontSize: 18, bold: true, color: C.YELLOW });
  }
  
  // Large quote mark
  slide.addText('"', {
    x: 1.0, y: 1.2, w: 1.5, h: 1.5,
    fontFace: 'Georgia', fontSize: 120, color: C.YELLOW,
    align: 'center', valign: 'top'
  });
  
  // Quote text
  slide.addText(d.quote || 'Quote goes here.', {
    x: 1.5, y: 2.2, w: W - 3, h: 2.5,
    fontFace: F.BODY, fontSize: 28, italic: true, color: C.WHITE,
    align: 'center', valign: 'middle', wrap: true
  });
  
  // Attribution
  if (d.attribution) {
    slide.addText('\u2014 ' + d.attribution, {
      x: 1.5, y: 4.8, w: W - 3, h: 0.5,
      fontFace: F.HEAD, fontSize: 16, bold: true, color: C.YELLOW,
      align: 'center'
    });
  }
}

var BUILDERS = {
  cover: buildCover,
  section_divider: buildSectionDivider,
  three_pillars: buildThreePillars,
  chart: buildChart,
  composite_three: buildCompositeThree,
  composite_four: buildCompositeFour,
  five_component_diagram: buildFiveComponent,
  strategy_table: buildStrategyTable,
  risk_statistics: buildRiskStatistics,
  use_cases: buildUseCases,
  thank_you: buildThankYou,
  disclosures: buildDisclosures,
  definitions: buildDefinitions,
  // New diagram and creative layouts
  diagram: buildDiagram,
  process_flow: buildProcessFlow,
  cycle: buildCycleDiagram,
  hierarchy: buildHierarchyDiagram,
  hub_spoke: buildHubSpokeDiagram,
  comparison: buildComparisonDiagram,
  funnel: buildFunnelDiagram,
  timeline: buildTimelineDiagram,
  callout: buildCallout,
  quote: buildQuote
};

async function main() {
  var pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.author = 'Potomac Fund Management';
  pres.company = 'Potomac Fund Management';
  pres.subject = 'Investment Strategy Presentation';
  pres.title = outline.title || 'Potomac Presentation';

  // Define Slide Masters for consistent branding
  var darkMasterObjects = [];
  var lightMasterObjects = [];

  // Add logo to masters
  if (LOGO_PATH && fs.existsSync(LOGO_PATH)) {
    darkMasterObjects.push({ image: { path: LOGO_PATH, x: 0.35, y: 0.18, w: 1.6, h: 0.5, sizing: { type: 'contain', w: 1.6, h: 0.5 } } });
  }

  // Add badge to masters
  if (ICON_WHITE && fs.existsSync(ICON_WHITE)) {
    darkMasterObjects.push({ image: { path: ICON_WHITE, x: W - 1.0, y: 0.15, w: 0.7, h: 0.7, sizing: { type: 'contain', w: 0.7, h: 0.7 } } });
  }
  if (ICON_BLACK && fs.existsSync(ICON_BLACK)) {
    lightMasterObjects.push({ image: { path: ICON_BLACK, x: W - 1.0, y: 0.15, w: 0.7, h: 0.7, sizing: { type: 'contain', w: 0.7, h: 0.7 } } });
  }

  pres.defineSlideMaster({
    title: 'DARK_MASTER',
    background: { color: C.DARK },
    objects: darkMasterObjects,
    slideNumber: { x: 0.4, y: H - 0.3, w: 0.5, h: 0.25, fontFace: F.BODY, fontSize: 8, color: C.GRAY }
  });

  pres.defineSlideMaster({
    title: 'LIGHT_MASTER',
    background: { color: C.WHITE },
    objects: lightMasterObjects,
    slideNumber: { x: 0.4, y: H - 0.3, w: 0.5, h: 0.25, fontFace: F.BODY, fontSize: 8, color: C.GRAY }
  });

  // Organize slides into PowerPoint sections
  var currentSection = '';
  var slides = outline.slides || [];
  var manifest = [];

  for (var i = 0; i < slides.length; i++) {
    var sd = slides[i];
    var layout = sd.layout || 'section_divider';

    // Add PowerPoint sections based on layout type
    var newSection = '';
    if (layout === 'cover') newSection = 'Introduction';
    else if (layout === 'section_divider') newSection = (sd.section_title || sd.title || 'Section').toUpperCase();
    else if (layout === 'thank_you') newSection = 'Closing';
    else if (layout === 'disclosures' || layout === 'definitions') newSection = 'Appendix';

    if (newSection && newSection !== currentSection) {
      pres.addSection({ title: newSection });
      currentSection = newSection;
    }

    var builder = BUILDERS[layout];
    if (builder) {
      builder(pres, sd);
      manifest.push({ slide_number: i + 1, layout: layout, title: (sd.title || sd.section_title || sd.headline || sd.chart_title || layout).toUpperCase() });
    } else {
      process.stderr.write('Unknown layout: ' + layout + '\n');
    }
  }

  await pres.writeFile({ fileName: OUTPUT_PATH });

  var buf = fs.readFileSync(OUTPUT_PATH);
  var result = {
    pptx_base64: buf.toString('base64'),
    slide_count: manifest.length,
    filename: path.basename(OUTPUT_PATH),
    slide_manifest: manifest
  };
  process.stdout.write(JSON.stringify(result));
}

main().catch(function(e) { process.stderr.write('Error: ' + e.message + '\n'); process.exit(1); });
