import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getProducts } from '../services/productService';
import { Product } from '../types';

const Cart: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount, shippingPrice, grandTotal, freeShippingThreshold } = useCart();
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      const products = await getProducts();
      const sorted = [...products].sort((a, b) => b.rating - a.rating).slice(0, 3);
      setFeatured(sorted);
    };
    fetchFeatured();
  }, []);

  const shippingPercent = Math.min((cartTotal / freeShippingThreshold) * 100, 100);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pb-32 pt-48 flex items-center justify-center px-6">
        <div className="text-center max-w-md w-full space-y-8">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" strokeWidth={1} />
            <h2 className="font-serif text-4xl text-black">
              Your Bag is Empty
            </h2>
            <p className="text-sm font-light text-gray-500">
              Discover our latest arrivals and timeless pieces.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center text-[10px] uppercase tracking-[0.2em] border-b border-black pb-1 pt-6 text-black hover:text-gray-500 transition-colors"
            >
              Explore Collection
            </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F6] min-h-screen pt-24 pb-24 md:pt-32 md:pb-32">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 md:mb-16 border-b border-gray-200 pb-8 md:pb-12 gap-4">
          <h1 className="font-serif text-5xl md:text-6xl leading-none text-black">Shopping Bag</h1>
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">[{cartCount} pieces]</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          <div className="lg:col-span-7 xl:col-span-8 space-y-12">
            {/* Shipping Progress Bar */}
            <div className="mb-12">
               <div className="flex justify-between items-end mb-4">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-gray-500">
                    {cartTotal >= freeShippingThreshold ? 
                      <span className="text-[#745b3b]">Complimentary Shipping Unlocked</span> : 
                      <span>Add ₹{(freeShippingThreshold - cartTotal).toFixed(0)} for complimentary shipping</span>
                    }
                  </p>
               </div>
               <div className="w-full h-[1px] bg-gray-200 relative">
                  <div 
                    className="h-full bg-black transition-all duration-1000"
                    style={{ width: `${shippingPercent}%` }}
                  />
               </div>
            </div>

              <div className="space-y-12">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4 md:gap-8 group">
                    <Link to={`/product/${item.id.split('-')[0]}`} className="shrink-0 w-24 h-32 md:w-32 md:h-40 bg-[#EBEBEB] overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                      ) : (
                        <div className="w-full h-full animate-pulse bg-gray-100" />
                      )}
                    </Link>
                    <div className="flex-grow flex flex-col justify-between py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-light text-xl text-black mb-1 hover:underline transition-all">
                            <Link to={`/product/${item.id.split('-')[0]}`}>{item.name || 'Resolving Piece...'}</Link>
                          </h3>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">{item.category || 'Archive'}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex justify-between items-end mt-6">
                        <div className="flex items-center border border-gray-300">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-3 text-gray-400 hover:text-black"><Minus className="w-3 h-3" /></button>
                          <span className="w-8 text-center text-sm font-light text-black">{item.quantity}</span>
                          <button onClick={() => {
                            const maxAllowed = item.stock_quantity !== undefined && item.stock_quantity > 0 ? item.stock_quantity : 10;
                            updateQuantity(item.id, Math.min(maxAllowed, item.quantity + 1));
                          }} className="p-3 text-gray-400 hover:text-black"><Plus className="w-3 h-3" /></button>
                        </div>
                        <p className="font-light text-lg text-black">₹{((item.price || 0) * item.quantity).toFixed(0)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
  
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="bg-white p-8 lg:p-10 border border-gray-100 lg:sticky lg:top-32 shadow-sm">
                <h3 className="font-serif text-xl border-b border-gray-100 pb-4 mb-8 text-black">Order Summary</h3>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="uppercase tracking-widest font-light">Subtotal</span>
                    <span>₹{(cartTotal || 0).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="uppercase tracking-widest font-light">Shipping</span>
                    <span>{shippingPrice === 0 ? 'Complimentary' : `₹${shippingPrice}`}</span>
                  </div>
                  <div className="pt-6 border-t border-gray-100 flex justify-between items-baseline text-black">
                    <span className="font-serif text-lg">Total</span>
                    <span className="font-serif text-2xl">₹{(grandTotal || 0).toFixed(0)}</span>
                  </div>
                </div>
              <Link
                to="/checkout"
                className="block w-full bg-[#5C5C5C] text-white py-4 text-center transition-colors text-[10px] uppercase tracking-[0.2em] hover:bg-black"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;;