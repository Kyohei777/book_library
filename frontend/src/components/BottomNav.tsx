"use client";

interface BottomNavProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onScanClick: () => void;
}

export function BottomNav({ currentView, onViewChange, onScanClick }: BottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40 safe-area-pb">
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => onViewChange('grid')}
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            currentView === 'grid' ? 'text-indigo-600' : 'text-gray-500'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="text-xs mt-1">Grid</span>
        </button>

        <button
          onClick={() => onViewChange('bookshelf')}
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            currentView === 'bookshelf' ? 'text-indigo-600' : 'text-gray-500'
          }`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5z" />
          </svg>
          <span className="text-xs mt-1">Shelf</span>
        </button>

        <button
          onClick={onScanClick}
          className="flex flex-col items-center justify-center w-16 h-16 -mt-8 bg-indigo-600 text-white rounded-full shadow-lg"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        <button
          onClick={() => onViewChange('series_group')}
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            currentView === 'series_group' ? 'text-indigo-600' : 'text-gray-500'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-xs mt-1">Series</span>
        </button>

        <button
          onClick={() => onViewChange('stats')}
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            currentView === 'stats' ? 'text-indigo-600' : 'text-gray-500'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-xs mt-1">Stats</span>
        </button>
      </div>
    </div>
  );
}
