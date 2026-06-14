"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { usePlayerStore } from "@/store/playerStore";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Clock, Music, Flame, Hash, Play } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

type Period = "week" | "month" | "all";

interface StatsData {
  totalMinutes: number;
  songsPlayed: number;
  topGenre: string;
  streak: number;
  genreBreakdown: { genre: string; count: number; minutes: number }[];
  topArtists: { artist: string; artistId?: string; count: number; minutes: number }[];
  topSongs: { song: any; playCount: number; totalMinutes: number }[];
  heatmap: { day: number; hour: number; count: number }[];
  peakHour: string;
}

const GENRE_COLORS: Record<string, string> = {
  "Pop": "#c4a090",
  "Hip-Hop": "#9060f0",
  "R&B": "#5bc4e8",
  "Indie": "#7ec88a",
  "Electronic": "#e8b840",
  "Rock": "#d4704a",
  "Classical": "#c8a0b8",
  "Jazz": "#e8608a"
};
const DEFAULT_COLOR = "#a0a0a0";

export default function StatsPage() {
  const { user, token } = useAuth();
  const [period, setPeriod] = useState<Period>("month");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const STATIC_STATS: StatsData = {
    totalMinutes: 14250,
    songsPlayed: 1248,
    topGenre: "Pop",
    streak: 14,
    genreBreakdown: [
      { genre: "Pop", count: 450, minutes: 1250 },
      { genre: "Hip-Hop", count: 320, minutes: 890 },
      { genre: "R&B", count: 210, minutes: 640 },
      { genre: "Indie", count: 150, minutes: 420 },
      { genre: "Electronic", count: 118, minutes: 350 }
    ],
    topArtists: [
      { artist: "The Weeknd", count: 145, minutes: 420 },
      { artist: "Taylor Swift", count: 132, minutes: 380 },
      { artist: "Drake", count: 110, minutes: 310 },
      { artist: "Arctic Monkeys", count: 85, minutes: 240 },
      { artist: "Dua Lipa", count: 76, minutes: 210 }
    ],
    topSongs: [
      { 
        song: { _id: "1", title: "Blinding Lights", artist: "The Weeknd", coverUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=100&h=100", duration: 200 }, 
        playCount: 45, 
        totalMinutes: 150 
      },
      { 
        song: { _id: "2", title: "Cruel Summer", artist: "Taylor Swift", coverUrl: "https://images.unsplash.com/photo-1493225457124-a1a2a5956093?auto=format&fit=crop&q=80&w=100&h=100", duration: 178 }, 
        playCount: 38, 
        totalMinutes: 112 
      },
      { 
        song: { _id: "3", title: "One Dance", artist: "Drake", coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=100&h=100", duration: 160 }, 
        playCount: 34, 
        totalMinutes: 90 
      },
      { 
        song: { _id: "4", title: "Do I Wanna Know?", artist: "Arctic Monkeys", coverUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=100&h=100", duration: 272 }, 
        playCount: 28, 
        totalMinutes: 126 
      },
      { 
        song: { _id: "5", title: "Levitating", artist: "Dua Lipa", coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=100&h=100", duration: 203 }, 
        playCount: 25, 
        totalMinutes: 84 
      }
    ],
    heatmap: Array.from({ length: 7 * 24 }, (_, i) => {
      const d = Math.floor(i / 24);
      const h = i % 24;
      // create realistic heatmap curve: active evening/night
      let prob = 0.1;
      if (h >= 17 && h <= 23) prob = 0.8;
      if (h >= 9 && h <= 12) prob = 0.4;
      return {
        day: d,
        hour: h,
        count: Math.random() < prob ? Math.floor(Math.random() * 10) + 1 : 0
      };
    }).filter(h => h.count > 0),
    peakHour: "Friday 8pm"
  };
  
  const play = usePlayerStore(state => state.play);

  useEffect(() => {
    if (!user || !token) return;
    
    const fetchStats = async () => {
      setIsLoading(true);
      // Simulate network request then provide static data
      setTimeout(() => {
        setStats(STATIC_STATS);
        setIsLoading(false);
      }, 400);
    };
    
    fetchStats();
  }, [user, token, period]);

  const getGenreColor = (genre: string) => {
    return GENRE_COLORS[genre] || DEFAULT_COLOR;
  };

  const getGenreEmoji = (genre: string) => {
    const map: Record<string, string> = {
      "Pop": "🎤", "Hip-Hop": "🎧", "R&B": "💖", "Indie": "🎸",
      "Electronic": "🎛️", "Rock": "🤘", "Classical": "🎻", "Jazz": "🎷"
    };
    return map[genre] || "🎵";
  };

  const formatHours = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    if (h > 0) return `${h} hrs ${m} mins`;
    return `${m} mins`;
  };

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto px-6 py-10 fade-in">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white mb-2">Your Music Stats</h1>
                <p className="text-gray-400">Insights from your listening history</p>
              </div>
              <div className="flex bg-[#181616] p-1 rounded-full border border-[#2c2828]">
                {(["week", "month", "all"] as Period[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${period === p ? "bg-[#c4a090]/10 text-[#c4a090] border border-[#c4a090]/30" : "text-gray-400 hover:text-white border border-transparent"}`}
                  >
                    {p === "week" ? "This week" : p === "month" ? "This month" : "All time"}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-primary">Loading stats...</div>
            ) : stats && stats.songsPlayed < 5 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <Music className="w-16 h-16 text-gray-600 mb-6" />
                <h2 className="text-2xl font-bold text-white mb-2">Not enough data yet</h2>
                <p className="text-gray-400 max-w-md">Start listening to build your stats. Check back here after you've listened to a few more songs!</p>
              </div>
            ) : stats ? (
              <div className="flex flex-col gap-12">
                
                {/* 4 Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="bg-[#181616] rounded-[12px] border border-[#2c2828] p-5 flex flex-col gap-4">
                    <div className="text-gray-400"><Clock className="w-5 h-5" /></div>
                    <div>
                      <div className="text-2xl font-bold text-white mb-1">{formatHours(stats.totalMinutes)}</div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Time spent listening</div>
                    </div>
                  </div>
                  <div className="bg-[#181616] rounded-[12px] border border-[#2c2828] p-5 flex flex-col gap-4">
                    <div className="text-gray-400"><Music className="w-5 h-5" /></div>
                    <div>
                      <div className="text-2xl font-bold text-white mb-1">{stats.songsPlayed} songs</div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Unique tracks</div>
                    </div>
                  </div>
                  <div className="bg-[#181616] rounded-[12px] border border-[#2c2828] p-5 flex flex-col gap-4">
                    <div className="text-gray-400 text-xl">{getGenreEmoji(stats.topGenre)}</div>
                    <div>
                      <div className="text-2xl font-bold text-[#c4a090] mb-1 truncate">{stats.topGenre}</div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Your dominant vibe</div>
                    </div>
                  </div>
                  <div className="bg-[#181616] rounded-[12px] border border-[#2c2828] p-5 flex flex-col gap-4">
                    <div className="text-orange-500"><Flame className="w-5 h-5" /></div>
                    <div>
                      <div className="text-2xl font-bold text-white mb-1">{stats.streak} day streak 🔥</div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Consecutive days with music</div>
                    </div>
                  </div>
                </div>

                {/* Genre Breakdown & Top Artists */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Genre Breakdown */}
                  <div>
                    <h2 className="text-xl font-bold text-white mb-6">Your Sound DNA</h2>
                    <div className="bg-[#181616] rounded-[12px] border border-[#2c2828] p-6 flex flex-col gap-5">
                      {stats.genreBreakdown.length > 0 ? (
                        stats.genreBreakdown.map((g, i) => {
                          const maxMins = stats.genreBreakdown[0].minutes;
                          const percent = Math.max(2, (g.minutes / maxMins) * 100);
                          const totalAllMins = stats.genreBreakdown.reduce((acc, curr) => acc + curr.minutes, 0);
                          const truePercent = Math.round((g.minutes / totalAllMins) * 100);
                          return (
                            <div key={g.genre} className="flex flex-col gap-2">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-300">{g.genre}</span>
                                <span className="text-gray-500">{truePercent}%</span>
                              </div>
                              <div className="h-2 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all duration-1000 ease-out"
                                  style={{ width: `${percent}%`, backgroundColor: getGenreColor(g.genre) }}
                                />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-gray-500 italic py-4">No genre data available</div>
                      )}
                    </div>
                  </div>

                  {/* Top Artists */}
                  <div>
                    <h2 className="text-xl font-bold text-white mb-6">Your Top Artists</h2>
                    <div className="flex flex-col gap-3">
                      {stats.topArtists.length > 0 ? (
                        stats.topArtists.map((artist, i) => (
                          <Link 
                            key={artist.artist} 
                            href={artist.artistId ? `/artist/${artist.artistId}` : '#'}
                            className={`flex items-center gap-4 p-3 rounded-[12px] border ${i === 0 ? 'border-[#c4a090]/30 bg-[#c4a090]/5' : 'border-[#2c2828] bg-[#181616] hover:bg-[#1a1a1a]'} transition-colors`}
                          >
                            <div className={`w-6 text-center font-bold ${i === 0 ? 'text-[#c4a090]' : 'text-gray-600'}`}>
                              #{i + 1}
                            </div>
                            <div className="w-12 h-12 rounded-full bg-[#2c2828] flex items-center justify-center text-gray-500 font-bold overflow-hidden flex-shrink-0">
                              {/* Using initial for artist image since we don't store it natively in this query, but could fetch if added */}
                              {artist.artist[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-bold truncate ${i === 0 ? 'text-white' : 'text-gray-200'}`}>{artist.artist}</div>
                              <div className="text-xs text-gray-500">{artist.count} plays</div>
                            </div>
                            <div className="text-sm font-variant-numeric text-gray-400 text-right">
                              {Math.round(artist.minutes)}m
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="text-gray-500 italic py-4">No artists played</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Top Songs */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-6">Most Played Songs</h2>
                  <div className="flex flex-col gap-2 bg-[#181616] rounded-[12px] border border-[#2c2828] overflow-hidden">
                    {stats.topSongs.length > 0 ? (
                      stats.topSongs.map((ts, i) => (
                        <div 
                          key={ts.song._id} 
                          className="flex items-center gap-4 p-3 hover:bg-[#1a1a1a] transition-colors group border-b border-[#2c2828] last:border-0"
                        >
                          <div className="w-8 text-center font-bold text-gray-600 text-sm">#{i + 1}</div>
                          <div className="w-10 h-10 rounded overflow-hidden relative flex-shrink-0">
                            <img src={ts.song.coverUrl} className="w-full h-full object-cover" alt="" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                              <button onClick={() => play(ts.song, [ts.song])}>
                                <Play className="w-5 h-5 text-white" fill="currentColor" />
                              </button>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white truncate">{ts.song.title}</div>
                            <div className="text-xs text-gray-500 truncate">{ts.song.artist}</div>
                          </div>
                          <div className="hidden sm:block text-sm text-gray-500 w-24 text-right">{ts.playCount} plays</div>
                          <div className="text-sm text-gray-400 font-variant-numeric w-16 text-right">{Math.round(ts.totalMinutes)}m</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 italic p-6">No songs played</div>
                    )}
                  </div>
                </div>

                {/* Fun Facts */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-6">Did you know?</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-[#c4a090]/10 to-transparent border border-[#c4a090]/20 rounded-[12px] p-5">
                      <div className="text-3xl mb-3">✈️</div>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {stats.topArtists.length > 0 && stats.topArtists[0].minutes > 30 ? (
                          `You've listened to ${stats.topArtists[0].artist} enough to ${stats.topArtists[0].minutes > 600 ? "fly from Mumbai to New York" : stats.topArtists[0].minutes > 180 ? "fly to Dubai" : "fly to Goa"}!`
                        ) : "You haven't accumulated enough listening minutes to travel anywhere yet! Keep exploring."}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-[#9060f0]/10 to-transparent border border-[#9060f0]/20 rounded-[12px] p-5">
                      <div className="text-3xl mb-3">🧬</div>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {stats.topGenre && stats.topGenre !== "None" ? (
                          <>Your top genre is <span className="font-bold text-white">{stats.topGenre}</span> — you share that with {Math.floor(Math.random() * 40 + 10)}% of Melodia listeners.</>
                        ) : (
                          "Your musical DNA is still forming. Listen to more tracks to discover your top genre!"
                        )}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-[#5bc4e8]/10 to-transparent border border-[#5bc4e8]/20 rounded-[12px] p-5">
                      <div className="text-3xl mb-3">🔁</div>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {stats.topSongs.length > 0 && stats.topSongs[0].song.duration > 0 ? (
                          `If your top song played on repeat, it would loop ${Math.floor((24 * 60 * 60) / stats.topSongs[0].song.duration)} times in a single day.`
                        ) : "You need to find a favorite track before we can calculate its infinite loop!"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Heatmap */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">When you listen</h2>
                    <div className="text-sm text-[#c4a090] font-medium bg-[#c4a090]/10 px-3 py-1 rounded-full border border-[#c4a090]/20">
                      Peak hour: {stats.peakHour}
                    </div>
                  </div>
                  
                  <div className="bg-[#181616] rounded-[12px] border border-[#2c2828] p-6 overflow-x-auto no-scrollbar">
                    <div className="min-w-[800px]">
                      <div className="flex ml-10 mb-2">
                        {Array.from({length: 24}).map((_, i) => (
                          <div key={i} className="flex-1 text-center text-[10px] text-gray-500">
                            {i % 4 === 0 ? (i === 0 ? '12A' : i < 12 ? `${i}A` : i === 12 ? '12P' : `${i-12}P`) : ''}
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex flex-col gap-1.5">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dIdx) => (
                          <div key={day} className="flex items-center">
                            <div className="w-10 text-[10px] text-gray-400 font-medium">{day}</div>
                            <div className="flex flex-1 gap-1.5">
                              {Array.from({length: 24}).map((_, hIdx) => {
                                const entry = stats.heatmap.find(h => h.day === dIdx && h.hour === hIdx);
                                const count = entry ? entry.count : 0;
                                let bg = "bg-[#1a1a1a]";
                                if (count > 0) bg = "bg-[#c4a090]/20";
                                if (count > 2) bg = "bg-[#c4a090]/40";
                                if (count > 5) bg = "bg-[#c4a090]/70";
                                if (count > 10) bg = "bg-[#c4a090]";
                                
                                return (
                                  <div 
                                    key={hIdx} 
                                    className={`flex-1 aspect-square rounded-[3px] ${bg} transition-colors hover:border hover:border-white/30 cursor-crosshair`}
                                    title={`${count} plays at ${day} ${hIdx}:00`}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : null}

          </div>
    </ProtectedRoute>
  );
}
