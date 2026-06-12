import React, { useState } from 'react';

interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => Promise<void>;
  initialPrompt?: string;
  title?: string;
}

const CHIPS = [
  "🌧 rainy day chill",
  "🌙 3am can't sleep",
  "☀️ morning energy",
  "🏃 workout mode"
];

export default function AIGenerateModal({ isOpen, onClose, onSubmit, initialPrompt = "", title = "Generate a new mix" }: AIGenerateModalProps) {
  const [promptText, setPromptText] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!promptText.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      await onSubmit(promptText);
      onClose();
      setPromptText("");
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to generate playlist. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div 
        className="w-full max-w-[420px] rounded-[14px] p-6 shadow-2xl flex flex-col relative"
        style={{ background: '#181616', border: '1px solid #2c2828' }}
      >
        <h3 className="text-lg font-[600] text-white mb-1">{title}</h3>
        <p className="text-[13px] text-gray-400 mb-5">Describe the vibe you're going for</p>

        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. rainy day studying, late night drive, morning energy..."
          disabled={loading}
          className="w-full rounded-lg p-3 text-[14px] text-[#ede8e4] placeholder-gray-600 transition-colors focus:outline-none"
          style={{ 
            background: '#221f1f', 
            border: '1px solid #2c2828',
            minHeight: '80px',
            resize: 'none',
            boxShadow: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = '#c4a090'}
          onBlur={(e) => e.target.style.borderColor = '#2c2828'}
          autoFocus
        />

        <div className="flex flex-wrap gap-2 mt-4">
          {CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => setPromptText(chip)}
              disabled={loading}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors border group"
              style={{ background: '#221f1f', borderColor: '#2c2828', color: '#786870' }}
              onMouseEnter={(e) => {
                if(!loading) { e.currentTarget.style.borderColor = '#c4a090'; e.currentTarget.style.color = '#c4a090'; }
              }}
              onMouseLeave={(e) => {
                if(!loading) { e.currentTarget.style.borderColor = '#2c2828'; e.currentTarget.style.color = '#786870'; }
              }}
            >
              {chip}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !promptText.trim()}
            className="px-5 py-2 rounded-full text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center min-w-[120px]"
            style={{ background: 'linear-gradient(135deg, #c4a090, #a88070)' }}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Gemini is thinking...</span>
              </div>
            ) : (
              "Generate"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
