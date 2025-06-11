import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['openai', '@orama/orama', 'pdfjs-dist', 'langchain']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'openai': ['openai'],
          'pdf': ['pdfjs-dist'],
          'search': ['@orama/orama'],
          'ui': ['@material-tailwind/react'],
          'langchain': ['langchain']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  worker: {
    format: 'es'
  }
})
