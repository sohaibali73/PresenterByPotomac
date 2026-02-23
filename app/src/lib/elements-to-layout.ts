import { CanvasElement } from '@/components/InteractiveCanvas';

type EditorSlide = {
  layout: string;
  [key: string]: any;
};

/**
 * Sync canvas element changes back to the slide data structure.
 * This updates the slide's content fields based on element edits.
 */
export function syncElementsToSlide(
  elements: CanvasElement[],
  originalSlide: EditorSlide
): EditorSlide {
  const updated = { ...originalSlide };
  
  // Store position overrides for custom positioning
  const positions: Record<string, { x: number; y: number; w: number; h: number }> = {};
  
  elements.forEach(el => {
    // Store all element positions
    positions[el.id] = { x: el.x, y: el.y, w: el.w, h: el.h };
    
    // Sync content based on element id
    switch (el.id) {
      case 'title':
        if (el.type === 'text' && typeof el.content === 'string') {
          updated.title = el.content;
        }
        break;
        
      case 'section_title':
        if (el.type === 'text' && typeof el.content === 'string') {
          updated.section_title = el.content;
        }
        break;
        
      case 'headline':
        if (el.type === 'text' && typeof el.content === 'string') {
          updated.headline = el.content;
        }
        break;
        
      case 'chart_title':
        if (el.type === 'text' && typeof el.content === 'string') {
          updated.chart_title = el.content;
        }
        break;
        
      case 'chart_caption':
        if (el.type === 'text' && typeof el.content === 'string') {
          updated.chart_caption = el.content;
        }
        break;
        
      case 'subtitle':
        if (el.type === 'text' && typeof el.content === 'string') {
          updated.subtitle = el.content;
        }
        break;
        
      case 'section_tag':
        if (el.type === 'text' && typeof el.content === 'string') {
          updated.section_tag = el.content;
        }
        break;
        
      case 'strategy_name':
        if (el.type === 'text' && typeof el.content === 'string') {
          updated.strategy_name = el.content;
        }
        break;
        
      case 'center_label':
        if (el.type === 'text' && typeof el.content === 'string') {
          updated.center_label = el.content;
        }
        break;
        
      case 'center_body':
        if (el.type === 'text' && typeof el.content === 'string') {
          updated.center_body = el.content;
        }
        break;
        
      case 'tagline':
        if (el.type === 'text' && typeof el.content === 'string') {
          updated.tagline = el.content;
        }
        break;
        
      case 'disclosure_text':
        if (el.type === 'text' && typeof el.content === 'string') {
          updated.disclosure_text = el.content;
        }
        break;
        
      case 'footnote':
        if (el.type === 'text' && typeof el.content === 'string') {
          updated.footnote = el.content;
        }
        break;
        
      case 'chart_image':
        if (el.type === 'image' && typeof el.content === 'string') {
          updated.image_url = el.content;
        }
        break;
    }
    
    // Handle pillar elements
    if (el.id.startsWith('pillar_')) {
      const idx = parseInt(el.id.split('_')[1]);
      if (!isNaN(idx) && el.type === 'group' && typeof el.content === 'string') {
        try {
          const data = JSON.parse(el.content);
          if (!updated.pillars) updated.pillars = [];
          if (!updated.pillars[idx]) updated.pillars[idx] = { label: '', description: '' };
          updated.pillars[idx] = {
            ...updated.pillars[idx],
            label: data.label || updated.pillars[idx].label,
            description: data.description || updated.pillars[idx].description,
          };
        } catch (e) {
          // Invalid JSON, skip
        }
      }
    }
    
    // Handle component elements (composite layouts)
    if (el.id.startsWith('component_')) {
      const match = el.id.match(/component_(\d+)_(title|body)/);
      if (match) {
        const idx = parseInt(match[1]);
        const field = match[2];
        if (!isNaN(idx) && el.type === 'text' && typeof el.content === 'string') {
          if (!updated.components) updated.components = [];
          if (!updated.components[idx]) updated.components[idx] = { title: '', body: '', is_result: false };
          updated.components[idx] = {
            ...updated.components[idx],
            [field]: el.content,
          };
        }
      }
    }
    
    // Handle use case elements
    if (el.id.startsWith('case_')) {
      const match = el.id.match(/case_(\d+)_(title|body)/);
      if (match) {
        const idx = parseInt(match[1]);
        const field = match[2];
        if (!isNaN(idx) && el.type === 'text' && typeof el.content === 'string') {
          if (!updated.cases) updated.cases = [];
          if (!updated.cases[idx]) updated.cases[idx] = { title: '', body: '' };
          updated.cases[idx] = {
            ...updated.cases[idx],
            [field]: el.content,
          };
        }
      }
    }
    
    // Handle definition elements
    if (el.id.startsWith('def_')) {
      const idx = parseInt(el.id.split('_')[1]);
      if (!isNaN(idx) && el.type === 'text' && typeof el.content === 'string') {
        const parts = el.content.split(': ');
        if (parts.length >= 2) {
          if (!updated.definitions) updated.definitions = [];
          updated.definitions[idx] = {
            term: parts[0],
            definition: parts.slice(1).join(': '),
          };
        }
      }
    }
    
    // Handle result elements (composite_four)
    if (el.id === 'result_title' && el.type === 'text' && typeof el.content === 'string') {
      const resultComponents = updated.components?.filter((c: any) => c.is_result) || [];
      if (resultComponents.length > 0) {
        const idx = updated.components.findIndex((c: any) => c.is_result);
        if (idx >= 0) {
          updated.components[idx].title = el.content;
        }
      }
    }
    if (el.id === 'result_body' && el.type === 'text' && typeof el.content === 'string') {
      const resultComponents = updated.components?.filter((c: any) => c.is_result) || [];
      if (resultComponents.length > 0) {
        const idx = updated.components.findIndex((c: any) => c.is_result);
        if (idx >= 0) {
          updated.components[idx].body = el.content;
        }
      }
    }
  });
  
  // Store position overrides if any positions changed
  const originalPositions = originalSlide._positions || {};
  const hasPositionChanges = Object.keys(positions).some(id => {
    const newPos = positions[id];
    const origPos = originalPositions[id];
    if (!origPos) return true;
    return newPos.x !== origPos.x || newPos.y !== origPos.y || 
           newPos.w !== origPos.w || newPos.h !== origPos.h;
  });
  
  if (hasPositionChanges) {
    updated._positions = positions;
  }
  
  return updated;
}

