"use client";

import React, { useEffect, useRef } from "react";
import { useUIStore } from "@/store/uiStore";
import { usePlayerStore } from "@/store/playerStore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

export default function KeyboardShortcuts() {
  const { isShortcutsOpen, closeShortcuts, toggleShortcuts } = useUIStore();
  const router = useRouter();
  const { user } = useAuth();

  // Player hooks
  const { 
    isPlaying, pause, resume, next, prev, toggleShuffle, toggleRepeat, 
    volume, setVolume, toggleMute, currentSong, seek, progress, duration
  } = usePlayerStore();

  const lastKey = useRef<string | null>(null);
  const keyTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ignore if typing in input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // Handle standalone shortcuts
      if (e.key === '?') {
        e.preventDefault();
        toggleShortcuts();
        return;
      }

      if (e.key === 'Escape') {
        closeShortcuts();
        // The CommandPalette handles its own Escape, so we just close ours
        return;
      }

      // Handle Sequence 'G' then [Key]
      if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        lastKey.current = 'g';
        if (keyTimeout.current) clearTimeout(keyTimeout.current);
        keyTimeout.current = setTimeout(() => { lastKey.current = null; }, 1000);
        return;
      }

      if (lastKey.current === 'g') {
        let matched = true;
        switch (e.key.toLowerCase()) {
          case 'd': router.push('/explore'); break;
          case 's': router.push('/search'); break;
          case 'l': router.push('/library'); break;
          case 'a': router.push('/artists'); break;
          case 't': router.push('/timeline'); break;
          case 'p': router.push('/profile'); break;
          default: matched = false; break;
        }
        if (matched) {
          e.preventDefault();
          lastKey.current = null;
          return;
        }
      }

      // Handle Playback Hotkeys
      // To prevent jumping around if user holds a key, we avoid checking metaKey except when intended
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key) {
          case ' ':
            e.preventDefault();
            isPlaying ? pause() : resume();
            break;
          case 'ArrowRight':
            e.preventDefault();
            seek(Math.min(duration, progress + 10));
            break;
          case 'ArrowLeft':
            e.preventDefault();
            seek(Math.max(0, progress - 10));
            break;
          case 'n':
          case 'N':
            e.preventDefault();
            next(true);
            break;
          case 'p':
          case 'P':
            e.preventDefault();
            prev(true);
            break;
          case 's':
          case 'S':
            e.preventDefault();
            toggleShuffle();
            break;
          case 'r':
          case 'R':
            e.preventDefault();
            toggleRepeat();
            break;
          case 'm':
          case 'M':
            e.preventDefault();
            toggleMute();
            break;
          case 'ArrowUp':
            e.preventDefault();
            setVolume(Math.min(1, volume + 0.1));
            break;
          case 'ArrowDown':
            e.preventDefault();
            setVolume(Math.max(0, volume - 0.1));
            break;
          case 'l':
          case 'L':
            e.preventDefault();
            if (user && currentSong) {
              try {
                // Determine if liked first? We can't know synchronously unless we keep it in state.
                // For simplicity of a shortcut, we just hit the like endpoint which could add it.
                // A better approach is to hit an endpoint that just ensures it is liked, or toggles it.
                // We don't have a direct toggle in backend easily, so let's just attempt to like it.
                // Actually the API allows POST /users/:id/liked. If it's already there, it might fail or duplicate.
                await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/${user._id}/liked`, { songId: currentSong._id });
                toast.success(`Liked "${currentSong.title}"`, { id: 'shortcut-like' });
              } catch (err) {
                console.error(err);
              }
            } else if (!user) {
               toast.error("Please log in to like songs");
            } else {
               toast.error("No song playing");
            }
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isPlaying, pause, resume, next, prev, toggleShuffle, toggleRepeat, 
    volume, setVolume, toggleMute, currentSong, seek, progress, duration, 
    user, router, toggleShortcuts, closeShortcuts
  ]);

  if (!isShortcutsOpen) return null;

  const ShortcutRow = ({ label, keys }: { label: string, keys: string[] }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-[#2c2828] last:border-0">
      <span className="text-[13px] text-gray-300 font-medium">{label}</span>
      <div className="flex items-center gap-1.5">
        {keys.map((k, i) => (
          <React.Fragment key={i}>
            {k === 'then' || k === '+' ? (
              <span className="text-[11px] text-gray-600 px-0.5">{k}</span>
            ) : (
              <kbd className="px-2 py-1 rounded-[4px] bg-[#2c2828] border border-[#333] text-[11px] font-mono text-gray-400 min-w-[24px] text-center inline-block">
                {k}
              </kbd>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={closeShortcuts}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-[520px] bg-[#181616] rounded-[14px] border border-[#2c2828] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2c2828] bg-[#151515]">
          <h2 className="text-[16px] font-bold text-white tracking-tight">Keyboard Shortcuts</h2>
          <button 
            onClick={closeShortcuts}
            className="p-1 text-gray-500 hover:text-white transition-colors hover:bg-white/10 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
          
          {/* Column 1 */}
          <div className="flex flex-col gap-1">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#c4a090] mb-3">Playback</h3>
            <ShortcutRow label="Play / Pause" keys={['Space']} />
            <ShortcutRow label="Skip forward 10s" keys={['→']} />
            <ShortcutRow label="Rewind 10s" keys={['←']} />
            <ShortcutRow label="Next song" keys={['N']} />
            <ShortcutRow label="Previous song" keys={['P']} />
            <ShortcutRow label="Toggle shuffle" keys={['S']} />
            <ShortcutRow label="Toggle repeat" keys={['R']} />
            <ShortcutRow label="Mute / unmute" keys={['M']} />
            <ShortcutRow label="Volume up 10%" keys={['↑']} />
            <ShortcutRow label="Volume down 10%" keys={['↓']} />
            <ShortcutRow label="Like current song" keys={['L']} />
          </div>

          {/* Column 2 */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-1">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#c4a090] mb-3">Navigation</h3>
              <ShortcutRow label="Go to Discover" keys={['G', 'then', 'D']} />
              <ShortcutRow label="Go to Search" keys={['G', 'then', 'S']} />
              <ShortcutRow label="Go to Library" keys={['G', 'then', 'L']} />
              <ShortcutRow label="Go to Artists" keys={['G', 'then', 'A']} />
              <ShortcutRow label="Go to Timeline" keys={['G', 'then', 'T']} />
              <ShortcutRow label="Go to Profile" keys={['G', 'then', 'P']} />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#c4a090] mb-3">App</h3>
              <ShortcutRow label="Command palette" keys={['⌘', 'K']} />
              <ShortcutRow label="Show this overlay" keys={['?']} />
              <ShortcutRow label="Close overlays" keys={['Esc']} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
