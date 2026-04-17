import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import SearchOverlay from './SearchOverlay';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { cartCount } = useCart();
  const { user, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const navLinks = [
    { name: 'Collections', path: '/shop' },
    { name: 'Looks', path: '/shop-the-look' },
    { name: 'Plates', path: '/metal-posters' },
    { name: 'Track', path: '/track' },
    { name: 'Journal', path: '/' },
  ];

  return (
    <>
    <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    <nav 
      className={`w-full fixed top-0 z-50 transition-all duration-700 px-6 md:px-16 py-6 md:py-8 flex justify-between items-center ${
        scrolled ? 'bg-white/80 backdrop-blur-md py-5 md:py-6' : 'bg-transparent'
      }`}
    >
      <div className="flex items-center gap-12 md:gap-16">
        {/* Toggle Button for Mobile */}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="md:hidden text-primary group"
        >
          <span className="material-symbols-outlined text-2xl font-light">menu</span>
        </button>

        {/* Brand Logo */}
        <div className="text-center md:text-left">
          <Link 
            to="/" 
            className="text-xl md:text-2xl font-headline font-bold tracking-[0.25em] uppercase text-primary transition-opacity hover:opacity-70" 
            onClick={() => setIsOpen(false)}
          >
            KNOTTY TOWN
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-12">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`text-[10px] uppercase font-body tracking-[0.35em] transition-all duration-500 hover:text-accent ${
                location.pathname === link.path ? 'text-primary font-semibold' : 'text-primary/60'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-6 md:gap-8">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="text-primary hover:opacity-50 transition-opacity"
          aria-label="Search"
        >
          <span className="material-symbols-outlined text-2xl font-light">search</span>
        </button>

        <Link to="/cart" className="relative text-primary hover:opacity-50 transition-opacity" aria-label="Shopping Bag">
          <span className="material-symbols-outlined text-2xl font-light">shopping_bag</span>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-accent text-white text-[8px] w-4 h-4 flex items-center justify-center font-bold">
              {cartCount}
            </span>
          )}
        </Link>
        
        <div className="relative group">
          {user ? (
            <div className="flex items-center cursor-pointer">
              <span className="material-symbols-outlined text-2xl font-light">person</span>
              <div className="absolute right-0 top-full mt-4 w-40 bg-white shadow-2xl opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-500 border border-outline-variant/10">
                <button 
                  onClick={logout} 
                  className="w-full text-left px-6 py-4 text-[10px] uppercase tracking-widest text-primary hover:bg-surface-container-low transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="hover:opacity-50 transition-opacity flex items-center relative group">
              <span className="material-symbols-outlined text-2xl font-light">person</span>
              <div className="absolute right-0 top-full mt-4 w-40 bg-white shadow-2xl opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-500 border border-outline-variant/10">
                <Link to="/login" className="block w-full text-left px-6 py-4 text-[10px] uppercase tracking-widest text-primary hover:bg-surface-container-low transition-colors">
                  Login
                </Link>
                <Link to="/track" className="block w-full text-left px-6 py-4 text-[10px] uppercase tracking-widest text-primary hover:bg-surface-container-low transition-colors">
                  Track Order
                </Link>
              </div>
            </Link>
          )}
        </div>

      </div>

      {/* Fullscreen Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-white/98 z-[60] backdrop-blur-xl transition-all duration-700 md:hidden flex flex-col items-center justify-center gap-12 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        <button 
          onClick={() => setIsOpen(false)} 
          className="absolute top-10 right-10 text-primary"
        >
          <span className="material-symbols-outlined text-4xl font-light">close</span>
        </button>
        <div className="flex flex-col items-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className="text-4xl font-headline uppercase tracking-widest text-primary hover:italic transition-all duration-500"
            >
              {link.name}
            </Link>
          ))}
          <Link
            to="/cart"
            onClick={() => setIsOpen(false)}
            className="text-xl font-body uppercase tracking-[0.4em] text-accent mt-4"
          >
            Your Bag ({cartCount})
          </Link>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setSearchOpen(true);
            }}
            className="text-sm font-body uppercase tracking-[0.35em] text-primary/70"
          >
            Search
          </button>
        </div>
      </div>
    </nav>
    </>
  );
};

export default Navbar;
