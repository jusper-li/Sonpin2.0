import { useState } from 'react';
import { Eye, EyeOff, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Login() {
  const { t } = useLanguage();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('k286336@gmail.com');
  const [password, setPassword] = useState('888888');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.login.error.default', '登入失敗，請稍後再試。'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,var(--sonpin-background)_0%,var(--sonpin-background)_55%,var(--sonpin-background)_100%)] p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] p-8 shadow-[0_24px_60px_rgba(61,43,31,0.12)]">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--sonpin-ink)] shadow-lg">
              <ShieldCheck className="h-8 w-8 text-[var(--sonpin-surface)]" />
            </div>
            <h1 className="text-3xl font-bold text-stone-800">{t('admin.login.title', '後台管理登入')}</h1>
            <p className="mt-2 leading-relaxed text-stone-500">
              {t('admin.login.description', '使用管理員帳號與密碼登入後台。')}
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {t('admin.login.email', '管理員帳號')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] py-3 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-[var(--sonpin-primary)]"
                  placeholder="k286336@gmail.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {t('admin.login.password', '密碼')}
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] py-3 pl-10 pr-12 focus:border-transparent focus:ring-2 focus:ring-[var(--sonpin-primary)]"
                  placeholder="888888"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-[var(--sonpin-ink)] py-3 font-medium text-[var(--sonpin-surface)] transition-colors hover:bg-[var(--sonpin-primary-soft)] disabled:cursor-not-allowed disabled:bg-[var(--sonpin-primary-border)]"
            >
              {isSubmitting ? t('admin.login.sending', '登入中...') : t('admin.login.sendCode', '登入後台')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
