/*
 Leaflet.draw 0.4.9+60c1ecc, a plugin that adds drawing and editing tools to Leaflet powered maps.
 (c) 2012-2017, Jacob Toye, Jon West, Smartrak, Leaflet

 https://github.com/Leaflet/Leaflet.draw
 http://leafletjs.com
 */
(function (window, document, undefined) {/**
 * Leaflet.draw assumes that you have already included the Leaflet library.
 */
L.drawVersion = "0.4.9+60c1ecc";
/**
 * @class L.Draw
 * @aka Draw
 *
 *
 * To add the draw toolbar set the option drawControl: true in the map options.
 *
 * @example
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
 */
L.Draw = {};

/**
 * @class L.drawLocal
 * @aka L.drawLocal
 *
 * The core toolbar class of the API - it is used to create the toolbar ui
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
 */
L.drawLocal = {
	// format: {
	// 	numeric: {
	// 		delimiters: {
	// 			thousands: ',',
	// 			decimal: '.'
	// 		}
	// 	}
	// },
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
				},
        clearAll: {
            title: 'Clear all layers.',
            text: 'Clear All'
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



/**
 * ### Events
 * Once you have successfully added the Leaflet.draw plugin to your map you will want to respond to the different
 * actions users can initiate. The following events will be triggered on the map:
 *
 * @class L.Draw.Event
 * @aka Draw.Event
 *
 * Use `L.Draw.Event.EVENTNAME` constants to ensure events are correct.
 *
 * @example
 * ```js
 * map.on(L.Draw.Event.CREATED; function (e) {
 *    var type = e.layerType;
 *        layer = e.layer;
 *
 *    if (type === 'marker') {
 *        // Do marker specific actions
 *    }
 *
 *    // Do whatever else you need to. (save to db; add to map etc)
 *    map.addLayer(layer);
 *});
 * ```
 */

L.Draw.Event = { ID: 'LeafetDraw' };

/**
 * @event draw:created: PolyLine; Polygon; Rectangle; Circle; Marker | String
 *
 * attributes:
 *     layer: Layer that was just created.
 *     layerType: The type of layer this is. One of: `polyline`; `polygon`; `rectangle`; `circle`; `marker`
 *
 * Triggered when a new vector or marker has been created.
 *
 */
L.Draw.Event.CREATED = 'draw:created';

/**
 * @event draw:canceled: PolyLine; Polygon; Rectangle; Circle; Marker | String
 *
 * attributes:
 *     layerType: The type of layer this is. One of: `polyline`; `polygon`; `rectangle`; `circle`; `marker`
 *
 * Triggered when a new vector or marker has been created.
 *
 */
L.Draw.Event.CANCELED = 'draw:canceled';

/**
 * @event draw:edited: LayerGroup
 *
 * attributes:
 *     layers: List of all layers just edited on the map.
 *
 * Triggered when layers in the FeatureGroup; initialised with the plugin; have been edited and saved.
 *
 * @example
 * ```js
 *      map.on('draw:edited'; function (e) {
 *          var layers = e.layers;
 *          layers.eachLayer(function (layer) {
 *              //do whatever you want; most likely save back to db
 *          });
 *      });
 * ```
 */
L.Draw.Event.EDITED = 'draw:edited';

/**
 * @event draw:deleted: LayerGroup
 *
 * attributes:
 *     layers: List of all layers just removed from the map.
 *
 * Triggered when layers have been removed (and saved) from the FeatureGroup.
 */
L.Draw.Event.DELETED = 'draw:deleted';

/**
 * @event draw:drawstart: String
 *
 * The type of layer this is. One of:`polyline`; `polygon`; `rectangle`; `circle`; `marker`
 *
 * Triggered when the user has chosen to draw a particular vector or marker.
 */
L.Draw.Event.DRAWSTART = 'draw:drawstart';

/**
 * @event draw:drawstop: String
 *
 * The type of layer this is. One of: `polyline`; `polygon`; `rectangle`; `circle`; `marker`
 *
 * Triggered when the user has finished a particular vector or marker.
 */

L.Draw.Event.DRAWSTOP = 'draw:drawstop';

/**
 * @event draw:drawvertex: LayerGroup
 *
 * List of all layers just being added from the map.
 *
 * Triggered when a vertex is created on a polyline or polygon.
 */
L.Draw.Event.DRAWVERTEX = 'draw:drawvertex';

/**
 * @event draw:editstart: String
 *
 * The type of edit this is. One of: `edit`
 *
 * Triggered when the user starts edit mode by clicking the edit tool button.
 */

L.Draw.Event.EDITSTART = 'draw:editstart';

/**
 * @event draw:editmove: ILayer
 *
 *  Layer that was just moved.
 *
 * Triggered as the user moves a rectangle; circle or marker.
 */
L.Draw.Event.EDITMOVE = 'draw:editmove';

/**
 * @event draw:editresize: ILayer
 *
 * Layer that was just moved.
 *
 * Triggered as the user resizes a rectangle or circle.
 */
L.Draw.Event.EDITRESIZE = 'draw:editresize';

/**
 * @event draw:editvertex: LayerGroup
 *
 * List of all layers just being edited from the map.
 *
 * Triggered when a vertex is edited on a polyline or polygon.
 */
L.Draw.Event.EDITVERTEX = 'draw:editvertex';

/**
 * @event draw:editstop: String
 *
 * The type of edit this is. One of: `edit`
 *
 * Triggered when the user has finshed editing (edit mode) and saves edits.
 */
L.Draw.Event.EDITSTOP = 'draw:editstop';

/**
 * @event draw:deletestart: String
 *
 * The type of edit this is. One of: `remove`
 *
 * Triggered when the user starts remove mode by clicking the remove tool button.
 */
L.Draw.Event.DELETESTART = 'draw:deletestart';

/**
 * @event draw:deletestop: String
 *
 * The type of edit this is. One of: `remove`
 *
 * Triggered when the user has finished removing shapes (remove mode) and saves.
 */
L.Draw.Event.DELETESTOP = 'draw:deletestop';

/**
 * @event draw:undoaction: String
 * @event draw:redoaction: String
 * @event draw:pushundo: String
 * @event draw:undomain: String
 * @event draw:undonested: String
 * @event draw:redomain: String
 * @event draw:redonested: String
 *
 * undoaction: triggered whenever a user presses ctrl-z
 * redoaction: triggered whenever a user presses ctrl-y
 * pushundo: triggered whenever an undoable action originally occurs
 *
 * undomain: triggered just after an action is undoed in main mode
 * redomain: triggered just after an action is redoed in main mode
 * undonested: triggered just after an action is undoed in nested mode (e.g. edit mode, delete mode, etc)
 * redonested: triggered just after an action is redoed in nested mode (e.g. edit mode, delete mode, etc)
 *
 * attributes:
 *     stackItem: an undo stack item. contains:
 *         actionType: the type of action performed by leaflet draw. derived from the above events.
 *             params: parameters of the calling event
 *             undoId: a unique id generated by L.StateManager for each action.
 *           moduleId: equal to 'LeafletDraw' if the event is generated by this
 *                     module. could be different if the generated action was
 *                     installed with L.UndoManager.addExtension.
 *                tag: optional string; allows undo items to be selectively removed
 *                     by tag name using L.StateHandler
 *
 * Triggered when the user has finished removing shapes (remove mode) and saves.
 */

L.Draw.Event.UNDOACTION = 'draw:undoaction';
L.Draw.Event.REDOACTION = 'draw:redoaction';
L.Draw.Event.PUSHUNDO = 'draw:pushundo';
L.Draw.Event.UNDOMAIN = 'draw:undomain';
L.Draw.Event.UNDONESTED = 'draw:undonested';
L.Draw.Event.REDOMAIN = 'draw:redomain';
L.Draw.Event.REDONESTED = 'draw:redonested';



L.Draw = L.Draw || {};

/**
 * @class L.Draw.Feature
 * @aka Draw.Feature
 */
L.Draw.Feature = L.Handler.extend({
	includes: L.Mixin.Events,

	// @method initialize(): void
	initialize: function (map, options) {
		this._map = map;
		this._container = map._container;
		this._overlayPane = map._panes.overlayPane;
		this._popupPane = map._panes.popupPane;
        this._mapDraggable = false;

		// Merge default shapeOptions options with custom shapeOptions
		if (options && options.shapeOptions) {
			options.shapeOptions = L.Util.extend({}, this.options.shapeOptions, options.shapeOptions);
		}
		L.setOptions(this, options);
	},

	// @method enable(): void
	// Enables this handler
	enable: function () {
		if (this._enabled) {
			return;
		}

		L.Handler.prototype.enable.call(this);

		this.fire('enabled', { handler: this.type });

		this._map.fire(L.Draw.Event.DRAWSTART, { layerType: this.type });
	},

	// @method initialize(): void
	disable: function () {
		if (!this._enabled) {
			return;
		}

		L.Handler.prototype.disable.call(this);

		this._map.fire(L.Draw.Event.DRAWSTOP, { layerType: this.type });

		this.fire('disabled', { handler: this.type });
	},

	// @method addHooks(): void
	// Add's event listeners to this handler
	addHooks: function () {
		var map = this._map;

		if (map) {
            this._mapDraggable = this._map.dragging.enabled();
            if (this._mapDraggable) {
                this._map.dragging.disable();
            }
            
			L.DomUtil.disableTextSelection();

			map.getContainer().focus();

			this._tooltip = new L.Draw.Tooltip(this._map);

			L.DomEvent.on(this._container, 'keyup', this._cancelDrawing, this);
		}
	},

	// @method removeHooks(): void
	// Removes event listeners from this handler
	removeHooks: function () {
		if (this._map) {
			if (this._mapDraggable) {
				this._map.dragging.enable();
			}
            
			L.DomUtil.enableTextSelection();

			this._tooltip.dispose();
			this._tooltip = null;

			L.DomEvent.off(this._container, 'keyup', this._cancelDrawing, this);
		}
	},

	// @method setOptions(object): void
	// Sets new options to this handler
	setOptions: function (options) {
		L.setOptions(this, options);
	},

	_fireCreatedEvent: function (layer) {
		this._map.fire(L.Draw.Event.CREATED, { layer: layer, layerType: this.type });
	},

	// Cancel drawing when the escape key is pressed
	_cancelDrawing: function (e) {
		if (e.keyCode === 27) {
            this._map.fire(L.Draw.Event.CANCELED, { layerType: this.type });
			this.disable();
		}
	}
});



/**
 * @class L.Draw.Polyline
 * @aka Draw.Polyline
 * @inherits L.Draw.Feature
 */
L.Draw.Polyline = L.Draw.Feature.extend({
	statics: {
		TYPE: 'polyline'
	},

	Poly: L.Polyline,

	options: {
		allowIntersection: false,
		repeatMode: false,
		drawError: {
			color: '#b00b00',
			timeout: 2500
		},
		icon: new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className: 'leaflet-div-icon leaflet-editing-icon'
		}),
		touchIcon: new L.DivIcon({
			iconSize: new L.Point(20, 20),
			className: 'leaflet-div-icon leaflet-editing-icon leaflet-touch-icon'
		}),
		guidelineDistance: 20,
		maxGuideLineLength: 4000,
		shapeOptions: {
			stroke: true,
			color: '#3388ff',
			weight: 4,
			opacity: 0.5,
			fill: false,
			clickable: true
		},
		metric: true, // Whether to use the metric measurement system or imperial
		feet: true, // When not metric, to use feet instead of yards for display.
		nautic: false, // When not metric, not feet use nautic mile for display
		showLength: true, // Whether to display distance in the tooltip
		zIndexOffset: 2000 // This should be > than the highest z-index any map layers
	},

	// @method initialize(): void
	initialize: function (map, options) {
		// if touch, switch to touch icon
		if (! L.Browser.pointer) {
			this.options.icon = this.options.touchIcon;
		}

		// Need to set this here to ensure the correct message is used.
		this.options.drawError.message = L.drawLocal.draw.handlers.polyline.error;

		// Merge default drawError options with custom options
		if (options && options.drawError) {
			options.drawError = L.Util.extend({}, this.options.drawError, options.drawError);
		}

		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Polyline.TYPE;

		L.Draw.Feature.prototype.initialize.call(this, map, options);
	},

	// @method addHooks(): void
	// Add listener hooks to this handler
	addHooks: function () {
		L.Draw.Feature.prototype.addHooks.call(this);
		if (this._map) {
			this._markers = [];

			this._markerGroup = new L.LayerGroup();
			this._map.addLayer(this._markerGroup);

			this._poly = new L.Polyline([], this.options.shapeOptions);

			this._tooltip.updateContent(this._getTooltipText());

			// Make a transparent marker that will used to catch click events. These click
			// events will create the vertices. We need to do this so we can ensure that
			// we can create vertices over other map layers (markers, vector layers). We
			// also do not want to trigger any click handlers of objects we are clicking on
			// while drawing.
			if (!this._mouseMarker) {
				this._mouseMarker = L.marker(this._map.getCenter(), {
					icon: L.divIcon({
						className: 'leaflet-mouse-marker',
						iconAnchor: [20, 20],
						iconSize: [40, 40]
					}),
					opacity: 0,
					zIndexOffset: this.options.zIndexOffset
				});
			}

			this._mouseMarker
				.on('mouseout', this._onMouseOut, this)
				.on('mousemove', this._onMouseMove, this) // Necessary to prevent 0.8 stutter
				.on('mousedown', this._onMouseDown, this)
				.on('mouseup', this._onMouseUp, this) // Necessary for 0.8 compatibility
				.addTo(this._map);

			this._map
				.on('mouseup', this._onMouseUp, this) // Necessary for 0.7 compatibility
				.on('touchstart', this._onTouch, this)
				.on('mousemove', this._onMouseMove, this)
				.on('zoomlevelschange', this._onZoomEnd, this)
				.on('zoomend', this._onZoomEnd, this);

		}
	},

	// @method removeHooks(): void
	// Remove listener hooks from this handler.
	removeHooks: function () {
		L.Draw.Feature.prototype.removeHooks.call(this);

		this._clearHideErrorTimeout();

		this._cleanUpShape();

		// remove markers from map
		this._map.removeLayer(this._markerGroup);
		delete this._markerGroup;
		delete this._markers;

		this._map.removeLayer(this._poly);
		delete this._poly;

		this._mouseMarker
			.off('mousedown', this._onMouseDown, this)
			.off('mouseout', this._onMouseOut, this)
			.off('mouseup', this._onMouseUp, this)
			.off('mousemove', this._onMouseMove, this);
		this._map.removeLayer(this._mouseMarker);
		delete this._mouseMarker;

		// clean up DOM
		this._clearGuides();

		this._map
			.off('mouseup', this._onMouseUp, this)
			.off('mousemove', this._onMouseMove, this)
			.off('zoomlevelschange', this._onZoomEnd, this)
			.off('zoomend', this._onZoomEnd, this)
			.off('touchstart', this._onTouch, this);
	},

	// @method deleteLastVertex(): void
  // Remove the last vertex from the polyline, removes polyline from map if only one point exists.
	deleteLastVertex: function () {
		if (this._markers.length <= 1) {
			return;
		}

		var lastMarker = this._markers.pop(),
			poly = this._poly,
			// Replaces .spliceLatLngs()
			latlngs = poly.getLatLngs(),
			latlng = latlngs.splice(-1, 1)[0];
		this._poly.setLatLngs(latlngs);

		this._markerGroup.removeLayer(lastMarker);

		if (poly.getLatLngs().length < 2) {
			this._map.removeLayer(poly);
		}

		this._vertexChanged(latlng, false);
        return latlng;
	},

	// @method addVertex(): void
	// Add a vertex to the end of the polyline
	addVertex: function (latlng) {
		var markersLength = this._markers.length;
		// markersLength must be greater than or equal to 2 before intersections can occur
        if (markersLength >= 2 && !this.options.allowIntersection && this._poly.newLatLngIntersects(latlng)) {
			this._showErrorTooltip();
			return;
		}
		else if (this._errorShown) {
			this._hideErrorTooltip();
		}

		this._markers.push(this._createMarker(latlng));

		this._poly.addLatLng(latlng);

		if (this._poly.getLatLngs().length === 2) {
			this._map.addLayer(this._poly);
		}

		this._vertexChanged(latlng, true);
	},

	// @method completeShape(): void
	// Closes the polyline between the first and last points
	completeShape: function () {
		if (this._markers.length <= 1) {
			return;
		}

		this._fireCreatedEvent();
		this.disable();

		if (this.options.repeatMode) {
			this.enable();
		}
	},

	_finishShape: function () {
		var latlngs = this._poly._defaultShape ? this._poly._defaultShape() : this._poly.getLatLngs();
		var intersects = this._poly.newLatLngIntersects(latlngs[latlngs.length - 1]);

		if ((!this.options.allowIntersection && intersects) || !this._shapeIsValid()) {
			this._showErrorTooltip();
			return;
		}

		this._fireCreatedEvent();
		this.disable();
		if (this.options.repeatMode) {
			this.enable();
		}
	},

	// Called to verify the shape is valid when the user tries to finish it
	// Return false if the shape is not valid
	_shapeIsValid: function () {
		return true;
	},

	_onZoomEnd: function () {
		if (this._markers !== null) {
			this._updateGuide();
		}
	},

	_onMouseMove: function (e) {
		var newPos = this._map.mouseEventToLayerPoint(e.originalEvent);
		var latlng = this._map.layerPointToLatLng(newPos);

		// Save latlng
		// should this be moved to _updateGuide() ?
		this._currentLatLng = latlng;

		this._updateTooltip(latlng);

		// Update the guide line
		this._updateGuide(newPos);

		// Update the mouse marker position
		this._mouseMarker.setLatLng(latlng);

		L.DomEvent.preventDefault(e.originalEvent);
	},

	_vertexChanged: function (latlng, added) {
		this._map.fire(L.Draw.Event.DRAWVERTEX, { layers: this._markerGroup, drawHandler: this });
		this._updateFinishHandler();

		this._updateRunningMeasure(latlng, added);

		this._clearGuides();

		this._updateTooltip();
	},

	_onMouseDown: function (e) {
		if (!this._clickHandled && !this._touchHandled && !this._disableMarkers) {
			this._onMouseMove(e);
			this._clickHandled = true;
			this._disableNewMarkers();
			var originalEvent = e.originalEvent;
			var clientX = originalEvent.clientX;
			var clientY = originalEvent.clientY;
			this._startPoint.call(this, clientX, clientY);
		}
	},

	_startPoint: function (clientX, clientY) {
		this._mouseDownOrigin = L.point(clientX, clientY);
		var originalEvent = e.originalEvent;
		var clientX = originalEvent.clientX;
		var clientY = originalEvent.clientY;
		this._startPoint.call(this, clientX, clientY);
	},

	_startPoint: function (clientX, clientY) {this._mouseDownOrigin = L.point(clientX, clientY);
	},

	_onMouseUp: function (e) {
        var originalEvent = e.originalEvent;
        var clientX = originalEvent.clientX;
        var clientY = originalEvent.clientY;
        this._endPoint.call(this, clientX, clientY, e);
	},

	_endPoint: function (clientX, clientY, e) {
		if (this._mouseDownOrigin) {
			var dragCheckDistance = L.point(clientX, clientY)
				.distanceTo(this._mouseDownOrigin);

			if (Math.abs(distance) < 9 * (window.devicePixelRatio || 1)) {
                var bbounds = this._map.options.maxBounds;
                if (!bbounds || (bbounds && bbounds.contains(e.latlng))) {
                    this.addVertex(e.latlng);
                }
			}
			this._enableNewMarkers(); // after a short pause, enable new markers
		}
		this._mouseDownOrigin = null;
	},

	// ontouch prevented by clickHandled flag because some browsers fire both click/touch events,
	// causing unwanted behavior
	_onTouch: function (e) {
		var originalEvent = e.originalEvent;
		var clientX;
		var clientY;
		if (originalEvent.touches && originalEvent.touches[0]) {
			clientX = originalEvent.touches[0].clientX;
			clientY = originalEvent.touches[0].clientY;
			this._startPoint.call(this, clientX, clientY);
			this._endPoint.call(this, clientX, clientY,e);
		}this._clickHandled = null;
	},

	_onMouseOut: function () {
		if (this._tooltip) {
			this._tooltip._onMouseOut.call(this._tooltip);
		}
	},

	// calculate if we are currently within close enough distance
	// of the closing point (first point for shapes, last point for lines)
	// this is semi-ugly code but the only reliable way i found to get the job done
	// note: calculating point.distanceTo between mouseDownOrigin and last marker did NOT work
	_calculateFinishDistance: function (potentialLatLng) {
		var lastPtDistance
		if (this._markers.length > 0) {
				var finishMarker;
				if (this.type === L.Draw.Polyline.TYPE) {
					finishMarker = this._markers[this._markers.length - 1];
				} else if (this.type === L.Draw.Polygon.TYPE) {
					finishMarker = this._markers[0];
				} else {
					return Infinity;
				}
				var lastMarkerPoint = this._map.latLngToContainerPoint(finishMarker.getLatLng()),
				potentialMarker = new L.Marker(potentialLatLng, {
					icon: this.options.icon,
					zIndexOffset: this.options.zIndexOffset * 2
				});
				var potentialMarkerPint = this._map.latLngToContainerPoint(potentialMarker.getLatLng());
				lastPtDistance = lastMarkerPoint.distanceTo(potentialMarkerPint);
			} else {
				lastPtDistance = Infinity;
			}
			return lastPtDistance;
	},

	_updateFinishHandler: function () {
		var markerCount = this._markers.length;
		// The last marker should have a click handler to close the polyline
		if (markerCount > 1) {
			this._markers[markerCount - 1].on('click', this._finishShape, this);
		}

		// Remove the old marker click handler (as only the last point should close the polyline)
		if (markerCount > 2) {
			this._markers[markerCount - 2].off('click', this._finishShape, this);
		}
	},

	_createMarker: function (latlng) {
		var marker = new L.Marker(latlng, {
			icon: this.options.icon,
			zIndexOffset: this.options.zIndexOffset * 2
		});

		this._markerGroup.addLayer(marker);

		return marker;
	},

	_updateGuide: function (newPos) {
		var markerCount = this._markers ? this._markers.length : 0;

		if (markerCount > 0) {
			newPos = newPos || this._map.latLngToLayerPoint(this._currentLatLng);

			// draw the guide line
			this._clearGuides();
			this._drawGuide(
				this._map.latLngToLayerPoint(this._markers[markerCount - 1].getLatLng()),
				newPos
			);
		}
	},

	_updateTooltip: function (latLng) {
		var text = this._getTooltipText();

		if (latLng) {
			this._tooltip.updatePosition(latLng);
		}

		if (!this._errorShown) {
			this._tooltip.updateContent(text);
		}
	},

	_drawGuide: function (pointA, pointB) {
		var length = Math.floor(Math.sqrt(Math.pow((pointB.x - pointA.x), 2) + Math.pow((pointB.y - pointA.y), 2))),
			guidelineDistance = this.options.guidelineDistance,
			maxGuideLineLength = this.options.maxGuideLineLength,
			// Only draw a guideline with a max length
			i = length > maxGuideLineLength ? length - maxGuideLineLength : guidelineDistance,
			fraction,
			dashPoint,
			dash;

		//create the guides container if we haven't yet
		if (!this._guidesContainer) {
			this._guidesContainer = L.DomUtil.create('div', 'leaflet-draw-guides', this._overlayPane);
		}

		//draw a dash every GuildeLineDistance
		for (; i < length; i += this.options.guidelineDistance) {
			//work out fraction along line we are
			fraction = i / length;

			//calculate new x,y point
			dashPoint = new L.Point(
                Math.floor((pointA.x * (1 - fraction)) + (fraction * pointB.x)),
				Math.floor((pointA.y * (1 - fraction)) + (fraction * pointB.y))
			);

			//add guide dash to guide container
			dash = L.DomUtil.create('div', 'leaflet-draw-guide-dash', this._guidesContainer);
			dash.style.backgroundColor =
				!this._errorShown ? this.options.shapeOptions.color : this.options.drawError.color;

			L.DomUtil.setPosition(dash, dashPoint);
		}
	},

	_updateGuideColor: function (color) {
		if (this._guidesContainer) {
			for (var i = 0, l = this._guidesContainer.childNodes.length; i < l; i++) {
				this._guidesContainer.childNodes[i].style.backgroundColor = color;
			}
		}
	},

	// removes all child elements (guide dashes) from the guides container
	_clearGuides: function () {
		if (this._guidesContainer) {
			while (this._guidesContainer.firstChild) {
				this._guidesContainer.removeChild(this._guidesContainer.firstChild);
			}
		}
	},

	_getTooltipText: function () {
		var showLength = this.options.showLength,
			labelText, distanceStr;
		if (L.Browser.touch) {
			showLength = false; // if there's a better place to put this, feel free to move it
		}
		if (this._markers.length === 0) {
			labelText = {
				text: L.drawLocal.draw.handlers.polyline.tooltip.start
			};
		} else {
			distanceStr = showLength ? this._getMeasurementString() : '';

			if (this._markers.length === 1) {
				labelText = {
					text: L.drawLocal.draw.handlers.polyline.tooltip.cont,
					subtext: distanceStr
				};
			} else {
				labelText = {
					text: L.drawLocal.draw.handlers.polyline.tooltip.end,
					subtext: distanceStr
				};
			}
		}
		return labelText;
	},

	_updateRunningMeasure: function (latlng, added) {
		var markersLength = this._markers.length,
			previousMarkerIndex, distance;

		if (this._markers.length <= 1) {
			this._measurementRunningTotal = 0;
		} else {
			previousMarkerIndex = markersLength - (added ? 2 : 1);
			distance = latlng.distanceTo(this._markers[previousMarkerIndex].getLatLng());

			this._measurementRunningTotal += distance * (added ? 1 : -1);
		}
	},

	_getMeasurementString: function () {
		var currentLatLng = this._currentLatLng,
			previousLatLng = this._markers[this._markers.length - 1].getLatLng(),
			distance;

		// calculate the distance from the last fixed point to the mouse position
		distance = this._measurementRunningTotal + currentLatLng.distanceTo(previousLatLng);

		return L.GeometryUtil.readableDistance(distance, this.options.metric, this.options.feet, this.options.nautic);
	},

	_showErrorTooltip: function () {
		this._errorShown = true;

		// Update tooltip
		this._tooltip
			.showAsError()
			.updateContent({ text: this.options.drawError.message });

		// Update shape
		this._updateGuideColor(this.options.drawError.color);
		this._poly.setStyle({ color: this.options.drawError.color });

		// Hide the error after 2 seconds
		this._clearHideErrorTimeout();
		this._hideErrorTimeout = setTimeout(L.Util.bind(this._hideErrorTooltip, this), this.options.drawError.timeout);
	},

	_hideErrorTooltip: function () {
		this._errorShown = false;

		this._clearHideErrorTimeout();

		// Revert tooltip
		this._tooltip
			.removeError()
			.updateContent(this._getTooltipText());

		// Revert shape
		this._updateGuideColor(this.options.shapeOptions.color);
		this._poly.setStyle({ color: this.options.shapeOptions.color });
	},

	_clearHideErrorTimeout: function () {
		if (this._hideErrorTimeout) {
			clearTimeout(this._hideErrorTimeout);
			this._hideErrorTimeout = null;
		}
	},

	// disable new markers temporarily;
	// this is to prevent duplicated touch/click events in some browsers
	_disableNewMarkers: function () {
		this._disableMarkers = true;
	},

	// see _disableNewMarkers
	_enableNewMarkers: function () {
		setTimeout(function() {
			this._disableMarkers = false;
		}.bind(this), 50);
	},

	_cleanUpShape: function () {
		if (this._markers.length > 1) {
			this._markers[this._markers.length - 1].off('click', this._finishShape, this);
		}
	},

	_fireCreatedEvent: function () {
		var poly = new this.Poly(this._poly.getLatLngs(), this.options.shapeOptions);
		L.Draw.Feature.prototype._fireCreatedEvent.call(this, poly);
	}
});



/**
 * @class L.Draw.Polygon
 * @aka Draw.Polygon
 * @inherits L.Draw.Polyline
 */
L.Draw.Polygon = L.Draw.Polyline.extend({
	statics: {
		TYPE: 'polygon'
	},

	Poly: L.Polygon,

	options: {
		showArea: false,
		shapeOptions: {
			stroke: true,
			color: '#3388ff',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		},
		metric: true // Whether to use the metric measurement system or imperial
	},

	// @method initialize(): void
	initialize: function (map, options) {
		L.Draw.Polyline.prototype.initialize.call(this, map, options);

		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Polygon.TYPE;
	},

	_updateFinishHandler: function () {
		var markerCount = this._markers.length;

		// The first marker should have a click handler to close the polygon
		if (markerCount === 1) {
			this._markers[0].on('click', this._finishShape, this);
		}

		// Add and update the double click handler
		if (markerCount > 2) {
			this._markers[markerCount - 1].on('dblclick', this._finishShape, this);
			// Only need to remove handler if has been added before
			if (markerCount > 3) {
				this._markers[markerCount - 2].off('dblclick', this._finishShape, this);
			}
		}
	},

	_getTooltipText: function () {
		var text, subtext;

		if (this._markers.length === 0) {
			text = L.drawLocal.draw.handlers.polygon.tooltip.start;
		} else if (this._markers.length < 3) {
			text = L.drawLocal.draw.handlers.polygon.tooltip.cont;
		} else {
			text = L.drawLocal.draw.handlers.polygon.tooltip.end;
			subtext = this._getMeasurementString();
		}

		return {
			text: text,
			subtext: subtext
		};
	},

	_getMeasurementString: function () {
		var area = this._area;

		if (!area) {
			return null;
		}

		return L.GeometryUtil.readableArea(area, this.options.metric);
	},

	_shapeIsValid: function () {
		return this._markers.length >= 3;
	},

	_vertexChanged: function (latlng, added) {
		var latLngs;

		// Check to see if we should show the area
		if (!this.options.allowIntersection && this.options.showArea) {
			latLngs = this._poly.getLatLngs();

			this._area = L.GeometryUtil.geodesicArea(latLngs);
		}

		L.Draw.Polyline.prototype._vertexChanged.call(this, latlng, added);
	},

	_cleanUpShape: function () {
		var markerCount = this._markers.length;

		if (markerCount > 0) {
			this._markers[0].off('click', this._finishShape, this);

			if (markerCount > 2) {
				this._markers[markerCount - 1].off('dblclick', this._finishShape, this);
			}
		}
	}
});



L.SimpleShape = {};
/**
 * @class L.Draw.SimpleShape
 * @aka Draw.SimpleShape
 * @inherits L.Draw.Feature
 */
L.Draw.SimpleShape = L.Draw.Feature.extend({
	options: {
		repeatMode: false,
		icon: new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className: 'leaflet-div-icon leaflet-editing-icon'
		}),
		touchIcon: new L.DivIcon({
			iconSize: new L.Point(20, 20),
			className: 'leaflet-div-icon leaflet-editing-icon leaflet-touch-icon'
		}),
		guidelineDistance: 20,
		maxGuideLineLength: 4000,
		zIndexOffset: 2000 // This should be > than the highest z-index any map layers
	},

	// @method initialize(): void
	initialize: function (map, options) {
		this._endLabelText = L.drawLocal.draw.handlers.simpleshape.tooltip.end;

		L.Draw.Feature.prototype.initialize.call(this, map, options);
	},

	// @method addHooks(): void
	// Add listener hooks to this handler.
	addHooks: function () {
		L.Draw.Feature.prototype.addHooks.call(this);
		if (this._map) {
			//TODO refactor: move cursor to styles
			this._container.style.cursor = 'crosshair';

			this._tooltip.updateContent({ text: this._initialLabelText });

			this._map
				.on('mousedown', this._onMouseDown, this)
				.on('mousemove', this._onMouseMove, this)
				.on('touchstart', this._onMouseDown, this)
				.on('touchmove', this._onMouseMove, this);

            // #680+
  			// we should prevent default, otherwise default behavior (scrolling) will fire,
  			// and that will cause document.touchend to fire and will stop the drawing
  			// (circle, rectangle) in touch mode.
  			// (update): we have to send passive now to prevent scroll, because by default it is {passive: true} now, which means,
  			// handler can't event.preventDefault
  			// check the news https://developers.google.com/web/updates/2016/06/passive-event-listeners
            document.addEventListener('touchstart', L.DomEvent.preventDefault, {passive: false});

            // mouse marker added so that snap will work
            this._tooltip.updateContent({ text: L.drawLocal.draw.handlers.marker.tooltip.start });

            // Same mouseMarker as in Draw.Polyline
            if (!this._mouseMarker) {
                this._mouseMarker = L.marker(this._map.getCenter(), {
                    icon: L.divIcon({
                        className: 'leaflet-mouse-marker',
                        iconAnchor: [20, 20],
                        iconSize: [40, 40]
                    }),
                    opacity: 0,
                    zIndexOffset: this.options.zIndexOffset
                });
                this._mouseMarker.addTo(this._map);
            }
		}
	},

	// @method removeHooks(): void
	// Remove listener hooks from this handler.
	removeHooks: function () {
		L.Draw.Feature.prototype.removeHooks.call(this);
		if (this._map) {
			if (this._mapDraggable) {
				this._map.dragging.enable();
			}

			//TODO refactor: move cursor to styles
			this._container.style.cursor = '';

			this._map
				.off('mousedown', this._onMouseDown, this)
				.off('mousemove', this._onMouseMove, this)
				.off('touchstart', this._onMouseDown, this)
				.off('touchmove', this._onMouseMove, this);

			L.DomEvent.off(document, 'mouseup', this._onMouseUp, this);
			L.DomEvent.off(document, 'touchend', this._onMouseUp, this);

            document.removeEventListener('touchstart', L.DomEvent.preventDefault);

			// If the box element doesn't exist they must not have moved the mouse, so don't need to destroy/return
			if (this._shape) {
				this._map.removeLayer(this._shape);
				delete this._shape;
			}

			this._map.removeLayer(this._mouseMarker);
			delete this._mouseMarker;
		}
		this._isDrawing = false;
	},

	_getTooltipText: function () {
		return {
			text: this._endLabelText
		};
	},

	_onMouseDown: function (e) {
		this._isDrawing = true;
		this._startLatLng = e.latlng;
		this._mouseMarker.setLatLng(e.latlng);

		L.DomEvent
			.on(document, 'mouseup', this._onMouseUp, this)
			.on(document, 'touchend', this._onMouseUp, this)
			.preventDefault(e.originalEvent);
	},

	_onMouseMove: function (e) {
		// first grab the original mouseMarker latlng here instead of the event latlng so that snap works correctly
        // if we're not using snap, these two will be the same.
		var snappedLatLng = this._mouseMarker.getLatLng();
		var latlng = e.latlng;
		this._mouseMarker.setLatLng(latlng);

		this._tooltip.updatePosition(snappedLatLng);
		if (this._isDrawing) {
			this._tooltip.updateContent(this._getTooltipText());
			this._drawShape(snappedLatLng);
		}
	},

	_onMouseUp: function () {
		if (this._shape) {
			this._fireCreatedEvent();
		}

		this.disable();
		if (this.options.repeatMode) {
			this.enable();
		}
	}
});


