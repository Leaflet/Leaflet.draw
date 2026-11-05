# leaflet-scribe playground

A small Vite + React app for manually testing `leaflet-scribe` from this monorepo.

The app imports the library from `packages/leaflet-scribe/src` through Vite aliases, so
source changes show up immediately with hot reload — no separate library build required.

## Run it

From the repository root:

```bash
npm install
npm run dev
```

Or run the workspace directly:

```bash
npm run dev --workspace=@leaflet-scribe/playground
```

Then open http://localhost:5173.

## What to test

- Draw each shape type with the toolbar in the top-right corner.
- Toggle draw tools in the sidebar; the control should update in place.
- Edit vertices, drag shapes, resize circles/rectangles, and move markers.
- Delete shapes with the delete toolbar.
- Watch the `onCreated`, `onEdited`, `onDeleted`, and lifecycle callbacks in the event log.
- Clear all layers, reset the map view, and export the current shapes as GeoJSON.

## Build

```bash
npm run build:playground
```
