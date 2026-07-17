const SCROLL_RESET_DELAYS = [0, 40, 160, 420];

export const resetScrollPositions = () => {
  if (typeof window === 'undefined') return;

  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
};

export const burstResetScrollPositions = () => {
  if (typeof window === 'undefined') return () => {};

  const timers = SCROLL_RESET_DELAYS.map((delay) =>
    window.setTimeout(() => {
      resetScrollPositions();
    }, delay),
  );

  const onFocus = () => resetScrollPositions();
  const onPageShow = () => resetScrollPositions();
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      resetScrollPositions();
    }
  };

  window.addEventListener('focus', onFocus);
  window.addEventListener('pageshow', onPageShow);
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    timers.forEach((timer) => window.clearTimeout(timer));
    window.removeEventListener('focus', onFocus);
    window.removeEventListener('pageshow', onPageShow);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
};
