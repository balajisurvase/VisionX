import React from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  History,
  FileText,
  User,
  Settings,
  LogOut,
  ShieldAlert,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { OfficerUser } from '../types/auth';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  user: OfficerUser | null;
  onLogout: () => void;
  onViewLanding?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  user,
  onLogout,
  onViewLanding,
}) => {
  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: 'New Verification',
      path: '/verify',
      icon: ShieldCheck,
      badge: 'LIVE',
    },
    {
      label: 'History',
      path: '/history',
      icon: History,
      badge: null,
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: FileText,
      badge: null,
    },
    {
      label: 'Profile',
      path: '/profile',
      icon: User,
      badge: null,
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-[230px] bg-[#0B1220] text-slate-100 flex flex-col h-screen shrink-0 select-none z-30 font-sans border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold shadow-md shadow-blue-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
              <span>IdentityGuard AI</span>
            </h1>
            <p className="text-[11px] text-slate-400 truncate">
              SIH 2026 Prototype
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Operations
        </div>

        {navItems.map((item) => {
          const isActive =
            currentPath === item.path ||
            (item.path === '/dashboard' && (currentPath === '/' || currentPath === ''));
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              id={`nav-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Link to System Overview / Landing */}
        {onViewLanding && (
          <div className="pt-2">
            <button
              onClick={onViewLanding}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-blue-400 hover:bg-slate-800/40 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                <span>Landing Page</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Specs</span>
            </button>
          </div>
        )}
      </nav>

      {/* Bottom Officer Account Card & Sign Out */}
      <div className="p-3 border-t border-slate-800 bg-[#070B14] space-y-2">
        <div
          onClick={() => onNavigate('/profile')}
          className="px-2.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5 cursor-pointer hover:border-slate-700 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            {user?.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'IG'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">
              {user?.full_name || 'Insp. Rajeshwar'}
            </div>
            <p className="text-[10px] text-slate-400 font-mono truncate">
              {user?.user_id || 'officer001'} • {user?.role || 'Officer'}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          id="btn-sidebar-logout"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
