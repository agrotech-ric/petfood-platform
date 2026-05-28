import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const port = Number(env.VITE_DEV_PORT || env.PORT || 5174)
  const strictPort = env.VITE_STRICT_PORT === 'true'

  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://10.1.10.144:8090'
  const recommenderTarget = env.VITE_RECOMMENDER_PROXY_TARGET || 'http://10.1.10.144:8000'

  return {
    plugins: [react()],
    server: {
      port,
      strictPort,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/recommender': {
          target: recommenderTarget,
          changeOrigin: true,
        },
      },
    },
  }
})

