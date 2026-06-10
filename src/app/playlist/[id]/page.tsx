"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { usePlayerStore, Song } from "@/store/playerStore";
import SongMenu from "@/components/SongMenu";

interface Playlist {
  _id: string;
  name: string;
  songs: Song[];
}

export default function PlaylistPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { token } = useAuth();
  const play = usePlayerStore(state => state.play);
  
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    if (token) {
      fetchPlaylist();
    }
  }, [id, token]);

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchPlaylist = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/playlists/${id}`, getHeaders());
      setPlaylist(res.data);
    } catch (error) {
      console.error("Failed to fetch playlist", error);
    } finally {
      setLoading(false);
    }
  };

  const savePlaylistName = async () => {
    setIsEditingName(false);
    if (editName.trim() && playlist && editName !== playlist.name) {
      try {
        const res = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/playlists/${id}`, { name: editName }, getHeaders());
        setPlaylist(res.data);
      } catch (error) {
        console.error("Failed to update playlist name", error);
      }
    }
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/songs/search?q=${encodeURIComponent(query)}`, getHeaders());
      setSearchResults(res.data);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsSearching(false);
    }
  };

  const addSong = async (song: Song) => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/playlists/${id}/songs`, { songId: song._id }, getHeaders());
      setPlaylist(res.data);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Failed to add song", error);
    }
  };

  const removeSong = async (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    try {
      const res = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/playlists/${id}/songs/${songId}`, getHeaders());
      setPlaylist(res.data);
    } catch (error) {
      console.error("Failed to remove song", error);
    }
  };

  const renderCover = () => {
    if (!playlist) return null;
    const songs = playlist.songs;
    
    if (songs.length === 0) {
      return (
        <div className="w-full h-full bg-bg-tertiary flex items-center justify-center text-6xl shadow-2xl">
          🎵
        </div>
      );
    } else if (songs.length < 4) {
      return (
        <img src={songs[0].coverUrl} alt="Cover" className="w-full h-full object-cover shadow-2xl" />
      );
    } else {
      return (
        <div className="w-full h-full grid grid-cols-2 grid-rows-2 shadow-2xl">
          {songs.slice(0, 4).map((song, i) => (
            <img key={i} src={song.coverUrl} alt="Cover" className="w-full h-full object-cover" />
          ))}
        </div>
      );
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!playlist) {
    return (
      <ProtectedRoute>
        <div className="p-8 text-center text-white">Playlist not found</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="p-8 max-w-5xl mx-auto pb-32">
        <button 
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>

        <div className="flex flex-col md:flex-row gap-8 mb-12 items-end">
          <div className="w-64 h-64 rounded-xl overflow-hidden flex-shrink-0 border border-border shadow-2xl">
            {renderCover()}
          </div>
          <div className="flex-1 w-full">
            <p className="uppercase text-xs font-bold tracking-widest text-gray-400 mb-2">Playlist</p>
            {isEditingName ? (
              <input 
                type="text" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={savePlaylistName}
                onKeyDown={(e) => e.key === 'Enter' && savePlaylistName()}
                autoFocus
                className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tighter bg-transparent border-b border-white focus:outline-none w-full"
              />
            ) : (
              <h1 
                className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tighter cursor-pointer hover:underline"
                onClick={() => { setIsEditingName(true); setEditName(playlist.name); }}
                title="Click to edit"
              >
                {playlist.name}
              </h1>
            )}
            <div className="flex items-center gap-6">
              <p className="text-gray-300 font-medium">
                {playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'}
              </p>
              <button 
                onClick={() => {
                  if (playlist.songs.length > 0) {
                    play(playlist.songs[0], playlist.songs);
                  }
                }}
                className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-[0_8px_30px_rgb(168,85,247,0.5)]"
                title="Play All"
              >
                <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Playlist Songs */}
        <div className="flex flex-col gap-2 mb-12">
          {playlist.songs.length > 0 ? (
            playlist.songs.map((song, index) => (
              <div 
                key={song._id + index}
                onClick={() => play(song, playlist.songs)}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-bg-secondary group cursor-pointer transition-colors border border-transparent hover:border-border"
              >
                <div className="w-8 text-gray-500 text-right">{index + 1}</div>
                
                <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                  <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate">{song.title}</h4>
                  <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                </div>
                
                <div className="flex items-center gap-2 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => removeSong(e, song._id)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Remove from playlist"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <SongMenu song={song} />
                </div>
                
                <div className="w-12 text-right text-sm text-gray-400 ml-4">
                  {formatDuration(song.duration)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 text-gray-400">
              This playlist is empty. Let's add some songs!
            </div>
          )}
        </div>

        {/* Add Songs Section */}
        <div className="bg-bg-secondary p-6 rounded-xl border border-border">
          <h3 className="text-xl font-bold text-white mb-4">Let's find something for your playlist</h3>
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search for songs or artists"
              className="w-full bg-bg-tertiary text-white rounded-lg px-4 py-3 border border-border focus:border-primary focus:outline-none"
            />
          </div>
          
          {searchQuery && (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto rounded-lg">
              {isSearching ? (
                <p className="text-gray-400 p-4">Searching...</p>
              ) : searchResults.length > 0 ? (
                searchResults.map(song => {
                  const isAdded = playlist.songs.some(s => s._id === song._id);
                  return (
                    <div key={song._id} className="flex items-center justify-between p-3 hover:bg-bg-tertiary rounded-lg group">
                      <div className="flex items-center gap-4">
                        <img src={song.coverUrl} className="w-10 h-10 rounded" alt="Cover" />
                        <div>
                          <p className="text-white font-medium">{song.title}</p>
                          <p className="text-gray-400 text-sm">{song.artist}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <SongMenu song={song} />
                        <button
                          onClick={() => addSong(song)}
                          disabled={isAdded}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                            isAdded 
                              ? "bg-transparent text-gray-500 border-gray-600 cursor-not-allowed" 
                              : "bg-transparent text-white border-white hover:scale-105"
                          }`}
                        >
                          {isAdded ? "Added" : "Add"}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-400 p-4">No results found</p>
              )}
            </div>
          )}
        </div>

      </div>
    </ProtectedRoute>
  );
}
