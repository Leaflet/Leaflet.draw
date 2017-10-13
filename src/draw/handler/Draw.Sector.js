/**
 * @class L.Draw.Sector
 * @aka Draw.Sector
 * @inherits L.Draw.SimpleShape
 */
L.Draw.Sector = L.Draw.SimpleShape.extend({
	statics: {
		TYPE: 'sector'
	},

	options: {
		shapeOptions: {
			stroke: true,
			color: '#3388ff',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		},
		showRadius: true,
		metric: true, // Whether to use the metric measurement system or imperial
		feet: true, // When not metric, use feet instead of yards for display
		nautic: false // When not metric, not feet use nautic mile for display
	},

	// @method initialize(): void
	initialize: function (map, options) {
		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Sector.TYPE;

		this._initialLabelText = L.drawLocal.draw.handlers.sector.tooltip.start;

		L.Draw.SimpleShape.prototype.initialize.call(this, map, options);
	},

	_drawShape: function (latlng) {
		// Calculate the distance based on the version
		if(L.GeometryUtil.isVersion07x()){
			var distance = this._startLatLng.distanceTo(latlng);
		} else {
			var distance = this._map.distance(this._startLatLng, latlng);
		}
		
		if(distance == 0) {
			return;
		}
		
		// Little bug exists.
		var deltax = latlng.lng-this._startLatLng.lng,
			deltay = latlng.lat-this._startLatLng.lat;
		var direction = Math.atan(deltay/deltax)*180/Math.PI;
			direction = deltax<0?270-direction:90-direction;

		if (!this._shape) {
			this._shape = L.semiCircle(this._startLatLng, L.extend({
					radius: distance,
					startAngle: direction - 45,
					stopAngle: direction + 45
				}, this.options.shapeOptions));
			this._map.addLayer(this._shape);
		} else {
			this._shape.setDirection(direction, 90);
			this._shape.setRadius(distance);
		}
	},

	_fireCreatedEvent: function () {
		if (this._shape) {
			var sector = L.semiCircle(this._startLatLng, L.extend({
					radius: this._shape.getRadius(),
					startAngle: this._shape.options.startAngle,
					stopAngle: this._shape.options.stopAngle
				}, this.options.shapeOptions));
			L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, sector);
		}
	},

	_onMouseMove: function (e) {
		var latlng = e.latlng,
			showRadius = this.options.showRadius,
			useMetric = this.options.metric,
			radius;

		this._tooltip.updatePosition(latlng);
		if (this._isDrawing) {
			this._drawShape(latlng);
	
			if (this._shape) {
				// Get the new radius (rounded to 1 dp)
				radius = this._shape.getRadius().toFixed(1);

				var subtext = '';
				if (showRadius) {
					subtext = L.drawLocal.draw.handlers.circle.radius + ': ' +
							  L.GeometryUtil.readableDistance(radius, useMetric, this.options.feet, this.options.nautic);
				}
				this._tooltip.updateContent({
					text: this._endLabelText,
					subtext: subtext
				});
			}
		}
	}
});
