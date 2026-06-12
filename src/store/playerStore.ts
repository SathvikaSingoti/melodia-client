import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { Howl } from 'howler';
import axios from 'axios';

export interface Song {
  _id: string;
  title: string;
  artist: string;
  artistId?: string;
  album?: string;
  albumId?: string;
  genre?: string;
  mood: string;
  duration: number;
  audioUrl: string;
  coverUrl: string;
  plays: number;
}

interface PlayerState {
  radioContext: Song | null;
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  queue: Song[];
  volume: number;
  cachedVolume: number;
  playbackRate: number;
  howl: Howl | null;
  
  // Crossfade
  crossfadeEnabled: boolean;
  crossfadeDuration: number;
  isCrossfading: boolean;
  crossfadingHowl: Howl | null;
  setCrossfade: (enabled: boolean, duration?: number) => void;
  
  // Loop A/B Markers
  loopA: number | null;
  loopB: number | null;
  isLoopActive: boolean;
  
  // Actions
  startRadio: (seedSong: Song, radioQueue: Song[]) => void;
  play: (song: Song, queue?: Song[], isCrossfadeTrigger?: boolean) => void;
  pause: () => void;
  resume: () => void;
  next: (userInitiated?: boolean, isCrossfadeTrigger?: boolean) => void;
  prev: (userInitiated?: boolean) => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  setLoopMarker: (marker: 'A' | 'B', time: number | null) => void;
  toggleLoop: () => void;
  updateProgress: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: string) => void;
  recentlyPlayed: Song[];
  
  isShuffle: boolean;
  repeatMode: 'off' | 'queue' | 'track';
  toggleShuffle: () => void;
  toggleRepeat: () => void;

  isFullScreen: boolean;
  toggleFullScreen: () => void;

  isQueueOpen: boolean;
  toggleQueue: () => void;

  isDetailPanelOpen: boolean;
  toggleDetailPanel: () => void;
  closeDetailPanel: () => void;
  detailPanelTab: "NowPlaying" | "Queue";
  setDetailPanelTab: (tab: "NowPlaying" | "Queue") => void;
  detailSong: Song | null;
  setDetailSong: (song: Song | null) => void;
  lastDetailUpdate: number;

  isPlayerExpanded: boolean;
  togglePlayerExpanded: () => void;

  isMiniPlayerOpen: boolean;
  setMiniPlayerOpen: (isOpen: boolean) => void;
  toggleMiniPlayer: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      radioContext: null,
  currentSong: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  queue: [],
  recentlyPlayed: [],
  volume: 1,
  cachedVolume: 1,
  playbackRate: 1,
  howl: null,
  crossfadeEnabled: false,
  crossfadeDuration: 3,
  isCrossfading: false,
  crossfadingHowl: null,
  loopA: null,
  loopB: null,
  isLoopActive: false,
  isShuffle: false,
  repeatMode: 'off',
  isFullScreen: false,
  isQueueOpen: false,
  isDetailPanelOpen: false,
  detailPanelTab: "NowPlaying",
  detailSong: null,
  lastDetailUpdate: 0,
  isPlayerExpanded: false,
  isMiniPlayerOpen: false,

  toggleShuffle: () => set(state => ({ isShuffle: !state.isShuffle })),
  toggleRepeat: () => set(state => ({ 
    repeatMode: state.repeatMode === 'off' ? 'queue' : state.repeatMode === 'queue' ? 'track' : 'off' 
  })),
  toggleFullScreen: () => set(state => ({ isFullScreen: !state.isFullScreen })),
  toggleQueue: () => set(state => ({ isQueueOpen: !state.isQueueOpen })),
  toggleDetailPanel: () => set(state => ({ isDetailPanelOpen: !state.isDetailPanelOpen })),
  closeDetailPanel: () => set({ isDetailPanelOpen: false }),
  setDetailPanelTab: (tab) => set({ detailPanelTab: tab }),
  togglePlayerExpanded: () => set(state => ({ isPlayerExpanded: !state.isPlayerExpanded })),
  
  setMiniPlayerOpen: (isOpen: boolean) => set({ isMiniPlayerOpen: isOpen }),
  toggleMiniPlayer: () => set(state => ({ isMiniPlayerOpen: !state.isMiniPlayerOpen })),

  setCrossfade: (enabled: boolean, duration?: number) => set(state => ({ 
    crossfadeEnabled: enabled, 
    crossfadeDuration: duration !== undefined ? duration : state.crossfadeDuration 
  })),
  
  setPlaybackRate: (rate: number) => {
    const { howl } = get();
    if (howl) howl.rate(rate);
    set({ playbackRate: rate });
  },
  
  setLoopMarker: (marker, time) => set(state => {
    if (marker === 'A') {
      return { loopA: time };
    } else {
      return { loopB: time };
    }
  }),
  
  toggleLoop: () => set(state => ({ 
    isLoopActive: !state.isLoopActive && state.loopA !== null && state.loopB !== null 
  })),
  setDetailSong: (song) => set((state) => {
    if (song && state.detailSong?._id === song._id && state.isDetailPanelOpen) {
      return { detailSong: null, isDetailPanelOpen: false, lastDetailUpdate: Date.now() };
    }
    return { detailSong: song, isDetailPanelOpen: !!song, lastDetailUpdate: Date.now() };
  }),
  addToQueue: (song) => {
    set((state) => {
      // Don't add if already in queue or currently playing
      if (state.currentSong?._id === song._id || state.queue.some(s => s._id === song._id)) {
        return state;
      }
      toast.success('Added to queue', {
        style: { background: '#181616', color: '#fff', border: '1px solid #2c2828' },
        iconTheme: { primary: '#c4a090', secondary: '#181616' }
      });
      return { queue: [...state.queue, song] };
    });
  },

  removeFromQueue: (songId) => {
    set((state) => {
      return { queue: state.queue.filter(s => s._id !== songId) };
    });
    toast.success('Removed from queue');
  },

  startRadio: (seedSong: Song, radioQueue: Song[]) => {
    const { howl } = get();
    if (howl) {
      howl.unload();
    }
    set({ radioContext: seedSong });
    
    // Play first song of the generated radio queue
    if (radioQueue.length > 0) {
      const firstSong = radioQueue[0];
      const newHowl = new Howl({
        src: [firstSong.audioUrl],
        html5: true,
        volume: get().volume,
        rate: get().playbackRate,
        onplay: () => set({ isPlaying: true }),
        onpause: () => set({ isPlaying: false }),
        onend: () => get().next(false),
        onload: () => set({ duration: firstSong.duration }),
      });
      newHowl.play();
      set({ 
        currentSong: firstSong,
        queue: radioQueue,
        howl: newHowl,
        isPlaying: true,
        progress: 0,
        duration: firstSong.duration,
        loopA: null,
        loopB: null,
        isLoopActive: false,
        isCrossfading: false,
      });
    }
  },

  play: (song: Song, newQueue?: Song[], isCrossfadeTrigger: boolean = false) => {
    const { howl, queue, radioContext, volume, crossfadeDuration, isCrossfading } = get();

    // Clear radioContext if this play action is for a different song 
    // and not just auto-advancing the existing queue
    if (newQueue && radioContext) {
      const isSameQueue = newQueue.length === queue.length && newQueue.every((s, i) => s._id === queue[i]?._id);
      if (!isSameQueue) {
        set({ radioContext: null });
      }
    }
    
    // Stop and unload existing howl if any, unless we are crossfading
    if (howl) {
      if (isCrossfadeTrigger) {
        // We are crossfading from the current howl to the new one
        const currentVol = howl.volume();
        howl.fade(currentVol, 0, crossfadeDuration * 1000);
        setTimeout(() => {
          howl.unload();
          const currentState = get();
          if (currentState.howl === newHowl) {
            set({ crossfadingHowl: null, isCrossfading: false });
          }
        }, crossfadeDuration * 1000);
      } else {
        howl.unload();
      }
    }

    const newHowl = new Howl({
      src: [song.audioUrl],
      html5: true,
      volume: isCrossfadeTrigger ? 0 : volume,
      rate: get().playbackRate,
      onplay: () => set({ isPlaying: true }),
      onpause: () => set({ isPlaying: false }),
      onend: () => {
        // Only trigger next if we aren't currently crossfading away from this song
        if (!get().isCrossfading) {
          get().next(false);
        }
      },
      onload: () => set({ duration: song.duration }),
    });

    newHowl.play();
    if (isCrossfadeTrigger) {
      newHowl.fade(0, volume, crossfadeDuration * 1000);
    }
    
    // Track play count
    axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/songs/${song._id}/play`).catch(console.error);

    // Track play history
    try {
      const storedUser = localStorage.getItem("melodia_user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const userId = user._id || user.id;
        if (userId) {
          axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/history`, {
            songId: song._id,
            playedAt: new Date().toISOString()
          }).catch(console.error);
        }
      }
    } catch (e) {
      console.error("Failed to post history", e);
    }
    
    const currentRecent = get().recentlyPlayed || [];
    const filteredRecent = currentRecent.filter(s => s._id !== song._id);
    const newRecent = [song, ...filteredRecent].slice(0, 20);

    set({
      currentSong: song,
      howl: newHowl,
      isPlaying: true,
      progress: 0,
      queue: newQueue || queue,
      recentlyPlayed: newRecent,
      loopA: null,
      loopB: null,
      isLoopActive: false
    });
  },

  pause: () => {
    const { howl } = get();
    if (howl && howl.playing()) {
      howl.pause();
    }
  },

  resume: () => {
    const { howl } = get();
    if (howl) {
      howl.play();
    }
  },

  next: (userInitiated = true, isCrossfadeTrigger = false) => {
    const { queue, currentSong, play, isShuffle, repeatMode } = get();
    if (!currentSong || queue.length === 0) return;

    if (!userInitiated && repeatMode === 'track') {
      play(currentSong, queue);
      return;
    }

    let nextSong: Song | undefined;

    if (isShuffle) {
      const available = queue.filter(s => s._id !== currentSong._id);
      nextSong = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : currentSong;
    } else {
      const currentIndex = queue.findIndex((s) => s._id === currentSong._id);
      if (currentIndex >= 0 && currentIndex < queue.length - 1) {
        nextSong = queue[currentIndex + 1];
      } else if (queue.length > 0 && repeatMode === 'queue') {
        nextSong = queue[0];
      }
    }

    if (nextSong) {
      play(nextSong, undefined, isCrossfadeTrigger);
    } else {
      const { howl } = get();
      if (howl && !isCrossfadeTrigger) {
        howl.stop();
      }
      set({ isPlaying: false, progress: 0 });
    }
  },

  prev: (userInitiated = false) => {
    const { queue, currentSong, howl, play } = get();
    if (!currentSong || queue.length === 0) return;

    // If we're more than 3 seconds in, just restart the song
    if (howl && howl.seek() > 3) {
      howl.seek(0);
      return;
    }

    const currentIndex = queue.findIndex((s) => s._id === currentSong._id);
    if (currentIndex > 0) {
      play(queue[currentIndex - 1], queue);
    } else {
      // Loop back to end
      play(queue[queue.length - 1], queue);
    }
  },

  seek: (time: number) => {
    const { howl } = get();
    if (howl) {
      howl.seek(time);
      set({ progress: time });
    }
  },

  setVolume: (vol: number) => {
    const { howl } = get();
    if (howl) {
      howl.volume(vol);
    }
    set({ volume: vol });
  },

  toggleMute: () => {
    const { volume, cachedVolume, howl } = get();
    if (volume > 0) {
      if (howl) howl.volume(0);
      set({ volume: 0, cachedVolume: volume });
    } else {
      const restoreVol = cachedVolume > 0 ? cachedVolume : 1;
      if (howl) howl.volume(restoreVol);
      set({ volume: restoreVol });
    }
  },

  updateProgress: () => {
    const { howl, isPlaying, isLoopActive, loopA, loopB, crossfadeEnabled, crossfadeDuration, isCrossfading, duration } = get();
    if (howl && isPlaying) {
      const currentProgress = howl.seek() as number;
      
      // Enforce A/B Loop
      if (isLoopActive && loopA !== null && loopB !== null) {
        // If we crossed the B marker, or we are before the A marker somehow
        if (currentProgress >= loopB) {
          howl.seek(loopA);
          set({ progress: loopA });
          return;
        }
      }

      // Check Crossfade condition
      if (crossfadeEnabled && !isCrossfading && duration > 0) {
        if (duration - currentProgress <= crossfadeDuration) {
          set({ isCrossfading: true });
          get().next(false, true); // Automatically start next song with crossfade
        }
      }
      
      set({ progress: currentProgress });
    }
  }
    }),
    {
      name: 'melodia-player-storage',
      partialize: (state) => ({ 
        recentlyPlayed: state.recentlyPlayed,
        crossfadeEnabled: state.crossfadeEnabled,
        crossfadeDuration: state.crossfadeDuration
      }),
    }
  )
);
