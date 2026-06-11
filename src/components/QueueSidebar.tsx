"use client";

import { usePlayerStore } from "@/store/playerStore";
import { X } from "lucide-react";

export default function QueueSidebar() {
  const { isQueueOpen, toggleQueue, queue, currentSong, play } = usePlayerStore();

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const clearQueue = () => {
    usePlayerStore.setState({ queue: currentSong ? [currentSong] : [] });
  };

  // Find index of current song to know what's coming up next
  const currentIndex = currentSong ? queue.findIndex(s => s._id === currentSong._id) : -1;
  const upcomingSongs = currentIndex !== -1 ? queue.slice(currentIndex + 1) : queue;

  return (
    <div 
      className={`fixed top-0 right-0 h-[calc(100vh-96px)] w-[320px] bg-[#0c1220] border-l border-[rgba(168,207,255,0.1)] z-40 transform transition-transform duration-300 ease-in-out ${isQueueOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}
    >
      <div className="p-6 pb-4 flex items-center justify-between border-b border-[rgba(168,207,255,0.05)] flex-shrink-0">
        <h2 className="text-xl font-bold text-white">Now Playing Queue</h2>
        <button onClick={toggleQueue} className="text-gray-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {currentSong && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider px-2">Now Playing</h3>
            <div className="flex items-center gap-3 p-2 bg-primary/5 rounded-lg border-l-2 border-[#A8CFFF]">
              <img src={currentSong.coverUrl} alt={currentSong.title} className="w-10 h-10 rounded object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white truncate">{currentSong.title}</h4>
                <p className="text-xs text-gray-400 truncate">{currentSong.artist}</p>
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {formatTime(currentSong.duration)}
              </div>
            </div>
          </div>
        )}

        {upcomingSongs.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider px-2">Up Next</h3>
            <div className="flex flex-col gap-1">
              {upcomingSongs.map((song, index) => (
                <div 
                  key={`${song._id}-${index}`}
                  onClick={() => play(song, queue)}
                  className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors group hover:bg-bg-tertiary border-l-2 border-transparent"
                >
                  <img src={song.coverUrl} alt={song.title} className="w-8 h-8 rounded object-cover flex-shrink-0 opacity-80 group-hover:opacity-100" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm truncate text-gray-300 group-hover:text-white">
                      {song.title}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">{song.artist}</p>
                  </div>
                  <div className="text-xs text-gray-500 hidden group-hover:block transition-all">
                    {formatTime(song.duration)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {upcomingSongs.length === 0 && !currentSong && (
          <div className="text-center text-gray-500 mt-10">
            Queue is empty
          </div>
        )}
      </div>

      {upcomingSongs.length > 0 && (
        <div className="p-4 border-t border-[rgba(168,207,255,0.05)] flex-shrink-0">
          <button 
            onClick={clearQueue}
            className="w-full py-2 rounded-lg text-sm font-medium text-gray-400 border border-gray-700 hover:text-white hover:border-gray-500 transition-colors"
          >
            Clear queue
          </button>
        </div>
      )}
    </div>
  );
}
