import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Sparkles, Zap, ArrowRight, RefreshCw } from 'lucide-react';
import { createStyleAgentChat, isGeminiConfigured } from '../services/geminiService';
import { getProducts } from '../services/productService';
import { Product } from '../types';
import { Link } from 'react-router-dom';

export type AIConciergeLayout = 'page' | 'compact';

interface AIConciergeProps {
  /** `compact` fits the floating drawer; `page` is full-height on Contact. */
  layout?: AIConciergeLayout;
}

const AIConcierge: React.FC<AIConciergeProps> = ({ layout = 'page' }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const initChat = async () => {
      const allProducts = await getProducts();
      if (cancelled) return;
      setProducts(allProducts);

      const inventoryContext = allProducts
        .map(
          (p) =>
            `ID: ${p.id} | Name: ${p.name} | Category: ${p.category} | Price: ₹${p.price} | Sizes: ${p.availableSizes?.join(', ')}${p.isSoldOut ? ' (SOLD OUT)' : ''}`
        )
        .join('\n');

      const chat = createStyleAgentChat(inventoryContext);
      chatRef.current = chat;

      setMessages([
        {
          role: 'model',
          content: chat
            ? "Yo! I'm your KNOTTY Concierge. Need a drip check or help finding your next silhouette? Tell me what you're vibe is."
            : "Concierge is offline — no Firebase credentials in your project files. In the project root (next to package.json), open .env or .env.local and set VITE_FIREBASE_API_KEY=your_key. Save, then restart npm run dev. Pasting a key in chat does not configure the app.",
        },
      ]);
    };

    void initChat();

    const retry = window.setTimeout(() => {
      if (cancelled || chatRef.current) return;
      if (isGeminiConfigured()) void initChat();
    }, 1200);

    return () => {
      cancelled = true;
      window.clearTimeout(retry);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !chatRef.current) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const result = await chatRef.current.sendMessage(userMessage);
      const response = await result.response;
      setMessages(prev => [...prev, { role: 'model', content: response.text() }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "Signal scrambled. The aesthetic is too loud for the servers right now. Try again?" }]);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (text: string) => {
    // Regex to find [[PRODUCT:id]] tags
    const parts = text.split(/(\[\[PRODUCT:.*?\]\])/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('[[PRODUCT:') && part.endsWith(']]')) {
        const productId = part.replace('[[PRODUCT:', '').replace(']]', '');
        const product = products.find(p => p.id === productId);
        
        if (product) {
          return (
            <Link 
              key={i} 
              to={`/product/${product.id}`}
              className="block my-4 bg-zinc-800 border-l-4 border-yellow-400 p-4 group transition-all hover:bg-zinc-700"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-16 bg-zinc-900 overflow-hidden">
                  <img src={product.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={product.name} />
                </div>
                <div className="flex-grow">
                  <p className="text-[10px] font-black uppercase text-yellow-400 tracking-widest">{product.category}</p>
                  <h4 className="text-white font-serif text-sm italic">{product.name}</h4>
                  <p className="text-zinc-400 text-[10px] font-bold">₹{product.price}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:translate-x-1 group-hover:text-white transition-all" />
              </div>
            </Link>
          );
        }
      }
      return <span key={i} className="whitespace-pre-line">{part}</span>;
    });
  };

  const compact = layout === 'compact';

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-3xl border border-white/5 bg-black text-white shadow-2xl ${
        compact
          ? 'h-[min(480px,calc(92vh-56px))] rounded-2xl p-4 md:p-5'
          : 'h-[700px] p-6 md:p-12'
      }`}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 blur-3xl rounded-full -mr-20 -mt-20 animate-pulse"></div>

      <header
        className={`relative z-10 flex items-center justify-between border-b border-white/10 pb-4 ${compact ? 'mb-4' : 'mb-10 pb-6'}`}
      >
        <div>
          <div className="mb-2 inline-flex flex-wrap gap-2">
            <div className="inline-flex items-center space-x-2 rounded-sm bg-yellow-400 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-black">
              <Zap className="h-3 w-3 fill-current" />
              <span>Atelier AI Stylist</span>
            </div>
            {!isGeminiConfigured() && (
              <div className="inline-flex items-center space-x-1.5 rounded-sm border border-yellow-400/30 bg-zinc-950 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-yellow-400/90 shadow-sm animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
                <span>Config Offline</span>
              </div>
            )}
          </div>
          <h2 className={`font-serif tracking-tighter uppercase italic ${compact ? 'text-xl' : 'text-2xl'}`}>Concierge.</h2>
        </div>
        <Bot className={`shrink-0 text-zinc-700 ${compact ? 'h-6 w-6' : 'h-8 w-8'}`} strokeWidth={1} />
      </header>

      <div 
        ref={scrollRef}
        className={`custom-scrollbar flex-grow space-y-6 overflow-y-auto pr-2 scroll-smooth md:pr-4 ${compact ? 'mb-3' : 'mb-6 space-y-8'}`}
      >
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`max-w-[85%] ${msg.role === 'user' ? 'border border-zinc-800 bg-zinc-900' : 'bg-transparent'} ${compact ? 'p-3' : 'p-5'}`}
            >
              {msg.role === 'model' && (
                <div className="flex items-center space-x-2 mb-3 opacity-40">
                   <Sparkles className="w-3 h-3 text-yellow-400" />
                   <span className="text-[8px] font-black uppercase tracking-[0.3em]">Stylist Advisory</span>
                </div>
              )}
              <div
                className={`font-bold uppercase leading-loose tracking-[0.2em] ${compact ? 'text-[10px]' : 'text-[11px]'} ${msg.role === 'user' ? 'text-white' : 'text-gray-300'}`}
              >
                {renderContent(msg.content)}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-3 text-zinc-600 italic text-[10px] font-bold tracking-widest uppercase animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Decoding your aesthetic...</span>
          </div>
        )}
        {!isGeminiConfigured() && (
          <div className="border border-yellow-400/20 bg-zinc-950 p-5 rounded-lg space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center space-x-2 text-yellow-400">
              <Zap className="w-4 h-4 fill-current animate-pulse" />
              <h4 className="font-serif text-sm uppercase tracking-wider italic">Atelier AI Setup Guide</h4>
            </div>
            <p className="text-[10px] font-semibold leading-relaxed tracking-wider text-zinc-400 uppercase">
              The AI Stylist Concierge requires valid Firebase credentials to securely connect to Gemini AI Logic.
            </p>
            <div className="border-t border-zinc-900 pt-3.5 space-y-3 font-mono text-[9px] text-zinc-500 tracking-wider">
              <div className="flex items-start space-x-3">
                <span className="text-yellow-400 font-bold">01.</span>
                <div>
                  <p className="text-zinc-300 font-bold uppercase">Create environment file</p>
                  <p className="text-zinc-500">Add a <span className="text-white bg-zinc-900 px-1 py-0.5 rounded">.env</span> or <span className="text-white bg-zinc-900 px-1 py-0.5 rounded">.env.local</span> in your project root.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-yellow-400 font-bold">02.</span>
                <div>
                  <p className="text-zinc-300 font-bold uppercase">Configure Firebase</p>
                  <p className="text-zinc-500">Insert your Firebase project credentials:</p>
                  <pre className="bg-zinc-900 border border-zinc-800 text-zinc-300 p-2 rounded mt-1.5 font-mono select-all">VITE_FIREBASE_API_KEY=your_key{'\n'}VITE_FIREBASE_PROJECT_ID=your_id</pre>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-yellow-400 font-bold">03.</span>
                <div>
                  <p className="text-zinc-300 font-bold uppercase">Reboot Platform</p>
                  <p className="text-zinc-500">Restart the local dev server using <span className="text-white bg-zinc-900 px-1 py-0.5 rounded">npm run dev</span>.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 mt-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ASK ANYTHING: COPPING ADVICE, PAIRING, SIZING..."
          className={`w-full border border-zinc-800 bg-zinc-950 pr-14 text-white outline-none transition-all placeholder:text-gray-700 focus:border-yellow-400 ${compact ? 'py-4 pl-4 text-[9px] font-black uppercase tracking-[0.15em]' : 'py-6 pl-6 pr-16 text-[10px] font-black uppercase tracking-[0.2em]'}`}
        />
        <button
          type="submit"
          disabled={loading || !chatRef.current}
          className={`absolute bg-yellow-400 text-black transition-all hover:bg-white disabled:opacity-50 disabled:grayscale ${compact ? 'right-2 top-2 p-3' : 'right-3 top-3 p-4'}`}
        >
          <Send className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
        </button>
      </form>
    </div>
  );
};

export default AIConcierge;

