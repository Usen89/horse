/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, Sparkles, Upload, Image } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    setIsLoading(true);
    setError(null);
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setError(
        'Не удалось получить доступ к веб-камере в браузере. Используйте кнопку ниже для съемки со стандартной камеры телефона или выбора готового файла.'
      );
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw the video frame to the canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onCapture(dataUrl);
      stopCamera();
    }
  };

  const handleMobileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          onCapture(event.target.result);
          stopCamera();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div id="camera-capture-overlay" className="fixed inset-0 bg-slate-950/95 flex flex-col items-center justify-between p-4 z-[100] animate-fadeIn font-sans text-white">
      {/* Top Header */}
      <div className="w-full max-w-md flex justify-between items-center py-2 shrink-0">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-emerald-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Съемка Камерой</span>
        </div>
        <button 
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer text-white"
          title="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Viewport */}
      <div className="w-full max-w-md aspect-3/4 bg-slate-900 rounded-3xl overflow-hidden border border-white/10 relative flex items-center justify-center shadow-2xl grow my-2">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/80 z-10 text-xs">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
            <span className="text-slate-400 font-medium">Запуск объектива...</span>
          </div>
        )}

        {error ? (
          <div className="p-6 text-center space-y-5">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
            </div>
            
            <div className="flex flex-col gap-2.5">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                <Camera className="w-4.5 h-4.5" />
                Снять на телефон / Выбрать из галереи
              </button>

              <button 
                onClick={startCamera}
                className="w-full px-4 py-2 text-slate-400 hover:text-white text-xs font-medium transition-all"
              >
                Перезапустить веб-камеру
              </button>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {/* Viewport Overlay framing guide */}
        {!error && !isLoading && (
          <div className="absolute inset-4 border border-dashed border-white/20 rounded-2xl pointer-events-none flex items-center justify-center">
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest bg-black/40 px-2.5 py-1 rounded-full">
              Поместите лошадь в кадр
            </span>
          </div>
        )}
      </div>

      {/* Controls Footer */}
      <div className="w-full max-w-md flex justify-around items-center py-4 shrink-0 gap-4">
        {/* Switch camera button */}
        <button
          onClick={toggleFacingMode}
          disabled={isLoading || !!error}
          className="p-3.5 bg-white/10 hover:bg-white/20 disabled:opacity-40 rounded-full transition-all text-white flex items-center justify-center cursor-pointer"
          title="Сменить камеру (Фронтальная / Основная)"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        {/* Shutter button */}
        <button
          onClick={capturePhoto}
          disabled={isLoading || !!error}
          className="w-16 h-16 bg-white hover:scale-105 active:scale-95 disabled:opacity-40 rounded-full border-4 border-slate-700 transition-all flex items-center justify-center cursor-pointer shadow-lg"
          title="Сделать снимок"
        >
          <div className="w-11 h-11 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center shadow-inner">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </button>

        {/* Native mobile camera / gallery selection shortcut */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3.5 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white flex items-center justify-center cursor-pointer"
          title="Открыть камеру телефона или выбрать из галереи"
        >
          <Image className="w-5 h-5 text-emerald-400" />
        </button>
      </div>

      {/* Hidden standard file input that triggers mobile camera / library on mobile device */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef} 
        onChange={handleMobileUpload} 
        className="hidden" 
      />
    </div>
  );
}
