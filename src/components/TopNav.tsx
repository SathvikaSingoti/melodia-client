"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, LogOut, BarChart2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUIStore } from "@/store/uiStore";
import { usePlayerStore } from "@/store/playerStore";

export default function TopNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const toggleShortcuts = useUIStore((state) => state.toggleShortcuts);
  const crossfadeEnabled = usePlayerStore(state => state.crossfadeEnabled);
  const crossfadeDuration = usePlayerStore(state => state.crossfadeDuration);
  const setCrossfade = usePlayerStore(state => state.setCrossfade);

  const TABS = [
    { label: "Discover", path: "/explore" },
    { label: "Search", path: "/search" },
    { label: "Time Machine", path: "/timeline" },
    { label: "Your Library", path: "/library" },
    { label: "Artists", path: "/artists" },
    { label: "Albums", path: "/albums" },
    { label: "Stats", path: "/stats", icon: <BarChart2 className="w-3.5 h-3.5 mr-1" /> }
  ];

  return (
    <nav id="top-nav" className="w-full h-[56px] flex items-center justify-between px-6 flex-shrink-0 z-50 relative" style={{ background: "#181616", borderBottom: "1px solid #2c2828" }}>
      {/* Left: Wordmark */}
      <div className="flex items-center">
        <Link 
          href="/explore" 
          className="font-[900] text-[22px] tracking-[-0.5px] bg-clip-text text-transparent" 
          style={{ backgroundImage: "linear-gradient(135deg, #c4a090, #a88070)" }}
        >
          Melodia
        </Link>
      </div>

      {/* Center: Tabs */}
      <div className="flex items-center gap-2">
        {TABS.map(tab => {
          const isActive = pathname === tab.path || (tab.path !== "/explore" && pathname.startsWith(tab.path));
          return (
            <Link 
              key={tab.path} 
              href={tab.path}
              className="text-[13px] px-4 py-[6px] rounded-md transition-all duration-150 ease-in hover:scale-105 relative"
              style={{
                color: isActive ? "#c4a090" : "#786870",
                fontWeight: isActive ? 600 : 400
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = "#ede8e4";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = "#786870";
              }}
            >
              <span className="flex items-center">
                {(tab as any).icon && (tab as any).icon}
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full" style={{ backgroundColor: "#c4a090" }} />
              )}
            </Link>
          );
        })}
      </div>

      {/* Right: Icons + Avatar */}
      <div className="flex items-center gap-4">
        <Link href="/search" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors group">
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline-flex items-center text-[10px] font-mono tracking-widest uppercase border border-gray-600 rounded px-1.5 py-0.5 group-hover:border-gray-400 transition-colors">
            ⌘K
          </span>
        </Link>
        <button 
          onClick={() => toggleShortcuts()}
          className="hidden sm:inline-flex items-center text-[10px] font-mono tracking-widest uppercase border border-gray-600 rounded px-2 py-1 text-gray-400 hover:text-white hover:border-gray-400 transition-colors"
          title="Keyboard Shortcuts"
        >
          ?
        </button>
        <div className="relative group/bell">
          <button className="text-gray-400 hover:text-white transition-colors relative">
            <Bell className="w-4 h-4" />
          </button>
          <div className="absolute right-0 top-full mt-2 w-48 rounded-lg shadow-xl opacity-0 invisible group-hover/bell:opacity-100 group-hover/bell:visible transition-all z-50 p-4 flex flex-col items-center justify-center gap-2" style={{ backgroundColor: "#181616", border: "1px solid #2c2828" }}>
            <Bell className="w-6 h-6" style={{ color: "#c4a090" }} />
            <p className="text-sm text-center" style={{ color: "#ede8e4" }}>No new notifications</p>
          </div>
        </div>

        <div className="relative group/avatar">
          <button 
            className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[12px] font-bold overflow-hidden"
            style={{ border: "1px solid #c4a09044", color: "#c4a090" }}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user?.username?.[0]?.toUpperCase()
            )}
          </button>
          
          <div className="absolute right-0 top-full mt-2 w-56 bg-bg-tertiary border border-border rounded-lg shadow-xl opacity-0 invisible group-hover/avatar:opacity-100 group-hover/avatar:visible transition-all z-50 py-1">
            <div className="px-4 py-2 border-b border-border mb-1">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Playback Quality</div>
              <div className="flex items-center justify-between group">
                <span className="text-sm text-gray-300">Crossfade</span>
                <button 
                  onClick={() => setCrossfade(!crossfadeEnabled)}
                  className={`w-8 h-4 rounded-full flex items-center transition-colors ${crossfadeEnabled ? 'bg-[#c4a090]' : 'bg-gray-600'}`}
                >
                  <div className={`w-3 h-3 bg-white rounded-full transition-transform ${crossfadeEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
              </div>
              {crossfadeEnabled && (
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="range" 
                    min="1" max="8" step="1" 
                    value={crossfadeDuration}
                    onChange={(e) => setCrossfade(true, parseInt(e.target.value))}
                    className="w-full accent-[#c4a090]"
                  />
                  <span className="text-xs text-gray-400 w-4">{crossfadeDuration}s</span>
                </div>
              )}
            </div>

            <Link href="/profile" className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-bg-secondary flex items-center gap-2">
              Profile
            </Link>
            <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-bg-secondary flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
