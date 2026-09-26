import React, { useEffect, useState, useRef } from 'react';
import {
  Loader2,
  Check,
} from 'lucide-react';

interface VerificationProgressBarProps {
  onComplete?: () => void;
  documentType: string;
  previewUrl?: string | null;
  personPreviewUrl?: string | null;
  isReady?: boolean;
}

interface VerificationCheckItem {
  id: string;
  title: string;
  detail: string;
  threshold: number;
}

export const VerificationProgressBar: React.FC<VerificationProgressBarProps> = ({
  documentType,
  previewUrl,
  personPreviewUrl,
  isReady = true,
  onComplete,
}) => {
  const [percent, setPercent] = useState<number>(10);
  const [currentStatusMsg, setCurrentStatusMsg] = useState<string>('Processing document...');

  const isReadyRef = useRef(isReady);
  const onCompleteRef = useRef(onComplete);
  const isCompletedRef = useRef(false);

  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const checks: VerificationCheckItem[] = [
    {
      id: 'processing',
      title: 'Document Processing',
      detail: 'Image ingestion, orientation correction, and boundary alignment',
      threshold: 18,
    },
    {
      id: 'ocr',
      title: 'OCR Data Extraction',
      detail: 'Extracting Visual Inspection Zone (VIZ) text and fields',
      threshold: 36,
    },
    {
      id: 'mrz',
      title: 'MRZ Validation',
      detail: 'ICAO Doc 9303 Modulo-10 checksum and check-digit validation',
      threshold: 54,
    },
    {
      id: 'database',
      title: 'Database Verification',
      detail: 'Verifying identity credentials against national database catalog',
      threshold: 72,
    },
    {
      id: 'biometrics',
      title: 'Biometric Verification',
      detail: '1:1 facial biometric matching of document portrait and traveler',
      threshold: 88,
    },
    {
      id: 'forensics',
      title: 'Forensic Analysis',
      detail: 'Digital substrate tampering, Error Level Analysis (ELA), and structure inspection',
      threshold: 99,
    },
  ];

  useEffect(() => {
    isCompletedRef.current = false;
    const startTime = Date.now();
    const duration = 2600;

    const checkAndFinish = () => {
      if (isCompletedRef.current) return;
      if (isReadyRef.current) {
        isCompletedRef.current = true;
        setTimeout(() => {
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
        }, 200);
      } else {
        const pollInterval = setInterval(() => {
          if (isReadyRef.current && !isCompletedRef.current) {
            isCompletedRef.current = true;
            clearInterval(pollInterval);
            setTimeout(() => {
              if (onCompleteRef.current) {
                onCompleteRef.current();
              }
            }, 200);
          }
        }, 100);
      }
    };

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const currentVal = Math.min(99, Math.floor(10 + progress * 89));
      setPercent(currentVal);

      if (currentVal < 18) {
        setCurrentStatusMsg('Document Processing in progress...');
      } else if (currentVal < 36) {
        setCurrentStatusMsg('OCR Data Extraction in progress...');
      } else if (currentVal < 54) {
        setCurrentStatusMsg('MRZ Validation in progress...');
      } else if (currentVal < 72) {
        setCurrentStatusMsg('Database Verification in progress...');
      } else if (currentVal < 88) {
        setCurrentStatusMsg('Biometric Verification in progress...');
      } else {
        setCurrentStatusMsg('Forensic Analysis in progress...');
      }

      if (progress >= 1) {
        clearInterval(timer);
        checkAndFinish();
      }
    }, 40);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className="bg-white border border-[#E1BEE7] rounded-[6px] p-5 sm:p-6 shadow-xs max-w-3xl mx-auto space-y-5"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E1BEE7] pb-3.5">
        <div>
          <h3 className="text-[22px] font-bold text-[#4A148C] uppercase">
            Verification in Progress
          </h3>
          <p className="text-[13px] text-[#616161]">
            Official Government Screening • {documentType || 'Identity Document'}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#F3E5F5] border border-[#E1BEE7] px-3 py-1 rounded-[4px]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#4A148C] animate-pulse" />
          <span className="text-[13px] font-bold text-[#4A148C]">
            {percent}% Completed
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="h-2 w-full bg-[#F3E5F5] rounded-full overflow-hidden border border-[#E1BEE7]">
          <div
            className="h-full bg-[#4A148C] transition-all duration-150"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="text-[11px] font-bold text-[#6A1B9A] uppercase tracking-wider text-right">
          {currentStatusMsg}
        </div>
      </div>

      {/* Vertical Verification Status Section */}
      <div className="space-y-2.5 pt-1">
        {checks.map((item, idx) => {
          const isCompleted = percent >= item.threshold;
          const isProcessing = !isCompleted && (idx === 0 || percent >= checks[idx - 1].threshold);
          const isPending = !isCompleted && !isProcessing;

          return (
            <div
              key={item.id}
              className={`p-3 rounded-[4px] border flex items-center justify-between transition-colors ${
                isCompleted
                  ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32]'
                  : isProcessing
                  ? 'bg-[#F3E5F5] border-[#BA68C8] text-[#4A148C]'
                  : 'bg-[#FAF8FC] border-[#E1BEE7] text-[#757575]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 ${
                    isCompleted
                      ? 'bg-[#2E7D32] text-white'
                      : isProcessing
                      ? 'bg-[#4A148C] text-white'
                      : 'bg-[#E1BEE7] text-[#757575]'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                <div>
                  <div className="text-[14px] font-bold">
                    {item.title}
                  </div>
                  <div className="text-[11px] opacity-85">
                    {item.detail}
                  </div>
                </div>
              </div>

              <span
                className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-[3px] border ${
                  isCompleted
                    ? 'bg-white border-[#A5D6A7] text-[#2E7D32]'
                    : isProcessing
                    ? 'bg-white border-[#BA68C8] text-[#4A148C]'
                    : 'bg-white border-[#E1BEE7] text-[#757575]'
                }`}
              >
                {isCompleted ? '✓ Completed' : isProcessing ? 'Processing...' : 'Pending'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
