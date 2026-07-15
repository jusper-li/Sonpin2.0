import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BadgeInfo, CalendarDays, CheckCircle2, Clock3, Search, ShieldCheck, Truck } from 'lucide-react';
import { supabaseAnonKey, supabaseBaseUrl } from '../lib/supabase';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import SiteHeader from '../components/SiteHeader';
import { REMITTANCE_INFO } from '../data/remittanceInfo';

type OrderItem = {
  product_name: string;
  quantity: number;
  price: number;
  total: number;
};

type OrderLookupResult = {
  id: string;
  order_number: string;
  status: string | null;
  payment_status: string | null;
  subtotal: number | null;
  shipping: number | null;
  total: number | null;
  shipping_method: string | null;
  shipping_status: string | null;
  delivery_status: string | null;
  tracking_number: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  notes: string | null;
  created_at: string | null;
  completed_at: string | null;
};

const formatCurrency = (amount: number) => `NT$ ${Number(amount || 0).toLocaleString('zh-TW')}`;

const paymentStatusLabel: Record<string, string> = {
  paid: '已付款',
  pending: '待付款',
  unpaid: '未付款',
  failed: '付款失敗',
};

const orderStatusLabel: Record<string, string> = {
  pending: '待處理',
  processing: '處理中',
  completed: '已完成',
  cancelled: '已取消',
};

const shippingStatusLabel: Record<string, string> = {
  ready_to_ship: '備貨中',
  shipped: '已出貨',
  delivered: '已送達',
  returned: '已退回',
};

const shippingTone = (value?: string | null) => {
  const normalized = (value || '').toLowerCase();
  if (normalized === 'paid' || normalized === 'completed' || normalized === 'shipped' || normalized === 'delivered') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (normalized === 'failed' || normalized === 'cancelled' || normalized === 'returned') {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }
  return 'border-amber-200 bg-amber-50 text-amber-700';
};

