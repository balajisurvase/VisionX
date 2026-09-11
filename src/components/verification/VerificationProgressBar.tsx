import React, { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, Shield, Sparkles, Scan, Layers, Camera, Lock } from 'lucide-react';

interface VerificationProgressBarProps {
  onComplete?: () => void;
  documentType: string;
}

export const VerificationProgressBar: React.FC<VerificationProgressBarProps> = ({
  documentType,
}) => {
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [stageProgress, setStageProgress] = useState<number>(20);

  const stages = [
    {
      id: 1,
      name: 'Document Preprocessing',
      detail: 'Perspective correction, noise filtering, and orientation normalization',
      icon: Scan,
    },
    {
      id: 2,
      name: 'OCR & ICAO 9303 Extraction',
      detail: 'Machine Readable Zone (MRZ) & Visual Inspection Zone (VIZ) decoding',
      icon: Sparkles,
    },
    {
      id: 3,
      name: 'Mathematical Checksum Audit',
      detail: 'Modulo 10 (7-3-1 weight) checksums for doc no., DOB, expiry & composite',
      icon: Shield,
    },
    {
      id: 4,
      name: 'Forensic ELA & Tampering Scan',
      detail: 'OpenCV Error Level Analysis, font glyph kerning & photo splice detection',
      icon: Layers,
    },
    {
      id: 5,
      name: '1:1 Biometric & Ledger Hash',
      detail: 'Facial cosine matching, liveness audit & SHA-256 blockchain block creation',
      icon: Camera,
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStageProgress((prev) => {
        if (prev < 100) {
          const next = prev + 5;
          if (next >= 100 && currentStage < 5) {
            setCurrentStage((s) => s + 1);
            return 20;
          }
          return next;
        }
        return prev;
      });
    }, 120);

    return () => clearInterval(timer);
  }, [currentStage]);

  return (
    <div className="bg-white rounded-[12px] border border-gray-100 p-8 text-center space-y-6 shadow-2xs">
      <div className="flex items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shadow-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-[#4F46E5]" />
        </div>
      </div>

      <div className="max-w-xl mx-auto">
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EEF2FF] text-[#4F46E5] uppercase tracking-wider">
          Stage {currentStage} of 5 Active
        </span>
        <h2 className="text-lg font-bold text-[#111827] mt-2">
          Executing Multi-Layer Document & Biometric Forensics
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Screening {documentType} against Sovereign Border Database and ICAO 9303 Security Standards
        </p>
      </div>

      {/* Steps Visual List */}
      <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-5 gap-3 text-left">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isDone = currentStage > stage.id;
          const isCurrent = currentStage === stage.id;
          return (
            <div
              key={stage.id}
              className={`p-3 rounded-xl border text-xs transition-all ${
                isDone
                  ? 'bg-[#DCFCE7]/40 border-[#16A34A]/30 text-[#15803D]'
                  : isCurrent
                  ? 'bg-[#EEF2FF] border-[#4F46E5] text-[#4F46E5] shadow-xs'
                  : 'bg-[#F5F6F8] border-gray-200 text-gray-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon className="w-4 h-4" />
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                ) : isCurrent ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#4F46E5]" />
                ) : (
                  <span className="text-[10px] font-mono text-gray-400">0{stage.id}</span>
                )}
              </div>
              <div className="font-bold text-[11px] leading-tight text-[#111827]">
                {stage.name}
              </div>
              <div className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-snug hidden sm:block">
                {stage.detail}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Line */}
      <div className="max-w-md mx-auto space-y-2">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#4F46E5] to-[#16A34A] rounded-full transition-all duration-300"
            style={{ width: `${((currentStage - 1) * 20) + (stageProgress * 0.2)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
          <span>ICAO 9303 • ELA • SHA-256</span>
          <span>{Math.min(100, Math.round(((currentStage - 1) * 20) + (stageProgress * 0.2)))}% Processed</span>
        </div>
      </div>
    </div>
  );
};
