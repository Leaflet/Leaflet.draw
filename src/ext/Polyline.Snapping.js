L.Polyline.include({
	/**
	 * Temporarily snapping variables
	 */
	_snapVars: {
		map : null,
		minPoint : null,
		minDist : null		
	},

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
		var layers = this.options.snapping.layers;		
		this._snapVars.minPoint = latlng;
		this._snapVars.minDist = Infinity;
		
		// Loop through layers
		for (var l1 in layers) {
			for (var l2 in layers[l1]._layers) {
				this._snapVars.map = layers[l1]._layers[l2]._map;
				
				if (typeof layers[l1]._layers[l2]._latlngs !== "undefined") {
					this._snapToObject(latlng, layers[l1]._layers[l2]);
				} else if (typeof layers[l1]._layers[l2]._layers !== "undefined") {
					for (var l3 in layers[l1]._layers[l2]._layers) {
						this._snapToObject(latlng, layers[l1]._layers[l2]._layers[l3]);
					}
				}	
			}
		}
		
		return this._snapVars.minPoint;
	},
	
	_snapToObject: function (latlng, obj) {
		var sensitivity = this.options.snapping.sensitivity
			map = this._snapVars.map,
			lastPoint = null;
		
		// Loop through points
		for (var j in obj._latlngs) {
			var ll = obj._latlngs[j],
				p1 = map.latLngToLayerPoint(latlng),
				p2 = map.latLngToLayerPoint(ll);
			
			if (lastPoint != null) {
				p3 = L.LineUtil.getClosestPoint(lastPoint, p2, p1, false);
				var tmpDist = p1.distanceTo(p3);
				if (tmpDist <= sensitivity && tmpDist < this._snapVars.minDist) {
					this._snapVars.minDist = tmpDist;
					this._snapVars.minPoint = map.layerPointToLatLng(p3);
				}
			} else if (p1.distanceTo(p2) <= sensitivity && p1.distanceTo(p2) < this._snapVars.minDist) {
				this._snapVars.minDist = p1.distanceTo(p2);
				this._snapVars.minPoint = ll;
			}
			
			lastPoint = p2;
		}
	}
});