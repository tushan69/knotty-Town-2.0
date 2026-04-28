import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../services/productService';
import { Product } from '../types';
import { HERO_SLIDES } from '../constants';
import SEO from '../components/SEO';
import LoadingScreen from '../components/LoadingScreen';

const MOCK_PRODUCTS: Product[] = [];

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 8000); // Slower cycle for premium feel
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getProducts();
        if (data && data.length > 0) {
          // Map API data to camelCase if needed, or assume it matches if handled by service
          setProducts(data.map((p: any) => ({
            ...p,
            isFeatured: p.isFeatured || p.is_featured // handle both
          })));
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const featuredProducts = products.filter(p => p.isFeatured).slice(0, 8);
  const latestProducts = products.slice(0, 8);
  const coreEssentials = products.filter(p => p.category === 'Essentials' || p.category === 'Trousers').slice(0, 6);
  const metalPosters = products.filter(p => p.category === 'Metal Posters').slice(0, 6);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="bg-background min-h-screen">
      <SEO 
        title="Oversized Streetwear & Luxury Silhouettes" 
        description="Knotty Town is a design studio exploring the intersection of architectural form and functional grace. Shop premium oversized essentials."
        keywords="oversized streetwear, luxury oversized, architectural silhouettes, designer basics, thick cotton tees, knotty town"
      />
      {/* Cinematic Hero Slider Section */}
      <section className="relative h-[95vh] flex items-center overflow-hidden">
        {HERO_SLIDES.map((slide, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-all duration-[2000ms] ease-out-expo ${
              index === currentSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-110 z-0'
            }`}
          >
            <div className="absolute inset-0">
              <img 
                className="w-full h-full object-cover transition-transform duration-[8000ms] ease-linear" 
                src={slide.image} 
                alt={slide.title} 
                style={{ transform: index === currentSlide ? 'scale(1)' : 'scale(1.2)' }}
              />
              <div className="absolute inset-0 bg-primary/25 mix-blend-multiply"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-black/40 to-transparent"></div>
            </div>
            
            <div className="relative h-full flex items-center px-6 md:px-24 w-full">
              <div className={`max-w-4xl transition-all duration-[1500ms] delay-500 ${
                index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}>
                <span className="text-white/80 font-body text-[10px] tracking-[0.5em] uppercase mb-8 block">
                  {index === 0 ? 'New Collection 2026' : 'The Metal Story'}
                </span>
                <h1 className="text-4xl sm:text-6xl md:text-[8.5rem] leading-[1.1] md:leading-[0.9] text-white font-headline tracking-tighter mb-12 italic font-light drop-shadow-2xl">
                  {slide.title.split(': ').map((part, i) => (
                    <span key={i} className="block">{part}</span>
                  ))}
                </h1>
                <p className="text-white/90 font-body text-xl max-w-lg mb-16 font-light leading-relaxed">
                  {slide.subtitle}
                </p>
                <div className="flex gap-8 items-center">
                  <Link 
                    to={slide.path} 
                    className="px-14 py-6 bg-white text-primary font-body text-[10px] tracking-[0.3em] uppercase transition-all duration-700 hover:bg-transparent hover:text-white border border-white"
                  >
                    {slide.cta}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Slider Indicators */}
        <div className="absolute bottom-12 left-24 z-20 flex gap-6">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-[2px] transition-all duration-700 flex items-center ${
                i === currentSlide ? 'w-16 bg-white' : 'w-8 bg-white/20 hover:bg-white/40'
              }`}
            >
              <span className="text-[10px] mt-8 text-white opacity-40 font-body tracking-widest">0{i+1}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Trust & Craftsmanship Section */}
      <section className="py-24 border-b border-outline-variant/10 bg-white">
        <div className="max-w-[1600px] mx-auto px-6 md:px-24 grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-32">
          <div className="flex flex-col items-center text-center group">
            <span className="material-symbols-outlined text-3xl mb-8 text-primary opacity-40 group-hover:opacity-100 transition-opacity duration-700">eco</span>
            <h3 className="text-[10px] tracking-[0.3em] uppercase font-semibold mb-4 text-primary">Ethical Sourcing</h3>
            <p className="text-[13px] text-secondary/60 font-body font-light max-w-[260px] leading-relaxed italic">Traceable fibers from family-owned mills in Japan and Italy.</p>
          </div>
          <div className="flex flex-col items-center text-center group border-x border-primary/5 px-12">
            <span className="material-symbols-outlined text-3xl mb-8 text-primary opacity-40 group-hover:opacity-100 transition-opacity duration-700">architecture</span>
            <h3 className="text-[10px] tracking-[0.3em] uppercase font-semibold mb-4 text-primary">Master Tailoring</h3>
            <p className="text-[13px] text-secondary/60 font-body font-light max-w-[260px] leading-relaxed italic">Handcrafted with geometric structural integrity and supreme craft.</p>
          </div>
          <div className="flex flex-col items-center text-center group">
            <span className="material-symbols-outlined text-3xl mb-8 text-primary opacity-40 group-hover:opacity-100 transition-opacity duration-700">public</span>
            <h3 className="text-[10px] tracking-[0.3em] uppercase font-semibold mb-4 text-primary">Global Logistics</h3>
            <p className="text-[13px] text-secondary/60 font-body font-light max-w-[260px] leading-relaxed italic">Complimentary insured world-wide delivery for our inner circle.</p>
          </div>
        </div>
      </section>

      {/* New Arrivals / New Silhouettes Section */}
      <section className="py-24 md:py-48 px-6 md:px-24 bg-background">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex justify-between items-end mb-24">
            <div>
              <span className="text-accent font-body text-[10px] tracking-[0.4em] uppercase mb-6 block">Recent Arrivals</span>
              <h2 className="text-4xl md:text-7xl font-headline italic text-primary tracking-tighter">New Silhouettes</h2>
            </div>
            <Link 
              to="/shop" 
              className="text-primary font-body text-[10px] tracking-[0.3em] border-b border-primary/20 pb-4 hover:border-accent hover:text-accent transition-all uppercase hidden sm:block"
            >
              VIEW FULL ARCHIVE
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {latestProducts.map((product) => (
                <div key={product.id} className="group cursor-pointer">
                  <Link to={`/product/${product.id}`}>
                    <div className="aspect-[3/4] overflow-hidden bg-surface-container-low mb-8 relative">
                      <img 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                        src={product.image} 
                        alt={product.name} 
                      />
                      <div className="absolute bottom-6 left-6">
                        <span className="text-[8px] tracking-[0.3em] font-body uppercase px-3 py-1.5 bg-white/90 backdrop-blur-md text-primary">
                          SIGNATURE PIECE
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-headline text-primary group-hover:italic transition-all duration-500">{product.name}</h3>
                        <p className="text-[10px] text-primary uppercase tracking-[0.2em] mt-2 font-body font-bold italic">{product.category}</p>
                      </div>
                      <p className="text-sm font-body text-accent tracking-tighter">₹{product.price}</p>
                    </div>
                  </Link>
                </div>
              ))
            }
          </div>
        </div>
      </section>

      {/* Shop by Category Anthologies */}
      <section className="py-24 md:py-48 px-6 md:px-24 border-t border-primary/5 bg-white">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: 'Metal Posters', category: 'Metal Posters', label: 'The Anthology', img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=1000' },
              { title: 'Men', category: 'Men', label: 'The Anthology', img: 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&q=80&w=1000' },
              { title: 'Women', category: 'Women', label: 'The Anthology', img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1000' }
            ].map((cat, i) => (
              <Link 
                key={i} 
                to={cat.category === 'Metal Posters' ? '/metal-posters' : `/shop?category=${cat.category}`} 
                className="relative aspect-[3/4] group overflow-hidden bg-surface-container"
              >
                <img 
                  className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" 
                  src={cat.img} 
                  alt={cat.title} 
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors duration-1000"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12 text-center">
                  <span className="text-[10px] tracking-[0.6em] uppercase mb-6 font-body opacity-60 group-hover:opacity-100 transition-opacity">{cat.label}</span>
                  <h3 className="text-5xl md:text-6xl font-headline italic font-light tracking-tighter opacity-90 group-hover:opacity-100 transition-opacity">{cat.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Core Essentials / Foundations Carousel */}
      <section className="py-24 md:py-48 bg-background overflow-hidden relative">
        <div className="max-w-[1600px] mx-auto px-6 md:px-24 mb-24">
          <span className="text-accent font-body text-[10px] tracking-[0.5em] uppercase mb-6 block">Foundations</span>
          <h2 className="text-4xl md:text-8xl font-headline italic mb-8 text-primary tracking-tighter">Core Essentials</h2>
          <p className="font-body text-secondary/60 text-lg max-w-xl font-light leading-relaxed italic">
            A permanent collection of essential forms, refined through seasons of continuous iteration.
          </p>
        </div>
        
        <div className="flex gap-12 overflow-x-auto pb-12 px-6 md:px-24 snap-x snap-mandatory no-scrollbar scroll-smooth">
          {coreEssentials.map((product) => (
              <div key={product.id} className="min-w-[75vw] md:min-w-[28vw] snap-start group cursor-pointer">
                <Link to={`/product/${product.id}`}>
                  <div className="aspect-[2/3] bg-surface-container-low mb-8 overflow-hidden relative">
                    <img 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                      src={product.image} 
                      alt={product.name} 
                    />
                  </div>
                  <h3 className="text-2xl font-headline text-primary group-hover:italic transition-all duration-500">{product.name}</h3>
                  <p className="text-sm font-body text-accent mt-4 tracking-tighter italic font-light">Available for Archives — ₹{product.price}</p>
                </Link>
              </div>
            ))
          }
        </div>
      </section>

      {/* Brand Manifesto Section */}
      <section className="py-32 md:py-64 bg-primary text-white relative overflow-hidden text-center">
        <div className="max-w-5xl mx-auto px-6 md:px-24 relative z-10">
          <span className="text-white/40 font-body text-[10px] tracking-[0.6em] uppercase mb-20 block">Brand Manifesto</span>
          <h2 className="text-3xl md:text-[6.5rem] font-headline leading-[1.2] md:leading-[1.05] mb-20 italic font-light tracking-tighter">
            "Clothing is the first architecture we inhabit. It should provide both sanctuary and statement."
          </h2>
          <div className="w-24 h-px bg-white/20 mx-auto mb-20"></div>
          <p className="text-white/60 font-body text-xl max-w-3xl mx-auto leading-relaxed mb-24 font-light italic">
            Knotty Town strips away the noise of fast fashion to reveal the essential core of premium craft. Every garment is a dialogue between traditional atelier methods and contemporary silhouette.
          </p>
          <button className="px-16 py-7 border border-white/20 text-white font-body text-[10px] tracking-[0.5em] uppercase hover:bg-white hover:text-primary transition-all duration-[1000ms] ease-out">
            Read Our Story
          </button>
        </div>
        <div className="absolute -bottom-32 -right-32 text-[40rem] font-headline text-white/[0.02] select-none pointer-events-none tracking-tighter font-bold uppercase">
          AG
        </div>
      </section>

      {/* Metal Poster Boutique Section */}
      <section className="py-24 md:py-56 bg-white overflow-hidden border-t border-primary/5">
        <div className="max-w-[1600px] mx-auto px-6 md:px-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="order-2 lg:order-1 relative group">
               <div className="aspect-[4/5] bg-surface-container overflow-hidden cinematic-border">
                 <img 
                   className="w-full h-full object-cover transition-all duration-[2000ms] group-hover:scale-110" 
                   src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=1000" 
                   alt="Metal Poster Craftsmanship" 
                 />
               </div>
               <div className="absolute -bottom-10 -right-10 w-2/3 aspect-square bg-background border border-primary/5 p-8 shadow-2xl hidden md:block">
                  <span className="text-accent text-[9px] uppercase tracking-[0.4em] mb-4 block italic">Technical Detail</span>
                  <p className="text-primary/60 font-body text-sm font-light leading-relaxed italic">
                    Our metal panels are UV-printed on brushed aeronautical-grade aluminum, ensuring archival life exceeding a century.
                  </p>
               </div>
            </div>
            
            <div className="order-1 lg:order-2 space-y-12 pr-0 lg:pr-24">
               <div>
                  <span className="text-accent font-body text-[10px] tracking-[0.5em] uppercase mb-6 block opacity-60">The Metal Anthology</span>
                  <h2 className="text-4xl md:text-8xl font-headline italic text-primary leading-tight font-light tracking-tighter">Geometric Prints.</h2>
               </div>
               <p className="font-body text-secondary/60 text-lg max-w-xl font-light leading-relaxed italic">
                 Translating silhouette into static form. Our signature metal posters capture the architectural intent of Knotty Town in a permanent, metallic medium.
               </p>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8">
                 {metalPosters.length > 0 ? metalPosters.map((poster) => (
                   <Link key={poster.id} to={`/product/${poster.id}`} className="group block space-y-6">
                      <div className="aspect-square bg-zinc-100 overflow-hidden relative border border-primary/5">
                        <img 
                          src={poster.image} 
                          className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110" 
                          alt={poster.name}
                        />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 font-body text-[8px] tracking-widest uppercase">
                          ₹{poster.price}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-headline text-2xl text-primary group-hover:italic transition-all duration-500">{poster.name}</h4>
                        <span className="text-[9px] text-accent font-body tracking-[0.4em] uppercase mt-2 block opacity-40 italic">Series 01 / Panel</span>
                      </div>
                   </Link>
                 )) : (
                   <p className="text-primary/20 italic font-body text-xs tracking-widest uppercase">Archive Synchronizing...</p>
                 )}
               </div>
               
               <div className="pt-12 flex flex-col sm:flex-row gap-6">
                  <Link 
                    to="/metal-posters" 
                    className="px-12 py-5 bg-primary text-white font-body text-[10px] tracking-[0.4em] uppercase hover:bg-black transition-all shadow-xl block w-full sm:w-fit text-center"
                  >
                    SHOP PLATES
                  </Link>
                  <Link 
                    to="/metal-posters#craft" 
                    className="px-12 py-5 border border-primary text-primary font-body text-[10px] tracking-[0.4em] uppercase hover:bg-primary hover:text-white transition-all block w-full sm:w-fit text-center"
                  >
                    THE METAL STORY
                  </Link>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Journal */}
      <section className="py-24 md:py-48 bg-background">
        <div className="max-w-[1600px] mx-auto px-6 md:px-24 mb-24 flex flex-col md:flex-row justify-between items-end gap-12">
          <div>
            <span className="text-accent font-body text-[10px] tracking-[0.5em] uppercase mb-6 block">Editorial Narratives</span>
            <h2 className="text-4xl md:text-7xl font-headline text-primary tracking-tighter italic">The Journal</h2>
          </div>
          <Link 
            to="/journal" 
            className="text-primary font-body text-[10px] tracking-[0.3em] border-b border-primary/20 pb-4 hover:border-accent hover:text-accent transition-all uppercase"
          >
            Explore Issues
          </Link>
        </div>

        <div className="flex gap-20 overflow-x-auto pb-16 px-6 md:px-24 snap-x snap-mandatory no-scrollbar">
          {latestProducts.map((product, idx) => (
            <div key={product.id} className="min-w-[85vw] md:min-w-[45vw] snap-center group cursor-pointer">
              <Link to={`/product/${product.id}`}>
                <div className="aspect-[16/10] bg-surface-container mb-12 overflow-hidden relative">
                  <img 
                    className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105" 
                    src={product.image} 
                    alt={product.name} 
                  />
                </div>
                <span className="text-accent text-[10px] font-body uppercase tracking-[0.4em]">Issue 0{idx + 1} / Material Study</span>
                <h4 className="text-4xl mt-6 font-headline text-primary group-hover:italic transition-all duration-500 max-w-xl leading-tight">
                  Design for Persistence: {product.name}
                </h4>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter Signup & Security */}
      <section className="py-24 md:py-56 px-6 md:px-24 border-t border-primary/5 bg-white">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <h2 className="text-4xl md:text-8xl font-headline text-primary mb-12 tracking-tighter italic font-light">Join the inner circle.</h2>
          <p className="text-secondary/60 font-body text-xl mb-20 max-w-2xl font-light leading-relaxed italic">
            Receive early access to seasonal lookbooks and curated narratives from our design studio.
          </p>
          <form className="w-full max-w-2xl flex flex-col md:flex-row gap-6 mb-24" onSubmit={(e) => e.preventDefault()}>
            <input 
              className="flex-1 bg-transparent border-b border-primary/10 py-6 px-4 focus:border-primary focus:ring-0 outline-none text-[10px] tracking-[0.5em] font-body transition-all duration-700 uppercase text-primary placeholder:text-secondary/20" 
              placeholder="EMAIL ADDRESS" 
              type="email" 
            />
            <button className="bg-primary text-white px-16 py-6 font-body text-[10px] tracking-[0.4em] uppercase hover:bg-black transition-all duration-1000 whitespace-nowrap">
              Subscribe
            </button>
          </form>
          
          {/* Security Badges */}
          <div className="flex flex-wrap justify-center gap-16 opacity-30 grayscale hover:opacity-100 transition-opacity duration-1000 cursor-default">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl font-light">verified_user</span>
              <span className="text-[10px] tracking-[0.3em] uppercase font-semibold text-primary font-body">Encrypted Portal</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl font-light">workspace_premium</span>
              <span className="text-[10px] tracking-[0.3em] uppercase font-semibold text-primary font-body">Authorized House</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl font-light">local_shipping</span>
              <span className="text-[10px] tracking-[0.3em] uppercase font-semibold text-primary font-body">Insured Logistics</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
