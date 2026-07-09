import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import { useSEO } from '../hooks/useSEO';
import { loadServiceArticle, type ServiceArticleRow } from '../lib/serviceArticleStore';
import { buildServiceArticleRows } from '../lib/serviceArticleSeed';

export default function ServiceDetailPage() {
  const { slug = '' } = useParams();
  const [article, setArticle] = useState<ServiceArticleRow | null>(() => buildServiceArticleRows().find((item) => item.slug === slug) || null);
  const [loading, setLoading] = useState(true);

  const renderedContent = article ? stripServiceMeta(article.content) : '';

  useEffect(() => {
    let alive = true;

    const run = async () => {
      const item = await loadServiceArticle(slug);
      if (!alive) return;
      setArticle(item);
      setLoading(false);
    };

    void run();

    return () => {
      alive = false;
    };
  }, [slug]);

  useSEO({
    title: article?.title || '老饕分享',
    description: article?.excerpt || '淞品土雞專賣店老饕分享與門市資訊。',
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbf6ee] text-stone-800">
        <SiteHeader />
        <main className="container mx-auto px-6 py-24">
          <p className="text-sm text-stone-500">載入中...</p>
        </main>
        <DeferredSiteFooter />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#fbf6ee] text-stone-800">
        <SiteHeader />
        <main className="container mx-auto px-6 py-24">
          <p className="text-sm text-stone-500">找不到這篇老饕分享。</p>
        </main>
        <DeferredSiteFooter />
      </div>
    );
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
              <Link to="/service" className="transition-colors hover:text-stone-700">
                老饕分享
              </Link>
            </nav>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[#8e6448]/80">Article</p>
            <h1 className="max-w-4xl text-3xl font-light leading-tight tracking-[0.06em] text-stone-900 md:text-4xl">
              {article.title}
            </h1>
          </div>
        </section>

        <section className="container mx-auto px-6 py-14">
          <article className="overflow-hidden rounded-3xl border border-[#eadfd1] bg-[#fffaf2] shadow-sm">
            <img src={article.featured_image || '/sonpin-images/153285217452.jpg'} alt={article.title} className="h-auto w-full object-cover" loading="lazy" />
            <div className="p-6 md:p-8">
              <div className="overflow-hidden rounded-2xl bg-stone-50">
                <div className="prose prose-stone max-w-none p-6" dangerouslySetInnerHTML={{ __html: renderedContent }} />
              </div>
            </div>
          </article>
        </section>
      </main>

      <DeferredSiteFooter />
    </div>
  );
}

function stripServiceMeta(content: string) {
  return content
    .replace(/^<div class="service-article"><figure><img[^>]*><\/figure>/, '<div class="service-article">')
    .replace(/<div class="service-article__meta">[\s\S]*?<\/div>/, '')
    .replace(/^<div class="service-article">/, '<div class="service-article"><div class="space-y-5">')
    .replace(/<\/div><\/div>$/, '</div></div>');
}
