L.Map.mergeOptions({
	editControl: false
});

L.Control.Edit = L.Control.Toolbar.extend({
	options: {
		position: 'topleft',
		edit: true,
		remove: true,
		selectableLayers: null /* REQUIRED! TODO: perhaps if not set then all layers on the map are selectable? */
	},
	
	onAdd: function (map) {
		var className = 'leaflet-control-edit',
			container = L.DomUtil.create('div', className);

		this._handler = new L.Vector.Edit(map, {
			selectableLayers: this.options.selectableLayers
		});

		// TODO: way to disable the handler (cancel, esc?)

		// Create the select button
		this._createButton({
			title: 'Select items',
			className: className + '-select',
			container: container,
			callback: this._handler.enable,
			context: this._handler
		});		

		if (this.options.edit) {
			// TODO
		}

		if (this.options.remove) {
			this._createButton({
				title: 'Remove items',
				className: className + '-remove',
				container: container,
				callback: this._handler.removeItems,
				context: this._handler
			});
		}

		return container;
	}
});

/* need to sort out how to do selectableLayers
L.Map.addInitHook(function () {
	if (this.options.editControl) {
		this.editControl = new L.Control.Edit();
		this.addControl(this.editControl);
	}
});*/