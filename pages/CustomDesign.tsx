

import React, { useState, useRef, DragEvent, useEffect } from 'react';
import { Upload, ShoppingBag, Crown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { apiUrl } from '../utils/apiUrl';

const CustomDesign: React.FC = () => {
  const { addToCart } = useCart();
  const [design, setDesign] = useState<string | null>(null);
  const [position, setPosition] = useState<'Front' | 'Back'>('Front');
  const [selectedColor, setSelectedColor] = useState('Black');
  const [isDragging, setIsDragging] = useState(false);
  const [royalLionBranding, setRoyalLionBranding] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const COLORS = [
    { name: 'Black', hex: '#1a1a1a' },
    { name: 'White', hex: '#ffffff' },

    { name: 'Rust', hex: '#B7410E' },

  ];

  // Plain White Oversized T-Shirt (Flat Lay / Ghost Mannequin style for better tinting)
  const FRONT_MOCKUP = 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=1000';
  const BACK_MOCKUP = 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=1000'; // Using same style for now as back view is hard to find matching exactly, or use a similar plain white back.

  // Default fallback if no custom branding set
  const DEFAULT_LION = 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?dpr=1&auto=format&fit=crop&w=400&h=400&q=60';

  const [selectedSize, setSelectedSize] = useState('');
  const [basePrice, setBasePrice] = useState(1599);
  const SIZES = ['M', 'L', 'XL'];

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [brandingRes, priceRes] = await Promise.all([
          fetch(apiUrl('settings.php?key=royal_lion_branding')),
          fetch(apiUrl('settings.php?key=custom_design_price'))
        ]);

        const brandingData = await brandingRes.json();
        const priceData = await priceRes.json();

        if (brandingData.value) setRoyalLionBranding(brandingData.value);
        if (priceData.value) setBasePrice(parseInt(priceData.value));
      } catch (e) {
        console.log("Settings fetch failed");
      }
    };
    fetchSettings();
  }, []);

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDesign(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyOfficialBranding = () => {
    setDesign(royalLionBranding || DEFAULT_LION);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleAddToCart = () => {
    if (!design) return;
    addToCart({
      id: 'custom-' + Date.now(),
      name: `KNOTTY TOWN: CUSTOM ${selectedColor.toUpperCase()} DROP`,
      price: basePrice,
      category: 'Knotty Lab',
      image: design, // Ideally this would be a composite, saving just design for now
      description: `Signature 240+ GSM Oversized Boxy Tee in ${selectedColor}. Royal Lion Series.`,
      rating: 5,
      reviews: [],
      features: ['240 GSM Signature Cotton', 'Boxy Street Fit', `Color: ${selectedColor}`, 'Lion Grade Branding'],
      isCustom: true,
      customPosition: position,
      selectedSize: selectedSize
    } as any);
  };


  return (
    <div className="min-h-screen bg-white">
      <div className="bg-black py-12 md:py-32 border-b-4 border-[#FF4500] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Crown className="w-48 h-48 md:w-64 md:h-64 text-yellow-400 animate-pulse" />
        </div>
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-black text-white hover:bg-gray-800 text-white px-3 py-1 mb-4 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] rotate-1">
            <span>OFFICIAL KNOTTY LAB</span>
          </div>
          <h1 className="font-serif text-4xl md:text-9xl text-white uppercase tracking-tight mb-4 leading-none break-words">
            OVERSIZED <span className="text-black italic">BOXY.</span>
          </h1>
          <p className="text-gray-400 font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-[10px] md:text-xs">Signature 240 GSM Drop / <span className="text-purple-500">Luxury Edition</span></p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          <div className="relative static lg:sticky lg:top-32 space-y-6 md:space-y-8">
            <div className="relative group [perspective:2500px]">
              <div className="relative w-full aspect-[4/5] bg-zinc-100 border border-gray-200 transition-all duration-300 shadow-[8px_8px_0px_0px_rgba(255,69,0,0.3)] md:shadow-[12px_12px_0px_0px_rgba(255,69,0,0.3)] overflow-hidden flex items-center justify-center p-4">

                {/* T-Shirt SVG Shape */}
                <div className="relative w-full h-full max-w-[400px] flex items-center justify-center">
                  <svg viewBox="0 0 512 512" className="w-full h-full drop-shadow-2xl transition-colors duration-500 filter" style={{ color: COLORS.find(c => c.name === selectedColor)?.hex }}>
                    <defs>
                      <filter id="cloth-texture">
                        <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="1" seed="0" result="noise" />
                        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.1 0" in="noise" result="coloredNoise" />
                        <feComposite operator="in" in="coloredNoise" in2="SourceGraphic" result="composite" />
                        <feBlend mode="multiply" in="composite" in2="SourceGraphic" />
                      </filter>
                    </defs>

                    {/* Shirt Body */}
                    <path
                      fill="currentColor"
                      stroke="black"
                      strokeWidth="3"
                      d={position === 'Front'
                        // Boxy Oversized Fit - Front (Lower Neck)
                        ? "M120 100 L60 160 L100 200 L120 180 L120 480 L392 480 L392 180 L412 200 L452 160 L392 100 L320 100 C320 100 300 130 256 130 C212 130 192 100 192 100 L120 100 Z"
                        // Boxy Oversized Fit - Back (High Neck)
                        : "M120 100 L60 160 L100 200 L120 180 L120 480 L392 480 L392 180 L412 200 L452 160 L392 100 L320 100 C320 100 300 110 256 110 C212 110 192 100 192 100 L120 100 Z"
                      }
                    />
                  </svg>

                  {/* Texture Overlay for realism */}
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/fabric-of-squares.png')] mix-blend-multiply pointer-events-none"></div>

                  {/* Design Area - Clipped to shirt area logically */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none top-0 pt-20">
                    {design ? (
                      <img
                        src={design}
                        className="w-[40%] max-h-[50%] object-contain mix-blend-multiply"
                        style={{ opacity: 0.9 }}
                      />
                    ) : (
                      <div className="text-black/20 font-black text-xs uppercase tracking-widest border border-gray-200/10 p-4 rotate-[-12deg] pointer-events-none select-none">
                        {position} PRINT AREA
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="absolute top-4 left-4 md:top-8 md:left-8 bg-black text-white px-3 py-2 md:px-6 md:py-3 font-black text-[8px] md:text-[10px] uppercase tracking-widest rotate-[-4deg] z-20 border-2 border-[#FF4500]">
                <Crown className="w-3 h-3 md:w-4 md:h-4 mr-2 md:mr-3 text-yellow-400 inline" />
                ROYAL OVERSIZED FIT
              </div>
            </div>
            <div className="bg-black text-white hover:bg-gray-800 text-white p-4 md:p-5 border border-gray-200 shadow-sm transition-all font-serif text-xl md:text-2xl text-center">₹{basePrice}</div>
          </div>

          <div className="space-y-8 md:space-y-12">
            <section className="space-y-6 md:space-y-8">
              <h2 className="font-serif text-3xl md:text-4xl uppercase tracking-tighter">1. ART DROP.</h2>
              <div className="bg-zinc-50 border border-gray-200 p-4 mb-4 shadow-sm transition-all">
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-black flex items-center">
                  <Crown className="w-3 h-3 mr-2" />
                  IMPORTANT: UPLOAD HD / 4K IMAGES ONLY.
                </p>
              </div>
              <div
                onDragOver={onDragOver}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border border-gray-200 border-dashed p-10 md:p-16 text-center cursor-pointer transition-colors ${isDragging ? 'bg-black text-white border-[#FF4500]' : 'bg-zinc-50 text-black hover:bg-black hover:text-white'}`}
              >
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => processFile(e.target.files?.[0]!)} />
                <Upload className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4" />
                <p className="font-black text-xs md:text-sm uppercase tracking-widest">TAP TO UPLOAD DROP</p>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="font-serif text-3xl md:text-4xl uppercase tracking-tighter">2. COLOR BASE.</h2>
              <div className="grid grid-cols-5 gap-3 md:gap-4">
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c.name)}
                    className={`aspect-square border border-gray-200 flex flex-col items-center justify-center space-y-1 md:space-y-2 hover:scale-105 transition-all ${selectedColor === c.name ? 'ring-2 md:ring-4 ring-[#FF4500] ring-offset-2 md:ring-offset-4' : ''}`}
                    style={{ backgroundColor: c.name === 'White' || c.name === 'Skin' ? '#f4f4f5' : 'transparent' }}
                  >
                    <div
                      className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-black/20 shadow-inner"
                      style={{ backgroundColor: c.hex }}
                    ></div>
                    <span className="text-[7px] md:text-[8px] font-black uppercase hidden md:inline">{c.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="font-serif text-3xl md:text-4xl uppercase tracking-tighter">3. SELECT SIZE.</h2>
              <div className="grid grid-cols-4 md:grid-cols-5 gap-3 md:gap-4">
                {SIZES.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`h-10 md:h-12 border-2 font-black text-sm md:text-base flex items-center justify-center transition-all ${selectedSize === size ? 'bg-black text-white border-black ring-2 ring-[#FF4500] ring-offset-2' : 'border-black hover:bg-gray-100'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="font-serif text-3xl md:text-4xl uppercase tracking-tighter">4. VIEW TOGGLE.</h2>
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <button onClick={() => setPosition('Front')} className={`p-4 md:p-6 border-4 font-black text-[10px] md:text-xs uppercase ${position === 'Front' ? 'bg-black text-white hover:bg-gray-800 text-white border-black' : 'bg-white'}`}>FRONT VIEW</button>
                <button onClick={() => setPosition('Back')} className={`p-4 md:p-6 border-4 font-black text-[10px] md:text-xs uppercase ${position === 'Back' ? 'bg-black text-white hover:bg-gray-800 text-white border-black' : 'bg-white'}`}>BACK VIEW</button>
              </div>
            </section>

            <button disabled={!design || !selectedSize} onClick={handleAddToCart} className={`w-full font-black py-6 md:py-10 flex items-center justify-center transition-all uppercase tracking-[0.2em] md:tracking-[0.4em] text-xs md:text-sm border border-gray-200 ${design && selectedSize ? 'bg-black text-white hover:bg-black text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-300'}`}>
              <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 mr-4 md:mr-6" /> {!selectedSize ? 'SELECT A SIZE' : `COP THE ROYAL DROP - ₹${basePrice}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomDesign;

