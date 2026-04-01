// Large inkcap mushroom SVG — decorative background element
function MushroomLarge() {
  return (
    <svg viewBox="0 0 400 520" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="168" y="295" width="64" height="225" rx="32" fill="#c8bfae" />
      <ellipse cx="200" cy="225" rx="190" ry="155" fill="#2a2d2e" />
      <ellipse cx="145" cy="148" rx="75" ry="52" fill="#3d4244" opacity="0.45" />
      <line x1="28"  y1="372" x2="28"  y2="448" stroke="#111410" strokeWidth="11" strokeLinecap="round" />
      <circle cx="28"  cy="457" r="13" fill="#111410" />
      <line x1="72"  y1="376" x2="72"  y2="462" stroke="#111410" strokeWidth="9"  strokeLinecap="round" />
      <circle cx="72"  cy="470" r="10" fill="#111410" />
      <line x1="118" y1="372" x2="118" y2="455" stroke="#111410" strokeWidth="10" strokeLinecap="round" />
      <circle cx="118" cy="464" r="11" fill="#111410" />
      <line x1="282" y1="374" x2="282" y2="450" stroke="#111410" strokeWidth="9"  strokeLinecap="round" />
      <circle cx="282" cy="458" r="10" fill="#111410" />
      <line x1="328" y1="370" x2="328" y2="435" stroke="#111410" strokeWidth="8"  strokeLinecap="round" />
      <circle cx="328" cy="442" r="9"  fill="#111410" />
      <line x1="372" y1="362" x2="372" y2="412" stroke="#111410" strokeWidth="7"  strokeLinecap="round" />
      <circle cx="372" cy="419" r="8"  fill="#111410" />
    </svg>
  );
}

// Small inkcap mushroom SVG — decorative background element
function MushroomSmall() {
  return (
    <svg viewBox="0 0 240 360" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="102" y="202" width="38" height="158" rx="19" fill="#c8bfae" />
      <ellipse cx="121" cy="162" rx="116" ry="98" fill="#2a2d2e" />
      <line x1="25"  y1="250" x2="25"  y2="300" stroke="#111410" strokeWidth="7" strokeLinecap="round" />
      <circle cx="25"  cy="307" r="8" fill="#111410" />
      <line x1="64"  y1="256" x2="64"  y2="312" stroke="#111410" strokeWidth="6" strokeLinecap="round" />
      <circle cx="64"  cy="318" r="7" fill="#111410" />
      <line x1="178" y1="254" x2="178" y2="302" stroke="#111410" strokeWidth="6" strokeLinecap="round" />
      <circle cx="178" cy="308" r="7" fill="#111410" />
      <line x1="216" y1="246" x2="216" y2="286" stroke="#111410" strokeWidth="5" strokeLinecap="round" />
      <circle cx="216" cy="291" r="6" fill="#111410" />
    </svg>
  );
}

export default function HeroSection() {
  return (
    <section
      className="
        relative min-h-screen flex flex-col items-center justify-center
        pt-28 pb-20 px-8 overflow-hidden bg-stem-bg
      "
    >
      {/* Bottom green-fade overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-[1]"
        style={{ background: 'linear-gradient(to top, rgba(74,90,58,0.07), transparent)' }}
      />

      {/* Large inkcap — right side */}
      <div
        className="absolute bottom-[-20px] right-[4%] z-[2] pointer-events-none opacity-[0.14]"
        style={{ width: 'clamp(260px, 34vw, 540px)' }}
        aria-hidden="true"
      >
        <MushroomLarge />
      </div>

      {/* Small inkcap — left side (mirrored) */}
      <div
        className="absolute bottom-[-10px] left-[3%] z-[2] pointer-events-none opacity-[0.08] scale-x-[-1]"
        style={{ width: 'clamp(140px, 17vw, 280px)' }}
        aria-hidden="true"
      >
        <MushroomSmall />
      </div>

      {/* Hero content */}
      <div className="relative z-[4] text-center max-w-[800px]">

        {/* Eyebrow */}
        <p className="inline-flex items-center gap-3 font-sans text-[0.68rem] font-semibold tracking-[0.28em] uppercase text-moss-light mb-8">
          <span className="block w-8 h-px bg-moss-dim" />
          Live collaborative whiteboard
          <span className="block w-8 h-px bg-moss-dim" />
        </p>

        {/* Headline */}
        <h1 className="font-serif text-[clamp(3.2rem,8.5vw,7rem)] font-bold leading-[0.95] tracking-[-0.03em] text-ink mb-7">
          Where ideas<br />
          <em className="text-moss italic">flow like</em>{' '}
          <span className="text-cap">ink.</span>
        </h1>

        {/* Sub */}
        <p className="font-sans text-[1.1rem] font-light text-soil-light max-w-[480px] mx-auto mb-11 leading-[1.75]">
          InkBoard is a real-time digital whiteboard for teams. Sketch, annotate, and
          plan together — share a 6-digit code and anyone joins instantly.
        </p>

        {/* Code join widget */}
        <div
          className="
            inline-flex flex-col items-center gap-4
            bg-white border border-[rgba(74,90,58,0.28)] border-t-[3px] border-t-cap
            rounded px-9 py-6
            shadow-[0_4px_20px_rgba(42,45,46,0.08)]
          "
        >
          <p className="font-sans text-[0.66rem] font-semibold tracking-[0.2em] uppercase text-soil-light">
            Have a room code? Join instantly
          </p>

          {/* Digit boxes */}
          <div className="flex items-center gap-[0.4rem]">
            {['4', '8', '2', null, '9', '1', '7'].map((d, i) =>
              d === null ? (
                <span key={i} className="text-mist text-base w-3 text-center">·</span>
              ) : (
                <div
                  key={i}
                  className="
                    relative w-10 h-[52px] bg-stem-bg
                    border border-[rgba(74,90,58,0.28)] rounded-[3px]
                    flex items-center justify-center
                    font-serif text-2xl font-semibold text-cap
                  "
                >
                  {d}
                  {/* Mini drip */}
                  <span
                    className="absolute left-1/2 -translate-x-1/2 w-[3px] h-[6px] bg-cap rounded-b-full opacity-30"
                    style={{ bottom: '-7px' }}
                  />
                </div>
              )
            )}
          </div>

          {/* Enter code button */}
          <button
            onClick={() => {}}
            className="
              w-full flex items-center justify-center gap-2
              font-sans text-[0.72rem] font-semibold tracking-[0.1em] uppercase
              text-moss bg-[rgba(74,90,58,0.07)]
              border border-[rgba(74,90,58,0.28)] rounded-[3px]
              px-6 py-[0.55rem]
              transition-colors duration-200
              hover:bg-[rgba(74,90,58,0.14)] hover:border-moss-dim hover:text-forest
            "
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Enter a room code
          </button>
        </div>
      </div>
    </section>
  );
}
