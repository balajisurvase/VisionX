import React, { useState } from 'react';
import {
  UserCheck,
  UserX,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Database,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Info,
  Fingerprint,
  Camera,
  Layers,
  Search,
} from 'lucide-react';
import { DatabaseMatchResult } from '../../types/person';

interface DatabaseIdentityMatchCardProps {
  matchResult?: DatabaseMatchResult | null;
  onViewPerson?: (personId: string | number) => void;
  onNavigateToRegistry?: () => void;
}

export const DatabaseIdentityMatchCard: React.FC<DatabaseIdentityMatchCardProps> = ({
  matchResult,
  onViewPerson,
  onNavigateToRegistry,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  if (!matchResult || matchResult.match_status === 'NOT_PERFORMED' || matchResult.registered_identity?.status === 'NOT_PERFORMED') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Identity Database Cross-Match
              </h4>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                NOT PERFORMED
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Reason: Document number could not be extracted from the uploaded document. Lookup bypassed.
            </p>
          </div>
        </div>
        {onNavigateToRegistry && (
          <button
            onClick={onNavigateToRegistry}
            className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>Open Person Registry</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  const {
    match_status,
    overall_match_score,
    matched_person,
    matched_document,
    field_comparisons = [],
    mismatch_reasons = [],
    recommendation,
    searched_query,
    registered_identity,
  } = matchResult;

  const isExact = match_status === 'EXACT_MATCH';
  const isPartial = match_status === 'PARTIAL_MATCH';
  const isMismatch = match_status === 'MISMATCH';
  const isNotFound = match_status === 'NOT_FOUND';

  const badgeStyle = isExact
    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
    : isPartial
    ? 'bg-amber-50 text-amber-800 border-amber-300'
    : isMismatch
    ? 'bg-red-50 text-red-800 border-red-300'
    : 'bg-slate-100 text-slate-700 border-slate-300';

  const BadgeIcon = isExact ? CheckCircle2 : isPartial ? AlertTriangle : isMismatch ? XCircle : Info;

  const matchedFieldsCount = (field_comparisons || []).filter((f) => f.is_match).length;
  const mismatchedFieldsCount = (field_comparisons || []).filter((f) => !f.is_match).length;

  const bioMatch = registered_identity?.biometric_match;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl border ${
              isExact
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : isMismatch
                ? 'bg-red-50 border-red-200 text-red-600'
                : isPartial
                ? 'bg-amber-50 border-amber-200 text-amber-600'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            {isExact ? <UserCheck className="w-6 h-6" /> : isMismatch ? <UserX className="w-6 h-6" /> : <Database className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Identity Database Cross-Match
              </h3>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeStyle}`}>
                <BadgeIcon className="w-3.5 h-3.5" />
                <span>
                  {isExact
                    ? 'REGISTERED IDENTITY MATCH'
                    : isPartial
                    ? 'PARTIAL RECORD MATCH'
                    : isMismatch
                    ? 'IDENTITY MISMATCH'
                    : 'UNREGISTERED CREDENTIAL'}
                </span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated comparison between extracted OCR/MRZ data and central registered person records
            </p>
          </div>
        </div>

        {/* Match Percentage & Quick Counts */}
        <div className="flex items-center gap-4 self-end sm:self-auto">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold font-mono">
              {matchedFieldsCount} Matched
            </span>
            {mismatchedFieldsCount > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-red-50 border border-red-200 text-red-700 font-bold font-mono">
                {mismatchedFieldsCount} Conflict
              </span>
            )}
          </div>
          <div className="text-right pl-3 border-l border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">
              Match Confidence
            </span>
            <span
              className={`text-2xl font-mono font-black ${
                isExact ? 'text-emerald-600' : isPartial ? 'text-amber-600' : isMismatch ? 'text-red-600' : 'text-slate-600'
              }`}
            >
              {overall_match_score}%
            </span>
          </div>
        </div>
      </div>

      {/* Matched Person Profile Summary */}
      {matched_person ? (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
              {matched_person.person_code}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 text-sm">{matched_person.full_name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-800">
                  {matched_person.person_code}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {matched_person.status}
                </span>
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                {matched_person.nationality} • DOB: {matched_person.date_of_birth} • {matched_person.gender}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onViewPerson && (
              <button
                onClick={() => onViewPerson(matched_person.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-blue-600 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>View Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-200 text-slate-600">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800">No Prior Person Profile Found</div>
              <div className="text-slate-500 text-[11px]">
                Searched document serial <code className="font-mono text-slate-700 font-bold">{searched_query?.document_number || 'N/A'}</code> and name <code className="font-mono text-slate-700 font-bold">{searched_query?.full_name || 'N/A'}</code>.
              </div>
            </div>
          </div>
          {onNavigateToRegistry && (
            <button
              onClick={onNavigateToRegistry}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Add to Registry</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Field-by-Field Comparison Table */}
      {(field_comparisons?.length || 0) > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Field-by-Field Identity Comparison
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">
              Biographic & Credential Verification
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3.5">Attribute</th>
                  <th className="py-2.5 px-3.5">Extracted from Document</th>
                  <th className="py-2.5 px-3.5">Registered in Database</th>
                  <th className="py-2.5 px-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {field_comparisons.map((f) => (
                  <tr
                    key={f.field_name}
                    className={f.is_match ? 'hover:bg-slate-50/50' : 'bg-red-50/40 hover:bg-red-50/70'}
                  >
                    <td className="py-2.5 px-3.5 font-semibold text-slate-700">
                      {f.label}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-900">
                      {f.uploaded_value || '—'}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-900">
                      {f.database_value || '—'}
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      {f.is_match ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Match</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                          <XCircle className="w-4 h-4" />
                          <span>Mismatch</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Biometric Reference Cross-Check Status */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
            <Fingerprint className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span>Biometric Reference Comparison</span>
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                bioMatch?.status === 'MATCH'
                  ? 'bg-emerald-100 text-emerald-800'
                  : bioMatch?.status === 'MISMATCH'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {bioMatch?.status || (matched_person ? 'REFERENCE AVAILABLE' : 'NO REFERENCE IMAGE')}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {matched_person
                ? `Biometric baseline attached to profile ${matched_person.person_code}`
                : 'Document not linked to registered biometric reference.'}
            </div>
          </div>
        </div>

        {bioMatch?.score !== null && bioMatch?.score !== undefined && (
          <div className="text-right font-mono font-bold text-xs text-slate-700">
            Similarity: <span className="text-emerald-700">{bioMatch.score}%</span>
          </div>
        )}
      </div>

      {/* Mismatch Alert / Recommendation Notice */}
      {(mismatch_reasons?.length || 0) > 0 && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 text-red-900">
            <AlertTriangle className="w-4 h-4" />
            <span>Discrepancies Detected Against Registered Identity</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-700 pl-1">
            {mismatch_reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Operational Recommendation Footnote */}
      <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold">Recommendation:</strong> {recommendation}
        </div>
      </div>

      {/* Collapsible Technical Details */}
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Technical Match Audit & Lookup Parameters</span>
          <ChevronDown className={`w-3.5 h-3.5 transform transition-transform ${showTechnicalDetails ? 'rotate-180' : ''}`} />
        </button>

        {showTechnicalDetails && (
          <div className="mt-3 p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono space-y-2 overflow-x-auto">
            <div className="text-slate-400 text-[11px] font-sans font-bold uppercase tracking-wider">
              Verification Engine Lookup Query
            </div>
            <pre className="text-[11px] leading-tight">
              {JSON.stringify(
                {
                  query: searched_query,
                  matched_person_id: matched_person?.id || null,
                  matched_document_id: matched_document?.id || null,
                  overall_match_score,
                  match_status,
                  weights: {
                    full_name: '25%',
                    date_of_birth: '20%',
                    document_number: '20%',
                    nationality: '15%',
                    gender: '10%',
                    expiry_date: '10%',
                  },
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

