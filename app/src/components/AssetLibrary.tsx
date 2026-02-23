'use client';

import { useState, useEffect, useRef } from 'react';

interface Asset {
  id: string;
  name: string;
  type: 'logo' | 'icon' | 'background' | 'chart' | 'image';
  category: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  url: string;
  created_at: string;
}

const ASSET_TYPES = [
  { value: 'logo', label: 'Logos' },
  { value: 'icon', label: 'Icons' },
  { value: 'background', label: 'Backgrounds' },
  { value: 'chart', label: 'Charts' },
  { value: 'image', label: 'Images' },
];

export default function AssetLibrary() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const fetchAssets = async () => {
    try {
      const url = selectedType ? `/api/assets?type=${selectedType}` : '/api/assets';
      const res = await fetch(url);
      const data = await res.json();
      setAssets(data.assets || []);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [selectedType]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);
        const type = detectAssetType(file.name);
        formData.append('type', type);
        
        const res = await fetch('/api/assets', {
          method: 'POST',
          body: formData
        });
        
        if (!res.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }
      await fetchAssets();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const detectAssetType = (filename: string): Asset['type'] => {
    const lower = filename.toLowerCase();
    if (lower.includes('logo')) return 'logo';
    if (lower.includes('icon')) return 'icon';
    if (lower.includes('bg') || lower.includes('background')) return 'background';
    if (lower.includes('chart') || lower.includes('graph')) return 'chart';
    return 'image';
  };

  const handleDelete = async (asset: Asset) => {
    if (!confirm(`Delete "${asset.name}"?`)) return;
    
    try {
      const res = await fetch(`/api/assets/${asset.id}/file`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setAssets(assets.filter(a => a.id !== asset.id));
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-[#1a1a1a] rounded-lg p-1 border border-gray-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-[#FEC00F] text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'list' ? 'bg-[#FEC00F] text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              List
            </button>
          </div>
        </div>
        
        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-[#FEC00F] hover:bg-yellow-400 text-[#212121] font-bold rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Type Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedType('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            selectedType === '' 
              ? 'bg-[#FEC00F] text-black' 
              : 'bg-[#1a1a1a] border border-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          All
        </button>
        {ASSET_TYPES.map(type => (
          <button
            key={type.value}
            onClick={() => setSelectedType(type.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedType === type.value 
                ? 'bg-[#FEC00F] text-black' 
                : 'bg-[#1a1a1a] border border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Upload Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          dragOver 
            ? 'border-[#FEC00F] bg-[#FEC00F]/10' 
            : 'border-gray-700 bg-[#1a1a1a]'
        }`}
      >
        <p className="text-gray-400 text-sm">Drag and drop files here, or click Upload</p>
        <p className="text-xs mt-1 text-gray-600">PNG, JPG, SVG, GIF</p>
      </div>

      {/* Asset Grid/List */}
      {loading ? (
        <div className="flex flex-col items-center py-12">
          <div className="w-8 h-8 border-2 border-[#FEC00F] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 mx-auto mb-3 bg-[#1a1a1a] rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No assets yet</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {assets.map(asset => (
            <div
              key={asset.id}
              className="group bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all"
            >
              {/* Preview */}
              <div className="aspect-square bg-[#0a0a0a] relative overflow-hidden">
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="w-full h-full object-contain"
                />
                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => window.open(asset.url, '_blank')}
                    className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100"
                    title="View"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(asset)}
                    className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                {/* Type Badge */}
                <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/70 text-white text-[9px] rounded capitalize">
                  {asset.type}
                </span>
              </div>
              
              {/* Info */}
              <div className="p-2.5">
                <p className="text-xs font-medium text-white truncate" title={asset.name}>{asset.name}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {asset.width && asset.height ? `${asset.width}x${asset.height}` : formatFileSize(asset.file_size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0a0a0a]">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-500 uppercase">Preview</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-500 uppercase">Size</th>
                <th className="px-4 py-3 text-right text-[10px] font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {assets.map(asset => (
                <tr key={asset.id} className="hover:bg-[#212121]">
                  <td className="px-4 py-3">
                    <img src={asset.url} alt={asset.name} className="w-10 h-10 object-contain rounded bg-[#0a0a0a]" />
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{asset.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-[#0a0a0a] text-gray-400 text-[10px] rounded capitalize">{asset.type}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{formatFileSize(asset.file_size)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(asset)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}