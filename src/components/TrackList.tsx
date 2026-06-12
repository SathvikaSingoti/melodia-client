"use client";

import { Song, usePlayerStore } from "@/store/playerStore";
import { Heart, MinusCircle } from "lucide-react";
import Link from "next/link";
import SongMenu from "./SongMenu";

interface TrackListProps {
  songs: Song[];
  likedSongIds: Set<string>;
  onToggleLike: (e: React.MouseEvent, songId: string) => void;
  onRemovePlaylist?: (songId: string) => void;
  onRemoveLiked?: (songId: string) => void;
}

export default function TrackList({ songs, likedSongIds, onToggleLike, onRemovePlaylist, onRemoveLiked }: TrackListProps) {
  const play = usePlayerStore(state => state.play);
  const currentSong = usePlayerStore(state => state.currentSong);
  const isPlaying = usePlayerStore(state => state.isPlaying);
  const setDetailSong = usePlayerStore(state => state.setDetailSong);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full text-left">
      {/* Header */}
      <div className="grid grid-cols-[40px_minmax(0,1fr)_80px_80px] md:grid-cols-[40px_minmax(0,2fr)_minmax(0,1fr)_100px_80px] gap-4 px-4 py-2 text-xs font-medium text-gray-400 border-b border-border mb-4 uppercase tracking-wider">
        <div className="text-center">#</div>
        <div>TITLE</div>
        <div className="hidden md:block">ALBUM</div>
        <div className="text-right">DURATION</div>
        <div className="flex justify-end pr-2">
          <Heart className="w-4 h-4" />
        </div>
      </div>

      {/* Rows */}
      <div className="flex flex-col">
        {songs.map((song, i) => {
          const isLiked = likedSongIds.has(song._id);
          const isCurrent = currentSong?._id === song._id;

          return (
            <div 
              key={`${song._id}-${i}`}
              onClick={() => setDetailSong(song)}
              className={`group grid grid-cols-[40px_minmax(0,1fr)_80px_80px] md:grid-cols-[40px_minmax(0,2fr)_minmax(0,1fr)_100px_80px] gap-4 px-4 py-2 hover:bg-[rgba(196,160,144,0.06)] rounded-lg cursor-pointer items-center transition-colors ${
                isCurrent ? 'border-l-2 border-[#c4a090] bg-[rgba(196,160,144,0.02)]' : 'border-l-2 border-transparent'
              }`}
            >
              {/* Index / Playing State */}
              <div className="text-gray-500 text-sm text-center font-medium">
                {isCurrent && isPlaying ? (
                  <div className="flex items-center justify-center gap-0.5 h-full">
                    <div className="w-1 bg-primary rounded-full animate-[equalizer_1s_ease-in-out_infinite] h-3"></div>
                    <div className="w-1 bg-primary rounded-full animate-[equalizer_1.2s_ease-in-out_infinite_0.2s] h-4"></div>
                    <div className="w-1 bg-primary rounded-full animate-[equalizer_0.8s_ease-in-out_infinite_0.4s] h-2"></div>
                  </div>
                ) : (
                  <span className={isCurrent ? "text-primary" : ""}>{i + 1}</span>
                )}
              </div>

              {/* Title & Cover */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-bg-tertiary relative">
                  <img src={song.coverUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); play(song, songs); }}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-bg-primary hover:scale-105 transition-transform"
                    >
                      <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className={`text-sm font-medium truncate ${isCurrent ? 'text-primary' : 'text-white'}`}>
                    {song.title}
                  </h4>
                  {song.artistId ? (
                    <Link href={`/artist/${song.artistId}`} onClick={(e) => e.stopPropagation()} className="block text-xs text-gray-400 hover:text-[#c4a090] hover:underline truncate">
                      {song.artist}
                    </Link>
                  ) : (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{song.artist}</p>
                  )}
                </div>
              </div>

              {/* Album */}
              <div className="hidden md:block min-w-0 text-sm text-gray-400 truncate">
                {song.albumId ? (
                  <Link href={`/album/${song.albumId}`} onClick={(e) => e.stopPropagation()} className="hover:text-[#c4a090] hover:underline">
                    {song.album || song.artist}
                  </Link>
                ) : (
                  song.album || song.artist
                )}
              </div>

              {/* Duration */}
              <div className="text-sm text-gray-400 text-right font-variant-numeric tabular-nums">
                {formatDuration(song.duration)}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleLike(e, song._id); }}
                  className={`p-1 hover:scale-110 transition-transform ${isLiked ? 'text-[#c4a090]' : 'text-gray-400 hover:text-white'}`}
                >
                  <Heart className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} />
                </button>
                <SongMenu 
                  song={song} 
                  onRemovePlaylist={onRemovePlaylist ? () => onRemovePlaylist(song._id) : undefined}
                  onRemoveLiked={onRemoveLiked ? () => onRemoveLiked(song._id) : undefined}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
