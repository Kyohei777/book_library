"use client";

import { ViewMode } from '@/types';

interface BottomNavProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onScanClick: () => void;
}

export function BottomNav({ currentView, onViewChange, onScanClick }: BottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40 safe-area-pb">
      <div className="flex justify-around items-center h-16 px-2">
        {/* Grid View */}
        <button
          onClick={() => onViewChange('grid')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-w-[3.5rem] ${
            currentView === 'grid' ? 'text-indigo-600' : 'text-gray-400'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="text-[10px] mt-1 font-medium">Grid</span>
        </button>

        {/* Shelf View */}
        <button
          onClick={() => onViewChange('bookshelf')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-w-[3.5rem] ${
            currentView === 'bookshelf' ? 'text-indigo-600' : 'text-gray-400'
          }`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5z" />
          </svg>
          <span className="text-[10px] mt-1 font-medium">Shelf</span>
        </button>

        {/* Center Scan Button */}
        <div className="relative -top-5">
           <button
            onClick={onScanClick}
            className="flex flex-col items-center justify-center w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-600/30 transform transition-transform active:scale-95"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Series View */}
         <button
          onClick={() => onViewChange('series_group')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-w-[3rem] ${
            currentView === 'series_group' ? 'text-indigo-600' : 'text-gray-400'
          }`}
        >
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-[9px] mt-0.5 font-medium">Series</span>
        </button>

        {/* Author View */}
        <button
          onClick={() => onViewChange('author_group')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-w-[3rem] ${
            currentView === 'author_group' ? 'text-indigo-600' : 'text-gray-400'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[9px] mt-0.5 font-medium">Author</span>
        </button>

        {/* Stats View */}
        <button
          onClick={() => onViewChange('stats')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-w-[3rem] ${
            currentView === 'stats' ? 'text-indigo-600' : 'text-gray-400'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-[9px] mt-0.5 font-medium">Stats</span>
        </button>
      </div>
    </div>
  );
}
