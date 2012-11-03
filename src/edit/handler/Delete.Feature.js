L.Delete = L.Delete || {};

L.Delete.Feature = L.Handler.extend({
	statics: {
		TYPE: 'remove' // not delete as delete is reserved in js
	},

	includes: L.Mixin.Events,

	/*
	 TODO:
	 	- when layers are removed from the layergroup then remove them from here
	 */ 

	initialize: function (map, options) {
		L.Handler.prototype.initialize.call(this, map);

		L.Util.setOptions(this, options);

		// Store the selectable layer group for ease of access
		this._deletableLayers = this.options.layerGroup;

		if (!(this._deletableLayers instanceof L.LayerGroup) && !(this._deletableLayers instanceof L.FeatureGroup)) {
			throw new Error('options.layerGroup must be a L.LayerGroup or L.FeatureGroup');
		}

		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Delete.Feature.TYPE;
	},

	enable: function () {
		L.Handler.prototype.enable.call(this);
		this.fire('enabled', { handler: this.type});
	},

	disable: function (revert) {
		L.Handler.prototype.disable.call(this);
		this.fire('disabled', { handler: this.type});
	},

	addHooks: function () {
		if (this._map) {
			this._deletableLayers.eachLayer(function (layer) {
				layer.on('click', this._removeLayer, this);
			}, this);

			this._deletedLayers = new L.layerGroup();
		}
	},

	removeHooks: function () {
		if (this._map) {
			this._deletableLayers.eachLayer(function (layer) {
				layer.off('click', this._removeLayer);
			}, this);

			this._deletedLayers.clearLayers();
			this._deletedLayers = null;
		}
	},

	revertLayers: function () {
		// iterate of the deleted layers and add them back into the layergroup
		this._deletedLayers.eachLayer(function (layer) {
			this._deletableLayers.addLayer(layer);
		}, this);
	},

	_removeLayer: function (e) {
		var layer = e.layer || e.target || e;

		this._deletableLayers.removeLayer(layer);

		this._deletedLayers.addLayer(layer);
	}
});

// TODO: should this be added to Leaflet core?
L.LayerGroup.include({
	hasLayer: function (layer) {
		return !!this._layers[L.Util.stamp(layer)];
	}
});
