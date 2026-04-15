import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiUrl } from '../utils/apiUrl';

interface AdminAuthContextType {
    isAuthenticated: boolean;
    login: (username: string, passkey: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const token = sessionStorage.getItem('knotty_admin_token');
        // Also check localStorage in case they checked "Remember Me" (future feature) or legacy
        // For now, adhering to "Ask every time" preference via sessionStorage as primary
        if (token) {
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    const login = async (username: string, passkey: string): Promise<boolean> => {
        try {
            const response = await fetch(apiUrl('auth.php'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'admin_login',
                    username: username.trim(),
                    password: passkey.trim()
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success') {
                    sessionStorage.setItem('knotty_admin_token', data.token);
                    setIsAuthenticated(true);
                    return true;
                }
            }
        } catch (e) {
            console.error("Admin Login Error (Backend unavailable).", e);
        }

        // Final Fallback Check: Allow hardcoded 'KK' credentials even if backend fails or rejects
        if (username.trim().toUpperCase() === 'KK' && passkey.trim() === '382094808321') {
            sessionStorage.setItem('knotty_admin_token', 'KNOTTY_ADMIN_SECRET_2026');
            setIsAuthenticated(true);
            return true;
        }

        return false;
    };

    const logout = () => {
        sessionStorage.removeItem('knotty_admin_token');
        localStorage.removeItem('knotty_admin_token'); // Clean up old legacy tokens
        setIsAuthenticated(false);
    };

    return (
        <AdminAuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
            {children}
        </AdminAuthContext.Provider>
    );
};

export const useAdminAuth = () => {
    const context = useContext(AdminAuthContext);
    if (!context) throw new Error('useAdminAuth must be used within an AdminAuthProvider');
    return context;
};
