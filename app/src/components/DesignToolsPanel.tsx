'use client';
import { useState, useEffect } from 'react';

// Server logos available in public/logos
const SERVER_LOGOS = [
  { id: 'potomac-logo', name: 'Potomac Logo', url: '/logos/Potomac Logo.png' },
  { id: 'potomac-logo-white', name: 'Potomac Logo White', url: '/logos/Potomac Logo White.png' },
  { id: 'potomac-logo-black', name: 'Potomac Logo Black', url: '/logos/Potomac Logo Black.png' },
  { id: 'potomac-icon', name: 'Potomac Icon', url: '/logos/Potomac Icon.png' },
  { id: 'potomac-icon-white', name: 'Potomac Icon White', url: '/logos/Potomac Icon White.png' },
  { id: 'potomac-icon-black', name: 'Potomac Icon Black', url: '/logos/Potomac Icon Black.png' },
];

// Color presets
const COLOR_PRESETS = {
  brand: ['#FEC00F', '#212121', '#FFFFFF'],
  neutrals: ['#737373', '#C6C6C6', '#F5F5F5'],
  themes: ['#1A2744', '#1B2E1B', '#2D2D3D', '#0A2F3F'],
  accents: ['#4CAF50', '#FF6B35', '#0066CC', '#FF6B6B'],
};

// Gradient presets
const GRADIENT_PRESETS = [
  { name: 'Sunrise', colors: ['#FF6B6B', '#FF8E53', '#FFD93D'], angle: 135 },
  { name: 'Ocean', colors: ['#00CED1', '#0066CC', '#003366'], angle: 180 },
  { name: 'Forest', colors: ['#134E5E', '#71B280'], angle: 90 },
  { name: 'Purple Haze', colors: ['#7F00FF', '#E100FF'], angle: 135 },
  { name: 'Aurora', colors: ['#00C9FF', '#92FE9D'], angle: 45 },
  { name: 'Midnight', colors: ['#232526', '#414345'], angle: 180 },
  { name: 'Potomac Gold', colors: ['#212121', '#FEC00F'], angle: 135 },
  { name: 'Corporate', colors: ['#003366', '#0066CC'], angle: 90 },
];

// Pattern types
const PATTERN_TYPES = [
  { id: 'dots', name: 'Dots', icon: '◉' },
  { id: 'grid', name: 'Grid', icon: '▦' },
  { id: 'lines', name: 'Lines', icon: '≡' },
  { id: 'zigzag', name: 'Zigzag', icon: '〰' },
  { id: 'circles', name: 'Circles', icon: '◯' },
];

