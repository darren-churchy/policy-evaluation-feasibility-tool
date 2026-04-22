import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replace 'evaluation-feasibility-tool' with your actual GitHub repository name
// This is required for GitHub Pages to resolve assets correctly
export default defineConfig({
  plugins: [react()],
  base: '/darren-churchy/policy-evaluation-feasibility-tool/',
})
