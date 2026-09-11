import React from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  Files,
  History,
  FlaskConical,
  Settings,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { OfficerUser } from '../types/auth';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  user: OfficerUser | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  user,
  onLogout,
}) => {
  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: 'Verify Document',
      path: '/verify',
      icon: ShieldCheck,
      badge: 'LIVE',
    },
    {
      label: 'Documents',
      path: '/documents',
      icon: Files,
      badge: null,
    },
    {
      label: 'History',
      path: '/history',
      icon: History,
      badge: null,
    },
    {
      label: 'Demo Center',
      path: '/demo',
      icon: FlaskConical,
      badge: 'SIH',
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-[220px] bg-[#0B1220] text-white flex flex-col h-screen shrink-0 select-none z-30 font-sans">
      {/* Brand Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#4F46E5] text-white flex items-center justify-center shrink-0 font-bold shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>VisionX</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-white/15 text-gray-200">
                v2.0
              </span>
            </h1>
            <p className="text-[11px] text-gray-400 truncate">
              SSB Border Control
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          Menu
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
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left ${
                isActive
                  ? 'bg-[#312E81] text-white shadow-xs'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#4F46E5] fill-[#4F46E5]/20 text-white' : 'text-gray-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider ${
                    isActive
                      ? 'bg-[#4F46E5] text-white'
                      : 'bg-white/10 text-gray-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom User Profile Card & Sign Out */}
      <div className="p-3 border-t border-white/10 bg-[#0B1220] space-y-2">
        <div className="px-2.5 py-2 rounded-lg bg-white/5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#4F46E5] text-white flex items-center justify-center font-bold text-xs shrink-0">
            {user?.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'RK'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-white truncate">
              {user?.full_name || 'Insp. Rajeshwar'}
            </div>
            <p className="text-[10px] text-gray-400 font-mono truncate">
              {user?.user_id || 'officer001'}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          id="btn-sidebar-logout"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
