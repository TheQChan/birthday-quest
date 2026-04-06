import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? ''
const isUserPageRepo = repoName.endsWith('.github.io')
const defaultBase =
  process.env.GITHUB_ACTIONS === 'true'
    ? isUserPageRepo
      ? '/'
      : `/${repoName}/`
    : '/'

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || defaultBase
})
