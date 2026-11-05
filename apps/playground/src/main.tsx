import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import 'leaflet-scribe/styles.css'
import { App } from './App.js'
import './styles.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root container #root was not found')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
