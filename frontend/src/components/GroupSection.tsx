import { useState, ReactNode } from 'react';

interface GroupSectionProps {
  title: string;
  count: number;
  children: ReactNode;
  defaultOpen?: boolean;
  variant?: 'default' | 'sub';
}

export function GroupSection({ title, count, children, defaultOpen = false, variant = 'default' }: GroupSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const isSub = variant === 'sub';

  return (
    <div className={`${
      isSub 
        ? 'border-l-2 border-gray-200 dark:border-gray-700 ml-4 mt-4' 
        : 'bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden'
    }`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between transition-colors text-left ${
          isSub 
            ? 'py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg' 
            : 'px-6 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
        }`}
      >
        <h2 className={`${isSub ? 'text-base' : 'text-xl'} font-bold text-gray-900 dark:text-white flex items-center gap-2`}>
          {!isSub && <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>}
          {title}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
            ({count})
          </span>
        </h2>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className={`${isSub ? 'py-4 pl-4' : 'p-6 border-t border-gray-100 dark:border-gray-700'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
