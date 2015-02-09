L.EditToolbar.Popup = L.Toolbar.Popup.extend({
	options: {
		actions: [
			L.Edit.Popup.Edit,
			L.Edit.Popup.Delete
		]
	},

	onAdd: function (map) {
		var shape = this._arguments[1];

		if (shape instanceof L.Marker) {
			/* Adjust the toolbar position so that it doesn't cover the marker. */
			this.options.anchor = L.point(shape.options.icon.options.popupAnchor);
		}

		L.Toolbar.Popup.prototype.onAdd.call(this, map);
	}
});