L.Edit = L.Edit || {};

L.Edit.Feature = L.Handler.extend({
	statics: {
		TYPE: 'edit'
	},

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
		L.Handler.prototype.initialize.call(this, map);

		// Set options to the default unless already set
		options.selectedPathOptions = options.selectedPathOptions || this.options.selectedPathOptions;

		L.Util.setOptions(this, options);

		// Store the selectable layer group for ease of access
		this._layerGroup = this.options.layerGroup;

		if (!(this._layerGroup instanceof L.LayerGroup) && !(this._layerGroup instanceof L.FeatureGroup)) {
			throw new Error('options.layerGroup must be a L.LayerGroup or L.FeatureGroup');
		}

		this._uneditedLayerProps = {};

		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Edit.Feature.TYPE;
	},

	enable: function () {
		L.Handler.prototype.enable.call(this);

		this.fire('enabled', { handler: this.type});
	},

	disable: function () {
		this.fire('disabled', { handler: this.type});
		L.Handler.prototype.disable.call(this);
	},

	addHooks: function () {
		if (this._map) {
			this._layerGroup.eachLayer(function (layer) {
				// Back up this layer (if haven't before)
				this._backupLayer(layer);

				// Update layer style so appears editable
				if (layer instanceof L.Marker) {
					this._toggleMarkerHighlight(layer);
				} else {
					layer.options.previousOptions = layer.options;
					layer.setStyle(this.options.selectedPathOptions);
				}

				this._enableLayerEdit(layer);
			}, this);
		}
	},

	removeHooks: function () {
		if (this._map) {
			// Clean up selected layers.
			this._layerGroup.eachLayer(function (layer) {
				// Reset layer styles to that of before select
				if (layer instanceof L.Marker) {
					this._toggleMarkerHighlight(layer);
				} else {
					// reset the layer style to what is was before being selected
					layer.setStyle(layer.options.previousOptions);
					// remove the cached options for the layer object
					delete layer.options.previousOptions;
				}

				this._disableLayerEdit(layer);
			}, this);

			// Clear the backups of the original layers
			this._uneditedLayerProps = {};
		}
	},

	revertLayers: function () {
		this._layerGroup.eachLayer(function (layer) {
			this._revertLayer(layer);
		}, this);
	},

	_backupLayer: function (layer) {
		var id = L.Util.stamp(layer), latlng;

		if (!this._uneditedLayerProps[id]) {
			// Polyline, Polygon or Rectangle
			if (layer instanceof L.Polyline || layer instanceof L.Polygon || layer instanceof L.Rectangle) {
				this._uneditedLayerProps[id] = {
					latlngs: this._cloneLatLngs(layer.getLatLngs())
				};
			} else if (layer instanceof L.Circle) {
				this._uneditedLayerProps[id] = {
					latlng: this._cloneLatLng(layer.getLatLng()),
					radius: layer.getRadius()
				};
			} else { // Marker
				this._uneditedLayerProps[id] = {
					latlng: this._cloneLatLng(layer.getLatLng())
				};
			}
		}
	},

	_revertLayer: function (layer) {
		var id = L.Util.stamp(layer);

		if (this._uneditedLayerProps.hasOwnProperty(id)) {
			// Polyline, Polygon or Rectangle
			if (layer instanceof L.Polyline || layer instanceof L.Polygon || layer instanceof L.Rectangle) {
				layer.setLatLngs(this._uneditedLayerProps[id].latlngs);
			} else if (layer instanceof L.Circle) {
				layer.setLatLng(this._uneditedLayerProps[id].latlng);
				layer.setRadius(this._uneditedLayerProps[id].radius);
			} else { // Marker
				layer.setLatLng(this._uneditedLayerProps[id].latlng);
			}
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
	},

	_enableLayerEdit: function (layer) {
		// currently only supports polygon & polylines
		if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
			layer.editing.enable();
		} else if (layer instanceof L.Marker) {
			layer.dragging.enable();
		}

		// TODO: Rectangle and Circle
	},

	_disableLayerEdit: function (layer) {
		// currently only supports polygon & polylines
		if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
			layer.editing.disable();
		} else if (layer instanceof L.Marker) {
			layer.dragging.disable();
		}

		// TODO: Rectangle and Circle
	},





	// TODO: move!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

	// Clones a LatLngs[], returns [][]
	_cloneLatLngs: function (latlngs) {
		var clone = [];
		for (var i = 0, l = latlngs.length; i < l; i++) {
			// NOTE: maybe should try to get a clone method added to L.LatLng
			clone.push(this._cloneLatLng(latlngs[i]));
		}
		return clone;
	},

	// NOTE: maybe should get this added to Leaflet core? Also doesn't support if LatLng should be wrapped
	_cloneLatLng: function (latlng) {
		return L.latLng(latlng.lat, latlng.lng);
	}

	// TODO: move!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
});