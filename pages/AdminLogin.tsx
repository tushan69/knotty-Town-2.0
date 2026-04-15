import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const AdminLogin: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAdminAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const success = await login(username, password);
        if (success) {
            navigate('/admin');
        } else {
            setError('ACCESS DENIED. VERIFY CREDENTIALS.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <div className="max-w-md w-full bg-surface border border-primary/5 p-16 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] transition-all text-center">
                <span className="material-symbols-outlined text-4xl text-accent/40 mb-12 mix-blend-multiply transition-opacity duration-1000">fingerprint</span>
                
                <div className="mb-16">
                    <span className="text-accent font-body text-[10px] tracking-[0.5em] uppercase mb-4 block opacity-60">Studio Restricted Archive</span>
                    <h1 className="font-headline text-5xl italic font-light tracking-tighter text-primary">Atelier Access.</h1>
                </div>

                <form onSubmit={handleLogin} className="space-y-10">
                    <div className="group relative">
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full bg-transparent border-b border-primary/10 py-5 font-body uppercase tracking-[0.4em] text-[10px] outline-none focus:border-accent transition-all duration-700 text-primary placeholder:text-secondary/20"
                            placeholder="STUDIO USER"
                            autoComplete="username"
                        />
                    </div>
                    <div className="group relative">
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-transparent border-b border-primary/10 py-5 font-body uppercase tracking-[0.4em] text-[10px] outline-none focus:border-accent transition-all duration-700 text-primary placeholder:text-secondary/20"
                            placeholder="ACCESS PASSKEY"
                            autoComplete="current-password"
                        />
                    </div>

                    {error && (
                        <p className="text-accent font-body text-[8px] uppercase tracking-widest italic animate-pulse">
                            {error}
                        </p>
                    )}

                    <div className="pt-8">
                        <button className="w-full bg-primary text-white py-6 font-body uppercase text-[10px] tracking-[0.4em] shadow-sm hover:bg-black transition-all duration-1000 ease-out">
                            Enter the Studio
                        </button>
                    </div>
                </form>

                <p className="mt-16 text-[8px] font-body text-secondary/30 uppercase tracking-[0.5em] italic">
                    Knotty Town Studio / Official Archives
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
