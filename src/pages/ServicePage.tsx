import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { useSEO } from '../hooks/useSEO';
import { breadcrumbSchema } from '../utils/schemaMarkup';
import { SERVICE_SHARES } from '../data/serviceContent';

export default function ServicePage() {
  useSEO({
    title: '饕客分享',
    description: '淞品土雞專賣店的食記與媒體分享，整理萬華三水街與龍山寺周邊的食用心得。',
    keywords: '饕客分享,淞品土雞,萬華美食,龍山寺,三水街',
    schema: breadcrumbSchema([
      { name: '首頁', url: window.location.origin },
      { name: '饕客分享', url: `${window.location.origin}/service` },
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
                首頁
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-stone-700">饕客分享</span>
            </nav>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[#8e6448]/80">Share</p>
            <h1 className="max-w-3xl text-4xl font-light leading-tight tracking-[0.16em] text-stone-900 md:text-6xl">
              饕客分享
            </h1>
          </div>
        </section>

        <section className="container mx-auto px-6 py-14">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_SHARES.map((item) => (
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
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
