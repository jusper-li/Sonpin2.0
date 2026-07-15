import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ChevronLeft, Gift, Shield, Truck } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useShippingQuote } from '../hooks/useShippingQuote';
import SiteHeader from '../components/SiteHeader';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import ProductImage from '../components/ProductImage';
import ProductImagePlaceholder from '../components/ProductImagePlaceholder';

const formatCurrency = (amount: number) => `NT$ ${Number(amount || 0).toLocaleString('zh-TW')}`;

export default function Cart() {
  const { t } = useLanguage();
  const { items, removeFromCart, updateQuantity, total, itemCount } = useCart();
  const { loading: shippingLoading, shippingTotal, breakdown: shippingBreakdown } = useShippingQuote(items);
  const localizedItems = items.map((item) => ({
    ...item,
    translatedName: t(`product.${item.slug}.name`, item.name),
  }));

  const cartPromises = [
    { icon: Truck, label: t('cart.promise.shipping.title', '運費自動計算'), text: t('cart.promise.shipping.desc', '依商品分類與數量自動套用運費') },
    { icon: Gift, label: t('cart.promise.gift.title', '完整出貨'), text: t('cart.promise.gift.desc', '商品出貨前會再次確認內容') },
    { icon: Shield, label: t('cart.promise.after.title', '售後協助'), text: t('cart.promise.after.desc', '如有問題可聯繫客服協助處理') },
  ];

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col" style={{ scrollSnapType: 'none' }}>
        <SiteHeader />
        <main className="flex-1 bg-[var(--sonpin-background)] flex items-center justify-center pt-20 pb-20">
          <div className="text-center">
            <div className="w-20 h-20 bg-stone-100 flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-stone-300" />
            </div>
            <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[var(--sonpin-primary)]/70 mb-3">Cart</p>
            <h1 className="text-2xl font-light text-stone-700 mb-3 tracking-[0.15em]">
              {t('cart.empty.title', '購物車目前是空的')}
            </h1>
            <p className="text-sm text-stone-400 tracking-wide mb-8 font-light">
              {t('cart.empty.description', '先到商品頁把喜歡的商品加入購物車')}
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[var(--sonpin-ink)] hover:bg-[var(--sonpin-primary-soft)] text-[var(--sonpin-surface)] transition-all duration-300 text-xs tracking-[0.2em] uppercase font-medium"
            >
              {t('cart.go_shop', '前往購物')}
            </Link>
          </div>
        </main>
        <DeferredSiteFooter />
      </div>
    );
  }

  const orderTotal = total + shippingTotal;

  return (
    <div className="min-h-screen flex flex-col" style={{ scrollSnapType: 'none' }}>
      <SiteHeader />
      <main className="flex-1 bg-[var(--sonpin-background)] pt-20 pb-20">
        <div className="bg-[var(--sonpin-background)] border-b border-[var(--sonpin-primary-border)]">
          <div className="container mx-auto px-6 py-14 md:py-20">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-xs text-stone-400 hover:text-stone-600 transition-colors tracking-[0.1em] mb-6"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {t('cart.continue', '繼續購物')}
            </Link>
            <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[var(--sonpin-primary)]/70 mb-4">Cart</p>
            <h1 className="text-4xl md:text-5xl font-light text-stone-700 tracking-[0.15em] mb-5">
              {t('cart.title', '購物車')}
            </h1>
            <div className="flex items-center gap-3">
              <div className="w-10 h-px bg-[var(--sonpin-primary-warm)]/50" />
              <p className="text-xs text-stone-400 tracking-[0.2em] font-light">
                {t('cart.count', `共 ${itemCount} 件商品`)}
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-3">
              {localizedItems.map((item) => (
                <div
                  key={item.productId}
                  className="bg-[var(--sonpin-surface)] p-5 border border-[var(--sonpin-primary-border)] hover:border-[var(--sonpin-primary-border)] hover:shadow-[0_6px_24px_rgba(120,100,80,0.08)] transition-all duration-300"
                >
                  <div className="flex gap-5">
                    <Link to={`/product/${item.slug}`} className="flex-shrink-0">
                      <div className="w-20 h-20 md:w-24 md:h-24 bg-[var(--sonpin-background)] overflow-hidden border border-[var(--sonpin-primary-border)]">
                        {item.image ? (
                          <ProductImage
                            src={item.image}
                            alt={item.translatedName}
                            compactPlaceholder
                            className="w-full h-full object-cover"
                            sizes="96px"
                          />
                        ) : (
                          <ProductImagePlaceholder name={item.translatedName} compact />
                        )}
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 pr-3">
                          <Link to={`/product/${item.slug}`}>
                            <h3 className="text-sm font-medium text-stone-700 mb-1.5 hover:text-[var(--sonpin-primary)] transition-colors tracking-wide line-clamp-1">
                              {item.translatedName}
                            </h3>
                          </Link>
                          <div className="flex items-baseline gap-2">
                            {item.salePrice ? (
                              <>
                                <span className="text-sm font-semibold text-stone-700">
                                  NT$ {item.salePrice.toLocaleString()}
                                </span>
                                <span className="text-xs text-stone-300 line-through font-light">
                                  {item.price.toLocaleString()}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm font-semibold text-stone-700">
                                NT$ {item.price.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-stone-300 hover:text-stone-500 transition-colors p-1.5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-[var(--sonpin-primary-border)]">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-[var(--sonpin-background)] transition-all duration-200 text-stone-500"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-10 text-center text-sm text-stone-700 font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-[var(--sonpin-background)] transition-all duration-200 text-stone-500"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] text-stone-400 mb-0.5 tracking-[0.1em] uppercase font-light">
                            {t('cart.subtotal', '小計')}
                          </p>
                          <p className="text-sm font-semibold text-stone-700">
                            NT$ {((item.salePrice || item.price) * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <p className="text-xs text-stone-400 tracking-[0.1em] pt-2 font-light">
                {t('cart.count', `共 ${itemCount} 件商品`)}
              </p>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-[var(--sonpin-background)] p-6 border border-[var(--sonpin-primary-border)] sticky top-28">
                <p className="text-[10px] font-medium tracking-[0.3em] uppercase text-[var(--sonpin-primary)]/70 mb-6">
                  {t('cart.summary', '訂單摘要')}
                </p>

                <div className="space-y-3.5 mb-6">
                  <div className="flex justify-between text-sm text-stone-500 tracking-wide font-light">
                    <span>{t('cart.subtotal', '商品小計')}</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-stone-500 tracking-wide font-light">
                    <span>{t('cart.shipping', '運費')}</span>
                    <span>{shippingLoading ? '計算中...' : formatCurrency(shippingTotal)}</span>
                  </div>
                  {shippingBreakdown.length > 0 && (
                    <div className="space-y-2 rounded-lg bg-[var(--sonpin-surface)] px-3 py-3 text-xs text-stone-500">
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
                  <div className="border-t border-[var(--sonpin-primary-border)] pt-4 mt-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-stone-500 tracking-[0.1em] uppercase font-medium">
                        {t('cart.total', '合計')}
                      </span>
                      <span className="text-xl font-semibold text-stone-700">{formatCurrency(orderTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-px bg-[var(--sonpin-primary-warm)]/50" />
                  <p className="text-xs text-stone-400 tracking-wide font-light">運費依商品分類與數量自動計算</p>
                </div>

                <div className="space-y-2.5 mb-6">
                  {cartPromises.map(({ icon: Icon, label, text }) => (
                    <div key={label} className="flex items-center gap-3 border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] px-3 py-2.5">
                      <Icon className="w-4 h-4 text-[var(--sonpin-primary)] flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-stone-700">{label}</p>
                        <p className="text-[11px] text-stone-400 mt-0.5">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  to="/checkout"
                  className="w-full block py-3.5 bg-[var(--sonpin-ink)] hover:bg-[var(--sonpin-primary-soft)] text-[var(--sonpin-surface)] text-center transition-all duration-300 text-xs font-medium tracking-[0.2em] uppercase"
                >
                  前往結帳
                </Link>

                <Link
                  to="/shop"
                  className="w-full block mt-3 py-3.5 text-stone-500 hover:text-stone-700 text-center transition-all duration-300 border border-[var(--sonpin-primary-border)] hover:border-[var(--sonpin-primary)] text-xs tracking-[0.15em] uppercase font-light"
                >
                  繼續購物
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <DeferredSiteFooter />
    </div>
  );
}
