/**
 * @class L.Draw.Toolbar
 * @aka Toolbar
 *
 * The toolbar class of the API — it is used to create the ui
 * This will be depreciated
 *
 * @example
 *
 * ```js
 *    var toolbar = L.Toolbar();
 *    toolbar.addToolbar(map);
 * ```
 *
 * ### Disabling a toolbar
 *
 * If you do not want a particular toolbar in your app you can turn it off by setting the toolbar to false.
 *
 * ```js
 *      var drawControl = new L.Control.Draw({
 *          draw: false,
 *          edit: {
 *              featureGroup: editableLayers
 *          }
 *      });
 * ```
 *
 * ### Disabling a toolbar item
 *
 * If you want to turn off a particular toolbar item, set it to false. The following disables drawing polygons and
 * markers. It also turns off the ability to edit layers.
 *
 * ```js
 *      var drawControl = new L.Control.Draw({
 *          draw: {
 *              polygon: false,
 *              marker: false
 *          },
 *          edit: {
 *              featureGroup: editableLayers,
 *              edit: false
 *          }
 *      });
 * ```
 */
L.Draw.Toolbar = L.Class.extend({
	includes: [L.Mixin.Events],

	options: {
		buttonClassNamePrefix: 'leaflet-draw-button-',
		toolbarContainerClassName: 'leaflet-draw-section',
		toolbarClassName: 'leaflet-draw-toolbar leaflet-bar',
		toolbarClassNamePrefix: 'leaflet-draw-toolbar-',
		toolbarEmptyClassName: 'leaflet-draw-toolbar-empty',
		actionsClassName: 'leaflet-draw-actions',
		actionsClassNamePrefix: 'leaflet-draw-actions-'
	},

	_css: {
		toolbar: {
			container: function() {
				return this.options.toolbarContainerClassName;
			},
			css: function() {
				return this.options.toolbarClassName;
			},
			empty: function() {
				return this.options.toolbarEmptyClassName;
			},
			prefix: function(value) {
				return this.options.toolbarClassNamePrefix + value;
			}
		},
		actions: {
			css: function() {
				return this.options.actionsClassName;
			},
			prefix: function(value) {
				return this.options.actionsClassNamePrefix + value;
			}
		},
		button: {
			prefix: function(value) {
				return this.options.buttonClassNamePrefix + value;
			}
		}
	},

	// @section Methods for modifying the toolbar

	// @method initialize(options): void
	// Toolbar constructor
	initialize: function (options) {
		L.setOptions(this, options);

		this._modes = {};
		this._actionButtons = [];
		this._activeMode = null;

		this._css.toolbar.options = this.options;
		this._css.actions.options = this.options;
		this._css.button.options = this.options;
	},

	// @method enabled(): boolean
	// Gets a true/false of whether the toolbar is enabled
	enabled: function () {
		return this._activeMode !== null;
	},

	// @method disable(): void
	// Disables the toolbar
	disable: function () {
		if (!this.enabled()) {
			return;
		}

		this._activeMode.handler.disable();
	},

	// @method addToolbar(map): L.DomUtil
	// Adds the toolbar to the map and returns the toolbar dom element
	addToolbar: function (map) {
		var container = L.DomUtil.create('div', this._css.toolbar.container()),
			buttonIndex = 0,
			modeHandlers = this.getModeHandlers(map),
			type,
			handler,
			i;

		this._toolbarContainer = L.DomUtil.create('div', this._css.toolbar.css());
		this._map = map;

		for (i = 0; i < modeHandlers.length; i++) {
			handler = modeHandlers[i].handler;
			if (modeHandlers[i].enabled) {
				type = handler.type;
				this._initModeHandler(
					handler,
					modeHandlers[i].available !== false,
					this._toolbarContainer,
					modeHandlers[i].className,
					buttonIndex++,
					modeHandlers[i].title
				);
			}
			map.on('draw:enable:' + type, handler.enable, handler);
			map.on('draw:available:' + type, this._createAvailableCallback(type), this);
		}

		// TODO: could collapse this into a single listener
		map.on('draw:available', this._availableButtons, this);
		map.on('draw:available:all', this._availableButtons, this);
		map.on('draw:available:none', this._unavailableButtons, this);
		map.on('draw:unavailable', this._unavailableButtons, this);

		if (!buttonIndex) {
			return;
		}

		// Save button index of the last button, -1 as we would have ++ after the last button
		this._lastButtonIndex = --buttonIndex;

		// Create empty actions part of the toolbar
		this._actionsContainer = L.DomUtil.create('ul', this._css.actions.css());

		// Add draw and cancel containers to the control container
		container.appendChild(this._toolbarContainer);
		container.appendChild(this._actionsContainer);

		// listen for redraw events
		this.on('redraw', this._redraw, this);

		return container;
	},

	_availableButtons: function(handlers) {
		var all = handlers.type === 'draw:available:all';
		for (var handlerId in this._modes) {
			if (this._modes.hasOwnProperty(handlerId) && (all || handlers.hasOwnProperty(handlerId))) {
				if (handlers[handlerId]) {
					this._available(handlerId, handlers[handlerId]);
				} else {
					this._unavailable(handlerId, handlers[handlerId]);
				}
			}
		}
	},

	_unavailableButtons: function(handlers) {
		var all = handlers.type === 'draw:available:none';
		for (var handlerId in this._modes) {
			if (this._modes.hasOwnProperty(handlerId) && (all || handlers.hasOwnProperty(handlerId))) {
				this._unavailable(handlerId);
			}
		}
	},

	_createAvailableCallback: function(handlerId) {
		return function(options) {
			this._available(handlerId, options);
		};
	},

	// @method removeToolbar(): void
	// Removes the toolbar and drops the handler event listeners
	removeToolbar: function (map) {
		var handler;

		// stop listening for redraw events
		this.off('redraw');

		map.off('draw:available', this._availableButtons, this);
		map.off('draw:available:all', this._availableButtons, this);
		map.off('draw:available:none', this._unavailableButtons, this);
		map.off('draw:unavailable', this._unavailableButtons, this);

		// Dispose each handler
		for (var handlerId in this._modes) {
			if (this._modes.hasOwnProperty(handlerId)) {
				handler = this._modes[handlerId].handler;
				// Unbind handler button
				this._disposeButton(
					this._modes[handlerId].button,
					handler.enable,
					handler
				);

				// Make sure is disabled
				handler.disable();

				// Remove map event
				map.off('draw:enable:' + handlerId, handler.enable, handler);
				map.off('draw:available:' + handlerId, null, this); // TODO: test that this does disable the event

				// Unbind handler
				handler.off('enabled', this._handlerActivated, this);
				handler.off('disabled', this._handlerDeactivated, this);
			}
		}
		this._modes = {};

		// Dispose the actions toolbar
		for (var i = 0, l = this._actionButtons.length; i < l; i++) {
			this._disposeButton(
				this._actionButtons[i].button,
				this._actionButtons[i].callback,
				this
			);
		}
		this._actionButtons = [];
		this._actionsContainer = null;
	},

	_initModeHandler: function (handler, available, container, cssClassName, buttonIndex, buttonTitle) {
		var type = handler.type;

		this._modes[type] = {};
		this._modes[type].handler = handler;
		this._modes[type].available = available;
		this._modes[type].cssClassName = cssClassName;
		this._modes[type].button = this._createButton({
			type: type,
			title: buttonTitle,
			container: container,
			callback: this._modes[type].handler.enable,
			context: this._modes[type].handler,
			cssClassName: cssClassName,
			style: 'button'
		});
		this._modes[type].buttonIndex = buttonIndex;

		this._modes[type].handler
			.on('enabled', this._handlerActivated, this)
			.on('disabled', this._handlerDeactivated, this);
	},

	_redraw: function(options) {
		var available;

		if (options.handlers) {
			for (var handlerId in options.handlers) {
				if (this._modes.hasOwnProperty(handlerId) && options.handlers.hasOwnProperty(handlerId)) {
					available = options.handlers[handlerId].available !== false;
					this._modes[handlerId].available = available;
				}
			}
		}

		this._redrawButtons();
	},

	_redrawButtons: function() {
		var button,
			buttonCssClassName;

		for (var handlerId in this._modes) {
			if (this._modes.hasOwnProperty(handlerId)) {
				button = this._modes[handlerId].button;
				if (button) {
					buttonCssClassName = this._createButtonCssClasses({
						cssClassName: this._modes[handlerId].cssClassName,
						type: handlerId
					});
					button.className = buttonCssClassName;
				}
			}
		}
	},

	_createButton: function (options) {
		var buttonCssClasses = this._createButtonCssClasses(options),
			link = L.DomUtil.create('a', buttonCssClasses, options.container);
		link.href = '#';

		if (options.text) {
			link.innerHTML = options.text;
		}

		if (options.title) {
			link.title = options.title;
		}

		L.DomEvent
			.on(link, 'click', L.DomEvent.stopPropagation)
			.on(link, 'mousedown', L.DomEvent.stopPropagation)
			.on(link, 'dblclick', L.DomEvent.stopPropagation)
			.on(link, 'click', L.DomEvent.preventDefault)
			.on(link, 'click', function() {
				this._checkAvailabilityExecuteCallback(options);
			}, this);

		return link;
	},

	_createButtonCssClasses: function (options) {
		var cssClass = this._css.button.prefix(options.type);
		if (this._checkAvailability(options.style, options.type)) {
			cssClass += ' ' + this._css.button.prefix('available');
		} else {
			cssClass += ' ' + this._css.button.prefix('unavailable');
		}
		if (options.cssClassName) {
			cssClass += ' ' + options.cssClassName;
		}

		return cssClass;
	},

	_available: function(handlerId, options) {
		if (this._modes[handlerId]) {
			this._modes[handlerId].available = true;
			this._updateHandlerOptions(this._modes[handlerId].handler);
			this._redrawButtons();
		}
	},

	_updateHandlerOptions: function(handler, options) {
		if (handler && options && options.options) {
			L.setOptions(handler.options, options.options);
		}
	},

	_unavailable: function(handlerId) {
		if (this._modes[handlerId]) {
			this._modes[handlerId].available = false;
			this._redrawButtons();
		}
	},

	_checkAvailabilityExecuteCallback: function(options) {
		if (this._checkAvailability(options.style, options.type)) {
			if (options.callback) {
				options.callback.apply(options.context);
			}
		}
	},

	_checkAvailability: function(handlerType, handlerId) {
		return handlerType === 'action' || (this._modes[handlerId] && this._modes[handlerId].available);
	},

	_disposeButton: function (button, callback) {
		L.DomEvent
			.off(button, 'click', L.DomEvent.stopPropagation)
			.off(button, 'mousedown', L.DomEvent.stopPropagation)
			.off(button, 'dblclick', L.DomEvent.stopPropagation)
			.off(button, 'click', L.DomEvent.preventDefault);
		if (callback) {
			L.DomEvent.off(button, 'click', callback);
		}
	},

	_handlerActivated: function (e) {
		// Disable active mode (if present)
		this.disable();

		// Cache new active feature
		this._activeMode = this._modes[e.handler];

		L.DomUtil.addClass(this._activeMode.button, this._css.toolbar.prefix('button-enabled'));

		this._showActionsToolbar();

		this.fire('enable');
	},

	_handlerDeactivated: function () {
		this._hideActionsToolbar();

		L.DomUtil.removeClass(this._activeMode.button, this._css.toolbar.prefix('button-enabled'));

		this._activeMode = null;

		this.fire('disable');
	},

	_createActions: function (handler) {
		var container = this._actionsContainer,
			buttons = this.getActions(handler),
			l = buttons.length,
			li, di, dl, button, buttonAction;

		container.className = this._css.actions.css() + ' ' + this._css.actions.prefix(handler.type);

		// Dispose the actions toolbar (todo: dispose only not used buttons)
		for (di = 0, dl = this._actionButtons.length; di < dl; di++) {
			this._disposeButton(this._actionButtons[di].button, this._actionButtons[di].callback);
		}
		this._actionButtons = [];

		// Remove all old buttons
		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}

		for (var i = 0; i < l; i++) {
			if ('enabled' in buttons[i] && !buttons[i].enabled) {
				continue;
			}

			buttonAction = handler.type + (buttons[i].type ? '-' + buttons[i].type : '');
			li = L.DomUtil.create('li', this._css.actions.prefix('button') + ' ' + this._css.actions.prefix(buttonAction), container);

			button = this._createButton({
				title: buttons[i].title,
				text: buttons[i].text,
				container: li,
				callback: buttons[i].callback,
				context: buttons[i].context,
				type: buttonAction,
				style: 'action'
			});

			this._actionButtons.push({
				button: button,
				callback: buttons[i].callback
			});
		}
	},

	_showActionsToolbar: function () {
		var buttonIndex = this._activeMode.buttonIndex,
			lastButtonIndex = this._lastButtonIndex,
			toolbarPosition = this._activeMode.button.offsetTop - 1;

		// Recreate action buttons on every click
		this._createActions(this._activeMode.handler);

		// Correctly position the cancel button
		this._actionsContainer.style.top = toolbarPosition + 'px';

		if (buttonIndex === 0) {
			L.DomUtil.addClass(this._toolbarContainer, this._css.toolbar.prefix('notop'));
			L.DomUtil.addClass(this._actionsContainer, this._css.actions.prefix('top'));
		}

		if (buttonIndex === lastButtonIndex) {
			L.DomUtil.addClass(this._toolbarContainer, this._css.toolbar.prefix('nobottom'));
			L.DomUtil.addClass(this._actionsContainer, this._css.actions.prefix('bottom'));
		}

		this._actionsContainer.style.display = 'block';
	},

	_hideActionsToolbar: function () {
		this._actionsContainer.style.display = 'none';

		L.DomUtil.removeClass(this._toolbarContainer, this._css.toolbar.prefix('notop'));
		L.DomUtil.removeClass(this._toolbarContainer, this._css.toolbar.prefix('nobottom'));
		L.DomUtil.removeClass(this._actionsContainer, this._css.actions.prefix('top'));
		L.DomUtil.removeClass(this._actionsContainer, this._css.actions.prefix('bottom'));
	}
});
