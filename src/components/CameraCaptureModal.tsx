import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, FlipHorizontal, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { SupportedLanguage } from '../types';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  onPermissionDenied: () => void;
  lang: SupportedLanguage;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  onPermissionDenied,
  lang
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available in this browser');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera start error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        onPermissionDenied();
        onClose();
        return;
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('No camera hardware found on this device.');
      } else {
        setErrorMsg(err.message || 'Unable to start camera.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    stopCamera();
    onCapture(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 z-10">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-sm text-white">
              {lang === 'kn' ? 'ನೋಟಿಸ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ' : lang === 'hi' ? 'सरकारी नोटिस स्कैन करें' : 'Scan Government Notice'}
            </span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Video Viewfinder Area */}
        <div className="relative bg-black aspect-4/3 sm:aspect-16/10 flex items-center justify-center overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-cyan-400 space-y-2 z-20">
              <RefreshCw className="w-7 h-7 animate-spin" />
              <span className="text-xs font-medium text-slate-300">Initializing camera...</span>
            </div>
          )}

          {errorMsg ? (
            <div className="p-6 text-center space-y-3 z-10 max-w-sm">
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
              <div className="text-sm font-bold text-white">{errorMsg}</div>
              <p className="text-xs text-slate-400">
                You can upload a photo of the notice directly or check your permissions.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => onPermissionDenied()}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition"
                >
                  Permissions Guide
                </button>
                <button
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Overlay Targeting Box */}
              <div className="absolute inset-6 border-2 border-cyan-400/70 rounded-2xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-cyan-400 -mt-1 -ml-1" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-cyan-400 -mt-1 -mr-1" />
                </div>
                <div className="text-center">
                  <span className="px-2.5 py-1 rounded-full bg-slate-950/80 text-[10px] font-mono text-cyan-300 border border-cyan-500/40 backdrop-blur-xs">
                    Align notice inside box • Gemma 4 reads stamps & tables
                  </span>
                </div>
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-cyan-400 -mb-1 -ml-1" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-cyan-400 -mb-1 -mr-1" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Capture Controls Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          {/* Flip Camera Button */}
          <button
            onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="Switch Front/Rear Camera"
          >
            <FlipHorizontal className="w-5 h-5" />
          </button>

          {/* Shutter Button */}
          <button
            onClick={capturePhoto}
            disabled={!stream}
            className="w-16 h-16 rounded-full bg-cyan-500 hover:bg-cyan-400 active:scale-95 border-4 border-slate-900 ring-4 ring-cyan-500/40 flex items-center justify-center text-slate-950 shadow-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Capture Document Photo"
          >
            <Camera className="w-7 h-7" />
          </button>

          {/* Permissions Help Shortcut */}
          <button
            onClick={() => {
              stopCamera();
              onClose();
              onPermissionDenied();
            }}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="Permissions & Troubleshooting"
          >
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </button>
        </div>

      </div>
    </div>
  );
};
