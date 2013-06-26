Leaflet.draw Changelog
======================

## master

An in-progress version being developed on the master branch.

### Improvements

 * `draw:edited` now returns a `FeatureGroup` of features edited. (by [@jmkelly](https://github.com/jmkelly)). [#95](https://github.com/Leaflet/Leaflet.draw/pull/95)
 * Circle tooltip shows the radius (in m) while drawing.
 * Added Leaflet version check to inform developers that Leaflet 0.6+ is required.
 * Added ability to finish drawing polygons by double clicking. (inspired by [@snkashis](https://github.com/snkashis)). [#121](https://github.com/Leaflet/Leaflet.label/pull/121)
 * Added test environment. (by [@iirvine](https://github.com/iirvine)). [#123](https://github.com/Leaflet/Leaflet.draw/pull/123)
 * Added `L.drawLocal` object to allow users to customize the text used in the plugin. Addresses localization issues. (by [@Starefossen](https://github.com/Starefossen)). [#87](https://github.com/Leaflet/Leaflet.draw/pull/87)
 * Added ability to disable edit mode path and marker styles. (inspired by [@markgibbons25](https://github.com/markgibbons25)). [#121](https://github.com/Leaflet/Leaflet.label/pull/137)
 * Added area calculation when drawing a polygon.
 * Polyline and Polygon tooltips update on click as well as mouse move.

### Bugfixes

 * Fixed issue where removing a vertex or adding a new one via midpoints would not update the edited state for polylines and polygons.
 * Fixed issue where not passing in the context to `off()` would result in the event from not being unbound.(by [@koppelbakje](https://github.com/koppelbakje)). [#95](https://github.com/Leaflet/Leaflet.draw/pull/112)
 * Fixed issue where removing the draw control from the map would result in an error.
 * Fixed bug where removing points created by dragging midpoints would cause the polyline to not reflect any newly created points.
 * Fixed regression where handlers were not able to be disabled.(by [@yohanboniface](https://github.com/yohanboniface)). [#139](https://github.com/Leaflet/Leaflet.draw/pull/139)
 * Fixed bug where L.Draw.Polyline would try to remove a non-existant handler if the user cancelled and the polyline only had a single point.

## 0.2.0 (February 20, 2013)

Major new version. Added Edit toolbar which allows editing and deleting shapes.

### Features

 * Consistant event for shape creation. (by [@krikrou](https://github.com/krikrou)). [#58](https://github.com/Leaflet/Leaflet.draw/pull/58)

### Bugfixes

 * Fixed adding markers over vector layers. (by [@Starefossen](https://github.com/Starefossen)). [#82](https://github.com/Leaflet/Leaflet.draw/pull/82)

## 0.1.7 (February 11, 2013)

 * Add sanity check for toolbar buttons when adding top and bottom classes. (by [@yohanboniface](https://github.com/yohanboniface)). [#60](https://github.com/Leaflet/Leaflet.draw/pull/60)

## 0.1.6 (January 17, 2013)

* Updated toolbar styles to be in line with the new Leaflet zoom in/out styles.

## 0.1.5 (December 10, 2012)

### Features

 * Added 'drawing-disabled' event fired on the map when a draw handler is disabled. (by [@ajbeaven](https://github.com/thegreat)). [#35](https://github.com/jacobtoye/Leaflet.draw/pull/35)
 * Added 'drawing' event fired on the map when a draw handler is actived. (by [@ajbeaven](https://github.com/thegreat)). [#30](https://github.com/jacobtoye/Leaflet.draw/pull/30)

### Bugfixes
 
 * Stopped L.Control.Draw from storing handlers in it's prototype. (by [@thegreat](https://github.com/thegreat)). [#37](https://github.com/jacobtoye/Leaflet.draw/pull/37)

## 0.1.4 (October 8, 2012)

### Bugfixes

 * Fixed a bug that would cause an error when creating rectangles/circles withought moving the mouse. (by [@inpursuit](https://github.com/inpursuit)). [#25](https://github.com/jacobtoye/Leaflet.draw/pull/25)
 * Fixed a bug that would cause an error when clicking a different drawing tool while another mode enabled. (by [@thegreat](https://github.com/thegreat)). [#27](https://github.com/jacobtoye/Leaflet.draw/pull/27)
 * Fixed control buttons breaking plugin in oldIE.
 * Fixed drawing polylines and polygons in oldIE.

## 0.1.3 (October 3, 2012)

### Bugfixes

 * Tip label will now show over vertex markers.
 * Added ability to draw on top of existing markers and vector layers.
 * Clicking on a map object that has a click handler no longer triggers the click event when in drawing mode.

## Pre-0.1.3

Check the commit history for changes previous to 0.1.3.
