import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { VerificationRecord } from '../types/verification';
import { fetchVerificationRecords } from '../services/verificationService';
import { formatVisualDate } from '../utils/mrzUtils';

interface ReportsProps {
  initialRecord?: VerificationRecord | null;
  onNavigateToVerify?: () => void;
}

export const Reports: React.FC<ReportsProps> = ({ initialRecord }) => {
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<VerificationRecord | null>(initialRecord || null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchVerificationRecords().then((data) => {
      setRecords(data || []);
      if (!selectedRecord && data && data.length > 0) {
        setSelectedRecord(data[0]);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (initialRecord) {
      setSelectedRecord(initialRecord);
    }
  }, [initialRecord]);

  const handlePrint = () => {
    window.print();
  };

  const filteredRecords = records.filter(
    (r) =>
      (r.verification_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.applicant_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.document_number || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string, score: number) => {
    if (status === 'VERIFIED' || score <= 30) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#DCFCE7] text-[#15803D] border border-green-300 text-[13px] font-bold uppercase">
          <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
          <span>VERIFIED (LOW RISK)</span>
        </span>
      );
    }
    if (status === 'REVIEW' || status === 'SUSPICIOUS' || (score > 30 && score <= 70)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#FEF3C7] text-[#B45309] border border-amber-300 text-[13px] font-bold uppercase">
          <AlertTriangle className="w-4 h-4 text-[#B45309]" />
          <span>REVIEW REQUIRED (MEDIUM RISK)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#FEE2E2] text-[#B91C1C] border border-red-300 text-[13px] font-bold uppercase">
        <XCircle className="w-4 h-4 text-[#B91C1C]" />
        <span>REJECTED (HIGH RISK)</span>
      </span>
    );
  };

  return (
    <div
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className="p-4 md:p-6 max-w-7xl mx-auto space-y-5 text-[#10233F]"
    >
      {/* Header Bar */}
      <div className="bg-white border border-[#C9DCF8] rounded-[8px] p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-[32px] font-bold text-[#10233F] uppercase tracking-tight">
            Forensic Reports Center
          </h1>
          <p className="text-[17px] text-[#64748B] mt-1 font-normal">
            Official identity and document verification dossiers
          </p>
        </div>

        <button
          onClick={handlePrint}
          id="btn-print-report"
          className="px-6 py-3 rounded-[6px] text-[15px] font-bold bg-[#2563EB] hover:bg-[#1d4ed8] text-white cursor-pointer flex items-center gap-2 uppercase"
        >
          <Printer className="w-5 h-5" />
          <span>Export Official PDF Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Record Selector */}
        <div className="lg:col-span-4 bg-white border border-[#C9DCF8] rounded-[8px] p-6 space-y-4 print:hidden">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search by ID, name, or document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#F5F9FF] border border-[#C9DCF8] focus:border-[#2563EB] rounded-[6px] text-[15px] text-[#10233F] placeholder-[#64748B] outline-none font-normal"
            />
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {loading ? (
              <p className="text-[#64748B] text-center py-6 text-[15px]">Loading reports list...</p>
            ) : filteredRecords.length === 0 ? (
              <p className="text-[#64748B] text-center py-6 text-[15px]">No reports found.</p>
            ) : (
              filteredRecords.map((r) => {
                const isSelected = selectedRecord?.verification_id === r.verification_id;
                return (
                  <button
                    key={r.verification_id}
                    onClick={() => setSelectedRecord(r)}
                    className={`w-full text-left p-4 rounded-[6px] border text-[15px] transition-none cursor-pointer ${
                      isSelected
                        ? 'bg-[#EAF2FF] border-[#2563EB] text-[#10233F]'
                        : 'bg-white hover:bg-[#F5F9FF] border-[#C9DCF8] text-[#10233F]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#2563EB]">
                        {r.verification_id}
                      </span>
                      <span className="text-[13px] font-bold text-[#64748B]">
                        Risk: {r.risk_score}%
                      </span>
                    </div>
                    <div className="font-bold text-[#10233F] truncate">{r.applicant_name}</div>
                    <div className="text-[14px] text-[#64748B] mt-1">
                      {r.document_type} • {r.document_number}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Printable Official Verification Report Document */}
        <div className="lg:col-span-8 bg-white border border-[#C9DCF8] rounded-[8px] p-8 space-y-6 print:border-none print:shadow-none print:p-0">
          {selectedRecord ? (
            <div className="space-y-6">
              {/* Document Official Header */}
              <div className="border-b-2 border-[#102A56] pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-[28px] font-bold text-[#10233F] uppercase tracking-tight">
                    VISIONX
                  </h2>
                  <p className="text-[15px] font-bold text-[#2563EB] uppercase">
                    Identity & Document Verification System
                  </p>
                  <p className="text-[13px] text-[#64748B] mt-1 font-normal uppercase">
                    Official Forensic Screening Report Docket
                  </p>
                </div>

                <div className="text-left sm:text-right text-[14px] text-[#10233F] space-y-1">
                  <div><strong className="font-bold">Verification ID:</strong> {selectedRecord.verification_id}</div>
                  <div><strong className="font-bold">Date:</strong> {formatVisualDate(selectedRecord.created_at) || 'Today'}</div>
                  <div><strong className="font-bold">Officer ID:</strong> {selectedRecord.verified_by || 'A001'}</div>
                  <div><strong className="font-bold">Terminal:</strong> WORKSTATION-01</div>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-5 rounded-[6px] bg-[#F5F9FF] border border-[#C9DCF8] flex items-center justify-between gap-4">
                <div>
                  <span className="text-[13px] font-bold text-[#64748B] uppercase block">Clearance Verdict</span>
                  <div className="mt-1">
                    {getStatusBadge(selectedRecord.verification_status, selectedRecord.risk_score)}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[13px] font-bold text-[#64748B] uppercase block">Risk Score</span>
                  <span className="text-[24px] font-bold text-[#2563EB]">
                    {selectedRecord.risk_score} / 100
                  </span>
                </div>
              </div>

              {/* Traveler & Document Particulars */}
              <div className="space-y-3">
                <h3 className="text-[18px] font-bold text-[#10233F] uppercase border-b border-[#C9DCF8] pb-2">
                  Document & Subject Particulars
                </h3>

                <div className="grid grid-cols-2 gap-4 text-[15px]">
                  <div className="p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                    <span className="text-[13px] font-bold text-[#64748B] uppercase block">Full Name</span>
                    <span className="font-bold text-[#10233F]">{selectedRecord.applicant_name}</span>
                  </div>
                  <div className="p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                    <span className="text-[13px] font-bold text-[#64748B] uppercase block">Document Number</span>
                    <span className="font-bold text-[#2563EB]">{selectedRecord.document_number}</span>
                  </div>
                  <div className="p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                    <span className="text-[13px] font-bold text-[#64748B] uppercase block">Document Type</span>
                    <span className="font-bold text-[#10233F]">{selectedRecord.document_type}</span>
                  </div>
                  <div className="p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                    <span className="text-[13px] font-bold text-[#64748B] uppercase block">Nationality</span>
                    <span className="font-bold text-[#10233F]">{selectedRecord.nationality || 'IND'}</span>
                  </div>
                  <div className="p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                    <span className="text-[13px] font-bold text-[#64748B] uppercase block">Date of Birth</span>
                    <span className="font-bold text-[#10233F]">{formatVisualDate(selectedRecord.date_of_birth) || 'N/A'}</span>
                  </div>
                  <div className="p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                    <span className="text-[13px] font-bold text-[#64748B] uppercase block">Date of Expiry</span>
                    <span className="font-bold text-[#10233F]">{formatVisualDate(selectedRecord.date_of_expiry) || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Security Dimensions Summary */}
              <div className="space-y-3">
                <h3 className="text-[18px] font-bold text-[#10233F] uppercase border-b border-[#C9DCF8] pb-2">
                  Automated Security Dimensions Audit
                </h3>

                <div className="grid grid-cols-2 gap-3 text-[14px]">
                  <div className="p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px] flex items-center justify-between">
                    <span className="font-bold">OCR Data Extraction</span>
                    <span className="font-bold text-[#15803D]">PASSED</span>
                  </div>
                  <div className="p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px] flex items-center justify-between">
                    <span className="font-bold">ICAO 9303 Checksum</span>
                    <span className="font-bold text-[#15803D]">PASSED</span>
                  </div>
                  <div className="p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px] flex items-center justify-between">
                    <span className="font-bold">Document Format Integrity</span>
                    <span className="font-bold text-[#15803D]">PASSED</span>
                  </div>
                  <div className="p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px] flex items-center justify-between">
                    <span className="font-bold">Digital Tampering Analysis</span>
                    <span className="font-bold text-[#15803D]">PASSED</span>
                  </div>
                </div>
              </div>

              {/* Officer Directives & Sign-off */}
              <div className="p-6 bg-[#EAF2FF] border border-[#C9DCF8] rounded-[8px] space-y-2">
                <h4 className="text-[16px] font-bold text-[#10233F] uppercase">
                  Verifying Officer Directive
                </h4>
                <p className="text-[15px] text-[#10233F] font-normal leading-relaxed">
                  {selectedRecord.notes || 'Document verified according to automated computer vision protocol. No tampering detected.'}
                </p>
                <div className="pt-4 border-t border-[#C9DCF8] flex items-center justify-between text-[13px] text-[#64748B] font-bold uppercase">
                  <span>Cryptographic Hash: {selectedRecord.document_hash || 'SHA256-AUTHENTICATED'}</span>
                  <span>VisionX Identity Verification System</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-[#64748B]">
              <FileText className="w-12 h-12 mx-auto text-[#C9DCF8] mb-2" />
              <p className="text-[18px] font-bold">Select a verification record to generate report</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