/**
 * @class L.Draw.Rectangle
 * @aka Draw.Rectangle
 * @inherits L.Draw.SimpleShape
 */
L.Draw.Rectangle = L.Draw.SimpleShape.extend({
	statics: {
		TYPE: 'rectangle'
	},

	options: {
		shapeOptions: {
			stroke: true,
			color: '#3388ff',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			showArea: true,clickable: true
		},
		metric: true // Whether to use the metric measurement system or imperial
	},

    // @method initialize(): void
    initialize: function (map, options) {
		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Rectangle.TYPE;

		this._initialLabelText = L.drawLocal.draw.handlers.rectangle.tooltip.start;

		L.Draw.SimpleShape.prototype.initialize.call(this, map, options);
	},

	_drawShape: function (latlng) {
        var bounds;
        if (this._map.options.maxBounds) {
            bounds = L.LatLngUtil.boxToBounds(this._map.options.maxBounds, this._startLatLng, latlng);
        }
        else {
            bounds = L.LatLngUtil.makeBounds(this._startLatLng, latlng);
        }

		if (!this._shape) {
			this._shape = new L.Rectangle(bounds, this.options.shapeOptions);
			this._map.addLayer(this._shape);
		} else {
			this._shape.setBounds(bounds);
		}
	},

	_fireCreatedEvent: function () {
		var rectangle = new L.Rectangle(this._shape.getBounds(), this.options.shapeOptions);
		L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, rectangle);
	},

	_getTooltipText: function () {
		var tooltipText = L.Draw.SimpleShape.prototype._getTooltipText.call(this),
			shape = this._shape,
            showArea = this.options.showArea,
            latLngs, area, subtext;

		if (shape) {
			latLngs = this._shape._defaultShape ? this._shape._defaultShape() : this._shape.getLatLngs();
			area = L.GeometryUtil.geodesicArea(latLngs);
			subtext = showArea ? L.GeometryUtil.readableArea(area, this.options.metric) : '';
    }

		return {
			text: tooltipText.text,
			subtext: subtext
		};
	}
});



/**
 * @class L.Draw.Circle
 * @aka Draw.Circle
 * @inherits L.Draw.SimpleShape
 */
L.Draw.Circle = L.Draw.SimpleShape.extend({
	statics: {
		TYPE: 'circle'
	},

	options: {
		shapeOptions: {
			stroke: true,
			color: '#3388ff',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		},
		showRadius: true,
		metric: true, // Whether to use the metric measurement system or imperial
		feet: true, // When not metric, use feet instead of yards for display
		nautic: false // When not metric, not feet use nautic mile for display
	},

	// @method initialize(): void
	initialize: function (map, options) {
		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Circle.TYPE;

		this._initialLabelText = L.drawLocal.draw.handlers.circle.tooltip.start;

		L.Draw.SimpleShape.prototype.initialize.call(this, map, options);
	},

	_drawShape: function (latlng) {
        var boundRadius;
        if (this._map.options.maxBounds) {
            boundRadius = L.LatLngUtil.radiusToBounds(this._map.options.maxBounds, this._startLatLng, latlng);
        }
        else {
            boundRadius = this._startLatLng.distanceTo(latlng);
        }

		if (!this._shape) {
			this._shape = new L.Circle(this._startLatLng, boundRadius, this.options.shapeOptions);
			this._map.addLayer(this._shape);
		} else {
			this._shape.setRadius(boundRadius);
		}
	},

	_fireCreatedEvent: function () {
		var circle = new L.Circle(this._startLatLng, this._shape.getRadius(), this.options.shapeOptions);
		L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, circle);
	},

	_onMouseMove: function (e) {
		// first grab the original mouseMarker latlng here instead of the eventlatlngso that snap works correctly
			// if we're not using snap, these two will be the same.
			var snappedLatLng = this._mouseMarker.getLatLng();
			var latlng = e.latlng;
this._mouseMarker.setLatLng(latlng);
		// for snap
		this._mouseMarker.setLatLng(latlng);this._tooltip.updatePosition(snappedLatLng);
		if (this._isDrawing) {
			this._drawShape(snappedLatLng);

			// Get the new radius (rounded to 1 dp)
			var radius = this._shape.getRadius().toFixed(1);

			var subtext = '';
			if (this.options.showRadius) {
				subtext = L.drawLocal.draw.handlers.circle.radius + ': ' +
						  L.GeometryUtil.readableDistance(radius, this.options.metric, this.options.feet, this.options.nautic);
			}
			this._tooltip.updateContent({
				text: this._endLabelText,
				subtext: subtext
			});
		}
	}
});



/**
 * @class L.Draw.Marker
 * @aka Draw.Marker
 * @inherits L.Draw.Feature
 */
L.Draw.Marker = L.Draw.Feature.extend({
	statics: {
		TYPE: 'marker'
	},

	options: {
		icon: new L.Icon.Default(),
		repeatMode: false,
		zIndexOffset: 2000 // This should be > than the highest z-index any markers
	},

	// @method initialize(): void
	initialize: function (map, options) {
		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Marker.TYPE;

		L.Draw.Feature.prototype.initialize.call(this, map, options);
	},

	// @method addHooks(): void
	// Add listener hooks to this handler.
	addHooks: function () {
		L.Draw.Feature.prototype.addHooks.call(this);

		if (this._map) {
			this._tooltip.updateContent({ text: L.drawLocal.draw.handlers.marker.tooltip.start });

			// Same mouseMarker as in Draw.Polyline
			if (!this._mouseMarker) {
				this._mouseMarker = L.marker(this._map.getCenter(), {
					icon: L.divIcon({
						className: 'leaflet-mouse-marker',
						iconAnchor: [20, 20],
						iconSize: [40, 40]
					}),
					opacity: 0,
					zIndexOffset: this.options.zIndexOffset
				});
			}

			this._mouseMarker
				.on('click', this._onClick, this)
				.addTo(this._map);

			this._map.on('mousemove', this._onMouseMove, this);
			this._map.on('click', this._onTouch, this);
		}
	},

	// @method removeHooks(): void
	// Remove listener hooks from this handler.
	removeHooks: function () {
		L.Draw.Feature.prototype.removeHooks.call(this);

		if (this._map) {
			if (this._marker) {
				this._marker.off('click', this._onClick, this);
				this._map
					.off('click', this._onClick, this)
					.off('click', this._onTouch, this)
					.removeLayer(this._marker);
				delete this._marker;
			}

			this._mouseMarker.off('click', this._onClick, this);
			this._map.removeLayer(this._mouseMarker);
			delete this._mouseMarker;

			this._map.off('mousemove', this._onMouseMove, this);
		}
	},

	_onMouseMove: function (e) {
        var latlng = L.LatLngUtil.pointToBounds(this._map.options.maxBounds, e.latlng);

		this._tooltip.updatePosition(latlng);
		this._mouseMarker.setLatLng(latlng);

		if (!this._marker) {
			this._marker = new L.Marker(latlng, {
				icon: this.options.icon,
				zIndexOffset: this.options.zIndexOffset
			});
			// Bind to both marker and map to make sure we get the click event.
			this._marker.on('click', this._onClick, this);
			this._map
				.on('click', this._onClick, this)
				.addLayer(this._marker);
		}
		else {
			latlng = this._mouseMarker.getLatLng();
			this._marker.setLatLng(latlng);
		}
	},

	_onClick: function () {
		this._fireCreatedEvent();

		this.disable();
		if (this.options.repeatMode) {
			this.enable();
		}
	},

	_onTouch: function (e) {
		// called on click & tap, only really does any thing on tap
		this._onMouseMove(e); // creates & places marker
		this._onClick(); // permanently places marker & ends interaction
	},

	_fireCreatedEvent: function () {
		var marker = new L.Marker.Touch(this._marker.getLatLng(), { icon: this.options.icon });
		L.Draw.Feature.prototype._fireCreatedEvent.call(this, marker);
	}
});



L.Edit = L.Edit || {};

/**
 * @class L.Edit.Marker
 * @aka Edit.Marker
 */
L.Edit.Marker = L.Handler.extend({
	// @method initialize(): void
	initialize: function (marker, options) {
		this._marker = marker;
		L.setOptions(this, options);
	},

	// @method addHooks(): void
	// Add listener hooks to this handler
	addHooks: function () {
		var marker = this._marker;
if (this._marker._map) {
            this._map = this._marker._map;
		marker.dragging.enable();
		marker.on('dragstart', this._onDragStart, marker);marker.on('dragend', this._onDragEnd, marker);
		this._toggleMarkerHighlight();this._map.fire(L.Draw.Event.EDITHOOK, {
                'editHandler' : this,
                'layer': this._marker
            });
        }
	},

	// @method removeHooks(): void
	// Remove listener hooks from this handler
	removeHooks: function () {
		var marker = this._marker;

		marker.dragging.disable();
		marker.off('dragstart', this._onDragStart, marker);
		marker.off('dragend', this._onDragEnd, marker);
		this._toggleMarkerHighlight();
	},

	_onDragStart: function (e) {
        this._originalLatLng = e.target.getLatLng().clone();
    },

	_onDragEnd: function (e) {
		var layer = e.target;

        var newLatLng = L.LatLngUtil.pointToBounds(this._map.options.maxBounds, layer.getLatLng());
        e.target.setLatLng(newLatLng);

		layer.edited = true;
		this._map.fire(L.Draw.Event.EDITMOVE, {
            layer: layer,
            newLatLng: newLatLng,
            originalLatLng: this._originalLatLng.clone(),
            editType: 'editmarker/Move',
            editHandler: this
        });
	},

	_toggleMarkerHighlight: function () {
		var icon = this._marker._icon;

		// Don't do anything if this layer is a marker but doesn't have an icon. Markers
		// should usually have icons. If using Leaflet.draw with Leaflet.markercluster there
		// is a chance that a marker doesn't.
		if (!icon) {
			return;
		}

		// This is quite naughty, but I don't see another way of doing it. (short of setting a new icon)
		icon.style.display = 'none';

		if (L.DomUtil.hasClass(icon, 'leaflet-edit-marker-selected')) {
			L.DomUtil.removeClass(icon, 'leaflet-edit-marker-selected');
			// Offset as the border will make the icon move.
			this._offsetMarker(icon, -4);

		} else {
			L.DomUtil.addClass(icon, 'leaflet-edit-marker-selected');
			// Offset as the border will make the icon move.
			this._offsetMarker(icon, 4);
		}

		icon.style.display = '';
	},

	_offsetMarker: function (icon, offset) {
		var iconMarginTop = parseInt(icon.style.marginTop, 10) - offset,
			iconMarginLeft = parseInt(icon.style.marginLeft, 10) - offset;

		icon.style.marginTop = iconMarginTop + 'px';
		icon.style.marginLeft = iconMarginLeft + 'px';
	}
});

