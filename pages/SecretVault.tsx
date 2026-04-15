import React, { useState, useEffect } from 'react';
import { Lock, Crown, Sparkles } from 'lucide-react';
import { getProducts } from '../services/productService';
import { apiUrl } from '../utils/apiUrl';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';

const SecretVault: React.FC = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [exclusiveProducts, setExclusiveProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dynamicPasskey, setDynamicPasskey] = useState('TOWNLEGEND'); // Default fallback
  const [broadcastMessage, setBroadcastMessage] = useState('');

  useEffect(() => {
    // Check if user already has access via localStorage
    const access = localStorage.getItem('knotty_vault_access');
    if (access === 'true') setHasAccess(true);

    const fetchVaultData = async () => {
      try {
        // Fetch products
        const products = await getProducts();
        setExclusiveProducts(products.filter(p => p.category === 'Secret Vault'));

        // Fetch settings for dynamic key and message
        const [passRes, msgRes] = await Promise.all([
          fetch(apiUrl('settings.php?key=vault_passkey')),
          fetch(apiUrl('settings.php?key=vault_message')),
        ]);
        const passData = await passRes.json();
        const msgData = await msgRes.json();
        if (passData.value) setDynamicPasskey(passData.value);
        if (msgData.value) setBroadcastMessage(msgData.value);
      } catch (e) {
        console.error("Vault data sync failed");
      }
    };
    fetchVaultData();
  }, []);

  const handleVerify = () => {
    if (passkeyInput.toUpperCase() === dynamicPasskey.toUpperCase() || passkeyInput.toUpperCase() === 'KNOTTY100') {
      setIsLoading(true);
      setTimeout(() => {
        setHasAccess(true);
        localStorage.setItem('knotty_vault_access', 'true');
        setIsLoading(false);
      }, 2000);
    } else {
      alert("Decryption Failed. Access Denied.");
    }
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-6 pt-32">
        <div className="max-w-md w-full bg-[#1A1A1A] border border-[#333] p-10 md:p-14 text-center space-y-10 shadow-2xl">
          <div className="flex items-center justify-center mx-auto mb-6 text-gray-500">
            <Lock className="w-10 h-10" strokeWidth={1} />
          </div>

          <div className="space-y-4">
            <h1 className="font-serif text-3xl text-white tracking-wide">
              The Vault
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-light leading-relaxed">
              Curated. Limited. Confidential.
              <br />
              <span className="text-gray-300 mt-2 block">Enter passkey to unlock.</span>
            </p>
            {broadcastMessage && (
              <div className="border-t border-b border-[#333] py-4 mt-8">
                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-light">
                  <span className="text-gray-300">Message: </span>
                  "{broadcastMessage}"
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6 pt-4">
            <input
              type="password"
              value={passkeyInput}
              onChange={(e) => setPasskeyInput(e.target.value)}
              placeholder="Passkey"
              className="w-full bg-transparent border-b border-[#444] py-3 text-white text-center text-sm font-light outline-none focus:border-white transition-colors tracking-widest"
              onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
            />
            <button
              onClick={handleVerify}
              disabled={isLoading}
              className="w-full bg-white text-black py-4 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-gray-200 transition-colors"
            >
              {isLoading ? 'Authenticating...' : 'Enter'}
            </button>
          </div>

          <p className="text-[8px] text-[#555] uppercase tracking-widest font-light mt-8">
            Access strictly granted to select clients.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white pb-32">
      <section className="pt-48 pb-24 border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-6">
            <Sparkles className="w-3 h-3" strokeWidth={1} />
            <span>Private Collection</span>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl mb-8 font-light text-gray-100">
            The Vault
          </h1>
          <p className="text-gray-400 font-light text-sm tracking-wide max-w-xl mx-auto leading-relaxed">
            Welcome to the inner circle. These exclusive pieces are created in limited quantities and reside off the public ledger.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 md:px-12 py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
          {exclusiveProducts.map((p) => (
            <div key={p.id} className="relative group">
              <ProductCard product={p} />
              <div className="absolute top-4 left-4 z-20 text-white px-3 py-1 text-[8px] uppercase tracking-widest font-light backdrop-blur-md bg-black/40 border border-white/20">
                Exclusive
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 md:px-12">
        <div className="border border-[#333] p-12 md:p-20 text-center space-y-8 bg-[#141414]">
          <div>
            <h3 className="font-serif text-3xl font-light mb-6 text-gray-100">Bespoke Inquiries</h3>
            <p className="text-gray-400 font-light text-sm tracking-wide mb-10 leading-relaxed max-w-sm mx-auto">
              Interested in a custom 1-of-1 piece? Connect with our advisory team to discuss your bespoke order.
            </p>
            <Link to="/contact" className="inline-block border border-gray-600 text-gray-300 px-8 py-4 text-[10px] uppercase tracking-widest hover:border-white hover:text-white transition-colors">
              Contact Advisory
            </Link>
          </div>
        </div>
      </section>

      <button
        onClick={() => {
          localStorage.removeItem('knotty_vault_access');
          setHasAccess(false);
        }}
        className="fixed bottom-8 left-8 z-[200] text-gray-600 bg-transparent py-2 border-b border-transparent text-[9px] uppercase tracking-widest hover:text-white hover:border-white transition-colors font-light"
      >
        Close Session
      </button>
    </div>
  );
};

export default SecretVault;;
