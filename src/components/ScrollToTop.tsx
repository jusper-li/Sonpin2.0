import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const resetScrollPositions = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      const homepageScroller = document.querySelector('.homepage-main') as HTMLElement | null;
      if (homepageScroller) {
        homepageScroller.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        homepageScroller.scrollTop = 0;
      }
    };

    resetScrollPositions();
    const firstFrame = window.requestAnimationFrame(resetScrollPositions);
    const secondFrame = window.requestAnimationFrame(resetScrollPositions);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [pathname]);

  return null;
}
