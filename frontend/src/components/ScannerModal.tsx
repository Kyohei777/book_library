"use client";

import { Scanner } from '@/components/Scanner';

interface ScannerModalProps {
  onScan: (isbn: string) => void;
  onClose: () => void;
}

export function ScannerModal({ onScan, onClose }: ScannerModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
          <h2 className="font-semibold flex items-center gap-2">
            📸 Scan Barcode
          </h2>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="relative aspect-square sm:aspect-[4/3] bg-black">
           {/* Scannerコンポーネントがここに表示されます */}
          <Scanner onScan={onScan} />
        </div>

        <div className="p-4 text-center text-sm text-gray-500 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          カメラを本のバーコードに合わせてください
        </div>
      </div>
    </div>
  );
}
