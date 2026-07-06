import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Clock, MapPin, Phone } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
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
  name: string;
  city: string;
  phone: string;
  address: string;
  hours?: string;
  image?: string;
  images?: string[];
  email?: string | null;
};

const formatOpeningHours = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string').join('\n');
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => {
        if (typeof item === 'string') return `${key}：${item}`;
        if (Array.isArray(item)) return `${key}：${item.filter((entry) => typeof entry === 'string').join('、')}`;
        return `${key}：${String(item ?? '')}`;
      })
      .join('\n');
  }
  return '';
};

const normalizeStore = (row: StoreRow): StoreView => ({
  name: row.name,
  city: row.city,
  phone: row.phone,
  address: row.address,
  hours: formatOpeningHours(row.opening_hours),
  images: Array.isArray(row.images) ? row.images.filter((item): item is string => typeof item === 'string') : [],
  email: row.email,
});

export default function StorePage() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: '門市資訊',
    description: '淞品土雞門市據點、聯絡方式與營業時間。',
    keywords: '門市資訊,淞品土雞,門市,營業時間,聯絡方式',
    schema: [
      localBusinessSchema(),
      breadcrumbSchema([
        { name: '首頁', url: window.location.origin },
        { name: '門市資訊', url: `${window.location.origin}/store` },
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

  const normalizedStores = useMemo(() => stores.map(normalizeStore), [stores]);

  const northStores = useMemo<StoreView[]>(
    () => normalizedStores.filter((store) => store.city !== 'factory'),
    [normalizedStores],
  );

  const factoryStores = useMemo<StoreView[]>(
    () => normalizedStores.filter((store) => store.city === 'factory'),
    [normalizedStores],
  );

  if (loading) {
    return <div className="min-h-screen bg-[#fbf6ee] p-6 text-stone-500">載入中...</div>;
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
              <span className="text-stone-700">門市資訊</span>
            </nav>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[#8e6448]/80">Stores</p>
            <h1 className="max-w-3xl text-4xl font-light leading-tight tracking-[0.16em] text-stone-900 md:text-6xl">
              門市資訊
            </h1>
            <p className="mt-7 max-w-2xl text-sm font-light leading-8 text-stone-500">
              查看淞品土雞各門市據點、電話、地址與營業時間。
            </p>
          </div>
        </section>

        <section className="container mx-auto px-6 py-10">
          {normalizedStores.length === 0 ? (
            <div className="rounded-3xl border border-[#eadfd1] bg-[#fffaf2] p-10 text-center text-stone-500">
              目前沒有可顯示的門市資料。
            </div>
          ) : (
            <>
              {northStores.length > 0 && (
                <div className="mb-10">
                  <div className="mb-4 inline-flex rounded-full border border-[#eadfd1] bg-[#fffaf2] px-3 py-1 text-[11px] tracking-[0.18em] text-[#8e6448]">
                    門市
                  </div>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {northStores.map((store) => (
                      <article key={store.name} className="overflow-hidden rounded-3xl border border-[#eadfd1] bg-[#fffaf2] shadow-sm">
                        <div className="aspect-[4/3] overflow-hidden bg-stone-100">
                          <img
                            src={store.image || store.images?.[0] || ''}
                            alt={store.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-6">
                          <h2 className="text-xl font-medium text-[#2b221d]">{store.name}</h2>
                          <p className="mt-2 text-sm text-[#9f8a7b]">{store.city}</p>
                          <div className="mt-5 space-y-3 text-sm text-[#6d4f3d]">
                            <p className="flex items-start gap-3">
                              <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#8e6448]" />
                              <span>{store.phone}</span>
                            </p>
                            <p className="flex items-start gap-3">
                              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#8e6448]" />
                              <span>{store.address}</span>
                            </p>
                            {store.hours && (
                              <p className="flex items-start gap-3">
                                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#8e6448]" />
                                <span className="whitespace-pre-line">{store.hours}</span>
                              </p>
                            )}
                            {store.email && <p className="text-sm text-[#9f8a7b]">{store.email}</p>}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {factoryStores.length > 0 && (
                <div className="space-y-6">
                  <div className="inline-flex rounded-full border border-[#eadfd1] bg-[#fffaf2] px-3 py-1 text-[11px] tracking-[0.18em] text-[#8e6448]">
                    中央工廠
                  </div>
                  {factoryStores.map((store) => (
                    <article key={`${store.name}-${store.address}`} className="overflow-hidden rounded-3xl border border-[#eadfd1] bg-[#fffaf2] shadow-sm">
                      <div className="grid gap-6 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
                        <div>
                          <h2 className="text-xl font-medium text-[#2b221d]">{store.name}</h2>
                          <div className="mt-5 space-y-3 text-sm text-[#6d4f3d]">
                            <p className="flex items-start gap-3">
                              <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#8e6448]" />
                              <span>{store.phone}</span>
                            </p>
                            <p className="flex items-start gap-3">
                              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#8e6448]" />
                              <span>{store.address}</span>
                            </p>
                            {store.hours && (
                              <p className="flex items-start gap-3">
                                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#8e6448]" />
                                <span className="whitespace-pre-line">{store.hours}</span>
                              </p>
                            )}
                            {store.email && <p className="text-sm text-[#9f8a7b]">{store.email}</p>}
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {(store.images || []).slice(0, 4).map((image) => (
                            <img
                              key={image}
                              src={image}
                              alt={store.name}
                              className="h-full w-full rounded-2xl object-cover"
                              loading="lazy"
                            />
                          ))}
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
