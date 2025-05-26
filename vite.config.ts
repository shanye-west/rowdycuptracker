// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: path.resolve("./node_modules/react"),
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // Attempt to add WebSocket proxying for /api/ws if your custom WS needs it via Vite
        // However, the primary issue is the Supabase client itself, not this proxy.
        // ws: true, // This would proxy ws requests on /api/ws to localhost:3000/api/ws
      },
      // It is unlikely we need to proxy Supabase WebSockets here, as the client should connect directly.
      // Adding a proxy for the Supabase domain might complicate things further or mask the root cause.
    },
  },
});