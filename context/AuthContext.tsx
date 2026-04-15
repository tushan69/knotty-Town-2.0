import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { apiUrl } from '../utils/apiUrl';

interface User {
  id: number;
  google_id?: string;
  name: string;
  email: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  loginWithGoogle: (credential: string) => Promise<void>;
  manualLogin: (email: string, pass: string) => Promise<boolean>;
  manualRegister: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isGsiLoaded: boolean;
  gsiError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GOOGLE_CLIENT_ID = (
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '183567555389-79bptd4lbuk2rminn3nikilaravhu520.apps.googleusercontent.com'
).trim();

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('knotty_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const [gsiError, setGsiError] = useState<string | null>(null);
  const initializationAttempted = useRef(false);

  const loginWithGoogle = async (credential: string) => {
    setIsLoading(true);
    try {
      const decoded: any = jwtDecode(credential);
      const payload = {
        mode: 'google',
        google_id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture
      };

      const response = await fetch(apiUrl('auth.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('knotty_user', JSON.stringify(userData));
      }
    } catch (e) {
      console.error("Auth sync error", e);
    } finally {
      setIsLoading(false);
    }
  };

  const manualLogin = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl('auth.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'login', email, password })
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('knotty_user', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const manualRegister = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl('auth.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'register', name, email, password })
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('knotty_user', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('knotty_user');
  };

  useEffect(() => {
    const initGsi = () => {
      const google = (window as any).google;
      if (initializationAttempted.current || !google?.accounts?.id) return;

      try {
        initializationAttempted.current = true;
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID.trim(),
          callback: (response: any) => loginWithGoogle(response.credential),
          use_fedcm_for_prompt: false,
          auto_select: false,
          error_callback: (error: any) => {
            console.error("GSI library error:", error);
            if (error.type === 'client_id_not_found') {
              setGsiError("Invalid Client ID or Unauthorized Origin.");
            }
          }
        });

        setIsGsiLoaded(true);
      } catch (e) {
        setGsiError("GSI Config Error");
      }
    };

    const timer = setInterval(initGsi, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, manualLogin, manualRegister, logout, isLoading, isGsiLoaded, gsiError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};