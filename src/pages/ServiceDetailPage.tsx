import { Link, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { useSEO } from '../hooks/useSEO';
import { getServiceShareDetail } from '../data/serviceContent';

export default function ServiceDetailPage() {
  const { slug = '' } = useParams();
  const item = getServiceShareDetail(slug);

  useSEO({
    title: item?.title || '饕客分享',
    description: item?.paragraphs?.[0] || '淞品土雞專賣店的食記與媒體分享。',
  });

  if (!item) {
    return (
      <div className="min-h-screen bg-[#fbf6ee] text-stone-800">
        <SiteHeader />
        <main className="container mx-auto px-6 py-24">
          <p className="text-sm text-stone-500">找不到這篇饕客分享內容。</p>
        </main>
        <SiteFooter />
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
                饕客分享
              </Link>
            </nav>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[#8e6448]/80">Share</p>
            <h1 className="max-w-4xl text-3xl font-light leading-tight tracking-[0.08em] text-stone-900 md:text-5xl">
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

      <SiteFooter />
    </div>
  );
}