L.Marker.addInitHook(function () {
	if (L.Edit.Marker) {
		this.editing = new L.Edit.Marker(this);

		if (this.options.editable) {
			this.editing.enable();
		}
	}
});



L.Edit = L.Edit || {};

/**
 * @class L.Edit.Polyline
 * @aka L.Edit.Poly
 * @aka Edit.Poly
 */
L.Edit.Poly = L.Handler.extend({
	options: {
        moveIcon: new L.DivIcon({
            iconSize: new L.Point(8, 8),
            className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-move'
        }),
        touchMoveIcon: new L.DivIcon({
            iconSize: new L.Point(20, 20),
            className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-move leaflet-touch-icon'
        })
    },

	// @method initialize(): void
	initialize: function (poly, options) {
if (! L.Browser.pointer) {
            this.options.moveIcon = this.options.touchMoveIcon;
        }
		this.latlngs = [poly._latlngs];
		if (poly._holes) {
			this.latlngs = this.latlngs.concat(poly._holes);
		}

		this._poly = poly;
		L.setOptions(this, options);

		this._poly.on('revert-edited', this._updateLatLngs, this);
	},

	// Compatibility method to normalize Poly* objects
	// between 0.7.x and 1.0+
	_defaultShape: function () {
		if (!L.Polyline._flat) {
			return this._poly._latlngs;
		}
		return L.Polyline._flat(this._poly._latlngs) ? this._poly._latlngs : this._poly._latlngs[0];
	},

	_eachVertexHandler: function (callback) {
		for (var i = 0; i < this._verticesHandlers.length; i++) {
			callback(this._verticesHandlers[i]);
		}
	},

	// @method addHooks(): void
	// Add listener hooks to this handler
	addHooks: function () {
		this._initHandlers();
		this._eachVertexHandler(function (handler) {
			handler.addHooks();
		});
        this._initMarkers();

        this._map.fire(L.Draw.Event.EDITHOOK, {
            'editHandler' : this,
            'layer': this._poly
        });
	},

	// @method removeHooks(): void
	// Remove listener hooks from this handler
	removeHooks: function () {
		this._eachVertexHandler(function (handler) {
			handler.removeHooks();
		});
        this._releaseMarkers();
	},

	// @method updateMarkers(): void
	// Fire an update for each vertex handler
	updateMarkers: function () {
		this._eachVertexHandler(function (handler) {
			handler.updateMarkers();
		});
	},

	_initHandlers: function () {
		this._verticesHandlers = [];
		for (var i = 0; i < this.latlngs.length; i++) {
			this._verticesHandlers.push(new L.Edit.PolyVerticesEdit(this._poly, this.latlngs[i], this.options));
		}
	},

	_updateLatLngs: function (e) {
		this.latlngs = [e.layer._latlngs];
		if (e.layer._holes) {
			this.latlngs = this.latlngs.concat(e.layer._holes);
		}
	},

    _createMoveMarker: function(latlng, icon) {
        var marker = new L.Marker.Touch(latlng, {
                        draggable: true,
                        icon: icon,
                        zIndexOffset: 10
                    });

        marker._origLatLng = latlng;

        // for polyline snap
        marker._owner = this._poly._leaflet_id;
        return marker;
    },

    _initMarkers: function() {
        this._poly.on('edit', this._onEdit, this);

        if (this._poly._map) {
            this._map = this._poly._map;

            if (!this._markerGroup) {
                this._markerGroup = new L.LayerGroup();
                this._map.addLayer(this._markerGroup);
            }

            if (!this._moveMarker) {
                var latlng = this._getMoveMarkerLatLng();
                this._moveMarker = this._createMoveMarker(latlng, this.options.moveIcon);

                this._moveMarker
                    .on('dragstart', this._onMarkerDragStart, this)
                    .on('drag', this._onMarkerDrag, this)
                    .on('dragend', this._onMarkerDragEnd, this)
                    .on('touchstart', this._onTouchStart, this)
                    .on('touchmove', this._onTouchMove, this)
                    .on('MSPointerMove', this._onTouchMove, this)
                    .on('touchend', this._onTouchEnd, this)
                    .on('MSPointerUp', this._onTouchEnd, this);

                this._markerGroup.addLayer(this._moveMarker);
            }
        }
    },

    _releaseMarkers: function () {
        this._moveMarker
            .off('dragstart', this._onMarkerDragStart, this)
            .off('drag', this._onMarkerDrag, this)
            .off('dragend', this._onMarkerDragEnd, this)
            .off('touchstart', this._onTouchStart, this)
            .off('touchmove', this._onTouchMove, this)
            .off('MSPointerMove', this._onTouchMove, this)
            .off('touchend', this._onTouchEnd, this)
            .off('MSPointerUp', this._onTouchEnd, this);

        this._markerGroup.removeLayer(this._moveMarker);
        delete this._moveMarker;

        this._markerGroup.clearLayers();
        this._map.removeLayer(this._markerGroup);
        delete this._markerGroup;

        delete this._map;
        this._poly.off('edit', this._onEdit, this);
    },

    _fireEdit: function () {
        this._poly.edited = true;
        this._poly.fire('edit');

        if (this._poly._map) {
            this._poly._map.fire(L.Draw.Event.EDITDONE);
        }
    },

    _onEdit: function (e) {
        if (this._moveMarker) {
            var latlng = this._getMoveMarkerLatLng();

            this._moveMarker.setLatLng(latlng);
            this._moveMarker._origLatLng = latlng;

            if (this.hasOwnProperty('_markers')) {
                this.updateMarkers();
            }

            this._poly.redraw();
        }
    },

    _onMarkerDragStart: function (e) {
        var marker = e.target;

        L.DomUtil.addClass(marker._icon, 'leaflet-active-editing-icon');
        this._originalLatLng = this._getMoveMarkerLatLng();
        this._poly.fire('editstart');
    },

    _onMarkerDrag: function (e) {
        var marker = e.target,
            latlng = marker.getLatLng();

        this._move(latlng);
        this._poly.fire('editdrag');
    },

    _onMarkerDragEnd: function (e) {
        var marker = e.target;

        L.DomUtil.removeClass(marker._icon, 'leaflet-active-editing-icon');
        this._fireEdit();
    },

    _onTouchStart: function (e) {
        var marker = e.target;

        L.DomUtil.addClass(marker._icon, 'leaflet-active-editing-icon');
        this._originalLatLng = this._getMoveMarkerLatLng();
        this._poly.fire('editstart');
    },

    _onTouchMove: function (e) {
        var layerPoint = this._map.mouseEventToLayerPoint(e.originalEvent.touches[0]),
            latlng = this._map.layerPointToLatLng(layerPoint);

        this._move(latlng);
        return false;
    },

    _onTouchEnd: function (e) {
        var marker = e.target;

        L.DomUtil.removeClass(marker._icon, 'leaflet-active-editing-icon');
        this._fireEdit();
    },

    _move: function (latlng) {
        var moveMarker = this._moveMarker;
        var latlngs = this._defaultShape();

        var latMove = latlng.lat - moveMarker._origLatLng.lat;
        var lngMove = latlng.lng - moveMarker._origLatLng.lng;

        for (var i = 0; i < latlngs.length; ++i) {
            latlngs[i].lat += latMove;
            latlngs[i].lng += lngMove;
        }

        moveMarker.setLatLng(latlng);
        moveMarker._origLatLng = latlng;

        this._poly.redraw();
        this.updateMarkers();

        this._map.fire(L.Draw.Event.EDITMOVE, {
            layer: this._poly,
            editHandler: this,
            originalLatLng: this._originalLatLng.clone(),
            newLatLng: latlng.clone(),
            latMove: latMove,
            lngMove: lngMove,
            editType: 'editpoly/Move',
        });
        this._poly.fire('move');
    },

    _getMoveMarkerLatLng: function () {
        var latlngs = this._defaultShape();

        if (this._poly instanceof L.Polygon) {
            var b = new L.LatLngBounds(latlngs);
            var c = b.getCenter();
            if (b.contains(c)) {
                return b.getCenter();
            }
        }

        var p1 = this._map.project(latlngs[0]);
        var p2 = this._map.project(latlngs[1]);

        return this._map.unproject(p1._multiplyBy(0.75)._add(p2._multiplyBy(0.25)));
    }
});

/**
 * @class L.Edit.PolyVerticesEdit
 * @aka Edit.PolyVerticesEdit
 */
L.Edit.PolyVerticesEdit = L.Handler.extend({
	options: {
		icon: new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className: 'leaflet-div-icon leaflet-editing-icon'
		}),
		touchIcon: new L.DivIcon({
			iconSize: new L.Point(20, 20),
			className: 'leaflet-div-icon leaflet-editing-icon leaflet-touch-icon'
		}),
		drawError: {
			color: '#b00b00',
			timeout: 1000
		}


	},

	// @method intialize(): void
	initialize: function (poly, latlngs, options) {
		// if touch, switch to touch icon
		if (! L.Browser.pointer) {
			this.options.icon = this.options.touchIcon;
		}
		this._poly = poly;

		if (options && options.drawError) {
			options.drawError = L.Util.extend({}, this.options.drawError, options.drawError);
		}

		this._latlngs = latlngs;

		L.setOptions(this, options);
	},

	// Compatibility method to normalize Poly* objects
	// between 0.7.x and 1.0+
	_defaultShape: function () {
		if (!L.Polyline._flat) {
			return this._latlngs;
		}
		return L.Polyline._flat(this._latlngs) ? this._latlngs : this._latlngs[0];
	},

	// @method addHooks(): void
	// Add listener hooks to this handler.
	addHooks: function () {
		var poly = this._poly;

		if (!(poly instanceof L.Polygon)) {
			poly.options.fill = false;
			if (poly.options.editing) {
				poly.options.editing.fill = false;
			}
		}

		poly.setStyle(poly.options.editing);

		if (this._poly._map) {

			this._map = this._poly._map; // Set map

			if (!this._markerGroup) {
				this._initMarkers();
			}
			this._poly._map.addLayer(this._markerGroup);
		}

        this._map.fire(L.Draw.Event.EDITHOOK, {
            'layer' : poly,
            'vertex' : true,
            'editHandler' : this
        });
	},

	// @method removeHooks(): void
	// Remove listener hooks from this handler.
	removeHooks: function () {
		var poly = this._poly;

		poly.setStyle(poly.options.original);

		if (poly._map) {
			poly._map.removeLayer(this._markerGroup);
			delete this._markerGroup;
			delete this._markers;
		}
	},

	// @method updateMarkers(): void
	// Clear markers and update their location
	updateMarkers: function () {
		this._markerGroup.clearLayers();
		this._initMarkers();
	},

	_initMarkers: function () {
		if (!this._markerGroup) {
			this._markerGroup = new L.LayerGroup();
		}
		this._markers = [];

		var latlngs = this._defaultShape(),
			i, j, len, marker;

		for (i = 0, len = latlngs.length; i < len; i++) {

			marker = this._createMarker(latlngs[i], i);
			marker.on('click', this._onMarkerClick, this);
			this._markers.push(marker);
		}

		var markerLeft, markerRight;

		for (i = 0, j = len - 1; i < len; j = i++) {
			if (i === 0 && !(L.Polygon && (this._poly instanceof L.Polygon))) {
				continue;
			}

			markerLeft = this._markers[j];
			markerRight = this._markers[i];

			this._createMiddleMarker(markerLeft, markerRight);
			this._updatePrevNext(markerLeft, markerRight);
		}
	},

	_createMarker: function (latlng, index) {
		// Extending L.Marker in TouchEvents.js to include touch.
		var marker = new L.Marker.Touch(latlng, {
			draggable: true,
			icon: this.options.icon,
		});

		marker._origLatLng = latlng;
		marker._index = index;

		marker
			.on('dragstart', this._onMarkerDragStart, this)
			.on('drag', this._onMarkerDrag, this)
			.on('dragend', this._onMarkerDragEnd, this)
			.on('touchmove', this._onTouchMove, this)
			.on('touchend', this._onMarkerDragEnd, this)
			.on('MSPointerMove', this._onTouchMove, this)
			.on('MSPointerUp', this._onMarkerDragEnd, this);

		this._markerGroup.addLayer(marker);

		return marker;
	},

	_onMarkerDragStart: function (e) {
        L.DomUtil.addClass(e.target._icon, 'leaflet-active-editing-icon');
        this._dragIndex = e.target._index;
        this._dragStartLocation = e.target.getLatLng().clone();
        this._dragEndLocation = null;
		this._poly.fire('editstart');
	},

    _onMarkerDragEnd: function (e) {
		L.DomUtil.removeClass(e.target._icon, 'leaflet-active-editing-icon');
        this._fireEdit(e);
    },

	_spliceLatLngs: function () {
		var latlngs = this._defaultShape();
		var removed = [].splice.apply(latlngs, arguments);
		this._poly._convertLatLngs(latlngs, true);
		this._poly.redraw();
		return removed;
	},

	_removeMarker: function (marker) {
		var i = marker._index;

		this._markerGroup.removeLayer(marker);
		this._markers.splice(i, 1);
		this._spliceLatLngs(i, 1);
		this._updateIndexes(i, -1);

		marker
			.off('dragstart', this._onMarkerDragStart, this)
			.off('drag', this._onMarkerDrag, this)
			.off('dragend', this._fireEdit, this)
			.off('touchmove', this._onMarkerDrag, this)
			.off('touchend', this._fireEdit, this)
			.off('click', this._onMarkerClick, this)
			.off('MSPointerMove', this._onTouchMove, this)
			.off('MSPointerUp', this._fireEdit, this);
	},

	_fireEdit: function (e, editType, editInfo) {
		this._poly.edited = true;
		this._poly.fire('edit');

        // if fired directly by event
        if ((typeof(editType) === 'undefined') || (editType === null)) {
            editType = 'editvertex/Move';
        }

        // if fired directly by event
        if (((typeof(editInfo) === 'undefined') || (editInfo === null)) && (this._dragStartLocation !== null)) {
            editInfo = {
                index: this._dragIndex,
                originalLatLng: this._dragStartLocation.clone(),
                newLatLng: this._dragEndLocation.clone()
            };
        }

        // not sure how this could happen, so if it does, just bail
        else if ((typeof(editInfo) === 'undefined') || (editInfo === null)) {
            return;
        }

		this._poly._map.fire(L.Draw.Event.EDITVERTEX, {
            editHandler: this,
            layers: this._markerGroup,
            editType: editType,
            editInfo: editInfo,
            poly: this._poly,
            marker: e.target
        });
	},

	_onMarkerDrag: function (e) {
		var marker = e.target;
		var poly = this._poly;
var newLatLng = L.LatLngUtil.pointToBounds(this._map.options.maxBounds, marker._latlng);
        this._dragEndLocation = newLatLng.clone();
        this._dragIndex = marker._index;
        marker.setLatLng(newLatLng);
		L.extend(marker._origLatLng, marker._latlng);

		if (marker._middleLeft) {
			marker._middleLeft.setLatLng(this._getMiddleLatLng(marker._prev, marker));
		}
		if (marker._middleRight) {
			marker._middleRight.setLatLng(this._getMiddleLatLng(marker, marker._next));
		}

		if (poly.options.poly) {
			var tooltip = poly._map._editTooltip; // Access the tooltip

			// If we don't allow intersections and the polygon intersects
			if (!poly.options.poly.allowIntersection && poly.intersects()) {

				var originalColor = poly.options.color;
				poly.setStyle({ color: this.options.drawError.color });

				// Manually trigger 'dragend' behavior on marker we are about to remove
				// WORKAROUND: introduced in 1.0.0-rc2, may be related to #4484
				if (L.version.indexOf('0.7') !== 0) {
					marker.dragging._draggable._onUp(e);
				}
				this._errorShown = true; marker.setLatLng(this._dragStartLocation);
				this._onMarkerDrag({'target' : marker });
				if (tooltip) {
					tooltip.updateContent({
						text: L.drawLocal.draw.handlers.polyline.error
					});
				}

				// Reset everything back to normal after a second
				setTimeout(function () {
					poly.setStyle({ color: originalColor });
					if (tooltip) {
						tooltip.updateContent({
							text: L.drawLocal.edit.handlers.edit.tooltip.text,
							subtext: L.drawLocal.edit.handlers.edit.tooltip.subtext
						});
					}
                    this._errorShown = false;
				}, 1000);

                this._poly._map.fire(L.Draw.Event.EDITREVERT);
			}
		}

		this._poly.redraw();
		this._poly.fire('editdrag');
	},

	_onMarkerClick: function (e) {

		var minPoints = L.Polygon && (this._poly instanceof L.Polygon) ? 4 : 3,
			marker = e.target;

		// If removing this point would create an invalid polyline/polygon don't remove
		if (this._defaultShape().length < minPoints) {
			return;
		}

        var originalLatLng = marker._latlng.clone();
        var originalIndex = marker._index;

        var originalLatLng = marker._latlng.clone();
        var originalIndex = marker._index;

		// remove the marker
		this._removeMarker(marker);

		// update prev/next links of adjacent markers
		this._updatePrevNext(marker._prev, marker._next);

		// remove ghost markers near the removed marker
		if (marker._middleLeft) {
			this._markerGroup.removeLayer(marker._middleLeft);
		}
		if (marker._middleRight) {
			this._markerGroup.removeLayer(marker._middleRight);
		}

		// create a ghost marker in place of the removed one
		if (marker._prev && marker._next) {
			this._createMiddleMarker(marker._prev, marker._next);

		} else if (!marker._prev) {
			marker._next._middleLeft = null;

		} else if (!marker._next) {
			marker._prev._middleRight = null;
		}

		this._fireEdit({'target': marker}, 'editvertex/Remove', {
            index: originalIndex,
            originalLatLng: originalLatLng,
            prevIndex: marker._prev._index,
            nextIndex: marker._next._index
        });
	},

	_onTouchMove: function (e) {

		var layerPoint = this._map.mouseEventToLayerPoint(e.originalEvent.touches[0]),
			latlng = this._map.layerPointToLatLng(layerPoint),
			marker = e.target;

		L.extend(marker._origLatLng, latlng);

		if (marker._middleLeft) {
			marker._middleLeft.setLatLng(this._getMiddleLatLng(marker._prev, marker));
		}
		if (marker._middleRight) {
			marker._middleRight.setLatLng(this._getMiddleLatLng(marker, marker._next));
		}

		this._poly.redraw();
		this.updateMarkers();
	},

	_updateIndexes: function (index, delta) {
		this._markerGroup.eachLayer(function (marker) {
			if (marker._index > index) {
				marker._index += delta;
			}
		});
	},

	_createMiddleMarker: function (marker1, marker2, fixedLL, fixedIndex) {
		var onClick;
		var onDragStart;
		var onDragEnd;
		var latlng;

        if (fixedLL !== undefined) {
            latlng = fixedLL;
        }
        else {
            latlng = this._getMiddleLatLng(marker1, marker2);
			}

		varmarker = this._createMarker(latlng);

		marker.setOpacity(0.6);

		marker1._middleRight = marker2._middleLeft = marker;

		onDragStart = function () {
			marker.off('touchmove', onDragStart, this);
			var i = marker2._index;

            if (fixedIndex !== undefined) {
                i = fixedIndex;
            }

			marker._index = i;

			marker
				.off('click', onClick, this)
				.on('click', this._onMarkerClick, this);

			latlng.lat = marker.getLatLng().lat;
			latlng.lng = marker.getLatLng().lng;

			this._spliceLatLngs(i, 0, latlng);
			this._markers.splice(i, 0, marker);

			marker.setOpacity(1);
            L.DomUtil.addClass(marker._icon, 'leaflet-active-editing-icon');

			this._updateIndexes(i, 1);
			marker2._index++;
			this._updatePrevNext(marker1, marker);
			this._updatePrevNext(marker, marker2);

			this._poly.fire('editstart');
		};

		onDragEnd = function () {
            L.DomUtil.removeClass(marker._icon, 'leaflet-active-editing-icon');

			marker.off('dragstart', onDragStart, this);
			marker.off('dragend', onDragEnd, this);
			marker.off('touchmove', onDragStart, this);

			this._createMiddleMarker(marker1, marker);
			this._createMiddleMarker(marker, marker2);
		};

		onClick = function () {
			onDragStart.call(this);
			onDragEnd.call(this);
			this._fireEdit({'target': marker}, 'editvertex/Add', {
                marker: marker,
                index: marker._index,
                originalLatLng: latlng,
                prevIndex: marker._prev._index,
                nextIndex: marker._next._index
            });
		};

		marker
			.on('click', onClick, this)
			.on('dragstart', onDragStart, this)
			.on('dragend', onDragEnd, this)
			.on('touchmove', onDragStart, this);

		this._markerGroup.addLayer(marker);
        return marker;
	},

	_updatePrevNext: function (marker1, marker2) {
		if (marker1) {
			marker1._next = marker2;
		}
		if (marker2) {
			marker2._prev = marker1;
		}
	},

	_getMiddleLatLng: function (marker1, marker2) {
		var map = this._poly._map,
			p1 = map.project(marker1.getLatLng()),
			p2 = map.project(marker2.getLatLng());

		return map.unproject(p1._add(p2)._divideBy(2));
	}
});

