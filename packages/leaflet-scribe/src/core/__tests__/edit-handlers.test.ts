import type * as LTypes from 'leaflet'
import { beforeEach, describe, expect, it } from 'vitest'
import { L } from '../index.js'

describe('L.Edit', () => {
  let map: LTypes.Map

  beforeEach(() => {
    map = new L.Map(document.createElement('div')).setView([0, 0], 15)
  })

  describe('L.Edit.Marker', () => {
    let marker: LTypes.Marker

    beforeEach(() => {
      marker = new L.Marker(new L.LatLng(1, 2)).addTo(map)
      marker.editing?.enable()
    })

    it('has the leaflet-edit-marker-selected class applied when enabled', () => {
      const editingClass = 'leaflet-edit-marker-selected'
      const icon = (marker as unknown as { _icon: HTMLElement })._icon

      expect(marker.editing?.enabled()).toBe(true)
      expect(L.DomUtil.hasClass(icon, editingClass)).toBe(true)
    })

    it('lacks the leaflet-edit-marker-selected class when disabled', () => {
      const editingClass = 'leaflet-edit-marker-selected'
      const icon = (marker as unknown as { _icon: HTMLElement })._icon

      marker.editing?.disable()

      expect(marker.editing?.enabled()).toBe(false)
      expect(L.DomUtil.hasClass(icon, editingClass)).toBe(false)
    })
  })

  describe('L.Edit.CircleMarker', () => {
    let circleMarker: LTypes.CircleMarker

    beforeEach(() => {
      circleMarker = new L.CircleMarker(new L.LatLng(1, 2), {}).addTo(map)
      circleMarker.editing?.enable()
    })

    it('moves the circlemarker to the correct latlng', () => {
      const newLatLng = new L.LatLng(3, 5)
      ;(circleMarker.editing as LTypes.Edit.CircleMarker)._move(newLatLng)

      expect(circleMarker.getLatLng()).toEqual(newLatLng)
    })
  })

  describe('L.Edit.Circle', () => {
    let circle: LTypes.Circle

    beforeEach(() => {
      circle = new L.Circle(new L.LatLng(1, 2), 5).addTo(map)
      circle.editing?.enable()
    })

    it('moves the circle to the correct latlng', () => {
      const newLatLng = new L.LatLng(3, 5)
      ;(circle.editing as LTypes.Edit.Circle)._move(newLatLng)

      expect(circle.getLatLng()).toEqual(newLatLng)
    })
  })

  describe('L.Edit.Poly', () => {
    let edit: LTypes.EditToolbar.Edit
    let drawnItems: LTypes.FeatureGroup
    let poly: LTypes.Polyline

    beforeEach(() => {
      drawnItems = new L.FeatureGroup().addTo(map)
      edit = new L.EditToolbar.Edit(map, {
        featureGroup: drawnItems,
        poly: {
          allowIntersection: false,
        },
        selectedPathOptions: L.EditToolbar.prototype.options.edit.selectedPathOptions,
      })
      poly = new L.Polyline([L.latLng(41, -87), L.latLng(42, -88)])
    })

    it('changes the style of the polyline during editing mode', () => {
      const originalOptions = L.extend({}, poly.options)

      drawnItems.addLayer(poly)
      edit.enable()

      expect(poly.editing?.enabled()).toBe(true)
      expect(poly.options).not.toEqual(originalOptions)
    })

    it('reverts to original styles when editing is toggled', () => {
      const originalOptions = L.extend(
        { maintainColor: false, poly: { allowIntersection: false } },
        poly.options,
      )

      drawnItems.addLayer(poly)
      edit.enable()
      edit.disable()

      expect(poly.options).toEqual(originalOptions)
    })

    it('sets allowIntersection to false when configured', () => {
      drawnItems.addLayer(poly)
      edit.enable()

      expect(poly.editing?.enabled()).toBe(true)
      expect(poly.options.poly?.allowIntersection).toBe(false)
    })

    it('keeps vertex and middle markers synchronized when inserting on the closing edge and deleting vertices', () => {
      const polygon = new L.Polygon([
        L.latLng(0, 0),
        L.latLng(0, 10),
        L.latLng(10, 10),
        L.latLng(10, 0),
      ])
      drawnItems.addLayer(polygon)
      edit.enable()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const polyEdit = polygon.editing as any
      const verticesHandler = polyEdit._verticesHandlers[0]

      // 4 vertices + 4 middle markers = 8 layers in _markerGroup
      expect(verticesHandler._markers.length).toBe(4)
      expect(verticesHandler._markerGroup.getLayers().length).toBe(8)

      // Click the middle marker on the closing edge (between last vertex and first vertex)
      const closingMiddleMarker = verticesHandler._markers[0]._middleLeft
      closingMiddleMarker.fire('click')

      // Now 5 vertices + 5 middle markers = 10 layers
      expect(verticesHandler._markers.length).toBe(5)
      expect(verticesHandler._defaultShape().length).toBe(5)
      expect(verticesHandler._markerGroup.getLayers().length).toBe(10)

      // Click one of the new middle markers to insert a 6th vertex
      const secondMiddleMarker = verticesHandler._markers[0]._middleLeft
      secondMiddleMarker.fire('click')

      expect(verticesHandler._markers.length).toBe(6)
      expect(verticesHandler._defaultShape().length).toBe(6)
      expect(verticesHandler._markerGroup.getLayers().length).toBe(12)

      // Verify every marker's _index matches its position in _markers and _defaultShape()
      for (let i = 0; i < verticesHandler._markers.length; i++) {
        expect(verticesHandler._markers[i]._index).toBe(i)
        expect(verticesHandler._markers[i]._origLatLng).toBe(
          verticesHandler._defaultShape()[i],
        )
      }

      // Click the two newly inserted vertices to delete them
      verticesHandler._markers[0].fire('click')
      expect(verticesHandler._markers.length).toBe(5)
      expect(verticesHandler._defaultShape().length).toBe(5)
      expect(verticesHandler._markerGroup.getLayers().length).toBe(10)

      verticesHandler._markers[0].fire('click')
      expect(verticesHandler._markers.length).toBe(4)
      expect(verticesHandler._defaultShape().length).toBe(4)
      expect(verticesHandler._markerGroup.getLayers().length).toBe(8)
    })

    it('refreshes edit markers cleanly when setLatLngs is called before or during editing', () => {
      const polygon = new L.Polygon([
        L.latLng(0, 0),
        L.latLng(0, 10),
        L.latLng(10, 10),
        L.latLng(10, 0),
      ])
      drawnItems.addLayer(polygon)

      // Update latlngs before enabling edit
      polygon.setLatLngs([
        L.latLng(1, 1),
        L.latLng(1, 5),
        L.latLng(5, 5),
      ])

      edit.enable()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const polyEdit = polygon.editing as any
      expect(polyEdit._verticesHandlers[0]._markers.length).toBe(3)
      expect(polyEdit._verticesHandlers[0]._markerGroup.getLayers().length).toBe(6)

      // Update latlngs while editing is enabled
      const oldMarkerGroup = polyEdit._verticesHandlers[0]._markerGroup
      polygon.setLatLngs([
        L.latLng(2, 2),
        L.latLng(2, 8),
        L.latLng(8, 8),
        L.latLng(8, 2),
        L.latLng(5, 0),
      ])

      expect(map.hasLayer(oldMarkerGroup)).toBe(false)
      expect(polyEdit._verticesHandlers[0]._markers.length).toBe(5)
      expect(polyEdit._verticesHandlers[0]._markerGroup.getLayers().length).toBe(10)
    })

    it('moves the whole polygon when dragging the center move marker', () => {
      const polygon = new L.Polygon([
        L.latLng(0, 0),
        L.latLng(0, 10),
        L.latLng(10, 10),
        L.latLng(10, 0),
      ])
      drawnItems.addLayer(polygon)
      edit.enable()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const polyEdit = polygon.editing as any
      const moveMarker = polyEdit._moveMarker
      const before = polygon
        .getLatLngs()[0]
        .map((latlng: LTypes.LatLng) => L.latLng(latlng.lat, latlng.lng))
      const editedEvents: string[] = []

      map.on(L.Draw.Event.EDITMOVE, (event: LTypes.LeafletEvent) => {
        editedEvents.push(event.type)
      })

      expect(moveMarker).toBeDefined()

      moveMarker.fire('dragstart')
      moveMarker.setLatLng(L.latLng(7, 8))
      moveMarker.fire('drag')
      moveMarker.fire('dragend')

      const after = polygon.getLatLngs()[0]

      for (let i = 0; i < after.length; i++) {
        expect(after[i].lat).toBeCloseTo(before[i].lat + 2, 4)
        expect(after[i].lng).toBeCloseTo(before[i].lng + 3, 4)
      }

      expect(editedEvents).toContain(L.Draw.Event.EDITMOVE)
      expect(polygon.edited).toBe(true)
      expect(moveMarker.getLatLng().equals(polygon.getBounds().getCenter())).toBe(true)
    })

    it('removes the polygon center move marker when editing is disabled', () => {
      const polygon = new L.Polygon([
        L.latLng(0, 0),
        L.latLng(0, 10),
        L.latLng(10, 10),
        L.latLng(10, 0),
      ])
      drawnItems.addLayer(polygon)
      edit.enable()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const moveMarker = (polygon.editing as any)._moveMarker as LTypes.Marker
      expect(map.hasLayer(moveMarker)).toBe(true)

      polygon.editing?.disable()

      expect(map.hasLayer(moveMarker)).toBe(false)
    })

    it('moves the whole polyline when dragging the center move marker', () => {
      const polyline = new L.Polyline([
        L.latLng(0, 0),
        L.latLng(0, 10),
        L.latLng(10, 10),
      ])
      drawnItems.addLayer(polyline)
      edit.enable()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const polyEdit = polyline.editing as any
      const moveMarker = polyEdit._moveMarker
      const before = polyline
        .getLatLngs()
        .map((latlng: LTypes.LatLng) => L.latLng(latlng.lat, latlng.lng))

      expect(moveMarker).toBeDefined()

      moveMarker.fire('dragstart')
      moveMarker.setLatLng(L.latLng(7, 8))
      moveMarker.fire('drag')
      moveMarker.fire('dragend')

      const after = polyline.getLatLngs()

      for (let i = 0; i < after.length; i++) {
        expect(after[i].lat).toBeCloseTo(before[i].lat + 2, 4)
        expect(after[i].lng).toBeCloseTo(before[i].lng + 3, 4)
      }

      expect(polyline.edited).toBe(true)
      expect(moveMarker.getLatLng().equals(polyline.getBounds().getCenter())).toBe(true)
    })

    it('keeps the center move marker in sync after a vertex is dragged', () => {
      const polygon = new L.Polygon([
        L.latLng(0, 0),
        L.latLng(0, 10),
        L.latLng(10, 10),
        L.latLng(10, 0),
      ])
      drawnItems.addLayer(polygon)
      edit.enable()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const polyEdit = polygon.editing as any
      const verticesHandler = polyEdit._verticesHandlers[0]
      const marker = verticesHandler._markers[3]
      marker.fire('dragstart')
      marker._latlng = L.latLng(-5, 15)
      marker.fire('drag')
      marker.fire('dragend')

      expect(polyEdit._moveMarker.getLatLng().equals(polygon.getBounds().getCenter())).toBe(true)
    })

    it('removes _markerGroup from the map when the polygon is removed from the map while editing', () => {
      const polygon = new L.Polygon([
        L.latLng(0, 0),
        L.latLng(0, 10),
        L.latLng(10, 10),
      ]).addTo(map)
      polygon.editing?.enable()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const markerGroup = (polygon.editing as any)._verticesHandlers[0]._markerGroup
      expect(map.hasLayer(markerGroup)).toBe(true)

      map.removeLayer(polygon)
      expect(map.hasLayer(markerGroup)).toBe(false)
    })
  })

  describe('L.EditToolbar.Delete', () => {
    let drawnItems: LTypes.FeatureGroup
    let marker: LTypes.Marker
    let circle: LTypes.Circle
    let poly: LTypes.Polyline
    let deleteToolbar: LTypes.EditToolbar.Delete

    beforeEach(() => {
      drawnItems = new L.FeatureGroup().addTo(map)
      deleteToolbar = new L.EditToolbar.Delete(map, {
        featureGroup: drawnItems,
      })
      marker = new L.Marker(new L.LatLng(1, 2))
      circle = new L.Circle(new L.LatLng(1, 2), 5)
      poly = new L.Polyline([L.latLng(41, -87), L.latLng(42, -88)])
      drawnItems.addLayer(marker).addLayer(circle).addLayer(poly)
    })

    it('starts with 3 features on the draw layer', () => {
      expect(drawnItems.getLayers().length).toBe(3)
    })

    it('clears all features when removeAllLayers is called', () => {
      deleteToolbar.enable()
      deleteToolbar.removeAllLayers()
      deleteToolbar.disable()
      expect(drawnItems.getLayers().length).toBe(0)
    })

    it('fires DELETESTART, DELETED, and DELETESTOP events on the map', () => {
      const events: string[] = []
      map.on(L.Draw.Event.DELETESTART, (event: LTypes.LeafletEvent) => {
        events.push(event.type)
      })
      map.on(L.Draw.Event.DELETED, (event: LTypes.LeafletEvent) => {
        events.push(event.type)
      })
      map.on(L.Draw.Event.DELETESTOP, (event: LTypes.LeafletEvent) => {
        events.push(event.type)
      })

      deleteToolbar.enable()
      deleteToolbar.removeAllLayers()
      deleteToolbar.disable()

      expect(events).toEqual([
        L.Draw.Event.DELETESTART,
        L.Draw.Event.DELETED,
        L.Draw.Event.DELETESTOP,
      ])
    })
  })
})

