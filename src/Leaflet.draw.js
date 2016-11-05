/**
 * Leaflet.draw assumes that you have already included the Leaflet library.
 */
L.drawVersion = '0.4.2';

/**
 * @class L.drawLocal
 * @aka L.drawLocal
 *
 * The core toolbar class of the API — it is used to create the toolbar ui
 *
 * ## Leaflet 1.0+ Examples
 *
 * - [Full Demo](./examples/full.html)
 * - [Popup](./examples/popup.html)
 * - [Snapping](./examples/snapping.html)
 * - [Edit Handlers](./examples/edithandlers.html)
 *
 * ## Leaflet 0.7+ Examples
 *
 * - [Full Demo](./examples/0.7.x/full.html)
 * - [Popup](./examples/0.7.x/popup.html)
 * - [Snapping](./examples/0.7.x/snapping.html)
 * - [Edit Handlers](./examples/0.7.x/edithandlers.html)
 *
 * @example
 * ```js
 *      var modifiedDraw = L.drawLocal.extend({
 *          draw: {
 *              toolbar: {
 *                  buttons: {
 *                      polygon: 'Draw an awesome polygon'
 *                  }
 *              }
 *          }
 *      });
 * ```
 *
 * The default state for the control is the draw toolbar just below the zoom control.
 *  This will allow map users to draw vectors and markers.
 *  **Please note the edit toolbar is not enabled by default.**
 *
 * To add the draw toolbar set the option drawControl: true in the map options.
 * ```js
 *      var map = L.map('map', {drawControl: true}).setView([51.505, -0.09], 13);
 *
 *      L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
 *          attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
 *      }).addTo(map);
 * ```
 *
 * ### Adding the edit toolbar
 * To use the edit toolbar you must initialise the Leaflet.draw control and manually add it to the map.
 *
 * ```js
 *      var map = L.map('map').setView([51.505, -0.09], 13);
 *
 *      L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
 *          attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
 *      }).addTo(map);
 *
 *      // FeatureGroup is to store editable layers
 *      var drawnItems = new L.FeatureGroup();
 *      map.addLayer(drawnItems);
 *
 *      var drawControl = new L.Control.Draw({
 *          edit: {
 *              featureGroup: drawnItems
 *          }
 *      });
 *      map.addControl(drawControl);
 * ```
 *
 * The key here is the featureGroup option. This tells the plugin which FeatureGroup contains the layers that
 * should be editable. The featureGroup can contain 0 or more features with geometry types Point, LineString, and Polygon.
 * Leaflet.draw does not work with multigeometry features such as MultiPoint, MultiLineString, MultiPolygon,
 * or GeometryCollection. If you need to add multigeometry features to the draw plugin, convert them to a
 * FeatureCollection of non-multigeometries (Points, LineStrings, or Polygons).
 *
 * ### Events
 * Once you have successfully added the Leaflet.draw plugin to your map you will want to respond to the different
 * actions users can initiate. The following events will be triggered on the map:
 *
 *
 * #### draw:created
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | layer | [Polyline](http://leafletjs.com/reference.html#polyline)/[Polygon](http://leafletjs.com/reference.html#polygon)/[Rectangle](http://leafletjs.com/reference.html#rectangle)/[Circle](http://leafletjs.com/reference.html#circle)/[Marker](http://leafletjs.com/reference.html#marker) | Layer that was just created.
 * | layerType | String | The type of layer this is. One of: `polyline`, `polygon`, `rectangle`, `circle`, `marker`
 *
 *
 * Triggered when a new vector or marker has been created.
 *
 * ```js
 * map.on('draw:created', function (e) {
 *    var type = e.layerType,
 *        layer = e.layer;
 *
 *    if (type === 'marker') {
 *        // Do marker specific actions
 *    }
 *
 *    // Do whatever else you need to. (save to db, add to map etc)
 *    map.addLayer(layer);
 *});
 * ```
 *
 * #### draw:edited
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | layers | [LayerGroup](http://leafletjs.com/reference.html#layergroup) | List of all layers just edited on the map.
 *
 *
 * Triggered when layers in the FeatureGroup, initialised with the plugin, have been edited and saved.
 *
 * ```js
 * map.on('draw:edited', function (e) {
 *    var layers = e.layers;
 *    layers.eachLayer(function (layer) {
 *        //do whatever you want, most likely save back to db
 *    });
 *});
 * ```
 *
 * #### draw:deleted
 *
 * Triggered when layers have been removed (and saved) from the FeatureGroup.
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | layers | [LayerGroup](http://leafletjs.com/reference.html#layergroup) | List of all layers just removed from the map.
 *
 *
 * #### draw:drawstart
 *
 * Triggered when the user has chosen to draw a particular vector or marker.
 *
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | layerType | String | The type of layer this is. One of: `polyline`, `polygon`, `rectangle`, `circle`, `marker`
 *
 *
 * #### draw:drawstop
 *
 * Triggered when the user has finished a particular vector or marker.
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | layerType | String | The type of layer this is. One of: `polyline`, `polygon`, `rectangle`, `circle`, `marker`
 *
 * #### draw:drawvertex
 *
 * Triggered when a vertex is created on a polyline or polygon.
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | layers | [LayerGroup](http://leafletjs.com/reference.html#layergroup) | List of all layers just being added from the map.
 *
 * #### draw:editstart
 *
 * Triggered when the user starts edit mode by clicking the edit tool button.
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | handler | String | The type of edit this is. One of: `edit`
 *
 * #### draw:editmove
 *
 * Triggered as the user moves a rectangle, circle or marker.
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | layer | [ILayer](http://leafletjs.com/reference.html#ilayer) | Layer that was just moved.
 *
 * #### draw:editresize
 *
 * Triggered as the user resizes a rectangle or circle.
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | layer | [ILayer](http://leafletjs.com/reference.html#ilayer) | Layer that was just moved.
 *
 * #### draw:editvertex
 *
 * Triggered when a vertex is edited on a polyline or polygon.
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | layers | [LayerGroup](http://leafletjs.com/reference.html#layergroup) | List of all layers just being edited from the map.
 *
 * #### draw:editstop
 *
 * Triggered when the user has finshed editing (edit mode) and saves edits.
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | handler | String | The type of edit this is. One of: `edit`
 *
 * #### draw:deletestart
 *
 * Triggered when the user starts remove mode by clicking the remove tool button.
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | handler | String | The type of edit this is. One of: `remove`
 *
 * #### draw:deletestop
 *
 * Triggered when the user has finished removing shapes (remove mode) and saves.
 *
 * | Property | Type | Description
 * | --- | --- | ---
 * | handler | String | The type of edit this is. One of: `remove`
 *
 */
