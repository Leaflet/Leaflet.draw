L.Polyline.include({
	/**
	 * Snap to function
	 *
	 * @param <LatLng> latlng - original position
	 *
	 * @return <LatLng> - new position
	 */
	snapTo: function (latlng) {
		return L.LineUtil.snapToLayers(latlng, this._leaflet_id, this.options.snapping);
	}
});