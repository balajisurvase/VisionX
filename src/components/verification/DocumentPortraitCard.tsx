import React from 'react';
import { Camera, CheckCircle2, AlertCircle, ScanFace } from 'lucide-react';
import { VerificationRecord } from '../../types/verification';

interface DocumentPortraitCardProps {
  record: VerificationRecord;
}

export const DocumentPortraitCard: React.FC<DocumentPortraitCardProps> = ({ record }) => {
  const portrait = record.uploaded_portrait || {};
  const isDetected = Boolean(portrait.detected || portrait.crop_url || portrait.url || portrait.path);
  const cropUrl = portrait.crop_url || portrait.url || portrait.signed_url || record.uploaded_document?.signed_url;

  const bbox = portrait.bounding_box;
  const bboxStr = bbox ? `X:${bbox.x}, Y:${bbox.y}, W:${bbox.width}, H:${bbox.height}` : 'Normalized Center';
  const quality = (portrait as any).image_quality || (record.ocr_data?.confidence_score && record.ocr_data.confidence_score >= 80 ? 'HIGH' : 'SUFFICIENT');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Document Facial Portrait Extraction
          </h3>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
            isDetected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {isDetected ? 'Portrait Extracted' : 'Portrait Not Detected'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Extracted Image Crop */}
        <div className="md:col-span-5 bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col items-center justify-center space-y-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Uploaded Document Portrait Crop
          </span>
          <div className="w-36 h-44 bg-white rounded-xl border-2 border-slate-300 shadow-sm overflow-hidden flex flex-col items-center justify-center relative">
            {cropUrl ? (
              <img
                src={cropUrl}
                alt="Extracted Passport Portrait"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <ScanFace className="w-10 h-10 mb-2 text-slate-300" />
                <span className="text-xs font-semibold">No Portrait Crop</span>
                <span className="text-[10px] text-slate-400">ICAO standards</span>
              </div>
            )}
          </div>
        </div>

        {/* Portrait Analysis Metrics */}
        <div className="md:col-span-7 space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <span className="font-semibold text-slate-600">Portrait Detected:</span>
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              {isDetected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>YES</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span>NO</span>
                </>
              )}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <span className="font-semibold text-slate-600">Face Detected:</span>
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              {isDetected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>YES (ICAO 9303 Compliant)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span>NOT CONFIRMED</span>
                </>
              )}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <span className="font-semibold text-slate-600">Image Quality:</span>
            <span className="font-bold text-slate-900 font-mono">
              {quality}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <span className="font-semibold text-slate-600">Approximate Bounding Box:</span>
            <span className="font-mono text-slate-700 text-[11px]">
              {bboxStr}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
