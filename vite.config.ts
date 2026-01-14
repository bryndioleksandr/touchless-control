import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
      react(),
      tailwindcss(),
  ],
    build: {
        rollupOptions: {
            input: {
                overlay: resolve(__dirname, 'index.html'),

                popup: resolve(__dirname, 'popup.html'),

                content: resolve(__dirname, 'src/content/scripts/content.js')
            },
            output: {
                entryFileNames: (chunkInfo) => {
                    if (chunkInfo.name === 'content') {
                        return 'assets/content.js';
                    }
                    return 'assets/[name]-[hash].js';
                }
            }
        }
    }
})
