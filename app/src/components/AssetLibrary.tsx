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
  { value: 'logo', label: 'Logos', icon: '🏢' },
  { value: 'icon', label: 'Icons', icon: '⭐' },
  { value: 'background', label: 'Backgrounds', icon: '🎨' },
  { value: 'chart', label: 'Charts', icon: '📊' },
  { value: 'image', label: 'Images', icon: '🖼️' },
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
        // Auto-detect type from file name/folder
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
        <h2 className="text-2xl font-bold text-gray-900">Asset Library</h2>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
              }`}
            >
              List
            </button>
          </div>
          
          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Assets'}
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
      </div>

      {/* Type Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedType('')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            selectedType === '' 
              ? 'bg-gray-900 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Assets
        </button>
        {ASSET_TYPES.map(type => (
          <button
            key={type.value}
            onClick={() => setSelectedType(type.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedType === type.value 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type.icon} {type.label}
          </button>
        ))}
      </div>

      {/* Upload Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver 
            ? 'border-yellow-400 bg-yellow-50' 
            : 'border-gray-300 bg-gray-50'
        }`}
      >
        <div className="text-gray-500">
          <p className="text-lg font-medium">Drag and drop files here</p>
          <p className="text-sm mt-1">or click &quot;Upload Assets&quot; to browse</p>
          <p className="text-xs mt-2 text-gray-400">Supports: PNG, JPG, SVG, GIF</p>
        </div>
      </div>

      {/* Asset Grid/List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading assets...</div>
      ) : assets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No assets yet. Upload some files to get started.
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {assets.map(asset => (
            <div
              key={asset.id}
              className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Preview */}
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="w-full h-full object-contain"
                />
                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => window.open(asset.url, '_blank')}
                    className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100"
                    title="View full size"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(asset)}
                    className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                {/* Type Badge */}
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-gray-900/80 text-white text-xs rounded-full capitalize">
                  {asset.type}
                </span>
              </div>
              
              {/* Info */}
              <div className="p-3">
                <p className="font-medium text-gray-900 truncate" title={asset.name}>{asset.name}</p>
                <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                  <span>{asset.width && asset.height ? `${asset.width}x${asset.height}` : formatFileSize(asset.file_size)}</span>
                  <span className="capitalize">{asset.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Preview</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Size</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Dimensions</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {assets.map(asset => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <img src={asset.url} alt={asset.name} className="w-12 h-12 object-contain rounded bg-gray-100" />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{asset.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full capitalize">{asset.type}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatFileSize(asset.file_size)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {asset.width && asset.height ? `${asset.width} x ${asset.height}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(asset)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
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