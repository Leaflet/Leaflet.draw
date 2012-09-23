L.Polyline.Draw = L.Handler.Draw.extend({
	Poly: L.Polyline,

	options: {
		allowIntersection: true,
		drawError: {
			color: '#b00b00',
			message: '<strong>Error:</strong> shape edges cannot cross!',
			timeout: 2500
		},
		icon: new L.DivIcon({
			iconSize: new L.Point(8, 8),
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

	initialize: function (map, options) {
		// Merge default drawError options with custom options
		if (options && options.drawError) {
			options.drawError = L.Util.extend({}, this.options.drawError, options.drawError);
		}
		L.Handler.Draw.prototype.initialize.call(this, map, options);
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

			this._map
				.on('mousemove', this._onMouseMove, this)
				.on('click', this._onClick, this);
		}
	},

	removeHooks: function () {
		L.Handler.Draw.prototype.removeHooks.call(this);

		this._clearHideErrorTimeout();

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

		this._map
			.off('mousemove', this._onMouseMove)
			.off('click', this._onClick);
	},

	_finishShape: function () {
		if (!this.options.allowIntersection && this._poly.newLatLngIntersects(this._poly.getLatLngs()[0], true)) {
			this._showErrorLabel();
			return;
		}
		if (!this._finishIsGood()) {
			this._showErrorLabel();
			return;
		}

		this._map.fire(
			'draw:poly-created',
			{ poly: new this.Poly(this._poly.getLatLngs(), this.options.shapeOptions) }
		);
		this.disable();
	},

	//Called to verify the shape is valid when the user tries to finish it
	//Return false if the shape is not valid
	_shapeIsValid: function () {
		return true;
	},

	_onMouseMove: function (e) {
		var newPos = e.layerPoint,
			latlng = e.latlng,
			markerCount = this._markers.length;

		// Save latlng
		this._currentLatLng = latlng;

		// update the label
		this._updateLabelPosition(newPos);

		if (markerCount > 0) {
			this._updateLabelText(this._getLabelText());
			// draw the guide line
			this._clearGuides();
			this._drawGuide(
				this._map.latLngToLayerPoint(this._markers[markerCount - 1].getLatLng()),
				newPos
			);
		}

		L.DomEvent.preventDefault(e.originalEvent);
	},

	_onClick: function (e) {
		var latlng = e.latlng,
			markerCount = this._markers.length;

		if (markerCount > 0 && !this.options.allowIntersection && this._poly.newLatLngIntersects(latlng)) {
			this._showErrorLabel();
			return;
		}
		else if (this._errorShown) {
			this._hideErrorLabel();
		}

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
		}
		
		// Remove the old marker click handler (as only the last point should close the polyline)
		if (this._markers.length > 2) {
			this._markers[this._markers.length - 2].off('click', this._finishShape);
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

	_updateLabelText: function (labelText) {
		if (!this._errorShown) {
			L.Handler.Draw.prototype._updateLabelText.call(this, labelText);
		}
	},

	_getLabelText: function () {
		var labelText,
			distance,
			distanceStr;

		if (this._markers.length === 0) {
			labelText = {
				text: 'Click to start drawing line.'
			};
		} else {
			// calculate the distance from the last fixed point to the mouse position
			distance = this._measurementRunningTotal + this._currentLatLng.distanceTo(this._markers[this._markers.length - 1].getLatLng());
			// show metres when distance is < 1km, then show km
			distanceStr = distance  > 1000 ? (distance  / 1000).toFixed(2) + ' km' : Math.ceil(distance) + ' m';
			
			if (this._markers.length === 1) {
				labelText = {
					text: 'Click to continue drawing line.',
					subtext: distanceStr
				};
			} else {
				labelText = {
					text: 'Click last point to finish line.',
					subtext: distanceStr
				};
			}
		}
		return labelText;
	},

	_showErrorLabel: function () {
		this._errorShown = true;

		// Update label
		L.DomUtil.addClass(this._label, 'leaflet-error-draw-label');
		L.DomUtil.addClass(this._label, 'leaflet-flash-anim');
		L.Handler.Draw.prototype._updateLabelText.call(this, { text: this.options.drawError.message });

		// Update shape
		this._updateGuideColor(this.options.drawError.color);
		this._poly.setStyle({ color: this.options.drawError.color });

		// Hide the error after 2 seconds
		this._clearHideErrorTimeout();
		this._hideErrorTimeout = setTimeout(L.Util.bind(this._hideErrorLabel, this), this.options.drawError.timeout);
	},

	_hideErrorLabel: function () {
		this._errorShown = false;

		this._clearHideErrorTimeout();
		
		// Revert label
		L.DomUtil.removeClass(this._label, 'leaflet-error-draw-label');
		L.DomUtil.removeClass(this._label, 'leaflet-flash-anim');
		this._updateLabelText(this._getLabelText());

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
		}
	}
});