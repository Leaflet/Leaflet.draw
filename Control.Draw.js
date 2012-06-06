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
			container = L.DomUtil.create('div', className);

		if (this.options.drawPolyline) {
			this._createButton(
				'Draw a polyline',
				className + '-polyline',
				container,
				map.polylineDraw.enable,
				map.polylineDraw
			);
		}

		if (this.options.drawPolygon) {
			this._createButton(
				'Draw a polygon',
				className + '-polygon',
				container,
				map.polygonDraw.enable,
				map.polygonDraw
			);
		}

		if (this.options.drawRectangle) {
			this._createButton(
				'Draw a rectangle',
				className + '-rectangle',
				container,
				map.rectangleDraw.enable,
				map.rectangleDraw
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