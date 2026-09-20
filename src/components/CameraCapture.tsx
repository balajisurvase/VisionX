import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, AlertCircle, Check, X, ShieldAlert, FlipHorizontal, Upload } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (blob: Blob, dataUrl: string) => void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
  autoStart?: boolean;
  capturedPreviewUrl?: string | null;
  onClear?: () => void;
  className?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onCancel,
  title = 'Live Camera Face Capture',
  subtitle = 'Position individual inside the frame with clear lighting',
  autoStart = true,
  capturedPreviewUrl = null,
  onClear,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(capturedPreviewUrl);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const startStream = useCallback(async (facing: 'user' | 'environment' = facingMode) => {
    stopStream();
    setCameraError(null);
    setIsInitializing(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Webcam access is not supported by your current browser environment.');
      setIsInitializing(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          setIsStreaming(true);
          setIsInitializing(false);
        };
      }
    } catch (err: any) {
      console.warn('Camera capture error:', err);
      setIsInitializing(false);
      setIsStreaming(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in browser site settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No active webcam found on this terminal device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('The webcam is currently in use by another application or process.');
      } else {
        setCameraError(err.message || 'Unable to access camera feed.');
      }
    }
  }, [facingMode, stopStream]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreviewDataUrl(dataUrl);
      onCapture(file, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (autoStart && !capturedPreviewUrl) {
      startStream();
    }
    return () => {
      stopStream();
    };
  }, [autoStart, capturedPreviewUrl, startStream, stopStream]);

  useEffect(() => {
    setPreviewDataUrl(capturedPreviewUrl);
  }, [capturedPreviewUrl]);

  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontal if front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setPreviewDataUrl(dataUrl);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCapture(blob, dataUrl);
          stopStream();
        }
      },
      'image/jpeg',
      0.92
    );
  };

  const handleRetake = () => {
    setPreviewDataUrl(null);
    if (onClear) {
      onClear();
    }
    startStream();
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startStream(nextMode);
  };

  return (
    <div className={`bg-white rounded-xl p-4 text-slate-800 border border-slate-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-blue-50 text-[#0B3D91] flex items-center justify-center font-bold">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Viewport or Snapshot Preview */}
      <div className="relative w-full aspect-4/3 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200">
        {previewDataUrl ? (
          // Captured Snapshot
          <div className="relative w-full h-full">
            <img
              src={previewDataUrl}
              alt="Live Face Snapshot"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold font-mono flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>FRAME CAPTURED</span>
            </div>
          </div>
        ) : cameraError ? (
          // Error State
          <div className="p-6 text-center text-white space-y-3 max-w-xs">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">{cameraError}</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => startStream()}
                className="px-3 py-1.5 rounded text-xs font-bold bg-[#0B3D91] hover:bg-[#082d6c] text-white cursor-pointer inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white cursor-pointer inline-flex items-center gap-1.5"
              >
                <Upload className="w-3 h-3" />
                <span>Upload Photo</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        ) : (
          // Live Video Stream
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />

            {isInitializing && (
              <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-white space-y-2 font-mono text-xs">
                <RefreshCw className="w-5 h-5 text-blue-400" />
                <span className="text-xs font-medium text-slate-300">Initializing camera feed...</span>
              </div>
            )}

            {/* Target Alignment Guide */}
            {isStreaming && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="w-44 h-56 rounded-full border-2 border-dashed border-white/60 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                </div>
                <div className="absolute bottom-3 inset-x-0 text-center">
                  <span className="px-2.5 py-1 rounded bg-black/70 text-white text-[11px] font-mono font-medium">
                    Align face inside the oval
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Control Buttons */}
      <div className="mt-3.5 flex items-center justify-between gap-2">
        {previewDataUrl ? (
          <button
            type="button"
            onClick={handleRetake}
            className="w-full py-2 px-4 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retake Photo</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={toggleFacingMode}
              disabled={!isStreaming}
              className="py-2 px-3 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Switch camera"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Flip</span>
            </button>

            <button
              type="button"
              onClick={handleCapture}
              disabled={!isStreaming || isInitializing}
              className="flex-1 py-2 px-4 rounded bg-[#0B3D91] hover:bg-[#082d6c] active:bg-[#062150] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Capture Face</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
