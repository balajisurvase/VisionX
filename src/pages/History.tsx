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
  AlertOctagon,
  Key,
  Shield,
  Layers,
} from 'lucide-react';
import { VerificationRecord, AuditLogRecord } from '../types/verification';
import {
  fetchVerificationRecords,
  fetchAuditLogs,
  verifyAuditChain,
} from '../services/verificationService';

interface HistoryProps {
  onNavigate?: (path: string) => void;
}

export const History: React.FC<HistoryProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'screenings' | 'blockchain'>('screenings');
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

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

  const filteredRecords = records.filter((rec) => {
    const matchesFilter =
      statusFilter === 'ALL' || rec.verification_status === statusFilter;
    const matchesSearch =
      rec.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.document_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.verification_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#15803D]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Pass
          </span>
        );
      case 'SUSPICIOUS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#B45309]">
            <AlertTriangle className="w-3.5 h-3.5" />
            Caution
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#B91C1C]">
            <Clock className="w-3.5 h-3.5" />
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#B91C1C]">
            <XCircle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-[#111827]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#EEF2FF] text-[#4F46E5]">
              Audit Logs & Ledger
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Tamper-Evident SHA-256 Hash Chain
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#111827] tracking-tight mt-1">
            Verification History & Forensic Audit Trail
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-gray-100 p-1 rounded-full border border-gray-200 text-xs">
          <button
            onClick={() => setActiveTab('screenings')}
            className={`px-4 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
              activeTab === 'screenings'
                ? 'bg-[#4F46E5] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Screening Records ({records.length})
          </button>
          <button
            onClick={() => setActiveTab('blockchain')}
            className={`px-4 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'blockchain'
                ? 'bg-[#4F46E5] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Cryptographic Chain</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Screening Records */}
      {activeTab === 'screenings' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="p-4 rounded-[12px] bg-white border border-gray-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search applicant name, serial number, ID..."
                className="w-full pl-10 pr-4 py-2 bg-[#F5F6F8] border border-gray-200 rounded-xl text-xs text-[#111827] placeholder-gray-400 focus:border-[#4F46E5] focus:bg-white transition-all font-medium"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              {['ALL', 'VERIFIED', 'SUSPICIOUS', 'EXPIRED', 'FAILED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#4F46E5] text-white shadow-xs'
                      : 'bg-[#F5F6F8] text-gray-600 border border-gray-200 hover:text-gray-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white border border-gray-100 rounded-[12px] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F6F8] text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Verification ID</th>
                    <th className="py-3 px-6">Applicant Name</th>
                    <th className="py-3 px-6">Document Details</th>
                    <th className="py-3 px-6">Threat Score</th>
                    <th className="py-3 px-6">Officer ID</th>
                    <th className="py-3 px-6">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                          <FileCheck className="w-8 h-8 text-gray-300" />
                          <div className="font-bold text-sm text-[#111827]">No screening records logged</div>
                          <p className="text-xs text-gray-500">
                            Run automated document screenings to record live audit trails.
                          </p>
                          {onNavigate && (
                            <button
                              onClick={() => onNavigate('/verify')}
                              className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#4F46E5] hover:bg-[#4338CA] text-white cursor-pointer transition-colors shadow-2xs"
                            >
                              Verify Document
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => (
                      <tr
                        key={rec.id}
                        className="hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="py-3.5 px-6">
                          {getStatusBadge(rec.verification_status)}
                        </td>
                        <td className="py-3.5 px-6 font-mono font-bold text-[#4F46E5]">
                          {rec.verification_id}
                        </td>
                        <td className="py-3.5 px-6 font-bold text-[#111827]">
                          {rec.applicant_name}
                        </td>
                        <td className="py-3.5 px-6 text-xs">
                          <span className="font-semibold text-gray-900">{rec.document_type}</span>
                          <span className="text-gray-500 block text-[11px] font-mono">
                            {rec.document_number}
                          </span>
                        </td>
                        <td className="py-3.5 px-6">
                          <span
                            className={`font-mono font-bold text-xs ${
                              rec.risk_score <= 30
                                ? 'text-[#16A34A]'
                                : rec.risk_score <= 60
                                ? 'text-[#D97706]'
                                : 'text-[#DC2626]'
                            }`}
                          >
                            {rec.risk_score} / 100
                          </span>
                        </td>
                        <td className="py-3.5 px-6 font-mono text-xs text-gray-600">
                          {rec.verified_by}
                        </td>
                        <td className="py-3.5 px-6 text-gray-500 font-mono text-[11px]">
                          {new Date(rec.created_at).toISOString().replace('T', ' ').slice(0, 19)}
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
          {/* Header Banner */}
          <div className="p-5 rounded-[12px] bg-white border border-gray-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111827]">
                  Tamper-Evident SHA-256 Hash Chain
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Sequential cryptographic hashing across blocks. Direct database tampering invalidates the Merkle hash chain.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {isTamperSimulated ? (
                <button
                  onClick={handleRestoreChain}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#D97706] hover:bg-[#B45309] text-white transition-colors cursor-pointer shadow-2xs"
                >
                  Restore Ledger State
                </button>
              ) : (
                <button
                  onClick={handleSimulateTamper}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#FEE2E2] hover:bg-[#FCA5A5]/40 text-[#B91C1C] border border-[#DC2626]/30 transition-colors cursor-pointer"
                  title="Simulates an attacker modifying a database row directly"
                >
                  Simulate Row Corruption
                </button>
              )}

              <button
                onClick={handleVerifyIntegrity}
                disabled={isVerifyingChain}
                id="btn-verify-audit-integrity"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#4F46E5] hover:bg-[#4338CA] text-white transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
              >
                {isVerifyingChain ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Chain...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Ledger Integrity</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Verification Result Toast/Banner */}
          {chainResult && (
            <div
              className={`p-4 rounded-[12px] border text-xs flex items-center justify-between gap-4 shadow-2xs ${
                chainResult.isValid
                  ? 'bg-[#DCFCE7] border-[#16A34A]/30 text-[#15803D]'
                  : 'bg-[#FEE2E2] border-[#DC2626]/30 text-[#B91C1C]'
              }`}
            >
              <div className="flex items-center gap-3">
                {chainResult.isValid ? (
                  <CheckCircle2 className="w-6 h-6 text-[#16A34A] shrink-0" />
                ) : (
                  <AlertOctagon className="w-6 h-6 text-[#DC2626] shrink-0" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {chainResult.isValid
                      ? '✓ Cryptographic Audit Chain Valid — 0 Hash Collisions'
                      : '✕ Cryptographic Integrity Violation Detected'}
                  </div>
                  <p className="text-xs mt-0.5 opacity-90">{chainResult.message}</p>
                </div>
              </div>

              <div className="text-xs font-bold px-3 py-1 rounded-full bg-white/80 border border-black/10 shrink-0">
                {chainResult.totalBlocks} Blocks Verified
              </div>
            </div>
          )}

          {/* Blockchain Ledger Table */}
          <div className="bg-white border border-gray-100 rounded-[12px] shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between text-xs font-bold">
              <span className="text-[#111827]">
                Ledger Blocks ({auditLogs.length})
              </span>
              <span className="text-gray-500 font-mono text-[11px]">
                Algorithm: SHA-256 Sequential Chain
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F6F8] text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-6">Block #</th>
                    <th className="py-3 px-6">Verification ID</th>
                    <th className="py-3 px-6">Officer</th>
                    <th className="py-3 px-6">Document Payload Hash</th>
                    <th className="py-3 px-6">Previous Hash</th>
                    <th className="py-3 px-6">Current Hash</th>
                    <th className="py-3 px-6">Integrity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-xs">
                  {auditLogs.map((log, index) => (
                    <tr
                      key={log.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        log.document_hash.includes('TAMPERED') ? 'bg-[#FEE2E2]/60' : ''
                      }`}
                    >
                      <td className="py-3 px-6 font-bold text-[#111827]">
                        #{index + 1}
                      </td>
                      <td className="py-3 px-6 font-bold text-[#4F46E5]">
                        {log.verification_id}
                      </td>
                      <td className="py-3 px-6 text-gray-600">{log.officer_id}</td>
                      <td className="py-3 px-6 text-gray-900 truncate max-w-xs font-mono">
                        {log.document_hash}
                      </td>
                      <td className="py-3 px-6 text-gray-500 truncate max-w-xs font-mono">
                        {log.previous_hash.slice(0, 16)}...
                      </td>
                      <td className="py-3 px-6 font-bold text-gray-900 truncate max-w-xs font-mono">
                        {log.current_hash.slice(0, 16)}...
                      </td>
                      <td className="py-3 px-6">
                        {log.document_hash.includes('TAMPERED') ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#B91C1C]">
                            Corrupted
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#15803D]">
                            Valid
                          </span>
                        )}
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
