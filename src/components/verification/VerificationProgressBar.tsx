import React, { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

interface VerificationProgressBarProps {
  onComplete?: () => void;
  documentType: string;
}

export const VerificationProgressBar: React.FC<VerificationProgressBarProps> = ({
  documentType,
}) => {
  const [stageIndex, setStageIndex] = useState<number>(0);
  const [percent, setPercent] = useState<number>(10);

  const stageLabels = [
    'Analyzing document boundaries & image quality...',
    'Extracting OCR text & reading machine-readable zone (MRZ)...',
    'Verifying ICAO 9303 modulo checksums...',
    'Performing digital tamper & Error Level Analysis (ELA)...',
    'Executing 1:1 facial biometric match...',
    'Generating security risk score & clearance decision...',
  ];

  useEffect(() => {
    const startTime = Date.now();
    const duration = 2800; // 2.8s smooth scan

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentPercent = Math.min(100, Math.round((elapsed / duration) * 100));
      setPercent(currentPercent);

      const idx = Math.min(
        Math.floor((currentPercent / 100) * stageLabels.length),
        stageLabels.length - 1
      );
      setStageIndex(idx);

      if (currentPercent >= 100) {
        clearInterval(timer);
      }
    }, 40);

    return () => clearInterval(timer);
  }, [stageLabels.length]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto space-y-6 shadow-sm">
      {/* Centered spinner icon */}
      <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 rounded-2xl bg-blue-50 animate-ping" />
        <div className="relative w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/25">
          <RefreshCw className="w-7 h-7 text-white animate-spin" />
        </div>
      </div>

      {/* Main Title & Status */}
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Verifying {documentType}
        </h2>
        <p className="text-xs text-slate-500 font-medium min-h-[20px]">
          {percent >= 100 ? 'Verification complete!' : stageLabels[stageIndex]}
        </p>
      </div>

      {/* Simple Progress Bar */}
      <div className="space-y-2">
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-75 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>IdentityGuard Security</span>
          <span className="font-bold text-slate-700">{percent}%</span>
        </div>
      </div>
    </div>
  );
};
