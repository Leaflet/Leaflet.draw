/*L.Map.mergeOptions({
	editControl: true
});*/

L.Toolbar.Edit = L.Toolbar.extend({
	options: {
		edit: {
			title: 'Edit layers'
		},
		remove: {
			title: 'Delete layers'
		},
		snapping: {
			enabled: false,
			layer: [],
			sensitivity: 10
		},
		featureGroup: null, /* REQUIRED! TODO: perhaps if not set then all layers on the map are selectable? */
		selectedPathOptions: null // See Edit handler options, this is used to customize the style of selected paths
	},

	initialize: function (options) {
		L.Toolbar.prototype.initialize.call(this, options);

		this._selectedFeatureCount = 0;
	},
	
	addToolbar: function (map) {
		var container = L.DomUtil.create('div', 'leaflet-draw-section'),
			buttonIndex = 0,
			buttonClassPrefix = 'leaflet-draw-edit';

		this._toolbarContainer = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar'),

		this._map = map;

		if (this.options.edit) {
			this._initModeHandler(
				new L.Edit.Feature(map, {
					featureGroup: this.options.featureGroup,
					selectedPathOptions: this.options.selectedPathOptions
				}),
				this._toolbarContainer,
				buttonIndex++,
				buttonClassPrefix
			);
		}

		if (this.options.remove) {
			this._initModeHandler(
				new L.Delete.Feature(map, {
					featureGroup: this.options.featureGroup
				}),
				this._toolbarContainer,
				buttonIndex++,
				buttonClassPrefix
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
				callback: this.disable,
				context: this
			}
		]);

		// Add draw and cancel containers to the control container
		container.appendChild(this._toolbarContainer);
		container.appendChild(this._actionsContainer);

		return container;
	},

	disable: function () {
		if (!this.enabled()) { return; }

		this._activeMode.handler.revertLayers();
		
		L.Toolbar.prototype.disable.call(this);
	},

	_save: function () {
		this._activeMode.handler.disable();
	}
});
