import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Clock, ExternalLink, Play } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { useSEO } from '../hooks/useSEO';
import { breadcrumbSchema } from '../utils/schemaMarkup';
import { getMediaGroup } from '../data/mediaContent';
import { loadMediaArticle } from '../lib/media';
import { useEffect, useState } from 'react';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(`${value}T00:00:00+08:00`));

export default function MediaDetailPage() {
  const { groupSlug = '', articleSlug = '' } = useParams();
  const [article, setArticle] = useState<Awaited<ReturnType<typeof loadMediaArticle>>>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const data = await loadMediaArticle(groupSlug, articleSlug);
      if (!cancelled) setArticle(data);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [groupSlug, articleSlug]);

  const group = getMediaGroup(groupSlug);
  const currentPageUrl = `${window.location.origin}/media/${groupSlug}/${articleSlug}`;
  const externalUrl =
    article?.kind === 'video' && article.iframeUrl
      ? `https://www.youtube.com/watch?v=${article.iframeUrl.split('/embed/')[1]?.split('?')[0] || ''}`
      : article?.sourceUrl || '';

  useSEO({
    title: article?.title || '相關報導',
    description: article?.excerpt || '淞品土雞媒體報導內容',
    ogImage: article?.featuredImage,
    ogType: 'article',
    schema: article
      ? breadcrumbSchema([
          { name: '首頁', url: window.location.origin },
          { name: '相關報導', url: `${window.location.origin}/media` },
          { name: group?.title || '影音報導', url: `${window.location.origin}/media/${groupSlug}` },
        ])
      : undefined,
  });

  if (!article) {
    return (
      <div className="min-h-screen bg-[#fbf6ee] text-stone-800">
        <SiteHeader />
        <main className="container mx-auto px-6 py-24 pt-28">
          <p className="text-sm text-stone-500">找不到文章內容</p>
          <Link
            to="/media"
            className="mt-6 inline-flex items-center gap-2 border-b border-stone-300 pb-1 text-xs font-medium tracking-[0.18em] text-stone-700 hover:border-amber-700 hover:text-amber-700"
          >
            返回列表
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const galleryImages = article.galleryImages.length > 0 ? article.galleryImages : article.featuredImage ? [article.featuredImage] : [];
  const showVideoFirst = article.kind === 'video' && article.videoPlacement !== 'bottom';
  const showVideoLast = article.kind === 'video' && article.videoPlacement === 'bottom';
  const videoBlock =
    article.kind === 'video' && article.iframeUrl ? (
      <div className="overflow-hidden rounded-2xl border border-[#eadfd1] bg-black shadow-sm">
        <div className="aspect-video w-full">
          <iframe
            src={article.iframeUrl}
            title={article.title}
            width="100%"
            height="315"
            frameBorder={0}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
    ) : null;

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
              <Link to="/media" className="transition-colors hover:text-stone-700">
                相關報導
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-stone-700">{group?.title || '影音報導'}</span>
            </nav>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[#8e6448]/80">
              {group?.label || 'Media'}
            </p>
            <h1 className="max-w-4xl text-3xl font-light leading-tight tracking-[0.06em] text-stone-900 md:text-4xl">
              {article.title}
            </h1>
            <div className="mt-7 flex flex-wrap items-center gap-4 text-xs tracking-[0.16em] text-stone-400">
              <span className="inline-flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                {formatDate(article.date)}
              </span>
              {externalUrl && externalUrl !== currentPageUrl && (
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-[#8e6448]"
                >
                  原始來源
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 py-14">
          <article className="overflow-hidden rounded-3xl border border-[#eadfd1] bg-[#fffaf2] shadow-sm">
            {showVideoFirst ? videoBlock : article.featuredImage ? (
              <div className="bg-stone-100">
                <img src={article.featuredImage} alt={article.title} className="h-auto w-full object-cover" loading="eager" decoding="async" />
              </div>
            ) : null}

            <div className="p-6 md:p-8">
              {article.kind === 'video' ? (
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#eadfd1] bg-white px-3 py-1 text-[11px] tracking-[0.18em] text-[#8e6448]">
                  <Play className="h-3.5 w-3.5" />
                  影音報導
                </div>
              ) : null}

              {article.htmlContent ? (
                <div
                  className="space-y-5 text-sm leading-8 text-[#6d4f3d] md:text-[15px]"
                  dangerouslySetInnerHTML={{ __html: article.htmlContent }}
                />
              ) : article.bodyParagraphs.length > 0 ? (
                <div className="space-y-5 text-sm leading-8 text-[#6d4f3d] md:text-[15px]">
                  {article.bodyParagraphs.map((paragraph) => (
                    <p key={paragraph} className="whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-[#eadfd1] bg-white/70 p-5 text-sm leading-8 text-[#6d4f3d]">
                  <p>目前尚無完整內容。</p>
                </div>
              )}

              {showVideoLast ? <div className="mt-10">{videoBlock}</div> : null}

              {galleryImages.length > 1 && (
                <div className="mt-10 grid gap-4 md:grid-cols-2">
                  {galleryImages.slice(1).map((image) => (
                    <img
                      key={image}
                      src={image}
                      alt={article.title}
                      className="w-full rounded-2xl object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ))}
                </div>
              )}

              <div className="mt-10">
                <Link
                  to={`/media/${groupSlug}`}
                  className="inline-flex items-center gap-2 border-b border-stone-300 pb-1 text-xs font-medium tracking-[0.18em] text-stone-700 hover:border-amber-700 hover:text-amber-700"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  返回列表
                </Link>
              </div>
            </div>
          </article>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
