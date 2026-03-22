import InkcapLogo from '@/components/common/InkcapLogo';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  return (
    <nav
      className="
        fixed top-0 left-0 right-0 z-[200]
        flex items-center justify-between gap-8
        px-12 py-4
        bg-[rgba(237,232,223,0.93)] backdrop-blur-md
        border-b border-[rgba(74,90,58,0.28)]
      "
    >
    {/* Logo */}
    <a
    href="/"
    className="
        flex items-center gap-[0.65rem]
        font-serif text-[1.3rem] font-bold tracking-[-0.01em]
        text-ink no-underline"
    >
        <InkcapLogo width={28} height={32} />
        InkBoard
    </a>

      <div className="flex items-center gap-2">
        <p> Already have an account?</p>
        <button
          onClick={() => navigate('/login')}
          className="
            flex items-center gap-[0.4rem]
            font-sans text-[0.775rem] font-medium tracking-[0.06em] uppercase
            text-cap px-[0.9rem] py-[0.45rem] rounded
            border border-[rgba(74,90,58,0.28)]
            transition-colors duration-200
            bg-stem-light
            hover:text-ink hover:bg-[#dbd1c0]"
        >
          Log in
        </button>
      </div>
    </nav>
  );
}
