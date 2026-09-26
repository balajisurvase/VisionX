import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Clock,
  Building2,
  CheckCircle2,
  Lock,
  LogOut,
  FileCheck2,
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
    totalChecked: 0,
    verified: 0,
    suspicious: 0,
    failed: 0,
    avgRiskScore: 0,
  });

  useEffect(() => {
    getDashboardMetrics().then((data) => {
      if (data) {
        setStats(data);
      }
    });
  }, []);

  return (
    <div
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 text-[#212121]"
    >
      {/* 1. Page Header */}
      <div className="bg-white border border-[#E1BEE7] rounded-[6px] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-[#4A148C] uppercase tracking-tight leading-tight">
            Officer Profile
          </h1>
          <p className="text-[16px] text-[#616161] mt-1 font-normal">
            National Security & Document Verification Portal Account Information
          </p>
        </div>

        <button
          onClick={onLogout}
          className="px-5 py-2.5 rounded-[4px] bg-[#C62828] hover:bg-[#B71C1C] text-white text-[15px] font-bold uppercase cursor-pointer flex items-center gap-2 shadow-xs transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* 2. Government-Style Simple Profile Card */}
      <div className="bg-white border border-[#E1BEE7] rounded-[6px] p-6 md:p-8 shadow-xs">
        <div className="border-b border-[#E1BEE7] pb-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[4px] bg-[#4A148C] text-white flex items-center justify-center font-bold text-[22px]">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-[24px] font-bold text-[#310C61] uppercase leading-tight">
                {user?.full_name || 'Senior Verification Officer'}
              </h2>
              <p className="text-[14px] text-[#616161]">
                Official Identity Screening Personnel
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] rounded-[4px] text-[13px] font-bold uppercase">
            <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
            <span>Active & Authorized</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[16px]">
          {/* Officer ID */}
          <div className="p-4 bg-[#FAF8FC] border border-[#E1BEE7] rounded-[4px]">
            <span className="text-[13px] font-bold text-[#6A1B9A] uppercase tracking-wider block mb-1">
              Officer ID
            </span>
            <div className="text-[20px] font-bold text-[#4A148C]">
              {user?.user_id || 'A001'}
            </div>
          </div>

          {/* Officer Name */}
          <div className="p-4 bg-[#FAF8FC] border border-[#E1BEE7] rounded-[4px]">
            <span className="text-[13px] font-bold text-[#6A1B9A] uppercase tracking-wider block mb-1">
              Officer Name
            </span>
            <div className="text-[20px] font-bold text-[#212121]">
              {user?.full_name || 'Balaji Ravindra Survase'}
            </div>
          </div>

          {/* Department */}
          <div className="p-4 bg-[#FAF8FC] border border-[#E1BEE7] rounded-[4px]">
            <span className="text-[13px] font-bold text-[#6A1B9A] uppercase tracking-wider block mb-1">
              Department
            </span>
            <div className="text-[18px] font-bold text-[#212121]">
              {user?.department || 'National Identity Verification & Border Screening Division'}
            </div>
          </div>

          {/* Designation */}
          <div className="p-4 bg-[#FAF8FC] border border-[#E1BEE7] rounded-[4px]">
            <span className="text-[13px] font-bold text-[#6A1B9A] uppercase tracking-wider block mb-1">
              Designation
            </span>
            <div className="text-[18px] font-bold text-[#212121]">
              {user?.role || 'Senior Verification Officer / Inspector'}
            </div>
          </div>

          {/* Last Login */}
          <div className="p-4 bg-[#FAF8FC] border border-[#E1BEE7] rounded-[4px]">
            <span className="text-[13px] font-bold text-[#6A1B9A] uppercase tracking-wider block mb-1">
              Last Login
            </span>
            <div className="text-[18px] font-bold text-[#212121]">
              Today, 09:30 AM (IST) • 256-Bit SSL Encrypted
            </div>
          </div>

          {/* Account Status */}
          <div className="p-4 bg-[#FAF8FC] border border-[#E1BEE7] rounded-[4px]">
            <span className="text-[13px] font-bold text-[#6A1B9A] uppercase tracking-wider block mb-1">
              Account Status
            </span>
            <div className="text-[18px] font-bold text-[#2E7D32] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Active (Level 3 Verification Authority)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
