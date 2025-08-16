import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tagger from "@dhiwise/component-tagger";
import { fileURLToPath, URL } from "node:url";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: "dist",
    sourcemap: true,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'recharts'],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "components": fileURLToPath(new URL("./src/components", import.meta.url)),
      "pages": fileURLToPath(new URL("./src/pages", import.meta.url)),
      "lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
      "utils": fileURLToPath(new URL("./src/utils", import.meta.url)),
    }
  },
  plugins: [tsconfigPaths(), react(), tagger()],
  server: {
    port: 5173,
    host: true,
    strictPort: false,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
});
