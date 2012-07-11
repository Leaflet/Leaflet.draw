L.Polyline.Draw = L.Handler.Draw.extend({
	Poly: L.Polyline,

	options: {
		icon: new L.DivIcon({
			iconSize: L.Browser.touch ? new L.Point(30, 30) : new L.Point(10, 10),
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
		},
		touchtarget : 1.5 // iconSize multiplied by touchtarget = final target size
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
			.addListener(this._container, 'click', this._onClick, this);
				
			if (L.Browser.touch) {
				L.DomEvent
				.addListener(this._container, 'touchstart', this._onMouseMove, this)
				.addListener(this._container, 'touchmove', this._onMouseMove, this)
				.addListener(this._container, 'touchend', this._onClick, this);
			}
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
		.removeListener(this._container, 'click', this._onClick);
		
		if (L.Browser.touch) {
			L.DomEvent
			.removeListener(this._container, 'touchmove', this._onMouseMove)
			.removeListener(this._container, 'touchend', this._onClick);
		}
	},

	_finishShape: function () {
		this._map.fire(
			'draw:poly-created',
			{
				poly: new this.Poly(this._poly.getLatLngs(), this.options.shapeOptions)
			}
			);
		this.disable();
	},

	_onMouseMove: function (e) {
		var newPos = this._map.mouseEventToLayerPoint(e.touches ? e.touches[0] : e),
		latlng = this._map.mouseEventToLatLng(e.touches ? e.touches[0] : e),
		markerCount = this._markers.length;
		
		if (e.touches) {
			L.DomEvent.stopPropagation(e);
		}

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
		var latlng = this._map.mouseEventToLatLng(e.changedTouches ? e.changedTouches[0] : e);
		
		if (e.touches) {
			this._clearGuides();
			// The touchend on the container seems to have preference over the touchend on the marker, so we manually check position of the last marker.
			// This also gives us the opportunity to use a touch target a little bigger than the visual shape, which makes it easier to hit the marker with clumsy fingers
			if (this._clickedFinishMarker(latlng)) {
				this._finishShape();
				return true;
			}
			
		}

		this._markers.push(this._createMarker(latlng));

		this._poly.addLatLng(latlng);

		if (this._poly.getLatLngs().length === 2) {
			this._map.addLayer(this._poly);
		}

		this._updateMarkerHandler();

		this._vertexAdded(latlng);
	},
	
	_clickedFinishMarker : function (latlng) {
		if (this._markers.length > 1) {
			var m = this._markers[this._markers.length - 1];
			// This could be improved by considering width and height of the icon separately, instead of just using the bigger one
			var pointA = this._map.latLngToContainerPoint(latlng);
			var pointB = this._map.latLngToContainerPoint(m.getLatLng());
			var length = Math.floor(Math.sqrt(Math.pow((pointB.x - pointA.x), 2) + Math.pow((pointB.y - pointA.y), 2)));
			var size = m.options.icon.options.iconSize;
			if (length < Math.max(size.x, size.y) * this.options.touchtarget) {
				return true;
			}
		}
		return false;
	},

	_updateMarkerHandler: function () {
		// The last marker shold have a click handler to close the polyline
		if (this._markers.length > 1) {
			this._markers[this._markers.length - 1].on('click', this._finishShape, this);
			if (L.Browser.touch) {
				this._markers[this._markers.length - 1].on('touchend', this._finishShape, this);
			}
		}
		
		// Remove the old marker click handler (as only the last point should close the polyline)
		if (this._markers.length > 2) {
			this._markers[this._markers.length - 2].off('click', this._finishShape);
			if (L.Browser.touch) {
				this._markers[this._markers.length - 2].off('touchend', this._finishShape);
			}
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
				text: (L.Browser.touch ? 'Tap' : 'Click') + ' to start drawing line.'
			};
		} else {
			// calculate the distance from the last fixed point to the mouse position
			distance = this._measurementRunningTotal + currentLatLng.distanceTo(this._markers[this._markers.length - 1].getLatLng());
			// show metres when distance is < 1km, then show km
			distanceStr = distance  > 1000 ? (distance  / 1000).toFixed(2) + ' km' : Math.ceil(distance) + ' m';
			
			if (this._markers.length === 1) {
				labelText = {
					text: (L.Browser.touch ? 'Tap' : 'Click') + ' to continue drawing line.',
					subtext: distanceStr
				};
			} else {
				labelText = {
					text: (L.Browser.touch ? 'Tap' : 'Click') + ' last point to finish line.',
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
			if (L.Browser.touch) {
				this._markers[this._markers.length - 1].off('touchend', this._finishShape);
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
	}
});