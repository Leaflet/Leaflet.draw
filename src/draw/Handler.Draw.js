L.Handler.Draw = L.Handler.extend({
	includes: L.Mixin.Events,

	initialize: function (map, options) {
		this._map = map;
		this._container = map._container;
		this._overlayPane = map._panes.overlayPane;
		this._popupPane = map._panes.popupPane;

		// Merge default shapeOptions options with custom shapeOptions
		if (options && options.shapeOptions) {
			options.shapeOptions = L.Util.extend({}, this.options.shapeOptions, options.shapeOptions);
		}
		L.Util.extend(this.options, options);
	},

	enable: function () {
		this.fire('activated');
		this._map.fire('drawing', { drawingType: this.type });
		L.Handler.prototype.enable.call(this);
	},

	disable: function () {
		this._map.fire('drawing-disabled', { drawingType: this.type });
		L.Handler.prototype.disable.call(this);
	},
	
	addHooks: function () {
		if (this._map) {
			L.DomUtil.disableTextSelection();

			this._label = L.DomUtil.create('div', 'leaflet-draw-label', this._popupPane);
			this._singleLineLabel = false;

			L.DomEvent.addListener(this._container, 'keyup', this._cancelDrawing, this);
		}
	},

	removeHooks: function () {
		if (this._map) {
			L.DomUtil.enableTextSelection();

			this._popupPane.removeChild(this._label);
			delete this._label;

			L.DomEvent.removeListener(this._container, 'keyup', this._cancelDrawing);
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
	},

	// Cancel drawing when the escape key is pressed
	_cancelDrawing: function (e) {
		if (e.keyCode === 27) {
			this.disable();
		}
	}
});