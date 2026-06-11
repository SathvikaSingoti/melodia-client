"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getLinkClass = (path: string) => {
    const isActive = pathname.startsWith(path);
    return `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive 
        ? "text-white bg-bg-tertiary shadow-[inset_2px_0_0_0_rgba(168,207,255,1)]" 
        : "text-gray-400 hover:text-white hover:bg-bg-tertiary"
    }`;
  };

  return (
    <aside className="w-64 bg-bg-secondary h-screen flex flex-col fixed left-0 top-0 border-r border-border z-40">
      <div className="p-6 flex-1 overflow-y-auto">
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

      {user && (
        <div className="p-6 border-t border-border mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-full bg-bg-primary flex items-center justify-center text-primary font-bold text-sm border border-border">
              {user.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{user.username}</p>
              <p className="text-xs text-gray-400 truncate">Free Plan</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-tertiary border border-border hover:bg-bg-tertiary/80 transition-colors text-sm font-medium text-gray-300 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Log out
          </button>
        </div>
      )}
    </aside>
  );
}
