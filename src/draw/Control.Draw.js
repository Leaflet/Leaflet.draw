L.Map.mergeOptions({
	drawControl: false
});

L.Control.Draw = L.Control.extend({

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
		var className = 'leaflet-control-draw',
			container = L.DomUtil.create('div', ''),
			buttonIndex = 0;

		this._drawContainer = L.DomUtil.create('div', className),
		this._cancelContainer = L.DomUtil.create('div', className + ' leaflet-control-draw-cancel');


		if (this.options.polyline) {
			this._initShapeHandler(L.Polyline.Draw, this._drawContainer, buttonIndex++);
		}

		if (this.options.polygon) {
			this._initShapeHandler(L.Polygon.Draw, this._drawContainer, buttonIndex++);
		}

		if (this.options.rectangle) {
			this._initShapeHandler(L.Rectangle.Draw, this._drawContainer, buttonIndex++);
		}

		if (this.options.circle) {
			this._initShapeHandler(L.Circle.Draw, this._drawContainer, buttonIndex++);
		}

		if (this.options.marker) {
			this._initShapeHandler(L.Marker.Draw, this._drawContainer, buttonIndex);
		}

		// Save button index of the last button
		this._lastButtonIndex = buttonIndex;

		// Create the cancel button
		this._createButton({
			title: 'Cancel drawing',
			text: 'Cancel',
			container: this._cancelContainer,
			callback: this._cancelDrawing,
			context: this
		});
		
		// Add draw and cancel containers to the control container
		container.appendChild(this._drawContainer);
		container.appendChild(this._cancelContainer);

		return container;
	},

	_initShapeHandler: function (Handler, container, buttonIndex) {
		// TODO: make as a part of options?
		var className = 'leaflet-control-draw',
			type = Handler.TYPE;

		this._shapes[type] = {};

		this._shapes[type].handler = new Handler(map, this.options[type]);

		this._shapes[type].button = this._createButton({
			title: this.options.polyline.title,
			className: className + '-' + type,
			container: container,
			callback: this._shapes[type].handler.enable,
			context: this._shapes[type].handler
		});

		this._shapes[type].buttonIndex = buttonIndex;

		this._shapes[type].handler
			.on('activated', this._drawHandlerActivated, this)
			.on('deactivated', this._drawHandlerDeactivated, this);
	},

	_createButton: function (options) {
		var link = L.DomUtil.create('a', options.className || '', options.container);
		link.href = '#';

		if (options.text) link.innerHTML = options.text;

		if (options.title) link.title = options.title;

		L.DomEvent
			.on(link, 'click', L.DomEvent.stopPropagation)
			.on(link, 'mousedown', L.DomEvent.stopPropagation)
			.on(link, 'dblclick', L.DomEvent.stopPropagation)
			.on(link, 'click', L.DomEvent.preventDefault)
			.on(link, 'click', options.callback, options.context);

		return link;
	},

	_drawHandlerActivated: function (e) {
		// Disable active mode (if present)
		if (this._activeShape && this._activeShape.handler.enabled()) {
			this._activeShape.handler.disable();
		}
		
		// Cache new active shape
		this._activeShape = this._shapes[e.drawingType];

		L.DomUtil.addClass(this._activeShape.button, 'leaflet-control-draw-button-enabled');

		this._showCancelButton();
	},

	_drawHandlerDeactivated: function (e) {
		this._hideCancelButton();

		L.DomUtil.removeClass(this._activeShape.button, 'leaflet-control-draw-button-enabled');

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
			L.DomUtil.addClass(this._drawContainer, 'leaflet-control-draw-cancel-top');
		}
		else if (buttonIndex === lastButtonIndex) {
			L.DomUtil.addClass(this._drawContainer, 'leaflet-control-draw-cancel-bottom');
		}

		// Show the cancel button
		// TODO: anitmation!
		this._cancelContainer.style.display = 'block';
	},

	_hideCancelButton: function () {
		// TODO: anitmation!
		this._cancelContainer.style.display = 'none';

		L.DomUtil.removeClass(this._drawContainer, 'leaflet-control-draw-cancel-top');
		L.DomUtil.removeClass(this._drawContainer, 'leaflet-control-draw-cancel-bottom');
	},

	_cancelDrawing: function (e) {
		this._activeShape.handler.disable();
	}
});

L.Map.addInitHook(function () {
	if (this.options.drawControl) {
		this.drawControl = new L.Control.Draw();
		this.addControl(this.drawControl);
	}
});
