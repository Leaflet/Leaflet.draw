# leaflet-scribe

## 2.1.0

### Minor Changes

- 25b8f6a: Add center move handles to polylines and polygons in edit mode so the whole shape can be dragged, matching the existing circle and rectangle move behavior.

## 2.0.1

### Patch Changes

- 5bc8935: Fix `L.Edit.Poly` and `L.Edit.PolyVerticesEdit` vertex/middle-marker index synchronization, refresh edit handlers when `setLatLngs` is called on a polyline/polygon, and ensure `_markerGroup` is removed from the map when a layer is removed while editing is enabled.

## 2.0.0

### Major Changes

- 63153b1: **Major Architecture & TypeScript Refactor (`2.0.0`)**: Rebuilt `leaflet-scribe` in strict TypeScript with dual ESM (`.js`) and CommonJS (`.cjs`) bundles, complete `.d.ts` / `.d.cts` type declarations, and consolidated React-Leaflet bindings (`leaflet-scribe/react`).

  #### Unified Core & Optional React Bindings

  - **`leaflet-scribe` / `leaflet-scribe/core`**: Framework-agnostic Leaflet vector drawing and editing plugin (`L.Control.Draw`, `L.Draw`, `L.Edit`, `L.DrawToolbar`, `L.EditToolbar`, `L.GeometryUtil`, `L.LatLngUtil`, `L.drawLocal`) with zero React dependency required.
  - **`leaflet-scribe/react`**: Migrated `<EditControl>` from `react-leaflet-scribe` into `leaflet-scribe/react` with optional peer dependencies (`react`, `react-dom`, `react-leaflet`).
  - **Fixed `<EditControl>` Event Listener & Stale Prop Bugs**: Bound map event handlers now reference latest props via a mutable ref and detach cleanly on unmount, preventing duplicate/leaked listeners and unnecessary `L.Control.Draw` remounts when callback identities change.
  - **Zero External Runtime Dependencies**: Replaced external `fast-deep-equal` with a built-in `deepEqual` utility.

  #### Styles & Assets

  - **`leaflet-scribe/styles.css` & `leaflet-scribe/dist/leaflet.draw.css`**: Exported both modern and legacy stylesheet paths along with toolbar and handle spritesheet assets (`dist/images/*`).

## 1.0.7

### Patch Changes

- Refactor shape retrieval to use `L.GeometryUtil.getDefaultShape` for consistency across Leaflet 1.8+/1.9+.
