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

    // @method formattedNumber(n, precision): string
    // Returns n in specified number format (if defined) and precision
    formattedNumber: function (n, precision) {
        var formatted = n.toFixed(precision);

        var format = L.drawLocal.format && L.drawLocal.format.numeric,
            delimiters = format && format.delimiters,
            thousands = delimiters && delimiters.thousands,
        	decimal = delimiters && delimiters.decimal;

        if (thousands || decimal) {
            var splitValue = formatted.split('.');
			formatted = thousands ? splitValue[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + thousands) : splitValue[0];
			decimal = decimal || '.';
            if (splitValue.length > 1) {
                formatted = formatted + decimal + splitValue[1];
            }
        }

        return formatted;
    },

	// @method readableArea(area, isMetric): string
	// Returns a readable area string in yards or metric
	readableArea: function (area, isMetric) {
		var areaStr;

		if (isMetric) {
			if (area >= 10000) {
				areaStr = L.GeometryUtil.formattedNumber(area * 0.0001, 2) + ' ha';
			} else {
				areaStr = L.GeometryUtil.formattedNumber(area, 2) + ' m&sup2;';
			}
		} else {
			area /= 0.836127; // Square yards in 1 meter

			if (area >= 3097600) { //3097600 square yards in 1 square mile
				areaStr = L.GeometryUtil.formattedNumber(area / 3097600, 2) + ' mi&sup2;';
			} else if (area >= 4840) {//48040 square yards in 1 acre
				areaStr = L.GeometryUtil.formattedNumber(area / 4840, 2) + ' acres';
			} else {
				areaStr = L.GeometryUtil.formattedNumber(Math.ceil(area)) + ' yd&sup2;';
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
				distanceStr = L.GeometryUtil.formattedNumber(distance / 1000, 2) + ' km';
			} else {
				distanceStr = L.GeometryUtil.formattedNumber(Math.ceil(distance)) + ' m';
			}
			break;
		case 'feet':
			distance *= 1.09361 * 3;
			distanceStr = L.GeometryUtil.formattedNumber(Math.ceil(distance)) + ' ft';

			break;
		case 'nauticalMile':
			distance *= 0.53996;
			distanceStr = L.GeometryUtil.formattedNumber(distance / 1000, 2) + ' nm';
			break;
		case 'yards':
		default:
			distance *= 1.09361;

			if (distance > 1760) {
				distanceStr = L.GeometryUtil.formattedNumber(distance / 1760, 2) + ' miles';
			} else {
				distanceStr = L.GeometryUtil.formattedNumber(Math.ceil(distance)) + ' yd';
			}
			break;
		}
		return distanceStr;
	}
});
