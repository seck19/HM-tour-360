import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    // Cloudflare Quick Tunnel sinh hostname ngẫu nhiên mỗi lần chạy, nên cho phép
    // cả miền con thay vì phải dán lại từng URL. Mọi host khác vẫn bị chặn.
    allowedHosts: ['.trycloudflare.com'],
    watch: {
      // Nhiều editor (WebStorm, VS Code khi bật atomic save) và công cụ lưu file
      // kiểu "ghi ra file tạm rồi đổi tên". Trên Windows chokidar có thể gặp EBUSY
      // khi watch thư mục tạm đó, và lỗi này không được bắt nên làm sập dev server.
      // Phải có dấu chấm đầu pattern vì tên thư mục tạm bắt đầu bằng '.', mà '*'
      // của picomatch không khớp dotfile. Vite tự merge danh sách này với mặc định
      // (node_modules, .git, test-results) nên không lo mất các mục đó.
      ignored: ['**/*.tmp', '**/.*.tmpdir', '**/.*.tmpdir/**'],
    },
  },
})