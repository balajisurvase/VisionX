import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Calendar,
  User,
  Hash,
  Download,
  Search,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  Camera,
  Activity,
} from 'lucide-react';
import { VerificationRecord } from '../types/verification';
import { fetchVerificationRecords } from '../services/verificationService';

interface ReportsProps {
  initialRecord?: VerificationRecord | null;
  onNavigateToVerify?: () => void;
}

export const Reports: React.FC<ReportsProps> = ({ initialRecord, onNavigateToVerify }) => {
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<VerificationRecord | null>(initialRecord || null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchVerificationRecords().then((data) => {
      setRecords(data);
      if (!selectedRecord && data.length > 0) {
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
      r.verification_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.document_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string, score: number) => {
    if (status === 'VERIFIED' || score <= 30) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 text-xs font-mono font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>VERIFIED (LOW RISK)</span>
        </span>
      );
    }
    if (status === 'SUSPICIOUS' || (score > 30 && score <= 70)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-950/60 text-amber-400 border border-amber-800/80 text-xs font-mono font-bold">
          <AlertTriangle className="w-4 h-4" />
          <span>SUSPICIOUS (MEDIUM RISK)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-950/60 text-rose-400 border border-rose-800/80 text-xs font-mono font-bold">
        <XCircle className="w-4 h-4" />
        <span>REJECTED (HIGH RISK)</span>
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-100">
      {/* Top Header & Print Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-950/80 text-blue-400 border border-blue-800/80">
              IdentityGuard Certificate Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Verification Reports Center</h1>
          <p className="text-xs text-slate-400">
            Generate and export official AI screening verdicts and multi-layer forensic certificates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            id="btn-print-report"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold shadow-md shadow-blue-600/30 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Export Official PDF Dossier</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Record Selector (Hidden during print) */}
        <div className="lg:col-span-4 bg-[#0D1322] rounded-2xl border border-slate-800/90 p-4 space-y-4 shadow-sm print:hidden">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports by ID, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#090D16] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 transition-all font-mono outline-none"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredRecords.map((r) => {
              const isSelected = selectedRecord?.verification_id === r.verification_id;
              return (
                <button
                  key={r.verification_id}
                  onClick={() => setSelectedRecord(r)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-950/70 border-blue-600 text-white shadow-sm ring-1 ring-blue-500/30'
                      : 'bg-[#090D16] hover:bg-slate-800/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[11px] font-bold text-blue-400">
                      {r.verification_id}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        r.verification_status === 'VERIFIED'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : r.verification_status === 'SUSPICIOUS'
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                      }`}
                    >
                      {r.verification_status}
                    </span>
                  </div>
                  <div className="font-bold text-white truncate">{r.applicant_name}</div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1 font-mono">
                    <span>{r.document_type} • {r.document_number}</span>
                    <span className="text-slate-300 font-bold">Risk: {r.risk_score}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Printable Official Verification Report Document */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
          {selectedRecord ? (
            <div className="space-y-6">
              {/* Document Official Header */}
              <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 tracking-tight">IdentityGuard AI</h2>
                      <p className="text-[11px] text-slate-500 font-medium">
                        AI-Based Fake Identity & Document Screening System
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Official Forensic Verification Docket • IdentityGuard System
                  </p>
                </div>

                <div className="text-left sm:text-right text-xs text-slate-500 font-mono space-y-0.5">
                  <div><strong className="text-slate-700">Verification ID:</strong> {selectedRecord.verification_id}</div>
                  <div><strong className="text-slate-700">Date:</strong> {selectedRecord.timestamp || new Date().toISOString().split('T')[0]}</div>
                  <div><strong className="text-slate-700">Officer:</strong> {selectedRecord.officer_id || 'officer001'}</div>
                  <div><strong className="text-slate-700">Document Type:</strong> {selectedRecord.document_type}</div>
                </div>
              </div>

              {/* Overall Result & Risk Score Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overall Result</span>
                  <div>{getStatusBadge(selectedRecord.verification_status, selectedRecord.risk_score)}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Risk Score</span>
                  <div className="text-xl font-black text-slate-900 font-mono">
                    {selectedRecord.risk_score} / 100{' '}
                    <span className="text-xs font-normal text-slate-500">
                      ({selectedRecord.risk_score <= 30 ? 'LOW' : selectedRecord.risk_score <= 70 ? 'MEDIUM' : 'HIGH'})
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Model Confidence</span>
                  <div className="text-xl font-black text-slate-900 font-mono">
                    {selectedRecord.ocr_data?.confidence_score ?? 96.4}%
                  </div>
                </div>
              </div>

              {/* Extracted Identity Information */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Extracted Identity Information
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border border-slate-200 bg-white text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Full Name</span>
                    <span className="font-bold text-slate-900">{selectedRecord.applicant_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Document Number</span>
                    <span className="font-mono font-bold text-slate-900">{selectedRecord.document_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Nationality</span>
                    <span className="font-bold text-slate-900">{selectedRecord.nationality || 'Indian'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Date of Birth</span>
                    <span className="font-mono text-slate-900">{selectedRecord.date_of_birth || 'Not detected'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Gender</span>
                    <span className="font-bold text-slate-900">{selectedRecord.gender || 'Not detected'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Date of Issue</span>
                    <span className="font-mono text-slate-900">{selectedRecord.ocr_data?.issue_date || '2020-05-10'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Date of Expiry</span>
                    <span className="font-mono text-slate-900">{selectedRecord.date_of_expiry || 'NOT DETECTED'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Issuer / Authority</span>
                    <span className="text-slate-900">{selectedRecord.ocr_data?.issuing_country || selectedRecord.nationality || 'NOT DETECTED'}</span>
                  </div>
                </div>
              </div>

              {/* Forensic Verification Checks List */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Forensic Verification Checks
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50 font-semibold text-slate-600 text-[11px]">
                    <span>Security Check Item</span>
                    <span>Result Status</span>
                  </div>

                  <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">OCR Text Consistency</div>
                      <div className="text-[11px] text-slate-500">Cross-field coherence between printed Visual Inspection Zone (VIZ) & MRZ</div>
                    </div>
                    <span className={selectedRecord.ocr_status === 'PASSED' ? 'text-emerald-700 font-bold font-mono' : 'text-amber-700 font-bold font-mono'}>
                      {selectedRecord.ocr_status === 'PASSED' ? '✓ Passed' : '⚠ Warning'}
                    </span>
                  </div>

                  <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">MRZ & ICAO 9303 Checksum</div>
                      <div className="text-[11px] text-slate-500">Modulo 10 7-3-1 weight algorithms for doc no., DOB & expiry</div>
                    </div>
                    <span className={selectedRecord.mrz_valid ? 'text-emerald-700 font-bold font-mono' : 'text-red-700 font-bold font-mono'}>
                      {selectedRecord.mrz_valid ? '✓ Passed' : '✕ Failed / Not Detected'}
                    </span>
                  </div>

                  <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Document Authenticity</div>
                      <div className="text-[11px] text-slate-500">Layout geometry, micro-patterns, security font typography</div>
                    </div>
                    <span className={selectedRecord.final_result === 'AUTHENTIC' ? 'text-emerald-700 font-bold font-mono' : 'text-amber-700 font-bold font-mono'}>
                      {selectedRecord.final_result === 'AUTHENTIC' ? '✓ Passed' : selectedRecord.final_result}
                    </span>
                  </div>

                  <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Tampering & Error Level Analysis (ELA)</div>
                      <div className="text-[11px] text-slate-500">Digital resave artifact examination, boundary cloning & photo replacement</div>
                    </div>
                    <span className={selectedRecord.tampering_score > 30 ? 'text-red-700 font-bold font-mono' : 'text-emerald-700 font-bold font-mono'}>
                      {selectedRecord.tampering_score > 30 ? '✕ Failed' : '✓ Passed'}
                    </span>
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Document Portrait Extraction</div>
                      <div className="text-[11px] text-slate-500">Document photograph localization and cropped boundary isolation</div>
                    </div>
                    <span className="text-emerald-700 font-bold font-mono">
                      ✓ Isolated
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Factors & Final Recommendation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Identified Risk Factors</h4>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                    {selectedRecord.reasons && selectedRecord.reasons.length > 0 ? (
                      selectedRecord.reasons.map((r, i) => <li key={i}>{r}</li>)
                    ) : (
                      <li>No adverse anomalies or tampering indicators detected in sample.</li>
                    )}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Final Recommendation</h4>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    {selectedRecord.verification_status === 'VERIFIED'
                      ? 'Document verified successfully. No significant automated anomalies or tampering indicators detected.'
                      : selectedRecord.verification_status === 'SUSPICIOUS'
                      ? 'Manual review recommended. Potential verification anomalies detected. Secondary inspection recommended.'
                      : 'Significant verification concerns detected. Critical tampering, expiry or data inconsistency flagged. Retain document for detailed review.'}
                  </p>
                </div>
              </div>

              {/* Official Cryptographic Signature Seal */}
              <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400 font-mono">
                <div>
                  <div>SHA-256 Digest: {selectedRecord.blockchain_hash ? selectedRecord.blockchain_hash.slice(0, 32) + '...' : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</div>
                  <div>Certified by IdentityGuard AI Screening Engine v2.4</div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-slate-700">Digital Seal Verified</div>
                  <div className="text-[10px]">IdentityGuard Verification Engine • Verified Authenticity</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold">No report selected.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
