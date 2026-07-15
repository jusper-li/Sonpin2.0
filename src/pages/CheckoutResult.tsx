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

export default function CheckoutResult() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id') || '';
  const orderNumberParam = searchParams.get('order_number') || '';

  const [status, setStatus] = useState<PaymentState>('pending');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  const stateConfig: Record<PaymentState, { title: string; description: string; tone: string }> = useMemo(
    () => ({
      paid: {
        title: '訂單已完成',
        description: '我們已收到您的付款資訊，後續會依訂單內容安排出貨與通知。',
        tone: 'text-emerald-700',
      },
      failed: {
        title: '付款失敗',
        description: '目前付款未成功，請重新確認付款流程或聯繫客服協助。',
        tone: 'text-rose-700',
      },
      pending: {
        title: '訂單已送出',
        description: '請先依下方匯款資訊完成轉帳，完成後我們會盡快確認入帳並安排出貨。',
        tone: 'text-amber-700',
      },
      unknown: {
        title: '查無付款資訊',
        description: '目前找不到這筆訂單的付款狀態，請確認訂單編號是否正確。',
        tone: 'text-slate-700',
      },
    }),
    []
  );

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
  const finalTotal = Number(orderSummary?.total ?? (Number(orderSummary?.subtotal || 0) + Number(orderSummary?.shipping || 0)));
  const subtotal = Number(orderSummary?.subtotal || 0);
  const shipping = Number(orderSummary?.shipping || 0);

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
                  {REMITTANCE_INFO.taxId ? <p>統編：{REMITTANCE_INFO.taxId}</p> : null}
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
                <span>小計</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <span>運費</span>
                <span>{formatCurrency(shipping)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <span>配送摘要</span>
                <span className="text-right">{orderSummary?.shipping_method || '—'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <span>匯款方式</span>
                <span>銀行轉帳</span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold text-stone-900">
                <span>訂單總額</span>
                <span>{formatCurrency(finalTotal)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-900">
            <p className="font-medium">完成匯款後，系統會依訂單編號進行對帳。</p>
            <p className="mt-1">
              若您已轉帳，請保留匯款紀錄並聯繫客服，回報訂單編號：
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
