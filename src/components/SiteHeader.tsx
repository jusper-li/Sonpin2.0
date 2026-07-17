import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, Globe, ChevronRight, CircleUser as UserCircle, Facebook, Instagram, Twitter, Youtube, MessageCircle, ExternalLink } from 'lucide-react';
import { isMissingSupabaseTableError, isSupabaseContentEnabled, isSupabaseNetworkError, supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useMemberAuth } from '../contexts/MemberAuthContext';
import { DEFAULT_FOOTER_SETTINGS, DEFAULT_HEADER_SETTINGS } from '../data/homepageContent';
import { normalizeLang } from '../lib/language';
import { subscribeLayoutSettingsSync } from '../lib/layoutSettingsSync';

interface NavItem {
  label: string;
  href: string;
}

interface HeaderSettings {
  logo_text: string;
  logo_image: string;
  navigation: NavItem[];
  show_cart: boolean;
  show_language_selector: boolean;
}

interface FooterLink {
  label: string;
  href: string;
}

interface LinkGroup {
  title: string;
  links: FooterLink[];
}

interface FooterSettings {
  link_groups: LinkGroup[];
  contact_email?: string;
  contact_phone?: string;
}

interface Social {
  id: string;
  platform: string;
  username: string;
  url: string;
  is_active: boolean;
}

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  x: Twitter,
  youtube: Youtube,
  line: MessageCircle,
  Facebook,
  Instagram,
  Twitter,
  YouTube: Youtube,
  Youtube,
};

const normalizeMenuHref = (href: string) => {
  const value = href.trim();
  if (!value || value === '/') return value || '';
  if (value.startsWith('#')) return value.toLowerCase();
  return value.replace(/\/+$/, '').toLowerCase();
};

const hasRenderableName = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /[\p{Letter}\p{Number}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(trimmed);
};

const getDisplayNameFallback = (email?: string | null) => {
  const localPart = (email || '').split('@')[0].trim();
  return localPart || '訪客';
};

