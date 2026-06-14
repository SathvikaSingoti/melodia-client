"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { usePlayerStore, Song } from "@/store/playerStore";
import { useLikedStore, useLikeAction } from "@/store/likedStore";
import Link from "next/link";
import { Heart, Play, Clock, Medal, ChevronRight, ChevronDown } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

interface PlayHistoryEntry {
  _id: string;
  song: Song;
  playedAt: string;
  duration: number;
}

interface GroupedHistory {
  id: string;
  label: string;
  items: CollapsedHistoryItem[];
}

interface CollapsedHistoryItem {
  id: string;
  song: Song;
  firstPlayedAt: Date;
  lastPlayedAt: Date;
  playCount: number;
}

export default function TimelinePage() {
  const { user, token } = useAuth();
  const { play, currentSong, isPlaying, pause, resume } = usePlayerStore();
  const [history, setHistory] = useState<PlayHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const likedSongIds = useLikedStore(state => state.likedIds);
  const toggleLikeAction = useLikeAction();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Today": true,
    "Yesterday": true
  });

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fullDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  const getGroupIdForDay = (dayIdx: number) => {
    const now = new Date();
    if (now.getDay() === dayIdx) return "Today";
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (yesterday.getDay() === dayIdx) return "Yesterday";
    return fullDays[dayIdx];
  };

  const scrollToGroup = (dayIdx: number) => {
    const groupId = getGroupIdForDay(dayIdx);
    setExpandedGroups(prev => ({ ...prev, [groupId]: true }));
    setTimeout(() => {
      document.getElementById(`timeline-group-${groupId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  useEffect(() => {
    if (!user || !token) return;

    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${user._id}/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(res.data);
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, token]);

  // Destructure mostActive from useMemo
  const { timelineGroups, stats, moodGrid, topSongs, mostActive } = useMemo(() => {
    if (!history.length) return { timelineGroups: [], stats: { plays: 0, hours: '0.0', artists: 0, uniqueSongs: 0, favoriteGenre: "None" }, moodGrid: [], topSongs: [], mostActive: { day: 0, hour: 0 } };

    // Stats calculation
    const plays = history.length;
    const totalSeconds = history.reduce((acc, curr) => acc + (curr.duration || curr.song?.duration || 0), 0);
    const hours = (totalSeconds / 3600).toFixed(1);
    const uniqueArtists = new Set(history.map(h => h.song?.artistId || h.song?.artist)).size;
    const uniqueSongs = new Set(history.map(h => h.song?._id)).size;

    // Mood Grid calculation (7 days x 24 hours)
    // grid[dayOfWeek][hour] (dayOfWeek: 0 = Sun, 1 = Mon ... 6 = Sat)
    const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
    
    // Top Songs & Genres
    const songCounts: Record<string, { song: Song, count: number }> = {};
    const genreCounts: Record<string, number> = {};

    // Grouping
    const now = new Date();
    const todayStr = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);

    const groupsMap = new Map<string, PlayHistoryEntry[]>();

    history.forEach(entry => {
      if (!entry.song) return; // safety
      const date = new Date(entry.playedAt);
      const dateStr = date.toDateString();
      
      // Grid
      grid[date.getDay()][date.getHours()]++;

      // Top Songs & Genre
      if (!songCounts[entry.song._id]) songCounts[entry.song._id] = { song: entry.song, count: 0 };
      songCounts[entry.song._id].count++;
      
      const genre = entry.song.genre || "Unknown";
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;

      // Grouping Logic
      let groupLabel = "Earlier";
      if (dateStr === todayStr) {
        groupLabel = "Today";
      } else if (dateStr === yesterdayStr) {
        groupLabel = "Yesterday";
      } else if (date > oneWeekAgo) {
        groupLabel = "This Week";
      } else if (date > twoWeeksAgo) {
        groupLabel = "Last Week";
      }

      if (groupLabel === "This Week") {
        // use day of week as label
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        groupLabel = days[date.getDay()];
      }

      if (!groupsMap.has(groupLabel)) groupsMap.set(groupLabel, []);
      groupsMap.get(groupLabel)!.push(entry);
    });

    // Order of groups
    const order = ["Today", "Yesterday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Last Week", "Earlier"];
    const timelineGroups: GroupedHistory[] = [];

    order.forEach(label => {
      if (groupsMap.has(label)) {
        const rawItems = groupsMap.get(label)!;
        const dailyCounts: Record<string, number> = {};
        rawItems.forEach(item => {
          dailyCounts[item.song._id] = (dailyCounts[item.song._id] || 0) + 1;
        });

        const collapsed: CollapsedHistoryItem[] = [];
        const seenSongs = new Set<string>();

        rawItems.forEach(item => {
          if (!seenSongs.has(item.song._id)) {
            seenSongs.add(item.song._id);
            collapsed.push({
              id: item._id,
              song: item.song,
              firstPlayedAt: new Date(item.playedAt),
              lastPlayedAt: new Date(item.playedAt),
              playCount: dailyCounts[item.song._id]
            });
          }
        });

        timelineGroups.push({ id: label, label, items: collapsed });
      }
    });

    // Compute most active time
    let maxPlays = -1;
    let mostActiveDay = 0;
    let mostActiveHour = 0;
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        if (grid[d][h] > maxPlays) {
          maxPlays = grid[d][h];
          mostActiveDay = d;
          mostActiveHour = h;
        }
      }
    }

    const topList = Object.values(songCounts).sort((a, b) => b.count - a.count).slice(0, 5);

    let favoriteGenre = "None";
    let maxGenreCount = 0;
    for (const [g, count] of Object.entries(genreCounts)) {
      if (count > maxGenreCount) {
        maxGenreCount = count;
        favoriteGenre = g;
      }
    }

    return {
      timelineGroups,
      stats: { plays, hours, artists: uniqueArtists, uniqueSongs, favoriteGenre },
      moodGrid: grid,
      topSongs: topList,
      mostActive: { day: mostActiveDay, hour: mostActiveHour }
    };
  }, [history]);

  const daysLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const formatHour = (h: number) => {
    if (h === 0) return "12am";
    if (h === 12) return "12pm";
    return h < 12 ? `${h}am` : `${h - 12}pm`;
  };

  if (loading) return (
    <ProtectedRoute>
      <div className="p-8 text-gray-400">Loading timeline...</div>
    </ProtectedRoute>
  );

  return (
    <ProtectedRoute>
    <div className="flex-1 overflow-y-auto w-full no-scrollbar px-8 py-8 flex justify-center fade-in">
      <div className="max-w-6xl w-full flex flex-col lg:flex-row gap-16">
        
        {/* LEFT COLUMN: TIMELINE */}
        <div className="flex-1">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2 flex items-center gap-3">
              <Clock className="w-8 h-8 text-[#c4a090]" />
              Your Music Timeline
            </h1>
            <p className="text-lg text-gray-400 mb-6">Every song you've played, mapped in time.</p>
            <div className="flex items-center gap-4 text-sm text-gray-300 bg-white/5 inline-flex px-4 py-2 rounded-lg border border-white/10 flex-wrap">
              <span><strong className="text-white">{stats.uniqueSongs}</strong> unique tracks</span>
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              <span><strong className="text-white">{stats.plays}</strong> total plays</span>
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              <span><strong className="text-white">{stats.hours}</strong> hours of music</span>
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              <span><strong className="text-white">{stats.artists}</strong> unique artists</span>
            </div>
          </div>

          {/* TIMELINE */}
          {history.length > 0 ? (
            <div className="relative pl-4">
              {/* Spine */}
              <div className="absolute top-2 bottom-0 left-[23px] w-[2px] bg-[#2c2828] z-0" />

            {timelineGroups.map((group) => {
              const isExpanded = !!expandedGroups[group.id];
              return (
              <div key={group.id} id={`timeline-group-${group.id}`} className="mb-10 relative z-10 transition-all duration-300">
                <div 
                  className="flex items-center gap-4 mb-6 relative cursor-pointer group"
                  onClick={() => toggleGroup(group.id)}
                >
                  <div className="w-2 h-2 rounded-full bg-[#181616] border-2 border-[#2c2828] absolute left-[3px]" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 bg-[#181616] px-2 ml-6 z-10 group-hover:text-white transition-colors flex items-center gap-2">
                    {group.label} · {group.items.length} songs
                  </span>
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-[#2c2828] to-transparent z-0 group-hover:from-white/20 transition-colors" />
                  <span className="text-gray-500 group-hover:text-white transition-colors">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </span>
                </div>

                {isExpanded && (
                  <div className="flex flex-col gap-4 animate-in slide-in-from-top-2 fade-in duration-300">
                    {group.items.map((item) => (
                      <div key={item.id} className="flex items-center group/node">
                        {/* Node Circle */}
                        <div className="w-10 flex justify-center relative z-10">
                          <div className={`w-2.5 h-2.5 rounded-full border-[3px] border-[#181616] transition-colors ${item.playCount > 2 ? 'bg-[#c4a090]' : 'bg-[#444]'}`} />
                          {/* Connector */}
                          <div className="absolute top-1/2 left-full w-4 h-[1px] bg-[#2c2828]" />
                        </div>

                        {/* Song Card */}
                        <div className="flex-1 ml-4 bg-white/5 border border-white/5 hover:bg-white/10 transition-colors rounded-xl p-2.5 flex items-center justify-between group-hover/node:border-[#c4a090]/30 relative overflow-hidden">
                          
                          <div className="flex items-center gap-4 min-w-0">
                            <div 
                              className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0 cursor-pointer group/cover"
                              onClick={() => currentSong?._id === item.song._id ? (isPlaying ? pause() : resume()) : play(item.song)}
                            >
                              <img src={item.song.coverUrl} className="w-full h-full object-cover" alt="Cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center transition-opacity">
                                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                              </div>
                            </div>

                            <div className="flex flex-col min-w-0">
                              <h4 className="text-sm font-bold text-white truncate">{item.song.title}</h4>
                              <span className="text-xs text-gray-400 truncate">{item.song.artist}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                            {item.playCount > 1 && (
                              <span className="text-[10px] font-bold uppercase tracking-wide bg-[#c4a090]/20 text-[#c4a090] px-2 py-0.5 rounded-full border border-[#c4a090]/30">
                                Played {item.playCount} times
                              </span>
                            )}
                            <div className="text-xs font-mono text-gray-500 w-16 text-right">
                              {item.firstPlayedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </div>
                            <button onClick={(e) => toggleLikeAction(e, item.song._id)}>
                              <Heart className={`w-4 h-4 cursor-pointer transition-colors ${likedSongIds.has(item.song._id) ? 'text-[#c4a090]' : 'text-gray-600 hover:text-white'}`} fill={likedSongIds.has(item.song._id) ? "currentColor" : "none"} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )})}
            </div>
          ) : (
            <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
              <h3 className="text-xl font-bold text-white mb-2">Start listening to build your timeline</h3>
              <p className="text-gray-400 mb-6">Your play history will appear here once you start playing music.</p>
              <Link href="/explore" className="bg-[#c4a090] text-bg-primary px-6 py-3 rounded-full font-bold hover:opacity-90 transition-opacity">
                Discover Music
              </Link>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: STATS & MOOD */}
        <div className="w-full lg:w-[340px] flex flex-col gap-8 flex-shrink-0">
          
          {/* Mood Pattern Section */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Your Listening Patterns</h3>
            
            <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
              {/* Labels Col */}
              <div className="flex flex-col gap-[3px] pt-4 pr-1 text-[9px] text-gray-600 font-mono items-end justify-between">
                <span>12a</span>
                <span>6a</span>
                <span>12p</span>
                <span>6p</span>
              </div>
              
              {/* Grid */}
              {moodGrid.map((dayHours, dayIdx) => (
                <div 
                  key={dayIdx} 
                  className="flex flex-col gap-[3px] relative group/col cursor-pointer"
                  onClick={() => scrollToGroup(dayIdx)}
                >
                  <div className="text-[9px] text-gray-500 font-mono text-center mb-1 group-hover/col:text-white transition-colors">{daysLabels[dayIdx]}</div>
                  {dayHours.map((plays, hourIdx) => {
                    let bg = "bg-[#2c2828]";
                    if (plays >= 6) bg = "bg-[#c4a090]";
                    else if (plays >= 3) bg = "bg-[#c4a090]/60";
                    else if (plays >= 1) bg = "bg-[#c4a090]/30";

                    return (
                      <div 
                        key={hourIdx} 
                        className={`w-3 h-3 rounded-[2px] ${bg} hover:ring-1 hover:ring-white transition-all`}
                        title={`${daysLabels[dayIdx]} ${formatHour(hourIdx)} · ${plays} songs`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-2">
               <div className="text-xs text-gray-400 flex items-center justify-between">
                 <span>Most active time:</span>
                 <strong className="text-white">{daysLabels[mostActive?.day || 0]} at {formatHour(mostActive?.hour || 0)}</strong>
               </div>
               <div className="text-xs text-gray-400 flex items-center justify-between">
                 <span>Favorite genre:</span>
                 <strong className="text-white">{stats.favoriteGenre}</strong>
               </div>
            </div>
          </div>

          {/* Top Songs This Week */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <Medal className="w-4 h-4 text-[#c4a090]" />
              Top 5 This Week
            </h3>
            
            <div className="flex flex-col gap-4">
              {topSongs.map((item, idx) => (
                <div key={item.song._id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-500 w-4 text-center">{idx + 1}</span>
                  <img src={item.song.coverUrl} className="w-8 h-8 rounded object-cover shadow" alt="cover" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm text-white font-bold truncate">{item.song.title}</span>
                    <span className="text-[10px] text-gray-400 truncate">{item.song.artist}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono bg-white/5 px-2 py-0.5 rounded">{item.count}</span>
                </div>
              ))}
              {topSongs.length === 0 && <div className="text-sm text-gray-500">Not enough data yet.</div>}
            </div>
          </div>

        </div>

      </div>
    </div>
    </ProtectedRoute>
  );
}
