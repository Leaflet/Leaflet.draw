L.Handler.Draw = L.Handler.extend({
	initialize: function (map, options) {
		this._map = map;
		this._container = map._container;
		this._pane = map._panes.overlayPane;

		L.Util.setOptions(this, options);
	},
	
	addHooks: function () {
		if (this._map) {
			this._label = L.DomUtil.create('div', 'leaflet-draw-label', this._pane);
		}
	},

	removeHooks: function () {
		if (this._map) {
			this._pane.removeChild(this._label);
		}
	},

	_updateLabel: function (pos, text, subtext) {
		L.DomUtil.setPosition(this._label, pos);
		this._label.innerHTML =
			'<span>' + text + '</span>' +
			'<br />' +
			'<span class="leaflet-draw-label-subtext">' + subtext + '</span>';
	}
});