import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
  root: ".",
  base: "./",
  publicDir: "public", // Use public directory for assets
  
  define: {
    __DEFINES__: "{}",
    global: "globalThis",
  },
  
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html")
      }
    },
    assetsDir: "assets"
  },
  
  server: {
    port: 3000,
    open: true,
    cors: true,
    hmr: {
      port: 3001
    },
    fs: {
      allow: ['..']
    }
  },
  
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.ttf', '**/*.otf', '**/*.woff', '**/*.woff2'],
  
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  },
  
  // Optimize for development
  optimizeDeps: {
    include: ["phaser"]
  },
  
  // TypeScript compilation options
  esbuild: {
    target: "es2020",
    format: "esm",
  },
})
