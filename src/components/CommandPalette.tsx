"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { usePlayerStore, Song } from "@/store/playerStore";
import { Compass, Play, Sparkles, Music, Radio, Settings2 } from "lucide-react";
import axios from "axios";
import debounce from "lodash.debounce";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

type CommandType = "Pages" | "Commands" | "Songs";

interface CommandResult {
  id: string;
  title: string;
  subtitle?: string;
  type: CommandType;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  coverUrl?: string;
}

export default function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CommandResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const router = useRouter();
  const { user } = useAuth();
  
  // Player store hooks
  const play = usePlayerStore(state => state.play);
  const startRadio = usePlayerStore(state => state.startRadio);
  const pause = usePlayerStore(state => state.pause);
  const resume = usePlayerStore(state => state.resume);
  const next = usePlayerStore(state => state.next);
  const prev = usePlayerStore(state => state.prev);
  const toggleShuffle = usePlayerStore(state => state.toggleShuffle);
  const toggleRepeat = usePlayerStore(state => state.toggleRepeat);
  const setVolume = usePlayerStore(state => state.setVolume);
  const volume = usePlayerStore(state => state.volume);
  const currentSong = usePlayerStore(state => state.currentSong);
  const isPlaying = usePlayerStore(state => state.isPlaying);
  const setCrossfade = usePlayerStore(state => state.setCrossfade);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const likeCurrentSong = async () => {
    if (!user || !currentSong) {
      toast.error("Play a song first to like it");
      return;
    }
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/${user._id}/liked`, { songId: currentSong._id });
      toast.success(`Liked "${currentSong.title}"`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to like song");
    }
  };

  const handleGeneratePlaylist = async (prompt: string) => {
    if (!user) return;
    toast.loading(`Generating playlist for: "${prompt}"...`, { id: 'ai-gen' });
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/ai/generate-playlist`, {
        prompt,
        userId: user._id
      });
      toast.success(`Playlist generated!`, { id: 'ai-gen' });
      // You could navigate to the playlist here
      // router.push(`/playlist/${res.data.playlistId}`);
    } catch (err) {
      toast.error("Failed to generate playlist", { id: 'ai-gen' });
    }
  };

  const debouncedSearch = useRef(
    debounce(async (q: string, currentStaticResults: CommandResult[]) => {
      if (!q.trim()) return;
      setIsSearching(true);
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/songs/search?q=${encodeURIComponent(q)}`);
        const uniqueSongs = res.data.filter((s: Song, i: number, a: Song[]) => a.findIndex(t => t.title === s.title && t.artist === s.artist) === i);
        
        const songResults: CommandResult[] = uniqueSongs.slice(0, 5).map((song: Song) => ({
          id: `song-${song._id}`,
          title: song.title,
          subtitle: song.artist,
          type: "Songs",
          icon: <Music className="w-4 h-4 text-gray-400" />,
          coverUrl: song.coverUrl,
          action: () => {
            play(song, [song]); // In reality, we'd queue more, but playing one is fine
            close();
          }
        }));

        setResults([...currentStaticResults, ...songResults]);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 300)
  ).current;

  useEffect(() => {
    const q = query.toLowerCase().trim();
    let newResults: CommandResult[] = [];

    // Parse commands
    if (!q) {
      setResults([]);
      return;
    }

    // 1. Navigation Commands
    const navMap: Record<string, string> = {
      discover: "/explore", home: "/explore", explore: "/explore",
      search: "/search",
      library: "/library",
      artists: "/artists",
      albums: "/albums",
      profile: "/profile"
    };

    for (const [key, path] of Object.entries(navMap)) {
      if (key.includes(q) || q.includes(key)) {
        newResults.push({
          id: `nav-${key}`,
          title: `Go to ${key.charAt(0).toUpperCase() + key.slice(1)}`,
          type: "Pages",
          icon: <Compass className="w-4 h-4 text-gray-400" />,
          action: () => { router.push(path); close(); }
        });
      }
    }

    // 2. Playback Commands
    if (q.startsWith("play ") && q.length > 5) {
      const playQuery = query.slice(5).trim();
      newResults.push({
        id: "cmd-play-search",
        title: `Play "${playQuery}"`,
        type: "Commands",
        icon: <Play className="w-4 h-4 text-[#c4a090]" />,
        action: async () => {
          close();
          toast.loading(`Searching and playing "${playQuery}"...`, { id: "play-search" });
          try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/songs/search?q=${encodeURIComponent(playQuery)}`);
            if (res.data.length > 0) {
              play(res.data[0], res.data);
              toast.success(`Playing ${res.data[0].title}`, { id: "play-search" });
            } else {
              toast.error("No songs found", { id: "play-search" });
            }
          } catch (err) {
            toast.error("Search failed", { id: "play-search" });
          }
        }
      });
    }

    if (q.startsWith("radio ") && q.length > 6) {
      const radioQuery = query.slice(6).trim();
      newResults.push({
        id: "cmd-radio-search",
        title: `Start radio for "${radioQuery}"`,
        type: "Commands",
        icon: <Radio className="w-4 h-4 text-[#c4a090]" />,
        action: async () => {
          close();
          const loadingToast = toast.loading(`Building radio for "${radioQuery}"...`, { id: "radio-search" });
          try {
            const searchRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/songs/search?q=${encodeURIComponent(radioQuery)}`);
            if (searchRes.data.length > 0) {
              const seedSong = searchRes.data[0];
              const radioRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/ai/radio`, 
                { songId: seedSong._id },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
              );
              
              if (radioRes.data && radioRes.data.length > 0) {
                startRadio(seedSong, radioRes.data);
                toast.success("Radio ready ✓", { id: loadingToast });
              } else {
                toast.error("Could not build radio", { id: loadingToast });
              }
            } else {
              toast.error("No matching song found", { id: "radio-search" });
            }
          } catch (err) {
            toast.error("Radio generation failed", { id: "radio-search" });
          }
        }
      });
    }

    if (q.startsWith("crossfade ")) {
      const match = q.match(/^crossfade\s+(on|off|\d+s?)$/);
      if (match) {
        const val = match[1];
        let title = "";
        let action = () => {};
        
        if (val === "on") {
          title = "Turn Crossfade On";
          action = () => { setCrossfade(true); toast.success("Crossfade enabled"); close(); };
        } else if (val === "off") {
          title = "Turn Crossfade Off";
          action = () => { setCrossfade(false); toast.success("Crossfade disabled"); close(); };
        } else {
          const duration = parseInt(val.replace('s', ''));
          if (duration >= 1 && duration <= 8) {
            title = `Set Crossfade to ${duration}s`;
            action = () => { setCrossfade(true, duration); toast.success(`Crossfade set to ${duration}s`); close(); };
          }
        }
        
        if (title) {
          newResults.push({
            id: `cmd-crossfade-${val}`,
            title,
            type: "Commands",
            icon: <Settings2 className="w-4 h-4 text-[#c4a090]" />,
            action
          });
        }
      }
    }

    const playbackMap: Record<string, { title: string, action: () => void }> = {
      pause: { title: "Pause", action: () => { if (isPlaying) pause(); close(); } },
      stop: { title: "Stop", action: () => { if (isPlaying) pause(); close(); } },
      next: { title: "Next Song", action: () => { next(); close(); } },
      skip: { title: "Skip Song", action: () => { next(); close(); } },
      previous: { title: "Previous Song", action: () => { prev(); close(); } },
      back: { title: "Previous Song", action: () => { prev(); close(); } },
      shuffle: { title: "Toggle Shuffle", action: () => { toggleShuffle(); close(); } },
      repeat: { title: "Toggle Repeat", action: () => { toggleRepeat(); close(); } },
      like: { title: "Like Current Song", action: () => { likeCurrentSong(); close(); } },
      "love this": { title: "Like Current Song", action: () => { likeCurrentSong(); close(); } },
      "volume up": { title: "Volume Up", action: () => { setVolume(Math.min(1, volume + 0.1)); close(); } },
      "volume down": { title: "Volume Down", action: () => { setVolume(Math.max(0, volume - 0.1)); close(); } },
    };

    for (const [key, val] of Object.entries(playbackMap)) {
      if (key.includes(q)) {
        newResults.push({
          id: `cmd-${key}`,
          title: val.title,
          type: "Commands",
          icon: <Play className="w-4 h-4 text-[#c4a090]" />,
          action: val.action
        });
      }
    }

    // 3. AI Commands
    if (q.startsWith("generate ") || q.startsWith("create playlist ")) {
      const prompt = q.startsWith("generate ") ? query.slice(9).trim() : query.slice(16).trim();
      if (prompt) {
        newResults.push({
          id: "cmd-ai",
          title: `Generate playlist for "${prompt}"`,
          type: "Commands",
          icon: <Sparkles className="w-4 h-4 text-blue-400" />,
          action: () => {
            close();
            handleGeneratePlaylist(prompt);
          }
        });
      }
    }

    setResults(newResults);
    setSelectedIndex(0);

    // 4. Search Commands (Fallback)
    // Always search songs if the query doesn't perfectly match a command or even if it does to show songs
    debouncedSearch(q, newResults);

  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results[selectedIndex]) {
          results[selectedIndex].action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  if (!isOpen) return null;

  // Group results
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<CommandType, CommandResult[]>);

  let currentIndex = 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/70 animate-in fade-in duration-150"
        onClick={close}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-[560px] bg-[#181616] rounded-[14px] border border-[#2c2828] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center px-4 py-4 border-b border-[#2c2828]">
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-white text-[16px] placeholder-gray-500 focus:outline-none"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isSearching && (
            <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto no-scrollbar py-2">
          {results.length === 0 && query && !isSearching && (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No results found for "{query}"
            </div>
          )}

          {(Object.keys(groupedResults) as CommandType[]).map((type) => (
            <div key={type} className="mb-2">
              <div className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                {type}
              </div>
              <div>
                {groupedResults[type].map((result) => {
                  const isSelected = currentIndex === selectedIndex;
                  currentIndex++;
                  return (
                    <div
                      key={result.id}
                      onClick={result.action}
                      onMouseEnter={() => {
                        const idx = results.findIndex(r => r.id === result.id);
                        if (idx !== -1) setSelectedIndex(idx);
                      }}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors border-l-[3px] ${
                        isSelected ? "bg-[#2c2828] border-[#c4a090]" : "border-transparent hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {result.coverUrl ? (
                          <img src={result.coverUrl} alt="Cover" className="w-6 h-6 rounded object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                            {result.icon}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isSelected ? "text-white" : "text-gray-300"}`}>
                            {result.title}
                          </p>
                          {result.subtitle && (
                            <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                          )}
                        </div>
                      </div>
                      
                      {result.shortcut && (
                        <div className="flex-shrink-0 flex items-center gap-1">
                          {result.shortcut.split(" ").map(k => (
                            <kbd key={k} className="px-1.5 py-0.5 rounded bg-[#2c2828] text-gray-400 text-[10px] font-mono">
                              {k}
                            </kbd>
                          ))}
                        </div>
                      )}

                      {type === "Songs" && (
                        <Play className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-[#c4a090] opacity-100" : "text-gray-500 opacity-0 group-hover:opacity-100"} transition-opacity`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
