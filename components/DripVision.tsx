
import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Zap, Sparkles, Scan, Search, ChevronRight, Eye } from 'lucide-react';
import { analyzeDripAesthetic, isGeminiConfigured } from '../services/geminiService';
import { getProducts } from '../services/productService';

interface DripVisionProps {
  onClose: () => void;
  onApplySearch: (query: string) => void;
}

const DripVision: React.FC<DripVisionProps> = ({ onClose, onApplySearch }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    
    try {
      const products = await getProducts();
      const inventoryContext = products.map(p => `- ${p.name}: ${p.description}`).join('\n');
      const result = await analyzeDripAesthetic(image, inventoryContext);
      setAnalysis(result || "Could not decode the vibe.");
    } catch (error) {
      setAnalysis("Signal failure. Your drip broke the internet.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 md:p-10 overflow-y-auto">
      <div className="bg-white border border-gray-200 w-full max-w-5xl relative shadow-sm transition-all animate-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-black text-white p-6 md:p-8 flex justify-between items-center border-b-4 border-black">
          <div className="flex items-center space-x-4">
            <div className="bg-black text-white hover:bg-gray-800 p-3 rotate-12 shadow-sm transition-all border-2 border-white">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-serif text-2xl md:text-4xl uppercase tracking-tighter">DRIP <span className="text-black">VISION.</span></h2>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">AI AESTHETIC DECODER v2.5</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-zinc-900 hover:bg-black text-white hover:bg-gray-800 transition-colors">
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Upload Area */}
          <div className="p-8 md:p-12 border-b-4 lg:border-b-0 lg:border-r-4 border-black">
            {!isGeminiConfigured() ? (
              <div className="border-4 border-dashed border-zinc-200 aspect-square flex flex-col items-center justify-center space-y-6 bg-zinc-50/50 cursor-not-allowed">
                <div className="bg-zinc-100 p-8 rounded-full text-zinc-400">
                  <Scan className="w-12 h-12 text-zinc-400" />
                </div>
                <div className="text-center px-6">
                  <p className="font-black text-sm uppercase tracking-widest text-zinc-400">VISION ENGINE LOCKED</p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase mt-2">API CREDENTIALS MISSING IN ROOT</p>
                </div>
              </div>
            ) : !image ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-4 border-dashed border-zinc-200 aspect-square flex flex-col items-center justify-center space-y-6 cursor-pointer hover:border-[#FF4500] hover:bg-gray-50 transition-all group"
              >
                <div className="bg-zinc-100 p-8 rounded-full group-hover:bg-black text-white hover:bg-gray-800 group-hover:text-white transition-all">
                  <Camera className="w-12 h-12" />
                </div>
                <div className="text-center">
                  <p className="font-black text-sm uppercase tracking-widest">UPLOAD INSPIRATION</p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase mt-2">Drop a screenshot or outfit photo</p>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              </div>
            ) : (
              <div className="space-y-8">
                <div className="relative aspect-square border border-gray-200 shadow-sm transition-all overflow-hidden group">
                  <img src={image} className="w-full h-full object-cover" />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center overflow-hidden">
                      <div className="w-full h-2 bg-black text-white hover:bg-gray-800 absolute animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_20px_#FF4500]" />
                      <p className="relative z-10 font-serif text-white text-2xl animate-pulse">SCANNING VIBE...</p>
                    </div>
                  )}
                  {!isAnalyzing && !analysis && (
                    <button 
                      onClick={() => setImage(null)}
                      className="absolute top-4 right-4 bg-white p-2 border border-gray-200 hover:bg-red-500 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                {!analysis && (
                  <button 
                    onClick={runAnalysis}
                    disabled={isAnalyzing}
                    className="w-full bg-black text-white p-6 font-black uppercase text-xs tracking-widest shadow-sm transition-all hover:bg-black text-white hover:bg-gray-800 transition-all flex items-center justify-center"
                  >
                    <Zap className="w-5 h-5 mr-3 text-yellow-400 fill-current" />
                    DECODE THIS AESTHETIC
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="p-8 md:p-12 bg-zinc-50 flex flex-col justify-center">
            {!isGeminiConfigured() ? (
              <div className="space-y-8 text-left max-w-md mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="inline-flex items-center space-x-2 bg-black text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest border border-zinc-800">
                  <Zap className="w-3 h-3 fill-current text-yellow-400 animate-pulse" />
                  <span>AI Engine Offline</span>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-serif text-2xl md:text-3xl uppercase italic tracking-tight text-black">Aesthetic Decoder Offline.</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                    Drip Vision requires a connection to the Gemini API to analyze visual elements and match them to active collections.
                  </p>
                </div>

                <div className="border-t-2 border-black border-dashed pt-6 space-y-4">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">DEVELOPER SETUP REQUIRED</p>
                  
                  <div className="bg-white border border-zinc-200 p-4 space-y-3 font-mono text-[9px] text-zinc-600 shadow-sm">
                    <p className="font-bold text-black uppercase">To enable Drip Vision:</p>
                    <ol className="list-decimal list-inside space-y-2 text-zinc-500">
                      <li>Create a <code className="bg-zinc-100 text-black px-1 py-0.5 rounded font-mono font-bold">.env</code> or <code className="bg-zinc-100 text-black px-1 py-0.5 rounded font-mono font-bold">.env.local</code> in root</li>
                      <li>Define your Firebase credentials:
                        <pre className="bg-zinc-50 border border-zinc-100 p-2 mt-1 text-black font-mono select-all">VITE_FIREBASE_API_KEY=your_key{'\n'}VITE_FIREBASE_PROJECT_ID=your_id</pre>
                      </li>
                      <li>Restart standard server: <code className="bg-zinc-100 text-black px-1 py-0.5 rounded font-mono font-bold">npm run dev</code></li>
                    </ol>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {!analysis && !isAnalyzing && (
                  <div className="text-center space-y-6">
                    <Scan className="w-20 h-20 mx-auto text-zinc-200" />
                    <h3 className="font-black text-xl uppercase tracking-tight text-zinc-300">AWAITING INPUT</h3>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-loose">
                      Our neural networks are ready. Feed them an image to find your perfect Knotty Town match.
                    </p>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="space-y-12">
                     {[1, 2, 3].map(i => (
                       <div key={i} className="space-y-4">
                         <div className="h-4 bg-zinc-200 animate-pulse w-3/4"></div>
                         <div className="h-4 bg-zinc-200 animate-pulse w-full"></div>
                       </div>
                     ))}
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black text-center animate-bounce">CROSS-REFERENCING THE VAULT</p>
                  </div>
                )}

                {analysis && (
                  <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-10">
                    <div className="inline-flex items-center space-x-2 bg-black text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                      <Sparkles className="w-3 h-3 text-yellow-400" />
                      <span>AESTHETIC DECODED</span>
                    </div>
                    
                    <div className="space-y-6">
                      <p className="text-xs md:text-sm font-black uppercase tracking-widest leading-loose text-black border-l-4 border-[#FF4500] pl-6 italic">
                        {analysis}
                      </p>
                    </div>

                    <div className="pt-10 border-t-2 border-black border-dashed flex flex-col space-y-4">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">READY TO COP THE LOOK?</p>
                      <button 
                        onClick={() => {
                          onApplySearch(analysis.split(' ').slice(0, 3).join(' ')); // Use first few keywords
                          onClose();
                        }}
                        className="bg-black text-white hover:bg-gray-800 text-white p-5 font-black uppercase text-[10px] tracking-widest shadow-sm transition-all hover:bg-black transition-all flex items-center justify-center"
                      >
                        SEARCH VAULT FOR THIS VIBE
                        <ChevronRight className="ml-2 w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setImage(null);
                          setAnalysis(null);
                        }}
                        className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
                      >
                        TRY ANOTHER IMAGE
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default DripVision;
