/*L.Map.mergeOptions({
	editControl: true
});*/

L.SplitToolbar = L.Toolbar.extend({
	options: {
		split: {
			title: 'Split the layers'
		},
		
		featureGroup: null /* REQUIRED! TODO: perhaps if not set then all layers on the map are selectable? */
	},

	initialize: function (options) {
		L.Toolbar.prototype.initialize.call(this, options);

		this._selectedFeatureCount = 0;
	},

	addToolbar: function (map) {
		var container = L.DomUtil.create('div', 'leaflet-draw-section'),
			buttonIndex = 0,
			buttonClassPrefix = 'leaflet-draw-split';

		this._toolbarContainer = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar'),

		this._map = map;

		
		this._initModeHandler(
			new L.SplitToolbar.Split(map, {
				featureGroup: this.options.featureGroup
			}),
			this._toolbarContainer,
			buttonIndex++,
			buttonClassPrefix
		);
		

		// Save button index of the last button, -1 as we would have ++ after the last button
		this._lastButtonIndex = --buttonIndex;

		// Create the actions part of the toolbar
		this._actionsContainer = this._createActions(
			[{
				title: 'Save changes.',
				text: 'Save',
				callback: this._save,
				context: this
			}, {
				title: 'Cancel editing, discards all changes.',
				text: 'Cancel',
				callback: this.disable,
				context: this
			}]
		);
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
		this._activeMode.handler.save();
		this._activeMode.handler.disable();
	}
});