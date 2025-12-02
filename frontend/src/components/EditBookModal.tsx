"use client";

import { useState, useEffect } from 'react';
import { Book } from '@/types';

interface EditBookModalProps {
  book: Book;
  onUpdate: (isbn: string, data: Partial<Book>) => Promise<void>;
  onClose: () => void;
  isOpen: boolean; // Added isOpen to match usage in page.tsx
}

export function EditBookModal({ book, onUpdate, onClose }: EditBookModalProps) {
  const [formData, setFormData] = useState<Partial<Book>>({
    title: '',
    authors: '',
    series_title: '',
    publisher: '',
    status: 'unread',
    description: '',
    cover_url: '',
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
      });
    }
  }, [book]);

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      await onUpdate(book.isbn, formData);
      onClose();
    } catch (error) {
      console.error("Failed to save", error);
      alert("Failed to save changes.");
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
            ✏️ Edit Book Details
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Authors</label>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Series Title</label>
            <input
              type="text"
              name="series_title"
              value={formData.series_title}
              onChange={(e) => setFormData({...formData, series_title: e.target.value})}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Harry Potter"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Publisher</label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                name="status"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                    <option value="unread">Unread</option>
                    <option value="reading">Reading</option>
                    <option value="done">Done</option>
                </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover URL</label>
            <input
              type="text"
              name="cover_url"
              value={formData.cover_url || ''}
              onChange={(e) => setFormData({...formData, cover_url: e.target.value})}
              onKeyDown={handleKeyDown}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Paste an image URL from Amazon or other sources.</p>
          </div>
        </form>

        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 shrink-0">
            <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
                Cancel
            </button>
            <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
                {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
      </div>
    </div>
  );
}
