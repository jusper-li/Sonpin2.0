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

type StoreGroup = 'north' | 'factory';

type StoreView = {
  name: string;
  phone: string;
  address: string;
  hours?: string;
  image?: string;
  images?: string[];
};

const FALLBACK_NORTH_STORES: StoreView[] = [
  {
    name: '松品永和門市',
    phone: '02-8021-1072',
    address: '新北市永和區中和路509號',
    hours: '09:00~19:00（每週一公休，年節除外，售完為止）',
    image: '/sonpin-images/176658686210.jpg',
  },
  {
    name: '松品新店門市',
    phone: '02-29111398',
    address: '新北市新店區中正路246號',
    hours: '08:00-18:00（每週一公休，年節除外，售完為止）',
    image: '/sonpin-images/154079895498.jpg',
  },
];

const FALLBACK_FACTORY_IMAGES = ['/sonpin-images/153285065447.jpg', '/sonpin-images/153285183849.jpg'];

const formatOpeningHours = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string').join('\n');
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    return entries
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
  phone: row.phone,
  address: row.address,
  hours: formatOpeningHours(row.opening_hours),
  images: Array.isArray(row.images) ? row.images.filter((item): item is string => typeof item === 'string') : [],
});

export default function StorePage() {
  const [activeTab, setActiveTab] = useState<StoreGroup>('north');
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: '店頭資訊',
    description: '淞品土雞各門市資訊、電話、地址與營業時間。',
    keywords: '店頭資訊,門市,淞品土雞,電話,地址,營業時間',
    schema: [
      localBusinessSchema(),
      breadcrumbSchema([
        { name: '首頁', url: window.location.origin },
        { name: '店頭資訊', url: `${window.location.origin}/store` },
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
          console.warn('Using fallback store data:', error);
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

  const northStores = useMemo<StoreView[]>(() => {
    if (normalizedStores.length === 0) return FALLBACK_NORTH_STORES;
    return normalizedStores.filter((_, index) => {
      const source = stores[index];
      const city = (source?.city || '').trim();
      return city !== 'factory' && city !== '工廠';
    });
  }, [normalizedStores, stores]);

  const factoryStores = useMemo<StoreView[]>(() => {
    if (normalizedStores.length === 0) {
      return [
        {
          name: '淞品中央工廠',
          phone: '02-2338-0018',
          address: '淞品中央工廠',
          hours: '週一至週五 09:00 - 18:00',
          images: FALLBACK_FACTORY_IMAGES,
        },
      ];
    }

    return normalizedStores
      .map((store, index) => ({ store, source: stores[index] }))
      .filter(({ source }) => {
        const city = (source?.city || '').trim();
        return city === 'factory' || city === '工廠';
      })
      .map(({ store }) => ({
        name: store.name,
        phone: store.phone,
        address: store.address,
        hours: store.hours,
        images: store.images && store.images.length > 0 ? store.images : FALLBACK_FACTORY_IMAGES,
      }));
  }, [normalizedStores, stores]);

  if (loading) {
    return <div className="min-h-screen bg-[#fbf6ee] p-6 text-stone-500">門市資料載入中...</div>;
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
              <span className="text-stone-700">店頭資訊</span>
            </nav>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[#8e6448]/80">Stores</p>
            <h1 className="max-w-3xl text-4xl font-light leading-tight tracking-[0.16em] text-stone-900 md:text-6xl">
              店頭資訊
            </h1>
            <p className="mt-7 max-w-2xl text-sm font-light leading-8 text-stone-500">
              淞品土雞各門市與工廠資訊，方便您快速找到最近的服務據點。
            </p>
          </div>
        </section>

        <section className="container mx-auto px-6 py-10">
          <div className="mb-8 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('north')}
              className={`border px-4 py-2 text-xs tracking-[0.16em] transition-all ${
                activeTab === 'north'
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-200 text-stone-500 hover:border-stone-700 hover:text-stone-900'
              }`}
            >
              北部
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('factory')}
              className={`border px-4 py-2 text-xs tracking-[0.16em] transition-all ${
                activeTab === 'factory'
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-200 text-stone-500 hover:border-stone-700 hover:text-stone-900'
              }`}
            >
              工廠
            </button>
          </div>

          {activeTab === 'north' ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {northStores.map((store) => (
                <article key={store.name} className="overflow-hidden rounded-3xl border border-[#eadfd1] bg-[#fffaf2] shadow-sm">
                  <div className="aspect-[4/3] overflow-hidden bg-stone-100">
                    <img src={store.image || store.images?.[0] || ''} alt={store.name} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="p-6">
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
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
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
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(store.images || []).slice(0, 4).map((image) => (
                        <img key={image} src={image} alt={store.name} className="h-full w-full rounded-2xl object-cover" loading="lazy" />
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <DeferredSiteFooter />
    </div>
  );
}
