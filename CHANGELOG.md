Leaflet.draw Changelog
======================

## master

An in-progress version being developed on the master branch.

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