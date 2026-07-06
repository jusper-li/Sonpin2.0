import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { CartProvider } from './contexts/CartContext';
import { MemberAuthProvider } from './contexts/MemberAuthContext';
import ScrollToTop from './components/ScrollToTop';

const Homepage = lazy(() => import('./pages/Homepage'));
const Backoffice = lazy(() => import('./pages/Backoffice'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const StorePage = lazy(() => import('./pages/StorePage'));
const ServicePage = lazy(() => import('./pages/ServicePage'));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage'));
const MediaPage = lazy(() => import('./pages/MediaPage'));
const MediaDetailPage = lazy(() => import('./pages/MediaDetailPage'));
const CulturePage = lazy(() => import('./pages/CulturePage'));
const ProcessPage = lazy(() => import('./pages/ProcessPage'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const CheckoutResult = lazy(() => import('./pages/CheckoutResult'));
const MemberAuth = lazy(() => import('./pages/MemberAuth'));
const MemberProfile = lazy(() => import('./pages/MemberProfile'));
const StaticPage = lazy(() => import('./pages/StaticPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const StoryPage = lazy(() => import('./pages/StoryPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const BlogList = lazy(() => import('./pages/BlogList'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const GoogleAnalytics = lazy(() => import('./components/GoogleAnalytics'));
const FloatingAIChat = lazy(() => import('./components/FloatingAIChat'));
const CookieConsent = lazy(() => import('./components/CookieConsent'));

function RouteLoading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-amber-700" />
        <p className="text-xs font-medium tracking-[0.25em] text-stone-400 uppercase">Loading</p>
      </div>
    </div>
  );
}

function GlobalWidgets() {
  const location = useLocation();
  const isBackoffice = location.pathname.startsWith('/backoffice');

  if (isBackoffice) return null;

  return (
    <Suspense fallback={null}>
      <GoogleAnalytics />
      <FloatingAIChat />
      <CookieConsent />
    </Suspense>
  );
}

function App() {
  return (
    <LanguageProvider>
      <CartProvider>
        <MemberAuthProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<RouteLoading />}>
              <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/backoffice" element={<Backoffice />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/products" element={<Shop />} />
                <Route path="/products/:categorySlug" element={<Shop />} />
                <Route path="/products/:categorySlug/:slug" element={<ProductDetail />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/store" element={<StorePage />} />
                <Route path="/service" element={<ServicePage />} />
                <Route path="/service/:slug" element={<ServiceDetailPage />} />
                <Route path="/media" element={<MediaPage />} />
                <Route path="/media/:categorySlug" element={<MediaPage />} />
                <Route path="/media/:groupSlug/:articleSlug" element={<MediaDetailPage />} />
                <Route path="/culture" element={<CulturePage />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/checkout/result" element={<CheckoutResult />} />
                <Route path="/member" element={<MemberAuth />} />
                <Route path="/member/auth" element={<MemberAuth />} />
                <Route path="/member/reset" element={<MemberAuth />} />
                <Route path="/member/profile" element={<MemberProfile />} />
                <Route path="/privacy" element={<StaticPage />} />
                <Route path="/terms" element={<StaticPage />} />
                <Route path="/shipping" element={<StaticPage />} />
                <Route path="/returns" element={<StaticPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/story" element={<StoryPage />} />
                <Route path="/process" element={<ProcessPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/blog" element={<BlogList />} />
                <Route path="/blog/categories/:categorySlug" element={<BlogList />} />
                <Route path="/blog/posts/:slug" element={<BlogDetail />} />
              </Routes>
              <GlobalWidgets />
            </Suspense>
          </BrowserRouter>
        </MemberAuthProvider>
      </CartProvider>
    </LanguageProvider>
  );
}

export default App;
