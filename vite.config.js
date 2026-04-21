import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Change 'task-manager' to match your GitHub repo name exactly
  base: '/task-manager/',
})
