/*L.Map.mergeOptions({
	editControl: true
});*/

L.Control.Edit = L.Control.Toolbar.extend({
	options: {
		position: 'topleft',
		edit: {
			title: 'Edit layers'
		},
		remove: {
			title: 'Delete layers'
		},
		featureGroup: null, /* REQUIRED! TODO: perhaps if not set then all layers on the map are selectable? */
		selectedPathOptions: null // See Edit handler options, this is used to customize the style of selected paths
	},

	initialize: function (options) {
		L.Control.Toolbar.prototype.initialize.call(this, options);

		this._selectedFeatureCount = 0;
	},
	
	onAdd: function (map) {
		var container = L.DomUtil.create('div', ''),
			buttonIndex = 0;

		this._toolbarContainer = L.DomUtil.create('div', 'leaflet-control-toolbar'),

		this._map = map;

		if (this.options.edit) {
			this._initModeHandler(
				new L.Edit.Feature(map, {
					featureGroup: this.options.featureGroup,
					selectedPathOptions: this.options.selectedPathOptions
				}),
				this._toolbarContainer,
				buttonIndex++,
				'leaflet-control-edit'
			);
		}

		if (this.options.remove) {
			this._initModeHandler(
				new L.Delete.Feature(map, {
					featureGroup: this.options.featureGroup
				}),
				this._toolbarContainer,
				buttonIndex++,
				'leaflet-control-edit'
			);
		}

		// Save button index of the last button, -1 as we would have ++ after the last button
		this._lastButtonIndex = --buttonIndex;

		// Create the actions part of the toolbar
		this._actionsContainer = this._createActions([
			{
				title: 'Save changes.',
				text: 'Save',
				callback: this._save,
				context: this
			},{
				title: 'Cancel editing, discards all changes.',
				text: 'Cancel',
				callback: this._cancel,
				context: this
			}
		]);

		// Add draw and cancel containers to the control container
		container.appendChild(this._toolbarContainer);
		container.appendChild(this._actionsContainer);

		return container;
	},

	_cancel: function () {
		this._activeMode.handler.revertLayers();
		this._activeMode.handler.disable();
	},

	_save: function () {
		this._activeMode.handler.disable();
	},

	_showCancelButton: function () {
		// TODO: check to see if this is the top of bottom button and add in the classes

		L.Control.Toolbar.prototype._showCancelButton.call(this);
	}
});

/* need to sort out how to do layerGroup
L.Map.addInitHook(function () {
	if (this.options.editControl) {
		this.editControl = new L.Control.Edit();
		this.addControl(this.editControl);
	}
});*/