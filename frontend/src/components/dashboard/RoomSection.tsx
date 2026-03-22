const RoomSection = () => {
  return (
    <div className="grid grid-cols-2 w-full gap-8 flex-shrink-0">
      {/* Left Box: Host Whiteboard */}
      <div className="flex flex-col items-center justify-between p-6 h-56 rounded-3xl bg-white border border-[#A67C5222] shadow-sm">
        <span className="text-[#A67C52] opacity-60 text-[10px] font-bold tracking-[0.3em] uppercase">
          Host your Whiteboard
        </span>

        {/* 6-Digit Code Display */}
        <div className="flex flex-col items-center">
          <div className="flex gap-1.5">
            {[4, 8, 2, 9, 1, 7].map((num, i) => (
              <div 
                key={i} 
                className="w-9 h-11 flex items-center justify-center bg-stone-50 border border-stone-100 rounded-lg text-lg font-mono font-bold text-stone-700 shadow-sm"
              >
                {num}
              </div>
            ))}
          </div>
          <span className="text-[9px] uppercase tracking-tighter text-stone-400 mt-2">Join Code</span>
        </div>

        {/* Action Button */}
        <button className="w-full py-2.5 bg-[#A67C52] hover:bg-[#8b6642] text-white text-xs font-bold rounded-xl transition-all shadow-md">
          START HOSTING
        </button>
      </div>

      {/* Right Box: Join Whiteboard */}
      <div className="flex flex-col items-center justify-center h-56 rounded-3xl bg-white border border-[#A67C5222] shadow-sm">
        <span className="text-[#A67C52] opacity-40 text-[10px] font-bold tracking-[0.2em] uppercase">
          Preview Here
        </span>
      </div>
    </div>
  );
};  

export default RoomSection;