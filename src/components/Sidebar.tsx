"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const getLinkClass = (path: string) => {
    const isActive = pathname.startsWith(path);
    return `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive 
        ? "text-white bg-bg-tertiary shadow-[inset_2px_0_0_0_rgba(168,85,247,1)]" 
        : "text-gray-400 hover:text-white hover:bg-bg-tertiary"
    }`;
  };

  return (
    <aside className="w-64 bg-bg-secondary h-screen flex flex-col fixed left-0 top-0 border-r border-border overflow-y-auto z-40">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-8">
          Melodia
        </h1>
        
        <nav className="space-y-4">
          <div className="space-y-1">
            <Link href="/explore" className={getLinkClass("/explore")}>
              Explore
            </Link>
            <Link href="/search" className={getLinkClass("/search")}>
              Search
            </Link>
            <Link href="/library" className={getLinkClass("/library")}>
              Library
            </Link>
          </div>
        </nav>
      </div>
    </aside>
  );
}
