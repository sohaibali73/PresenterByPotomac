/**
 * Potomac Compliance Rules Engine
 * 
 * Validates presentations for regulatory and brand compliance.
 */

export interface ComplianceIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  slideIndex?: number;
  slideLayout?: string;
  message: string;
  description: string;
  fix?: string;
}

export interface ComplianceResult {
  compliant: boolean;
  issues: ComplianceIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

// Required disclosure layouts
const DISCLOSURE_LAYOUTS = ['disclosures', 'definitions'];
const REQUIRED_ENDING_LAYOUTS = ['thank_you', 'disclosures', 'definitions'];

// Layouts that require disclaimer text
const PERFORMANCE_LAYOUTS = ['strategy_table', 'risk_statistics', 'chart'];

// Required fields by layout type
const REQUIRED_FIELDS: Record<string, string[]> = {
  cover: ['title'],
  section_divider: ['section_title'],
  three_pillars: ['title', 'pillars'],
  chart: ['chart_title'],
  composite_three: ['headline', 'components'],
  composite_four: ['title', 'components'],
  five_component_diagram: ['title', 'center_label'],
  strategy_table: ['title', 'columns', 'rows'],
  risk_statistics: ['headline', 'columns', 'rows'],
  use_cases: ['title', 'cases'],
};

// Performance-related fields that need proper formatting
const PERCENTAGE_FIELDS = [
  '1-yr', '1-year', '5-yr', '5-year', '10-yr', '10-year',
  'return', 'returns', 'correlation', 'beta', 'alpha',
  'sharpe', 'standard_deviation', 'max_drawdown',
];

/**
 * Check compliance for a presentation outline
 */
export function checkCompliance(outline: any): ComplianceResult {
  const issues: ComplianceIssue[] = [];
  const slides = outline?.slides || [];

  // 1. Check minimum slide count
  if (slides.length < 10) {
    issues.push({
      id: 'min_slides',
      type: 'warning',
      message: 'Presentation has fewer than 10 slides',
      description: 'Potomac presentations typically have 12-16 slides for a complete story arc.',
      fix: 'Consider adding more content slides to complete the 5-act structure.',
    });
  }

  // 2. Check for required ending slides
  const layouts = slides.map((s: any) => s.layout);
  
  if (!layouts.includes('thank_you')) {
    issues.push({
      id: 'missing_thank_you',
      type: 'error',
      message: 'Missing Thank You slide',
      description: 'All presentations must end with a Thank You slide.',
      fix: 'Add a thank_you layout slide at the end.',
    });
  }

  if (!layouts.includes('disclosures')) {
    issues.push({
      id: 'missing_disclosures',
      type: 'error',
      message: 'Missing Disclosures slide',
      description: 'SEC requires proper disclosures on all marketing materials.',
      fix: 'Add a disclosures layout slide before the final slides.',
    });
  }

  if (!layouts.includes('definitions')) {
    issues.push({
      id: 'missing_definitions',
      type: 'warning',
      message: 'Missing Definitions slide',
      description: 'Financial terms should be defined for compliance.',
      fix: 'Add a definitions layout slide with relevant financial terms.',
    });
  }

  // 3. Check for cover slide
  if (slides.length > 0 && slides[0].layout !== 'cover') {
    issues.push({
      id: 'missing_cover',
      type: 'error',
      message: 'First slide must be a cover',
      description: 'Presentations should start with a cover slide.',
      fix: 'Make the first slide a cover layout.',
    });
  }

  // 4. Check individual slides
  slides.forEach((slide: any, index: number) => {
    const layout = slide.layout;
    
    // Check required fields for this layout
    const requiredFields = REQUIRED_FIELDS[layout] || [];
    requiredFields.forEach(field => {
      if (!slide[field] || (Array.isArray(slide[field]) && slide[field].length === 0)) {
        issues.push({
          id: `missing_field_${index}_${field}`,
          type: 'error',
          slideIndex: index,
          slideLayout: layout,
          message: `Slide ${index + 1} missing required field: ${field}`,
          description: `The ${layout} layout requires a ${field} field.`,
          fix: `Add ${field} to slide ${index + 1}.`,
        });
      }
    });

    // Check performance slides for disclaimers
    if (PERFORMANCE_LAYOUTS.includes(layout)) {
      const hasDisclaimer = slide.disclaimer || slide.footnote || slide.chart_caption;
      if (!hasDisclaimer) {
        issues.push({
          id: `missing_disclaimer_${index}`,
          type: 'warning',
          slideIndex: index,
          slideLayout: layout,
          message: `Slide ${index + 1} missing disclaimer/footnote`,
          description: 'Performance data should include source attribution or disclaimer.',
          fix: 'Add a footnote with data source (e.g., "Source: FastTrack as of 12/31/2025").',
        });
      }

      // Check for percentage formatting in performance data
      if (slide.rows) {
        checkPerformanceData(slide.rows, index, issues);
      }
    }

    // Check for ALL CAPS titles
    const titleFields = ['title', 'headline', 'section_title', 'chart_title'];
    titleFields.forEach(field => {
      if (slide[field] && hasLowerCase(slide[field])) {
        issues.push({
          id: `lowercase_title_${index}`,
          type: 'warning',
          slideIndex: index,
          slideLayout: layout,
          message: `Slide ${index + 1} title should be ALL CAPS`,
          description: 'Potomac brand guidelines require ALL CAPS titles.',
          fix: `Convert "${slide[field]}" to uppercase: "${slide[field].toUpperCase()}"`,
        });
      }
    });

    // Check pillars have exactly 3 items
    if (layout === 'three_pillars' && slide.pillars) {
      if (slide.pillars.length !== 3) {
        issues.push({
          id: `pillar_count_${index}`,
          type: 'error',
          slideIndex: index,
          slideLayout: layout,
          message: `Three Pillars slide must have exactly 3 pillars`,
          description: `Found ${slide.pillars.length} pillars. The three_pillars layout requires exactly 3.`,
          fix: 'Add or remove pillars to have exactly 3.',
        });
      }
    }

    // Check composites have exactly one is_result: true
    if (['composite_three', 'composite_four'].includes(layout) && slide.components) {
      const resultCount = slide.components.filter((c: any) => c.is_result).length;
      if (resultCount !== 1) {
        issues.push({
          id: `result_count_${index}`,
          type: 'error',
          slideIndex: index,
          slideLayout: layout,
          message: `Composite must have exactly one result component`,
          description: `Found ${resultCount} components with is_result: true. Should be exactly 1.`,
          fix: 'Set is_result: true on exactly one component (the output/result).',
        });
      }
    }

    // Check five_component_diagram has 4 corner components
    if (layout === 'five_component_diagram' && slide.components) {
      if (slide.components.length !== 4) {
        issues.push({
          id: `component_count_${index}`,
          type: 'warning',
          slideIndex: index,
          slideLayout: layout,
          message: `Five Component diagram should have 4 corner items`,
          description: `Found ${slide.components.length} components. Expected 4 for corners.`,
          fix: 'Add components for top_left, top_right, bottom_left, bottom_right.',
        });
      }
    }
  });

  // 5. Check for proper 5-act structure (info only)
  const hasProcess = layouts.some((l: string) => 
    ['three_pillars', 'composite_three', 'composite_four'].includes(l)
  );
  const hasStrategy = layouts.some((l: string) =>
    ['five_component_diagram', 'strategy_table', 'risk_statistics'].includes(l)
  );
  const hasUseCases = layouts.includes('use_cases');

  if (!hasProcess) {
    issues.push({
      id: 'missing_process',
      type: 'info',
      message: 'No Process explanation slides found',
      description: 'Consider adding three_pillars or composite slides to explain methodology.',
    });
  }

  if (!hasStrategy) {
    issues.push({
      id: 'missing_strategy',
      type: 'info',
      message: 'No Strategy Details slides found',
      description: 'Consider adding allocation or performance comparison slides.',
    });
  }

  if (!hasUseCases) {
    issues.push({
      id: 'missing_use_cases',
      type: 'info',
      message: 'No Use Cases slide found',
      description: 'Consider adding use cases to show practical applications.',
    });
  }

  // Calculate summary
  const summary = {
    errors: issues.filter(i => i.type === 'error').length,
    warnings: issues.filter(i => i.type === 'warning').length,
    info: issues.filter(i => i.type === 'info').length,
  };

  return {
    compliant: summary.errors === 0,
    issues,
    summary,
  };
}

/**
 * Check performance data for proper formatting
 */
function checkPerformanceData(rows: any[], slideIndex: number, issues: ComplianceIssue[]) {
  rows.forEach((row, rowIndex) => {
    const values = Array.isArray(row) ? row : (row.values || []);
    values.forEach((val: any, valIndex: number) => {
      if (typeof val === 'string') {
        // Check for percentage values without %
        const numMatch = val.match(/^[\d.]+$/);
        if (numMatch && parseFloat(val) <= 100) {
          // Might be a percentage without the %
          issues.push({
            id: `percent_format_${slideIndex}_${rowIndex}_${valIndex}`,
            type: 'info',
            slideIndex: slideIndex,
            message: `Value "${val}" might need a % symbol`,
            description: 'Performance percentages should include the % symbol for clarity.',
            fix: `Consider formatting as "${val}%"`,
          });
        }
      }
    });
  });
}

/**
 * Check if a string has lowercase letters
 */
function hasLowerCase(str: string): boolean {
  return /[a-z]/.test(str);
}

/**
 * Quick validation for a single slide
 */
export function validateSlide(slide: any): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  const layout = slide.layout;

  // Check required fields
  const requiredFields = REQUIRED_FIELDS[layout] || [];
  requiredFields.forEach(field => {
    if (!slide[field] || (Array.isArray(slide[field]) && slide[field].length === 0)) {
      issues.push({
        id: `missing_${field}`,
        type: 'error',
        slideLayout: layout,
        message: `Missing required field: ${field}`,
        description: `The ${layout} layout requires a ${field} field.`,
        fix: `Add ${field} to this slide.`,
      });
    }
  });

  return issues;
}

/**
 * Get compliance status badge info
 */
export function getComplianceBadge(result: ComplianceResult): {
  color: string;
  label: string;
  icon: string;
} {
  if (result.summary.errors > 0) {
    return {
      color: 'red',
      label: `${result.summary.errors} Error${result.summary.errors > 1 ? 's' : ''}`,
      icon: '⚠️',
    };
  }
  if (result.summary.warnings > 0) {
    return {
      color: 'yellow',
      label: `${result.summary.warnings} Warning${result.summary.warnings > 1 ? 's' : ''}`,
      icon: '⚡',
    };
  }
  return {
    color: 'green',
    label: 'Compliant',
    icon: '✓',
  };
}

export default checkCompliance;