import { useState, useEffect, useCallback } from "react";

export type ConnectionQuality = "excellent" | "good" | "fair" | "poor" | "disconnected";

interface ConnectionHealth {
  quality: ConnectionQuality;
  label: string;
  bars: number; // 0-4
}

const QUALITY_MAP: Record<ConnectionQuality, { label: string; bars: number }> = {
  excellent: { label: "Excellent", bars: 4 },
  good: { label: "Good", bars: 3 },
  fair: { label: "Fair", bars: 2 },
  poor: { label: "Poor", bars: 1 },
  disconnected: { label: "Disconnected", bars: 0 },
};

export const useConnectionHealth = (): ConnectionHealth & { checkConnection: () => void } => {
  const [quality, setQuality] = useState<ConnectionQuality>("good");

  const checkConnection = useCallback(() => {
    // Check navigator.onLine first
    if (!navigator.onLine) {
      setQuality("disconnected");
      return;
    }

    // Use Network Information API if available
    const connection = (navigator as any).connection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      const downlink = connection.downlink;

      if (effectiveType === "4g" && downlink >= 5) {
        setQuality("excellent");
      } else if (effectiveType === "4g" || (effectiveType === "3g" && downlink >= 1.5)) {
        setQuality("good");
      } else if (effectiveType === "3g" || (effectiveType === "2g" && downlink >= 0.5)) {
        setQuality("fair");
      } else {
        setQuality("poor");
      }
    } else {
      // Fallback: assume good if online
      setQuality("good");
    }
  }, []);

  useEffect(() => {
    checkConnection();

    // Listen to online/offline events
    const handleOnline = () => checkConnection();
    const handleOffline = () => setQuality("disconnected");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen to connection changes if supported
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener("change", checkConnection);
    }

    // Periodic check
    const interval = setInterval(checkConnection, 10000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (connection) {
        connection.removeEventListener("change", checkConnection);
      }
      clearInterval(interval);
    };
  }, [checkConnection]);

  return {
    quality,
    ...QUALITY_MAP[quality],
    checkConnection,
  };
};
