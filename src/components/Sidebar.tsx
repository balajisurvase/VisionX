import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  History,
  FileText,
  User,
  Settings,
  LogOut,
  ShieldAlert,
  HelpCircle,
  X,
  CheckCircle2,
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
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

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
      label: 'Verification History',
      path: '/history',
      icon: History,
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: FileText,
    },
  ];

  const accountNavItems = [
    {
      label: 'Profile',
      path: '/profile',
      icon: User,
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: Settings,
    },
  ];

  return (
    <>
      <aside className="w-[240px] bg-[#0F172A] text-slate-100 flex flex-col h-screen shrink-0 select-none z-30 font-sans border-r border-slate-800">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-black tracking-wider text-white uppercase">
                IdentityGuard
              </h1>
              <p className="text-[11px] text-slate-400 truncate">
                Identity & Document Verification
              </p>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {/* Operations Section */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Operations
            </div>

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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Account Section */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Account
            </div>

            {accountNavItems.map((item) => {
              const isActive = currentPath === item.path;
              const Icon = item.icon;

              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  id={`nav-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Support Section */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Support
            </div>
            <button
              onClick={() => setShowHelpModal(true)}
              id="nav-item-help-support"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer text-left"
            >
              <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Help & Support</span>
            </button>
          </div>
        </nav>

        {/* Bottom Officer Account Card & Sign Out */}
        <div className="p-3 border-t border-slate-800 bg-[#090E1A] space-y-2">
          <div
            onClick={() => onNavigate('/profile')}
            className="px-2.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5 cursor-pointer hover:border-slate-700 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {user?.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'IG'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                {user?.full_name || 'Verification Officer'}
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
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Help & Support Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">IdentityGuard Help & Support</h3>
                  <p className="text-xs text-slate-500">Quick Guide for Verification Officers</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>How to verify a document</span>
                </div>
                <p>
                  1. Click <strong>New Verification</strong> in the navigation.
                  <br />
                  2. Select the document type (Passport, National ID, or Driving Licence).
                  <br />
                  3. Upload a clear document scan (JPG, PNG, or PDF).
                  <br />
                  4. Review details and click <strong>Start Verification</strong>.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Understanding results</span>
                </div>
                <p>
                  • <strong>Verified (Low Risk):</strong> All integrity and format checks passed.
                  <br />
                  • <strong>Needs Review (Medium Risk):</strong> Potential anomalies detected. Manual review recommended.
                  <br />
                  • <strong>Rejected (High Risk):</strong> Critical validation or tampering issues detected.
                </p>
              </div>

              <div className="text-[11px] text-slate-500 text-center pt-2 border-t border-slate-100">
                IdentityGuard v2.4 • Identity & Document Verification Platform
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

