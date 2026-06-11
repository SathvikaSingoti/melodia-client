"use client";

import { useState, useEffect } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { X, Heart, MoreHorizontal, Play, Radio } from "lucide-react";
import Link from "next/link";
import SongMenu from "./SongMenu";

export default function SongDetailPanel() {
  const { isDetailPanelOpen, toggleDetailPanel, detailSong, queue, play, currentSong, isPlaying, radioContext } = usePlayerStore();
  const [activeTab, setActiveTab] = useState<"NowPlaying" | "Queue">("NowPlaying");

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const panel = document.getElementById("song-detail-panel");
      if (usePlayerStore.getState().isDetailPanelOpen && panel && !panel.contains(e.target as Node)) {
        if (Date.now() - usePlayerStore.getState().lastDetailUpdate > 100) {
          usePlayerStore.getState().setDetailSong(null);
        }
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (!isDetailPanelOpen) return null;

  const displaySong = detailSong || currentSong;

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <aside id="song-detail-panel" className="w-80 bg-bg-secondary h-[calc(100vh-6rem)] flex flex-col fixed right-0 top-0 pt-4 border-l border-border z-30 shadow-2xl transition-transform duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-tertiary">
        <h2 className="text-lg font-bold text-white">Details</h2>
        <button 
          onClick={toggleDetailPanel}
          className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-6 pt-4 gap-6 border-b border-border">
        <button 
          onClick={() => setActiveTab("NowPlaying")}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === "NowPlaying" ? "border-primary text-primary" : "border-transparent text-gray-400 hover:text-white"}`}
        >
          Now Playing
        </button>
        <button 
          onClick={() => setActiveTab("Queue")}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === "Queue" ? "border-primary text-primary" : "border-transparent text-gray-400 hover:text-white"}`}
        >
          Queue
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        {activeTab === "NowPlaying" && displaySong && (
          <div className="p-6 flex flex-col items-center">
            <div className="w-[280px] h-[280px] rounded-xl overflow-hidden mb-6 shadow-2xl relative group">
              <img src={displaySong.coverUrl} className="w-full h-full object-cover" alt={displaySong.title} />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <button 
                  onClick={() => play(displaySong, queue)}
                  className="w-16 h-16 flex items-center justify-center rounded-full bg-white text-bg-primary hover:scale-105 transition-transform shadow-lg"
                >
                  <Play className="w-8 h-8 ml-1" fill="currentColor" />
                </button>
              </div>
            </div>

            <div className="w-full flex items-start justify-between mb-6">
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-2xl font-bold text-white truncate mb-1">{displaySong.title}</h3>
                {displaySong.artistId ? (
                  <Link href={`/artist/${displaySong.artistId}`} className="text-[#A8CFFF] hover:underline truncate block">
                    {displaySong.artist}
                  </Link>
                ) : (
                  <p className="text-gray-400 truncate">{displaySong.artist}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button className="text-gray-400 hover:text-[#FFD6A5] transition-colors">
                  <Heart className="w-6 h-6" />
                </button>
                <SongMenu song={displaySong} />
              </div>
            </div>

            <div className="w-full bg-bg-tertiary rounded-xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Album</span>
                <span className="text-white font-medium truncate max-w-[60%] text-right">{displaySong.album || displaySong.title}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Genre</span>
                <span className="text-white font-medium">{displaySong.genre}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Duration</span>
                <span className="text-white font-medium tabular-nums">{formatDuration(displaySong.duration)}</span>
              </div>
            </div>
          </div>
        )}
        {activeTab === "NowPlaying" && !displaySong && (
          <div className="flex h-full items-center justify-center p-6 text-center text-gray-500">
            Select a song to see details
          </div>
        )}

        {activeTab === "Queue" && (
          <div className="flex flex-col p-2">
            {radioContext && (
              <div className="px-3 py-4 mb-2 border-b border-[#2a2a2a] flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[#FFD6A5]">
                  <Radio className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Radio Station</span>
                </div>
                <div className="text-sm text-gray-400">Based on <span className="text-white">"{radioContext.title}"</span></div>
              </div>
            )}
            {queue.length > 0 ? (
              queue.map((song, i) => (
                <div 
                  key={`${song._id}-${i}`}
                  onClick={() => play(song, queue)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors group ${currentSong?._id === song._id ? 'bg-[rgba(168,207,255,0.1)]' : 'hover:bg-bg-tertiary'}`}
                >
                  <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 relative">
                    <img src={song.coverUrl} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white" fill="currentColor" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium truncate ${currentSong?._id === song._id ? 'text-primary' : 'text-white'}`}>
                      {song.title}
                    </h4>
                    <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                  </div>
                  <div className="text-xs text-gray-500 tabular-nums">
                    {formatDuration(song.duration)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-500">Queue is empty</div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
