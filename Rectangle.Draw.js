L.Rectangle.Draw = L.SimpleShape.Draw.extend({
	_initialLabelText: 'Click and drag to draw rectangle.',

	_drawShape: function (latlng) {
		if (!this._shape) {
			this._shape = new L.Rectangle(new L.LatLngBounds(this._startLatLng, latlng), this.options.shapeOptions);
			this._map.addLayer(this._shape);
		} else {
			this._shape.setBounds(new L.LatLngBounds(this._startLatLng, latlng));
		}
	},

	_fireCreatedEvent: function () {
		this._map.fire(
			'draw:rectangle-created',
			{ rect: new L.Rectangle(new L.LatLngBounds(this._startLatLng, this._endLatLng), this.options.shapeOptions) }
		);
	}
});