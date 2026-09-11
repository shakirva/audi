import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __VENUEZA_BUILD__: JSON.stringify({
      commit: process.env.COMMIT_SHA || 'unknown',
      release: process.env.RELEASE_ID || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      timestamp: process.env.RELEASE_TIMESTAMP || new Date().toISOString()
    })
  }
})
