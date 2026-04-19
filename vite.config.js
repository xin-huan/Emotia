import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 👇 加上下面这三行代码，强制统一 React 实例 👇
  resolve: {
    dedupe: ['react', 'react-dom'],
  }
})