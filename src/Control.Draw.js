L.Control.Draw = L.Control.extend({

	options: {
		position: 'topleft',
		draw: {},
		edit: false
	},

	initialize: function (options) {
		if (L.version < '0.7') {
			throw new Error('Leaflet.draw 0.2.3+ requires Leaflet 0.7.0+. Download latest from https://github.com/Leaflet/Leaflet/');
		}

		L.setOptions(this, options);

		L.Control.prototype.initialize.call(this, options);

		var position = { position: this.options.position },
			drawOptions = L.Util.extend(this.options.draw, position),
			editOptions = L.Util.extend(this.options.edit, position),
			id, toolbar;

		this._toolbars = {};

		// Initialize toolbars
		if (L.DrawToolbar.Control && this.options.draw) {
			toolbar = new L.DrawToolbar.Control(drawOptions);
			id = L.stamp(toolbar);
			this._toolbars[id] = toolbar;
		}

		if (L.EditToolbar.Control && this.options.edit) {
			toolbar = new L.EditToolbar.Control(editOptions);
			id = L.stamp(toolbar);
			this._toolbars[id] = toolbar;
		}
	},

	onAdd: function (map) {
		var container = L.DomUtil.create('div', 'leaflet-draw'),
			addedTopClass = false,
			topClassName = 'leaflet-draw-toolbar-top',
			toolbarContainer;

		for (var toolbarId in this._toolbars) {
			if (this._toolbars.hasOwnProperty(toolbarId)) {
				this._toolbars[toolbarId].addTo(map);
			}
		}

		return container;
	},

	onRemove: function (map) {
		for (var toolbarId in this._toolbars) {
			if (this._toolbars.hasOwnProperty(toolbarId)) {
				map.removeLayer(this._toolbars[toolbarId]);
			}
		}
	},

	setDrawingOptions: function (options) {
		for (var toolbarId in this._toolbars) {
			if (this._toolbars[toolbarId] instanceof L.DrawToolbar.Control) {
				this._toolbars[toolbarId].setOptions(options);
			}
		}
	}
});

L.Map.mergeOptions({
	drawControlTooltips: true,
	drawControl: false
});

L.Map.addInitHook(function () {
	if (this.options.drawControl) {
		this.drawControl = new L.Control.Draw();
		this.addControl(this.drawControl);
	}
});