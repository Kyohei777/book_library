"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Book } from '@/types';
import { generateSpineStyle } from '@/utils/spineGenerator';
import { optimizeBookCover } from '@/utils/imageHelper';

interface SpineBookProps {
  book: Book;
  onClick?: (book: Book) => void;
}

export function SpineBook({ book, onClick }: SpineBookProps) {
  const style = generateSpineStyle(book);
  const [isHovered, setIsHovered] = useState(false);
  const optimizedCover = optimizeBookCover(book.cover_url);

  return (
    <div 
      className="relative group h-full flex-shrink-0 transition-transform duration-200 hover:-translate-y-2 hover:z-10 cursor-pointer"
      style={{ width: style.width }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick && onClick(book)}
    >
      {/* 背表紙本体 */}
      <div 
        className="h-full w-full border-r border-black/10 shadow-sm flex flex-col items-center py-4 overflow-hidden relative"
        style={{ 
          backgroundColor: style.backgroundColor, 
          color: style.textColor,
          boxShadow: 'inset -2px 0 5px rgba(0,0,0,0.1), inset 2px 0 5px rgba(255,255,255,0.1)' // 立体感
        }}
      >
        {/* タイトル (縦書き) */}
        <div 
          className="flex-grow flex items-center justify-center font-bold text-[10px] tracking-wide overflow-hidden w-full px-0.5"
          style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}
        >
          <span className="line-clamp-vertical break-words">{book.title}</span>
        </div>

        {/* 下部のロゴ風マーク */}
        <div className="mt-2 w-3 h-3 rounded-full opacity-50 bg-current shrink-0" />
      </div>

      {/* ホバー時のポップオーバー (表紙プレビュー) */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
          {/* 表紙画像 */}
          <div className="relative aspect-[2/3] w-full mb-2 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
            {optimizedCover ? (
              <Image
                src={optimizedCover}
                alt={book.title}
                fill
                className="object-cover"
                unoptimized={true}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">NO IMAGE</div>
            )}
          </div>
          {/* 書誌情報 */}
          <div className="text-center">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight mb-1">{book.title}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{book.authors}</p>
          </div>
          {/* 吹き出しの三角 */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-white dark:border-t-gray-800" />
        </div>
      )}
    </div>
  );
}
