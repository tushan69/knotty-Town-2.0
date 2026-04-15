import React from 'react';
import { Heart, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const Wishlist: React.FC = () => {
  const { addToCart } = useCart();
  const { wishlistProducts, removeFromWishlist, wishlistCount } = useWishlist();

  if (wishlistCount === 0) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pb-32 pt-48 flex items-center justify-center px-6">
        <div className="text-center max-w-md w-full space-y-8">
          <Heart className="w-12 h-12 text-gray-300 mx-auto" strokeWidth={1} />
          <h2 className="font-serif text-4xl text-black">Wishlist is Empty</h2>
          <p className="text-sm font-light text-gray-500">
            Curate your favorite pieces for future reference.
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
    <div className="bg-[#FAF9F6] min-h-screen pt-32 pb-32">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-end justify-between mb-16 border-b border-gray-200 pb-12">
          <h1 className="font-serif text-5xl md:text-6xl text-black leading-none">Wishlist</h1>
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">[{wishlistCount} pieces]</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
          {wishlistProducts.map((p) => (
            <div key={p.id} className="group cursor-pointer">
              <div className="relative aspect-[3/4] overflow-hidden bg-[#EBEBEB] mb-6">
                <Link to={`/product/${p.id}`}>
                  <img
                    src={p.image}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    alt={p.name}
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => removeFromWishlist(p.id)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 transition-colors bg-white/50 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <Link to={`/product/${p.id}`}>
                    <h3 className="font-light text-lg text-black hover:opacity-60 transition-opacity">{p.name}</h3>
                  </Link>
                  <p className="font-light text-lg text-black">₹{p.price}</p>
                </div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">{p.category}</p>
                <div className="pt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <button
                    type="button"
                    onClick={() => addToCart(p)}
                    className="w-full border border-gray-300 bg-transparent text-black py-3 text-[10px] uppercase tracking-[0.2em] flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-colors"
                  >
                    Add to Bag
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
