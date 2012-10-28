/*
 * Adapted from Tom Nightingale's https://github.com/tnightingale/Leaflet.widget/blob/master/src/Select.js
 */
L.Feature.Edit = L.Handler.extend({
	includes: L.Mixin.Events,

	options: {},

	initialize: function (map, options) {
		this._container = map._container;

		L.Util.setOptions(this, options);

		L.Handler.prototype.initialize.call(this, map);
	},

	enable: function () {
		this.fire('activated');
		L.Handler.prototype.enable.call(this);
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

		// TODO: cache the old colour and change back to it
		if (!(layer instanceof L.Marker)) {
			layer.setStyle({color: '#f00'});
		}

		layer
			.off('click', this.select)
			.on('click', this._deselect, this);

		this._selected.addLayer(layer);

		this._map.fire('feature-selected', { layer: layer });
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
			layer.setStyle({color: '#0f0'});
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
	}
});

L.LayerGroup.include({
	hasLayer: function (layer) {
		return !!this._layers[L.Util.stamp(layer)];
	}
});