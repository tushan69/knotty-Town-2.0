import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Zap } from 'lucide-react';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAdminAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8]">
                <div className="text-center animate-pulse">
                    <Zap className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
                    <p className="font-black text-xs uppercase tracking-widest text-gray-400">VERIFYING CLEARANCE...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default AdminRoute;
