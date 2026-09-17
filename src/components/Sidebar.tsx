import React from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  History,
  FileText,
  FolderKanban,
  Settings,
  LogOut,
  Sliders,
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
}) => {
  const mainNavItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'New Verification',
      path: '/verify',
      icon: ShieldCheck,
    },
    {
      label: 'Documents',
      path: '/documents',
      icon: FolderKanban,
    },
    {
      label: 'Verification History',
      path: '/history',
      icon: History,
    },
    {
      label: 'Demo Center',
      path: '/demo',
      icon: Sliders,
    },
    {
      label: 'Audit Trail',
      path: '/reports',
      icon: FileText,
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: Settings,
    },
  ];

  return (
    <aside
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className="w-[260px] bg-[#102A56] text-white flex flex-col h-screen shrink-0 select-none z-30 border-r border-[#1e3a6d]"
    >
      {/* Brand Header */}
      <div className="p-6 border-b border-[#1e3a6d] bg-[#0c2145]">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-[#2563EB] shrink-0" />
          <div>
            <h1 className="text-[24px] font-bold tracking-tight text-white uppercase leading-none">
              VISIONX
            </h1>
            <p className="text-[12px] text-[#93C5FD] mt-1 font-normal">
              Identity Verification Terminal
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {mainNavItems.map((item) => {
          const isActive =
            currentPath === item.path ||
            (item.path === '/dashboard' && (currentPath === '/' || currentPath === ''));
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              id={`nav-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-[6px] text-[16px] font-bold cursor-pointer text-left ${
                isActive
                  ? 'bg-white text-[#102A56] border-l-4 border-l-[#2563EB]'
                  : 'text-[#DCEBFF] hover:text-white hover:bg-[#1a386b]'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  isActive ? 'text-[#2563EB]' : 'text-[#93C5FD]'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Officer Account Card & Logout */}
      <div className="p-4 border-t border-[#1e3a6d] bg-[#0c2145] space-y-3">
        <div
          onClick={() => onNavigate('/profile')}
          className="p-3 rounded-[6px] bg-[#102A56] border border-[#1e3a6d] flex items-center gap-3 cursor-pointer hover:border-[#2563EB]"
        >
          <div className="w-9 h-9 rounded bg-[#2563EB] text-white flex items-center justify-center font-bold text-[14px] shrink-0">
            {user?.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'VX'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-bold text-white truncate">
              {user?.full_name || 'Officer User'}
            </div>
            <p className="text-[13px] text-[#93C5FD] truncate">
              {user?.user_id || 'A001'} • Authorized Officer
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          id="btn-sidebar-logout"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-[6px] text-[15px] font-bold text-red-300 hover:text-white hover:bg-red-900/40 border border-red-800/40 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>SIGN OUT</span>
        </button>
      </div>
    </aside>
  );
};
