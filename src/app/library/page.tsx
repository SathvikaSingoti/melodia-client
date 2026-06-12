"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { usePlayerStore, Song } from "@/store/playerStore";
import TrackList from "@/components/TrackList";
import { Search, Image as ImageIcon, X, Plus, Music, Heart, LogOut, Play } from "lucide-react";
import toast from "react-hot-toast";

interface Playlist {
  _id: string;
  name: string;
  coverUrl: string;
  songs: Song[];
  isAIGenerated?: boolean;
}

export default function LibraryPage() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const play = usePlayerStore(state => state.play);
  
  const [activeCollection, setActiveCollection] = useState<string>("likes");
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [modalSearch, setModalSearch] = useState("");
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [coverUrl, setCoverUrl] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [likedRes, playlistsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${user?._id}/liked`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${user?._id}/playlists`)
      ]);
      setLikedSongs(likedRes.data);
      setPlaylists(playlistsRes.data);
    } catch (error) {
      console.error("Failed to fetch library data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showModal && allSongs.length === 0) {
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/songs`).then(res => setAllSongs(res.data));
    }
  }, [showModal, allSongs.length]);

  const unlikeSong = async (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/users/${user?._id}/liked/${songId}`);
      setLikedSongs(prev => prev.filter(s => s._id !== songId));
      toast.success("Removed from liked songs");
    } catch (error) {
      console.error("Failed to unlike song", error);
    }
  };

  const createPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/playlists`, {
        userId: user?._id,
        name: newPlaylistName,
        songs: selectedSongs.map(s => s._id),
        coverUrl: coverUrl
      });
      setPlaylists(prev => [...prev, res.data]);
      setShowModal(false);
      setNewPlaylistName("");
      setSelectedSongs([]);
      setCoverUrl("");
      setModalSearch("");
      toast.success("Playlist created ✓");
    } catch (error) {
      console.error("Failed to create playlist", error);
    }
  };

  const activePlaylist = playlists.find(p => p._id === activeCollection);

  return (
    <ProtectedRoute>
      <div className="flex h-full w-full">
        {/* LEFT PANEL - Main Content */}
        <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : activeCollection === "likes" ? (
            <div>
              <div className="flex items-end gap-6 mb-8">
                <div className="w-48 h-48 rounded-xl bg-gradient-to-br from-[#c4a090] to-[#5bc4e8] flex items-center justify-center shadow-2xl flex-shrink-0">
                  <Heart className="w-20 h-20 text-white" fill="currentColor" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-[#c4a090] mb-2">Collection</h4>
                  <h1 className="text-5xl font-[800] text-white tracking-tight mb-4">Liked Songs</h1>
                  <p className="text-gray-400 font-medium">{likedSongs.length} songs</p>
                </div>
              </div>
              
              {likedSongs.length > 0 && (
                <div className="mb-6">
                  <button 
                    onClick={() => play(likedSongs[0], likedSongs)}
                    className="w-14 h-14 bg-[#c4a090] rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform shadow-xl"
                  >
                    <Play className="w-6 h-6 ml-1" fill="currentColor" />
                  </button>
                </div>
              )}

              {likedSongs.length > 0 ? (
                <TrackList 
                  songs={likedSongs} 
                  likedSongIds={new Set(likedSongs.map(s => s._id))}
                  onToggleLike={unlikeSong}
                />
              ) : (
                <div className="text-center py-20 text-gray-500">You haven't liked any songs yet.</div>
              )}
            </div>
          ) : activePlaylist ? (
            <div>
              <div className="flex items-end gap-6 mb-8">
                <div className="w-48 h-48 rounded-xl bg-[#2c2828] overflow-hidden shadow-2xl flex-shrink-0 relative group border border-border">
                  {activePlaylist.songs.length > 0 ? (
                    <img src={activePlaylist.songs[0].coverUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <Music className="w-16 h-16 opacity-50" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-[#c4a090] mb-2">Playlist</h4>
                  <h1 className="text-5xl font-[800] text-white tracking-tight mb-4 truncate">{activePlaylist.name}</h1>
                  <p className="text-gray-400 font-medium">{activePlaylist.songs.length} songs</p>
                </div>
              </div>
              
              {activePlaylist.songs.length > 0 && (
                <div className="mb-6">
                  <button 
                    onClick={() => play(activePlaylist.songs[0], activePlaylist.songs)}
                    className="w-14 h-14 bg-[#c4a090] rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform shadow-xl"
                  >
                    <Play className="w-6 h-6 ml-1" fill="currentColor" />
                  </button>
                </div>
              )}

              {activePlaylist.songs.length > 0 ? (
                <TrackList 
                  songs={activePlaylist.songs} 
                  likedSongIds={new Set(likedSongs.map(s => s._id))}
                  onToggleLike={unlikeSong}
                />
              ) : (
                <div className="text-center py-20 text-gray-500">This playlist is empty.</div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">Collection not found.</div>
          )}
        </div>

        {/* RIGHT PANEL - Sidebar */}
        <div className="w-[280px] bg-[#181616] border-l border-[#2c2828] flex flex-col h-full flex-shrink-0">
          <div className="p-6 pb-4">
            <h2 className="text-xl font-bold text-white mb-6">Your Library</h2>
            
            <button 
              onClick={() => setActiveCollection("likes")}
              className={`w-full flex items-center gap-4 px-3 py-2 rounded-lg transition-colors mb-2 ${activeCollection === "likes" ? "bg-[#c4a09022]" : "hover:bg-white/5"}`}
            >
              <div className="w-10 h-10 rounded bg-gradient-to-br from-[#c4a090] to-[#5bc4e8] flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <h4 className={`font-semibold truncate ${activeCollection === "likes" ? "text-[#c4a090]" : "text-white"}`}>Liked Songs</h4>
                <p className="text-xs text-gray-500">{likedSongs.length} songs</p>
              </div>
            </button>

            <button 
              onClick={() => setShowModal(true)}
              className="w-full flex items-center gap-4 px-3 py-2 rounded-lg transition-colors hover:bg-white/5 group border border-transparent border-dashed hover:border-gray-500"
            >
              <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
                <Plus className="w-5 h-5 text-gray-400 group-hover:text-white" />
              </div>
              <span className="font-semibold text-gray-400 group-hover:text-white transition-colors">Create Playlist</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar px-3 pb-4 space-y-1">
            {playlists.map(playlist => (
              <button 
                key={playlist._id}
                onClick={() => setActiveCollection(playlist._id)}
                className={`w-full flex items-center gap-4 px-3 py-2 rounded-lg transition-colors ${activeCollection === playlist._id ? "bg-[#c4a09022]" : "hover:bg-white/5"}`}
              >
                <div className="w-10 h-10 rounded overflow-hidden bg-bg-tertiary flex items-center justify-center flex-shrink-0">
                  {playlist.songs.length > 0 ? (
                    <img src={playlist.songs[0].coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
                  ) : (
                    <Music className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <h4 className={`font-semibold text-sm truncate ${activeCollection === playlist._id ? "text-[#c4a090]" : "text-white"}`}>{playlist.name}</h4>
                  <p className="text-xs text-gray-500">{playlist.songs.length} songs</p>
                </div>
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-[#2c2828] flex items-center justify-between bg-black/20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-700">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#c4a090] flex items-center justify-center text-white font-bold text-xs">
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-sm font-semibold text-white truncate">{user?.username}</span>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Create Playlist Modal (Kept from original) */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-bg-secondary w-full max-w-[480px] rounded-2xl border border-border shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-6 border-b border-border flex-shrink-0">
                <h3 className="text-xl font-bold text-white mb-6">Create new playlist</h3>
                
                <div className="flex gap-4">
                  <div 
                    className="w-20 h-20 bg-bg-tertiary rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors relative overflow-hidden flex-shrink-0"
                    onClick={() => document.getElementById('cover-upload')?.click()}
                  >
                    {coverUrl ? (
                      <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    )}
                    <input 
                      id="cover-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setCoverUrl(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Playlist Name</label>
                    <input
                      type="text"
                      required
                      placeholder="My awesome playlist"
                      className="w-full bg-bg-tertiary text-white rounded-lg px-4 py-2.5 border border-border focus:border-[#c4a090] focus:outline-none"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                <div className="mb-6">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Add songs</label>
                  <div className="relative mb-4">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search for songs, artists..."
                      className="w-full bg-bg-tertiary text-white rounded-lg pl-10 pr-4 py-2.5 border border-border focus:border-[#c4a090] focus:outline-none text-sm"
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                    />
                  </div>
                  
                  {modalSearch.trim() && (
                    <div className="flex flex-col gap-1 mb-6 border border-border rounded-lg p-2 bg-bg-primary/50 max-h-48 overflow-y-auto no-scrollbar">
                      {allSongs
                        .filter(s => !selectedSongs.find(sel => sel._id === s._id) && (s.title.toLowerCase().includes(modalSearch.toLowerCase()) || s.artist.toLowerCase().includes(modalSearch.toLowerCase())))
                        .slice(0, 5)
                        .map(song => (
                          <div key={song._id} className="flex items-center justify-between p-2 hover:bg-bg-tertiary rounded-md group">
                            <div className="flex items-center gap-3 min-w-0">
                              <img src={song.coverUrl} className="w-8 h-8 rounded object-cover" />
                              <div className="min-w-0">
                                <p className="text-sm text-white truncate">{song.title}</p>
                                <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                              </div>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setSelectedSongs(prev => [...prev, song])}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-tertiary hover:bg-[#c4a090]/20 hover:text-[#c4a090] text-gray-400 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedSongs.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Selected ({selectedSongs.length})</label>
                    <div className="flex flex-col gap-1">
                      {selectedSongs.map(song => (
                        <div key={song._id} className="flex items-center justify-between p-2 bg-bg-tertiary/50 rounded-md">
                          <div className="flex items-center gap-3 min-w-0">
                            <img src={song.coverUrl} className="w-8 h-8 rounded object-cover" />
                            <div className="min-w-0">
                              <p className="text-sm text-white truncate">{song.title}</p>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setSelectedSongs(prev => prev.filter(s => s._id !== song._id))}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border flex justify-end gap-3 flex-shrink-0 bg-bg-primary/50">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowModal(false);
                    setSelectedSongs([]);
                    setModalSearch("");
                    setCoverUrl("");
                    setNewPlaylistName("");
                  }}
                  className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-bg-tertiary transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={createPlaylist}
                  disabled={!newPlaylistName.trim()}
                  className="px-6 py-2 rounded-lg text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#c4a090' }}
                >
                  Create Playlist
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
