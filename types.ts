
export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  image: string;
  backImage?: string; // New: Angle 2
  category: string;
  rating: number;
  reviews?: Review[]; // Made optional for Lite fetching
  reviewCount?: number; // New: For Lite fetching
  features: string[];
  isCustom?: boolean;
  availableSizes: string[]; // New: Stock management
  stock_quantity?: number; // New: Global stock count
  isSoldOut?: boolean; // New: Global status
  isFeatured?: boolean; // New: Explicit home page feature
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  customPosition?: 'Front' | 'Back';
}

export interface Order {
  id: string;
  date: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
  };
  items: CartItem[];
  total: number;
  status: 'Pending' | 'Shipped' | 'Delivered';
  paymentMethod: string;
  paymentScreenshot?: string;
  payment_id?: string;
  payment_status?: string;
  shipping_price?: string | number;
  couponCode?: string;
}

export enum Category {
  OVERSIZED = 'Oversized Tees',
  GRAPHIC = 'Graphic Collection',
  MINIMAL = 'Minimalist',
  CUSTOM = 'Custom Lab',
  ANIME = 'Anime Edition',
  CARS = 'Automotive Series',
  VAULT = 'Secret Vault',
  METAL_POSTERS = 'Metal Posters',
  SHIRTS = 'Shirts',
  POLO_SHIRTS = 'Polo Shirts',
  FORMAL_DRESS = 'Formal Dress',
  WOMEN_DRESSES = 'Women Dresses',
}
