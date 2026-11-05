import { useCallback, useMemo, useRef, useState } from 'react'
import {
  Circle,
  FeatureGroup,
  MapContainer,
  Marker,
  Polygon,
  Popup,
  TileLayer,
} from 'react-leaflet'
import type {
  ControlDrawToolbarOptions,
  DeleteStartEvent,
  DeleteStopEvent,
  DrawCreatedEvent,
  DrawDeletedEvent,
  DrawEditedEvent,
  DrawStartEvent,
  DrawStopEvent,
  EditStartEvent,
  EditStopEvent,
} from 'leaflet-scribe/react'
import { EditControl } from 'leaflet-scribe/react'
import type { FeatureGroup as LeafletFeatureGroup, Layer, Map as LeafletMap } from 'leaflet'

const CENTER: [number, number] = [51.505, -0.09]
const ZOOM = 13
const SEED_LAYER_COUNT = 3

type ToolKey = 'polyline' | 'polygon' | 'rectangle' | 'circle' | 'marker' | 'circlemarker'

const TOOLS: Array<{ key: ToolKey; label: string }> = [
  { key: 'polyline', label: 'Polyline' },
  { key: 'polygon', label: 'Polygon' },
  { key: 'rectangle', label: 'Rectangle' },
  { key: 'circle', label: 'Circle' },
  { key: 'marker', label: 'Marker' },
  { key: 'circlemarker', label: 'Circle marker' },
]

type LogTone = 'create' | 'update' | 'delete' | 'info'

interface LogEntry {
  id: number
  time: string
  title: string
  detail: string
  tone: LogTone
}

type ExportableLayer = Layer & { toGeoJSON: () => Record<string, unknown> }

const isExportable = (layer: Layer): layer is ExportableLayer =>
  typeof (layer as ExportableLayer).toGeoJSON === 'function'

const timestamp = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

const humanizeLayerType = (layerType: string) =>
  layerType === 'circlemarker'
    ? 'Circle marker'
    : `${layerType.charAt(0).toUpperCase()}${layerType.slice(1)}`

const initialTools: Record<ToolKey, boolean> = {
  polyline: true,
  polygon: true,
  rectangle: true,
  circle: true,
  marker: true,
  circlemarker: true,
}

const initialLog: LogEntry[] = [
  {
    id: 0,
    time: timestamp(),
    title: 'Playground ready',
    detail: `${SEED_LAYER_COUNT} sample layers loaded`,
    tone: 'info',
  },
]

