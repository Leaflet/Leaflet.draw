L.Draw = L.Draw || {};
/**
 * @class L.Draw.Tooltip
 * @aka Tooltip
 *
 * The tooltip class — it is used to display the tooltip while drawing
 * This will be depreciated
 *
 * @example
 *
 * ```js
 *    var tooltip = L.Draw.Tooltip();
 * ```
 *
 */
L.Draw.Tooltip = L.Class.extend({

	// @section Methods for modifying draw state

	options: {
		className: 'leaflet-draw-tooltip',
		classNamePrefix: 'leaflet-draw-tooltip-',
		errorClassName: 'leaflet-error-draw-tooltip'
	},

	_css: {
		css: function() {
			return this.options.className;
		},
		prefix: function(value) {
			return this.options.classNamePrefix + value;
		},
		error: function() {
			return this.options.errorClassName;
		}
	},

	// @method initialize(map, options): void
	// Tooltip constructor
	initialize: function (map, options) {
		L.setOptions(this, options);
		this._css.options = this.options;

		this._map = map;
		this._popupPane = map._panes.popupPane;

		this._container = map.options.drawControlTooltips ? L.DomUtil.create('div', this._css.css(), this._popupPane) : null;
		this._singleLineLabel = false;

		this._map.on('mouseout', this._onMouseOut, this);
	},

	// @method dispose(): void
	// Remove Tooltip DOM and unbind events
	dispose: function () {
		this._map.off('mouseout', this._onMouseOut, this);

		if (this._container) {
			this._popupPane.removeChild(this._container);
			this._container = null;
		}
	},

	// @method updateContent(labelText): this
	// Changes the tooltip text to string in function call
	updateContent: function (labelText) {
		if (!this._container) {
			return this;
		}
		labelText.subtext = labelText.subtext || '';

		// update the vertical position (only if changed)
		if (labelText.subtext.length === 0 && !this._singleLineLabel) {
			L.DomUtil.addClass(this._container, this._css.prefix('single'));
			this._singleLineLabel = true;
		}
		else if (labelText.subtext.length > 0 && this._singleLineLabel) {
			L.DomUtil.removeClass(this._container, this._css.prefix('single'));
			this._singleLineLabel = false;
		}

		this._container.innerHTML = labelText.subtext.length > 0 ?
				'<span class="' + this._css.prefix('subtext') + '">' + labelText.subtext + '</span><br />' :
				'';

		return this;
	},

	// @method updatePosition(latlng): this
	// Changes the location of the tooltip
	updatePosition: function (latlng) {
		var pos = this._map.latLngToLayerPoint(latlng),
			tooltipContainer = this._container;

		if (this._container) {
			tooltipContainer.style.visibility = 'inherit';
			L.DomUtil.setPosition(tooltipContainer, pos);
		}

		return this;
	},

	// @method showAsError(): this
	// Applies error class to tooltip
	showAsError: function () {
		if (this._container) {
			L.DomUtil.addClass(this._container, this._css.error());
		}
		return this;
	},

	// @method removeError(): this
	// Removes the error class from the tooltip
	removeError: function () {
		if (this._container) {
			L.DomUtil.removeClass(this._container, this._css.error());
		}
		return this;
	},

	_onMouseOut: function () {
		if (this._container) {
			this._container.style.visibility = 'hidden';
		}
	}
});
