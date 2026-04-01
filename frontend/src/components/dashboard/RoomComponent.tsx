// src/components/dashboard/RoomComponent.tsx
import { Plus, ArrowRight } from 'lucide-react';
import { useState, useRef } from 'react';
import BoardModal from './BoardModal';
import { useNavigate } from 'react-router-dom';
import { boardService } from '@/api/services/boardService';

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

  // ── Join an existing board by code ────────────────────────────────────────
  const handleJoinRoom = async () => {
    if (code.length !== maxLength) return;
    setError('');
    try {
      const response = await boardService.joinBoardByCode(code);

      if (response) {
        navigate(`/board/${response.joinCode}`);
      } else {
        setError(response.data.error || 'Invalid room code');
      }
    } catch {
      setError('Network error. Is the server running?');
    }
  };

  return (
      <div className="flex items-stretch w-full gap-3 flex-shrink-0">
      
      {/* 2. Left Box */}
      <div className="flex-1 flex flex-col p-8 rounded-3xl bg-primary border border-primary shadow-xl overflow-hidden">
        <span className="text-primary-content text-[14px] font-bold tracking-[0.3em] font-serif uppercase mb-6">
          Create New Whiteboard
        </span>
        
        <div className="flex items-center gap-8 flex-1 h-full">
          <div className="flex-shrink-0">
            <button 
              className="btn btn-ghost hover:bg-secondary/30 size-28 rounded-2xl group"
              onClick={() => {
                const modal = document.getElementById('board_modal') as HTMLDialogElement | null;
                if (modal) {
                  modal.showModal();
                }
              }}
            >
              <Plus size={80} className="text-primary-content group-hover:scale-110 transition-transform" strokeWidth={1.75} />
            </button>
          </div>
          <div className="flex flex-col gap-3 text-sm text-primary-content/90 font-serif leading-relaxed">
            <p className="flex gap-2"><span>•</span> To start a new session, click the plus button to the left.</p>
            <p className="flex gap-2"><span>•</span> Invite collaborators to join your session.</p>
            <p className="flex gap-2"><span>•</span> A code will be provided for others to join.</p>
          </div>
        </div>
      </div>

      <div className="divider divider-horizontal divider-neutral text-base-content">OR</div>

      {/* 4. Right Box*/}
      <div className="flex-1 flex flex-col p-6 rounded-3xl bg-primary border border-primary shadow-xl overflow-hidden items-center">
        <span className="text-primary-content text-[14px] font-bold tracking-[0.3em] font-serif uppercase mb-6">
          Have Code? Join Now!
        </span>
        <div className="flex flex-col flex-1 justify-center gap-4 pl-4 pr-4">

        <div className="flex flex-col gap-4 flex-1 items-center justify-center w-full">
            {/* Square Inputs Container */}
            <div className="relative flex gap-2 group" onClick={() => inputRef.current?.focus()}>
              {[...Array(maxLength)].map((_, i) => (
                <div
                  key={i}
                  className={`size-14 flex items-center justify-center border-2 rounded-xl text-2xl font-bold font-serif transition-all duration-300
                    ${code[i] ? 'bg-base-300 text-base-content' : 'text-base-content/40'}
                    ${code.length === i ? 'ring-2 ring-warning border-transparent' : 'border-base-300'}
                  `}
                >
                  {code[i] || ""}
                </div>
              ))}
              <input
                ref={inputRef}
                type="text"
                value={code}
                onChange={handleInputChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                autoFocus
              />
            </div>

            <div className="flex flex-col items-center w-full gap-2">
              <button disabled={code.length < maxLength} onClick={handleJoinRoom} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-base-100 text-base-content font-bold uppercase tracking-widest text-xs transition-all hover:ring-1 hover:ring-secondary disabled:opacity-30 disabled:grayscale">
                  Join the Room with Host's Code
                  <ArrowRight size={18} />
                </button>
              <p className="text-[10px] text-primary-content font-serif italic text-center">
                Enter the 6-digit code provided by the host.
              </p>
            </div>
        </div>
      </div>
    </div>
    <BoardModal />
    </div>
  );
};

export default RoomSection;