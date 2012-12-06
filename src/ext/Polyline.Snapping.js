L.Polyline.include({
	/**
	 * Snap to function
	 *
	 * @param <LatLng> latlng -
	 * @param <array> layers -
	 * @param <numberic> sensitivity -
	 *
	 * @return <LatLng>
	 *
	 * @todo find the nearest point before returning
	 */
	snapTo: function (latlng, layers, sensitivity) {
		var newLatLng = null;
		var distance = 0;

		// Loop through layers
		for (var l in layers) {
			var map = layers[l]._map;
			
			// Loop through features
			for (var i in layers[0]._layers) {
				var obj = layers[0]._layers[i];
				
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