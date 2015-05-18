L.DrawToolbar.Control = L.Toolbar.Control.extend({
	options: {
		className: 'leaflet-draw-toolbar',
		polyline: {},
		polygon: {},
		rectangle: {},
		circle: {},
		marker: {}
	},

	initialize: function (options) {
		L.setOptions(this, options);

		this._actions = {};
		this.options.actions = {};

		if (this.options.polygon) {
			this.options.actions.polygon = {
				action: L.Draw.Polygon,
				options: this.options.polygon
			}
		}

		if (this.options.polyline) {
			this.options.actions.polyline = {
				action: L.Draw.Polyline,
				options: this.options.polyline
			}
		}

		if (this.options.circle) {
			this.options.actions.circle = {
				action: L.Draw.Circle,
				options: this.options.circle
			}
		}

		if (this.options.rectangle) {
			this.options.actions.rectangle = {
				action: L.Draw.Rectangle,
				options: this.options.rectangle
			}
		}

		if (this.options.marker) {
			this.options.actions.marker = {
				action: L.Draw.Marker,
				options: this.options.marker
			}
		}

		L.Toolbar.Control.prototype.initialize.call(this, options);
	},

	// Sets an actions options just in case we want to change options half way through.
	setOptions: function (options) {
		L.setOptions(this, options);

		for (var type in this._actions) {
			if (this._actions.hasOwnProperty(type) && options.hasOwnProperty(type)) {
				this._actions[type].setOptions(options[type]);
			}
		}
	}
});

L.Toolbar.Control.prototype.appendToContainer = function (container) {
	var baseClass = this.constructor.baseClass + '-' + this._calculateDepth(),
		className = baseClass + ' ' + this.options.className,
		Action, action,
		i, j, l, m;

	this._container = container;
	this._ul = L.DomUtil.create('ul', className, container);

	/* Ensure that clicks, drags, etc. don't bubble up to the map. */
	this._disabledEvents = ['click', 'mousemove', 'dblclick'];

	for (j = 0, m = this._disabledEvents.length; j < m; j++) {
		L.DomEvent.on(this._ul, this._disabledEvents[j], L.DomEvent.stopPropagation);
	}

	/* Instantiate each toolbar action and add its corresponding toolbar icon. */
	for (var actionIndex in this.options.actions) {
		Action = this._getActionConstructor(this.options.actions[actionIndex].action, this.options.actions[actionIndex].options);

		this._actions[actionIndex] = new Action();
		this._actions[actionIndex]._createIcon(this, this._ul, this._arguments);
	}
};

L.Toolbar.Control.prototype._getActionConstructor = function (Action, actionOptions) {
	var map = this._arguments[0],
		args = [map, actionOptions],
		toolbar = this;

	return Action.extend({
		initialize: function() {
			Action.prototype.initialize.apply(this, args);
		},
		enable: function() {
			/* Ensure that only one action in a toolbar will be active at a time. */
			if (toolbar._active) { toolbar._active.disable(); }
			toolbar._active = this;

			Action.prototype.enable.call(this);
		}
	});
};


/*L.Draw.Polygon.ToolbarAction = L.ToolbarAction.extend({
	options: {

	},

	initialize: function (options) {
		L.ToolbarAction.prototype.initialize.call(this, options);

		this._drawHandler = new L.draw.Polygon();
	},

	enable: function () {
		if (this._enabled) { return; }

		L.ToolbarAction.prototype.enable.call(this);

		this._drawHandler.enable();
	},

	disable: function () {
		if (!this._enabled) { return; }

		L.ToolbarAction.prototype.disable.call(this);

		this._drawHandler.disable();
	}
});*/

/* Include sub-toolbars. */
L.setOptions(L.Draw.Polygon.prototype, {
	subToolbar: new L.Toolbar({ actions: [L.Draw.Cancel, L.Draw.RemoveLastPoint] }),

	toolbarIcon: {
		className: 'leaflet-draw-draw-polygon',
		tooltip: L.drawLocal.draw.toolbar.buttons.polygon
	}
});

L.setOptions(L.Draw.Polyline.prototype, {
	subToolbar: new L.Toolbar({ actions: [L.Draw.Cancel, L.Draw.RemoveLastPoint] }),

	toolbarIcon: {
		className: 'leaflet-draw-draw-polyline',
		tooltip: L.drawLocal.draw.toolbar.buttons.polyline
	}
});

L.setOptions(L.Draw.Marker.prototype, {
	subToolbar: new L.Toolbar({ actions: [L.Draw.Cancel] }),

	toolbarIcon: {
		className: 'leaflet-draw-draw-marker',
		tooltip: L.drawLocal.draw.toolbar.buttons.marker
	}
});

L.setOptions(L.Draw.Rectangle.prototype, {
	subToolbar: new L.Toolbar({ actions: [L.Draw.Cancel] }),

	toolbarIcon: {
		className: 'leaflet-draw-draw-rectangle',
		tooltip: L.drawLocal.draw.toolbar.buttons.rectangle
	}
});

L.setOptions(L.Draw.Circle.prototype, {
	subToolbar: new L.Toolbar({ actions: [L.Draw.Cancel] }),

	toolbarIcon: {
		className: 'leaflet-draw-draw-circle',
		tooltip: L.drawLocal.draw.toolbar.buttons.circle
	}
});

