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
  ShieldCheck,
  ShieldX,
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
    second: '2-digit',
    hour12: false,
  });

  const isExpired = evalResult.isExpired;
  const isExpiringSoon = evalResult.isExpiringSoon;

  // Theme styling based on true expiry state
  const containerClasses = isExpired
    ? 'bg-rose-50/90 border-rose-300 text-rose-950'
    : isExpiringSoon
    ? 'bg-amber-50/90 border-amber-300 text-amber-950'
    : 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534]';

  return (
    <div className={`rounded-xl border p-5 shadow-xs transition-colors space-y-4 ${containerClasses} ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-current/15">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl text-white shadow-xs ${
            isExpired ? 'bg-rose-600' : isExpiringSoon ? 'bg-amber-600' : 'bg-emerald-600'
          }`}>
            {isExpired ? (
              <ShieldX className="w-5 h-5" />
            ) : isExpiringSoon ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider">
                Real-Time Document Expiry Monitor
              </h4>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider shadow-2xs ${
                isExpired
                  ? 'bg-rose-200 text-rose-900 border border-rose-300'
                  : isExpiringSoon
                  ? 'bg-amber-200 text-amber-900 border border-amber-300'
                  : 'bg-white/80 text-emerald-900 border border-emerald-200'
              }`}>
                {isExpired ? 'EXPIRED DOCUMENT' : isExpiringSoon ? 'EXPIRING SOON' : 'LIVE TIMELINE'}
              </span>
            </div>
            <span className="text-[11px] opacity-80 block mt-0.5">
              Automated sovereign comparison of document validity against real-time system clock
            </span>
          </div>
        </div>

        {/* Live Clock Badge */}
        <div className="flex items-center gap-2 text-xs font-mono bg-white/90 px-3.5 py-1.5 rounded-xl border border-current/20 self-start sm:self-auto shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-[#0B3D91]" />
          <div className="leading-tight">
            <span className="text-[9px] opacity-60 uppercase font-bold block">
              Reference Time (Local)
            </span>
            <span className="font-bold text-slate-900 text-xs">
              {evalResult.currentReferenceFormatted} • {formattedLocalTime}
            </span>
          </div>
        </div>
      </div>

      {/* Main Status Callout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Document Expiry Date */}
        <div className="p-3.5 rounded-xl bg-white/90 border border-current/20 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase opacity-75">
            <Calendar className="w-3.5 h-3.5" />
            <span>Document Expiry Date</span>
          </div>
          <div className="text-base font-black font-mono text-slate-900">
            {evalResult.visualDate}
          </div>
          <div className="text-[10px] font-mono opacity-70">
            ISO: {evalResult.expiryIso}
          </div>
        </div>

        {/* Card 2: Timeline Variance */}
        <div className="p-3.5 rounded-xl bg-white/90 border border-current/20 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase opacity-75">
            <Hourglass className="w-3.5 h-3.5" />
            <span>Timeline Variance</span>
          </div>
          <div className={`text-base font-black font-mono ${
            isExpired ? 'text-rose-700' : isExpiringSoon ? 'text-amber-700' : 'text-emerald-700'
          }`}>
            {isExpired
              ? `${Math.abs(evalResult.diffDays).toLocaleString()} Days Expired`
              : `${evalResult.diffDays.toLocaleString()} Days Remaining`}
          </div>
          <div className="text-[10px] font-medium opacity-80 truncate">
            {evalResult.relativeTimeText}
          </div>
        </div>

        {/* Card 3: Clearance Verdict */}
        <div className="p-3.5 rounded-xl bg-white/90 border border-current/20 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase opacity-75">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Border Clearance Verdict</span>
          </div>
          <div className={`text-sm font-black uppercase tracking-wide flex items-center gap-1.5 ${
            isExpired ? 'text-rose-700' : isExpiringSoon ? 'text-amber-700' : 'text-emerald-700'
          }`}>
            {isExpired ? (
              <>
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>CLEARANCE DENIED</span>
              </>
            ) : isExpiringSoon ? (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>EXPIRY WARNING</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>VALID FOR TRAVEL</span>
              </>
            )}
          </div>
          <div className={`text-[10px] font-bold uppercase opacity-80 truncate ${
            isExpired ? 'text-rose-800' : isExpiringSoon ? 'text-amber-800' : 'text-emerald-800'
          }`}>
            {evalResult.statusLabel}
          </div>
        </div>
      </div>

      {/* Visual Timeline Bar */}
      <div className="p-4 rounded-xl bg-white/90 border border-current/15 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="flex items-center gap-1.5 opacity-80">
            <span>Issuance Timeline</span>
            <ArrowRight className="w-3 h-3" />
          </span>
          <span className={`font-mono font-bold text-xs ${
            isExpired ? 'text-rose-700' : isExpiringSoon ? 'text-amber-700' : 'text-emerald-800'
          }`}>
            {isExpired
              ? '❌ EXPIRED: Document validity expired on system timeline'
              : isExpiringSoon
              ? '⚠️ EXPIRING SOON: Validity window < 6 months'
              : '✅ ACTIVE: Document validity active and cleared for travel'}
          </span>
        </div>

        {/* Timeline Bar Track */}
        <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
          {isExpired ? (
            <div className="h-full rounded-full bg-rose-600 w-full" />
          ) : isExpiringSoon ? (
            <div className="h-full rounded-full bg-amber-500 w-4/5" />
          ) : (
            <div className="h-full rounded-full bg-emerald-500 w-2/3" />
          )}
        </div>

        {/* Timeline Labels */}
        <div className="flex items-center justify-between text-[10px] font-mono font-medium text-slate-500 pt-0.5">
          <span>Issuance</span>
          {isExpired ? (
            <>
              <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Expiry: {evalResult.visualDate}
              </span>
              <span className="font-bold text-slate-900">
                Today: {evalResult.currentReferenceFormatted}
              </span>
            </>
          ) : (
            <>
              <span className="font-bold text-slate-900">
                Today: {evalResult.currentReferenceFormatted}
              </span>
              <span className="font-bold text-emerald-800">
                Expiry: {evalResult.visualDate}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Detailed Notice Banner */}
      <div className={`pt-3 border-t border-current/15 flex items-start gap-2 text-xs font-medium ${
        isExpired ? 'text-rose-950' : isExpiringSoon ? 'text-amber-950' : 'text-emerald-950'
      }`}>
        {isExpired ? (
          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        ) : isExpiringSoon ? (
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
