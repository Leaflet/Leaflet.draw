/**
 * @class L.GeometryUtil
 * @aka GeometryUtil
 */
L.GeometryUtil = L.extend(L.GeometryUtil || {}, {
	// Ported from the OpenLayers implementation. See https://github.com/openlayers/openlayers/blob/master/lib/OpenLayers/Geometry/LinearRing.js#L270

	// @method geodesicArea(): number
	geodesicArea: function (latLngs) {
		var pointsCount = latLngs.length,
			area = 0.0,
			d2r = Math.PI / 180,
			p1, p2;

		if (pointsCount > 2) {
			for (var i = 0; i < pointsCount; i++) {
				p1 = latLngs[i];
				p2 = latLngs[(i + 1) % pointsCount];
				area += ((p2.lng - p1.lng) * d2r) *
						(2 + Math.sin(p1.lat * d2r) + Math.sin(p2.lat * d2r));
			}
			area = area * 6378137.0 * 6378137.0 / 2.0;
		}

		return Math.abs(area);
	},

	// @method readableArea(area, isMetric): string
	// Returns a readable area string in yards or metric
	readableArea: function (area, isMetric) {
		var areaStr;

		if (isMetric) {
			if (area >= 10000) {
				areaStr = (area * 0.0001).toFixed(2) + ' ha';
			} else {
				areaStr = area.toFixed(2) + ' m&sup2;';
			}
		} else {
			area /= 0.836127; // Square yards in 1 meter

			if (area >= 3097600) { //3097600 square yards in 1 square mile
				areaStr = (area / 3097600).toFixed(2) + ' mi&sup2;';
			} else if (area >= 4840) {//48040 square yards in 1 acre
				areaStr = (area / 4840).toFixed(2) + ' acres';
			} else {
				areaStr = Math.ceil(area) + ' yd&sup2;';
			}
		}

		return areaStr;
	},

	// @method readableDistance(distance, units): string
	// Converts a metric distance to one of [ feet, nauticalMile, metric or yards ] string
	//
	// @alternative
	// @method readableDistance(distance, isMetric, useFeet, isNauticalMile): string
	// Converts metric distance to distance string.
	readableDistance: function (distance, isMetric, isFeet, isNauticalMile) {
		var distanceStr,
			units;

		if (typeof isMetric == "string") {
			units = isMetric;
		} else {
			if (isFeet) {
				units = 'feet';
			} else if (isNauticalMile) {
				units = 'nauticalMile';
			} else if (isMetric) {
				units = 'metric';
			} else {
				units = 'yards';
			}
		}

		switch (units) {
		case 'metric':
			// show metres when distance is < 1km, then show km
			if (distance > 1000) {
				distanceStr = (distance / 1000).toFixed(2) + ' km';
			} else {
				distanceStr = Math.ceil(distance) + ' m';
			}
			break;
		case 'feet':
			distance *= 1.09361 * 3;
			distanceStr = Math.ceil(distance) + ' ft';

			break;
		case 'nauticalMile':
			distance *= 0.53996;
			distanceStr = (distance / 1000).toFixed(2) + ' nm';
			break;
		case 'yards':
		default:
			distance *= 1.09361;

			if (distance > 1760) {
				distanceStr = (distance / 1760).toFixed(2) + ' miles';
			} else {
				distanceStr = Math.ceil(distance) + ' yd';
			}
			break;
		}
		return distanceStr;
	}
});
