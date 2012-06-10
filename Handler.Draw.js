L.Handler.Draw = L.Handler.extend({
	initialize: function (map, shapeOptions) {
		this._map = map;
		this._container = map._container;
		this._pane = map._panes.overlayPane;

		// Extend the shape options to include any customer parameters
		this.options.shapeOptions = L.Util.extend({}, this.options.shapeOptions, shapeOptions);
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

	_updateLabelText: function (labelText) {
		labelText.subtext = labelText.subtext || '';

		// update the vertical position (only if changed)
		if (labelText.subtext.length === 0 && !this._singleLineLabel) {
			L.DomUtil.addClass(this._label, 'leaflet-draw-label-single');
			this._singleLineLabel = true;
		}
		else if (labelText.subtext.length > 0 && this._singleLineLabel) {
			L.DomUtil.removeClass(this._label, 'leaflet-draw-label-single');
			this._singleLineLabel = false;
		}

		this._label.innerHTML =
			(labelText.subtext.length > 0 ? '<span class="leaflet-draw-label-subtext">' + labelText.subtext + '</span>' + '<br />' : '') +
			'<span>' + labelText.text + '</span>';
	},

	_updateLabelPosition: function (pos) {
		L.DomUtil.setPosition(this._label, pos);
	}
});