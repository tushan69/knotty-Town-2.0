
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, CartItem } from '../types';
import { useAuth } from './AuthContext';
import { getProducts } from '../services/productService';
import { apiUrl } from '../utils/apiUrl';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product & { selectedSize?: string }) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  shippingPrice: number;
  updateShippingPrice: (price: number) => void;
  grandTotal: number;
  freeShippingThreshold: number;
  recentlyViewed: Product[];
  addRecentlyViewed: (product: Product) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getStoredValue = (key: string, defaultValue: any) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>(() => getStoredValue('knotty_cart', []));
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>(() => getStoredValue('knotty_rv', []));
  const [shippingPrice, setShippingPrice] = useState<number>(() => {
    const saved = localStorage.getItem('knotty_shipping_price');
    return saved ? Number(saved) : 0;
  });

  const FREE_SHIPPING_LIMIT = 2000;

  // Initial Cart Sync when user logs in
  useEffect(() => {
    // Fetch global settings (Shipping Price, etc.)
    const fetchGlobalSettings = async () => {
      try {
        const res = await fetch(apiUrl('settings.php?key=shipping_price'));
        const data = await res.json();
        if (data.value !== undefined && data.value !== "") {
          setShippingPrice(Number(data.value));
        }
      } catch (e) {
        console.warn("Using local shipping price");
      }
    };
    fetchGlobalSettings();

    if (user) {
      const fetchCart = async () => {
        try {
          const res = await fetch(apiUrl(`cart_sync.php?user_id=${user.id}`));
          if (res.ok) {
            const data = await res.json();
            if (data.cart && data.cart.length > 0) {
              setCart(data.cart);
            } else if (cart.length > 0) {
              // If local cart has items but DB is empty, sync local to DB
              syncCartToDb(cart);
            }
          }
        } catch (e) {
          console.error("Cart sync fetch failed", e);
        }
      };
      fetchCart();
    }
  }, [user]);

  // Sync to Storage & DB on change
  useEffect(() => {
    try {
      // LEAN CART SYNC: To prevent "Storage Quota Exceeded" crashes,
      // we only store essential metadata in localStorage. 
      // Product details (images, desc) are hydrated from the product cache.
      const leanCart = cart.map(({ id, quantity, selectedSize }) => ({ id, quantity, selectedSize }));
      localStorage.setItem('knotty_cart', JSON.stringify(leanCart));
    } catch (e) {
      console.error("Local storage sync failed. Cart state maintained in memory only.", e);
    }

    if (user) syncCartToDb(cart);
  }, [cart, user]);

  const syncCartToDb = async (currentCart: CartItem[]) => {
    if (!user) return;
    try {
      await fetch(apiUrl('cart_sync.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, cart: currentCart })
      });
    } catch (e) {
      console.warn("Could not sync cart to cloud.");
    }
  };

  // HYDRATION: Link lean cart items to full product data
  useEffect(() => {
    const hydrateCart = async () => {
      if (cart.length > 0 && !cart[0].name) { // Use 'name' as a proxy for 'has full data'
        const allProducts = await getProducts();
        setCart(prev => prev.map(item => {
          const product = allProducts.find(p => p.id === item.id.split('-')[0]); // Handle id-size format
          if (product) {
            return { ...product, ...item, id: item.id }; // Preserve the size-specific ID
          }
          return item;
        }));
      }
    };
    hydrateCart();
  }, [cart.length]);

  useEffect(() => {
    // FIX: storage quota exceeded. We stop saving this to local storage.
    localStorage.removeItem('knotty_rv');
  }, []);

  useEffect(() => {
    localStorage.setItem('knotty_shipping_price', shippingPrice.toString());
  }, [shippingPrice]);

  const addToCart = (product: Product & { selectedSize?: string }) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 } as CartItem];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const addRecentlyViewed = (product: Product) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      return [product, ...filtered].slice(0, 10);
    });
  };

  const updateShippingPrice = (price: number) => setShippingPrice(price);

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const effectiveShipping = cartTotal >= FREE_SHIPPING_LIMIT ? 0 : shippingPrice;
  const grandTotal = cartTotal > 0 ? cartTotal + effectiveShipping : 0;

  return (
    <CartContext.Provider
      value={{
        cart, addToCart, removeFromCart, updateQuantity, clearCart,
        cartTotal, cartCount, shippingPrice: effectiveShipping,
        updateShippingPrice, grandTotal, freeShippingThreshold: FREE_SHIPPING_LIMIT,
        recentlyViewed, addRecentlyViewed
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
