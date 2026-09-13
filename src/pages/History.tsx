import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Lock,
  RefreshCw,
  FileCheck,
  Calendar,
  ArrowUpDown,
  FileText,
  Eye,
  Shield,
} from 'lucide-react';
import { VerificationRecord, AuditLogRecord } from '../types/verification';
import {
  fetchVerificationRecords,
  fetchAuditLogs,
  verifyAuditChain,
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
  const [activeTab, setActiveTab] = useState<'screenings' | 'blockchain'>('screenings');
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [riskSortOrder, setRiskSortOrder] = useState<'none' | 'asc' | 'desc'>('none');

  // Blockchain verification state
  const [isVerifyingChain, setIsVerifyingChain] = useState<boolean>(false);
  const [chainResult, setChainResult] = useState<{
    isValid: boolean;
    totalBlocks: number;
    corruptedBlock: number | null;
    message: string;
    algorithm: string;
  } | null>(null);
  const [isTamperSimulated, setIsTamperSimulated] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [recData, auditData] = await Promise.all([
      fetchVerificationRecords(),
      fetchAuditLogs(),
    ]);
    setRecords(recData);
    setAuditLogs(auditData);
  };

  const handleVerifyIntegrity = async () => {
    setIsVerifyingChain(true);
    setChainResult(null);
    try {
      const result = await verifyAuditChain();
      setChainResult(result);
    } catch (err: any) {
      setChainResult({
        isValid: false,
        totalBlocks: auditLogs.length,
        corruptedBlock: null,
        message: err.message || 'Audit ledger verification failed',
        algorithm: 'SHA-256 Hash Chain',
      });
    } finally {
      setIsVerifyingChain(false);
    }
  };

  const handleSimulateTamper = () => {
    if (auditLogs.length > 1) {
      const tampered = [...auditLogs];
      tampered[1] = {
        ...tampered[1],
        document_hash: '00000000_TAMPERED_IN_DATABASE_UNAUTHORIZED_MODIFICATION',
      };
      setAuditLogs(tampered);
      setIsTamperSimulated(true);
      setChainResult(null);
    }
  };

  const handleRestoreChain = async () => {
    await loadData();
    setIsTamperSimulated(false);
    setChainResult(null);
  };

  const toggleRiskSort = () => {
    if (riskSortOrder === 'none') setRiskSortOrder('desc');
    else if (riskSortOrder === 'desc') setRiskSortOrder('asc');
    else setRiskSortOrder('none');
  };

  let filteredRecords = records.filter((rec) => {
    const matchesFilter =
      statusFilter === 'ALL' ||
      rec.verification_status === statusFilter ||
      (statusFilter === 'REJECTED' && (rec.verification_status === 'FAILED' || rec.verification_status === 'EXPIRED'));

    const matchesSearch =
      rec.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.document_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.verification_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate =
      !dateFilter ||
      (rec.created_at && rec.created_at.startsWith(dateFilter)) ||
      (rec.timestamp && rec.timestamp.startsWith(dateFilter));

    return matchesFilter && matchesSearch && matchesDate;
  });

  if (riskSortOrder === 'asc') {
    filteredRecords = [...filteredRecords].sort((a, b) => a.risk_score - b.risk_score);
  } else if (riskSortOrder === 'desc') {
    filteredRecords = [...filteredRecords].sort((a, b) => b.risk_score - a.risk_score);
  }

  const getStatusBadge = (status: string, score: number) => {
    if (status === 'VERIFIED' || score <= 30) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5" />
          VERIFIED
        </span>
      );
    }
    if (status === 'SUSPICIOUS' || (score > 30 && score <= 70)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
          <AlertTriangle className="w-3.5 h-3.5" />
          SUSPICIOUS
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
        <XCircle className="w-3.5 h-3.5" />
        REJECTED
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-900">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Audit Logs & Ledger
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Tamper-Evident SHA-256 Hash Chain
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Verification History & Forensic Audit Trail
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('screenings')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'screenings'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Verification History ({records.length})
          </button>
          <button
            onClick={() => setActiveTab('blockchain')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'blockchain'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Cryptographic Ledger</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Verification History Records */}
      {activeTab === 'screenings' && (
        <div className="space-y-4">
          {/* Search, Status, Date & Risk Filters */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search applicant name, doc no, verification ID..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-1.5 text-xs flex-wrap">
              {['ALL', 'VERIFIED', 'SUSPICIOUS', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Filter by Date & Sort by Risk */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-700 outline-hidden"
                />
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter('')}
                    className="text-slate-400 hover:text-slate-600 text-[10px] font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                onClick={toggleRiskSort}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  riskSortOrder !== 'none'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                title="Sort by risk score"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Risk: {riskSortOrder === 'none' ? 'Default' : riskSortOrder.toUpperCase()}</span>
              </button>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Verification ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Document Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Risk Score</th>
                    <th className="py-3 px-4">Officer</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                          <FileCheck className="w-8 h-8 text-slate-300" />
                          <div className="font-bold text-sm text-slate-900">No screening records match</div>
                          <p className="text-xs text-slate-500">
                            Clear active filters or run a new document verification.
                          </p>
                          {onNavigate && (
                            <button
                              onClick={() => onNavigate('/verify')}
                              className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors shadow-xs"
                            >
                              New Verification
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">
                          {rec.verification_id}
                          <div className="text-[10px] text-slate-400 font-sans font-normal">
                            {rec.applicant_name}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                          {rec.timestamp || (rec.created_at ? rec.created_at.slice(0, 10) : '2026-09-05')}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {rec.document_type}
                          <div className="text-[10px] text-slate-400 font-mono">
                            {rec.document_number}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(rec.verification_status, rec.risk_score)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-mono font-bold text-xs ${
                              rec.risk_score <= 30
                                ? 'text-emerald-700'
                                : rec.risk_score <= 70
                                ? 'text-amber-700'
                                : 'text-red-700'
                            }`}
                          >
                            {rec.risk_score} / 100
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-600">
                          {rec.officer_id || rec.verified_by || 'Insp. Rajeshwar'}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => {
                              if (onInspectRecord) onInspectRecord(rec);
                              else if (onNavigate) onNavigate('/verify');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors cursor-pointer"
                            title="Inspect in Verification Console"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => {
                              if (onViewReport) onViewReport(rec);
                              else if (onNavigate) onNavigate('/reports');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition-colors cursor-pointer"
                            title="Generate Official Report"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Report</span>
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
      )}

      {/* Tab 2: Blockchain / Cryptographic Audit Trail */}
      {activeTab === 'blockchain' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Tamper-Evident SHA-256 Hash Chain
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sequential cryptographic hashing across records. Direct database tampering breaks the ledger digest.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleVerifyIntegrity}
                disabled={isVerifyingChain}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingChain ? 'animate-spin' : ''}`} />
                <span>Verify Chain Integrity</span>
              </button>

              {!isTamperSimulated ? (
                <button
                  onClick={handleSimulateTamper}
                  className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  Simulate DB Tampering
                </button>
              ) : (
                <button
                  onClick={handleRestoreChain}
                  className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  Restore Ledger
                </button>
              )}
            </div>
          </div>

          {chainResult && (
            <div
              className={`p-4 rounded-xl border flex items-center gap-3 text-xs ${
                chainResult.isValid
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {chainResult.isValid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <div>
                <div className="font-bold">{chainResult.message}</div>
                <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                  Validated {chainResult.totalBlocks} sequential ledger blocks using {chainResult.algorithm}
                </div>
              </div>
            </div>
          )}

          {/* Audit Logs Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Block #</th>
                    <th className="py-3 px-4">Verification ID</th>
                    <th className="py-3 px-4">Previous Hash</th>
                    <th className="py-3 px-4">Block Hash (SHA-256)</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {auditLogs.map((block) => (
                    <tr key={block.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        #{block.block_index}
                      </td>
                      <td className="py-3 px-4 text-blue-600 font-bold">
                        {block.verification_id}
                      </td>
                      <td className="py-3 px-4 text-slate-400 truncate max-w-[140px]">
                        {block.previous_hash}
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-bold truncate max-w-[200px]">
                        {block.document_hash}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(block.created_at).toISOString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
