L.Map.mergeOptions({
	drawControl: false
});

L.Control.Draw = L.Control.extend({

	options: {
		position: 'topleft',
		polyline: {
			title: 'Draw a polyline'
		},
		polygon: {
			title: 'Draw a polygon'
		},
		rectangle: {
			title: 'Draw a rectangle'
		},
		circle: {
			title: 'Draw a circle'
		},
		marker: {
			title: 'Add a marker'
		}
	},

	handlers: {},
	
	initialize: function (options) {
		L.Util.extend(this.options, options);
	},
	
	onAdd: function (map) {
		var className = 'leaflet-control-draw',
			container = L.DomUtil.create('div', className);

		if (this.options.polyline) {
			this.handlers.polyline = new L.Polyline.Draw(map, this.options.polyline);
			this._createButton(
				this.options.polyline.title,
				className + '-polyline',
				container,
				this.handlers.polyline.enable,
				this.handlers.polyline
			);
			this.handlers.polyline.on('activated', this._disableInactiveModes, this);
		}

		if (this.options.polygon) {
			this.handlers.polygon = new L.Polygon.Draw(map, this.options.polygon);
			this._createButton(
				this.options.polygon.title,
				className + '-polygon',
				container,
				this.handlers.polygon.enable,
				this.handlers.polygon
			);
			this.handlers.polygon.on('activated', this._disableInactiveModes, this);
		}

		if (this.options.rectangle) {
			this.handlers.rectangle = new L.Rectangle.Draw(map, this.options.rectangle);
			this._createButton(
				this.options.rectangle.title,
				className + '-rectangle',
				container,
				this.handlers.rectangle.enable,
				this.handlers.rectangle
			);
			this.handlers.rectangle.on('activated', this._disableInactiveModes, this);
		}

		if (this.options.circle) {
			this.handlers.circle = new L.Circle.Draw(map, this.options.circle);
			this._createButton(
				this.options.circle.title,
				className + '-circle',
				container,
				this.handlers.circle.enable,
				this.handlers.circle
			);
			this.handlers.circle.on('activated', this._disableInactiveModes, this);
		}

		if (this.options.marker) {
			this.handlers.marker = new L.Marker.Draw(map, this.options.marker);
			this._createButton(
				this.options.marker.title,
				className + '-marker',
				container,
				this.handlers.marker.enable,
				this.handlers.marker
			);
			this.handlers.marker.on('activated', this._disableInactiveModes, this);
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
	},

	// Need to disable the drawing modes if user clicks on another without disabling the current mode
	_disableInactiveModes: function () {
		for (var i in this.handlers) {
			// Check if is a property of this object and is enabled
			if (this.handlers.hasOwnProperty(i) && this.handlers[i].enabled) {
				this.handlers[i].disable();
			}
		}
	}
});

L.Map.addInitHook(function () {
	if (this.options.drawControl) {
		this.drawControl = new L.Control.Draw();
		this.addControl(this.drawControl);
	}
});