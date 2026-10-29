import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'assets',
  define: {
    'import.meta.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || ''),
    'import.meta.env.SUPABASE_PUBLISHABLE_KEY': JSON.stringify(process.env.SUPABASE_PUBLISHABLE_KEY || ''),
  },
});
