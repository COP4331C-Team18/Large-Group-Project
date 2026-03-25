import { useNavigate } from 'react-router-dom';

function GitHubIcon() {
  return (
    <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export default function CtaSection() {
  const navigate = useNavigate();
  
  // Check if the user is currently logged in
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <section className="relative py-36 px-8 text-center max-w-[680px] mx-auto">
      {/* ... keeping the background glow, eyebrow, headline, and subtext exactly the same ... */}

      <div className="relative z-10">
        <p className="font-sans text-[0.68rem] font-semibold tracking-[0.25em] uppercase text-moss-light mb-3">
          Get started free
        </p>
        <h2 className="font-serif text-[clamp(1.9rem,4vw,2.9rem)] font-bold leading-[1.1] tracking-[-0.02em] text-ink mb-5">
          Your best ideas deserve <em className="italic text-moss">a finer canvas.</em>
        </h2>
        <p className="font-sans text-base text-soil-light leading-[1.7] mb-10">
          Free forever. Open source. No credit card. Just pick up the pen.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          {/* Dynamically Swap Primary CTA */}
          <button
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
            className="flex items-center gap-2 font-sans text-[0.78rem] font-semibold tracking-[0.1em] uppercase bg-moss text-stem-light px-9 py-[0.875rem] rounded-[3px] border-none transition-colors duration-200 hover:bg-forest"
          >
            {isAuthenticated ? 'View Dashboard' : 'Create free account'}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>

          {/* GitHub ghost button */}
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-sans text-[0.78rem] font-medium tracking-[0.08em] uppercase text-soil bg-transparent px-9 py-[0.875rem] rounded-[3px] border border-[rgba(74,90,58,0.28)] transition-colors duration-200 hover:bg-[rgba(74,90,58,0.07)] hover:text-ink hover:border-moss-dim">
            <GitHubIcon />
            Star on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}