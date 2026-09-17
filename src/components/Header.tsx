import React, { useState, useEffect } from 'react';
import { Radio, Clock } from 'lucide-react';
import { OfficerUser } from '../types/auth';

interface HeaderProps {
  title: string;
  subtitle?: string;
  user: OfficerUser | null;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, user }) => {
  const [dateStr, setDateStr] = useState<string>('');
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'RK';

  return (
    <header className="h-16 bg-[#090D16] border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0 z-20 font-sans text-slate-100 shadow-sm">
      {/* Page Context */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-white tracking-tight">
              {title}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Terminal Active
            </span>
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 font-normal mt-0.5 truncate max-w-xl">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Details: Date, Officer, Initials Avatar */}
      <div className="flex items-center gap-4">
        {/* Date & Time */}
        <div className="hidden md:flex flex-col text-right">
          <span className="text-xs font-mono font-semibold text-slate-200 flex items-center gap-1.5 justify-end">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            {timeStr || '03:45 PM'}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {dateStr || 'Sat, Sep 5, 2026'}
          </span>
        </div>

        <div className="h-7 w-px bg-slate-800 hidden md:block" />

        {/* Officer info & Initials */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-white leading-snug">
              {user?.full_name || 'Inspector Rajeshwar'}
            </span>
            <span className="text-[10px] text-blue-400 font-mono font-semibold">
              {user?.user_id || 'officer001'}
            </span>
          </div>

          <div
            className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-600/30 border border-blue-500/30"
            title={user?.full_name || 'Officer'}
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
};
