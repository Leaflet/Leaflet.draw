L.Map.mergeOptions({
	drawControl: false
});

L.Control.Draw = L.Control.Toolbar.extend({

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
	
	onAdd: function (map) {
		var container = L.DomUtil.create('div', ''),
			buttonIndex = 0;

		this._toolbarContainer = L.DomUtil.create('div', 'leaflet-control-toolbar');


		if (this.options.polyline) {
			this._initModeHandler(
				new L.Draw.Polyline(map, this.options.polyline),
				this._toolbarContainer,
				buttonIndex++,
				'leaflet-control-draw'
			);
		}

		if (this.options.polygon) {
			this._initModeHandler(
				new L.Draw.Polygon(map, this.options.polygon),
				this._toolbarContainer,
				buttonIndex++,
				'leaflet-control-draw'
			);
		}

		if (this.options.rectangle) {
			this._initModeHandler(
				new L.Draw.Rectangle(map, this.options.rectangle),
				this._toolbarContainer,
				buttonIndex++,
				'leaflet-control-draw'
			);
		}

		if (this.options.circle) {
			this._initModeHandler(
				new L.Draw.Circle(map, this.options.circle),
				this._toolbarContainer,
				buttonIndex++,
				'leaflet-control-draw'
			);
		}

		if (this.options.marker) {
			this._initModeHandler(
				new L.Draw.Marker(map, this.options.marker),
				this._toolbarContainer,
				buttonIndex++,
				'leaflet-control-draw'
			);
		}

		// Save button index of the last button, -1 as we would have ++ after the last button
		this._lastButtonIndex = --buttonIndex;

		// Create the actions part of the toolbar
		this._actionsContainer = this._createActions([
			{
				title: 'Cancel drawing',
				text: 'Cancel',
				callback: this._cancel,
				context: this
			}
		]);
		
		// Add draw and cancel containers to the control container
		container.appendChild(this._toolbarContainer);
		container.appendChild(this._actionsContainer);

		return container;
	},

	_cancel: function (e) {
		this._activeMode.handler.disable();
	}
});

L.Map.addInitHook(function () {
	if (this.options.drawControl) {
		this.drawControl = new L.Control.Draw();
		this.addControl(this.drawControl);
	}
});
