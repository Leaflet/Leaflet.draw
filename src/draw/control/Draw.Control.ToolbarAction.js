L.Draw = L.Draw || {};
L.Draw.Control = L.Draw.Control || {};

L.Draw.Control.ToolbarAction = L.ToolbarAction.extend({
	options: {},

	initialize: function (map, options) {
		this._drawHandler = new options.DrawAction(map, options);

		this._drawHandler
			.on('enabled', this.enable, this)
			.on('disabled', this.disable, this);

		L.ToolbarAction.prototype.initialize.call(this, options);
	},

	enable: function () {
		if (this._enabled) { return; }

		L.ToolbarAction.prototype.enable.call(this);

		this._drawHandler.enable();
	},

	disable: function () {
		if (!this._enabled) { return; }

		L.ToolbarAction.prototype.disable.call(this);

		this._drawHandler.disable();
	}
});

L.Draw.Control.Circle = L.Draw.Control.ToolbarAction.extend({
	options: {
		subToolbar: new L.Toolbar({ actions: [L.Draw.Control.Cancel] }),

		toolbarIcon: {
			className: 'leaflet-draw-draw-circle',
			tooltip: L.drawLocal.draw.toolbar.buttons.circle
		}
	}
});

L.Draw.Control.Marker = L.Draw.Control.ToolbarAction.extend({
	options: {
		subToolbar: new L.Toolbar({ actions: [L.Draw.Control.Cancel] }),

		toolbarIcon: {
			className: 'leaflet-draw-draw-marker',
			tooltip: L.drawLocal.draw.toolbar.buttons.marker
		}
	}
});

L.Draw.Control.Polyline = L.Draw.Control.ToolbarAction.extend({
	options: {
		subToolbar: new L.Toolbar({ actions: [L.Draw.Control.Cancel, L.Draw.Control.RemoveLastPoint] }),

		toolbarIcon: {
			className: 'leaflet-draw-draw-polyline',
			tooltip: L.drawLocal.draw.toolbar.buttons.polyline
		}
	},

	deleteLastVertex: function () {
		this._drawHandler.deleteLastVertex();
	}
});

L.Draw.Control.Polygon = L.Draw.Control.Polyline .extend({
	options: {
		subToolbar: new L.Toolbar({ actions: [L.Draw.Control.Cancel, L.Draw.Control.RemoveLastPoint] }),

		toolbarIcon: {
			className: 'leaflet-draw-draw-polygon',
			tooltip: L.drawLocal.draw.toolbar.buttons.polygon
		}
	}
});

L.Draw.Control.Rectangle = L.Draw.Control.ToolbarAction.extend({
	options: {
		subToolbar: new L.Toolbar({ actions: [L.Draw.Control.Cancel] }),

		toolbarIcon: {
			className: 'leaflet-draw-draw-rectangle',
			tooltip: L.drawLocal.draw.toolbar.buttons.rectangle
		}
	}
});