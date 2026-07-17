import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Facebook, Globe, Instagram, Youtube, Mail, Settings } from 'lucide-react';
import { isMissingSupabaseTableError, isSupabaseContentEnabled, isSupabaseNetworkError, supabase } from '../lib/supabase';
import { DEFAULT_FOOTER_SETTINGS } from '../data/homepageContent';
import { openCookieConsentSettings } from '../lib/cookieConsent';
import { useLanguage } from '../contexts/LanguageContext';
import { subscribeLayoutSettingsSync } from '../lib/layoutSettingsSync';

interface FooterLink {
  label: string;
  href: string;
}

interface LinkGroup {
  title: string;
  links: FooterLink[];
}

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  youtube?: string;
}

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  url: string;
  is_active: boolean;
}

interface FooterSettings {
  about_text: string;
  contact_email: string;
  contact_phone: string;
  social_links: SocialLinks;
  copyright_text: string;
  link_groups: LinkGroup[];
}

const SOCIAL_ICON_MAP: Record<string, any> = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  line: Globe,
  twitter: Globe,
};

const normalizePlatform = (value: string) => value.trim().toLowerCase();

const normalizeMenuHref = (href: string) => href.trim().replace(/\/+$/, '').toLowerCase();

export default function SiteFooter() {
  const [settings, setSettings] = useState<FooterSettings>(DEFAULT_FOOTER_SETTINGS);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    loadSettings();
    loadSocialAccounts();
  }, []);

  useEffect(() => {
    return subscribeLayoutSettingsSync((payload) => {
      if (payload.scope === 'footer' || payload.scope === 'both') {
        void loadSettings();
      }
    });
  }, []);

  const loadSettings = async () => {
    if (!isSupabaseContentEnabled) return;

    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'footer')
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings(data.setting_value as FooterSettings);
      }
    } catch (error) {
      if (isMissingSupabaseTableError(error) || isSupabaseNetworkError(error)) return;
      console.error('Failed to load footer settings:', error);
    }
  };

  const loadSocialAccounts = async () => {
    if (!isSupabaseContentEnabled) return;

    try {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('id, platform, username, url, is_active');

      if (error) throw error;
      setSocialAccounts(
        ((data || []) as SocialAccount[]).sort((a, b) => a.platform.localeCompare(b.platform, 'zh-Hant')),
      );
    } catch (error) {
      if (isMissingSupabaseTableError(error) || isSupabaseNetworkError(error)) return;
      console.error('Failed to load social accounts:', error);
    }
  };

  const handleNavigation = (href: string) => {
    if (href.startsWith('#')) {
      if (window.location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const element = document.querySelector(href);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      navigate(href);
    }
  };

  const socialLinks = socialAccounts.length
    ? socialAccounts.filter((item) => item.is_active && item.url.trim() && item.platform.trim().toLowerCase() !== 'youtube')
    : ([
        settings.social_links.instagram && {
          platform: 'Instagram',
          url: settings.social_links.instagram,
        },
        settings.social_links.facebook && {
          platform: 'Facebook',
          url: settings.social_links.facebook,
        },
      ].filter(Boolean) as Array<{ platform: string; url: string }>);

  const renderedLinkGroups = settings.link_groups;
  const footerLinkHrefSet = new Set(
    renderedLinkGroups.flatMap((group) => group.links).map((link) => normalizeMenuHref(link.href)),
  );
  const shouldRenderLegalLinks = !footerLinkHrefSet.has('/returns') || !footerLinkHrefSet.has('/privacy');

  return (
    <footer className="bg-[var(--sonpin-background)] text-stone-700 w-full">
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--sonpin-primary)]/50 to-transparent" />

      <div className="w-full max-w-7xl mx-auto px-6 pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-14">
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-7 group">
              <img
                src="/LOGO-1.png"
                alt="You And Me Coffee"
                className="block h-auto w-full max-w-[240px] object-contain transition-all duration-500 group-hover:opacity-70"
              />
            </Link>
            <p className="text-sm text-stone-500 font-light leading-loose max-w-xs mb-8 tracking-wide">
              {t('footer.about', settings.about_text)}
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((item) => {
                const Icon = SOCIAL_ICON_MAP[normalizePlatform(item.platform)] || Globe;

                return (
                  <a
                    key={`${item.platform}-${item.url}`}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 flex items-center justify-center border border-[var(--sonpin-primary-border)] text-stone-400 hover:border-[var(--sonpin-primary)] hover:text-[var(--sonpin-primary)] transition-all duration-300 hover:-translate-y-0.5"
                    aria-label={item.platform}
                  >
                    <Icon size={16} />
                  </a>
                );
              })}
              {settings.contact_email && (
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="w-9 h-9 flex items-center justify-center border border-[var(--sonpin-primary-border)] text-stone-400 hover:border-[var(--sonpin-primary)] hover:text-[var(--sonpin-primary)] transition-all duration-300 hover:-translate-y-0.5"
                  aria-label="Email"
                >
                  <Mail size={16} />
                </a>
              )}
            </div>
          </div>

          {renderedLinkGroups.map((group, index) => (
            <div key={index}>
              <h3 className="text-[10px] font-medium tracking-[0.3em] uppercase text-[var(--sonpin-primary)]/90 mb-6">
                {t(`footer.group_title.${index}`, group.title)}
              </h3>
              <ul className="flex flex-col gap-3.5">
                {group.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <button
                      onClick={() => handleNavigation(link.href)}
                      className="text-sm text-stone-500 hover:text-stone-800 transition-all duration-300 font-light inline-block hover:translate-x-1 tracking-wide"
                    >
                      {t(`footer.link.${link.href}`, link.label)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--sonpin-primary-border)] mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-stone-400 font-light tracking-[0.1em]">
            {t('footer.copyright', settings.copyright_text)}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {shouldRenderLegalLinks && (
              <>
                {!footerLinkHrefSet.has('/privacy') && (
                  <Link
                    to="/privacy"
                    className="text-xs text-stone-400 hover:text-stone-700 transition-colors duration-300 font-light tracking-wide"
                  >
                    {t('footer.privacy', '隱私權政策')}
                  </Link>
                )}
                {!footerLinkHrefSet.has('/returns') && (
                  <Link
                    to="/returns"
                    className="text-xs text-stone-400 hover:text-stone-700 transition-colors duration-300 font-light tracking-wide"
                  >
                    {t('footer.returns', '退換貨政策')}
                  </Link>
                )}
              </>
            )}
            <button
              type="button"
              onClick={openCookieConsentSettings}
              className="text-xs text-stone-400 hover:text-stone-700 transition-colors duration-300 font-light tracking-wide"
            >
              {t('footer.cookie', 'Cookie 設定')}
            </button>
            <Link
              to="/backoffice"
              className="flex items-center justify-center text-stone-300 hover:text-stone-600 transition-all duration-300 group"
              title={t('footer.backoffice', '後台管理')}
            >
              <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}



