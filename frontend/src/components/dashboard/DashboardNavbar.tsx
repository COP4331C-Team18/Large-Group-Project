import { Link } from 'react-router-dom'; // <-- Import useNavigate
import { UserCircle, Settings, LogOut } from 'lucide-react';
import InkcapLogo from '@/components/common/InkcapLogo';
import { useAuth } from '@/context/AuthContext';

export default function DashboardNavBar() {
  const {logout} = useAuth();
 
  return (
    <nav
      className="navbar px-5 rounded-3xl background-base-dashboard bg-primary-content border-dashboard-accent border-2 shadow-md"
    >
      {/* LEFT: Logo / Home Link */}
      <div className="flex-1">
        <Link
          to="/"
          className="btn btn-ghost px-2 hover:bg-transparent flex items-center gap-2"
        >
          <InkcapLogo />
          <span
            className="text-xl normal-case tracking-tight text-[#2D3A27] font-serif"
          >
            Ink DashBoard
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

        {/* (The Logout Button) */}
        <button
          onClick={logout} // <-- Add the onClick handler here
          className="btn btn-square btn-ghost hover:bg-[#A67C5222]" 
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