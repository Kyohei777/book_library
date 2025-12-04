"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Book } from '@/types';

interface Book3DSpineProps {
  book: Book;
  onClick?: (book: Book) => void;
}

export function Book3DSpine({ book, onClick }: Book3DSpineProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group cursor-pointer"
      style={{ width: '40px', height: '250px', perspective: '1000px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.(book)}
    >
      <div
        className="relative w-full h-full transition-transform duration-500 preserve-3d"
        style={{
          transformStyle: 'preserve-3d',
          transform: isHovered ? 'rotateY(-15deg) translateX(10px)' : 'rotateY(0deg)',
        }}
      >
        {/* Spine */}
        <div
          className="absolute w-full h-full bg-gradient-to-r from-gray-700 to-gray-600 border-r border-black/20 flex items-center justify-center"
          style={{
            backfaceVisibility: 'hidden',
          }}
        >
          <span
            className="text-white text-xs font-bold tracking-wide"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            {book.title.length > 30 ? book.title.substring(0, 30) + '...' : book.title}
          </span>
        </div>

        {/* Front cover (3D effect) */}
        <div
          className="absolute w-full h-full bg-white dark:bg-gray-800 shadow-xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(90deg) translateZ(20px)',
          }}
        >
          {book.cover_url && (
            <Image
              src={book.cover_url}
              alt={book.title}
              fill
              className="object-cover"
              unoptimized
            />
          )}
        </div>
      </div>

      {/* Tooltip */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black text-white text-xs p-2 rounded shadow-lg z-50 pointer-events-none">
          {book.title}
        </div>
      )}
    </div>
  );
}
