import AssetLibrary from '@/components/AssetLibrary';
import Link from 'next/link';

export default function AssetsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with navigation */}
      <header className="bg-[#212121] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <img src="/potomac-logo.png" alt="Potomac" className="h-8 object-contain" />
              <span className="text-gray-400 text-sm hidden sm:block">Presentation Generator</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Generate</Link>
              <Link href="/assets" className="px-3 py-1.5 text-sm text-[#FEC00F] font-medium">Assets</Link>
              <Link href="/templates" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Templates</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#FEC00F] text-xs font-medium tracking-wide">Built to Conquer Risk®</span>
            <img src="/potomac-icon.png" alt="" className="h-6 w-6 object-contain opacity-60" />
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AssetLibrary />
      </div>
    </div>
  );
}
