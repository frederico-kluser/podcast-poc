import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['openai', '@orama/orama', 'pdfjs-dist']
  },
  resolve: {
    alias: {
      stream: 'stream-browserify',
      buffer: 'buffer'
    }
  },
  build: {
    rollupOptions: {
      external: ['fs', 'path', 'os'],
      output: {
        manualChunks: {
          'openai': ['openai'],
          'pdf': ['pdfjs-dist'],
          'search': ['@orama/orama'],
          'ui': ['@material-tailwind/react']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  },
  worker: {
    format: 'es'
  },
  define: {
    global: 'globalThis',
    'process.env': {}
  }
})
