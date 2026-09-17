import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Calculator,
  Layers,
  UserCheck,
  FileCheck,
  Activity,
} from 'lucide-react';
import { ThreatRiskEvaluation } from '../../utils/riskScoring';

interface ThreatRiskScoreCardProps {
  evaluation: ThreatRiskEvaluation;
}

export const ThreatRiskScoreCard: React.FC<ThreatRiskScoreCardProps> = ({ evaluation }) => {
  const [showFormulaDetails, setShowFormulaDetails] = useState<boolean>(false);

  const { totalRiskScore, riskLevel, verdict, pillars, recommendations } = evaluation;

  const getRiskColor = (score: number) => {
    if (score <= 25) return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300', ring: '#15803D' };
    if (score <= 60) return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', ring: '#D97706' };
    return { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300', ring: '#DC2626' };
  };

  const colors = getRiskColor(totalRiskScore);

  const pillarList = [
    { key: 'ocr', data: pillars.ocr, icon: FileCheck },
    { key: 'mrz', data: pillars.mrz, icon: CheckCircle2 },
    { key: 'forensics', data: pillars.forensics, icon: Layers },
    { key: 'biometrics', data: pillars.biometrics, icon: UserCheck },
    { key: 'expiry', data: pillars.expiry, icon: Clock },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      {/* Header with Title and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
            {totalRiskScore <= 25 ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            ) : totalRiskScore <= 60 ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Multi-Pillar Threat Risk Engine
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                ICAO 9303 • NIST-800
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Weighted composite evaluation across optical, cryptographic, substrate, and biometric pillars
            </p>
          </div>
        </div>

        {/* Score & Risk Level Chip */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">
              Computed Risk
            </span>
            <span className="text-xl font-mono font-black text-slate-900 leading-none">
              {totalRiskScore}
              <span className="text-xs font-medium text-slate-400">/100</span>
            </span>
          </div>
          <span
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}
          >
            {riskLevel} RISK
          </span>
        </div>
      </div>

      {/* Visual Score Gauge Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] font-medium text-slate-500">
          <span className="text-emerald-700 font-bold">0 - 25 (Low Risk / Cleared)</span>
          <span className="text-amber-700 font-bold">26 - 60 (Medium Risk / Secondary Desk)</span>
          <span className="text-red-700 font-bold">61 - 100 (High Risk / Fraud)</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 flex border border-slate-200">
          <div
            className={`h-full rounded-full ${
              totalRiskScore <= 25
                ? 'bg-emerald-600'
                : totalRiskScore <= 60
                ? 'bg-amber-500'
                : 'bg-red-600'
            }`}
            style={{ width: `${Math.max(4, Math.min(100, totalRiskScore))}%` }}
          />
        </div>
      </div>

      {/* 5-Pillar Score Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {pillarList.map(({ key, data, icon: Icon }) => {
          const isClear = data.status === 'CLEAR';
          const isCritical = data.status === 'CRITICAL';
          const isWarning = data.status === 'WARNING';

          return (
            <div
              key={key}
              className={`p-3 rounded-xl border ${
                isClear
                  ? 'bg-white border-slate-200'
                  : isCritical
                  ? 'bg-red-50/50 border-red-200'
                  : 'bg-amber-50/50 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isClear ? 'text-emerald-600' : isCritical ? 'text-red-600' : 'text-amber-600'
                    }`}
                  />
                  <span className="text-[10px] font-bold text-gray-500 uppercase truncate">
                    {data.pillarName.split(' ')[0]}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isClear
                      ? 'bg-emerald-100 text-emerald-800'
                      : isCritical
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  +{data.riskPoints} pts
                </span>
              </div>

              <div className="font-bold text-xs text-[#111827] truncate mb-0.5">
                {data.metricLabel}
              </div>

              <p className="text-[10px] text-gray-500 leading-tight line-clamp-2">
                {data.explanation}
              </p>
            </div>
          );
        })}
      </div>

      {/* Calculation Formula Details Drawer Toggle */}
      <div className="pt-1">
        <button
          onClick={() => setShowFormulaDetails(!showFormulaDetails)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-lg cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-[#0B3D91]" />
            <span>Mathematical Risk Formula & Audit Breakdown</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
            {showFormulaDetails ? 'Hide Calculation' : 'Show Calculation'}
            {showFormulaDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </button>

        {showFormulaDetails && (
          <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
            <div className="font-mono text-[11px] bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
              <div className="font-bold text-slate-900 mb-1">Mathematical Formula:</div>
              <div>
                Total Score = OCR Risk ({pillars.ocr.riskPoints} pts / max 15)
                {' + '}
                MRZ Cryptography ({pillars.mrz.riskPoints} pts / max 25)
                {' + '}
                Forensic Substrate ({pillars.forensics.riskPoints} pts / max 35)
                {' + '}
                Biometric Match ({pillars.biometrics.riskPoints} pts / max 25)
                {' + '}
                Expiry Variance ({pillars.expiry.riskPoints} pts / max 60)
              </div>
              <div className="mt-1 pt-1 border-t border-slate-100 text-[#0B3D91] font-black">
                = {pillars.ocr.riskPoints} + {pillars.mrz.riskPoints} + {pillars.forensics.riskPoints} + {pillars.biometrics.riskPoints} + {pillars.expiry.riskPoints} = {totalRiskScore}/100 ({riskLevel} RISK)
              </div>
            </div>

            <div className="text-[11px] text-gray-600 space-y-1">
              <div className="font-bold text-gray-700">Audit Compliance:</div>
              <p>
                • Normal camera JPEG compression (5–35% anomaly) does not constitute digital tampering and adds minimal risk (≤10 pts).
              </p>
              <p>
                • ICAO 9303 Modulo-10 checksum validation verifies that serial numbers and dates have not been modified.
              </p>
              <p>
                • Documents exceeding real-time expiration timelines are flagged with mandatory critical risk (≥75 pts).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
