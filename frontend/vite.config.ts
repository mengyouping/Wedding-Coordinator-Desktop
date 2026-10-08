import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    host: '0.0.0.0',
    port: 18766,
    strictPort: true,
    // Windows: cargo 写入 target/*.dll 时 Vite 监视会 EBUSY 导致 beforeDevCommand 退出
    watch: {
      ignored: ['**/src-tauri/target/**']
    }
  },
  preview: { host: '0.0.0.0', port: 18766, strictPort: true },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'es2022',
    sourcemap: true,
    rollupOptions: {
      input: {
        admin: fileURLToPath(new URL('./index.html', import.meta.url)),
        invitation: fileURLToPath(new URL('./invite.html', import.meta.url))
      }
    }
  }
});
