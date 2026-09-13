import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  RefreshCw,
  Shield,
  Sparkles,
  Scan,
  Layers,
  Camera,
  AlertTriangle,
  FileSearch,
  Activity,
} from 'lucide-react';

interface VerificationProgressBarProps {
  onComplete?: () => void;
  documentType: string;
}

export const VerificationProgressBar: React.FC<VerificationProgressBarProps> = ({
  documentType,
}) => {
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [stageProgress, setStageProgress] = useState<number>(15);

  const stages = [
    {
      id: 1,
      name: 'Image Preprocessing',
      detail: 'Perspective correction, contrast equalization, and noise filtering',
      icon: Scan,
    },
    {
      id: 2,
      name: 'Document Detection',
      detail: 'Boundary localization, corner detection & standard aspect ratio mapping',
      icon: FileSearch,
    },
    {
      id: 3,
      name: 'OCR Text Extraction',
      detail: 'Extracting structured fields from the Visual Inspection Zone (VIZ)',
      icon: Sparkles,
    },
    {
      id: 4,
      name: 'MRZ Detection & Validation',
      detail: 'ICAO 9303 modulo-10 7-3-1 weight checksum verification',
      icon: Shield,
    },
    {
      id: 5,
      name: 'Document Authenticity Check',
      detail: 'Security microprint, watermark structure, and layout integrity',
      icon: CheckCircle2,
    },
    {
      id: 6,
      name: 'Tampering Analysis',
      detail: 'OpenCV Error Level Analysis (ELA) and digital splice detection',
      icon: Layers,
    },
    {
      id: 7,
      name: 'Face Verification',
      detail: '1:1 facial biometric matching and liveness assessment (Prototype)',
      icon: Camera,
    },
    {
      id: 8,
      name: 'Risk Score Calculation',
      detail: 'Synthesizing weighted factor matrix into 0–100 threat score',
      icon: Activity,
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStageProgress((prev) => {
        if (prev < 100) {
          const next = prev + 12;
          if (next >= 100 && currentStage < 8) {
            setCurrentStage((s) => s + 1);
            return 15;
          }
          return next;
        }
        return prev;
      });
    }, 110);

    return () => clearInterval(timer);
  }, [currentStage]);

  const totalPercent = Math.min(100, Math.round(((currentStage - 1) * 12.5) + (stageProgress * 0.125)));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center space-y-6 shadow-sm">
      <div className="flex items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </div>

      <div className="max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
          <span>Stage {currentStage} of 8</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mt-2.5">
          Running 8-Stage Document Verification Pipeline
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Analyzing {documentType} against security specifications, ICAO 9303 checksums, and forensic tampering heuristics.
        </p>
      </div>

      {/* 8-Steps Visual Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isDone = currentStage > stage.id;
          const isCurrent = currentStage === stage.id;
          const isPending = currentStage < stage.id;

          return (
            <div
              key={stage.id}
              className={`p-3.5 rounded-xl border text-xs transition-all ${
                isDone
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-800'
                  : isCurrent
                  ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-sm ring-1 ring-blue-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1 rounded-md ${isDone ? 'bg-emerald-100 text-emerald-700' : isCurrent ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {isDone ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed</span>
                  </span>
                ) : isCurrent ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Processing</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-400">Pending</span>
                )}
              </div>
              <div className="font-bold text-xs text-slate-900 leading-snug">
                {stage.name}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {stage.detail}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar & ETA */}
      <div className="max-w-md mx-auto space-y-2 pt-2">
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-200"
            style={{ width: `${totalPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>IdentityGuard Engine • OpenCV + OCR</span>
          <span className="font-bold text-slate-700">{totalPercent}% Complete</span>
        </div>
      </div>
    </div>
  );
};
