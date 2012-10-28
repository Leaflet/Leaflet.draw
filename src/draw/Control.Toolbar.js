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

	_createCancelButton: function () {
		this._createButton({
			title: 'Cancel drawing',
			text: 'Cancel',
			container: this._cancelContainer,
			callback: this._cancel,
			context: this
		});
	},

	_showCancelButton: function () {
		this._cancelContainer.style.display = 'block';
	},

	_hideCancelButton: function () {
		this._cancelContainer.style.display = 'none';

		L.DomUtil.removeClass(this._toolbarContainer, 'leaflet-control-toolbar-cancel-top');
		L.DomUtil.removeClass(this._toolbarContainer, 'leaflet-control-toolbar-cancel-bottom');
	}
});