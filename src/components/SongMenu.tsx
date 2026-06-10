"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { usePlayerStore, Song } from "@/store/playerStore";

interface Playlist {
  _id: string;
  name: string;
}

export default function SongMenu({ song }: { song: Song }) {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const addToQueue = usePlayerStore(state => state.addToQueue);

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
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddQueue = () => {
    addToQueue(song);
    setIsOpen(false);
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
          {showPlaylists ? (
            <>
              <button onClick={() => setShowPlaylists(false)} className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-bg-secondary flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                Back
              </button>
              <div className="border-t border-border my-1"></div>
              <div className="max-h-40 overflow-y-auto">
                {playlists.map(p => (
                  <button key={p._id} onClick={() => handleAddPlaylist(p._id)} className="w-full text-left px-4 py-2 text-sm text-white hover:bg-bg-secondary truncate">
                    {p.name}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setShowPlaylists(true)} className="w-full text-left px-4 py-2 text-sm text-white hover:bg-bg-secondary flex justify-between items-center">
                Add to playlist
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              </button>
              <button onClick={handleAddQueue} className="w-full text-left px-4 py-2 text-sm text-white hover:bg-bg-secondary">
                Add to queue
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
