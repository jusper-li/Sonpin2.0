import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Login from '../components/Login';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { recordAdminAuditEvent } from '../lib/adminAudit';
import { useLanguage } from '../contexts/LanguageContext';

const Dashboard = lazy(() => import('../components/Dashboard'));
const MemberManagement = lazy(() => import('../components/modules/MemberManagement'));
const ProductManagement = lazy(() => import('../components/modules/ProductManagementClean'));
const ShippingManagement = lazy(() => import('../components/modules/ShippingManagement'));
const OrderManagement = lazy(() => import('../components/modules/OrderManagement'));
const ArticleManagement = lazy(() => import('../components/modules/ArticleManagement'));
const StoreManagement = lazy(() => import('../components/modules/StoreManagement'));
const FAQManagement = lazy(() => import('../components/modules/FAQManagement'));
const HomepageManagement = lazy(() => import('../components/modules/HomepageManagement'));
const ServiceManagement = lazy(() => import('../components/modules/ServiceManagement'));
const PaymentManagement = lazy(() => import('../components/modules/PaymentManagement'));
const SocialManagement = lazy(() => import('../components/modules/SocialManagement'));
const LanguageManagement = lazy(() => import('../components/modules/LanguageManagement'));
const SEOManagement = lazy(() => import('../components/modules/SEOManagement'));
const NotificationManagement = lazy(() => import('../components/modules/NotificationManagement'));
const AIChat = lazy(() => import('../components/modules/AIChat'));
const AIAnalytics = lazy(() => import('../components/modules/AIAnalytics'));
const PermissionManagement = lazy(() => import('../components/modules/PermissionManagement'));
const KnowledgeBaseManagement = lazy(() => import('../components/modules/KnowledgeBaseManagement'));
const AITraining = lazy(() => import('../components/modules/AITraining'));
const StaticPageManagement = lazy(() => import('../components/modules/StaticPageManagement'));
const VersionLogManagement = lazy(() => import('../components/modules/VersionLogManagement'));
const ProductDetailServiceManagement = lazy(() => import('../components/modules/ProductDetailServiceManagement'));
const ThemeManagement = lazy(() => import('../components/modules/ThemeManagement'));

function ModuleLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
        <p className="text-sm tracking-[0.2em] text-slate-500">載入模組中...</p>
      </div>
    </div>
  );
}

function AdminPanel() {
  const { t } = useLanguage();
  const { admin, isLoading } = useAuth();
  const [activeModule, setActiveModule] = useState('dashboard');
  const lastAuditKeyRef = useRef('');

  useEffect(() => {
    if (!admin) return;

    const auditKey = `${admin.id}:${activeModule}`;
    if (lastAuditKeyRef.current === auditKey) return;
    lastAuditKeyRef.current = auditKey;

    void recordAdminAuditEvent({
      action: 'check',
      entityTable: 'backoffice_module',
      entityId: activeModule,
      metadata: {
        module: activeModule,
        admin_id: admin.id,
        source: 'sidebar-navigation',
      },
    });
  }, [admin, activeModule]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <p className="text-sm tracking-[0.2em] text-white/70">{t('backoffice.loading', '驗證後台權限')}</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return <Login />;
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'members':
        return <MemberManagement />;
      case 'products':
        return <ProductManagement />;
      case 'shipping':
        return <ShippingManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'articles':
        return <ArticleManagement />;
      case 'stores':
        return <StoreManagement />;
      case 'faq':
        return <FAQManagement />;
      case 'homepage':
        return <HomepageManagement />;
      case 'service':
        return <ServiceManagement />;
      case 'payments':
        return <PaymentManagement />;
      case 'social':
        return <SocialManagement />;
      case 'languages':
        return <LanguageManagement />;
      case 'seo':
        return <SEOManagement />;
      case 'notifications':
        return <NotificationManagement />;
      case 'ai-chat':
        return <AIChat />;
      case 'knowledge-base':
        return <KnowledgeBaseManagement />;
      case 'ai-training':
        return <AITraining />;
      case 'ai-analytics':
        return <AIAnalytics />;
      case 'permissions':
        return <PermissionManagement />;
      case 'static-pages':
        return <StaticPageManagement />;
      case 'product-detail-service':
        return <ProductDetailServiceManagement />;
      case 'theme':
        return <ThemeManagement />;
      case 'version-logs':
        return <VersionLogManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<ModuleLoading />}>
            {renderModule()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function Backoffice() {
  return (
    <AuthProvider>
      <AdminPanel />
    </AuthProvider>
  );
}