export function App() {
  const mapRef = useRef<LeafletMap | null>(null)
  const featureGroupRef = useRef<LeafletFeatureGroup | null>(null)
  const nextLogId = useRef(1)

  const [tools, setTools] = useState(initialTools)
  const [layerCount, setLayerCount] = useState(SEED_LAYER_COUNT)
  const [log, setLog] = useState<LogEntry[]>(initialLog)

  const addLog = useCallback((tone: LogTone, title: string, detail: string) => {
    const entry: LogEntry = {
      id: nextLogId.current++,
      time: timestamp(),
      title,
      detail,
      tone,
    }
    setLog((previous) => [entry, ...previous].slice(0, 40))
  }, [])

  const syncLayerCount = useCallback(() => {
    setLayerCount(featureGroupRef.current?.getLayers().length ?? 0)
  }, [])

  const toggleTool = (key: ToolKey) => {
    setTools((previous) => ({ ...previous, [key]: !previous[key] }))
  }

  const handleCreated = useCallback(
    (event: DrawCreatedEvent) => {
      addLog('create', `${humanizeLayerType(event.layerType)} created`, 'onCreated → draw:created')
      syncLayerCount()
    },
    [addLog, syncLayerCount],
  )

  const handleEdited = useCallback(
    (event: DrawEditedEvent) => {
      const count = event.layers.getLayers().length
      addLog('update', `${count} layer${count === 1 ? '' : 's'} updated`, 'onEdited → draw:edited')
      syncLayerCount()
    },
    [addLog, syncLayerCount],
  )

  const handleDeleted = useCallback(
    (event: DrawDeletedEvent) => {
      const count = event.layers.getLayers().length
      addLog(
        'delete',
        `${count} layer${count === 1 ? '' : 's'} deleted`,
        'onDeleted → draw:deleted',
      )
      syncLayerCount()
    },
    [addLog, syncLayerCount],
  )

  const handleDrawStart = useCallback(
    (event: DrawStartEvent) => {
      addLog('info', `Drawing ${humanizeLayerType(event.layerType)}`, 'onDrawStart')
    },
    [addLog],
  )

  const handleDrawStop = useCallback(
    (event: DrawStopEvent) => {
      addLog('info', `Stopped ${humanizeLayerType(event.layerType)}`, 'onDrawStop')
    },
    [addLog],
  )

  const handleEditStart = useCallback(
    (_event: EditStartEvent) => addLog('info', 'Edit mode started', 'onEditStart'),
    [addLog],
  )

  const handleEditStop = useCallback(
    (_event: EditStopEvent) => addLog('info', 'Edit mode ended', 'onEditStop'),
    [addLog],
  )

  const handleDeleteStart = useCallback(
    (_event: DeleteStartEvent) => addLog('info', 'Delete mode started', 'onDeleteStart'),
    [addLog],
  )

  const handleDeleteStop = useCallback(
    (_event: DeleteStopEvent) => addLog('info', 'Delete mode ended', 'onDeleteStop'),
    [addLog],
  )

  const drawOptions = useMemo<ControlDrawToolbarOptions>(
    () => ({
      polyline: tools.polyline
        ? { shapeOptions: { color: '#4f46e5', weight: 4 }, showLength: true }
        : false,
      polygon: tools.polygon
        ? {
            allowIntersection: false,
            showArea: true,
            showLength: true,
            shapeOptions: { color: '#0284c7', weight: 3 },
          }
        : false,
      rectangle: tools.rectangle
        ? { shapeOptions: { color: '#d97706', weight: 3 }, showArea: true }
        : false,
      circle: tools.circle
        ? { shapeOptions: { color: '#059669', weight: 3 }, showRadius: true }
        : false,
      marker: tools.marker,
      circlemarker: tools.circlemarker
        ? { radius: 8, color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.9 }
        : false,
    }),
    [tools],
  )

  const clearAll = () => {
    featureGroupRef.current?.clearLayers()
    setLayerCount(0)
    addLog('delete', 'All layers cleared', 'FeatureGroup.clearLayers()')
  }

  const resetView = () => {
    mapRef.current?.setView(CENTER, ZOOM)
    addLog('info', 'Map view reset', 'Map.setView()')
  }

  const exportGeoJson = () => {
    const layers = featureGroupRef.current?.getLayers() ?? []
    const features = layers.filter(isExportable).map((layer) => layer.toGeoJSON())
    const collection = { type: 'FeatureCollection' as const, features }
    const blob = new Blob([JSON.stringify(collection, null, 2)], {
      type: 'application/geo+json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'leaflet-scribe-features.geojson'
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    addLog(
      'info',
      `${features.length} feature${features.length === 1 ? '' : 's'} exported`,
      'GeoJSON download',
    )
  }

  const enabledToolCount = TOOLS.filter(({ key }) => tools[key]).length

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <header className="brand">
          <span className="eyebrow">leaflet-scribe</span>
          <h1>Drawing test bench</h1>
          <p className="lede">
            Draw, edit, and remove shapes to exercise the core plugin and React bindings.
          </p>
        </header>

        <section className="stats" aria-label="Map statistics">
          <div className="stat">
            <span className="stat-value">{layerCount}</span>
            <span className="stat-label">Layers</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {enabledToolCount}
              <span className="stat-total">/{TOOLS.length}</span>
            </span>
            <span className="stat-label">Draw tools</span>
          </div>
        </section>

        <section className="panel-section">
          <h2>Draw tools</h2>
          <div className="tool-grid">
            {TOOLS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`tool-toggle${tools[key] ? ' is-on' : ''}`}
                aria-pressed={tools[key]}
                onClick={() => toggleTool(key)}
              >
                <span className="tool-dot" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
          <p className="section-note">
            Toggle a tool to verify that the control updates without remounting the map.
          </p>
        </section>

        <section className="panel-section">
          <h2>Actions</h2>
          <div className="actions">
            <button type="button" className="btn" onClick={resetView}>
              Reset view
            </button>
            <button type="button" className="btn" onClick={exportGeoJson}>
              Export GeoJSON
            </button>
            <button type="button" className="btn btn-danger" onClick={clearAll}>
              Clear all
            </button>
          </div>
        </section>

        <section className="panel-section log-section">
          <div className="log-heading">
            <h2>Event log</h2>
            <button
              type="button"
              className="link-button"
              onClick={() => setLog([])}
              disabled={log.length === 0}
            >
              Clear
            </button>
          </div>
          {log.length === 0 ? (
            <p className="empty-log">Interact with the map to see events here.</p>
          ) : (
            <ol className="log-list">
              {log.map((entry) => (
                <li key={entry.id} className={`log-entry tone-${entry.tone}`}>
                  <span className="log-dot" aria-hidden="true" />
                  <div className="log-body">
                    <span className="log-title">{entry.title}</span>
                    <span className="log-detail">{entry.detail}</span>
                  </div>
                  <time className="log-time">{entry.time}</time>
                </li>
              ))}
            </ol>
          )}
        </section>
      </aside>

      <main className="map-pane">
        <MapContainer
          ref={mapRef}
          center={CENTER}
          zoom={ZOOM}
          className="map"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FeatureGroup ref={featureGroupRef}>
            <EditControl
              position="topright"
              draw={drawOptions}
              edit={{ remove: true }}
              onCreated={handleCreated}
              onEdited={handleEdited}
              onDeleted={handleDeleted}
              onDrawStart={handleDrawStart}
              onDrawStop={handleDrawStop}
              onEditStart={handleEditStart}
              onEditStop={handleEditStop}
              onDeleteStart={handleDeleteStart}
              onDeleteStop={handleDeleteStop}
            />

            <Polygon
              positions={[
                [51.515, -0.12],
                [51.522, -0.08],
                [51.507, -0.06],
                [51.498, -0.1],
              ]}
              pathOptions={{ color: '#0284c7', weight: 3, fillOpacity: 0.15 }}
            >
              <Popup>Sample polygon — try moving a vertex or dragging the shape.</Popup>
            </Polygon>

            <Circle
              center={[51.503, -0.06]}
              radius={450}
              pathOptions={{ color: '#059669', weight: 3, fillOpacity: 0.12 }}
            >
              <Popup>Sample circle — edit or resize it with the edit toolbar.</Popup>
            </Circle>

            <Marker position={[51.508, -0.1]}>
              <Popup>Sample marker — drag it in edit mode.</Popup>
            </Marker>
          </FeatureGroup>
        </MapContainer>

        <div className="map-hint">
          Use the toolbar in the top-right corner. Edit and delete live in the same toolbar.
        </div>
      </main>
    </div>
  )
}