/**
 * Extract custom elements (elements added on top of the layout)
 * These are elements that don't match the standard layout element IDs
 */
export function extractCustomElements(
  elements: CanvasElement[],
  layout: string
): CanvasElement[] {
  const standardIds = getStandardElementIds(layout);
  return elements.filter(el => !standardIds.includes(el.id));
}

/**
 * Get standard element IDs for a given layout
 */
function getStandardElementIds(layout: string): string[] {
  const commonIds = [
    'bg_top', 'bg_bottom', 'deco_line', 'deco_line_top', 'deco_line_bottom',
    'logo', 'logo_text', 'tagline', 'arrow', 'website',
  ];
  
  const layoutSpecificIds: Record<string, string[]> = {
    cover: ['title'],
    section_divider: ['section_title'],
    three_pillars: ['title', 'subtitle', 'section_tag', 'pillar_0', 'pillar_1', 'pillar_2'],
    chart: ['chart_title', 'chart_caption', 'chart_image', 'chart_placeholder', 'section_tag'],
    composite_three: ['headline', 'section_tag', 'operator_0', 'operator_1'],
    composite_four: ['title', 'section_tag', 'arrow', 'result_box', 'result_title', 'result_body'],
    five_component_diagram: ['title', 'section_tag', 'center_box', 'center_label', 'center_body'],
    strategy_table: ['title', 'strategy_name', 'table_header', 'footnote'],
    risk_statistics: ['headline', 'strategy_name', 'table_header', 'disclaimer'],
    use_cases: ['title', 'strategy_name'],
    thank_you: ['thank_you'],
    disclosures: ['header', 'disclosure_text'],
    definitions: ['header'],
  };
  
  const specificIds = layoutSpecificIds[layout] || ['title'];
  
  // Add dynamic IDs (components, pillars, cases, definitions, table cells)
  const dynamicIds: string[] = [];
  for (let i = 0; i < 10; i++) {
    // Pillars
    dynamicIds.push(`pillar_${i}`);
    // Components
    dynamicIds.push(`component_${i}`, `component_${i}_box`, `component_${i}_title`, `component_${i}_body`);
    // Cases
    dynamicIds.push(`case_${i}_circle`, `case_${i}_title`, `case_${i}_body`);
    // Definitions
    dynamicIds.push(`def_${i}`);
    // Table elements
    dynamicIds.push(`col_${i}`, `row_bg_${i}`, `row_label_${i}`, `cell_${i}`, `row_val_0_${i}`, `row_val_1_${i}`);
    for (let j = 0; j < 10; j++) {
      dynamicIds.push(`cell_${i}_${j}`, `row_val_${i}_${j}`);
    }
  }
  
  return [...commonIds, ...specificIds, ...dynamicIds];
}

/**
 * Merge custom elements back into a slide
 */
export function mergeCustomElements(
  slide: EditorSlide,
  customElements: CanvasElement[]
): EditorSlide {
  return {
    ...slide,
    _customElements: customElements,
  };
}