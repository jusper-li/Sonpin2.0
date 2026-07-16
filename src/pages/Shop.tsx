import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Gift, Search, Shield, ShoppingCart, Truck } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import ProductImage from '../components/ProductImage';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import { breadcrumbSchema, collectionPageSchema } from '../utils/schemaMarkup';
import { loadCatalogCategories, loadCatalogProducts, type CatalogCategory } from '../lib/supabaseCatalog';

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

const PROMISES: Array<{
  id: string;
  icon: typeof Gift;
  titleKey: string;
  textKey: string;
  titleDefault: string;
  textDefault: string;
}> = [
  {
    id: 'gift',
    icon: Gift,
    titleKey: 'shop.promise.gift.title',
    textKey: 'shop.promise.gift.text',
    titleDefault: '精緻禮盒',
    textDefault: '適合節慶送禮與商務贈禮',
  },
  {
    id: 'shipping',
    icon: Truck,
    titleKey: 'shop.promise.shipping.title',
    textKey: 'shop.promise.shipping.text',
    titleDefault: '快速出貨',
    textDefault: '完成付款後盡快安排出貨',
  },
  {
    id: 'quality',
    icon: Shield,
    titleKey: 'shop.promise.quality.title',
    textKey: 'shop.promise.quality.text',
    titleDefault: '安心品質',
    textDefault: '嚴選食材，穩定工法',
  },
];

const STORE_ONLY_PRODUCT_SLUGS = new Set([
  'sonpin-salted-half-chicken',
  'sonpin-smoked-half-chicken',
  'sonpin-salted-plate',
  'sonpin-smoked-plate',
  'sonpin-braised-chicken-feet',
  'sonpin-chicken-gizzard',
  'sonpin-chicken-intestine',
]);

const getProductPath = (slug: string, categorySlug: string) => `/products/${encodeURIComponent(categorySlug || 'other-products')}/${slug}`;

