"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Music, Play } from "lucide-react";
import TrackList from "@/components/TrackList";
import { usePlayerStore, Song } from "@/store/playerStore";

interface Album {
  _id: string;
  name: string;
  artist: string;
  coverUrl: string;
  songs: Song[];
  releaseYear?: number;
}

import PublicLayout from "@/components/PublicLayout";

export default function AlbumPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const play = usePlayerStore(state => state.play);

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/albums/${id}`);
        setAlbum(res.data);
      } catch (error) {
        console.error("Failed to fetch album", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbum();
  }, [id]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="h-full bg-[#0a0909] flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-[#c4a090] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PublicLayout>
    );
  }

  if (!album) {
    return (
      <PublicLayout>
        <div className="h-full bg-[#0a0909] flex flex-col justify-center items-center text-white">
          <h1 className="text-2xl font-bold mb-4">Album not found</h1>
          <button onClick={() => router.push('/')} className="text-[#c4a090] hover:underline">Go Home</button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="p-8 max-w-7xl mx-auto pb-32">
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors self-start text-sm font-semibold uppercase tracking-widest"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row gap-8 mb-12 items-end">
          <div className="w-52 h-52 rounded-xl overflow-hidden shadow-2xl relative border border-[#2c2828] group shrink-0 bg-bg-secondary">
            {album.coverUrl ? (
              <img src={album.coverUrl} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <Music className="w-20 h-20 opacity-50" />
              </div>
            )}
          </div>
          
          <div className="flex-1 flex flex-col items-start min-w-0">
            <span className="text-xs font-bold tracking-widest text-[#c4a090] uppercase mb-2">Album</span>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 tracking-tighter truncate w-full">
              {album.name}
            </h1>
            <div className="flex items-center gap-3 text-gray-300 text-sm font-medium">
              <span className="text-white font-semibold">{album.artist}</span>
              {album.releaseYear && <span>•</span>}
              {album.releaseYear && <span>{album.releaseYear}</span>}
              <span>•</span>
              <span>{album.songs?.length || 0} songs</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => {
              if (album.songs && album.songs.length > 0) {
                play(album.songs[0], album.songs);
              }
            }}
            disabled={!album.songs || album.songs.length === 0}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-[#c4a090] text-white hover:scale-105 transition-transform shadow-[0_0_20px_rgba(196,160,144,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-6 h-6 ml-1 fill-current" />
          </button>
        </div>

        {/* Track List */}
        <div className="glass-panel p-6 rounded-xl border border-border bg-[#181616]/50">
          <TrackList songs={album.songs || []} />
        </div>
      </div>
    </PublicLayout>
  );
}
