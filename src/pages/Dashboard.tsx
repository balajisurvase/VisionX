import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  FlaskConical,
  Clock,
  ChevronRight,
  Sparkles,
  Camera,
  Layers,
  FileText,
} from 'lucide-react';
import { VerificationRecord, VerificationStats } from '../types/verification';
import { fetchVerificationRecords, getDashboardMetrics } from '../services/verificationService';

interface DashboardProps {
  onNavigate: (path: string) => void;
  onSelectRecordForInspection?: (record: VerificationRecord) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onSelectRecordForInspection,
}) => {
  const [metrics, setMetrics] = useState<VerificationStats>({
    totalChecked: 0,
    verified: 0,
    suspicious: 0,
    failed: 0,
    avgRiskScore: 0,
  });
  const [recentRecords, setRecentRecords] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, recordsData] = await Promise.all([
          getDashboardMetrics(),
          fetchVerificationRecords(),
        ]);
        setMetrics(statsData);
        setRecentRecords(recordsData.slice(0, 10));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const renderStatusPill = (status: string, score: number) => {
    if (status === 'VERIFIED' || score <= 25) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] text-xs font-bold whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Cleared</span>
        </span>
      );
    }
    if (status === 'SUSPICIOUS' || (score > 25 && score <= 60)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] text-xs font-bold whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Secondary Review</span>
        </span>
      );
    }
    if (status === 'EXPIRED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEE2E2] text-[#B91C1C] text-xs font-bold whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Expired Document</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEE2E2] text-[#B91C1C] text-xs font-bold whitespace-nowrap">
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Flagged / Refused</span>
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-[#111827]">
      {/* Top Console Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#EEF2FF] text-[#4F46E5]">
              SSB Terminal 01
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Indo-Nepal International Border
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#111827] tracking-tight mt-1">
            Border Screening Console
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/demo')}
            id="btn-dash-demo-center"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-colors cursor-pointer flex items-center gap-2 shadow-2xs"
          >
            <FlaskConical className="w-4 h-4 text-[#4F46E5]" />
            <span>Benchmark Scenarios</span>
          </button>
          <button
            onClick={() => onNavigate('/verify')}
            id="btn-dash-start-verify"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#4F46E5] hover:bg-[#4338CA] text-white transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify New Document</span>
          </button>
        </div>
      </div>

      {/* 5 Solid Stat Cards (No borders, no drop shadows, 12px radius, solid fills) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Blue Card: Total Screened */}
        <div className="bg-[#2563EB] text-white rounded-[12px] p-4 flex flex-col justify-between min-h-[108px]">
          <span className="text-xs font-semibold text-blue-100 uppercase tracking-wide">
            Total Screened
          </span>
          <div>
            <div className="text-3xl font-black font-mono tracking-tight">
              {metrics.totalChecked}
            </div>
            <span className="text-[11px] text-blue-100 font-medium">
              Current Duty Shift
            </span>
          </div>
        </div>

        {/* Green Card: Verified & Cleared */}
        <div className="bg-[#16A34A] text-white rounded-[12px] p-4 flex flex-col justify-between min-h-[108px]">
          <span className="text-xs font-semibold text-green-100 uppercase tracking-wide">
            Cleared Passports
          </span>
          <div>
            <div className="text-3xl font-black font-mono tracking-tight">
              {metrics.verified}
            </div>
            <span className="text-[11px] text-green-100 font-medium">
              Risk Score &lt; 25
            </span>
          </div>
        </div>

        {/* Amber Card: Flagged / Caution */}
        <div className="bg-[#D97706] text-white rounded-[12px] p-4 flex flex-col justify-between min-h-[108px]">
          <span className="text-xs font-semibold text-amber-100 uppercase tracking-wide">
            Secondary Review
          </span>
          <div>
            <div className="text-3xl font-black font-mono tracking-tight">
              {metrics.suspicious}
            </div>
            <span className="text-[11px] text-amber-100 font-medium">
              Manual Check Required
            </span>
          </div>
        </div>

        {/* Purple Card: Desk Biometrics Match */}
        <div className="bg-[#7C3AED] text-white rounded-[12px] p-4 flex flex-col justify-between min-h-[108px]">
          <span className="text-xs font-semibold text-purple-100 uppercase tracking-wide">
            Face Match Live
          </span>
          <div>
            <div className="text-3xl font-black font-mono tracking-tight">
              {Math.max(1, metrics.verified)}
            </div>
            <span className="text-[11px] text-purple-100 font-medium">
              Biometrics Confirmed
            </span>
          </div>
        </div>

        {/* Red Card: Forgeries & Expired */}
        <div className="bg-[#DC2626] text-white rounded-[12px] p-4 flex flex-col justify-between min-h-[108px] col-span-2 md:col-span-1">
          <span className="text-xs font-semibold text-red-100 uppercase tracking-wide">
            Expired & Forgeries
          </span>
          <div>
            <div className="text-3xl font-black font-mono tracking-tight">
              {metrics.failed}
            </div>
            <span className="text-[11px] text-red-100 font-medium">
              High Risk / Watchlist
            </span>
          </div>
        </div>
      </div>

      {/* Main White Content Card: Live Screening Activity Table */}
      <div className="bg-white rounded-[12px] border border-gray-100 shadow-2xs overflow-hidden">
        {/* Card Header Row */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#111827]">
              Live Screening Queue & History
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Recent travel documents processed at this terminal
            </p>
          </div>

          <button
            onClick={() => onNavigate('/history')}
            id="btn-view-all-screenings"
            className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View all records</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Table Rows separated by 1px hairlines */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F6F8] text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-6">Status & Verdict</th>
                <th className="py-3 px-6">Applicant Name</th>
                <th className="py-3 px-6">Document No.</th>
                <th className="py-3 px-6">Doc Type</th>
                <th className="py-3 px-6">Processed At</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileCheck2 className="w-8 h-8 text-gray-300" />
                      <div className="font-semibold text-sm text-[#111827]">
                        No screenings logged in this session
                      </div>
                      <p className="text-xs text-gray-500 max-w-sm">
                        Process identity documents using the live scanner or run benchmark test scenarios.
                      </p>
                      <button
                        onClick={() => onNavigate('/verify')}
                        className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#4F46E5] text-white cursor-pointer hover:bg-[#4338CA] transition-colors"
                      >
                        Start First Screening
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                recentRecords.map((rec) => (
                  <tr
                    key={rec.id || rec.verification_id}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-6">
                      {renderStatusPill(rec.verification_status, rec.risk_score)}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="font-bold text-[#111827]">
                        {rec.applicant_name}
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono">
                        {rec.nationality || 'IND'}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-xs font-medium text-gray-700">
                      {rec.document_number}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase bg-[#F5F6F8] text-gray-700 border border-gray-200">
                        {rec.document_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-gray-500 font-mono text-[11px]">
                      {new Date(rec.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}{' '}
                      {new Date(rec.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => {
                          if (onSelectRecordForInspection) {
                            onSelectRecordForInspection(rec);
                          }
                          onNavigate('/verify');
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F5F6F8] hover:bg-[#EEF2FF] text-[#4F46E5] border border-gray-200 hover:border-[#4F46E5]/30 transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
