import React, { useEffect, useState, useRef } from 'react';
import {
  Loader2,
  Check,
  ShieldCheck,
  Scan,
  UserCheck,
  Database,
  FileText,
} from 'lucide-react';

interface VerificationProgressBarProps {
  onComplete?: () => void;
  documentType: string;
  previewUrl?: string | null;
  personPreviewUrl?: string | null;
  isReady?: boolean;
}

interface StepItem {
  id: string;
  title: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  targetPercent: number;
}

export const VerificationProgressBar: React.FC<VerificationProgressBarProps> = ({
  documentType,
  previewUrl,
  personPreviewUrl,
  isReady = true,
  onComplete,
}) => {
  const [percent, setPercent] = useState<number>(10);
  const [currentStatusMsg, setCurrentStatusMsg] = useState<string>('Initializing optical scan & data extraction...');

  const isReadyRef = useRef(isReady);
  const onCompleteRef = useRef(onComplete);
  const isCompletedRef = useRef(false);

  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const steps: StepItem[] = [
    {
      id: 'ocr',
      title: 'OCR & MRZ Extraction',
      detail: 'Extracting ICAO lines, name, date of birth & document number',
      icon: Scan,
      targetPercent: 28,
    },
    {
      id: 'forensics',
      title: 'Substrate & Forensic Analysis',
      detail: 'Analyzing digital substrate, compression artifacts & UV layers',
      icon: ShieldCheck,
      targetPercent: 55,
    },
    {
      id: 'biometrics',
      title: 'Facial Biometric Matching',
      detail: 'Comparing document portrait with biometric photo',
      icon: UserCheck,
      targetPercent: 82,
    },
    {
      id: 'clearance',
      title: 'Database Registry Clearance',
      detail: 'Checking record clearance against national border database',
      icon: Database,
      targetPercent: 99,
    },
  ];

  useEffect(() => {
    isCompletedRef.current = false;
    const startTime = Date.now();
    const duration = 3200; // Normal, responsive ~3.2s duration

    const checkAndFinish = () => {
      if (isCompletedRef.current) return;
      if (isReadyRef.current) {
        isCompletedRef.current = true;
        setTimeout(() => {
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
        }, 300);
      } else {
        const pollInterval = setInterval(() => {
          if (isReadyRef.current && !isCompletedRef.current) {
            isCompletedRef.current = true;
            clearInterval(pollInterval);
            setTimeout(() => {
              if (onCompleteRef.current) {
                onCompleteRef.current();
              }
            }, 300);
          }
        }, 100);
      }
    };

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const currentVal = Math.min(99, Math.floor(10 + progress * 89));
      setPercent(currentVal);

      if (currentVal < 28) {
        setCurrentStatusMsg('Extracting document MRZ checksums and text fields...');
      } else if (currentVal < 55) {
        setCurrentStatusMsg('Running digital forensic substrate and tampering checks...');
      } else if (currentVal < 82) {
        setCurrentStatusMsg('Matching facial biometrics and verifying portrait similarity...');
      } else if (currentVal < 99) {
        setCurrentStatusMsg('Querying sovereign database & verifying clearance...');
      } else {
        setCurrentStatusMsg('Finalizing inspection report...');
      }

      if (progress >= 1) {
        clearInterval(timer);
        checkAndFinish();
      }
    }, 40);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Verifying Document & Credentials
            </h3>
            <p className="text-xs text-slate-500">
              Analyzing {documentType || 'Travel Document'} • Real-Time Border Check
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-sm font-mono font-bold text-blue-700">
            {percent}% Completed
          </span>
        </div>
      </div>

      {/* Optional Document / Photo Preview Thumbnails */}
      {(previewUrl || personPreviewUrl) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
          {previewUrl && (
            <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="w-16 h-12 bg-slate-100 rounded overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                <img src={previewUrl} alt="Document" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">DOCUMENT SUBSTRATE</span>
                <span className="text-xs font-semibold text-slate-800 truncate block">{documentType}</span>
              </div>
            </div>
          )}

          {personPreviewUrl && (
            <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="w-16 h-12 bg-slate-100 rounded overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                <img src={personPreviewUrl} alt="Person" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">BIOMETRIC SUBJECT</span>
                <span className="text-xs font-semibold text-slate-800 truncate block">Live Capture Verified</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress Bar & Status Text */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-slate-600">
          <span className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
            <span className="truncate">{currentStatusMsg}</span>
          </span>
          <span className="font-mono text-blue-700 font-bold shrink-0">{percent}%</span>
        </div>

        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {steps.map((step) => {
          const isDone = percent >= step.targetPercent;
          const isCurrent =
            percent < step.targetPercent &&
            (step.targetPercent === 28 || percent >= step.targetPercent - 28);
          const IconComponent = step.icon;

          return (
            <div
              key={step.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                isDone
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : isCurrent
                  ? 'bg-blue-50/70 border-blue-200 text-blue-950 ring-1 ring-blue-300'
                  : 'bg-slate-50/60 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 font-bold transition-all ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isDone ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <IconComponent className="w-3.5 h-3.5" />
                  )}
                </div>

                <div className="min-w-0">
                  <span
                    className={`font-semibold text-xs block truncate ${
                      isDone
                        ? 'text-slate-900'
                        : isCurrent
                        ? 'text-blue-900'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className="text-[11px] text-slate-500 block truncate">
                    {step.detail}
                  </span>
                </div>
              </div>

              <div className="shrink-0 ml-2">
                {isDone ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    PASSED
                  </span>
                ) : isCurrent ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    Running...
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-400">
                    Queued
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
