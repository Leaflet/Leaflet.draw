L.EditToolbar.Popup = L.Toolbar.Popup.extend({
	options: {
		actions: [
			L.Edit.Popup.Edit,
			L.Edit.Popup.Delete
		]
	}
});