L.Polyline.addInitHook(function () {

	// Check to see if handler has already been initialized. This is to support versions of Leaflet that still have L.Handler.PolyEdit
	if (this.editing) {
		return;
	}

	if (L.Edit.Poly) {

		this.editing = new L.Edit.Poly(this, this.options.poly);

		if (this.options.editable) {
			this.editing.enable();
		}
	}

	this.on('add', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.addHooks();
		}
	});

	this.on('remove', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.removeHooks();
		}
	});
});



L.Edit = L.Edit || {};
/**
 * @class L.Edit.SimpleShape
 * @aka Edit.SimpleShape
 */
L.Edit.SimpleShape = L.Handler.extend({
	options: {
		moveIcon: new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-move'
		}),
		resizeIcon: new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-resize'
		}),
		touchMoveIcon: new L.DivIcon({
			iconSize: new L.Point(20, 20),
			className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-move leaflet-touch-icon'
		}),
		touchResizeIcon: new L.DivIcon({
			iconSize: new L.Point(20, 20),
			className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-resize leaflet-touch-icon'
		}),
	},

	// @method intialize(): void
	initialize: function (shape, options) {
		// if touch, switch to touch icon
		if (! L.Browser.pointer) {
			this.options.moveIcon = this.options.touchMoveIcon;
			this.options.resizeIcon = this.options.touchResizeIcon;
		}

		this._shape = shape;
		L.Util.setOptions(this, options);
	},

	// @method addHooks(): void
	// Add listener hooks to this handler
	addHooks: function () {
		var shape = this._shape;
		if (this._shape._map) {
			this._map = this._shape._map;
			shape.setStyle(shape.options.editing);

            if ((shape instanceof L.FeatureGroup) && (! shape.hasOwnProperty('_bboxOutline'))) {
                shape._bboxOutline = L.rectangle(shape.getBounds(), {
                    color: 'black',
                    dashArray: '10, 10',
                    fill: true,
                    fillColor: '#fe57a1',
                    fillOpacity: 0.1
                });
                shape.addLayer(shape._bboxOutline);
            }

			if (shape._map) {
				this._map = shape._map;
				if (!this._markerGroup) {
					this._initMarkers();
				}
				this._map.addLayer(this._markerGroup);
			}

            this._map.fire(L.Draw.Event.EDITHOOK, {
                'editHandler' : this,
                'layer': shape
            });
		}
	},

	// @method removeHooks(): void
	// Remove listener hooks from this handler
	removeHooks: function () {
		var shape = this._shape;

        if (shape instanceof L.FeatureGroup) {
            shape.removeLayer(shape._bboxOutline);
            this._map.removeLayer(shape._bboxOutline);
            delete shape._bboxOutline;
            L.FGUtils.applyFGOptions(shape, shape.options.original);
        }
        else {
            shape.setStyle(shape.options.original);
        }

		if (shape._map) {
			this._unbindMarker(this._moveMarker);

			for (var i = 0, l = this._resizeMarkers.length; i < l; i++) {
				this._unbindMarker(this._resizeMarkers[i]);
			}
			this._resizeMarkers = null;

			this._map.removeLayer(this._markerGroup);
			delete this._markerGroup;
		}

		this._map = null;
	},

	// @method updateMarkers(): void
	// Remove the edit markers from this layer
	updateMarkers: function () {
		this._markerGroup.clearLayers();
		this._initMarkers();
	},

	_initMarkers: function () {
		if (!this._markerGroup) {
			this._markerGroup = new L.LayerGroup();
		}

		// Create center marker
		this._createMoveMarker();

		// Create edge marker
		this._createResizeMarker();
	},

	_createMoveMarker: function () {
		// Children override
	},

	_createResizeMarker: function () {
		// Children override
	},

	_createMarker: function (latlng, icon) {
		// Extending L.Marker in TouchEvents.js to include touch.
		var marker = new L.Marker.Touch(latlng, {
			draggable: true,
			icon: icon,
			zIndexOffset: 10
		});

		this._bindMarker(marker);

		this._markerGroup.addLayer(marker);

		return marker;
	},

	_bindMarker: function (marker) {
		marker
			.on('dragstart', this._onMarkerDragStart, this)
			.on('drag', this._onMarkerDrag, this)
			.on('dragend', this._onMarkerDragEnd, this)
			.on('touchstart', this._onTouchStart, this)
			.on('touchmove', this._onTouchMove, this)
			.on('MSPointerMove', this._onTouchMove, this)
			.on('touchend', this._onTouchEnd, this)
			.on('MSPointerUp', this._onTouchEnd, this);
	},

	_unbindMarker: function (marker) {
		marker
			.off('dragstart', this._onMarkerDragStart, this)
			.off('drag', this._onMarkerDrag, this)
			.off('dragend', this._onMarkerDragEnd, this)
			.off('touchstart', this._onTouchStart, this)
			.off('touchmove', this._onTouchMove, this)
			.off('MSPointerMove', this._onTouchMove, this)
			.off('touchend', this._onTouchEnd, this)
			.off('MSPointerUp', this._onTouchEnd, this);
	},

	_onMarkerDragStart: function (e) {
		var marker = e.target;
		L.DomUtil.addClass(marker._icon, 'leaflet-active-editing-icon');
		this._shape.fire('editstart');
	},

	_fireEdit: function () {
		this._shape.edited = true;
		this._shape.fire('edit');

        if (this._shape._map) {
            this._shape._map.fire(L.Draw.Event.EDITDONE);
        }
	},

	_onMarkerDrag: function (e) {
		var marker = e.target,
			latlng = marker.getLatLng();

		if (marker === this._moveMarker) {
			this._move(latlng);
		} else {
			this._resize(latlng);
		}

		this._shape.redraw();
		this._shape.fire('editdrag');
	},

	_onMarkerDragEnd: function (e) {
		var marker = e.target;
		L.DomUtil.removeClass(marker._icon, 'leaflet-active-editing-icon');

		this._fireEdit();
	},

	_onTouchStart: function (e) {
		L.Edit.SimpleShape.prototype._onMarkerDragStart.call(this, e);

		if (typeof(this._getCorners) === 'function') {
			// Save a reference to the opposite point
			var corners = this._getCorners(),
				marker = e.target,
				currentCornerIndex = marker._cornerIndex;

			L.DomUtil.addClass(marker._icon, 'leaflet-active-editing-icon');

			// Copyed from Edit.Rectangle.js line 23 _onMarkerDragStart()
			// Latlng is null otherwise.
			this._oppositeCorner = corners[(currentCornerIndex + 2) % 4];
			this._toggleCornerMarkers(0, currentCornerIndex);
		}

		this._shape.fire('editstart');
	},

	_onTouchMove: function (e) {
		var layerPoint = this._map.mouseEventToLayerPoint(e.originalEvent.touches[0]),
			latlng = this._map.layerPointToLatLng(layerPoint),
			marker = e.target;

		if (marker === this._moveMarker) {
			this._move(latlng);
		} else {
			this._resize(latlng);
		}

		this._shape.redraw();

		// prevent touchcancel in IOS
		// e.preventDefault();
		return false;
	},

	_onTouchEnd: function (e) {
		var marker = e.target;

        L.DomUtil.removeClass(marker._icon, 'leaflet-active-editing-icon');
		this.updateMarkers();
		this._fireEdit();
	},

	_move: function () {
		// Children override
	},

	_resize: function () {
		// Children override
	}
});



L.Edit = L.Edit || {};
/**
 * @class L.Edit.Rectangle
 * @aka Edit.Rectangle
 * @inherits L.Edit.SimpleShape
 */
L.Edit.Rectangle = L.Edit.SimpleShape.extend({
	_createMoveMarker: function () {
		var bounds = this._shape.getBounds(),
			center = bounds.getCenter();

		this._moveMarker = this._createMarker(center, this.options.moveIcon);
	},

	_createResizeMarker: function () {
		var corners = this._getCorners();

		this._resizeMarkers = [];

		for (var i = 0, l = corners.length; i < l; i++) {
			this._resizeMarkers.push(this._createMarker(corners[i], this.options.resizeIcon));
			// Monkey in the corner index as we will need to know this for dragging
			this._resizeMarkers[i]._cornerIndex = i;
		}
	},

	_onMarkerDragStart: function (e) {
		L.Edit.SimpleShape.prototype._onMarkerDragStart.call(this, e);

		// Save a reference to the opposite point
		var corners = this._getCorners(),
			marker = e.target,
			currentCornerIndex = marker._cornerIndex;

        this._toggleCornerMarkers(0);
        if (marker !== this._moveMarker) {
            this._oppositeCorner = corners[(currentCornerIndex + 2) % 4];
            this._resizeMarkers[currentCornerIndex].setOpacity(1);
        }
	},

	_onMarkerDragEnd: function (e) {
		var marker = e.target,
			bounds, center;

		// Reset move marker position to the center
		if (marker === this._moveMarker) {
			bounds = this._shape.getBounds();
			center = bounds.getCenter();

			marker.setLatLng(center);
		}

		this._toggleCornerMarkers(1);
		this._repositionCornerMarkers();

		L.Edit.SimpleShape.prototype._onMarkerDragEnd.call(this, e);
	},

	_move: function (newCenter) {
        var newLatLngs = [];

		var latlngs = this._shape._defaultShape ? this._shape._defaultShape() : this._shape.getLatLngs();
		var bounds = this._shape.getBounds();
		var originalCenter = bounds.getCenter();

        // Offset the latlngs to the new center
		// but enforce move to be inside our maxBounds
        var bbounds = this._map.options.maxBounds;

		// enforce move to be inside our maxBounds
        var okToMove = true;
        var originals = [];
        for (var i = 0, l = latlngs.length; i < l; i++) {
            originals.push(latlngs[i].clone());
            var offsetLat = latlngs[i].lat - originalCenter.lat;
            var offsetLng = latlngs[i].lng - originalCenter.lng;
            var newLat = newCenter.lat + offsetLat;
            var newLng = newCenter.lng + offsetLng;

            var newLatLng = new L.LatLng(newLat, newLng);
            if (bbounds && (! bbounds.contains(newLatLng))) {
                okToMove = false;
            }

            newLatLngs.push([newLat, newLng]);
        }

        // only move if all corners are inside the maxbound
        if (okToMove) {
            // Offset the latlngs to the new center
            this._shape.setLatLngs(newLatLngs);

            // Reposition the resize markers
            this._repositionCornerMarkers();
            this._moveMarker._latlng = newCenter;
            this._moveMarker.update();

            this._map.fire(L.Draw.Event.EDITMOVE, {
                layer: this._shape,
                newCenter: newCenter,
                originalCenter: originalCenter,
                originalLatLngs: originals,
                newLatLngs: newLatLngs,
                editType: 'editrect/Move',
                editHandler: this
            });
            this._shape.fire('move', {'latlng': newCenter});
        }
        else {
            this._moveMarker._latlng = originalCenter;
            this._moveMarker.update();
        }
	},

	_resize: function (latlng) {
		var bounds;
var bbounds = this._map.options.maxBounds;

		var originalBounds = this._shape.getBounds();
		// Update the shape based on the current position of this corner and the opposite point
        if (bbounds) {
            this._shape.setBounds(L.LatLngUtil.boxToBounds(bbounds, this._oppositeCorner, latlng));
        }
        else {
            this._shape.setBounds(L.LatLngUtil.makeBounds(latlng, this._oppositeCorner));
        }

		// Reposition the move marker
		bounds = this._shape.getBounds();
		this._moveMarker._latlng = bounds.getCenter().clone();
        this._moveMarker.update();

		this._map.fire(L.Draw.Event.EDITRESIZE, {
            layer: this._shape,
            originalBounds: originalBounds,
            newBounds: bounds,
            editType: 'editrect/Resize',
            editHandler: this
        });
        this._shape.fire('resize');
	},

	_getCorners: function () {
		var bounds = this._shape.getBounds(),
			nw = bounds.getNorthWest(),
			ne = bounds.getNorthEast(),
			se = bounds.getSouthEast(),
			sw = bounds.getSouthWest();

		return [nw, ne, se, sw];
	},

	_toggleCornerMarkers: function (opacity) {
		for (var i = 0, l = this._resizeMarkers.length; i < l; i++) {
			this._resizeMarkers[i].setOpacity(opacity);
		}
	},

	_repositionCornerMarkers: function () {
		var corners = this._getCorners();

		for (var i = 0, l = this._resizeMarkers.length; i < l; i++) {
            this._resizeMarkers[i]._latlng = corners[i].clone();
            this._resizeMarkers[i].update();
		}
	}
});

L.Rectangle.addInitHook(function () {
	if (L.Edit.Rectangle) {
		this.editing = new L.Edit.Rectangle(this);

		if (this.options.editable) {
			this.editing.enable();
		}
	}
});



L.Edit = L.Edit || {};
/**
 * @class L.Edit.Circle
 * @aka Edit.Circle
 * @inherits L.Edit.SimpleShape
 */
L.Edit.Circle = L.Edit.SimpleShape.extend({
	_createMoveMarker: function () {
		var center = this._shape.getLatLng();

		this._moveMarker = this._createMarker(center, this.options.moveIcon);
	},

	_createResizeMarker: function () {
		var center = this._shape.getLatLng(),
			resizemarkerPoint = this._getResizeMarkerPoint(center);

		this._resizeMarkers = [];
		this._resizeMarkers.push(this._createMarker(resizemarkerPoint, this.options.resizeIcon));
	},

	_getResizeMarkerPoint: function (latlng) {
		// From L.shape.getBounds()
		var delta = this._shape._radius * Math.cos(Math.PI / 4),
			point = this._map.project(latlng);
		return this._map.unproject([point.x + delta, point.y - delta]);
	},

	_move: function (latlng) {
		var moveOk = true;

        var originalCenter = this._shape.getLatLng().clone();
        var bbounds = this._map.options.maxBounds;

		// force moves to be inside our bounds
        var originalRadius = L.LatLngUtil.radiusToBounds(bbounds, originalCenter, this._getResizeMarkerPoint(originalCenter));var resizemarkerPoint = this._getResizeMarkerPoint(latlng);
if (bbounds) {
            var moveToRadius = L.LatLngUtil.radiusToBounds(bbounds, latlng, resizemarkerPoint);
            moveOk = (originalRadius - moveToRadius) < 0.01;
        }

        if (moveOk) {
		// Move the resize marker
		this._resizeMarkers[0].setLatLng(resizemarkerPoint);

            // Move the circle
            this._shape._latlng = latlng;
            this._shape.redraw();

            this._moveMarker._latlng = latlng;
            this._moveMarker.update();
            this._moveMarker.setLatLng(latlng);

            this._map.fire(L.Draw.Event.EDITMOVE, {
                layer: this._shape,
                originalCenter: originalCenter,
                newCenter: latlng,
                editType: 'editcircle/Move',
                editHandler: this
            });
            this._shape.fire('move', {'latlng': latlng});
        }
        else {
            this._moveMarker._latlng = originalCenter;
            this._moveMarker.update();
        }
	},

	_resize: function (latlng) {
var originalCenter = this._shape.getLatLng();
        var bbounds = this._map.options.maxBounds;

        var originalRadius = L.LatLngUtil.radiusToBounds(bbounds, originalCenter, this._getResizeMarkerPoint(originalCenter));		var moveLatLng = this._moveMarker.getLatLng();
			varradius = L.LatLngUtil.radiusToBounds(bbounds,moveLatLng,latlng);
		this._shape.setRadius(radius);

		this._map.fire(L.Draw.Event.EDITRESIZE, {
            layer: this._shape,
            originalRadius: originalRadius,
            newRadius: radius,
            editType: 'editcircle/Resize',
            editHandler: this
        });
        this._shape.fire('resize');
	}
});

L.Circle.addInitHook(function () {
	if (L.Edit.Circle) {
		this.editing = new L.Edit.Circle(this);

		if (this.options.editable) {
			this.editing.enable();
		}
	}

	this.on('add', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.addHooks();
		}
	});

	this.on('remove', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.removeHooks();
		}
	});
});


L.Map.mergeOptions({
	touchExtend: true
});

/**
 * @class L.Map.TouchExtend
 * @aka TouchExtend
 */
L.Map.TouchExtend = L.Handler.extend({

	// @method initialize(): void
	// Sets TouchExtend private accessor variables
	initialize: function (map) {
		this._map = map;
		this._container = map._container;
		this._pane = map._panes.overlayPane;
	},

	// @method addHooks(): void
	// Adds dom listener events to the map container
	addHooks: function () {
		L.DomEvent.on(this._container, 'touchstart', this._onTouchStart, this);
		L.DomEvent.on(this._container, 'touchend', this._onTouchEnd, this);
		L.DomEvent.on(this._container, 'touchmove', this._onTouchMove, this);
		if (this._detectIE()) {
			L.DomEvent.on(this._container, 'MSPointerDown', this._onTouchStart, this);
			L.DomEvent.on(this._container, 'MSPointerUp', this._onTouchEnd, this);
			L.DomEvent.on(this._container, 'MSPointerMove', this._onTouchMove, this);
			L.DomEvent.on(this._container, 'MSPointerCancel', this._onTouchCancel, this);

		} else {
			L.DomEvent.on(this._container, 'touchcancel', this._onTouchCancel, this);
			L.DomEvent.on(this._container, 'touchleave', this._onTouchLeave, this);
		}
	},

	// @method removeHooks(): void
	// Removes dom listener events from the map container
	removeHooks: function () {
		L.DomEvent.off(this._container, 'touchstart', this._onTouchStart);
		L.DomEvent.off(this._container, 'touchend', this._onTouchEnd);
		L.DomEvent.off(this._container, 'touchmove', this._onTouchMove);
		if (this._detectIE()) {
			L.DomEvent.off(this._container, 'MSPointerDowm', this._onTouchStart);
			L.DomEvent.off(this._container, 'MSPointerUp', this._onTouchEnd);
			L.DomEvent.off(this._container, 'MSPointerMove', this._onTouchMove);
			L.DomEvent.off(this._container, 'MSPointerCancel', this._onTouchCancel);
		} else {
			L.DomEvent.off(this._container, 'touchcancel', this._onTouchCancel);
			L.DomEvent.off(this._container, 'touchleave', this._onTouchLeave);
		}
	},

	_touchEvent: function (e, type) {
		// #TODO: fix the pageX error that is do a bug in Android where a single touch triggers two click events
		// _filterClick is what leaflet uses as a workaround.
		// This is a problem with more things than just android. Another problem is touchEnd has no touches in
		// its touch list.
		var touchEvent = {};
		if (typeof e.touches !== 'undefined') {
			if (!e.touches.length) {
				return;
			}
			touchEvent = e.touches[0];
		} else if (e.pointerType === 'touch') {
			touchEvent = e;
			if (!this._filterClick(e)) {
				return;
			}
		} else {
			return;
		}

        if (e.pointerType == 'mouse') {
            return;
        }

		var containerPoint = this._map.mouseEventToContainerPoint(touchEvent),
			layerPoint = this._map.mouseEventToLayerPoint(touchEvent),
			latlng = this._map.layerPointToLatLng(layerPoint);

		this._map.fire(type, {
			latlng: latlng,
			layerPoint: layerPoint,
			containerPoint: containerPoint,
			pageX: touchEvent.pageX,
			pageY: touchEvent.pageY,
			originalEvent: e
		});
	},

	/** Borrowed from Leaflet and modified for bool ops **/
	_filterClick: function (e) {
		var timeStamp = (e.timeStamp || e.originalEvent.timeStamp),
			elapsed = L.DomEvent._lastClick && (timeStamp - L.DomEvent._lastClick);

		// are they closer together than 500ms yet more than 100ms?
		// Android typically triggers them ~300ms apart while multiple listeners
		// on the same event should be triggered far faster;
		// or check if click is simulated on the element, and if it is, reject any non-simulated events
		if ((elapsed && elapsed > 100 && elapsed < 500) || (e.target._simulatedClick && !e._simulated)) {
			L.DomEvent.stop(e);
			return false;
		}
		L.DomEvent._lastClick = timeStamp;
		return true;
	},

	_onTouchStart: function (e) {
		if (!this._map._loaded) {
			return;
		}

		var type = 'touchstart';
		this._touchEvent(e, type);

	},

	_onTouchEnd: function (e) {
		if (!this._map._loaded) {
			return;
		}

		var type = 'touchend';
		this._touchEvent(e, type);
	},

	_onTouchCancel: function (e) {
		if (!this._map._loaded) {
			return;
		}

		var type = 'touchcancel';
		if (this._detectIE()) {
			type = 'pointercancel';
		}
		this._touchEvent(e, type);
	},

	_onTouchLeave: function (e) {
		if (!this._map._loaded) {
			return;
		}

		var type = 'touchleave';
		this._touchEvent(e, type);
	},

	_onTouchMove: function (e) {
		if (!this._map._loaded) {
			return;
		}

		var type = 'touchmove';
		this._touchEvent(e, type);
	},

	_detectIE: function () {
		var ua = window.navigator.userAgent;

		var msie = ua.indexOf('MSIE ');
		if (msie > 0) {
			// IE 10 or older => return version number
			return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
		}

		var trident = ua.indexOf('Trident/');
		if (trident > 0) {
			// IE 11 => return version number
			var rv = ua.indexOf('rv:');
			return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
		}

		var edge = ua.indexOf('Edge/');
		if (edge > 0) {
			// IE 12 => return version number
			return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
		}

		// other browser
		return false;
	}
});

L.Map.addInitHook('addHandler', 'touchExtend', L.Map.TouchExtend);


/**
 * @class L.Marker.Touch
 * @aka Marker.Touch
 *
 * This isn't full Touch support. This is just to get markers to also support dom touch events after creation
 * #TODO: find a better way of getting markers to support touch.
 */
