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
        p-10 border-r border-neutral-content last:border-r-0
        bg-neutral transition-colors duration-200
        hover:bg-white/[0.07]
      "
    >
      <div className="font-serif text-[2.5rem] font-normal italic text-neutral-content leading-none mb-5">
        {numeral}
      </div>
      <h3 className="font-serif text-[1.05rem] font-semibold text-neutral-content/70 mb-[0.6rem]">
        {title}
      </h3>
      <p className="font-sans text-[0.875rem] leading-[1.7] text-neutral-content/60 font-light">
        {desc}
      </p>
    </div>
  );
}

export default function HowItWorksSection() {
  return (
    <section
      className="relative py-28 px-8 overflow-hidden bg-neutral"
    >
      {/* Gill line texture */}
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-to-t from-neutral-content/20 to-neutral"

      />

      <div className="relative z-10 max-w-[1120px] mx-auto">
        <p className="font-sans text-[0.68rem] font-semibold tracking-[0.25em] uppercase text-primary mb-3">
          How it works
        </p>
        <h2 className="font-serif text-[clamp(1.9rem,4vw,2.9rem)] font-bold leading-[1.1] tracking-[-0.02em] text-base-100 mb-16 max-w-[520px]">
          From forest floor <em className="italic text-primary">to finished board.</em>
        </h2>

        {/* Steps grid */}
        <div
          className="grid grid-cols-4 max-md:grid-cols-2 max-sm:grid-cols-1 rounded-[6px] overflow-hidden border border-base-100/30"
        >
          {steps.map((s) => (
            <Step key={s.numeral} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}
