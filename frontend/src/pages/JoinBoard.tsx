// src/pages/JoinBoard.tsx
// Resolves a 6-digit join code → board ID, then redirects to
// /whiteboard/:id?collab=CODE so the Yjs whiteboard auto-connects.
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { boardService } from '@/api/services/boardService';

export default function JoinBoard() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) return;
    const upperCode = code.toUpperCase();
    boardService.joinBoardByCode(upperCode)
      .then(data => {
        const boardId = data._id || data.id;
        if (!boardId) { setError('Invalid room code'); return; }
        navigate(`/board/${boardId}?collab=${upperCode}`, { replace: true });
      })
      .catch(() => setError('Invalid room code or server error'));
  }, [code, navigate]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F4F1EA]">
        <div className="flex flex-col items-center gap-6 p-10 rounded-3xl bg-white border border-[#A67C5244] shadow-xl max-w-sm text-center">
          <div className="text-4xl">🔒</div>
          <h2 className="font-['Playfair_Display',Georgia,serif] text-xl text-[#2D3A27] font-bold">Room Not Found</h2>
          <p className="font-serif text-sm text-[#A67C52] italic">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-[#4A5D3F] text-[#F4F1EA] font-bold text-xs uppercase tracking-widest hover:bg-[#2D3A27] transition"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-[#F4F1EA]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#4A5D3F] border-t-transparent rounded-full animate-spin" />
        <p className="font-serif text-[#4A5D3F] italic text-sm">Joining room…</p>
      </div>
    </div>
  );
}
