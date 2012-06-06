L.Handler.Draw = L.Handler.extend({
	initialize: function (map, options) {
		this._map = map;
		this._container = map._container;
		this._pane = map._panes.overlayPane;

		L.Util.setOptions(this, options);
	},
	
	addHooks: function () {
		if (this._map) {
			L.DomUtil.disableTextSelection();
			this._label = L.DomUtil.create('div', 'leaflet-draw-label', this._pane);
			this._singleLineLabel = false;
		}
	},

	removeHooks: function () {
		if (this._map) {
			L.DomUtil.enableTextSelection();
			this._pane.removeChild(this._label);
			delete this._label;
		}
	},

	_updateLabelText: function (text, subtext) {
		subtext = subtext || '';

		// update the vertical position (only if changed)
		if (subtext.length === 0 && !this._singleLineLabel) {
			L.DomUtil.addClass(this._label, 'leaflet-draw-label-single');
			this._singleLineLabel = true;
		}
		else if (subtext.length > 0 && this._singleLineLabel) {
			L.DomUtil.removeClass(this._label, 'leaflet-draw-label-single');
			this._singleLineLabel = false;
		}

		this._label.innerHTML =
			(subtext.length > 0 ? '<span class="leaflet-draw-label-subtext">' + subtext + '</span>' + '<br />' : '') +
			'<span>' + text + '</span>';
	},

	_updateLabelPosition: function (pos) {
		L.DomUtil.setPosition(this._label, pos);
	}
});