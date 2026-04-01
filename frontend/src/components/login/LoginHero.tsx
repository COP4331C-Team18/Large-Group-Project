export default function LoginHero() {
  return (
    <>
 
      {/* Eyebrow + headline */}
      <div className="max-w-[640px] text-center">

        {/* Eyebrow */}
        <p className="inline-flex items-center gap-3 font-sans text-[0.68rem] font-semibold tracking-[0.28em] uppercase text-primary/60 mb-8">
          <span className="block w-8 h-px bg-primary/80" />
          Live collaborative whiteboard
          <span className="block w-8 h-px bg-primary/80" />
        </p>

        {/* Headline */}
        <h1 className="font-serif text-[clamp(3.2rem,8.5vw,7rem)] font-bold leading-[0.95] tracking-[-0.03em] text-base-content mb-7">
          Welcome&nbsp;
          <em className="text-primary italic">Back</em>{' '}
        </h1>

        {/* Sub */}
        <p className="font-sans text-[1.1rem] font-light text-secondary/80 max-w-[480px] mx-auto mb-11 leading-[1.75]">
          Sign in to your InkBoard and pick up right where you left off.
        </p>
      </div>
    </>
  );
}