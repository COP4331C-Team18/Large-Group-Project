export default function LoginHero() {
  return (
    <>
      {/* Dot-grid texture */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(74,90,58,0.055) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
 
      {/* Bottom green-fade overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-[1]"
        style={{ background: 'linear-gradient(to top, rgba(74,90,58,0.07), transparent)' }}
      />
 
      {/* Eyebrow + headline */}
      <div className="max-w-[640px] text-center">

        {/* Eyebrow */}
        <p className="inline-flex items-center gap-3 font-sans text-[0.68rem] font-semibold tracking-[0.28em] uppercase text-moss-light mb-8">
          <span className="block w-8 h-px bg-moss-dim" />
          Live collaborative whiteboard
          <span className="block w-8 h-px bg-moss-dim" />
        </p>

        {/* Headline */}
        <h1 className="font-serif text-[clamp(3.2rem,8.5vw,7rem)] font-bold leading-[0.95] tracking-[-0.03em] text-ink mb-7">
          Welcome&nbsp;
          <em className="text-moss italic">Back</em>{' '}
        </h1>

        {/* Sub */}
        <p className="font-sans text-[1.1rem] font-light text-soil-light max-w-[480px] mx-auto mb-11 leading-[1.75]">
          Sign in to your InkBoard and pick up right where you left off.
        </p>
      </div>
    </>
  );
}