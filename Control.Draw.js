L.Map.mergeOptions({
	drawControl: false
});

L.Control.Draw = L.Control.extend({
	options: {
		position: 'topleft',
		drawPolyline: true,
		drawPolygon: true,
		drawRectangle: true,
		shapeOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,

			fill: false,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,

			clickable: false
		}
	},

	onAdd: function (map) {
		var className = 'leaflet-control-draw',
			container = L.DomUtil.create('div', className),
			handler;

		if (this.options.drawPolyline) {
			handler = new L.Polyline.Draw(map, this.options.shapeOptions);
			this._createButton(
				'Draw a polyline',
				className + '-polyline',
				container,
				handler.enable,
				handler
			);
		}

		if (this.options.drawPolygon) {
			handler = new L.Polygon.Draw(map, this.options.shapeOptions);
			this._createButton(
				'Draw a polygon',
				className + '-polygon',
				container,
				handler.enable,
				handler
			);
		}

		if (this.options.drawRectangle) {
			handler = new L.Rectangle.Draw(map, this.options.shapeOptions);
			this._createButton(
				'Draw a rectangle',
				className + '-rectangle',
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