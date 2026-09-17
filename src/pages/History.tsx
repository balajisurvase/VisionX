import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Eye,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { VerificationRecord } from '../types/verification';
import { fetchVerificationRecords } from '../services/verificationService';
import { formatVisualDate } from '../utils/mrzUtils';

interface HistoryProps {
  onNavigate?: (path: string) => void;
  onInspectRecord?: (record: VerificationRecord) => void;
  onViewReport?: (record: VerificationRecord) => void;
}

export const History: React.FC<HistoryProps> = ({
  onNavigate,
  onInspectRecord,
  onViewReport,
}) => {
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const recData = await fetchVerificationRecords();
      setRecords(recData || []);
    } catch (err) {
      console.error('Failed to load verification history:', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter((rec) => {
    const matchesFilter =
      statusFilter === 'ALL' ||
      rec.verification_status === statusFilter ||
      (statusFilter === 'REJECTED' && (rec.verification_status === 'FAILED' || rec.verification_status === 'EXPIRED'));

    const matchesSearch =
      (rec.applicant_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.document_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.verification_id || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate =
      !dateFilter ||
      (rec.created_at && rec.created_at.startsWith(dateFilter)) ||
      (rec.timestamp && rec.timestamp.startsWith(dateFilter));

    return matchesFilter && matchesSearch && matchesDate;
  });

  const renderStatusBadge = (status: string, score: number) => {
    if (status === 'VERIFIED' || score <= 30) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#DCFCE7] text-[#15803D] border border-green-300 text-[13px] font-bold uppercase">
          <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
          <span>VERIFIED</span>
        </span>
      );
    }
    if (status === 'REVIEW' || status === 'SUSPICIOUS' || (score > 30 && score <= 70)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#FEF3C7] text-[#B45309] border border-amber-300 text-[13px] font-bold uppercase">
          <AlertTriangle className="w-4 h-4 text-[#B45309]" />
          <span>REVIEW</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#FEE2E2] text-[#B91C1C] border border-red-300 text-[13px] font-bold uppercase">
        <XCircle className="w-4 h-4 text-[#B91C1C]" />
        <span>FAILED</span>
      </span>
    );
  };

  const renderRiskBadge = (score: number) => {
    if (score <= 30) {
      return <span className="font-bold text-[#15803D] text-[14px]">LOW ({score}%)</span>;
    }
    if (score <= 70) {
      return <span className="font-bold text-[#B45309] text-[14px]">MEDIUM ({score}%)</span>;
    }
    return <span className="font-bold text-[#B91C1C] text-[14px]">HIGH ({score}%)</span>;
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
    <div
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className="p-4 md:p-6 max-w-7xl mx-auto space-y-5 text-[#10233F]"
    >
      {/* Page Header */}
      <div className="bg-white border border-[#C9DCF8] rounded-[8px] p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-[#10233F] uppercase tracking-tight">
            Verification History & Audit Ledger
          </h1>
          <p className="text-[17px] text-[#64748B] mt-1 font-normal">
            Complete record of past identity screening operations
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-5 py-3 rounded-[6px] text-[15px] font-bold bg-white text-[#10233F] border border-[#C9DCF8] hover:bg-[#EAF2FF] cursor-pointer flex items-center gap-2 uppercase"
        >
          <RefreshCw className="w-4 h-4 text-[#2563EB]" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white border border-[#C9DCF8] rounded-[8px] p-6 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#64748B]">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Verification ID, Document Number, or Full Name..."
            className="w-full pl-12 pr-4 py-3 bg-[#F5F9FF] border border-[#C9DCF8] focus:border-[#2563EB] rounded-[6px] text-[16px] text-[#10233F] placeholder-[#64748B] outline-none font-normal"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto text-[15px]">
          <div className="flex items-center gap-2 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px] px-3 py-2.5 text-[#10233F]">
            <Filter className="w-4 h-4 text-[#2563EB]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter records by status"
              className="bg-transparent border-none text-[15px] text-[#10233F] font-bold outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="REVIEW">Review Required</option>
              <option value="REJECTED">Failed / Rejected</option>
            </select>
          </div>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filter records by date"
            className="bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px] px-3 py-2.5 text-[15px] text-[#10233F] font-bold outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white border border-[#C9DCF8] rounded-[8px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[16px]">
            <thead className="bg-[#EAF2FF] border-b border-[#C9DCF8] text-[#10233F] uppercase font-bold text-[14px]">
              <tr>
                <th className="py-3.5 px-5">Verification ID</th>
                <th className="py-3.5 px-5">Document Number</th>
                <th className="py-3.5 px-5">Document Type</th>
                <th className="py-3.5 px-5">Result</th>
                <th className="py-3.5 px-5">Risk</th>
                <th className="py-3.5 px-5">Officer</th>
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C9DCF8] text-[#10233F]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#64748B]">
                    <span>Loading verification ledger...</span>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#64748B]">
                    <span>No verification records match your query.</span>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.verification_id} className="hover:bg-[#F5F9FF]">
                    <td className="py-3.5 px-5 font-bold text-[#2563EB]">
                      {record.verification_id}
                    </td>
                    <td className="py-3.5 px-5 font-bold">
                      {record.document_number || 'N/A'}
                    </td>
                    <td className="py-3.5 px-5 font-normal">
                      {record.document_type || 'Passport'}
                    </td>
                    <td className="py-3.5 px-5">
                      {renderStatusBadge(record.verification_status, record.risk_score)}
                    </td>
                    <td className="py-3.5 px-5">
                      {renderRiskBadge(record.risk_score)}
                    </td>
                    <td className="py-3.5 px-5 font-normal">
                      {record.verified_by || 'A001'}
                    </td>
                    <td className="py-3.5 px-5 text-[#64748B]">
                      {formatDate(record.created_at || record.timestamp)}
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-2">
                      <button
                        onClick={() => {
                          if (onViewReport) onViewReport(record);
                          else if (onInspectRecord) onInspectRecord(record);
                        }}
                        className="px-3 py-1.5 rounded-[4px] bg-[#2563EB] text-white text-[14px] font-bold cursor-pointer inline-flex items-center gap-1.5 uppercase"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Report</span>
                      </button>
                      <button
                        onClick={() => {
                          if (onInspectRecord) onInspectRecord(record);
                          else if (onNavigate) onNavigate('/verify');
                        }}
                        className="px-3 py-1.5 rounded-[4px] bg-white text-[#10233F] border border-[#C9DCF8] text-[14px] font-bold cursor-pointer inline-flex items-center gap-1.5 uppercase"
                      >
                        <Eye className="w-4 h-4 text-[#2563EB]" />
                        <span>Inspect</span>
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
