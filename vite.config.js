import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5181, host: true,
    // Dev only: the admin console is a separate frontend; API calls go to
    // the overseas backend (taojie-overseas-server) on its own port.
    proxy: {
      '/api': 'http://localhost:3100',
      '/uploads': 'http://localhost:3100'
    }
  },
  preview: { port: 5181, host: true }
})