L.Marker.Touch = L.Marker.extend({

	_initInteraction: function () {
		if (!this.addInteractiveTarget) {
			// 0.7.x support
			return this._initInteractionLegacy();
		}
		// TODO this may need be updated to re-add touch events for 1.0+
		return L.Marker.prototype._initInteraction.apply(this);
	},

	// This is an exact copy of https://github.com/Leaflet/Leaflet/blob/v0.7/src/layer/marker/Marker.js
	// with the addition of the touch events
	_initInteractionLegacy: function () {

		if (!this.options.clickable) {
			return;
		}

		// TODO refactor into something shared with Map/Path/etc. to DRY it up

		var icon = this._icon,
			events = ['dblclick',
					  'mousedown',
					  'mouseover',
					  'mouseout',
					  'contextmenu',
					  'touchstart',
					  'touchend',
					  'touchmove'];

		if (this._detectIE) {
			events.concat(['MSPointerDown',
						   'MSPointerUp',
						   'MSPointerMove',
						   'MSPointerCancel']);
		} else {
			events.concat(['touchcancel']);
		}

		L.DomUtil.addClass(icon, 'leaflet-clickable');
		L.DomEvent.on(icon, 'click', this._onMouseClick, this);
		L.DomEvent.on(icon, 'keypress', this._onKeyPress, this);

		for (var i = 0; i < events.length; i++) {
			L.DomEvent.on(icon, events[i], this._fireMouseEvent, this);
		}

		if (L.Handler.MarkerDrag) {
			this.dragging = new L.Handler.MarkerDrag(this);

			if (this.options.draggable) {
				this.dragging.enable();
			}
		}
	},

	_detectIE: function () {
		var ua = window.navigator.userAgent;

		var msie = ua.indexOf('MSIE ');
		if (msie > 0) {
			// IE 10 or older => return version number
			return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
		}

		var trident = ua.indexOf('Trident/');
		if (trident > 0) {
			// IE 11 => return version number
			var rv = ua.indexOf('rv:');
			return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
		}

		var edge = ua.indexOf('Edge/');
		if (edge > 0) {
			// IE 12 => return version number
			return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
		}

		// other browser
		return false;
	}
});



/**
 * @class L.LatLngUtil
 * @aka LatLngUtil
 */
L.LatLngUtil = {
	// Clones a LatLngs[], returns [][]

	// @method cloneLatLngs(LatLngs[]): L.LatLngs[]
	// Clone the latLng point or points or nested points and return an array with those points
	cloneLatLngs: function (latlngs) {
		var clone = [];
		for (var i = 0, l = latlngs.length; i < l; i++) {
			// Check for nested array (Polyline/Polygon)
			if (Array.isArray(latlngs[i])) {
				clone.push(L.LatLngUtil.cloneLatLngs(latlngs[i]));
			} else {
				clone.push(this.cloneLatLng(latlngs[i]));
			}
		}
		return clone;
	},

	// @method cloneLatLng(LatLng): L.LatLng
	// Clone the latLng and return a new LatLng object.
	cloneLatLng: function (latlng) {
		return L.latLng(latlng.lat, latlng.lng);
	},

	pointToBounds: function (bbounds, point) {
        if (bbounds) {
            var bLat = Math.min(bbounds.getNorth(), Math.max(bbounds.getSouth(), point.lat));
            var bLng = Math.min(bbounds.getEast(), Math.max(bbounds.getWest(), point.lng));
            return new L.LatLng(bLat, bLng);
        }
        return point;
    },

    // makes a bounding box that's always (southWest,northEast) because L.LatLngBounds will internally assume this with no checking!!
    makeBounds: function (point1, point2) {
        var southLat = Math.min(point1.lat, point2.lat);
        var northLat = Math.max(point1.lat, point2.lat);

        var westLng = Math.min(point1.lng, point2.lng);
        var eastLng = Math.max(point1.lng, point2.lng);

        var southWest = new L.LatLng(southLat, westLng);
        var northEast = new L.LatLng(northLat, eastLng);
        return new L.LatLngBounds(southWest, northEast);
    },

    boxToBounds: function (bbounds, startCorner, otherCorner) {
        var boundedCorner = L.LatLngUtil.pointToBounds(bbounds, otherCorner);
        return L.LatLngUtil.makeBounds(startCorner, boundedCorner);
    },

    radiusToBounds: function (bbounds, startPoint, otherPoint) {
        var d = startPoint.distanceTo(otherPoint);

        if (bbounds) {
            if ((startPoint.lat-d) < bbounds.getSouth()) {
                d = Math.abs(startPoint.lat - bbounds.getSouth());
            }
            if ((startPoint.lat+d) > bbounds.getNorth()) {
                d = Math.abs(startPoint.lat - bbounds.getNorth());
            }
            if ((startPoint.lng-d) < bbounds.getWest()) {
                d = Math.abs(startPoint.lng - bbounds.getWest());
            }
            if ((startPoint.lng+d) > bbounds.getEast()) {
                d = Math.abs(startPoint.lng - bbounds.getEast());
            }
        }

        return d;
    }
};



/**
 * @class L.GeometryUtil
 * @aka GeometryUtil
 */
L.GeometryUtil = L.extend(L.GeometryUtil || {}, {
	// Ported from the OpenLayers implementation. See https://github.com/openlayers/openlayers/blob/master/lib/OpenLayers/Geometry/LinearRing.js#L270

	// @method geodesicArea(): number
	geodesicArea: function (latLngs) {
		var pointsCount = latLngs.length,
			area = 0.0,
			d2r = Math.PI / 180,
			p1, p2;

		if (pointsCount > 2) {
			for (var i = 0; i < pointsCount; i++) {
				p1 = latLngs[i];
				p2 = latLngs[(i + 1) % pointsCount];
				area += ((p2.lng - p1.lng) * d2r) *
						(2 + Math.sin(p1.lat * d2r) + Math.sin(p2.lat * d2r));
			}
			area = area * 6378137.0 * 6378137.0 / 2.0;
		}

		return Math.abs(area);
	},

    // @method formattedNumber(n, precision): string
    // Returns n in specified number format (if defined) and precision
    formattedNumber: function (n, precision) {
        var formatted = n.toFixed(precision);

        var format = L.drawLocal.format && L.drawLocal.format.numeric,
            delimiters = format && format.delimiters,
            thousands = delimiters && delimiters.thousands,
        	decimal = delimiters && delimiters.decimal;

        if (thousands || decimal) {
            var splitValue = formatted.split('.');
			formatted = thousands ? splitValue[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + thousands) : splitValue[0];
			decimal = decimal || '.';
            if (splitValue.length > 1) {
               formatted = formatted + decimal + splitValue[1];
            }
        }

        return formatted;
    },

	// @method readableArea(): string
	// Returns a readable area string in yards or metric
	readableArea: function (area, isMetric) {
		var areaStr;

		if (isMetric) {
			if (area >= 10000) {
				areaStr = L.GeometryUtil.formattedNumber(area * 0.0001, 2) + ' ha';
			} else {
				areaStr = L.GeometryUtil.formattedNumber(area, 2) + ' m&sup2;';
			}
		} else {
			area /= 0.836127; // Square yards in 1 meter

			if (area >= 3097600) { //3097600 square yards in 1 square mile
				areaStr = L.GeometryUtil.formattedNumber(area / 3097600, 2) + ' mi&sup2;';
			} else if (area >= 4840) {//48040 square yards in 1 acre
				areaStr = L.GeometryUtil.formattedNumber(area / 4840, 2) + ' acres';
			} else {
				areaStr = L.GeometryUtil.formattedNumber(Math.ceil(area)) + ' yd&sup2;';
			}
		}

		return areaStr;
	},

	// @method readableDistance(distance, units): string
	// Converts a metric distance to one of [ feet, nauticalMile, metric or yards ] string
	//
	// @alternative
	// @method readableDistance(distance, isMetric, useFeet, isNauticalMile): string
	// Converts metric distance to distance string.
	readableDistance: function (distance, isMetric, isFeet, isNauticalMile) {
		var distanceStr,
			units;

		if (typeof isMetric == "string") {
			units = isMetric;
		} else {
			if (isFeet) {
				units = 'feet';
			} else if (isNauticalMile) {
				units = 'nauticalMile';
			} else if (isMetric) {
				units = 'metric';
			} else {
				units = 'yards';
			}
		}

		switch (units) {
		case 'metric':
			// show metres when distance is < 1km, then show km
			if (distance > 1000) {
				distanceStr = L.GeometryUtil.formattedNumber(distance / 1000, 2) + ' km';
			} else {
				distanceStr = L.GeometryUtil.formattedNumber(Math.ceil(distance)) + ' m';
			}
			break;
		case 'feet':
			distance *= 1.09361 * 3;
			distanceStr = L.GeometryUtil.formattedNumber(Math.ceil(distance)) + ' ft';

			break;
		case 'nauticalMile':
			distance *= 0.53996;
			distanceStr = L.GeometryUtil.formattedNumber(distance / 1000, 2) + ' nm';
			break;
		case 'yards':
        /* falls through */
		default:
			distance *= 1.09361;

			if (distance > 1760) {
				distanceStr = L.GeometryUtil.formattedNumber(distance / 1760, 2) + ' miles';
			} else {
				distanceStr = L.GeometryUtil.formattedNumber(Math.ceil(distance)) + ' yd';
			}
			break;
		}
		return distanceStr;
	}
});



/**
 * @class L.LineUtil
 * @aka Util
 * @aka L.Utils
 */
L.Util.extend(L.LineUtil, {

	// @method segmentsIntersect(): boolean
	// Checks to see if two line segments intersect. Does not handle degenerate cases.
	// http://compgeom.cs.uiuc.edu/~jeffe/teaching/373/notes/x06-sweepline.pdf
	segmentsIntersect: function (/*Point*/ p, /*Point*/ p1, /*Point*/ p2, /*Point*/ p3) {
		return this._checkCounterclockwise(p, p2, p3) !==
			   this._checkCounterclockwise(p1, p2, p3) &&
			   this._checkCounterclockwise(p, p1, p2) !==
			   this._checkCounterclockwise(p, p1, p3);
	},

	// check to see if points are in counterclockwise order
	_checkCounterclockwise: function (/*Point*/ p, /*Point*/ p1, /*Point*/ p2) {
		return (p2.y - p.y) * (p1.x - p.x) > (p1.y - p.y) * (p2.x - p.x);
	}
});


/**
 * @class L.Polyline
 * @aka Polyline
 */
L.Polyline.include({

	// @method intersects(): boolean
	// Check to see if this polyline has any linesegments that intersect.
	// NOTE: does not support detecting intersection for degenerate cases.
	intersects: function () {
		var points = this._getProjectedPoints(),
			len = points ? points.length : 0,
			i, p, p1;

		if (this._tooFewPointsForIntersection()) {
			return false;
		}

		for (i = len - 1; i >= 3; i--) {
			p = points[i - 1];
			p1 = points[i];


			if (this._lineSegmentsIntersectsRange(p, p1, i - 2)) {
				return true;
			}
		}

		return false;
	},

	// @method newLatLngIntersects(): boolean
	// Check for intersection if new latlng was added to this polyline.
	// NOTE: does not support detecting intersection for degenerate cases.
	newLatLngIntersects: function (latlng, skipFirst) {
		// Cannot check a polyline for intersecting lats/lngs when not added to the map
		if (!this._map) {
			return false;
		}

		return this.newPointIntersects(this._map.latLngToLayerPoint(latlng), skipFirst);
	},

	// @method newPointIntersects(): boolean
	// Check for intersection if new point was added to this polyline.
	// newPoint must be a layer point.
	// NOTE: does not support detecting intersection for degenerate cases.
	newPointIntersects: function (newPoint, skipFirst) {
		var points = this._getProjectedPoints(),
			len = points ? points.length : 0,
			lastPoint = points ? points[len - 1] : null,
			// The previous previous line segment. Previous line segment doesn't need testing.
			maxIndex = len - 2;

		if (this._tooFewPointsForIntersection(1)) {
			return false;
		}

		return this._lineSegmentsIntersectsRange(lastPoint, newPoint, maxIndex, skipFirst ? 1 : 0);
	},

	// Polylines with 2 sides can only intersect in cases where points are collinear (we don't support detecting these).
	// Cannot have intersection when < 3 line segments (< 4 points)
	_tooFewPointsForIntersection: function (extraPoints) {
		var points = this._getProjectedPoints(),
			len = points ? points.length : 0;
		// Increment length by extraPoints if present
		len += extraPoints || 0;

		return !points || len <= 3;
	},

	// Checks a line segment intersections with any line segments before its predecessor.
	// Don't need to check the predecessor as will never intersect.
	_lineSegmentsIntersectsRange: function (p, p1, maxIndex, minIndex) {
		var points = this._getProjectedPoints(),
			p2, p3;

		minIndex = minIndex || 0;

		// Check all previous line segments (beside the immediately previous) for intersections
		for (var j = maxIndex; j > minIndex; j--) {
			p2 = points[j - 1];
			p3 = points[j];

			if (L.LineUtil.segmentsIntersect(p, p1, p2, p3)) {
				return true;
			}
		}

		return false;
	},

	_getProjectedPoints: function () {
		if (!this._defaultShape) {
			return this._originalPoints;
		}
		var points = [],
			_shape = this._defaultShape();

		for (var i = 0; i < _shape.length; i++) {
			points.push(this._map.latLngToLayerPoint(_shape[i]));
		}
		return points;
	}
});



/**
 * @class L.Polygon
 * @aka Polygon
 */
L.Polygon.include({

	// @method intersects(): boolean
	// Checks a polygon for any intersecting line segments. Ignores holes.
	intersects: function () {
		var polylineIntersects,
			points = this._getProjectedPoints(),
			len, firstPoint, lastPoint, maxIndex;

		if (this._tooFewPointsForIntersection()) {
			return false;
		}

		polylineIntersects = L.Polyline.prototype.intersects.call(this);

		// If already found an intersection don't need to check for any more.
		if (polylineIntersects) {
			return true;
		}

		len = points.length;
		firstPoint = points[0];
		lastPoint = points[len - 1];
		maxIndex = len - 2;

		// Check the line segment between last and first point. Don't need to check the first line segment (minIndex = 1)
		return this._lineSegmentsIntersectsRange(lastPoint, firstPoint, maxIndex, 1);
	}
});



/**
 * @class L.Control.Draw
 * @aka L.Draw
 */
L.Control.Draw = L.Control.extend({

	// Options
	options: {
		position: 'topleft',
		draw: {},
		edit: false,
        undoEnabled: true,
		undoStackSize: 20, // set to -1 for infinite
		undoKey: 'ctrl+z',
		redoKey: 'ctrl+y'
	},

	// @method initialize(): void
	// Initializes draw control, toolbars from the options
	initialize: function (options) {
		if (L.version < '0.7') {
			throw new Error('Leaflet.draw 0.2.3+ requires Leaflet 0.7.0+. Download latest from https://github.com/Leaflet/Leaflet/');
		}

		L.Control.prototype.initialize.call(this, options);

		var toolbar;

		this._toolbars = {};

		// Initialize toolbars
		if (L.DrawToolbar && this.options.draw) {
			toolbar = new L.DrawToolbar(this.options.draw);

			this._toolbars[L.DrawToolbar.TYPE] = toolbar;

			// Listen for when toolbar is enabled
			this._toolbars[L.DrawToolbar.TYPE].on('enable', this._toolbarEnabled, this);
		}

		if (L.EditToolbar && this.options.edit) {
			toolbar = new L.EditToolbar(this.options.edit);

			this._toolbars[L.EditToolbar.TYPE] = toolbar;

			// Listen for when toolbar is enabled
			this._toolbars[L.EditToolbar.TYPE].on('enable', this._toolbarEnabled, this);
		}
        
        if (L.Draw.UndoManager && this.options.undoEnabled) {
            if (this.hasOwnProperty('undoManager')) {
                this.undoManager.enable();
            }
            else {
                var drawnItems = options.edit.featureGroup;
                this.undoManager = new L.Draw.UndoManager(drawnItems._map, drawnItems, {
                    maxStackSize: this.options.undoStackSize,
                    undoKey: this.options.undoKey,
                    redoKey: this.options.redoKey
                });
            }
        }
        
		L.toolbar = this; //set global var for editing the toolbar
	},

	// @method onAdd(): container
	// Adds the toolbar container to the map
	onAdd: function (map) {
		var container = L.DomUtil.create('div', 'leaflet-draw'),
			addedTopClass = false,
			topClassName = 'leaflet-draw-toolbar-top',
			toolbarContainer;

		for (var toolbarId in this._toolbars) {
			if (this._toolbars.hasOwnProperty(toolbarId)) {
				toolbarContainer = this._toolbars[toolbarId].addToolbar(map);

				if (toolbarContainer) {
					// Add class to the first toolbar to remove the margin
					if (!addedTopClass) {
						if (!L.DomUtil.hasClass(toolbarContainer, topClassName)) {
							L.DomUtil.addClass(toolbarContainer.childNodes[0], topClassName);
						}
						addedTopClass = true;
					}

					container.appendChild(toolbarContainer);
				}
			}
		}

        if (L.Draw.UndoManager && this.options.undoEnabled) {
            if (this.hasOwnProperty('undoManager')) {
                this.undoManager.enable();
            }
            else {
                this.undoManager = new L.Draw.UndoManager(map, drawnItems, {
                    maxStackSize: this.options.undoStackSize,
                    undoKey: this.options.undoKey,
                    redoKey: this.options.redoKey
                });
            }
        }

		return container;
	},

	// @method onRemove(): void
	// Removes the toolbars from the map toolbar container
	onRemove: function () {
		for (var toolbarId in this._toolbars) {
			if (this._toolbars.hasOwnProperty(toolbarId)) {
				this._toolbars[toolbarId].removeToolbar();
			}
		}
        
        if (this.hasOwnProperty('undoManager')) {
            this.undoManager.disable();
        }
	},

	// @method setDrawingOptions(options): void
	// Sets options to all toolbar instances
	setDrawingOptions: function (options) {
		for (var toolbarId in this._toolbars) {
			if (this._toolbars[toolbarId] instanceof L.DrawToolbar) {
				this._toolbars[toolbarId].setOptions(options);
			}
		}
        
        for (var option in options) {
            if (options.hasOwnProperty(option)) {
                if (options[option].hasOwnProperty('guideLayers') && L.Draw.UndoManager && this.options.undoEnabled) {
                    this.undoManager.setGuideLayers(options[option].guideLayers);
                }
            }
        }
	},

	_toolbarEnabled: function (e) {
		var enabledToolbar = e.target;

		for (var toolbarId in this._toolbars) {
			if (this._toolbars[toolbarId] !== enabledToolbar) {
				this._toolbars[toolbarId].disable();
			}
		}
	}
});

L.Map.mergeOptions({
	drawControlTooltips: true,
	drawControl: false
});

L.Map.addInitHook(function () {
	if (this.options.drawControl) {
		this.drawControl = new L.Control.Draw();
		this.addControl(this.drawControl);
	}
});



/**
 * @class L.Draw.Toolbar
 * @aka Toolbar
 *
 * The toolbar class of the API. it is used to create the ui
 * This will be deprecated
 *
 * @example
 *
 * ```js
 *    var toolbar = L.Toolbar();
 *    toolbar.addToolbar(map);
 * ```
 *
 * ### Disabling a toolbar
 *
 * If you do not want a particular toolbar in your app you can turn it off by setting the toolbar to false.
 *
 * ```js
 *      var drawControl = new L.Control.Draw({
 *          draw: false,
 *          edit: {
 *              featureGroup: editableLayers
 *          }
 *      });
 * ```
 *
 * ### Disabling a toolbar item
 *
 * If you want to turn off a particular toolbar item, set it to false. The following disables drawing polygons and
 * markers. It also turns off the ability to edit layers.
 *
 * ```js
 *      var drawControl = new L.Control.Draw({
 *          draw: {
 *              polygon: false,
 *              marker: false
 *          },
 *          edit: {
 *              featureGroup: editableLayers,
 *              edit: false
 *          }
 *      });
 * ```
 */
