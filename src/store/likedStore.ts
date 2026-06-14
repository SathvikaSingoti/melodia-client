import { create } from 'zustand';

interface LikedState {
  likedIds: Set<string>;
  setLiked: (ids: string[]) => void;
  toggleLike: (id: string, isLiked: boolean) => void;
}

export const useLikedStore = create<LikedState>((set) => ({
  likedIds: new Set<string>(),
  setLiked: (ids: string[]) => set({ likedIds: new Set(ids) }),
  toggleLike: (id: string, isLiked: boolean) => set((state) => {
    const newLiked = new Set(state.likedIds);
    if (isLiked) {
      newLiked.add(id);
    } else {
      newLiked.delete(id);
    }
    return { likedIds: newLiked };
  }),
}));

import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import React from 'react';
import { globalEvents } from '@/lib/events';

export const useLikeAction = () => {
  const { token, user } = useAuth();
  const likedIds = useLikedStore(state => state.likedIds);
  const toggleLikeStore = useLikedStore(state => state.toggleLike);

  const toggleLike = async (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    if (!token || !user) return;
    const isLiked = likedIds.has(songId);
    toggleLikeStore(songId, !isLiked);
    try {
      if (isLiked) {
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/users/${user._id || user.id}/liked/${songId}`);
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/${user._id || user.id}/liked`, { songId });
      }
      globalEvents.emit('likedSongsUpdated');
    } catch (e) {
      // rollback
      toggleLikeStore(songId, isLiked);
    }
  };

  return toggleLike;
};
