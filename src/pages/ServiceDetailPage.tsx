import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import { useSEO } from '../hooks/useSEO';
import { isSupabaseContentEnabled } from '../lib/supabase';
import { getFallbackServiceContent, loadServiceContent, type ServiceContentPayload } from '../lib/serviceContentStore';

export default function ServiceDetailPage() {
  const { slug = '' } = useParams();
  const [content, setContent] = useState<ServiceContentPayload | null>(() => (isSupabaseContentEnabled ? null : getFallbackServiceContent()));
  const [loading, setLoading] = useState(isSupabaseContentEnabled);

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

  const item = content?.details?.[slug] || null;

  useSEO({
    title: item?.title || '服務分享',
    description: item?.paragraphs?.[0] || '瀏覽最新的服務分享與門市資訊。',
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbf6ee] text-stone-800">
        <SiteHeader />
        <main className="container mx-auto px-6 py-24">
          <p className="text-sm text-stone-500">載入服務內容中…</p>
        </main>
        <DeferredSiteFooter />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#fbf6ee] text-stone-800">
        <SiteHeader />
        <main className="container mx-auto px-6 py-24">
          <p className="text-sm text-stone-500">找不到這則服務分享。</p>
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
                服務分享
              </Link>
            </nav>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[#8e6448]/80">Share</p>
            <h1 className="max-w-4xl text-3xl font-light leading-tight tracking-[0.06em] text-stone-900 md:text-4xl">
              {item.title}
            </h1>
          </div>
        </section>

        <section className="container mx-auto px-6 py-14">
          <article className="overflow-hidden rounded-3xl border border-[#eadfd1] bg-[#fffaf2] shadow-sm">
            <img src={item.banner} alt={item.title} className="h-auto w-full object-cover" loading="lazy" />
            <div className="p-6 md:p-8">
              <div className="mb-6 text-sm leading-7 text-[#6d4f3d]">
                <p className="font-medium text-[#8e6448]">{item.storeName}</p>
                {item.phone ? <p>電話：{item.phone}</p> : null}
                <p>地址：{item.address}</p>
              </div>

              <div className="overflow-hidden rounded-2xl bg-stone-50">
                <img src={item.image} alt={item.title} className="w-full object-cover" loading="lazy" />
              </div>

              <div className="mt-8 space-y-5 text-sm leading-8 text-[#6d4f3d]">
                {item.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </article>
        </section>
      </main>

      <DeferredSiteFooter />
    </div>
  );
}
