'use client';
import { useState } from 'react';
import { SERVER_LOGOS } from './DesignToolsPanel';

export interface MasterSlideConfig {
  logo: {
    enabled: boolean;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    imageUrl?: string;
    width: number;
    height: number;
    opacity: number;
  };
  footer: {
    enabled: boolean;
    text: string;
    position: 'left' | 'center' | 'right';
    includeSlideNumber: boolean;
    includeDate: boolean;
    fontSize: number;
    color: string;
  };
  background: {
    applyToAll: boolean;
    color?: string;
    gradient?: {
      type: 'linear' | 'radial';
      colors: string[];
      angle?: number;
    };
  };
  fonts: {
    headingFont: string;
    bodyFont: string;
    headingSize: number;
    bodySize: number;
    headingColor: string;
    bodyColor: string;
  };
  accentBar: {
    enabled: boolean;
    position: 'top' | 'bottom' | 'both';
    height: number;
    color: string;
  };
  slideNumber: {
    enabled: boolean;
    position: 'bottom-left' | 'bottom-center' | 'bottom-right';
    format: 'number' | 'number-of-total' | 'custom';
    customFormat?: string;
    fontSize: number;
    color: string;
  };
}

const DEFAULT_MASTER: MasterSlideConfig = {
  logo: {
    enabled: false,
    position: 'top-left',
    width: 1.5,
    height: 0.5,
    opacity: 1,
  },
  footer: {
    enabled: true,
    text: 'Potomac Fund Management',
    position: 'left',
    includeSlideNumber: true,
    includeDate: false,
    fontSize: 8,
    color: '#737373',
  },
  background: {
    applyToAll: false,
  },
  fonts: {
    headingFont: 'Rajdhani',
    bodyFont: 'Rajdhani',
    headingSize: 32,
    bodySize: 14,
    headingColor: '#FFFFFF',
    bodyColor: '#FFFFFF',
  },
  accentBar: {
    enabled: true,
    position: 'top',
    height: 0.08,
    color: '#FEC00F',
  },
  slideNumber: {
    enabled: true,
    position: 'bottom-right',
    format: 'number-of-total',
    fontSize: 9,
    color: '#737373',
  },
};

interface MasterSlideEditorProps {
  currentMaster: Partial<MasterSlideConfig>;
  onMasterChange: (master: MasterSlideConfig) => void;
  onClose: () => void;
  slideCount: number;
}

