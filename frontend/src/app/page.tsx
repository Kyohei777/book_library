"use client";

import { useState, useRef, useEffect } from 'react';
import { useLibrary } from '@/hooks/useLibrary';
import { useLanguage } from '@/contexts/LanguageContext';
import { BookCard } from '@/components/BookCard';
import { EditBookModal } from '@/components/EditBookModal';
import { ScannerModal } from '@/components/ScannerModal';
import { ManualAddModal } from '@/components/ManualAddModal';
import { BookshelfView } from '@/components/BookshelfView';
import { GroupSection } from '@/components/GroupSection';
import { TitleSearchModal } from '@/components/TitleSearchModal';
import { SeriesBulkModal } from '@/components/SeriesBulkModal';
import { StatsDashboard } from '@/components/StatsDashboard';
import { BottomNav } from '@/components/BottomNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ScanResultModal } from '@/components/ScanResultModal';
import { Book } from '@/types';

export default function Home() {
  const { language, setLanguage, t } = useLanguage();

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
  const [isTitleSearchOpen, setIsTitleSearchOpen] = useState(false);
  const [isSeriesBulkOpen, setIsSeriesBulkOpen] = useState(false);
  const [seriesBulkBook, setSeriesBulkBook] = useState<{ isbn: string; title: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pendingScanIsbn, setPendingScanIsbn] = useState<string | null>(null);
  const isProcessingScanRef = useRef(false);

  // Filter books by status
  const filteredBooks = statusFilter
    ? books.filter(book => book.status === statusFilter)
    : books;

  const handleScan = async (isbn: string) => {
    if (isProcessingScanRef.current) return;
    isProcessingScanRef.current = true;
    setIsScannerOpen(false); // Close immediately

    const exists = books.some(b => b.isbn === isbn);
    if (exists) {
      // Already exists logic if needed
      isProcessingScanRef.current = false;
      return;
    }

    // If dev mode is on, show comparison modal first
    if (devMode) {
      setPendingScanIsbn(isbn);
      isProcessingScanRef.current = false;
      return;
    }

    // Normal flow: fetch merged data first, then register with the same logic as dev mode
    setIsScanning(true);
    try {
      const response = await fetch(`/api/test/compare-apis/${isbn}`);
      if (response.ok) {
        const data = await response.json();
        if (data.merged) {
          // If series was not matched, show edit modal for user to manually set series
          if (!data.merged.series_matched) {
            // Show edit modal for first-time series registration
            setPendingScanIsbn(isbn);
            setIsScanning(false);
            isProcessingScanRef.current = false;
            return;
          }
          
          // Series matched - register directly
          await addBook({
            isbn: isbn,
            title: data.merged.title,
            authors: data.merged.authors,
            series_title: data.merged.series_title,
            volume_number: data.merged.volume_number ?? undefined,
            cover_url: data.merged.cover_url,
            publisher: data.merged.publisher,
          });
        } else {
          // Fallback if merged data is not available
          await registerBook(isbn);
        }
      } else {
        // Fallback on error
        await registerBook(isbn);
      }
    } catch (error) {
      console.error('Failed to fetch merged data:', error);
      await registerBook(isbn);
    }
    
    setTimeout(() => {
      setIsScanning(false);
      isProcessingScanRef.current = false;
    }, 2000);
  };

  const confirmScanResult = async (editedData: {
    title: string;
    authors: string;
    series_title: string;
    volume_number: number | null;
    cover_url: string;
    publisher: string;
  }) => {
    if (!pendingScanIsbn) return;
    setIsScanning(true);
    
    // Use edited data to add book
    await addBook({
      isbn: pendingScanIsbn,
      title: editedData.title,
      authors: editedData.authors,
      series_title: editedData.series_title,
      volume_number: editedData.volume_number ?? undefined,
      cover_url: editedData.cover_url,
      publisher: editedData.publisher,
    });
    
    setPendingScanIsbn(null);
    setTimeout(() => {
      setIsScanning(false);
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

  const handleTitleSearchSelect = async (bookData: any) => {
    setIsTitleSearchOpen(false);
    if (bookData.isbn) {
      await registerBook(bookData.isbn);
    } else {
      // No ISBN, add manually with available data
      await addBook({
        isbn: `MANUAL-${Date.now()}`,
        title: bookData.title,
        authors: bookData.authors,
        publisher: bookData.publisher,
        cover_url: bookData.cover_url,
        description: bookData.description,
        status: 'wishlist'
      });
    }
  };

  const handleSeriesBulkRegister = async (isbns: string[]) => {
    for (const isbn of isbns) {
      await registerBook(isbn);
    }
    setIsSeriesBulkOpen(false);
    setSeriesBulkBook(null);
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
          <div className="flex flex-col gap-4">
            {/* Top Row: Title & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
              <h1
                className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 cursor-pointer shrink-0"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                {t.myLibrary}
              </h1>

              {/* Right Side Actions: Lang, Theme, Dev, Filter, Scan, Add */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
                 {/* Language Toggle - Circular for uniformity */}
                 <button
                  onClick={() => setLanguage(language === 'ja' ? 'en' : 'ja')}
                  className="flex items-center justify-center w-9 h-9 text-xs font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors border-none"
                  title="Switch Language / 言語切り替え"
                >
                  {language === 'ja' ? 'EN' : 'JA'}
                </button>

                <ThemeToggle />

                {/* Dev Mode Toggle */}
                <label 
                  className={`flex items-center justify-center w-9 h-9 rounded-full cursor-pointer transition-all text-xs ${
                    devMode 
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400 shadow-sm ring-1 ring-amber-200 dark:ring-amber-800' 
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 grayscale'
                  }`}
                  title="Dev Mode / 開発者モード"
                >
                  <input
                    type="checkbox"
                    checked={devMode}
                    onChange={(e) => setDevMode(e.target.checked)}
                    className="hidden"
                  />
                  <span>🔧</span>
                </label>

                {/* Filter Button */}
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
                    isFilterOpen || statusFilter 
                      ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  title={t.filter || "Filter"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                  </svg>
                </button>
                
                {/* Scan Button */}
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="flex items-center justify-center w-9 h-9 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-lg transition-all active:scale-95"
                  title={t.scanBook || "Scan Book"}
                >
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75zM16.5 19.5h.75v.75h-.75v-.75zM19.5 16.5h.75v.75h-.75v-.75z" />
                  </svg>
                </button>

                {/* Add Button */}
                <button
                  onClick={() => setIsManualAddModalOpen(true)}
                  className="flex items-center justify-center w-9 h-9 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-lg transition-all active:scale-95"
                  title={t.addBookShortcut}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Search Bar & Desktop Nav Row */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative group flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {t.navGrid}
                </button>
                <button
                  onClick={() => setViewMode('bookshelf')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    viewMode === 'bookshelf'
                      ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {t.navShelf}
                </button>
                <button
                  onClick={() => setViewMode('series_group')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    viewMode === 'series_group'
                      ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {t.navSeries}
                </button>
                <button
                  onClick={() => setViewMode('author_group')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    viewMode === 'author_group'
                      ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {t.author}
                </button>
                <button
                  onClick={() => setViewMode('stats')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    viewMode === 'stats'
                      ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {t.navStats}
                </button>
              </div>
            </div>

            {/* Collapsible Filter & Sort Section */}
            {(isFilterOpen || statusFilter) && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                  {/* Sort Select */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">{t.sort || "Sort"}:</span>
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as import('@/types').SortOption)}
                      className="block w-full md:w-auto pl-2 pr-6 py-1.5 text-xs border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-lg bg-white dark:bg-gray-900"
                    >
                      <option value="created_desc">{t.newest}</option>
                      <option value="created_asc">{t.oldest}</option>
                      <option value="title_asc">{t.titleAZ}</option>
                      <option value="author_asc">{t.authorAZ}</option>
                    </select>
                  </div>

                   {/* Status Filter Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <button
                      onClick={() => setStatusFilter(null)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
                        statusFilter === null ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {t.allBooks}
                    </button>
                    <button
                      onClick={() => setStatusFilter('wishlist')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
                        statusFilter === 'wishlist' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {t.wishlist}
                    </button>
                    <button
                      onClick={() => setStatusFilter('ordered')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
                        statusFilter === 'ordered' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {t.ordered}
                    </button>
                    <button
                      onClick={() => setStatusFilter('purchased_unread')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
                        statusFilter === 'purchased_unread' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {t.toRead}
                    </button>
                    <button
                      onClick={() => setStatusFilter('reading')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
                        statusFilter === 'reading' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {t.reading}
                    </button>
                    <button
                      onClick={() => setStatusFilter('done')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
                        statusFilter === 'done' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {t.done}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages - positioned at top center to avoid overlap with + button */}
        {message && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        {loading && filteredBooks.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-dashed border-gray-300 dark:border-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{t.noBooksFound}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t.getStartedMessage}</p>
            <div className="mt-6">
              <button
                onClick={() => setIsScannerOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {t.scanBook}
              </button>
            </div>
          </div>
        ) : viewMode === 'stats' ? (
          <div className="animate-in fade-in duration-500">
            <StatsDashboard books={books} />
          </div>
        ) : viewMode === 'bookshelf' ? (
          <div className="animate-in fade-in duration-500">
            <BookshelfView
              books={filteredBooks}
              onBookClick={openEditModal}
            />
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 animate-in fade-in duration-500">
            {filteredBooks.map((book) => (
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
            }).map(([groupName, groupData]) => {
              const count = Array.isArray(groupData) 
                ? groupData.length 
                : Object.values(groupData as Record<string, Book[]>).reduce((acc, val) => acc + val.length, 0);

              return (
                <GroupSection 
                  key={groupName} 
                  title={groupName} 
                  count={count}
                >
                  {viewMode === 'author_group' ? (
                     <div className="space-y-6">
                       {Object.entries(groupData as Record<string, Book[]>).sort((a, b) => {
                           if (a[0] === 'Other') return 1;
                           if (b[0] === 'Other') return -1;
                           return new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare(a[0], b[0]);
                       }).map(([seriesName, seriesBooks]) => (
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
      {/* Floating Action Button Removed (Moved to Header) */}

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

      {isTitleSearchOpen && (
        <TitleSearchModal
          onClose={() => setIsTitleSearchOpen(false)}
          onSelectBook={handleTitleSearchSelect}
        />
      )}

      {isSeriesBulkOpen && seriesBulkBook && (
        <SeriesBulkModal
          isbn={seriesBulkBook.isbn}
          title={seriesBulkBook.title}
          onClose={() => {
            setIsSeriesBulkOpen(false);
            setSeriesBulkBook(null);
          }}
          onRegisterBooks={handleSeriesBulkRegister}
        />
      )}

      {pendingScanIsbn && (
        <ScanResultModal
          isbn={pendingScanIsbn}
          onConfirm={confirmScanResult}
          onCancel={() => setPendingScanIsbn(null)}
        />
      )}

      <BottomNav
        currentView={viewMode}
        onViewChange={(view) => setViewMode(view)}
        onScanClick={() => setIsScannerOpen(true)}
      />

      <footer className="py-6 text-center text-[10px] text-gray-400">
        <p>
          {t.supportedBy} <a href="https://webservice.rakuten.co.jp/" target="_blank" rel="noopener noreferrer" className="hover:underline">Rakuten Developers</a>
        </p>
      </footer>
    </main>
  );
}
