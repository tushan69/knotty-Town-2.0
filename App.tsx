
import React, { Suspense, useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ScrollToTop from './components/ScrollToTop';
import AdminRoute from './components/AdminRoute';
import FloatingAIChat from './components/FloatingAIChat';

// Lazy Load Pages
const Shop = React.lazy(() => import('./pages/Shop'));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const Contact = React.lazy(() => import('./pages/Contact'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminLogin = React.lazy(() => import('./pages/AdminLogin'));
const TrackOrder = React.lazy(() => import('./pages/TrackOrder'));
const Login = React.lazy(() => import('./pages/Login'));
const SecretVault = React.lazy(() => import('./pages/SecretVault'));
const MetalPosters = React.lazy(() => import('./pages/MetalPosters'));
const ShopTheLook = React.lazy(() => import('./pages/ShopTheLook'));

// --- Premium Components ---


const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      const target = e.target as HTMLElement;
      setIsPointer(window.getComputedStyle(target).cursor === 'pointer');
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <div 
        className="fixed top-0 left-0 w-3 h-3 bg-accent rounded-full pointer-events-none z-[9999] mix-blend-difference hidden lg:block"
        style={{ transform: `translate3d(${position.x - 6}px, ${position.y - 6}px, 0)` }}
      />
      <div 
        className={`fixed top-0 left-0 w-10 h-10 border border-accent rounded-full pointer-events-none z-[9998] transition-transform duration-700 ease-out hidden lg:block ${isPointer ? 'scale-150 bg-accent/5' : 'scale-100'}`}
        style={{ transform: `translate3d(${position.x - 20}px, ${position.y - 20}px, 0)` }}
      />
    </>
  );
};

const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center bg-background flex-col space-y-8 animate-cinematic">
    <div className="relative w-24 h-24 flex items-center justify-center">
      <div className="absolute inset-0 border border-primary/5 rounded-full"></div>
      <div className="absolute inset-0 border-t border-accent rounded-full animate-spin"></div>
    </div>
    <span className="text-accent font-body text-[10px] tracking-[0.5em] uppercase italic opacity-40">Loading Archive</span>
  </div>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <CartProvider>
          <Router>
            <FloatingAIChat />
            <CustomCursor />
            <ScrollToTop />
            <div className="flex flex-col min-h-screen bg-background selection:bg-accent selection:text-white lg:cursor-none">

              <Navbar />
              <main className="flex-grow">
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/admin" element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    } />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/track" element={<TrackOrder />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/vault" element={<SecretVault />} />
                    <Route path="/metal-posters" element={<MetalPosters />} />
                    <Route path="/shop-the-look" element={<ShopTheLook />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
            </div>
          </Router>
        </CartProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
};

export default App;
