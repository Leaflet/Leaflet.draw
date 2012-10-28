/*L.Map.mergeOptions({
	editControl: true
});*/

L.Control.Edit = L.Control.Toolbar.extend({
	options: {
		position: 'topleft',
		edit: true,
		remove: true,
		selectableLayers: null /* REQUIRED! TODO: perhaps if not set then all layers on the map are selectable? */
	},

	initialize: function (options) {
		L.Util.extend(this.options, options);

		this._selectedFeatureCount = 0;
	},
	
	onAdd: function (map) {
		var className = 'leaflet-control-toolbar',
			prefixClassName = 'leaflet-control-edit',
			container = L.DomUtil.create('div', className);

		this._map = map;

		this._handler = new L.Feature.Edit(map, {
			selectableLayers: this.options.selectableLayers
		});


		this._map
			.on('feature-selected', this._featureSelected, this)
			.on('feature-deselected', this._featureDeselected, this);

		// TODO: way to disable the handler (cancel, esc?)

		// Create the select button
		this._createButton({
			title: 'Select items',
			className: prefixClassName + '-select',
			container: container,
			callback: this._handler.enable,
			context: this._handler
		});

		if (this.options.edit) {
			// TODO
		}

		if (this.options.remove) {
			this._removeButton = this._createButton({
				title: 'Remove items',
				className: prefixClassName + '-remove leaflet-control-toolbar-button-disabled',
				container: container,
				callback: this._handler.removeItems,
				context: this._handler
			});
		}

		return container;
	},

	_featureSelected: function () {
		this._selectedFeatureCount++;

		if (this.options.edit) {
			L.DomUtil.removeClass(this._removeButton, 'leaflet-control-toolbar-button-disabled');
		}
	},

	_featureDeselected: function () {
		this._selectedFeatureCount--;

		if (this._selectedFeatureCount <= 0 && this.options.edit) {
			L.DomUtil.addClass(this._removeButton, 'leaflet-control-toolbar-button-disabled');
		}
	}
});

/* need to sort out how to do selectableLayers
L.Map.addInitHook(function () {
	if (this.options.editControl) {
		this.editControl = new L.Control.Edit();
		this.addControl(this.editControl);
	}
});*/