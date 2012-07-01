(function () {

L.Handler.Draw = L.Handler.extend({
	includes: L.Mixin.Events,

	initialize: function (map, shapeOptions) {
		this._map = map;
		this._container = map._container;
		this._pane = map._panes.overlayPane;

		// Extend the shape options to include any customer parameters
		this.options.shapeOptions = L.Util.extend({}, this.options.shapeOptions, shapeOptions);
	},

	enable: function () {
		this.fire('activated');
		L.Handler.prototype.enable.call(this);
	},
	
	addHooks: function () {
		if (this._map) {
			L.DomUtil.disableTextSelection();

			this._label = L.DomUtil.create('div', 'leaflet-draw-label', this._pane);
			this._singleLineLabel = false;

			L.DomEvent.addListener(window, 'keyup', this._cancelDrawing, this);
		}
	},

	removeHooks: function () {
		if (this._map) {
			L.DomUtil.enableTextSelection();

			this._pane.removeChild(this._label);
			delete this._label;

			L.DomEvent.removeListener(window, 'keyup', this._cancelDrawing);
		}
	},

	_updateLabelText: function (labelText) {
		labelText.subtext = labelText.subtext || '';

		// update the vertical position (only if changed)
		if (labelText.subtext.length === 0 && !this._singleLineLabel) {
			L.DomUtil.addClass(this._label, 'leaflet-draw-label-single');
			this._singleLineLabel = true;
		}
		else if (labelText.subtext.length > 0 && this._singleLineLabel) {
			L.DomUtil.removeClass(this._label, 'leaflet-draw-label-single');
			this._singleLineLabel = false;
		}

		this._label.innerHTML =
			(labelText.subtext.length > 0 ? '<span class="leaflet-draw-label-subtext">' + labelText.subtext + '</span>' + '<br />' : '') +
			'<span>' + labelText.text + '</span>';
	},

	_updateLabelPosition: function (pos) {
		L.DomUtil.setPosition(this._label, pos);
	},

	// Cancel drawing when the escape key is pressed
	_cancelDrawing: function (e) {
		if (e.keyCode === 27) {
			this.disable();
		}
	}
});

L.Polyline.Draw = L.Handler.Draw.extend({
	Poly: L.Polyline,

	options: {
		icon: new L.DivIcon({
			iconSize: new L.Point(20, 20),
			className: 'leaflet-div-icon leaflet-editing-icon'
		}),
		guidelineDistance: 20,
		shapeOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: false,
			clickable: true
		}
	},
	
	addHooks: function () {
		L.Handler.Draw.prototype.addHooks.call(this);
		if (this._map) {
			this._markers = [];

			this._markerGroup = new L.LayerGroup();
			this._map.addLayer(this._markerGroup);

			this._poly = new L.Polyline([], this.options.shapeOptions);

			//TODO refactor: move cursor to styles
			this._container.style.cursor = 'crosshair';

			this._updateLabelText(this._getLabelText());

			L.DomEvent
				.addListener(this._container, 'mousemove', this._onMouseMove, this)
				.addListener(this._container, 'touchmove', this._onMouseMove, this)
				.addListener(this._container, 'click', this._onClick, this)
				.addListener(this._container, 'touchend', this._onClick, this);
		}
	},

	removeHooks: function () {
		L.Handler.Draw.prototype.removeHooks.call(this);

		this._cleanUpShape();
		
		// remove markers from map
		this._map.removeLayer(this._markerGroup);
		delete this._markerGroup;
		delete this._markers;

		this._map.removeLayer(this._poly);
		delete this._poly;

		// clean up DOM
		this._clearGuides();
		this._container.style.cursor = '';

		L.DomEvent
			.removeListener(this._container, 'mousemove', this._onMouseMove)
			.removeListener(this._container, 'touchmove', this._onMouseMove)
			.removeListener(this._container, 'click', this._onClick)
			.removeListener(this._container, 'touchend', this._onClick);
	},

	_finishShape: function () {
		this._map.fire(
			'draw:poly-created',
			{ poly: new this.Poly(this._poly.getLatLngs(), this.options.shapeOptions) }
		);
		this.disable();
	},

	_onMouseMove: function (e) {
		var newPos = this._map.mouseEventToLayerPoint(e),
			latlng = this._map.mouseEventToLatLng(e),
			markerCount = this._markers.length;

		// update the label
		this._updateLabelPosition(newPos);

		if (markerCount > 0) {
			this._updateLabelText(this._getLabelText(latlng));
			// draw the guide line
			this._clearGuides();
			this._drawGuide(
				this._map.latLngToLayerPoint(this._markers[markerCount - 1].getLatLng()),
				newPos
			);
		}

		L.DomEvent.preventDefault(e);
	},

	_onClick: function (e) {
		var latlng = this._map.mouseEventToLatLng(e);

		this._markers.push(this._createMarker(latlng));

		this._poly.addLatLng(latlng);

		if (this._poly.getLatLngs().length === 2) {
			this._map.addLayer(this._poly);
		}

		this._updateMarkerHandler();

		this._vertexAdded(latlng);
	},

	_updateMarkerHandler: function () {
		// The last marker shold have a click handler to close the polyline
		if (this._markers.length > 1) {
			this._markers[this._markers.length - 1].on('click', this._finishShape, this);
			this._markers[this._markers.length - 1].on('touchend', this._finishShape, this);
		}
		
		// Remove the old marker click handler (as only the last point should close the polyline)
		if (this._markers.length > 2) {
			this._markers[this._markers.length - 2].off('click', this._finishShape);
			this._markers[this._markers.length - 2].off('touchend', this._finishShape);
		}
	},
	
	_createMarker: function (latlng) {
		var marker = new L.Marker(latlng, {
			icon: this.options.icon
		});
		
		this._markerGroup.addLayer(marker);

		return marker;
	},

	_drawGuide: function (pointA, pointB) {
		var length = Math.floor(Math.sqrt(Math.pow((pointB.x - pointA.x), 2) + Math.pow((pointB.y - pointA.y), 2))),
			i,
			fraction,
			dashPoint,
			dash;

		//create the guides container if we haven't yet (TODO: probaly shouldn't do this every time the user starts to draw?)
		if (!this._guidesContainer) {
			this._guidesContainer = L.DomUtil.create('div', 'leaflet-draw-guides', this._pane);
		}
	
		//draw a dash every GuildeLineDistance
		for (i = this.options.guidelineDistance; i < length; i += this.options.guidelineDistance) {
			//work out fraction along line we are
			fraction = i / length;

			//calculate new x,y point
			dashPoint = {
				x: Math.floor((pointA.x * (1 - fraction)) + (fraction * pointB.x)),
				y: Math.floor((pointA.y * (1 - fraction)) + (fraction * pointB.y))
			};

			//add guide dash to guide container
			dash = L.DomUtil.create('div', 'leaflet-draw-guide-dash', this._guidesContainer);
			dash.style.backgroundColor = this.options.shapeOptions.color;

			L.DomUtil.setPosition(dash, dashPoint);
		}
	},

	_getLabelText: function (currentLatLng) {
		var labelText,
			distance,
			distanceStr;

		if (this._markers.length === 0) {
			labelText = {
				text: 'Tap to start drawing line.'
			};
		} else {
			// calculate the distance from the last fixed point to the mouse position
			distance = this._measurementRunningTotal + currentLatLng.distanceTo(this._markers[this._markers.length - 1].getLatLng());
			// show metres when distance is < 1km, then show km
			distanceStr = distance  > 1000 ? (distance  / 1000).toFixed(2) + ' km' : Math.ceil(distance) + ' m';
			
			if (this._markers.length === 1) {
				labelText = {
					text: 'Tap to continue drawing line.',
					subtext: distanceStr
				};
			} else {
				labelText = {
					text: 'Tap last point to finish line.',
					subtext: distanceStr
				};
			}
		}
		return labelText;
	},

	_vertexAdded: function (latlng) {
		if (this._markers.length === 1) {
			this._measurementRunningTotal = 0;
		}
		else {
			this._measurementRunningTotal +=
				latlng.distanceTo(this._markers[this._markers.length - 2].getLatLng());
		}
	},

	_cleanUpShape: function () {
		if (this._markers.length > 0) {
			this._markers[this._markers.length - 1].off('click', this._finishShape);
			this._markers[this._markers.length - 1].off('touchend', this._finishShape);
		}
	},

	// removes all child elements (guide dashes) from the guides container
	_clearGuides: function () {
		if (this._guidesContainer) {
			while (this._guidesContainer.firstChild) {
				this._guidesContainer.removeChild(this._guidesContainer.firstChild);
			}
		}
	}
});

L.Polygon.Draw = L.Polyline.Draw.extend({
	Poly: L.Polygon,

	options: {
		shapeOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		}
	},

	_updateMarkerHandler: function () {
		// The first marker shold have a click handler to close the polygon
		if (this._markers.length === 1) {
			this._markers[0].on('click', this._finishShape, this);
			this._markers[0].on('touchend', this._finishShape, this);
		}
	},

	_getLabelText: function () {
		var text;
		if (this._markers.length === 0) {
			text = 'Tap to start drawing shape.';
		} else if (this._markers.length < 3) {
			text = 'Tap to continue drawing shape.';
		} else {
			text = 'Tap first point to close this shape.';
		}
		return {
			text: text
		};
	},

	_vertexAdded: function (latlng) {
		//calc area here
	},

	_cleanUpShape: function () {
		if (this._markers.length > 0) {
			this._markers[0].off('click', this._finishShape);
			this._markers[0].off('touchend', this._finishShape);
		}
	}
});

