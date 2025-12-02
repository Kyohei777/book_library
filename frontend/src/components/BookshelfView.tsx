"use client";

import { useMemo } from 'react';

import { Book } from '@/types';
import { SpineBook } from './SpineBook';

interface BookshelfViewProps {
  books: Book[];
  onBookClick?: (book: Book) => void;
}

export function BookshelfView({ books, onBookClick }: BookshelfViewProps) {
  const groupedBooks = useMemo(() => {
    const groups: Record<string, Book[]> = {};
    const noSeriesKey = 'Other';

    books.forEach((book) => {
      const key = book.series_title || noSeriesKey;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(book);
    });

    // Sort books within each group
    Object.keys(groups).forEach(key => {
        groups[key].sort((a, b) => {
             return new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare(a.title, b.title);
        });
    });

    return groups;
  }, [books]);

  const sortedKeys = useMemo(() => {
    return Object.keys(groupedBooks).sort((a, b) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare(a, b);
    });
  }, [groupedBooks]);

  return (
    <div className="w-full p-8 bg-[#3e2723] dark:bg-[#2d1b18] min-h-screen rounded-lg shadow-inner transition-colors duration-300 overflow-hidden">
      <div className="flex flex-col gap-y-16">
        {sortedKeys.map((seriesTitle) => (
          <div key={seriesTitle} className="relative">
             {seriesTitle !== 'Other' && (
                <h3 className="text-[#d7ccc8] dark:text-[#a1887f] text-sm font-serif mb-1 ml-4 opacity-70 tracking-widest">
                  {seriesTitle}
                </h3>
             )}
             <div className="relative border-b-[12px] border-[#5d4037] dark:border-[#3e2723] shadow-[0_10px_20px_rgba(0,0,0,0.3)]">
                {/* Shelf top highlight */}
                <div className="absolute top-full left-0 right-0 h-[2px] bg-[#795548] dark:bg-[#4e342e] opacity-50" />
                
                <div className="flex flex-wrap items-end gap-x-[1px] px-4 sm:px-8 pb-0">
                  {groupedBooks[seriesTitle].map((book) => (
                    <div key={book.isbn} className="h-64 relative group">
                      <SpineBook book={book} onClick={onBookClick} />
                    </div>
                  ))}
                </div>
             </div>
          </div>
        ))}
      </div>
      
      {books.length === 0 && (
          <div className="text-white/50 text-center py-20">No books found</div>
      )}
    </div>
  );
}
