import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Save,
  MessageSquare,
  UserCheck,
  Send,
  Flag,
} from 'lucide-react';
import { VerificationRecord } from '../../types/verification';

interface OfficerDecisionSectionProps {
  record: VerificationRecord;
  onSave: (notes: string, overrideDisposition: string) => Promise<void>;
  isSaving: boolean;
  saveSuccess: boolean;
}

export const OfficerDecisionSection: React.FC<OfficerDecisionSectionProps> = ({
  record,
  onSave,
  isSaving,
  saveSuccess,
}) => {
  const [officerNotes, setOfficerNotes] = useState<string>(record.notes || '');
  const [disposition, setDisposition] = useState<string>(
    record.verification_status === 'VERIFIED'
      ? 'VERIFIED_CLEAR'
      : record.verification_status === 'EXPIRED'
      ? 'EXPIRED_FLAG'
      : record.verification_status === 'SUSPICIOUS'
      ? 'MANUAL_REVIEW'
      : 'INVESTIGATION_FLAG'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(officerNotes, disposition);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#0B3D91]" />
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Verification Review & Officer Remarks
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              Record manual inspection notes and register disposition in the verification audit ledger
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Disposition Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Verification Disposition
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setDisposition('VERIFIED_CLEAR')}
              className={`p-3.5 rounded-lg border text-left cursor-pointer ${
                disposition === 'VERIFIED_CLEAR'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified — Low Risk</span>
              </div>
              <span className="text-[11px] text-slate-500 block leading-tight font-normal">
                No significant automated or visual concerns detected
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDisposition('MANUAL_REVIEW')}
              className={`p-3.5 rounded-lg border text-left cursor-pointer ${
                disposition === 'MANUAL_REVIEW'
                  ? 'bg-amber-50 border-amber-500 text-amber-800 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Manual Review Recommended</span>
              </div>
              <span className="text-[11px] text-slate-500 block leading-tight font-normal">
                Secondary manual inspection recommended
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDisposition('INVESTIGATION_FLAG')}
              className={`p-3.5 rounded-lg border text-left cursor-pointer ${
                disposition === 'INVESTIGATION_FLAG'
                  ? 'bg-red-50 border-red-500 text-red-800 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <XCircle className="w-4 h-4 text-red-600" />
                <span>High Risk / Flagged</span>
              </div>
              <span className="text-[11px] text-slate-500 block leading-tight font-normal">
                Significant anomalies or document tampering detected
              </span>
            </button>
          </div>
        </div>

        {/* Officer Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Officer Case Observations & Notes
          </label>
          <textarea
            value={officerNotes}
            onChange={(e) => setOfficerNotes(e.target.value)}
            rows={3}
            placeholder="Record any physical visual discrepancies, document wear remarks, or additional verification details here..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-[#0B3D91] focus:bg-white outline-hidden resize-none leading-relaxed"
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-slate-500 font-medium">
            Reviewing Officer: <span className="font-bold text-slate-900">{record.verified_by}</span> (Identity Verification Division)
          </div>

          <button
            type="submit"
            disabled={isSaving || saveSuccess}
            className={`px-6 py-2.5 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-2 ${
              saveSuccess
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-[#0B3D91] hover:bg-[#082d6c] text-white'
            }`}
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Review Saved to Audit Ledger</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Review & Sign-Off'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
