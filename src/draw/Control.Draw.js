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
	
		this._shapes = {};
	
		// TODO: refactor? not happy with this, is there a better way to avoid all the repitition?
		if (this.options.polyline) {
			this._shapes.polyline = {};

			this._shapes.polyline.handler = new L.Polyline.Draw(map, this.options.polyline);

			this._shapes.polyline.button = this._createButton(
				this.options.polyline.title,
				'',
				className + '-polyline',
				this._drawContainer,
				this._shapes.polyline.handler.enable,
				this._shapes.polyline.handler
			);

			this._shapes.polyline.buttonIndex = buttonIndex++;

			this._shapes.polyline.handler
				.on('activated', this._drawHandlerActivated, this)
				.on('deactivated', this._drawHandlerDeactivated, this);
		}

		if (this.options.polygon) {
			this._shapes.polygon = {};

			this._shapes.polygon.handler = new L.Polygon.Draw(map, this.options.polygon);

			this._shapes.polygon.button = this._createButton(
				this.options.polygon.title,
				'',
				className + '-polygon',
				this._drawContainer,
				this._shapes.polygon.handler.enable,
				this._shapes.polygon.handler
			);

			this._shapes.polygon.buttonIndex = buttonIndex++;

			this._shapes.polygon.handler
				.on('activated', this._drawHandlerActivated, this)
				.on('deactivated', this._drawHandlerDeactivated, this);
		}

		if (this.options.rectangle) {
			this._shapes.rectangle = {};

			this._shapes.rectangle.handler = new L.Rectangle.Draw(map, this.options.rectangle);

			this._shapes.rectangle.button = this._createButton(
				this.options.rectangle.title,
				'',
				className + '-rectangle',
				this._drawContainer,
				this._shapes.rectangle.handler.enable,
				this._shapes.rectangle.handler
			);

			this._shapes.rectangle.buttonIndex = buttonIndex++;

			this._shapes.rectangle.handler
				.on('activated', this._drawHandlerActivated, this)
				.on('deactivated', this._drawHandlerDeactivated, this);
		}

		if (this.options.circle) {
			this._shapes.circle = {};

			this._shapes.circle.handler = new L.Circle.Draw(map, this.options.circle);

			this._shapes.circle.button = this._createButton(
				this.options.circle.title,
				'',
				className + '-circle',
				this._drawContainer,
				this._shapes.circle.handler.enable,
				this._shapes.circle.handler
			);

			this._shapes.circle.buttonIndex = buttonIndex++;

			this._shapes.circle.handler
				.on('activated', this._drawHandlerActivated, this)
				.on('deactivated', this._drawHandlerDeactivated, this);
		}

		if (this.options.marker) {
			this._shapes.marker = {};

			this._shapes.marker.handler = new L.Marker.Draw(map, this.options.marker);

			this._shapes.marker.button = this._createButton(
				this.options.marker.title,
				'',
				className + '-marker',
				this._drawContainer,
				this._shapes.marker.handler.enable,
				this._shapes.marker.handler
			);

			this._shapes.marker.buttonIndex = buttonIndex++;

			this._shapes.marker.handler
				.on('activated', this._drawHandlerActivated, this)
				.on('deactivated', this._drawHandlerDeactivated, this);
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
		// Disable any active modes
		this._disableInactiveModes();
		
		this._showCancelButton();
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

	_showCancelButton: function () {
		var buttonNumber = 1 - 1,
			buttonHeight = 19, // TODO: this should be calculated
			buttonMargin = 5, // TODO: this should also be calculated
			cancelPosition = (buttonNumber * buttonHeight) + (buttonNumber * buttonMargin);
		
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
		// TODO: replace with more sophisticated method (of cancelling, like caching)
		this._disableInactiveModes();
	}
});

L.Map.addInitHook(function () {
	if (this.options.drawControl) {
		this.drawControl = new L.Control.Draw();
		this.addControl(this.drawControl);
	}
});
