import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Category, Product } from '../types';
import { getProducts } from '../services/productService';
import ProductCard from '../components/ProductCard';
import DripVision from '../components/DripVision';
import SEO from '../components/SEO';

type SortOption = 'Newest' | 'Price: Low-High' | 'Price: High-Low' | 'Popularity' | 'Top Rated';

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'The Oversized Structure', price: 4200, image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=1000', category: 'Oversized Tees', isFeatured: true, description: 'Geometric oversized silhouette crafted from heavy gauge cotton.', rating: 4.8, features: ['300 GSM', 'Oversized Fit'], availableSizes: ['S', 'M', 'L', 'XL'] },
  { id: '2', name: 'Monolith Trouser', price: 5800, image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=1000', category: 'Minimalist', isFeatured: true, description: 'Architecture for the legs. Sculpted drape in wool blend.', rating: 4.9, features: ['Wool Blend', 'Elastic Waist'], availableSizes: ['30', '32', '34'] },
  { id: '3', name: 'Ghost Layer Shell', price: 7200, image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=1000', category: 'Graphic Collection', isFeatured: true, description: 'A translucent study in technical silk. Minimalist weather protection.', rating: 4.7, features: ['Technical Silk', 'Water Resistant'], availableSizes: ['M', 'L'] },
  { id: '4', name: 'Observer T-Shirt', price: 2900, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=1000', category: 'Oversized Tees', isFeatured: true, description: 'The foundation of the modern wardrobe. 300gsm raw cotton.', rating: 4.8, features: ['Raw Cotton', 'Minimalist'], availableSizes: ['S', 'M', 'L', 'XL'] },
  { id: '5', name: 'Atelier Tote', price: 3500, image: 'https://images.unsplash.com/photo-1544816153-12ad23e42eb3?auto=format&fit=crop&q=80&w=1000', category: 'Accessories', isFeatured: false, description: 'Heavy canvas tote for essential archival documents.', rating: 4.6, features: ['Heavy Canvas', 'Internal Pocket'], availableSizes: ['One Size'] },
  { id: 'm1', name: 'The Geometric Monolith', price: 3500, image: 'https://images.unsplash.com/photo-1618609516629-3b6038148b59?auto=format&fit=crop&q=80&w=1000', category: 'Metal Posters', isFeatured: true, description: 'Brushed aluminum panel featuring architectural geometric studies.', rating: 4.9, features: ['Brushed Aluminum', 'Hidden Mount'], availableSizes: ['12x18', '24x36'] },
  { id: 'm2', name: 'Desert Mirage Panel', price: 3800, image: 'https://images.unsplash.com/photo-1518005020410-09880ef2016f?auto=format&fit=crop&q=80&w=1000', category: 'Metal Posters', isFeatured: true, description: 'Subtle metallic print capturing light anomalies in high desert.', rating: 4.8, features: ['Matte Finish', 'Gallery Box'], availableSizes: ['16x24'] }
];

const Shop: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('Newest');
  const [isDripVisionOpen, setIsDripVisionOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const activeCategory = searchParams.get('category') || 'All';
  const [activeSize, setActiveSize] = useState('All');
  const [activePrice, setActivePrice] = useState('All');
  const [activeColor, setActiveColor] = useState('All');
  const [activeMaterial, setActiveMaterial] = useState('All');

  const SIZES = ['All', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const PRICE_RANGES = ['All', 'Under ₹3000', '₹3000 - ₹6000', 'Over ₹6000'];
  const COLORS = ['All', 'Black', 'White', 'Grey', 'Blue', 'Red', 'Navy'];
  const MATERIALS = ['All', 'Cotton', 'Silk', 'Wool', 'Leather', 'Aluminum'];

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const allProducts = await getProducts();
        if (allProducts && allProducts.length > 0) {
          setProducts(allProducts.map((p: any) => ({
            ...p,
            isFeatured: p.isFeatured || p.is_featured
          })));
        } else {
          setProducts(MOCK_PRODUCTS);
        }
      } catch (error) {
        console.error('Error fetching products, using shop archive fallback:', error);
        setProducts(MOCK_PRODUCTS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const query = searchParams.get('search');
    if (query !== null) {
      setSearchTerm(query);
    }
  }, [searchParams]);

  const categories = ['All', ...Object.values(Category).filter(c => c !== Category.VAULT)];

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter((product) => {
      const isVaultItem = product.category === 'Secret Vault';
      const matchesCategory = activeCategory === 'All'
        ? !isVaultItem
        : product.category === activeCategory;

      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());

      const isAvailable = !product.isSoldOut;

      const sizeMatch = activeSize === 'All' || (product.availableSizes && product.availableSizes.includes(activeSize));
      
      let priceMatch = true;
      if (activePrice === 'Under ₹3000') priceMatch = product.price < 3000;
      else if (activePrice === '₹3000 - ₹6000') priceMatch = product.price >= 3000 && product.price <= 6000;
      else if (activePrice === 'Over ₹6000') priceMatch = product.price > 6000;

      const colorMatch = activeColor === 'All' || 
        product.description.toLowerCase().includes(activeColor.toLowerCase()) || 
        product.name.toLowerCase().includes(activeColor.toLowerCase());

      const materialMatch = activeMaterial === 'All' || 
        product.features.some(f => f.toLowerCase().includes(activeMaterial.toLowerCase())) ||
        product.description.toLowerCase().includes(activeMaterial.toLowerCase());

      return matchesCategory && matchesSearch && isAvailable && sizeMatch && priceMatch && colorMatch && materialMatch;
    });

    switch (sortBy) {
      case 'Price: Low-High':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'Price: High-Low':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'Popularity':
        // Fake popularity based on review count and rating
        result.sort((a, b) => ((b.reviewCount || 0) * b.rating) - ((a.reviewCount || 0) * a.rating));
        break;
      case 'Top Rated':
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        result.reverse();
    }

    return result;
  }, [activeCategory, searchTerm, products, sortBy]);

  return (
    <div className="bg-background min-h-screen">
      <SEO 
        title="All Collections | The Archive" 
        description="Explore the full Knotty Town archive. Browse essential tees, foundational trousers, outerwear silhouettes, and metal architectural posters."
        keywords="shop streetwear, oversized clothing collection, structural fashion, oversized tees buy online"
      />
      {/* Editorial Header */}
      <header className="pt-32 pb-24 md:pt-48 md:pb-32 px-6 md:px-24 bg-white/20">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-end gap-16">
          <div className="max-w-2xl">
            <span className="text-secondary font-body text-[10px] tracking-[0.5em] uppercase mb-8 block opacity-60">Architectural Archive</span>
            <h1 className="text-5xl md:text-9xl font-headline text-primary tracking-tighter italic font-light">The Collections.</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-12 w-full md:w-auto">
            {/* Visual Match */}
            <button
              onClick={() => setIsDripVisionOpen(true)}
              className="flex items-center gap-3 text-[10px] uppercase font-body tracking-[0.3em] text-accent hover:text-primary transition-all group"
            >
              <span className="material-symbols-outlined text-xl font-light group-hover:scale-110 transition-transform">photo_camera</span>
              <span>Visual Concierge</span>
            </button>

            {/* Global Search Bar */}
            <div className="relative group w-full sm:w-80 border-b border-primary/10 transition-all focus-within:border-primary">
              <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-primary/40 text-xl font-light">search</span>
              <input
                type="text"
                placeholder="FIND A PIECE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent pl-10 pr-4 py-4 text-[10px] tracking-[0.2em] font-body uppercase focus:outline-none placeholder:text-primary/20 text-primary"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Catalog View */}
      <main className="max-w-[1600px] mx-auto px-6 md:px-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
          
          {/* Side Navigation - Editorial Filters */}
          <aside className="lg:col-span-2 hidden lg:block sticky top-48 h-fit">
            <div className="space-y-16">
              <div>
                <h3 className="text-accent text-[10px] uppercase tracking-[0.4em] font-body mb-10 pb-4 border-b border-outline-variant/10">Archive Category</h3>
                <div className="flex flex-col gap-6">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSearchParams(cat === 'All' ? {} : { category: cat })}
                      className={`text-left text-[11px] uppercase tracking-[0.3em] transition-all duration-500 hover:text-primary ${
                        activeCategory === cat
                          ? 'text-primary font-bold italic'
                          : 'text-secondary/50 font-light'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-accent text-[10px] uppercase tracking-[0.4em] font-body mb-8">Curate By</h3>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full appearance-none bg-transparent py-4 text-[11px] uppercase tracking-[0.3em] text-primary border-b border-primary/10 outline-none cursor-pointer italic font-light"
                  >
                    <option value="Newest">New Arrivals</option>
                    <option value="Price: Low-High">Value: Low to High</option>
                    <option value="Price: High-Low">Value: High to Low</option>
                    <option value="Popularity">Most Popular</option>
                    <option value="Top Rated">Customer Ratings</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-xl font-light text-primary/40">expand_more</span>
                </div>
              </div>

              <div>
                <h3 className="text-accent text-[10px] uppercase tracking-[0.4em] font-body mb-8">Refine Search</h3>
                
                <div className="space-y-6">
                  {/* Size Filter */}
                  <div className="relative">
                    <select
                      value={activeSize}
                      onChange={(e) => setActiveSize(e.target.value)}
                      className="w-full appearance-none bg-transparent py-2 text-[10px] uppercase tracking-[0.2em] text-primary border-b border-primary/10 outline-none cursor-pointer font-light"
                    >
                      <option value="All">Size: Any</option>
                      {SIZES.slice(1).map(s => <option key={s} value={s}>Size: {s}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-sm font-light text-primary/40">expand_more</span>
                  </div>

                  {/* Price Filter */}
                  <div className="relative">
                    <select
                      value={activePrice}
                      onChange={(e) => setActivePrice(e.target.value)}
                      className="w-full appearance-none bg-transparent py-2 text-[10px] uppercase tracking-[0.2em] text-primary border-b border-primary/10 outline-none cursor-pointer font-light"
                    >
                      <option value="All">Price: Any</option>
                      {PRICE_RANGES.slice(1).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-sm font-light text-primary/40">expand_more</span>
                  </div>

                  {/* Material Filter */}
                  <div className="relative">
                    <select
                      value={activeMaterial}
                      onChange={(e) => setActiveMaterial(e.target.value)}
                      className="w-full appearance-none bg-transparent py-2 text-[10px] uppercase tracking-[0.2em] text-primary border-b border-primary/10 outline-none cursor-pointer font-light"
                    >
                      <option value="All">Material: Any</option>
                      {MATERIALS.slice(1).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-sm font-light text-primary/40">expand_more</span>
                  </div>
                  
                  {/* Color Filter */}
                  <div className="relative">
                    <select
                      value={activeColor}
                      onChange={(e) => setActiveColor(e.target.value)}
                      className="w-full appearance-none bg-transparent py-2 text-[10px] uppercase tracking-[0.2em] text-primary border-b border-primary/10 outline-none cursor-pointer font-light"
                    >
                      <option value="All">Color: Any</option>
                      {COLORS.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-sm font-light text-primary/40">expand_more</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile Filter Scroll */}
          <div className="lg:hidden flex overflow-x-auto pb-8 gap-8 no-scrollbar snap-x snap-mandatory">
             {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSearchParams(cat === 'All' ? {} : { category: cat })}
                  className={`whitespace-nowrap text-[10px] uppercase tracking-[0.3em] transition-all pb-4 snap-center ${
                    activeCategory === cat
                      ? 'text-primary border-b-2 border-primary font-bold'
                      : 'text-secondary/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
          </div>

          {/* Product Grid Area */}
          <div className="lg:col-span-10">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-64">
                <div className="w-12 h-12 bg-surface-container-low relative animate-pulse flex items-center justify-center">
                  <div className="w-2 h-full bg-primary/10 animate-spin"></div>
                </div>
                <p className="mt-12 text-[10px] uppercase tracking-[0.6em] text-primary/40 animate-pulse">Scanning Archive...</p>
              </div>
            ) : filteredAndSortedProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-12 gap-y-24">
                {filteredAndSortedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-64 text-center">
                 <h2 className="text-4xl font-headline text-primary/40 italic mb-12">The archive remains silent.</h2>
                 <button 
                   onClick={() => { setSearchTerm(''); setSearchParams({}); }}
                   className="px-12 py-5 border border-primary text-primary text-[10px] uppercase tracking-[0.4em] hover:bg-primary hover:text-white transition-all duration-500"
                 >
                   RESET PARAMETERS
                 </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {isDripVisionOpen && (
        <DripVision
          onClose={() => setIsDripVisionOpen(false)}
          onApplySearch={(query) => {
            setSearchTerm(query);
            setSearchParams({ search: query });
          }}
        />
      )}
    </div>
  );
};

export default Shop;
