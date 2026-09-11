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
          second: '2-digit',
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
    <header className="h-16 bg-white border-b border-gray-100 px-6 flex items-center justify-between shrink-0 z-20 font-sans shadow-xs">
      {/* Page Context */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-[#111827] tracking-tight">
              {title}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EEF2FF] text-[#4F46E5]">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              ICP Raxaul Terminal 01
            </span>
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 font-normal mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Details: Date, Officer, Initials Avatar */}
      <div className="flex items-center gap-4">
        {/* Date & Time */}
        <div className="hidden md:flex flex-col text-right">
          <span className="text-xs font-semibold text-[#111827] flex items-center gap-1 justify-end">
            <Clock className="w-3 h-3 text-gray-400" />
            {timeStr || '03:45 PM'}
          </span>
          <span className="text-[11px] text-gray-500 font-medium">
            {dateStr || 'Sat, Sep 5, 2026'}
          </span>
        </div>

        <div className="h-8 w-px bg-gray-200 hidden md:block" />

        {/* Officer info & Initials on Indigo */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-[#111827] leading-snug">
              {user?.full_name || 'Inspector Rajeshwar'}
            </span>
            <span className="text-[11px] text-gray-500 font-mono">
              {user?.user_id || 'officer001'}
            </span>
          </div>

          <div
            className="w-9 h-9 rounded-full bg-[#4F46E5] text-white flex items-center justify-center font-bold text-xs shadow-xs"
            title={user?.full_name || 'Officer'}
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
};
