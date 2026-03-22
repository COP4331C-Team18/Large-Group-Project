import { Link } from 'react-router-dom';
import { UserCircle, Settings, LogOut } from 'lucide-react';
import InkcapLogo from '@/components/common/InkcapLogo';

export default function DashboardNavBar() {
  return (
    <nav
      className="navbar px-5 rounded-2xl border"
      style={{
        background: '#ece7db',
        borderColor: '#A67C5244',
        boxShadow: '0 2px 12px 0 rgba(15,14,13,0.08)',
      }}
    >
      {/* LEFT: Logo / Home Link */}
      <div className="flex-1">
        <Link
          to="/"
          className="btn btn-ghost px-2 hover:bg-transparent flex items-center gap-2"
        >
          <InkcapLogo />
          <span
            className="text-xl normal-case tracking-tight text-[#2D3A27]"
            style={{ 
              fontFamily: "'Playfair Display', Georgia, serif", 
              fontWeight: 700,
            }}
          >
            Ink-DashBoard
          </span>
        </Link>
      </div>

      {/* RIGHT: Profile, Settings, Logout */}
      <div className="flex-none flex items-center gap-0.5">
        <Link
          to="/settings"
          className="btn btn-square btn-ghost"
          aria-label="App Preferences"
          title="App Preferences"
          style={{ color: '#4a5a3a' }}
        >
          <Settings className="h-5 w-5" />
        </Link>

        <Link
          to="/profile"
          className="btn btn-square btn-ghost"
          aria-label="Profile Settings"
          title="Profile Settings"
          style={{ color: '#243d2e' }}
        >
          <UserCircle className="h-5 w-5" />
        </Link>

        {/* Subtle gold divider */}
        <div className="w-px h-5 mx-1" style={{ background: '#A67C5266' }} />

          {/*(The Logout Button)*/}
  <button
    className="btn btn-square btn-ghost hover:bg-[#A67C5222]" // Added subtle hover for better UX
    aria-label="Logout"
    title="Logout"
    style={{ color: 'red' }}
  >
    <LogOut className="h-5 w-5" />
  </button>

        
      </div>
    </nav>
  );
}
