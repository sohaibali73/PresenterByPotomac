'use client';
import { useState, useEffect, useCallback } from 'react';

interface AssetItem {
  id: string;
  name: string;
  type: string;
  category: string;
  url: string;
  mime_type?: string;
  width?: number;
  height?: number;
  file_size?: number;
}

interface AssetPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (assets: AssetItem[]) => void;
  multiple?: boolean;
  typeFilter?: string;
}

export default function AssetPicker({ open, onClose, onSelect, multiple = true, typeFilter }: AssetPickerProps) {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState(typeFilter || '');
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set('type', filterType);
      if (filterCategory) params.set('category', filterCategory);
      const res = await fetch(`/api/assets?${params.toString()}`);
      const data = await res.json();
      setAssets(data.assets || []);
    } catch (e) {
      console.error('Failed to fetch assets:', e);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterCategory]);

  useEffect(() => {
    if (open) {
      fetchAssets();
      setSelected(new Set());
    }
  }, [open, fetchAssets]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!multiple) next.clear();
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const selectedAssets = assets.filter(a => selected.has(a.id));
    onSelect(selectedAssets);
    onClose();
  };

  const filteredAssets = assets.filter(a => {
    if (search) {
      return a.name.toLowerCase().includes(search.toLowerCase()) ||
             a.category.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const categories = Array.from(new Set(assets.map(a => a.category)));
  const types = Array.from(new Set(assets.map(a => a.type)));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl w-[800px] max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#FEC00F]">📁</span> Asset Library
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {selected.size > 0 ? `${selected.size} selected` : 'Select images to include in your presentation'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none p-1">✕</button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-gray-800/50 flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FEC00F]"
          />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-[#0a0a0a] border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#FEC00F]"
          >
            <option value="">All Types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-[#0a0a0a] border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#FEC00F]"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Asset Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#FEC00F] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-sm">No assets found</p>
              <p className="text-gray-600 text-xs mt-1">Upload assets in the <a href="/assets" className="text-[#FEC00F] underline">Asset Library</a></p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {filteredAssets.map(asset => {
                const isSelected = selected.has(asset.id);
                const isImage = asset.mime_type?.startsWith('image/');
                return (
                  <div
                    key={asset.id}
                    onClick={() => toggleSelect(asset.id)}
                    className={`relative rounded-xl overflow-hidden cursor-pointer transition-all border-2 group ${
                      isSelected
                        ? 'border-[#FEC00F] ring-2 ring-[#FEC00F]/30 scale-[0.97]'
                        : 'border-gray-800 hover:border-gray-600'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-square bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                      {isImage ? (
                        <img
                          src={asset.url}
                          alt={asset.name}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <div className="text-3xl text-gray-600">📄</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="px-2 py-1.5 bg-[#212121]">
                      <p className="text-[10px] text-white truncate font-medium">{asset.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[9px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{asset.type}</span>
                        <span className="text-[9px] text-gray-600">{asset.category}</span>
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#FEC00F] flex items-center justify-center">
                        <span className="text-black text-xs font-bold">✓</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-800 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {assets.length} asset{assets.length !== 1 ? 's' : ''} in library
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selected.size === 0}
              className="px-5 py-2 bg-[#FEC00F] text-[#212121] font-bold rounded-lg text-sm hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Add {selected.size > 0 ? `(${selected.size})` : ''} to Presentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
