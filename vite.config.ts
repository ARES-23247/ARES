/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
    exclude: ['node_modules', 'tests/e2e/**'],
    coverage: {
      provider: "v8",
      include: ['src/utils/**', 'src/hooks/**', 'functions/api/routes/**'],
      exclude: [
        'functions/api/routes/sitemap.ts',
        '**/*.test.ts'
      ],
      thresholds: {
        lines: 85,
        functions: 100,
        branches: 80,
        statements: 85
      }
    }
  },
  plugins: [
    react(),
    visualizer({ emitFile: true, filename: "stats.html" }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'ares_hero.png'],
      manifest: {
        name: 'ARES 23247 Web Portal',
        short_name: 'ARES',
        description: 'FIRST Tech Challenge Team 23247 - Appalachian Robotics & Engineering Society.',
        theme_color: '#C00000',
        background_color: '#09090b',
        display: 'standalone',
        icons: [
          {
            src: '/ares_hero.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/ares_hero.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 15000000,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        navigateFallbackDenylist: [/^\/api\//, /\/[^/]+\.[^/]+$/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/aresfirst\.org\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ares-api-cache-v2',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true
      }
    }
  },
  preview: {
    // No proxy — E2E tests run without a backend; API calls return 502 instantly
    proxy: {}
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  build: {
    target: 'es2022',
    outDir: "dist",
    sourcemap: 'hidden',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Normalize path separators for cross-platform consistency (Windows \ vs Linux /)
          const normalizedId = id.replace(/\\/g, '/');

          // ── Vendor isolation: route node_modules by package path ──

          // Editor: Tiptap + ProseMirror core (the biggest offender)
          if (normalizedId.includes("node_modules/@tiptap/") || normalizedId.includes("node_modules/prosemirror-") || normalizedId.includes("node_modules/@tiptap/pm")) {
            return "editor";
          }

          // Code highlighting & syntax (co-located with markdown to avoid circular chunks)
          // NOTE: react-syntax-highlighter and markdown/rehype share dependencies.
          //       Splitting them causes: Circular chunk: syntax -> markdown -> syntax
          if (normalizedId.includes("node_modules/highlight.js") || normalizedId.includes("node_modules/lowlight") || normalizedId.includes("node_modules/katex") || normalizedId.includes("node_modules/react-syntax-highlighter")) {
            return "markdown";
          }

          // Icons: lucide-react ships 1500+ icon components
          if (normalizedId.includes("node_modules/lucide-react")) {
            return "icons";
          }

          // Media processing: heic2any is 1.3MB alone
          if (normalizedId.includes("node_modules/heic2any")) {
            return "media";
          }

          // Monaco Editor
          if (normalizedId.includes("node_modules/monaco-editor") || normalizedId.includes("node_modules/@monaco-editor")) {
            return "monaco";
          }
          if (normalizedId.includes("node_modules/monaco-vim")) {
            return "monaco-vim";
          }

          // Babel for in-browser transpilation
          if (normalizedId.includes("node_modules/@babel/")) {
            return "babel";
          }

          // Document import
          if (normalizedId.includes("node_modules/mammoth")) {
            return "mammoth";
          }

          // 3D visualization
          if (normalizedId.includes("node_modules/three") || normalizedId.includes("node_modules/@react-three/")) {
            return "threejs";
          }

          // Flow diagrams
          if (normalizedId.includes("node_modules/@xyflow/")) {
            return "flow";
          }

          // Analytics charts
          if (normalizedId.includes("node_modules/@tremor/")) {
            return "tremor";
          }

          // Animation
          if (normalizedId.includes("node_modules/framer-motion")) {
            return "motion";
          }

          // Router
          if (normalizedId.includes("node_modules/react-router")) {
            return "router";
          }

          // UI primitives (Radix, Headless UI, dnd-kit)
          if (normalizedId.includes("node_modules/@radix-ui/") || normalizedId.includes("node_modules/@headlessui/") || normalizedId.includes("node_modules/@dnd-kit/")) {
            return "ui-primitives";
          }

          // DOMPurify + markdown rendering + syntax highlighting (unified to prevent circular chunks)
          if (normalizedId.includes("node_modules/dompurify") || normalizedId.includes("node_modules/react-markdown") || normalizedId.includes("node_modules/remark-") || normalizedId.includes("node_modules/rehype-")) {
            return "markdown";
          }

          // React core (shared across all chunks)
          if (normalizedId.includes("node_modules/react/") || normalizedId.includes("node_modules/react-dom/")) {
            return "react-vendor";
          }

          // TanStack query + table (shared data layer)
          if (normalizedId.includes("node_modules/@tanstack/")) {
            return "tanstack";
          }
        },
      },
    },
  },
});
