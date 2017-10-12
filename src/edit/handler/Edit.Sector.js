L.Edit = L.Edit || {};
/**
 * @class L.Edit.Sector
 * @aka Edit.Sector
 * @inherits L.Edit.CircleMarker
 */
L.Edit.Sector = L.Edit.CircleMarker.extend({

	_createResizeMarker: function () {
		var center = this._shape.getLatLng(),
			resizemarkerPoint = this._getResizeMarkerPoint(center);

		this._resizeMarkers = [];
		this._resizeMarkers.push(this._createMarker(resizemarkerPoint, this.options.resizeIcon));
	},

	_getResizeMarkerPoint: function (latlng) {
		var angle = (this._shape.options.startAngle+this._shape.options.stopAngle)*Math.PI/360;
		var deltaX = this._shape._radius * Math.sin(angle),
			deltaY = this._shape._radius * Math.cos(angle),
			point = this._map.project(latlng);
			
		return this._map.unproject([point.x + deltaX, point.y - deltaY]);
	},

	_resize: function (latlng) {
		var radius,
			moveLatLng = this._moveMarker.getLatLng();

		// Calculate the radius based on the version
		if(L.GeometryUtil.isVersion07x()){
			radius = moveLatLng.distanceTo(latlng);
		} else {
			radius = this._map.distance(moveLatLng, latlng);
		}
		
		this._shape.setRadius(radius);
		var deltax = latlng.lng-moveLatLng.lng,
			deltay = latlng.lat-moveLatLng.lat;
		var direction = Math.atan(deltay/deltax)*180/Math.PI;
			direction = deltax<0?270-direction:90-direction;
		this._shape.setDirection(direction, 90);

		this._map.fire(L.Draw.Event.EDITRESIZE, { layer: this._shape });
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
