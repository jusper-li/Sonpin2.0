import { SERVICE_SHARE_DETAILS as FALLBACK_SERVICE_SHARE_DETAILS, SERVICE_SHARES as FALLBACK_SERVICE_SHARES, type ServiceShare, type ServiceShareDetail } from '../data/serviceContent';
import { isSupabaseContentEnabled, supabase } from './supabase';

export const SERVICE_CONTENT_SETTING_KEY = 'service_content';

export type ServiceContentPayload = {
  shares: ServiceShare[];
  details: Record<string, ServiceShareDetail>;
  updated_at: string;
};

export type ServiceContentSource = 'supabase' | 'fallback';

export type LoadedServiceContent = {
  content: ServiceContentPayload;
  source: ServiceContentSource;
};

const cloneShare = (item: ServiceShare): ServiceShare => ({ ...item });
const cloneDetail = (item: ServiceShareDetail): ServiceShareDetail => ({ ...item, paragraphs: [...item.paragraphs] });

export const getFallbackServiceContent = (): ServiceContentPayload => ({
  shares: FALLBACK_SERVICE_SHARES.map(cloneShare),
  details: Object.fromEntries(Object.entries(FALLBACK_SERVICE_SHARE_DETAILS).map(([slug, detail]) => [slug, cloneDetail(detail)])),
  updated_at: new Date().toISOString(),
});

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string');

const tryParseJson = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const normalizeShare = (value: unknown): ServiceShare | null => {
  if (!isRecord(value)) return null;
  if (typeof value.slug !== 'string' || typeof value.title !== 'string' || typeof value.image !== 'string' || typeof value.excerpt !== 'string') {
    return null;
  }

  return {
    slug: value.slug,
    title: value.title,
    image: value.image,
    excerpt: value.excerpt,
  };
};

const normalizeDetail = (value: unknown): ServiceShareDetail | null => {
  if (!isRecord(value)) return null;
  if (
    typeof value.title !== 'string' ||
    typeof value.image !== 'string' ||
    typeof value.banner !== 'string' ||
    typeof value.storeName !== 'string' ||
    typeof value.phone !== 'string' ||
    typeof value.address !== 'string' ||
    !isStringArray(value.paragraphs)
  ) {
    return null;
  }

  return {
    title: value.title,
    image: value.image,
    banner: value.banner,
    storeName: value.storeName,
    phone: value.phone,
    address: value.address,
    paragraphs: [...value.paragraphs],
  };
};

export const normalizeServiceContent = (value: unknown): ServiceContentPayload | null => {
  const payload = typeof value === 'string' ? tryParseJson(value) : value;
  if (!isRecord(payload)) return null;

  const shares = Array.isArray(payload.shares) ? payload.shares.map(normalizeShare).filter(Boolean) as ServiceShare[] : [];
  if (shares.length === 0) return null;

  const details = isRecord(payload.details)
    ? Object.fromEntries(
        Object.entries(payload.details)
          .map(([slug, detail]) => [slug, normalizeDetail(detail)])
          .filter((entry): entry is [string, ServiceShareDetail] => Boolean(entry[1]))
      )
    : {};

  return {
    shares,
    details,
    updated_at: typeof payload.updated_at === 'string' ? payload.updated_at : new Date().toISOString(),
  };
};

export const loadServiceContent = async (): Promise<LoadedServiceContent> => {
  if (!isSupabaseContentEnabled) {
    return { content: getFallbackServiceContent(), source: 'fallback' };
  }

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', SERVICE_CONTENT_SETTING_KEY)
      .limit(1);

    if (error) throw error;

    const normalized = normalizeServiceContent(data?.[0]?.setting_value);
    if (normalized) {
      return { content: normalized, source: 'supabase' };
    }
  } catch (error) {
    console.error('Failed to load service content:', error);
  }

  return { content: getFallbackServiceContent(), source: 'fallback' };
};

export const saveServiceContent = async (content: ServiceContentPayload) => {
  const { error } = await supabase.from('site_settings').upsert(
    {
      setting_key: SERVICE_CONTENT_SETTING_KEY,
      setting_value: content,
    },
    { onConflict: 'setting_key' }
  );

  if (error) throw error;
};
