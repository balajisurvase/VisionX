import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, AlertCircle, Check, X, ShieldAlert, FlipHorizontal } from 'lucide-react';

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
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
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
    <div className={`bg-white rounded-[12px] p-4 text-[#111827] shadow-sm border border-gray-100 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111827] leading-tight">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Viewport or Snapshot Preview */}
      <div className="relative w-full aspect-4/3 bg-[#0B1220] rounded-[10px] overflow-hidden flex items-center justify-center border border-gray-200">
        {previewDataUrl ? (
          // Captured Snapshot
          <div className="relative w-full h-full">
            <img
              src={previewDataUrl}
              alt="Live Face Snapshot"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-md bg-[#DCFCE7] text-[#15803D] text-[11px] font-bold flex items-center gap-1 shadow-sm">
              <Check className="w-3.5 h-3.5" />
              <span>FRAME CAPTURED</span>
            </div>
          </div>
        ) : cameraError ? (
          // Error State
          <div className="p-6 text-center text-white space-y-3 max-w-xs">
            <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#B91C1C] flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-200">{cameraError}</p>
            </div>
            <button
              type="button"
              onClick={() => startStream()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#4F46E5] hover:bg-[#4338CA] text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Try Again</span>
            </button>
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
              <div className="absolute inset-0 bg-[#0B1220]/80 flex flex-col items-center justify-center text-white space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-[#4F46E5]" />
                <span className="text-xs font-medium text-gray-300">Initializing camera feed...</span>
              </div>
            )}

            {/* Target Alignment Guide */}
            {isStreaming && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="w-44 h-56 rounded-full border-2 border-dashed border-white/60 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#4F46E5]/80 animate-ping" />
                </div>
                <div className="absolute bottom-3 inset-x-0 text-center">
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium tracking-wide">
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
            className="w-full py-2 px-4 rounded-lg bg-[#F5F6F8] hover:bg-gray-200 text-[#111827] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
              className="py-2 px-3 rounded-lg bg-[#F5F6F8] hover:bg-gray-200 text-gray-700 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Switch camera"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Flip</span>
            </button>

            <button
              type="button"
              onClick={handleCapture}
              disabled={!isStreaming || isInitializing}
              className="flex-1 py-2 px-4 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] active:bg-[#3730A3] disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
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
