"use client";

import { useState, useRef, useEffect } from 'react';
import { useLibrary } from '@/hooks/useLibrary';
import { BookCard } from '@/components/BookCard';
import { EditBookModal } from '@/components/EditBookModal';
import { ScannerModal } from '@/components/ScannerModal';
import { ManualAddModal } from '@/components/ManualAddModal';
import { BookshelfView } from '@/components/BookshelfView';
import { GroupSection } from '@/components/GroupSection';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Book } from '@/types';

export default function Home() {
  const {
    books,
    groupedBooks,
    loading,
    message,
    error,
    searchTerm,
    setSearchTerm,
    sortOption,
    setSortOption,
    viewMode,
    setViewMode,
    fetchBooks,
    registerBook,
    addBook,
    deleteBook,
    updateBook
  } = useLibrary();

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManualAddModalOpen, setIsManualAddModalOpen] = useState(false);
  const isProcessingScanRef = useRef(false);

  const handleScan = async (isbn: string) => {
    if (isProcessingScanRef.current) return;
    isProcessingScanRef.current = true;
    setIsScanning(true);
    setIsScannerOpen(false); // Close immediately

    const exists = books.some(b => b.isbn === isbn);
    if (exists) {
      // Already exists logic if needed
    }

    await registerBook(isbn);
    
    setTimeout(() => {
      setIsScanning(false);
      isProcessingScanRef.current = false;
    }, 2000);
  };

  const handleUpdateBook = async (isbn: string, data: Partial<Book>) => {
    await updateBook(isbn, data);
    setIsEditModalOpen(false);
    setEditingBook(null);
  };

  const handleManualAdd = async (bookData: Partial<Book>) => {
    await addBook(bookData);
    setIsManualAddModalOpen(false);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setIsEditModalOpen(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Q for Quick Add
      if ((e.ctrlKey || e.metaKey) && (e.key === 'q' || e.key === 'Q')) {
        e.preventDefault();
        setIsManualAddModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <main className="min-h-screen bg-[#f5f5f7] dark:bg-gray-900 text-gray-900 dark:text-gray-100 pb-20">
      {/* Header Area */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Title & Scanner Button (Mobile) */}
            <div className="flex items-center justify-between">
              <h1 
                className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 cursor-pointer"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                My Library
              </h1>
              <div className="flex items-center gap-2 md:hidden">
                <ThemeToggle />
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-lg transition-all active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75zM16.5 19.5h.75v.75h-.75v-.75z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Search & Controls */}
            <div className="flex flex-col md:flex-row gap-3 flex-grow md:max-w-3xl">
              {/* Search Bar */}
              <div className="relative flex-grow group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search titles, authors..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* View Mode & Sort */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar shrink-0">
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg shrink-0">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      viewMode === 'grid' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('author_group')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      viewMode === 'author_group' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Author
                  </button>
                  <button
                    onClick={() => setViewMode('series_group')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      viewMode === 'series_group' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Series
                  </button>
                  <button
                    onClick={() => setViewMode('bookshelf')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                      viewMode === 'bookshelf' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5z" />
                    </svg>
                    Shelf
                  </button>
                </div>

                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="block w-32 pl-3 pr-8 py-1.5 text-xs border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <option value="created_desc">Newest</option>
                  <option value="created_asc">Oldest</option>
                  <option value="title_asc">Title A-Z</option>
                  <option value="author_asc">Author A-Z</option>
                </select>

                <ThemeToggle className="hidden md:block" />

                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75zM16.5 19.5h.75v.75h-.75v-.75z" />
                  </svg>
                  Scan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {message && (
          <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        {loading && books.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-dashed border-gray-300 dark:border-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No books found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by scanning a book ISBN.</p>
            <div className="mt-6">
              <button
                onClick={() => setIsScannerOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Scan Book
              </button>
            </div>
          </div>
        ) : viewMode === 'bookshelf' ? (
          <div className="animate-in fade-in duration-500">
            <BookshelfView 
              books={books} 
              onBookClick={openEditModal}
            />
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 animate-in fade-in duration-500">
            {books.map((book) => (
              <BookCard 
                key={book.isbn} 
                book={book} 
                onDelete={deleteBook}
                onEdit={openEditModal}
              />
            ))}
          </div>
        ) : (
          // Author or Series Group View
          <div className="space-y-8 animate-in fade-in duration-500">
            {Object.entries(groupedBooks || {}).sort((a, b) => {
                if (viewMode === 'series_group' && a[0] === 'Other') return 1;
                if (viewMode === 'series_group' && b[0] === 'Other') return -1;
                return new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare(a[0], b[0]);
            }).map(([groupName, groupData]: [string, any]) => {
              const count = Array.isArray(groupData) 
                ? groupData.length 
                : Object.values(groupData).reduce((acc: number, val: any) => acc + (Array.isArray(val) ? val.length : 0), 0);

              return (
                <GroupSection 
                  key={groupName} 
                  title={groupName} 
                  count={count}
                >
                  {viewMode === 'author_group' ? (
                     <div className="space-y-6">
                       {Object.entries(groupData).sort((a: any, b: any) => {
                           if (a[0] === 'Other') return 1;
                           if (b[0] === 'Other') return -1;
                           return new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare(a[0], b[0]);
                       }).map(([seriesName, seriesBooks]: [string, any]) => (
                           <GroupSection
                             key={seriesName}
                             title={seriesName}
                             count={(seriesBooks as Book[]).length}
                             variant="sub"
                           >
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                               {(seriesBooks as Book[]).sort((a,b) => new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare(a.title, b.title)).map((book) => (
                                 <BookCard 
                                   key={book.isbn} 
                                   book={book} 
                                   onDelete={deleteBook}
                                   onEdit={openEditModal}
                                   compact
                                 />
                               ))}
                             </div>
                           </GroupSection>
                       ))}
                     </div>
                  ) : (
                    // Series Group View (value is Array of books)
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {(groupData as Book[]).map((book) => (
                        <BookCard 
                          key={book.isbn} 
                          book={book} 
                          onDelete={deleteBook}
                          onEdit={openEditModal}
                          compact
                        />
                      ))}
                    </div>
                  )}
                </GroupSection>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button for Manual Add */}
      <button
        onClick={() => setIsManualAddModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40 group"
        title="Add Book (Ctrl+Q)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Add Book (Ctrl+Q)
        </span>
      </button>

      {isScannerOpen && (
        <ScannerModal
          onScan={handleScan}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
      
      {isEditModalOpen && editingBook && (
        <EditBookModal
          book={editingBook}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingBook(null);
          }}
          onUpdate={handleUpdateBook}
        />
      )}

      {isManualAddModalOpen && (
        <ManualAddModal
          onClose={() => setIsManualAddModalOpen(false)}
          onAdd={handleManualAdd}
        />
      )}

      <footer className="py-6 text-center text-[10px] text-gray-400">
        <p>
          Supported by <a href="https://webservice.rakuten.co.jp/" target="_blank" rel="noopener noreferrer" className="hover:underline">Rakuten Developers</a>
        </p>
      </footer>
    </main>
  );
}
