import { CanvasElement } from '@/components/InteractiveCanvas';

// Theme color definitions
const THEMES: Record<string, Record<string, string>> = {
  classic: { YELLOW: '#FEC00F', DARK: '#212121', WHITE: '#FFFFFF', GRAY: '#737373', GRAYALT: '#F5F5F5' },
  navy:    { YELLOW: '#FEC00F', DARK: '#1A2744', WHITE: '#FFFFFF', GRAY: '#8899AA', GRAYALT: '#F0F3F6' },
  forest:  { YELLOW: '#4CAF50', DARK: '#1B2E1B', WHITE: '#FFFFFF', GRAY: '#6B8E6B', GRAYALT: '#F0F5F0' },
  slate:   { YELLOW: '#FF6B35', DARK: '#2D2D3D', WHITE: '#FFFFFF', GRAY: '#8E8E9E', GRAYALT: '#F2F2F5' },
  minimal: { YELLOW: '#333333', DARK: '#1A1A1A', WHITE: '#FFFFFF', GRAY: '#999999', GRAYALT: '#F8F8F8' },
};

type EditorSlide = {
  layout: string;
  [key: string]: any;
};

/**
 * Convert a layout-based slide to an array of positioned canvas elements.
 * Each element is absolutely positioned on a 13.33" × 7.5" canvas.
 */
