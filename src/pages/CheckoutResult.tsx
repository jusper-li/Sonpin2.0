import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock3, Copy, CreditCard, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import SiteHeader from '../components/SiteHeader';
import { REMITTANCE_INFO, remittanceLines } from '../data/remittanceInfo';

type PaymentState = 'paid' | 'failed' | 'pending' | 'unknown';

interface OrderSummary {
  order_number: string;
  payment_status: string | null;
  subtotal: number | null;
  shipping: number | null;
  total: number | null;
  shipping_method: string | null;
  customer_name: string | null;
}

const formatCurrency = (amount: number) => `NT$ ${Number(amount || 0).toLocaleString('zh-TW')}`;

const stateConfig: Record<
  PaymentState,
  {
    title: string;
    description: string;
    tone: string;
  }
> = {
  paid: {
    title: '付款完成',
    description: '我們已收到您的付款，訂單會盡快安排處理與出貨。',
    tone: 'text-emerald-700',
  },
  failed: {
    title: '付款失敗',
    description: '目前付款狀態顯示失敗，若您已完成匯款，請重新通知我們進行確認。',
    tone: 'text-rose-700',
  },
  pending: {
    title: '訂單已送出，等待付款',
    description: '您的訂單已建立，若您選擇匯款付款，請完成匯款後再通知我們對帳。',
    tone: 'text-amber-700',
  },
  unknown: {
    title: '查無訂單資訊',
    description: '我們目前無法取得這筆訂單的狀態，請確認連結是否正確，或直接聯繫客服中心。',
    tone: 'text-slate-700',
  },
};

export default function CheckoutResult() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id') || '';
  const orderNumberParam = searchParams.get('order_number') || '';

  const [status, setStatus] = useState<PaymentState>('pending');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  useEffect(() => {
    document.title = '訂單完成｜淞品土雞專賣店';
  }, []);

  useEffect(() => {
    if (!orderId) {
      setStatus('unknown');
      setLoading(false);
      return;
    }

    let mounted = true;
    let timer: number | null = null;

    const loadOrderStatus = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('order_number,payment_status,subtotal,shipping,total,shipping_method,customer_name')
        .eq('id', orderId)
        .maybeSingle();

      if (!mounted) return;

      if (error || !data) {
        setStatus('unknown');
        setLoading(false);
        return;
      }

      const order = data as OrderSummary;
      setOrderSummary(order);
      setOrderNumber(order.order_number || orderNumberParam || '');

      const paymentStatus = (order.payment_status || '').toLowerCase();
      if (paymentStatus === 'paid') {
        setStatus('paid');
      } else if (paymentStatus === 'failed') {
        setStatus('failed');
      } else {
        setStatus('pending');
      }

      setLoading(false);
    };

    void loadOrderStatus();
    timer = window.setInterval(() => {
      void loadOrderStatus();
    }, 4000);

    return () => {
      mounted = false;
      if (timer) window.clearInterval(timer);
    };
  }, [orderId, orderNumberParam]);

  const icon = useMemo(() => {
    if (loading || status === 'pending') return <Clock3 className="h-10 w-10 text-amber-600" />;
    if (status === 'paid') return <CheckCircle2 className="h-10 w-10 text-emerald-600" />;
    if (status === 'failed') return <XCircle className="h-10 w-10 text-rose-600" />;
    return <Clock3 className="h-10 w-10 text-slate-500" />;
  }, [loading, status]);

  const cfg = stateConfig[loading ? 'pending' : status];
  const subtotal = Number(orderSummary?.subtotal || 0);
  const shipping = Number(orderSummary?.shipping || 0);
  const finalTotal = Number(orderSummary?.total ?? subtotal + shipping);

  const copyRemittance = async () => {
    const text = remittanceLines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('idle');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 bg-stone-50 px-6 pb-16 pt-24">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-stone-200 bg-stone-50">
              {icon}
            </div>
            <h1 className={`text-2xl font-semibold ${cfg.tone}`}>{cfg.title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">{cfg.description}</p>

            {orderNumber && (
              <div className="mt-6 rounded-2xl bg-stone-50 px-4 py-4 text-left">
                <p className="text-xs tracking-[0.16em] text-stone-400 uppercase">訂單編號</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="font-mono text-lg text-stone-900">{orderNumber}</p>
                </div>
              </div>
            )}
          </div>

          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-amber-500" />
              <h2 className="text-lg font-semibold text-stone-900">匯款資訊</h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-xl bg-stone-50 p-4">
                <div className="space-y-2 text-sm text-stone-700">
                  <p>銀行名稱：{REMITTANCE_INFO.bankName}</p>
                  <p>銀行代碼：{REMITTANCE_INFO.bankCode}</p>
                  <p>匯款帳號：{REMITTANCE_INFO.accountNumber}</p>
                  <p>戶名：{REMITTANCE_INFO.accountName}</p>
                  {REMITTANCE_INFO.taxId ? <p>統一編號：{REMITTANCE_INFO.taxId}</p> : null}
                </div>
              </div>

              <div className="rounded-xl bg-stone-50 p-4">
                <p className="mb-2 text-sm font-medium text-stone-900">匯款提醒</p>
                <p className="whitespace-pre-line text-sm leading-7 text-stone-600">{REMITTANCE_INFO.note}</p>
                <button
                  type="button"
                  onClick={() => void copyRemittance()}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700 transition hover:bg-white"
                >
                  <Copy className="h-4 w-4" />
                  {copyState === 'copied' ? '已複製匯款資訊' : '複製匯款資訊'}
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-stone-900">訂單摘要</h2>
            <div className="space-y-3 text-sm text-stone-700">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <span>商品小計</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <span>運費</span>
                <span>{formatCurrency(shipping)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <span>配送方式</span>
                <span className="text-right">{orderSummary?.shipping_method || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold text-stone-900">
                <span>訂單總額</span>
                <span>{formatCurrency(finalTotal)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-900">
            <p className="font-medium">完成匯款後，請保留匯款紀錄，並聯繫客服中心回報您的訂單編號。</p>
            <p className="mt-1">
              訂單編號：
              <span className="font-mono font-semibold">{orderNumber || orderId}</span>
            </p>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/shop"
              className="rounded-xl bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              繼續購物
            </Link>
            <Link
              to="/order-query"
              className="rounded-xl border border-stone-300 px-6 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
            >
              訂單查詢
            </Link>
            <Link
              to="/remittance-notice"
              className="rounded-xl border border-[var(--sonpin-primary-border)] px-6 py-3 text-sm font-medium text-[var(--sonpin-primary)] transition hover:bg-[var(--sonpin-background)]"
            >
              匯款通知
            </Link>
            <Link
              to="/cart"
              className="rounded-xl border border-stone-300 px-6 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
            >
              回到購物車
            </Link>
          </div>
        </div>
      </main>
      <DeferredSiteFooter />
    </div>
  );
}
