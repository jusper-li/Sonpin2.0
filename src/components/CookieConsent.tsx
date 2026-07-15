import { useEffect, useState } from 'react';
import { Check, Settings2, ShieldCheck, X } from 'lucide-react';
import {
  COOKIE_CONSENT_OPEN_EVENT,
  applyCookieConsent,
  getCookieConsent,
  saveCookieConsent,
  type CookieConsentInput,
} from '../lib/cookieConsent';
import { useLanguage } from '../contexts/LanguageContext';

type ConsentState = {
  analytics: boolean;
  marketing: boolean;
};

const DEFAULT_STATE: ConsentState = {
  analytics: false,
  marketing: false,
};

export default function CookieConsent() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [state, setState] = useState<ConsentState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = getCookieConsent();
    if (current) {
      applyCookieConsent(current);
      setState({ analytics: current.analytics, marketing: current.marketing });
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      const current = getCookieConsent();
      if (current) {
        setState({ analytics: current.analytics, marketing: current.marketing });
      }
      setShowDetails(true);
      setIsOpen(true);
    };

    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, handleOpen);
  }, []);

  const close = () => {
    setIsOpen(false);
    setShowDetails(false);
  };

  const persist = (preferences: CookieConsentInput) => {
    saveCookieConsent(preferences);
    close();
  };

  const acceptNecessaryOnly = () => {
    persist({ necessary: true, analytics: false, marketing: false });
  };

  const saveCurrent = () => {
    persist({ necessary: true, analytics: state.analytics, marketing: state.marketing });
  };

  const acceptAll = () => {
    persist({ necessary: true, analytics: true, marketing: true });
  };

  if (!ready || !isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-2xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] shadow-[0_24px_70px_-30px_rgba(41,37,36,0.35)]">
        <div className="flex items-start gap-4 border-b border-[var(--sonpin-primary-border)] px-5 py-4">
          <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--sonpin-background)] text-[var(--sonpin-primary)]">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#2b221d]">{t('cookie.title', 'Cookie 與隱私偏好')}</p>
                <p className="mt-1 text-sm leading-6 text-[var(--sonpin-primary-soft)]">
                  {t(
                    'cookie.description',
                    '我們使用必要 Cookie 來維持網站運作，並可依你的選擇啟用分析與行銷用途。',
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={close}
                className="rounded-full p-1 text-[var(--sonpin-primary-muted)] transition-colors hover:bg-[var(--sonpin-background)] hover:text-[#2b221d]"
                aria-label={t('cookie.close', '關閉')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <button
            type="button"
            onClick={() => setShowDetails((value) => !value)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--sonpin-primary)] transition-colors hover:text-[var(--sonpin-primary-soft)]"
          >
            <Settings2 className="h-4 w-4" />
            {showDetails ? t('cookie.hide_details', '收起設定') : t('cookie.show_details', '調整 Cookie 設定')}
          </button>

          {showDetails && (
            <div className="mt-4 grid gap-3 rounded-xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-background)] p-4 sm:grid-cols-2">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="mt-1 h-4 w-4 rounded border-[var(--sonpin-primary-border)] text-[var(--sonpin-primary)] focus:ring-[var(--sonpin-primary-warm)]"
                />
                <span>
                  <span className="block text-sm font-medium text-[#2b221d]">
                    {t('cookie.necessary.title', '必要 Cookie')}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-[var(--sonpin-primary-soft)]">
                    {t('cookie.necessary.description', '這些 Cookie 是網站基本運作所必需。')}
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={state.analytics}
                  onChange={(event) => setState((current) => ({ ...current, analytics: event.target.checked }))}
                  className="mt-1 h-4 w-4 rounded border-[var(--sonpin-primary-border)] text-[var(--sonpin-primary)] focus:ring-[var(--sonpin-primary-warm)]"
                />
                <span>
                  <span className="block text-sm font-medium text-[#2b221d]">
                    {t('cookie.analytics.title', '分析 Cookie')}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-[var(--sonpin-primary-soft)]">
                    {t('cookie.analytics.description', '幫助我們了解網站使用情況並持續改進。')}
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={state.marketing}
                  onChange={(event) => setState((current) => ({ ...current, marketing: event.target.checked }))}
                  className="mt-1 h-4 w-4 rounded border-[var(--sonpin-primary-border)] text-[var(--sonpin-primary)] focus:ring-[var(--sonpin-primary-warm)]"
                />
                <span>
                  <span className="block text-sm font-medium text-[#2b221d]">
                    {t('cookie.marketing.title', '行銷 Cookie')}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-[var(--sonpin-primary-soft)]">
                    {t('cookie.marketing.description', '用於個人化內容與廣告投放。')}
                  </span>
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-[var(--sonpin-primary-border)] bg-[var(--sonpin-background)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 tracking-[0.08em] text-[var(--sonpin-primary-muted)]">
            {t('cookie.footer', '你可以隨時重新調整 Cookie 設定，變更會立即生效。')}
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={acceptNecessaryOnly}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--sonpin-primary-border)] px-4 py-2 text-sm font-medium text-[var(--sonpin-primary-soft)] transition-colors hover:border-[var(--sonpin-primary-warm)] hover:text-[#2b221d]"
            >
              <Check className="h-4 w-4" />
              {t('cookie.necessary_only', '只接受必要')}
            </button>
            <button
              type="button"
              onClick={saveCurrent}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--sonpin-primary)] px-4 py-2 text-sm font-medium text-[var(--sonpin-primary)] transition-colors hover:bg-[var(--sonpin-primary)] hover:text-[var(--sonpin-surface)]"
            >
              <Settings2 className="h-4 w-4" />
              {t('cookie.save', '儲存設定')}
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2b221d] px-4 py-2 text-sm font-medium text-[var(--sonpin-surface)] transition-colors hover:bg-[var(--sonpin-primary)]"
            >
              <ShieldCheck className="h-4 w-4" />
              {t('cookie.accept_all', '全部接受')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
