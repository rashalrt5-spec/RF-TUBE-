import React, { useEffect, useState } from 'react';
import { Play, Volume2, VolumeX, ShieldAlert, Award, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdModalProps {
  onComplete: () => void;
  onClose: () => void;
}

export default function AdModal({ onComplete, onClose }: AdModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [isMuted, setIsMuted] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [errorLoading, setErrorLoading] = useState(false);

  useEffect(() => {
    // 1. Inject the Monetag Ad Script Dynamically
    const script = document.createElement('script');
    script.src = '//libtl.com/sdk.js';
    script.setAttribute('data-zone', '11204873');
    script.setAttribute('data-sdk', 'show_11204873');
    script.async = true;
    
    script.onload = () => {
      setAdLoaded(true);
      // Trigger global Monetag script show functions if any exist
      try {
        if (typeof (window as any).show_11204873 === 'function') {
          (window as any).show_11204873();
        }
      } catch (err) {
        console.error('Monetag SDK trigger error:', err);
      }
    };

    script.onerror = () => {
      setErrorLoading(true);
      console.warn('Monetag SDK blocked or failed to load. Initiating backup ad experience.');
    };

    document.body.appendChild(script);

    // 2. Countdown Timer
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      document.body.removeChild(script);
    };
  }, []);

  const handleFinish = () => {
    if (secondsLeft === 0) {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
      {/* Monetag Ad container (hidden or visible based on how the SDK injects) */}
      <div id="show_11204873" className="hidden"></div>

      <div className="w-full max-w-lg bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl relative">
        
        {/* Ad Header Info */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-yellow-500 text-black rounded">
              Sponsored Ad
            </span>
            <span className="text-xs text-zinc-400 font-mono">ID: 11204873</span>
          </div>
          
          {secondsLeft > 0 ? (
            <div className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full text-xs font-medium font-mono">
              Reward in {secondsLeft}s
            </div>
          ) : (
            <button 
              onClick={onClose}
              className="p-1 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Ad Video Simulation & Display Canvas */}
        <div className="aspect-video bg-black flex flex-col items-center justify-center relative p-6">
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10 pointer-events-none" />
          
          {/* Decorative video simulation screen */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
            <div className="w-32 h-32 rounded-full border-4 border-zinc-700 animate-ping" />
          </div>

          <div className="z-10 text-center flex flex-col items-center gap-3">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-600 flex items-center justify-center text-black"
            >
              <Play className="w-8 h-8 fill-black" />
            </motion.div>

            <h3 className="text-lg font-semibold text-white tracking-wide">
              MoneTag Ad Station
            </h3>
            
            <p className="text-xs text-zinc-400 max-w-sm">
              Supporting the creator. Please keep this screen active to secure your link credit.
            </p>

            {errorLoading && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-500/90 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Ad connection slow. Rewarding with fallback mode.</span>
              </div>
            )}
          </div>

          {/* Ad Controls Overlay */}
          <div className="absolute bottom-3 left-3 right-3 z-20 flex justify-between items-center text-xs text-zinc-400 font-mono">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-300 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <span>HD 1080p</span>
          </div>
        </div>

        {/* Ad Progress and Action */}
        <div className="p-5 flex flex-col gap-4 bg-zinc-950">
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              className="bg-yellow-500 h-full"
              initial={{ width: "0%" }}
              animate={{ width: `${((15 - secondsLeft) / 15) * 100}%` }}
              transition={{ ease: "linear" }}
            />
          </div>

          {secondsLeft > 0 ? (
            <button
              disabled
              className="w-full py-3 bg-zinc-800 text-zinc-500 rounded-xl font-medium cursor-not-allowed text-sm flex items-center justify-center gap-2 border border-zinc-700/50"
            >
              Watching Ad... ({secondsLeft}s)
            </button>
          ) : (
            <motion.button
              onClick={handleFinish}
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 hover:from-green-400 hover:to-emerald-500 transition-all cursor-pointer"
            >
              <Award className="w-4 h-4 animate-bounce" />
              <span>Claim Ad Credit & Close</span>
            </motion.button>
          )}
        </div>

      </div>
    </div>
  );
}
