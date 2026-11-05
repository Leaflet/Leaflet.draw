import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const fromApp = (path: string) => fileURLToPath(new URL(path, import.meta.url))

/**
 * Point the package imports at the library source so edits in
 * `packages/leaflet-scribe/src` are reflected immediately in the playground
 * without running a separate build/watch process.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^leaflet-scribe$/,
        replacement: fromApp('../../packages/leaflet-scribe/src/index.ts'),
      },
      {
        find: /^leaflet-scribe\/core$/,
        replacement: fromApp('../../packages/leaflet-scribe/src/index.ts'),
      },
      {
        find: /^leaflet-scribe\/react$/,
        replacement: fromApp('../../packages/leaflet-scribe/src/react.ts'),
      },
      {
        find: /^leaflet-scribe\/styles\.css$/,
        replacement: fromApp('../../packages/leaflet-scribe/src/styles/leaflet.draw.css'),
      },
      {
        find: /^leaflet-scribe\/dist\/leaflet\.draw\.css$/,
        replacement: fromApp('../../packages/leaflet-scribe/src/styles/leaflet.draw.css'),
      },
    ],
  },
  server: {
    port: 5173,
  },
})
