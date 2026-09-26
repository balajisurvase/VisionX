import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  AlertCircle,
  ShieldCheck,
  DollarSign,
  Bell,
  MessageSquare,
  Settings,
  LogOut,
  Building2,
} from 'lucide-react';
import { AuthSessionUser } from '../types/society';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  user: AuthSessionUser | null;
  onLogout: () => void;
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
      roles: ['ADMIN', 'RESIDENT', 'SECURITY'],
    },
    {
      label: 'Residents',
      path: '/residents',
      icon: Users,
      roles: ['ADMIN', 'SECURITY'],
    },
    {
      label: 'Amenities & Bookings',
      path: '/bookings',
      icon: Calendar,
      roles: ['ADMIN', 'RESIDENT'],
    },
    {
      label: 'Maintenance Billing',
      path: '/maintenance',
      icon: CreditCard,
      roles: ['ADMIN', 'RESIDENT'],
    },
    {
      label: 'Complaints Desk',
      path: '/complaints',
      icon: AlertCircle,
      roles: ['ADMIN', 'RESIDENT'],
    },
    {
      label: 'Gate & Visitors',
      path: '/visitors',
      icon: ShieldCheck,
      roles: ['ADMIN', 'SECURITY', 'RESIDENT'],
    },
    {
      label: 'Finance Ledger',
      path: '/finance',
      icon: DollarSign,
      roles: ['ADMIN'],
    },
    {
      label: 'Notice Board',
      path: '/notices',
      icon: Bell,
      roles: ['ADMIN', 'RESIDENT', 'SECURITY'],
    },
    {
      label: 'Communications',
      path: '/communications',
      icon: MessageSquare,
      roles: ['ADMIN', 'RESIDENT', 'SECURITY'],
    },
    {
      label: 'Supabase Status',
      path: '/settings',
      icon: Settings,
      roles: ['ADMIN', 'RESIDENT', 'SECURITY'],
    },
  ];

  const allowedNavItems = mainNavItems.filter(
    (item) => !user?.role || item.roles.includes(user.role)
  );

  return (
    <aside
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className="w-[250px] bg-[#310C61] text-white flex flex-col h-screen shrink-0 select-none z-30 border-r border-[#4A148C] overflow-hidden"
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-[#4A148C] bg-[#220745]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[4px] bg-[#6A1B9A] text-white flex items-center justify-center font-bold shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold tracking-tight text-white uppercase leading-none">
              VISI0NX
            </h1>
            <p className="text-[11px] text-purple-200 mt-0.5 font-normal">
              Smart Society Portal
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation - Scrollable if items exceed height */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {allowedNavItems.map((item) => {
          const isActive =
            currentPath === item.path ||
            (item.path === '/dashboard' && (currentPath === '/' || currentPath === ''));
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              id={`nav-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-[4px] text-[13.5px] font-bold cursor-pointer text-left transition-colors ${
                isActive
                  ? 'bg-white text-[#4A148C] border-l-4 border-l-[#7B1FA2]'
                  : 'text-purple-100 hover:text-white hover:bg-[#4A148C]'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-[#4A148C]' : 'text-[#CE93D8]'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Session Footer */}
      <div className="p-3 border-t border-[#4A148C] bg-[#220745] shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <span className="text-[13px] font-bold text-white block truncate">
              {user?.name || 'Administrator'}
            </span>
            <span className="text-[11px] text-purple-200 uppercase font-bold">
              {user?.role || 'ADMIN'} • {user?.society_id || 'SOC-PUNE-01'}
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          id="btn-sidebar-logout"
          className="w-full py-1.5 px-3 bg-[#4A148C] hover:bg-[#C62828] text-white text-[12px] font-bold uppercase rounded-[3px] flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
