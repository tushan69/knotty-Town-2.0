import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Category, Product } from '../types';
import { getProducts } from '../services/productService';
import ProductCard from '../components/ProductCard';
import DripVision from '../components/DripVision';
import SEO from '../components/SEO';
import LoadingScreen from '../components/LoadingScreen';

type SortOption = 'Newest' | 'Price: Low-High' | 'Price: High-Low' | 'Popularity' | 'Top Rated';

const MOCK_PRODUCTS: Product[] = [];

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
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
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

  if (isLoading) return <LoadingScreen />;

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
                          ? 'text-primary font-bold italic underline decoration-accent/30 underline-offset-8'
                          : 'text-primary font-semibold'
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
                      ? 'text-primary border-b-2 border-primary font-bold italic'
                      : 'text-primary font-semibold'
                  }`}
                >
                  {cat}
                </button>
              ))}
          </div>

          {/* Product Grid Area */}
          <div className="lg:col-span-10">
            {filteredAndSortedProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-12 gap-y-24">
                {filteredAndSortedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="space-y-16">
                <div className="flex items-center gap-4 py-8 border-b border-primary/5">
                   <span className="material-symbols-outlined text-accent animate-pulse">info</span>
                   <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold">No matches found for your current criteria. Showing the full archive instead.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-12 gap-y-24">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
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
