"use client";

import { useState, useRef, useMemo, useEffect } from 'react';
import { useZxing } from 'react-zxing';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

interface ScannerProps {
  onScan: (result: string) => void;
}

export const Scanner = ({ onScan }: ScannerProps) => {
  const [error, setError] = useState<string>("");
  const lastScanTimeRef = useRef<number>(Date.now()); // Initialize with current time to prevent immediate scan if needed, or 0. Let's use 0 but add a mount check.
  const isMountedRef = useRef<boolean>(false);

  // Memoize constraints and hints to prevent re-initialization
  const constraints = useMemo(() => ({ video: { facingMode: "environment" } }), []);
  const hints = useMemo(() => new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]]]), []);

  useEffect(() => {
    // Small delay to prevent immediate scan on mount
    const timer = setTimeout(() => {
      isMountedRef.current = true;
    }, 500);
    return () => {
      clearTimeout(timer);
      isMountedRef.current = false;
    };
  }, []);

  const { ref } = useZxing({
    constraints,
    hints,
    timeBetweenDecodingAttempts: 300,
    onDecodeResult(result) {
      if (!isMountedRef.current) return; // Ignore scans during startup delay

      const now = Date.now();
      if (now - lastScanTimeRef.current > 2000) {
        lastScanTimeRef.current = now;
        onScan(result.getText());
      }
    },
    onError(error) {
        // Only show relevant errors to user
        if (error.name === 'NotAllowedError') {
            setError("Camera permission denied. Please allow camera access.");
        } else if (error.name === 'NotFoundError') {
            setError("No camera found.");
        }
        console.error(error);
    }
  });

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-md aspect-[4/3] overflow-hidden rounded-lg border-2 border-gray-300 bg-black">
        <video ref={ref} className="w-full h-full object-cover" />
        <div className="absolute inset-0 border-2 border-transparent pointer-events-none">
            {/* Overlay guide */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-32 border-2 border-red-500 rounded-lg opacity-50"></div>
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-500">バーコードをカメラに向けてください</p>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};
