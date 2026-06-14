# Melodia 🎵
> AI-powered cloud music streaming web app

A full-stack music streaming platform built with 
Next.js 14, featuring real audio streaming from 
Jamendo API, AI-generated smart playlists via 
Google Gemini, and a premium dark UI with 
glassmorphism design.

## 🌐 Live Demo
[https://project-nkv6d.vercel.app](https://project-nkv6d.vercel.app)

## ✨ Features
- 🎵 Stream 200+ real tracks across 10 genres
- 🤖 AI Smart Playlist — describe a vibe, Gemini 
  curates your perfect playlist
- 🎧 Immersive full-screen DAW-style player
- ❤️ Like songs and build personal playlists
- 🔍 Live search with genre and mood filters
- 📊 Listening stats and play history
- 👤 User profiles with onboarding flow
- 🎨 Mood of the Day auto-filtering
- 🔀 Shuffle, repeat, crossfade, keyboard shortcuts
- 📱 Song radio — AI generates a queue from any song

## 🛠 Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS |
| State | Zustand (player), Context API (auth) |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Auth | JWT + Bcrypt |
| Audio | Howler.js |
| Storage | Firebase Storage |
| AI | Google Gemini 2.0 Flash |
| Music Data | Jamendo API |
| Deployment | Vercel |

## 📁 Project Structure
client/
├── src/
│   ├── app/          # Next.js App Router pages
│   ├── components/   # Reusable UI components
│   ├── context/      # Auth context
│   ├── store/        # Zustand player store
│   └── lib/          # Axios config, utilities
└── public/

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Firebase project
- Jamendo API key
- Google Gemini API key

### Installation
```bash
git clone https://github.com/SathvikaSingoti/melodia-client
cd melodia-client
npm install
```

### Environment Variables
Create .env.local:
```
NEXT_PUBLIC_API_URL=your_backend_url
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
```

### Run Development Server
```bash
npm run dev
```
Open http://localhost:3000

## 🔗 Related
- [Backend Repo](https://github.com/SathvikaSingoti/melodia-server)
- [Project Documentation](https://www.notion.so)

## 📄 License
MIT © Sathvika Singoti
Built as part of Xebia Vibecoding Internship 2026
