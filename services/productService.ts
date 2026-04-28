import { Product } from '../types';
import { PRODUCTS as STATIC_PRODUCTS } from '../constants';
import { apiUrl } from '../utils/apiUrl';
import { getAdminApiToken } from '../utils/adminToken';

const DYNAMIC_PRODUCTS_KEY = 'knotty_dynamic_products';
const CATALOG_CACHE_KEY = 'knotty_catalog_cache';
const CATALOG_CACHE_TIME_KEY = 'knotty_catalog_cache_time';

const API_URL = apiUrl('products.php');

const getLocalProducts = (): Product[] => {
  const dynamicProductsJson = localStorage.getItem(DYNAMIC_PRODUCTS_KEY);
  return dynamicProductsJson ? JSON.parse(dynamicProductsJson) : [];
};

let cachedProducts: Product[] | null = null;
let isFetching = false;

export const getProducts = async (forceRefresh = false): Promise<Product[]> => {
  // 1. Return memory cache if available and not forcing refresh
  if (cachedProducts && !forceRefresh) {
    return cachedProducts;
  }

  // 2. Try to load from LocalStorage cache for "instant" load
  const cachedCatalogJson = localStorage.getItem(CATALOG_CACHE_KEY);
  const cacheTime = localStorage.getItem(CATALOG_CACHE_TIME_KEY);
  const isCacheFresh = cacheTime && (Date.now() - parseInt(cacheTime) < 1000 * 60 * 60); // 1 hour

  if (cachedCatalogJson && !forceRefresh) {
    try {
      const parsed = JSON.parse(cachedCatalogJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedProducts = parsed;
        // If cache is fresh, we can return it immediately and skip fetching
        if (isCacheFresh) {
          return cachedProducts;
        }
        // If cache is stale, we return it but continue fetching in background
      }
    } catch (e) {
      console.warn("Failed to parse catalog cache", e);
    }
  }

  // 3. Handle concurrent fetching
  if (isFetching && !forceRefresh) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!isFetching && cachedProducts) {
          clearInterval(checkInterval);
          resolve(cachedProducts);
        }
      }, 100);
    });
  }

  isFetching = true;
  let apiProducts: Product[] = [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // Shorter timeout for faster fallback

    const url = forceRefresh ? `${API_URL}?t=${Date.now()}` : API_URL;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const rawData = await response.json();
        apiProducts = Array.isArray(rawData) ? rawData : (rawData.products || []);
      }
    }
  } catch (e) {
    console.warn("Database API unreachable or timed out. Using cache fallback.", e);
  }

  const localProducts = getLocalProducts();
  const productMap = new Map<string, Product>();

  // Use STATIC and LOCAL as base
  STATIC_PRODUCTS.forEach(p => productMap.set(p.id, p));
  localProducts.forEach(p => productMap.set(p.id, p));
  
  // Overlay API data (truth)
  if (apiProducts.length > 0) {
    apiProducts.forEach(p => {
      const productId = String(p.id);
      const transformed: Product = {
        ...p,
        id: productId,
        features: Array.isArray(p.features) ? p.features : JSON.parse(p.features as any || '[]'),
        availableSizes: Array.isArray(p.availableSizes) ? p.availableSizes : JSON.parse(p.availableSizes as any || '[]'),
        price: Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
        backImage: p.backImage || (p as any).back_image || undefined,
        reviewCount: (p as any).reviewCount ?? (p.reviews ? (Array.isArray(p.reviews) ? p.reviews.length : JSON.parse(p.reviews).length) : 0)
      };
      productMap.set(productId, transformed);
    });

    // Update Persistent Cache
    const newCatalog = Array.from(productMap.values());
    try {
      localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(newCatalog));
      localStorage.setItem(CATALOG_CACHE_TIME_KEY, Date.now().toString());
    } catch (e) {
      console.warn("Catalog too large for localStorage cache");
    }
    cachedProducts = newCatalog;
  } else if (!cachedProducts) {
    cachedProducts = Array.from(productMap.values());
  }

  isFetching = false;
  return cachedProducts;
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
  // Try cache first if it has full details (checks if reviews array exists)
  const productIdStr = String(id);
  const cached = cachedProducts?.find(p => String(p.id) === productIdStr);
  if (cached && cached.reviews) {
    return cached;
  }

  try {
    const response = await fetch(`${API_URL}?id=${id}`);
    if (response.ok) {
      const p = await response.json();
      const transformed: Product = {
        ...p,
        id: String(p.id),
        features: Array.isArray(p.features) ? p.features : JSON.parse(p.features as any || '[]'),
        reviews: Array.isArray(p.reviews) ? p.reviews : JSON.parse(p.reviews as any || '[]'),
        availableSizes: Array.isArray(p.availableSizes) ? p.availableSizes : JSON.parse(p.availableSizes as any || '[]'),
        price: Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
        backImage: p.backImage || (p as any).back_image || undefined,
        reviewCount: (p as any).reviewCount ?? (p.reviews ? p.reviews.length : 0)
      };
      return transformed;
    }
  } catch (e) {
    console.error("Failed to fetch product details", e);
  }

  // Fallback to finding in global list even if incomplete, better than nothing
  return cachedProducts?.find(p => String(p.id) === productIdStr);
};

export const getRelatedProducts = async (category: string, excludeId: string, limit: number = 4): Promise<Product[]> => {
  // Ultra-fast cached path
  if (cachedProducts) {
    return cachedProducts.filter(p => p.category === category && p.id !== excludeId).slice(0, limit);
  }
  // Fallback: fetch and filter
  const all = await getProducts();
  return all.filter(p => p.category === category && p.id !== excludeId).slice(0, limit);
};

export const clearProductCache = () => {
  cachedProducts = null;
};

export const addProduct = async (product: Product): Promise<boolean> => {
  // Optimistic update to local storage to make it feel fast, but we will revert or warn if API fails
  const local = getLocalProducts();
  const index = local.findIndex(p => p.id === product.id);
  let updatedLocal;
  if (index >= 0) {
    updatedLocal = [...local];
    updatedLocal[index] = product;
  } else {
    updatedLocal = [product, ...local];
  }
  try {
    localStorage.setItem(DYNAMIC_PRODUCTS_KEY, JSON.stringify(updatedLocal));
  } catch (e) {
    console.warn("Local storage quota exceeded. Product added to cloud but not saved locally.");
    // We can proceed because the API call is the source of truth
  }

  try {
    const adminToken = getAdminApiToken();
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(product),
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Token': adminToken
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error(`API Failed: ${response.status} ${response.statusText}`);
    }
    return true;
  } catch (e) {
    console.error("Failed to sync product to cloud", e);
    // Optional: Revert local change if strict consistency is needed, 
    // but for now we just return false so UI can warn user.
    return false;
  }
};

export const deleteProduct = async (productId: string): Promise<boolean> => {
  const local = getLocalProducts();
  localStorage.setItem(DYNAMIC_PRODUCTS_KEY, JSON.stringify(local.filter(p => p.id !== productId)));

  try {
    const adminToken = getAdminApiToken();
    const response = await fetch(`${API_URL}?id=${productId}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Token': adminToken }
    });
    return response.ok;
  } catch (e) {
    return true;
  }
};