export default function Shop() {
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: t('shop.seo.title', '商品列表'),
    description: t('shop.seo.description', '依分類瀏覽淞品土雞商品、門市限定品項與主打推薦。'),
    keywords: t('shop.seo.keywords', '商品列表, 土雞, 門市限定, 分類'),
    schema: [
      collectionPageSchema(
        t('shop.seo.title', '商品列表'),
        t('shop.seo.description', '依分類瀏覽淞品土雞商品、門市限定品項與主打推薦。'),
      ),
      breadcrumbSchema([
        { name: t('common.home', '首頁'), url: window.location.origin },
        { name: t('shop.breadcrumb', '商品列表'), url: `${window.location.origin}/products` },
      ]),
    ],
  });

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        const [categoryData, productData] = await Promise.all([loadCatalogCategories(), loadCatalogProducts()]);
        if (cancelled) return;

        setCategories(categoryData);
        setProducts(
          productData.map((item): ShopProduct => ({
            id: item.id,
            name: item.name,
            slug: item.slug,
            summary: item.summary || item.description || '',
            description: item.description || '',
            price: item.price,
            sale_price: item.sale_price,
            images: item.images,
            category_slug: item.category_slug || item.categories?.slug || 'other-products',
            category_name: item.category_name || item.categories?.name || '',
            is_active: item.is_active,
            created_at: item.created_at,
          })),
        );
      } catch (error) {
        console.error('Failed to load catalog products:', error);
        if (!cancelled) {
          setCategories([]);
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const categoryTabs = useMemo(
    () => [{ id: null, name: t('shop.category.all', '全部') }, ...categories.map((item) => ({ id: item.slug, name: t(`shop.category.${item.slug}`, item.name) }))],
    [categories, t],
  );

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
    return <div className="min-h-screen bg-[var(--sonpin-background)] p-6 text-stone-500">{t('shop.loading', '商品列表載入中...')}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--sonpin-background)] text-stone-800">
      <SiteHeader />

      <main className="flex-1 pt-20">
        <section className="border-b border-[var(--sonpin-primary-border)] bg-[linear-gradient(135deg,var(--sonpin-background)_0%,var(--sonpin-background)_44%,var(--sonpin-surface)_100%)]">
          <div className="container mx-auto px-6 py-16 md:py-24">
            <nav className="mb-8 flex items-center gap-2 text-xs tracking-[0.18em] text-stone-400">
              <Link to="/" className="transition-colors hover:text-stone-700">
                {t('common.home', '首頁')}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-stone-700">{t('shop.breadcrumb', '商品列表')}</span>
            </nav>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[var(--sonpin-primary)]/80">
              {t('shop.kicker', '商品系列')}
            </p>
            <h1 className="max-w-3xl text-4xl font-light leading-tight tracking-[0.16em] text-stone-900 md:text-6xl">
              {t('shop.title', '商品列表')}
            </h1>
          </div>
        </section>

        <section className="container mx-auto px-6 py-12">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 rounded-full border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] p-2">
              <Search className="ml-2 mt-2.5 h-4 w-4 text-stone-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('shop.search.placeholder', '可輸入商品用途、預算或口味偏好')}
                className="w-full bg-transparent px-2 py-2 text-sm outline-none placeholder:text-stone-300"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categoryTabs.map((tab) => (
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
              {PROMISES.map(({ id, icon: Icon, titleKey, textKey, titleDefault, textDefault }) => (
                <div key={id} className="flex items-center gap-3 border border-stone-200 bg-white px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center bg-stone-900 text-white">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold tracking-[0.12em] text-stone-800">{t(titleKey, titleDefault)}</p>
                    <p className="mt-0.5 text-xs text-stone-400">{t(textKey, textDefault)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                {[
                  { key: 'newest' as const, label: t('shop.sort.newest', '最新') },
                  { key: 'price_asc' as const, label: t('shop.sort.priceAsc', '價格 低到高') },
                  { key: 'price_desc' as const, label: t('shop.sort.priceDesc', '價格 高到低') },
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
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
              <div className="text-xs text-stone-400">{t('shop.count', `${filteredProducts.length} 項商品`)}</div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 pb-16">
          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] p-10 text-center text-stone-500">
              {t('shop.empty', '目前沒有符合條件的商品。')}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const displayPrice = product.sale_price ?? product.price;
                const storeOnly = product.category_slug === 'other-products' || STORE_ONLY_PRODUCT_SLUGS.has(product.slug);
                const translatedName = t(`product.${product.slug}.name`, product.name);
                const translatedSummary = t(`product.${product.slug}.summary`, product.summary);
                const translatedDescription = t(`product.${product.slug}.description`, product.description);

                const handleAddToCart = () => {
                  addToCart(
                    {
                      id: product.id,
                      productId: product.id,
                      name: translatedName,
                      price: product.price,
                      salePrice: product.sale_price,
                      image: product.images?.[0] || '',
                      slug: product.slug,
                    },
                    1,
                  );
                };

                return (
                  <article key={product.id} className="overflow-hidden rounded-3xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] shadow-sm">
                    <Link to={getProductPath(product.slug, product.category_slug)}>
                      <div className="relative aspect-square bg-stone-100">
                        {storeOnly && (
                          <span className="absolute left-3 top-3 z-10 rounded-full bg-stone-900/90 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-white shadow-lg">
                            {t('shop.storeOnlyBadge', '門市限定')}
                          </span>
                        )}
                        <ProductImage
                          src={product.images?.[0]}
                          alt={translatedName}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </Link>
                    <div className="p-5">
                      <div className="mb-2 text-[11px] tracking-[0.18em] text-stone-400">
                        {t(
                          `shop.category.${product.category_slug}`,
                          product.category_name || (product.category_slug === 'main-products' ? '主打商品' : '其他商品'),
                        )}
                      </div>
                      <Link to={getProductPath(product.slug, product.category_slug)}>
                        <h2 className="text-base leading-7 text-stone-800">{translatedName}</h2>
                      </Link>
                      <p className="mt-3 text-sm leading-7 text-stone-500">{translatedSummary || translatedDescription}</p>
                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-semibold text-stone-900">NT$ {displayPrice.toLocaleString()}</span>
                          {product.sale_price && (
                            <span className="text-xs text-stone-300 line-through">NT$ {product.price.toLocaleString()}</span>
                          )}
                        </div>
                        {storeOnly ? (
                          <span className="text-xs tracking-[0.16em] text-stone-400">{t('shop.storeOnlyNote', '僅於門市販售')}</span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={handleAddToCart}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-900 bg-stone-900 text-white transition-colors hover:bg-stone-700"
                              aria-label={t('shop.cart.addAria', `加入購物車：${translatedName}`)}
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </button>
                          </div>
                        )}
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
