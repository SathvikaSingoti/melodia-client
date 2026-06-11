"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePlayerStore, Song } from "@/store/playerStore";
import SongMenu from "@/components/SongMenu";
import TrackList from "@/components/TrackList";
import { Search, Image as ImageIcon, X, Plus } from "lucide-react";

function PlaylistMenu({ playlist, onPlay, onQueue, onDelete }: { playlist: any, onPlay: () => void, onQueue: () => void, onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    const close = () => setOpen(false);
    if (open) document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="relative">
      <button 
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
      </button>
      {open && (
        <div className="absolute right-0 bottom-full mb-2 w-40 bg-bg-tertiary border border-border rounded-lg shadow-xl py-1 z-50 overflow-hidden" onClick={e => e.stopPropagation()}>
          <button onClick={() => { onPlay(); setOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-white hover:bg-bg-secondary">Play</button>
          <button onClick={() => { onQueue(); setOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-white hover:bg-bg-secondary">Add to queue</button>
          <button onClick={() => { onDelete(); setOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-bg-secondary">Delete playlist</button>
        </div>
      )}
    </div>
  );
}

interface Playlist {
  _id: string;
  name: string;
  coverUrl: string;
  songs: string[];
  isAIGenerated?: boolean;
}

export default function LibraryPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const play = usePlayerStore(state => state.play);
  
  const [activeTab, setActiveTab] = useState<"likes" | "playlists">("likes");
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [modalSearch, setModalSearch] = useState("");
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [coverUrl, setCoverUrl] = useState<string>("");

  useEffect(() => {
    if (user) {
      if (activeTab === "likes") fetchLikedSongs();
      else fetchPlaylists();
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (showModal && allSongs.length === 0) {
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/songs`).then(res => setAllSongs(res.data));
    }
  }, [showModal, allSongs.length]);

  const fetchLikedSongs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${user?._id}/liked`);
      setLikedSongs(res.data);
    } catch (error) {
      console.error("Failed to fetch liked songs", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${user?._id}/playlists`);
      setPlaylists(res.data);
    } catch (error) {
      console.error("Failed to fetch playlists", error);
    } finally {
      setLoading(false);
    }
  };

  const unlikeSong = async (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/users/${user?._id}/liked/${songId}`);
      setLikedSongs(prev => prev.filter(s => s._id !== songId));
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
    } catch (error) {
      console.error("Failed to create playlist", error);
    }
  };

  const handleGenerateSmartPlaylist = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAI(true);
    setShowAiModal(false);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/ai/generate-playlist`, { prompt: aiPrompt }, { headers });
      setPlaylists(prev => [...prev, res.data]);
      setAiPrompt("");
      router.push(`/playlist/${res.data._id}`);
    } catch (error) {
      console.error("Failed to generate smart playlist", error);
      alert("Failed to generate smart playlist. Make sure your GEMINI_API_KEY is valid.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="p-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-8">Your Library</h2>

        {/* Tabs */}
        <div className="flex gap-6 mb-8 border-b border-border">
          <button 
            onClick={() => setActiveTab("likes")}
            className={`pb-3 font-medium transition-colors relative ${activeTab === "likes" ? "text-primary" : "text-gray-400 hover:text-white"}`}
          >
            Liked Songs
            {activeTab === "likes" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(168,207,255,0.5)]"></div>
            )}
          </button>
          <button 
            onClick={() => setActiveTab("playlists")}
            className={`pb-3 font-medium transition-colors relative ${activeTab === "playlists" ? "text-primary" : "text-gray-400 hover:text-white"}`}
          >
            My Playlists
            {activeTab === "playlists" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(168,207,255,0.5)]"></div>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activeTab === "likes" ? (
          /* Liked Songs Track List */
          likedSongs.length > 0 ? (
            <div>
              <div className="mb-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  ♥ {likedSongs.length} LIKED SONGS
                </span>
              </div>
              <TrackList 
                songs={likedSongs} 
                likedSongIds={new Set(likedSongs.map(s => s._id))}
                onToggleLike={unlikeSong}
              />
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">You haven't liked any songs yet.</div>
          )
        ) : (
          /* Playlists Grid */
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Your Playlists</h3>
              <button 
                onClick={() => setShowAiModal(true)}
                disabled={isGeneratingAI}
                className="px-[16px] py-[8px] rounded-full text-[13px] text-[#A8CFFF] font-medium transition-opacity disabled:opacity-70 disabled:cursor-not-allowed hover:opacity-80"
                style={{
                  background: "linear-gradient(#080d18, #080d18) padding-box, linear-gradient(135deg, #A8CFFF, #FFD6A5) border-box",
                  border: "1.5px solid transparent"
                }}
              >
                {isGeneratingAI ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-[#A8CFFF] border-t-transparent rounded-full animate-spin"></div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#A8CFFF] to-[#FFD6A5]">Gemini is curating your mix...</span>
                  </span>
                ) : (
                  "Generate Smart Playlist"
                )}
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              <div 
                onClick={() => setShowModal(true)}
                className="w-full aspect-square bg-bg-secondary rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-secondary transition-colors text-gray-400 group-hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                </div>
                <span className="font-medium text-gray-400 group-hover:text-white transition-colors">Create Playlist</span>
              </div>
              
              {playlists.map(playlist => {
                const songs = playlist.songs;
                let coverNode;
                
                if (songs.length === 0) {
                  coverNode = (
                    <div className="w-full h-full bg-bg-tertiary flex items-center justify-center text-4xl">
                      🎵
                    </div>
                  );
                } else if (songs.length < 4) {
                  // Assert as any to bypass TS error since songs is string[] in interface but populated in reality
                  const coverUrl = (songs[0] as any).coverUrl;
                  coverNode = <img src={coverUrl} alt={playlist.name} className="w-full h-full object-cover" />;
                } else {
                  coverNode = (
                    <div className="w-full h-full grid grid-cols-2 grid-rows-2">
                      {songs.slice(0, 4).map((song: any, i) => (
                        <img key={i} src={song.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                      ))}
                    </div>
                  );
                }

                return (
                  <div 
                    onClick={() => router.push(`/playlist/${playlist._id}`)} 
                    key={playlist._id}
                    className="bg-bg-secondary p-4 rounded-xl border border-border hover:border-primary/50 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] cursor-pointer block relative group/card"
                  >
                    <div className="aspect-square mb-4 overflow-hidden rounded-lg relative">
                      {coverNode}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-end justify-between p-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (playlist.songs.length > 0) play(playlist.songs[0], playlist.songs);
                          }}
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-bg-primary hover:scale-105 transition-transform shadow-lg"
                        >
                          <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </button>
                        <PlaylistMenu 
                          playlist={playlist}
                          onPlay={() => { if (playlist.songs.length > 0) play(playlist.songs[0], playlist.songs); }}
                          onQueue={() => { playlist.songs.forEach((s: any) => usePlayerStore.getState().addToQueue(s)); }}
                          onDelete={async () => {
                            try {
                              await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/playlists/${playlist._id}`, { headers: { Authorization: `Bearer ${token}` } });
                              setPlaylists(prev => prev.filter(p => p._id !== playlist._id));
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                        />
                      </div>
                    </div>
                    <h3 className="font-semibold text-white truncate">{playlist.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{playlist.songs.length} songs</p>
                    
                    {playlist.isAIGenerated && (
                      <span className="absolute top-2 right-2 text-[10px] font-bold text-primary bg-bg-secondary/90 px-2 py-1 rounded-full border border-primary/30 backdrop-blur-md shadow-lg">
                        ✨ AI Mix
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Create Playlist Modal */}
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
                      className="w-full bg-bg-tertiary text-white rounded-lg px-4 py-2.5 border border-border focus:border-primary focus:outline-none"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-6">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Add songs</label>
                  <div className="relative mb-4">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search for songs, artists..."
                      className="w-full bg-bg-tertiary text-white rounded-lg pl-10 pr-4 py-2.5 border border-border focus:border-primary focus:outline-none text-sm"
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                    />
                  </div>
                  
                  {modalSearch.trim() && (
                    <div className="flex flex-col gap-1 mb-6 border border-border rounded-lg p-2 bg-bg-primary/50 max-h-48 overflow-y-auto">
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
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-tertiary hover:bg-primary/20 hover:text-primary text-gray-400 transition-colors"
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
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-bg-primary font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Create Playlist
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Playlist Modal */}
        {showAiModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-bg-secondary w-full max-w-[400px] rounded-2xl border border-border shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-border">
                <h3 className="text-xl font-bold text-white mb-2">Generate Smart Playlist</h3>
                <p className="text-sm text-gray-400">Describe the exact mood, activity, or genre you're looking for.</p>
              </div>

              <div className="p-6">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Describe your vibe...</label>
                <textarea
                  rows={3}
                  placeholder="e.g., 'rainy day chill', '3am can't sleep', 'gym motivation', 'sunday morning coffee'"
                  className="w-full bg-bg-tertiary text-white rounded-lg px-4 py-3 border border-border focus:border-primary focus:outline-none text-sm resize-none"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerateSmartPlaylist();
                    }
                  }}
                  autoFocus
                />
              </div>

              <div className="p-4 border-t border-border flex justify-end gap-3 bg-bg-primary/50">
                <button 
                  type="button" 
                  onClick={() => { setShowAiModal(false); setAiPrompt(""); }}
                  className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-bg-tertiary transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleGenerateSmartPlaylist}
                  disabled={!aiPrompt.trim() || isGeneratingAI}
                  className="px-6 py-2 rounded-lg text-bg-primary font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ background: 'linear-gradient(90deg, #A8CFFF, #FFD6A5)' }}
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
