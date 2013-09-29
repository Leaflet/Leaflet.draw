/*L.Map.mergeOptions({
	editControl: true
});*/

L.EditToolbar = L.Toolbar.extend({
	options: {
		edit: {
			selectedPathOptions: {
				color: '#fe57a1', /* Hot pink all the things! */
				opacity: 0.6,
				dashArray: '10, 10',

				fill: true,
				fillColor: '#fe57a1',
				fillOpacity: 0.1
			}
		},
		remove: {},
		featureGroup: null /* REQUIRED! TODO: perhaps if not set then all layers on the map are selectable? */
	},

	initialize: function (options) {
		// Need to set this manually since null is an acceptable value here
		if (options.edit) {
			if (typeof options.edit.selectedPathOptions === 'undefined') {
				options.edit.selectedPathOptions = this.options.edit.selectedPathOptions;
			}
			options.edit = L.extend({}, this.options.edit, options.edit);
		}

		if (options.remove) {
			options.remove = L.extend({}, this.options.remove, options.remove);
		}

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
				buttonClassPrefix,
				L.drawLocal.edit.toolbar.buttons.edit
			);
			L.DomUtil.addClass(this._modes.edit.button, 'leaflet-draw-disabled');
		}

		if (this.options.remove) {
			this._initModeHandler(
				new L.EditToolbar.Delete(map, {
					featureGroup: this.options.featureGroup
				}),
				this._toolbarContainer,
				buttonIndex++,
				buttonClassPrefix,
				L.drawLocal.edit.toolbar.buttons.remove
			);
			L.DomUtil.addClass(this._modes.remove.button, 'leaflet-draw-disabled');
		}

		// Save button index of the last button, -1 as we would have ++ after the last button
		this._lastButtonIndex = --buttonIndex;

		// Create the actions part of the toolbar
		this._actionsContainer = this._createActions([
			{
				title: L.drawLocal.edit.toolbar.actions.save.title,
				text: L.drawLocal.edit.toolbar.actions.save.text,
				callback: this._save,
				context: this
			},
			{
				title: L.drawLocal.edit.toolbar.actions.cancel.title,
				text: L.drawLocal.edit.toolbar.actions.cancel.text,
				callback: this.disable,
				context: this
			}
		]);

		// Add draw and cancel containers to the control container
		container.appendChild(this._toolbarContainer);
		container.appendChild(this._actionsContainer);

		var self = this;
		this._map.on('draw:created', function (e) {
			if (self.options.edit) {
				L.DomUtil.removeClass(self._modes.edit.button, 'leaflet-draw-disabled');
			}
			if (self.options.remove) {
				L.DomUtil.removeClass(self._modes.remove.button, 'leaflet-draw-disabled');
			}
		});

		this._map.on('draw:deleted', function (e) {
			if (self.options.edit) {
				var editAvailable = false;
				var editLayers = self._modes.edit.handler._featureGroup._layers;
				for (var propE in editLayers) {
					if (editLayers.hasOwnProperty(propE)) {
						editAvailable = true;
						break;
					}
				}
				if (editAvailable) {
					L.DomUtil.removeClass(self._modes.edit.button, 'leaflet-draw-disabled');
				}
				else {
					L.DomUtil.addClass(self._modes.edit.button, 'leaflet-draw-disabled');
				}
			}

			if (self.options.remove) {
				var removeAvailable = false;
				var removeLayers = self._modes.remove.handler._deletableLayers._layers;
				for (var propR in removeLayers) {
					if (removeLayers.hasOwnProperty(propR)) {
						removeAvailable = true;
						break;
					}
				}

				if (removeAvailable) {
					L.DomUtil.removeClass(self._modes.remove.button, 'leaflet-draw-disabled');
				}
				else {
					L.DomUtil.addClass(self._modes.remove.button, 'leaflet-draw-disabled');
				}
			}


		});

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