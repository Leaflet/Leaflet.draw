L.Edit = L.Edit || {};
L.Edit.Popup = L.Edit.Popup || {};

L.Edit.Popup.Edit = L.ToolbarAction.extend({
	options: {
		toolbarIcon: { className: 'leaflet-draw-edit-edit' }
	},

	initialize: function (map, shape, options) {
		this._map = map;

		this._shape = shape;
		this._shape.options.editing = this._shape.options.editing || {};

		L.ToolbarAction.prototype.initialize.call(this, map, options);
	},

	enable: function () {
		var map = this._map,
			shape = this._shape;

		shape.editing.enable();
		map.removeLayer(this.toolbar);
		
		map.on('click', function () {
			shape.editing.disable();
		});
	}
});