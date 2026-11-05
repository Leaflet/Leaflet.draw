# Leaflet Scribe

[![npm version](https://badge.fury.io/js/leaflet-scribe.svg)](https://www.npmjs.com/package/leaflet-scribe)
[![NPM Downloads](https://img.shields.io/npm/dt/leaflet-scribe.svg)](https://www.npmjs.com/package/leaflet-scribe)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Vector drawing and editing toolkit for [Leaflet](https://leafletjs.com/) maps — draw and edit polylines, polygons, rectangles, circles, circle markers, and markers with full TypeScript types and optional [React-Leaflet](https://react-leaflet.js.org/) bindings (`leaflet-scribe/react`).

> **Note:** `react-leaflet-scribe` has been merged into `leaflet-scribe/react`. Import `<EditControl>` directly from `leaflet-scribe/react`.

---

## Package Exports

| Import | Description | React Required? |
| --- | --- | --- |
| `leaflet-scribe` / `leaflet-scribe/core` | Framework-agnostic core plugin (`L.Control.Draw`, `L.Draw`, `L.Edit`, `L.GeometryUtil`, `L.LatLngUtil`, `L.drawLocal`) | No |
| `leaflet-scribe/react` | React-Leaflet `<EditControl>` component, helpers, and TypeScript types | Yes (optional peer) |
| `leaflet-scribe/styles.css` | Toolbar, tooltip, and vertex handle stylesheet (also available at `leaflet-scribe/dist/leaflet.draw.css`) | No |

---

## Installation

```bash
npm install leaflet-scribe leaflet
```

If using React-Leaflet (`leaflet-scribe/react`):

```bash
npm install leaflet-scribe leaflet react react-dom react-leaflet
```

---

## Usage (Vanilla JS / TypeScript)

```ts
import L from 'leaflet'
import 'leaflet-scribe'
import 'leaflet/dist/leaflet.css'
import 'leaflet-scribe/styles.css'

const map = L.map('map').setView([51.505, -0.09], 13)

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map)

const drawnItems = new L.FeatureGroup()
map.addLayer(drawnItems)

const drawControl = new L.Control.Draw({
  position: 'topright',
  draw: {
    polyline: {
      shapeOptions: {
        color: '#f357a1',
        weight: 6,
      },
    },
    polygon: {
      allowIntersection: false,
      showArea: true,
      shapeOptions: {
        color: '#3388ff',
      },
    },
    circle: false,
    rectangle: {
      shapeOptions: {
        clickable: false,
      },
    },
    marker: true,
    circlemarker: false,
  },
  edit: {
    featureGroup: drawnItems,
    remove: true,
  },
})

map.addControl(drawControl)

map.on(L.Draw.Event.CREATED, (e) => {
  const event = e as L.DrawEvents.Created
  drawnItems.addLayer(event.layer)
})
```

### Customizing Language and Text (`L.drawLocal`)

```ts
import L from 'leaflet'
import 'leaflet-scribe'

L.drawLocal.draw.toolbar.buttons.polygon = 'Draw a custom polygon!'
L.drawLocal.draw.handlers.rectangle.tooltip.start = 'Click and drag to draw a box'
```

### Updating Drawing Handler Options Dynamically

```ts
drawControl.setDrawingOptions({
  rectangle: {
    shapeOptions: {
      color: '#0000ff',
    },
  },
})
```

---

## Usage with React (`leaflet-scribe/react`)

Wrap `<EditControl>` inside a `<FeatureGroup>` from `react-leaflet`. Drawn shapes are automatically added to that `<FeatureGroup>` and made editable.

```tsx
import { MapContainer, TileLayer, FeatureGroup, Circle } from 'react-leaflet'
import { EditControl } from 'leaflet-scribe/react'
import 'leaflet/dist/leaflet.css'
import 'leaflet-scribe/styles.css'

export function MapEditor() {
  return (
    <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '100vh' }}>
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FeatureGroup>
        <EditControl
          position="topright"
          onCreated={(e) => console.log('Created:', e.layerType, e.layer)}
          onEdited={(e) => console.log('Edited:', e.layers)}
          onDeleted={(e) => console.log('Deleted:', e.layers)}
          draw={{
            rectangle: false,
          }}
        />
        <Circle center={[51.51, -0.06]} radius={200} />
      </FeatureGroup>
    </MapContainer>
  )
}
```

### `<EditControl>` Props

| Prop | Type | Description |
| --- | --- | --- |
| `position` | `L.ControlPosition` | Control corner position (`'topleft'`, `'topright'`, `'bottomleft'`, `'bottomright'`) |
| `draw` | `ControlDrawToolbarOptions \| false` | Enable/disable or configure draw handlers (`polyline`, `polygon`, `rectangle`, `circle`, `marker`, `circlemarker`) |
| `edit` | `Omit<ControlEditToolbarOptions, 'featureGroup'> \| false` | Enable/disable or configure edit & delete handlers |
| `onMounted` | `(control: L.Control.Draw) => void` | Invoked when the `L.Control.Draw` instance is added to the map |
| `onCreated` | `(e: L.DrawEvents.Created) => void` | Hook to `draw:created` |
| `onEdited` | `(e: L.DrawEvents.Edited) => void` | Hook to `draw:edited` |
| `onDeleted` | `(e: L.DrawEvents.Deleted) => void` | Hook to `draw:deleted` |
| `onDrawStart` | `(e: L.DrawEvents.DrawStart) => void` | Hook to `draw:drawstart` |
| `onDrawStop` | `(e: L.DrawEvents.DrawStop) => void` | Hook to `draw:drawstop` |
| `onDrawVertex` | `(e: L.DrawEvents.DrawVertex) => void` | Hook to `draw:drawvertex` |
| `onEditStart` | `(e: L.DrawEvents.EditStart) => void` | Hook to `draw:editstart` |
| `onEditMove` | `(e: L.DrawEvents.EditMove) => void` | Hook to `draw:editmove` |
| `onEditResize` | `(e: L.DrawEvents.EditResize) => void` | Hook to `draw:editresize` |
| `onEditVertex` | `(e: L.DrawEvents.EditVertex) => void` | Hook to `draw:editvertex` |
| `onEditStop` | `(e: L.DrawEvents.EditStop) => void` | Hook to `draw:editstop` |
| `onDeleteStart` | `(e: L.DrawEvents.DeleteStart) => void` | Hook to `draw:deletestart` |
| `onDeleteStop` | `(e: L.DrawEvents.DeleteStop) => void` | Hook to `draw:deletestop` |
| `onToolbarOpened` | `(e: L.DrawEvents.ToolbarOpened) => void` | Hook to `draw:toolbaropened` |
| `onToolbarClosed` | `(e: L.DrawEvents.ToolbarClosed) => void` | Hook to `draw:toolbarclosed` |
| `onMarkerContext` | `(e: L.DrawEvents.MarkerContext) => void` | Hook to `draw:markercontext` |

---

## Development

```bash
npm install
npm run lint:lib
npm run typecheck:lib
npm run test:lib
npm run build:lib
```

A Vite + React playground lives in `apps/playground` and imports the library from source for live testing:

```bash
npm run dev
```

## License

MIT
