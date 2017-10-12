L.Edit = L.Edit || {};
/**
 * @class L.Edit.Sector
 * @aka Edit.Sector
 * @inherits L.Edit.CircleMarker
 */
L.Edit.Sector = L.Edit.CircleMarker.extend({

	_createResizeMarker: function () {
		this._resizeMarkers = [];
		var resizeMakerPoints = this._getResizeMarkerPoints();
		for(var i=0; i<3; i++) {
			this._resizeMarkers.push(this._createMarker(resizeMakerPoints[i], this.options.resizeIcon));
			this._resizeMarkers[i]._sectorIndex = i;
		}
	},

	_getResizeMarkerPoint: function (latlng, direction) {
		var angle = direction*Math.PI/180;
		var deltaX = this._shape._radius * Math.sin(angle),
			deltaY = this._shape._radius * Math.cos(angle),
			point = this._map.project(latlng);
			
		return this._map.unproject([point.x + deltaX, point.y - deltaY]);
	},
	
	_getResizeMarkerPoints: function () {
		var center = this._shape.getLatLng(),
			points = [];		
		points.push(this._getResizeMarkerPoint(center, this._shape.options.startAngle));
		points.push(this._getResizeMarkerPoint(center, (this._shape.options.startAngle+this._shape.options.stopAngle)/2));
		points.push(this._getResizeMarkerPoint(center, this._shape.options.stopAngle));
		return points;
	},
	
	_onMarkerDrag: function (e) {
		var marker = e.target,
			latlng = marker.getLatLng();

		if (marker === this._moveMarker) {
			this._move(latlng);
		} else {
			this._resize(marker);
		}

		this._shape.redraw();
		this._shape.fire('editdrag');
	},

	_resize: function (marker) {
		var radius,
			moveLatLng = this._moveMarker.getLatLng(),
			latlng = marker.getLatLng();
		
		var deltax = latlng.lng-moveLatLng.lng,
			deltay = latlng.lat-moveLatLng.lat;
		var direction = Math.atan(deltay/deltax)*180/Math.PI;
			direction = deltax<0?270-direction:90-direction;
		
		if (marker._sectorIndex === 1) {
			// Calculate the radius based on the version
			if(L.GeometryUtil.isVersion07x()){
				radius = moveLatLng.distanceTo(latlng);
			} else {
				radius = this._map.distance(moveLatLng, latlng);
			}
			this._shape.setRadius(radius);
			var degree = (this._shape.options.stopAngle - this._shape.options.startAngle);
			this._shape.setDirection(direction, degree);
		} else if(marker._sectorIndex === 0) {
			direction = direction > this._shape.options.stopAngle?direction - 360:direction;
			this._shape.setStartAngle(direction);
		} else {
			direction = direction < this._shape.options.startAngle?direction + 360:direction;
			this._shape.setStopAngle(direction);
		}
		
		this._repositionResizeMarkers();

		this._map.fire(L.Draw.Event.EDITRESIZE, { layer: this._shape });
	},
	
	_move: function (latlng) {
		// Move the sector
		this._shape.setLatLng(latlng);
		
		// Move resize markers
		this._repositionResizeMarkers();

		this._map.fire(L.Draw.Event.EDITMOVE, { layer: this._shape });
	},
	
	_repositionResizeMarkers: function () {
		var resizeMakerPoints = this._getResizeMarkerPoints();
		for(var i=0; i<3; i++) {
			this._resizeMarkers[i].setLatLng(resizeMakerPoints[i]);
		}
	}
});

L.SemiCircle.addInitHook(function () {
	if (L.Edit.Sector) {
		this.editing = new L.Edit.Sector(this);

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