L.Toolbar = L.Class.extend({
  includes: [L.Mixin.Events],

  // @section Methods for modifying the toolbar

  // @method initialize(options): void
  // Toolbar constructor
  initialize: function (options) {
    L.setOptions(this, options);

    this._modes = {};
    this._actionButtons = [];
    this._activeMode = null;
  },

  // @method enabled(): boolean
  // Gets a true/false of whether the toolbar is enabled
  enabled: function () {
    return this._activeMode !== null;
  },

  // @method disable(): void
  // Disables the toolbar
  disable: function () {
    if (!this.enabled()) {
      return;
    }

    this._activeMode.handler.disable();
  },

  // @method addToolbar(map): L.DomUtil
  // Adds the toolbar to the map and returns the toolbar dom element
  addToolbar: function (map) {
    var container = L.DomUtil.create('div', 'leaflet-draw-section'),
      buttonIndex = 0,
      buttonClassPrefix = this._toolbarClass || '',
      modeHandlers = this.getModeHandlers(map),
      i;

    this._toolbarContainer = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');
    this._map = map;

    for (i = 0; i < modeHandlers.length; i++) {
      if (modeHandlers[i].enabled) {
        this._initModeHandler(
          modeHandlers[i].handler,
          this._toolbarContainer,
          buttonIndex++,
          buttonClassPrefix,
          modeHandlers[i].title
        );
      }
    }

    // if no buttons were added, do not add the toolbar
    if (!buttonIndex) {
      return;
    }

    // Save button index of the last button, -1 as we would have ++ after the last button
    this._lastButtonIndex = --buttonIndex;

    // Create empty actions part of the toolbar
    this._actionsContainer = L.DomUtil.create('ul', 'leaflet-draw-actions');

    // Add draw and cancel containers to the control container
    container.appendChild(this._toolbarContainer);
    container.appendChild(this._actionsContainer);

    return container;
  },

  // @method removeToolbar(): void
  // Removes the toolbar and drops the handler event listeners
  removeToolbar: function () {
    // Dispose each handler
    for (var handlerId in this._modes) {
      if (this._modes.hasOwnProperty(handlerId)) {
        // Unbind handler button
        this._disposeButton(
          this._modes[handlerId].button,
          this._modes[handlerId].handler.enable,
          this._modes[handlerId].handler
        );

        // Make sure is disabled
        this._modes[handlerId].handler.disable();

        // Unbind handler
        this._modes[handlerId].handler
          .off('enabled', this._handlerActivated, this)
          .off('disabled', this._handlerDeactivated, this);
      }
    }
    this._modes = {};

    // Dispose the actions toolbar
    for (var i = 0, l = this._actionButtons.length; i < l; i++) {
      this._disposeButton(
        this._actionButtons[i].button,
        this._actionButtons[i].callback,
        this
      );
    }
    this._actionButtons = [];
    this._actionsContainer = null;
  },

  _initModeHandler: function (handler, container, buttonIndex, classNamePredix, buttonTitle) {
    var type = handler.type;

    this._modes[type] = {};

    this._modes[type].handler = handler;

    this._modes[type].button = this._createButton({
      type: type,
      title: buttonTitle,
      className: classNamePredix + '-' + type,
      container: container,
      callback: this._modes[type].handler.enable,
      context: this._modes[type].handler
    });

    this._modes[type].buttonIndex = buttonIndex;

    this._modes[type].handler
      .on('enabled', this._handlerActivated, this)
      .on('disabled', this._handlerDeactivated, this);
  },

  _detectIOS: function () {
    var iOS = (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);
    return iOS;
  },

  _createButton: function (options) {
    var link = L.DomUtil.create('a', options.className || '', options.container);
    link.href = '#';
    // Screen reader tag
    var sr = L.DomUtil.create('span', 'sr-only', options.container);

    link.href = '#';
    link.appendChild(sr);

    if (options.text) {
      link.innerHTML = options.text;
      sr.innerHTML = options.text;
    }

    if (options.title) {
      link.title = options.title;
      sr.innerHTML = options.title;
    }

    var buttonEvent = this._detectIOS() ? 'touchstart' : 'click';

    L.DomEvent
      .on(link, 'click', L.DomEvent.stopPropagation)
      .on(link, 'mousedown', L.DomEvent.stopPropagation)
      .on(link, 'dblclick', L.DomEvent.stopPropagation)
      .on(link, 'touchstart', L.DomEvent.stopPropagation)
      .on(link, 'click', L.DomEvent.preventDefault)
      .on(link, buttonEvent, options.callback, options.context);

    return link;
  },

  _disposeButton: function (button, callback) {
    var buttonEvent = this._detectIOS() ? 'touchstart' : 'click';

    L.DomEvent
      .off(button, 'click', L.DomEvent.stopPropagation)
      .off(button, 'mousedown', L.DomEvent.stopPropagation)
      .off(button, 'dblclick', L.DomEvent.stopPropagation)
      .off(button, 'touchstart', L.DomEvent.stopPropagation)
      .off(button, 'click', L.DomEvent.preventDefault)
      .off(button, buttonEvent, callback);
  },

  _handlerActivated: function (e) {
    // Disable active mode (if present)
    this.disable();

    // Cache new active feature
    this._activeModeType = e.handler;
    this._activeMode = this._modes[e.handler];

    L.DomUtil.addClass(this._activeMode.button, 'leaflet-draw-toolbar-button-enabled');

    this._showActionsToolbar();

    this.fire('enable');
  },

  _handlerDeactivated: function () {
    this._hideActionsToolbar();

    L.DomUtil.removeClass(this._activeMode.button, 'leaflet-draw-toolbar-button-enabled');

    this._activeMode = null;

    this.fire('disable');
  },

  _createActions: function (handler) {
    var container = this._actionsContainer,
      buttons = this.getActions(handler),
      l = buttons.length,
      li, di, dl, button;

    // Dispose the actions toolbar (todo: dispose only not used buttons)
    for (di = 0, dl = this._actionButtons.length; di < dl; di++) {
      this._disposeButton(this._actionButtons[di].button, this._actionButtons[di].callback);
    }
    this._actionButtons = [];

    // Remove all old buttons
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    for (var i = 0; i < l; i++) {
      if ('enabled' in buttons[i] && !buttons[i].enabled) {
        continue;
      }

      li = L.DomUtil.create('li', '', container);

      button = this._createButton({
        title: buttons[i].title,
        text: buttons[i].text,
        container: li,
        callback: buttons[i].callback,
        context: buttons[i].context
      });

      this._actionButtons.push({
        button: button,
        callback: buttons[i].callback
      });
    }
  },

  _showActionsToolbar: function () {
    var buttonIndex = this._activeMode.buttonIndex,
      lastButtonIndex = this._lastButtonIndex,
      toolbarPosition = this._activeMode.button.offsetTop - 1;

    // Recreate action buttons on every click
    this._createActions(this._activeMode.handler);

    // Correctly position the cancel button
    this._actionsContainer.style.top = toolbarPosition + 'px';

    if (buttonIndex === 0) {
      L.DomUtil.addClass(this._toolbarContainer, 'leaflet-draw-toolbar-notop');
      L.DomUtil.addClass(this._actionsContainer, 'leaflet-draw-actions-top');
    }

    if (buttonIndex === lastButtonIndex) {
      L.DomUtil.addClass(this._toolbarContainer, 'leaflet-draw-toolbar-nobottom');
      L.DomUtil.addClass(this._actionsContainer, 'leaflet-draw-actions-bottom');
    }

    this._actionsContainer.style.display = 'block';
  },

  _hideActionsToolbar: function () {
    this._actionsContainer.style.display = 'none';

    L.DomUtil.removeClass(this._toolbarContainer, 'leaflet-draw-toolbar-notop');
    L.DomUtil.removeClass(this._toolbarContainer, 'leaflet-draw-toolbar-nobottom');
    L.DomUtil.removeClass(this._actionsContainer, 'leaflet-draw-actions-top');
    L.DomUtil.removeClass(this._actionsContainer, 'leaflet-draw-actions-bottom');
  }
});



L.Draw = L.Draw || {};
/**
 * @class L.Draw.Tooltip
 * @aka Tooltip
 *
 * The tooltip class — it is used to display the tooltip while drawing
 * This will be depreciated
 *
 * @example
 *
 * ```js
 *    var tooltip = L.Draw.Tooltip();
 * ```
 *
 */
L.Draw.Tooltip = L.Class.extend({

	// @section Methods for modifying draw state

	// @method initialize(map): void
	// Tooltip constructor
	initialize: function (map) {
		this._map = map;
		this._popupPane = map._panes.popupPane;

		this._container = map.options.drawControlTooltips ?
			L.DomUtil.create('div', 'leaflet-draw-tooltip', this._popupPane) : null;
		this._singleLineLabel = false;

		this._map.on('mouseout', this._onMouseOut, this);
	},

	// @method dispose(): void
	// Remove Tooltip DOM and unbind events
	dispose: function () {
		this._map.off('mouseout', this._onMouseOut, this);

		if (this._container) {
			this._popupPane.removeChild(this._container);
			this._container = null;
		}
	},

	// @method updateContent(labelText): this
	// Changes the tooltip text to string in function call
	updateContent: function (labelText) {
		if (!this._container) {
			return this;
		}
		labelText.subtext = labelText.subtext || '';

		// update the vertical position (only if changed)
		if (labelText.subtext.length === 0 && !this._singleLineLabel) {
			L.DomUtil.addClass(this._container, 'leaflet-draw-tooltip-single');
			this._singleLineLabel = true;
		}
		else if (labelText.subtext.length > 0 && this._singleLineLabel) {
			L.DomUtil.removeClass(this._container, 'leaflet-draw-tooltip-single');
			this._singleLineLabel = false;
		}

		this._container.innerHTML =
			(labelText.subtext.length > 0 ?
			'<span class="leaflet-draw-tooltip-subtext">' + labelText.subtext + '</span>' + '<br />' : '') +
			'<span>' + labelText.text + '</span>';

		return this;
	},

	// @method updatePosition(latlng): this
	// Changes the location of the tooltip
	updatePosition: function (latlng) {
		var pos = this._map.latLngToLayerPoint(latlng),
			tooltipContainer = this._container;

		if (this._container) {
			tooltipContainer.style.visibility = 'inherit';
			L.DomUtil.setPosition(tooltipContainer, pos);
		}

		return this;
	},

	// @method showAsError(): this
	// Applies error class to tooltip
	showAsError: function () {
		if (this._container) {
			L.DomUtil.addClass(this._container, 'leaflet-error-draw-tooltip');
		}
		return this;
	},

	// @method removeError(): this
	// Removes the error class from the tooltip
	removeError: function () {
		if (this._container) {
			L.DomUtil.removeClass(this._container, 'leaflet-error-draw-tooltip');
		}
		return this;
	},

	_onMouseOut: function () {
		if (this._container) {
			this._container.style.visibility = 'hidden';
		}
	}
});



/**
 * @class L.DrawToolbar
 * @aka Toolbar
 */
L.DrawToolbar = L.Toolbar.extend({

	statics: {
		TYPE: 'draw'
	},

	options: {
		polyline: {},
		polygon: {},
		rectangle: {},
		circle: {},
		marker: {}
	},

	// @method initialize(): void
	initialize: function (options) {
		// Ensure that the options are merged correctly since L.extend is only shallow
		for (var type in this.options) {
			if (this.options.hasOwnProperty(type)) {
				if (options[type]) {
					options[type] = L.extend({}, this.options[type], options[type]);
				}
			}
		}

		this._toolbarClass = 'leaflet-draw-draw';
		L.Toolbar.prototype.initialize.call(this, options);
	},

	// @method getModeHandlers(): void
	// Get mode handlers information
	getModeHandlers: function (map) {
		return [
			{
				enabled: this.options.polyline,
				handler: new L.Draw.Polyline(map, this.options.polyline),
				title: L.drawLocal.draw.toolbar.buttons.polyline
			},
			{
				enabled: this.options.polygon,
				handler: new L.Draw.Polygon(map, this.options.polygon),
				title: L.drawLocal.draw.toolbar.buttons.polygon
			},
			{
				enabled: this.options.rectangle,
				handler: new L.Draw.Rectangle(map, this.options.rectangle),
				title: L.drawLocal.draw.toolbar.buttons.rectangle
			},
			{
				enabled: this.options.circle,
				handler: new L.Draw.Circle(map, this.options.circle),
				title: L.drawLocal.draw.toolbar.buttons.circle
			},
			{
				enabled: this.options.marker,
				handler: new L.Draw.Marker(map, this.options.marker),
				title: L.drawLocal.draw.toolbar.buttons.marker
			}
		];
	},

	// @method getActions(): void
	// Get action information
	getActions: function (handler) {
		return [
			{
				enabled: handler.completeShape,
				title: L.drawLocal.draw.toolbar.finish.title,
				text: L.drawLocal.draw.toolbar.finish.text,
				callback: handler.completeShape,
				context: handler
			},
			{
				enabled: handler.deleteLastVertex,
				title: L.drawLocal.draw.toolbar.undo.title,
				text: L.drawLocal.draw.toolbar.undo.text,
				callback: handler.deleteLastVertex,
				context: handler
			},
			{
				title: L.drawLocal.draw.toolbar.actions.title,
				text: L.drawLocal.draw.toolbar.actions.text,
				callback: this.disable,
				context: this
			}
		];
	},

	// @method setOptions(): void
	// Sets the options to the toolbar
	setOptions: function (options) {
		L.setOptions(this, options);

		for (var type in this._modes) {
			if (this._modes.hasOwnProperty(type) && options.hasOwnProperty(type)) {
				this._modes[type].handler.setOptions(options[type]);
			}
		}
	}
});



/*L.Map.mergeOptions({
 editControl: true
 });*/
/**
 * @class L.EditToolbar
 * @aka EditToolbar
 */
L.EditToolbar = L.Toolbar.extend({
  statics: {
    TYPE: 'edit'
  },

  options: {
    edit: {
      selectedPathOptions: {
        dashArray: '10, 10',

        fill: true,
        fillColor: '#fe57a1',
        fillOpacity: 0.1,

        // Whether to user the existing layers color
        maintainColor: false
      }
    },
    remove: {},
    poly: null,
    featureGroup: null /* REQUIRED! TODO: perhaps if not set then all layers on the map are selectable? */
  },

  // @method intialize(): void
  initialize: function (options) {
    // Need to set this manually since null is an acceptable value here
    if (options.edit) {
      if (typeof options.edit.selectedPathOptions === 'undefined') {
        options.edit.selectedPathOptions = this.options.edit.selectedPathOptions;
      }
      options.edit.selectedPathOptions = L.extend({}, this.options.edit.selectedPathOptions, options.edit.selectedPathOptions);
    }

    if (options.remove) {
      options.remove = L.extend({}, this.options.remove, options.remove);
    }

    if (options.poly) {
      options.poly = L.extend({}, this.options.poly, options.poly);
    }

    this._toolbarClass = 'leaflet-draw-edit';
    L.Toolbar.prototype.initialize.call(this, options);

    this._selectedFeatureCount = 0;
  },

  getEditHandler: function (map, featureGroup) {
    return new L.EditToolbar.Edit(map, {
      featureGroup: featureGroup,
      selectedPathOptions: this.options.edit.selectedPathOptions,
      poly: this.options.poly
    });
  },

  // @method getModeHandlers(): void
  // Get mode handlers information
  getModeHandlers: function (map) {
    var featureGroup = this.options.featureGroup;
    var editHandler = this.getEditHandler(map, featureGroup);

    return [
      {
        enabled: this.options.edit,
        handler: editHandler,
        title: L.drawLocal.edit.toolbar.buttons.edit
      },
      {
        enabled: this.options.remove,
        handler: new L.EditToolbar.Delete(map, {
          featureGroup: featureGroup
        }),
        title: L.drawLocal.edit.toolbar.buttons.remove
      }
    ];
  },

  // @method getActions(): void
  // Get actions information
  getActions: function () {
    var actions = [
      {
        title: L.drawLocal.edit.toolbar.actions.save.title,
        text: L.drawLocal.edit.toolbar.actions.save.text,
        callback: this._save,
        context: this
      },
      {
        title: L.drawLocal.edit.toolbar.actions.cancel.title,
        text: L.drawLocal.edit.toolbar.actions.cancel.text,
        callback: this.disable,
        context: this
      },
      {
        title: L.drawLocal.edit.toolbar.actions.clearAll.title,
        text: L.drawLocal.edit.toolbar.actions.clearAll.text,
        callback: this._clearAllLayers,
        context: this
      }
    ];

    if (this._activeModeType === 'remove') {
      actions.push({
        title: L.drawLocal.edit.toolbar.actions.clearAll.title,
        text: L.drawLocal.edit.toolbar.actions.clearAll.text,
        callback: this._clearAllLayers,
        context: this
      });
    }

    return actions;
  },

  // @method addToolbar(): void
  // Adds the toolbar to the map
  addToolbar: function (map) {
    var container = L.Toolbar.prototype.addToolbar.call(this, map);

    this._checkDisabled();

    this.options.featureGroup.on('layeradd layerremove', this._checkDisabled, this);

    return container;
  },

  // @method removeToolbar(): void
  // Removes the toolbar from the map
  removeToolbar: function () {
    this.options.featureGroup.off('layeradd layerremove', this._checkDisabled, this);

    L.Toolbar.prototype.removeToolbar.call(this);
  },

  // @method disable(): void
  // Disables the toolbar
  disable: function () {
    if (!this.enabled()) {
      return;
    }

    this._activeMode.handler.revertLayers();

    L.Toolbar.prototype.disable.call(this);
  },

  _save: function () {
    this._activeMode.handler.save();
    if (this._activeMode) {
      this._activeMode.handler.disable();
    }
  },

  _clearAllLayers: function () {
    this._activeMode.handler.removeAllLayers();
    if (this._activeMode) {
      this._activeMode.handler.disable();
    }
  },

  _checkDisabled: function () {
    var featureGroup = this.options.featureGroup,
      hasLayers = featureGroup.getLayers().length !== 0,
      button;

    if (this.options.edit) {
      button = this._modes[L.EditToolbar.Edit.TYPE].button;

      if (hasLayers) {
        L.DomUtil.removeClass(button, 'leaflet-disabled');
      } else {
        L.DomUtil.addClass(button, 'leaflet-disabled');
      }

      button.setAttribute(
        'title',
        hasLayers ?
          L.drawLocal.edit.toolbar.buttons.edit
          : L.drawLocal.edit.toolbar.buttons.editDisabled
      );
    }

    if (this.options.remove) {
      button = this._modes[L.EditToolbar.Delete.TYPE].button;

      if (hasLayers) {
        L.DomUtil.removeClass(button, 'leaflet-disabled');
      } else {
        L.DomUtil.addClass(button, 'leaflet-disabled');
      }

      button.setAttribute(
        'title',
        hasLayers ?
          L.drawLocal.edit.toolbar.buttons.remove
          : L.drawLocal.edit.toolbar.buttons.removeDisabled
      );
    }
  }
});



/**
 * @class L.EditToolbar.Edit
 * @aka EditToolbar.Edit
 */
L.EditToolbar.Edit = L.Handler.extend({
	statics: {
		TYPE: 'edit'
	},

	includes: L.Mixin.Events,

	// @method intialize(): void
	initialize: function (map, options) {
		L.Handler.prototype.initialize.call(this, map);

		L.setOptions(this, options);

		// Store the selectable layer group for ease of access
		this._featureGroup = options.featureGroup;

		if (!(this._featureGroup instanceof L.FeatureGroup)) {
			throw new Error('options.featureGroup must be a L.FeatureGroup');
		}

		this._uneditedLayerProps = {};

		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.EditToolbar.Edit.TYPE;
	},

	// @method enable(): void
	// Enable the edit toolbar
	enable: function () {
		if (this._enabled || !this._hasAvailableLayers()) {
			return;
		}
		this.fire('enabled', { handler: this.type });
		//this disable other handlers

		this._map.fire(L.Draw.Event.EDITSTART, { handler: this.type });
			//allow drawLayer to be updated before beginning edition.

		L.Handler.prototype.enable.call(this);
		this._featureGroup
			.on('layeradd', this._enableLayerEdit, this)
			.on('layerremove', this._disableLayerEdit, this);
	},

	// @method disable(): void
	// Disable the edit toolbar
	disable: function () {
		if (!this._enabled) {
			return;
		}
		this._featureGroup
			.off('layeradd', this._enableLayerEdit, this)
			.off('layerremove', this._disableLayerEdit, this);
		L.Handler.prototype.disable.call(this);
		this._map.fire(L.Draw.Event.EDITSTOP, { handler: this.type });
		this.fire('disabled', {handler: this.type});
	},

	// @method addHooks(): void
	// Add listener hooks for this handler
	addHooks: function () {
		var map = this._map;

		if (map) {
			map.getContainer().focus();

			this._featureGroup.eachLayer(this._enableLayerEdit, this);

			this._tooltip = new L.Draw.Tooltip(this._map);
			this._tooltip.updateContent({
				text: L.drawLocal.edit.handlers.edit.tooltip.text,
				subtext: L.drawLocal.edit.handlers.edit.tooltip.subtext
			});

			// Quickly access the tooltip to update for intersection checking
			map._editTooltip = this._tooltip;

			this._updateTooltip();

			this._map
				.on('mousemove', this._onMouseMove, this)
				.on('touchmove', this._onMouseMove, this)
				.on('MSPointerMove', this._onMouseMove, this)
				.on(L.Draw.Event.EDITVERTEX, this._updateTooltip, this);

            L.DomEvent.on(this._map._container, 'keyup', this.keyCancel, this);
		}
	},

    keyCancel: function (e) {
		if (e.keyCode === 27) {
			this.disable();
        }
    },

	// @method removeHooks(): void
	// Remove listener hooks for this handler
	removeHooks: function () {
		if (this._map) {
			// Clean up selected layers.
			this._featureGroup.eachLayer(this._disableLayerEdit, this);

			// Clear the backups of the original layers
			this._uneditedLayerProps = {};

			this._tooltip.dispose();
			this._tooltip = null;

			this._map
				.off('mousemove', this._onMouseMove, this)
				.off('touchmove', this._onMouseMove, this)
				.off('MSPointerMove', this._onMouseMove, this)
				.off(L.Draw.Event.EDITVERTEX, this._updateTooltip, this);

			L.DomEvent.off(this, 'keyup', this.keyCancel, this);
		}
	},

	// @method revertLayers(): void
	// Revert each layer's geometry changes
	revertLayers: function () {
		this._featureGroup.eachLayer(function (layer) {
			this._revertLayer(layer);
		}, this);
	},

	// @method save(): void
	// Save the layer geometries
	save: function () {
		var editedLayers = new L.LayerGroup();
		this._featureGroup.eachLayer(function (layer) {
			if (layer.edited) {
				editedLayers.addLayer(layer);
				layer.edited = false;
			}
		});
		this._map.fire(L.Draw.Event.EDITED, {layers: editedLayers});
	},

	_backupLayer: function (layer) {
		var id = L.Util.stamp(layer);

		if (!this._uneditedLayerProps[id]) {
			// Polyline, Polygon or Rectangle
			if (layer instanceof L.Polyline || layer instanceof L.Polygon || layer instanceof L.Rectangle) {
				this._uneditedLayerProps[id] = {
					latlngs: L.LatLngUtil.cloneLatLngs(layer.getLatLngs())
				};
			}
            else if (layer instanceof L.Circle) {
				this._uneditedLayerProps[id] = {
					latlng: L.LatLngUtil.cloneLatLng(layer.getLatLng()),
					radius: layer.getRadius()
				};
			}
            else if (layer instanceof L.Marker) { // Marker
				this._uneditedLayerProps[id] = {
					latlng: L.LatLngUtil.cloneLatLng(layer.getLatLng())
				};
			}
            else if (layer instanceof L.FeatureGroup) {
                var layers = layer.getLayers();
                for (var i=0; i<layers.length; i++) {
                    this._backupLayer(layers[i]);
                }
                this._uneditedLayerProps[id] = layer;
            }
		}
	},

	_getTooltipText: function () {
		return ({
			text: L.drawLocal.edit.handlers.edit.tooltip.text,
			subtext: L.drawLocal.edit.handlers.edit.tooltip.subtext
		});
	},

	_updateTooltip: function () {
		this._tooltip.updateContent(this._getTooltipText());
	},

	_revertLayer: function (layer, isSubLayer) {
		var id = L.Util.stamp(layer);
		layer.edited = false;

		if (this._uneditedLayerProps.hasOwnProperty(id)) {
			// Polyline, Polygon or Rectangle
			if (layer instanceof L.Polyline || layer instanceof L.Polygon || layer instanceof L.Rectangle) {
				layer.setLatLngs(this._uneditedLayerProps[id].latlngs);
			}
            else if (layer instanceof L.Circle) {
				layer.setLatLng(this._uneditedLayerProps[id].latlng);
				layer.setRadius(this._uneditedLayerProps[id].radius);
			}
            else if (layer instanceof L.Marker) { // Marker
				layer.setLatLng(this._uneditedLayerProps[id].latlng);
			}
            else if (layer instanceof L.FeatureGroup) {
                var layers = layer.getLayers();
                for (var i=0; i<layers.length; i++) {
                    this._revertLayer(layers[i], true);
                }
            }

            if (isSubLayer !== true) {
                layer.fire('revert-edited', { layer: layer });
            }
		}
	},

	_enableLayerEdit: function (e) {
		var layer = e.layer || e.target || e,
			pathOptions, poly;

		// Back up this layer (if haven't before)
		this._backupLayer(layer);

		if (this.options.poly) {
			poly = L.Util.extend({}, this.options.poly);
			layer.options.poly = poly;
		}

		// Set different style for editing mode
		if (this.options.selectedPathOptions) {
			pathOptions = L.Util.extend({}, this.options.selectedPathOptions);

			// Use the existing color of the layer
			if (pathOptions.maintainColor) {
				pathOptions.color = layer.options.color;
				pathOptions.fillColor = layer.options.fillColor;
			}

            if (layer instanceof L.FeatureGroup) {
                layer.options.original = L.FGUtils.getFGOptions(layer);
            }
            else {
                layer.options.original = L.extend({}, layer.options);
            }
			layer.options.editing = pathOptions;
		}

		if (layer instanceof L.Marker) {
			if (layer.editing) {
				layer.editing.enable();
			}
			layer.dragging.enable();
			layer
				.on('dragend', this._onMarkerDragEnd)
				// #TODO: remove when leaflet finally fixes their draggable so it's touch friendly again.
				.on('touchmove', this._onTouchMove, this)
				.on('MSPointerMove', this._onTouchMove, this)
				.on('touchend', this._onMarkerDragEnd, this)
				.on('MSPointerUp', this._onMarkerDragEnd, this);
		} else {
			layer.editing.enable();
		}
	},

	_disableLayerEdit: function (e) {
		var layer = e.layer || e.target || e;

		layer.edited = false;
		if (layer.editing) {
			layer.editing.disable();
		}

		delete layer.options.editing;
		delete layer.options.original;
		// Reset layer styles to that of before select
		if (this._selectedPathOptions) {
			if (layer instanceof L.Marker) {
				this._toggleMarkerHighlight(layer);
			} else {
				// reset the layer style to what is was before being selected
				layer.setStyle(layer.options.previousOptions);
				// remove the cached options for the layer object
				delete layer.options.previousOptions;
			}
		}

		if (layer instanceof L.Marker) {
			layer.dragging.disable();
			layer
				.off('dragend', this._onMarkerDragEnd, this)
				.off('touchmove', this._onTouchMove, this)
				.off('MSPointerMove', this._onTouchMove, this)
				.off('touchend', this._onMarkerDragEnd, this)
				.off('MSPointerUp', this._onMarkerDragEnd, this);
		} else {
			layer.editing.disable();
		}
	},

	_onMouseMove: function (e) {
		this._tooltip.updatePosition(e.latlng);
	},

	_onMarkerDragEnd: function (e) {
		var layer = e.target;
		layer.edited = true;
		this._map.fire(L.Draw.Event.EDITMOVE, {layer: layer});
	},

	_onTouchMove: function (e) {
		var touchEvent = e.originalEvent.changedTouches[0],
			layerPoint = this._map.mouseEventToLayerPoint(touchEvent),
			latlng = this._map.layerPointToLatLng(layerPoint);

        e.target._latlng = latlng;
        e.target.update();
	},

	_hasAvailableLayers: function () {
		return this._featureGroup.getLayers().length !== 0;
	}
});



