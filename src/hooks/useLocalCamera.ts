import { useState, useCallback, useRef, useEffect } from "react";

interface UseLocalCameraReturn {
  stream: MediaStream | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  toggleMute: () => void;
  toggleCamera: () => void;
  requestPermission: () => Promise<boolean>;
  stopStream: () => void;
}

export function useLocalCamera(): UseLocalCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  
  const streamRef = useRef<MediaStream | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (streamRef.current) {
      return true; // Already have a stream
    }

    setIsLoading(true);
    setError(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: true,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setHasPermission(true);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setIsLoading(false);
      setHasPermission(false);

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Camera access denied. Please enable camera permissions in your browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError("No camera found. Please connect a camera and try again.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setError("Camera is already in use by another application.");
      } else {
        setError("Unable to access camera. Please check your device settings.");
      }

      return false;
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      const newMutedState = !isMuted;
      
      audioTracks.forEach((track) => {
        track.enabled = !newMutedState;
      });
      
      setIsMuted(newMutedState);
    }
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      const newCameraOffState = !isCameraOff;
      
      videoTracks.forEach((track) => {
        track.enabled = !newCameraOffState;
      });
      
      setIsCameraOff(newCameraOffState);
    }
  }, [isCameraOff]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
      setStream(null);
      setHasPermission(false);
      setIsMuted(false);
      setIsCameraOff(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  return {
    stream,
    isLoading,
    error,
    hasPermission,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleCamera,
    requestPermission,
    stopStream,
  };
}
