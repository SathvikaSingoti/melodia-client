"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { usePlayerStore, Song } from "@/store/playerStore";
import SongMenu from "@/components/SongMenu";
import TrackList from "@/components/TrackList";
import { Music, Play, Link2 } from "lucide-react";
import toast from "react-hot-toast";
import { globalEvents } from "@/lib/events";

interface Playlist {
  _id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  songs: Song[];
  isAIGenerated?: boolean;
}

export default function PlaylistPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { user, token } = useAuth();
  const play = usePlayerStore(state => state.play);
  
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState("");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (token) {
      fetchPlaylist();
      if (user) fetchLikedSongs();
    }
  }, [id, token, user]);

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
    
    // Optimistic update
    if (isLiked) {
      setLikedSongIds(prev => { const next = new Set(prev); next.delete(songId); return next; });
    } else {
      setLikedSongIds(prev => { const next = new Set(prev); next.add(songId); return next; });
    }

    try {
      if (isLiked) {
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/users/${user._id}/liked/${songId}`);
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/${user._id}/liked`, { songId });
      }
    } catch (error) {
      console.error("Failed to toggle like", error);
      // Revert
      if (isLiked) {
        setLikedSongIds(prev => { const next = new Set(prev); next.add(songId); return next; });
      } else {
        setLikedSongIds(prev => { const next = new Set(prev); next.delete(songId); return next; });
      }
    }
  };

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

  const savePlaylistDetails = async (updates: Partial<Playlist>) => {
    if (!playlist) return;
    try {
      const res = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/playlists/${id}`, updates, getHeaders());
      setPlaylist(res.data);
      globalEvents.emit('playlistUpdated');
      if (updates.name !== undefined) setIsEditingName(false);
      if (updates.description !== undefined) setIsEditingDesc(false);
    } catch (error) {
      console.error("Failed to update playlist", error);
      toast.error("Failed to update");
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingCover(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      await savePlaylistDetails({ coverUrl: reader.result as string });
      setIsUploadingCover(false);
    };
    reader.readAsDataURL(file);
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
      globalEvents.emit('playlistUpdated');
    } catch (error) {
      console.error("Failed to add song", error);
    }
  };

  const removeSong = async (songId: string) => {
    try {
      const res = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/playlists/${id}/songs/${songId}`, getHeaders());
      setPlaylist(res.data);
      globalEvents.emit('playlistUpdated');
    } catch (error) {
      console.error("Failed to remove song", error);
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h} hr ${m} min`;
    return `${m} min`;
  };

  const totalDuration = playlist?.songs.reduce((acc, song) => acc + song.duration, 0) || 0;

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center h-[calc(100vh-160px)]">
          <div className="w-8 h-8 border-4 border-[#c4a090] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!playlist) {
    return (
      <ProtectedRoute>
        <div className="p-8 text-center text-gray-400">Playlist not found</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-full w-full max-w-[1400px] mx-auto overflow-hidden">
        
        {/* LEFT COLUMN - Fixed Details */}
        <div className="w-[260px] h-full overflow-y-auto no-scrollbar flex-shrink-0 flex flex-col p-8 bg-[#181616] border-r border-[#2c2828]">
          
          <button 
            onClick={() => router.back()}
            className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors self-start text-sm font-semibold uppercase tracking-widest"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back
          </button>

          <div 
            className="w-[200px] h-[200px] rounded-xl mx-auto overflow-hidden shadow-2xl mb-6 flex-shrink-0 relative border border-border group cursor-pointer"
            onClick={() => document.getElementById('playlist-cover-upload')?.click()}
            title="Click to change cover"
          >
            {playlist.coverUrl ? (
              <img src={playlist.coverUrl} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            ) : playlist.songs.length > 0 ? (
              <img src={playlist.songs[0].coverUrl} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 bg-bg-tertiary">
                <Music className="w-16 h-16 opacity-50" />
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="text-white text-xs font-bold uppercase tracking-widest">{isUploadingCover ? "Uploading..." : "Change Cover"}</span>
            </div>

            <input 
              id="playlist-cover-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleCoverUpload}
            />
            
            {playlist.isAIGenerated && (
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-[#c4a090] border border-[#c4a090]/30 z-10">
                ✨ AI Mix
              </div>
            )}
          </div>
          
          <div className="text-center mb-6 w-full px-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Playlist</span>
            {isEditingName ? (
              <input 
                type="text" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => {
                  if (editName.trim() !== playlist.name) savePlaylistDetails({ name: editName });
                  else setIsEditingName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (editName.trim() !== playlist.name) savePlaylistDetails({ name: editName });
                    else setIsEditingName(false);
                  }
                }}
                autoFocus
                className="text-2xl font-bold text-white text-center w-full bg-transparent border-b border-[#c4a090] focus:outline-none mb-2"
              />
            ) : (
              <h1 
                className="text-2xl font-bold text-white mb-2 tracking-tight cursor-pointer hover:text-[#c4a090] transition-colors truncate"
                onClick={() => { setIsEditingName(true); setEditName(playlist.name); }}
                title="Click to edit name"
              >
                {playlist.name}
              </h1>
            )}

            {isEditingDesc ? (
              <textarea 
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                onBlur={() => {
                  if (editDesc.trim() !== (playlist.description || "")) savePlaylistDetails({ description: editDesc });
                  else setIsEditingDesc(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (editDesc.trim() !== (playlist.description || "")) savePlaylistDetails({ description: editDesc });
                    else setIsEditingDesc(false);
                  }
                }}
                autoFocus
                placeholder="Add an optional description"
                className="text-sm text-gray-400 text-center w-full bg-transparent border-b border-[#c4a090] focus:outline-none mb-4 resize-none"
                rows={2}
              />
            ) : (
              <p 
                className="text-sm text-gray-400 mb-4 cursor-pointer hover:text-white transition-colors"
                onClick={() => { setIsEditingDesc(true); setEditDesc(playlist.description || ""); }}
                title="Click to edit description"
              >
                {playlist.description || <span className="italic opacity-50 text-xs block mt-1">Add description...</span>}
              </p>
            )}

            <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold">{playlist.songs.length} songs • {formatDuration(totalDuration)}</p>
          </div>

          <button 
            onClick={() => {
              if (playlist.songs.length > 0) {
                play(playlist.songs[0], playlist.songs);
              }
            }}
            disabled={playlist.songs.length === 0}
            className="w-full py-3 rounded-full font-bold tracking-widest uppercase transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 mb-3"
            style={{ backgroundColor: '#c4a090', color: 'white' }}
          >
            <Play className="w-5 h-5 fill-current" /> Play All
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/playlist/${id}`);
              toast.success("Link copied to clipboard ✓");
            }}
            className="w-full py-3 rounded-full font-bold tracking-widest uppercase transition-transform flex items-center justify-center gap-2 hover:bg-white/10 text-white border border-border hover:border-white transition-colors"
          >
            <Link2 className="w-5 h-5" /> Share
          </button>
        </div>

        {/* RIGHT COLUMN - Scrollable Content */}
        <div className="flex-1 h-full overflow-y-auto no-scrollbar p-8">
          
          <div className="mb-12">
            {playlist.songs.length > 0 ? (
              <TrackList 
                songs={playlist.songs}
                likedSongIds={likedSongIds}
                onToggleLike={toggleLike}
                onRemovePlaylist={removeSong}
              />
            ) : (
              <div className="text-center py-20 text-gray-500 bg-black/20 rounded-xl border border-dashed border-border">
                <p className="text-lg font-medium mb-2">This playlist is empty</p>
                <p className="text-sm">Search below to start adding songs.</p>
              </div>
            )}
          </div>

          {/* Add Songs Section */}
          <div className="bg-[#181616] p-6 rounded-xl border border-[#2c2828]">
            <h3 className="text-lg font-bold text-white mb-4">Let's find something for your playlist</h3>
            <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search for songs or artists"
                className="w-full bg-black/40 text-white rounded-lg px-4 py-3 border border-border focus:border-[#c4a090] focus:outline-none transition-colors"
              />
            </div>
            
            {searchQuery && (
              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto rounded-lg no-scrollbar">
                {isSearching ? (
                  <p className="text-gray-400 p-4">Searching...</p>
                ) : searchResults.length > 0 ? (
                  searchResults.map(song => {
                    const isAdded = playlist.songs.some(s => s._id === song._id);
                    return (
                      <div key={song._id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg group transition-colors">
                        <div className="flex items-center gap-4">
                          <img src={song.coverUrl} className="w-10 h-10 rounded shadow-md" alt="Cover" />
                          <div>
                            <p className="text-white font-medium text-sm">{song.title}</p>
                            <p className="text-gray-400 text-xs">{song.artist}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <SongMenu song={song} />
                          <button
                            onClick={() => addSong(song)}
                            disabled={isAdded}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border ${
                              isAdded 
                                ? "bg-transparent text-[#c4a090] border-[#c4a090] cursor-not-allowed" 
                                : "bg-transparent text-white border-white hover:border-[#c4a090] hover:text-[#c4a090]"
                            }`}
                          >
                            {isAdded ? "✓" : "Add"}
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
      </div>
    </ProtectedRoute>
  );
}
