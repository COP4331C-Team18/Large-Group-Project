import {useAuth} from '@/contexts/AuthContext';

export default function LoggedInName() {
  const { user, logout } = useAuth();
  if(!user) return null; // If no user, don't render anything

  
  return (
    <div id="loggedInDiv">
      <span id="userName">
        Logged In As {user.username}
      </span>
      <br />
      <button type="button" id="logoutButton" className="buttons" onClick={logout}>
        Log Out
      </button>
    </div>
  );
}