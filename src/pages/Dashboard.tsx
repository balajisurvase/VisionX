import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Clock,
  ChevronRight,
  Sparkles,
  Layers,
  FileText,
  PieChart,
  Activity,
  PlusCircle,
  Info,
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
    totalChecked: 142,
    verified: 118,
    suspicious: 16,
    failed: 8,
    avgRiskScore: 18.4,
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
        setRecentRecords(recordsData.slice(0, 8));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const total = Math.max(1, metrics.totalChecked);
  const verifiedPercent = Math.round((metrics.verified / total) * 100);
  const suspiciousPercent = Math.round((metrics.suspicious / total) * 100);
  const rejectedPercent = Math.round((metrics.failed / total) * 100);

  const renderStatusPill = (status: string, score: number) => {
    if (status === 'VERIFIED' || score <= 30) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>VERIFIED</span>
        </span>
      );
    }
    if (status === 'SUSPICIOUS' || (score > 30 && score <= 70)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>SUSPICIOUS</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold whitespace-nowrap">
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        <span>REJECTED</span>
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-900">
      {/* Top Console Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              IdentityGuard Terminal 01
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Border Ingress Control Post
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Officer Verification Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/reports')}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Reports</span>
          </button>
          <button
            onClick={() => onNavigate('/verify')}
            id="btn-dash-new-verify"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-blue-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Verification</span>
          </button>
        </div>
      </div>

      {/* Demo Sandbox Alert Notice */}
      <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 flex items-center justify-between gap-3 text-xs text-blue-900">
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>SIH 2026 Prototype Sandbox:</strong> Metrics reflect active screening sessions with simulated demo data for evaluation.
          </span>
        </div>
        <button
          onClick={() => onNavigate('/verify')}
          className="text-blue-700 font-bold hover:underline shrink-0"
        >
          Run Benchmark Scenarios →
        </button>
      </div>

      {/* TOP 4 STATISTICS AS SPECIFIED BY PROMPT */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 1. Total Verifications */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Verifications
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black font-mono text-slate-900">
              {metrics.totalChecked}
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
              All processed credentials
            </span>
          </div>
        </div>

        {/* 2. Verified */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Verified
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black font-mono text-emerald-600">
              {metrics.verified}
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
              Low Risk (Score ≤ 30)
            </span>
          </div>
        </div>

        {/* 3. Suspicious */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Suspicious
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black font-mono text-amber-600">
              {metrics.suspicious}
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
              Medium Risk (Score 31–70)
            </span>
          </div>
        </div>

        {/* 4. Rejected */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider">
              Rejected
            </span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black font-mono text-red-600">
              {metrics.failed}
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
              High Risk (Score 71–100)
            </span>
          </div>
        </div>
      </div>

      {/* ANALYTICS SECTION: Risk Distribution & Status Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Distribution Chart Card */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Risk Score Distribution</h2>
              <p className="text-xs text-slate-500">Threat assessment tier allocation</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600">
              Avg: {metrics.avgRiskScore}/100
            </span>
          </div>

          {/* Stacked Progress Visualizer */}
          <div className="space-y-2 pt-2">
            <div className="h-3.5 w-full rounded-full bg-slate-100 flex overflow-hidden p-0.5 border border-slate-200">
              <div
                className="bg-emerald-500 h-full rounded-l-full transition-all"
                style={{ width: `${verifiedPercent}%` }}
                title={`Low Risk: ${verifiedPercent}%`}
              />
              <div
                className="bg-amber-500 h-full transition-all"
                style={{ width: `${suspiciousPercent}%` }}
                title={`Medium Risk: ${suspiciousPercent}%`}
              />
              <div
                className="bg-red-500 h-full rounded-r-full transition-all"
                style={{ width: `${rejectedPercent}%` }}
                title={`High Risk: ${rejectedPercent}%`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="font-bold text-emerald-800">Low Risk</div>
                <div className="text-xs text-emerald-600 font-mono">
                  {metrics.verified} ({verifiedPercent}%)
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                <div className="font-bold text-amber-800">Medium Risk</div>
                <div className="text-xs text-amber-600 font-mono">
                  {metrics.suspicious} ({suspiciousPercent}%)
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200">
                <div className="font-bold text-red-800">High Risk</div>
                <div className="text-xs text-red-600 font-mono">
                  {metrics.failed} ({rejectedPercent}%)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Status Breakdown */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Verification Status Overview</h2>
              <p className="text-xs text-slate-500">Breakdown across document classes</p>
            </div>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <PieChart className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2.5 pt-1 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <span className="font-semibold text-slate-700">International Passports (ICAO TD3)</span>
              <span className="font-mono font-bold text-slate-900">84 Screened</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <span className="font-semibold text-slate-700">Driving Licenses & Smart Cards</span>
              <span className="font-mono font-bold text-slate-900">36 Screened</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <span className="font-semibold text-slate-700">National IDs & Resident Permits</span>
              <span className="font-mono font-bold text-slate-900">22 Screened</span>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT DOCUMENTS QUICK ACCESS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Verification Activity</h2>
            <p className="text-xs text-slate-500">Live feed from checkpoint terminal gates</p>
          </div>
          <button
            onClick={() => onNavigate('/history')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View Full History</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Verification Records Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="py-3 px-4">Verification ID</th>
                  <th className="py-3 px-4">Traveler / Name</th>
                  <th className="py-3 px-4">Document Type</th>
                  <th className="py-3 px-4">Document No.</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {recentRecords.map((record) => (
                  <tr key={record.verification_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {record.verification_id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {record.applicant_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {record.document_type}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {record.document_number}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span
                        className={
                          record.risk_score <= 30
                            ? 'text-emerald-700'
                            : record.risk_score <= 70
                            ? 'text-amber-700'
                            : 'text-red-700'
                        }
                      >
                        {record.risk_score}/100
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {renderStatusPill(record.verification_status, record.risk_score)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (onSelectRecordForInspection) {
                            onSelectRecordForInspection(record);
                          } else {
                            onNavigate('/verify');
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        View Result
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
