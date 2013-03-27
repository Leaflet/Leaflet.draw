L.DrawToolbar = L.Toolbar.extend({

	options: {
		shapes: [
			{
				type: 'polyline',
				title: 'Draw a polyline'
			},
			{
				type: 'polygon',
				title: 'Draw a polygon'
			},
			{
				type: 'rectangle',
				title: 'Draw a rectangle'
			},
			{
				type: 'circle',
				title: 'Draw a circle'
			},
			{
				type: 'marker',
				title: 'Add a marker'
			}
		]
	},

	initialize: function (options) {
		L.Toolbar.prototype.initialize.call(this, options);
	},

	addToolbar: function (map) {
		var container = L.DomUtil.create('div', 'leaflet-draw-section'),
			buttonIndex = 0,
			buttonClassPrefix = 'leaflet-draw-draw';

		this._toolbarContainer = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');


		for (var i=0; i<this.options.shapes.length; i++) {
			var shapeOptions = this.options.shapes[i],
				drawObj = null;

			if (shapeOptions.typeOptions == 'polyline') {
				drawObj = new L.Draw.Polyline(map, shapeOptions);
			} else if (shapeOptions.type == 'polygon') {
				drawObj = new L.Draw.Polygon(map, shapeOptions);
			} else if (shapeOptions.type == 'rectangle') {
				drawObj = new L.Draw.Rectangle(map, shapeOptions);
			} else if (shapeOptions.type == 'circle') {
				drawObj = new L.Draw.Circle(map, shapeOptions);
			} else if (shapeOptions.type == 'marker') {
				drawObj = new L.Draw.Marker(map, shapeOptions);
			}

			if (drawObj != null) {
				this._initModeHandler(
					drawObj,
					this._toolbarContainer,
					buttonIndex++,
					buttonClassPrefix
				);
			}
		}

		// Save button index of the last button, -1 as we would have ++ after the last button
		this._lastButtonIndex = --buttonIndex;

		// Create the actions part of the toolbar
		this._actionsContainer = this._createActions([
			{
				title: 'Cancel drawing',
				text: 'Cancel',
				callback: this.disable,
				context: this
			}
		]);

		// Add draw and cancel containers to the control container
		container.appendChild(this._toolbarContainer);
		container.appendChild(this._actionsContainer);

		return container;
	},

	setOptions: function (options) {
		L.setOptions(this, options);

		for (var type in this._modes) {
			if (this._modes.hasOwnProperty(type) && options.hasOwnProperty(type)) {
				this._modes[type].handler.setOptions(options[type]);
			}
		}
	}
});