export default function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [settings, setSettings] = useState<HeaderSettings>(DEFAULT_HEADER_SETTINGS);
  const [footerSettings, setFooterSettings] = useState<FooterSettings>({
    link_groups: DEFAULT_FOOTER_SETTINGS.link_groups,
  });
  const [socials, setSocials] = useState<Social[]>([]);
  const { itemCount } = useCart();
  const { currentLanguage, languages, setLanguage, t } = useLanguage();
  const { user, profile } = useMemberAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const memberInitial = profile?.display_name
    ? profile.display_name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || null;
  const rawDisplayName = profile?.display_name?.trim() || '';
  const displayName = hasRenderableName(rawDisplayName)
    ? rawDisplayName
    : getDisplayNameFallback(user?.email);
  const normalizedLanguage = normalizeLang(currentLanguage);
  const isHomepage = location.pathname === '/';
  const isSolidHeader = scrolled || isMenuOpen || !isHomepage;
  const primaryNavigation = settings.navigation.filter((item) => item.label.trim() && item.href.trim());
  const isActiveMenuItem = (href: string) => {
    const target = normalizeMenuHref(href);
    const current = normalizeMenuHref(location.pathname);
    return target === '/' ? location.pathname === '/' : target === current;
  };

  useEffect(() => {
    loadSettings();
    loadFooterSettings();
    loadSocials();
  }, []);

  useEffect(() => {
    return subscribeLayoutSettingsSync((payload) => {
      if (payload.scope === 'header' || payload.scope === 'both') {
        void loadSettings();
      }
      if (payload.scope === 'footer' || payload.scope === 'both') {
        void loadFooterSettings();
      }
    });
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const loadSettings = async () => {
    if (!isSupabaseContentEnabled) return;

    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'header')
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setSettings(data.setting_value as HeaderSettings);
      }
    } catch (error) {
      if (isMissingSupabaseTableError(error) || isSupabaseNetworkError(error)) return;
      console.error('Failed to load header settings:', error);
    }
  };

  const loadFooterSettings = async () => {
    if (!isSupabaseContentEnabled) return;

    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'footer')
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setFooterSettings(data.setting_value as FooterSettings);
      }
    } catch (error) {
      if (isMissingSupabaseTableError(error) || isSupabaseNetworkError(error)) return;
      console.error('Failed to load footer settings:', error);
    }
  };

  const loadSocials = async () => {
    if (!isSupabaseContentEnabled) return;

    try {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('is_active', true)
        .order('platform');
      if (error) throw error;
      setSocials(data || []);
    } catch (error) {
      if (isMissingSupabaseTableError(error) || isSupabaseNetworkError(error)) return;
      console.error('Failed to load social accounts:', error);
    }
  };

  const handleNavigation = (href: string) => {
    setIsMenuOpen(false);
    setShowLanguageMenu(false);
    if (href.startsWith('#')) {
      if (window.location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const element = document.querySelector(href);
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const element = document.querySelector(href);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(href);
    }
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md transition-all duration-500 ${isSolidHeader ? 'bg-[var(--sonpin-background)]/96 shadow-[0_1px_30px_rgba(61,43,31,0.08)] border-b border-[var(--sonpin-primary-border)]/90' : 'bg-transparent'}`}>
        <nav className="container mx-auto px-5 py-2 md:py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="group relative block flex-shrink-0" aria-label="前往 Sonpin 首頁">
              {settings.logo_image ? (
                <img
                  src={settings.logo_image}
                  alt={settings.logo_text}
                  className="h-11 md:h-16 object-contain transition-all duration-300 group-hover:scale-105"
                />
              ) : (
                <span className="flex flex-col">
                  <span className={`text-xl md:text-3xl font-semibold tracking-wider transition-all duration-300 ${isSolidHeader ? 'text-[var(--sonpin-ink)] group-hover:text-[var(--sonpin-primary)]' : 'text-white group-hover:text-white/90'}`}>
                    {settings.logo_text.split(' ')[0] || '淞品'}
                  </span>
                  <span className={`text-[9px] md:text-xs tracking-[0.3em] uppercase transition-colors duration-300 ${isSolidHeader ? 'text-[var(--sonpin-primary)] group-hover:text-[var(--sonpin-primary)]' : 'text-white/70 group-hover:text-white/60'}`}>
                    {settings.logo_text.split(' ').slice(1).join(' ') || '淞品土雞專賣店'}
                  </span>
                </span>
              )}
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              {primaryNavigation.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleNavigation(item.href)}
                  className={`relative text-xs font-medium tracking-[0.12em] uppercase transition-all duration-300 group py-2 ${isSolidHeader ? 'text-[var(--sonpin-primary)] hover:text-[var(--sonpin-ink)]' : 'text-white/80 hover:text-white'}`}
                >
                  <span className="relative z-10">{item.label}</span>
                  <span className={`absolute -bottom-0.5 left-0 w-0 h-px transition-all duration-400 group-hover:w-full ${isSolidHeader ? 'bg-[var(--sonpin-primary)]' : 'bg-[var(--sonpin-surface)]/60'}`}></span>
                </button>
              ))}

              <Link
                to={user ? '/member/profile' : '/member'}
                className={`relative p-2.5 transition-all duration-300 group ${isSolidHeader ? 'text-[var(--sonpin-primary)] hover:text-[var(--sonpin-ink)]' : 'text-white/70 hover:text-white'}`}
                title={user ? '會員專區' : '登入 / 註冊會員'}
              >
                {memberInitial ? (
                  <span className="w-5 h-5 flex items-center justify-center bg-[var(--sonpin-ink)] text-[var(--sonpin-surface)] text-xs font-medium">
                    {memberInitial}
                  </span>
                ) : (
                  <UserCircle className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                )}
              </Link>

              {settings.show_cart && (
                <Link
                  to="/cart"
                className={`relative p-2.5 transition-all duration-300 group ${isSolidHeader ? 'text-[var(--sonpin-primary)] hover:text-[var(--sonpin-ink)]' : 'text-white/70 hover:text-white'}`}
                >
                  <ShoppingCart className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[var(--sonpin-ink)] text-[var(--sonpin-surface)] text-[10px] w-4 h-4 flex items-center justify-center font-medium shadow-sm">
                      {itemCount}
                    </span>
                  )}
                </Link>
              )}

              {settings.show_language_selector && (
                <div className="relative">
                  <button
                    onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium tracking-[0.1em] uppercase transition-all duration-300 group ${isSolidHeader ? 'text-[var(--sonpin-primary)] hover:text-[var(--sonpin-ink)]' : 'mix-blend-difference border border-white/35 bg-transparent text-white hover:border-white/55 hover:text-white'}`}
                  >
                    <Globe className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
                    <span>{normalizedLanguage === 'zh-TW' ? 'ZH' : normalizedLanguage.toUpperCase()}</span>
                  </button>

                  {showLanguageMenu && (
                    <div className={`ym-language-menu absolute top-full right-0 mt-3 backdrop-blur-xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.08)] min-w-[140px] border ${isSolidHeader ? 'bg-[var(--sonpin-surface)] border-[var(--sonpin-primary-border)]' : 'bg-[var(--sonpin-surface)]/10 border-[var(--sonpin-primary-border)]'}`}>
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => { setLanguage(lang.code); setShowLanguageMenu(false); }}
                          className={`block w-full text-left px-4 py-3 text-xs tracking-[0.1em] uppercase transition-all duration-200 ${
                            isSolidHeader
                            ? normalizeLang(lang.code) === normalizedLanguage
                                ? 'bg-[var(--sonpin-surface)] text-[var(--sonpin-ink)] font-medium'
                                : 'text-[var(--sonpin-primary)] hover:bg-[var(--sonpin-surface)] hover:text-[var(--sonpin-ink)]'
                              : normalizeLang(lang.code) === normalizedLanguage
                                ? 'bg-gradient-to-r from-[var(--sonpin-primary)]/30 to-[var(--sonpin-surface)]/20 text-white font-medium'
                                : 'text-white/70 hover:bg-[var(--sonpin-surface)]/10 hover:text-white'
                          }`}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="md:hidden flex items-center gap-1">
              <Link
                to={user ? '/member/profile' : '/member'}
                className={`relative p-2 transition-all duration-200 ${isSolidHeader ? 'text-[var(--sonpin-primary)] hover:text-[var(--sonpin-ink)]' : 'text-white/70 hover:text-white'}`}
                aria-label={user ? t('header.member_center', '會員專區') : t('header.login_join', '登入 / 註冊會員')}
              >
                {memberInitial ? (
                  <span className="w-6 h-6 flex items-center justify-center bg-[var(--sonpin-ink)] text-[var(--sonpin-surface)] text-xs font-medium">
                    {memberInitial}
                  </span>
                ) : (
                  <UserCircle className="w-5 h-5" />
                )}
              </Link>

              {settings.show_cart && (
                <Link
                  to="/cart"
                  className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 ${isSolidHeader ? 'border-transparent text-[var(--sonpin-primary)] hover:text-[var(--sonpin-ink)] hover:bg-[var(--sonpin-background)]' : 'border-white/15 bg-white/5 text-white/90 hover:bg-white/10 hover:text-white'}`}
                aria-label={t('header.view_cart', '查看購物車')}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[var(--sonpin-ink)] text-[var(--sonpin-surface)] text-[10px] w-4 h-4 flex items-center justify-center font-medium">
                      {itemCount}
                    </span>
                  )}
                </Link>
              )}

              {settings.show_language_selector && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                    className={`relative inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-2 transition-all duration-200 ${isSolidHeader ? 'border-white/30 bg-transparent text-[var(--sonpin-ink)] backdrop-blur-[1px] hover:border-[var(--sonpin-primary)] hover:text-[var(--sonpin-primary)]' : 'mix-blend-difference border-white/35 bg-transparent text-white hover:border-white/55 hover:text-white'}`}
                    aria-label="切換語言"
                    aria-expanded={showLanguageMenu}
                  >
                    <Globe className="w-4 h-4" />
                    <span className="ml-1 text-[10px] font-medium tracking-[0.12em]">
                      {normalizedLanguage === 'zh-TW' ? 'ZH' : normalizedLanguage.toUpperCase()}
                    </span>
                  </button>

                  {showLanguageMenu && (
                    <div className="ym-language-menu absolute right-0 top-full z-[70] mt-2 min-w-[140px] overflow-hidden border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] shadow-[0_8px_24px_rgba(43,34,29,0.12)]">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => { setLanguage(lang.code); setShowLanguageMenu(false); }}
                          className={`block w-full px-4 py-3 text-left text-xs tracking-[0.1em] uppercase transition-colors ${
                            normalizeLang(lang.code) === normalizedLanguage
                              ? 'bg-[var(--sonpin-background)] text-[var(--sonpin-ink)] font-medium'
                              : 'text-[var(--sonpin-primary)] hover:bg-[var(--sonpin-surface)] hover:text-[var(--sonpin-ink)]'
                          }`}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                className={`p-2 transition-all duration-200 ${isSolidHeader ? 'text-[var(--sonpin-primary)] hover:text-[var(--sonpin-ink)]' : 'text-white/70 hover:text-white'}`}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? '關閉選單' : '開啟選單'}
                aria-expanded={isMenuOpen}
              >
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <span className={`absolute transition-all duration-300 ${isMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}`}>
                    <X size={19} />
                  </span>
                  <span className={`absolute transition-all duration-300 ${isMenuOpen ? 'opacity-0 -rotate-90' : 'opacity-100 rotate-0'}`}>
                    <Menu size={19} />
                  </span>
                </div>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile backdrop */}
      <div
        className={`md:hidden fixed inset-0 z-[54] bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile full-width slide menu from left, white bg */}
      <div className={`md:hidden fixed top-0 left-0 bottom-0 z-[55] w-full bg-[var(--sonpin-surface)] shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        isMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--sonpin-primary-border)]">
            <Link to="/" onClick={() => setIsMenuOpen(false)}>
              <img src="/LOGO-1.png" alt="logo" className="h-12" />
            </Link>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 text-[var(--sonpin-primary)] hover:text-[var(--sonpin-primary)] hover:bg-[var(--sonpin-background)] rounded-full transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* Member section */}
          <div className="px-6 pt-5 pb-2">
            {user ? (
              <Link
                to="/member/profile"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 bg-[var(--sonpin-surface)] border border-[var(--sonpin-primary-border)] hover:bg-[var(--sonpin-background)] hover:border-[var(--sonpin-primary-border)] transition-all group"
              >
                <div className="w-9 h-9 bg-[var(--sonpin-ink)] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-medium">{memberInitial}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--sonpin-ink)] truncate">{displayName}</p>
                  <p className="text-xs text-[var(--sonpin-primary)] truncate">{user.email}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--sonpin-primary-border)] group-hover:text-[var(--sonpin-primary)] transition-colors" />
              </Link>
            ) : (
              <Link
                to="/member"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 bg-[var(--sonpin-surface)] border border-[var(--sonpin-primary-border)] hover:bg-[var(--sonpin-background)] transition-all group"
              >
                  <UserCircle className="w-5 h-5 text-[var(--sonpin-primary)]" />
                <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--sonpin-ink)]">{t('header.login_join', '登入 / 註冊會員')}</p>
                    <p className="text-xs text-[var(--sonpin-primary)]">{t('header.login_join_sub', '請先登入會員帳號，才能查看會員專區內容。')}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--sonpin-primary-border)] group-hover:text-[var(--sonpin-primary)] transition-colors" />
              </Link>
            )}
          </div>

          {/* Scrollable nav area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
            <div className="mb-4">
                <p className="text-[10px] tracking-[0.35em] text-[var(--sonpin-primary)] uppercase mb-2 px-1">{t('header.primary_menu', '主選單')}</p>
              <nav className="space-y-0.5">
                {primaryNavigation.map((item, index) => {
                  const isActive = isActiveMenuItem(item.href);
                  return (
                  <button
                    key={`${item.href}-${index}`}
                    onClick={() => handleNavigation(item.href)}
                    className={`w-full flex items-center justify-between px-3 py-3 text-sm hover:text-[var(--sonpin-ink)] hover:bg-[var(--sonpin-surface)] active:bg-[var(--sonpin-background)] transition-all duration-200 group text-left tracking-wide ${
                      isActive ? 'text-[var(--sonpin-ink)] bg-[var(--sonpin-surface)] font-medium' : 'text-[var(--sonpin-primary)]'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-[var(--sonpin-primary-border)] group-hover:text-[var(--sonpin-primary)] group-hover:translate-x-0.5 transition-all" />
                  </button>
                  );
                })}
              </nav>
            </div>

            {/* Footer link groups */}
            {footerSettings.link_groups.map((group, index) => (
              <div key={index} className="mb-4">
              <p className="text-[10px] tracking-[0.35em] text-[var(--sonpin-primary)] uppercase mb-2 px-1">{group.title}</p>
                <nav className="space-y-0.5">
                  {group.links.map((link, linkIndex) => {
                    const isActive = isActiveMenuItem(link.href);
                    return (
                    <button
                      key={linkIndex}
                      onClick={() => handleNavigation(link.href)}
                      className={`w-full flex items-center justify-between px-3 py-3 text-sm hover:text-[var(--sonpin-ink)] hover:bg-[var(--sonpin-surface)] active:bg-[var(--sonpin-background)] transition-all duration-200 group text-left tracking-wide ${
                        isActive ? 'text-[var(--sonpin-ink)] bg-[var(--sonpin-surface)] font-medium' : 'text-[var(--sonpin-primary)]'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span>{link.label}</span>
                    <ChevronRight className="w-4 h-4 text-[var(--sonpin-primary-border)] group-hover:text-[var(--sonpin-primary)] group-hover:translate-x-0.5 transition-all" />
                    </button>
                    );
                  })}
                </nav>
              </div>
            ))}

          </div>

          {/* Bottom: Social + Language + Copyright */}
          <div className="px-6 pt-4 pb-6 border-t border-[var(--sonpin-primary-border)] space-y-4">

            {/* Social links */}
            {socials.length > 0 && (
              <div>
                  <p className="text-[10px] tracking-[0.35em] text-[var(--sonpin-primary)] uppercase mb-3">{t('header.follow_us', '追蹤我們')}</p>
                <div className="flex items-center gap-3">
                  {socials.map((social) => {
                    const Icon = PLATFORM_ICONS[social.platform] || ExternalLink;
                    return (
                      <a
                        key={social.id}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-9 h-9 bg-transparent text-[var(--sonpin-primary)] hover:text-[var(--sonpin-ink)] border border-[var(--sonpin-primary-border)] hover:border-[var(--sonpin-primary)] transition-all duration-200 active:scale-95"
                        title={social.platform}
                      >
                        <Icon className="w-[18px] h-[18px]" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Language selector */}
            {settings.show_language_selector && languages.length > 0 && (
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-[var(--sonpin-primary)]" />
                <div className="flex gap-1.5">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setLanguage(lang.code); setIsMenuOpen(false); }}
                      className={`px-3 py-1 text-xs font-medium tracking-[0.1em] transition-all duration-200 border ${
                        normalizeLang(lang.code) === normalizedLanguage
                          ? 'bg-[var(--sonpin-ink)] text-[var(--sonpin-surface)] border-[var(--sonpin-ink)]'
                          : 'bg-transparent text-[var(--sonpin-primary)] hover:text-[var(--sonpin-ink)] border-[var(--sonpin-primary-border)] hover:border-[var(--sonpin-primary)]'
                      }`}
                    >
                      {lang.code.split('-')[0].toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[10px] text-[var(--sonpin-primary-border)] tracking-widest">© Sonpin</p>
          </div>
        </div>
      </div>
    </>
  );
}