export default function OrderInquiry() {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order_number') || '');
  const [verifier, setVerifier] = useState(searchParams.get('contact') || '');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<{
    order: OrderLookupResult;
    items: OrderItem[];
  } | null>(null);

  useEffect(() => {
    document.title = '訂單查詢｜淞品土雞專賣店';
  }, []);

  const subtotal = Number(result?.order.subtotal || 0);
  const shipping = Number(result?.order.shipping || 0);
  const total = Number(result?.order.total ?? subtotal + shipping);

  const canSearch = useMemo(
    () => orderNumber.trim().length > 0 && verifier.trim().length > 0,
    [orderNumber, verifier],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setResult(null);

    try {
      const response = await fetch(`${supabaseBaseUrl}/functions/v1/order-lookup`, {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          authorization: `Bearer ${supabaseAnonKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          orderNumber,
          verifier,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || '查詢失敗');
      }

      setResult(payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '查詢失敗，請稍後再試');
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
              <Link to="/" className="inline-flex items-center gap-2 transition-colors hover:text-stone-700">
                <ArrowLeft className="h-4 w-4" />
                返回首頁
              </Link>
              <span className="text-stone-300">/</span>
              <span>訂單查詢</span>
            </div>

            <section className="overflow-hidden rounded-3xl border border-[var(--sonpin-primary-border)] bg-white shadow-sm">
              <div className="border-b border-[var(--sonpin-primary-border)] bg-[linear-gradient(135deg,var(--sonpin-background)_0%,var(--sonpin-surface)_100%)] px-6 py-8 md:px-8">
                <p className="mb-2 text-xs tracking-[0.28em] text-[var(--sonpin-primary)] uppercase">Order Lookup</p>
                <h1 className="text-3xl font-light tracking-[0.08em] text-stone-800 md:text-4xl">訂單查詢</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-500">
                  非會員也可以查詢訂單。請輸入「訂單編號」以及「下單時使用的 Email 或手機號碼」。
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
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs tracking-[0.18em] text-stone-500 uppercase">驗證資料（Email 或手機）</label>
                      <input
                        type="text"
                        value={verifier}
                        onChange={(event) => setVerifier(event.target.value)}
                        placeholder="例如：k286336@gmail.com 或 0912345678"
                        className="w-full rounded-xl border border-[var(--sonpin-primary-border)] bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-[var(--sonpin-primary)] focus:ring-2 focus:ring-[var(--sonpin-primary-border)]/50"
                      />
                    </div>

                    {errorMessage && (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-700">
                        {errorMessage}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !canSearch}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--sonpin-ink)] px-5 py-3 text-sm font-medium tracking-[0.14em] text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          查詢中...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          查詢訂單
                        </>
                      )}
                    </button>
                  </form>

                  {result && (
                    <div className="space-y-6">
                      <section className="rounded-2xl border border-[var(--sonpin-primary-border)] bg-white p-6 shadow-sm">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs tracking-[0.18em] text-stone-400 uppercase">查詢結果</p>
                            <h2 className="mt-1 text-2xl font-light text-stone-900">訂單 {result.order.order_number}</h2>
                          </div>
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${shippingTone(result.order.payment_status)}`}>
                            {paymentStatusLabel[(result.order.payment_status || '').toLowerCase()] || result.order.payment_status || '未知'}
                          </span>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <InfoCard icon={<CalendarDays className="h-4 w-4" />} label="訂單日期" value={result.order.created_at ? new Date(result.order.created_at).toLocaleString('zh-TW') : '—'} />
                          <InfoCard icon={<ShieldCheck className="h-4 w-4" />} label="訂單狀態" value={orderStatusLabel[(result.order.status || '').toLowerCase()] || result.order.status || '—'} />
                          <InfoCard icon={<CheckCircle2 className="h-4 w-4" />} label="付款狀態" value={paymentStatusLabel[(result.order.payment_status || '').toLowerCase()] || result.order.payment_status || '—'} />
                          <InfoCard icon={<Truck className="h-4 w-4" />} label="出貨狀態" value={shippingStatusLabel[(result.order.shipping_status || '').toLowerCase()] || result.order.shipping_status || '—'} />
                        </div>
                      </section>

                      <section className="rounded-2xl border border-[var(--sonpin-primary-border)] bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold text-stone-900">訂單明細</h3>
                        <div className="space-y-4">
                          {result.items.map((item, index) => (
                            <div key={`${item.product_name}-${index}`} className="flex flex-col gap-2 rounded-2xl bg-stone-50 p-4 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-sm font-medium text-stone-900">{item.product_name}</p>
                                <p className="mt-1 text-sm text-stone-500">
                                  {item.quantity} x {formatCurrency(Number(item.price || 0))}
                                </p>
                              </div>
                              <p className="text-sm font-medium text-stone-900">{formatCurrency(Number(item.total || 0))}</p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 grid gap-3 border-t border-stone-100 pt-5 text-sm text-stone-700 sm:grid-cols-2">
                          <div className="flex items-center justify-between">
                            <span>商品小計</span>
                            <span>{formatCurrency(subtotal)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>運費</span>
                            <span>{formatCurrency(shipping)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>配送方式</span>
                            <span className="text-right">{result.order.shipping_method || '—'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-stone-900">訂單總額</span>
                            <span className="font-semibold text-stone-900">{formatCurrency(total)}</span>
                          </div>
                        </div>
                      </section>

                      <section className="rounded-2xl border border-[var(--sonpin-primary-border)] bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold text-stone-900">收件與聯絡資訊</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <InfoCard label="訂購人" value={result.order.customer_name || '—'} />
                          <InfoCard label="Email" value={result.order.customer_email || '—'} />
                          <InfoCard label="電話" value={result.order.customer_phone || '—'} />
                          <InfoCard label="收件人" value={result.order.recipient_name || '—'} />
                          <InfoCard label="收件人電話" value={result.order.recipient_phone || '—'} />
                          <InfoCard label="託運單號" value={result.order.tracking_number || '—'} />
                        </div>
                        {result.order.notes ? (
                          <div className="mt-4 rounded-2xl bg-stone-50 p-4 text-sm leading-7 text-stone-600">
                            <p className="mb-1 text-xs tracking-[0.18em] text-stone-400 uppercase">備註</p>
                            <p>{result.order.notes}</p>
                          </div>
                        ) : null}
                      </section>
                    </div>
                  )}
                </section>

                <aside className="space-y-6">
                  <section className="rounded-2xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-background)]/70 p-6">
                    <p className="text-xs tracking-[0.2em] text-[var(--sonpin-primary)] uppercase">查詢說明</p>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-600">
                      <li>1. 先找到訂單成立後收到的訂單編號。</li>
                      <li>2. 輸入下單時使用的 Email 或手機號碼。</li>
                      <li>3. 查詢成功後可看到訂單明細、運費與出貨狀態。</li>
                    </ul>
                  </section>

                  <section className="rounded-2xl border border-[var(--sonpin-primary-border)] bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <BadgeInfo className="h-4 w-4 text-[var(--sonpin-primary)]" />
                      <h3 className="text-base font-semibold text-stone-900">匯款資訊</h3>
                    </div>
                    <div className="space-y-2 text-sm leading-7 text-stone-600">
                      <p>銀行：{REMITTANCE_INFO.bankName}</p>
                      <p>銀行代碼：{REMITTANCE_INFO.bankCode}</p>
                      <p>帳號：{REMITTANCE_INFO.accountNumber}</p>
                      <p>戶名：{REMITTANCE_INFO.accountName}</p>
                    </div>
                    <p className="mt-4 rounded-2xl bg-stone-50 p-4 text-sm leading-7 text-stone-600">
                      查到訂單後，您可以對照匯款資訊完成付款，或把訂單編號提供給客服協助處理。
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

function InfoCard({ icon, label, value }: { icon?: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
      <p className="mb-2 flex items-center gap-2 text-xs tracking-[0.16em] text-stone-400 uppercase">
        {icon}
        {label}
      </p>
      <p className="text-sm leading-7 text-stone-700">{value}</p>
    </div>
  );
}
