import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { getProductById, getRelatedProducts } from '../services/productService';
import { Product, Category } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Ruler, Play, Camera, Star, ArrowRight, ShieldCheck, Mail, MapPin } from 'lucide-react';
import SEO from '../components/SEO';
import ProductCard from '../components/ProductCard';
import { apiUrl } from '../utils/apiUrl';

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [related, setRelated] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart, addRecentlyViewed } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [showBackView, setShowBackView] = useState(false);

  // Media states
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeMedia, setActiveMedia] = useState<'image' | 'video'>('image');

  // Size Guide States
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [measurements, setMeasurements] = useState({ height: '', weight: '', preference: 'Regular' });
  const [recommendedSize, setRecommendedSize] = useState<string | null>(null);

  // Review states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ userName: '', comment: '', rating: 5, photo: null as File | null });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [notifyContact, setNotifyContact] = useState('');
  const [isNotifying, setIsNotifying] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      if (id) {
        try {
          const found = await getProductById(id);
          setProduct(found);

          if (found) {
            const relatedProds = await getRelatedProducts(found.category, id);
            setRelated(relatedProds);
            addRecentlyViewed(found);
            const available = found.availableSizes || [];
            if (available.length > 0) setSelectedSize(available[0]);
          }
        } catch (error) {
          console.error('Error fetching product:', error);
        }
      }
      setIsLoading(false);
      window.scrollTo(0, 0);
    };
    fetchProduct();
  }, [id]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  const handleFindSize = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseInt(measurements.height);
    const w = parseInt(measurements.weight);
    if (!h || !w) return;

    // Sophisticated AI estimation logic representation
    let rec = 'M';
    if (h > 180 && w > 80) rec = 'XL';
    else if (h > 175 || w > 75) rec = 'L';
    else if (h < 165 || w < 60) rec = 'S';

    if (measurements.preference === 'Oversized' && rec !== 'XL') {
      const sizesObj = { 'S': 'M', 'M': 'L', 'L': 'XL', 'XL': 'XXL' };
      rec = (sizesObj as any)[rec] || 'XL';
    }
    setRecommendedSize(rec);
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !id) return;
    setIsSubmittingReview(true);

    let photoData = null;
    if (newReview.photo) {
      photoData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(newReview.photo!);
      });
    }

    try {
      const response = await fetch(apiUrl('submit_review.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: id,
          userName: newReview.userName,
          rating: newReview.rating,
          comment: newReview.comment,
          photoData: photoData
        })
      });

      if (response.ok) {
        const res = await response.json();
        const updatedProduct = {
          ...product,
          reviews: [res.review, ...(product.reviews || [])],
          rating: res.newRating
        };
        setProduct(updatedProduct);
        setShowReviewForm(false);
        setNewReview({ userName: '', comment: '', rating: 5, photo: null });
        alert("Your reflection has been published to the archives.");
      }
    } catch (err) {
      console.error("UGC Sync Error:", err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleNotifyMe = async () => {
    if (!notifyContact || !id) return;
    setIsNotifying(true);
    try {
      const response = await fetch(apiUrl('restock_notify.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id, contact: notifyContact })
      });
      if (response.ok) {
        alert("Priority signal received. We will notify you upon the next drop.");
        setNotifyContact('');
      }
    } catch (err) {
      console.error("Notify Sync Error:", err);
    } finally {
      setIsNotifying(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24">
      <div className="w-12 h-12 bg-surface-container-low animate-pulse flex items-center justify-center">
        <div className="w-2 h-full bg-primary/10 animate-spin"></div>
      </div>
      <p className="mt-12 text-[10px] uppercase tracking-[0.6em] text-primary/40 animate-pulse">Scanning Archive...</p>
    </div>
  );

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 pt-32">
        <div className="max-w-md w-full text-center space-y-12">
          <h1 className="font-headline text-5xl text-primary italic font-light">Archive Missing.</h1>
          <p className="font-body text-[10px] uppercase tracking-[0.5em] text-secondary leading-relaxed max-w-sm mx-auto opacity-60">
            This specific artifact has been removed from our current collection.
          </p>
          <Link
            to="/shop"
            className="inline-block border-b border-primary/20 pb-4 font-body text-[10px] uppercase tracking-[0.4em] text-primary hover:text-accent hover:border-accent transition-all"
          >
            RETURN TO CATALOG
          </Link>
        </div>
      </div>
    );
  }

  const sizes = ['S', 'M', 'L', 'XL'];
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const isActuallySoldOut = product.isSoldOut || (product.stock_quantity !== undefined && product.stock_quantity <= 0);

  return (
    <div className="bg-background min-h-screen pt-32 md:pt-48 pb-32 md:pb-48">
      <SEO
        title={`${product.name} | ${product.category}`}
        description={product.description}
        image={product.image}
        type="product"
        productData={product}
      />
      <div className="max-w-[1600px] mx-auto px-6 md:px-24">
        {/* Editorial Navigation */}
        <Link
          to="/shop"
          className="inline-flex items-center gap-4 mb-20 font-body text-[10px] uppercase tracking-[0.4em] text-secondary hover:text-primary group transition-all"
        >
          <span className="material-symbols-outlined text-lg font-light group-hover:-translate-x-2 transition-transform">arrow_back</span>
          <span>Return To Archive</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-32 mb-24 md:mb-48 items-start">
          {/* Main Visual Cinematic Presentation & 360 Video */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div
              className={`relative bg-surface-container-low aspect-[3/4] overflow-hidden ${activeMedia === 'image' ? 'cursor-zoom-in' : ''} group`}
              onMouseMove={activeMedia === 'image' && isZoomed ? handleMouseMove : undefined}
              onMouseEnter={() => activeMedia === 'image' && setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
            >
              {activeMedia === 'video' ? (
                <div className="w-full h-full bg-black flex items-center justify-center relative">
                   <div className="absolute inset-0 bg-primary/20 animate-pulse"></div>
                   <video
                     src="https://assets.mixkit.co/videos/preview/mixkit-fashion-model-walking-on-runway-348-large.mp4"
                     autoPlay loop muted playsInline
                     className="w-full h-full object-cover mix-blend-screen opacity-80"
                   />
                   <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-6 py-2 border border-white/10 flex items-center gap-4">
                     <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                     <span className="font-body text-[10px] uppercase tracking-widest text-white">360° Cinematic Render</span>
                   </div>
                </div>
              ) : (
                <img
                  src={showBackView && product.backImage ? product.backImage : product.image}
                  className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out"
                  style={isZoomed ? {
                    transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                    transform: 'scale(1.8)'
                  } : {}}
                  alt={product.name}
                />
              )}

              {isActuallySoldOut && (
                <div className="absolute inset-0 bg-primary/20 flex flex-col items-center justify-center backdrop-blur-[2px] pointer-events-none z-10">
                  <span className="text-white bg-red-600/90 font-black px-10 py-4 font-body text-[10px] uppercase tracking-[0.4em]">SOLD OUT</span>
                </div>
              )}
            </div>

            {/* Media Gallery Controls */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
              <button
                onClick={() => { setActiveMedia('image'); setShowBackView(false); }}
                className={`w-24 aspect-[3/4] border transition-all ${activeMedia === 'image' && !showBackView ? 'border-primary' : 'border-primary/10 opacity-50 hover:opacity-100 object-cover overflow-hidden'}`}
              >
                <img src={product.image} className="w-full h-full object-cover" />
              </button>
              {product.backImage && (
                <button
                  onClick={() => { setActiveMedia('image'); setShowBackView(true); }}
                  className={`w-24 aspect-[3/4] border transition-all ${activeMedia === 'image' && showBackView ? 'border-primary' : 'border-primary/10 opacity-50 hover:opacity-100 object-cover overflow-hidden'}`}
                >
                  <img src={product.backImage} className="w-full h-full object-cover" />
                </button>
              )}
              <button
                onClick={() => setActiveMedia('video')}
                className={`w-24 aspect-[3/4] border transition-all flex items-center justify-center bg-black text-white ${activeMedia === 'video' ? 'border-primary' : 'border-primary/10 opacity-50 hover:opacity-100'}`}
              >
                <span className="material-symbols-outlined">play_circle</span>
              </button>
            </div>
          </div>

          {/* Detailed Product Narrative */}
          <div className="lg:col-span-5 flex flex-col lg:sticky lg:top-48 h-fit">
            <span className="text-accent font-body text-[10px] tracking-[0.5em] uppercase mb-8 block">{product.category}</span>
            <h1 className="font-headline text-4xl md:text-7xl leading-[1.05] text-primary mb-10 italic font-light tracking-tighter">
              {product.name}
            </h1>

            <div className="flex items-center justify-between gap-6 mb-12 border-b border-primary/5 pb-12">
              <div className="flex items-baseline gap-6">
                <span className="text-2xl font-body text-primary font-light tracking-tight">₹{product.price.toFixed(0)}</span>
                {hasDiscount && (
                  <span className="text-sm font-body text-secondary/40 line-through tracking-wider">₹{product.originalPrice?.toFixed(0)}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                aria-label={isWishlisted(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                className="p-4 border border-primary/10 hover:border-accent/40 transition-colors shrink-0"
              >
                <Heart
                  className={`w-5 h-5 ${isWishlisted(product.id) ? 'fill-accent text-accent' : 'text-primary'}`}
                  strokeWidth={1}
                />
              </button>
            </div>

            <div className="mb-16">
               <h4 className="font-body text-[10px] uppercase tracking-[0.4em] text-accent mb-6">Material Dialogue</h4>
               <p className="font-body text-base text-secondary font-light leading-relaxed italic opacity-80">
                 {product.description}
               </p>
            </div>

            {/* Size Calibration (Skipped for Metal Posters) */}
            {product.category !== Category.METAL_POSTERS && (
              <div className="mb-16">
                <div className="flex justify-between items-end mb-8">
                   <span className="font-body text-[10px] uppercase tracking-[0.4em] text-primary">Dimensions</span>
                   <button
                     onClick={() => setShowSizeGuide(true)}
                     className="font-body text-[10px] uppercase tracking-[0.3em] text-accent border-b border-accent/20 pb-1 hover:border-accent transition-all"
                   >
                     Sizing Matrix & Fit
                   </button>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {sizes.map((size) => {
                    const sizeEntry = product.availableSizes?.find(s => s === size || s.startsWith(size + '-'));
                    let isAvailable = !!sizeEntry;
                    let sizeStock = -1;
                    if (sizeEntry && sizeEntry.includes('-')) {
                      sizeStock = parseInt(sizeEntry.split('-')[1]);
                      if (sizeStock <= 0) isAvailable = false;
                    }

                    return (
                      <button
                        key={size}
                        disabled={!isAvailable || isActuallySoldOut}
                        onClick={() => setSelectedSize(size)}
                        className={`py-5 text-[10px] font-body tracking-[0.4em] uppercase transition-all duration-500 relative ${
                          selectedSize === size
                            ? 'bg-primary text-white'
                            : isAvailable
                            ? 'border border-primary/10 text-primary hover:border-primary'
                            : 'opacity-20 cursor-not-allowed border border-transparent'
                        }`}
                      >
                        {size}
                        {sizeStock > 0 && sizeStock < 6 && (
                          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] px-1.5 py-0.5 animate-pulse rounded-sm">
                            {sizeStock} LEFT
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scarcity Dialogue */}
            {!isActuallySoldOut && product.stock_quantity !== undefined && product.stock_quantity > 0 && product.stock_quantity < 6 && (
              <div className="mb-10 animate-pulse">
                <span className="text-red-600 font-body text-[10px] tracking-[0.4em] uppercase flex items-center gap-3">
                  <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                  Priority Signal: Only {product.stock_quantity} remaining in current drop
                </span>
              </div>
            )}

            {/* Acquisition Controls */}
            <div className="flex flex-col sm:flex-row items-stretch gap-6 mb-16">
               {!isActuallySoldOut ? (
                 <>
                   <div className="flex items-center border border-primary/10 bg-white/50 px-2 py-2">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-4 text-primary/40 hover:text-primary transition-colors">
                         <span className="material-symbols-outlined text-lg font-light">remove</span>
                      </button>
                      <span className="w-12 text-center text-sm font-body font-light text-primary">{quantity}</span>
                      <button onClick={() => {
                        const maxAllowed = product.stock_quantity !== undefined && product.stock_quantity > 0 ? product.stock_quantity : 10;
                        setQuantity(Math.min(maxAllowed, quantity + 1));
                      }} className="p-4 text-primary/40 hover:text-primary transition-colors">
                         <span className="material-symbols-outlined text-lg font-light">add</span>
                      </button>
                   </div>

                   <button
                      disabled={product.category !== Category.METAL_POSTERS && !selectedSize}
                      onClick={() => {
                        const variantName = product.category === Category.METAL_POSTERS ? product.name : `${product.name} [${selectedSize}]`;
                        const variantId = product.category === Category.METAL_POSTERS ? product.id : `${product.id}-${selectedSize}`;
                        for(let i=0; i<quantity; i++) addToCart({ ...product, name: variantName, id: variantId });
                      }}
                      className="flex-1 py-6 font-body text-[10px] uppercase tracking-[0.5em] bg-primary text-white hover:bg-black hover:tracking-[0.7em] transition-all duration-[1000ms]"
                   >
                      ADD TO ARCHIVE
                   </button>
                 </>
               ) : (
                 <div className="w-full space-y-8 bg-surface-container-low p-8 border border-primary/5">
                   <div>
                     <h4 className="font-headline text-2xl italic font-light text-primary mb-2">Restock Priority.</h4>
                     <p className="font-body text-[10px] uppercase tracking-[0.2em] text-secondary/60">This item is currently sold out. Join the priority list for the next restock notification.</p>
                   </div>
                   <div className="flex gap-4">
                     <input
                       type="text"
                       placeholder="WhatsApp or Email" value={notifyContact} onChange={e => setNotifyContact(e.target.value)}
                       className="flex-grow bg-white border border-primary/10 px-6 py-4 font-body text-[10px] uppercase tracking-[0.2em] focus:border-primary outline-none transition-all"
                     />
                     <button onClick={handleNotifyMe} disabled={isNotifying} className="bg-primary text-white px-8 py-4 font-body text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all disabled:opacity-50">{isNotifying ? 'Processing...' : 'Notify Me'}</button>
                   </div>
                 </div>
               )}
            </div>

            {/* Atelier Details */}
            <div className="space-y-6 pt-12 border-t border-primary/5">
                {[
                  { label: "Fabrication", value: "100% Traceable Fiber" },
                  { label: "Silhouette", value: "Architectural / Relaxed" },
                  { label: "Provenance", value: "Sustainably Crafted" }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center group cursor-default">
                    <span className="font-body text-[10px] uppercase tracking-[0.4em] text-secondary/40 group-hover:text-accent transition-colors">{item.label}</span>
                    <span className="font-body text-[10px] uppercase tracking-[0.2em] text-primary italic font-light">{item.value}</span>
                  </div>
                ))}
            </div>

            {/* Complete The Look Inline */}
            {related.length > 0 && (
              <div className="mt-6 p-6 border border-primary/5 bg-surface-container-low/50">
                <span className="text-primary font-body text-[10px] tracking-[0.4em] uppercase mb-4 block">Complete The Synergy</span>
                <Link to={`/product/${related[0].id}`} className="flex items-center gap-4 group">
                   <img src={related[0].image} className="w-16 h-16 object-cover bg-white" />
                   <div>
                     <h5 className="font-headline italic text-lg text-primary">{related[0].name}</h5>
                     <p className="font-body text-xs text-secondary/60">Adds perfect structural contrast.</p>
                   </div>
                   <span className="material-symbols-outlined text-primary/40 group-hover:text-accent group-hover:translate-x-2 transition-all ml-auto">arrow_forward</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Client Reflections / Journaling */}
        <section className="mb-24 md:mb-48 border-t border-primary/5 pt-24 md:pt-32">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 md:mb-24 max-w-7xl mx-auto gap-8">
            <div className="max-w-4xl">
              <span className="text-accent font-body text-[10px] tracking-[0.5em] uppercase mb-8 block">Client Journal</span>
              <h2 className="font-headline text-4xl md:text-7xl text-primary italic font-light tracking-tighter">Reflections on <br />Materiality.</h2>
            </div>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-primary text-white hover:bg-accent px-10 py-5 font-body text-[10px] uppercase tracking-[0.4em] transition-all"
            >
              Submit Reflection
            </button>
          </div>

          {showReviewForm && (
            <div className="max-w-7xl mx-auto mb-24 bg-surface-container-low p-12 lg:p-24 border border-primary/10 animate-in fade-in slide-in-from-top-12 duration-700">
              <h3 className="font-headline text-3xl italic text-primary mb-8 tracking-tighter">Chronicle Your Experience</h3>
              <form onSubmit={submitReview} className="space-y-8 max-w-2xl">
                <div className="grid grid-cols-2 gap-8">
                  <input required placeholder="YOUR ALIAS" value={newReview.userName} onChange={e => setNewReview({...newReview, userName: e.target.value})} className="bg-transparent border-b border-primary/20 px-0 py-4 font-body text-xs uppercase tracking-[0.3em] font-light outline-none focus:border-primary transition-all text-primary" />
                  <select value={newReview.rating} onChange={e => setNewReview({...newReview, rating: Number(e.target.value)})} className="bg-transparent border-b border-primary/20 px-0 py-4 font-body text-xs uppercase tracking-[0.3em] font-light outline-none focus:border-primary transition-all text-primary cursor-pointer">
                    <option value={5}>5 - Masterpiece</option>
                    <option value={4}>4 - Exceptional</option>
                    <option value={3}>3 - Standard</option>
                  </select>
                </div>
                <textarea required placeholder="SHARE YOUR THOUGHTS ON THE FIT, FABRIC, AND PRESENCE..." value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})} rows={4} className="w-full bg-transparent border-b border-primary/20 px-0 py-4 font-body text-xs uppercase tracking-[0.3em] font-light outline-none focus:border-primary transition-all text-primary resize-none"></textarea>

                <div>
                  <span className="font-body text-[10px] uppercase tracking-[0.4em] text-primary/60 mb-4 block">UGC Proof (Optional)</span>
                  <input type="file" accept="image/*,video/*" onChange={e => setNewReview({...newReview, photo: e.target.files?.[0] || null})} className="text-secondary text-xs truncate w-full file:mr-4 file:py-3 file:px-6 file:border-0 file:text-[10px] file:uppercase file:tracking-[0.3em] file:font-light file:bg-primary file:text-white hover:file:bg-accent file:transition-all cursor-pointer" />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="border border-primary text-primary hover:bg-primary hover:text-white px-10 py-5 font-body text-[10px] uppercase tracking-[0.4em] transition-all disabled:opacity-50"
                >
                  {isSubmittingReview ? 'ARCHIVING...' : 'Publish To Archives'}
                </button>
              </form>
            </div>
          )}

          <div className="max-w-7xl mx-auto">
            {product.reviews && product.reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24">
                {product.reviews.map((review: any) => (
                  <div key={review.id} className="group flex flex-col h-full">
                    {review.photoUrl && (
                      <div className="mb-8 w-full aspect-square bg-surface-container-low overflow-hidden border border-primary/5">
                        <img src={review.photoUrl} className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-700" alt="UGC" />
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-10 opacity-40">
                      <span className="font-body text-[10px] uppercase tracking-[0.5em] text-primary">{review.userName}</span>
                      <span className="font-body text-[9px] uppercase tracking-[0.2em] text-secondary">{new Date(review.date).toLocaleDateString()}</span>
                    </div>
                    <p className="font-headline text-xl leading-[1.6] text-primary italic font-light opacity-80 group-hover:opacity-100 transition-opacity duration-700 flex-grow">
                      "{review.comment}"
                    </p>
                    <div className="mt-8 flex gap-1">
                       {Array.from({length: 5}).map((_, i) => (
                         <span key={i} className={`material-symbols-outlined text-[10px] ${i < review.rating ? 'text-accent' : 'text-primary/10'}`}>star</span>
                       ))}
                    </div>
                    <div className="mt-8 w-12 h-px bg-primary/10 group-hover:w-full transition-all duration-1000"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border border-dashed border-primary/10">
                <p className="font-body text-[10px] uppercase tracking-[0.6em] text-primary/30 italic">Collection notes pending.</p>
              </div>
            )}
          </div>
        </section>

        {/* Curated Pairings */}
        {related.length > 0 && (
           <section className="pt-24 md:pt-48 border-t border-primary/5">
             <div className="flex flex-col md:flex-row justify-between items-end mb-16 md:mb-24 gap-12">
                <div>
                  <span className="text-secondary font-body text-[10px] tracking-[0.6em] uppercase mb-8 block opacity-60">The Curator's Note</span>
                  <h2 className="font-headline text-4xl md:text-8xl text-primary tracking-tighter italic font-light">Complete The Look.</h2>
                </div>
                <Link to="/shop-the-look" className="font-body text-[10px] uppercase tracking-[0.4em] border-b border-primary/20 pb-4 hover:border-accent hover:text-accent transition-all">Explore Curated Looks</Link>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
               {related.map(p => <ProductCard key={p.id} product={p} />)}
             </div>
           </section>
        )}
      </div>

      {/* Sizing Matrix & Find My Size Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-background max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-primary/20 shadow-2xl relative">
            <button onClick={() => setShowSizeGuide(false)} className="absolute top-8 right-8 text-primary/60 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-2xl font-light">close</span>
            </button>

            <div className="p-12 md:p-16">
              <h2 className="font-headline text-4xl text-primary italic font-light tracking-tighter mb-4">Sizing Matrix.</h2>
              <p className="font-body text-[10px] uppercase tracking-[0.4em] text-secondary opacity-60 mb-16">Global Sizing Conversions & Measurements</p>

              <div className="overflow-x-auto mb-24">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-primary/10">
                      <th className="py-4 font-body text-[10px] uppercase tracking-[0.3em] text-primary/60 font-medium">Size</th>
                      <th className="py-4 font-body text-[10px] uppercase tracking-[0.3em] text-primary/60 font-medium">Chest (Inches)</th>
                      <th className="py-4 font-body text-[10px] uppercase tracking-[0.3em] text-primary/60 font-medium">Length (Inches)</th>
                      <th className="py-4 font-body text-[10px] uppercase tracking-[0.3em] text-primary/60 font-medium">Shoulder (Inches)</th>
                    </tr>
                  </thead>
                  <tbody className="font-body text-xs text-primary font-light">
                    <tr className="border-b border-primary/5 hover:bg-surface-container-low transition-colors"><td className="py-4 px-2 font-medium tracking-[0.2em] font-medium">S</td><td className="py-4 px-2">42</td><td className="py-4 px-2">28</td><td className="py-4 px-2">20</td></tr>
                    <tr className="border-b border-primary/5 hover:bg-surface-container-low transition-colors"><td className="py-4 px-2 font-medium tracking-[0.2em] font-medium">M</td><td className="py-4 px-2">44</td><td className="py-4 px-2">29</td><td className="py-4 px-2">21</td></tr>
                    <tr className="border-b border-primary/5 hover:bg-surface-container-low transition-colors"><td className="py-4 px-2 font-medium tracking-[0.2em] font-medium">L</td><td className="py-4 px-2">46</td><td className="py-4 px-2">30</td><td className="py-4 px-2">22</td></tr>
                    <tr className="border-b border-primary/5 hover:bg-surface-container-low transition-colors"><td className="py-4 px-2 font-medium tracking-[0.2em] font-medium">XL</td><td className="py-4 px-2">48</td><td className="py-4 px-2">31</td><td className="py-4 px-2">23</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-surface-container-low p-8 border border-primary/10">
                <h3 className="font-headline text-2xl italic text-primary font-light mb-8">Find Your Fit</h3>
                <form onSubmit={handleFindSize} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                  <div>
                    <label className="block font-body text-[9px] uppercase tracking-[0.4em] text-primary/60 mb-4">Height (cm)</label>
                    <input type="number" required value={measurements.height} onChange={e => setMeasurements({...measurements, height: e.target.value})} className="w-full bg-white border border-primary/10 px-6 py-4 font-body text-xs focus:border-primary outline-none transition-all" placeholder="E.G. 180" />
                  </div>
                  <div>
                    <label className="block font-body text-[9px] uppercase tracking-[0.4em] text-primary/60 mb-4">Weight (kg)</label>
                    <input type="number" required value={measurements.weight} onChange={e => setMeasurements({...measurements, weight: e.target.value})} className="w-full bg-white border border-primary/10 px-6 py-4 font-body text-xs focus:border-primary outline-none transition-all" placeholder="E.G. 75" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-body text-[9px] uppercase tracking-[0.4em] text-primary/60 mb-4">Fit Preference</label>
                    <div className="flex gap-4">
                      {['Regular', 'Oversized'].map(pref => (
                        <button type="button" key={pref} onClick={() => setMeasurements({...measurements, preference: pref})} className={`flex-1 py-4 font-body text-[10px] uppercase tracking-[0.3em] transition-all border ${measurements.preference === pref ? 'bg-primary text-white border-primary' : 'bg-transparent text-primary/60 border-primary/20 hover:border-primary/60'}`}>{pref}</button>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2 mt-4">
                    <button type="submit" className="w-full bg-accent text-white py-5 font-body text-[10px] uppercase tracking-[0.4em] hover:bg-black transition-all">Calculate Fit</button>
                  </div>
                </form>

                {recommendedSize && (
                   <div className="mt-8 pt-8 border-t border-primary/10 text-center animate-in fade-in zoom-in duration-500">
                     <span className="font-body text-[9px] uppercase tracking-[0.5em] text-primary/60 mb-2 block">Curator Recommendation</span>
                     <p className="font-headline text-3xl italic text-primary">Size <span className="font-bold text-accent px-2">{recommendedSize}</span></p>
                   </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
