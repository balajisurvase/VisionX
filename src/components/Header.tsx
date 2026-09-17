import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
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
    : 'VX';

  return (
    <header
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className="relative bg-white border-b border-[#C9DCF8] shrink-0 z-20 text-[#10233F]"
    >
      <div className="h-[3px] w-full bg-[#2563EB]" />

      <div className="h-16 px-6 flex items-center justify-between">
        {/* Left: Page Title & Status */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-[20px] font-bold text-[#10233F] tracking-tight truncate">
                {title}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-[13px] font-bold bg-[#DCFCE7] text-[#15803D] border border-green-300">
                <span className="w-2 h-2 rounded-full bg-[#15803D]" />
                SYSTEM ONLINE
              </span>
            </div>
            {subtitle && (
              <p className="text-[14px] text-[#64748B] font-normal truncate max-w-xl mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Details: Date, Officer Info */}
        <div className="flex items-center gap-5 shrink-0">
          {/* Date & Time */}
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[14px] font-bold text-[#10233F] flex items-center gap-1.5 justify-end">
              <Clock className="w-4 h-4 text-[#2563EB]" />
              {timeStr || '10:00 AM'}
            </span>
            <span className="text-[12px] text-[#64748B] font-normal">
              {dateStr || 'Thu, Sep 17, 2026'}
            </span>
          </div>

          <div className="h-8 w-px bg-[#C9DCF8] hidden md:block" />

          {/* Officer info & Initials */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[15px] font-bold text-[#10233F]">
                {user?.full_name || 'Authorized Officer'}
              </span>
              <span className="text-[13px] text-[#2563EB] font-bold">
                {user?.user_id || 'A001'} • Officer
              </span>
            </div>

            <div
              className="w-10 h-10 rounded-[6px] bg-[#102A56] text-white flex items-center justify-center font-bold text-[15px]"
              title={user?.full_name || 'Officer'}
            >
              {initials}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
