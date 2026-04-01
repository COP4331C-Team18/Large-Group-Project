import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/api/services/authService';
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
        const data = await authService.me();
        if (data.authenticated) {
          setUser(data.user);
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
      await authService.logout();
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