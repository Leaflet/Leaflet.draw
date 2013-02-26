L.EditToolbar.Edit = L.Handler.extend({
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
		this._featureGroup = this.options.featureGroup;

		if (!(this._featureGroup instanceof L.FeatureGroup)) {
			throw new Error('options.featureGroup must be a L.FeatureGroup');
		}

		this._uneditedLayerProps = {};

		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.EditToolbar.Edit.TYPE;
	},

	enable: function () {
		if (this._enabled) { return; }

		L.Handler.prototype.enable.call(this);

		this._featureGroup
			.on('layeradd', this._enableLayerEdit, this)
			.on('layerremove', this._disableLayerEdit, this);

		this.fire('enabled', {handler: this.type});
	},

	disable: function () {
		if (!this._enabled) { return; }

		this.fire('disabled', {handler: this.type});

		this._featureGroup
			.off('layeradd', this._enableLayerEdit)
			.off('layerremove', this._disableLayerEdit);

		L.Handler.prototype.disable.call(this);
	},

	addHooks: function () {
		if (this._map) {
			this._featureGroup.eachLayer(this._enableLayerEdit, this);

			this._tooltip = new L.Tooltip(this._map);
			this._tooltip.updateContent({ text: 'Drag handles, or marker to edit feature.', subtext: 'Click cancel to undo changes.' });

			this._map.on('mousemove', this._onMouseMove, this);
		}
	},

	removeHooks: function () {
		if (this._map) {
			// Clean up selected layers.
			this._featureGroup.eachLayer(this._disableLayerEdit, this);

			// Clear the backups of the original layers
			this._uneditedLayerProps = {};

			this._tooltip.dispose();
			this._tooltip = null;

			this._map.off('mousemove', this._onMouseMove);
		}
	},

	revertLayers: function () {
		this._featureGroup.eachLayer(function (layer) {
			this._revertLayer(layer);
		}, this);
	},

	save: function () {
		var editedLayers = new L.LayerGroup();
		this._featureGroup.eachLayer(function (layer) {
			if (layer.edited) {
				editedLayers.addLayer(layer);
				layer.edited = false;
			}
		});
		this._map.fire('draw:edited', {layers: editedLayers});
	},

	_backupLayer: function (layer) {
		var id = L.Util.stamp(layer);

		if (!this._uneditedLayerProps[id]) {
			// Polyline, Polygon or Rectangle
			if (layer instanceof L.Polyline || layer instanceof L.Polygon || layer instanceof L.Rectangle) {
				this._uneditedLayerProps[id] = {
					latlngs: L.LatLngUtil.cloneLatLngs(layer.getLatLngs())
				};
			} else if (layer instanceof L.Circle) {
				this._uneditedLayerProps[id] = {
					latlng: L.LatLngUtil.cloneLatLng(layer.getLatLng()),
					radius: layer.getRadius()
				};
			} else { // Marker
				this._uneditedLayerProps[id] = {
					latlng: L.LatLngUtil.cloneLatLng(layer.getLatLng())
				};
			}
		}
	},

	_revertLayer: function (layer) {
		var id = L.Util.stamp(layer);
		layer.edited = false;
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

	_enableLayerEdit: function (e) {
		var layer = e.layer || e.target || e,
			options = L.Util.extend({}, this.options.selectedPathOptions);

		// Back up this layer (if haven't before)
		this._backupLayer(layer);

		// Update layer style so appears editable
		if (layer instanceof L.Marker) {
			this._toggleMarkerHighlight(layer);
		} else {
			layer.options.previousOptions = layer.options;

			// Make sure that Polylines are not filled
			if (!(layer instanceof L.Circle) && !(layer instanceof L.Polygon) && !(layer instanceof L.Rectangle)) {
				options.fill = false;
			}

			layer.setStyle(options);
		}

		if (layer instanceof L.Marker) {
			layer.dragging.enable();
			layer.on('dragend', this._onMarkerDragEnd);
		} else {
			layer.editing.enable();
		}
	},

	_disableLayerEdit: function (e) {
		var layer = e.layer || e.target || e;
		layer.edited = false;

		// Reset layer styles to that of before select
		if (layer instanceof L.Marker) {
			this._toggleMarkerHighlight(layer);
		} else {
			// reset the layer style to what is was before being selected
			layer.setStyle(layer.options.previousOptions);
			// remove the cached options for the layer object
			delete layer.options.previousOptions;
		}

		if (layer instanceof L.Marker) {
			layer.dragging.disable();
			layer.off('dragend', this._onMarkerDragEnd);
		} else {
			layer.editing.disable();
		}
	},

	_onMarkerDragEnd: function (e) {
		var layer = e.target;
		layer.edited = true;
	},

	_onMouseMove: function (e) {
		this._tooltip.updatePosition(e.latlng);
	}
});