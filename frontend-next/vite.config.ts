import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const port = Number(env.VITE_DEV_PORT || env.PORT || 5174)
  const strictPort = env.VITE_STRICT_PORT === 'true'

  // On the server, the gateway/recommender are usually available via nginx (5555),
  // while direct service ports (8090/8000) may not be published.
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://10.1.10.144:5555'
  const recommenderTarget = env.VITE_RECOMMENDER_PROXY_TARGET || 'http://10.1.10.144:5555'

  return {
    plugins: [svgr(), react()],
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

