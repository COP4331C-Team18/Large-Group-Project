import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


export const buildPath = (route: string): string => {
  if (import.meta.env.MODE !== 'development') {
    return '/' + route;
  }
  return 'http://localhost:5000/' + route;
};

interface User {
  id: string;
  username: string;
  email: string;
}

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // On mount: Check if we have an active session cookie
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get(buildPath('api/auth/me'), { withCredentials: true });
        if (res.data.authenticated) {
          setUser(res.data.user);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  // Login handler to update context state and navigate to dashboard
  const login = (userData: User) => {
    setUser(userData);
    navigate('/dashboard');
  };

  // Logout handler to clear session and update context state and navigate to login
  const logout = async () => {
    try {
      await axios.post(buildPath('api/auth/logout'), {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setUser(null);
      navigate('/login', { replace: true });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook, everything in main.tsx must be wrapped in <AuthProvider> to use this
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};