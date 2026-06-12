"use client";

import { usePlayerStore } from "@/store/playerStore";
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, ChevronDown, ListMusic, Heart, Volume2, Settings2 } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useRef, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";

export default function ExpandedPlayer() {
  const { 
    currentSong, isPlaying, progress, duration, 
    play, pause, resume, next, prev, seek,
    isShuffle, repeatMode, toggleShuffle, toggleRepeat,
    togglePlayerExpanded, volume, setVolume,
    playbackRate, setPlaybackRate,
    loopA, loopB, isLoopActive, setLoopMarker, toggleLoop,
    toggleQueue,
    crossfadeEnabled, crossfadeDuration, setCrossfade
  } = usePlayerStore();

  const waveformRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [draggingMarker, setDraggingMarker] = useState<'A' | 'B' | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current || !currentSong) return;

    if (wsRef.current) {
      wsRef.current.destroy();
    }

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#333333',
      progressColor: '#c4a090',
      cursorColor: 'transparent', // We'll manage cursor manually or let WaveSurfer do it via setTime
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 120,
      interact: false, // We use custom overlay for interaction
      normalize: true,
    });

    ws.setVolume(0); // Mute since Howler plays the audio
    
    // Catch AbortError which happens if destroyed before load finishes
    ws.load(currentSong.audioUrl).catch(err => {
      if (err.name !== 'AbortError') console.error('WaveSurfer load error:', err);
    });
    wsRef.current = ws;

    return () => {
      try {
        ws.destroy();
      } catch (err) {
        // Ignore AbortError on destroy
      }
    };
  }, [currentSong?.audioUrl]);

  // Sync WaveSurfer with Howler progress
  useEffect(() => {
    if (wsRef.current && duration > 0) {
      // Avoid seeking past duration
      const safeProgress = Math.min(progress, duration);
      wsRef.current.setTime(safeProgress);
    }
  }, [progress, duration]);

  // Handle Dragging Loop Markers
  useEffect(() => {
    if (!draggingMarker) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!overlayRef.current || !duration) return;
      const rect = overlayRef.current.getBoundingClientRect();
      let relativeX = (e.clientX - rect.left) / rect.width;
      relativeX = Math.max(0, Math.min(1, relativeX)); // Clamp between 0 and 1
      
      const time = relativeX * duration;
      
      // Prevent markers from crossing incorrectly
      if (draggingMarker === 'A' && loopB !== null && time > loopB - 0.5) {
        setLoopMarker('A', loopB - 0.5);
      } else if (draggingMarker === 'B' && loopA !== null && time < loopA + 0.5) {
        setLoopMarker('B', loopA + 0.5);
      } else {
        setLoopMarker(draggingMarker, time);
      }
    };

    const handlePointerUp = () => {
      setDraggingMarker(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggingMarker, duration, loopA, loopB, setLoopMarker]);

  const handleWaveformClick = (e: React.MouseEvent) => {
    if (draggingMarker) return; // Don't seek if we are dropping a marker
    if (!overlayRef.current || !duration) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) / rect.width;
    seek(relativeX * duration);
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  // Generate ticks for waveform
  const ticks = [];
  if (duration > 0) {
    for (let i = 0; i < duration; i += 30) {
      ticks.push(i);
    }
  }

  const fakeBPM = currentSong ? Math.floor(128 + (currentSong.duration % 40)) : 120;

  return (
    <div className="w-full h-full bg-[#0a0909] flex flex-col items-center justify-center relative overflow-hidden text-white font-sans animate-in fade-in duration-300">
      <div className="w-full max-w-[800px] flex flex-col h-full max-h-[90vh] relative z-10 px-6 py-4">
        
        {/* TOP BAR */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-[#2c2828] flex-shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={(e) => { e.stopPropagation(); togglePlayerExpanded(); }}
              className="p-2 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-md"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            {currentSong && (
              <div className="flex flex-col">
                <span className="text-sm font-bold uppercase tracking-widest text-[#c4a090]">Now Editing</span>
                <span className="text-xs text-gray-400 truncate w-64">{currentSong.title} — {currentSong.artist}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 relative">
            <button className="p-2 text-gray-400 hover:text-white transition-colors rounded">
              <Heart className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 transition-colors rounded ${showSettings ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'}`}
            >
              <Settings2 className="w-5 h-5" />
            </button>
            
            {showSettings && (
              <div className="absolute top-12 right-0 w-72 bg-[#181616] border border-[#2c2828] rounded-xl shadow-2xl p-4 z-50 flex flex-col gap-5 animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Playback Speed</span>
                  <div className="flex items-center bg-[#0a0909] border border-[#2c2828] rounded-full p-0.5">
                    {[0.5, 0.75, 1, 1.25, 1.5].map(rate => (
                      <button
                        key={rate}
                        onClick={() => setPlaybackRate(rate)}
                        className={`px-2 py-1 text-[10px] font-bold rounded-full transition-colors ${
                          playbackRate === rate ? 'bg-[#c4a090] text-white' : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Crossfade</span>
                  <div className="flex items-center gap-3">
                    {crossfadeEnabled && (
                      <div className="flex items-center gap-2">
                        <input 
                          type="range" min="1" max="8" step="1"
                          value={crossfadeDuration}
                          onChange={(e) => setCrossfade(true, parseInt(e.target.value))}
                          className="w-16 h-1 bg-[#2c2828] rounded-lg appearance-none cursor-pointer accent-[#c4a090]"
                        />
                        <span className="text-[10px] font-mono text-gray-500 w-3">{crossfadeDuration}s</span>
                      </div>
                    )}
                    <button 
                      onClick={() => setCrossfade(!crossfadeEnabled)}
                      className={`w-8 h-4 rounded-full flex items-center transition-colors ${crossfadeEnabled ? 'bg-[#c4a090]' : 'bg-[#2c2828]'}`}
                    >
                      <div className={`w-3 h-3 bg-white rounded-full transition-transform ${crossfadeEnabled ? 'translate-x-[18px]' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Loop A→B</span>
                  <button 
                    onClick={toggleLoop}
                    disabled={loopA === null || loopB === null}
                    className={`px-4 py-1 rounded-full text-xs font-bold border transition-all ${
                      isLoopActive 
                        ? 'border-[#c4a090] bg-[#c4a090]/10 text-[#c4a090]' 
                        : 'border-[#2c2828] text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
                    }`}
                  >
                    {isLoopActive ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {currentSong ? (
          <div className="flex flex-col flex-1 mt-6 justify-between gap-6">
            
            {/* WAVEFORM SECTION */}
            <div className="w-full relative flex-shrink-0">
              <div 
                ref={overlayRef}
                className="w-full h-[120px] relative cursor-text group"
                onPointerDown={handleWaveformClick}
              >
                {/* Custom Progress Cursor Line */}
                <div 
                  className="absolute top-0 bottom-0 w-[2px] bg-[#c4a090] z-20 pointer-events-none shadow-[0_0_8px_#c4a090]"
                  style={{ left: `${(progress / (duration || 1)) * 100}%` }}
                />
                
                {/* WaveSurfer Container */}
                <div ref={waveformRef} className="absolute inset-0 z-10 pointer-events-none" />

                {/* Marker A */}
                {loopA !== null && (
                  <div 
                    className="absolute top-0 bottom-0 w-[2px] bg-[#5bc4e8] z-30 cursor-ew-resize group/marker"
                    style={{ left: `${(loopA / duration) * 100}%` }}
                    onPointerDown={(e) => { e.stopPropagation(); setDraggingMarker('A'); }}
                  >
                    <div className="absolute top-0 -translate-x-1/2 -translate-y-full bg-[#5bc4e8] text-[#080808] text-[10px] font-bold px-1.5 py-0.5 rounded-t">
                      A
                    </div>
                  </div>
                )}

                {/* Marker B */}
                {loopB !== null && (
                  <div 
                    className="absolute top-0 bottom-0 w-[2px] bg-[#9060f0] z-30 cursor-ew-resize group/marker"
                    style={{ left: `${(loopB / duration) * 100}%` }}
                    onPointerDown={(e) => { e.stopPropagation(); setDraggingMarker('B'); }}
                  >
                    <div className="absolute top-0 -translate-x-1/2 -translate-y-full bg-[#9060f0] text-[#080808] text-[10px] font-bold px-1.5 py-0.5 rounded-t">
                      B
                    </div>
                  </div>
                )}
                
                {/* Active Loop Overlay Highlight */}
                {isLoopActive && loopA !== null && loopB !== null && (
                  <div 
                    className="absolute top-0 bottom-0 bg-white/10 z-0 pointer-events-none border-x border-white/20"
                    style={{ 
                      left: `${(loopA / duration) * 100}%`, 
                      width: `${((loopB - loopA) / duration) * 100}%` 
                    }}
                  />
                )}
              </div>

              {/* Time Ticks */}
              <div className="w-full h-6 relative mt-1 opacity-50">
                {ticks.map(tick => (
                  <div 
                    key={tick} 
                    className="absolute flex flex-col items-center -translate-x-1/2"
                    style={{ left: `${(tick / duration) * 100}%` }}
                  >
                    <div className="w-[1px] h-1.5 bg-gray-500 mb-0.5" />
                    <span className="text-[9px] font-mono text-gray-500">{formatTime(tick)}</span>
                  </div>
                ))}
              </div>

              {/* Marker Controls */}
              <div className="flex items-center gap-2 mt-2">
                <button 
                  onClick={() => setLoopMarker('A', progress)}
                  className={`px-3 py-1 text-xs font-bold rounded ${loopA !== null ? 'bg-[#5bc4e8]/20 text-[#5bc4e8]' : 'bg-[#2c2828] text-gray-400 hover:bg-[#2c2828]'}`}
                >
                  Set A
                </button>
                <button 
                  onClick={() => setLoopMarker('B', progress)}
                  className={`px-3 py-1 text-xs font-bold rounded ${loopB !== null ? 'bg-[#9060f0]/20 text-[#9060f0]' : 'bg-[#2c2828] text-gray-400 hover:bg-[#2c2828]'}`}
                >
                  Set B
                </button>
                {(loopA !== null || loopB !== null) && (
                  <button 
                    onClick={() => { setLoopMarker('A', null); setLoopMarker('B', null); if(isLoopActive) toggleLoop(); }}
                    className="px-3 py-1 text-xs text-gray-400 hover:text-red-400 hover:bg-white/5 rounded"
                  >
                    Clear Loop
                  </button>
                )}
              </div>
            </div>

            {/* SONG INFO ROW */}
            <div className="w-full bg-[#181616] border border-[#2c2828] rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <img src={currentSong.coverUrl} className="w-[80px] h-[80px] rounded-lg object-cover shadow-md flex-shrink-0" alt="Cover" />
                <div className="flex flex-col min-w-0">
                  <h3 className="text-[20px] font-bold text-white truncate leading-tight mb-1">{currentSong.title}</h3>
                  <Link href={`/artist/${currentSong.artistId || ''}`} className="text-[13px] text-[#c4a090] hover:underline truncate mb-1">
                    {currentSong.artist}
                  </Link>
                  <span className="text-[12px] text-gray-500 truncate">{currentSong.album || 'Single'}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-black bg-gray-300 px-2 py-0.5 rounded-sm">
                    {currentSong.genre || 'MIX'}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest border border-gray-600 text-gray-400 px-2 py-0.5 rounded-sm">
                    {fakeBPM} BPM
                  </span>
                </div>
                <span className="text-[11px] font-mono text-gray-500">128 kbps · MP3</span>
              </div>
            </div>

            {/* MAIN CONTROLS */}
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center justify-center gap-6">
                <button 
                  onClick={() => toggleShuffle()} 
                  className={`p-2 transition-colors ${isShuffle ? 'text-[#c4a090]' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <Shuffle className="w-5 h-5" />
                </button>
                
                <button onClick={() => prev(true)} className="text-gray-400 hover:text-white transition-colors">
                  <SkipBack className="w-7 h-7" fill="currentColor" />
                </button>
                
                {/* Rewind 10s */}
                <button 
                  onClick={() => seek(Math.max(0, progress - 10))} 
                  className="text-gray-400 hover:text-white transition-colors relative group"
                >
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <polyline points="7 2 3 5 7 8" />
                    <text x="12" y="16" fontSize="8" fontWeight="bold" stroke="none" fill="currentColor" textAnchor="middle">10</text>
                  </svg>
                </button>

                <button 
                  onClick={() => isPlaying ? pause() : resume()} 
                  className="w-14 h-14 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                >
                  {isPlaying ? <Pause className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6 ml-1" fill="currentColor" />}
                </button>

                {/* Forward 10s */}
                <button 
                  onClick={() => seek(Math.min(duration, progress + 10))} 
                  className="text-gray-400 hover:text-white transition-colors relative group"
                >
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11V9a4 4 0 0 0-4-4H3" />
                    <polyline points="17 2 21 5 17 8" />
                    <text x="12" y="16" fontSize="8" fontWeight="bold" stroke="none" fill="currentColor" textAnchor="middle">10</text>
                  </svg>
                </button>

                <button onClick={() => next(true)} className="text-gray-400 hover:text-white transition-colors">
                  <SkipForward className="w-7 h-7" fill="currentColor" />
                </button>
                
                <button 
                  onClick={() => toggleRepeat()} 
                  className={`p-2 relative transition-colors ${repeatMode !== 'off' ? 'text-[#c4a090]' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <Repeat className="w-5 h-5" />
                  {repeatMode === 'track' && <span className="absolute text-[8px] font-bold top-1.5 right-1.5 bg-[#080808] px-0.5 rounded">1</span>}
                </button>
              </div>
            </div>

            {/* BOTTOM CONTROLS ROW */}
            <div className="w-full flex items-center justify-between border-t border-[#2c2828] pt-4 mt-2">
              
              {/* Volume */}
              <div className="flex items-center gap-3 w-1/4">
                <Volume2 className="w-4 h-4 text-gray-400" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-24 h-1 bg-[#2c2828] rounded-lg appearance-none cursor-pointer accent-[#c4a090]"
                />
              </div>

              {/* BPM VISUALIZER */}
              <div className="flex-1 flex justify-center items-center gap-4">
                {isPlaying && (
                  <div className="flex items-end gap-[3px] h-6 px-4 py-1 bg-[#181616] rounded-lg border border-[#2c2828]">
                    {[1,2,3,4,5].map(i => (
                      <div 
                        key={i} 
                        className="w-[3px] bg-[#c4a090] rounded-t-sm" 
                        style={{ 
                          animation: `pulse ${(60 / fakeBPM) / playbackRate}s ease-in-out infinite alternate`,
                          animationDelay: `${i * 0.1}s`, 
                          height: `${30 + Math.random() * 70}%` 
                        }} 
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Queue */}
              <div className="flex items-center justify-end gap-6 w-1/4">
                <button 
                  onClick={() => {
                    usePlayerStore.getState().setDetailPanelTab("Queue");
                    if (!usePlayerStore.getState().isDetailPanelOpen) {
                      usePlayerStore.getState().toggleDetailPanel();
                    }
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <ListMusic className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 font-mono">
            [ NO AUDIO SOURCE SELECTED ]
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { transform: scaleY(0.4); opacity: 0.6; }
          100% { transform: scaleY(1); opacity: 1; }
        }
      `}} />
    </div>
  );
}
