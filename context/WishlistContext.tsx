import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getProducts } from '../services/productService';
import { apiUrl } from '../utils/apiUrl';
import { Product } from '../types';

const WISHLIST_IDS_KEY = 'knotty_wishlist_ids';
const LEGACY_WISHLIST_KEY = 'knotty_wishlist';

function readLocalIds(): string[] {
  try {
    const raw = localStorage.getItem(WISHLIST_IDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === 'string' && x.length > 0);
      }
    }
    const legacy = localStorage.getItem(LEGACY_WISHLIST_KEY);
    if (legacy) {
      const products = JSON.parse(legacy);
      if (Array.isArray(products) && products.length > 0 && typeof products[0] === 'object' && products[0]?.id) {
        const ids = products.map((p: { id: string }) => p.id);
        localStorage.setItem(WISHLIST_IDS_KEY, JSON.stringify(ids));
        localStorage.removeItem(LEGACY_WISHLIST_KEY);
        return ids;
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

function writeLocalIds(ids: string[]) {
  try {
    localStorage.setItem(WISHLIST_IDS_KEY, JSON.stringify(ids));
  } catch {
    /* quota */
  }
}

interface WishlistContextType {
  wishlistIds: string[];
  wishlistProducts: Product[];
  wishlistCount: number;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [ids, setIds] = useState<string[]>(() => readLocalIds());
  const [hydrated, setHydrated] = useState<Product[]>([]);

  useEffect(() => {
    writeLocalIds(ids);
  }, [ids]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (ids.length === 0) {
        setHydrated([]);
        return;
      }
      const all = await getProducts();
      if (cancelled) return;
      const byId = new Map(all.map((p) => [p.id, p]));
      const ordered = ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
      setHydrated(ordered);
    })();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl(`wishlist_sync.php?user_id=${user.id}`));
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const remote: string[] = Array.isArray(data.ids) ? data.ids : [];
        if (cancelled) return;
        setIds((prev) => [...new Set([...remote, ...prev])]);
      } catch {
        /* offline */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const t = window.setTimeout(() => {
      fetch(apiUrl('wishlist_sync.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, ids }),
      }).catch(() => {});
    }, 400);
    return () => window.clearTimeout(t);
  }, [ids, user?.id]);

  const isWishlisted = useCallback(
    (productId: string) => ids.includes(productId),
    [ids]
  );

  const toggleWishlist = useCallback((product: Product) => {
    setIds((prev) => {
      if (prev.includes(product.id)) {
        return prev.filter((id) => id !== product.id);
      }
      return [...prev, product.id];
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setIds((prev) => prev.filter((id) => id !== productId));
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds: ids,
        wishlistProducts: hydrated,
        wishlistCount: ids.length,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
