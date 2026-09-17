import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface VerificationProgressBarProps {
  onComplete?: () => void;
  documentType: string;
}

export const VerificationProgressBar: React.FC<VerificationProgressBarProps> = ({
  documentType,
}) => {
  const [stageIndex, setStageIndex] = useState<number>(0);
  const [percent, setPercent] = useState<number>(5);

  const steps = [
    { title: 'Document Scan', desc: 'Checking layout & quality' },
    { title: 'Text & MRZ', desc: 'Reading document fields' },
    { title: 'Checksums', desc: 'Verifying cryptographic codes' },
    { title: 'Forensics', desc: 'Analyzing image authenticity' },
    { title: 'Biometrics', desc: 'Comparing photo identity' },
    { title: 'Result', desc: 'Finalizing verification report' },
  ];

  useEffect(() => {
    const startTime = Date.now();
    const duration = 2400; // 2.4 seconds

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentPercent = Math.min(100, Math.round((elapsed / duration) * 100));
      setPercent(currentPercent);

      const idx = Math.min(
        Math.floor((currentPercent / 100) * steps.length),
        steps.length - 1
      );
      setStageIndex(idx);

      if (currentPercent >= 100) {
        clearInterval(timer);
      }
    }, 40);

    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className="bg-white border border-[#C9DCF8] rounded-[10px] p-6 max-w-4xl mx-auto shadow-sm text-[#10233F] space-y-6"
    >
      {/* NORMAL CLEAN SPINNER & HEADING */}
      <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div className="w-14 h-14 rounded-full bg-[#EAF2FF] border border-[#C9DCF8] flex items-center justify-center shrink-0">
          <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-[22px] font-bold text-[#10233F] uppercase tracking-tight">
            Verifying {documentType}
          </h2>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Please wait while the system verifies document authenticity and security checks...
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[28px] font-bold text-[#2563EB] font-mono leading-none">
            {percent}%
          </span>
          <span className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mt-0.5">
            Progress
          </span>
        </div>
      </div>

      {/* NORMAL HORIZONTAL PROGRESS BAR */}
      <div className="space-y-2">
        <div className="w-full h-3 bg-[#F1F5F9] rounded-full overflow-hidden border border-[#C9DCF8]">
          <div
            className="h-full bg-[#2563EB] rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[13px] text-[#64748B]">
          <span>
            Current step:{' '}
            <strong className="text-[#10233F] font-bold">
              {steps[stageIndex].title}
            </strong>{' '}
            — {steps[stageIndex].desc}
          </span>
          <span className="font-medium text-[#2563EB]">
            Step {stageIndex + 1} of {steps.length}
          </span>
        </div>
      </div>

      {/* NORMAL HORIZONTAL STEP CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 border-t border-[#E2E8F0]">
        {steps.map((st, idx) => {
          const isDone = idx < stageIndex;
          const isCurrent = idx === stageIndex;

          return (
            <div
              key={st.title}
              className={`p-2.5 rounded-[6px] border text-center flex flex-col items-center justify-center gap-1.5 transition-colors ${
                isDone
                  ? 'bg-[#F0FDF4] border-emerald-300 text-emerald-800'
                  : isCurrent
                  ? 'bg-[#EFF6FF] border-[#2563EB] text-[#10233F] ring-1 ring-[#2563EB]/30'
                  : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  isDone
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-[#E2E8F0] text-[#64748B]'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  idx + 1
                )}
              </div>

              <div className="w-full">
                <p
                  className={`text-[12px] font-bold truncate leading-tight ${
                    isDone
                      ? 'text-emerald-800'
                      : isCurrent
                      ? 'text-[#2563EB]'
                      : 'text-[#64748B]'
                  }`}
                >
                  {st.title}
                </p>
                <span
                  className={`text-[10px] font-medium block truncate ${
                    isDone
                      ? 'text-emerald-600'
                      : isCurrent
                      ? 'text-[#2563EB]'
                      : 'text-[#94A3B8]'
                  }`}
                >
                  {isDone ? 'Completed' : isCurrent ? 'Checking...' : 'Pending'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
