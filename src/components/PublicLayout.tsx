"use client";

import TopNav from "./TopNav";
import PlayerBar from "./PlayerBar";
import SongDetailPanel from "./SongDetailPanel";
import ExpandedPlayer from "./ExpandedPlayer";
import { usePlayerStore } from "@/store/playerStore";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const isPlayerExpanded = usePlayerStore(state => state.isPlayerExpanded);

  return (
    <div className="flex flex-col h-screen bg-bg-primary overflow-hidden relative">
      <div className={`transition-all duration-500 ease-in-out flex flex-col ${isPlayerExpanded ? 'h-[50vh]' : 'h-full'}`}>
        {isPlayerExpanded && <ExpandedPlayer />}
        <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-500 ${isPlayerExpanded ? 'opacity-100' : 'opacity-100'}`}>
          <TopNav />
          <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
            {children}
          </main>
        </div>
      </div>
      <SongDetailPanel />
      <PlayerBar />
    </div>
  );
}
