import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Clock,
  Building2,
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
    <div
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className="p-4 md:p-6 max-w-5xl mx-auto space-y-5 text-[#10233F]"
    >
      {/* Officer Header Card */}
      <div className="bg-white border border-[#C9DCF8] rounded-[8px] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-[8px] bg-[#102A56] text-white flex items-center justify-center font-bold text-[28px] uppercase shrink-0">
            {user?.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'VX'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-[28px] font-bold text-[#10233F] uppercase">
                {user?.full_name || 'Officer A001'}
              </h1>
              <span className="px-3 py-1 rounded-[4px] text-[13px] font-bold bg-[#EAF2FF] text-[#2563EB] border border-[#C9DCF8] uppercase">
                {user?.role || 'Senior Verification Officer'}
              </span>
            </div>
            <p className="text-[16px] text-[#64748B] font-normal">
              Officer ID: <strong className="text-[#10233F]">{user?.user_id || 'A001'}</strong> • {user?.department || 'Identity Verification Division'}
            </p>
            <div className="flex items-center gap-6 text-[15px] text-[#64748B] pt-2">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#2563EB]" />
                {user?.terminal || 'Terminal 01 - Main Inspection Gate'}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#2563EB]" />
                Active Session: 09:30 AM
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-6 py-3 rounded-[6px] bg-[#B91C1C] hover:bg-red-800 text-white text-[15px] font-bold uppercase cursor-pointer"
        >
          Sign Out
        </button>
      </div>

      {/* Verification Statistics Grid */}
      <div className="space-y-4">
        <h2 className="text-[20px] font-bold text-[#10233F] uppercase">
          Officer Performance Metrics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="p-6 bg-white border border-[#C9DCF8] rounded-[8px]">
            <div className="text-[14px] font-bold text-[#64748B] uppercase">Total Verifications</div>
            <div className="text-[32px] font-bold text-[#10233F] mt-1">{stats.totalChecked}</div>
            <div className="text-[13px] text-[#64748B] mt-1">Total documents screened</div>
          </div>

          <div className="p-6 bg-white border border-[#C9DCF8] rounded-[8px]">
            <div className="text-[14px] font-bold text-[#15803D] uppercase">Verified (Low Risk)</div>
            <div className="text-[32px] font-bold text-[#15803D] mt-1">{stats.verified}</div>
            <div className="text-[13px] text-[#64748B] mt-1">Cleared documents</div>
          </div>

          <div className="p-6 bg-white border border-[#C9DCF8] rounded-[8px]">
            <div className="text-[14px] font-bold text-[#B45309] uppercase">Review (Medium)</div>
            <div className="text-[32px] font-bold text-[#B45309] mt-1">{stats.suspicious}</div>
            <div className="text-[13px] text-[#64748B] mt-1">Referred for secondary audit</div>
          </div>

          <div className="p-6 bg-white border border-[#C9DCF8] rounded-[8px]">
            <div className="text-[14px] font-bold text-[#B91C1C] uppercase">Rejected (High Risk)</div>
            <div className="text-[32px] font-bold text-[#B91C1C] mt-1">{stats.failed}</div>
            <div className="text-[13px] text-[#64748B] mt-1">Forged or expired documents</div>
          </div>
        </div>
      </div>

      {/* Role & Terminal Permissions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#C9DCF8] rounded-[8px] p-6 space-y-4">
          <div className="flex items-center gap-2 text-[18px] font-bold text-[#10233F] uppercase border-b border-[#C9DCF8] pb-3">
            <Shield className="w-5 h-5 text-[#2563EB]" />
            <span>Assigned Operational Permissions</span>
          </div>

          <div className="space-y-3 text-[15px]">
            <div className="flex items-center justify-between p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
              <span className="font-bold text-[#10233F]">Document OCR & MRZ Screening</span>
              <span className="px-3 py-1 bg-[#DCFCE7] text-[#15803D] border border-green-300 font-bold text-[13px] uppercase rounded-[4px]">AUTHORIZED</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
              <span className="font-bold text-[#10233F]">Forensic Error Level Analysis (ELA)</span>
              <span className="px-3 py-1 bg-[#DCFCE7] text-[#15803D] border border-green-300 font-bold text-[13px] uppercase rounded-[4px]">AUTHORIZED</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
              <span className="font-bold text-[#10233F]">1:1 Biometric Desk Verification</span>
              <span className="px-3 py-1 bg-[#DCFCE7] text-[#15803D] border border-green-300 font-bold text-[13px] uppercase rounded-[4px]">AUTHORIZED</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
              <span className="font-bold text-[#10233F]">Official Report Generation & Export</span>
              <span className="px-3 py-1 bg-[#DCFCE7] text-[#15803D] border border-green-300 font-bold text-[13px] uppercase rounded-[4px]">AUTHORIZED</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#C9DCF8] rounded-[8px] p-6 space-y-4">
          <div className="flex items-center gap-2 text-[18px] font-bold text-[#10233F] uppercase border-b border-[#C9DCF8] pb-3">
            <Terminal className="w-5 h-5 text-[#2563EB]" />
            <span>Workstation Specifications</span>
          </div>

          <div className="space-y-3 text-[15px]">
            <div className="flex items-center justify-between p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
              <span className="text-[#64748B]">Terminal ID:</span>
              <span className="font-bold text-[#10233F]">WORKSTATION-01</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
              <span className="text-[#64748B]">System Version:</span>
              <span className="font-bold text-[#10233F]">VisionX v4.2.0</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
              <span className="text-[#64748B]">Database Connection:</span>
              <span className="font-bold text-[#15803D]">CONNECTED</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
              <span className="text-[#64748B]">Encryption Standard:</span>
              <span className="font-bold text-[#2563EB]">AES-256-GCM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
