import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import { useSEO } from '../hooks/useSEO';
import { breadcrumbSchema } from '../utils/schemaMarkup';
import { getMediaGroup } from '../data/mediaContent';
import { loadMediaArticles } from '../lib/media';

const defaultGroupSlug = '79';
const HIDDEN_MEDIA_LIST_ARTICLES: Record<string, Set<string>> = {
  '79': new Set(['66', '40']),
};

export default function MediaPage() {
  const { categorySlug } = useParams();
  const { pathname } = useLocation();
  const isVideoPage = categorySlug === '78' || pathname.replace(/\/+$/, '') === '/media/78';
  const groupSlug = isVideoPage ? '78' : defaultGroupSlug;
  const group = getMediaGroup(groupSlug) || getMediaGroup(defaultGroupSlug);
  const [articles, setArticles] = useState<Awaited<ReturnType<typeof loadMediaArticles>>>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const data = await loadMediaArticles();
      if (cancelled) return;
      const hiddenSlugs = HIDDEN_MEDIA_LIST_ARTICLES[groupSlug] || new Set<string>();
      setArticles(
        data.filter(
          (article) =>
            article.groupSlug === groupSlug && !hiddenSlugs.has(article.articleSlug),
        ),
      );
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [groupSlug]);

  const pageArticles = useMemo(() => articles, [articles]);

  useSEO({
    title: group?.title || '????',
    description: `${group?.title || '????'} - ?????????????`,
    keywords: '????,????,????,????',
    schema: breadcrumbSchema([
      { name: '??', url: window.location.origin },
      { name: group?.title || '????', url: `${window.location.origin}${isVideoPage ? '/media/78' : '/media'}` },
    ]),
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf6ee] text-stone-800">
      <SiteHeader />

      <main className="flex-1 pt-20">
        <section className="border-b border-[#eadfd1] bg-[linear-gradient(135deg,#fbf6ee_0%,#f7efe5_44%,#fffaf2_100%)]">
          <div className="container mx-auto px-6 py-16 md:py-24">
            <nav className="mb-8 flex items-center gap-2 text-xs tracking-[0.18em] text-stone-400">
              <Link to="/" className="transition-colors hover:text-stone-700">
                擐?
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-stone-700">{group?.title || '?賊??勗?'}</span>
            </nav>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[#8e6448]/80">
              {group?.label || 'News'}
            </p>
            <h1 className="max-w-3xl text-3xl font-light leading-tight tracking-[0.12em] text-stone-900 md:text-4xl">
              {group?.title || '?賊??勗?'}
            </h1>
          </div>
        </section>

        <section className="container mx-auto px-6 py-14">
          <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
            <Link
              to="/media"
              className={`flex-shrink-0 border px-4 py-2 text-xs tracking-[0.16em] transition-all ${
                !isVideoPage
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-200 text-stone-500 hover:border-stone-700 hover:text-stone-900'
              }`}
            >
              ?梁???
            </Link>
            <Link
              to="/media/78"
              className={`flex-shrink-0 border px-4 py-2 text-xs tracking-[0.16em] transition-all ${
                isVideoPage
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-200 text-stone-500 hover:border-stone-700 hover:text-stone-900'
              }`}
            >
              敶梢?勗?
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {pageArticles.map((article) => {
              const cardImage = article.featuredImage || article.galleryImages[0] || '/sonpin-images/153285188512.jpg';
              return (
                <Link
                  key={`${article.groupSlug}-${article.articleSlug}`}
                  to={`/media/${article.groupSlug}/${article.articleSlug}`}
                  className="group block overflow-hidden rounded-3xl border border-[#eadfd1] bg-[#fffaf2] shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-stone-200 hover:shadow-[0_24px_58px_-26px_rgba(41,37,36,0.18)]"
                >
                  <div className="aspect-[4/3] bg-stone-100">
                    <img src={cardImage} alt={article.title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                  </div>
                  <div className="p-5">
                    <div className="mb-3 text-[11px] tracking-[0.18em] text-stone-400">{article.date}</div>
                    <h2 className="text-base leading-7 text-stone-800 transition-colors group-hover:text-amber-800">
                      {article.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-stone-500">{article.excerpt}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      <DeferredSiteFooter />
    </div>
  );
}
