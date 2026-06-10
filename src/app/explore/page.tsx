"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { usePlayerStore, Song } from "@/store/playerStore";
import SongMenu from "@/components/SongMenu";

const GENRES = ["All", "Pop", "Hip-Hop", "R&B", "Indie", "Electronic"];

const MOODS = [
  { mood: "Chill", emoji: "🌿" },
  { mood: "Energetic", emoji: "⚡" },
  { mood: "Happy", emoji: "😊" }
];

export default function ExplorePage() {
  const { user, logout } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState("All");
  
  const [moodOfTheDay, setMoodOfTheDay] = useState<{mood: string, emoji: string} | null>(null);
  const [activeMood, setActiveMood] = useState<string | null>(null);

  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Generate random mood on mount
    const randomMood = MOODS[Math.floor(Math.random() * MOODS.length)];
    setMoodOfTheDay(randomMood);
    // Auto-filter by this mood initially as per requirements
    setActiveMood(randomMood.mood);
  }, []);

  useEffect(() => {
    fetchSongs(activeGenre);
    if (user) {
      fetchLikedSongs();
    }
  }, [activeGenre, user]);

  const displayedSongs = songs.filter(song => !activeMood || song.mood === activeMood);

  const fetchLikedSongs = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${user?._id}/liked`);
      const ids = new Set<string>(res.data.map((s: Song) => s._id));
      setLikedSongIds(ids);
    } catch (error) {
      console.error("Failed to fetch liked songs", error);
    }
  };

  const toggleLike = async (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    if (!user) return;
    
    const isLiked = likedSongIds.has(songId);
    try {
      if (isLiked) {
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/users/${user._id}/liked/${songId}`);
        setLikedSongIds(prev => {
          const next = new Set(prev);
          next.delete(songId);
          return next;
        });
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/${user._id}/liked`, { songId });
        setLikedSongIds(prev => {
          const next = new Set(prev);
          next.add(songId);
          return next;
        });
      }
    } catch (error) {
      console.error("Failed to toggle like", error);
    }
  };

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
              onClick={() => { setActiveGenre(genre); setActiveMood(null); }}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeGenre === genre && !activeMood
                  ? "bg-primary text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]" 
                  : "bg-bg-tertiary text-gray-300 hover:bg-bg-tertiary/80 hover:text-white"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Mood of the Day Banner */}
        {moodOfTheDay && (
          <div 
            onClick={() => setActiveMood(activeMood === moodOfTheDay.mood ? null : moodOfTheDay.mood)}
            className={`mb-8 p-6 rounded-2xl cursor-pointer transition-all border ${
              activeMood === moodOfTheDay.mood 
                ? "bg-gradient-to-r from-primary/20 to-secondary/20 border-primary" 
                : "bg-bg-secondary border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="text-5xl">{moodOfTheDay.emoji}</div>
              <div>
                <h3 className="text-sm font-bold tracking-widest text-primary uppercase mb-1">Mood of the Day</h3>
                <p className="text-xl font-semibold text-white">Feeling {moodOfTheDay.mood}?</p>
                <p className="text-sm text-gray-400 mt-1">
                  {activeMood === moodOfTheDay.mood ? "Currently filtering by this mood. Click to clear." : "Click to instantly filter your feed for this vibe."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Songs Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : displayedSongs.length === 0 ? (
          <div className="text-center py-20 text-gray-400 glass-panel">
            No songs found.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {displayedSongs.map((song) => (
              <div 
                key={song._id} 
                onClick={() => usePlayerStore.getState().play(song, displayedSongs)}
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
                  {usePlayerStore.getState().currentSong?._id === song._id && usePlayerStore.getState().isPlaying && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-1">
                      <div className="w-1.5 bg-primary rounded-full animate-[equalizer_1s_ease-in-out_infinite]"></div>
                      <div className="w-1.5 bg-primary rounded-full animate-[equalizer_1.2s_ease-in-out_infinite_0.2s]"></div>
                      <div className="w-1.5 bg-primary rounded-full animate-[equalizer_0.8s_ease-in-out_infinite_0.4s]"></div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-start justify-between">
                  <div className="min-w-0 pr-2">
                    <h3 className="font-semibold text-white truncate mb-1" title={song.title}>
                      {song.title}
                    </h3>
                    <p className="text-sm text-gray-400 truncate mb-3" title={song.artist}>
                      {song.artist}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => toggleLike(e, song._id)}
                      className="p-1 -mt-1 -mr-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className={`w-5 h-5 ${likedSongIds.has(song._id) ? 'text-primary' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d={likedSongIds.has(song._id) 
                          ? "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                          : "M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"}
                        />
                      </svg>
                    </button>
                    <div className="-mt-1">
                      <SongMenu song={song} />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
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
