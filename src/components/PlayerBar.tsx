"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { usePlayerStore } from "@/store/playerStore";
import { useAuth } from "@/context/AuthContext";
import { Song } from "@/store/playerStore";
import { Shuffle, Repeat, Repeat1, ChevronDown, Heart, ListMusic, MonitorSpeaker, Maximize2, PictureInPicture } from "lucide-react";
import Link from "next/link";

export default function PlayerBar() {
  const { 
    currentSong, isPlaying, progress, duration, 
    pause, resume, next, prev, seek, volume, setVolume, updateProgress,
    isShuffle, repeatMode, toggleShuffle, toggleRepeat,
    isPlayerExpanded, togglePlayerExpanded,
    isDetailPanelOpen, toggleDetailPanel, setDetailSong,
    isMiniPlayerOpen, toggleMiniPlayer
  } = usePlayerStore();

  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  
  const fsProgressBarRef = useRef<HTMLDivElement>(null);
  const fsVolumeBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && currentSong) {
      checkIfLiked();
    }
  }, [user, currentSong]);

  const checkIfLiked = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${user?._id}/liked`);
      const liked = res.data.some((s: Song) => s._id === currentSong?._id);
      setIsLiked(liked);
    } catch (error) {
      console.error("Failed to check liked status", error);
    }
  };

  // Log playback history when a new song starts
  useEffect(() => {
    if (user && currentSong) {
      axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/${user._id}/history`, {
        songId: currentSong._id,
        duration: currentSong.duration
      }).catch(console.error);
    }
  }, [user, currentSong?._id]);

  const toggleLike = async () => {
    if (!user || !currentSong) return;
    try {
      if (isLiked) {
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/users/${user._id}/liked/${currentSong._id}`);
        setIsLiked(false);
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/${user._id}/liked`, { songId: currentSong._id });
        setIsLiked(true);
      }
    } catch (error) {
      console.error("Failed to toggle like", error);
    }
  };

  // Sync local progress with store progress when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(progress);
    }
  }, [progress, isDragging]);

  // RequestAnimationFrame loop for smooth progress bar updates
  useEffect(() => {
    let animationFrameId: number;
    const updateLoop = () => {
      updateProgress();
      animationFrameId = requestAnimationFrame(updateLoop);
    };
    if (isPlaying) {
      animationFrameId = requestAnimationFrame(updateLoop);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, updateProgress]);

  if (!currentSong) return null; // Don't show player if no song is loaded

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(percent * duration);
    setLocalProgress(percent * duration);
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeBarRef.current) return;
    const rect = volumeBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(percent);
  };

  const handleFsProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!fsProgressBarRef.current) return;
    const rect = fsProgressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(percent * duration);
    setLocalProgress(percent * duration);
  };

  const handleFsVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!fsVolumeBarRef.current) return;
    const rect = fsVolumeBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(percent);
  };

  return (
    <>
      <div 
        onClick={togglePlayerExpanded}
        className="fixed bottom-0 left-0 right-0 h-24 bg-bg-primary border-t border-border z-50 flex items-center justify-between px-6 backdrop-blur-md bg-opacity-90 cursor-pointer hover:bg-bg-tertiary transition-colors"
      >
      {/* Song Info */}
      <div className="flex items-center gap-4 w-1/3">
        <div 
          onClick={(e) => { e.stopPropagation(); setDetailSong(currentSong); }}
          className="w-14 h-14 bg-bg-tertiary rounded shadow-lg overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          title="View Details"
        >
          <img src={currentSong.coverUrl} alt="Cover" className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0 pr-2">
          <h4 className="text-sm font-semibold text-white truncate" title={currentSong.title}>{currentSong.title}</h4>
          <div className="text-xs text-primary truncate" title={currentSong.artist}>
            {currentSong.artistId ? (
              <Link href={`/artist/${currentSong.artistId}`} onClick={(e) => e.stopPropagation()} className="hover:text-white hover:underline">{currentSong.artist}</Link>
            ) : currentSong.artist}
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); toggleLike(); }}
          className="p-2 text-gray-400 hover:text-white transition-colors ml-2"
        >
          <svg className={`w-5 h-5 ${isLiked ? 'text-secondary' : ''}`} fill="currentColor" viewBox="0 0 24 24">
            <path d={isLiked 
              ? "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              : "M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"}
            />
          </svg>
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center justify-center w-1/3 gap-2">
        <div className="flex items-center gap-6">
          <button 
            onClick={(e) => { e.stopPropagation(); toggleShuffle(); }} 
            className={`transition-colors p-2 ${isShuffle ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button onClick={(e) => { e.stopPropagation(); prev(true); }} className="text-gray-400 hover:text-white transition-colors">
            {/* Previous Icon */}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); isPlaying ? pause() : resume(); }} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:scale-105 transition-transform text-[#0e0d0d]"
          >
            {isPlaying ? (
               // Pause Icon
               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
               // Play Icon
               <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          
          <button onClick={(e) => { e.stopPropagation(); next(true); }} className="text-gray-400 hover:text-white transition-colors">
            {/* Next Icon */}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); toggleRepeat(); }} 
            className={`transition-colors p-2 ${repeatMode !== 'off' ? (repeatMode === 'track' ? 'text-secondary' : 'text-primary') : 'text-gray-400 hover:text-white'}`}
          >
            {repeatMode === 'track' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="w-full max-w-md flex items-center gap-3">
          <span className="text-xs text-gray-500 w-8 text-right">{formatTime(localProgress)}</span>
          <div 
            ref={progressBarRef}
            onClick={(e) => { e.stopPropagation(); handleProgressClick(e); }}
            className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden cursor-pointer relative group"
          >
            <div 
              className="h-full bg-gradient-to-r from-[#c4a090] to-[#d4b8ac] absolute left-0 top-0 bottom-0 pointer-events-none" 
              style={{ width: `${(localProgress / (duration || 1)) * 100}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-500 w-8">{formatTime(duration || currentSong.duration)}</span>
        </div>
      </div>

      {/* Extra Controls */}
      <div className="w-1/3 flex justify-end gap-6 items-center">
        {/* Volume */}
        <div className="flex items-center gap-2 group">
          <button onClick={(e) => { e.stopPropagation(); setVolume(volume === 0 ? 0.5 : 0); }} className="text-gray-400 hover:text-white transition-colors">
            {volume === 0 ? (
               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
            ) : (
               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            )}
          </button>
          <div 
            ref={volumeBarRef}
            onClick={(e) => { e.stopPropagation(); handleVolumeClick(e); }}
            className="w-24 h-1.5 bg-bg-tertiary rounded-full cursor-pointer relative"
          >
            <div 
              className="h-full bg-gray-400 group-hover:bg-primary transition-colors absolute left-0 top-0 bottom-0 pointer-events-none rounded-full"
              style={{ width: `${volume * 100}%` }}
            ></div>
          </div>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); toggleDetailPanel(); }}
          className={`transition-colors ${isDetailPanelOpen ? 'text-[#c4a090]' : 'text-gray-400 hover:text-white'}`}
          title="Queue & Details"
        >
          <ListMusic className="w-5 h-5" />
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); toggleMiniPlayer(); }}
          className={`transition-colors ${isMiniPlayerOpen ? 'text-[#c4a090]' : 'text-gray-400 hover:text-white'}`}
          title="Mini Player"
        >
          <PictureInPicture className="w-5 h-5" />
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); togglePlayerExpanded(); }}
          className="text-gray-400 hover:text-white transition-colors"
          title="Expand Player"
        >
          <ChevronDown className="w-5 h-5 transform rotate-180" />
        </button>
      </div>
    </div>
    </>
  );
}
