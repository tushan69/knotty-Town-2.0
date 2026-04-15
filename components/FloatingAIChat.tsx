import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';

const AIConcierge = lazy(() => import('./AIConcierge'));

const ChatSkeleton: React.FC = () => (
  <div className="flex h-[min(480px,calc(90vh-56px))] w-full items-center justify-center rounded-2xl border border-white/10 bg-black">
    <span className="font-body text-[10px] uppercase tracking-[0.35em] text-zinc-500">Loading concierge…</span>
  </div>
);

const FloatingAIChat: React.FC = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (pathname.startsWith('/admin')) return null;
  if (pathname === '/contact') return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[200] flex cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-3 text-white shadow-2xl transition-transform hover:scale-[1.03] hover:bg-black md:bottom-8 md:right-8 lg:cursor-pointer"
        aria-label="Open AI stylist chat"
      >
        <Sparkles className="h-4 w-4 shrink-0 text-yellow-400" strokeWidth={1.5} />
        <span className="hidden font-body text-[9px] uppercase tracking-[0.28em] sm:inline">Stylist</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[210]" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            aria-label="Close chat"
            onClick={() => setOpen(false)}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex max-h-[92vh] justify-center md:inset-auto md:bottom-8 md:right-8 md:left-auto md:max-h-[min(640px,92vh)] md:w-[min(440px,calc(100vw-2rem))]">
            <div
              className="pointer-events-auto flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-zinc-950 shadow-2xl md:rounded-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="AI stylist chat"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-black px-2 py-1">
                <span className="pl-3 font-body text-[9px] uppercase tracking-[0.35em] text-white/40">Atelier AI</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="cursor-pointer p-2 text-white/50 transition-colors hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" strokeWidth={1.25} />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-2 md:p-3">
                <Suspense fallback={<ChatSkeleton />}>
                  <AIConcierge layout="compact" />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAIChat;
