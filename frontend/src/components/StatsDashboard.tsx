"use client";
import { Book } from '@/types';
import { useMemo } from 'react';

interface StatsDashboardProps {
  books: Book[];
}

export function StatsDashboard({ books }: StatsDashboardProps) {
  const stats = useMemo(() => {
    const total = books.length;
    const read = books.filter(b => b.status === 'done').length;
    const reading = books.filter(b => b.status === 'reading').length;
    const wishlist = books.filter(b => b.status === 'wishlist').length;
    const thisMonth = books.filter(b => {
      const created = new Date(b.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;

    const authorCounts: Record<string, number> = {};
    books.forEach(b => {
      if (b.authors) {
        authorCounts[b.authors] = (authorCounts[b.authors] || 0) + 1;
      }
    });
    const topAuthors = Object.entries(authorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return { total, read, reading, wishlist, thisMonth, topAuthors };
  }, [books]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
      <div className="bg-blue-500 text-white p-4 rounded-xl">
        <div className="text-3xl font-bold">{stats.total}</div>
        <div className="text-sm opacity-90">Total Books</div>
      </div>
      <div className="bg-green-500 text-white p-4 rounded-xl">
        <div className="text-3xl font-bold">{stats.read}</div>
        <div className="text-sm opacity-90">Books Read</div>
      </div>
      <div className="bg-yellow-500 text-white p-4 rounded-xl">
        <div className="text-3xl font-bold">{stats.reading}</div>
        <div className="text-sm opacity-90">Currently Reading</div>
      </div>
      <div className="bg-purple-500 text-white p-4 rounded-xl">
        <div className="text-3xl font-bold">{stats.thisMonth}</div>
        <div className="text-sm opacity-90">Added This Month</div>
      </div>
    </div>
  );
}
