L.Map.mergeOptions({
	drawControl: false
});

L.Control.Draw = L.Control.extend({

	options: {
		position: 'topleft',
		shapes: [
			{
				name: 'polyline',
				type: 'polyline',
				title: 'Draw a polyline'
			},
			{
				name: 'polygon',
				type: 'polygon',
				title: 'Draw a polygon'
			},
			{
				name: 'rectangle',
				type: 'rectangle',
				title: 'Draw a rectangle'
			},
			{
				name: 'circle',
				type: 'circle',
				title: 'Draw a circle'
			},
			{
				name: 'marker',
				type: 'marker',
				title: 'Add a marker'
			}
		]
	},

	initialize: function (options) {
		L.Util.extend(this.options, options);
	},

	onAdd: function (map) {
		var className = 'leaflet-control-draw',
			container = L.DomUtil.create('div', className);

		this.handlers = {};

		for (var i=0; i<this.options.shapes.length; i++) {
			var options = this.options.shapes[i];

			if (options.type === 'polyline') {
				handler = new L.Polyline.Draw(map, options);

			} else if (options.type === 'polygon') {
				handler = new L.Polygon.Draw(map, options);

			} else if (options.type === 'rectangle') {
				handler = new L.Rectangle.Draw(map, options);

			} else if (options.type === 'circle') {
				handler = new L.Circle.Draw(map, options);

			} else if (options.type === 'marker') {
				handler = new L.Marker.Draw(map, options);

			} else {
				continue;
			}
			var cls = className + '-' + options.type;
			var identifier = options.type;
			if (options.name) {
				// add another class to distinguish items
				cls += ' ' + options.type + '-' + options.name;
				identifier += '-' + options.name;
			}

			this.handlers[identifier] = handler;
			this._createButton(
				options.title,
				cls,
				container,
				this.handlers[identifier].enable,
				this.handlers[identifier]
			);
			this.handlers[identifier].on('activated', this._disableInactiveModes, this);
		}
		
		return container;
	},

	_createButton: function (title, className, container, fn, context) {
		var link = L.DomUtil.create('a', className, container);
		link.href = '#';
		link.title = title;

		L.DomEvent
			.on(link, 'click', L.DomEvent.stopPropagation)
			.on(link, 'mousedown', L.DomEvent.stopPropagation)
			.on(link, 'dblclick', L.DomEvent.stopPropagation)
			.on(link, 'click', L.DomEvent.preventDefault)
			.on(link, 'click', fn, context);

		return link;
	},

	// Need to disable the drawing modes if user clicks on another without disabling the current mode
	_disableInactiveModes: function () {
		for (var i in this.handlers) {
			// Check if is a property of this object and is enabled
			if (this.handlers.hasOwnProperty(i) && this.handlers[i].enabled()) {
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
