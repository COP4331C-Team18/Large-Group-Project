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
        bg-base-100 backdrop-blur-md
        border-b border-base-300
      "
    >
      {/* Logo */}
      <a
        href="/"
        className="
          flex items-center gap-[0.65rem]
          font-serif text-[1.3rem] font-bold tracking-[-0.01em]
          text-base-content no-underline
        "
      >
        <InkcapLogo width={28} height={32} />
        InkBoard
      </a>

      {/* Back to Dashboard */}
      <button
        onClick={() => navigate('/dashboard')}
        className="btn btn-primary text-primary-content btn-sm"
      >
        Back to Dashboard
      </button>
    </nav>
  );
}
