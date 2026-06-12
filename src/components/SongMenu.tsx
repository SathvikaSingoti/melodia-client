"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { usePlayerStore, Song } from "@/store/playerStore";
import toast from "react-hot-toast";

import { useRouter } from "next/navigation";
import { Radio, MinusCircle, HeartOff } from "lucide-react";

interface Playlist {
  _id: string;
  name: string;
}

export default function SongMenu({ 
  song, 
  onRemovePlaylist,
  onRemoveLiked,
  onRemoveQueue
}: { 
  song: Song, 
  onRemovePlaylist?: () => void,
  onRemoveLiked?: () => void,
  onRemoveQueue?: () => void
}) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [openRight, setOpenRight] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  
  const addToQueue = usePlayerStore(state => state.addToQueue);
  const startRadio = usePlayerStore(state => state.startRadio);
  const [isStartingRadio, setIsStartingRadio] = useState(false);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowPlaylists(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (showPlaylists && submenuRef.current) {
      const rect = submenuRef.current.getBoundingClientRect();
      // If it overflows the left window edge, flip it right
      if (rect.left < 20) {
        setOpenRight(true);
      } else {
        setOpenRight(false);
      }
    }
  }, [showPlaylists]);

  const loadPlaylists = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${user._id}/playlists`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlaylists(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPlaylist = async (playlistId: string) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/playlists/${playlistId}/songs`, { songId: song._id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsOpen(false);
      setShowPlaylists(false);
      toast.success("Added to playlist ✓");
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddQueue = () => {
    addToQueue(song);
    setIsOpen(false);
  };

  const handleStartRadio = async () => {
    if (!token) {
      toast.error("Please login to use AI radio");
      return;
    }
    
    setIsOpen(false);
    setIsStartingRadio(true);
    const loadingToast = toast.loading(`Building radio for ${song.title}...`);
    
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/ai/radio`, 
        { songId: song._id },
        { headers: { Authorization: `Bearer ${localStorage.getItem("melodia_token")}` } }
      );
      
      const radioQueue = res.data;
      if (radioQueue && radioQueue.length > 0) {
        startRadio(song, radioQueue);
        toast.success("Radio ready ✓", { id: loadingToast });
      } else {
        toast.error("Could not build radio", { id: loadingToast });
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to build radio", { id: loadingToast });
    } finally {
      setIsStartingRadio(false);
    }
  };

  return (
    <div className="relative ml-2" ref={menuRef}>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); if (!isOpen) loadPlaylists(); }}
        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-white transition-opacity"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-bg-tertiary border border-border rounded-lg shadow-xl z-[100] py-1" onClick={e => e.stopPropagation()}>
          <div 
            className="relative group/playlist"
            onMouseEnter={() => setShowPlaylists(true)}
            onMouseLeave={() => setShowPlaylists(false)}
          >
            <button className="w-full text-left px-4 py-2 text-sm text-white hover:bg-bg-secondary flex justify-between items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              <span className="flex-1">Add to playlist</span>
            </button>
            
            {/* Submenu for playlists */}
            <div 
              ref={submenuRef}
              className={`absolute ${openRight ? 'left-full ml-1' : 'right-full mr-1'} top-0 w-48 bg-bg-tertiary border border-border rounded-lg shadow-xl py-1 opacity-0 invisible group-hover/playlist:opacity-100 group-hover/playlist:visible transition-all max-h-64 overflow-y-auto no-scrollbar`}
            >
              {playlists.length > 0 ? (
                <>
                  {playlists.map(p => (
                    <button key={p._id} onClick={() => handleAddPlaylist(p._id)} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-bg-secondary truncate">
                      {p.name}
                    </button>
                  ))}
                </>
              ) : (
                <div className="px-4 py-2 text-sm text-gray-500 italic">No playlists found</div>
              )}
            </div>
          </div>
          
          <button 
            onClick={() => {
              const url = song.artistId ? `/artist/${song.artistId}` : `/search?q=${encodeURIComponent(song.artist)}`;
              router.push(url);
              setIsOpen(false);
            }} 
            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-bg-secondary"
          >
            Go to artist
          </button>
          
          <button onClick={handleAddQueue} className="w-full text-left px-4 py-2 text-sm text-white hover:bg-bg-secondary">
            Add to queue
          </button>

          <button 
            onClick={handleStartRadio} 
            disabled={isStartingRadio}
            className="w-full text-left px-4 py-2 text-sm text-[#c4a090] hover:bg-bg-secondary flex justify-between items-center"
          >
            {isStartingRadio ? "Starting..." : "Start radio"}
            <Radio className="w-4 h-4 ml-2" />
          </button>
          
          {onRemovePlaylist && (
            <button onClick={() => { onRemovePlaylist(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-bg-secondary hover:text-red-300 flex items-center">
              <MinusCircle className="w-4 h-4 mr-2" />
              Remove from playlist
            </button>
          )}
          {onRemoveLiked && (
            <button onClick={() => { onRemoveLiked(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-bg-secondary hover:text-red-300 flex items-center">
              <HeartOff className="w-4 h-4 mr-2" />
              Remove from liked
            </button>
          )}
          {onRemoveQueue && (
            <button onClick={() => { onRemoveQueue(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-bg-secondary hover:text-red-300 flex items-center">
              <MinusCircle className="w-4 h-4 mr-2" />
              Remove from queue
            </button>
          )}
        </div>
      )}
    </div>
  );
}
