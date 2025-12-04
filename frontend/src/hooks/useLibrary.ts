import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Book, SortOption, ViewMode } from '@/types';

export const useLibrary = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(""); // デバウンス用
  const [sortOption, setSortOption] = useState<SortOption>('created_desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // グループ展開用
  const [expandedAuthors, setExpandedAuthors] = useState<Set<string>>(new Set());

  // 検索用正規化関数：全角→半角、スペース統一、小文字化
  const normalizeForSearch = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)) // 全角英数→半角
      .replace(/　/g, ' ') // 全角スペース→半角スペース
      .replace(/\s+/g, ' ') // 連続スペースを1つに
      .trim();
  };

  // デバウンス処理: 入力が止まって300ms後に検索を実行
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 相対パス '/api' を使用することで、ブラウザの現在のポート（3002など）を使用させる
  // Next.jsのRewrite機能により、バックエンドへ転送される
  const API_BASE_URL = '/api';

  const fetchBooks = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/books`);
      setBooks(res.data);
    } catch (error) {
      console.error("Failed to fetch books", error);
      if (axios.isAxiosError(error)) {
        console.error("Error details:", {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers
        });
        setError(`Failed to load books: ${error.message} (${error.response?.status || 'No Status'})`);
      } else {
        setError("Failed to load books: Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const registerBook = async (isbn: string) => {
    setLoading(true);
    setMessage(`Scanning ISBN: ${isbn}...`);
    try {
      await axios.post(`${API_BASE_URL}/books`, { isbn });
      setMessage(`Registered: ${isbn}`);
      await fetchBooks();
      return true; // 成功
    } catch (error: any) {
      if (error.response && error.response.status === 400) {
        setMessage("Already registered.");
      } else {
        setMessage("Failed to register.");
      }
      return false; // 失敗
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const addBook = async (bookData: Partial<Book>) => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/books`, bookData);
      setMessage(`Added: ${bookData.title}`);
      await fetchBooks();
      return true;
    } catch (error: any) {
      console.error("Failed to add book", error);
      if (error.response && error.response.status === 400) {
        setMessage("Already registered.");
      } else {
        setMessage("Failed to add book.");
      }
      throw error;
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const deleteBook = async (isbn: string) => {
    if(!confirm("Are you sure you want to delete this book?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/books/${isbn}`);
      fetchBooks();
    } catch (error) {
      console.error("Failed to delete", error);
    }
  };

  const updateBook = async (isbn: string, data: Partial<Book>) => {
    try {
      await axios.put(`${API_BASE_URL}/books/${isbn}`, data);
      await fetchBooks();
      setMessage(`Updated: ${data.title || isbn}`);
    } catch (error) {
      console.error("Failed to update", error);
      throw error;
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const toggleAuthor = (author: string) => {
    const newSet = new Set(expandedAuthors);
    if (newSet.has(author)) newSet.delete(author);
    else newSet.add(author);
    setExpandedAuthors(newSet);
  };

  // フィルタリングとソート
  const processedBooks = useMemo(() => {
    let result = [...books];
    if (debouncedSearch) {
      const normalizedTerm = normalizeForSearch(debouncedSearch);
      result = result.filter(book =>
        normalizeForSearch(book.title || '').includes(normalizedTerm) ||
        normalizeForSearch(book.authors || '').includes(normalizedTerm) ||
        normalizeForSearch(book.series_title || '').includes(normalizedTerm) ||
        normalizeForSearch(book.publisher || '').includes(normalizedTerm)
      );
    }
    result.sort((a, b) => {
      switch (sortOption) {
        case 'created_desc': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created_asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title_asc': 
          return new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare(a.title, b.title);
        case 'author_asc': return (a.authors || '').localeCompare(b.authors || '');
        default: return 0;
      }
    });
    return result;
  }, [books, debouncedSearch, sortOption]);

  // シリーズ名抽出ロジック
  const deriveSeriesTitle = (book: Book): string => {
    // ユーザー要望: book.series_title は出版社名が含まれるため使用しない
    // タイトルの「.」までをシリーズ名とする規則を優先
    const dotIndex = book.title.indexOf('.');
    if (dotIndex !== -1) {
      return book.title.substring(0, dotIndex).trim();
    }
    // 「.」がない場合はシリーズものとして認識できないため "Other" (または単独)
    return "Other";
  };

  const groupedBooks = useMemo(() => {
    if (viewMode === 'grid') return null;

    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

    if (viewMode === 'series_group') {
      const groups: Record<string, Book[]> = {};
      processedBooks.forEach(book => {
        const series = deriveSeriesTitle(book);
        if (!groups[series]) groups[series] = [];
        groups[series].push(book);
      });
      // シリーズ内のソート（巻数順などを想定してタイトル順）
      Object.keys(groups).forEach(key => {
        groups[key].sort((a, b) => collator.compare(a.title, b.title));
      });
      return groups;
    }

    // author_group
    const groups: Record<string, Record<string, Book[]>> = {};
    processedBooks.forEach(book => {
      const author = book.authors || "Unknown Author";
      const series = deriveSeriesTitle(book);
      
      if (!groups[author]) groups[author] = {};
      if (!groups[author][series]) groups[author][series] = [];
      groups[author][series].push(book);
    });
    return groups;
  }, [processedBooks, viewMode]);

  return {
    books: processedBooks,
    groupedBooks: groupedBooks as any, // 型定義を柔軟にするため一時的にany (本来は Union Type 推奨)
    loading,
    message,
    error,
    searchTerm,
    setSearchTerm,
    sortOption,
    setSortOption,
    viewMode,
    setViewMode,
    expandedAuthors,
    toggleAuthor,
    fetchBooks,
    registerBook,
    addBook,
    deleteBook,
    updateBook
  };
};
