import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {

  const [imgSrc, setImgSrc] = useState(product.image);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(product.image);
    setHasError(false);
  }, [product.image]);

  const isActuallySoldOut = product.isSoldOut || (product.stock_quantity !== undefined && product.stock_quantity <= 0);

  return (
    <div className={`group cursor-pointer block ${isActuallySoldOut ? 'opacity-50' : ''}`}>
      <Link to={`/product/${product.id}`}>
        <div className="bg-surface-container-low overflow-hidden mb-8 aspect-[3/4] relative transition-all duration-700">
          {/* Base Image */}
          <img
            src={imgSrc}
            alt={product.name}
            onError={() => {
              if (!hasError) {
                setImgSrc('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800');
                setHasError(true);
              }
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000 ease-out"
            loading="lazy"
          />
          
          {/* Secondary (Back) Image Hover Effect */}
          {product.backImage && (
            <img
              src={product.backImage}
              alt={`${product.name} - Alternate View`}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 opacity-0 group-hover:opacity-100"
              loading="lazy"
            />
          )}



          {/* Sold Out / Archived Overlay */}
          {isActuallySoldOut && (
            <div className="absolute inset-0 bg-white/20 flex items-center justify-center backdrop-blur-[2px] z-10">
              <span className="text-white text-[10px] font-black uppercase tracking-[0.4em] px-6 py-3 bg-red-600/90 shadow-lg">SOLD OUT</span>
            </div>
          )}
          
          {/* Luxury Label (Optional) */}
          {!isActuallySoldOut && product.isFeatured && (
            <div className="absolute top-6 left-6">
              <span className="text-[8px] tracking-[0.3em] font-body uppercase px-3 py-1.5 bg-white/80 backdrop-blur-md text-primary">
                Signature
              </span>
            </div>
          )}

          {/* Low Stock Urgency Badge */}
          {!isActuallySoldOut && product.stock_quantity !== undefined && product.stock_quantity > 0 && product.stock_quantity < 6 && (
            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-red-600/90 text-white text-[8px] font-black uppercase tracking-[0.4em] py-2 px-4 text-center backdrop-blur-sm shadow-2xl animate-pulse">
                Only {product.stock_quantity} Left — Claim Now
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-baseline">
            <h3 className="font-headline text-xl leading-tight text-primary transition-all duration-500 group-hover:italic">
              {product.name}
            </h3>
            <span className="text-xs font-body tracking-[0.1em] text-primary">₹{product.price.toFixed(0)}</span>
          </div>
          
          <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <span className="text-[10px] uppercase font-body tracking-[0.4em] text-primary font-bold">
              {product.category}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[10px] text-accent/60 line-through tracking-wider">
                ₹{product.originalPrice.toFixed(0)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
