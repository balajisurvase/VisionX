import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

interface SystemBootLoaderProps {
  onComplete: () => void;
}

export const SystemBootLoader: React.FC<SystemBootLoaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1200; // Fast and simple 1.2s load

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const current = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(current);

      if (current >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          onComplete();
        }, 150);
      }
    }, 25);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      onClick={onComplete}
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-white cursor-pointer select-none"
    >
      <div className="w-full max-w-xs mx-auto text-center space-y-6">
        {/* Simple Brand Icon with subtle glow */}
        <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-blue-500/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-white">
            IdentityGuard AI
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Border Document Verification
          </p>
        </div>

        {/* Minimal Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-75 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>Loading...</span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
