"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";

const GENRES = [
  { name: "Pop", emoji: "🎤" },
  { name: "Hip-Hop", emoji: "🎧" },
  { name: "R&B", emoji: "💜" },
  { name: "Indie", emoji: "🌿" },
  { name: "Electronic", emoji: "⚡" },
  { name: "Rock", emoji: "🎸" },
  { name: "Jazz", emoji: "🎷" },
  { name: "Classical", emoji: "🎻" }
];

interface Artist {
  _id: string;
  name: string;
  imageUrl: string;
}

export default function OnboardingPage() {
  const { user, login, token } = useAuth();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/login");
    } else if (user?.onboardingCompleted) {
      router.push("/explore");
    }
  }, [user, token, router]);

  useEffect(() => {
    if (step === 3 && artists.length === 0) {
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/artists`).then(res => {
        setArtists(res.data.slice(0, 12));
      }).catch(err => console.error(err));
    }
  }, [step, artists.length]);

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const toggleArtist = (artistId: string) => {
    if (selectedArtists.includes(artistId)) {
      setSelectedArtists(selectedArtists.filter(id => id !== artistId));
    } else {
      setSelectedArtists([...selectedArtists, artistId]);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const res = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/users/${user?.id}`, {
        onboardingCompleted: true,
        favoriteGenres: selectedGenres,
        favoriteArtists: selectedArtists,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (token) {
        login(token, res.data);
      }
      
      toast.success("Profile personalized!");
      router.push("/explore");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl relative">
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full ${step >= s ? 'bg-primary' : 'bg-gray-800'}`}></div>
          ))}
        </div>

        {step === 1 && (
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full mx-auto mb-8 flex items-center justify-center text-4xl text-bg-primary font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Welcome to Melodia, {user.username}!</h1>
            <p className="text-xl text-gray-400 mb-12">Let's personalize your experience.</p>
            <button 
              onClick={() => setStep(2)}
              className="px-8 py-3 rounded-full bg-primary text-bg-primary font-bold text-lg hover:scale-105 transition-transform"
            >
              Get Started
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            <h2 className="text-3xl font-bold text-white mb-2">Pick your favorite genres</h2>
            <p className="text-gray-400 mb-8">Select at least 3 genres to help us recommend songs you'll love.</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {GENRES.map(genre => {
                const isSelected = selectedGenres.includes(genre.name);
                return (
                  <div 
                    key={genre.name}
                    onClick={() => toggleGenre(genre.name)}
                    className={`p-4 rounded-xl cursor-pointer border-2 transition-all flex flex-col items-center justify-center gap-2 aspect-square
                      ${isSelected ? 'bg-primary/20 border-primary text-white scale-95' : 'bg-bg-secondary border-transparent text-gray-400 hover:border-gray-600'}`}
                  >
                    <span className="text-4xl">{genre.emoji}</span>
                    <span className="font-medium">{genre.name}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">{selectedGenres.length} selected (min 3)</span>
              <button 
                onClick={() => setStep(3)}
                disabled={selectedGenres.length < 3}
                className="px-8 py-3 rounded-full bg-primary text-bg-primary font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
              >
                Next Step
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            <h2 className="text-3xl font-bold text-white mb-2">Pick some artists you love</h2>
            <p className="text-gray-400 mb-8">Select a few artists to fine-tune your recommendations.</p>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-8">
              {artists.map(artist => {
                const isSelected = selectedArtists.includes(artist._id);
                return (
                  <div 
                    key={artist._id}
                    onClick={() => toggleArtist(artist._id)}
                    className={`p-3 rounded-xl cursor-pointer border-2 transition-all flex flex-col items-center gap-3
                      ${isSelected ? 'bg-primary/20 border-primary scale-95' : 'bg-bg-secondary border-transparent hover:border-gray-600'}`}
                  >
                    <img src={artist.imageUrl} alt={artist.name} className="w-20 h-20 rounded-full object-cover" />
                    <span className={`text-sm font-medium text-center truncate w-full ${isSelected ? 'text-white' : 'text-gray-300'}`}>{artist.name}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center">
              <button onClick={() => setStep(2)} className="text-gray-400 hover:text-white transition-colors">
                Back
              </button>
              <button 
                onClick={handleComplete}
                disabled={loading}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-bg-primary font-bold hover:scale-105 transition-transform disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Start Listening'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
