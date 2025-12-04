"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';

interface SeriesBook {
  isbn: string;
  title: string;
  authors?: string;
  cover_url?: string;
  volume: number;
  already_owned: boolean;
}

interface SeriesBulkModalProps {
  isbn: string;
  title: string;
  onClose: () => void;
  onRegisterBooks: (isbns: string[]) => Promise<void>;
}

export function SeriesBulkModal({ isbn, title, onClose, onRegisterBooks }: SeriesBulkModalProps) {
  const [seriesBooks, setSeriesBooks] = useState<SeriesBook[]>([]);
  const [selectedIsbns, setSelectedIsbns] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [maxVolume, setMaxVolume] = useState<number | null>(null);

  useEffect(() => {
    fetchSeriesBooks();
  }, []);

  const fetchSeriesBooks = async () => {
    try {
      const res = await axios.get(`/api/books/find-series?isbn=${isbn}&title=${encodeURIComponent(title)}`);
      setSeriesBooks(res.data.books || []);
    } catch (error) {
      console.error('Failed to fetch series:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (bookIsbn: string) => {
    const newSet = new Set(selectedIsbns);
    if (newSet.has(bookIsbn)) {
      newSet.delete(bookIsbn);
    } else {
      newSet.add(bookIsbn);
    }
    setSelectedIsbns(newSet);
  };

  const selectUpTo = (volume: number) => {
    const newSet = new Set<string>();
    seriesBooks.forEach(book => {
      if (book.volume <= volume && !book.already_owned) {
        newSet.add(book.isbn);
      }
    });
    setSelectedIsbns(newSet);
    setMaxVolume(volume);
  };

  const handleRegister = async () => {
    if (selectedIsbns.size === 0) {
      alert('Please select at least one book');
      return;
    }
    setRegistering(true);
    try {
      await onRegisterBooks(Array.from(selectedIsbns));
      onClose();
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Failed to register some books. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-purple-600 text-white flex justify-between items-center">
          <h2 className="font-semibold text-xl">📚 Register Series Books</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
            ×
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">Quick select up to:</span>
                {[10, 20, 30, 40, 50].map(vol => (
                  <button
                    key={vol}
                    onClick={() => selectUpTo(vol)}
                    className={`px-3 py-1 text-sm rounded-full transition-all ${
                      maxVolume === vol
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-purple-100'
                    }`}
                  >
                    Vol.{vol}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {seriesBooks.map(book => (
                  <div
                    key={book.isbn}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      book.already_owned
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 opacity-60'
                        : selectedIsbns.has(book.isbn)
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    }`}
                    onClick={() => !book.already_owned && toggleSelection(book.isbn)}
                  >
                    <div className="aspect-[2/3] mb-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                      {book.cover_url ? (
                        <Image src={book.cover_url} alt={book.title} width={150} height={225} className="w-full h-full object-cover" unoptimized />
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-gray-400">No Cover</div>
                      )}
                    </div>
                    <h3 className="text-xs font-bold line-clamp-2 mb-1">{book.title}</h3>
                    {book.already_owned && (
                      <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Owned</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {selectedIsbns.size} books selected
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">
              Cancel
            </button>
            <button
              onClick={handleRegister}
              disabled={registering || selectedIsbns.size === 0}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {registering ? 'Registering...' : `Register ${selectedIsbns.size} books`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
