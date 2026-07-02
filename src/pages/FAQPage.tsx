import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, ChevronUp, Search } from 'lucide-react';
import { isSupabaseContentEnabled, supabase } from '../lib/supabase';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { useSEO } from '../hooks/useSEO';
import { breadcrumbSchema, faqPageSchema } from '../utils/schemaMarkup';
import { useLanguage } from '../contexts/LanguageContext';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

const CATEGORY_KEYS: Record<string, string> = {
  general: 'faq.category.general',
  order: 'faq.category.order',
  shipping: 'footer.shipping',
  product: 'faq.category.product',
  payment: 'faq.category.payment',
  return: 'faq.category.return',
  membership: 'faq.category.membership',
};

export default function FAQPage() {
  const { t } = useLanguage();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useSEO({
    title: t('faq.seo.title', '常見問題'),
    description: t('faq.seo.description', 'Sonpin 常見問題與客服說明。'),
    keywords: t('faq.seo.keywords', '常見問題,FAQ,Sonpin,配送說明,退換貨,付款方式'),
    schema: faqs.length > 0 ? [
      faqPageSchema(faqs.map((f) => ({ question: f.question, answer: f.answer }))),
      breadcrumbSchema([
        { name: t('common.home', '首頁'), url: window.location.origin },
        { name: t('faq.breadcrumb', '常見問題'), url: `${window.location.origin}/faq` },
      ]),
    ] : undefined,
  });

  useEffect(() => {
    const loadFaqs = async () => {
      if (!isSupabaseContentEnabled) {
        setFaqs([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('faqs')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        setFaqs((data || []) as FAQ[]);
      } catch {
        setFaqs([]);
      } finally {
        setLoading(false);
      }
    };

    const loadingTimeout = window.setTimeout(() => {
      setLoading(false);
    }, 1500);

    void loadFaqs();
    return () => window.clearTimeout(loadingTimeout);
  }, []);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(faqs.map((faq) => faq.category)))],
    [faqs],
  );

  const filtered = faqs.filter((faq) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query);
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const grouped = filtered.reduce<Record<string, FAQ[]>>((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {});

  const categoryLabel = (cat: string) => {
    if (cat === 'all') return t('faq.all', '全部');
    const key = CATEGORY_KEYS[cat];
    return key ? t(key, cat) : cat;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf6ee]">
      <SiteHeader />

      <main className="flex-1 pt-24">
        <section className="bg-gradient-to-br from-[#2b221d] via-[#5f4636] to-[#8e6448] text-[#fffaf2] py-20">
          <div className="container mx-auto px-6">
            <div className="flex items-center gap-2 text-xs text-[#eadfd1] tracking-[0.1em] mb-6">
              <Link to="/" className="hover:text-[#fffaf2] transition-colors">{t('common.home', '首頁')}</Link>
              <ChevronRight size={12} />
              <span className="text-[#f4ecdf]">{t('faq.breadcrumb', '常見問題')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-light tracking-wide">{t('faq.title', '常見問題')}</h1>
            <p className="mt-4 text-[#f4ecdf] max-w-2xl font-light leading-relaxed text-base">
              {t('faq.description', '這裡整理了會員、訂單、配送、付款與商品相關的常見疑問。')}
            </p>
          </div>
        </section>

        <div className="container mx-auto px-6 py-12 max-w-4xl">
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9f8a7b] w-5 h-5" />
            <input
              type="text"
              placeholder={t('faq.search', '搜尋問題...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-[#fffaf2] border border-[#eadfd1] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#cfa87a] text-[#2b221d] placeholder-[#d8c9ba]"
            />
          </div>

          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-10">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                    activeCategory === cat
                      ? 'bg-[#2b221d] text-[#fffaf2] shadow-sm'
                      : 'bg-[#fffaf2] text-[#6d4f3d] border border-[#eadfd1] hover:border-[#cfa87a] hover:text-[#2b221d]'
                  }`}
                >
                  {categoryLabel(cat)}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#8e6448] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-[#9f8a7b] font-light text-lg">{t('faq.empty', '沒有找到符合的問題。')}</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setActiveCategory('all');
                }}
                className="mt-4 text-sm text-[#8e6448] hover:underline"
              >
                {t('faq.reset', '重設篩選')}
              </button>
            </div>
          )}

          {!loading && Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-10">
              {activeCategory === 'all' && (
                <h2 className="text-sm font-medium tracking-widest text-[#9f8a7b] uppercase mb-4 flex items-center gap-3">
                  <span className="w-8 h-px bg-[#cfa87a]" />
                  {categoryLabel(category)}
                </h2>
              )}

              <div className="space-y-3">
                {items.map((faq) => {
                  const open = openId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className="bg-[#fffaf2] rounded-2xl border border-[#eadfd1] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                    >
                      <button
                        onClick={() => setOpenId((prev) => (prev === faq.id ? null : faq.id))}
                        className="w-full flex items-start justify-between gap-4 p-6 text-left"
                      >
                        <span className="font-medium text-[#2b221d] leading-snug">{faq.question}</span>
                        <span className="flex-shrink-0 text-[#9f8a7b] mt-0.5">
                          {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </span>
                      </button>

                      {open && (
                        <div className="px-6 pb-6 pt-0">
                          <div className="border-t border-[#eadfd1] pt-5">
                            <p className="text-[#6d4f3d] font-light leading-relaxed whitespace-pre-line">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-16 bg-[#f4ecdf] border border-[#eadfd1] rounded-2xl p-8 text-center">
            <h3 className="text-lg font-medium text-[#2b221d] mb-2">{t('faq.cta.title', '還有其他問題嗎？')}</h3>
            <p className="text-[#6d4f3d] font-light mb-6">{t('faq.cta.description', '如果這裡沒有找到答案，歡迎直接聯絡我們。')}</p>
            <a
              href="mailto:info@coffeehouse.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#8e6448] text-[#fffaf2] rounded-full hover:bg-[#6d4f3d] transition-colors text-sm"
            >
              {t('faq.cta.button', '聯絡我們')}
              <ChevronRight size={16} />
            </a>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
