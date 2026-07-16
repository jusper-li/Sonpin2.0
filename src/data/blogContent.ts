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

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    name: '公告',
    slug: 'bulletin',
    description: '本站最新通知與重要公告。',
    sort_order: 1,
    is_active: true,
  },
  {
    name: '報章雜誌',
    slug: '報章雜誌',
    description: '新品上市、媒體報導與品牌最新消息。',
    sort_order: 2,
    is_active: true,
  },
  {
    name: '影音報導',
    slug: '影音報導',
    description: '品牌故事、展會紀錄與影音報導。',
    sort_order: 3,
    is_active: true,
  },
];

export const BLOG_ARTICLES: BlogArticle[] = [];
