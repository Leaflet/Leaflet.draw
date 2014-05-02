L.Edit = L.Edit || {};

/*
 * L.Edit.Poly is an editing handler for polylines and polygons.
 */

L.Edit.Poly = L.Edit.SimpleShape.extend({
	
	removeHooks: function () {
		if (this._shape._map) {
			this._shape._map.removeLayer(this._markerGroup);
			delete this._markerGroup;
			delete this._markers;
		}
	},

	_initMarkers: function () {
		if (!this._markerGroup) {
			this._markerGroup = new L.LayerGroup();
		}
		
		// Create center marker
		this._createMoveMarker();

		// Create edge marker
		//this._createResizeMarker();
		
		// Create point edit markers
		this._createEditMarkers();
	},

	_createEditMarkers: function () {
		this._markers = [];
		this._markersPhantom = [];

		var latlngs = this._shape._latlngs,
			i, j, len, marker;

		// TODO refactor holes implementation in Polygon to support it here

		for (i = 0, len = latlngs.length; i < len; i++) {

			marker = this._createEditMarker(latlngs[i], i);
			marker.on('click', this._onMarkerClick, this);
			this._markers.push(marker);
		}

		var markerLeft, markerRight, markerMiddle;

		for (i = 0, j = len - 1; i < len; j = i++) {
			if (i === 0 && !(L.Polygon && (this._shape instanceof L.Polygon))) {
				continue;
			}

			markerLeft = this._markers[j];
			markerRight = this._markers[i];

			markerMiddle = this._createMiddleMarker(markerLeft, markerRight);
			this._updatePrevNext(markerLeft, markerRight);
			this._markersPhantom.push(markerMiddle);
		}
	},

	_createEditMarker: function (latlng, index) {
		var marker = this._createMarker(latlng, this.options.icon);

		marker._index = index;

		marker.on('dragend', this._fireEdit, this);

		this._markerGroup.addLayer(marker);

		return marker;
	},

	_removeEditMarker: function (marker) {
		var i = marker._index;

		this._markerGroup.removeLayer(marker);
		this._markers.splice(i, 1);
		this._shape.spliceLatLngs(i, 1);
		this._updateIndexes(i, -1);

		marker
			.off('drag', this._onMarkerDrag, this)
			.off('dragend', this._fireEdit, this)
			.off('click', this._onMarkerClick, this);
	},
	
	_createMoveMarker: function () {
		this._moveMarker = this._createMarker(this._getCenter(this._shape.getLatLngs()), this.options.moveIcon);
	},
	
	_fireEdit: function () {
		this._shape.edited = true;
		this._shape.fire('edit');
	},
	
	_onMarkerDragStart: function (e) {
		L.Edit.SimpleShape.prototype._onMarkerDragStart.call(this, e);

		this._toggleMarkers(0);
	},
	
	_onMarkerDrag: function (e) {
		var marker = e.target,
			latlng = marker.getLatLng();
		
		if (marker === this._moveMarker) {
			this._move(latlng);
		} else if (marker === this._redrawMarker) {
			this._resize(latlng);
		} else {
			L.extend(marker._origLatLng, marker._latlng);
	
			if (marker._middleLeft) {
				marker._middleLeft.setLatLng(this._getMiddleLatLng(marker._prev, marker));
			}
			if (marker._middleRight) {
				marker._middleRight.setLatLng(this._getMiddleLatLng(marker, marker._next));
			}
		}

		this._shape.redraw();
	},
	
	_onMarkerDragEnd: function (e) {
		//this._toggleMarkers(1);
		this.updateMarkers(); // re-add edit markers after moving
		
		L.Edit.SimpleShape.prototype._onMarkerDragEnd.call(this, e);
	},

	_onMarkerClick: function (e) {
		var minPoints = L.Polygon && (this._shape instanceof L.Polygon) ? 4 : 3,
			marker = e.target;

		// If removing this point would create an invalid polyline/polygon don't remove
		if (this._shape._latlngs.length < minPoints) {
			return;
		}

		// remove the marker
		this._removeEditMarker(marker);

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
		
		this.updateMarkers();
		this._fireEdit();
	},
	
	_move: function (newCenter) {
		var latlngs = this._shape.getLatLngs(),
			center = this._getCenter(latlngs),
			offset, newLatLngs = [];

		// Offset the latlngs to the new center
		for (var i = 0, l = latlngs.length; i < l; i++) {
			offset = [latlngs[i].lat - center.lat, latlngs[i].lng - center.lng];
			newLatLngs.push([newCenter.lat + offset[0], newCenter.lng + offset[1]]);
		}

		this._shape.setLatLngs(newLatLngs);

		// Reposition the resize markers
		this._repositionMarkers(newCenter);
	},
	
	// requires refactoring - into _move?
	_repositionMarkers: function (newCenter) {
		var latlngs = this._shape.getLatLngs(),
			center = this._getCenter(latlngs),
			offset;
		/*console.log(this._markerGroup);
		for each(var marker)
		for(var i = 0, l = this._markerGroup._layers.length; i < l; i++) {
			console.log(this._markerGroup[i]);
			if (this._markerGroup[i] === this._moveMarker) { continue; }
			this._markerGroup.removeLayer(this._markerGroup[i]);
		}
		
		this._createEditMarkers();*/
		for (var i = 0, l = this._markers.length; i < l; i++) {
			offset = [this._markers[i]._latlng.lat - center.lat, this._markers[i]._latlng.lng - center.lng];
			this._markers[i].setLatLng([newCenter.lat + offset[0], newCenter.lng + offset[1]]);
		}
	},

	_updateIndexes: function (index, delta) {
		this._markerGroup.eachLayer(function (marker) {
			if (marker._index > index) {
				marker._index += delta;
			}
		});
	},

	_createMiddleMarker: function (marker1, marker2) {
		var latlng = this._getMiddleLatLng(marker1, marker2),
		    marker = this._createEditMarker(latlng),
		    onClick,
		    onDragStart,
		    onDragEnd;

		marker.setOpacity(0.6);

		marker1._middleRight = marker2._middleLeft = marker;

		onDragStart = function () {
			var i = marker2._index;

			marker._index = i;

			marker
			    .off('click', onClick, this)
			    .on('click', this._onMarkerClick, this);

			latlng.lat = marker.getLatLng().lat;
			latlng.lng = marker.getLatLng().lng;
			this._shape.spliceLatLngs(i, 0, latlng);
			this._markers.splice(i, 0, marker);

			marker.setOpacity(1);

			this._updateIndexes(i, 1);
			marker2._index++;
			this._updatePrevNext(marker1, marker);
			this._updatePrevNext(marker, marker2);

			this._shape.fire('editstart');
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
		var map = this._shape._map,
		    p1 = map.project(marker1.getLatLng()),
		    p2 = map.project(marker2.getLatLng());

		return map.unproject(p1._add(p2)._divideBy(2));
	},

	_getCenter: function (arr) {
		var x = 0, y = 0, f, point1, point2;
		for (var i = 0, l = arr.length, j = l - 1; i < l; j = i, i++) {
			point1 = arr[i];
			point2 = arr[j];
			f = point1.lng * point2.lat - point2.lng * point1.lat;
			x += (point1.lng + point2.lng) * f;
			y += (point1.lat + point2.lat) * f;
		}
		f = this._getArea(arr) * 6;
		return L.latLng([ y / f, x / f ]);
	},
	
	_getArea: function (arr) {
		var area = 0, i, j, l, point1, point2;

		for (i = 0, l = arr.length, j = l - 1; i < l; j = i, i++) {
			point1 = arr[i];
			point2 = arr[j];
			area += point1.lng * point2.lat;
			area -= point1.lat * point2.lng;
		}
		area /= 2;

		return area;
	},
	
	_toggleMarkers: function (opacity) {
		console.log(this._markers.length);
		var i, l;
		for (i = 0, l = this._markers.length; i < l; i++) {
			this._markers[i].setOpacity(opacity);
		}
		for (i = 0, l = this._markersPhantom.length; i < l; i++) {
			this._markersPhantom[i].setOpacity(opacity);
		}
		this._moveMarker.setOpacity(opacity);
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
