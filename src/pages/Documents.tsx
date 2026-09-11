import React, { useState, useEffect } from 'react';
import { Search, Filter, ShieldCheck, FileText, CheckCircle2, Clock, XCircle, AlertTriangle, RefreshCw, Database } from 'lucide-react';
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#15803D]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Valid
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#B91C1C]">
            <Clock className="w-3.5 h-3.5" />
            Expired
          </span>
        );
      case 'TAMPERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#B91C1C]">
            <AlertTriangle className="w-3.5 h-3.5" />
            Tampered
          </span>
        );
      case 'REVOKED':
      case 'NOT FOUND':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
            <XCircle className="w-3.5 h-3.5 text-gray-500" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-[#111827]">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#EEF2FF] text-[#4F46E5]">
              Sovereign Repository
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Central Registry & Watchlist
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#111827] tracking-tight mt-1">
            Registered Documents & Sovereign Watchlist
          </h1>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-2xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#4F46E5] ${refreshing ? 'animate-spin' : ''}`} />
          <span>Synchronize Ledger</span>
        </button>
      </div>

      {/* Filter & Search Card */}
      <div className="p-4 rounded-[12px] bg-white border border-gray-100 shadow-2xs flex flex-col md:flex-row items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search document number, holder name, or passport serial..."
            className="w-full pl-10 pr-4 py-2 bg-[#F5F6F8] border border-gray-200 rounded-xl text-xs text-[#111827] placeholder-gray-400 focus:border-[#4F46E5] focus:bg-white transition-all font-medium"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto text-xs">
          {/* Doc Type Filter */}
          <div className="flex items-center gap-1.5 bg-[#F5F6F8] border border-gray-200 rounded-xl px-3 py-1.5 text-gray-700">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter documents by type"
              className="bg-transparent border-none text-xs text-[#111827] font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Document Types</option>
              <option value="Passport">Passport</option>
              <option value="Driving License">Driving License</option>
              <option value="Visa">Visa</option>
              <option value="National ID">National ID</option>
              <option value="Permit">Border Permit</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#F5F6F8] border border-gray-200 rounded-xl px-3 py-1.5 text-gray-700">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter documents by status"
              className="bg-transparent border-none text-xs text-[#111827] font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="VALID">Valid</option>
              <option value="EXPIRED">Expired</option>
              <option value="TAMPERED">Tampered</option>
              <option value="REVOKED">Revoked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white border border-gray-100 rounded-[12px] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F6F8] text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Document No.</th>
                <th className="py-3 px-6">Holder Full Name</th>
                <th className="py-3 px-6">Type</th>
                <th className="py-3 px-6">Nationality</th>
                <th className="py-3 px-6">Cryptographic Hash</th>
                <th className="py-3 px-6">Expiry Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-6 h-6 text-[#4F46E5] animate-spin" />
                      <span className="text-xs font-semibold text-gray-500">Querying sovereign database...</span>
                    </div>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-2 max-w-md mx-auto">
                      <Database className="w-8 h-8 text-gray-300" />
                      <div className="font-bold text-sm text-[#111827]">
                        No matching document records in local registry
                      </div>
                      <p className="text-xs text-gray-500">
                        Load benchmark records or execute screening on new identity files.
                      </p>
                      <button
                        onClick={handleRefresh}
                        className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#4F46E5] hover:bg-[#4338CA] text-white cursor-pointer transition-colors shadow-2xs"
                      >
                        Refresh Database
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id || doc.document_number} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-6">
                      {renderStatusBadge(doc.document_status)}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-[#111827]">
                      {doc.document_number}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-[#111827]">
                      {doc.full_name}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase bg-[#F5F6F8] text-gray-700 border border-gray-200">
                        {doc.document_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-gray-600 font-mono text-xs">
                      {doc.nationality || 'IND'}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-[11px] text-gray-500">
                      {doc.document_hash ? `${doc.document_hash.substring(0, 16)}...` : 'Pending'}
                    </td>
                    <td className="py-3.5 px-6">
                      {doc.date_of_expiry ? (() => {
                        const evalRes = evaluateRealTimeExpiry(doc.date_of_expiry);
                        return (
                          <div>
                            <span
                              className={`font-mono text-xs font-bold block ${
                                evalRes.isExpired ? 'text-[#DC2626]' : 'text-[#111827]'
                              }`}
                            >
                              {formatVisualDate(doc.date_of_expiry)}
                            </span>
                            <span
                              className={`block text-[10px] font-mono mt-0.5 ${
                                evalRes.isExpired ? 'text-red-700 font-semibold' : 'text-gray-400'
                              }`}
                            >
                              {doc.date_of_expiry} • {evalRes.relativeTimeText}
                            </span>
                          </div>
                        );
                      })() : (
                        <span className="font-mono text-gray-400 text-xs">N/A</span>
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
