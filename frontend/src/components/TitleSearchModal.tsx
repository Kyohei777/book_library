"use client";

import { useState } from 'react';
import axios from 'axios';
import Image from 'next/image';

interface SearchResult {
  isbn?: string;
  title: string;
  authors?: string;
  publisher?: string;
  cover_url?: string;
  description?: string;
}

interface TitleSearchModalProps {
  onClose: () => void;
  onSelectBook: (book: SearchResult) => void;
}

export function TitleSearchModal({ onClose, onSelectBook }: TitleSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await axios.get(`/api/search/title?query=${encodeURIComponent(query)}`);
      setResults(res.data);
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
          <h2 className="font-semibold text-xl">🔍 Search Books by Title</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter book title..."
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
              autoFocus
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div className="overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : searched && results.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                No results found. Try a different search term.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((book, index) => (
                  <div
                    key={index}
                    onClick={() => onSelectBook(book)}
                    className="flex gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all"
                  >
                    <div className="w-20 h-28 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                      {book.cover_url ? (
                        <Image
                          src={book.cover_url}
                          alt={book.title}
                          width={80}
                          height={112}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                          No Cover
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm line-clamp-2 mb-1">{book.title}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{book.authors}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-1">{book.publisher}</p>
                      {book.isbn && (
                        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">ISBN: {book.isbn}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
