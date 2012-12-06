L.Polyline.include({
	/**
	 * Snap to function
	 *
	 * @param latlng {@code LatLng}
	 */
	snapTo: function (latlng, layers, sensitivity) {
		var newLatLng = null;
		var distance = 0;
		
		for (var i in layers[0]._layers) {
			var map = layers[0]._map;
			var obj = layers[0]._layers[i];
			
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
				} else if (p1.distanceTo(p2) <= sensitivity) {
					return ll;
				}
				
				
				lastPoint = p2;
			}
		}
		
		return latlng;
	}	
});