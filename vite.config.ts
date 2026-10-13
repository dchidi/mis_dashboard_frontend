// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Use relative paths so it works at site root *and* under IIS virtual directories
  base: "/mis_dashboard/",
  build: {
    outDir: "dist", // keep 'dist' (IIS will serve from this folder)
    emptyOutDir: true,
    sourcemap: false,
  },
});
