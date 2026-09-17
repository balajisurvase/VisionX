import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  PlusCircle,
  History,
  FileText,
  ChevronRight,
  ArrowRight,
  Eye,
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
        if (statsData) {
          setMetrics(statsData);
        }
        if (recordsData) {
          setRecentRecords(recordsData.slice(0, 8));
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const renderStatusBadge = (status: string, score: number) => {
    if (status === 'VERIFIED' || score <= 30) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 text-xs font-mono font-semibold whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>VERIFIED</span>
        </span>
      );
    }
    if (status === 'SUSPICIOUS' || (score > 30 && score <= 70)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/60 text-amber-400 border border-amber-800/80 text-xs font-mono font-semibold whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>NEEDS REVIEW</span>
        </span>
      );
    }
    if (status === 'PROCESSING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-950/60 text-blue-400 border border-blue-800/80 text-xs font-mono font-semibold whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
          <span>PROCESSING</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-950/60 text-rose-400 border border-rose-800/80 text-xs font-mono font-semibold whitespace-nowrap">
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        <span>REJECTED</span>
      </span>
    );
  };

  const renderRiskBadge = (score: number) => {
    if (score <= 30) {
      return (
        <span className="font-mono font-bold text-emerald-400 text-xs">
          LOW ({score}%)
        </span>
      );
    }
    if (score <= 70) {
      return (
        <span className="font-mono font-bold text-amber-400 text-xs">
          MEDIUM ({score}%)
        </span>
      );
    }
    return (
      <span className="font-mono font-bold text-rose-400 text-xs">
        HIGH ({score}%)
      </span>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 font-sans text-slate-100">
      {/* 1. HERO TOP SECTION */}
      <div className="bg-[#0D1322] border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="max-w-2xl space-y-2.5 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-blue-950/80 text-blue-400 border border-blue-800/80">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>IDENTITYGUARD VERIFICATION TERMINAL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Identity verification made simple
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Screen travel credentials, national IDs, and passports with multi-pillar OCR, MRZ checksum validation, forensic tampering analysis, and biometric verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 z-10">
          <button
            onClick={() => onNavigate('/verify')}
            id="btn-dash-start-verify"
            className="px-5 py-3 rounded-xl text-xs font-bold tracking-wide uppercase bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-blue-600/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Start New Verification</span>
          </button>
          <button
            onClick={() => onNavigate('/history')}
            id="btn-dash-view-history"
            className="px-4 py-3 rounded-xl text-xs font-semibold bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-750 transition-colors cursor-pointer flex items-center gap-2"
          >
            <History className="w-4 h-4 text-slate-400" />
            <span>Verification Ledger</span>
          </button>
        </div>
      </div>

      {/* 2. REAL DATABASE-BACKED SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Verifications */}
        <div className="bg-[#0D1322] border border-slate-800/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              Total Verifications
            </span>
            <div className="p-2 rounded-xl bg-slate-800/70 text-slate-300">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black font-mono text-white">
              {metrics.totalChecked}
            </div>
            <span className="text-[11px] text-slate-400 font-mono mt-1 block">
              {metrics.totalChecked === 0 ? 'No records in database' : 'Processed identity documents'}
            </span>
          </div>
        </div>

        {/* Verified */}
        <div className="bg-[#0D1322] border border-slate-800/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
              Verified
            </span>
            <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black font-mono text-emerald-400">
              {metrics.verified}
            </div>
            <span className="text-[11px] text-slate-400 font-mono mt-1 block">
              Low risk, cleared documents
            </span>
          </div>
        </div>

        {/* Needs Review */}
        <div className="bg-[#0D1322] border border-slate-800/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
              Needs Review
            </span>
            <div className="p-2 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/60">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black font-mono text-amber-400">
              {metrics.suspicious}
            </div>
            <span className="text-[11px] text-slate-400 font-mono mt-1 block">
              Potential anomalies detected
            </span>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-[#0D1322] border border-slate-800/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest">
              Rejected
            </span>
            <div className="p-2 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-800/60">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black font-mono text-rose-400">
              {metrics.failed}
            </div>
            <span className="text-[11px] text-slate-400 font-mono mt-1 block">
              High risk or invalid format
            </span>
          </div>
        </div>
      </div>

      {/* 3. RECENT VERIFICATIONS TABLE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Recent Verifications</h2>
            <p className="text-xs text-slate-400 font-mono">Live database audit feed</p>
          </div>
          <button
            onClick={() => onNavigate('/history')}
            className="text-xs font-mono font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentRecords.length === 0 && !loading ? (
          <div className="bg-[#0D1322] border border-slate-800/90 rounded-2xl p-12 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 text-slate-400 flex items-center justify-center mx-auto border border-slate-700/50">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">No verification records yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Begin by uploading an identity document to generate your first verification audit report.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/verify')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Start your first verification</span>
            </button>
          </div>
        ) : (
          <div className="bg-[#0D1322] border border-slate-800/90 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#090D16] border-b border-slate-800 text-slate-400 uppercase font-mono tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Verification ID</th>
                    <th className="py-3.5 px-4">Document Type</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Risk Score</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {recentRecords.map((record) => (
                    <tr key={record.verification_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {record.verification_id}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-300">
                        {record.document_type || 'Passport'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {formatDate(record.created_at || record.timestamp)}
                      </td>
                      <td className="py-3.5 px-4">
                        {renderStatusBadge(record.verification_status, record.risk_score)}
                      </td>
                      <td className="py-3.5 px-4">
                        {renderRiskBadge(record.risk_score)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            if (onSelectRecordForInspection) {
                              onSelectRecordForInspection(record);
                            } else {
                              onNavigate('/verify');
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white font-mono text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-slate-700/60"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

