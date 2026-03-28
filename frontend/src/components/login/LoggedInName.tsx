import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// const app_name = 'inkboard.xyz';

function buildPath(route:string) : string
{
  if (import.meta.env.MODE != 'development')
  {
    // Production: Point to the secure domain, NO port 5000!
    return '/' + route; 
  }
  else
  {
    // Local Development remains unchanged
    return 'http://localhost:5000/' + route;
  }
}


export default function LoggedInName() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ firstName?: string; lastName?: string }>({});

  useEffect(() => {
    fetch(buildPath('api/auth/me'), {
      method: 'GET',
      credentials: 'include',
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.user) {
          setUser(data.user);
        } else {
          setUser({});
        }
      })
      .catch(() => setUser({}));
  }, []);

  const doLogout = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    try {
      await fetch(buildPath('api/auth/logout'), {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      // ignore errors
    }
    navigate('/');
  };

  return (
    <div id="loggedInDiv">
      <span id="userName">
        Logged In As {user.firstName || ''} {user.lastName || ''}
      </span>
      <br />
      <button type="button" id="logoutButton" className="buttons" onClick={doLogout}>
        Log Out
      </button>
    </div>
  );
}