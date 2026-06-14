"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { usePlayerStore, Song } from "@/store/playerStore";
import TrackList from "@/components/TrackList";
import { Search, Image as ImageIcon, X, Plus, Music, Heart, LogOut, Play, Sparkles, MoreHorizontal, Edit2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import AIGenerateModal from "@/components/AIGenerateModal";
import { globalEvents } from "@/lib/events";

interface Playlist {
  _id: string;
  name: string;
  coverUrl: string;
  songs: Song[];
  isAIGenerated?: boolean;
}

interface Artist {
  _id: string;
  name: string;
  imageUrl?: string;
}

export default function LibraryPage() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const play = usePlayerStore(state => state.play);
  
  const [activeCollection, setActiveCollection] = useState<string>("likes");
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [following, setFollowing] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [modalSearch, setModalSearch] = useState("");
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [coverUrl, setCoverUrl] = useState<string>("");
  
  const [playlistSearch, setPlaylistSearch] = useState("");
  
  const [playlistMenuOpen, setPlaylistMenuOpen] = useState<string | null>(null);
  const [menuDirection, setMenuDirection] = useState<'down'|'up'>('down');
  const [deletingPlaylistId, setDeletingPlaylistId] = useState<string | null>(null);
  const [renamingPlaylist, setRenamingPlaylist] = useState<Playlist | null>(null);
  const [editPlaylistName, setEditPlaylistName] = useState("");

  useEffect(() => {
    const handleDocClick = () => setPlaylistMenuOpen(null);
    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
    
    const unsubscribeLiked = globalEvents.on('likedSongsUpdated', () => {
      if (user) fetchData();
    });
    
    const unsubscribePlaylist = globalEvents.on('playlistUpdated', () => {
      if (user) fetchData();
    });
    
    return () => {
      unsubscribeLiked();
      unsubscribePlaylist();
    };
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [likedRes, playlistsRes, followingRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${user?._id}/liked`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${user?._id}/playlists`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${user?._id}/following`)
      ]);
      setLikedSongs(likedRes.data);
      setPlaylists(playlistsRes.data);
      setFollowing(followingRes.data);
    } catch (error) {
      console.error("Failed to fetch library data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((showModal || activeCollection !== "likes") && allSongs.length === 0) {
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/songs`).then(res => setAllSongs(res.data));
    }
  }, [showModal, activeCollection, allSongs.length]);

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
      }, { headers: { Authorization: `Bearer ${token}` } });
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

  const addSongToPlaylist = async (song: Song) => {
    if (!activeCollection || activeCollection === "likes") return;
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists/${activeCollection}/songs`, 
        { songId: song._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlaylists(prev => prev.map(p => p._id === activeCollection ? res.data : p));
      setPlaylistSearch("");
      toast.success("Added to playlist");
    } catch (error) {
      console.error("Failed to add song to playlist", error);
    }
  };

  const removeSongFromPlaylist = async (playlistId: string, songId: string) => {
    const originalPlaylists = [...playlists];
    // Optimistic UI update
    setPlaylists(prev => prev.map(p => 
      p._id === playlistId 
        ? { ...p, songs: p.songs.filter(s => s._id !== songId) } 
        : p
    ));
    toast.success("Removed from playlist");

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists/${playlistId}/songs/${songId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Failed to remove song from playlist", error);
      // Revert on failure
      setPlaylists(originalPlaylists);
      toast.error("Failed to remove song");
    }
  };

  const handleRenamePlaylist = async () => {
    if (!renamingPlaylist || !editPlaylistName.trim()) return;
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists/${renamingPlaylist._id}`,
        { name: editPlaylistName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlaylists(prev => prev.map(p => p._id === renamingPlaylist._id ? { ...p, name: editPlaylistName } : p));
      setRenamingPlaylist(null);
      toast.success("Playlist renamed");
    } catch (error) {
      toast.error("Failed to rename playlist");
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlaylists(prev => prev.filter(p => p._id !== id));
      if (activeCollection === id) setActiveCollection("likes");
      setDeletingPlaylistId(null);
      toast.success("Deleted");
    } catch (error) {
      toast.error("Failed to delete playlist");
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
                  onRemoveLiked={(songId) => unlikeSong({ stopPropagation: () => {} } as any, songId)}
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
                <>
                  <TrackList 
                    songs={activePlaylist.songs} 
                    likedSongIds={new Set(likedSongs.map(s => s._id))}
                    onToggleLike={unlikeSong}
                    onRemovePlaylist={(songId) => removeSongFromPlaylist(activePlaylist._id, songId)}
                  />
                  <div className="mt-12 mb-20 max-w-2xl">
                    <h3 className="text-lg font-bold text-white mb-4">Add more songs...</h3>
                    <div className="relative mb-6">
                      <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search for songs to add..."
                        className="w-full bg-[#181616] text-white rounded-xl pl-12 pr-4 py-3 border border-[#2c2828] focus:border-[#c4a090] focus:outline-none"
                        value={playlistSearch}
                        onChange={(e) => setPlaylistSearch(e.target.value)}
                      />
                    </div>
                    {playlistSearch.trim() && (
                      <div className="flex flex-col gap-2">
                        {allSongs
                          .filter(s => !activePlaylist.songs.find(ps => ps._id === s._id) && (s.title.toLowerCase().includes(playlistSearch.toLowerCase()) || s.artist.toLowerCase().includes(playlistSearch.toLowerCase())))
                          .slice(0, 5)
                          .map(song => (
                            <div key={song._id} className="flex items-center justify-between p-3 hover:bg-[#181616] rounded-xl border border-transparent hover:border-[#2c2828] transition-colors group">
                              <div className="flex items-center gap-4 min-w-0">
                                <img src={song.coverUrl} className="w-10 h-10 rounded object-cover" />
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-white truncate">{song.title}</p>
                                  <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => addSongToPlaylist(song)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#181616] border border-[#2c2828] hover:bg-[#c4a090] hover:text-white hover:border-[#c4a090] text-gray-400 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center max-w-2xl mx-auto">
                  <div className="w-24 h-24 rounded-full bg-[#181616] border border-[#2c2828] flex items-center justify-center mb-6">
                    <Music className="w-10 h-10 text-gray-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">This playlist is empty</h2>
                  <p className="text-gray-400 mb-10 text-center">Let's find some tracks for your new collection.</p>
                  
                  <div className="w-full relative mb-6">
                    <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search for songs to add..."
                      className="w-full bg-[#181616] text-white rounded-xl pl-12 pr-4 py-4 border border-[#2c2828] focus:border-[#c4a090] focus:outline-none shadow-lg"
                      value={playlistSearch}
                      onChange={(e) => setPlaylistSearch(e.target.value)}
                    />
                  </div>
                  {playlistSearch.trim() && (
                    <div className="w-full flex flex-col gap-2">
                      {allSongs
                        .filter(s => s.title.toLowerCase().includes(playlistSearch.toLowerCase()) || s.artist.toLowerCase().includes(playlistSearch.toLowerCase()))
                        .slice(0, 5)
                        .map(song => (
                          <div key={song._id} className="flex items-center justify-between p-3 bg-[#181616] rounded-xl border border-[#2c2828] group">
                            <div className="flex items-center gap-4 min-w-0">
                              <img src={song.coverUrl} className="w-10 h-10 rounded object-cover" />
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-white truncate">{song.title}</p>
                                <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => addSongToPlaylist(song)}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2c2828] hover:bg-[#c4a090] hover:text-white text-gray-300 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">Collection not found.</div>
          )}
        </div>

        {/* RIGHT PANEL - Sidebar */}
        <div className="w-[300px] bg-[#181616] border-l border-[#2c2828] flex flex-col h-full flex-shrink-0">
          <div className="p-6 pb-4 flex-shrink-0">
            <h2 className="text-[16px] font-[600] text-white pb-[12px] border-b border-[#2c2828] mb-4">Your Library</h2>
            
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setActiveCollection("likes")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full bg-[#221f1f] border border-[#2c2828] text-[12px] transition-colors ${activeCollection === "likes" ? "text-white border-gray-500" : "text-gray-300 hover:text-white hover:bg-[#2c2828]"}`}
              >
                <Heart className="w-3.5 h-3.5" /> Liked <span className="bg-[#181616] text-[10px] px-1.5 rounded-full border border-[#2c2828]">{likedSongs.length}</span>
              </button>
              <button 
                onClick={() => setShowModal(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full bg-[#221f1f] border border-[#2c2828] text-[12px] text-gray-300 hover:text-white hover:bg-[#2c2828] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> New Playlist
              </button>
            </div>

            <button 
              onClick={() => setShowAIModal(true)}
              className="w-full bg-[#c4a09010] border border-[#c4a09040] text-[#c4a090] rounded-[8px] py-[10px] text-center text-[13px] hover:bg-[#c4a09020] transition-colors font-medium"
            >
              ✦ Generate Smart Playlist
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar px-6 flex flex-col pb-6">
            <div className="w-full h-px bg-[#2c2828] mb-[12px] flex-shrink-0" />
            
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3 flex-shrink-0">Playlists</div>
            <div className="flex flex-col gap-1 mb-2 flex-shrink-0">
              {playlists.map(playlist => (
                <div key={playlist._id} className="relative group">
                  <button 
                    onClick={() => setActiveCollection(playlist._id)}
                    className={`w-full flex items-center gap-3 p-1.5 rounded-md transition-colors ${activeCollection === playlist._id ? "bg-[#c4a09015] border-l-2 border-[#c4a090]" : "border-l-2 border-transparent hover:bg-white/5"}`}
                  >
                    <div className="w-[28px] h-[28px] rounded-[4px] overflow-hidden bg-[#2c2828] flex items-center justify-center flex-shrink-0">
                      {playlist.songs.length > 0 ? (
                        <img src={playlist.songs[0].coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-3 h-3 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0 flex items-center justify-between">
                      {renamingPlaylist?._id === playlist._id ? (
                        <input 
                          type="text" 
                          autoFocus
                          value={editPlaylistName}
                          onChange={(e) => setEditPlaylistName(e.target.value)}
                          onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenamePlaylist();
                            if (e.key === 'Escape') setRenamingPlaylist(null);
                          }}
                          onBlur={handleRenamePlaylist}
                          className="w-full bg-[#181616] border border-[#c4a090] rounded px-1.5 py-0.5 text-[13px] text-white focus:outline-none z-20"
                        />
                      ) : (
                        <span className={`text-[13px] truncate pr-2 ${activeCollection === playlist._id ? "text-white font-medium" : "text-gray-300"}`}>{playlist.name}</span>
                      )}
                      {renamingPlaylist?._id !== playlist._id && (
                        <span className="text-[11px] text-gray-500">{playlist.songs.length}</span>
                      )}
                    </div>
                  </button>
                  
                  {/* THREE DOT MENU BUTTON */}
                  <div className={`absolute right-2 top-1/2 -translate-y-1/2 transition-opacity flex items-center ${playlistMenuOpen === playlist._id ? 'opacity-100 z-[120]' : 'opacity-0 group-hover:opacity-100 z-10'}`}>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        e.nativeEvent.stopImmediatePropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const spaceBelow = window.innerHeight - rect.bottom;
                        setMenuDirection(spaceBelow < 150 ? 'up' : 'down');
                        setPlaylistMenuOpen(playlistMenuOpen === playlist._id ? null : playlist._id); 
                      }}
                      className="p-1 rounded bg-[#181616] text-gray-400 hover:text-white border border-[#2c2828] shadow-sm"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                    {playlistMenuOpen === playlist._id && (
                      <div className={`absolute right-0 ${menuDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'} w-40 bg-[#1a1614] border border-[#2c2828] rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.8)] py-1 z-[150] animate-in fade-in zoom-in-95 duration-100`}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setActiveCollection(playlist._id); setPlaylistMenuOpen(null); if (playlist.songs.length) play(playlist.songs[0], playlist.songs); }}
                          className="w-full text-left px-3 py-2 text-[13px] text-gray-300 hover:bg-[#2c2828] hover:text-white flex items-center gap-2 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" /> Play
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setRenamingPlaylist(playlist); setEditPlaylistName(playlist.name); setPlaylistMenuOpen(null); }}
                          className="w-full text-left px-3 py-2 text-[13px] text-gray-300 hover:bg-[#2c2828] hover:text-white flex items-center gap-2 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Rename
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setDeletingPlaylistId(playlist._id); setPlaylistMenuOpen(null); }}
                          className="w-full text-left px-3 py-2 text-[13px] text-[#e87070] hover:bg-[#e8707020] flex items-center gap-2 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete playlist
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Inline Delete Confirmation */}
                  {deletingPlaylistId === playlist._id && (
                    <div className="absolute inset-0 bg-[#1a1614] border border-[#e87070] rounded-md flex items-center justify-between px-2 z-30 animate-in fade-in shadow-lg">
                      <span className="text-[12px] text-white truncate max-w-[120px]">Delete {playlist.name}?</span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setDeletingPlaylistId(null)}
                          className="px-2 py-1 text-[11px] text-gray-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleDeletePlaylist(playlist._id)}
                          className="px-2 py-1 text-[11px] bg-[#e87070] text-white rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="w-full h-px bg-[#2c2828] my-[12px] flex-shrink-0" />
            
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3 flex-shrink-0">Following</div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              {following.slice(0, 4).map(artist => (
                <button
                  key={artist._id}
                  onClick={() => router.push(`/artist/${artist._id}`)}
                  className="w-full flex items-center gap-3 p-1.5 rounded-md transition-colors hover:bg-white/5"
                >
                  <div className="w-[24px] h-[24px] rounded-full overflow-hidden bg-[#2c2828] flex items-center justify-center flex-shrink-0">
                    {artist.imageUrl ? (
                      <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[9px] font-bold text-gray-500">{artist.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="text-[13px] text-gray-300 truncate">{artist.name}</span>
                </button>
              ))}
              {following.length > 4 && (
                <button className="text-[11px] text-gray-500 hover:text-white text-left pl-11 pt-1">
                  See all
                </button>
              )}
              {following.length === 0 && (
                <div className="text-[12px] text-gray-500 italic px-2">No artists followed yet.</div>
              )}
            </div>
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
                        .filter(s => (s.title.toLowerCase().includes(modalSearch.toLowerCase()) || s.artist.toLowerCase().includes(modalSearch.toLowerCase())))
                        .slice(0, 5)
                        .map(song => {
                          const isAdded = !!selectedSongs.find(sel => sel._id === song._id);
                          return (
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
                              disabled={isAdded}
                              onClick={() => setSelectedSongs(prev => [...prev, song])}
                              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                                isAdded 
                                  ? "bg-transparent text-[#c4a090] cursor-not-allowed" 
                                  : "bg-bg-tertiary hover:bg-[#c4a090]/20 hover:text-[#c4a090] text-gray-400"
                              }`}
                            >
                              {isAdded ? <span className="font-bold text-sm">✓</span> : <Plus className="w-4 h-4" />}
                            </button>
                          </div>
                        )})}
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

        {/* AI Generate Modal */}
        <AIGenerateModal 
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          title="Generate Smart Playlist"
          onSubmit={async (promptMsg) => {
            if (!user) throw new Error("Not logged in");
            const toastId = toast.loading(`Generating playlist...`);
            try {
              const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/ai/generate-playlist`, { prompt: promptMsg, userId: user._id });
              // Re-fetch playlists to get the newly generated one
              const playlistsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${user._id}/playlists`);
              setPlaylists(playlistsRes.data);
              
              // Find the newest AI playlist to navigate to it
              const aiPlaylists = playlistsRes.data.filter((p: Playlist) => p.isAIGenerated);
              if (aiPlaylists.length > 0) {
                // Assuming the last one in the array or by highest ID is the newest
                const latest = aiPlaylists[aiPlaylists.length - 1];
                setActiveCollection(latest._id);
              }
              
              toast.success(`Playlist generated!`, { id: toastId });
            } catch (e: any) { 
              const errMsg = e.response?.data?.error || e.response?.data?.message || "Failed to generate playlist";
              toast.error(errMsg, { id: toastId }); 
              throw e; 
            }
          }}
        />

      </div>
    </ProtectedRoute>
  );
}
