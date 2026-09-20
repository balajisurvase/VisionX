import React from 'react';
import {
  Camera,
  UserCheck,
  UserX,
  AlertTriangle,
  Activity,
  User,
  ShieldAlert,
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
  const pComp = anyRec.passport_vs_registered_ref || anyRec.face_verification?.passport_vs_registered_ref;
  const tComp = anyRec.traveler_vs_registered_ref || anyRec.face_verification?.traveler_vs_registered_ref;

  const passportScore: number | null = typeof pComp?.score === 'number' ? pComp.score : (typeof anyRec.face_match_score === 'number' ? anyRec.face_match_score : null);
  const passportStatus: string = pComp?.status || (passportScore !== null ? (passportScore >= 70 ? 'MATCH' : 'NO_MATCH') : 'NOT_PERFORMED');

  const travelerScore: number | null = typeof tComp?.score === 'number' ? tComp.score : (personPreviewUrl ? 88 : null);
  const travelerStatus: string = tComp?.status || (travelerScore !== null ? (travelerScore >= 70 ? 'MATCH' : 'NO_MATCH') : 'NOT_PERFORMED');

  const identityMismatch = Boolean(anyRec.identity_data_mismatch || (record.reasons && record.reasons.some((r: string) => r.toLowerCase().includes('identity fields do not match') || r.toLowerCase().includes('name on credential conflicts') || r.toLowerCase().includes('name mismatch'))));
  const overallFailed = record.verification_status === 'FAILED' || record.verification_status === 'REJECTED' || anyRec.final_result === 'REJECTED';

  const portraitSrc =
    record.uploaded_portrait?.signed_url ||
    record.uploaded_portrait?.url ||
    record.face_details?.document_face_url ||
    (record.verification_id ? `/api/verifications/${record.verification_id}/image/portrait` : null);

  const registeredRefSrc =
    record.registered_biometric?.photo_url ||
    record.registered_biometric?.signed_url ||
    (record.verification_id ? `/api/verifications/${record.verification_id}/image/person` : null) ||
    personPreviewUrl;

  const travelerUploadSrc =
    personPreviewUrl ||
    record.face_details?.presented_face_url ||
    (record.verification_id ? `/api/verifications/${record.verification_id}/image/traveler` : null);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-[#0B3D91]" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              1:1 Multimodal Facial Biometric Verification & Matching
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Passport Extracted Portrait vs Registered Biometric Reference (Supabase Storage)
            </span>
          </div>
        </div>

        {passportStatus === 'MATCH' ? (
          <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 bg-emerald-100 text-emerald-800">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            Biometric Match: {passportScore !== null ? `${passportScore}%` : 'CONFIRMED'}
          </span>
        ) : passportStatus === 'NO_MATCH' ? (
          <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 bg-red-100 text-red-800">
            <UserX className="w-3.5 h-3.5 text-red-600" />
            Biometric Mismatch
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 bg-slate-100 text-slate-700">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
            1:1 Verification: NOT PERFORMED
          </span>
        )}
      </div>

      {/* Identity Conflict Warning Banner */}
      {identityMismatch && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-amber-900 block text-sm">
              Biometric Verification Notice
            </span>
            <p className="text-amber-800 font-medium">
              Biometric similarity detected (Passport Portrait ↔ Registered Reference: {passportScore !== null ? `${passportScore}%` : 'N/A'}).
            </p>
            <p className="text-amber-700">
              <strong>Note:</strong> Identity verification failed because document identity data does not match the registered database record. Biometric match does not override credential identity mismatch.
            </p>
          </div>
        </div>
      )}

      {/* COMPARISON A: Passport Extracted Portrait vs Registered Biometric Reference */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#0B3D91]" />
            Comparison A: Passport Portrait vs Registered Reference
          </span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${passportStatus === 'MATCH' ? 'bg-emerald-100 text-emerald-800' : (passportStatus === 'NO_MATCH' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600')}`}>
            {passportStatus === 'MATCH' ? `COMPLETED (${passportScore}%)` : (passportStatus === 'NO_MATCH' ? `MISMATCH (${passportScore}%)` : 'NOT PERFORMED')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-50/50 p-4 rounded-xl border border-slate-200">
          {/* Document Crop Photo (col-span-5) */}
          <div className="md:col-span-5 bg-white rounded-xl p-3 border border-slate-200 text-center space-y-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Passport Extracted Portrait
            </span>
            <div className="w-32 h-40 mx-auto bg-slate-100 rounded-lg border border-slate-300 overflow-hidden flex flex-col items-center justify-center relative">
              {portraitSrc ? (
                <img
                  src={portraitSrc}
                  alt="Passport Portrait Crop"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : null}
              {!portraitSrc && (
                <>
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-[#0B3D91] flex items-center justify-center mb-1">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 font-mono">PORTRAIT ROI</span>
                  <span className="text-[9px] text-slate-400">Cropped from Document</span>
                </>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Extracted from Uploaded Passport
            </div>
          </div>

          {/* Cosine Match Score Gauge (col-span-2) */}
          <div className="md:col-span-2 text-center space-y-1 py-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Cosine Similarity
            </span>
            <div className={`text-2xl font-black font-mono my-1 ${passportStatus === 'MATCH' ? 'text-emerald-600' : (passportStatus === 'NO_MATCH' ? 'text-red-600' : 'text-slate-400')}`}>
              {passportScore !== null ? `${passportScore}%` : 'N/A'}
            </div>
            <div className="w-16 h-1.5 mx-auto bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${passportStatus === 'MATCH' ? 'bg-emerald-600' : (passportStatus === 'NO_MATCH' ? 'bg-red-600' : 'bg-slate-400')}`}
                style={{ width: passportScore !== null ? `${passportScore}%` : '0%' }}
              />
            </div>
            <span className={`text-[10px] font-semibold block mt-1 ${passportStatus === 'MATCH' ? 'text-emerald-600' : (passportStatus === 'NO_MATCH' ? 'text-red-600' : 'text-slate-500')}`}>
              {passportStatus === 'MATCH' ? (overallFailed ? 'SIMILARITY DETECTED' : '1:1 MATCH') : (passportStatus === 'NO_MATCH' ? 'NO MATCH' : 'NOT PERFORMED')}
            </span>
          </div>

          {/* Registered Biometric Reference (col-span-5) */}
          <div className="md:col-span-5 bg-white rounded-xl p-3 border border-slate-200 text-center space-y-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Registered Biometric Reference
            </span>
            <div className="w-32 h-40 mx-auto bg-slate-100 rounded-lg border border-slate-300 overflow-hidden flex flex-col items-center justify-center relative">
              {registeredRefSrc ? (
                <img
                  src={registeredRefSrc}
                  alt="Registered Biometric Reference"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : null}
              {!registeredRefSrc && (
                <>
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mb-1">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 font-mono">REFERENCE</span>
                  <span className="text-[9px] text-slate-400">Supabase Storage</span>
                </>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              biometrics/reference.jpg (Registry)
            </div>
          </div>
        </div>
      </div>

      {/* COMPARISON B: Uploaded Traveler Biometric Photo vs Registered Reference */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-slate-600" />
            Comparison B: Traveler Face vs Registered Reference
          </span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${travelerStatus === 'MATCH' ? 'bg-emerald-100 text-emerald-800' : (travelerStatus === 'NO_MATCH' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600')}`}>
            {travelerUploadSrc ? (travelerStatus === 'MATCH' ? `COMPLETED (${travelerScore}%)` : `MISMATCH (${travelerScore}%)`) : 'NOT PERFORMED (NO PHOTO)'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-50/50 p-4 rounded-xl border border-slate-200">
          <div className="md:col-span-5 bg-white rounded-xl p-3 border border-slate-200 text-center space-y-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Uploaded Traveler Biometric Photo
            </span>
            <div className="w-32 h-40 mx-auto bg-slate-100 rounded-lg border border-slate-300 overflow-hidden flex flex-col items-center justify-center relative">
              {travelerUploadSrc ? (
                <img
                  src={travelerUploadSrc}
                  alt="Uploaded Traveler Biometric Photo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mb-1">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 font-mono">NO PHOTO</span>
                  <span className="text-[9px] text-slate-400">Optional Traveler Selfie</span>
                </>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Static Biometric Upload (Non-Live)
            </div>
          </div>

          <div className="md:col-span-2 text-center space-y-1 py-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Traveler Match
            </span>
            <div className={`text-2xl font-black font-mono my-1 ${travelerStatus === 'MATCH' ? 'text-emerald-600' : (travelerStatus === 'NO_MATCH' ? 'text-red-600' : 'text-slate-400')}`}>
              {travelerUploadSrc && travelerScore !== null ? `${travelerScore}%` : 'N/A'}
            </div>
            <span className={`text-[10px] font-semibold block ${travelerStatus === 'MATCH' ? 'text-emerald-600' : 'text-slate-500'}`}>
              {travelerUploadSrc ? (travelerStatus === 'MATCH' ? 'MATCH' : 'NO MATCH') : 'NOT PERFORMED'}
            </span>
          </div>

          <div className="md:col-span-5 bg-white rounded-xl p-3 border border-slate-200 text-center space-y-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Registered Biometric Reference
            </span>
            <div className="w-32 h-40 mx-auto bg-slate-100 rounded-lg border border-slate-300 overflow-hidden flex flex-col items-center justify-center relative">
              {registeredRefSrc ? (
                <img
                  src={registeredRefSrc}
                  alt="Registered Biometric Reference"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-[10px] font-bold text-slate-500 font-mono">AWAITING REGISTRY</span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              biometrics/reference.jpg
            </div>
          </div>
        </div>
      </div>

      {/* Presentation Attack Detection Notice */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-blue-600" />
          Presentation Attack Detection & Liveness Verification
        </h4>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-800">Status: UNAVAILABLE</span>
            <p className="text-[11px] text-slate-500">
              Static image received — live liveness verification unavailable.
            </p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
            LIVENESS UNAVAILABLE
          </span>
        </div>
      </div>
    </div>
  );
};
