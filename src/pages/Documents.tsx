import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  Download,
  Calendar,
  Eye,
} from 'lucide-react';
import { DocumentType, DocStatus, RegisteredDocument } from '../types/verification';
import { fetchRegisteredDocuments } from '../services/verificationService';
import { formatVisualDate, evaluateRealTimeExpiry } from '../utils/mrzUtils';

export const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<RegisteredDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await fetchRegisteredDocuments(
        typeFilter === 'ALL' ? undefined : typeFilter,
        statusFilter === 'ALL' ? undefined : statusFilter,
        searchTerm.trim() || undefined
      );
      setDocuments(data || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setDocuments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [typeFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDocuments();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDocuments();
  };

  const renderStatusBadge = (status: DocStatus) => {
    switch (status) {
      case 'VALID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>VALID</span>
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-rose-950/60 text-rose-400 border border-rose-800/80">
            <Clock className="w-3.5 h-3.5" />
            <span>EXPIRED</span>
          </span>
        );
      case 'TAMPERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-rose-950/60 text-rose-400 border border-rose-800/80">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>TAMPERED</span>
          </span>
        );
      case 'REVOKED':
      case 'NOT FOUND':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
            <XCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-100">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-950/80 text-blue-400 border border-blue-800/80">
              IdentityGuard Central
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Document Audit Registry
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Verification History & Document Records
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit logs and registered document credentials across all verification terminals.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-[#0D1322] hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Sync Database</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-[#0D1322] border border-slate-800/90 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by document number, applicant full name, or nationality..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#090D16] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 transition-all font-mono outline-none"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto text-xs">
          {/* Doc Type Filter */}
          <div className="flex items-center gap-1.5 bg-[#090D16] border border-slate-800 rounded-xl px-3 py-2 text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter documents by type"
              className="bg-transparent border-none text-xs text-white font-mono font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Document Types</option>
              <option value="Passport" className="bg-slate-900 text-white">Passport</option>
              <option value="Driving License" className="bg-slate-900 text-white">Driving License</option>
              <option value="Visa" className="bg-slate-900 text-white">Visa</option>
              <option value="National ID" className="bg-slate-900 text-white">National ID</option>
              <option value="Permit" className="bg-slate-900 text-white">Border Permit</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#090D16] border border-slate-800 rounded-xl px-3 py-2 text-slate-300">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter documents by status"
              className="bg-transparent border-none text-xs text-white font-mono font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Statuses</option>
              <option value="VALID" className="bg-slate-900 text-white">Valid</option>
              <option value="EXPIRED" className="bg-slate-900 text-white">Expired</option>
              <option value="TAMPERED" className="bg-slate-900 text-white">Tampered</option>
              <option value="REVOKED" className="bg-slate-900 text-white">Revoked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-[#0D1322] border border-slate-800/90 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090D16] text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Document No.</th>
                <th className="py-3.5 px-6">Applicant Name</th>
                <th className="py-3.5 px-6">Type</th>
                <th className="py-3.5 px-6">Nationality</th>
                <th className="py-3.5 px-6">Hash / Reference</th>
                <th className="py-3.5 px-6">Date of Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                      <span className="text-xs font-mono font-semibold text-slate-400">
                        Querying verification records...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2 max-w-md mx-auto">
                      <Database className="w-8 h-8 text-slate-500" />
                      <div className="font-bold text-sm text-white">
                        No matching document records found
                      </div>
                      <p className="text-xs text-slate-400 font-mono">
                        Try clearing search filters or execute a new verification scan.
                      </p>
                      <button
                        onClick={handleRefresh}
                        className="mt-2 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer transition-colors shadow-sm"
                      >
                        Refresh Database
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id || doc.document_number} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-6">
                      {renderStatusBadge(doc.document_status)}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-white">
                      {doc.document_number}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-white">
                      {doc.full_name}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {doc.document_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-300 font-mono text-xs">
                      {doc.nationality || 'IND'}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-[11px] text-slate-400">
                      {doc.document_hash ? `${doc.document_hash.substring(0, 16)}...` : 'Verified'}
                    </td>
                    <td className="py-3.5 px-6">
                      {doc.date_of_expiry ? (() => {
                        const evalRes = evaluateRealTimeExpiry(doc.date_of_expiry);
                        return (
                          <div>
                            <span
                              className={`font-mono text-xs font-bold block ${
                                evalRes.isExpired ? 'text-rose-400' : 'text-slate-200'
                              }`}
                            >
                              {formatVisualDate(doc.date_of_expiry)}
                            </span>
                            <span
                              className={`block text-[10px] font-mono mt-0.5 ${
                                evalRes.isExpired ? 'text-rose-400 font-semibold' : 'text-slate-400'
                              }`}
                            >
                              {doc.date_of_expiry} • {evalRes.relativeTimeText}
                            </span>
                          </div>
                        );
                      })() : (
                        <span className="font-mono text-slate-500 text-xs">N/A</span>
                      )}
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