export function layoutToElements(slide: EditorSlide, theme: string = 'classic'): CanvasElement[] {
  const C = THEMES[theme] || THEMES.classic;
  const layout = slide?.layout || 'section_divider';
  const positions = slide?._positions || {}; // Position overrides from canvas edits

  // Helper to apply position overrides
  const withPosition = (el: CanvasElement): CanvasElement => {
    if (positions[el.id]) {
      return { ...el, ...positions[el.id] };
    }
    return el;
  };

  switch (layout) {
    case 'cover':
      return [
        // Top accent bar
        withPosition({
          id: 'bg_top',
          type: 'shape',
          x: 0, y: 0, w: 13.33, h: 0.08,
          options: { shape: 'rect', fill: C.YELLOW },
          locked: true,
          zIndex: 1,
        }),
        // Logo area (actual logo image)
        withPosition({
          id: 'logo',
          type: 'image',
          x: 0.4, y: 0.25, w: 2, h: 0.5,
          content: '/logos/Potomac Logo White.png',
          options: { sizing: 'contain' },
          locked: true,
          zIndex: 2,
        }),
        // Top decorative line
        withPosition({
          id: 'deco_line_top',
          type: 'shape',
          x: 4.67, y: 2.3, w: 4, h: 0.03,
          options: { shape: 'rect', fill: C.YELLOW },
          locked: true,
          zIndex: 3,
        }),
        // Main title
        withPosition({
          id: 'title',
          type: 'text',
          x: 1, y: 2.5, w: 11.33, h: 1.8,
          content: (slide.title || 'Your Title Here').toUpperCase(),
          style: { fontSize: 48, bold: true, color: C.WHITE, fontFace: "'Rajdhani', sans-serif", align: 'center' },
          zIndex: 4,
        }),
        // Bottom decorative line
        withPosition({
          id: 'deco_line_bottom',
          type: 'shape',
          x: 4.67, y: 4.5, w: 4, h: 0.03,
          options: { shape: 'rect', fill: C.YELLOW },
          locked: true,
          zIndex: 5,
        }),
        // Tagline
        withPosition({
          id: 'tagline',
          type: 'text',
          x: 1, y: 5.8, w: 11.33, h: 0.5,
          content: slide.tagline || 'Built to Conquer Risk®',
          style: { fontSize: 14, italic: true, color: C.YELLOW, fontFace: "'Rajdhani', sans-serif", align: 'center' },
          locked: true,
          zIndex: 6,
        }),
        // Bottom accent bar
        withPosition({
          id: 'bg_bottom',
          type: 'shape',
          x: 0, y: 7.42, w: 13.33, h: 0.08,
          options: { shape: 'rect', fill: C.YELLOW },
          locked: true,
          zIndex: 1,
        }),
      ];

    case 'section_divider':
      return [
        // Section title
        withPosition({
          id: 'section_title',
          type: 'text',
          x: 1, y: 3, w: 11.33, h: 1.5,
          content: (slide.section_title || slide.title || 'SECTION').toUpperCase(),
          style: { fontSize: 56, bold: true, color: C.DARK, fontFace: "'Rajdhani', sans-serif", align: 'center' },
          zIndex: 2,
        }),
        // Decorative line
        withPosition({
          id: 'deco_line',
          type: 'shape',
          x: 5.17, y: 4.6, w: 3, h: 0.06,
          options: { shape: 'rect', fill: C.YELLOW },
          locked: true,
          zIndex: 1,
        }),
      ];

    case 'three_pillars':
      const pillars = slide.pillars || [
        { label: 'PILLAR 1', description: 'Description' },
        { label: 'PILLAR 2', description: 'Description' },
        { label: 'PILLAR 3', description: 'Description' },
      ];
      const pillarElements: CanvasElement[] = [
        // Section tag
        ...(slide.section_tag ? [withPosition({
          id: 'section_tag',
          type: 'text',
          x: 0.4, y: 0.3, w: 3, h: 0.4,
          content: slide.section_tag,
          style: { fontSize: 10, bold: true, color: C.YELLOW, fontFace: "'Rajdhani', sans-serif" },
          locked: true,
          zIndex: 1,
        })] : []),
        // Title
        withPosition({
          id: 'title',
          type: 'text',
          x: 0.4, y: 0.7, w: 12.5, h: 0.8,
          content: (slide.title || '').toUpperCase(),
          style: { fontSize: 32, bold: true, color: C.WHITE, fontFace: "'Rajdhani', sans-serif" },
          zIndex: 2,
        }),
        // Subtitle
        ...(slide.subtitle ? [withPosition({
          id: 'subtitle',
          type: 'text',
          x: 0.4, y: 1.5, w: 12.5, h: 0.5,
          content: slide.subtitle,
          style: { fontSize: 14, bold: true, color: C.YELLOW, fontFace: "'Rajdhani', sans-serif" },
          locked: true,
          zIndex: 3,
        })] : []),
      ];

      // Add pillar circles
      pillars.forEach((p: any, i: number) => {
        const baseX = 2 + i * 3.5;
        pillarElements.push(
          withPosition({
            id: `pillar_${i}`,
            type: 'group',
            x: baseX, y: 2.5, w: 2.8, h: 4.2,
            content: JSON.stringify({ number: i + 1, label: p.label || '', description: p.description || '' }),
            options: { shape: 'pillar_circle', stroke: C.YELLOW, fill: 'transparent' },
            style: { color: C.WHITE },
            zIndex: 10 + i,
          })
        );
      });

      return pillarElements;

    case 'chart':
      return [
        // Section tag
        ...(slide.section_tag ? [withPosition({
          id: 'section_tag',
          type: 'text',
          x: 0.4, y: 0.3, w: 3, h: 0.4,
          content: slide.section_tag,
          style: { fontSize: 10, bold: true, color: C.YELLOW, fontFace: "'Rajdhani', sans-serif" },
          locked: true,
          zIndex: 1,
        })] : []),
        // Chart title
        withPosition({
          id: 'chart_title',
          type: 'text',
          x: 0.4, y: 0.3, w: 12.5, h: 0.7,
          content: (slide.chart_title || slide.title || 'CHART').toUpperCase(),
          style: { fontSize: 28, bold: true, color: C.DARK, fontFace: "'Rajdhani', sans-serif" },
          zIndex: 2,
        }),
        // Decorative line
        withPosition({
          id: 'deco_line',
          type: 'shape',
          x: 0.4, y: 1.1, w: 2, h: 0.05,
          options: { shape: 'rect', fill: C.YELLOW },
          locked: true,
          zIndex: 3,
        }),
        // Chart area (placeholder or image)
        ...(slide.image_url ? [withPosition({
          id: 'chart_image',
          type: 'image',
          x: 0.4, y: 1.5, w: 12.5, h: 5,
          content: slide.image_url,
          zIndex: 4,
        })] : [withPosition({
          id: 'chart_placeholder',
          type: 'chart',
          x: 0.4, y: 1.5, w: 12.5, h: 5,
          style: { color: C.GRAY },
          zIndex: 4,
        })]),
        // Caption
        ...(slide.chart_caption ? [withPosition({
          id: 'chart_caption',
          type: 'text',
          x: 0.4, y: 6.7, w: 12.5, h: 0.4,
          content: slide.chart_caption,
          style: { fontSize: 11, italic: true, color: C.GRAY, fontFace: "'Rajdhani', sans-serif" },
          locked: true,
          zIndex: 5,
        })] : []),
      ];

    case 'composite_three':
      const comps3 = slide.components || [
        { title: 'COMPONENT 1', body: 'Description', is_result: false },
        { title: 'COMPONENT 2', body: 'Description', is_result: false },
        { title: 'RESULT', body: 'Result description', is_result: true },
      ];
      const comp3Elements: CanvasElement[] = [
        // Section tag
        ...(slide.section_tag ? [withPosition({
          id: 'section_tag',
          type: 'text',
          x: 0.4, y: 0.3, w: 3, h: 0.4,
          content: slide.section_tag,
          style: { fontSize: 10, bold: true, color: C.YELLOW, fontFace: "'Rajdhani', sans-serif" },
          locked: true,
          zIndex: 1,
        })] : []),
        // Headline
        withPosition({
          id: 'headline',
          type: 'text',
          x: 0.4, y: 0.3, w: 12.5, h: 0.7,
          content: (slide.headline || slide.title || '').toUpperCase(),
          style: { fontSize: 24, bold: true, color: C.WHITE, fontFace: "'Rajdhani', sans-serif" },
          zIndex: 2,
        }),
      ];

      comps3.forEach((c: any, i: number) => {
        const baseX = 0.4 + i * 4.2;
        comp3Elements.push(
          // Component box
          withPosition({
            id: `component_${i}_box`,
            type: 'shape',
            x: baseX, y: 1.8, w: 4, h: 4.5,
            options: { shape: 'roundRect', fill: c.is_result ? C.YELLOW : C.DARK, stroke: C.YELLOW, strokeWidth: 2 },
            locked: true,
            zIndex: 10 + i * 2,
          }),
          // Component title
          withPosition({
            id: `component_${i}_title`,
            type: 'text',
            x: baseX + 0.3, y: 2, w: 3.4, h: 0.5,
            content: (c.title || '').toUpperCase(),
            style: { fontSize: 12, bold: true, color: c.is_result ? C.DARK : C.YELLOW, fontFace: "'Rajdhani', sans-serif" },
            zIndex: 11 + i * 2,
          }),
          // Component body
          withPosition({
            id: `component_${i}_body`,
            type: 'text',
            x: baseX + 0.3, y: 2.6, w: 3.4, h: 3.5,
            content: c.body || '',
            style: { fontSize: 11, color: c.is_result ? C.DARK : C.WHITE, fontFace: "'Rajdhani', sans-serif", align: 'left' },
            zIndex: 12 + i * 2,
          })
        );
        // Add operator between components
        if (i < comps3.length - 1) {
          comp3Elements.push(
            withPosition({
              id: `operator_${i}`,
              type: 'text',
              x: baseX + 4.05, y: 3.5, w: 0.5, h: 0.8,
              content: i === comps3.length - 2 ? '=' : '+',
              style: { fontSize: 32, bold: true, color: C.YELLOW, fontFace: "'Rajdhani', sans-serif", align: 'center' },
              locked: true,
              zIndex: 5,
            })
          );
        }
      });

      return comp3Elements;

    case 'composite_four':
      const comps4 = slide.components || [
        { title: 'A', body: 'Component A', is_result: false },
        { title: 'B', body: 'Component B', is_result: false },
        { title: 'C', body: 'Component C', is_result: false },
        { title: 'RESULT', body: 'Combined result', is_result: true },
      ];
      const nonResults = comps4.filter((c: any) => !c.is_result);
      const results = comps4.filter((c: any) => c.is_result);

      const comp4Elements: CanvasElement[] = [
        // Section tag
        ...(slide.section_tag ? [withPosition({
          id: 'section_tag',
          type: 'text',
          x: 0.4, y: 0.3, w: 3, h: 0.4,
          content: slide.section_tag,
          style: { fontSize: 10, bold: true, color: C.YELLOW, fontFace: "'Rajdhani', sans-serif" },
          locked: true,
          zIndex: 1,
        })] : []),
        // Title
        withPosition({
          id: 'title',
          type: 'text',
          x: 0.4, y: 0.3, w: 12.5, h: 0.7,
          content: (slide.title || '').toUpperCase(),
          style: { fontSize: 26, bold: true, color: C.WHITE, fontFace: "'Rajdhani', sans-serif" },
          zIndex: 2,
        }),
      ];

      // Non-result components (left side, stacked)
      nonResults.forEach((c: any, i: number) => {
        comp4Elements.push(
          withPosition({
            id: `component_${i}`,
            type: 'shape',
            x: 0.4, y: 1.3 + i * 1.8, w: 6, h: 1.6,
            options: { shape: 'roundRect', fill: C.DARK, stroke: C.YELLOW, strokeWidth: 2 },
            locked: true,
            zIndex: 10 + i,
          }),
          withPosition({
            id: `component_${i}_title`,
            type: 'text',
            x: 0.6, y: 1.4 + i * 1.8, w: 5.6, h: 0.4,
            content: (c.title || '').toUpperCase(),
            style: { fontSize: 12, bold: true, color: C.YELLOW, fontFace: "'Rajdhani', sans-serif" },
            zIndex: 11 + i,
          }),
          withPosition({
            id: `component_${i}_body`,
            type: 'text',
            x: 0.6, y: 1.85 + i * 1.8, w: 5.6, h: 0.9,
            content: c.body || '',
            style: { fontSize: 10, color: C.WHITE, fontFace: "'Rajdhani', sans-serif", align: 'left' },
            zIndex: 12 + i,
          })
        );
      });

      // Arrow
      comp4Elements.push(
        withPosition({
          id: 'arrow',
          type: 'text',
          x: 6.5, y: 3.2, w: 0.8, h: 0.8,
          content: '→',
          style: { fontSize: 36, bold: true, color: C.YELLOW, fontFace: "'Rajdhani', sans-serif", align: 'center' },
          locked: true,
          zIndex: 20,
        })
      );

      // Result box (right side)
      if (results.length > 0) {
        const r = results[0];
        comp4Elements.push(
          withPosition({
            id: 'result_box',
            type: 'shape',
            x: 7.5, y: 1.3, w: 5.4, h: 5.2,
            options: { shape: 'roundRect', fill: C.YELLOW, stroke: C.YELLOW },
            locked: true,
            zIndex: 30,
          }),
          withPosition({
            id: 'result_title',
            type: 'text',
            x: 7.7, y: 1.5, w: 5, h: 0.5,
            content: (r.title || 'RESULT').toUpperCase(),
            style: { fontSize: 14, bold: true, color: C.DARK, fontFace: "'Rajdhani', sans-serif", align: 'center' },
            zIndex: 31,
          }),
          withPosition({
            id: 'result_body',
            type: 'text',
            x: 7.7, y: 2.2, w: 5, h: 4,
            content: r.body || '',
            style: { fontSize: 12, color: C.DARK, fontFace: "'Rajdhani', sans-serif", align: 'center' },
            zIndex: 32,
          })
        );
      }

      return comp4Elements;

    case 'five_component_diagram':
      const comps5 = slide.components || [];
      const comp5Elements: CanvasElement[] = [
        // Section tag
        ...(slide.section_tag ? [withPosition({
          id: 'section_tag',
          type: 'text',
          x: 0.4, y: 0.3, w: 3, h: 0.4,
          content: slide.section_tag,
          style: { fontSize: 10, bold: true, color: C.YELLOW, fontFace: "'Rajdhani', sans-serif" },
          locked: true,
          zIndex: 1,
        })] : []),
        // Title
        withPosition({
          id: 'title',
          type: 'text',
          x: 0.4, y: 0.3, w: 12.5, h: 0.7,
          content: (slide.title || '').toUpperCase(),
          style: { fontSize: 26, bold: true, color: C.WHITE, fontFace: "'Rajdhani', sans-serif" },
          zIndex: 2,
        }),
        // Center box
        withPosition({
          id: 'center_box',
          type: 'shape',
          x: 4.67, y: 2.8, w: 4, h: 2,
          options: { shape: 'roundRect', fill: 'transparent', stroke: C.YELLOW, strokeWidth: 2 },
          locked: true,
          zIndex: 10,
        }),
        withPosition({
          id: 'center_label',
          type: 'text',
          x: 4.67, y: 3, w: 4, h: 0.5,
          content: (slide.center_label || '').toUpperCase(),
          style: { fontSize: 12, bold: true, color: C.YELLOW, fontFace: "'Rajdhani', sans-serif", align: 'center' },
          zIndex: 11,
        }),
        withPosition({
          id: 'center_body',
          type: 'text',
          x: 4.67, y: 3.5, w: 4, h: 1,
          content: slide.center_body || '',
          style: { fontSize: 10, color: C.WHITE, fontFace: "'Rajdhani', sans-serif", align: 'center' },
          zIndex: 12,
        }),
      ];

      // Corner components
      const positions: Record<string, { x: number; y: number }> = {
        top_left: { x: 0.4, y: 1.2 },
        top_right: { x: 9, y: 1.2 },
        bottom_left: { x: 0.4, y: 5.2 },
        bottom_right: { x: 9, y: 5.2 },
      };
      comps5.forEach((c: any, i: number) => {
        const pos = positions[c.position] || { x: 0.4 + i * 3, y: 1.2 };
        comp5Elements.push(
          withPosition({
            id: `component_${i}`,
            type: 'text',
            x: pos.x, y: pos.y, w: 4, h: 1.5,
            content: `${(c.label || '').toUpperCase()}\n${c.body || ''}`,
            style: { fontSize: 10, color: C.WHITE, fontFace: "'Rajdhani', sans-serif", align: 'left' },
            zIndex: 20 + i,
          })
        );
      });

      return comp5Elements;

    case 'strategy_table':
    case 'risk_statistics':
      const tableRows = slide.rows || [];
      const tableCols = slide.columns || [];
      const isRiskStats = layout === 'risk_statistics';

      const tableElements: CanvasElement[] = [
        // Strategy name / Section tag
        ...(slide.strategy_name ? [withPosition({
          id: 'strategy_name',
          type: 'text',
          x: 0.4, y: 0.3, w: 4, h: 0.4,
          content: slide.strategy_name,
          style: { fontSize: 10, bold: true, color: C.YELLOW, fontFace: "'Rajdhani', sans-serif" },
          locked: true,
          zIndex: 1,
        })] : []),
        // Title / Headline
        withPosition({
          id: isRiskStats ? 'headline' : 'title',
          type: 'text',
          x: 0.4, y: 0.3, w: 12.5, h: 0.7,
          content: (slide.title || slide.headline || 'TABLE').toUpperCase(),
          style: { fontSize: 26, bold: true, color: C.DARK, fontFace: "'Rajdhani', sans-serif" },
          zIndex: 2,
        }),
        // Decorative line
        withPosition({
          id: 'deco_line',
          type: 'shape',
          x: 0.4, y: 1.1, w: 2, h: 0.05,
          options: { shape: 'rect', fill: C.YELLOW },
          locked: true,
          zIndex: 3,
        }),
      ];

      // Table header
      if (tableCols.length > 0) {
        tableElements.push(
          withPosition({
            id: 'table_header',
            type: 'shape',
            x: 0.4, y: 1.4, w: 12.5, h: 0.6,
            options: { shape: 'rect', fill: C.DARK },
            locked: true,
            zIndex: 10,
          })
        );
        tableCols.forEach((col: string, i: number) => {
          const colW = 12.5 / (tableCols.length + (isRiskStats ? 1 : 0));
          tableElements.push(
            withPosition({
              id: `col_${i}`,
              type: 'text',
              x: 0.4 + (i + (isRiskStats ? 1 : 0)) * colW, y: 1.5, w: colW, h: 0.4,
              content: col.toUpperCase(),
              style: { fontSize: 10, bold: true, color: C.WHITE, fontFace: "'Rajdhani', sans-serif", align: 'center' },
              locked: true,
              zIndex: 11 + i,
            })
          );
        });
      }

      // Table rows
      tableRows.slice(0, 5).forEach((row: any, i: number) => {
        const rowY = 2.1 + i * 0.8;
        const colW = 12.5 / ((Array.isArray(row) ? row.length : (row.values?.length || 0) + 1) + (isRiskStats ? 1 : 0));
        
        // Row background
        tableElements.push(
          withPosition({
            id: `row_bg_${i}`,
            type: 'shape',
            x: 0.4, y: rowY, w: 12.5, h: 0.7,
            options: { shape: 'rect', fill: i % 2 === 0 ? C.WHITE : C.GRAYALT },
            locked: true,
            zIndex: 20 + i * 10,
          })
        );

        if (Array.isArray(row)) {
          row.forEach((cell: string, j: number) => {
            tableElements.push(
              withPosition({
                id: `cell_${i}_${j}`,
                type: 'text',
                x: 0.4 + j * colW, y: rowY + 0.15, w: colW, h: 0.4,
                content: String(cell),
                style: { fontSize: 9, color: C.DARK, fontFace: "'Rajdhani', sans-serif", align: 'center' },
                zIndex: 21 + j,
              })
            );
          });
        } else {
          // Label column
          tableElements.push(
            withPosition({
              id: `row_label_${i}`,
              type: 'text',
              x: 0.5, y: rowY + 0.15, w: colW * (isRiskStats ? 2 : 1), h: 0.4,
              content: row.label || '',
              style: { fontSize: 9, color: C.DARK, fontFace: "'Rajdhani', sans-serif", align: 'left' },
              zIndex: 21,
            })
          );
          // Value columns
          (row.values || []).forEach((v: string, j: number) => {
            tableElements.push(
              withPosition({
                id: `row_val_${i}_${j}`,
                type: 'text',
                x: 0.4 + (j + (isRiskStats ? 2 : 1)) * colW, y: rowY + 0.15, w: colW, h: 0.4,
                content: String(v),
                style: { fontSize: 9, bold: true, color: C.DARK, fontFace: "'Rajdhani', sans-serif", align: 'center' },
                zIndex: 22 + j,
              })
            );
          });
        }
      });

      // Footnote / disclaimer
      if (slide.footnote || slide.disclaimer) {
        tableElements.push(
          withPosition({
            id: 'footnote',
            type: 'text',
            x: 0.4, y: 6.5, w: 12.5, h: 0.5,
            content: slide.footnote || slide.disclaimer,
            style: { fontSize: 9, italic: true, color: C.GRAY, fontFace: "'Rajdhani', sans-serif" },
            locked: true,
            zIndex: 100,
          })
        );
      }

      return tableElements;

    case 'use_cases':
      const cases = slide.cases || [];
      const useCaseElements: CanvasElement[] = [
        // Strategy name
        ...(slide.strategy_name ? [withPosition({
          id: 'strategy_name',
          type: 'text',
          x: 0.4, y: 0.3, w: 4, h: 0.4,
          content: slide.strategy_name,
          style: { fontSize: 10, bold: true, color: C.YELLOW, fontFace: "'Rajdhani', sans-serif" },
          locked: true,
          zIndex: 1,
        })] : []),
        // Title
        withPosition({
          id: 'title',
          type: 'text',
          x: 0.4, y: 0.3, w: 12.5, h: 0.7,
          content: (slide.title || '').toUpperCase(),
          style: { fontSize: 26, bold: true, color: C.WHITE, fontFace: "'Rajdhani', sans-serif" },
          zIndex: 2,
        }),
      ];

      // Use case circles
      cases.slice(0, 4).forEach((c: any, i: number) => {
        const baseX = 1.5 + i * 3;
        useCaseElements.push(
          withPosition({
            id: `case_${i}_circle`,
            type: 'shape',
            x: baseX, y: 2, w: 2.5, h: 2.5,
            options: { shape: 'ellipse', fill: 'transparent', stroke: C.YELLOW, strokeWidth: 2 },
            locked: true,
            zIndex: 10 + i,
          }),
          withPosition({
            id: `case_${i}_title`,
            type: 'text',
            x: baseX + 0.2, y: 2.7, w: 2.1, h: 0.5,
            content: (c.title || '').toUpperCase(),
            style: { fontSize: 10, bold: true, color: C.YELLOW, fontFace: "'Rajdhani', sans-serif", align: 'center' },
            zIndex: 11 + i,
          }),
          withPosition({
            id: `case_${i}_body`,
            type: 'text',
            x: baseX + 0.2, y: 3.3, w: 2.1, h: 1,
            content: c.body || '',
            style: { fontSize: 8, color: C.WHITE, fontFace: "'Rajdhani', sans-serif", align: 'center' },
            zIndex: 12 + i,
          })
        );
      });

      return useCaseElements;

    case 'thank_you':
      return [
        // Logo image
        withPosition({
          id: 'logo',
          type: 'image',
          x: 4.67, y: 1.5, w: 4, h: 0.8,
          content: '/logos/Potomac Logo White.png',
          options: { sizing: 'contain' },
          locked: true,
          zIndex: 1,
        }),
        // Thank you text
        withPosition({
          id: 'thank_you',
          type: 'text',
          x: 2, y: 2.8, w: 9.33, h: 1.5,
          content: 'THANK YOU!',
          style: { fontSize: 56, bold: true, color: C.WHITE, fontFace: "'Rajdhani', sans-serif", align: 'center' },
          zIndex: 2,
        }),
        // Tagline
        withPosition({
          id: 'tagline',
          type: 'text',
          x: 2, y: 4.5, w: 9.33, h: 0.6,
          content: 'We have a team of regional consultants ready to help.',
          style: { fontSize: 14, italic: true, color: C.YELLOW, fontFace: "'Rajdhani', sans-serif", align: 'center' },
          locked: true,
          zIndex: 3,
        }),
        // Website
        withPosition({
          id: 'website',
          type: 'text',
          x: 4.67, y: 5.3, w: 4, h: 0.5,
          content: 'potomac.com',
          style: { fontSize: 12, color: C.WHITE, fontFace: "'Rajdhani', sans-serif", align: 'center' },
          locked: true,
          zIndex: 4,
        }),
      ];

    case 'disclosures':
      return [
        // Header
        withPosition({
          id: 'header',
          type: 'text',
          x: 0.4, y: 0.4, w: 12.5, h: 0.6,
          content: 'DISCLOSURES',
          style: { fontSize: 18, bold: true, color: C.YELLOW, fontFace: "'Rajdhani', sans-serif" },
          locked: true,
          zIndex: 1,
        }),
        // Disclosure text
        withPosition({
          id: 'disclosure_text',
          type: 'text',
          x: 0.4, y: 1.2, w: 12.5, h: 5.5,
          content: slide.disclosure_text || 'Potomac is a registered investment adviser. Registration with the SEC does not imply a certain level of skill or training. Past performance does not guarantee future results. All investing involves risk, including possible loss of principal...',
          style: { fontSize: 9, color: C.WHITE, fontFace: "'Rajdhani', sans-serif", align: 'left', lineHeight: 1.6 },
          zIndex: 2,
        }),
      ];

    case 'definitions':
      const definitions = slide.definitions || [{ term: 'S&P 500', definition: 'Market-cap weighted index of 500 US companies' }];
      const defElements: CanvasElement[] = [
        // Header
        withPosition({
          id: 'header',
          type: 'text',
          x: 0.4, y: 0.4, w: 12.5, h: 0.6,
          content: 'IMPORTANT DEFINITIONS',
          style: { fontSize: 16, bold: true, color: C.YELLOW, fontFace: "'Rajdhani', sans-serif" },
          locked: true,
          zIndex: 1,
        }),
      ];

      definitions.slice(0, 5).forEach((d: any, i: number) => {
        defElements.push(
          withPosition({
            id: `def_${i}`,
            type: 'text',
            x: 0.4, y: 1.2 + i * 1.1, w: 12.5, h: 1,
            content: `${d.term}: ${d.definition}`,
            style: { fontSize: 10, color: C.WHITE, fontFace: "'Rajdhani', sans-serif", align: 'left' },
            zIndex: 10 + i,
          })
        );
      });

      return defElements;

    default:
      // Generic fallback
      return [
        withPosition({
          id: 'title',
          type: 'text',
          x: 0.4, y: 3, w: 12.5, h: 1.5,
          content: (slide.title || slide.headline || slide.section_title || 'SLIDE').toUpperCase(),
          style: { fontSize: 36, bold: true, color: C.WHITE, fontFace: "'Rajdhani', sans-serif", align: 'center' },
          zIndex: 1,
        }),
        withPosition({
          id: 'layout_label',
          type: 'text',
          x: 0.4, y: 0.4, w: 4, h: 0.4,
          content: layout.replace(/_/g, ' '),
          style: { fontSize: 10, color: C.GRAY, fontFace: "'Rajdhani', sans-serif" },
          locked: true,
          zIndex: 0,
        }),
      ];
  }
}

/**
 * Get background color for a slide based on layout and theme
 */
export function getSlideBackground(slide: EditorSlide, theme: string = 'classic'): { color: string } {
  const C = THEMES[theme] || THEMES.classic;
  const layout = slide?.layout || 'section_divider';
  
  // Most layouts use dark background except section_divider, chart, and tables
  const lightBgLayouts = ['section_divider', 'chart', 'strategy_table', 'risk_statistics'];
  
  return {
    color: lightBgLayouts.includes(layout) ? C.WHITE : C.DARK,
  };
}

export { THEMES };