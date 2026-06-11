"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePlayerStore, Song } from "@/store/playerStore";
import SongMenu from "@/components/SongMenu";

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
  
  const [showModal, setShowModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  useEffect(() => {
    if (user) {
      if (activeTab === "likes") fetchLikedSongs();
      else fetchPlaylists();
    }
  }, [user, activeTab]);

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
        name: newPlaylistName
      });
      setPlaylists(prev => [...prev, res.data]);
      setShowModal(false);
      setNewPlaylistName("");
    } catch (error) {
      console.error("Failed to create playlist", error);
    }
  };

  const handleGenerateSmartPlaylist = async () => {
    setIsGeneratingAI(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/ai/generate-playlist`, {}, { headers });
      setPlaylists(prev => [...prev, res.data]);
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
          /* Liked Songs Grid */
          likedSongs.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {likedSongs.map((song) => (
                <div 
                  key={song._id} 
                  onClick={() => play(song, likedSongs)}
                  className="group relative bg-bg-secondary p-4 rounded-xl border border-border hover:border-primary/50 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] cursor-pointer"
                >
                  <div className="relative aspect-square mb-4 overflow-hidden rounded-lg">
                    <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-bg-primary hover:scale-105 transition-transform shadow-lg">
                        <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 pr-2">
                      <h3 className="font-semibold text-white truncate mb-1" title={song.title}>{song.title}</h3>
                      <p className="text-sm text-gray-400 truncate" title={song.artist}>{song.artist}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => unlikeSong(e, song._id)} className="text-secondary hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </button>
                      <SongMenu song={song} />
                    </div>
                  </div>
                </div>
              ))}
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
                onClick={handleGenerateSmartPlaylist}
                disabled={isGeneratingAI}
                className="relative rounded-full p-[1px] bg-gradient-to-r from-primary/60 to-secondary/60 hover:from-primary hover:to-secondary transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center gap-2 px-4 py-2 bg-bg-primary rounded-full text-[13px] font-medium text-primary group-hover:bg-bg-secondary transition-colors">
                  {isGeneratingAI ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      Generate Smart Playlist
                    </>
                  )}
                </div>
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
                  <Link 
                    href={`/playlist/${playlist._id}`} 
                    key={playlist._id}
                    className="bg-bg-secondary p-4 rounded-xl border border-border hover:border-primary/50 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] cursor-pointer block relative"
                  >
                    <div className="aspect-square mb-4 overflow-hidden rounded-lg">
                      {coverNode}
                    </div>
                    <h3 className="font-semibold text-white truncate">{playlist.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{playlist.songs.length} songs</p>
                    
                    {playlist.isAIGenerated && (
                      <span className="absolute top-2 right-2 text-[10px] font-bold text-primary bg-bg-secondary/90 px-2 py-1 rounded-full border border-primary/30 backdrop-blur-md shadow-lg">
                        ✨ AI Mix
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Create Playlist Modal */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-bg-secondary w-full max-w-md rounded-2xl p-6 border border-border shadow-2xl animate-in fade-in zoom-in duration-200">
              <h3 className="text-xl font-bold text-white mb-4">Create new playlist</h3>
              <form onSubmit={createPlaylist}>
                <input
                  type="text"
                  required
                  placeholder="My awesome playlist"
                  className="w-full bg-bg-tertiary text-white rounded-lg px-4 py-3 border border-border focus:border-primary focus:outline-none mb-6"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  autoFocus
                />
                <div className="flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-bg-tertiary transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-medium hover:opacity-90 transition-opacity shadow-lg"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
