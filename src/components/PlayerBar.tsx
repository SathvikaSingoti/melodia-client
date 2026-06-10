export default function PlayerBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 bg-bg-secondary border-t border-border z-50 flex items-center justify-between px-6 backdrop-blur-md bg-opacity-90">
      {/* Song Info (Placeholder for now) */}
      <div className="flex items-center gap-4 w-1/3">
        <div className="w-14 h-14 bg-bg-tertiary rounded shadow-lg overflow-hidden flex-shrink-0">
          <div className="w-full h-full bg-gray-800 animate-pulse"></div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Select a song</h4>
          <p className="text-xs text-gray-400">Artist</p>
        </div>
      </div>

      {/* Controls (UI Only) */}
      <div className="flex flex-col items-center justify-center w-1/3 gap-2">
        <div className="flex items-center gap-6">
          <button className="text-gray-400 hover:text-white transition-colors">
            {/* Previous Icon */}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-primary hover:scale-105 transition-transform text-white">
            {/* Play Icon */}
            <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            {/* Next Icon */}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="w-full max-w-md flex items-center gap-3">
          <span className="text-xs text-gray-500 w-8 text-right">0:00</span>
          <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
            <div className="h-full bg-primary w-0"></div>
          </div>
          <span className="text-xs text-gray-500 w-8">0:00</span>
        </div>
      </div>

      {/* Extra Controls */}
      <div className="w-1/3 flex justify-end">
        {/* Volume icon placeholder */}
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          <div className="w-24 h-1.5 bg-bg-tertiary rounded-full">
            <div className="h-full bg-gray-400 w-2/3 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
