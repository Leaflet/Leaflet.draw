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
		var prefixClassName = 'leaflet-control-edit',
			container = L.DomUtil.create('div', '');

		this._toolbarContainer = L.DomUtil.create('div', 'leaflet-control-toolbar'),
		this._cancelContainer = L.DomUtil.create('div', 'leaflet-control-toolbar-cancel');

		this._map = map;

		this._handler = new L.Feature.Edit(map, {
			selectableLayers: this.options.selectableLayers
		});

		// TODO: will need to refactor when add edit button (can't just show/hide cancel button)
		this._handler
			.on('enabled', this._showCancelButton, this)
			.on('disabled', this._hideCancelButton, this);

		this._map
			.on('feature-selected', this._featureSelected, this)
			.on('feature-deselected', this._featureDeselected, this);

		// TODO: way to disable the handler (cancel, esc?)

		// Create the select button
		this._createButton({
			title: 'Select items',
			className: prefixClassName + '-select',
			container: this._toolbarContainer,
			callback: this._handler.enable,
			context: this._handler
		});

		this._createCancelButton();

		if (this.options.edit) {
			// TODO
		}

		if (this.options.remove) {
			this._removeButton = this._createButton({
				title: 'Remove items',
				className: prefixClassName + '-remove leaflet-control-toolbar-button-disabled',
				container: this._toolbarContainer,
				callback: this._handler.removeItems,
				context: this._handler
			});
		}

		// Add draw and cancel containers to the control container
		container.appendChild(this._toolbarContainer);
		container.appendChild(this._cancelContainer);

		return container;
	},

	_cancel: function () {
		// TODO: when have edit button will need to know which button is active (select or edit)
		this._handler.disable();
	},

	_featureSelected: function () {
		this._selectedFeatureCount++;

		if (this.options.remove) {
			L.DomUtil.removeClass(this._removeButton, 'leaflet-control-toolbar-button-disabled');
		}
	},

	_featureDeselected: function () {
		this._selectedFeatureCount--;

		if (this._selectedFeatureCount <= 0 && this.options.remove) {
			L.DomUtil.addClass(this._removeButton, 'leaflet-control-toolbar-button-disabled');
		}
	},

	_showCancelButton: function () {
		// TODO: check to see if this is the top of bottom button and add in the classes

		L.Control.Toolbar.prototype._showCancelButton.call(this);
	}
});

/* need to sort out how to do selectableLayers
L.Map.addInitHook(function () {
	if (this.options.editControl) {
		this.editControl = new L.Control.Edit();
		this.addControl(this.editControl);
	}
});*/