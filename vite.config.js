import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Mounted at /home on the apex; Discourse owns /.
  base: '/home/',
  plugins: [react()],
});
