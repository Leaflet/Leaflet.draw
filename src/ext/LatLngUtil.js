/**
 * @class L.LatLngUtil
 * @aka LatLngUtil
 */
L.LatLngUtil = {
	// Clones a LatLngs[], returns [][]

	// @method cloneLatLngs(LatLngs[]): L.LatLngs[]
	// Clone the latLng point or points or nested points and return an array with those points
	cloneLatLngs: function (latlngs) {
		var clone = [];
		for (var i = 0, l = latlngs.length; i < l; i++) {
			// Check for nested array (Polyline/Polygon)
			if (Array.isArray(latlngs[i])) {
				clone.push(L.LatLngUtil.cloneLatLngs(latlngs[i]));
			} else {
				clone.push(this.cloneLatLng(latlngs[i]));
			}
		}
		return clone;
	},

	// @method cloneLatLng(LatLng): L.LatLng
	// Clone the latLng and return a new LatLng object.
	cloneLatLng: function (latlng) {
		return L.latLng(latlng.lat, latlng.lng);
	},

	pointToBounds: function (bbounds, point) {
		if (bbounds) {
			var bLat = Math.min(bbounds.getNorth(), Math.max(bbounds.getSouth(), point.lat));
			var bLng = Math.min(bbounds.getEast(), Math.max(bbounds.getWest(), point.lng));
			return new L.LatLng(bLat, bLng);
		}
		return point;
	},

	// makes a bounding box that's always (southWest,northEast) because L.LatLngBounds will internally assume this with no checking!!
	makeBounds: function (point1, point2) {
		var southLat = Math.min(point1.lat, point2.lat);
		var northLat = Math.max(point1.lat, point2.lat);

		var westLng = Math.min(point1.lng, point2.lng);
		var eastLng = Math.max(point1.lng, point2.lng);

		var southWest = new L.LatLng(southLat, westLng);
		var northEast = new L.LatLng(northLat, eastLng);
		return new L.LatLngBounds(southWest, northEast);
	},

	boxToBounds: function (bbounds, startCorner, otherCorner) {
		var boundedCorner = L.LatLngUtil.pointToBounds(bbounds, otherCorner);
		return L.LatLngUtil.makeBounds(startCorner, boundedCorner);
	},

	radiusToBounds: function (bbounds, startPoint, otherPoint) {
		var d = startPoint.distanceTo(otherPoint);

		if (bbounds) {
			if ((startPoint.lat - d) < bbounds.getSouth()) {
				d = Math.abs(startPoint.lat - bbounds.getSouth());
			}
			if ((startPoint.lat + d) > bbounds.getNorth()) {
				d = Math.abs(startPoint.lat - bbounds.getNorth());
			}
			if ((startPoint.lng - d) < bbounds.getWest()) {
				d = Math.abs(startPoint.lng - bbounds.getWest());
			}
			if ((startPoint.lng + d) > bbounds.getEast()) {
				d = Math.abs(startPoint.lng - bbounds.getEast());
			}
		}

		return d;
	}
};
