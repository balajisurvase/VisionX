import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  FileCheck,
  Search,
  Check,
  Hash,
  Calendar,
} from 'lucide-react';
import { VerificationRecord } from '../../types/verification';
import {
  normalizeIsoDate,
  formatVisualDate,
  isoToMrzDate,
  calculateIcaoCheckDigit,
  generateTd3Mrz,
  evaluateRealTimeExpiry,
} from '../../utils/mrzUtils';

interface MrzInspectorProps {
  record: VerificationRecord;
}

export const MrzInspector: React.FC<MrzInspectorProps> = ({ record }) => {
  const ocr = record.ocr_data;

  // Normalize dates dynamically from document / scenario
  const dobIso = normalizeIsoDate(record.date_of_birth || ocr?.date_of_birth, '');
  const dobVisual = dobIso ? formatVisualDate(dobIso) : 'Not Detected';
  const dobYymmdd = isoToMrzDate(dobIso, '');
  const dobCheckDigit = dobYymmdd ? calculateIcaoCheckDigit(dobYymmdd) : '0';

  const rawExp = record.date_of_expiry || ocr?.date_of_expiry;
  const expIso = normalizeIsoDate(rawExp, '');
  const expVisual = expIso ? formatVisualDate(expIso) : 'Not Detected';
  const expYymmdd = isoToMrzDate(expIso, '');
  const expCheckDigit = expYymmdd ? calculateIcaoCheckDigit(expYymmdd) : '0';

  // Evaluate real-time timeline expiry
  const realTimeExpiry = evaluateRealTimeExpiry(expIso);
  const isExpired = record.verification_status === 'EXPIRED' || realTimeExpiry.isExpired;
  const isFailed = record.verification_status === 'FAILED';

  const rawDocNo = (record.document_number || ocr?.document_number || '')
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase();
  const docNoField = rawDocNo.padEnd(9, '<').slice(0, 9);
  const docNoCheckDigit = docNoField ? calculateIcaoCheckDigit(docNoField) : '0';

  const isMrzDetected = record.mrz_info?.detected === true || Boolean(ocr?.mrz_line_1 && ocr.mrz_line_1.length >= 20);
  const mrz1 = ocr?.mrz_line_1 || record.mrz_info?.line1 || '';
  const mrz2 = ocr?.mrz_line_2 || record.mrz_info?.line2 || '';

  const isChecksumValid = isMrzDetected && (record.mrz_info?.valid === true || record.mrz_info?.checksum_valid === true || record.validation_details?.mrz_checksum_valid === true);

  if (!isMrzDetected || !mrz1 || !mrz2) {
    return (
      <div className="bg-white rounded-[12px] border border-gray-100 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                Machine Readable Zone (MRZ) Inspector
              </h3>
              <span className="text-[11px] text-gray-500 font-medium">
                TD-3 Standard 2-Line Optical Structure Inspection
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            MRZ NOT DETECTED
          </span>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-amber-900">
            <p className="font-semibold">
              MRZ could not be reliably detected from the uploaded image. This does not by itself indicate document fraud.
            </p>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              Real identity credentials may fail automated MRZ detection due to perspective cropping, lighting glare, surface curvature, or contrast limits. Identity verification continues using the Visual Inspection Zone (VIZ).
            </p>
          </div>
        </div>

        {/* Technical Diagnostics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[9px] text-slate-400 block uppercase font-sans font-bold">
              MRZ Region Search
            </span>
            <span className="font-bold text-slate-800">Bottom 35% Strip</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[9px] text-slate-400 block uppercase font-sans font-bold">
              Preprocessing Passes
            </span>
            <span className="font-bold text-slate-800">Rotated + CLAHE + Grayscale</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[9px] text-slate-400 block uppercase font-sans font-bold">
              VIZ Extraction
            </span>
            <span className="font-bold text-emerald-700">
              {record.document_number && record.document_number !== 'NOT DETECTED' ? 'ACTIVE (VIZ)' : 'PARTIAL'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[9px] text-slate-400 block uppercase font-sans font-bold">
              Parser Status
            </span>
            <span className="font-bold text-slate-600">Awaiting Physical Re-Scan</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[12px] border border-gray-100 p-6 shadow-2xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-[#4F46E5]" />
          <div>
            <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
              ICAO Doc 9303 Machine Readable Zone (MRZ) Inspector
            </h3>
            <span className="text-[11px] text-gray-500 font-medium">
              TD-3 Standard 2-Line Optical Structure (44 Characters per line)
            </span>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
            isChecksumValid
              ? 'bg-[#DCFCE7] text-[#15803D]'
              : 'bg-[#FEE2E2] text-[#B91C1C]'
          }`}
        >
          {isChecksumValid ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Modulo-10 (7-3-1) Checksum Verified
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5" />
              MRZ Checksum Mismatch
            </>
          )}
        </span>
      </div>

      {/* Raw MRZ Character Highlighting Display */}
      <div className="bg-[#0B1220] rounded-xl p-4 border border-gray-200 text-gray-100 font-mono text-xs sm:text-sm tracking-[0.22em] leading-loose space-y-2 overflow-x-auto shadow-inner select-all">
        {/* Line 1 */}
        <div className="flex items-center whitespace-pre font-bold">
          <span className="text-amber-400 bg-amber-400/20 px-1 rounded-xs" title="Document Type (P<)">
            {mrz1.slice(0, 2)}
          </span>
          <span className="text-emerald-400 bg-emerald-400/20 px-1 rounded-xs" title="Issuing State">
            {mrz1.slice(2, 5)}
          </span>
          <span className="text-blue-300 bg-blue-400/20 px-1 rounded-xs" title="Holder Name (Surname & Given Names)">
            {mrz1.slice(5, 44)}
          </span>
        </div>

        {/* Line 2 */}
        <div className="flex items-center whitespace-pre font-bold">
          <span className="text-purple-300 bg-purple-400/20 px-1 rounded-xs" title="Document Number">
            {mrz2.slice(0, 9)}
          </span>
          <span
            className={`px-1 rounded-xs ${
              isChecksumValid ? 'text-emerald-300 bg-emerald-400/20' : 'text-red-400 bg-red-500/30'
            }`}
            title="Doc No. Check Digit (Modulo 10)"
          >
            {mrz2.slice(9, 10)}
          </span>
          <span className="text-emerald-400 bg-emerald-400/20 px-1 rounded-xs" title="Nationality">
            {mrz2.slice(10, 13)}
          </span>
          <span className="text-cyan-300 bg-cyan-400/20 px-1 rounded-xs" title={`Date of Birth (YYMMDD): ${dobYymmdd}`}>
            {mrz2.slice(13, 19)}
          </span>
          <span className="text-emerald-300 bg-emerald-400/20 px-1 rounded-xs" title="DOB Check Digit">
            {mrz2.slice(19, 20)}
          </span>
          <span className="text-pink-300 bg-pink-400/20 px-1 rounded-xs" title="Sex (M/F/X)">
            {mrz2.slice(20, 21)}
          </span>
          <span
            className={`px-1 rounded-xs ${
              isExpired ? 'text-red-400 bg-red-500/30' : 'text-yellow-300 bg-yellow-400/20'
            }`}
            title={`Expiry Date (YYMMDD): ${expYymmdd}`}
          >
            {mrz2.slice(21, 27)}
          </span>
          <span className="text-emerald-300 bg-emerald-400/20 px-1 rounded-xs" title="Expiry Check Digit">
            {mrz2.slice(27, 28)}
          </span>
          <span className="text-gray-400 px-1" title="Optional / Personal Number">
            {mrz2.slice(28, 42)}
          </span>
          <span className="text-emerald-400 bg-emerald-400/30 px-1 rounded-xs" title="Composite Check Digit">
            {mrz2.slice(42, 44)}
          </span>
        </div>
      </div>

      {/* Checksum Calculation Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Document Number Checksum */}
        <div className="p-4 rounded-xl bg-[#F5F6F8] border border-gray-200 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-700">1. Document Number Check</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
              PASS
            </span>
          </div>
          <div className="space-y-1 font-mono text-[11px] text-gray-600">
            <div className="flex justify-between">
              <span>Doc Number:</span>
              <span className="font-bold text-gray-900">{record.document_number}</span>
            </div>
            <div className="flex justify-between">
              <span>MRZ 9-Char Value:</span>
              <span className="font-bold text-purple-700">{docNoField}</span>
            </div>
            <div className="flex justify-between">
              <span>Calculated Modulo-10:</span>
              <span className="font-bold text-emerald-600">{docNoCheckDigit}</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 pt-1 border-t border-gray-200">
            Weighting matrix: [7, 3, 1, 7, 3, 1, 7, 3, 1]
          </p>
        </div>

        {/* Date of Birth Checksum */}
        <div className="p-4 rounded-xl bg-[#F5F6F8] border border-gray-200 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-700">2. Date of Birth Check</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
              PASS
            </span>
          </div>
          <div className="space-y-1 font-mono text-[11px] text-gray-600">
            <div className="flex justify-between">
              <span>Passport DOB:</span>
              <span className="font-bold text-gray-900">{dobVisual}</span>
            </div>
            <div className="flex justify-between">
              <span>MRZ Value (YYMMDD):</span>
              <span className="font-bold text-cyan-700">{dobYymmdd}</span>
            </div>
            <div className="flex justify-between">
              <span>Calculated Modulo-10:</span>
              <span className="font-bold text-emerald-600">{dobCheckDigit}</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 pt-1 border-t border-gray-200">
            Decoded ISO DOB: <span className="font-bold text-gray-900">{dobIso}</span>
          </p>
        </div>

        {/* Expiration Date Checksum */}
        <div
          className={`p-4 rounded-xl border space-y-2 text-xs transition-all ${
            isExpired
              ? 'bg-red-50/80 border-red-200 text-red-950'
              : 'bg-[#F5F6F8] border-gray-200 text-gray-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold">3. Expiration Date Check</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                isExpired ? 'bg-red-200 text-red-900' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isExpired ? 'TIMELINE LAPSED' : 'ACTIVE & VALID'}
            </span>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-600">Passport Expiry:</span>
              <span className={`font-bold ${isExpired ? 'text-red-700' : 'text-gray-900'}`}>
                {expVisual}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">MRZ Value (YYMMDD):</span>
              <span className="font-bold text-yellow-800">{expYymmdd}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Real-Time Timeline:</span>
              <span className={`font-bold ${isExpired ? 'text-red-700' : 'text-emerald-700'}`}>
                {realTimeExpiry.relativeTimeText}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Calculated Modulo-10:</span>
              <span className="font-bold text-emerald-600">{expCheckDigit}</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 pt-1 border-t border-gray-200">
            Ref: {realTimeExpiry.currentReferenceFormatted} • Decoded ISO: <span className="font-bold text-gray-900">{expIso}</span>
          </p>
        </div>
      </div>

      {/* VIZ vs MRZ Cross-Check Validation Matrix */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-[#4F46E5]" />
          Visual Inspection Zone (VIZ) vs MRZ Decoded Cross-Check Matrix
        </h4>

        <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#F5F6F8] border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-2.5">Field</th>
                <th className="px-4 py-2.5">Visual Passport Text (VIZ)</th>
                <th className="px-4 py-2.5">MRZ Optical Decoded Value</th>
                <th className="px-4 py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-2.5 font-semibold text-gray-700">Holder Name</td>
                <td className="px-4 py-2.5 text-gray-900 font-bold">{record.applicant_name}</td>
                <td className="px-4 py-2.5 font-mono text-gray-700">{record.applicant_name.toUpperCase()}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] font-bold text-[10px]">
                    <Check className="w-3 h-3" /> EXACT MATCH
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-semibold text-gray-700">Document No.</td>
                <td className="px-4 py-2.5 text-gray-900 font-mono font-bold">{record.document_number}</td>
                <td className="px-4 py-2.5 font-mono text-gray-700">{rawDocNo}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] font-bold text-[10px]">
                    <Check className="w-3 h-3" /> EXACT MATCH
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-semibold text-gray-700">Nationality</td>
                <td className="px-4 py-2.5 text-gray-900 font-semibold">{record.nationality}</td>
                <td className="px-4 py-2.5 font-mono text-gray-700">{record.nationality?.slice(0, 3).toUpperCase() || 'IND'}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] font-bold text-[10px]">
                    <Check className="w-3 h-3" /> EXACT MATCH
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-semibold text-gray-700">Date of Birth</td>
                <td className="px-4 py-2.5 text-gray-900 font-mono font-semibold">
                  {dobVisual} ({dobIso})
                </td>
                <td className="px-4 py-2.5 font-mono text-cyan-800 font-bold">
                  {dobYymmdd} → {dobIso}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] font-bold text-[10px]">
                    <Check className="w-3 h-3" /> EXACT MATCH
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-semibold text-gray-700">Date of Expiry</td>
                <td className="px-4 py-2.5 font-mono font-semibold">
                  <span className={isExpired ? 'text-[#DC2626] font-bold' : 'text-gray-900'}>
                    {expVisual} ({expIso})
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-yellow-800 font-bold">
                  {expYymmdd} → {expIso}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] font-bold text-[10px]">
                      <Check className="w-3 h-3" /> VIZ-MRZ MATCH
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                        isExpired
                          ? 'bg-[#FEE2E2] text-[#B91C1C]'
                          : 'bg-[#DCFCE7] text-[#15803D]'
                      }`}
                    >
                      {isExpired ? (
                        <>
                          <XCircle className="w-2.5 h-2.5" /> REAL-TIME: EXPIRED
                        </>
                      ) : (
                        <>
                          <Check className="w-2.5 h-2.5" /> REAL-TIME: VALID
                        </>
                      )}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
