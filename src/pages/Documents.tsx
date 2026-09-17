import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Eye,
} from 'lucide-react';
import { RegisteredDocument } from '../types/verification';
import { fetchRegisteredDocuments } from '../services/verificationService';
import { formatVisualDate } from '../utils/mrzUtils';

interface DocumentsProps {
  onVerifyDocument?: (docNumber: string) => void;
}

export const Documents: React.FC<DocumentsProps> = ({ onVerifyDocument }) => {
  const [documents, setDocuments] = useState<RegisteredDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedDoc, setSelectedDoc] = useState<RegisteredDocument | null>(null);

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

  const renderStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'ACTIVE' || s === 'VALID') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#DCFCE7] text-[#15803D] border border-green-300 text-[13px] font-bold uppercase">
          <CheckCircle2 className="w-4 h-4" />
          <span>ACTIVE</span>
        </span>
      );
    }
    if (s === 'EXPIRED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#FEE2E2] text-[#B91C1C] border border-red-300 text-[13px] font-bold uppercase">
          <Clock className="w-4 h-4" />
          <span>EXPIRED</span>
        </span>
      );
    }
    if (s === 'TAMPERED' || s === 'SUSPENDED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#FEF3C7] text-[#B45309] border border-amber-300 text-[13px] font-bold uppercase">
          <AlertTriangle className="w-4 h-4" />
          <span>SUSPENDED</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#EAF2FF] text-[#64748B] border border-[#C9DCF8] text-[13px] font-bold uppercase">
        <XCircle className="w-4 h-4" />
        <span>UNKNOWN</span>
      </span>
    );
  };

  return (
    <div
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className="p-4 md:p-6 max-w-7xl mx-auto space-y-5 text-[#10233F]"
    >
      {/* Header Bar */}
      <div className="bg-white border border-[#C9DCF8] rounded-[8px] p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-[#10233F] uppercase tracking-tight">
            Documents Registry
          </h1>
          <p className="text-[17px] text-[#64748B] mt-1 font-normal">
            Registered identity documents database
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-5 py-3 rounded-[6px] text-[15px] font-bold bg-white text-[#10233F] border border-[#C9DCF8] hover:bg-[#EAF2FF] cursor-pointer flex items-center gap-2 uppercase"
          >
            <RefreshCw className="w-4 h-4 text-[#2563EB]" />
            <span>Sync Registry</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-[#C9DCF8] rounded-[8px] p-6 flex flex-col md:flex-row items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#64748B]">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search document number, full name, or nationality..."
            className="w-full pl-12 pr-4 py-3 bg-[#F5F9FF] border border-[#C9DCF8] focus:border-[#2563EB] rounded-[6px] text-[16px] text-[#10233F] placeholder-[#64748B] outline-none font-normal"
          />
        </form>

        <div className="flex items-center gap-4 w-full md:w-auto text-[15px]">
          <div className="flex items-center gap-2 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px] px-3 py-2.5 text-[#10233F]">
            <Filter className="w-4 h-4 text-[#2563EB]" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter documents by type"
              className="bg-transparent border-none text-[15px] text-[#10233F] font-bold outline-none cursor-pointer"
            >
              <option value="ALL">All Document Types</option>
              <option value="Passport">Passport</option>
              <option value="Driving License">Driving License</option>
              <option value="National ID">National ID</option>
              <option value="Permit">Visa / Permit</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px] px-3 py-2.5 text-[#10233F]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter documents by status"
              className="bg-transparent border-none text-[15px] text-[#10233F] font-bold outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="VALID">Active / Valid</option>
              <option value="EXPIRED">Expired</option>
              <option value="TAMPERED">Tampered / Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white border border-[#C9DCF8] rounded-[8px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[16px]">
            <thead className="bg-[#EAF2FF] border-b border-[#C9DCF8] text-[#10233F] uppercase font-bold text-[14px]">
              <tr>
                <th className="py-3.5 px-5">Document Type</th>
                <th className="py-3.5 px-5">Document Number</th>
                <th className="py-3.5 px-5">Full Name</th>
                <th className="py-3.5 px-5">Nationality</th>
                <th className="py-3.5 px-5">Date of Expiry</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C9DCF8] text-[#10233F]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    <span>Loading documents registry...</span>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    <span>No registered documents found.</span>
                  </td>
                </tr>
              ) : (
                documents.map((doc, idx) => (
                  <tr key={doc.id || idx} className="hover:bg-[#F5F9FF]">
                    <td className="py-3.5 px-5 font-bold">
                      {doc.document_type || 'Passport'}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-[#2563EB]">
                      {doc.document_number}
                    </td>
                    <td className="py-3.5 px-5 font-normal">
                      {doc.applicant_name}
                    </td>
                    <td className="py-3.5 px-5 font-normal">
                      {doc.nationality || 'IND'}
                    </td>
                    <td className="py-3.5 px-5 text-[#64748B]">
                      {formatVisualDate(doc.date_of_expiry) || 'N/A'}
                    </td>
                    <td className="py-3.5 px-5">
                      {renderStatusBadge(doc.status)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="px-4 py-1.5 rounded-[4px] bg-[#2563EB] text-white text-[14px] font-bold cursor-pointer inline-flex items-center gap-1.5 uppercase"
                      >
                        <Eye className="w-4 h-4" />
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

      {/* Document Inspection Detail Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-[#102A56]/60 flex items-center justify-center p-4">
          <div className="bg-white border border-[#C9DCF8] rounded-[8px] max-w-2xl w-full p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#C9DCF8] pb-4">
              <h2 className="text-[24px] font-bold text-[#10233F] uppercase">
                Document Details
              </h2>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-[#64748B] hover:text-[#10233F] font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[16px]">
              <div className="p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                <span className="text-[13px] font-bold text-[#64748B] uppercase block">Document Number</span>
                <span className="font-bold text-[#2563EB] block">{selectedDoc.document_number}</span>
              </div>
              <div className="p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                <span className="text-[13px] font-bold text-[#64748B] uppercase block">Full Name</span>
                <span className="font-bold text-[#10233F] block">{selectedDoc.applicant_name}</span>
              </div>
              <div className="p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                <span className="text-[13px] font-bold text-[#64748B] uppercase block">Document Type</span>
                <span className="font-bold text-[#10233F] block">{selectedDoc.document_type}</span>
              </div>
              <div className="p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                <span className="text-[13px] font-bold text-[#64748B] uppercase block">Nationality</span>
                <span className="font-bold text-[#10233F] block">{selectedDoc.nationality}</span>
              </div>
              <div className="p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                <span className="text-[13px] font-bold text-[#64748B] uppercase block">Date of Expiry</span>
                <span className="font-bold text-[#10233F] block">{formatVisualDate(selectedDoc.date_of_expiry)}</span>
              </div>
              <div className="p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                <span className="text-[13px] font-bold text-[#64748B] uppercase block">Status</span>
                <span className="font-bold block mt-1">{renderStatusBadge(selectedDoc.status)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#C9DCF8]">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-6 py-2.5 bg-[#2563EB] text-white font-bold text-[15px] uppercase rounded-[6px] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
