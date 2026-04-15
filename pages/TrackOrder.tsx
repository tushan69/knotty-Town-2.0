import React, { useState } from 'react';
import { Search, Package, Truck, CheckCircle, ShieldQuestion } from 'lucide-react';
import { trackOrder } from '../services/orderService';

const TrackOrder: React.FC = () => {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<any | null>(null);
  const [error, setError] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleTrack = async () => {
    if (!orderId) return;
    setIsSearching(true);
    const found = await trackOrder(orderId.toUpperCase());
    if (found) {
      setOrder(found);
      setError(false);
    } else {
      setOrder(null);
      setError(true);
    }
    setIsSearching(false);
  };

  const getStep = () => {
    if (order?.status === 'Delivered') return 3;
    if (order?.status === 'Shipped') return 2;
    return 1;
  };

  return (
    <div className="min-h-screen bg-background pt-32 md:pt-48 pb-32 px-6">
      <div className="max-w-2xl mx-auto space-y-16">
        <div className="text-center space-y-6">
          <span className="text-secondary font-body text-[10px] tracking-[0.5em] uppercase opacity-60 block">Client Services</span>
          <h1 className="font-headline text-5xl md:text-7xl text-primary italic font-light tracking-tighter">Track Order.</h1>
          <p className="text-sm font-body font-light text-secondary/60">Monitor the journey of your Knotty Town piece.</p>
        </div>

        <div className="relative group max-w-lg mx-auto border-b border-primary/20 pb-2">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
            className="w-full bg-transparent py-4 pl-4 pr-16 text-[10px] font-body uppercase tracking-[0.4em] outline-none text-primary placeholder:text-primary/20 transition-colors"
            placeholder="ORDER ID (E.G. KT-XXXX)..."
          />
          <button
            onClick={handleTrack}
            disabled={isSearching}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition-colors p-4"
          >
            {isSearching ? <div className="w-5 h-5 border-[1.5px] border-primary/40 border-t-transparent animate-spin rounded-full"></div> : <Search className="w-5 h-5" strokeWidth={1} />}
          </button>
        </div>

        {error && (
          <div className="p-8 border border-red-500/10 bg-surface-container-low text-center animate-in fade-in zoom-in duration-500">
            <ShieldQuestion className="w-8 h-8 text-red-500 mx-auto mb-6" strokeWidth={1} />
            <h3 className="font-body text-[10px] uppercase tracking-[0.3em] font-light text-red-500">Order not found. Please verify your tracking ID.</h3>
          </div>
        )}

        {order && (
          <div className="bg-surface-container-low border border-primary/10 p-8 md:p-16 shadow-2xl space-y-16 animate-in slide-in-from-bottom-12 duration-700">
            <div className="flex justify-between items-start border-b border-primary/10 pb-8">
              <div>
                <div className="flex items-center space-x-4 mb-4">
                  <p className="text-[10px] text-primary/60 font-body uppercase tracking-[0.4em] leading-none">Order {order.id}</p>
                  <button
                    onClick={() => handleCopy(order.id)}
                    className="p-1 text-primary/40 hover:text-accent transition-colors relative"
                    title="Copy Tracking ID"
                  >
                    {copyFeedback ? <CheckCircle className="w-3 h-3 text-accent" strokeWidth={1} /> : <Package className="w-3 h-3" strokeWidth={1} />}
                  </button>
                  {copyFeedback && <span className="text-[8px] text-accent uppercase font-body tracking-[0.3em] absolute ml-8">COPIED</span>}
                </div>
                <h3 className={`font-headline text-4xl italic font-light ${order.status === 'Delivered' ? 'text-accent' : 'text-primary'}`}>{order.status}.</h3>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-secondary/40 font-body uppercase tracking-[0.4em] mb-2">Timestamp</p>
                <p className="font-body text-[10px] tracking-[0.2em] font-light uppercase text-primary border-b border-primary/20 pb-1">{new Date(order.date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="relative pt-12 pb-4">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-primary/10 -translate-y-1/2 mt-6"></div>
              <div
                className="absolute top-1/2 left-0 h-[1px] bg-accent -translate-y-1/2 transition-all duration-[1500ms] ease-out-expo mt-6"
                style={{ width: `${(getStep() / 3) * 100}%` }}
              ></div>
              <div className="flex justify-between relative z-10 w-full">
                {[
                  { label: 'Confirmed', icon: Package },
                  { label: 'Dispatched', icon: Truck },
                  { label: 'Delivered', icon: CheckCircle }
                ].map((step, i) => (
                  <div key={i} className="flex flex-col items-center bg-surface-container-low px-4">
                     <span className={`mb-6 text-[9px] uppercase tracking-[0.4em] font-body ${getStep() > i ? 'text-accent' : 'text-primary/40'}`}>{step.label}</span>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-700 ${getStep() > i ? 'text-white bg-accent border-accent' : 'text-primary/40 border border-primary/20'}`}>
                      <step.icon className="w-5 h-5" strokeWidth={getStep() > i ? 1.5 : 0.5} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;