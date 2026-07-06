import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Search, Shield, Truck, Gift, ShoppingBag } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import ProductImage from '../components/ProductImage';
import { useSEO } from '../hooks/useSEO';
import { breadcrumbSchema, collectionPageSchema } from '../utils/schemaMarkup';
import { FALLBACK_PRODUCTS } from '../data/fallbackProducts';
import { resolveSonpinProductImages } from '../lib/productImages';
import { isMissingSupabaseTableError, isSupabaseContentEnabled, isSupabaseNetworkError, supabase } from '../lib/supabase';

type SortKey = 'newest' | 'price_asc' | 'price_desc';

type ShopProduct = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  description: string;
  price: number;
  sale_price: number | null;
  images: string[];
  category_slug: string;
  category_name: string;
  is_active: boolean;
  created_at?: string;
};

const CATEGORY_TABS: Array<{ id: string | null; name: string }> = [
  { id: null, name: '全部' },
  { id: 'main-products', name: '主打商品' },
  { id: 'other-products', name: '其他商品' },
];

const PROMISES: Array<{ id: string; icon: typeof Gift; title: string; text: string }> = [
  { id: 'gift', icon: Gift, title: '質感禮盒', text: '適合節慶與企業送禮' },
  { id: 'shipping', icon: Truck, title: '快速出貨', text: '完成付款後盡快安排配送' },
  { id: 'quality', icon: Shield, title: '安心品質', text: '嚴選食材，穩定工法' },
];
const PRODUCT_ORDER_SETTING_KEY = 'product_order';

const getProductPath = (slug: string, categorySlug: string) => `/products/${categorySlug === 'main-products' ? '6' : '7'}/${slug}`;

const normalizeImages = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []);

const parseProductOrder = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  if (value && typeof value === 'object') {
    const maybe = value as { slugs?: unknown; ids?: unknown };
    if (Array.isArray(maybe.slugs)) return parseProductOrder(maybe.slugs);
    if (Array.isArray(maybe.ids)) return parseProductOrder(maybe.ids);
  }
  return [];
};

const toFallbackProduct = (item: (typeof FALLBACK_PRODUCTS)[number]): ShopProduct => ({
  id: item.id,
  name: item.name,
  slug: item.slug,
  summary: item.summary || '',
  description: item.description || '',
  price: item.price,
  sale_price: item.sale_price ?? null,
  images: resolveSonpinProductImages(item),
  category_slug: item.category_id,
  category_name: item.category_id === 'main-products' ? '主打商品' : '其他商品',
  is_active: true,
});

