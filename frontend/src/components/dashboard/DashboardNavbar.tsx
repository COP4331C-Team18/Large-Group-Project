import { Link } from 'react-router-dom'; // <-- Import useNavigate
import { UserCircle, Settings, LogOut } from 'lucide-react';
import InkcapLogo from '@/components/common/InkcapLogo';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardNavBar() {
  const {logout} = useAuth();
 
  return (
    <nav
      className="navbar px-5 bg-base-200 border-b border-neutral shadow-md"
    >
      {/* LEFT: Logo / Home Link */}
      <div className="flex-1">
        <Link
          to="/"
          className="btn btn-ghost px-2 hover:bg-base-300 flex items-center gap-2"
        >
          <InkcapLogo />
          <span
            className="text-xl normal-case tracking-tight text-base-content font-serif"
          >
            Ink DashBoard
          </span>
        </Link>
      </div>

      {/* RIGHT: Profile, Settings, Logout */}
      <div className="flex-none flex items-center gap-0.5">
        <Link
          to="/settings"
          className="btn btn-square btn-ghost text-base-content/70 hover:bg-secondary/20"
          aria-label="App Preferences"
          title="App Preferences"
        >
          <Settings className="h-5 w-5" />
        </Link>

        <Link
          to="/profile"
          className="btn btn-square btn-ghost text-base-content/70 hover:bg-secondary/20"
          aria-label="Profile Settings"
          title="Profile Settings"
        >
          <UserCircle className="h-5 w-5" />
        </Link>

        {/* Subtle gold divider */}
        <div className="w-px h-5 mx-1" style={{ background: '#A67C5266' }} />

        {/* (The Logout Button) */}
        <button
          onClick={logout} // <-- Add the onClick handler here
          className="btn btn-square btn-ghost hover:bg-secondary/20 text-red-500/90"
          aria-label="Logout"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
        
      </div>
    </nav>
  );
}