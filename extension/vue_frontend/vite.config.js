import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

pages = [
  "page_interaction",]
  
let rollup_inputs = pages.map(page =>
{
  return `src/${page}/${page}.js`
});

export default defineConfig({
  build: {
    manifest: true,
    rollupOptions: {
      input: rollup_inputs,
      output: {
        format: 'iife'
      }
    }
  },  
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
