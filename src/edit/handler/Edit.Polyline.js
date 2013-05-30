L.Edit.Poly.include({
	_onMarkerDrag: function (e) {
		var marker = e.target;
		
		// Oh, snap!
		if (typeof this._poly.options.snapping !== "undefined" && this._poly.options.snapping.enabled === true) {
			marker._latlng = this._poly.snapTo(marker._latlng);
			L.DomUtil.setPosition(marker._icon, map.latLngToLayerPoint(marker._latlng));
		}
				
		L.extend(marker._origLatLng, marker._latlng);

		if (marker._middleLeft) {
			marker._middleLeft.setLatLng(this._getMiddleLatLng(marker._prev, marker));
		}
		if (marker._middleRight) {
			marker._middleRight.setLatLng(this._getMiddleLatLng(marker, marker._next));
		}

		this._poly.redraw();
	}
});