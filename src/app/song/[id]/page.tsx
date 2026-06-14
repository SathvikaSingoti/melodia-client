"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Music, Play } from "lucide-react";

interface Song {
  _id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  coverUrl: string;
  duration: number;
}

export default function SongSharePage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSong = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/songs/${id}`);
        setSong(res.data);
      } catch (error) {
        console.error("Failed to fetch song", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSong();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0909] flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-[#c4a090] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen bg-[#0a0909] flex flex-col justify-center items-center text-white">
        <h1 className="text-2xl font-bold mb-4">Song not found</h1>
        <button onClick={() => router.push('/')} className="text-[#c4a090] hover:underline">Go Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0909] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-96 bg-[#c4a090]/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="glass-panel w-full max-w-[480px] p-8 relative z-10 flex flex-col items-center border border-[#2c2828] bg-[#181616]/80 backdrop-blur-xl rounded-2xl shadow-2xl">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#c4a090] to-white bg-clip-text text-transparent mb-8">
          Melodia
        </h1>

        <div className="w-[240px] h-[240px] rounded-xl overflow-hidden shadow-2xl mb-8 relative border border-[#2c2828] group">
          {song.coverUrl ? (
            <img src={song.coverUrl} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 bg-[#181616]">
              <Music className="w-20 h-20 opacity-50" />
            </div>
          )}
        </div>

        <div className="text-center mb-8 w-full">
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight truncate">{song.title}</h2>
          <p className="text-xl text-gray-300 mb-2 truncate">{song.artist}</p>
          <div className="flex items-center justify-center gap-3 text-sm font-medium text-gray-500 uppercase tracking-widest mt-4">
            {song.album && <span>{song.album}</span>}
            {song.album && song.genre && <span>•</span>}
            {song.genre && <span>{song.genre}</span>}
          </div>
        </div>

        <button 
          onClick={() => router.push('/login')}
          className="w-full py-4 rounded-full font-bold tracking-widest uppercase transition-transform flex items-center justify-center gap-2 hover:scale-105 shadow-[0_0_20px_rgba(196,160,144,0.3)]"
          style={{ backgroundColor: '#c4a090', color: 'white' }}
        >
          <Play className="w-5 h-5 fill-current" /> Listen on Melodia
        </button>
      </div>
    </div>
  );
}
