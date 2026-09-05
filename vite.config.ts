import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Allow other devices on the local network to open the dev server.
    host: true,
  },
  preview: {
    host: true,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
