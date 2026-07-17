import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { burstResetScrollPositions, resetScrollPositions } from '../lib/scrollReset';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    resetScrollPositions();
    const stopBurstReset = burstResetScrollPositions();
    const firstFrame = window.requestAnimationFrame(resetScrollPositions);
    const secondFrame = window.requestAnimationFrame(resetScrollPositions);

    return () => {
      stopBurstReset();
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [pathname]);

  return null;
}
