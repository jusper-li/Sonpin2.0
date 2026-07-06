import { useEffect } from 'react';
import { supabase, isMissingSupabaseTableError, isSupabaseNetworkError } from '../lib/supabase';

interface GoogleAnalyticsSetting {
  enabled?: boolean;
  measurement_id?: string;
}

const GOOGLE_ANALYTICS_SETTING_KEY = 'google_analytics';
const DEFAULT_GOOGLE_ANALYTICS = {
  enabled: true,
  measurement_id: 'G-JVFN8M2DXT',
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export default function GoogleAnalytics() {
  useEffect(() => {
    let cancelled = false;

    const injectAnalytics = (setting: GoogleAnalyticsSetting) => {
      const measurementId = String(setting.measurement_id || '').trim();

      if (!setting.enabled || !measurementId || document.querySelector(`script[data-sonpin-ga="${measurementId}"]`)) {
        return;
      }

      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer?.push(args);
      };

      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      script.dataset.sonpinGa = measurementId;
      document.head.appendChild(script);

      const inline = document.createElement('script');
      inline.dataset.sonpinGa = measurementId;
      inline.text = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){window.dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', '${measurementId}');
      `;
      document.head.appendChild(inline);
    };

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', GOOGLE_ANALYTICS_SETTING_KEY)
          .maybeSingle();

        if (error) throw error;
        if (cancelled) return;

        injectAnalytics((data?.setting_value || DEFAULT_GOOGLE_ANALYTICS) as GoogleAnalyticsSetting);
      } catch (error) {
        if (cancelled) return;
        injectAnalytics(DEFAULT_GOOGLE_ANALYTICS);
        if (!isMissingSupabaseTableError(error) && !isSupabaseNetworkError(error)) {
          console.warn('Failed to load Google Analytics setting:', error);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
