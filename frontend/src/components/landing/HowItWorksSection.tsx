interface Step {
  numeral: string;
  title: string;
  desc: string;
}

const steps: Step[] = [
  {
    numeral: 'i.',
    title: 'Create an account',
    desc: 'Sign up and verify your email via Postmark. Your account secures all your boards and settings.',
  },
  {
    numeral: 'ii.',
    title: 'Open a new board',
    desc: 'Hit "New Board" to open an infinite canvas. Name it, set visibility, and start sketching immediately.',
  },
  {
    numeral: 'iii.',
    title: 'Share your code',
    desc: 'Every board gets a unique 6-digit code. Text it, say it aloud, drop it in Slack — and your team is in.',
  },
  {
    numeral: 'iv.',
    title: 'Ink together, live',
    desc: 'Draw, annotate, and plan simultaneously. All changes sync in real time across every connected device.',
  },
];

function Step({ numeral, title, desc }: Step) {
  return (
    <div
      className="
        p-10 border-r border-white/[0.08] last:border-r-0
        bg-white/[0.03] transition-colors duration-200
        hover:bg-white/[0.07]
      "
    >
      <div className="font-serif text-[2.5rem] font-normal italic text-[rgba(200,191,174,0.22)] leading-none mb-5">
        {numeral}
      </div>
      <h3 className="font-serif text-[1.05rem] font-semibold text-stem-light mb-[0.6rem]">
        {title}
      </h3>
      <p className="font-sans text-[0.875rem] leading-[1.7] text-mist font-light">
        {desc}
      </p>
    </div>
  );
}

export default function HowItWorksSection() {
  return (
    <section
      className="relative py-28 px-8 overflow-hidden"
      style={{ background: '#2a2d2e' }}
    >
      {/* Gill line texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(180deg, transparent, transparent 22px, rgba(255,255,255,0.022) 22px, rgba(255,255,255,0.022) 23px)',
        }}
      />

      <div className="relative z-10 max-w-[1120px] mx-auto">
        <p className="font-sans text-[0.68rem] font-semibold tracking-[0.25em] uppercase text-moss-dim mb-3">
          How it works
        </p>
        <h2 className="font-serif text-[clamp(1.9rem,4vw,2.9rem)] font-bold leading-[1.1] tracking-[-0.02em] text-stem-light mb-16 max-w-[520px]">
          From forest floor <em className="italic text-leaf">to finished board.</em>
        </h2>

        {/* Steps grid */}
        <div
          className="grid grid-cols-4 max-md:grid-cols-2 max-sm:grid-cols-1 rounded-[6px] overflow-hidden border border-white/10"
        >
          {steps.map((s) => (
            <Step key={s.numeral} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}
