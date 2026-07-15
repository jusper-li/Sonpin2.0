import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { isMissingSupabaseTableError, isSupabaseContentEnabled, supabase } from '../lib/supabase';
import {
  applyThemePalette,
  DEFAULT_THEME_SETTINGS,
  normalizeThemeSettings,
  resolveThemePalette,
  THEME_COLOR_CACHE_KEY,
  THEME_COLORS_SETTING_KEY,
} from '../data/themeSettings';

type ThemeSettingsRow = {
  setting_value: unknown;
};

export default function ThemeBootstrap() {
  const location = useLocation();
  const [settings, setSettings] = useState(DEFAULT_THEME_SETTINGS);

  useEffect(() => {
    const cached = window.localStorage.getItem(THEME_COLOR_CACHE_KEY);
    if (cached) {
      try {
        const parsed = normalizeThemeSettings(JSON.parse(cached));
        setSettings(parsed);
        applyThemePalette(resolveThemePalette(parsed, location.pathname));
      } catch {
        window.localStorage.removeItem(THEME_COLOR_CACHE_KEY);
        setSettings(DEFAULT_THEME_SETTINGS);
        applyThemePalette(resolveThemePalette(DEFAULT_THEME_SETTINGS, location.pathname));
      }
    } else {
      setSettings(DEFAULT_THEME_SETTINGS);
      applyThemePalette(resolveThemePalette(DEFAULT_THEME_SETTINGS, location.pathname));
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!isSupabaseContentEnabled) return;

    let cancelled = false;

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', THEME_COLORS_SETTING_KEY)
          .maybeSingle();

        if (error) throw error;
        if (cancelled) return;

        const row = data as ThemeSettingsRow | null;
        const nextSettings = normalizeThemeSettings(row?.setting_value);
        setSettings(nextSettings);
        window.localStorage.setItem(THEME_COLOR_CACHE_KEY, JSON.stringify(nextSettings));
        applyThemePalette(resolveThemePalette(nextSettings, location.pathname));
      } catch (error) {
        if (!isMissingSupabaseTableError(error)) {
          console.error('Failed to load theme settings:', error);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  useEffect(() => {
    applyThemePalette(resolveThemePalette(settings, location.pathname));
  }, [location.pathname, settings]);

  return null;
}
