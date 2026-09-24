import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Tea-Yield-Predictor/',
  plugins: [react()],
})
