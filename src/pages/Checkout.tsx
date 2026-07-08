import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, CreditCard, Gift, Lock, MapPin, Truck, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { supabase, supabaseAnonKey, supabaseBaseUrl } from '../lib/supabase';
import { useShippingQuote } from '../hooks/useShippingQuote';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import SiteHeader from '../components/SiteHeader';
import ProductImage from '../components/ProductImage';
import ProductImagePlaceholder from '../components/ProductImagePlaceholder';

const formatCurrency = (amount: number) => `NT$ ${Number(amount || 0).toLocaleString('zh-TW')}`;

export default function Checkout() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { loading: shippingLoading, shippingTotal, breakdown: shippingBreakdown } = useShippingQuote(items);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ orderNumber: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    paymentMethod: 'bank_transfer',
    notes: '',
  });

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  const paymentOptions = [
    { value: 'bank_transfer', label: t('checkout.payment.transfer', '銀行轉帳（匯款後出貨）') },
  ];

  const deliveryPromise = [
    { icon: Lock, label: t('checkout.promise.secure', '安全付款') },
    { icon: Truck, label: t('checkout.promise.shipping', '依運費分類自動計算運費') },
    { icon: Gift, label: t('checkout.promise.gift', '完整商品出貨') },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (shippingLoading) {
        throw new Error('Shipping quote is still loading');
      }

      const orderNumber = `ORD-${Date.now()}`;
      const orderId = crypto.randomUUID();
      const shippingAmount = Number(shippingTotal || 0);
      const finalTotal = total + shippingAmount;

      const { error: orderError } = await supabase.from('orders').insert({
        id: orderId,
        order_number: orderNumber,
        status: 'pending',
        subtotal: total,
        tax: 0,
        shipping: shippingAmount,
        total: finalTotal,
        payment_status: 'pending',
        shipping_address: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
        },
        notes: formData.notes,
      });

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: orderId,
        product_id: item.productId,
        product_name: item.name,
        quantity: item.quantity,
        price: item.salePrice || item.price,
        total: (item.salePrice || item.price) * item.quantity,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      const { error: paymentError } = await supabase.from('payments').insert({
        order_id: orderId,
        amount: finalTotal,
        method: 'bank_transfer',
        status: 'pending',
        metadata: {
          customer_name: formData.name,
          customer_email: formData.email,
        },
      });

      if (paymentError) throw paymentError;

      fetch(`${supabaseBaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'order_confirmation',
          data: {
            orderNumber,
            customerName: formData.name,
            customerEmail: formData.email,
            items: orderItems,
            total: finalTotal,
            shipping: shippingAmount,
            shippingBreakdown,
            address: `${formData.address}, ${formData.city} ${formData.postalCode}`,
            paymentMethod: 'bank_transfer',
          },
        }),
      }).catch(() => {});

      clearCart();
      setOrderSuccess({ orderNumber });
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('結帳失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm tracking-wide text-stone-800 placeholder-stone-300 transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100';
  const labelCls = 'mb-2 block text-xs tracking-[0.15em] text-stone-500 uppercase';

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex flex-col" style={{ scrollSnapType: 'none' }}>
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center bg-stone-50 px-6 py-20">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-green-100 bg-green-50">
              <div className="h-10 w-10 rounded-full border-4 border-green-600/80" />
            </div>
            <p className="mb-3 text-xs tracking-[0.3em] text-amber-700 uppercase">訂單已成立</p>
            <h1 className="mb-3 text-3xl font-light text-stone-800">感謝您的訂購</h1>
            <p className="mb-2 font-light text-stone-500">我們已收到您的訂單，稍後會寄出確認信。</p>
            <p className="mb-8 text-sm font-light text-stone-400">
              訂單編號：<span className="font-medium text-stone-700">{orderSuccess.orderNumber}</span>
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => navigate('/products')}
                className="rounded-xl bg-stone-800 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-700"
              >
                繼續購物
              </button>
              <button
                onClick={() => navigate('/')}
                className="rounded-xl border border-stone-200 bg-white px-6 py-3 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
              >
                回首頁
              </button>
            </div>
          </div>
        </main>
        <DeferredSiteFooter />
      </div>
    );
  }

  const finalShippingTotal = Number(shippingTotal || 0);
  const finalOrderTotal = total + finalShippingTotal;

  return (
    <div className="min-h-screen flex flex-col" style={{ scrollSnapType: 'none' }}>
      <SiteHeader />
      <main className="flex-1 bg-white pt-20 pb-20">
        <div className="border-b border-stone-100 bg-stone-50">
          <div className="container mx-auto px-6 py-10">
            <div className="mb-5 flex items-center gap-2 text-xs tracking-[0.15em] text-stone-400">
              <Link to="/" className="transition-colors hover:text-stone-600">
                首頁
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link to="/cart" className="transition-colors hover:text-stone-600">
                購物車
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-stone-600">結帳</span>
            </div>
            <h1 className="text-4xl font-light tracking-[0.2em] text-stone-800 md:text-5xl">結帳</h1>
            <div className="mt-5 flex items-center gap-3">
              <div className="h-px w-10 bg-amber-400" />
              <p className="text-xs tracking-[0.25em] text-stone-400 uppercase">Secure Checkout</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="container mx-auto px-6 py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <User className="h-4 w-4 text-amber-500" />
                  <h2 className="text-sm font-medium tracking-[0.1em] text-stone-800">聯絡資料</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>姓名 *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>電子郵件 *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputCls} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>電話 *</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className={inputCls} />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-amber-500" />
                  <h2 className="text-sm font-medium tracking-[0.1em] text-stone-800">配送地址</h2>
                </div>
                <div className="grid gap-4">
                  <div>
                    <label className={labelCls}>地址 *</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} required className={inputCls} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>城市 *</label>
                      <input type="text" name="city" value={formData.city} onChange={handleChange} required className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>郵遞區號 *</label>
                      <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} required className={inputCls} />
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-amber-500" />
                  <h2 className="text-sm font-medium tracking-[0.1em] text-stone-800">付款方式</h2>
                </div>
                <div className="grid gap-3">
                  {paymentOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3"
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={option.value}
                        checked={formData.paymentMethod === option.value}
                        onChange={handleChange}
                        className="h-4 w-4 accent-amber-500"
                      />
                      <span className="text-sm text-stone-700">{option.label}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-6 text-stone-500">
                  目前僅提供銀行轉帳付款，確認匯款後將安排出貨。
                </p>
              </section>

              <section className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <Gift className="h-4 w-4 text-amber-500" />
                  <h2 className="text-sm font-medium tracking-[0.1em] text-stone-800">備註</h2>
                </div>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className={`${inputCls} resize-none`}
                  placeholder="例如：請幫我多加冰袋、可聯繫後再出貨"
                />
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-xs font-medium tracking-[0.3em] text-stone-400 uppercase">訂單明細</h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 border-b border-stone-100 pb-4 last:border-b-0 last:pb-0">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-stone-100">
                        {item.image ? (
                          <ProductImage
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            sizes="64px"
                          />
                        ) : (
                          <ProductImagePlaceholder name={item.name} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-stone-800">{item.name}</p>
                            <p className="mt-1 text-xs text-stone-400">數量 x {item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium text-stone-700">
                            {formatCurrency((item.salePrice || item.price) * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-3 border-t border-stone-100 pt-4 text-sm">
                  <div className="flex items-center justify-between text-stone-500">
                    <span>商品小計</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-stone-500">
                    <span>運費</span>
                    <span className="text-amber-600">
                      {shippingLoading ? '計算中...' : formatCurrency(finalShippingTotal)}
                    </span>
                  </div>
                  {shippingBreakdown.length > 0 && (
                    <div className="space-y-2 rounded-xl bg-stone-50 px-3 py-3 text-xs text-stone-500">
                      {shippingBreakdown.map((item) => (
                        <div key={item.breakdownKey} className="flex items-center justify-between gap-3">
                          <span className="truncate">
                            {item.categoryName}
                            {item.quantityLabel ? ` · ${item.quantityLabel}` : ''} x {item.quantity}
                          </span>
                          <span>{formatCurrency(item.fee)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-stone-100 pt-3">
                    <span className="text-sm font-medium tracking-wide text-stone-800">合計</span>
                    <span className="text-lg font-semibold text-stone-900">{formatCurrency(finalOrderTotal)}</span>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
                <div className="space-y-3">
                  {deliveryPromise.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-3 text-sm text-stone-600">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-50 text-amber-500">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </section>

              <button
                type="submit"
                disabled={loading || shippingLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-6 py-4 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading || shippingLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {shippingLoading ? '運費計算中...' : '送出訂單中...'}
                  </>
                ) : (
                  '送出訂單'
                )}
              </button>

              <Link
                to="/cart"
                className="block text-center text-sm text-stone-500 transition-colors hover:text-stone-700"
              >
                回購物車
              </Link>
            </aside>
          </div>
        </form>
      </main>
      <DeferredSiteFooter />
    </div>
  );
}