/**
 * @class L.EditToolbar.Delete
 * @aka EditToolbar.Delete
 */
L.EditToolbar.Delete = L.Handler.extend({
	statics: {
		TYPE: 'remove' // not delete as delete is reserved in js
	},

	includes: L.Mixin.Events,

	// @method intialize(): void
	initialize: function (map, options) {
		L.Handler.prototype.initialize.call(this, map);

		L.Util.setOptions(this, options);

		// Store the selectable layer group for ease of access
		this._deletableLayers = this.options.featureGroup;

		if (!(this._deletableLayers instanceof L.FeatureGroup)) {
			throw new Error('options.featureGroup must be a L.FeatureGroup');
		}

		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.EditToolbar.Delete.TYPE;
	},

	// @method enable(): void
	// Enable the delete toolbar
	enable: function () {
		if (this._enabled || !this._hasAvailableLayers()) {
			return;
		}
		this.fire('enabled', { handler: this.type });

		this._map.fire(L.Draw.Event.DELETESTART, { handler: this.type });

		L.Handler.prototype.enable.call(this);

		this._deletableLayers
			.on('layeradd', this._enableLayerDelete, this)
			.on('layerremove', this._disableLayerDelete, this);
	},

	// @method disable(): void
	// Disable the delete toolbar
	disable: function () {
		if (!this._enabled) {
			return;
		}

		this._deletableLayers
			.off('layeradd', this._enableLayerDelete, this)
			.off('layerremove', this._disableLayerDelete, this);

		L.Handler.prototype.disable.call(this);

		this._map.fire(L.Draw.Event.DELETESTOP, { handler: this.type });
		this.fire('disabled', { handler: this.type });
	},

	// @method addHooks(): void
	// Add listener hooks to this handler
	addHooks: function () {
		var map = this._map;

		if (map) {
			map.getContainer().focus();

			this._deletableLayers.eachLayer(this._enableLayerDelete, this);
			this._deletedLayers = new L.LayerGroup();

			this._tooltip = new L.Draw.Tooltip(this._map);
			this._tooltip.updateContent({ text: L.drawLocal.edit.handlers.remove.tooltip.text });

			this._map.on('mousemove', this._onMouseMove, this);
            L.DomEvent.on(this._map._container, 'keyup', this.keyCancel, this);
		}
	},

    keyCancel: function (e) {
		if (e.keyCode === 27) {
			this.disable();
		}
	},

	// @method removeHooks(): void
	// Remove listener hooks from this handler
	removeHooks: function () {
		if (this._map) {
			this._deletableLayers.eachLayer(this._disableLayerDelete, this);
			this._deletedLayers = null;

			this._tooltip.dispose();
			this._tooltip = null;

			this._map.off('mousemove', this._onMouseMove, this);
            L.DomEvent.off(this._map._container, 'keyup', this.keyCancel, this);
		}
	},

	// @method revertLayers(): void
	// Revert the deleted layers back to their prior state.
	revertLayers: function () {
		// Iterate of the deleted layers and add them back into the featureGroup
		this._deletedLayers.eachLayer(function (layer) {
			this._deletableLayers.addLayer(layer);
			layer.fire('revert-deleted', { layer: layer });
		}, this);
	},

	// @method save(): void
	// Save deleted layers
	save: function () {
		this._map.fire(L.Draw.Event.DELETED, { layers: this._deletedLayers });
	},

	// @method removeAllLayers(): void
	// Remove all delateable layers
	removeAllLayers: function(){
		// Iterate of the delateable layers and add remove them
		this._deletableLayers.eachLayer(function (layer) {
			this._removeLayer({layer:layer});
		}, this);
		this.save();
	},

    // @method removeAllLayers(): void
    // Remove all delateable layers
    removeAllLayers: function(){
        // Iterate of the delateable layers and add remove them
        this._deletableLayers.eachLayer(function (layer) {
            this._removeLayer({ layer:layer });
        }, this);
        this.save();
    },

	_enableLayerDelete: function (e) {
		var layer = e.layer || e.target || e;

		layer.on('click', this._removeLayer, this);
	},

	_disableLayerDelete: function (e) {
		var layer = e.layer || e.target || e;

		layer.off('click', this._removeLayer, this);

		// Remove from the deleted layers so we can't accidentally revert if the user presses cancel
		this._deletedLayers.removeLayer(layer);
	},

	_removeLayer: function (e) {
        var layer;
        if (e.target instanceof L.FeatureGroup) {
            layer = e.target;
        }
        else {
            layer = e.layer || e.target || e;
        }

		this._deletableLayers.removeLayer(layer);

		this._deletedLayers.addLayer(layer);
		this._map.fire(L.Draw.Event.DELETEDLAYER, { layer: layer, drawHandler: this });

		layer.fire('deleted');
	},

	_onMouseMove: function (e) {
		this._tooltip.updatePosition(e.latlng);
	},

	_hasAvailableLayers: function () {
		return this._deletableLayers.getLayers().length !== 0;
	}
});



