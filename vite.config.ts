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

                offscreen: resolve(__dirname, 'offscreen.html'),

                offscreenScript: resolve(__dirname, 'offscreen.js'),

                content: resolve(__dirname, 'src/content/scripts/content.js'),

                background: resolve(__dirname, 'src/background.js')
            },
            output: {
                entryFileNames: (chunkInfo) => {
                    if (chunkInfo.name === 'content') {
                        return 'assets/content.js';
                    }
                    if (chunkInfo.name === 'background') {
                        return 'background.js';
                    }
                    if (chunkInfo.name === 'offscreenScript') {
                        return 'offscreen.js';
                    }
                    return 'assets/[name]-[hash].js';
                }
            }
        }
    }
})
