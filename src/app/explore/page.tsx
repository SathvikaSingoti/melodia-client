"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { usePlayerStore, Song } from "@/store/playerStore";
import SongMenu from "@/components/SongMenu";
import Link from "next/link";
import { Play } from "lucide-react";

const MOODS = [
  { mood: "Chill & Focused", emoji: "🌿" },
  { mood: "Energetic Vibe", emoji: "⚡" },
  { mood: "Happy & Upbeat", emoji: "😊" }
];

export default function ExplorePage() {
  const { user } = useAuth();
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [moodOfTheDay, setMoodOfTheDay] = useState<{mood: string, emoji: string} | null>(null);
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(new Set());
  
  const recentlyPlayed = usePlayerStore(state => state.recentlyPlayed) || [];
  const play = usePlayerStore(state => state.play);
  const isPlaying = usePlayerStore(state => state.isPlaying);
  const currentSong = usePlayerStore(state => state.currentSong);
  const setDetailSong = usePlayerStore(state => state.setDetailSong);

  useEffect(() => {
    const randomMood = MOODS[Math.floor(Math.random() * MOODS.length)];
    setMoodOfTheDay(randomMood);

    Promise.all([
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/songs`),
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/artists`).catch(() => ({ data: [] }))
    ]).then(([songsRes, artistsRes]) => {
      const uniqueSongs = songsRes.data.filter((s: Song, i: number, a: Song[]) => a.findIndex(t => t.title === s.title && t.artist === s.artist) === i);
      setAllSongs(uniqueSongs);
      setArtists(artistsRes.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (user) {
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${user._id}/liked`).then(res => {
        setLikedSongIds(new Set(res.data.map((s: Song) => s._id)));
      });
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${user._id}/playlists`).then(res => {
        setUserPlaylists(res.data);
      });
    }
  }, [user]);

  const toggleLike = async (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    if (!user) return;
    const isLiked = likedSongIds.has(songId);
    try {
      if (isLiked) {
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/users/${user._id}/liked/${songId}`);
        setLikedSongIds(prev => { const next = new Set(prev); next.delete(songId); return next; });
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/${user._id}/liked`, { songId });
        setLikedSongIds(prev => { const next = new Set(prev); next.add(songId); return next; });
      }
    } catch (error) {
      console.error("Failed to toggle like", error);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
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

  // Generate sections
  const forYouSongs = allSongs.slice(0, 3);
  const trendingSongs = [...allSongs].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 5);
  const newDrops = [...allSongs].reverse().slice(0, 4);
  const aiPlaylist = userPlaylists.find(p => p.name.toLowerCase().includes("ai")) || userPlaylists[0];

  return (
    <ProtectedRoute>
      <div className="p-8 max-w-5xl mx-auto space-y-12">
        
        {/* 1. MOOD BANNER CARD */}
        {moodOfTheDay && (
          <div 
            onClick={() => setActiveMood(activeMood === moodOfTheDay.mood ? null : moodOfTheDay.mood)}
            className="w-full p-6 rounded-[10px] cursor-pointer transition-all border-l-[3px] shadow-lg flex flex-col justify-center"
            style={{ 
              backgroundColor: '#181616', 
              borderColor: activeMood === moodOfTheDay.mood ? '#fff' : '#c4a090' 
            }}
          >
            <span className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: '#ede8e4' }}>
              Mood of the day {activeMood === moodOfTheDay.mood && "(Active)"}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-4xl">{moodOfTheDay.emoji}</span>
              <h2 className="text-3xl font-[800] text-white tracking-tight">{moodOfTheDay.mood}</h2>
            </div>
          </div>
        )}

        {/* 2. HORIZONTAL SONG CARDS ROW ("For you") */}
        {forYouSongs.length > 0 && (
          <section>
            <h3 className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-4">For you</h3>
            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4">
              {forYouSongs.map(song => (
                <div 
                  key={song._id} 
                  onClick={() => play(song, forYouSongs)}
                  className="flex-shrink-0 w-48 group cursor-pointer"
                >
                  <div className="w-48 h-48 rounded-lg overflow-hidden mb-3 relative shadow-md">
                    <img src={song.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform shadow-xl">
                        <Play className="w-5 h-5 ml-1" fill="currentColor" />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-semibold text-white truncate text-[15px]">{song.title}</h4>
                  <div className="text-[13px] text-gray-400 truncate">{song.artist}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. AI PICK CARD */}
        {aiPlaylist && (
          <div className="w-full rounded-xl overflow-hidden shadow-xl p-6 relative group" style={{ background: '#0f0d18', border: '1px solid #1e1e2e' }}>
            <h3 className="text-[11px] font-bold tracking-wider uppercase mb-4" style={{ color: '#9060f0' }}>AI pick for you</h3>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-bg-tertiary shadow-lg">
                {aiPlaylist.songs?.length > 0 ? (
                  <img src={aiPlaylist.songs[0].coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🤖</div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-3xl font-bold text-white mb-2">{aiPlaylist.name}</h4>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">A personalized, AI-curated mix blending your favorite genres and recent discoveries.</p>
                <button className="bg-white text-black font-semibold text-sm px-6 py-2 rounded-full hover:scale-105 transition-transform inline-flex items-center gap-2">
                  <Play className="w-4 h-4" fill="currentColor" /> Play
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. TRENDING ROWS */}
        {trendingSongs.length > 0 && (
          <section>
            <h3 className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-4">Trending now</h3>
            <div className="flex flex-col gap-2">
              {trendingSongs.map((song, i) => (
                <div 
                  key={song._id}
                  onClick={() => setDetailSong(song)}
                  className="flex items-center gap-4 p-2 rounded-lg hover:bg-white/5 group cursor-pointer transition-colors"
                >
                  <div className="w-6 text-gray-500 font-bold text-center text-sm">{i + 1}</div>
                  <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                    <img src={song.coverUrl} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); play(song, trendingSongs); }}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform shadow-lg"
                      >
                        <Play className="w-3 h-3 ml-0.5" fill="currentColor" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate text-sm">{song.title}</h4>
                    <div className="text-gray-400 text-xs truncate">{song.artist}</div>
                  </div>
                  <div className="hidden md:block w-24 text-right text-gray-500 text-xs">{(song.plays || 0).toLocaleString()} plays</div>
                  <div className="w-12 text-right text-xs text-gray-400 mr-2">{formatDuration(song.duration)}</div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => toggleLike(e, song._id)} className="p-1 text-gray-400 hover:text-white transition-colors">
                      <svg className={`w-4 h-4 ${likedSongIds.has(song._id) ? 'text-[#c4a090]' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d={likedSongIds.has(song._id) 
                          ? "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                          : "M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"}
                        />
                      </svg>
                    </button>
                    <div onClick={e => e.stopPropagation()}>
                      <SongMenu song={song} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. HORIZONTAL ARTIST CARDS ROW */}
        {artists.length > 0 && (
          <section>
            <h3 className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-4">Popular artists</h3>
            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4">
              {artists.slice(0, 10).map(artist => (
                <Link href={`/artist/${artist._id}`} key={artist._id} className="flex flex-col items-center flex-shrink-0 w-32 group">
                  <div className="w-32 h-32 rounded-full overflow-hidden mb-3 shadow-lg">
                    <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <span className="font-semibold text-white text-sm truncate w-full text-center group-hover:underline">{artist.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 6. NEW RELEASES GRID (2x2) */}
        {newDrops.length > 0 && (
          <section>
            <h3 className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-4">New drops</h3>
            <div className="grid grid-cols-2 gap-4">
              {newDrops.map(song => (
                <div 
                  key={song._id}
                  onClick={() => setDetailSong(song)}
                  className="bg-white/5 rounded-lg p-3 flex gap-4 cursor-pointer hover:bg-white/10 transition-colors group relative"
                >
                  <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden relative shadow-md">
                    <img src={song.coverUrl} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="font-semibold text-white truncate text-sm mb-1">{song.title}</h4>
                    <span className="text-xs text-gray-400 truncate">{song.artist}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); play(song, newDrops); }}
                    className="absolute bottom-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-all shadow-xl opacity-0 group-hover:opacity-100 z-10"
                  >
                    <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7. RECENTLY PLAYED ROW */}
        {recentlyPlayed.length > 0 && (
          <section>
            <h3 className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-4">Recently played</h3>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
              {recentlyPlayed.slice(0, 8).map(song => (
                <div 
                  key={song._id}
                  onClick={() => play(song, recentlyPlayed)}
                  className="flex-shrink-0 w-32 group cursor-pointer"
                >
                  <div className="w-32 h-32 rounded-lg overflow-hidden mb-2 relative shadow-md">
                    <img src={song.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform shadow-lg">
                        <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-semibold text-white text-xs truncate">{song.title}</h4>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </ProtectedRoute>
  );
}