// Shape definitions
const SHAPE_DEFINITIONS = [
  { id: 'rect', name: 'Rectangle', icon: '▢', clipPath: '' },
  { id: 'roundRect', name: 'Rounded', icon: '▢', clipPath: '', borderRadius: 8 },
  { id: 'ellipse', name: 'Ellipse', icon: '○', clipPath: '', borderRadius: '50%' },
  { id: 'triangle', name: 'Triangle', icon: '△', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' },
  { id: 'diamond', name: 'Diamond', icon: '◇', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
  { id: 'pentagon', name: 'Pentagon', icon: '⬠', clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' },
  { id: 'hexagon', name: 'Hexagon', icon: '⬡', clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' },
  { id: 'star', name: 'Star', icon: '☆', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
  { id: 'arrow', name: 'Arrow', icon: '→', clipPath: 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)' },
  { id: 'chevron', name: 'Chevron', icon: '»', clipPath: 'polygon(75% 0%, 100% 50%, 75% 100%, 50% 50%)' },
];

// Theme presets
const THEME_PRESETS = [
  {
    id: 'classic',
    name: 'Classic Potomac',
    colors: {
      primary: '#FEC00F',
      secondary: '#212121',
      background: '#212121',
      text: '#FFFFFF',
      accent: '#FEC00F',
    },
  },
  {
    id: 'navy',
    name: 'Navy Blue',
    colors: {
      primary: '#FEC00F',
      secondary: '#1A2744',
      background: '#1A2744',
      text: '#FFFFFF',
      accent: '#8899AA',
    },
  },
  {
    id: 'forest',
    name: 'Forest Green',
    colors: {
      primary: '#4CAF50',
      secondary: '#1B2E1B',
      background: '#1B2E1B',
      text: '#FFFFFF',
      accent: '#6B8E6B',
    },
  },
  {
    id: 'slate',
    name: 'Slate Modern',
    colors: {
      primary: '#FF6B35',
      secondary: '#2D2D3D',
      background: '#2D2D3D',
      text: '#FFFFFF',
      accent: '#8E8E9E',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal Light',
    colors: {
      primary: '#333333',
      secondary: '#1A1A1A',
      background: '#FFFFFF',
      text: '#1A1A1A',
      accent: '#666666',
    },
  },
  {
    id: 'corporate',
    name: 'Corporate Blue',
    colors: {
      primary: '#0066CC',
      secondary: '#003366',
      background: '#003366',
      text: '#FFFFFF',
      accent: '#99CCFF',
    },
  },
];

// Export utilities
export function generatePatternSVG(pattern: { type: string; color: string; size: number; opacity: number }): string {
  const { type, color, size, opacity } = pattern;
  const encodedColor = encodeURIComponent(color || '#FEC00F');
  
  switch (type) {
    case 'dots':
      return `url("data:image/svg+xml,%3Csvg width='${size}' height='${size}' viewBox='0 0 ${size} ${size}' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='${size/2}' cy='${size/2}' r='${size/4}' fill='${encodedColor}' fill-opacity='${opacity}'/%3E%3C/svg%3E")`;
    case 'grid':
      return `url("data:image/svg+xml,%3Csvg width='${size}' height='${size}' viewBox='0 0 ${size} ${size}' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M ${size} 0 L 0 0 0 ${size}' fill='none' stroke='${encodedColor}' stroke-opacity='${opacity}' stroke-width='1'/%3E%3C/svg%3E")`;
    case 'lines':
      return `url("data:image/svg+xml,%3Csvg width='${size}' height='${size}' viewBox='0 0 ${size} ${size}' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='0' y1='${size}' x2='${size}' y2='0' stroke='${encodedColor}' stroke-opacity='${opacity}' stroke-width='1'/%3E%3C/svg%3E")`;
    case 'circles':
      return `url("data:image/svg+xml,%3Csvg width='${size * 2}' height='${size * 2}' viewBox='0 0 ${size * 2} ${size * 2}' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='${size}' cy='${size}' r='${size * 0.8}' fill='none' stroke='${encodedColor}' stroke-opacity='${opacity}' stroke-width='1'/%3E%3C/svg%3E")`;
    case 'zigzag':
      return `url("data:image/svg+xml,%3Csvg width='${size * 2}' height='${size}' viewBox='0 0 ${size * 2} ${size}' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 ${size/2} L${size/2} 0 L${size} ${size/2} L${size * 1.5} 0 L${size * 2} ${size/2}' fill='none' stroke='${encodedColor}' stroke-opacity='${opacity}' stroke-width='1'/%3E%3C/svg%3E")`;
    default:
      return '';
  }
}

export function getShapeStyle(shapeId: string, fill: string, stroke?: { color: string; width: number }): React.CSSProperties {
  const shape = SHAPE_DEFINITIONS.find(s => s.id === shapeId);
  const style: React.CSSProperties = {
    backgroundColor: fill,
    width: '100%',
    height: '100%',
  };
  
  if (shape) {
    if (shape.borderRadius === '50%') {
      style.borderRadius = '50%';
    } else if (typeof shape.borderRadius === 'number') {
      style.borderRadius = shape.borderRadius;
    }
    if (shape.clipPath) {
      style.clipPath = shape.clipPath;
    }
  }
  
  if (stroke) {
    style.border = `${stroke.width}px solid ${stroke.color}`;
  }
  
  return style;
}

export {
  SERVER_LOGOS,
  COLOR_PRESETS,
  GRADIENT_PRESETS,
  PATTERN_TYPES,
  SHAPE_DEFINITIONS,
  THEME_PRESETS,
};