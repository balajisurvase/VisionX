import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PlusCircle,
  History,
  Eye,
  Server,
  Activity,
  ChevronRight,
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
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#DCFCE7] text-[#15803D] border border-green-300 text-[13px] font-bold uppercase">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#15803D]" />
          <span>VERIFIED</span>
        </span>
      );
    }
    if (status === 'REVIEW' || status === 'SUSPICIOUS' || (score > 30 && score <= 70)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#FEF3C7] text-[#B45309] border border-amber-300 text-[13px] font-bold uppercase">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#B45309]" />
          <span>REVIEW</span>
        </span>
      );
    }
    if (status === 'FAILED' || status === 'REJECTED' || score > 70) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#FEE2E2] text-[#B91C1C] border border-red-300 text-[13px] font-bold uppercase">
          <XCircle className="w-4 h-4 shrink-0 text-[#B91C1C]" />
          <span>FAILED</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#EAF2FF] text-[#64748B] border border-[#C9DCF8] text-[13px] font-bold uppercase">
        <span>NOT VERIFIED</span>
      </span>
    );
  };

  const renderRiskBadge = (score: number) => {
    if (score <= 30) {
      return (
        <span className="font-bold text-[#15803D] text-[14px]">
          LOW ({score}%)
        </span>
      );
    }
    if (score <= 70) {
      return (
        <span className="font-bold text-[#B45309] text-[14px]">
          MEDIUM ({score}%)
        </span>
      );
    }
    return (
      <span className="font-bold text-[#B91C1C] text-[14px]">
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

  const systemStatusList = [
    { module: 'OCR Engine', tech: 'PaddleOCR', status: 'ONLINE' },
    { module: 'MRZ Engine', tech: 'ICAO 9303', status: 'ONLINE' },
    { module: 'Tampering Detection', tech: 'OpenCV / TensorFlow', status: 'ONLINE' },
    { module: 'Face Verification', tech: 'InsightFace', status: 'ONLINE' },
    { module: 'Risk Engine', tech: 'scikit-learn / deterministic baseline', status: 'ONLINE' },
    { module: 'Database', tech: 'Supabase', status: 'ONLINE' },
  ];

  return (
    <div
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className="p-4 md:p-6 max-w-7xl mx-auto space-y-5 text-[#10233F]"
    >
      {/* RECENT VERIFICATIONS TABLE */}
      <div className="bg-white border border-[#C9DCF8] rounded-[8px] p-4 md:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#C9DCF8] pb-3">
          <div>
            <h2 className="text-[24px] font-bold text-[#10233F] uppercase">
              Recent Verifications
            </h2>
            <p className="text-[15px] text-[#64748B] mt-0.5">
              Latest screening logs
            </p>
          </div>
          <button
            onClick={() => onNavigate('/history')}
            className="text-[15px] font-bold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer uppercase"
          >
            <span>View Full History</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentRecords.length === 0 && !loading ? (
          <div className="p-12 text-center space-y-4">
            <p className="text-[18px] text-[#64748B]">No verification records yet.</p>
            <button
              onClick={() => onNavigate('/verify')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[6px] bg-[#2563EB] text-white text-[16px] font-bold uppercase cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Start New Verification</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[16px]">
              <thead className="bg-[#EAF2FF] border-b border-[#C9DCF8] text-[#10233F] uppercase font-bold text-[14px]">
                <tr>
                  <th className="py-3 px-4">Verification ID</th>
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-4">Document Number</th>
                  <th className="py-3 px-4">Officer</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4">Risk</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C9DCF8] text-[#10233F]">
                {recentRecords.map((record) => (
                  <tr key={record.verification_id} className="hover:bg-[#F5F9FF]">
                    <td className="py-3.5 px-4 font-bold text-[#2563EB]">
                      {record.verification_id}
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      {record.document_type || 'Passport'}
                    </td>
                    <td className="py-3.5 px-4 font-normal">
                      {record.document_number || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 font-normal">
                      {record.officer_id || 'A001'}
                    </td>
                    <td className="py-3.5 px-4">
                      {renderStatusBadge(record.verification_status, record.risk_score)}
                    </td>
                    <td className="py-3.5 px-4">
                      {renderRiskBadge(record.risk_score)}
                    </td>
                    <td className="py-3.5 px-4 text-[#64748B]">
                      {formatDate(record.created_at || record.timestamp)}
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
                        className="px-4 py-1.5 rounded-[4px] bg-[#2563EB] text-white text-[14px] font-bold cursor-pointer inline-flex items-center gap-1.5 uppercase"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SYSTEM STATUS SECTION */}
      <div className="bg-white border border-[#C9DCF8] rounded-[8px] p-4 md:p-5 space-y-3.5">
        <div className="flex items-center gap-2.5 border-b border-[#C9DCF8] pb-3">
          <Server className="w-5 h-5 text-[#2563EB]" />
          <h2 className="text-[24px] font-bold text-[#10233F] uppercase">
            SYSTEM STATUS
          </h2>
        </div>

        <div className="divide-y divide-[#C9DCF8]">
          {systemStatusList.map((item) => (
            <div key={item.module} className="py-3.5 flex items-center justify-between text-[16px]">
              <div>
                <span className="font-bold text-[#10233F] block">{item.module}</span>
                <span className="text-[14px] text-[#64748B] font-normal">{item.tech}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#DCFCE7] text-[#15803D] border border-green-300 text-[13px] font-bold uppercase">
                <Activity className="w-3.5 h-3.5 shrink-0" />
                <span>{item.status}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
