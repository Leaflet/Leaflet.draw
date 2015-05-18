L.Draw = L.Draw || {};
L.Draw.Control = L.Draw.Control || {};

L.Draw.Control.RemoveLastPoint = L.ToolbarAction.extend({
	options: {
		toolbarIcon: { html: 'Delete last point' }
	},

	initialize: function (map, drawing) {
		this.drawing = drawing;
		L.ToolbarAction.prototype.initialize.call(this);
	},

	addHooks: function () {
		this.drawing.deleteLastVertex();
		this.disable();
	}
});