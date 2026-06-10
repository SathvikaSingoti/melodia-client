import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-bg-secondary h-screen flex flex-col fixed left-0 top-0 border-r border-border overflow-y-auto z-40">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-8">
          Melodia
        </h1>
        
        <nav className="space-y-4">
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Menu
            </p>
            <Link href="/explore" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-bg-tertiary hover:text-white hover:bg-bg-tertiary/80 transition-colors">
              Explore
            </Link>
            <Link href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-400 hover:text-white hover:bg-bg-tertiary transition-colors">
              Search
            </Link>
            <Link href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-400 hover:text-white hover:bg-bg-tertiary transition-colors">
              Library
            </Link>
          </div>
        </nav>
      </div>
    </aside>
  );
}
