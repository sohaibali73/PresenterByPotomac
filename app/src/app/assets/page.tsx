import AssetLibrary from '@/components/AssetLibrary';

export default function AssetsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-3">
              <img src="/potomac-logo.png" alt="Potomac" className="h-7 object-contain" />
              <span className="text-gray-400 text-sm font-light hidden sm:block">Presenter</span>
            </a>
            <nav className="hidden md:flex items-center gap-1">
              <a href="/" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Generate</a>
              <a href="/editor" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Editor</a>
              <a href="/templates" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Templates</a>
              <a href="/assets" className="px-3 py-1.5 text-sm text-[#FEC00F] font-medium rounded-lg bg-[#FEC00F]/10">Assets</a>
            </nav>
          </div>
          <a href="https://potomac.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#FEC00F] font-medium tracking-wide hover:text-yellow-300 transition-colors">potomac.com</a>
        </div>
      </header>

      <main className="pt-14">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Assets</h1>
          <AssetLibrary />
        </div>
      </main>
    </div>
  );
}