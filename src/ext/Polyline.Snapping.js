L.Polyline.include({
	/**
	 * Snap to function
	 *
	 * @param <LatLng> latlng - cursor click
	 *
	 * @return <LatLng> - snapped to
	 *
	 * @todo find the closest point before returning?
	 */
	snapTo: function (latlng) {
		var newLatLng = null,
			distance = 0,
			layers = this.options.snapping.layers,
			sensitivity = this.options.snapping.sensitivity;

		// Loop through layers
		for (var l in layers) {
			var layer = layers[l],
				map = layer._map;
			
			// Loop through features
			for (var i in layer._layers) {
				var obj = layer._layers[i];
				
				// Loop through points
				var lastPoint = null;
				for (var j in obj._latlngs) {
					var ll = obj._latlngs[j];
					var p1 = map.latLngToLayerPoint(latlng);
					var p2 = map.latLngToLayerPoint(ll);
					
					if (lastPoint != null) {
						p3 = L.LineUtil.getClosestPoint(lastPoint, p2, p1, false);
						
						if (p1.distanceTo(p3) <= sensitivity) {
							return map.layerPointToLatLng(p3);
						}
					// This is kind of dirty
					// But is needed in case a layer only contains 
					// single points (markers)
					} else if (p1.distanceTo(p2) <= sensitivity) {
						return ll;
					}
					
					lastPoint = p2;
				}
			}
		}
		
		return latlng;
	}	
});