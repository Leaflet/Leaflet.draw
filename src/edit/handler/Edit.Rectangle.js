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
		var bounds = this._shape.getBounds(),
			nw = bounds.getNorthWest(),
			ne = bounds.getNorthEast(),
			se = bounds.getSouthEast(),
			sw = bounds.getSouthWest();

		nw.lat = latlng.lat < sw.lat ? sw.lat : latlng.lat;
		ne.lat = latlng.lat < sw.lat ? sw.lat : latlng.lat;
		ne.lng = latlng.lng < sw.lng ? sw.lng : latlng.lng;
		se.lng = latlng.lng < sw.lng ? sw.lng : latlng.lng;

		this._shape.setLatLngs([nw, ne, se, sw]);

		// Respoition the move marker
		bounds = this._shape.getBounds();
		this._moveMarker.setLatLng(bounds.getCenter());
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