import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Clock,
  User,
  LogOut,
  ChevronDown,
  Shield,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { AuthSessionUser, UserRole } from '../types/society';

interface HeaderProps {
  user: AuthSessionUser | null;
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  onSwitchRole?: (role: UserRole) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentPath,
  onNavigate,
  onLogout,
  onSwitchRole,
}) => {
  const [dateStr, setDateStr] = useState<string>('');
  const [timeStr, setTimeStr] = useState<string>('');
  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);

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

  return (
    <header
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className="bg-white border-b border-[#E1BEE7] shrink-0 z-30 select-none text-[#212121]"
    >
      {/* Top Purple Stripe */}
      <div className="h-[3px] w-full bg-[#4A148C]" />

      {/* Main Top Header */}
      <div className="h-16 px-4 md:px-8 flex items-center justify-between gap-4">
        {/* Left: Brand / Society Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[4px] bg-[#4A148C] text-white flex items-center justify-center shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[20px] font-bold text-[#4A148C] leading-none tracking-tight">
                Visi0nx Smart Society Portal
              </span>
            </div>
            <p className="text-[12px] text-[#616161] mt-0.5">
              Society ID: <strong className="text-[#310C61]">{user?.society_id || 'SOC-PUNE-01'}</strong> • 12-Table Supabase Connected
            </p>
          </div>
        </div>

        {/* Center: Live Clock & Gov Branding */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="text-center">
            <span className="text-[15px] font-bold text-[#310C61] block leading-tight">
              भारत सरकार | Government of India
            </span>
            <span className="text-[11px] text-[#757575]">
              Digital Governance & Housing Society Infrastructure
            </span>
          </div>

          <div className="h-8 w-px bg-[#E1BEE7]" />

          <div className="flex items-center gap-2 text-[13px] text-[#616161]">
            <Clock className="w-4 h-4 text-[#6A1B9A]" />
            <span className="font-bold text-[#212121]">{timeStr}</span>
            <span>({dateStr})</span>
          </div>
        </div>

        {/* Right: Role Switcher & User Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Role Switcher */}
          {onSwitchRole && (
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="px-3 py-1.5 bg-[#FAF8FC] hover:bg-[#F3E5F5] border border-[#CE93D8] rounded-[4px] text-[13px] font-bold text-[#4A148C] flex items-center gap-1.5 cursor-pointer uppercase transition-colors"
              >
                <span>Role: {user?.role || 'ADMIN'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-[#CE93D8] rounded-[4px] shadow-lg py-1 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-[#757575] uppercase border-b border-[#E1BEE7]">
                    Switch Perspective
                  </div>
                  <button
                    onClick={() => {
                      onSwitchRole('ADMIN');
                      setShowRoleMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-[13px] font-bold hover:bg-[#FAF8FC] text-[#4A148C] flex items-center justify-between"
                  >
                    <span>Admin Module</span>
                    {user?.role === 'ADMIN' && <span className="text-xs">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      onSwitchRole('RESIDENT');
                      setShowRoleMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-[13px] font-bold hover:bg-[#FAF8FC] text-[#4A148C] flex items-center justify-between"
                  >
                    <span>Resident Module</span>
                    {user?.role === 'RESIDENT' && <span className="text-xs">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      onSwitchRole('SECURITY');
                      setShowRoleMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-[13px] font-bold hover:bg-[#FAF8FC] text-[#4A148C] flex items-center justify-between"
                  >
                    <span>Security & Gate</span>
                    {user?.role === 'SECURITY' && <span className="text-xs">✓</span>}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* User Name Tag */}
          <div className="hidden sm:block text-right">
            <span className="text-[14px] font-bold text-[#212121] block leading-tight">
              {user?.name || 'Authorized Officer'}
            </span>
            <span className="text-[11px] text-[#6A1B9A] font-bold">
              {user?.role === 'RESIDENT'
                ? `Flat ${user?.flat || '101'} (Tower ${user?.tower || 'A'})`
                : user?.role === 'SECURITY'
                ? `Gate Security (${user?.shift || 'Morning'})`
                : 'Super Administrator'}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="p-2 text-[#757575] hover:text-[#C62828] hover:bg-[#FFEBEE] rounded-[4px] cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
