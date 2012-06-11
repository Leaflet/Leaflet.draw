L.Map.mergeOptions({
	drawControl: false
});

L.Control.Draw = L.Control.extend({
	options: {
		position: 'topleft',
		drawPolyline: true,
		drawPolygon: true,
		drawRectangle: true
	},

	onAdd: function (map) {
		var className = 'leaflet-control-draw',
			container = L.DomUtil.create('div', className),
			handler;

		if (this.options.drawPolyline) {
			handler = new L.Polyline.Draw(map);
			this._createButton(
				'Draw a polyline',
				className + '-polyline',
				container,
				handler.enable,
				handler
			);
		}

		if (this.options.drawPolygon) {
			handler = new L.Polygon.Draw(map);
			this._createButton(
				'Draw a polygon',
				className + '-polygon',
				container,
				handler.enable,
				handler
			);
		}

		if (this.options.drawRectangle) {
			handler = new L.Rectangle.Draw(map);
			this._createButton(
				'Draw a rectangle',
				className + '-rectangle',
				container,
				handler.enable,
				handler
			);
		}

		if (this.options.drawRectangle) {
			handler = new L.Marker.Draw(map);
			this._createButton(
				'Add a marker',
				className + '-marker',
				container,
				handler.enable,
				handler
			);
		}
		
		return container;
	},

	_createButton: function (title, className, container, fn, context) {
		var link = L.DomUtil.create('a', className, container);
		link.href = '#';
		link.title = title;

		L.DomEvent
			.addListener(link, 'click', L.DomEvent.stopPropagation)
			.addListener(link, 'click', L.DomEvent.preventDefault)
			.addListener(link, 'click', fn, context);

		return link;
	}
});

L.Map.addInitHook(function () {
	if (this.options.drawControl) {
		this.drawControl = new L.Control.Draw();
		this.addControl(this.drawControl);
	}
});