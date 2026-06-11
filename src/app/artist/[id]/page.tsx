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
}

export default function ArtistPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const play = usePlayerStore(state => state.play);
  
  const [artist, setArtist] = useState<Artist | null>(null);
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-160px)]">
        <div className="w-8 h-8 border-4 border-[#A8CFFF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!artist) {
    return <div className="p-8 text-center text-gray-400">Artist not found</div>;
  }

  return (
    <ProtectedRoute>
      <div className="pb-24">
        {/* Artist Header */}
        <div className="relative h-[340px] flex items-end p-8 bg-bg-secondary">
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-luminosity"
            style={{ 
              backgroundImage: `url(${artist.imageUrl})`,
              filter: 'blur(40px) brightness(0.3)'
            }}
          />
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-transparent" />
          
          <div className="relative z-10 flex items-end gap-6 w-full">
            <img 
              src={artist.imageUrl} 
              alt={artist.name} 
              className="w-[232px] h-[232px] rounded-full object-cover shadow-2xl border-4 border-bg-secondary"
            />
            <div className="flex flex-col mb-4">
              <span className="text-sm font-bold text-white/80 uppercase tracking-widest mb-2">Verified Artist</span>
              <h1 className="text-6xl font-black text-white mb-6 drop-shadow-lg tracking-tight">
                {artist.name}
              </h1>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-[#A8CFFF] font-medium">
                  {artist.monthlyListeners.toLocaleString()} monthly listeners
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-8 py-6 flex items-center gap-6">
          <button 
            onClick={() => { if (artist.songs.length > 0) play(artist.songs[0], artist.songs); }}
            className="w-14 h-14 flex items-center justify-center rounded-full text-bg-primary hover:scale-105 transition-transform shadow-[0_0_20px_rgba(168,207,255,0.3)]"
            style={{ background: 'linear-gradient(135deg, #A8CFFF, #FFD6A5)' }}
          >
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </button>
          <button className="px-6 py-1.5 rounded-full border border-gray-400 text-white text-sm font-bold tracking-widest uppercase hover:border-[#A8CFFF] hover:text-[#A8CFFF] transition-colors">
            Follow
          </button>
        </div>

        {/* Content */}
        <div className="px-8 flex gap-8">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-6">Popular</h2>
            <TrackList 
              songs={artist.songs} 
              likedSongIds={likedSongIds}
              onToggleLike={toggleLike}
            />
          </div>
          
          {/* About Section */}
          <div className="w-80 flex-shrink-0">
            <h2 className="text-2xl font-bold text-white mb-6">About</h2>
            <div className="bg-bg-secondary p-6 rounded-2xl cursor-pointer hover:bg-bg-tertiary transition-colors group">
              <div className="aspect-square mb-4 overflow-hidden rounded-xl">
                <img 
                  src={artist.imageUrl} 
                  alt={artist.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="flex items-center gap-2 mb-2 text-white font-medium">
                <span className="text-[#A8CFFF]">{artist.monthlyListeners.toLocaleString()} listeners</span>
              </div>
              <p className="text-sm text-gray-400 line-clamp-4">
                {artist.bio}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