export default function Shop() {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [products, setProducts] = useState<ShopProduct[]>(FALLBACK_PRODUCTS.map(toFallbackProduct));
  const [loading, setLoading] = useState(true);

  useSEO({
    title: '商品介紹', 
    description: '瀏覽淞品商品介紹、主打商品與其他商品，快速找到想購買的土雞與伴手禮。', 
    keywords: '商品介紹,主打商品,其他商品,土雞,伴手禮,淞品', 
    schema: [
      collectionPageSchema('商品介紹'),
      breadcrumbSchema([
        { name: '首頁', url: window.location.origin },
        { name: '商品介紹', url: window.location.origin + '/products' },
      ]),
    ],
  });

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      if (!isSupabaseContentEnabled) {
        setLoading(false);
        return;
      }

      try {
        const [{ data: productData, error: productError }, { data: orderData, error: orderError }] = await Promise.all([
          supabase
            .from('products')
            .select('id, name, slug, description, price, sale_price, images, is_active, created_at, categories(id, name, slug)')
            .order('created_at', { ascending: false }),
          supabase
            .from('site_settings')
            .select('setting_value')
            .eq('setting_key', PRODUCT_ORDER_SETTING_KEY)
            .maybeSingle(),
        ]);

        if (productError) throw productError;
        if (orderError && !isMissingSupabaseTableError(orderError)) throw orderError;
        if (cancelled) return;

        const order = parseProductOrder(orderData?.setting_value);
        const loadedProducts = ((productData || []) as Array<{
          id: string;
          name: string;
          slug: string;
          description?: string;
          price: number | string;
          sale_price: number | string | null;
          images: unknown;
          is_active?: boolean;
          created_at?: string;
          categories?: { id: string; name: string; slug: string } | null;
        }>)
          .filter((item) => item.is_active !== false)
          .map((item) => ({
            id: item.id,
            name: item.name,
            slug: item.slug,
            summary: item.description || '',
            description: item.description || '',
            price: Number(item.price || 0),
            sale_price: item.sale_price === null || item.sale_price === undefined ? null : Number(item.sale_price),
            images: resolveSonpinProductImages({
              name: item.name,
              slug: item.slug,
              category_slug: item.categories?.slug,
              images: normalizeImages(item.images),
            }),
            category_slug: item.categories?.slug || 'other-products',
            category_name: item.categories?.name || '',
            is_active: item.is_active !== false,
            created_at: item.created_at,
          }));

        const orderIndex = new Map(order.map((slug, index) => [slug, index]));
        loadedProducts.sort((a, b) => {
          const aIndex = orderIndex.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
          const bIndex = orderIndex.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
          if (aIndex !== bIndex) return aIndex - bIndex;
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });

        setProducts(loadedProducts.length ? loadedProducts : FALLBACK_PRODUCTS.map(toFallbackProduct));
      } catch (error) {
        if (!isMissingSupabaseTableError(error) && !isSupabaseNetworkError(error)) {
          console.warn('Using fallback products:', error);
        }
        setProducts(FALLBACK_PRODUCTS.map(toFallbackProduct));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let items = [...products];

    if (category) {
      items = items.filter((item) => item.category_slug === category);
    }

    if (q) {
      items = items.filter((item) => {
        return (
          item.name.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        );
      });
    }

    if (sortKey === 'price_asc') {
      items.sort((a, b) => (a.sale_price ?? a.price) - (b.sale_price ?? b.price));
    } else if (sortKey === 'price_desc') {
      items.sort((a, b) => (b.sale_price ?? b.price) - (a.sale_price ?? a.price));
    }

    return items;
  }, [category, products, searchQuery, sortKey]);

  const categoryCount = (id: string | null) => (id ? products.filter((item) => item.category_slug === id).length : products.length);

  if (loading) {
    return <div className="min-h-screen bg-[#fbf6ee] p-6 text-stone-500">載入商品中...</div>
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf6ee] text-stone-800">
      <SiteHeader />

      <main className="flex-1 pt-20">
        <section className="border-b border-[#eadfd1] bg-[linear-gradient(135deg,#fbf6ee_0%,#f7efe5_44%,#fffaf2_100%)]">
          <div className="container mx-auto px-6 py-16 md:py-24">
            <nav className="mb-8 flex items-center gap-2 text-xs tracking-[0.18em] text-stone-400">
              <Link to="/" className="transition-colors hover:text-stone-700">
                首頁
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-stone-700">商品介紹</span>
            </nav>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[#8e6448]/80">Product Collection</p>
            <h1 className="max-w-3xl text-4xl font-light leading-tight tracking-[0.16em] text-stone-900 md:text-6xl">
              商品介紹
            </h1>
          </div>
        </section>

        <section className="container mx-auto px-6 py-12">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 rounded-full border border-[#d8c8b6] bg-[#fffaf2] p-2">
              <Search className="ml-2 mt-2.5 h-4 w-4 text-stone-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="可輸入商品用途、預算或口味偏好"
                className="w-full bg-transparent px-2 py-2 text-sm outline-none placeholder:text-stone-300"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id ?? 'all'}
                  type="button"
                  onClick={() => setCategory(tab.id)}
                  className={`border px-4 py-2 text-xs tracking-[0.16em] transition-all ${
                    category === tab.id
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 text-stone-500 hover:border-stone-700 hover:text-stone-900'
                  }`}
                >
                  {tab.name}
                  <span className="ml-1.5 text-[10px] opacity-60">{categoryCount(tab.id)}</span>
                </button>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {PROMISES.map(({ id, icon: Icon, title, text }) => (
                <div key={id} className="flex items-center gap-3 border border-stone-200 bg-white px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center bg-stone-900 text-white">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold tracking-[0.12em] text-stone-800">{title}</p>
                    <p className="mt-0.5 text-xs text-stone-400">{text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                {[
                  { key: 'newest' as const, label: '最新' },
                  { key: 'price_asc' as const, label: '價格 低到高' },
                  { key: 'price_desc' as const, label: '價格 高到低' },
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setSortKey(option.key)}
                    className={`border px-4 py-2 text-xs tracking-[0.16em] transition-all ${
                      sortKey === option.key
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 text-stone-500 hover:border-stone-700 hover:text-stone-900'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="text-xs text-stone-400">{filteredProducts.length} 項商品</div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 pb-16">
          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-[#eadfd1] bg-[#fffaf2] p-10 text-center text-stone-500">
              目前沒有符合條件的商品
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const displayPrice = product.sale_price ?? product.price;

                return (
                  <article key={product.id} className="overflow-hidden rounded-3xl border border-[#eadfd1] bg-[#fffaf2] shadow-sm">
                    <Link to={getProductPath(product.slug, product.category_slug)}>
                      <div className="aspect-square bg-stone-100">
                        <ProductImage
                          src={product.images?.[0]}
                          alt={product.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </Link>
                    <div className="p-5">
                      <div className="mb-2 text-[11px] tracking-[0.18em] text-stone-400">
                        {product.category_name || (product.category_slug === 'main-products' ? '主打商品' : '其他商品')}
                      </div>
                      <Link to={getProductPath(product.slug, product.category_slug)}>
                        <h2 className="text-base leading-7 text-stone-800">{product.name}</h2>
                      </Link>
                      <p className="mt-3 text-sm leading-7 text-stone-500">{product.summary}</p>
                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-semibold text-stone-900">NT$ {displayPrice.toLocaleString()}</span>
                          {product.sale_price && (
                            <span className="text-xs text-stone-300 line-through">NT$ {product.price.toLocaleString()}</span>
                          )}
                        </div>
                        <Link
                          to={getProductPath(product.slug, product.category_slug)}
                          className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-4 py-2 text-xs tracking-[0.16em] text-stone-600 transition-colors hover:border-stone-900 hover:bg-stone-900 hover:text-white"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          查看商品
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <DeferredSiteFooter />
    </div>
  );
}
