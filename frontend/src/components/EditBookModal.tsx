"use client";

import { useState, useEffect } from 'react';
import { Book } from '@/types';
import { RatingStars } from './RatingStars';
import { TagInput } from './TagInput';
import { useLanguage } from '@/contexts/LanguageContext';

interface EditBookModalProps {
  book: Book;
  onUpdate: (isbn: string, data: Partial<Book>) => Promise<void>;
  onClose: () => void;
  isOpen: boolean; // Added isOpen to match usage in page.tsx
}

export function EditBookModal({ book, onUpdate, onClose }: EditBookModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Partial<Book>>({
    title: '',
    authors: '',
    series_title: '',
    publisher: '',
    status: 'unread',
    description: '',
    cover_url: '',
    location: '',
    purchased_date: '',
    reading_start_date: '',
    reading_end_date: '',
    rating: '',
    notes: '',
    tags: '',
    lent_to: '',
    lent_date: '',
    due_date: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || '',
        authors: book.authors || '',
        series_title: book.series_title || '',
        publisher: book.publisher || '',
        status: book.status || 'unread',
        description: book.description || '',
        cover_url: book.cover_url || '',
        location: book.location || '',
        purchased_date: book.purchased_date || '',
        reading_start_date: book.reading_start_date || '',
        reading_end_date: book.reading_end_date || '',
        rating: book.rating || '',
        notes: book.notes || '',
        tags: book.tags || '',
        lent_to: book.lent_to || '',
        lent_date: book.lent_date || '',
        due_date: book.due_date || '',
      });
    }
  }, [book]);

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      // Convert empty date strings to null for API
      const dataToSend = { ...formData };
      const dateFields = ['purchased_date', 'reading_start_date', 'reading_end_date', 'lent_date', 'due_date'];
      dateFields.forEach(field => {
        if (dataToSend[field as keyof typeof dataToSend] === '') {
          (dataToSend as any)[field] = null;
        }
      });
      
      await onUpdate(book.isbn, dataToSend);
      onClose();
    } catch (error) {
      console.error("Failed to save", error);
      alert(t.failedToSave);
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
  }, [formData, book.isbn]); // Re-bind when data changes

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Ctrl + D for inserting a period
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      const target = e.currentTarget;
      const { selectionStart, selectionEnd, value, name } = target;
      
      if (selectionStart !== null && selectionEnd !== null) {
        const newValue = value.substring(0, selectionStart) + '.' + value.substring(selectionEnd);
        
        // Update state
        setFormData(prev => ({ ...prev, [name]: newValue }));
        
        // Restore cursor position
        requestAnimationFrame(() => {
          target.selectionStart = target.selectionEnd = selectionStart + 1;
        });
      }
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-indigo-600 text-white flex justify-between items-center shrink-0">
          <h2 className="font-semibold flex items-center gap-2">
            {t.editBookDetails}
          </h2>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.title}</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.authors}</label>
            <input
              type="text"
              name="authors"
              value={formData.authors}
              onChange={(e) => setFormData({...formData, authors: e.target.value})}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.seriesTitle}</label>
            <input
              type="text"
              name="series_title"
              value={formData.series_title}
              onChange={(e) => setFormData({...formData, series_title: e.target.value})}
              onKeyDown={handleKeyDown}
              placeholder={t.seriesTitlePlaceholder}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.publisher}</label>
                <input
                type="text"
                name="publisher"
                value={formData.publisher}
                onChange={(e) => setFormData({...formData, publisher: e.target.value})}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.status}</label>
                <select
                name="status"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
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
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.purchasedDate}</label>
                <input
                type="date"
                name="purchased_date"
                value={formData.purchased_date ? new Date(formData.purchased_date).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({...formData, purchased_date: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.startReading}</label>
                <input
                type="date"
                name="reading_start_date"
                value={formData.reading_start_date ? new Date(formData.reading_start_date).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({...formData, reading_start_date: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.finishedReading}</label>
                <input
                type="date"
                name="reading_end_date"
                value={formData.reading_end_date ? new Date(formData.reading_end_date).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({...formData, reading_end_date: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.location}</label>
            <input
              type="text"
              name="location"
              value={formData.location || ''}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              onKeyDown={handleKeyDown}
              placeholder={t.locationPlaceholder}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.rating}</label>
            <RatingStars
              rating={formData.rating || ''}
              onChange={(rating) => setFormData({...formData, rating})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.tags}</label>
            <TagInput
              tags={formData.tags || ''}
              onChange={(tags) => setFormData({...formData, tags})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.notes}</label>
            <textarea
              name="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              onKeyDown={handleKeyDown}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              placeholder={t.notesPlaceholder}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.lentTo}</label>
                <input
                type="text"
                name="lent_to"
                value={formData.lent_to || ''}
                onChange={(e) => setFormData({...formData, lent_to: e.target.value})}
                onKeyDown={handleKeyDown}
                placeholder={t.friendNamePlaceholder}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.lentDate}</label>
                <input
                type="date"
                name="lent_date"
                value={formData.lent_date ? new Date(formData.lent_date).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({...formData, lent_date: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.dueDate}</label>
                <input
                type="date"
                name="due_date"
                value={formData.due_date ? new Date(formData.due_date).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.description}</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              onKeyDown={handleKeyDown}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.coverUrl}</label>
            <input
              type="text"
              name="cover_url"
              value={formData.cover_url || ''}
              onChange={(e) => setFormData({...formData, cover_url: e.target.value})}
              onKeyDown={handleKeyDown}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">{t.coverUrlHint}</p>
          </div>
        </form>

        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 shrink-0">
            <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
                {t.cancel}
            </button>
            <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
                {isSaving ? t.saving : t.save}
            </button>
        </div>
      </div>
    </div>
  );
}
