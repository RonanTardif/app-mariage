import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || ''
const base = process.env.GITHUB_PAGES === 'true' && repoName ? `/${repoName}/app-react/` : '/'

export default defineConfig({
  plugins: [react()],
  base,
})
