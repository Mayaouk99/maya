import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // Le moteur 3D (three.js) n'est chargé qu'à l'ouverture du studio avatar.
  build: { chunkSizeWarningLimit: 1500 },
})