L.Draw.UndoManager =  L.Class.extend({
    options: {
		maxStackSize: 20, // set to -1 for infinite
		undoKey: 'ctrl+z',
		redoKey: 'ctrl+y'
    },
    
    initialize: function (map, drawnItems, options) {
        L.setOptions(this, options);
        
        this._map = map;
        this._drawnItems = drawnItems;
        this._guideLayers = null;
        
        // mode is either 'main', as the default, or 'nested', to refer to
        // vertex-drawing mode, deleting mode, or editing mode. actions during
        // nested mode are tracked seperately while the nested mode is active, 
        // but then "squashed" when mode returns to main
        this.mode = 'main';
        
        // if we're in a nested mode, we essentially keep a separate
        // stack just for that mode. thus, if we trigger an undo
        // when our nested stack is empty, we just put it back
        this.nestedUndoCount = 0;
        
        // we need to keep track of the vertices of the currently drawn
        // polygon in order to figure out what the new one is
        this.currentVertexCount = 0;
        this.currentVertexInfo = {};
        
        // the events triggered for move and resize edits are essentially
        // fired continuously while a marker is moved, so we keep track of
        // whatever the first and most-recent one so that when the editdone
        // event is triggered, we have starting and end points
        this.originalEditInfo = null;
        this.currentEditInfo = null;
        this.currentEditType = null;
        
        // we continuously sample the currently initialized edit handler
        // from each fired event and track of them here, by leaflet_id;
        // accessing them directly from .editing or .snapediting leads to
        // very strange bugs where sometimes the data in the handler appears
        // out of date. trust me here!
        this.editHandlerIndex = {};
        
        // if the undo/redo action does not match anything, it will try an action from this list
        this.extensions = [];
        
        // for some actions, the handler method needed to carry out the action and inverse action is the same method that fired the event
        // so, we simply block the next fired event whenever we call those
        // methods
        this.eventBlock = 0;
        
        // some event actions need to call callbacks and then have other code run, so we use this flag to deal with it.
        this.incompleteAdd = false;
        this.incompleteRemove = false;
        
        var manager = this;

        var undoAction = function (e, x) {
            var v = ((typeof(x) == 'undefined') || (x === null)) ? e : x;
            
            if (v.moduleId != L.Draw.Event.ID) {
                return;
            }
            
            var actionOccurred;
            if (manager.mode == 'nested') {
                if (manager.nestedUndoCount === 0) {
                
                    // allow back-to-back edit sessions to "merge" into each other
                    if (v.actionType.indexOf('edit') > -1) {
                        manager.undoNested(v.actionType, v.params);
                    }
                    else {
                        manager.stateHandler.putbackLastUndo();
                        return;
                    }
                }
                else {
                    manager.nestedUndoCount --;
                    actionOccurred = manager.undoNested(v.actionType, v.params);
                    if (actionOccurred) {
                        this._map.fire(L.Draw.Event.UNDONESTED, v);
                    }
                }
            }
            else {
                actionOccurred = manager.undoMain(v.actionType, v.params);
                if (actionOccurred) {
                    this._map.fire(L.Draw.Event.UNDOMAIN, v);
                }
            }
        };
        
        var redoAction = function (e, x) {
            var v = ((typeof(x) == 'undefined') || (x === null)) ? e : x;
            
            if (v.moduleId != L.Draw.Event.ID) {
                return;
            }
            
            var actionOccurred;
            if (manager.mode == 'nested') {
                manager.nestedUndoCount ++;
                actionOccurred = manager.redoNested(v.actionType, v.params);
                if (actionOccurred) {
                    this._map.fire(L.Draw.Event.REDONESTED, v);
                }
            }
            else {
                actionOccurred = manager.redoMain(v.actionType, v.params);
                if (actionOccurred) {
                    this._map.fire(L.Draw.Event.REDOMAIN, v);
                }
            }
        };
        
        this.stateHandler = new L.Draw.StateHandler(this._map, undoAction, redoAction, this.options);

        this._enabled = false;
        this.enable();
    },
    
    enabled: function () {
        return this._enabled;
    },
    
    enable: function () {
        if (this._enabled) {
            return;
        }
        
        this.stateHandler.enable();
        this._map.on(L.Draw.Event.DRAWSTART, this.drawstart, this);
        this._map.on(L.Draw.Event.DRAWSTOP, this.drawstop, this);
        this._map.on(L.Draw.Event.CANCELED, this.canceled, this);
        this._map.on(L.Draw.Event.CREATED, this.created, this);
        this._map.on(L.Draw.Event.DRAWVERTEX, this.drawvertex, this);
        this._map.on(L.Draw.Event.DELETESTART, this.deletestart, this);
        this._map.on(L.Draw.Event.DELETESTOP, this.deletestop, this);
        this._map.on(L.Draw.Event.DELETED, this.deleted, this);
        this._map.on(L.Draw.Event.DELETEDLAYER, this.deletedlayer, this);
        this._map.on(L.Draw.Event.EDITSTART, this.editstart, this);
        this._map.on(L.Draw.Event.EDITHOOK, this.edithook, this);
        this._map.on(L.Draw.Event.EDITSTOP, this.editstop, this);
        this._map.on(L.Draw.Event.EDITDONE, this.editdone, this);
        this._map.on(L.Draw.Event.EDITVERTEX, this.editvertex, this);
        this._map.on(L.Draw.Event.EDITMOVE, this.editmove, this);
        this._map.on(L.Draw.Event.EDITRESIZE, this.editresize, this);
        this._map.on(L.Draw.Event.EDITREVERT, this.editrevert, this);
        
        for (var i=0; i<this.extensions.length; i++) {
            var ex = this.extensions[i];
            if (ex.hasOwnProperty('enable')) {
                ex.enable(this);
            }
        }
        
        this._enabled = true;
    },
    
    disable: function () {
        if (! this._enabled) {
            return;
        }
    
        this._map.off(L.Draw.Event.DRAWSTART, this.drawstart, this);
        this._map.off(L.Draw.Event.DRAWSTOP, this.drawstop, this);
        this._map.off(L.Draw.Event.CANCELED, this.canceled, this);
        this._map.off(L.Draw.Event.CREATED, this.created, this);
        this._map.off(L.Draw.Event.DRAWVERTEX, this.drawvertex, this);
        this._map.off(L.Draw.Event.DELETESTART, this.deletestart, this);
        this._map.off(L.Draw.Event.DELETESTOP, this.deletestop, this);
        this._map.off(L.Draw.Event.DELETED, this.deleted, this);
        this._map.off(L.Draw.Event.DELETEDLAYER, this.deletedlayer, this);
        this._map.off(L.Draw.Event.EDITSTART, this.editstart, this);
        this._map.off(L.Draw.Event.EDITHOOK, this.edithook, this);
        this._map.off(L.Draw.Event.EDITSTOP, this.editstop, this);
        this._map.off(L.Draw.Event.EDITDONE, this.editdone, this);
        this._map.off(L.Draw.Event.EDITVERTEX, this.editvertex, this);
        this._map.off(L.Draw.Event.EDITMOVE, this.editmove, this);
        this._map.off(L.Draw.Event.EDITRESIZE, this.editresize, this);
        this._map.off(L.Draw.Event.EDITREVERT, this.editrevert, this);
        
        for (var i=0; i<this.extensions.length; i++) {
            var ex = this.extensions[i];
            if (ex.hasOwnProperty('disable')) {
                ex.disable(this);
            }
        }
        
        this.stateHandler.disable();
        this._enabled = false;
    },
    
    reset: function () {
        this._startMainMode(false);
        this.stateHandler.clear();
    },
    
    // allows hooking into the undo manager from an outside module
    // an example, that allows undoing of some event that's signaled by map.fire('example:dothing', { ... })
    /*
        Example = {};
        Example.ID = 'Example';
        Example.EventName = 'example:dothing';
        Example.undoExtension = {
            'enable': function (undoManager) {
                undoManager._map.on(Example.EventName, Example.undoExtension.processEvent, undoManager);
            },
            
            'disable': function (undoManager) {
                undoManager._map.off(Example.EventName, Example.undoExtension.processEvent, undoManager);
            },
            
            // this = undoManager
            'processEvent': function (e) {
                this.stateHandler.pushUndo(Example.ID, Example.EventName, e);
            },

            'undoMain': function (undoManager, type, params) {
                if (type == Example.EventName) {
                    console.log('undoing', Example.EventName);
                    return true;
                }
                return false;
            }
            
            'redoMain': function (undoManager, type, params) {
                if (type == Example.EventName) {
                    console.log('redoing', Example.EventName);
                    return true;
                }
                return false;
            }
        };

        L.Control.Draw.addInitHook(function () {
            if (this.hasOwnProperty('undoManager')) {
                this.undoManager.addExtension(TCR.Style.RuleController.undoExtension);
            }
        });

    */
    addExtension: function (extension) {
        this.extensions.push(extension);
        
        if (this._enabled && extension.hasOwnProperty('enable')) {
            extension.enable(this);
        }
    },
    
    // allows hooking into the undo manager from an outside module
    callExtension: function (mode, type, params) {
        var actionOccurred = false;
        for (var i=0; i<this.extensions.length; i++) {
            var ex = this.extensions[i];
            if (ex.hasOwnProperty(mode)) {
                if (ex[mode](this, type, params)) {
                    actionOccurred = true;
                }
            }
        }
        
        return actionOccurred;
    },
    
    setGuideLayers: function (guideLayers) {
        this._guideLayers = guideLayers;
    },
    
    _startNestedMode: function () {
        this.mode = 'nested';
        this.nestedUndoCount = 0;
    },
    
    _startMainMode: function (clearNested) {
        if (clearNested) {
            this.stateHandler.clearNested(this.nestedUndoCount);
        }
        
        this.mode = 'main';
        this.eventBlock = 0;
        this.nestedUndoCount = 0;
        this.currentVertexCount = 0;
        this.currentVertexInfo = {};
        this.originalEditInfo = null;
        this.currentEditInfo = null;
        this.currentEditType = null;
        this.incompleteAdd = false;
        this.incompleteRemove = false;
    },
    
    pushUndo: function (actionType, info) {
        this.stateHandler.pushUndo(L.Draw.Event.ID, actionType, info, '');
    },
    
    _setEditHandler: function (obj, editHandler, isVertex) {
        var key = obj._leaflet_id;
        // poly vertex handlers are tracked separately from the main poly
        // editHandler, but still keyed by the poly's _leaflet_id
        if (isVertex) {
            key = 'v' + key;
        }
        this.editHandlerIndex[key] = editHandler;
    },
    
    _getEditHandler: function (obj, isVertex) {
        var key = obj._leaflet_id;
        // poly vertex handlers are tracked separately from the main poly
        // editHandler, but still keyed by the poly's _leaflet_id
        if (isVertex) {
            key = 'v' + key;
        }
        
        return this.editHandlerIndex[key];
    },
    
    // Compatibility method to normalize Poly* objects
	// between 0.7.x and 1.0+
    // pulled from code from L.Edit.Poly in Leaflet.Draw
	_defaultShape: function (latlngs) {
		if (!L.Polyline._flat) { return latlngs; }
		return L.Polyline._flat(latlngs) ? latlngs : latlngs[0];
	},
    
    _pIntersects: function (poly) {
        if (poly.options.poly && (!poly.options.poly.allowIntersection && poly.intersects())) {
            return true;
        }
        return false;
    },
    
    /*
     *************************************
     */
    
    canceled: function (e) {
        this._startMainMode(true);
    },
    
    drawstart: function (e) {
        this._startNestedMode();
    },
    
    drawstop: function (e) {
        this._startMainMode();
    },
    
    created: function (e) {
        this._startMainMode(true);
        this.pushUndo('created', e);
    },
    
    deletestart: function (e) {
        this._startNestedMode();
    },
    
    deletestop: function (e) {
        this._startMainMode(true);
    },
    
    deleted: function (e) {
        this._startMainMode(true);
        this.pushUndo('deleted', e);
    },
    
    deletedlayer: function (e) {
        this.pushUndo('deletedlayer', e);
        this.nestedUndoCount ++;
    },
    
    drawvertex: function (e) {
        // why this is here: the methods used by Leaflet.Draw to add or delete a vertex from
        // a polygon are the same methods that fire an event. thus, the very act of undoing/redoing
        // a vertex will add false actions to the undo stack! thus, we use a state variable to prevent that from happening. 
        if (this.eventBlock > 0) {
            this.eventBlock --;
            return;
        }
            
        // if our current count is smaller, we added a vertex
        var leafletId;
        if (this.currentVertexCount < e.drawHandler._markers.length) {
            this.currentVertexCount ++;
            this.nestedUndoCount ++;
            
            // figure out what the new vertex is
            var addedPoint;
            for (leafletId in e.layers._layers) {
                if (e.layers._layers.hasOwnProperty(leafletId)) {
                    if (! this.currentVertexInfo.hasOwnProperty(leafletId)) {
                        this.currentVertexInfo[leafletId] = e.layers._layers[leafletId].getLatLng().clone();
                        addedPoint = this.currentVertexInfo[leafletId];
                    }
                }
            }
            
            this.pushUndo('drawvertex/Add', {
                'drawHandler' : e.drawHandler,
                'point' : addedPoint,
            });
        }
        
        // otherwise, the user clicked on "delete last point"
        else if (this.currentVertexCount > e.drawHandler._markers.length) {
            this.currentVertexCount --;
            this.nestedUndoCount ++;
            
            var removedPoint;
            // figure out which the missing vertex was
            for (leafletId in e.layers._layers) {
                if (e.layers._layers.hasOwnProperty(leafletId)) {
                    if (! this.currentVertexInfo.hasOwnProperty(leafletId)) {
                        removedPoint = this.currentVertexInfo[leafletId];
                        delete this.currentVertexInfo[leafletId];
                    }
                }
            }
            
            this.pushUndo('drawvertex/Remove', {
                'drawHandler' : e.drawHandler,
                'point' : removedPoint
            });
        }
    },
    
    editstart: function (e) {
        this._startNestedMode();
    },
    
    editstop: function (e) {
        this._startMainMode(false);
    },
    
    edithook: function (e) {
        if (e.hasOwnProperty('vertex')) {
            this._setEditHandler(e.layer, e.editHandler, true);
        }
        else {
            this._setEditHandler(e.layer, e.editHandler);
        }
    },
    
    editrevert: function (e) {
        this.stateHandler.discardLastPush();
        this.nestedUndoCount = Math.max(0, this.nestedUndoCount - 1);
    },
    
    editvertex: function (e) {
        var editHandler;
      
        // re-adding a marker is a two step process, begun by undoNested, and then finished here when
        // the event triggered by the manual .click() call there has fired
        if (this.incompleteAdd) {
            this.incompleteAdd = false;
            editHandler = this._getEditHandler(this.currentEditInfo.poly, true);
        
            editHandler._originalLatLng = this.currentEditInfo.originalLatLng;
            this.currentEditInfo.marker.setLatLng(this.currentEditInfo.originalLatLng.clone());
            editHandler._onMarkerDrag({'target' : this.currentEditInfo.marker});
            editHandler.updateMarkers();
            editHandler._poly.fire('edit');
            
            this.currentEditInfo = null;
            
            return;
        }
        
        else if (this.incompleteRemove) {
            this.incompleteRemove = false;
            editHandler = this._getEditHandler(this.currentEditInfo.poly, true);
        
            editHandler.updateMarkers();
            
            this.currentEditInfo.poly.fire('edit');
            this.currentEditInfo = null;
            return;
        }
        
        if (this.eventBlock > 0) {
            this.eventBlock --;
            return;
        }
        
        this.nestedUndoCount ++;
        this._setEditHandler(e.poly, e.editHandler, true);
        
        if (e.editType == 'editvertex/Move') {
            this.pushUndo(e.editType, {
                'layer': e.poly,
                'poly' : e.poly,
                'marker' : e.marker,
                'index': e.editInfo.index,
                'originalLatLng' : e.editInfo.originalLatLng.clone(),
                'newLatLng' : e.editInfo.newLatLng.clone(),
            });
        }
        else {
            this.pushUndo(e.editType, {
                'layer': e.poly,
                'poly' : e.poly,
                'marker' : e.marker,
                'originalIndex' : e.editInfo.index,
                'originalLatLng' : e.editInfo.originalLatLng.clone(),
                'prevIndex' : e.editInfo.prevIndex,
                'nextIndex' : e.editInfo.nextIndex,
            });
        }
    },
    
    editdone: function (e) {
        if (this.currentEditType !== null) {
            this.currentEditInfo.original = this.originalEditInfo;
            this.pushUndo(this.currentEditType, this.currentEditInfo);
            this.nestedUndoCount ++;
            this.originalEditInfo = null;
            this.currentEditInfo = null;
            this.currentEditType = null;
        }
    },
    
    editmove: function (e) {
        this._setEditHandler(e.layer, e.editHandler);
        
        if (! e.hasOwnProperty('editType')) {
            return;
        }
        
        if (this.eventBlock > 0) {
            this.eventBlock --;
            return;
        }
        
        if (this.originalEditInfo === null) {
            this.originalEditInfo = e;
        }
        
        // a marker move is different from the shapes/poly/vertices; the move event only fires at dragend,
        // not continuously during the move like for the others
        if (e.editType == 'editmarker/Move') {
            this.pushUndo(e.editType, e);
            this.nestedUndoCount ++;
            this.originalEditInfo = null;
            this.currentEditInfo = null;
            this.currentEditType = null;
        }
        else {
            this.currentEditInfo = e;
            this.currentEditType = e.editType;
        }
    },
    
    editresize: function (e) {
        if (! e.hasOwnProperty('editType')) {
            return;
        }
        
        if (this.eventBlock > 0) {
            this.eventBlock --;
            return;
        }
        
        if (this.originalEditInfo === null) {
            this.originalEditInfo = e;
        }
        
        this._setEditHandler(e.layer, e.editHandler);
        this.currentEditInfo = e;
        this.currentEditType = e.editType;
    },
    
    /*
     *************************************
     */
    
    // we have to do the edits differently in main mode than nested mode, because, for
    // example, shapes are drawn with dotted lines and have ghost markers in edit mode
    // but are solid with no markers in main mode. luckily, main mode is simpler than
    // nested mode.
    undoMain: function (type, params) {
        var latlngs;
        var actionOccurred = false;
        
        if (type == 'created') {
            this._drawnItems.removeLayer(params.layer);
            
            if (this._guideLayers !== null) {
                for (var i=0; i<this._guideLayers.length; i++) {
                    if (L.Util.stamp(this._guideLayers[i]) == L.Util.stamp(params.layer)) {
                        this._guideLayers.splice(i, 1);
                        break;
                    }
                }
            }
            
            actionOccurred = true;
        }
        
        else if (type == 'deleted') {
            for (var id in params.layers._layers) {
                if (params.layers._layers.hasOwnProperty(id)) {
                    this._drawnItems.addLayer(params.layers._layers[id]);
                    if (this._guideLayers !== null) {
                        this._guideLayers.push(params.layers._layers[id]);
                    }
                }
            }
            
            actionOccurred = true;
        }
        
        else if (type == 'editvertex/Move') {
            latlngs = this._defaultShape(params.poly.getLatLngs());
            latlngs[params.index] = params.originalLatLng;
            params.poly._convertLatLngs(latlngs, true);
            params.poly.redraw();
            params.poly.fire('edit');
            
            actionOccurred = true;
        }
        
        else if (type == 'editvertex/Add') {
            latlngs = this._defaultShape(params.poly.getLatLngs());
            latlngs.splice(params.originalIndex, 1);
            params.poly._convertLatLngs(latlngs, true);
            params.poly.fire('edit');
            
            actionOccurred = true;
        }
        
        else if (type == 'editvertex/Remove') {
            latlngs = this._defaultShape(params.poly.getLatLngs());
            latlngs.splice(params.originalIndex, 0, params.originalLatLng);
            params.poly._convertLatLngs(latlngs, true);
            params.poly.redraw();
            params.poly.fire('edit');
            
            actionOccurred = true;
        }
        
        else if (type == 'editmarker/Move') {
            params.layer.setLatLng(params.originalLatLng);
            params.layer.fire('move', {'latlng': params.originalLatLng});
            actionOccurred = true;
        }
        
        else if (type == 'editrect/Move') {
            params.layer.setLatLngs(params.original.originalLatLngs);
            params.layer.fire('move', {'latlng': params.original.originalCenter});
            actionOccurred = true;
        }
        
        else if (type == 'editcircle/Move') {
            params.layer.setLatLng(params.original.originalCenter);
            params.layer.fire('move', {'latlng': params.original.originalCenter});
            actionOccurred = true;
        }
        
        else if (type == 'editrect/Resize') {
            params.layer.setBounds(params.original.originalBounds);
            params.layer.fire('resize');
            actionOccurred = true;
        }
        
        else if (type == 'editcircle/Resize') {
            params.layer.setRadius(params.original.originalRadius);
            params.layer.fire('resize');
            actionOccurred = true;
        }
        
        else if (type == 'editpoly/Move') {
            this._mainPolyMove(-1, params, params.original.originalLatLng);
        }
        
        var extensionActionOccurred = this.callExtension('undoMain', type, params);
        return actionOccurred || extensionActionOccurred;
    },
    
    redoMain: function (type, params) {
        var latlngs;
        var actionOccurred = false;
        
        if (type == 'created') {
            this._drawnItems.addLayer(params.layer);
            if (this._guideLayers !== null) {
                this._guideLayers.push(params.layer);
            }
            
            actionOccurred = true;
        }
        
        else if (type == 'deleted') {
            for (var id in params.layers._layers) {
                if (params.layers._layers.hasOwnProperty(id)) {
                    this._drawnItems.removeLayer(params.layers._layers[id]);
                
                    if (this._guideLayers !== null) {
                        for (var i=0; i<this._guideLayers.length; i++) {
                            if (L.Util.stamp(this._guideLayers[i]) === id) {
                                this._guideLayers.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
            }
            
            actionOccurred = true;
        }
        
        else if (type == 'editvertex/Move') {
            latlngs = this._defaultShape(params.poly.getLatLngs());
            latlngs[params.index] = params.newLatLng;
            params.poly._convertLatLngs(latlngs, true);
            params.poly.redraw();
            params.poly.fire('edit');
            
            actionOccurred = true;
        }
        
        else if (type == 'editvertex/Add') {
            latlngs = this._defaultShape(params.poly.getLatLngs());
            latlngs.splice(params.originalIndex, 0, params.originalLatLng);
            params.poly._convertLatLngs(latlngs, true);
            params.poly.redraw();
            params.poly.fire('edit');
            
            actionOccurred = true;
        }
        
        else if (type == 'editvertex/Remove') {
            latlngs = this._defaultShape(params.poly.getLatLngs());
            latlngs.splice(params.originalIndex, 1);
            params.poly._convertLatLngs(latlngs, true);
            params.poly.fire('edit');
            
            actionOccurred = true;
        }
        
        else if (type == 'editmarker/Move') {
            params.layer.setLatLng(params.newLatLng);
            params.layer.fire('move', {'latlng': params.newLatLng});
            actionOccurred = true;
        }
        
        else if (type == 'editrect/Move') {
            params.layer.setLatLngs(params.newLatLngs);
            params.layer.fire('move', {'latlng': params.newCenter});
            actionOccurred = true;
        }
        
        else if (type == 'editcircle/Move') {
            params.layer.setLatLng(params.newCenter);
            params.layer.fire('move', {'latlng': params.newCenter});
            actionOccurred = true;
        }
        
        else if (type == 'editrect/Resize') {
            params.layer.setBounds(params.newBounds);
            params.layer.fire('resize');
            actionOccurred = true;
        }
        
        else if (type == 'editcircle/Resize') {
            params.layer.setRadius(params.newRadius);
            params.layer.fire('resize');
            actionOccurred = true;
        }
        
        else if (type == 'editpoly/Move') {
            this._mainPolyMove(1, params, params.newLatLng);
            actionOccurred = true;
        }
        
        var extensionActionOccurred = this.callExtension('redoMain', type, params);
        return actionOccurred || extensionActionOccurred;
    },
    
    _mainPolyMove : function (u, params, c) {
        var latDiff = u*Math.abs(params.original.originalLatLng.lat - params.newLatLng.lat);
        var lngDiff = u*Math.abs(params.original.originalLatLng.lng - params.newLatLng.lng);
    
        var latlngs = this._defaultShape(params.layer.getLatLngs());
        for (var i = 0; i < latlngs.length; ++i) {
            latlngs[i].lat -= latDiff;
            latlngs[i].lng -= lngDiff;
        }
        params.layer.redraw();
        params.layer.fire('move', {'latlng': c});
    },
    
    undoNested: function (type, params) {
        var editHandler;
        var actionOccurred = false;
        
        if (type == 'deletedlayer') {
            params.drawHandler._deletedLayers.removeLayer(params.layer);
            params.drawHandler._deletableLayers.addLayer(params.layer);
            actionOccurred = true;
        }
        
        else if (type == 'drawvertex/Add') {
            this.eventBlock ++;
            params.drawHandler.deleteLastVertex();
            actionOccurred = true;
        }
        
        else if (type == 'drawvertex/Remove') {
            this.eventBlock ++;
            params.drawHandler._mouseDownOrigin = null;
            params.drawHandler.addVertex(params.point);
            actionOccurred = true;
        }
        
        else if (type == 'editvertex/Move') {
            editHandler = this._getEditHandler(params.poly, true);
            var marker = editHandler._markers[params.index];
            
            marker.setLatLng(params.originalLatLng);
            editHandler._onMarkerDrag({'target' : marker});
            
            params.poly.redraw();
            params.poly.fire('edit');
            
            actionOccurred = true;
        }
        
        else if (type == 'editvertex/Remove') {
            this._addVertex(params);
            actionOccurred = true;
        }
        
        else if (type == 'editvertex/Add') {
            this._removeVertex(params);
            actionOccurred = true;
        }
        
        else if (type == 'editmarker/Move') {
            params.layer.setLatLng(params.originalLatLng);
            params.layer.fire('move');
            actionOccurred = true;
        }
        
        else if (type == 'editpoly/Move') {
            this.eventBlock ++;
            editHandler = this._getEditHandler(params.layer);
            editHandler._move(params.original.originalLatLng);
            actionOccurred = true;
        }
        
        else if (type == 'editrect/Move') {
            this.eventBlock ++;
            editHandler = this._getEditHandler(params.layer);
            editHandler._move(params.original.originalCenter);
            actionOccurred = true;
        }
        
        else if (type == 'editcircle/Move') {
            this.eventBlock ++;
            editHandler = this._getEditHandler(params.layer);
            editHandler._move(params.original.originalCenter); 
            actionOccurred = true;
        }
        
        else if (type == 'editrect/Resize') {
            this._resizeEditRect(params.layer, params.original.originalBounds);
            actionOccurred = true;
        }
        
        else if (type == 'editcircle/Resize') {
            this._resizeEditCircle(params.layer, params.original.originalRadius);
            actionOccurred = true;
        }
        
        var extensionActionOccurred = this.callExtension('undoNested', type, params);
        return actionOccurred || extensionActionOccurred;
    },
    
    redoNested: function(type, params) {
        var editHandler;
        var actionOccurred = false;
        
        if (type == 'deletedlayer') {
            params.drawHandler._removeLayer({'target': params.layer});
            actionOccurred = true;
        }
        
        else if (type == 'drawvertex/Add') {
            this.eventBlock ++;
            params.drawHandler._mouseDownOrigin = null;
            params.drawHandler.addVertex(params.point);
            actionOccurred = true;
        }
        
        else if (type == 'drawvertex/Remove') {
            this.eventBlock ++;
            params.drawHandler.deleteLastVertex();
            actionOccurred = true;
        }
        
        else if (type == 'editvertex/Move') {
            editHandler = this._getEditHandler(params.poly, true);
            var marker = editHandler._markers[params.index];
            
            marker.setLatLng(params.newLatLng);
            editHandler._onMarkerDrag({'target' : marker});
            
            actionOccurred = true;
        }
        
        else if (type == 'editvertex/Remove') {
            this._removeVertex(params);
            actionOccurred = true;
        }
        
        else if (type == 'editvertex/Add') {
            this._addVertex(params);
            actionOccurred = true;
        }
        
        else if (type == 'editpoly/Move') {
            this.eventBlock ++;
            editHandler = this._getEditHandler(params.layer);
            editHandler._move(params.newLatLng);
            actionOccurred = true;
        }
        
        else if (type == 'editmarker/Move') {
            params.layer.setLatLng(params.newLatLng);
            params.layer.fire('move');
            actionOccurred = true;
        }
        
        else if (type == 'editrect/Move') {
            this.eventBlock ++;
            editHandler = this._getEditHandler(params.layer);
            editHandler._move(params.newCenter);
            
            actionOccurred = true;
        }
        
        else if (type == 'editcircle/Move') {
            this.eventBlock ++;
            editHandler = this._getEditHandler(params.layer);
            editHandler._move(params.newCenter);
            
            actionOccurred = true;
        }
        
        else if (type == 'editrect/Resize') {
            this._resizeEditRect(params.layer, params.newBounds);
            actionOccurred = true;
        }
        
        else if (type == 'editcircle/Resize') {
            this._resizeEditCircle(params.layer, params.newRadius);
            actionOccurred = true;
        }
        
        var extensionActionOccurred = this.callExtension('redoNested', type, params);
        return actionOccurred || extensionActionOccurred;
    },
    
    /*
     *************************************
     */
     
     _getIndexedMarker: function (index, editHandler) {
        var keyedIndex = index;
        if (index == editHandler._markers.length) {
            keyedIndex = 0;
        }
        return editHandler._markers[keyedIndex];
     },
    
    _removeVertex: function (params) {
        this.incompleteRemove = true;
        var editHandler = this._getEditHandler(params.poly, true);
        var marker = this._getIndexedMarker(params.originalIndex, editHandler);
        
        this.currentEditInfo = params;
        marker.fire('click');
        params.poly.fire('edit');
    },
    
    _addVertex: function (params) {
        this.incompleteAdd = true;
        
        var editHandler = this._getEditHandler(params.poly, true);
        
        var prev = this._getIndexedMarker(params.prevIndex, editHandler);
        var next = this._getIndexedMarker(params.nextIndex, editHandler);
        
        if (prev._middleRight) {
            editHandler._markerGroup.removeLayer(prev._middleRight);
        }
        
        if (next._middleLeft) {
            editHandler._markerGroup.removeLayer(next._middleLeft);
        }
        
        params.marker = editHandler._createMiddleMarker(prev, next, params.originalLatLng.clone(), params.originalIndex);
        
        this.currentEditInfo = params;
        params.marker.fire('click');
        params.poly.fire('edit');
    },
    
    _resizeEditCircle: function (layer, radius) {
        var editHandler = this._getEditHandler(layer);
        layer.setRadius(radius);
        var resizeMarkerPoint = editHandler._getResizeMarkerPoint(layer.getLatLng());
        editHandler._resizeMarkers[0].setLatLng(resizeMarkerPoint);
        layer.fire('resize');
    },
    
    _resizeEditRect: function (layer, bounds) {
        var editHandler = this._getEditHandler(layer);
        layer.setBounds(bounds);
        editHandler._moveMarker.setLatLng(bounds.getCenter());
        editHandler._repositionCornerMarkers();
        layer.fire('resize');
    }
});


L.Draw.StateHandler =  L.Class.extend({
	options: {
		'maxStackSize': 20, // set to -1 for infinite
		'undoKey': 'ctrl+z',
		'redoKey': 'ctrl+y'
	},

    initialize: function (map, undoAction, redoAction, options) {
        L.setOptions(this, options);

        this._map = map;
        this.undoAction = undoAction || null;
        this.redoAction = redoAction || null;
        this._enabled = false;

        this.enable();
    },

    enabled: function () {
        return this._enabled;
    },

    enable: function () {
        if (this._enabled) {
            return;
        }

        this._idCounter = 0;

        this.stateLock = false;
        this.stateTodo = [];

        this.undoStack = [];
        this.redoStack = [];

        if (this.undoAction !== null) {
            this._map.on(L.Draw.Event.UNDOACTION, this.undoAction, this);
        }

        if (this.redoAction !== null) {
            this._map.on(L.Draw.Event.REDOACTION, this.redoAction, this);
        }

        this.keyChecker = {};
        if (this.options.undoKey !== null) {
            this.bindKey(this.options.undoKey, this.undo);
        }

        if (this.options.redoKey !== null) {
            this.bindKey(this.options.redoKey, this.redo);
        }

        this._enabled = true;
    },

    disable: function () {
        if (! this._enabled) {
            return;
        }

        if (this.undoAction !== null) {
            this.map.off(L.Draw.Event.UNDOACTION, this.undoAction, this);
        }

        if (this.redoAction !== null) {
            this.map.off(L.Draw.Event.REDOACTION, this.redoAction, this);
        }

        if (this.options.undoKey !== null) {
            this.unbindKey(this.options.undoKey, this.undo);
        }

        if (this.options.redoKey !== null) {
            this.unbindKey(this.options.redoKey, this.redo);
        }

        this._enabled = false;
    },

    bindKey: function (key, action) {
        var checkCtl = (key.indexOf('ctrl') > -1);
        var checkedKey = (checkCtl) ? key.substr(-1): key;
        checkedKey = checkedKey.toLowerCase();

        var that = this;
        this.keyChecker[key] = function (e) {
            if( ((e.key.toLowerCase() === checkedKey)
              || (e.code.substr(-1).toLowerCase() === checkedKey))
              && (e.ctrlKey || (!checkCtl))) {
                e.preventDefault();
                e.stopPropagation();
                action.call(that);
                return false;
            }
        };

        L.DomEvent.on(document, 'keyup', this.keyChecker[key], this);
    },

    unbindKey: function (key) {
        L.DomEvent.off(document, 'keyup', this.keyChecker[key], this);
        delete this.keyChecker[key];
    },

    clear: function () {
        this.undoStack = [];
        this.redoStack = [];
    },

    discardLastPush: function () {
        this.undoStack.pop();
    },

    clearNested: function (numTimes) {
        this.redoStack = [];
        for (var i=0; i<numTimes; i++) {
            this.undoStack.pop();
        }
    },

    pushUndo: function (moduleId, actionType, params, tag) {
        var stackItem = {
            'tag': tag || '',
            'actionType': actionType,
            'params': params,
            'undoId': this._idCounter,
            'moduleId': moduleId
        };

        this.undoStack.push(stackItem);
        this._map.fire(L.Draw.Event.PUSHUNDO, stackItem);
        this._idCounter ++;

        if ((this.undoStack.length > this.options.maxStackSize) && (this.options.maxStackSize != -1)) {
            this.undoStack.shift();
        }
    },
    undo: function () {
        this.stateTodo.push('undo');

        if (this.stateLock) {
            return;
        }

        this.stateLock = true;
        this.processState();
    },

    putbackLastUndo: function () {
        var lastAction = this.redoStack.pop();
        this.undoStack.push(lastAction);
    },

    redo: function () {
        this.stateTodo.push('redo');

        if (this.stateLock) {
            return;
        }

        this.stateLock = true;
        this.processState();
    },

    // in the original version of this class, it was possible to trigger some sort of deep recursion error if ctrlZ/ctrlY were smashed very quickly.
    // my best conclusion as to why this occured was that some browsers seem to detect keyboard events in a seperate thread, and thus a race condition
    // could potentially develop from fast key input. thus, instead of executing the undo/redo action directly from the request, we debounce it via
    // triggering the undo/redos in a priority queue in order to ensure we only ever process one at a time.
    processState: function () {
        if (this.stateTodo.length === 0) {
            // only set false at the base case, as setTimeout actually returns immediately
            this.stateLock = false;
            return;
        }

        var nextAction = this.stateTodo.shift();
        var lastAction;

        if (nextAction === 'redo') {
            if (this.redoStack.length > 0) {
                lastAction = this.redoStack.pop();
                this.undoStack.push(lastAction);
                this._map.fire(L.Draw.Event.REDOACTION, lastAction);
            }
        }
        else {
            if (this.undoStack.length > 0) {
                lastAction = this.undoStack.pop();
                this.redoStack.push(lastAction);
                this._map.fire(L.Draw.Event.UNDOACTION, lastAction);
            }
        }

        // add a small amount of waiting time, 100ms should be fine - the error I saw when smashing ctrlZ/ctrlY very
        // quickly might actually be related to the display lagging behind the processing... it's hard to determine.
        // note that L.Draw uses setTimeout internally to handle error processing.
        // anyways, the user shouldn't notice 100ms of delay, so why not be safe than sorry?
        var that = this;
        setTimeout(function () { that.processState(); }, 100);
    },
});


}(window, document));
//# sourceMappingURL=leaflet.draw-src.map