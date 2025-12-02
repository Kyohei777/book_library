export interface Book {
  isbn: string;
  title: string;
  authors?: string;
  cover_url?: string;
  status: string;
  location?: string;
  series_title?: string;
  created_at: string;
}

export type SortOption = 'created_desc' | 'created_asc' | 'title_asc' | 'author_asc';
export type ViewMode = 'grid' | 'author_group' | 'series_group' | 'bookshelf';