export default function MasterSlideEditor({
  currentMaster,
  onMasterChange,
  onClose,
  slideCount,
}: MasterSlideEditorProps) {
  const [activeSection, setActiveSection] = useState<'logo' | 'footer' | 'background' | 'fonts' | 'accent' | 'numbers'>('logo');
  const [config, setConfig] = useState<MasterSlideConfig>({
    ...DEFAULT_MASTER,
    ...currentMaster,
    logo: { ...DEFAULT_MASTER.logo, ...currentMaster.logo },
    footer: { ...DEFAULT_MASTER.footer, ...currentMaster.footer },
    background: { ...DEFAULT_MASTER.background, ...currentMaster.background },
    fonts: { ...DEFAULT_MASTER.fonts, ...currentMaster.fonts },
    accentBar: { ...DEFAULT_MASTER.accentBar, ...currentMaster.accentBar },
    slideNumber: { ...DEFAULT_MASTER.slideNumber, ...currentMaster.slideNumber },
  });

  const updateConfig = <K extends keyof MasterSlideConfig>(
    section: K,
    updates: Partial<MasterSlideConfig[K]>
  ) => {
    const newConfig = {
      ...config,
      [section]: { ...config[section], ...updates },
    };
    setConfig(newConfig);
    onMasterChange(newConfig);
  };

  const sections = [
    { id: 'logo', label: 'Logo', icon: 'L' },
    { id: 'footer', label: 'Footer', icon: 'F' },
    { id: 'background', label: 'Background', icon: 'B' },
    { id: 'fonts', label: 'Fonts', icon: 'F' },
    { id: 'accent', label: 'Accent Bar', icon: 'A' },
    { id: 'numbers', label: 'Slide Numbers', icon: 'N' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">Master Slide Editor</h2>
            <p className="text-xs text-gray-500 mt-1">Apply universal changes across all {slideCount} slides</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        <div className="flex h-[calc(90vh-140px)]">
          {/* Left Navigation */}
          <div className="w-48 border-r border-gray-700 p-2">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 text-left transition-colors ${
                  activeSection === section.id ? 'bg-[#FEC00F]/10 text-[#FEC00F]' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="text-lg">{section.icon}</span>
                <span className="text-sm">{section.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Logo Section */}
            {activeSection === 'logo' && (
              <div className="space-y-6">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.logo.enabled}
                    onChange={e => updateConfig('logo', { enabled: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-white">Show Logo on All Slides</span>
                </label>

                {config.logo.enabled && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 block mb-2">Select Logo</label>
                      <div className="grid grid-cols-3 gap-3">
                        {SERVER_LOGOS.map(logo => (
                          <button
                            key={logo.id}
                            onClick={() => updateConfig('logo', { imageUrl: logo.url })}
                            className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                              config.logo.imageUrl === logo.url
                                ? 'border-[#FEC00F] bg-[#FEC00F]/10'
                                : 'border-gray-700 hover:border-gray-500 bg-[#0a0a0a]'
                            }`}
                          >
                            <img
                              src={logo.url}
                              alt={logo.name}
                              className="h-10 object-contain"
                              style={{ filter: logo.url.includes('White') && config.background.color !== '#FFFFFF' ? 'none' : undefined }}
                            />
                            <span className="text-[10px] text-gray-400 text-center">{logo.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Or Custom URL</label>
                      <input
                        type="text"
                        value={config.logo.imageUrl || ''}
                        onChange={e => updateConfig('logo', { imageUrl: e.target.value })}
                        placeholder="https://example.com/logo.png"
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Position</label>
                      <select
                        value={config.logo.position}
                        onChange={e => updateConfig('logo', { position: e.target.value as any })}
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="top-left">Top Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-right">Bottom Right</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Width (inches)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={config.logo.width}
                          onChange={e => updateConfig('logo', { width: parseFloat(e.target.value) })}
                          className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Opacity: {Math.round(config.logo.opacity * 100)}%</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={config.logo.opacity}
                          onChange={e => updateConfig('logo', { opacity: parseFloat(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Logo Preview */}
                    {config.logo.imageUrl && (
                      <div className="mt-4">
                        <label className="text-xs text-gray-500 block mb-2">Preview</label>
                        <div 
                          className="h-24 rounded-lg flex items-center justify-center relative overflow-hidden"
                          style={{ backgroundColor: config.background.color || '#212121' }}
                        >
                          <div 
                            className="absolute"
                            style={{
                              [config.logo.position.includes('top') ? 'top' : 'bottom']: '12px',
                              [config.logo.position.includes('left') ? 'left' : 'right']: '12px',
                              opacity: config.logo.opacity,
                            }}
                          >
                            <img
                              src={config.logo.imageUrl}
                              alt="Logo preview"
                              className="h-8 object-contain"
                            />
                          </div>
                          <span className="text-[10px] text-gray-500">Slide Preview</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Footer Section */}
            {activeSection === 'footer' && (
              <div className="space-y-6">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.footer.enabled}
                    onChange={e => updateConfig('footer', { enabled: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-white">Show Footer on All Slides</span>
                </label>

                {config.footer.enabled && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Footer Text</label>
                      <input
                        type="text"
                        value={config.footer.text}
                        onChange={e => updateConfig('footer', { text: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Position</label>
                      <select
                        value={config.footer.position}
                        onChange={e => updateConfig('footer', { position: e.target.value as any })}
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={config.footer.includeSlideNumber}
                          onChange={e => updateConfig('footer', { includeSlideNumber: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-400">Include Slide Number</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={config.footer.includeDate}
                          onChange={e => updateConfig('footer', { includeDate: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-400">Include Date</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Font Size</label>
                        <input
                          type="number"
                          value={config.footer.fontSize}
                          onChange={e => updateConfig('footer', { fontSize: parseInt(e.target.value) })}
                          className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Color</label>
                        <input
                          type="color"
                          value={config.footer.color}
                          onChange={e => updateConfig('footer', { color: e.target.value })}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Background Section */}
            {activeSection === 'background' && (
              <div className="space-y-6">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.background.applyToAll}
                    onChange={e => updateConfig('background', { applyToAll: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-white">Apply Background to All Slides</span>
                </label>

                {config.background.applyToAll && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Background Color</label>
                      <div className="flex gap-3">
                        <input
                          type="color"
                          value={config.background.color || '#212121'}
                          onChange={e => updateConfig('background', { color: e.target.value })}
                          className="w-16 h-16 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.background.color || '#212121'}
                          onChange={e => updateConfig('background', { color: e.target.value })}
                          className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Fonts Section */}
            {activeSection === 'fonts' && (
              <div className="space-y-6">
                <h4 className="text-sm font-semibold text-gray-300">Default Typography</h4>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h5 className="text-xs text-gray-500 uppercase">Headings</h5>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Font Family</label>
                      <select
                        value={config.fonts.headingFont}
                        onChange={e => updateConfig('fonts', { headingFont: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="Rajdhani">Rajdhani</option>
                        <option value="Arial">Arial</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Times New Roman">Times New Roman</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Size: {config.fonts.headingSize}px</label>
                      <input
                        type="range"
                        min="16"
                        max="72"
                        value={config.fonts.headingSize}
                        onChange={e => updateConfig('fonts', { headingSize: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Color</label>
                      <input
                        type="color"
                        value={config.fonts.headingColor}
                        onChange={e => updateConfig('fonts', { headingColor: e.target.value })}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-xs text-gray-500 uppercase">Body Text</h5>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Font Family</label>
                      <select
                        value={config.fonts.bodyFont}
                        onChange={e => updateConfig('fonts', { bodyFont: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="Rajdhani">Rajdhani</option>
                        <option value="Arial">Arial</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Times New Roman">Times New Roman</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Size: {config.fonts.bodySize}px</label>
                      <input
                        type="range"
                        min="8"
                        max="32"
                        value={config.fonts.bodySize}
                        onChange={e => updateConfig('fonts', { bodySize: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Color</label>
                      <input
                        type="color"
                        value={config.fonts.bodyColor}
                        onChange={e => updateConfig('fonts', { bodyColor: e.target.value })}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Accent Bar Section */}
            {activeSection === 'accent' && (
              <div className="space-y-6">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.accentBar.enabled}
                    onChange={e => updateConfig('accentBar', { enabled: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-white">Show Accent Bar</span>
                </label>

                {config.accentBar.enabled && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Position</label>
                      <select
                        value={config.accentBar.position}
                        onChange={e => updateConfig('accentBar', { position: e.target.value as any })}
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="top">Top Only</option>
                        <option value="bottom">Bottom Only</option>
                        <option value="both">Both Top and Bottom</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Height: {config.accentBar.height} in</label>
                        <input
                          type="range"
                          min="0.02"
                          max="0.2"
                          step="0.02"
                          value={config.accentBar.height}
                          onChange={e => updateConfig('accentBar', { height: parseFloat(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Color</label>
                        <input
                          type="color"
                          value={config.accentBar.color}
                          onChange={e => updateConfig('accentBar', { color: e.target.value })}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Slide Numbers Section */}
            {activeSection === 'numbers' && (
              <div className="space-y-6">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.slideNumber.enabled}
                    onChange={e => updateConfig('slideNumber', { enabled: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-white">Show Slide Numbers</span>
                </label>

                {config.slideNumber.enabled && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Position</label>
                      <select
                        value={config.slideNumber.position}
                        onChange={e => updateConfig('slideNumber', { position: e.target.value as any })}
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-center">Bottom Center</option>
                        <option value="bottom-right">Bottom Right</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Format</label>
                      <select
                        value={config.slideNumber.format}
                        onChange={e => updateConfig('slideNumber', { format: e.target.value as any })}
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="number">1, 2, 3...</option>
                        <option value="number-of-total">1 of 10, 2 of 10...</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    {config.slideNumber.format === 'custom' && (
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Custom Format</label>
                        <input
                          type="text"
                          value={config.slideNumber.customFormat || ''}
                          onChange={e => updateConfig('slideNumber', { customFormat: e.target.value })}
                          placeholder="Slide n of total"
                          className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">Use curly braces n for slide number and total for total slides</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Font Size</label>
                        <input
                          type="number"
                          value={config.slideNumber.fontSize}
                          onChange={e => updateConfig('slideNumber', { fontSize: parseInt(e.target.value) })}
                          className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Color</label>
                        <input
                          type="color"
                          value={config.slideNumber.color}
                          onChange={e => updateConfig('slideNumber', { color: e.target.value })}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}