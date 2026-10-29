import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '')
  const target = env.VITE_API_PROXY_TARGET || 'http://localhost:5000'

  return {
    plugins: [react(), tailwindcss() as any],
    resolve: { alias: { '@': path.resolve(rootDir, 'src') } },
    server: { proxy: { '/api': { target, changeOrigin: true } } },
  }
})
