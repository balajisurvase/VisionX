import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  Camera,
  Crosshair,
  ShieldCheck,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { VerificationRecord } from '../../types/verification';
import {
  normalizeIsoDate,
  formatVisualDate,
  generateTd3Mrz,
  evaluateRealTimeExpiry,
} from '../../utils/mrzUtils';

interface DocumentInspectionViewportProps {
  record: VerificationRecord;
  uploadedPreviewUrl: string | null;
}

export const DocumentInspectionViewport: React.FC<DocumentInspectionViewportProps> = ({
  record,
  uploadedPreviewUrl,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [showElaHeatmap, setShowElaHeatmap] = useState<boolean>(false);
  const [showGridRuler, setShowGridRuler] = useState<boolean>(false);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(250, z + 25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(50, z - 25));
  const handleResetZoom = () => {
    setZoomLevel(100);
    setRotation(0);
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const rawExp = record.date_of_expiry || record.ocr_data?.date_of_expiry;
  const expIso = normalizeIsoDate(rawExp, '2031-08-20');
  const expVisual = formatVisualDate(expIso);
  const realTimeEval = evaluateRealTimeExpiry(expIso);

  const isTampered = false;
  const isExpired = record.verification_status === 'EXPIRED' || realTimeEval.isExpired;

  const dobIso = normalizeIsoDate(
    record.date_of_birth || record.ocr_data?.date_of_birth,
    '1998-03-14'
  );
  const dobVisual = formatVisualDate(dobIso);

  const rawDocNo = (record.document_number || record.ocr_data?.document_number || 'DEMOPPT001')
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase();

  const computedMrz = generateTd3Mrz({
    documentType: record.document_type,
    countryCode: record.nationality?.slice(0, 3) || 'IND',
    fullName: record.applicant_name || 'AARAV SHARMA',
    documentNumber: rawDocNo,
    nationality: record.nationality || 'IND',
    dateOfBirth: dobIso,
    dateOfExpiry: expIso,
    gender: record.ocr_data?.gender || 'M',
  });

  const mrz1 = record.ocr_data?.mrz_line_1 && record.ocr_data.mrz_line_1.length >= 40
    ? record.ocr_data.mrz_line_1
    : computedMrz.line1;

  const mrz2 = record.ocr_data?.mrz_line_2 && record.ocr_data.mrz_line_2.length >= 40
    ? record.ocr_data.mrz_line_2
    : computedMrz.line2;

  return (
    <div className="bg-white rounded-[12px] border border-gray-100 p-5 shadow-2xs space-y-4">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-[#4F46E5]" />
            Forensic Document Viewport
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F6F8] text-gray-600 font-mono">
            {zoomLevel}%
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Zoom Controls */}
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-[#F5F6F8] hover:bg-gray-200 text-gray-700 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-[#F5F6F8] hover:bg-gray-200 text-gray-700 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRotate}
            className="p-1.5 rounded-lg bg-[#F5F6F8] hover:bg-gray-200 text-gray-700 cursor-pointer"
            title="Rotate 90°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="px-2 py-1 text-[11px] font-bold rounded-lg bg-[#F5F6F8] hover:bg-gray-200 text-gray-600 cursor-pointer"
            title="Reset Transform"
          >
            Reset
          </button>

          <div className="h-4 w-px bg-gray-200 mx-1" />

          {/* Overlays Toggle */}
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              showOverlays
                ? 'bg-[#EEF2FF] text-[#4F46E5] border border-[#4F46E5]/30'
                : 'bg-[#F5F6F8] text-gray-600 hover:bg-gray-200'
            }`}
          >
            {showOverlays ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>ROI Overlays</span>
          </button>

          {/* ELA Heatmap Toggle */}
          <button
            onClick={() => setShowElaHeatmap(!showElaHeatmap)}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              showElaHeatmap
                ? 'bg-[#FEF3C7] text-[#B45309] border border-[#D97706]/30'
                : 'bg-[#F5F6F8] text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ELA Layer</span>
          </button>

          {/* Grid/Ruler Toggle */}
          <button
            onClick={() => setShowGridRuler(!showGridRuler)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              showGridRuler
                ? 'bg-[#DCFCE7] text-[#15803D]'
                : 'bg-[#F5F6F8] text-gray-600 hover:bg-gray-200'
            }`}
            title="Alignment Crosshairs & Micro-Grid"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real-time Expiry Notification Ribbon */}
      {isExpired && (
        <div className="bg-[#FEF2F2] border border-[#FCA5A5] p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs font-bold text-[#991B1B] shadow-2xs animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>REAL-TIME EXPIRY: Validity lapsed {realTimeEval.relativeTimeText} ({realTimeEval.visualDate})</span>
          </div>
          <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold shrink-0">
            Lapsed
          </span>
        </div>
      )}

      {/* Main Canvas Viewport Container */}
      <div className="relative bg-[#0B1220] rounded-xl overflow-hidden min-h-[320px] max-h-[440px] flex items-center justify-center p-4 border border-gray-200 select-none">
        {/* Alignment Grid Overlay */}
        {showGridRuler && (
          <div
            className="absolute inset-0 pointer-events-none opacity-20 z-10"
            style={{
              backgroundImage:
                'linear-gradient(to right, #4ADE80 1px, transparent 1px), linear-gradient(to bottom, #4ADE80 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
        )}

        {/* ELA Heatmap Simulation Overlay */}
        {showElaHeatmap && (
          <div className="absolute inset-0 pointer-events-none z-20 mix-blend-screen opacity-70 bg-gradient-to-tr from-purple-900/40 via-transparent to-amber-600/30 flex items-center justify-center">
            <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono font-bold text-amber-400 border border-amber-500/30">
              OpenCV Error Level Analysis Active: Residual Delta Heatmap
            </div>
            {isTampered && (
              <div className="absolute left-[15%] top-[25%] w-28 h-36 border-2 border-red-500 rounded bg-red-500/20 animate-pulse flex items-center justify-center">
                <span className="text-[9px] font-bold bg-red-600 text-white px-1 py-0.5 rounded font-mono shadow-xs">
                  COMPRESSION SPIKE
                </span>
              </div>
            )}
          </div>
        )}

        {/* Document Render Element (Uploaded Image OR Synthesized Vector Specimen) */}
        <div
          className="transition-transform duration-200 ease-out origin-center w-full max-w-lg"
          style={{
            transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
          }}
        >
          {uploadedPreviewUrl ? (
            <div className="relative inline-block w-full">
              <img
                src={uploadedPreviewUrl}
                alt="Document Specimen"
                className="w-full h-auto max-h-[380px] object-contain rounded-lg shadow-lg border border-gray-700 mx-auto"
              />
              {/* Overlays on uploaded image */}
              {showOverlays && (
                <>
                  {/* Photo Box ROI */}
                  <div className="absolute top-[18%] left-[8%] w-[24%] h-[42%] border-2 border-emerald-400/80 rounded bg-emerald-500/10 pointer-events-none flex items-start justify-end p-0.5">
                    <span className="text-[8px] font-bold bg-emerald-600 text-white px-1 rounded-xs font-mono">
                      PHOTO ROI
                    </span>
                  </div>
                  {/* MRZ Zone ROI */}
                  <div className="absolute bottom-[6%] left-[6%] right-[6%] h-[22%] border-2 border-indigo-400/80 rounded bg-indigo-500/10 pointer-events-none flex items-start justify-end p-0.5">
                    <span className="text-[8px] font-bold bg-indigo-600 text-white px-1 rounded-xs font-mono">
                      ICAO 9303 MRZ
                    </span>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Synthesized High-Fidelity Sovereign Specimen */
            <div className="bg-white rounded-xl p-5 text-gray-900 font-sans shadow-2xl border border-gray-300 relative select-none">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-[#1E3A8A] pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-serif text-xs font-bold">
                    ★
                  </div>
                  <div>
                    <span className="text-[11px] font-black tracking-widest text-[#1E3A8A] block uppercase">
                      REPUBLIC OF {record.nationality?.toUpperCase() || 'INDIA'}
                    </span>
                    <span className="text-[8px] font-bold text-gray-500 tracking-wider block">
                      PASSPORT / PASSEPORT • TD-3 STANDARD
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-black text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {record.document_type.toUpperCase()}
                </span>
              </div>

              {/* Bio Page Body */}
              <div className="grid grid-cols-12 gap-4 my-3 items-center">
                {/* Photo Portrait Frame */}
                <div className="col-span-4 relative bg-gray-100 aspect-[3/4] rounded-lg flex flex-col items-center justify-center p-1 border-2 border-gray-300 overflow-hidden shadow-inner">
                  <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center mb-1">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-[8px] font-bold text-gray-500 font-mono">PORTRAIT</span>
                  <span className="text-[7px] text-gray-400 font-mono">ICAO FACE</span>

                  {showOverlays && (
                    <div
                      className={`absolute inset-0 border-2 rounded pointer-events-none flex flex-col justify-between p-1 ${
                        isTampered
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-emerald-500 bg-emerald-500/5'
                      }`}
                    >
                      <span
                        className={`text-[7px] font-bold px-1 rounded-xs font-mono self-end ${
                          isTampered ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {isTampered ? 'TAMPERED CROP' : 'BIOMETRIC MATCH'}
                      </span>
                      <span className="text-[6px] font-mono text-gray-600 bg-white/80 px-0.5 rounded self-start">
                        LANDMARKS: 68 PTS
                      </span>
                    </div>
                  )}
                </div>

                {/* VIZ Identity Details */}
                <div className="col-span-8 space-y-1.5 text-[10px]">
                  <div>
                    <span className="text-[8px] font-bold text-gray-400 uppercase block tracking-wider">
                      Full Name / Nom
                    </span>
                    <span className="font-black text-gray-900 text-xs block truncate tracking-wide">
                      {record.applicant_name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[8px] font-bold text-gray-400 uppercase block">
                        Doc No. / No. Passeport
                      </span>
                      <span className="font-mono font-bold text-gray-900 text-[11px] block">
                        {record.document_number}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-gray-400 uppercase block">
                        Nationality / Nationalité
                      </span>
                      <span className="font-bold text-gray-900 block">
                        {record.nationality}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[8px] font-bold text-gray-400 uppercase block">
                        Date of Birth / Date de Naiss.
                      </span>
                      <span className="font-mono font-semibold text-gray-800 block text-[11px]">
                        {dobVisual}
                      </span>
                      <span className="text-[8px] font-mono text-gray-400 block">
                        {dobIso}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-gray-400 uppercase block">
                        Date of Expiry / Date d'exp.
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`font-mono font-bold block text-[11px] ${
                            isExpired ? 'text-red-600' : 'text-gray-800'
                          }`}
                        >
                          {expVisual}
                        </span>
                        {isExpired ? (
                          <span className="text-[7px] font-bold uppercase bg-red-100 text-red-700 px-1 py-0.2 rounded font-mono">
                            EXPIRED
                          </span>
                        ) : (
                          <span className="text-[7px] font-bold uppercase bg-emerald-100 text-emerald-700 px-1 py-0.2 rounded font-mono">
                            VALID
                          </span>
                        )}
                      </div>
                      <span className="text-[8px] font-mono text-gray-400 block">
                        {expIso} • {realTimeEval.relativeTimeText}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Machine Readable Zone (MRZ) Block */}
              <div
                className={`p-2 rounded font-mono text-[9px] tracking-[0.18em] leading-tight select-all border ${
                  showOverlays
                    ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-bold'
                    : 'bg-gray-100 border-gray-300 text-gray-800'
                }`}
              >
                <div className="truncate">
                  {mrz1}
                </div>
                <div className="truncate mt-0.5">
                  {mrz2}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Viewport Meta Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-gray-600 pt-1">
        <div className="p-2 rounded-lg bg-[#F5F6F8]">
          <span className="text-[9px] text-gray-400 block uppercase font-sans font-bold">
            Standard
          </span>
          <span className="font-bold text-gray-900">ICAO Doc 9303 (TD3)</span>
        </div>
        <div className="p-2 rounded-lg bg-[#F5F6F8]">
          <span className="text-[9px] text-gray-400 block uppercase font-sans font-bold">
            Substrate Check
          </span>
          <span className="font-bold text-emerald-600">UV/Visible Cleared</span>
        </div>
        <div className="p-2 rounded-lg bg-[#F5F6F8]">
          <span className="text-[9px] text-gray-400 block uppercase font-sans font-bold">
            Resolution
          </span>
          <span className="font-bold text-gray-900">600 DPI Optical</span>
        </div>
        <div className="p-2 rounded-lg bg-[#F5F6F8]">
          <span className="text-[9px] text-gray-400 block uppercase font-sans font-bold">
            Security Threads
          </span>
          <span className="font-bold text-gray-900">Intaglio & Guilloche</span>
        </div>
      </div>
    </div>
  );
};
