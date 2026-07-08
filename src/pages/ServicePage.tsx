import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import { useSEO } from '../hooks/useSEO';
import { breadcrumbSchema } from '../utils/schemaMarkup';
import { isSupabaseContentEnabled } from '../lib/supabase';
import { getFallbackServiceContent, loadServiceContent, type ServiceContentPayload } from '../lib/serviceContentStore';

export default function ServicePage() {
  const [content, setContent] = useState<ServiceContentPayload | null>(() => (isSupabaseContentEnabled ? null : getFallbackServiceContent()));
  const [loading, setLoading] = useState(isSupabaseContentEnabled);

  useSEO({
    title: '服務分享',
    description: '瀏覽最新的服務分享與門市資訊。',
    keywords: '服務分享,門市資訊,最新分享',
    schema: breadcrumbSchema([
      { name: '首頁', url: window.location.origin },
      { name: '服務分享', url: `${window.location.origin}/service` },
    ]),
  });

  useEffect(() => {
    if (!isSupabaseContentEnabled) {
      return;
    }

    let alive = true;

    const run = async () => {
      const result = await loadServiceContent();
      if (!alive) return;
      setContent(result.content);
      setLoading(false);
    };

    void run();

    return () => {
      alive = false;
    };
  }, []);

  const shares = content?.shares || [];

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
              <span className="text-stone-700">服務分享</span>
            </nav>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[#8e6448]/80">Share</p>
            <h1 className="max-w-3xl text-4xl font-light leading-tight tracking-[0.16em] text-stone-900 md:text-6xl">
              服務分享
            </h1>
          </div>
        </section>

        <section className="container mx-auto px-6 py-14">
          {loading ? (
            <div className="rounded-3xl border border-[#eadfd1] bg-[#fffaf2] px-6 py-12 text-center text-sm text-stone-500">
              載入服務分享中…
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shares.map((item) => (
                <Link
                  key={item.slug}
                  to={`/service/${item.slug}`}
                  className="group overflow-hidden rounded-3xl border border-[#eadfd1] bg-[#fffaf2] shadow-sm transition-all hover:-translate-y-1 hover:border-stone-300"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-stone-100">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm leading-7 text-stone-700 line-clamp-2">{item.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <DeferredSiteFooter />
    </div>
  );
}
