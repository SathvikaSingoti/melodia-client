"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import TopNav from "./TopNav";
import PlayerBar from "./PlayerBar";
import SongDetailPanel from "./SongDetailPanel";
import ExpandedPlayer from "./ExpandedPlayer";
import { usePlayerStore } from "@/store/playerStore";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const isPlayerExpanded = usePlayerStore(state => state.isPlayerExpanded);

  useEffect(() => {
    if (!isLoading && !token) {
      router.push("/login");
    }
  }, [token, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!token) {
    return null; // Will redirect in useEffect
  }

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
