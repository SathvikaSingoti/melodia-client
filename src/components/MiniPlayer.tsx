"use client";

import { usePlayerStore } from "@/store/playerStore";
import { Play, Pause, SkipBack, SkipForward, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function MiniPlayer() {
  const { 
    currentSong, isPlaying, progress, duration, 
    play, pause, resume, next, prev, 
    isMiniPlayerOpen, setMiniPlayerOpen, togglePlayerExpanded
  } = usePlayerStore();

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isMiniPlayerOpen && currentSong) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isMiniPlayerOpen, currentSong]);

  // Handle auto-show logic based on scrolling and time
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    let timeOnPage = 0;

    const timer = setInterval(() => {
      timeOnPage += 1;
    }, 1000);

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      
      // If user scrolled down substantially and has been on page for 30s
      if (window.scrollY > 300 && timeOnPage > 30 && currentSong && !isMiniPlayerOpen) {
        scrollTimeout = setTimeout(() => {
          setMiniPlayerOpen(true);
        }, 500); // Debounce to trigger after they pause scrolling
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      clearInterval(timer);
      clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentSong, isMiniPlayerOpen, setMiniPlayerOpen]);

  if (!currentSong) return null;

  return (
    <div 
      className={`fixed bottom-[100px] right-[20px] z-[60] w-[280px] h-[72px] bg-[#181616] rounded-[14px] border border-[#2c2828] shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden transition-all duration-250 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-[20px] opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex-1 flex items-center px-3 py-2 gap-3 relative">
        <button 
          onClick={togglePlayerExpanded} 
          className="w-[44px] h-[44px] rounded-[6px] overflow-hidden flex-shrink-0 relative group"
        >
          <img src={currentSong.coverUrl} className="w-full h-full object-cover" alt="" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
          </div>
        </button>

        <div className="flex flex-col min-w-0 flex-1 cursor-pointer" onClick={togglePlayerExpanded}>
          <div className="text-[12px] font-bold text-white truncate">{currentSong.title}</div>
          <div className="text-[10px] text-gray-400 truncate">{currentSong.artist}</div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => prev(true)} className="text-gray-400 hover:text-white transition-colors">
            <SkipBack className="w-[18px] h-[18px]" fill="currentColor" />
          </button>
          <button 
            onClick={() => isPlaying ? pause() : resume()} 
            className="w-[28px] h-[28px] rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause className="w-[14px] h-[14px]" fill="currentColor" /> : <Play className="w-[14px] h-[14px] ml-0.5" fill="currentColor" />}
          </button>
          <button onClick={() => next(true)} className="text-gray-400 hover:text-white transition-colors">
            <SkipForward className="w-[18px] h-[18px]" fill="currentColor" />
          </button>
        </div>

        <button 
          onClick={() => setMiniPlayerOpen(false)}
          className="absolute top-1.5 right-1.5 p-1 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-[12px] h-[12px]" />
        </button>
      </div>

      {/* Thin Seekbar */}
      <div className="w-full h-[2px] bg-[#1a1a1a]">
        <div 
          className="h-full bg-[#c4a090]" 
          style={{ width: `${(progress / (duration || 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
