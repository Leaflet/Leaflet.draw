L.Edit.Rectangle = L.Edit.SimpleShape.extend({
	_createMoveMarker: function () {
		var bounds = this._shape.getBounds(),
			center = bounds.getCenter();

		this._moveMarker = this._createMarker(center, this.options.moveIcon);
	},

	_createResizeMarker: function () {
		var bounds = this._shape.getBounds(),
			resizemarkerPoint = bounds.getNorthEast();

		this._resizeMarker = this._createMarker(resizemarkerPoint, this.options.resizeIcon);
	},

	_onMarkerDragEnd: function (e) {
		var marker = e.target,
			bounds = this._shape.getBounds(),
			ne = bounds.getNorthEast();

		// Reset marker position to the north east corner and 
		marker.setLatLng(ne);

		L.Edit.SimpleShape.prototype._onMarkerDragEnd.call(this, e);
	},

	_move: function (newCenter) {
		var latlngs = this._shape.getLatLngs(),
			bounds = this._shape.getBounds(),
			center = bounds.getCenter(),
			offset, newLatLngs = [];

		// Offset the latlngs to the new center
		for (var i = 0, l = latlngs.length; i < l; i++) {
			offset = [latlngs[i].lat - center.lat, latlngs[i].lng - center.lng];
			newLatLngs.push([newCenter.lat + offset[0], newCenter.lng + offset[1]]);
		}

		this._shape.setLatLngs(newLatLngs);

		// Respoition the resize marker
		bounds = this._shape.getBounds();
		this._resizeMarker.setLatLng(bounds.getNorthEast());
	},

	_resize: function (latlng) {
		var latlngs = this._shape.getLatLngs(),
			bounds = this._shape.getBounds(),
			center = bounds.getCenter(),
			ne = bounds.getNorthEast(),
			newLatLngs = [],
			scale, p, relativePosition, newPosition;

		// Turn the LatLng's into Points so we can use L.point methods
		latlng = L.point(latlng.lat, latlng.lng);
		center = L.point(center.lat, center.lng);
		ne = L.point(ne.lat, ne.lng);

		// Calculate the scale by finding the difference between the center and new point and the center and the old north east point
		scale = (center).distanceTo(latlng) / (center).distanceTo(ne);

		// Translate each of the four corners
		for (var i = 0, l = latlngs.length; i < l; i++) {
			p = L.point(latlngs[i].lat, latlngs[i].lng);

			// Get the relative position (to the center) of the new point 
			relativePosition = p.subtract(center);

			// Calculate new position of point based on new scale
			newPosition = relativePosition.multiplyBy(scale).add(center);

			newLatLngs.push([newPosition.x, newPosition.y]);
		}

		this._shape.setLatLngs(newLatLngs);
	}
});

L.Rectangle.addInitHook(function () {
	if (L.Edit.Rectangle) {
		this.editing = new L.Edit.Rectangle(this);

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