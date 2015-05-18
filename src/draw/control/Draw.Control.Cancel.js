L.Draw = L.Draw || {};
L.Draw.Control = L.Draw.Control || {};

L.Draw.Control.Cancel = L.ToolbarAction.extend({
	options: {
		toolbarIcon: { html: 'Cancel' }
	},

	initialize: function (map, drawing) {
		this.drawing = drawing;
		L.ToolbarAction.prototype.initialize.call(this);
	},

	addHooks: function () {
		this.drawing.disable();
		this.disable();
	}
});