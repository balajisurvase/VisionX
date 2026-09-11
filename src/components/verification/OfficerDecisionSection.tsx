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
      ? 'CLEAR_TRANSIT'
      : record.verification_status === 'EXPIRED'
      ? 'REFUSE_EXPIRED'
      : record.verification_status === 'SUSPICIOUS'
      ? 'SECONDARY_INSPECTION'
      : 'DETAIN_ESCALATE'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(officerNotes, disposition);
  };

  return (
    <div className="bg-white rounded-[12px] border border-gray-100 p-6 shadow-2xs space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#4F46E5]" />
          <div>
            <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
              Officer Border Gate Disposition & Operational Sign-Off
            </h3>
            <span className="text-[11px] text-gray-500 font-medium">
              Formal border clearance verdict and tamper-evident audit ledger registration
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Gate Disposition Selector */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Select Border Gate Disposition
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setDisposition('CLEAR_TRANSIT')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                disposition === 'CLEAR_TRANSIT'
                  ? 'bg-[#DCFCE7] border-[#16A34A] text-[#15803D] shadow-xs'
                  : 'bg-[#F5F6F8] border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Clear for Transit</span>
              </div>
              <span className="text-[11px] text-gray-500 block leading-tight">
                Grant formal border crossing clearance
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDisposition('SECONDARY_INSPECTION')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                disposition === 'SECONDARY_INSPECTION'
                  ? 'bg-[#FEF3C7] border-[#D97706] text-[#B45309] shadow-xs'
                  : 'bg-[#F5F6F8] border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Secondary Desk Referral</span>
              </div>
              <span className="text-[11px] text-gray-500 block leading-tight">
                Refer traveler for manual interrogation
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDisposition('DETAIN_ESCALATE')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                disposition === 'DETAIN_ESCALATE'
                  ? 'bg-[#FEE2E2] border-[#DC2626] text-[#B91C1C] shadow-xs'
                  : 'bg-[#F5F6F8] border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <XCircle className="w-4 h-4" />
                <span>Detain & Escalate</span>
              </div>
              <span className="text-[11px] text-gray-500 block leading-tight">
                Impound document & notify SSB Commandant
              </span>
            </button>
          </div>
        </div>

        {/* Officer Notes / Case Observations */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Officer Case Observations & Notes
          </label>
          <textarea
            value={officerNotes}
            onChange={(e) => setOfficerNotes(e.target.value)}
            rows={3}
            placeholder="Record any physical visual discrepancies, traveler demeanor, or special visa remarks here..."
            className="w-full px-3.5 py-2.5 bg-[#F5F6F8] border border-gray-200 rounded-xl text-xs text-[#111827] focus:border-[#4F46E5] focus:bg-white outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Save to Blockchain Ledger Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-gray-500 font-medium">
            Signing Authority: <span className="font-bold text-gray-900">{record.verified_by}</span> (SSB Checkpoint Unit)
          </div>

          <button
            type="submit"
            disabled={isSaving || saveSuccess}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              saveSuccess
                ? 'bg-[#DCFCE7] text-[#15803D] border border-[#16A34A]/30'
                : 'bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-xs'
            }`}
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Committed to Sovereign Audit Ledger</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Signing & Hashing...' : 'Sign & Commit to Audit Ledger'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
