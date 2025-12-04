"use client";

import { useState, useEffect } from 'react';
import { Book } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface ManualAddModalProps {
  onClose: () => void;
  onAdd: (bookData: Partial<Book>) => Promise<void>;
}

export function ManualAddModal({ onClose, onAdd }: ManualAddModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Partial<Book>>({
    isbn: '',
    title: '',
    authors: '',
    publisher: '',
    published_date: '',
    description: '',
    cover_url: '',
    status: 'unread',
    series_title: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [existingSeries, setExistingSeries] = useState<string[]>([]);
  const [showApiComparison, setShowApiComparison] = useState(false);
  const [apiComparison, setApiComparison] = useState<any>(null);

  // Fetch existing series on mount
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const response = await fetch('/api/series');
        if (response.ok) {
          const data = await response.json();
          setExistingSeries(data.series || []);
        }
      } catch (error) {
        console.error('Failed to fetch series:', error);
      }
    };
    fetchSeries();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'isbn') {
      setSearchError(null);
    }
  };

  const searchByIsbn = async () => {
    const isbn = formData.isbn?.trim();
    if (!isbn || isbn.length < 10) {
      setSearchError(t.isbnTooShort || 'ISBNは10桁以上必要です');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(`/api/lookup/isbn/${isbn}`);
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          title: data.title || prev.title,
          authors: data.authors || prev.authors,
          publisher: data.publisher || prev.publisher,
          published_date: data.published_date || prev.published_date,
          description: data.description || prev.description,
          cover_url: data.cover_url || prev.cover_url,
          series_title: data.series_title || prev.series_title,
          volume_number: data.volume_number || prev.volume_number,
        }));
      } else {
        setSearchError(t.bookNotFound || '本が見つかりませんでした');
      }

      // Also fetch API comparison if in dev mode
      if (showApiComparison) {
        const compareResponse = await fetch(`/api/test/compare-apis/${isbn}`);
        if (compareResponse.ok) {
          const compareData = await compareResponse.json();
          setApiComparison(compareData);
        }
      }
    } catch (error) {
      console.error('ISBN lookup error:', error);
      setSearchError(t.searchError || '検索中にエラーが発生しました');
    } finally {
      setIsSearching(false);
    }
  };

  const saveChanges = async () => {
    if (!formData.isbn) {
      formData.isbn = `manual-${Date.now()}`;
    }
    if (!formData.title) {
      alert(t.titleRequired);
      return;
    }

    setIsSaving(true);
    try {
      await onAdd(formData);
      onClose();
    } catch (error) {
      console.error("Failed to add book", error);
      alert(t.failedToAdd);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveChanges();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveChanges();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      const target = e.currentTarget;
      const { selectionStart, selectionEnd, value, name } = target;
      
      if (selectionStart !== null && selectionEnd !== null) {
        const newValue = value.substring(0, selectionStart) + '.' + value.substring(selectionEnd);
        setFormData(prev => ({ ...prev, [name]: newValue }));
        requestAnimationFrame(() => {
          target.selectionStart = target.selectionEnd = selectionStart + 1;
        });
      }
    }
    // Enter key in ISBN field triggers search
    if (e.key === 'Enter' && e.currentTarget.name === 'isbn') {
      e.preventDefault();
      searchByIsbn();
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {t.addManually}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.isbnOptional}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="isbn"
                  value={formData.isbn || ''}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder={t.isbnAutoGenerate}
                  className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={searchByIsbn}
                  disabled={isSearching}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSearching ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  )}
                </button>
              </div>
              {searchError && (
                <p className="text-sm text-red-500">{searchError}</p>
              )}
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showApiComparison}
                  onChange={(e) => setShowApiComparison(e.target.checked)}
                  className="rounded"
                />
                🔧 開発者モード: API比較を表示
              </label>
            </div>

            {/* API Comparison Panel */}
            {showApiComparison && apiComparison && (
              <div className="col-span-full bg-gray-100 dark:bg-gray-900 p-4 rounded-xl space-y-3 text-xs">
                <h3 className="font-bold text-sm">📊 API比較結果</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {['openbd', 'rakuten', 'google'].map((api) => (
                    <div key={api} className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                      <h4 className="font-bold mb-2 text-indigo-600 dark:text-indigo-400">
                        {api === 'openbd' ? '📚 OpenBD' : api === 'rakuten' ? '🛒 楽天' : '🔍 Google'}
                      </h4>
                      {apiComparison[api] ? (
                        <div className="space-y-1">
                          <p><span className="text-gray-500">タイトル:</span> {apiComparison[api].title || '-'}</p>
                          <p><span className="text-gray-500">著者:</span> {apiComparison[api].authors || '-'}</p>
                          <p><span className="text-gray-500">出版社:</span> {apiComparison[api].publisher || '-'}</p>
                          <p><span className="text-gray-500">シリーズ:</span> {apiComparison[api].series || '-'}</p>
                          <p><span className="text-gray-500">画像:</span> {apiComparison[api].cover_url ? '✅' : '❌'}</p>
                        </div>
                      ) : (
                        <p className="text-gray-400">データなし</p>
                      )}
                    </div>
                  ))}
                </div>
                {apiComparison.merged && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg mt-2">
                    <h4 className="font-bold mb-2 text-indigo-700 dark:text-indigo-300">✨ マージ結果（実際に使用されるデータ）</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <p><span className="text-gray-500">タイトル:</span> {apiComparison.merged.title}</p>
                      <p><span className="text-gray-500">シリーズ:</span> {apiComparison.merged.series_title}</p>
                      <p><span className="text-gray-500">巻数:</span> {apiComparison.merged.volume_number ?? '-'}</p>
                      <p><span className="text-gray-500">画像:</span> {apiComparison.merged.cover_url ? '✅' : '❌'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.title} <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                required
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.authors}</label>
              <input
                type="text"
                name="authors"
                value={formData.authors || ''}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.publisher}</label>
              <input
                type="text"
                name="publisher"
                value={formData.publisher || ''}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.publishedDate}</label>
              <input
                type="text"
                name="published_date"
                value={formData.published_date || ''}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.coverUrl}</label>
              <input
                type="text"
                name="cover_url"
                value={formData.cover_url || ''}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

             <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.status}</label>
              <select
                name="status"
                value={formData.status || 'unread'}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="wishlist">{t.statusWishlist}</option>
                <option value="ordered">{t.statusOrdered}</option>
                <option value="purchased_unread">{t.statusPurchasedUnread}</option>
                <option value="unread">{t.statusUnread}</option>
                <option value="reading">{t.statusReading}</option>
                <option value="paused">{t.statusPaused}</option>
                <option value="done">{t.statusDone}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.seriesTitle}</label>
              <input
                type="text"
                name="series_title"
                value={formData.series_title || ''}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                list="series-list"
                placeholder={t.seriesTitlePlaceholder}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
              <datalist id="series-list">
                {existingSeries.map((series) => (
                  <option key={series} value={series} />
                ))}
              </datalist>
              {existingSeries.length > 0 && (
                <p className="text-xs text-gray-500">既存シリーズ: {existingSeries.length}件</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.description}</label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              rows={4}
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
            />
          </div>
        </form>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-all"
          >
            {t.cancel}
          </button>
          <button
            onClick={saveChanges}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t.adding}
              </>
            ) : (
              <>
                <span>{t.addBook}</span>
                <span className="text-xs opacity-70 bg-black/20 px-1.5 py-0.5 rounded ml-1">Ctrl+S</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
