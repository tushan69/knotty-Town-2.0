import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../services/productService';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import LoadingScreen from '../components/LoadingScreen';

const MetalPosters: React.FC = () => {
  const [posters, setPosters] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosters = async () => {
      setIsLoading(true);
      try {
        const allProducts = await getProducts();
        const metalCategory = allProducts.filter(p => p.category === 'Metal Posters');
        setPosters(metalCategory);
      } catch (error) {
        console.error('Failed to load posters', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosters();
    window.scrollTo(0, 0);
  }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="bg-black min-h-screen text-white/90 selection:bg-white selection:text-black">
      {/* Cinematic Header */}
      <header className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-32 pb-16 md:pb-24">
        {/* Background Visual */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1618609516629-3b6038148b59?auto=format&fit=crop&q=80&w=2000" 
            alt="Brushed Aluminum Texture" 
            className="w-full h-full object-cover opacity-30 mix-blend-luminosity scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black"></div>
          {/* Subtle animated gradient overlay for a polished metal effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/5 opacity-50 mix-blend-overlay"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center">
          <span className="text-white/40 font-body text-[10px] tracking-[0.6em] uppercase mb-10 block backdrop-blur-sm px-6 py-2 border border-white/10 rounded-full">Automotive & Architectural Series</span>
          <h1 className="text-5xl sm:text-7xl md:text-[9rem] font-headline tracking-tighter mb-8 md:mb-12 italic font-light drop-shadow-2xl opacity-90 animate-in slide-in-from-bottom-8 duration-1000 fill-white text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
            Metal Plates.
          </h1>
          <p className="max-w-xl text-white/60 font-body text-lg md:text-2xl font-light italic leading-relaxed mx-auto animate-in slide-in-from-bottom-12 duration-[1500ms]">
            Translating visual velocity into static form. UV-printed on aeronautical-grade brushed aluminum.
          </p>
          
          <div className="mt-20 w-px h-32 bg-gradient-to-b from-white/40 to-transparent mx-auto animate-pulse"></div>
        </div>
      </header>

      {/* Narrative Section - The Craft */}
      <section id="craft" className="py-24 md:py-48 px-6 border-t border-white/10 relative overflow-hidden bg-zinc-950">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center relative z-10">
          <div className="space-y-8 md:space-y-12 pr-0 md:pr-12">
            <div>
              <span className="text-white/40 font-body text-[10px] tracking-[0.5em] uppercase mb-4 block">Material Science</span>
              <h2 className="text-4xl sm:text-5xl md:text-7xl font-headline tracking-tighter text-white font-light italic leading-tight">Engineered for Eternity.</h2>
            </div>
            <p className="font-body text-white/50 text-lg leading-relaxed font-light italic">
              Unlike traditional prints, our metal panels reflect light organically. The brushed aluminum substrate interacts dynamically with your room's ambient lighting, granting each piece a living presence.
            </p>
            <ul className="space-y-8 pt-8 border-t border-white/10">
              {['Aeronautical Grade Aluminum', 'Gallery-style Hidden Mounting', 'Matte or Gloss Finish Options', 'Scratch Resistant UV Cured Inks'].map((feature, i) => (
                <li key={i} className="flex items-center gap-6 group">
                  <span className="h-px w-8 bg-white/20 group-hover:w-16 group-hover:bg-white/60 transition-all duration-700"></span>
                  <span className="font-body text-[11px] uppercase tracking-[0.3em] text-white/70 group-hover:text-white transition-colors">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative group aspect-[4/5] overflow-hidden bg-black shadow-2xl border border-white/10">
            <img 
              src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=1000" 
              alt="Craftsmanship detail" 
              className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-110 opacity-70 group-hover:opacity-100"
            />
            {/* Subtle gloss overlay reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000 transform -skew-x-12 translate-x-full group-hover:-translate-x-full ease-in"></div>
          </div>
        </div>
      </section>

      {/* Gallery Catalog */}
      <section className="py-24 md:py-48 px-6 md:px-24 bg-black relative">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 md:mb-24 gap-6 md:gap-12">
            <div>
              <span className="text-white/40 font-body text-[10px] tracking-[0.5em] uppercase mb-4 block">The Collection</span>
              <h2 className="text-5xl md:text-8xl font-headline tracking-tighter text-white font-light italic">Static <br className="hidden md:block" />Velocity.</h2>
            </div>
            <div className="text-left md:text-right pb-0 md:pb-4">
              <span className="font-body text-[10px] uppercase tracking-[0.4em] text-white/50">Viewing {posters.length} Archival Prints</span>
            </div>
          </div>

          {posters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 md:gap-x-12 md:gap-y-32">
              {posters.map((poster) => (
                <div key={poster.id} className="group flex flex-col">
                  <Link to={`/product/${poster.id}`} className="block relative aspect-[3/4] overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl mb-8">
                    <img 
                      src={poster.image} 
                      alt={poster.name} 
                      className="w-full h-full object-cover transition-all duration-[2000ms] group-hover:scale-105 group-hover:brightness-110"
                    />
                    {/* Metal sheen effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/80 mix-blend-overlay"></div>
                  </Link>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-headline text-white/90 group-hover:text-white transition-colors">{poster.name}</h3>
                      <p className="text-[10px] uppercase font-body tracking-[0.3em] text-white/40 mt-3">{poster.availableSizes?.join(' / ') || 'Metal Plate'}</p>
                    </div>
                    <span className="font-body tracking-wider text-xl font-light text-white/80">₹{poster.price}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="py-48 text-center border border-white/10 bg-zinc-950/50">
               <h3 className="font-headline text-4xl text-white/40 italic mb-8">The vault is currently empty.</h3>
               <p className="font-body text-[10px] tracking-[0.4em] uppercase text-white/20">Check back for the upcoming drop.</p>
             </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MetalPosters;
