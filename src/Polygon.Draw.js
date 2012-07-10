L.Polygon.Draw = L.Polyline.Draw.extend({
	Poly: L.Polygon,

	options: {
		shapeOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		}
	},

	_updateMarkerHandler: function () {
		// The first marker shold have a click handler to close the polygon
		if (this._markers.length === 1) {
			this._markers[0].on('click', this._finishShape, this);
			if (L.Browser.touch) {
				this._markers[0].on('touchend', this._finishShape, this);
			}
		}
	},

	_getLabelText: function () {
		var text;
		if (this._markers.length === 0) {
			text = (L.Browser.touch ? 'Tap' : 'Click') + ' to start drawing shape.';
		} else if (this._markers.length < 3) {
			text = (L.Browser.touch ? 'Tap' : 'Click') + ' to continue drawing shape.';
		} else {
			text = (L.Browser.touch ? 'Tap' : 'Click') + ' first point to close this shape.';
		}
		return {
			text: text
		};
	},

	_vertexAdded: function (latlng) {
	//calc area here
	},

	_cleanUpShape: function () {
		if (this._markers.length > 0) {
			this._markers[0].off('click', this._finishShape);
			if (L.Browser.touch) {
				this._markers[0].off('touchend', this._finishShape);
			}
		}
	}
});