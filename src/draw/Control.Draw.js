L.Map.mergeOptions({
	drawControl: false
});

L.Control.Draw = L.Control.Toolbar.extend({

	options: {
		position: 'topleft',
		polyline: {
			title: 'Draw a polyline'
		},
		polygon: {
			title: 'Draw a polygon'
		},
		rectangle: {
			title: 'Draw a rectangle'
		},
		circle: {
			title: 'Draw a circle'
		},
		marker: {
			title: 'Add a marker'
		}
	},

	initialize: function (options) {
		L.Util.extend(this.options, options);

		this._shapes = {};
	},
	
	onAdd: function (map) {
		var container = L.DomUtil.create('div', ''),
			buttonIndex = 0;

		this._toolbarContainer = L.DomUtil.create('div', 'leaflet-control-toolbar'),
		this._cancelContainer = L.DomUtil.create('div', 'leaflet-control-toolbar-cancel');


		if (this.options.polyline) {
			this._initFeatureHandler(L.Polyline.Draw, this._toolbarContainer, buttonIndex++);
		}

		if (this.options.polygon) {
			this._initFeatureHandler(L.Polygon.Draw, this._toolbarContainer, buttonIndex++);
		}

		if (this.options.rectangle) {
			this._initFeatureHandler(L.Rectangle.Draw, this._toolbarContainer, buttonIndex++);
		}

		if (this.options.circle) {
			this._initFeatureHandler(L.Circle.Draw, this._toolbarContainer, buttonIndex++);
		}

		if (this.options.marker) {
			this._initFeatureHandler(L.Marker.Draw, this._toolbarContainer, buttonIndex);
		}

		// Save button index of the last button
		this._lastButtonIndex = buttonIndex;

		this._createCancelButton();
		
		// Add draw and cancel containers to the control container
		container.appendChild(this._toolbarContainer);
		container.appendChild(this._cancelContainer);

		return container;
	},

	_initFeatureHandler: function (Handler, container, buttonIndex) {
		// TODO: make as a part of options?
		var classNamePredix = 'leaflet-control-draw',
			type = Handler.TYPE;

		this._shapes[type] = {};

		this._shapes[type].handler = new Handler(map, this.options[type]);

		this._shapes[type].button = this._createButton({
			title: this.options[type].title,
			className: classNamePredix + '-' + type,
			container: container,
			callback: this._shapes[type].handler.enable,
			context: this._shapes[type].handler
		});

		this._shapes[type].buttonIndex = buttonIndex;

		this._shapes[type].handler
			.on('enabled', this._drawHandlerActivated, this)
			.on('disabled', this._drawHandlerDeactivated, this);
	},

	_drawHandlerActivated: function (e) {
		// Disable active mode (if present)
		if (this._activeShape && this._activeShape.handler.enabled()) {
			this._activeShape.handler.disable();
		}
		
		// Cache new active shape
		this._activeShape = this._shapes[e.drawingType];

		L.DomUtil.addClass(this._activeShape.button, 'leaflet-control-toolbar-button-enabled');

		this._showCancelButton();
	},

	_drawHandlerDeactivated: function (e) {
		this._hideCancelButton();

		L.DomUtil.removeClass(this._activeShape.button, 'leaflet-control-toolbar-button-enabled');

		this._activeShape = null;
	},

	_showCancelButton: function () {
		var buttonIndex = this._activeShape.buttonIndex,
			lastButtonIndex = this._lastButtonIndex,
			buttonHeight = 19, // TODO: this should be calculated
			buttonMargin = 5, // TODO: this should also be calculated
			cancelPosition = (buttonIndex * buttonHeight) + (buttonIndex * buttonMargin);
		
		// Correctly position the cancel button
		this._cancelContainer.style.marginTop = cancelPosition + 'px';

		// TODO: remove the top and button rounded border if first or last button
		if (buttonIndex === 0) {
			L.DomUtil.addClass(this._toolbarContainer, 'leaflet-control-toolbar-cancel-top');
		}
		else if (buttonIndex === lastButtonIndex) {
			L.DomUtil.addClass(this._toolbarContainer, 'leaflet-control-toolbar-cancel-bottom');
		}

		L.Control.Toolbar.prototype._showCancelButton.call(this);
	},

	_cancel: function (e) {
		this._activeShape.handler.disable();
	}
});

L.Map.addInitHook(function () {
	if (this.options.drawControl) {
		this.drawControl = new L.Control.Draw();
		this.addControl(this.drawControl);
	}
});
