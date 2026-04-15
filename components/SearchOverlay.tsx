import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../services/productService';
import { analyzeTextSearch } from '../services/geminiService';
import { Product } from '../types';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [aiResults, setAiResults] = useState<Product[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAISearch = async () => {
    if (query.trim().length < 3) return;
    setIsSearchingAI(true);
    setAiResults(null);
    try {
      const inventoryContext = catalog.map(p => `${p.id}: ${p.name} - ${p.category} - ${p.description}`).join('\n');
      const idsStr = await analyzeTextSearch(query, inventoryContext);
      if (idsStr) {
        const ids = idsStr.split(',').map(s => s.trim());
        const matched = catalog.filter(p => ids.includes(p.id));
        setAiResults(matched);
      } else {
        setAiResults([]);
      }
    } catch {
      setAiResults([]);
    } finally {
      setIsSearchingAI(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    getProducts().then(setCatalog).catch(() => setCatalog([]));
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return catalog
      .filter((p) => {
        const blob = `${p.name} ${p.category} ${p.description}`.toLowerCase();
        return blob.includes(q);
      })
      .slice(0, 10);
  }, [catalog, query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-primary/95 backdrop-blur-md text-white animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-label="Search archive"
      onClick={onClose}
    >
      <div
        className="flex flex-col flex-1 min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
      <div className="flex items-center justify-between px-6 md:px-16 py-8 border-b border-white/10">
        <span className="font-body text-[10px] uppercase tracking-[0.5em] text-white/50">Search the archive</span>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-white/60 hover:text-white transition-colors"
          aria-label="Close search"
        >
          <span className="material-symbols-outlined text-2xl font-light">close</span>
        </button>
      </div>

      <div className="px-6 md:px-16 py-10 md:py-14 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-4 border-b border-white/20 pb-4 mb-10">
          <span className="material-symbols-outlined text-xl text-white/40 font-light">search</span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setAiResults(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAISearch(); }}
            placeholder="Pieces, categories, moods…"
            className="flex-1 bg-transparent border-none outline-none font-body text-lg md:text-xl font-light placeholder:text-white/25 text-white tracking-tight"
            autoComplete="off"
          />
          <button 
            onClick={handleAISearch} 
            disabled={isSearchingAI || query.trim().length < 3}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 text-[10px] uppercase tracking-widest transition-colors rounded-sm ml-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            {isSearchingAI ? 'Thinking...' : 'AI Search'}
          </button>
        </div>

        {query.trim().length > 0 && query.trim().length < 2 && (
          <p className="font-body text-[10px] uppercase tracking-[0.35em] text-white/35">Type at least two characters</p>
        )}

        {isSearchingAI && (
          <p className="font-body text-sm text-accent font-light mb-8 animate-pulse text-center w-full">Ask the curator... decoding your vibe...</p>
        )}

        {!isSearchingAI && aiResults !== null && (
          <div className="mb-8">
            <h4 className="text-[10px] text-accent font-body uppercase tracking-[0.35em] mb-4">Curator's AI Picks</h4>
            {aiResults.length === 0 ? (
               <p className="font-body text-sm text-white/50 font-light">Could not find a match for that specific vibe.</p>
            ) : (
               <ul className="space-y-2">
                 {aiResults.map((p) => (
                    <li key={p.id}>
                      <Link
                        to={`/product/${p.id}`}
                        onClick={onClose}
                        className="flex items-center justify-between gap-6 py-4 px-4 -mx-4 rounded-sm hover:bg-white/5 transition-colors group"
                      >
                        <div className="min-w-0">
                          <p className="font-headline text-lg md:text-xl text-white/90 group-hover:text-accent transition-colors truncate italic font-light">
                            {p.name}
                          </p>
                          <p className="font-body text-[9px] uppercase tracking-[0.35em] text-white/35 mt-1">{p.category}</p>
                        </div>
                        <span className="font-body text-sm text-white/60 shrink-0">₹{p.price.toFixed(0)}</span>
                      </Link>
                    </li>
                 ))}
               </ul>
            )}
          </div>
        )}

        {!isSearchingAI && aiResults === null && query.trim().length >= 2 && results.length === 0 && (
          <p className="font-body text-sm text-white/50 font-light">No silhouettes match that signal. Try AI search.</p>
        )}

        {!isSearchingAI && aiResults === null && results.length > 0 && (
          <ul className="space-y-2">
            {results.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/product/${p.id}`}
                  onClick={onClose}
                  className="flex items-center justify-between gap-6 py-4 px-4 -mx-4 rounded-sm hover:bg-white/5 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="font-headline text-lg md:text-xl text-white/90 group-hover:text-accent transition-colors truncate italic font-light">
                      {p.name}
                    </p>
                    <p className="font-body text-[9px] uppercase tracking-[0.35em] text-white/35 mt-1">{p.category}</p>
                  </div>
                  <span className="font-body text-sm text-white/60 shrink-0">₹{p.price.toFixed(0)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {results.length > 0 && (
          <Link
            to="/shop"
            onClick={onClose}
            className="inline-block mt-12 font-body text-[10px] uppercase tracking-[0.4em] text-accent border-b border-accent/40 pb-1 hover:text-white hover:border-white transition-colors"
          >
            Open full catalog
          </Link>
        )}
      </div>
      </div>
    </div>
  );
};

export default SearchOverlay;
