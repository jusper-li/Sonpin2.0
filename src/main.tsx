import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { burstResetScrollPositions, resetScrollPositions } from './lib/scrollReset';

resetScrollPositions();
const cleanupBurstReset = burstResetScrollPositions();
window.addEventListener('pageshow', resetScrollPositions);
window.addEventListener('load', resetScrollPositions);

createRoot(document.getElementById('root')!).render(<App />);

window.addEventListener('beforeunload', () => cleanupBurstReset());
