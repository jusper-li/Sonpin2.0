import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://xtsyvjmrdludqoywjwgi.supabase.co';
export const supabaseBaseUrl = import.meta.env.DEV
  ? (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL)
  : DEFAULT_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseBaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseBaseUrl, supabaseAnonKey);

const isExplicitlyDisabled = (value: unknown) => {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'false' || normalized === '0' || normalized === 'off' || normalized === 'disabled';
};

export const isSupabaseContentEnabled = import.meta.env.VITE_ENABLE_SUPABASE_CONTENT === 'true';
export const isSupabaseAdminAuthEnabled = import.meta.env.VITE_ENABLE_SUPABASE_ADMIN_AUTH === 'true';
export const isSupabaseAiEnabled = !isExplicitlyDisabled(import.meta.env.VITE_ENABLE_SUPABASE_AI);

export const isMissingSupabaseTableError = (error: unknown) => {
  const maybeError = error as { code?: string; status?: number; message?: string } | null;
  const message = maybeError?.message || '';

  return (
    maybeError?.code === 'PGRST205' ||
    maybeError?.status === 404 ||
    message.includes('Could not find the table') ||
    message.includes('schema cache')
  );
};

export const isMissingSupabaseRpcError = (error: unknown) => {
  const maybeError = error as { code?: string; status?: number; message?: string } | null;
  const message = maybeError?.message || '';

  return (
    maybeError?.code === 'PGRST202' ||
    maybeError?.status === 404 ||
    message.includes('Could not find the function') ||
    message.includes('function may not exist') ||
    message.includes('schema cache')
  );
};

export const isSupabaseNetworkError = (error: unknown) => {
  const maybeError = error as { message?: string; details?: string; code?: string } | null;
  const text = `${maybeError?.message || ''} ${maybeError?.details || ''} ${maybeError?.code || ''}`;

  return (
    text.includes('Failed to fetch') ||
    text.includes('NetworkError') ||
    text.includes('Request timed out') ||
    text.includes('Load failed')
  );
};

let supabaseOfflineUntil = 0;

export const isSupabaseTemporarilyOffline = () => Date.now() < supabaseOfflineUntil;

export const markSupabaseTemporarilyOffline = (durationMs = 60_000) => {
  supabaseOfflineUntil = Date.now() + durationMs;
};
