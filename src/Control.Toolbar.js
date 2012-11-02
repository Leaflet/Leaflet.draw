L.Control.Toolbar = L.Control.extend({
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

	// buttons = { 'button name': { text, callback, context } }
	_createActions: function (buttons) {
		var container = L.DomUtil.create('ul', 'leaflet-control-toolbar-actions'),
			li;

		for (var i = 0, l = buttons.length; i < l; i++) {
			li = L.DomUtil.create('li', '', container);

			this._createButton({
				title: buttons[i].title,
				text: buttons[i].text,
				container: li,
				callback: buttons[i].callback,
				context: buttons[i].context
			});
		}

		return container;
	},

	_cancel: function () {
		// NOTE: this should be overridden by children
	},

	_showCancelButton: function () {
		this._actionsContainer.style.display = 'block';
	},

	_hideCancelButton: function () {
		this._actionsContainer.style.display = 'none';

		L.DomUtil.removeClass(this._toolbarContainer, 'leaflet-control-toolbar-actions-top');
		L.DomUtil.removeClass(this._toolbarContainer, 'leaflet-control-toolbar-actions-bottom');
	}
});