import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/finance-tracker/', // ⚠️ Enable this if deploying to GitHub Pages Project Site
})
