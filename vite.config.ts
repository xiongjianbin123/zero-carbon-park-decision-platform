import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { sites } from '@openai/sites-vite-plugin'

export default defineConfig(async ({ command }) => {
  process.env.WRANGLER_WRITE_LOGS ??= 'false'
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs'
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry'

  const workerPlugins = command === 'build'
    ? [(await import('@cloudflare/vite-plugin')).cloudflare()]
    : []

  return {
    plugins: [vue(), sites(), ...workerPlugins],
    server: {
      proxy: { '/api': 'http://127.0.0.1:4175' },
    },
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    base: './',
  }
})
