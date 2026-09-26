import React from 'react';
import {
  Camera,
  UserCheck,
  UserX,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Scan,
  ShieldCheck,
  Database,
  HelpCircle,
  FileQuestion,
} from 'lucide-react';
import { VerificationRecord } from '../../types/verification';

interface BiometricMatchViewProps {
  record: VerificationRecord;
  personPreviewUrl?: string | null;
}

export const BiometricMatchView: React.FC<BiometricMatchViewProps> = ({
  record,
  personPreviewUrl,
}) => {
  const anyRec = record as any;

  // 1. Resolve Document Portrait (Image A - from uploaded document)
  const portraitSrc =
    record.uploaded_portrait?.signed_url ||
    record.uploaded_portrait?.url ||
    record.uploaded_portrait?.crop_url ||
    (record.verification_id ? `/api/verifications/${record.verification_id}/image/portrait` : null);

  const documentFaceDetected = Boolean(
    record.uploaded_portrait?.detected && (record.uploaded_portrait?.face_detected !== false)
  );

  // 2. Resolve Registered Database Biometric (Image B - from sovereign registry)
  const registeredPerson = anyRec.database_catalog?.registered_person || anyRec.matchedRecord?.person;
  const registeredDoc = anyRec.database_catalog?.registered_document || anyRec.matchedRecord?.document;
  const personCode = registeredPerson?.person_code || registeredPerson?.id;

  const registeredSrc =
    record.registered_biometric?.signed_url ||
    record.registered_biometric?.photo_url ||
    (personCode ? `/api/persons/${personCode}/biometric` : null) ||
    (registeredDoc?.person_id ? `/api/persons/${registeredDoc.person_id}/biometric` : null);

  const isRegistryMatch = Boolean(anyRec.registered_match || registeredPerson);

  // 3. Status and similarity score evaluation
  const bioCheck = anyRec.face_verification || {};
  const refCheck = anyRec.passport_vs_registered_ref || {};

  const rawStatus = (
    refCheck.status ||
    bioCheck.status ||
    anyRec.face_verification_status ||
    'NOT_PERFORMED'
  ).toUpperCase();

  const isNotPerformed = rawStatus === 'NOT_PERFORMED' || !isRegistryMatch;
  const isMatch = !isNotPerformed && (rawStatus === 'MATCH' || rawStatus === 'PASSED');
  const isMismatch = !isNotPerformed && (rawStatus === 'MISMATCH' || rawStatus === 'NO_MATCH' || rawStatus === 'FAILED');

  const registeredFaceDetected = isRegistryMatch && !isNotPerformed;

  const rawScore = typeof refCheck.score === 'number'
    ? refCheck.score
    : typeof bioCheck.score === 'number'
    ? bioCheck.score
    : typeof anyRec.face_match_score === 'number'
    ? anyRec.face_match_score
    : null;

  const similarityPercent = rawScore !== null ? Math.min(100, Math.max(0, Math.round(rawScore * 10) / 10)) : null;
  const cosineSim = similarityPercent !== null ? (similarityPercent / 100).toFixed(2) : null;

  const failureReason = refCheck.message || bioCheck.message || (
    !isRegistryMatch
      ? 'No registered sovereign identity found for this document number.'
      : 'Registered biometric reference photo unavailable.'
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0B3D91]">
            <Scan className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              1:1 Biometric Verification
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Document Portrait (Image A) ↔ Registered Database Biometric (Image B)
            </span>
          </div>
        </div>

        {isNotPerformed ? (
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200">
            <HelpCircle className="w-4 h-4 text-slate-500" />
            Biometric Status: NOT PERFORMED
          </span>
        ) : isMatch ? (
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Biometric Match: {similarityPercent}% (Threshold ≥ 70%)
          </span>
        ) : (
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 bg-rose-100 text-rose-800 border border-rose-200">
            <UserX className="w-4 h-4 text-rose-600" />
            Biometric Mismatch: {similarityPercent}% (Threshold ≥ 70%)
          </span>
        )}
      </div>

      {/* 1:1 Side-by-Side Biometric Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-50/70 p-5 rounded-xl border border-slate-200/90">
        
        {/* IMAGE A: Document Extracted Portrait */}
        <div className="md:col-span-5 bg-white rounded-xl p-4 border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Document Portrait
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
              IMAGE A (PASSPORT)
            </span>
          </div>

          <div className="w-36 h-44 mx-auto bg-slate-100 rounded-lg border-2 border-dashed border-blue-200 overflow-hidden flex flex-col items-center justify-center relative group">
            {portraitSrc ? (
              <img
                src={portraitSrc}
                alt="Document Extracted Portrait"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="p-3 text-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0B3D91] flex items-center justify-center mb-1 mx-auto">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 font-mono block">PORTRAIT CROP</span>
                <span className="text-[9px] text-slate-400">Extracted from Document</span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-slate-900/70 backdrop-blur-xs text-white text-[10px] py-1 font-mono">
              Document ROI
            </div>
          </div>

          <div className="text-[11px] text-slate-600 space-y-0.5">
            <div className="font-semibold text-slate-800">Scanned Document Photo</div>
            <div className="text-slate-400 text-[10px]">
              Face Detected: <strong className={documentFaceDetected ? 'text-emerald-700' : 'text-rose-700'}>{documentFaceDetected ? 'YES' : 'NO'}</strong>
            </div>
          </div>
        </div>

        {/* Center: Detected Score & Similarity Metric */}
        <div className="md:col-span-2 text-center space-y-2 py-2">
          {isNotPerformed ? (
            <div className="space-y-1.5 p-2 bg-slate-100/90 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Verification
              </span>
              <div className="text-sm font-black text-slate-600 uppercase font-mono">
                NOT PERFORMED
              </div>
              <div className="text-[9px] text-slate-500 leading-tight">
                No similarity score calculated.
              </div>
            </div>
          ) : (
            <>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Similarity Score
              </span>
              
              <div
                className={`text-3xl font-black font-mono tracking-tight ${
                  isMatch ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {similarityPercent}%
              </div>

              <div className="w-20 h-2 mx-auto bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isMatch ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                  style={{ width: `${Math.max(5, similarityPercent || 0)}%` }}
                />
              </div>

              <div className="space-y-1">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-block ${
                    isMatch
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {isMatch ? 'MATCH' : 'NO MATCH'}
                </span>
                <div className="text-[10px] font-mono text-slate-500">
                  Threshold: 70%
                </div>
              </div>
            </>
          )}
        </div>

        {/* IMAGE B: Registered Biometric Photo */}
        <div className="md:col-span-5 bg-white rounded-xl p-4 border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Registered Photo
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                isRegistryMatch
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              IMAGE B (REGISTRY)
            </span>
          </div>

          <div className="w-36 h-44 mx-auto bg-slate-100 rounded-lg border-2 border-dashed border-emerald-200 overflow-hidden flex flex-col items-center justify-center relative">
            {registeredSrc ? (
              <img
                src={registeredSrc}
                alt="Registered Biometric Photo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="p-3 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-1 mx-auto">
                  <Database className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 font-mono block">SOVEREIGN DATABASE</span>
                <span className="text-[9px] text-slate-400">
                  {isRegistryMatch ? 'Photo Stored in Vault' : 'No Registry Record'}
                </span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-slate-900/70 backdrop-blur-xs text-white text-[10px] py-1 font-mono">
              Registered Biometric
            </div>
          </div>

          <div className="text-[11px] text-slate-600 space-y-0.5">
            <div className="font-semibold text-slate-800">
              {registeredPerson ? registeredPerson.full_name : 'Registered Sovereign Record'}
            </div>
            <div className="text-slate-400 text-[10px]">
              Face Detected: <strong className={registeredFaceDetected ? 'text-emerald-700' : 'text-slate-500'}>{registeredFaceDetected ? 'YES' : 'NO'}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Biometric Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
        {/* 1. Face Detection Status */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
            {documentFaceDetected && registeredFaceDetected ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>Face Detection</span>
          </div>
          <div className="text-[11px] text-slate-600 space-y-0.5">
            <div>✓ Document Face: <strong className={documentFaceDetected ? 'text-emerald-700' : 'text-rose-700'}>{documentFaceDetected ? 'Detected' : 'Not Found'}</strong></div>
            <div>✓ Registered Face: <strong className={registeredFaceDetected ? 'text-emerald-700' : 'text-slate-500'}>{registeredFaceDetected ? 'Detected' : 'Not Available'}</strong></div>
          </div>
        </div>

        {/* 2. 1:1 Verdict */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
            {isMatch ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            ) : isNotPerformed ? (
              <FileQuestion className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <UserX className="w-3.5 h-3.5 text-rose-600" />
            )}
            <span>Biometric Result</span>
          </div>
          <p
            className={`text-[11px] font-bold ${
              isMatch ? 'text-emerald-700' : isNotPerformed ? 'text-slate-600' : 'text-rose-700'
            }`}
          >
            {isMatch
              ? `MATCH (${similarityPercent}%)`
              : isNotPerformed
              ? 'NOT PERFORMED'
              : `NO MATCH (${similarityPercent}%)`}
          </p>
          <div className="text-[10px] text-slate-400">
            {isNotPerformed ? failureReason : `Threshold: 70% • Cosine: ${cosineSim}`}
          </div>
        </div>

        {/* 3. Liveness State */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
            <Activity className="w-3.5 h-3.5 text-slate-500" />
            <span>Liveness State</span>
          </div>
          <p className="text-[11px] font-mono text-slate-600 font-bold">
            NOT PERFORMED
          </p>
          <div className="text-[10px] text-slate-400">
            Static document to registry verification.
          </div>
        </div>
      </div>
    </div>
  );
};
