import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ArrowLeft, Mail, Lock, User as UserIcon, AlertTriangle, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Login: React.FC = () => {
  const { user, isLoading, isGsiLoaded, gsiError, manualLogin, manualRegister } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [authMode, setAuthMode] = useState<'google' | 'manual'>('manual');
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  useEffect(() => {
    if (authMode === 'google' && isGsiLoaded && !gsiError) {
      const renderButton = () => {
        const btnContainer = document.getElementById("googleBtn");
        const google = (window as any).google;
        if (btnContainer && google?.accounts?.id) {
          try {
            google.accounts.id.renderButton(
              btnContainer,
              { 
                theme: "outline", 
                size: "large", 
                width: "100%",
                text: "signin_with",
                shape: "rectangular"
              }
            );
          } catch (e) {
            console.error("Google Button Render Error:", e);
          }
        }
      };
      
      const timeout = setTimeout(renderButton, 300);
      return () => clearTimeout(timeout);
    }
  }, [isGsiLoaded, authMode, gsiError]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    let success = false;
    if (isRegistering) {
      success = await manualRegister(name, email, password);
    } else {
      success = await manualLogin(email, password);
    }

    if (!success) {
      setError(isRegistering ? "Registration failed. Try a different email." : "Invalid credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 pt-32 pb-24">
      <div className="max-w-md w-full">
        <Link to="/" className="inline-flex items-center text-gray-400 hover:text-black mb-10 text-[10px] uppercase tracking-[0.2em] transition-colors duration-300">
          <ArrowLeft className="w-3 h-3 mr-2" strokeWidth={1} /> Return to Homepage
        </Link>
        
        <div className="bg-white border border-gray-100 p-8 md:p-12 shadow-sm relative">
          <div className="relative text-center space-y-8">
            <div className="space-y-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Account</span>
              <h1 className="font-serif text-3xl md:text-4xl text-black">
                {isRegistering ? 'Create Account' : 'Sign In'}
              </h1>
              <p className="text-xs font-light text-gray-500">
                {isRegistering ? 'Register to save your address and track orders.' : 'Log in to access your details and complete checkout.'}
              </p>
            </div>

            <div className="flex bg-gray-50 p-1 border border-gray-200">
              <button 
                type="button"
                onClick={() => setAuthMode('manual')}
                className={`flex-1 py-3 text-[10px] uppercase tracking-widest transition-colors duration-300 ${authMode === 'manual' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Email
              </button>
              <button 
                type="button"
                onClick={() => setAuthMode('google')}
                className={`flex-1 py-3 text-[10px] uppercase tracking-widest transition-colors duration-300 ${authMode === 'google' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Google
              </button>
            </div>

            <div className="space-y-6 pt-4">
              {isLoading ? (
                <div className="py-10 flex flex-col items-center space-y-4">
                  <div className="w-8 h-8 border border-gray-200 border-t-black rounded-full animate-spin" />
                  <p className="text-[10px] font-light uppercase tracking-widest text-gray-500 animate-pulse">Authenticating...</p>
                </div>
              ) : authMode === 'google' ? (
                <div className="space-y-4">
                  {gsiError ? (
                    <div className="bg-[#FAF9F6] border border-gray-200 p-6 text-center space-y-4">
                       <AlertCircle className="w-6 h-6 text-gray-400 mx-auto" strokeWidth={1} />
                       <div className="space-y-2">
                         <p className="text-xs font-light text-black">
                           Google authentication unavailable.
                         </p>
                         <p className="text-[10px] text-gray-500">
                           {gsiError}
                         </p>
                       </div>
                       <button 
                         onClick={() => setAuthMode('manual')}
                         className="w-full bg-[#5C5C5C] text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-colors duration-300"
                       >
                         Use Email Instead
                       </button>
                    </div>
                  ) : !isGsiLoaded ? (
                    <div className="py-10 flex flex-col items-center space-y-4">
                      <RefreshCw className="w-6 h-6 text-gray-300 animate-spin" strokeWidth={1} />
                      <p className="text-[10px] font-light uppercase tracking-widest text-gray-400">Loading Google login...</p>
                    </div>
                  ) : (
                    <>
                      <div id="googleBtn" className="w-full flex justify-center min-h-[50px]"></div>
                      <div className="bg-gray-50 p-4 flex items-start space-x-3 mt-4">
                        <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" strokeWidth={1} />
                        <p className="text-[9px] font-light tracking-wide text-gray-500 text-left">
                          We use secure authentication. Your data is never shared with third parties.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <form onSubmit={handleManualSubmit} className="space-y-6 text-left">
                  {isRegistering && (
                    <div className="relative">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 block">Full Name</label>
                      <input 
                        required
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-transparent border-b border-gray-300 py-2 text-sm font-light text-black outline-none focus:border-black transition-colors" 
                      />
                    </div>
                  )}
                  <div className="relative">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 block">Email</label>
                    <input 
                      required
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent border-b border-gray-300 py-2 text-sm font-light text-black outline-none focus:border-black transition-colors" 
                    />
                  </div>
                  <div className="relative">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 block">Password</label>
                    <input 
                      required
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent border-b border-gray-300 py-2 text-sm font-light text-black outline-none focus:border-black transition-colors" 
                    />
                  </div>
                  {error && (
                    <div className="flex items-center justify-center space-x-2 text-red-500 pt-2">
                      <AlertTriangle className="w-3 h-3" strokeWidth={1} />
                      <p className="text-[10px] font-light tracking-wide">{error}</p>
                    </div>
                  )}
                  <button type="submit" className="w-full bg-[#5C5C5C] text-white py-4 text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-colors duration-300 flex items-center justify-center mt-2">
                    {isRegistering ? 'Create Account' : 'Sign In'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="w-full text-center text-[10px] tracking-wide text-gray-400 hover:text-black mt-4 transition-colors"
                  >
                    {isRegistering ? 'Already have an account? Sign In' : 'New to Knotty Town? Create Account'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;