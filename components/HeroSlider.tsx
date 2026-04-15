
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';
import { HERO_SLIDES as DEFAULT_SLIDES } from '../constants';

const HeroSlider: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState(DEFAULT_SLIDES);

  useEffect(() => {
    const dynamicSlides = localStorage.getItem('knotty_hero_slides');
    if (dynamicSlides) {
      setSlides(JSON.parse(dynamicSlides));
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 8000);
    return () => clearInterval(timer);
  }, [slides]);

  if (slides.length === 0) return null;

  return (
    <section className="relative h-[85vh] md:h-screen overflow-hidden bg-black flex items-center">
      {slides.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${idx === current ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-110 z-0 pointer-events-none'
            }`}
        >
          <div className="absolute inset-0">
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover brightness-[0.4] md:brightness-[0.5] contrast-[1.1]"
              fetchPriority={idx === 0 ? "high" : "auto"}
              loading={idx === 0 && current === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          </div>

          <div className="relative h-full max-w-7xl mx-auto px-6 md:px-8 flex flex-col justify-center items-start pt-10">
            <div className="max-w-4xl space-y-4 md:space-y-6">
              <div className="inline-flex items-center space-x-2 bg-black text-white hover:bg-gray-800 text-white px-3 py-1 text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] rotate-[-2deg]">
                <Zap className="w-3 h-3 fill-current" />
                <span>KNOTTY TOWN EXCLUSIVE</span>
              </div>

              <h1 className="text-white leading-[0.9] uppercase tracking-tighter">
                <span className="block font-serif text-5xl md:text-[120px] animate-in slide-in-from-left duration-700 delay-100">
                  {slide.title.split(' ')[0]}
                </span>
                <span className="block font-serif text-5xl md:text-[120px] text-outline md:-mt-6 animate-in slide-in-from-left duration-700 delay-300">
                  {slide.title.split(' ').slice(1).join(' ')}
                </span>
              </h1>

              <p className="text-gray-300 text-sm md:text-xl font-bold uppercase tracking-[0.2em] max-w-sm md:max-w-xl animate-in fade-in duration-1000 delay-500">
                {slide.subtitle}
              </p>

              <div className="pt-6 md:pt-8 animate-in slide-in-from-bottom-8 duration-700 delay-700">
                <Link
                  to={slide.path || '/shop'}
                  className="group w-full md:w-auto inline-flex items-center justify-center bg-white text-black font-black py-4 md:py-6 px-10 md:px-12 transition-all hover:bg-black text-white hover:bg-gray-800 hover:text-white shadow-sm transition-all"
                >
                  <span className="text-[10px] md:text-xs uppercase tracking-[0.3em]">{slide.cta || 'EXPLORE DROP'}</span>
                  <ArrowRight className="ml-4 w-4 h-4 md:w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="absolute bottom-10 md:bottom-12 left-6 right-6 md:left-1/2 md:-translate-x-1/2 z-20 flex space-x-2 md:space-x-4">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className="group relative flex-grow md:w-16 h-1 overflow-hidden bg-white/20"
          >
            <div
              className={`absolute top-0 left-0 h-full bg-black text-white hover:bg-gray-800 transition-all duration-[8000ms] linear ${idx === current ? 'w-full' : 'w-0'
                }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;
