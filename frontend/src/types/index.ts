export interface Book {
  isbn: string;
  title: string;
  authors?: string;
  cover_url?: string;
  status: string;  // wishlist, ordered, purchased_unread, reading, done, paused, unread
  location?: string;
  series_title?: string;
  created_at: string;

  // Wishlist & Reading tracking
  purchased_date?: string;
  reading_start_date?: string;
  reading_end_date?: string;

  // Reading records
  rating?: string;
  notes?: string;

  // Tags
  tags?: string;

  // Lending
  lent_to?: string;
  lent_date?: string;
  due_date?: string;

  // Series and bookshelf
  volume_number?: number;
  is_series_representative?: boolean;

  // Other fields
  publisher?: string;
  published_date?: string;
  description?: string;
}

export type BookStatus = 'wishlist' | 'ordered' | 'purchased_unread' | 'reading' | 'done' | 'paused' | 'unread';
export type SortOption = 'created_desc' | 'created_asc' | 'title_asc' | 'author_asc';
export type ViewMode = 'grid' | 'author_group' | 'series_group' | 'bookshelf' | 'stats';
