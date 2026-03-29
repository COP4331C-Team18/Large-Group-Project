import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/config/AuthContext';


// moved all of the api fetching with axios
// and authentication state management(logged-in, logged-out, loading) into a single global context provider
// to simplify the logic in individual components
export const PrivateRoutes = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoutes;