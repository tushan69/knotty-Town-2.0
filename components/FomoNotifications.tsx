import React, { useState, useEffect } from 'react';
import { ShoppingBag, Zap, Crown } from 'lucide-react';

const LOCATIONS = [
  'Mumbai', 'Delhi', 'Bangalore', 'Mangalore', 'Pune', 'Hyderabad', 'Jaipur',
  'Chennai', 'Kolkata', 'Ahmedabad', 'Surat', 'Lucknow', 'Indore', 'Chandigarh', 'Goa'
];
const ITEMS = [
  'Chaos Theory Tee', 'Midnight Hustle Drop', 'Knotty Lab Custom', 'Royal Oversized',
  'Saffron Drip', 'Ghost in the Shell Drop', 'Cyberpunk V2', 'Eucalyptus Green Oversized',
  'Noir Collection', 'Tokyo Drift Tee'
];

const FomoNotifications: React.FC = () => {
  const [notification, setNotification] = useState<{ loc: string, item: string } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const trigger = () => {
      const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
      setNotification({ loc, item });
      setVisible(true);

      setTimeout(() => setVisible(false), 5000);
    };

    const interval = setInterval(trigger, 25000); // Every 25s
    const initialTimeout = setTimeout(trigger, 5000); // First one after 5s

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, []);

  if (!notification) return null;

  return (
    <div className={`fixed bottom-24 left-6 z-[150] transition-all duration-700 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
      <div className="bg-white border border-gray-200 p-4 md:p-5 shadow-sm transition-all flex items-center space-x-4 max-w-[280px]">
        <div className="bg-black text-white hover:bg-gray-800 p-2 border border-gray-200 rotate-12">
          <Zap className="w-5 h-5 text-white fill-current" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-black leading-tight">
            Someone in <span className="text-black">{notification.loc}</span> just copped
          </p>
          <p className="text-[11px] font-serif uppercase tracking-tighter mt-1">{notification.item}</p>
          <div className="flex items-center mt-1 space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[7px] font-black text-gray-400 uppercase">Verified Purchase</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FomoNotifications;