L.drawLocal = {
    draw: {
        toolbar: {
            // #TODO: this should be reorganized where actions are nested in actions
            // ex: actions.undo  or actions.cancel
            actions: {
                title: 'Cancel drawing',
                text: 'Cancel'
            },
            finish: {
                title: 'Finish drawing',
                text: 'Finish'
            },
            undo: {
                title: 'Delete last point drawn',
                text: 'Delete last point'
            },
            buttons: {
                polyline: 'Draw a polyline',
                polygon: 'Draw a polygon',
                rectangle: 'Draw a rectangle',
                circle: 'Draw a circle',
                marker: 'Draw a marker'
            }
        },
        handlers: {
            circle: {
                tooltip: {
                    start: 'Click and drag to draw circle.'
                },
                radius: 'Radius'
            },
            marker: {
                tooltip: {
                    start: 'Click map to place marker.'
                }
            },
            polygon: {
                tooltip: {
                    start: 'Click to start drawing shape.',
                    cont: 'Click to continue drawing shape.',
                    end: 'Click first point to close this shape.'
                }
            },
            polyline: {
                error: '<strong>Error:</strong> shape edges cannot cross!',
                tooltip: {
                    start: 'Click to start drawing line.',
                    cont: 'Click to continue drawing line.',
                    end: 'Click last point to finish line.'
                }
            },
            rectangle: {
                tooltip: {
                    start: 'Click and drag to draw rectangle.'
                }
            },
            simpleshape: {
                tooltip: {
                    end: 'Release mouse to finish drawing.'
                }
            }
        }
    },
    edit: {
        toolbar: {
            actions: {
                save: {
                    title: 'Save changes.',
                    text: 'Save'
                },
                cancel: {
                    title: 'Cancel editing, discards all changes.',
                    text: 'Cancel'
                }
            },
            buttons: {
                edit: 'Edit layers.',
                editDisabled: 'No layers to edit.',
                remove: 'Delete layers.',
                removeDisabled: 'No layers to delete.'
            }
        },
        handlers: {
            edit: {
                tooltip: {
                    text: 'Drag handles, or marker to edit feature.',
                    subtext: 'Click cancel to undo changes.'
                }
            },
            remove: {
                tooltip: {
                    text: 'Click on a feature to remove'
                }
            }
        }
    }
};
