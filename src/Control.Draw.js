L.Control.Draw = L.Control.extend({

	options: {
		position: 'topleft',
		draw: {},
		edit: false
	},

	initialize: function (options) {
		L.Control.prototype.initialize.call(this, options);

		var id, toolbar;

		this._toolbars = {};

		// Initialize toolbars
		if (this.options.draw) {
			toolbar = new L.Toolbar.Draw(this.options.draw);
			id = L.stamp(toolbar);
			this._toolbars[id] = toolbar;

			// Listen for when toolbar is enabled
			this._toolbars[id].on('enable', this._toolbarEnabled, this);
		}
		

		if (this.options.edit) {
			toolbar = new L.Toolbar.Edit(this.options.edit);
			id = L.stamp(toolbar);
			this._toolbars[id] = toolbar;

			// Listen for when toolbar is enabled
			this._toolbars[id].on('enable', this._toolbarEnabled, this);
		}
	},

	onAdd: function (map) {
		var container = L.DomUtil.create('div', '');

		for (var toolbarId in this._toolbars) {
			container.appendChild(this._toolbars[toolbarId].addToolbar(map));
		}

		return container;
	},

	onRemove: function (map) {
		for (var toolbarId in this._toolbars) {
			this._toolbars[tolbarId].removeToolbar();
		}
	},

	_toolbarEnabled: function (e) {
		var id = '' + L.stamp(e.target);

		for (var toolbarId in this._toolbars) {
			if (toolbarId !== id) {
				this._toolbars[toolbarId].disable();
			}
		}
	}
});

L.Map.mergeOptions({
	drawControl: false
});

L.Map.addInitHook(function () {
	if (this.options.drawControl) {
		this.drawControl = new L.Control.Draw();
		this.addControl(this.drawControl);
	}
});