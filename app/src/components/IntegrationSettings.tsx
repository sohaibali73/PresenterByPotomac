'use client';

import { useState } from 'react';

interface Integration {
  id: string;
  name: string;
  icon: string;
  description: string;
  connected: boolean;
  category: 'storage' | 'communication' | 'crm';
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'google-drive',
    name: 'Google Drive',
    icon: '📁',
    description: 'Sync presentations with Google Drive',
    connected: false,
    category: 'storage',
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    icon: '📘',
    description: 'Sync with Microsoft OneDrive',
    connected: false,
    category: 'storage',
  },
  {
    id: 'sharepoint',
    name: 'SharePoint',
    icon: '🏢',
    description: 'Share presentations via SharePoint',
    connected: false,
    category: 'storage',
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: '💬',
    description: 'Post notifications to Slack channels',
    connected: false,
    category: 'communication',
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    icon: '👥',
    description: 'Share presentations in Teams',
    connected: false,
    category: 'communication',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    icon: '🧡',
    description: 'Connect with HubSpot CRM',
    connected: false,
    category: 'crm',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    icon: '☁️',
    description: 'Integrate with Salesforce',
    connected: false,
    category: 'crm',
  },
];

interface IntegrationSettingsProps {
  open: boolean;
  onClose: () => void;
}

export default function IntegrationSettings({ open, onClose }: IntegrationSettingsProps) {
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [connecting, setConnecting] = useState<string | null>(null);

  const filteredIntegrations = activeCategory === 'all' 
    ? integrations 
    : integrations.filter(i => i.category === activeCategory);

  const handleConnect = async (integrationId: string) => {
    setConnecting(integrationId);
    
    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIntegrations(prev => prev.map(i => 
      i.id === integrationId ? { ...i, connected: !i.connected } : i
    ));
    setConnecting(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Integrations</h2>
            <p className="text-sm text-gray-500">Connect with your favorite tools</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-6 py-3 border-b border-gray-800">
          {[
            { id: 'all', label: 'All' },
            { id: 'storage', label: 'Storage' },
            { id: 'communication', label: 'Communication' },
            { id: 'crm', label: 'CRM' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-[#FEC00F] text-black'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Integrations list */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          <div className="grid gap-3">
            {filteredIntegrations.map(integration => (
              <div
                key={integration.id}
                className="flex items-center gap-4 p-4 bg-[#0a0a0a] rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center text-2xl">
                  {integration.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white">{integration.name}</h3>
                  <p className="text-xs text-gray-500">{integration.description}</p>
                </div>
                <button
                  onClick={() => handleConnect(integration.id)}
                  disabled={connecting === integration.id}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                    integration.connected
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  {connecting === integration.id ? (
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Connecting...
                    </span>
                  ) : integration.connected ? (
                    'Connected'
                  ) : (
                    'Connect'
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-800 bg-[#141414]">
          <p className="text-xs text-gray-500 text-center">
            Your data is secure. We only access what's necessary for the integration.
          </p>
        </div>
      </div>
    </div>
  );
}