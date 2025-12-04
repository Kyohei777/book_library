"use client";
import { Book } from '@/types';

interface SeriesProgressProps {
  seriesName: string;
  books: Book[];
}

export function SeriesProgress({ seriesName, books }: SeriesProgressProps) {
  const total = books.length;
  const read = books.filter(b => b.status === 'done').length;
  const progress = total > 0 ? Math.round((read / total) * 100) : 0;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg">
      <h4 className="font-bold text-lg mb-2">{seriesName}</h4>
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-bold">{read}/{total}</span>
        <span className="text-xs text-gray-500">({progress}%)</span>
      </div>
    </div>
  );
}
