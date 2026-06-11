"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import debounce from "lodash.debounce";
import ProtectedRoute from "@/components/ProtectedRoute";
import { usePlayerStore, Song } from "@/store/playerStore";
import { useAuth } from "@/context/AuthContext";
import SongMenu from "@/components/SongMenu";

const GENRES = [
  { name: "Pop", emoji: "🎤", style: "bg-[rgba(168,207,255,0.08)] border-[#A8CFFF]" },
  { name: "Hip-Hop", emoji: "🎧", style: "bg-[rgba(255,214,165,0.08)] border-[#FFD6A5]" },
  { name: "R&B", emoji: "💜", style: "bg-[rgba(201,184,255,0.08)] border-[#C9B8FF]" },
  { name: "Indie", emoji: "🌿", style: "bg-[rgba(168,237,203,0.08)] border-[#A8EDCB]" },
  { name: "Electronic", emoji: "⚡", style: "bg-[rgba(168,207,255,0.06)] border-[#A8CFFF]" },
  { name: "Rock", emoji: "🎸", style: "bg-[rgba(255,214,165,0.08)] border-[#FFD6A5]" },
  { name: "Jazz", emoji: "🎷", style: "bg-[rgba(201,184,255,0.08)] border-[#C9B8FF]" },
  { name: "Classical", emoji: "🎻", style: "bg-[rgba(168,237,203,0.08)] border-[#A8EDCB]" }
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(new Set());
  
  const [allSongs, setAllSongs] = useState<Song[]>([]);

  const { user } = useAuth();
  const play = usePlayerStore(state => state.play);
  const currentSong = usePlayerStore(state => state.currentSong);
  const isPlaying = usePlayerStore(state => state.isPlaying);

  useEffect(() => {
    if (user) {
      fetchLikedSongs();
    }
    // Fetch all songs for artists empty state
    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/songs`).then(res => setAllSongs(res.data));
  }, [user]);

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

  const searchSongs = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/songs/search?q=${encodeURIComponent(searchQuery)}`);
      setResults(res.data);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((q: string) => {
      searchSongs(q);
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setLoading(true);
    debouncedSearch(e.target.value);
  };
  
  const handleGenreClick = (genre: string) => {
    setQuery(genre);
    setLoading(true);
    debouncedSearch(genre);
  };

  const filteredResults = results.filter(song => {
    if (filter === "All") return true;
    if (filter === "Artist") return song.artist.toLowerCase().includes(query.toLowerCase());
    if (filter === "Genre") return song.genre.toLowerCase().includes(query.toLowerCase());
    return true;
  });

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Derive unique artists
  const artistsMap = new Map<string, {count: number, coverUrl: string}>();
  allSongs.forEach(s => {
    const current = artistsMap.get(s.artist);
    if (current) {
      current.count += 1;
    } else {
      artistsMap.set(s.artist, { count: 1, coverUrl: s.coverUrl });
    }
  });
  const topArtists = Array.from(artistsMap.entries()).map(([name, data]) => ({ name, ...data })).slice(0, 6);

  return (
    <ProtectedRoute>
      <div className="p-8 max-w-5xl mx-auto pb-32">
        <div className="mb-10">
          <input
            type="text"
            value={query}
            onChange={handleSearchChange}
            placeholder="What do you want to listen to?"
            className="w-full bg-bg-secondary text-white text-lg rounded-full py-4 px-6 border-2 border-border focus:border-primary focus:outline-none transition-colors shadow-lg placeholder-gray-500"
          />
        </div>

        {query ? (
          <>
            <div className="flex gap-3 mb-6">
              {["All", "Artist", "Genre"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    filter === f 
                      ? "border-[1.5px] border-primary text-primary bg-primary/10" 
                      : "bg-bg-tertiary text-gray-300 hover:bg-bg-tertiary/80 hover:text-white border-[1.5px] border-transparent"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredResults.length > 0 ? (
              <div className="flex flex-col gap-2">
                {filteredResults.map(song => (
                  <div 
                    key={song._id}
                    onClick={() => play(song, filteredResults)}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-bg-secondary group cursor-pointer transition-colors border border-transparent hover:border-border"
                  >
                    <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                      <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-bg-primary hover:scale-105 transition-transform shadow-lg">
                          <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </button>
                      </div>
                      {currentSong?._id === song._id && isPlaying && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-0.5">
                          <div className="w-1 bg-primary rounded-full animate-[equalizer_1s_ease-in-out_infinite]"></div>
                          <div className="w-1 bg-primary rounded-full animate-[equalizer_1.2s_ease-in-out_infinite_0.2s]"></div>
                          <div className="w-1 bg-primary rounded-full animate-[equalizer_0.8s_ease-in-out_infinite_0.4s]"></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium truncate ${currentSong?._id === song._id ? 'text-primary' : 'text-white'}`}>{song.title}</h4>
                      <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                    </div>

                    <div className="hidden md:block w-32">
                      <span className="text-xs bg-bg-tertiary px-2 py-1 rounded text-gray-300">{song.genre}</span>
                    </div>

                    <button 
                      onClick={(e) => toggleLike(e, song._id)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className={`w-5 h-5 ${likedSongIds.has(song._id) ? 'text-secondary' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d={likedSongIds.has(song._id) 
                          ? "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                          : "M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"}
                        />
                      </svg>
                    </button>
                    <SongMenu song={song} />
                    
                    <div className="w-12 text-right text-sm text-gray-400">
                      {formatDuration(song.duration)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400">No results found for "{query}"</div>
            )}
          </>
        ) : (
          <div className="space-y-12">
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Browse all</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {GENRES.map((genre) => (
                  <div 
                    key={genre.name}
                    onClick={() => handleGenreClick(genre.name)}
                    className={`aspect-[2/1] rounded-xl p-4 flex items-center justify-between cursor-pointer hover:scale-[1.03] transition-transform overflow-hidden relative shadow-lg border ${genre.style}`}
                  >
                    <h4 className="text-white font-bold text-lg z-10">{genre.name}</h4>
                    <div className="text-4xl z-10 opacity-90">{genre.emoji}</div>
                  </div>
                ))}
              </div>
            </div>

            {topArtists.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-6">Popular Artists</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                  {topArtists.map(artist => (
                    <div 
                      key={artist.name}
                      onClick={() => { setQuery(artist.name); setFilter("Artist"); handleSearchChange({target: {value: artist.name}} as any); }}
                      className="group cursor-pointer text-center"
                    >
                      <div className="w-full aspect-square rounded-full overflow-hidden mb-4 shadow-lg border border-border group-hover:border-primary/50 transition-colors">
                        <img src={artist.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={artist.name} />
                      </div>
                      <h4 className="text-white font-medium truncate">{artist.name}</h4>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
