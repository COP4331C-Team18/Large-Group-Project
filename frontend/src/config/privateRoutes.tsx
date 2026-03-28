/*
import {Navigate, Outlet} from 'react-router-dom';


//Local storage
export const PrivateRoutes = () => {
    
    const auth = localStorage.getItem('token');

    return auth ? <Outlet /> : <Navigate to="/login" replace/>;
}

export default PrivateRoutes;

*/

// const app_name = 'inkboard.xyz';

function buildPath(route:string) : string
{
  if (import.meta.env.MODE != 'development')
  {
    // Production: Point to the secure domain, NO port 5000!
    // The leading slash ensures it attaches to the root domain.
    return '/' + route; 
  }
  else
  {
    // Local Development remains unchanged
    return 'http://localhost:5000/' + route;
  }
}


/*  COOKIES OPTION WITH API AUTHENTICATION */
import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';

export const PrivateRoutes = () => {
    const [auth, setAuth] = useState({ user: null, loading: true });

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // withCredentials: true ensures the HttpOnly cookie is sent to the server
                const response = await axios.get(buildPath('api/auth/me'), { 
                    withCredentials: true 
                });
                //server sends a json and sets authenticated field to true after confirms the user is authenticated
                if (response.data.authenticated) {
                    setAuth({ user: response.data.user, loading: false });
                } else {
                    setAuth({ user: null, loading: false });
                }
            } catch (err) {
                // If the server returns 401 or the token is invalid
                setAuth({ user: null, loading: false });
            }
        };

        checkAuth();
    }, []);

    if (auth.loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    return auth.user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoutes;