import react from '@vitejs/plugin-react'
import { defineConfig as viteDefineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default viteDefineConfig({
  plugins: [react(), tailwindcss()],
})
