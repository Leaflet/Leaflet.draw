L.EditToolbar.Control = L.Toolbar.Control.extend({
	options: {
		actions: [
			L.Edit.Control.Edit,
			L.Edit.Control.Delete
		],
		className: 'leaflet-draw-toolbar'
	},

	/* Accomodate Leaflet.draw design decision to pass featureGroup as an option rather than a parameter. */
	_getActionConstructor: function (Action) {
		var map = this._arguments[0],
			featureGroup = this._arguments[1],
			A = L.Toolbar.prototype._getActionConstructor.call(this, Action);

		return A.extend({
			options: { featureGroup: featureGroup },
			initialize: function () {
				Action.prototype.initialize.call(this, map);
			}
		});
	}
});

L.EditToolbar.Save = L.ToolbarAction.extend({
	options: {
		toolbarIcon: { html: 'Save' }
	},
	initialize: function (map, featureGroup, editing) {
		this.editing = editing;
		L.ToolbarAction.prototype.initialize.call(this);
	},
	addHooks: function () {
		this.editing.save();
		this.editing.disable();
	}
});

L.EditToolbar.Undo = L.ToolbarAction.extend({
	options: {
		toolbarIcon: { html: 'Undo' }
	},
	initialize: function (map, featureGroup, editing) {
		this.editing = editing;
		L.ToolbarAction.prototype.initialize.call(this);
	},
	addHooks: function () {
		this.editing.revertLayers();
		this.editing.disable();
	}
});

/* Enable save and undo functionality for edit and delete modes. */
L.setOptions(L.Edit.Control.Delete.prototype, {
	subToolbar: new L.Toolbar({ actions: [L.EditToolbar.Save, L.EditToolbar.Undo] })
});

L.setOptions(L.Edit.Control.Edit.prototype, {
	subToolbar: new L.Toolbar({ actions: [L.EditToolbar.Save, L.EditToolbar.Undo] })
});