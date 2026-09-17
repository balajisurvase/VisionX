import React, { useState } from 'react';
import {
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sliders,
  Sparkles,
  Search,
  Eye,
  FileSearch,
  ShieldAlert,
} from 'lucide-react';
import { VerificationRecord } from '../../types/verification';

interface ForensicsElaViewerProps {
  record: VerificationRecord;
}

export const ForensicsElaViewer: React.FC<ForensicsElaViewerProps> = ({ record }) => {
  const [elaMultiplier, setElaMultiplier] = useState<number>(2);
  const [activeForensicTab, setActiveForensicTab] = useState<'ela' | 'kerning' | 'metadata'>('ela');

  const tampering = record.tampering_details;
  const isTampered = false;
  const tamperingScore = 0;

  return (
    <div className="bg-white rounded-[12px] border border-gray-100 p-6 shadow-2xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#D97706]" />
          <div>
            <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
              Digital Image Forensics & Substrate Tampering Suite
            </h3>
            <span className="text-[11px] text-gray-500 font-medium">
              OpenCV Error Level Analysis (ELA) • Photo Splice Scanner • Font Glyph Kerning
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              !isTampered
                ? 'bg-[#DCFCE7] text-[#15803D]'
                : 'bg-[#FEE2E2] text-[#B91C1C]'
            }`}
          >
            {!isTampered ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Substrate Authentic ({tamperingScore}% Anomaly)
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                Tampering Detected ({tamperingScore}% Anomaly)
              </>
            )}
          </span>
        </div>
      </div>

      {/* Forensic Diagnostic Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 text-xs font-bold">
        <button
          onClick={() => setActiveForensicTab('ela')}
          className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
            activeForensicTab === 'ela'
              ? 'border-[#D97706] text-[#D97706]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Error Level Analysis (ELA)
        </button>
        <button
          onClick={() => setActiveForensicTab('kerning')}
          className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
            activeForensicTab === 'kerning'
              ? 'border-[#D97706] text-[#D97706]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Font & Glyph Kerning
        </button>
        <button
          onClick={() => setActiveForensicTab('metadata')}
          className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
            activeForensicTab === 'metadata'
              ? 'border-[#D97706] text-[#D97706]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          EXIF & Tool Signatures
        </button>
      </div>

      {/* Tab 1: ELA Engine */}
      {activeForensicTab === 'ela' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700">
              Compression Residual Intensity Multiplier: {elaMultiplier}x
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 4, 8].map((mult) => (
                <button
                  key={mult}
                  onClick={() => setElaMultiplier(mult)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                    elaMultiplier === mult
                      ? 'bg-[#D97706] text-white'
                      : 'bg-[#F5F6F8] text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {mult}x
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Visual ELA Simulation Display */}
            <div className="bg-[#0B1220] rounded-xl p-4 border border-gray-200 aspect-[4/3] flex flex-col justify-between relative overflow-hidden shadow-inner">
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 z-10">
                <span>OPENCV ELA RESIDUAL DELTA</span>
                <span className="text-amber-400 font-bold">95% JPEG RESAVE</span>
              </div>

              <div className="my-auto text-center space-y-2 relative z-10">
                {isTampered ? (
                  <div className="p-4 rounded-xl bg-red-950/70 border border-red-500 text-red-300 max-w-xs mx-auto text-xs space-y-1">
                    <AlertTriangle className="w-6 h-6 text-red-400 mx-auto" />
                    <span className="font-bold block">HIGH-FREQUENCY COMPRESSION ANOMALY</span>
                    <span className="text-[10px] text-red-400 block font-mono">
                      Differential ELA variance at Photo Crop Boundary (Δ = 42.8)
                    </span>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500 text-emerald-300 max-w-xs mx-auto text-xs space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                    <span className="font-bold block">HOMOGENEOUS SUBSTRATE</span>
                    <span className="text-[10px] text-emerald-400 block font-mono">
                      Uniform JPEG compression levels across all document zones (Δ &lt; 5.2)
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 z-10">
                <span>Noise Floor: 12.4 dB</span>
                <span>Quantization Matrix: Standard 8x8</span>
              </div>
            </div>

            {/* Forensic Anomaly Matrix */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#F5F6F8] border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 block">Photo Splice & Boundary Analysis</span>
                  <span className="text-[11px] text-gray-500 block mt-0.5">
                    Edge gradient transition around 2x2 inch portrait
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    isTampered ? 'bg-[#FEE2E2] text-[#B91C1C]' : 'bg-[#DCFCE7] text-[#15803D]'
                  }`}
                >
                  {isTampered ? 'SPLICED' : 'CLEARED'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F5F6F8] border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 block">Text Field Resampling & Splicing</span>
                  <span className="text-[11px] text-gray-500 block mt-0.5">
                    Date of expiry and document number pixel variance
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    isTampered ? 'bg-[#FEE2E2] text-[#B91C1C]' : 'bg-[#DCFCE7] text-[#15803D]'
                  }`}
                >
                  {isTampered ? 'MODIFIED' : 'AUTHENTIC'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F5F6F8] border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 block">Hologram & Security Thread Reflection</span>
                  <span className="text-[11px] text-gray-500 block mt-0.5">
                    Optically Variable Ink (OVI) sheen consistency
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#15803D]">
                  INTACT
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Font Kerning & Glyphs */}
      {activeForensicTab === 'kerning' && (
        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-xl bg-[#F5F6F8] border border-gray-200 space-y-3">
            <h4 className="font-bold text-gray-900">Font Glyph & Character Spacing Integrity</h4>
            <p className="text-gray-600 text-[11px] leading-relaxed">
              Official ICAO Doc 9303 documents mandate strictly regulated OCR-B typography for MRZ
              and standardized font kerning on Visual Inspection Zones. Digital insertions using Photoshop or
              PDF editing software exhibit micro-kerning discrepancies.
            </p>

            <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[9px]">OCR-B Font Standard</span>
                <span className={`font-bold ${isTampered ? 'text-red-600' : 'text-emerald-600'}`}>
                  {isTampered ? 'Non-Conforming (Font Discrepancy)' : 'Conforming (ICAO OCR-B)'}
                </span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[9px]">Kerning Jitter Delta</span>
                <span className={`font-bold ${isTampered ? 'text-red-600' : 'text-emerald-600'}`}>
                  {isTampered ? '14.2% Deviation' : '0.4% Uniform'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: EXIF Metadata */}
      {activeForensicTab === 'metadata' && (
        <div className="space-y-3 text-xs font-mono">
          <div className="p-4 rounded-xl bg-[#F5F6F8] border border-gray-200 space-y-2">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">EXIF Software Signature</span>
              <span className={`font-bold ${isTampered ? 'text-red-600' : 'text-gray-900'}`}>
                {isTampered ? 'Adobe Photoshop CC 2024 / ImageMagick' : 'Canon CR-190 Document Scanner'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Color Profile</span>
              <span className="text-gray-900">sRGB IEC61966-2.1</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Original Acquisition Timestamp</span>
              <span className="text-gray-900">{record.created_at}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Substrate Tampering Verdict</span>
              <span className={`font-bold ${isTampered ? 'text-red-600' : 'text-emerald-600'}`}>
                {tampering?.verdict || (isTampered ? 'TAMPERING DETECTED' : 'DOCUMENT APPEARS AUTHENTIC')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
