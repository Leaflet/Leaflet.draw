/**
 * @class L.Draw.Circle
 * @aka Draw.Circle
 * @inherits L.Draw.SimpleShape
 */
L.Draw.Circle = L.Draw.SimpleShape.extend({
	statics: {
		TYPE: 'circle'
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
		this.type = L.Draw.Circle.TYPE;

		this._initialLabelText = L.drawLocal.draw.handlers.circle.tooltip.start;

		L.Draw.SimpleShape.prototype.initialize.call(this, map, options);
	},

	_drawShape: function (latlng) {
        var boundRadius;
        if (this._map.options.maxBounds) {
            boundRadius = L.LatLngUtil.radiusToBounds(this._map.options.maxBounds, this._startLatLng, latlng);
        }
        else {
            boundRadius = this._startLatLng.distanceTo(latlng);
        }
        
		if (!this._shape) {
			this._shape = new L.Circle(this._startLatLng, boundRadius, this.options.shapeOptions);
			this._map.addLayer(this._shape);
		} else {
			this._shape.setRadius(boundRadius);
		}
	},

	_fireCreatedEvent: function () {
		var circle = new L.Circle(this._startLatLng, this._shape.getRadius(), this.options.shapeOptions);
		L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, circle);
	},

	_onMouseMove: function (e) {
		// first grab the original mouseMarker latlng here instead of the event latlng so that snap works correctly
        // if we're not using snap, these two will be the same.
        var snappedLatLng = this._mouseMarker.getLatLng();
		var latlng = e.latlng;
		this._mouseMarker.setLatLng(latlng);
		this._tooltip.updatePosition(snappedLatLng);
        
		if (this._isDrawing) {
			this._drawShape(snappedLatLng);

			// Get the new radius (rounded to 1 dp)
			var radius = this._shape.getRadius().toFixed(1);

			var subtext = '';
			if (this.options.showRadius) {
				subtext = L.drawLocal.draw.handlers.circle.radius + ': ' +
						  L.GeometryUtil.readableDistance(radius, this.options.metric, this.options.feet, this.options.nautic);
			}
			this._tooltip.updateContent({
				text: this._endLabelText,
				subtext: subtext
			});
		}
	}
});
