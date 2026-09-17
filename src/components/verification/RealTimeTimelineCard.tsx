import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Hourglass,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { evaluateRealTimeExpiry, ExpiryEvaluation } from '../../utils/mrzUtils';

interface RealTimeTimelineCardProps {
  expiryDateStr: string | null | undefined;
  issuanceDateStr?: string | null | undefined;
  dobDateStr?: string | null | undefined;
  documentType?: string;
  className?: string;
}

export const RealTimeTimelineCard: React.FC<RealTimeTimelineCardProps> = ({
  expiryDateStr,
  issuanceDateStr,
  dobDateStr,
  documentType = 'Travel Document',
  className = '',
}) => {
  const [currentClock, setCurrentClock] = useState<Date>(new Date());

  // Keep live second ticker active for real-time fidelity
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentClock(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const evalResult: ExpiryEvaluation = evaluateRealTimeExpiry(expiryDateStr, currentClock);

  const formattedLocalTime = currentClock.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // Calculate timeline percentage (default 10-year lifespan for passports)
  // If expired, percentage is > 100%
  let progressPercent = 50;
  if (evalResult.isExpired) {
    // 100% or more
    progressPercent = 100;
  } else {
    // assume typical 10-year (3650 days) total lifespan
    const totalAssumedDays = 3650;
    const remainingDays = Math.max(0, evalResult.diffDays);
    const passedDays = Math.max(0, totalAssumedDays - remainingDays);
    progressPercent = Math.min(95, Math.max(5, Math.round((passedDays / totalAssumedDays) * 100)));
  }

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        evalResult.isExpired
          ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
          : evalResult.isExpiringSoon
          ? 'bg-[#FFFBEB] border-[#FCD34D] text-[#92400E]'
          : 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534]'
      } ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-current/15">
        <div className="flex items-center gap-2">
          {evalResult.isExpired ? (
            <div className="p-1.5 rounded-lg bg-red-600 text-white shadow-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
          ) : evalResult.isExpiringSoon ? (
            <div className="p-1.5 rounded-lg bg-amber-600 text-white shadow-xs">
              <Hourglass className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black uppercase tracking-wider">
                Real-Time Document Expiry Monitor
              </h4>
              <span className="text-[10px] px-2 py-0.2 rounded-full font-bold uppercase tracking-wider bg-white/70 shadow-2xs">
                Live Timeline
              </span>
            </div>
            <span className="text-[11px] opacity-80 block">
              Automated sovereign comparison of document validity against real-time system timeline
            </span>
          </div>
        </div>

        {/* Live Clock Badge */}
        <div className="flex items-center gap-2 text-xs font-mono bg-white/80 px-3 py-1.5 rounded-lg border border-current/20 self-start sm:self-auto shadow-2xs">
          <Clock className="w-3.5 h-3.5 opacity-70 animate-pulse" />
          <div className="leading-tight">
            <span className="text-[10px] opacity-60 uppercase font-bold block">
              Reference Time (Local)
            </span>
            <span className="font-bold text-gray-900 text-xs">
              {evalResult.currentReferenceFormatted} • {formattedLocalTime}
            </span>
          </div>
        </div>
      </div>

      {/* Main Status Callout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-3">
        {/* Card 1: Document Expiry Date */}
        <div className="p-3 rounded-lg bg-white/90 border border-current/20 shadow-2xs">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase opacity-75">
            <Calendar className="w-3 h-3" />
            <span>Document Expiry Date</span>
          </div>
          <div className="text-sm font-black mt-1 font-mono text-gray-900">
            {evalResult.visualDate}
          </div>
          <div className="text-[10px] font-mono opacity-70">
            ISO: {evalResult.expiryIso}
          </div>
        </div>

        {/* Card 2: Timeline Variance */}
        <div className="p-3 rounded-lg bg-white/90 border border-current/20 shadow-2xs">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase opacity-75">
            <Hourglass className="w-3 h-3" />
            <span>Timeline Variance</span>
          </div>
          <div
            className={`text-sm font-black mt-1 font-mono ${
              evalResult.isExpired ? 'text-red-700' : 'text-emerald-700'
            }`}
          >
            {evalResult.diffDays < 0
              ? `${Math.abs(evalResult.diffDays).toLocaleString()} Days Lapsed`
              : `${evalResult.diffDays.toLocaleString()} Days Remaining`}
          </div>
          <div className="text-[10px] font-medium opacity-80 truncate">
            {evalResult.relativeTimeText}
          </div>
        </div>

        {/* Card 3: Clearance Verdict */}
        <div className="p-3 rounded-lg bg-white/90 border border-current/20 shadow-2xs">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase opacity-75">
            <Sparkles className="w-3 h-3" />
            <span>Border Clearance Verdict</span>
          </div>
          <div
            className={`text-sm font-black mt-1 uppercase tracking-wide flex items-center gap-1.5 ${
              evalResult.isExpired
                ? 'text-red-700'
                : evalResult.isExpiringSoon
                ? 'text-amber-700'
                : 'text-emerald-700'
            }`}
          >
            {evalResult.isExpired ? (
              <>
                <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>CLEARANCE DENIED</span>
              </>
            ) : evalResult.isExpiringSoon ? (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>ADVISORY WARNING</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>VALID FOR TRAVEL</span>
              </>
            )}
          </div>
          <div className="text-[10px] font-bold uppercase opacity-75 truncate">
            {evalResult.statusLabel}
          </div>
        </div>
      </div>

      {/* Visual Timeline Bar */}
      <div className="p-3 rounded-lg bg-white/85 border border-current/15 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="flex items-center gap-1 opacity-80">
            <span>Issuance Timeline</span>
            <ArrowRight className="w-3 h-3" />
          </span>
          <span className="font-mono text-gray-700">
            {evalResult.isExpired
              ? `❌ EXPIRED: Timeline breached by ${Math.abs(evalResult.diffDays)} days`
              : `✅ ACTIVE: ${evalResult.diffDays} days within validity`}
          </span>
        </div>

        {/* Timeline Bar Track */}
        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          {evalResult.isExpired ? (
            <div
              className="h-full bg-red-600 rounded-full transition-all w-full animate-pulse"
              title="Document validity timeline expired"
            />
          ) : (
            <div
              className={`h-full rounded-full transition-all ${
                evalResult.isExpiringSoon ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          )}
        </div>

        {/* Timeline Labels */}
        <div className="flex items-center justify-between text-[10px] font-mono font-medium text-gray-500 pt-0.5">
          <span>Past Issuance</span>
          <span className="font-bold text-gray-900">
            Today: {evalResult.currentReferenceFormatted}
          </span>
          <span className={evalResult.isExpired ? 'font-bold text-red-600' : 'font-bold text-gray-900'}>
            Expiry: {evalResult.visualDate}
          </span>
        </div>
      </div>

      {/* Detailed Notice Banner */}
      <div className="mt-3 pt-2.5 border-t border-current/15 flex items-start gap-2 text-xs font-medium">
        {evalResult.isExpired ? (
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        ) : evalResult.isExpiringSoon ? (
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        )}
        <p className="leading-relaxed">
          {evalResult.detailedNotice}
        </p>
      </div>
    </div>
  );
};
