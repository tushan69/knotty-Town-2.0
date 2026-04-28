import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-background overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary blur-[120px]"></div>
      </div>

      <div className="relative flex flex-col items-center">
        {/* Animated Geometric Logo/Icon */}
        <div className="relative w-32 h-32 mb-12">
          {/* Outer Ring */}
          <div className="absolute inset-0 border border-primary/5 rounded-full"></div>
          
          {/* Animated Spinning Arc */}
          <svg className="absolute inset-0 w-full h-full rotate-[-90deg]">
            <circle
              cx="64"
              cy="64"
              r="63"
              stroke="currentColor"
              strokeWidth="1"
              fill="transparent"
              className="text-accent animate-loading-arc"
              strokeDasharray="400"
              strokeDashoffset="400"
            />
          </svg>

          {/* Central Logo Lettering */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-headline italic font-light tracking-tighter text-primary animate-pulse-slow">
              KT
            </span>
          </div>
        </div>

        {/* Loading Text with Progress-like animation */}
        <div className="flex flex-col items-center space-y-4">
          <span className="text-[10px] tracking-[0.6em] uppercase font-body text-primary/60 animate-fade-in-out">
            Synchronizing Archive
          </span>
          
          {/* Minimalist Progress Line */}
          <div className="w-48 h-[1px] bg-primary/5 relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-accent w-1/3 animate-loading-bar"></div>
          </div>
          
          <span className="text-[8px] tracking-[0.4em] uppercase font-body text-primary/30 mt-4 italic">
            Knotty Town Studio © 2026
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
