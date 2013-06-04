L.Edit = L.Edit || {};

/*
 * L.Edit.Poly is an editing handler for polylines and polygons.
 */

L.Edit.Poly = L.Handler.extend({
	options: {
		icon: new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className: 'leaflet-div-icon leaflet-editing-icon'
		})
	},

	initialize: function (poly, options) {
		this._poly = poly;
		L.setOptions(this, options);
	},

	addHooks: function () {
		if (this._poly._map) {
			if (!this._markerGroup) {
				this._initMarkers();
			}
			this._poly._map.addLayer(this._markerGroup);
		}
	},

	removeHooks: function () {
		if (this._poly._map) {
			this._poly._map.removeLayer(this._markerGroup);
			delete this._markerGroup;
			delete this._markers;
		}
	},

	updateMarkers: function () {
		this._markerGroup.clearLayers();
		this._initMarkers();
	},

	_initMarkers: function () {
		if (!this._markerGroup) {
			this._markerGroup = new L.LayerGroup();
		}
		this._markers = [];

		var latlngs = this._poly._latlngs,
		    holes = this._poly._holes,
			i, j, len, len2, marker;

		// TODO refactor holes implementation in Polygon to support it here
        var outerRing = new L.LayerGroup();
        this._markerGroup.addLayer(outerRing);
        this._markers.push([]);
		for (i = 0, len = latlngs.length; i < len; i++) {

			marker = this._createMarker(outerRing, latlngs[i], i);
			marker.on('click', this._onMarkerClick, this);
			this._markers[this._markers.length - 1].push(marker);
		}

		for (i = 0, len = holes.length; i < len; i++) {
			var hole = new L.LayerGroup();
			this._markerGroup.addLayer(hole);
			this._markers.push([]);
			for (j = 0, len2 = holes[i].length; j < len2; j++) {

				marker = this._createMarker(hole, holes[i][j], j);
				marker.on('click', this._onMarkerClick, this);
				this._markers[this._markers.length - 1].push(marker);
			}
		}

		var markerLeft, markerRight;
		var m, mLen;
		for (m = 0, mLen = this._markers.length; m < mLen; m++) {
			len = this._markers[m].length;
			for (i = 0, j = len - 1; i < len; j = i++) {
				if (i === 0 && !(L.Polygon && (this._poly instanceof L.Polygon))) {
					continue;
				}

				markerLeft = this._markers[m][j];
				markerRight = this._markers[m][i];

				this._createMiddleMarker(markerLeft, markerRight);
				this._updatePrevNext(markerLeft, markerRight);
			}
	    }
	},

	_createMarker: function (layer, latlng, index) {
		var marker = new L.Marker(latlng, {
			draggable: true,
			icon: this.options.icon
		});

		marker._origLatLng = latlng;
		marker._index = index;
		marker._layer = layer;
		//hacky layer index tracking.
		marker._layerIndex = this._markerGroup.getLayers().indexOf(layer);

		marker.on('drag', this._onMarkerDrag, this);
		marker.on('dragend', this._fireEdit, this);

		layer.addLayer(marker);

		return marker;
	},

	_spliceLatLngs: function (layerIndex) { // (Number index, Number howMany)
		var removed,
			args = [].splice.call(arguments, 1);
		if (layerIndex === 0) {
			removed = [].splice.apply(this._poly._latlngs, args);
			this._poly._convertLatLngs(this._poly._latlngs, true);
		} else {
			var i = layerIndex - 1;
			removed = [].splice.apply(this._poly._holes[i], args);
			this._poly._convertLatLngs(this._poly._holes[i], true);
		}
		this._poly.redraw();
		return removed;
	},

	_removeMarker: function (marker) {
		var layer = marker._layer,
			i = marker._index,
			j = marker._layerIndex;

		layer.removeLayer(marker);
		this._markers[j].splice(i, 1);
		this._spliceLatLngs(j, i, 1);
		this._updateIndexes(layer, i, -1);

		marker
			.off('drag', this._onMarkerDrag, this)
			.off('dragend', this._fireEdit, this)
			.off('click', this._onMarkerClick, this);
	},

	_fireEdit: function () {
		this._poly.edited = true;
		this._poly.fire('edit');
	},

	_onMarkerDrag: function (e) {
		var marker = e.target;

		L.extend(marker._origLatLng, marker._latlng);

		if (marker._middleLeft) {
			marker._middleLeft.setLatLng(this._getMiddleLatLng(marker._prev, marker));
		}
		if (marker._middleRight) {
			marker._middleRight.setLatLng(this._getMiddleLatLng(marker, marker._next));
		}

		this._poly.redraw();
	},

	_onMarkerClick: function (e) {
		// we want to remove the marker on click, but if latlng count < 3, polyline would be invalid
		if (this._poly._latlngs.length < 3) { return; }

		var marker = e.target;

		// remove the marker
		this._removeMarker(marker);

		// update prev/next links of adjacent markers
		this._updatePrevNext(marker._prev, marker._next);

		// remove ghost markers near the removed marker
		if (marker._middleLeft) {
			marker._layer.removeLayer(marker._middleLeft);
		}
		if (marker._middleRight) {
			marker._layer.removeLayer(marker._middleRight);
		}

		// create a ghost marker in place of the removed one
		if (marker._prev && marker._next) {
			this._createMiddleMarker(marker._prev, marker._next);

		} else if (!marker._prev) {
			marker._next._middleLeft = null;

		} else if (!marker._next) {
			marker._prev._middleRight = null;
		}

		this._fireEdit();
	},

	_updateIndexes: function (layer, index, delta) {
		layer.eachLayer(function (marker) {
			if (marker._index > index) {
				marker._index += delta;
			}
		});
	},

	_createMiddleMarker: function (marker1, marker2) {
		var latlng = this._getMiddleLatLng(marker1, marker2),
		    marker = this._createMarker(marker1._layer, latlng),
		    onClick,
		    onDragStart,
		    onDragEnd;

		marker.setOpacity(0.6);

		marker1._middleRight = marker2._middleLeft = marker;

		onDragStart = function () {
			var i = marker2._index,
				j = marker._layerIndex;

			marker._index = i;

			marker
			    .off('click', onClick, this)
			    .on('click', this._onMarkerClick, this);

			latlng.lat = marker.getLatLng().lat;
			latlng.lng = marker.getLatLng().lng;
			this._spliceLatLngs(j, i, 0, latlng);
			this._markers.splice(i, 0, marker);

			marker.setOpacity(1);

			this._updateIndexes(marker._layer, i, 1);
			marker2._index++;
			this._updatePrevNext(marker1, marker);
			this._updatePrevNext(marker, marker2);
		};

		onDragEnd = function () {
			marker.off('dragstart', onDragStart, this);
			marker.off('dragend', onDragEnd, this);

			this._createMiddleMarker(marker1, marker);
			this._createMiddleMarker(marker, marker2);
		};

		onClick = function () {
			onDragStart.call(this);
			onDragEnd.call(this);
			this._fireEdit();
		};

		marker
		    .on('click', onClick, this)
		    .on('dragstart', onDragStart, this)
		    .on('dragend', onDragEnd, this);

		this._markerGroup.addLayer(marker);
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
		    p1 = map.latLngToLayerPoint(marker1.getLatLng()),
		    p2 = map.latLngToLayerPoint(marker2.getLatLng());

		return map.layerPointToLatLng(p1._add(p2)._divideBy(2));
	}
});

L.Polyline.addInitHook(function () {

	// Check to see if handler has already been initialized. This is to support versions of Leaflet that still have L.Handler.PolyEdit
	if (this.editing) {
		return;
	}

	if (L.Edit.Poly) {
		this.editing = new L.Edit.Poly(this);

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
