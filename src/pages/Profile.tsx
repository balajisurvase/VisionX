import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Award,
  Key,
  Database,
  Building2,
  Calendar,
  Terminal,
} from 'lucide-react';
import { OfficerUser } from '../types/auth';
import { VerificationStats } from '../types/verification';
import { getDashboardMetrics } from '../services/verificationService';

interface ProfileProps {
  user: OfficerUser | null;
  onLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const [stats, setStats] = useState<VerificationStats>({
    totalChecked: 142,
    verified: 118,
    suspicious: 16,
    failed: 8,
    avgRiskScore: 18.4,
  });

  useEffect(() => {
    getDashboardMetrics().then((data) => {
      if (data && data.totalChecked > 0) {
        setStats(data);
      }
    });
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 font-sans text-slate-900">
      {/* Officer Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md shadow-blue-500/20 shrink-0">
            {user?.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'IG'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">
                {user?.full_name || 'Inspector Rajeshwar Singh'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {user?.role || 'Screening Officer'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              User ID: <span className="font-bold text-slate-800">{user?.user_id || 'A001'}</span> • {user?.department || 'Border Screening & Forensic Analysis'}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {user?.terminal || 'ICP Raxaul (Indo-Nepal)'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Last Login: Today, 09:30 AM
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onLogout}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Verification Statistics Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Officer Verification Statistics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500">Total Verifications</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalChecked}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Lifetime documents screened</div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-emerald-600">Verified (Low Risk)</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{stats.verified}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Cleared at primary gate</div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-amber-600">Suspicious (Medium)</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{stats.suspicious}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Referred for secondary audit</div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-red-600">Rejected (High Risk)</div>
            <div className="text-2xl font-black text-red-600 mt-1">{stats.failed}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Forged or tampered docs</div>
          </div>
        </div>
      </div>

      {/* Role & Terminal Permissions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Assigned Operational Permissions</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-700">Document OCR & MRZ Screening</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">AUTHORIZED</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-700">OpenCV Error Level Analysis (ELA)</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">AUTHORIZED</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-700">1:1 Biometric Desk Verification</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">AUTHORIZED</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-700">Official Report Generation & Export</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">AUTHORIZED</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Terminal className="w-4 h-4 text-indigo-600" />
            <span>Terminal Specifications</span>
          </div>

          <div className="space-y-2 text-xs text-slate-600 font-mono">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-400">Terminal Node ID:</span>
              <span className="font-bold text-slate-800">ICP-RAX-NODE-01</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-400">IP Binding:</span>
              <span className="font-bold text-slate-800">10.14.82.101 (Intranet)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-400">Ledger Hash Standard:</span>
              <span className="font-bold text-slate-800">SHA-256 Tamper-Proof</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-400">Database Backend:</span>
              <span className="font-bold text-slate-800">Supabase PostgreSQL</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">System Version:</span>
              <span className="font-bold text-slate-800">IdentityGuard Enterprise v2.4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
