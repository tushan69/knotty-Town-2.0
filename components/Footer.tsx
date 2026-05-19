
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Footer: React.FC = () => {
  const location = useLocation();

  if (location.pathname === '/checkout') {
    return null;
  }

  return (
    <footer className="bg-primary text-white pt-48 pb-16">
      <div className="max-w-[1600px] mx-auto px-6 md:px-24">
        {/* Brand Statement */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-32 mb-32 border-b border-white/5 pb-32">
          <div className="md:col-span-6">
            <h2 className="text-4xl md:text-6xl font-headline italic font-light leading-tight mb-12 tracking-tighter">
              Defining the <br />silhouettes of tomorrow.
            </h2>
            <p className="text-white/40 font-body text-sm max-w-md font-light leading-relaxed">
              Knotty Town is a design studio exploring the intersection of architectural form and functional grace. 
              Each collection is an invitation to inhabit structure without noise.
            </p>
          </div>
          
          <div className="md:col-span-2 flex flex-col gap-6">
            <h4 className="text-accent text-[10px] uppercase font-body tracking-[0.4em] mb-4">The House</h4>
            <Link to="/about" className="text-white/60 hover:text-white transition-colors text-[11px] uppercase tracking-[0.2em] font-light">The Story</Link>
            <Link to="/shop" className="text-white/60 hover:text-white transition-colors text-[11px] uppercase tracking-[0.2em] font-light">Lookbooks</Link>
            <Link to="/journal" className="text-white/60 hover:text-white transition-colors text-[11px] uppercase tracking-[0.2em] font-light">The Journal</Link>
          </div>

          <div className="md:col-span-2 flex flex-col gap-6">
            <h4 className="text-accent text-[10px] uppercase font-body tracking-[0.4em] mb-4">Concierge</h4>
            <Link to="/contact" className="text-white/60 hover:text-white transition-colors text-[11px] uppercase tracking-[0.2em] font-light">Contact</Link>
            <Link to="/track" className="text-white/60 hover:text-white transition-colors text-[11px] uppercase tracking-[0.2em] font-light">Track Order</Link>
            <Link to="/shipping" className="text-white/60 hover:text-white transition-colors text-[11px] uppercase tracking-[0.2em] font-light">Shipping</Link>
            <Link to="/returns" className="text-white/60 hover:text-white transition-colors text-[11px] uppercase tracking-[0.2em] font-light">Returns</Link>
          </div>

          <div className="md:col-span-2 flex flex-col gap-6">
            <h4 className="text-accent text-[10px] uppercase font-body tracking-[0.4em] mb-4">Studio</h4>
            <Link to="/admin" className="text-white/60 hover:text-white transition-colors text-[11px] uppercase tracking-[0.2em] font-light">Access</Link>
            <Link to="/legal" className="text-white/60 hover:text-white transition-colors text-[11px] uppercase tracking-[0.2em] font-light">Legal</Link>
            <Link to="/privacy" className="text-white/60 hover:text-white transition-colors text-[11px] uppercase tracking-[0.2em] font-light">Privacy</Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-12 text-[9px] uppercase tracking-[0.5em] text-white/20 font-body">
          <div className="flex items-center gap-12 grayscale opacity-40">
             <div className="flex items-center gap-2">
               <span className="material-symbols-outlined text-sm">enhanced_encryption</span>
               <span>Encrypted</span>
             </div>
             <div className="flex items-center gap-2">
               <span className="material-symbols-outlined text-sm">public</span>
               <span>Global Logistics</span>
             </div>
          </div>
          <div className="text-center md:text-right">
             © {new Date().getFullYear()} KNOTTY TOWN STUDIO. ALL RIGHTS RESERVED.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
