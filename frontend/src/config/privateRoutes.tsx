import {Navigate, Outlet} from 'react-router-dom';


//Local storage
export const PrivateRoutes = () => {
    
    const auth = localStorage.getItem('token');

    return auth ? <Outlet /> : <Navigate to="/login" replace/>;
}

export default PrivateRoutes;

/*  COOKIES OPTION WITH API AUTHENTICATION
import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';

export const PrivateRoutes = () => {
    const [auth, setAuth] = useState({ user: null, loading: true });

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // withCredentials: true ensures the HttpOnly cookie is sent to the server
                const response = await axios.get('API_ENDPOINT_HERE', { 
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


*/