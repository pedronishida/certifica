import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      proxy: {
        // Dev local: /api/recall-api/* → Recall.ai (token seguro via env var)
        // Em produção (Vercel): serverless function em api/recall-api/[...path].ts faz o proxy
        '/api/recall-api': {
          target: 'https://us-west-2.recall.ai',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/recall-api/, '/api/v1'),
          headers: {
            Authorization: `Token ${env.VITE_RECALL_API_TOKEN ?? env.RECALL_API_TOKEN ?? ''}`,
          },
        },
      },
    },

    assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})
