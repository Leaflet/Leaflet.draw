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
	},
	
	onAdd: function (map) {
		var className = 'leaflet-control-draw',
			container = L.DomUtil.create('div', ''),
			buttonIndex = 0, cancelButton;

		this._drawContainer = L.DomUtil.create('div', className),
		this._cancelContainer = L.DomUtil.create('div', className + ' leaflet-control-draw-cancel');
	
		// TODO: should this be done in initialize()?
		this._shapes = {};

		//
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
			this._initShapeHandler(L.Marker.Draw, this._drawContainer, buttonIndex++);
		}

		// Create the cancel button
		cancelButton = this._createButton(
			'Cancel drawing',
			'Cancel',
			'',
			this._cancelContainer,
			this._cancelDrawing,
			this
		);
		
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

		this._shapes[type].button = this._createButton(
			this.options.polyline.title,
			'',
			className + '-' + type,
			container,
			this._shapes[type].handler.enable,
			this._shapes[type].handler
		);

		this._shapes[type].buttonIndex = buttonIndex;

		this._shapes[type].handler
			.on('activated', this._drawHandlerActivated, this)
			.on('deactivated', this._drawHandlerDeactivated, this);
	},

	// TODO: take an options object to reduce variable clutter
	_createButton: function (title, text, className, container, fn, context) {
		var link = L.DomUtil.create('a', className, container);
		link.innerHTML = text;
		link.href = '#';
		link.title = title;

		L.DomEvent
			.on(link, 'click', L.DomEvent.stopPropagation)
			.on(link, 'mousedown', L.DomEvent.stopPropagation)
			.on(link, 'dblclick', L.DomEvent.stopPropagation)
			.on(link, 'click', L.DomEvent.preventDefault)
			.on(link, 'click', fn, context);

		return link;
	},

	_drawHandlerActivated: function (e) {
		var drawingType = e.drawingType;

		// Disable any active modes
		this._disableInactiveModes();
		
		this._showCancelButton(drawingType);
	},

	_drawHandlerDeactivated: function (e) {
		this._hideCancelButton();
	},

	// Need to disable the drawing modes if user clicks on another without disabling the current mode
	_disableInactiveModes: function () {
		for (var i in this._shapes) {
			// Check if is a property of this object and is enabled
			if (this._shapes.hasOwnProperty(i) && this._shapes[i].handler.enabled()) {
				this._shapes[i].handler.disable();
			}
		}
	},

	_showCancelButton: function (drawingType) {
		var buttonIndex = this._shapes[drawingType].buttonIndex,
			buttonHeight = 19, // TODO: this should be calculated
			buttonMargin = 5, // TODO: this should also be calculated
			cancelPosition = (buttonIndex * buttonHeight) + (buttonIndex * buttonMargin);
		
		// Correctly position the cancel button
		this._cancelContainer.style.marginTop = cancelPosition + 'px';

		// Show the cancel button
		// TODO: anitmation!
		this._cancelContainer.style.display = 'block';
	},

	_hideCancelButton: function () {
		// TODO: anitmation!
		this._cancelContainer.style.display = 'none';
	},

	_cancelDrawing: function (e) {
		// TODO: replace with more sophisticated method (of cancelling, like caching the active mode)
		this._disableInactiveModes();
	}
});

L.Map.addInitHook(function () {
	if (this.options.drawControl) {
		this.drawControl = new L.Control.Draw();
		this.addControl(this.drawControl);
	}
});
