import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tagger from "@dhiwise/component-tagger";
import { fileURLToPath, URL } from "node:url";

// Performance-optimized Vite configuration for production excellence
// Target: <300KB total bundle, <100ms load times, aggressive tree-shaking
export default defineConfig({
  build: {
    outDir: "dist",
    sourcemap: process.env.NODE_ENV === "development",
    chunkSizeWarningLimit: 500, // Stricter chunk size limits
    minify: "esbuild", // Fastest minification
    target: "es2022", // Modern target for smaller bundles
    rollupOptions: {
      output: {
        // Advanced code splitting for optimal caching
        manualChunks: (id) => {
          // React core libraries
          if (id.includes("react") || id.includes("react-dom")) {
            return "react-core";
          }
          
          // React ecosystem
          if (id.includes("react-router") || id.includes("react-hook-form")) {
            return "react-ecosystem";
          }
          
          // UI libraries (heavy components)
          if (id.includes("framer-motion") || id.includes("recharts")) {
            return "ui-heavy";
          }
          
          // Utility libraries
          if (id.includes("date-fns") || id.includes("clsx") || id.includes("class-variance-authority")) {
            return "utils";
          }
          
          // TanStack (data fetching)
          if (id.includes("@tanstack")) {
            return "tanstack";
          }
          
          // Supabase and auth
          if (id.includes("supabase") || id.includes("@supabase")) {
            return "supabase";
          }
          
          // Zustand and state management
          if (id.includes("zustand")) {
            return "state";
          }
          
          // D3 and data visualization (lazy load)
          if (id.includes("d3")) {
            return "data-viz";
          }
          
          // Node modules get their own chunk
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
        
        // Optimize chunk names for caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? 
            chunkInfo.facadeModuleId.split('/').pop().replace('.js', '') : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        },
        
        // Optimize asset names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          let extType = info[info.length - 1];
          
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
            extType = 'media';
          } else if (/\.(png|jpe?g|gif|svg|webp|ico)(\?.*)?$/i.test(assetInfo.name)) {
            extType = 'img';
          } else if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
            extType = 'fonts';
          }
          
          return `assets/${extType}/[name]-[hash][extname]`;
        },
      },
    },
    
    // Aggressive bundle optimization
    reportCompressedSize: false, // Disable for faster builds
    cssCodeSplit: true, // Enable CSS code splitting
    
    // Modern build optimizations
    commonjsOptions: {
      include: [/node_modules/],
    },
    
  },
  
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "components": fileURLToPath(new URL("./src/components", import.meta.url)),
      "pages": fileURLToPath(new URL("./src/pages", import.meta.url)),
      "lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
      "utils": fileURLToPath(new URL("./src/utils", import.meta.url)),
      "hooks": fileURLToPath(new URL("./src/hooks", import.meta.url)),
      "assets": fileURLToPath(new URL("./src/assets", import.meta.url)),
    }
  },
  
  plugins: [
    tsconfigPaths(), 
    react({
      // React optimizations for production
      babel: {
        plugins: [],
      },
    }), 
    tagger(),
  ],
  
  server: {
    port: 5173,
    host: true,
    strictPort: false,
    // Performance optimizations for development
    hmr: {
      overlay: true,
    },
    // Enable faster dependency pre-bundling
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "@tanstack/react-query",
        "zustand",
        "clsx",
        "class-variance-authority",
      ],
      exclude: [
        // Heavy dependencies to lazy load
        "framer-motion",
        "recharts",
        "d3",
      ],
    },
  },
  
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    // Add feature flags for runtime optimization
    '__DEV__': process.env.NODE_ENV === 'development',
    '__PROD__': process.env.NODE_ENV === 'production',
  },
  
  // CSS optimizations
  css: {
    modules: {
      localsConvention: "camelCase",
    },
    postcss: {
      plugins: [
        // Add autoprefixer and cssnano for production
      ],
    },
  },
  
  // Enable advanced optimizations
  esbuild: {
    // Tree shaking optimizations
    treeShaking: true,
    // Remove console.log in production
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
  },
});