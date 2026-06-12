"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { Song, usePlayerStore } from "@/store/playerStore";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, token, login, logout } = useAuth();
  const router = useRouter();
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const play = usePlayerStore(state => state.play);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (user && token) {
      const userId = user._id || user.id;
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/liked`, { headers: { Authorization: `Bearer ${token}` }})
        .then(res => setLikedSongs(res.data))
        .catch(err => console.error(err));
        
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/playlists`, { headers: { Authorization: `Bearer ${token}` }})
        .then(res => setPlaylists(res.data))
        .catch(err => console.error(err));
    }
  }, [user, token]);

  const uniqueArtists = new Set(likedSongs.map(s => s.artist)).size;
  
  const genreFrequencies: Record<string, number> = {};
  likedSongs.forEach(song => {
    if (!song.genre) return;
    genreFrequencies[song.genre] = (genreFrequencies[song.genre] || 0) + 1;
  });
  const topGenres = Object.entries(genreFrequencies)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);

  const handleUpdateProfile = async (updateData: any) => {
    try {
      const userId = user?._id || user?.id;
      const res = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (token) {
        login(token, res.data);
      }
      toast.success("Profile updated");
    } catch (error: any) {
      console.error("Profile update failed:", error.message);
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  const handleUsernameSubmit = () => {
    if (newUsername.trim() && newUsername !== user?.username) {
      handleUpdateProfile({ username: newUsername });
    }
    setIsEditingUsername(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        await handleUpdateProfile({ avatarBase64: base64String });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE" || !user || !token) return;
    setIsDeleting(true);
    setDeleteError("");
    
    try {
      const userId = user._id || user.id;
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Account deleted. Goodbye 👋");
      
      setTimeout(() => {
        logout();
      }, 2000);
      
    } catch (err: any) {
      setIsDeleting(false);
      setDeleteError(err.response?.data?.message || "Failed to delete account");
    }
  };

  if (!user) return null;

  const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Recently";

  return (
    <ProtectedRoute>
      <div className="pb-24">
        {/* Banner */}
        <div className="h-[200px] w-full bg-gradient-to-r from-primary to-secondary relative">
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        <div className="max-w-6xl mx-auto px-8 relative -mt-10">
          {/* Avatar & Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 mb-12">
            <div 
              className="w-32 h-32 rounded-full border-4 border-bg-primary bg-bg-secondary flex items-center justify-center text-4xl font-bold text-primary relative overflow-hidden group cursor-pointer shadow-xl flex-shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user.username[0].toUpperCase()
              )}
              
              <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {isUploading ? (
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            
            <div className="flex-1 pb-2">
              <p className="text-sm font-medium text-gray-400 mb-1">Member since {joinDate}</p>
              
              {isEditingUsername ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="bg-bg-tertiary border border-primary rounded-lg px-4 py-2 text-3xl font-bold text-white outline-none"
                    autoFocus
                    onBlur={handleUsernameSubmit}
                    onKeyDown={(e) => e.key === 'Enter' && handleUsernameSubmit()}
                  />
                </div>
              ) : (
                <h1 
                  className="text-4xl sm:text-5xl font-bold text-white tracking-tight cursor-pointer hover:text-gray-200 transition-colors flex items-center gap-3 group"
                  onClick={() => setIsEditingUsername(true)}
                >
                  {user.username}
                  <svg className="w-5 h-5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </h1>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-8">
              {/* Stats */}
              <div className="bg-bg-secondary p-6 rounded-2xl border border-border">
                <h3 className="text-lg font-bold text-white mb-4">Stats</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Liked Songs</span>
                    <span className="font-bold text-white text-lg">{likedSongs.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Playlists</span>
                    <span className="font-bold text-white text-lg">{playlists.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Artists</span>
                    <span className="font-bold text-white text-lg">{uniqueArtists}</span>
                  </div>
                </div>
              </div>

              {/* Top Genres */}
              <div className="bg-bg-secondary p-6 rounded-2xl border border-border">
                <h3 className="text-lg font-bold text-white mb-4">Top Genres</h3>
                {topGenres.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {topGenres.map((genre, i) => (
                      <span key={genre} className="bg-bg-tertiary px-3 py-1.5 rounded-full text-sm font-medium text-primary border border-primary/20">
                        #{i+1} {genre}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No genres identified yet.</p>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
              
              {likedSongs.length > 0 ? (
                <div className="space-y-3">
                  {[...likedSongs].reverse().slice(0, 5).map(song => (
                    <div 
                      key={song._id}
                      onClick={() => play(song, likedSongs)}
                      className="flex items-center gap-4 bg-bg-secondary p-3 rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer group"
                    >
                      <img src={song.coverUrl} className="w-14 h-14 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white truncate">{song.title}</h4>
                        <p className="text-sm text-gray-400 truncate">{song.artist}</p>
                      </div>
                      <div className="text-xs text-gray-500 hidden sm:block px-4">Liked</div>
                      <button className="w-10 h-10 rounded-full bg-white text-bg-primary items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex hover:scale-105">
                        <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-bg-secondary rounded-2xl border border-border">
                  <p className="text-gray-400">No recent activity. Start liking some songs!</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 pt-12 border-t border-[#2c2828]">
            <div className="mb-4">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">DANGER ZONE</span>
            </div>
            <div className="bg-[#e870700a] border border-[#e8707026] rounded-[10px] p-[16px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-[14px] font-bold text-[#e87070] mb-1">Delete Account</h3>
                <p className="text-[12px] text-[#786870]">
                  This will permanently delete your account, liked songs, and all playlists. This cannot be undone.
                </p>
              </div>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="bg-transparent border border-[#e87070] text-[#e87070] rounded-[8px] px-[16px] py-[8px] text-[13px] hover:bg-[#e870701a] transition-colors flex-shrink-0 font-medium"
              >
                Delete my account
              </button>
            </div>
          </div>

        </div>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#181616] w-full max-w-[400px] rounded-[14px] border border-[#2c2828] shadow-2xl p-[24px]">
              <div className="text-center mb-4">
                <span className="text-[32px]">⚠️</span>
              </div>
              <h3 className="text-[18px] font-[600] text-[#ede8e4] text-center mb-4">Delete your account?</h3>
              <div className="text-[13px] text-[#786870] leading-[1.6] mb-6">
                You're about to permanently delete:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Your account and profile</li>
                  <li>{likedSongs.length} liked songs</li>
                  <li>{playlists.length} playlists</li>
                  <li>Your entire listening history</li>
                </ul>
                <div className="mt-4 text-[#786870] font-medium">This action cannot be undone.</div>
              </div>

              <input 
                type="text" 
                placeholder="Type DELETE to confirm"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                className="w-full bg-[#221f1f] border border-[#2c2828] rounded-lg px-4 py-3 text-[#ede8e4] text-sm focus:outline-none focus:ring-1 focus:ring-[#e87070] focus:border-[#e87070] text-center tracking-widest"
              />
              
              {deleteError && (
                <div className="mt-2 mb-4 text-[#e87070] text-xs text-center">
                  {deleteError}
                </div>
              )}
              
              <div className={`flex justify-end gap-3 ${!deleteError ? 'mt-6' : ''}`}>
                <button 
                  onClick={() => { setShowDeleteModal(false); setDeleteInput(""); setDeleteError(""); }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold text-gray-400 border border-[#2c2828] hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== "DELETE" || isDeleting}
                  className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold bg-[#e87070] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {isDeleting ? "Deleting..." : "Delete Forever"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
