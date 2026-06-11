"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Search } from "lucide-react";

interface Album {
  _id: string;
  title: string;
  coverUrl: string;
  artistId: string;
  artist: { name: string } | string;
}

export default function AlbumsPage() {
  const { token } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (token) {
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/albums`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setAlbums(res.data);
      })
      .catch(err => console.error("Failed to fetch albums", err))
      .finally(() => setLoading(false));
    }
  }, [token]);

  const filteredAlbums = albums.filter(a => {
    const titleMatch = a.title?.toLowerCase().includes(search.toLowerCase());
    const artistName = typeof a.artist === 'string' ? a.artist : a.artist?.name;
    const artistMatch = artistName?.toLowerCase().includes(search.toLowerCase());
    return titleMatch || artistMatch;
  });

  return (
    <ProtectedRoute>
      <div className="p-8 max-w-7xl mx-auto pb-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Albums</h1>
            <p className="text-gray-400">Explore full collections and legendary releases</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search albums..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg-secondary text-white rounded-full pl-10 pr-4 py-2 border border-border focus:border-[#c87941] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#c87941] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredAlbums.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredAlbums.map(album => (
              <div key={album._id} className="group flex flex-col cursor-pointer" onClick={() => {
                // Since we don't have a dedicated album detail page yet, just show an alert or navigate somewhere sensible.
                // Normally this would navigate to /album/[id]
                alert("Album detail page coming soon!");
              }}>
                <div className="w-full aspect-square rounded-xl overflow-hidden mb-4 shadow-lg border border-border group-hover:border-[#c87941]/50 transition-colors bg-bg-secondary relative">
                  <img 
                    src={album.coverUrl} 
                    alt={album.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="w-12 h-12 flex items-center justify-center rounded-full bg-[#c87941] text-white hover:scale-105 transition-transform shadow-xl">
                      <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-white truncate group-hover:text-[#c87941] transition-colors">
                  {album.title}
                </h3>
                <p className="text-xs text-gray-500 truncate mt-1">
                  {typeof album.artist === 'string' ? album.artist : album.artist?.name || "Unknown Artist"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500 bg-[#111111] rounded-xl border border-dashed border-[#1e1e1e]">
            No albums found.
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
