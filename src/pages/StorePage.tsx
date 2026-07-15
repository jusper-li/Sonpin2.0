import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Clock, MapPin, Phone } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import { useLanguage } from '../contexts/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import { breadcrumbSchema, localBusinessSchema } from '../utils/schemaMarkup';
import { isMissingSupabaseTableError, isSupabaseContentEnabled, isSupabaseNetworkError, supabase } from '../lib/supabase';

type StoreRow = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string | null;
  opening_hours: unknown;
  is_active: boolean;
  location: unknown;
  images: string[];
};

type StoreView = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  openingHours: string;
  email: string | null;
  images: string[];
};

const formatOpeningHours = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string').join('\n');
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => {
        if (typeof item === 'string') return `${key}: ${item}`;
        if (Array.isArray(item)) return `${key}: ${item.filter((entry) => typeof entry === 'string').join(', ')}`;
        return `${key}: ${String(item ?? '')}`;
      })
      .join('\n');
  }
  return '';
};

const sortStores = (items: StoreView[]) =>
  [...items].sort((a, b) => {
    const aCity = a.city.localeCompare(b.city, 'zh-Hant');
    if (aCity !== 0) return aCity;
    return a.name.localeCompare(b.name, 'zh-Hant');
  });

const StoreImage = ({ src, alt }: { src?: string; alt: string }) => {
  if (!src) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-[var(--sonpin-background)] to-[var(--sonpin-primary-border)]">
        <MapPin className="h-12 w-12 text-[var(--sonpin-primary)]/70" />
      </div>
    );
  }

  return (
    <div className="aspect-[4/3] overflow-hidden bg-stone-100">
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={(event) => {
          event.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};

export default function StorePage() {
  const { t } = useLanguage();
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: t('store.seo.title', '門市資訊'),
    description: t('store.seo.description', '查看淞品土雞各門市據點、電話、地址與營業時間。'),
    keywords: t('store.seo.keywords', '門市資訊,門市據點,營業時間,電話'),
    schema: [
      localBusinessSchema(),
      breadcrumbSchema([
        { name: t('common.home', '首頁'), url: window.location.origin },
        { name: t('store.breadcrumb', '門市資訊'), url: `${window.location.origin}/store` },
      ]),
    ],
  });

  useEffect(() => {
    let cancelled = false;

    const loadStores = async () => {
      if (!isSupabaseContentEnabled) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('stores')
          .select('id, name, city, address, phone, email, opening_hours, is_active, location, images')
          .eq('is_active', true)
          .order('city', { ascending: true })
          .order('name', { ascending: true });

        if (error) throw error;
        if (cancelled) return;

        setStores((data || []) as StoreRow[]);
      } catch (error) {
        if (!isMissingSupabaseTableError(error) && !isSupabaseNetworkError(error)) {
          console.warn('Failed to load store data:', error);
        }
        setStores([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadStores();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedStores = useMemo<StoreView[]>(
    () =>
      stores.map((row) => ({
        id: row.id,
        name: row.name,
        city: row.city,
        address: row.address,
        phone: row.phone,
        openingHours: formatOpeningHours(row.opening_hours),
        images: Array.isArray(row.images) ? row.images.filter((item): item is string => typeof item === 'string') : [],
        email: row.email,
      })),
    [stores],
  );

  const northStores = useMemo<StoreView[]>(
    () => sortStores(normalizedStores.filter((store) => store.city !== 'factory')),
    [normalizedStores],
  );
  const factoryStores = useMemo<StoreView[]>(
    () => normalizedStores.filter((store) => store.city === 'factory'),
    [normalizedStores],
  );

  if (loading) {
    return <div className="min-h-screen bg-[var(--sonpin-background)] p-6 text-stone-500">{t('store.loading', '門市資訊載入中...')}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--sonpin-background)] text-stone-800">
      <SiteHeader />

      <main className="flex-1 pt-20">
        <section className="border-b border-[var(--sonpin-primary-border)] bg-[linear-gradient(135deg,var(--sonpin-background)_0%,var(--sonpin-background)_44%,var(--sonpin-surface)_100%)]">
          <div className="container mx-auto px-6 py-16 md:py-24">
            <nav className="mb-8 flex items-center gap-2 text-xs tracking-[0.18em] text-stone-400">
              <Link to="/" className="transition-colors hover:text-stone-700">
                {t('common.home', '首頁')}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-stone-700">{t('store.breadcrumb', '門市資訊')}</span>
            </nav>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[var(--sonpin-primary)]/80">
              {t('store.kicker', 'Stores')}
            </p>
            <h1 className="max-w-3xl text-4xl font-light leading-tight tracking-[0.16em] text-stone-900 md:text-6xl">
              {t('store.title', '門市資訊')}
            </h1>
            <p className="mt-7 max-w-2xl text-sm font-light leading-8 text-stone-500">
              {t('store.description', '查看淞品土雞各門市據點、電話、地址與營業時間。')}
            </p>
          </div>
        </section>

        <section className="container mx-auto px-6 py-10">
          {normalizedStores.length === 0 ? (
            <div className="rounded-3xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] p-10 text-center text-stone-500">
              {t('store.empty', '目前沒有門市資料。')}
            </div>
          ) : (
            <>
              {northStores.length > 0 && (
                <div className="mb-10">
                  <div className="mb-4 inline-flex rounded-full border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] px-3 py-1 text-[11px] tracking-[0.18em] text-[var(--sonpin-primary)]">
                    {t('store.section.branches', '門市')}
                  </div>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {northStores.map((store) => (
                      <article key={store.id} className="overflow-hidden rounded-3xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] shadow-sm">
                        <StoreImage src={store.images[0]} alt={t(`store.items.${store.id}.name`, store.name)} />
                        <div className="p-6">
                          <h2 className="text-xl font-medium text-[#2b221d]">{t(`store.items.${store.id}.name`, store.name)}</h2>
                          <p className="mt-2 text-sm text-[var(--sonpin-primary-muted)]">
                            {store.city === 'factory' ? t('store.section.factory', '工廠') : t(`store.city.${store.city}`, store.city)}
                          </p>
                          <div className="mt-5 space-y-3 text-sm text-[var(--sonpin-primary-soft)]">
                            <p className="flex items-start gap-3">
                              <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--sonpin-primary)]" />
                              <span>{store.phone}</span>
                            </p>
                            <p className="flex items-start gap-3">
                              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--sonpin-primary)]" />
                              <span>{t(`store.items.${store.id}.address`, store.address)}</span>
                            </p>
                            {store.openingHours && (
                              <p className="flex items-start gap-3">
                                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--sonpin-primary)]" />
                                <span className="whitespace-pre-line">{t(`store.items.${store.id}.openingHours`, store.openingHours)}</span>
                              </p>
                            )}
                            {store.email && <p className="text-sm text-[var(--sonpin-primary-muted)]">{store.email}</p>}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {factoryStores.length > 0 && (
                <div className="space-y-6">
                  <div className="inline-flex rounded-full border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] px-3 py-1 text-[11px] tracking-[0.18em] text-[var(--sonpin-primary)]">
                    {t('store.section.factory', '工廠')}
                  </div>
                  {factoryStores.map((store) => (
                    <article key={store.id} className="overflow-hidden rounded-3xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] shadow-sm">
                      <div className="grid gap-6 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
                        <div>
                          <h2 className="text-xl font-medium text-[#2b221d]">{t(`store.items.${store.id}.name`, store.name)}</h2>
                          <div className="mt-5 space-y-3 text-sm text-[var(--sonpin-primary-soft)]">
                            <p className="flex items-start gap-3">
                              <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--sonpin-primary)]" />
                              <span>{store.phone}</span>
                            </p>
                            <p className="flex items-start gap-3">
                              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--sonpin-primary)]" />
                              <span>{t(`store.items.${store.id}.address`, store.address)}</span>
                            </p>
                            {store.openingHours && (
                              <p className="flex items-start gap-3">
                                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--sonpin-primary)]" />
                                <span className="whitespace-pre-line">{t(`store.items.${store.id}.openingHours`, store.openingHours)}</span>
                              </p>
                            )}
                            {store.email && <p className="text-sm text-[var(--sonpin-primary-muted)]">{store.email}</p>}
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {store.images.length > 0 ? (
                            store.images.slice(0, 4).map((image) => (
                              <img
                                key={image}
                                src={image}
                                alt={t(`store.items.${store.id}.name`, store.name)}
                                className="h-full w-full rounded-2xl object-cover"
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.style.display = 'none';
                                }}
                              />
                            ))
                          ) : (
                            <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--sonpin-background)] to-[var(--sonpin-primary-border)]">
                              <MapPin className="h-10 w-10 text-[var(--sonpin-primary)]/70" />
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <DeferredSiteFooter />
    </div>
  );
}
