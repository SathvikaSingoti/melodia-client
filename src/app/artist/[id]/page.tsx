"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import TrackList from "@/components/TrackList";
import ProtectedRoute from "@/components/ProtectedRoute";
import { usePlayerStore, Song } from "@/store/playerStore";

interface Artist {
  _id: string;
  name: string;
  bio: string;
  genre: string;
  imageUrl: string;
  monthlyListeners: number;
  songs: Song[];
  followers: string[];
}

export default function ArtistPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const play = usePlayerStore(state => state.play);
  
  const [artist, setArtist] = useState<Artist | null>(null);
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    if (user && id) {
      fetchArtist();
      fetchLikedSongs();
    }
  }, [user, id]);

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchArtist = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/artists/${id}`, getHeaders());
      setArtist(res.data);
      setFollowerCount(res.data.followers?.length || 0);
      if (user) {
        setIsFollowing(res.data.followers?.includes(user._id || user.id));
      }
    } catch (error) {
      console.error("Failed to fetch artist", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLikedSongs = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${user?._id}/liked`, getHeaders());
      setLikedSongIds(new Set(res.data.map((s: any) => s._id)));
    } catch (error) {
      console.error("Failed to fetch liked songs", error);
    }
  };

  const toggleLike = async (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    try {
      const isLiked = likedSongIds.has(songId);
      if (isLiked) {
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/users/${user?._id}/liked/${songId}`, getHeaders());
        setLikedSongIds(prev => {
          const next = new Set(prev);
          next.delete(songId);
          return next;
        });
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/${user?._id}/liked`, { songId }, getHeaders());
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

  const handleFollow = async () => {
    if (!user) return;
    try {
      setIsFollowing(!isFollowing);
      setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1);
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/artists/${id}/follow`, {}, getHeaders());
    } catch (e) {
      setIsFollowing(isFollowing);
      setFollowerCount(prev => isFollowing ? prev + 1 : prev - 1);
      console.error(e);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center h-[calc(100vh-160px)]">
          <div className="w-8 h-8 border-4 border-[#c4a090] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!artist) {
    return (
      <ProtectedRoute>
        <div className="p-8 text-center text-gray-400">Artist not found</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-full w-full max-w-[1400px] mx-auto overflow-hidden">
        
        {/* LEFT COLUMN - Fixed Details */}
        <div className="w-[260px] h-full overflow-y-auto no-scrollbar flex-shrink-0 flex flex-col p-8 bg-[#181616] border-r border-[#2c2828]">
          <div className="w-[200px] h-[200px] rounded-full mx-auto overflow-hidden shadow-2xl mb-6 flex-shrink-0 group relative">
            <img 
              src={artist.imageUrl} 
              alt={artist.name} 
              className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
            />
            <div 
              onClick={() => { if (artist.songs.length > 0) play(artist.songs[0], artist.songs); }}
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer bg-black/40"
            >
              <button className="w-16 h-16 flex items-center justify-center rounded-full bg-white text-black shadow-2xl hover:scale-105 transition-transform">
                <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </button>
            </div>
          </div>
          
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">{artist.name}</h1>
            <p className="text-gray-400 text-sm mb-4">{artist.monthlyListeners.toLocaleString()} monthly listeners</p>
            <button 
              onClick={handleFollow}
              className={`w-full py-2 rounded-full border text-sm font-bold tracking-widest uppercase transition-colors ${
                isFollowing 
                  ? 'border-[#c4a090] text-[#c4a090] hover:bg-[#c4a09011]' 
                  : 'border-white text-white hover:bg-white/10'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>

          <div className="mb-6 flex flex-wrap gap-2 justify-center">
            {artist.genre.split(',').map((g, i) => (
              <span key={i} className="text-xs font-semibold bg-white/10 text-gray-300 px-3 py-1 rounded-full">
                {g.trim()}
              </span>
            ))}
          </div>

          <div className="flex-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">About</h3>
            <p className="text-sm text-gray-400 leading-relaxed line-clamp-6" title={artist.bio}>
              {artist.bio}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN - Scrollable Content */}
        <div className="flex-1 h-full overflow-y-auto no-scrollbar p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Popular</h2>
          {artist.songs.length > 0 ? (
            <TrackList 
              songs={artist.songs} 
              likedSongIds={likedSongIds}
              onToggleLike={toggleLike}
            />
          ) : (
            <div className="text-gray-500 text-center py-20">This artist has no songs yet.</div>
          )}
        </div>
        
      </div>
    </ProtectedRoute>
  );
}
