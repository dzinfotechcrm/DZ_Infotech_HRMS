import React, { useRef, useState, useCallback, useEffect } from 'react';
import { CameraIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Button from './Button';

export default function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);

  const startCamera = async () => {
    setError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' } // Prefer front camera
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Camera access denied or not available. Please ensure permissions are granted.");
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      // Mirror the image to match the video preview
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageUrl);
      
      // Stop stream after capture
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = () => {
    // Convert base64 to File object
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `live_meeting_${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file, capturedImage);
      });
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {error && <div className="text-danger-600 text-sm font-medium text-center p-4 bg-danger-50 rounded-xl">{error}</div>}
      
      <div className="relative w-full max-w-sm aspect-[4/3] bg-neutral-900 rounded-xl overflow-hidden flex items-center justify-center">
        {!capturedImage ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover -scale-x-100"
          />
        ) : (
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex justify-center gap-4 w-full max-w-sm">
        {!capturedImage ? (
          <>
            {onCancel && <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>}
            <Button onClick={capturePhoto} disabled={!stream} className="flex-1 flex justify-center items-center gap-2">
              <CameraIcon className="w-5 h-5" /> Capture
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={retakePhoto} className="flex-1 flex justify-center items-center gap-2">
              <ArrowPathIcon className="w-5 h-5" /> Retake
            </Button>
            <Button onClick={confirmPhoto} className="flex-1">Confirm Image</Button>
          </>
        )}
      </div>
    </div>
  );
}
