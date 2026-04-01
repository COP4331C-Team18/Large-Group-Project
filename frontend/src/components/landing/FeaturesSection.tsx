import type { ReactNode } from 'react';

interface Feature {
  icon: ReactNode;
  title: string;
  desc: string;
}

const features: Feature[] = [
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-[26px] h-[26px] stroke-primary fill-none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    ),
    title: 'Freehand ink drawing',
    desc: 'Natural pen strokes with sub-pixel accuracy. Pen, highlighter, eraser, and shapes — pressure-sensitive on supported devices.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-[26px] h-[26px] stroke-primary fill-none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Real-time multiplayer',
    desc: 'Every stroke syncs instantly. See collaborator cursors live across your board — powered by WebSockets, no refresh needed.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-[26px] h-[26px] stroke-primary fill-none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
    title: '6-digit room codes',
    desc: 'No invite links or email chains. Share a short code and your team is in the room within seconds.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-[26px] h-[26px] stroke-primary fill-none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 9h6M9 12h6M9 15h4" />
      </svg>
    ),
    title: 'Sticky notes & text',
    desc: 'Drop color-coded sticky notes and rich text blocks anywhere on an infinite, pannable canvas.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-[26px] h-[26px] stroke-primary fill-none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: 'Secured accounts',
    desc: 'JWT authentication, Postmark email verification, and board-level access controls keep your work private.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-[26px] h-[26px] stroke-primary fill-none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'Persistent boards',
    desc: 'Everything auto-saves to MongoDB. Return to any board exactly as you left it — hours or weeks later.',
  },
];

function FeatureCard({ icon, title, desc }: Feature) {
  return (
    <div className="bg-base-100 p-9 transition-colors duration-200 hover:bg-base-200">
      <div className="mb-5">{icon}</div>
      <h3 className="font-serif text-[1.1rem] font-semibold text-base-content/70 mb-2">{title}</h3>
      <p className="font-sans text-[0.875rem] leading-[1.7] text-base-content/60">{desc}</p>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section className="py-28 px-8 max-w-[1120px] mx-auto">
      <p className="font-sans text-[0.68rem] font-semibold tracking-[0.25em] uppercase text-primary/70 mb-3">
        What's inside
      </p>
      <h2 className="font-serif text-[clamp(1.9rem,4vw,2.9rem)] font-bold leading-[1.1] tracking-[-0.02em] text-base-content mb-16 max-w-[520px]">
        Built for how teams <em className="italic text-primary">actually think.</em>
      </h2>

      {/* 3-col grid with 1px gap borders via background trick */}
      <div
        className="grid grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1 rounded-[6px] overflow-hidden border border-primary/30 gap-px bg-primary"
      >
        {features.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </section>
  );
}
