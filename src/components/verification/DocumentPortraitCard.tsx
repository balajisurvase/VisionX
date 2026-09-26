import React from 'react';
import { Camera, CheckCircle2, AlertCircle, ScanFace, Check, X, Info } from 'lucide-react';
import { VerificationRecord } from '../../types/verification';

interface DocumentPortraitCardProps {
  record: VerificationRecord;
}

export const DocumentPortraitCard: React.FC<DocumentPortraitCardProps> = ({ record }) => {
  const portrait = record.uploaded_portrait || {};
  const isDetected = Boolean(portrait.detected && (portrait.crop_url || portrait.url || portrait.signed_url || portrait.path));
  const cropUrl = portrait.crop_url || portrait.url || portrait.signed_url;

  const bbox = portrait.bounding_box || (portrait as any).boundingBox;
  const bboxStr = bbox && typeof bbox.x === 'number' && typeof bbox.width === 'number'
    ? `X: ${bbox.x}, Y: ${bbox.y}, Width: ${bbox.width}, Height: ${bbox.height}`
    : 'None';

  const rawQuality = (portrait as any).image_quality || (portrait as any).imageQuality;
  const quality = rawQuality === 'HIGH' || rawQuality === 'MEDIUM' || rawQuality === 'LOW'
    ? rawQuality
    : (isDetected ? 'HIGH' : 'LOW');

  const faceDetected = Boolean(
    portrait.face_detected !== false && (portrait as any).faceDetected !== false && isDetected
  );

  const icaoStatus = (portrait as any).icao_portrait || (portrait as any).icaoPortrait || (
    isDetected && faceDetected && quality !== 'LOW' ? 'PASS' : (isDetected ? 'FAIL' : 'NOT ASSESSED')
  );

  const debug = (portrait as any).debug || {};

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Document Facial Portrait Extraction
          </h3>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            isDetected ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}
        >
          {isDetected ? 'Portrait Extracted' : 'Portrait Not Detected'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Extracted Image Crop */}
        <div className="md:col-span-5 bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col items-center justify-center space-y-3">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Uploaded Document Portrait Crop
          </span>
          <div className="w-40 h-48 bg-white rounded-xl border-2 border-slate-300 shadow-sm overflow-hidden flex flex-col items-center justify-center relative">
            {isDetected && cropUrl ? (
              <img
                src={cropUrl}
                alt="Extracted Document Portrait"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <ScanFace className="w-12 h-12 mb-2 text-slate-300" />
                <span className="text-xs font-bold text-slate-600">No Portrait Crop</span>
                <span className="text-[11px] text-slate-400 mt-1">
                  No valid portrait/face region detected in the uploaded document.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Portrait Analysis Metrics */}
        <div className="md:col-span-7 space-y-2.5 text-xs">
          {/* 1. Portrait Detected */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-700 text-[13px]">Portrait Detected:</span>
            <span className="font-bold text-slate-900 flex items-center gap-1.5 text-[13px]">
              {isDetected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-extrabold">YES</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span className="text-rose-700 font-extrabold">NO</span>
                </>
              )}
            </span>
          </div>

          {/* 2. Face Detected */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-700 text-[13px]">Face Detected:</span>
            <span className="font-bold text-slate-900 flex items-center gap-1.5 text-[13px]">
              {faceDetected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-extrabold">YES</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span className="text-rose-700 font-extrabold">NO</span>
                </>
              )}
            </span>
          </div>

          {/* 3. Image Quality */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-700 text-[13px]">Image Quality:</span>
            <span className={`font-mono font-black text-[13px] px-2.5 py-0.5 rounded border ${
              quality === 'HIGH' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              quality === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {quality}
            </span>
          </div>

          {/* 4. ICAO Portrait Check */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-700 text-[13px]">ICAO Portrait:</span>
            <span className={`font-mono font-bold text-[12px] px-2.5 py-0.5 rounded border ${
              icaoStatus === 'PASS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              icaoStatus === 'FAIL' ? 'bg-rose-50 text-rose-700 border-rose-200' :
              'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {icaoStatus}
            </span>
          </div>

          {/* 5. Real Bounding Box */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-700 text-[13px]">Bounding Box:</span>
            <span className="font-mono text-slate-800 text-[12px] font-bold">
              {bboxStr}
            </span>
          </div>

          {/* 6. Dimensions / Diagnostics */}
          {debug?.original_width && (
            <div className="p-2.5 rounded-lg bg-slate-100/80 border border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Original: {debug.original_width}×{debug.original_height}</span>
              <span>Crop: {debug.crop_width || bbox?.width}×{debug.crop_height || bbox?.height}</span>
              {debug.detection_confidence && <span>Conf: {(debug.detection_confidence * 100).toFixed(1)}%</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
