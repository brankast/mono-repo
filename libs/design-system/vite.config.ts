import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const packageRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL('./demo', import.meta.url)),
  server: {
    host: '127.0.0.1',
    port: 4310,
    strictPort: true,
    fs: {
      allow: [packageRoot],
    },
  },
});
