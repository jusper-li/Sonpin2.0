import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const resetScrollPositions = () => {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

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
window.addEventListener('pageshow', resetScrollPositions);
window.addEventListener('load', resetScrollPositions);

createRoot(document.getElementById('root')!).render(<App />);
