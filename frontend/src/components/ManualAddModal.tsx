"use client";

import { useState, useEffect } from 'react';
import { Book } from '@/types';

interface ManualAddModalProps {
  onClose: () => void;
  onAdd: (bookData: Partial<Book>) => Promise<void>;
}

export function ManualAddModal({ onClose, onAdd }: ManualAddModalProps) {
  const [formData, setFormData] = useState<Partial<Book>>({
    isbn: '',
    title: '',
    authors: '',
    publisher: '',
    published_date: '',
    description: '',
    cover_url: '',
    status: 'unread',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Generate a random ISBN-like ID if user doesn't provide one?
  // Or require ISBN. Let's start with empty.

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const saveChanges = async () => {
    if (!formData.isbn) {
      // Auto-generate a temporary ID if ISBN is missing
      // Format: manual-{timestamp}
      formData.isbn = `manual-${Date.now()}`;
    }
    if (!formData.title) {
      alert("Title is required.");
      return;
    }

    setIsSaving(true);
    try {
      await onAdd(formData);
      onClose();
    } catch (error) {
      console.error("Failed to add book", error);
      alert("Failed to add book.");
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
        className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-2xl">➕</span> Add New Book
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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ISBN (Optional)</label>
              <input
                type="text"
                name="isbn"
                value={formData.isbn || ''}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Leave empty to auto-generate"
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title <span className="text-red-500">*</span></label>
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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Authors</label>
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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Publisher</label>
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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Published Date</label>
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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cover URL</label>
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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select
                name="status"
                value={formData.status || 'unread'}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="unread">Unread</option>
                <option value="reading">Reading</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
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
            Cancel
          </button>
          <button
            onClick={saveChanges}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <span>Add Book</span>
                <span className="text-xs opacity-70 bg-black/20 px-1.5 py-0.5 rounded ml-1">Ctrl+S</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
