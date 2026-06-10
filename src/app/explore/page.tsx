"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

interface Song {
  _id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  mood: string;
  duration: number;
  coverUrl: string;
  plays: number;
}

const GENRES = ["All", "Pop", "Hip-Hop", "R&B", "Indie", "Electronic"];

export default function ExplorePage() {
  const { user, logout } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState("All");

  useEffect(() => {
    fetchSongs(activeGenre);
  }, [activeGenre]);

  const fetchSongs = async (genre: string) => {
    setLoading(true);
    try {
      const url = genre === "All" 
        ? `${process.env.NEXT_PUBLIC_API_URL}/songs`
        : `${process.env.NEXT_PUBLIC_API_URL}/songs?genre=${encodeURIComponent(genre)}`;
      
      const res = await axios.get(url);
      setSongs(res.data);
    } catch (error) {
      console.error("Failed to fetch songs", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <ProtectedRoute>
      <div className="p-8 max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Explore</h2>
            <p className="text-gray-400">Discover new music tailored to your taste.</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">Welcome, {user?.username}</span>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-bg-tertiary border border-border hover:bg-bg-tertiary/80 transition-colors text-sm font-medium"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Filter Pills */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {GENRES.map(genre => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeGenre === genre 
                  ? "bg-primary text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]" 
                  : "bg-bg-tertiary text-gray-300 hover:bg-bg-tertiary/80 hover:text-white"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Songs Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-20 text-gray-400 glass-panel">
            No songs found for this genre.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {songs.map((song) => (
              <div 
                key={song._id} 
                className="group relative bg-bg-secondary p-4 rounded-xl border border-border hover:border-primary/50 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] cursor-pointer"
              >
                <div className="relative aspect-square mb-4 overflow-hidden rounded-lg">
                  <img 
                    src={song.coverUrl} 
                    alt={song.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="w-12 h-12 flex items-center justify-center rounded-full bg-primary text-white hover:scale-105 transition-transform shadow-lg">
                      <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                  </div>
                </div>
                
                <h3 className="font-semibold text-white truncate mb-1" title={song.title}>
                  {song.title}
                </h3>
                <p className="text-sm text-gray-400 truncate mb-3" title={song.artist}>
                  {song.artist}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="bg-bg-tertiary px-2 py-1 rounded-md">{song.genre}</span>
                  <span>{formatDuration(song.duration)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
