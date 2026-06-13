"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { usePlayerStore, Song } from "@/store/playerStore";
import TrackList from "@/components/TrackList";
import { Music } from "lucide-react";

interface Album {
  _id: string;
  name: string;
  artist: string;
  coverUrl: string;
  songs: Song[];
  releaseYear: number;
}

export default function AlbumPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { user, token } = useAuth();
  const play = usePlayerStore(state => state.play);
  
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (token) {
      fetchAlbum();
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

  const fetchAlbum = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/albums/${id}`, getHeaders());
      setAlbum(res.data);
    } catch (error) {
      console.error("Failed to fetch album", error);
    } finally {
      setLoading(false);
    }
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

  if (!album) {
    return (
      <ProtectedRoute>
        <div className="p-8 text-center text-white">Album not found</div>
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
            {album.coverUrl ? (
              <img src={album.coverUrl} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, rgba(168,207,255,0.3), rgba(255,214,165,0.2))' }}>
                <Music className="w-16 h-16 opacity-50" />
              </div>
            )}
          </div>
          <div className="flex-1 w-full">
            <p className="uppercase text-xs font-bold tracking-widest text-gray-400 mb-2">Album</p>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              {album.name}
            </h1>
            <div className="flex items-center gap-4 mb-6">
               <span className="text-white font-medium">{album.artist}</span>
               <span className="text-gray-500">•</span>
               <span className="text-gray-400">{album.releaseYear || 'Unknown Year'}</span>
            </div>
            <div className="flex items-center gap-6">
              <p className="text-gray-300 font-medium">
                {album.songs.length} {album.songs.length === 1 ? 'song' : 'songs'}
              </p>
              <button 
                onClick={() => {
                  if (album.songs.length > 0) {
                    play(album.songs[0], album.songs);
                  }
                }}
                className="w-14 h-14 bg-white text-bg-primary rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                title="Play All"
              >
                <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Album Songs */}
        <div className="mb-12">
          {album.songs.length > 0 ? (
            <TrackList 
              songs={album.songs}
              likedSongIds={likedSongIds}
              onToggleLike={toggleLike}
            />
          ) : (
            <div className="text-center py-20 text-gray-400">
              No songs found in this album.
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
