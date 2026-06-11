import { create } from 'zustand';
import { Howl } from 'howler';

export interface Song {
  _id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  mood: string;
  duration: number;
  audioUrl: string;
  coverUrl: string;
  plays: number;
}

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  queue: Song[];
  volume: number;
  howl: Howl | null;
  
  // Actions
  play: (song: Song, queue?: Song[]) => void;
  pause: () => void;
  resume: () => void;
  next: (userInitiated?: boolean) => void;
  prev: (userInitiated?: boolean) => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  updateProgress: () => void;
  addToQueue: (song: Song) => void;
  recentlyPlayed: Song[];
  
  isShuffle: boolean;
  repeatMode: 'off' | 'queue' | 'track';
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  queue: [],
  recentlyPlayed: [],
  volume: 0.5,
  howl: null,
  isShuffle: false,
  repeatMode: 'off',

  toggleShuffle: () => set(state => ({ isShuffle: !state.isShuffle })),
  toggleRepeat: () => set(state => ({ 
    repeatMode: state.repeatMode === 'off' ? 'queue' : state.repeatMode === 'queue' ? 'track' : 'off' 
  })),

  play: (song, queue) => {
    const { howl, volume } = get();
    
    // Stop and unload existing howl if any
    if (howl) {
      howl.stop();
      howl.unload();
    }

    // Create new Howl instance
    const newHowl = new Howl({
      src: [song.audioUrl],
      html5: true, // Force HTML5 Audio to allow streaming large files
      volume: volume,
      onplay: () => {
        set({ isPlaying: true, duration: newHowl.duration() });
      },
      onpause: () => {
        set({ isPlaying: false });
      },
      onend: () => {
        get().next(false);
      },
      onseek: () => {
        // Optional: handle seek completion
      }
    });

    newHowl.play();
    
    const currentRecent = get().recentlyPlayed || [];
    const filteredRecent = currentRecent.filter(s => s._id !== song._id);
    const newRecent = [song, ...filteredRecent].slice(0, 5);

    set({
      currentSong: song,
      howl: newHowl,
      isPlaying: true,
      progress: 0,
      queue: queue || get().queue,
      recentlyPlayed: newRecent
    });
  },

  addToQueue: (song) => {
    const { queue } = get();
    if (!queue.find(s => s._id === song._id)) {
      set({ queue: [...queue, song] });
    }
  },

  pause: () => {
    const { howl } = get();
    if (howl && howl.playing()) {
      howl.pause();
    }
  },

  resume: () => {
    const { howl } = get();
    if (howl && !howl.playing()) {
      howl.play();
    }
  },

  next: (userInitiated = false) => {
    const { queue, currentSong, play, isShuffle, repeatMode } = get();
    if (!currentSong || queue.length === 0) return;

    if (!userInitiated && repeatMode === 'track') {
      play(currentSong, queue);
      return;
    }

    if (isShuffle) {
      const available = queue.filter(s => s._id !== currentSong._id);
      if (available.length > 0) {
        const randomSong = available[Math.floor(Math.random() * available.length)];
        play(randomSong, queue);
      } else {
        play(currentSong, queue);
      }
      return;
    }

    const currentIndex = queue.findIndex((s) => s._id === currentSong._id);
    if (currentIndex >= 0 && currentIndex < queue.length - 1) {
      play(queue[currentIndex + 1], queue);
    } else if (queue.length > 0 && repeatMode === 'queue') {
      play(queue[0], queue);
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

  updateProgress: () => {
    const { howl, isPlaying } = get();
    if (howl && isPlaying) {
      set({ progress: howl.seek() as number });
    }
  }
}));
