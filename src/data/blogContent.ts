export interface BlogCategory {
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  source_url?: string;
}

export interface BlogArticle {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  status: 'draft' | 'published';
  published_at: string;
  category_slug: string;
  category_name: string;
  source_url: string;
  sort_order: number;
  views: number;
}

export const BLOG_CATEGORIES: BlogCategory[] = [];

export const BLOG_ARTICLES: BlogArticle[] = [];
