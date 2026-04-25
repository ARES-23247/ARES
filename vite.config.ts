/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
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
        'functions/api/routes/logistics.ts',
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
              cacheName: 'ares-api-cache',
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
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // ── Vendor isolation: route node_modules by package path ──

          // Editor: Tiptap + ProseMirror core (the biggest offender)
          if (id.includes("node_modules/@tiptap/") || id.includes("node_modules/prosemirror-") || id.includes("node_modules/@tiptap/pm")) {
            return "editor";
          }

          // Code highlighting & math rendering (used inside editor)
          if (id.includes("node_modules/highlight.js") || id.includes("node_modules/lowlight") || id.includes("node_modules/katex")) {
            return "syntax-highlight";
          }
          if (id.includes("node_modules/react-syntax-highlighter")) {
            return "syntax";
          }

          // Icons: lucide-react ships 1500+ icon components
          if (id.includes("node_modules/lucide-react")) {
            return "icons";
          }

          // Media processing: heic2any is 1.3MB alone
          if (id.includes("node_modules/heic2any")) {
            return "media";
          }

          // Document import
          if (id.includes("node_modules/mammoth")) {
            return "mammoth";
          }

          // 3D visualization
          if (id.includes("node_modules/three") || id.includes("node_modules/@react-three/")) {
            return "threejs";
          }

          // Flow diagrams
          if (id.includes("node_modules/@xyflow/")) {
            return "flow";
          }

          // Analytics charts
          if (id.includes("node_modules/@tremor/")) {
            return "tremor";
          }

          // Animation
          if (id.includes("node_modules/framer-motion")) {
            return "motion";
          }

          // Router
          if (id.includes("node_modules/react-router")) {
            return "router";
          }

          // UI primitives (Radix, Headless UI, dnd-kit)
          if (id.includes("node_modules/@radix-ui/") || id.includes("node_modules/@headlessui/") || id.includes("node_modules/@dnd-kit/")) {
            return "ui-primitives";
          }

          // DOMPurify + markdown rendering
          if (id.includes("node_modules/dompurify") || id.includes("node_modules/react-markdown") || id.includes("node_modules/remark-") || id.includes("node_modules/rehype-")) {
            return "markdown";
          }

          // React core (shared across all chunks)
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "react-vendor";
          }

          // TanStack query + table (shared data layer)
          if (id.includes("node_modules/@tanstack/")) {
            return "tanstack";
          }
        },
      },
    },
  },
});
