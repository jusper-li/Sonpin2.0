import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, ChevronUp, Search } from 'lucide-react';
import { isSupabaseContentEnabled, supabase } from '../lib/supabase';
import SiteHeader from '../components/SiteHeader';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
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
  shipping: 'faq.category.shipping',
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
    description: t('faq.seo.description', '整理淞品土雞常見的訂購、付款、配送與門市相關問題。'),
    keywords: t('faq.seo.keywords', 'FAQ,常見問題,訂購,配送,付款'),
    schema:
      faqs.length > 0
        ? [
            faqPageSchema(faqs.map((f) => ({ question: f.question, answer: f.answer }))),
            breadcrumbSchema([
              { name: t('common.home', '首頁'), url: window.location.origin },
              { name: t('faq.breadcrumb', '常見問題'), url: `${window.location.origin}/faq` },
            ]),
          ]
        : undefined,
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
    <div className="flex min-h-screen flex-col bg-[var(--sonpin-background)]">
      <SiteHeader />

      <main className="flex-1 pt-24">
        <section className="bg-gradient-to-br from-[var(--sonpin-ink)] via-[var(--sonpin-primary-soft)] to-[var(--sonpin-primary)] py-20 text-[var(--sonpin-surface)]">
          <div className="container mx-auto px-6">
            <div className="mb-6 flex items-center gap-2 text-xs tracking-[0.1em] text-[var(--sonpin-primary-border)]">
              <Link to="/" className="transition-colors hover:text-[var(--sonpin-surface)]">
                {t('common.home', '首頁')}
              </Link>
              <ChevronRight size={12} />
              <span className="text-[var(--sonpin-background)]">{t('faq.breadcrumb', '常見問題')}</span>
            </div>
            <h1 className="text-4xl font-light tracking-wide md:text-5xl">
              {t('faq.title', '常見問題')}
            </h1>
            <p className="mt-4 max-w-2xl text-base font-light leading-relaxed text-[var(--sonpin-background)]">
              {t('faq.description', '整理訂購、付款、配送、門市與產品相關的常見問題。')}
            </p>
          </div>
        </section>

        <div className="container mx-auto max-w-4xl px-6 py-12">
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--sonpin-primary-muted)]" />
            <input
              type="text"
              placeholder={t('faq.search', '搜尋問題...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] py-4 pl-12 pr-4 text-[var(--sonpin-ink)] placeholder-[var(--sonpin-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--sonpin-primary-warm)]"
            />
          </div>

          {categories.length > 1 && (
            <div className="mb-10 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 ${
                    activeCategory === cat
                      ? 'bg-[var(--sonpin-ink)] text-[var(--sonpin-surface)] shadow-sm'
                      : 'border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] text-[var(--sonpin-primary-soft)] hover:border-[var(--sonpin-primary-warm)] hover:text-[var(--sonpin-ink)]'
                  }`}
                >
                  {categoryLabel(cat)}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--sonpin-primary)] border-t-transparent" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-lg font-light text-[var(--sonpin-primary-muted)]">
                {t('faq.empty', '目前沒有符合條件的問題。')}
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setActiveCategory('all');
                }}
                className="mt-4 text-sm text-[var(--sonpin-primary)] hover:underline"
              >
                {t('faq.reset', '清除篩選條件')}
              </button>
            </div>
          )}

          {!loading &&
            Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="mb-10">
                {activeCategory === 'all' && (
                  <h2 className="mb-4 flex items-center gap-3 text-sm font-medium uppercase tracking-widest text-[var(--sonpin-primary-muted)]">
                    <span className="h-px w-8 bg-[var(--sonpin-primary-warm)]" />
                    {categoryLabel(category)}
                  </h2>
                )}

                <div className="space-y-3">
                  {items.map((faq) => {
                    const open = openId === faq.id;
                    return (
                      <div
                        key={faq.id}
                        className="overflow-hidden rounded-2xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] shadow-sm transition-shadow duration-300 hover:shadow-md"
                      >
                        <button
                          onClick={() => setOpenId((prev) => (prev === faq.id ? null : faq.id))}
                          className="flex w-full items-start justify-between gap-4 p-6 text-left"
                        >
                          <span className="font-medium leading-snug text-[var(--sonpin-ink)]">{faq.question}</span>
                          <span className="mt-0.5 flex-shrink-0 text-[var(--sonpin-primary-muted)]">
                            {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </span>
                        </button>

                        {open && (
                          <div className="px-6 pb-6 pt-0">
                            <div className="border-t border-[var(--sonpin-primary-border)] pt-5">
                              <p className="whitespace-pre-line leading-relaxed font-light text-[var(--sonpin-primary-soft)]">
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

          <div className="mt-16 rounded-3xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] px-6 py-8 shadow-sm">
            <h3 className="mb-2 text-lg font-medium text-[var(--sonpin-ink)]">
              {t('faq.cta.title', '找不到答案嗎？')}
            </h3>
            <p className="mb-6 font-light text-[var(--sonpin-primary-soft)]">
              {t('faq.cta.description', '可以直接聯絡客服，我們會協助您確認訂購、配送或門市資訊。')}
            </p>
            <a
              href="mailto:service@sonpin.tw"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--sonpin-primary)] px-6 py-3 text-sm text-[var(--sonpin-surface)] transition-colors hover:bg-[var(--sonpin-primary-soft)]"
            >
              {t('faq.cta.button', '聯絡客服')}
              <ChevronRight size={16} />
            </a>
          </div>
        </div>
      </main>

      <DeferredSiteFooter />
    </div>
  );
}