L.SimpleShape = {};

L.SimpleShape.Draw = L.Handler.Draw.extend({
	addHooks: function () {
		L.Handler.Draw.prototype.addHooks.call(this);
		if (this._map) {
			this._map.dragging.disable();
			//TODO refactor: move cursor to styles
			this._container.style.cursor = 'crosshair';

			this._updateLabelText({ text: this._initialLabelText });

			L.DomEvent
				.addListener(this._container, 'mousedown', this._onMouseDown, this)
				.addListener(this._container, 'touchstart', this._onMouseDown, this)
				.addListener(document, 'mousemove', this._onMouseMove, this)
				.addListener(document, 'touchmove', this._onMouseMove, this);
		}
	},

	removeHooks: function () {
		L.Handler.Draw.prototype.removeHooks.call(this);
		if (this._map) {
			this._map.dragging.enable();
			//TODO refactor: move cursor to styles
			this._container.style.cursor = '';

			L.DomEvent
				.removeListener(this._container, 'mousedown', this._onMouseDown)
				.removeListener(this._container, 'touchstart', this._onMouseDown)
				.removeListener(document, 'mousemove', this._onMouseMove)
				.removeListener(document, 'touchmove', this._onMouseMove)
				.removeListener(document, 'mouseup', this._onMouseUp)
				.removeListener(document, 'touchend', this._onMouseUp);

			// If the box element doesn't exist they must not have moved the mouse, so don't need to destroy/return
			if (this._shape) {
				this._map.removeLayer(this._shape);
				delete this._shape;
			}
		}
		this._isDrawing = false;
	},

	_onMouseDown: function (e) {
		this._isDrawing = true;
		
		this._updateLabelText({ text: 'Release mouse to finish drawing.' });

		this._startLatLng = this._map.mouseEventToLatLng(e);

		L.DomEvent
			.addListener(document, 'mouseup', this._onMouseUp, this)
			.addListener(document, 'touchend', this._onMouseUp, this)
			.preventDefault(e);
	},

	_onMouseMove: function (e) {
		var layerPoint = this._map.mouseEventToLayerPoint(e),
			latlng = this._map.mouseEventToLatLng(e);

		this._updateLabelPosition(layerPoint);

		if (this._isDrawing) {
			this._updateLabelPosition(layerPoint);
			this._drawShape(latlng);
		}
	},

	_onMouseUp: function (e) {
		this._endLatLng = this._map.mouseEventToLatLng(e);

		this._fireCreatedEvent();
		
		this.disable();
	}
});

L.Circle.Draw = L.SimpleShape.Draw.extend({
	options: {
		shapeOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		}
	},

	_initialLabelText: 'Click and drag to draw circle.',

	_drawShape: function (latlng) {
		if (!this._shape) {
			this._shape = new L.Circle(this._startLatLng, this._startLatLng.distanceTo(latlng), this.options.shapeOptions);
			this._map.addLayer(this._shape);
		} else {
			this._shape.setRadius(this._startLatLng.distanceTo(latlng));
		}
	},

	_fireCreatedEvent: function () {
		this._map.fire(
			'draw:circle-created',
			{ circ: new L.Circle(this._startLatLng, this._startLatLng.distanceTo(this._endLatLng), this.options.shapeOptions) }
		);
	}
});

L.Rectangle.Draw = L.SimpleShape.Draw.extend({
	options: {
		shapeOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		}
	},
	
	_initialLabelText: 'Click and drag to draw rectangle.',

	_drawShape: function (latlng) {
		if (!this._shape) {
			this._shape = new L.Rectangle(new L.LatLngBounds(this._startLatLng, latlng), this.options.shapeOptions);
			this._map.addLayer(this._shape);
		} else {
			this._shape.setBounds(new L.LatLngBounds(this._startLatLng, latlng));
		}
	},

	_fireCreatedEvent: function () {
		this._map.fire(
			'draw:rectangle-created',
			{ rect: new L.Rectangle(new L.LatLngBounds(this._startLatLng, this._endLatLng), this.options.shapeOptions) }
		);
	}
});

L.Marker.Draw = L.Handler.Draw.extend({
	options: {
		icon: new L.Icon.Default()
	},
	
	addHooks: function () {
		L.Handler.Draw.prototype.addHooks.call(this);
		
		if (this._map) {
			this._updateLabelText({ text: 'Click or tap map to place marker.' });
			L.DomEvent.addListener(this._container, 'mousemove', this._onMouseMove, this);
			L.DomEvent.addListener(this._container, 'touchmove', this._onMouseMove, this);
		}
	},

	removeHooks: function () {
		L.Handler.Draw.prototype.removeHooks.call(this);
		
		if (this._map) {
			if (this._marker) {
				L.DomEvent
					.removeListener(this._marker, 'click', this._onClick)
					.removeListener(this._marker, 'touchstart', this._onClick)
					.removeListener(this._map, 'click', this._onClick)
					.removeListener(this._map, 'touchstart', this._onClick);
				this._map.removeLayer(this._marker);
				delete this._marker;
			}

			L.DomEvent.removeListener(this._container, 'mousemove', this._onMouseMove);
			L.DomEvent.removeListener(this._container, 'touchmove', this._onMouseMove);
		}
	},

	_onMouseMove: function (e) {
		var newPos = this._map.mouseEventToLayerPoint(e),
			latlng = this._map.mouseEventToLatLng(e);

		this._updateLabelPosition(newPos);

		if (!this._marker) {
			this._marker = new L.Marker(latlng, this.options.icon);
			this._map.addLayer(this._marker);
			// Bind to both marker and map to make sure we get the click event.
			L.DomEvent
				.addListener(this._marker, 'click', this._onClick, this)
				.addListener(this._marker, 'touchstart', this._onClick, this)
				.addListener(this._map, 'click', this._onClick, this)
				.addListener(this._map, 'touchstart', this._onClick, this);
		}
		else {
			this._marker.setLatLng(latlng);
		}
	},

	_onClick: function (e) {
		this._map.fire(
			'draw:marker-created',
			{ marker: new L.Marker(this._marker.getLatLng(), this.options.icon) }
		);
		this.disable();
	}
});

L.Map.mergeOptions({
	drawControl: false
});

L.Control.Draw = L.Control.extend({

	options: {
		position: 'topleft',
		drawPolyline: true,
		drawPolygon: true,
		drawRectangle: true,
		drawCircle: true,
		drawMarker: true,
		styles: {}
	},

	handlers: {},

	onAdd: function (map) {
		var className = 'leaflet-control-draw',
			container = L.DomUtil.create('div', className);

		if (this.options.drawPolyline) {
			this.handlers.polyline = new L.Polyline.Draw(map, this.options.styles.polyline);
			this._createButton(
				'Draw a polyline',
				className + '-polyline',
				container,
				this.handlers.polyline.enable,
				this.handlers.polyline
			);
			this.handlers.polyline.on('activated', this._disableInactiveModes, this);
		}

		if (this.options.drawPolygon) {
			this.handlers.polygon = new L.Polygon.Draw(map, this.options.styles.polygon);
			this._createButton(
				'Draw a polygon',
				className + '-polygon',
				container,
				this.handlers.polygon.enable,
				this.handlers.polygon
			);
			this.handlers.polygon.on('activated', this._disableInactiveModes, this);
		}

		if (this.options.drawRectangle) {
			this.handlers.rectangle = new L.Rectangle.Draw(map, this.options.styles.rectangle);
			this._createButton(
				'Draw a rectangle',
				className + '-rectangle',
				container,
				this.handlers.rectangle.enable,
				this.handlers.rectangle
			);
			this.handlers.rectangle.on('activated', this._disableInactiveModes, this);
		}

		if (this.options.drawCircle) {
			this.handlers.circle = new L.Circle.Draw(map, this.options.styles.circle);
			this._createButton(
				'Draw a circle',
				className + '-circle',
				container,
				this.handlers.circle.enable,
				this.handlers.circle
			);
			this.handlers.circle.on('activated', this._disableInactiveModes, this);
		}

		if (this.options.drawMarker) {
			this.handlers.marker = new L.Marker.Draw(map);
			this._createButton(
				'Add a marker',
				className + '-marker',
				container,
				this.handlers.marker.enable,
				this.handlers.marker
			);
			this.handlers.marker.on('activated', this._disableInactiveModes, this);
		}
		
		return container;
	},

	_createButton: function (title, className, container, fn, context) {
		var link = L.DomUtil.create('a', className, container);
		link.href = '#';
		link.title = title;

		L.DomEvent
			.addListener(link, 'click', L.DomEvent.stopPropagation)
			.addListener(link, 'click', L.DomEvent.preventDefault)
			.addListener(link, 'click', fn, context);

		return link;
	},

	// Need to disable the drawing modes if user clicks on another without disabling the current mode
	_disableInactiveModes: function () {
		for (var i in this.handlers) {
			// Check if is a property of this object and is enabled
			if (this.handlers.hasOwnProperty(i) && this.handlers[i].enabled) {
				this.handlers[i].disable();
			}
		}
	}
});

L.Map.addInitHook(function () {
	if (this.options.drawControl) {
		this.drawControl = new L.Control.Draw();
		this.addControl(this.drawControl);
	}
});



}());