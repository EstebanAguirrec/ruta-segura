import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Mismo origen en desarrollo: sin CORS y con la cookie SameSite=Strict funcionando.
    proxy: { '/api': 'http://localhost:3001' },
  },
});
