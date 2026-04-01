// src/components/dashboard/RoomComponent.tsx
import { Plus, ArrowRight } from 'lucide-react';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const app_name = 'inkboard.xyz';
function buildPath(route: string): string {
  if (import.meta.env.MODE !== 'development') {
    return 'https://' + app_name + '/' + route;
  } else {
    return 'http://localhost:5000/' + route;
  }
}

const RoomSection = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const maxLength = 6;
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    if (!/^[A-Z0-9]*$/.test(val)) return;
    if (val.length <= maxLength) {
      setCode(val);
      setError('');
    }
  };

  // ── Create a new board ────────────────────────────────────────────────────
  const handleCreateBoard = async () => {
    setCreating(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildPath('api/boards'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: 'My New Whiteboard' }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate(`/board/${data.joinCode}`);
      } else {
        setError(data.error || 'Failed to create board');
      }
    } catch {
      setError('Network error. Is the server running?');
    } finally {
      setCreating(false);
    }
  };

  // ── Join an existing board by code ────────────────────────────────────────
  const handleJoinRoom = async () => {
    if (code.length !== maxLength) return;
    setError('');
    try {
      const response = await fetch(buildPath(`api/boards/join/${code}`));
      const data = await response.json();

      if (response.ok) {
        navigate(`/board/${data.joinCode}`);
      } else {
        setError(data.error || 'Invalid room code');
      }
    } catch {
      setError('Network error. Is the server running?');
    }
  };

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] w-full gap-4 items-center flex-shrink-0">

      {/* ── Left: Create Whiteboard ── */}
      <div className="flex flex-col p-5 h-56 rounded-3xl bg-dashboard-primary border border-dashboard-accent shadow-xl overflow-hidden">
        <span className="text-primary-content text-[14px] font-bold tracking-[0.3em] font-serif uppercase mb-6 pl-4 pt-2">
          Create New Whiteboard
        </span>
        <div className="flex items-start gap-8 flex-1">
          <div className="flex-shrink-0 flex items-center justify-center">
            <button
              onClick={handleCreateBoard}
              disabled={creating}
              className="btn btn-ghost hover:bg-green-900 hover:text-white rounded-2xl h-24 w-24 flex items-center justify-center border-2 border-dashed border-green-900/30 transition-all duration-300 group disabled:opacity-50"
            >
              {creating ? (
                <span className="loading loading-spinner loading-md text-primary-content" />
              ) : (
                <Plus
                  className="w-10 h-10 text-green-900 group-hover:text-white transition-colors duration-300"
                  strokeWidth={1.5}
                />
              )}
            </button>
          </div>
          <div className="flex flex-col gap-2 pt-2 pr-4">
            <p className="text-xs leading-relaxed text-primary-content/70 font-serif">
              Start a fresh canvas. A unique 6-digit access code will be generated for you to share with collaborators.
            </p>
            {error && (
              <p className="text-[10px] text-red-500 font-bold font-sans">{error}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Center: OR divider ── */}
      <div className="flex items-center justify-center px-2">
        <span className="text-xs font-bold tracking-widest text-[#A67C52] uppercase font-sans">
          or
        </span>
      </div>

      {/* ── Right: Join Whiteboard ── */}
      <div className="flex flex-col p-5 h-56 rounded-3xl bg-[#ede8df] border border-dashboard-accent shadow-xl overflow-hidden">
        <span className="text-[#2D3A27] text-[14px] font-bold tracking-[0.3em] font-serif uppercase mb-4 text-right pr-4 pt-2">
          Join Existing
        </span>
        <div className="flex flex-col flex-1 justify-center gap-4 pl-4 pr-4">

          {/* 6-box code input */}
          <div
            className="relative flex justify-end gap-2 w-full max-w-[280px] ml-auto"
            onClick={() => inputRef.current?.focus()}
          >
            {[...Array(maxLength)].map((_, i) => (
              <div
                key={i}
                className={`
                  w-10 h-12 flex items-center justify-center
                  text-xl font-bold font-mono rounded-lg
                  border-2 transition-all duration-200
                  ${code[i]
                    ? 'border-[#4A5D3F] text-[#2D3A27] bg-white'
                    : 'border-dashed border-[#A67C52]/40 bg-[#ede8df] text-transparent'
                  }
                  ${code.length === i ? 'ring-2 ring-[#c4a96a] border-transparent scale-110' : ''}
                `}
              >
                {code[i] || ''}
              </div>
            ))}
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={handleInputChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {/* Join button + hint */}
          <div className="flex flex-col items-end w-full gap-2 mt-1 py-1">
            <button
              onClick={handleJoinRoom}
              disabled={code.length < maxLength}
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#c4a96a] text-[#4A5D3F] font-bold uppercase tracking-widest text-xs transition-all hover:bg-[#d4b97a] disabled:opacity-30 disabled:grayscale"
            >
              Join the Room
              <ArrowRight size={18} />
            </button>

            {error ? (
              <p className="text-[10px] text-red-600 font-bold font-sans text-right">{error}</p>
            ) : (
              <p className="text-[10px] text-[#A67C52] font-serif italic text-right">
                Enter the 6-digit code provided by the host.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomSection;