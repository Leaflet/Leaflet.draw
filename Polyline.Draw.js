L.Polyline.Draw = L.Handler.Draw.extend({
	options: {
		icon: new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className: 'leaflet-div-icon leaflet-editing-icon'
		}),
		guidelineDistance: 20
	},
	
	addHooks: function () {
		L.Handler.Draw.prototype.addHooks.call(this);
		if (this._map) {
			this._markers = [];

			this._markerGroup = new L.LayerGroup();
			this._map.addLayer(this._markerGroup);

			this._poly = new L.Polyline([], { color: '#f06eaa' });

			//TODO refactor: move cursor to styles
			this._container.style.cursor = 'crosshair';

			L.DomEvent
				.addListener(this._container, 'mousemove', this._onMouseMove, this)
				.addListener(this._container, 'click', this._onClick, this);
		}
	},

	removeHooks: function () {
		L.Handler.Draw.prototype.removeHooks.call(this);
		if (this._map) {
			var poly;

			if (this._polyOptions.type === 'polygon') {
				poly = new L.Polygon(this._poly.getLatLngs(), { color: '#f06eaa' });
			} else {
				poly = new L.Polyline(this._poly.getLatLngs(), { color: '#f06eaa' });
			}

			this._map.fire('polycreated', { poly: poly });

			if (this._markers.length > 0) {
				this._markers[0].off('click', this.disable);
			}

			//remove markers from map
			this._map.removeLayer(this._markerGroup);
			delete this._markerGroup;
			delete this._markers;

			this._map.removeLayer(this._poly);
			delete this._poly;

			//clean up DOM
			this._clearGuides();

			L.DomEvent
				.removeListener(this._container, 'mousemove', this._onMouseMove)
				.removeListener(this._container, 'click', this._onClick);
		}
	},

	drawPolyline: function () {
		this._polyOptions = {
			type: 'polyline',
			getLabelText: function (markerCount) {
				var text;
				if (markerCount === 0) {
					text = 'Click to start drawing line.';
				} else if (markerCount === 1) {
					text = 'Click to continue drawing line.';
				} else {
					text = 'Click last point to finish line.';
				}
				return text;
			}
		};
		this.enable();
	},

	drawPolygon: function () {
		this._polyOptions = {
			type: 'polygon',
			getLabelText: function (markerCount) {
				var text;
				if (markerCount === 0) {
					text = 'Click to start drawing shape.';
				} else if (markerCount < 3) {
					text = 'Click to continue drawing shape.';
				} else {
					text = 'Click first point to close this shape.';
				}
				return text;
			}
		};
		this.enable();
	},
	
	_createMarker: function (latlng) {
		var marker = new L.Marker(latlng, {
			icon: this.options.icon
		});
		
		this._markerGroup.addLayer(marker);

		return marker;
	},

	_onMouseMove: function (e) {
		var newPos = this._map.mouseEventToLayerPoint(e),
			latlng = this._map.mouseEventToLatLng(e),
			markerCount = this._markers.length;

		// update the label
		this._updateLabel(
			newPos,
			latlng.lat.toFixed(6) + ', ' + latlng.lng.toFixed(6),
			this._polyOptions.getLabelText(markerCount)
		);

		// draw the guides
		if (markerCount > 0) {
			this._clearGuides();
			this._drawGuide(
				this._map.latLngToLayerPoint(this._markers[markerCount - 1].getLatLng()),
				newPos
			);
		}

		L.DomEvent.preventDefault(e);
	},

	_onClick: function (e) {
		var latlng = this._map.mouseEventToLatLng(e),
			marker = this._createMarker(latlng);

		// Add close handler to appropriate point
		if ((this._polyOptions.type === 'polygon' && this._markers.length === 0) ||
			(this._polyOptions.type === 'polyline' && this._markers.length > 0)
			) {
			marker.on('click', this.disable, this);
		}
		
		// Remove the close handler from the last point and add to new marker
		if (this._polyOptions.type === 'polyline' && this._markers.length !== 0) {
			this._markers[this._markers.length - 1].off('click', this.disable);
		}

		this._markers.push(marker);

		this._poly.addLatLng(latlng);

		if (this._poly.getLatLngs().length === 2) {
			this._map.addLayer(this._poly);
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

			L.DomUtil.setPosition(dash, dashPoint);
		}
	}
});

L.Map.addInitHook('addHandler', 'polyDraw', L.Polyline.Draw);