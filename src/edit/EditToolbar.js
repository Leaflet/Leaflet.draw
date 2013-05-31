/*L.Map.mergeOptions({
	editControl: true
});*/

L.EditToolbar = L.Toolbar.extend({
	options: {
		edit: {
			title: L.drawLocal.edit.toolbar.edit.title,
			selectedPathOptions: {
				color: '#fe57a1', /* Hot pink all the things! */
				opacity: 0.6,
				dashArray: '10, 10',

				fill: true,
				fillColor: '#fe57a1',
				fillOpacity: 0.1
			}
		},
		remove: {
			title: L.drawLocal.edit.toolbar.remove.title
		},
		featureGroup: null /* REQUIRED! TODO: perhaps if not set then all layers on the map are selectable? */
	},

	initialize: function (options) {
		// Need to set this manually since null is an acceptable value here
		if (options.edit && typeof options.edit.selectedPathOptions === 'undefined') {
			options.edit.selectedPathOptions = this.options.edit.selectedPathOptions;
		}

		options.edit = L.extend({}, this.options.edit, options.edit);
		options.remove = L.extend({}, this.options.remove, options.remove);

		L.Toolbar.prototype.initialize.call(this, options);

		this._selectedFeatureCount = 0;
	},

	addToolbar: function (map) {
		var container = L.DomUtil.create('div', 'leaflet-draw-section'),
			buttonIndex = 0,
			buttonClassPrefix = 'leaflet-draw-edit';

		this._toolbarContainer = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');

		this._map = map;

		if (this.options.edit) {
			this._initModeHandler(
				new L.EditToolbar.Edit(map, {
					featureGroup: this.options.featureGroup,
					selectedPathOptions: this.options.edit.selectedPathOptions
				}),
				this._toolbarContainer,
				buttonIndex++,
				buttonClassPrefix
			);
		}

		if (this.options.remove) {
			this._initModeHandler(
				new L.EditToolbar.Delete(map, {
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
				title: L.drawLocal.edit.toolbar.edit.save.title,
				text: L.drawLocal.edit.toolbar.edit.save.text,
				callback: this._save,
				context: this
			},
			{
				title: L.drawLocal.edit.toolbar.edit.cancel.title,
				text: L.drawLocal.edit.toolbar.edit.cancel.text,
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
		this._activeMode.handler.save();
		this._activeMode.handler.disable();
	}
});