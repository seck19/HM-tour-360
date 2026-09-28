import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    // Cloudflare Quick Tunnel sinh hostname ngẫu nhiên mỗi lần chạy, nên cho phép
    // cả miền con thay vì phải dán lại từng URL. Mọi host khác vẫn bị chặn.
    allowedHosts: ['.trycloudflare.com'],
  },
})