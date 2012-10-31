/*
 * Initially adapted from Tom Nightingale's https://github.com/tnightingale/Leaflet.widget/blob/master/src/Select.js
 */
L.Edit = L.Edit || {};

L.Edit.Feature = L.Handler.extend({
	includes: L.Mixin.Events,

	options: {
		selectedPathOptions: {
			color: '#fe57a1', /* Hot pink all the things! */
			opacity: 0.6,
			dashArray: '10, 10',

			fill: true,
			fillColor: '#fe57a1',
			fillOpacity: 0.1
		}
	},

	initialize: function (map, options) {
		this._container = map._container;

		// Set options to the default unless already set
		options.selectedPathOptions = options.selectedPathOptions || this.options.selectedPathOptions;

		L.Util.setOptions(this, options);

		L.Handler.prototype.initialize.call(this, map);
	},

	enable: function () {
		this.fire('enabled');
		L.Handler.prototype.enable.call(this);
	},

	disable: function () {
		this.fire('disabled');
		L.Handler.prototype.disable.call(this);
	},

	addHooks: function () {
		if (this._map && this.options.selectableLayers) {
			this._selectableLayers = this.options.selectableLayers;

			if (!(this._selectableLayers instanceof L.LayerGroup) && !(this._selectableLayers instanceof L.FeatureGroup)) {
				throw new Error('options.selectableLayers must be a L.LayerGroup or L.FeatureGroup');
			}

			// Used to store the selected layers
			this._selected = L.layerGroup();

			this._selectableLayers.eachLayer(function (layer) {
				this._bind(layer);
			}, this);

			// Listen for new layers being added to the map
			this._map.on({
				layeradd: this._bind,
				layerremove: this._unbind
			}, this);
		}
	},

	removeHooks: function () {
		if (this._map && this._selectableLayers) {
			// Clean up selected layers.
			this._selectableLayers.eachLayer(function (layer) {
				this._unbind(layer);
			}, this);
			delete this._selected;

			this._map.off({
				layeradd: this._bind,
				layerremove: this._unbind
			}, this);
		}
	},

	select: function (e) {
		var layer = e.layer || e.target || e;

		if (!(layer instanceof L.Marker)) {
			layer.options.previousOptions = layer.options;
			layer.setStyle(this.options.selectedPathOptions);
		} else {
			this._toggleMarkerHighlight(layer);
		}

		layer
			.off('click', this.select)
			.on('click', this._deselect, this);

		this._selected.addLayer(layer);

		this._map.fire('feature-selected', { layer: layer });

		return false;
	},

	removeItems: function (callback) {
		if (!this.enabled()) {
			return;
		}

		this._selected.eachLayer(function (layer) {
			this._map.removeLayer(layer);
		}, this);
	},

	_deselect: function (e, permanent) {
		var layer = e.layer || e.target || e;

		if (!(layer instanceof L.Marker)) {
			// reset the layer style to what is was before being selected
			layer.setStyle(layer.options.previousOptions);
			// remove the cached options for the layer object
			delete layer.options.previousOptions;
		} else {
			this._toggleMarkerHighlight(layer);
		}

		layer.off('click', this._deselect, this);
		if (!permanent) {
			layer.on('click', this.select, this);
		}

		this._selected.removeLayer(layer);

		this._map.fire('feature-deselected', { layer: layer });
	},

	_bind: function (e) {
		var layer = e.layer ? e.layer : e;

		if (this._selectableLayers.hasLayer(layer)) {
			layer.on('click', this.select, this);
		}
	},

	_unbind: function (e) {
		var layer = e.layer ? e.layer : e;

		if (this._selectableLayers.hasLayer(layer) && this._selected.hasLayer(layer)) {
			this._deselect(layer, true);
		}
	},

	_toggleMarkerHighlight: function (marker) {
		// This is quite naughty, but I don't see another way of doing it. (short of setting a new icon)
		var icon = marker._icon;

		icon.style.display = 'none';

		if (L.DomUtil.hasClass(icon, 'leaflet-edit-marker-selected')) {
			L.DomUtil.removeClass(icon, 'leaflet-edit-marker-selected');
			// Offset as the border will make the icon move.
			this._offsetMarker(icon, -4);

		} else {
			L.DomUtil.addClass(icon, 'leaflet-edit-marker-selected');
			// Offset as the border will make the icon move.
			this._offsetMarker(icon, 4);
		}

		icon.style.display = '';
	},

	_offsetMarker: function (icon, offset) {
		var iconMarginTop = parseInt(icon.style.marginTop, 10) - offset,
			iconMarginLeft = parseInt(icon.style.marginLeft, 10) - offset;

		icon.style.marginTop = iconMarginTop + 'px';
		icon.style.marginLeft = iconMarginLeft + 'px';
	}
});

L.LayerGroup.include({
	hasLayer: function (layer) {
		return !!this._layers[L.Util.stamp(layer)];
	}
});