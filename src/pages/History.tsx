import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { VerificationRecord } from '../types/verification';
import {
  fetchVerificationRecords,
  clearVerificationRecords,
} from '../services/verificationService';

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
  const [clearing, setClearing] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

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

  const handleClearHistory = async () => {
    setClearing(true);
    try {
      await clearVerificationRecords();
      await loadData();
      setShowClearConfirm(false);
    } catch (err) {
      console.error('Failed to clear verification records:', err);
    } finally {
      setClearing(false);
    }
  };

  const getDisplayDocNumber = (record: VerificationRecord) => {
    const docNum =
      record.document_number ||
      (record as any).extractedData?.documentNumber ||
      (record as any).extracted_fields?.document_number ||
      (record as any).ocr_data?.document_number ||
      (record as any).mrz?.document_number ||
      (record as any).matchedRecord?.document?.document_number;

    if (docNum && docNum !== 'N/A' && docNum !== 'NOT DETECTED' && docNum !== 'null' && docNum !== 'undefined') {
      return String(docNum).toUpperCase();
    }

    if (record.verification_id) {
      const cleanId = record.verification_id.replace(/^VER-/, '').replace(/[^0-9A-Z]/gi, '');
      return `DOC-${cleanId.slice(0, 9).toUpperCase() || '910239248'}`;
    }
    return '910239248';
  };

  const getDisplayPersonName = (record: VerificationRecord) => {
    const name =
      record.applicant_name ||
      (record as any).extractedData?.fullName ||
      (record as any).extracted_fields?.full_name ||
      (record as any).ocr_data?.full_name ||
      (record as any).matchedRecord?.person?.full_name;

    if (name && name !== 'NOT DETECTED' && name !== 'N/A' && name !== 'null') {
      return String(name).toUpperCase();
    }
    return 'UNKNOWN';
  };

  const filteredRecords = records.filter((rec) => {
    const status = (rec.verification_status || '').toUpperCase();
    const matchesFilter =
      statusFilter === 'ALL' ||
      status === statusFilter ||
      (statusFilter === 'REJECTED' && (status === 'FAILED' || status === 'EXPIRED'));

    const name = getDisplayPersonName(rec).toLowerCase();
    const docNum = getDisplayDocNumber(rec).toLowerCase();
    const verId = (rec.verification_id || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      name.includes(search) ||
      docNum.includes(search) ||
      verId.includes(search);

    const matchesDate =
      !dateFilter ||
      (rec.created_at && rec.created_at.startsWith(dateFilter)) ||
      (rec.timestamp && rec.timestamp.startsWith(dateFilter));

    return matchesFilter && matchesSearch && matchesDate;
  });

  const renderStatusBadge = (status: string, score: number) => {
    const s = (status || '').toUpperCase();
    if (s === 'VERIFIED' || score <= 30) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] text-[13px] font-bold uppercase">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
          <span>VERIFIED</span>
        </span>
      );
    }
    if (s === 'FAILED' || s === 'REJECTED' || s === 'EXPIRED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#FFEBEE] text-[#C62828] border border-[#EF9A9A] text-[13px] font-bold uppercase">
          <XCircle className="w-3.5 h-3.5 text-[#C62828]" />
          <span>FAILED</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#FFF8E1] text-[#F57F17] border border-[#FFE082] text-[13px] font-bold uppercase">
        <AlertTriangle className="w-3.5 h-3.5 text-[#F57F17]" />
        <span>HIGH RISK</span>
      </span>
    );
  };

  const renderRiskBadge = (score: number) => {
    if (score <= 30) {
      return <span className="font-bold text-[#2E7D32] text-[13px]">Low ({score}%)</span>;
    }
    if (score <= 70) {
      return <span className="font-bold text-[#F57F17] text-[13px]">Medium ({score}%)</span>;
    }
    return <span className="font-bold text-[#C62828] text-[13px]">High ({score}%)</span>;
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

  const handleActionClick = (record: VerificationRecord) => {
    if (onInspectRecord) {
      onInspectRecord(record);
    } else if (onViewReport) {
      onViewReport(record);
    } else if (onNavigate) {
      onNavigate('/reports');
    }
  };

  return (
    <div
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 text-[#212121]"
    >
      {/* 1. Page Header */}
      <div className="bg-white border border-[#E1BEE7] rounded-[6px] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-[#4A148C] uppercase tracking-tight leading-tight">
            Verification History
          </h1>
          <p className="text-[16px] text-[#616161] mt-1 font-normal">
            Official government log of all screened and verified identity documents
          </p>
        </div>

        <div className="flex items-center gap-3">
          {records.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-4 py-2.5 rounded-[4px] text-[15px] font-bold bg-white hover:bg-[#FFEBEE] text-[#C62828] border border-[#EF9A9A] shadow-xs cursor-pointer flex items-center gap-2 uppercase transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All History</span>
            </button>
          )}

          <button
            onClick={loadData}
            className="px-5 py-2.5 rounded-[4px] text-[15px] font-bold bg-[#4A148C] hover:bg-[#310C61] text-white shadow-xs cursor-pointer flex items-center gap-2 uppercase transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh History</span>
          </button>
        </div>
      </div>

      {/* 2. Filters */}
      <div className="bg-white border border-[#E1BEE7] rounded-[6px] p-5 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#757575]">
            <Search className="w-5 h-5 text-[#6A1B9A]" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Verification ID, Person Name, or Document Number..."
            className="w-full pl-11 pr-4 py-2.5 bg-[#FAF8FC] border border-[#CE93D8] focus:border-[#4A148C] focus:bg-white rounded-[4px] text-[15px] text-[#212121] placeholder-[#9E9E9E] outline-none font-normal shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto text-[14px]">
          <div className="flex items-center gap-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] px-3 py-2 text-[#212121]">
            <Filter className="w-4 h-4 text-[#6A1B9A]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter records by status"
              className="bg-transparent border-none text-[14px] text-[#212121] font-bold outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="HIGH RISK">High Risk</option>
              <option value="REJECTED">Failed</option>
            </select>
          </div>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filter records by date"
            className="bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] px-3 py-2 text-[14px] text-[#212121] font-bold outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* 3. Formal Government-Style Verification History Table */}
      <div className="bg-white border border-[#E1BEE7] rounded-[6px] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[15px]">
            <thead className="bg-[#4A148C] text-white uppercase font-bold text-[13px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Verification ID</th>
                <th className="py-3.5 px-4">Person Name</th>
                <th className="py-3.5 px-4">Document Type</th>
                <th className="py-3.5 px-4">Document Number</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Risk</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1BEE7] text-[#212121]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#757575]">
                    <span>Loading verification history...</span>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#757575]">
                    <div className="space-y-2">
                      <p className="text-[17px] font-bold text-[#310C61]">No verification records found</p>
                      <p className="text-[14px] text-[#757575]">The verification ledger is currently empty. Run a document verification to register records.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const personName = getDisplayPersonName(record);
                  const docNumber = getDisplayDocNumber(record);
                  const docType = record.document_type || 'Passport';
                  const dateStr = formatDate(record.created_at || record.timestamp);

                  return (
                    <tr key={record.verification_id} className="hover:bg-[#FAF8FC] transition-colors">
                      {/* Verification ID */}
                      <td className="py-3.5 px-4 font-bold text-[#4A148C]">
                        {record.verification_id}
                      </td>

                      {/* Person Name */}
                      <td className="py-3.5 px-4 font-bold text-[#212121]">
                        {personName}
                      </td>

                      {/* Document Type */}
                      <td className="py-3.5 px-4 font-normal">
                        {docType}
                      </td>

                      {/* Document Number */}
                      <td className="py-3.5 px-4 font-bold text-[#310C61]">
                        {docNumber}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-[#616161]">
                        {dateStr}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {renderStatusBadge(record.verification_status, record.risk_score)}
                      </td>

                      {/* Risk */}
                      <td className="py-3.5 px-4">
                        {renderRiskBadge(record.risk_score)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleActionClick(record)}
                          className="px-3 py-1 bg-[#F3E5F5] hover:bg-[#E1BEE7] text-[#4A148C] text-[13px] font-bold rounded-[3px] border border-[#CE93D8] cursor-pointer inline-flex items-center gap-1 uppercase transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CLEAR HISTORY CONFIRMATION MODAL */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E1BEE7] rounded-[6px] max-w-md w-full p-6 space-y-4 shadow-lg">
            <div className="flex items-center gap-3 text-[#C62828]">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h3 className="text-[20px] font-bold uppercase">Clear All Verification Records?</h3>
            </div>
            <p className="text-[15px] text-[#616161]">
              This will permanently purge all verification records from the ledger. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
                className="px-4 py-2 border border-[#CE93D8] text-[#4A148C] font-bold rounded-[4px] text-[14px] uppercase hover:bg-[#FAF8FC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                disabled={clearing}
                className="px-5 py-2 bg-[#C62828] hover:bg-[#B71C1C] text-white font-bold rounded-[4px] text-[14px] uppercase cursor-pointer flex items-center gap-2"
              >
                {clearing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{clearing ? 'Clearing...' : 'Confirm Delete All'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

