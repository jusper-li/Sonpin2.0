import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BadgeInfo, Send } from 'lucide-react';
import { supabaseAnonKey, supabaseBaseUrl } from '../lib/supabase';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import SiteHeader from '../components/SiteHeader';
import { REMITTANCE_INFO } from '../data/remittanceInfo';

export default function RemittanceNotice() {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order_number') || '');
  const [remittanceAmount, setRemittanceAmount] = useState('');
  const [remitterAccountLast5, setRemitterAccountLast5] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    document.title = '匯款通知｜淞品土雞專賣店';
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setSuccess(false);
    setErrorMessage('');

    try {
      const response = await fetch(`${supabaseBaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          authorization: `Bearer ${supabaseAnonKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          type: 'remittance_notification',
          data: {
            orderNumber: orderNumber.trim(),
            remittanceAmount: Number(remittanceAmount),
            remitterAccountLast5: remitterAccountLast5.trim(),
          },
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.error) {
        throw new Error(payload?.message || payload?.error || '送出失敗');
      }

      setSuccess(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '送出失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <SiteHeader />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex items-center gap-3 text-sm text-stone-500">
              <Link to="/checkout/result" className="inline-flex items-center gap-2 transition-colors hover:text-stone-700">
                <ArrowLeft className="h-4 w-4" />
                回到訂單完成頁
              </Link>
              <span className="text-stone-300">/</span>
              <span>匯款通知</span>
            </div>

            <section className="overflow-hidden rounded-3xl border border-[var(--sonpin-primary-border)] bg-white shadow-sm">
              <div className="border-b border-[var(--sonpin-primary-border)] bg-[linear-gradient(135deg,var(--sonpin-background)_0%,var(--sonpin-surface)_100%)] px-6 py-8 md:px-8">
                <p className="mb-2 text-xs tracking-[0.28em] text-[var(--sonpin-primary)] uppercase">Remittance Notice</p>
                <h1 className="text-3xl font-light tracking-[0.08em] text-stone-800 md:text-4xl">匯款通知</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-500">
                  請輸入訂單編號、匯款金額，以及匯款帳號後 5 碼，系統會自動通知管理員並寄送確認信給您。
                </p>
              </div>

              <div className="grid gap-8 px-6 py-8 md:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
                <section className="space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] p-6">
                    <div>
                      <label className="mb-2 block text-xs tracking-[0.18em] text-stone-500 uppercase">訂單編號</label>
                      <input
                        type="text"
                        value={orderNumber}
                        onChange={(event) => setOrderNumber(event.target.value)}
                        placeholder="例如：ORD-1784014376030"
                        className="w-full rounded-xl border border-[var(--sonpin-primary-border)] bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-[var(--sonpin-primary)] focus:ring-2 focus:ring-[var(--sonpin-primary-border)]/50"
                        required
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs tracking-[0.18em] text-stone-500 uppercase">匯款金額</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={remittanceAmount}
                          onChange={(event) => setRemittanceAmount(event.target.value)}
                          placeholder="例如：950"
                          className="w-full rounded-xl border border-[var(--sonpin-primary-border)] bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-[var(--sonpin-primary)] focus:ring-2 focus:ring-[var(--sonpin-primary-border)]/50"
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs tracking-[0.18em] text-stone-500 uppercase">匯款帳號後 5 碼</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={5}
                          value={remitterAccountLast5}
                          onChange={(event) => setRemitterAccountLast5(event.target.value.replace(/\D/g, '').slice(0, 5))}
                          placeholder="例如：12345"
                          className="w-full rounded-xl border border-[var(--sonpin-primary-border)] bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-[var(--sonpin-primary)] focus:ring-2 focus:ring-[var(--sonpin-primary-border)]/50"
                          required
                        />
                      </div>
                    </div>

                    {errorMessage && (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-700">
                        {errorMessage}
                      </div>
                    )}

                    {success && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-700">
                        已送出匯款通知，我們會盡快確認並更新訂單狀態。
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--sonpin-ink)] px-5 py-3 text-sm font-medium tracking-[0.14em] text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          送出中...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          送出匯款通知
                        </>
                      )}
                    </button>
                  </form>
                </section>

                <aside className="space-y-6">
                  <section className="rounded-2xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-background)]/70 p-6">
                    <p className="text-xs tracking-[0.2em] text-[var(--sonpin-primary)] uppercase">匯款資訊</p>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-600">
                      <li>銀行：{REMITTANCE_INFO.bankName}</li>
                      <li>銀行代碼：{REMITTANCE_INFO.bankCode}</li>
                      <li>帳號：{REMITTANCE_INFO.accountNumber}</li>
                      <li>戶名：{REMITTANCE_INFO.accountName}</li>
                    </ul>
                  </section>

                  <section className="rounded-2xl border border-[var(--sonpin-primary-border)] bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <BadgeInfo className="h-4 w-4 text-[var(--sonpin-primary)]" />
                      <h3 className="text-base font-semibold text-stone-900">提醒</h3>
                    </div>
                    <p className="text-sm leading-7 text-stone-600">
                      送出匯款通知後，後台會自動留下紀錄並寄信通知管理員與您，方便快速核對訂單。
                    </p>
                  </section>
                </aside>
              </div>
            </section>
          </div>
        </div>
      </main>
      <DeferredSiteFooter />
    </div>
  );
}
