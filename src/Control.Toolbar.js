L.Control.Toolbar = L.Control.extend({
	initialize: function (options) {
		L.Util.extend(this.options, options);

		this._modes = {};
	},

	_initModeHandler: function (handler, container, buttonIndex, classNamePredix) {
		var type = handler.type;

		this._modes[type] = {};

		this._modes[type].handler = handler;

		this._modes[type].button = this._createButton({
			title: this.options[type].title,
			className: classNamePredix + '-' + type,
			container: container,
			callback: this._modes[type].handler.enable,
			context: this._modes[type].handler
		});

		this._modes[type].buttonIndex = buttonIndex;

		this._modes[type].handler
			.on('enabled', this._handlerActivated, this)
			.on('disabled', this._handlerDeactivated, this);
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

	_handlerActivated: function (e) {
		// Disable active mode (if present)
		if (this._activeMode && this._activeMode.handler.enabled()) {
			this._activeMode.handler.disable();
		}
		
		// Cache new active feature
		this._activeMode = this._modes[e.handler];

		L.DomUtil.addClass(this._activeMode.button, 'leaflet-control-toolbar-button-enabled');

		this._showActionsToolbar();
	},

	_handlerDeactivated: function (e) {
		this._hideActionsToolbar();

		L.DomUtil.removeClass(this._activeMode.button, 'leaflet-control-toolbar-button-enabled');

		this._activeMode = null;
	},

	_createActions: function (buttons) {
		var container = L.DomUtil.create('ul', 'leaflet-control-toolbar-actions'),
			buttonWidth = 50,
			l = buttons.length,
			containerWidth = (l * buttonWidth) + (l - 1), //l - 1 = the borders
			li;

		for (var i = 0; i < l; i++) {
			li = L.DomUtil.create('li', '', container);

			this._createButton({
				title: buttons[i].title,
				text: buttons[i].text,
				container: li,
				callback: buttons[i].callback,
				context: buttons[i].context
			});
		}

		container.style.width = containerWidth + 'px';

		return container;
	},

	_showActionsToolbar: function () {
		var buttonIndex = this._activeMode.buttonIndex,
			lastButtonIndex = this._lastButtonIndex,
			buttonHeight = 25, // TODO: this should be calculated
			borderHeight = 1, // TODO: this should also be calculated
			toolbarPosition = 3 + (buttonIndex * buttonHeight) + (buttonIndex * borderHeight);
		
		// Correctly position the cancel button
		this._actionsContainer.style.top = toolbarPosition + 'px';

		// TODO: remove the top and button rounded border if first or last button
		if (buttonIndex === 0) {
			L.DomUtil.addClass(this._toolbarContainer, 'leaflet-control-toolbar-actions-top');
		}
		
		if (buttonIndex === lastButtonIndex) {
			L.DomUtil.addClass(this._toolbarContainer, 'leaflet-control-toolbar-actions-bottom');
		}
		
		this._actionsContainer.style.display = 'block';
	},

	_hideActionsToolbar: function () {
		this._actionsContainer.style.display = 'none';

		L.DomUtil.removeClass(this._toolbarContainer, 'leaflet-control-toolbar-actions-top');
		L.DomUtil.removeClass(this._toolbarContainer, 'leaflet-control-toolbar-actions-bottom');
	}
});