L.EditToolbar.Control = L.Toolbar.Control.extend({
	options: {
		className: 'leaflet-draw-toolbar',
		edit: {},
		remove: {},
		featureGroup: null /* REQUIRED! TODO: perhaps if not set then all layers on the map are selectable? */
	},

	initialize: function (options) {
		L.setOptions(this, options);

		this._actions = {};
		this.options.actions = {};

		if (this.options.edit) {
			this.options.actions.edit = {
				action: L.Edit.Control.Edit,
				options: L.Util.extend(this.options.edit, { featureGroup: this.options.featureGroup })
			}
		}

		if (this.options.remove) {
			this.options.actions.remove = {
				action: L.Edit.Control.Delete,
				options: L.Util.extend(this.options.edit, { featureGroup: this.options.featureGroup })
			}
		}

		L.Toolbar.Control.prototype.initialize.call(this, options);
	}
});

L.EditToolbar.Save = L.ToolbarAction.extend({
	options: {
		toolbarIcon: { html: 'Save' }
	},

	initialize: function (map, editing) {
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

	initialize: function (map, editing) {
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