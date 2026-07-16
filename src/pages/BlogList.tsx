import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, Search } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import { useSEO } from '../hooks/useSEO';
import { loadBlogData, type LoadedBlogArticle } from '../lib/blog';
import type { BlogArticleCategoryMap } from '../lib/blog';
import type { BlogCategory } from '../data/blogContent';
import { useLanguage } from '../contexts/LanguageContext';
import { pickByLang } from '../lib/language';
import { shouldTranslateBlogContent, translateBlogData } from '../lib/blogTranslation';

const formatDate = (value: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));

const stripBrandPrefix = (value: string) => value.replace(/^y\s*&\s*m Coffee\s+/i, '');

export default function BlogList() {
  const { categorySlug } = useParams();
  const activeSlug = categorySlug ? decodeURIComponent(categorySlug) : '';
  const { currentLanguage, t } = useLanguage();
  const [sourceCategories, setSourceCategories] = useState<BlogCategory[]>([]);
  const [sourceArticles, setSourceArticles] = useState<LoadedBlogArticle[]>([]);
  const [sourceCategoryMap, setSourceCategoryMap] = useState<BlogArticleCategoryMap>({});
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [articles, setArticles] = useState<LoadedBlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [search, setSearch] = useState('');

  const activeCategory = categories.find((category) => category.slug === activeSlug);
  const locale = pickByLang(currentLanguage, 'zh-TW', 'en-US', 'ja-JP', 'ko-KR');

  useSEO({
    title: activeCategory?.name || t('blog.title', '文章專欄'),
    description: activeCategory?.description || t('blog.description', '瀏覽最新文章、分類內容與延伸閱讀。'),
    keywords: t('blog.keywords', '文章專欄,文章分類,最新消息'),
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const data = await loadBlogData({ publishedOnly: true });
      if (cancelled) return;
      setSourceCategories(data.categories);
      setSourceArticles(data.articles);
      setSourceCategoryMap(data.categoryMap);
      setCategories(data.categories);
      setArticles(data.articles);
      setLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!sourceArticles.length && !sourceCategories.length) return;
      if (!shouldTranslateBlogContent(currentLanguage)) {
        setCategories(sourceCategories);
        setArticles(sourceArticles);
        return;
      }

      setTranslating(true);
      try {
        const translated = await translateBlogData(
          {
            categories: sourceCategories,
            articles: sourceArticles,
            categoryMap: sourceCategoryMap,
          },
          currentLanguage,
        );
        setCategories(translated.categories);
        setArticles(translated.articles);
      } catch {
        setCategories(sourceCategories);
        setArticles(sourceArticles);
      } finally {
        setTranslating(false);
      }
    };

    void run();
  }, [currentLanguage, sourceArticles, sourceCategories, sourceCategoryMap]);

  const visibleArticles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return articles.filter((article) => {
      const matchesCategory = activeSlug ? article.category_slug === activeSlug : true;
      const matchesSearch = query
        ? `${article.title} ${article.excerpt} ${article.category_name}`.toLowerCase().includes(query)
        : true;

      return matchesCategory && matchesSearch;
    });
  }, [activeSlug, articles, search]);

  const countForCategory = (slug: string) =>
    articles.filter((article) => article.category_slug === slug).length;

  const totalArticles = articles.length;
  const activeCategoryName = activeCategory ? stripBrandPrefix(activeCategory.name) : t('blog.all', '全部文章');
  const categoryCards = [
    {
      key: 'all',
      label: t('blog.all', '全部文章'),
      slug: '',
      count: totalArticles,
      description: '瀏覽所有已發佈文章。',
    },
    ...categories.map((category) => ({
      key: category.slug,
      label: stripBrandPrefix(category.name),
      slug: category.slug,
      count: countForCategory(category.slug),
      description: category.description || '查看此分類的最新內容。',
    })),
  ];

  return (
    <div className="min-h-screen bg-[var(--sonpin-background)] text-stone-800">
      <SiteHeader />

      <main className="pt-20">
        <section className="border-b border-[var(--sonpin-primary-border)] bg-[linear-gradient(135deg,var(--sonpin-background)_0%,var(--sonpin-background)_44%,var(--sonpin-surface)_100%)]">
          <div className="container mx-auto px-6 py-16 md:py-24">
            <nav className="mb-8 flex items-center gap-2 text-xs tracking-[0.18em] text-stone-400">
              <Link to="/" className="transition-colors hover:text-stone-700">
                {t('common.home', '首頁')}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-stone-700">{t('blog.title', '文章專欄')}</span>
            </nav>

            <div className="grid gap-10 md:grid-cols-[1fr_360px] md:items-end">
              <div>
                <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[var(--sonpin-primary)]/80">
                  Journal
                </p>
                <h1 className="max-w-3xl text-4xl font-light leading-tight tracking-[0.16em] text-stone-900 md:text-6xl">
                  {activeCategory?.name || t('blog.heading', '文章專欄')}
                </h1>
                <div className="mt-7 h-px w-14 bg-[var(--sonpin-primary-warm)]/70" />
                <p className="mt-7 max-w-2xl text-sm font-light leading-8 text-stone-500">
                  {activeCategory?.description || t('blog.subheading', '瀏覽最新文章，分類閱讀更方便。')}
                </p>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-300" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('blog.search', '搜尋文章')}
                  className="w-full border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)]/90 py-3.5 pl-11 pr-4 text-sm text-stone-700 outline-none transition-all placeholder:text-stone-300 focus:border-[var(--sonpin-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--sonpin-primary-border)]/40"
                />
              </div>
            </div>

            {translating && (
              <div className="mt-6 inline-flex items-center rounded-full border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)]/80 px-3 py-1 text-[11px] tracking-[0.18em] text-[var(--sonpin-primary)]">
                {t('common.translating', '翻譯中')}
              </div>
            )}
          </div>
        </section>

        <section className="container mx-auto px-6 py-10 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            <aside className="rounded-[2rem] border border-[var(--sonpin-primary-border)] bg-gradient-to-b from-white/90 to-[var(--sonpin-surface)]/90 p-5 shadow-[0_22px_60px_-34px_rgba(53,30,13,0.28)] backdrop-blur-sm lg:sticky lg:top-28">
              <div className="mb-5 rounded-[1.5rem] border border-[var(--sonpin-primary-border)] bg-white/70 p-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[var(--sonpin-primary)]/75">
                  Category Guide
                </p>
                <h2 className="mt-3 text-[1.65rem] font-light tracking-[0.12em] text-stone-900">
                  文章分類導覽
                </h2>
                <p className="mt-3 text-sm leading-7 text-stone-500">
                  快速切換分類，查看目前主題下的最新內容。
                </p>

                <div className="mt-5 rounded-2xl border border-[var(--sonpin-primary-border)]/80 bg-[var(--sonpin-background)]/60 p-4">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-stone-400">Current Filter</p>
                  <p className="mt-2 text-lg font-medium tracking-[0.08em] text-stone-900">{activeCategoryName}</p>
                  <p className="mt-1 text-sm text-stone-500">
                    目前顯示 <span className="font-medium text-stone-800">{visibleArticles.length}</span> / {totalArticles} 篇文章
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {categoryCards.map((category) => {
                  const isActive = category.slug ? activeSlug === category.slug : !activeSlug;

                  return (
                    <Link
                      key={category.key}
                      to={category.slug ? `/blog/categories/${encodeURIComponent(category.slug)}` : '/blog'}
                      aria-current={isActive ? 'page' : undefined}
                      className={`group relative flex items-start justify-between gap-4 overflow-hidden rounded-2xl border px-4 py-4 transition-all duration-300 ${
                        isActive
                          ? 'border-[var(--sonpin-primary)] bg-[linear-gradient(135deg,var(--sonpin-primary)_0%,#4b2a10_100%)] text-white shadow-[0_18px_35px_-18px_rgba(53,30,13,0.45)]'
                          : 'border-[var(--sonpin-primary-border)] bg-white/75 text-stone-700 hover:-translate-y-0.5 hover:border-[var(--sonpin-primary)] hover:bg-white hover:shadow-[0_14px_30px_-22px_rgba(53,30,13,0.25)]'
                      }`}
                    >
                      <span
                        className={`absolute inset-y-0 left-0 w-1 transition-colors duration-300 ${
                          isActive ? 'bg-white/35' : 'bg-transparent group-hover:bg-[var(--sonpin-primary)]/20'
                        }`}
                      />

                      <div>
                        <div className="text-sm font-medium tracking-[0.12em]">{category.label}</div>
                        <div className={`mt-1 text-xs leading-6 ${isActive ? 'text-white/75' : 'text-stone-400'}`}>
                          {category.description}
                        </div>
                      </div>

                      <span
                        className={`mt-0.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.12em] ${
                          isActive ? 'bg-white/20 text-white' : 'bg-[var(--sonpin-primary-border)]/40 text-stone-700'
                        }`}
                      >
                        {category.count}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </aside>

            <div className="min-w-0">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-stone-400">Article Feed</p>
                  <p className="mt-2 text-sm text-stone-500">
                    {activeSlug ? `目前分類：${activeCategoryName}` : '目前顯示全部文章。'}
                  </p>
                </div>
                <div className="hidden rounded-full border border-[var(--sonpin-primary-border)] bg-white/70 px-4 py-2 text-xs tracking-[0.18em] text-stone-500 md:block">
                  {visibleArticles.length} 篇結果
                </div>
              </div>

              {loading ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="animate-pulse border border-stone-100 bg-white">
                      <div className="aspect-[4/3] bg-stone-100" />
                      <div className="space-y-4 p-5">
                        <div className="h-3 w-24 bg-stone-100" />
                        <div className="h-5 w-5/6 bg-stone-100" />
                        <div className="h-3 w-full bg-stone-100" />
                        <div className="h-3 w-2/3 bg-stone-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : visibleArticles.length === 0 ? (
                <div className="rounded-[1.75rem] border border-[var(--sonpin-primary-border)] bg-white/80 py-24 text-center">
                  <p className="text-sm tracking-[0.16em] text-stone-400">
                    {t('blog.empty', '目前沒有符合條件的文章。')}
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {visibleArticles.map((article, index) => (
                    <article
                      key={article.slug}
                      className="group overflow-hidden border border-stone-100 bg-white transition-all duration-500 hover:-translate-y-1 hover:border-stone-200 hover:shadow-[0_26px_70px_-24px_rgba(41,37,36,0.26)]"
                    >
                      <Link to={`/blog/posts/${article.slug}`} className="block overflow-hidden p-4 pb-0">
                        <div className="aspect-[4/3] overflow-hidden bg-stone-50">
                          <img
                            src={article.featured_image || '/LOGO-1.png'}
                            alt={article.title}
                            loading={index < 4 ? 'eager' : 'lazy'}
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                            onError={(event) => {
                              event.currentTarget.src = '/LOGO-1.png';
                            }}
                          />
                        </div>
                      </Link>

                      <div className="p-5">
                        <div className="mb-4 flex items-center justify-between gap-3 text-[11px] tracking-[0.18em] text-stone-400">
                          <Link
                            to={`/blog/categories/${encodeURIComponent(article.category_slug)}`}
                            className="uppercase transition-colors hover:text-amber-700"
                          >
                            {stripBrandPrefix(article.category_name)}
                          </Link>
                          <span>{formatDate(article.published_at, locale)}</span>
                        </div>
                        <Link to={`/blog/posts/${article.slug}`}>
                          <h2 className="min-h-[3.5rem] text-lg font-light leading-relaxed tracking-[0.06em] text-stone-900 transition-colors group-hover:text-amber-800 line-clamp-2">
                            {article.title}
                          </h2>
                        </Link>
                        <p className="mt-4 line-clamp-3 text-sm font-light leading-7 text-stone-500">
                          {article.excerpt}
                        </p>
                        <Link
                          to={`/blog/posts/${article.slug}`}
                          className="mt-6 inline-flex items-center gap-2 border-b border-stone-300 pb-1 text-xs font-medium tracking-[0.2em] text-stone-700 transition-colors hover:border-amber-600 hover:text-amber-700"
                        >
                          {t('blog.read', '閱讀更多')}
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <DeferredSiteFooter />
    </div>
  );
}
