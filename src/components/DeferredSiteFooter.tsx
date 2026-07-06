import { lazy, Suspense } from 'react';

const SiteFooter = lazy(() => import('./SiteFooter'));

export default function DeferredSiteFooter() {
  return (
    <Suspense fallback={null}>
      <SiteFooter />
    </Suspense>
  );
}
