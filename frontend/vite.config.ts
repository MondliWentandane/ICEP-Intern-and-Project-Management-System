import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '')
  const target = env.VITE_API_PROXY_TARGET
  return {
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(rootDir, 'src') } },
    server: { proxy: target ? { '/api': { target, changeOrigin: true } } : undefined },
  }
})
