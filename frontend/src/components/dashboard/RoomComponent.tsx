import { Plus, ArrowRight } from 'lucide-react';
import { useState, useRef } from 'react';

const RoomSection = () => {
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const maxLength = 6;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    
    const regex = /^[A-Z0-9]*$/;

    if (!regex.test(val)) {
      return;
    }

    if (val.length <= maxLength) {
      setCode(val);
    }
  };

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] w-full gap-4 items-center flex-shrink-0">
      {/* Left Box: Create Whiteboard */}
      <div className="flex flex-col p-5 h-56 rounded-3xl bg-dashboard-primary border border-dashboard-accent shadow-xl overflow-hidden">
        <span className="text-primary-content text-[14px] font-bold tracking-[0.3em] font-serif uppercase mb-6 pl-4 pt-2">
          Create New Whiteboard
        </span>
        <div className="flex items-start gap-8 flex-1">
          <div className="flex-shrink-0 flex items-center justify-center">
            <button className="btn btn-ghost hover:bg-green-900 size-28 rounded-2xl group">
              <Plus size={80} className="text-primary-content group-hover:scale-110 transition-transform" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex flex-col gap-3 text-sm text-primary-content font-serif leading-relaxed">
            <p className="flex gap-2"><span>•</span> To start a new session, click the plus button to the left.</p>
            <p className="flex gap-2"><span>•</span> Invite collaborators to join your session.</p>
            <p className="flex gap-2"><span>•</span> A code will be provided for others to join.</p>
          </div>
        </div>
      </div>


      {/* Center Divider with OR text */}
      <div className="divider divider-horizontal divider-primary text-">OR</div>

      {/* Right Box: Join Whiteboard */}
<div className="flex flex-col p-2 h-56 rounded-3xl bg-dashboard-primary border border-dashboard-accent shadow-xl overflow-hidden items-center gap-2">

        <span className="text-primary-content text-[14px] font-bold tracking-[0.3em] font-serif uppercase mb-2 pl-4 pt-2">
          Have Code? Join Now!
        </span>

        {/* Main Content Area - Added max-w-fit so it bounds exactly to the inputs width */}
        <div className="flex flex-col gap-2 flex-1 items-center w-full max-w-fit">
            
            {/* Square Inputs Container */}
            <div className="relative flex gap-4 group" onClick={() => inputRef.current?.focus()}>
              {[...Array(maxLength)].map((_, i) => (
                <div
                  key={i}
                  className={`size-14 flex items-center justify-center border-2 rounded-xl text-2xl font-bold font-serif transition-all duration-300
                    ${code[i] ? 'border-[#c4a96a] bg-success text-white' : 'border-green-900 text-primary-content/40'}
                    ${code.length === i ? 'ring-2 ring-[#c4a96a] border-transparent' : ''}
                  `}
                >
                  {code[i] || ""}
                </div>
              ))}

              {/* Hidden Input Layer */}
              <input
                ref={inputRef}
                type="text"
                value={code}
                onChange={handleInputChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                autoFocus
              />
            </div>

            {/* Button and Info Wrapper - Pushed to the right */}
            <div className="flex flex-col items-center w-full gap-1 mt-1 py-3">
              
              <button 
                disabled={code.length < maxLength}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#c4a96a] text-[#4A5D3F] font-bold uppercase tracking-widest text-xs transition-all hover:bg-[#d4b97a] disabled:opacity-30 disabled:grayscale"
              >
                Join the Room with Host's Code
                <ArrowRight size={18} />
              </button>
              
              <p className="text-[10px] text-info font-serif italic text-right mr-1">
                Enter the 6-digit code provided by the host to enter the room.
              </p>

            </div>
        </div>
      </div>
    </div>
  );
};

export default RoomSection;