import { isMissingSupabaseTableError, isSupabaseNetworkError, supabase } from './supabase';
import { resolveSonpinProductImages } from './productImages';

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number | null;
  is_active: boolean;
}

export interface CatalogProduct {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  summary: string;
  content: string;
  price: number;
  sale_price: number | null;
  member_price: number | null;
  stock: number;
  sku: string;
  images: string[];
  specifications: Array<{ name: string; value?: string; options?: string[] }>;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  og_image: string | null;
  og_title: string | null;
  og_description: string | null;
  published_at: string | null;
  unpublished_at: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_hidden: boolean;
  created_at?: string;
  updated_at?: string;
  categories?: { id: string; name: string; slug: string } | null;
  category_slug: string;
  category_name: string;
}

const PRODUCT_ORDER_SETTING_KEY = 'product_order';

const normalizeImages = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];

const parseProductOrder = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  if (value && typeof value === 'object') {
    const maybe = value as { slugs?: unknown; ids?: unknown };
    if (Array.isArray(maybe.slugs)) return parseProductOrder(maybe.slugs);
    if (Array.isArray(maybe.ids)) return parseProductOrder(maybe.ids);
  }
  return [];
};

const applyProductOrder = async (products: CatalogProduct[]) => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', PRODUCT_ORDER_SETTING_KEY)
      .maybeSingle();

    if (error) {
      if (isMissingSupabaseTableError(error) || isSupabaseNetworkError(error)) {
        return products;
      }
      throw error;
    }

    const order = parseProductOrder(data?.setting_value);
    if (!order.length) return products;

    const orderIndex = new Map(order.map((slug, index) => [slug, index]));
    return [...products].sort((a, b) => {
      const aIndex = orderIndex.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = orderIndex.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  } catch {
    return products;
  }
};

export const loadCatalogCategories = async (): Promise<CatalogCategory[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, sort_order, is_active')
    .order('sort_order', { ascending: true })
    .order('slug', { ascending: true });

  if (error) {
    if (isMissingSupabaseTableError(error) || isSupabaseNetworkError(error)) {
      return [];
    }
    throw error;
  }

  return ((data || []) as CatalogCategory[]).filter((category) => category.is_active !== false);
};

export const loadCatalogProducts = async (): Promise<CatalogProduct[]> => {
  const { data, error } = await supabase
    .from('products')
    .select(
      'id, category_id, name, slug, description, summary, content, price, sale_price, stock, sku, images, is_active, is_featured, created_at, updated_at, member_price, specifications, seo_title, seo_description, seo_keywords, og_image, og_title, og_description, published_at, unpublished_at, is_hidden, categories(id, name, slug)',
    )
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingSupabaseTableError(error) || isSupabaseNetworkError(error)) {
      return [];
    }
    throw error;
  }

  const loaded = ((data || []) as Array<{
    id: string;
    category_id: string;
    name: string;
    slug: string;
    description?: string | null;
    summary?: string | null;
    content?: string | null;
    price: number | string;
    sale_price: number | string | null;
    stock?: number | null;
    sku?: string | null;
    images?: unknown;
    is_active?: boolean | null;
    is_featured?: boolean | null;
    created_at?: string;
    updated_at?: string;
    member_price?: number | string | null;
    specifications?: unknown;
    seo_title?: string | null;
    seo_description?: string | null;
    seo_keywords?: string | null;
    og_image?: string | null;
    og_title?: string | null;
    og_description?: string | null;
    published_at?: string | null;
    unpublished_at?: string | null;
    is_hidden?: boolean | null;
    categories?: Array<{ id: string; name: string; slug: string }> | null;
  }>)
    .filter((item) => item.is_active !== false && item.is_hidden !== true)
    .map((item) => {
      const category = Array.isArray(item.categories) ? item.categories[0] || null : null;
      const categorySlug = category?.slug || '';
      return {
        id: item.id,
        category_id: item.category_id,
        name: item.name,
        slug: item.slug,
        description: item.description || '',
        summary: item.summary || item.description || '',
        content: item.content || item.description || '',
        price: Number(item.price || 0),
        sale_price: item.sale_price === null || item.sale_price === undefined ? null : Number(item.sale_price),
        member_price: item.member_price === null || item.member_price === undefined ? null : Number(item.member_price),
        stock: Number(item.stock || 0),
        sku: item.sku || '',
        images: resolveSonpinProductImages({
          name: item.name,
          slug: item.slug,
          category_slug: categorySlug,
          images: normalizeImages(item.images),
        }),
        specifications: Array.isArray(item.specifications) ? (item.specifications as Array<{ name: string; value?: string; options?: string[] }>) : [],
        seo_title: item.seo_title || null,
        seo_description: item.seo_description || null,
        seo_keywords: item.seo_keywords || null,
        og_image: item.og_image || null,
        og_title: item.og_title || null,
        og_description: item.og_description || null,
        published_at: item.published_at || null,
        unpublished_at: item.unpublished_at || null,
        is_active: item.is_active !== false,
        is_featured: item.is_featured === true,
        is_hidden: item.is_hidden === true,
        created_at: item.created_at,
        updated_at: item.updated_at,
        categories: category,
        category_slug: categorySlug,
        category_name: category?.name || '',
      };
    });

  return applyProductOrder(loaded);
};
