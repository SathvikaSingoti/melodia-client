"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Search } from "lucide-react";

interface Artist {
  _id: string;
  name: string;
  genre: string;
  imageUrl: string;
  monthlyListeners: number;
}

export default function ArtistsPage() {
  const { token } = useAuth();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (token) {
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/artists`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setArtists(res.data);
      })
      .catch(err => console.error("Failed to fetch artists", err))
      .finally(() => setLoading(false));
    }
  }, [token]);

  const filteredArtists = artists.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <ProtectedRoute>
      <div className="p-8 max-w-7xl mx-auto pb-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Artists</h1>
            <p className="text-gray-400">Discover and follow your favorite artists</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search artists..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg-secondary text-white rounded-full pl-10 pr-4 py-2 border border-border focus:border-[#c4a090] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#c4a090] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredArtists.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredArtists.map(artist => (
              <Link href={`/artist/${artist._id}`} key={artist._id} className="group flex flex-col items-center">
                <div className="w-full aspect-square rounded-full overflow-hidden mb-4 shadow-lg border-4 border-transparent group-hover:border-[#c4a090]/50 transition-all bg-bg-secondary">
                  <img 
                    src={artist.imageUrl} 
                    alt={artist.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-semibold text-white text-center w-full truncate group-hover:text-[#c4a090] transition-colors">
                  {artist.name}
                </h3>
                <p className="text-xs text-gray-500 text-center capitalize mt-1">Artist</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500 bg-[#181616] rounded-xl border border-dashed border-[#2c2828]">
            No artists found.
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
