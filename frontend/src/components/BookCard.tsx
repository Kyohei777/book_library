"use client";

import Image from 'next/image';
import { Book } from '@/types';
import { optimizeBookCover } from '@/utils/imageHelper';

interface BookCardProps {
  book: Book;
  onDelete: (isbn: string) => void;
  onEdit?: (book: Book) => void;
  compact?: boolean;
}

export function BookCard({ book, onDelete, onEdit, compact = false }: BookCardProps) {
  const optimizedCover = optimizeBookCover(book.cover_url);

  return (
    <div className="group relative flex flex-col">
      {/* Book Cover */}
      <div className={`relative aspect-[2/3] mb-2 transition-transform duration-300 group-hover:-translate-y-1 ${compact ? 'rounded-sm' : 'rounded-md shadow-md group-hover:shadow-xl'}`}>
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 overflow-hidden rounded-inherit">
          {optimizedCover ? (
            <Image
              src={optimizedCover}
              alt={book.title}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              className="object-cover"
              loading="lazy"
              unoptimized={true}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-2 text-center bg-amber-50 dark:bg-gray-800">
              <span className="text-xs text-gray-400 mb-1">NO IMAGE</span>
              <span className="text-[10px] font-bold text-gray-500 line-clamp-3">{book.title}</span>
            </div>
          )}
        </div>
        
        {/* Status Badge */}
        <div className="absolute top-1 right-1 z-10">
          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shadow-sm ${
            book.status === 'done' ? 'bg-green-500 text-white' :
            book.status === 'reading' ? 'bg-yellow-500 text-white' :
            'bg-gray-500 text-white opacity-0 group-hover:opacity-100'
          }`}>
            {book.status === 'done' ? '✓' : book.status === 'reading' ? '📖' : '•'}
          </span>
        </div>
      </div>

      {/* Book Info */}
      <div className="text-center px-1">
        <h3 className={`font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight mb-0.5 group-hover:text-indigo-600 transition-colors ${compact ? 'text-xs' : 'text-sm'}`}>
          {book.title}
        </h3>
        {!compact && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
            {book.authors}
          </p>
        )}
      </div>

      {/* Hover Actions */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-md flex items-center justify-center gap-2 backdrop-blur-[1px] z-20">
        {onEdit && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(book);
            }}
            className="p-2 bg-white text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors shadow-lg"
            title="Edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>
        )}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(book.isbn);
          }}
          className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50 transition-colors shadow-lg"
          title="Delete"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  );
}
