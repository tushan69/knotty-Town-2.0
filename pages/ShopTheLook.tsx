import React, { useState, useEffect } from 'react';
import { getProducts } from '../services/productService';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';

const MOCK_LOOKS = [
  {
    id: 'l1',
    name: 'The Midnight Stroll',
    description: 'A curated ensemble for the city wanderer. Features the Observer T-Shirt and Monolith Trousers.',
    image: 'https://images.unsplash.com/photo-1552374196-0eaaf22b3c20?auto=format&fit=crop&q=80&w=1200',
    productIds: ['4', '2']
  },
  {
    id: 'l2',
    name: 'Architectural Layering',
    description: 'Weather protection meets street luxury. Featuring the Ghost Layer Shell over The Oversized Structure.',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1200',
    productIds: ['3', '1']
  }
];

const ShopTheLook: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState<string | null>(null);

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  const getLookProducts = (productIds: string[]) => {
    return productIds.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];
  };

  const calculateLookTotal = (lookProducts: Product[]) => {
    return lookProducts.reduce((acc, curr) => acc + curr.price, 0);
  };

  const handleAddLookToCart = (lookId: string, lookProducts: Product[]) => {
    setIsAdding(lookId);
    lookProducts.forEach(p => {
      addToCart({
        ...p,
        quantity: 1,
        selectedSize: p.availableSizes[0] || 'M'
      });
    });
    setTimeout(() => {
      setIsAdding(null);
    }, 1000);
  };

  return (
    <div className="bg-background min-h-screen text-primary pt-32 pb-24">
      <SEO 
        title="Curated Looks & Outfits | The Archive" 
        description="Shop fully styled architectural outfits. Combine oversized silhouettes seamlessly."
        keywords="shop the look, curated streetwear, complete outfits, styled luxury streetwear"
      />
      <header className="px-6 md:px-24 mb-16 max-w-[1600px] mx-auto">
        <span className="text-secondary font-body text-[10px] tracking-[0.5em] uppercase mb-4 block opacity-60">Curated Outfits</span>
        <h1 className="text-5xl md:text-7xl font-headline tracking-tighter italic font-light">Shop the Look</h1>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 md:px-24 space-y-32">
        {MOCK_LOOKS.map(look => {
          const lookProducts = getLookProducts(look.productIds);
          if (lookProducts.length === 0) return null;

          return (
            <div key={look.id} className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="relative aspect-[3/4] overflow-hidden group">
                <img 
                  src={look.image} 
                  alt={look.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 border border-primary/20 m-4 pointer-events-none"></div>
              </div>

              <div className="space-y-12">
                <div>
                  <h2 className="text-4xl font-headline italic font-bold mb-4">{look.name}</h2>
                  <p className="text-secondary text-sm font-light leading-relaxed max-w-md">{look.description}</p>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-body uppercase tracking-[0.3em] opacity-60 border-b border-primary/10 pb-4">Included Pieces</h3>
                  <div className="flex flex-col gap-4">
                    {lookProducts.map(p => (
                      <div key={p.id} className="flex items-center gap-6 group cursor-pointer hover:bg-surface-container-low p-2 -mx-2 transition-colors">
                        <img src={p.image} className="w-16 h-16 object-cover border border-primary/10" />
                        <div className="flex-1">
                          <h4 className="font-headline italic text-lg">{p.name}</h4>
                          <span className="text-xs font-body tracking-wider opacity-60">₹{p.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-primary/10 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-body uppercase tracking-[0.3em] opacity-60 mb-1">Bundle Total</span>
                    <span className="text-3xl font-headline italic">₹{calculateLookTotal(lookProducts)}</span>
                  </div>
                  <button 
                    onClick={() => handleAddLookToCart(look.id, lookProducts)}
                    disabled={isAdding === look.id}
                    className="bg-primary text-white hover:bg-accent px-8 py-4 text-[10px] uppercase font-body tracking-[0.3em] transition-colors"
                  >
                    {isAdding === look.id ? 'ADDED TO BAG' : 'ADD LOOK TO BAG'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
};

export default ShopTheLook;
