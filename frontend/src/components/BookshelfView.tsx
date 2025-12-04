"use client";

import { useState, useMemo } from 'react';
import { Book } from '@/types';

interface BookshelfViewProps {
  books: Book[];
  onBookClick: (book: Book) => void;
}

// シリーズ名抽出関数
const deriveSeriesTitle = (book: Book): string => {
  const dotIndex = book.title.indexOf('.');
  if (dotIndex !== -1) {
    return book.title.substring(0, dotIndex).trim();
  }
  return book.series_title || "Other";
};

export function BookshelfView({ books, onBookClick }: BookshelfViewProps) {
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);

  // シリーズごとにグルーピング
  const seriesGroups = useMemo(() => {
    const groups: Record<string, Book[]> = {};
    books.forEach(book => {
      const series = deriveSeriesTitle(book);
      if (!groups[series]) groups[series] = [];
      groups[series].push(book);
    });
    return groups;
  }, [books]);

  // 各シリーズの代表本を取得
  const seriesRepresentatives = useMemo(() => {
    const reps: Record<string, Book> = {};
    Object.entries(seriesGroups).forEach(([series, seriesBooks]) => {
      // is_series_representative=true の本を探す
      let representative = seriesBooks.find(b => b.is_series_representative);

      // なければ最小の volume_number の本
      if (!representative) {
        const withVolume = seriesBooks.filter(b => b.volume_number !== undefined && b.volume_number !== null);
        if (withVolume.length > 0) {
          representative = withVolume.sort((a, b) => (a.volume_number || 0) - (b.volume_number || 0))[0];
        }
      }

      // それでもなければ最初の本
      if (!representative) {
        representative = seriesBooks[0];
      }

      reps[series] = representative;
    });
    return reps;
  }, [seriesGroups]);

  // 第2階層: シリーズ詳細ビュー
  if (selectedSeries) {
    const seriesBooks = seriesGroups[selectedSeries];
    // 巻数順にソート
    const sortedBooks = [...seriesBooks].sort((a, b) => {
      const volA = a.volume_number ?? 999;
      const volB = b.volume_number ?? 999;
      return volA - volB;
    });

    return (
      <div className="space-y-6">
        {/* 戻るボタン */}
        <button
          onClick={() => setSelectedSeries(null)}
          className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Series List
        </button>

        <h2 className="text-2xl font-bold">{selectedSeries}</h2>
        <p className="text-sm text-gray-500">{sortedBooks.length} books</p>

        {/* 本の一覧（表紙向き） */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {sortedBooks.map((book) => (
            <div
              key={book.isbn}
              onClick={() => onBookClick(book)}
              className="cursor-pointer group"
            >
              <div className="relative aspect-[2/3] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-lg overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:scale-105">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-2">
                    <p className="text-xs font-medium text-center text-gray-600 dark:text-gray-300 line-clamp-4">
                      {book.title}
                    </p>
                  </div>
                )}
                {/* 巻数バッジ */}
                {book.volume_number && (
                  <div className="absolute top-1 right-1 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full shadow">
                    Vol.{book.volume_number}
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-center text-gray-600 dark:text-gray-400 line-clamp-2">
                {book.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 第1階層: シリーズ一覧（代表本のみ）
  const sortedSeries = Object.keys(seriesGroups).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">📚 My Bookshelf</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {sortedSeries.map((series) => {
          const representative = seriesRepresentatives[series];
          const count = seriesGroups[series].length;

          return (
            <div
              key={series}
              onClick={() => setSelectedSeries(series)}
              className="cursor-pointer group"
            >
              {/* 本の表紙 */}
              <div className="relative aspect-[2/3] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105">
                {representative.cover_url ? (
                  <img
                    src={representative.cover_url}
                    alt={representative.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <p className="text-sm font-medium text-center text-gray-600 dark:text-gray-300 line-clamp-6">
                      {representative.title}
                    </p>
                  </div>
                )}
                {/* シリーズ冊数バッジ */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-3 py-1 rounded-full shadow">
                  {count} {count === 1 ? 'book' : 'books'}
                </div>
              </div>

              {/* シリーズ名 */}
              <p className="mt-3 text-sm font-semibold text-center text-gray-700 dark:text-gray-200 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {series}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
